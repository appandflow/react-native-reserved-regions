#!/usr/bin/env node
/**
 * Android end-to-end check for the example app. Installs the release variant, which embeds the
 * JavaScript bundle and is signed with the checked-in debug keystore, so no Metro server is needed.
 * Requires adb and agent-device on PATH and ANDROID_HOME for Gradle.
 *
 * Environment:
 *   E2E_ANDROID_SERIAL  adb serial to target; required when more than one device is attached.
 *   E2E_SKIP_BUILD=1    skip the Gradle build and install, and reuse the installed APK.
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const artifacts = join(root, 'e2e', 'artifacts');
const androidDir = join(root, 'example', 'android');
const apk = join(androidDir, 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');
const packageId = 'reservedregions.example';
const cutoutOverlay = 'com.android.internal.display.cutout.emulation.corner';
const session = 'reserved-regions-e2e';

let serial;

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: 'utf8', ...options });
  if (result.error) throw new Error(`${command} could not run: ${result.error.message}`);
  return result;
}

function check(command, args, options = {}) {
  const result = run(command, args, options);
  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(' ')} exited ${result.status}\n${result.stdout ?? ''}${result.stderr ?? ''}`,
    );
  }
  return (result.stdout ?? '').trim();
}

function deviceEnv() {
  return { ...process.env, AGENT_DEVICE_ANDROID_DEVICE_ALLOWLIST: serial };
}

const adb = (args) => check('adb', ['-s', serial, ...args]);
const device = (args) => check('agent-device', [...args, '--session', session], { env: deviceEnv() });

function resolveSerial() {
  const attached = check('adb', ['devices'])
    .split('\n')
    .slice(1)
    .map((line) => line.split('\t'))
    .filter((columns) => columns[1] === 'device')
    .map((columns) => columns[0]);
  const requested = process.env.E2E_ANDROID_SERIAL?.trim();
  if (requested) {
    if (!attached.includes(requested)) {
      throw new Error(
        `E2E_ANDROID_SERIAL=${requested} is not an attached device. Attached: ${attached.join(', ') || 'none'}`,
      );
    }
    return requested;
  }
  if (attached.length !== 1) {
    throw new Error(
      `Set E2E_ANDROID_SERIAL: ${attached.length} devices are attached (${attached.join(', ') || 'none'})`,
    );
  }
  return attached[0];
}

function buildAndInstall() {
  const abi = adb(['shell', 'getprop', 'ro.product.cpu.abi']);
  console.log(`building the release variant for ${abi}`);
  const gradle = run('./gradlew', [':app:assembleRelease', `-PreactNativeArchitectures=${abi}`, '--console=plain'], {
    cwd: androidDir,
    stdio: 'inherit',
  });
  if (gradle.status !== 0) throw new Error(`Gradle assembleRelease exited ${gradle.status}`);
  console.log(adb(['install', '-r', '-d', apk]));
}

async function configureDevice() {
  adb(['shell', 'cmd', 'device_state', 'state', '1']);
  adb(['shell', 'cmd', 'overlay', 'enable', cutoutOverlay]);
  const deadline = Date.now() + 120_000;
  for (;;) {
    const booted = run('adb', ['-s', serial, 'shell', 'getprop', 'sys.boot_completed'], { timeout: 15_000 });
    const installed = run('adb', ['-s', serial, 'shell', 'pm', 'path', packageId], { timeout: 15_000 });
    if (booted.stdout?.trim() === '1' && installed.stdout?.includes('package:')) return;
    if (Date.now() > deadline) throw new Error(`${packageId} is not launchable on ${serial}`);
    await delay(1000);
  }
}

const number = String.raw`(-?\d+(?:\.\d+)?)`;
const providerPattern = new RegExp(String.raw`^Provider: ${number} × ${number}$`);
const regionPattern = new RegExp(String.raw`^(division|occlusion) · x ${number} · y ${number} · ${number} × ${number}`);

function readScreen() {
  const snapshot = JSON.parse(device(['snapshot', '--json']));
  if (!snapshot.success) throw new Error(`agent-device snapshot failed: ${JSON.stringify(snapshot.error)}`);
  const texts = snapshot.data.nodes
    .filter((node) => node.bundleId === packageId && typeof node.value === 'string')
    .map((node) => node.value);
  const provider = texts.map((text) => providerPattern.exec(text)).find(Boolean);
  if (!provider) throw new Error(`no provider size line on screen. Visible text:\n${texts.join('\n')}`);
  const regions = texts
    .map((text) => regionPattern.exec(text))
    .filter(Boolean)
    .map((match) => ({
      kind: match[1],
      x: Number(match[2]),
      y: Number(match[3]),
      width: Number(match[4]),
      height: Number(match[5]),
    }));
  return {
    ready: texts.includes('Measurement: Ready'),
    width: Number(provider[1]),
    height: Number(provider[2]),
    divisions: regions.filter((region) => region.kind === 'division'),
    occlusions: regions.filter((region) => region.kind === 'occlusion'),
  };
}

function expect(condition, description) {
  if (!condition) throw new Error(`assertion failed: ${description}`);
  console.log(`pass: ${description}`);
}

function assertFullScreen(screen) {
  const { width, height, divisions, occlusions } = screen;
  expect(screen.ready, 'full screen: measurement is Ready');
  expect(divisions.length === 1, `full screen: exactly one division, got ${divisions.length}`);
  const [division] = divisions;
  const ratio = division.x / width;
  // The 7.6in Foldable emulator profile reports a 1 px hinge (hw.sensor.hinge.areas=884-0-1-2208).
  expect(division.width <= 1, `full screen: division width ${division.width.toFixed(1)} is at most 1 point`);
  expect(
    ratio >= 0.4 && ratio <= 0.6,
    `full screen: division x ${division.x.toFixed(1)} is ${(ratio * 100).toFixed(1)}% of provider width ${width.toFixed(1)}`,
  );
  expect(
    Math.abs(division.height - height) <= 2,
    `full screen: division height ${division.height.toFixed(1)} is within 2 points of provider height ${height.toFixed(1)}`,
  );
  expect(occlusions.length === 1, `full screen: exactly one occlusion, got ${occlusions.length}`);
  const [occlusion] = occlusions;
  expect(
    Math.abs(occlusion.x + occlusion.width - width) <= 2,
    `full screen: occlusion right edge ${(occlusion.x + occlusion.width).toFixed(1)} is within 2 points of provider width ${width.toFixed(1)}`,
  );
  expect(occlusion.y === 0, `full screen: occlusion y is 0.0, got ${occlusion.y.toFixed(1)}`);
}

function assertContentBox(screen) {
  expect(screen.ready, 'content box: measurement is Ready');
  expect(screen.divisions.length === 1, `content box: exactly one division, got ${screen.divisions.length}`);
  expect(screen.occlusions.length === 0, `content box: no occlusion, got ${screen.occlusions.length}`);
}

async function main() {
  serial = resolveSerial();
  console.log(`targeting ${serial}`);
  mkdirSync(artifacts, { recursive: true });
  if (process.env.E2E_SKIP_BUILD === '1') console.log('E2E_SKIP_BUILD=1, reusing the installed APK');
  else buildAndInstall();
  await configureDevice();
  device(['open', packageId, '--platform', 'android', '--relaunch']);
  const fullScreen = readScreen();
  console.log(device(['screenshot', join(artifacts, 'full-screen.png')]));
  assertFullScreen(fullScreen);
  device(['press', 'role=button label="Content box"', '--settle']);
  const contentBox = readScreen();
  console.log(device(['screenshot', join(artifacts, 'content-box.png')]));
  assertContentBox(contentBox);
}

try {
  await main();
  console.log('android end-to-end check passed');
} catch (error) {
  console.error(`\nandroid end-to-end check failed: ${error.message}`);
  if (serial) {
    const dump = run('agent-device', ['snapshot', '--force-full', '--session', session], { env: deviceEnv() });
    console.error(`\naccessibility snapshot:\n${dump.stdout ?? ''}${dump.stderr ?? ''}`);
  }
  process.exitCode = 1;
} finally {
  if (serial) {
    const closed = run('agent-device', ['close', '--session', session], { env: deviceEnv() });
    if (closed.status !== 0) {
      console.error(`\nagent-device close failed:\n${closed.stdout ?? ''}${closed.stderr ?? ''}`);
      process.exitCode = 1;
    }
    run('adb', ['-s', serial, 'shell', 'am', 'force-stop', packageId]);
  }
}
