#!/usr/bin/env node
/**
 * iOS end-to-end check for the example app on an iPhone Duo simulator. Builds the Release
 * configuration, which embeds the JavaScript bundle, so no Metro server is needed. Requires Xcode
 * 27.1 or newer with an iOS 27.1 or newer simulator runtime, CocoaPods installed in example/ios,
 * and agent-device 0.21.12 or newer on PATH for the fold command.
 *
 * Environment:
 *   DEVELOPER_DIR     Xcode to use when the selected Xcode is older than 27.1.
 *   E2E_IOS_UDID      iPhone Duo simulator to target. Without it the check reuses or creates a
 *                     simulator named "Reserved Regions E2E".
 *   E2E_SKIP_BUILD=1  skip the Xcode build and install, and reuse the installed app.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const artifacts = join(root, 'e2e', 'artifacts');
const exampleDir = join(root, 'example');
const workspace = join(exampleDir, 'ios', 'ReservedRegionsExample.xcworkspace');
const derivedData = join(exampleDir, 'build');
const app = join(derivedData, 'Build', 'Products', 'Release-iphonesimulator', 'ReservedRegionsExample.app');
const packageId = 'reservedregions.example';
const simulatorName = 'Reserved Regions E2E';
const session = 'reserved-regions-e2e';

let udid;

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

const simctl = (args, options) => check('xcrun', ['simctl', ...args], options);
const deviceArgs = () => ['--platform', 'ios', '--udid', udid, '--session', session];
const device = (args, timeout = 120_000) => check('agent-device', [...args, ...deviceArgs()], { timeout });

function compareVersions(left, right) {
  const a = left.split('.').map(Number);
  const b = right.split('.').map(Number);
  for (let index = 0; index < Math.max(a.length, b.length); index++) {
    const difference = (a[index] ?? 0) - (b[index] ?? 0);
    if (difference !== 0) return difference;
  }
  return 0;
}

function checkToolchain() {
  const developerDir = process.env.DEVELOPER_DIR || check('xcode-select', ['-p']);
  const xcode = /^Xcode (\d+(?:\.\d+)*)/.exec(check('xcodebuild', ['-version']))?.[1];
  if (!xcode || compareVersions(xcode, '27.1') < 0) {
    throw new Error(
      `Xcode 27.1 or newer is required for the iPhone Duo simulator, but ${developerDir} is Xcode ${xcode ?? 'unknown'}. ` +
        'Install Xcode 27.1 beta from https://developer.apple.com/download/applications/ and set DEVELOPER_DIR ' +
        'to its Contents/Developer directory.',
    );
  }
  const duo = JSON.parse(simctl(['list', 'devicetypes', '-j'])).devicetypes.find((type) => type.name === 'iPhone Duo');
  if (!duo) throw new Error(`Xcode ${xcode} at ${developerDir} has no iPhone Duo simulator device type.`);
  const runtimes = JSON.parse(simctl(['list', 'runtimes', '-j']))
    .runtimes.filter(
      (runtime) =>
        runtime.platform === 'iOS' &&
        runtime.isAvailable &&
        compareVersions(runtime.version, '27.1') >= 0 &&
        runtime.supportedDeviceTypes.some((type) => type.identifier === duo.identifier),
    )
    .toSorted((left, right) => compareVersions(left.version, right.version));
  if (runtimes.length === 0) {
    throw new Error(
      `No installed iOS 27.1 or newer simulator runtime supports the iPhone Duo. Download it with ` +
        `DEVELOPER_DIR=${developerDir} xcodebuild -downloadPlatform iOS`,
    );
  }
  const agentDevice = check('agent-device', ['--version']);
  if (compareVersions(agentDevice, '0.21.12') < 0) {
    throw new Error(
      `agent-device 0.21.12 or newer is required for the fold command, found ${agentDevice}. ` +
        'Install it with npm install --global agent-device',
    );
  }
  console.log(`using Xcode ${xcode} at ${developerDir} and agent-device ${agentDevice}`);
  return { duo, runtimes };
}

function resolveSimulator({ duo, runtimes }) {
  const supported = new Set(runtimes.map((runtime) => runtime.identifier));
  const simulators = Object.entries(JSON.parse(simctl(['list', 'devices', '-j'])).devices).flatMap(
    ([runtime, devices]) => devices.map((simulator) => ({ ...simulator, runtime })),
  );
  const requested = process.env.E2E_IOS_UDID?.trim();
  if (requested) {
    const simulator = simulators.find((candidate) => candidate.udid === requested);
    if (!simulator) throw new Error(`E2E_IOS_UDID=${requested} is not a simulator of the selected Xcode`);
    if (simulator.deviceTypeIdentifier !== duo.identifier || !supported.has(simulator.runtime)) {
      throw new Error(
        `E2E_IOS_UDID=${requested} is ${simulator.name} on ${simulator.runtime}; an iPhone Duo on iOS 27.1 or newer is required`,
      );
    }
    return requested;
  }
  const owned = simulators.find(
    (candidate) =>
      candidate.name === simulatorName &&
      candidate.isAvailable &&
      candidate.deviceTypeIdentifier === duo.identifier &&
      supported.has(candidate.runtime),
  );
  if (owned) return owned.udid;
  const runtime = runtimes.at(-1);
  console.log(`creating an iPhone Duo simulator named "${simulatorName}" on iOS ${runtime.version}`);
  return simctl(['create', simulatorName, duo.identifier, runtime.identifier]);
}

function buildAndInstall() {
  if (!existsSync(workspace)) {
    throw new Error(`${workspace} is missing. Run bundle exec pod install --project-directory=ios in example/ first.`);
  }
  console.log('building the Release configuration');
  const build = run(
    'xcodebuild',
    [
      '-workspace',
      workspace,
      '-scheme',
      'ReservedRegionsExample',
      '-configuration',
      'Release',
      '-destination',
      `id=${udid}`,
      '-derivedDataPath',
      derivedData,
      '-quiet',
      'CODE_SIGNING_ALLOWED=NO',
      'ONLY_ACTIVE_ARCH=YES',
      'build',
    ],
    { cwd: exampleDir, stdio: 'inherit' },
  );
  if (build.status !== 0) throw new Error(`xcodebuild exited ${build.status}`);
  simctl(['install', udid, app]);
}

const number = String.raw`(-?\d+(?:\.\d+)?)`;
const providerPattern = new RegExp(String.raw`^Provider: ${number} × ${number}$`);
const regionPattern = new RegExp(String.raw`^(division|occlusion) · x ${number} · y ${number} · ${number} × ${number}`);

function readScreen() {
  const snapshot = JSON.parse(device(['snapshot', '--json', '--force-full']));
  if (!snapshot.success) throw new Error(`agent-device snapshot failed: ${JSON.stringify(snapshot.error)}`);
  const texts = snapshot.data.nodes.map((node) => node.label).filter((label) => typeof label === 'string');
  const provider = texts.map((text) => providerPattern.exec(text)).find(Boolean);
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
    texts,
    ready: texts.includes('Measurement: Ready'),
    width: provider ? Number(provider[1]) : undefined,
    height: provider ? Number(provider[2]) : undefined,
    divisions: regions.filter((region) => region.kind === 'division'),
    occlusions: regions.filter((region) => region.kind === 'occlusion'),
  };
}

// UIHingeInteraction updates arrive over the whole fold animation, and each can dispatch an intermediate payload.
async function settledScreen(name) {
  const deadline = Date.now() + 30_000;
  let previous;
  for (;;) {
    const screen = readScreen();
    const { texts, ...values } = screen;
    const current = JSON.stringify(values);
    if (screen.width !== undefined && current === previous) {
      console.log(
        `${name}: ${texts.filter((text) => /^(Provider|Measurement|division|occlusion|No active)/.test(text)).join(' | ')}`,
      );
      console.log(device(['screenshot', join(artifacts, `${name}.png`)]));
      return screen;
    }
    if (Date.now() > deadline) {
      throw new Error(`${name}: the screen did not settle within 30 s. Visible text:\n${texts.join('\n')}`);
    }
    previous = current;
    await delay(1000);
  }
}

function fold(from, to) {
  device([
    'fold',
    '--keyframes',
    JSON.stringify([
      { atMs: 0, angle: from },
      { atMs: 2000, angle: to },
    ]),
  ]);
}

function expect(condition, description) {
  if (!condition) throw new Error(`assertion failed: ${description}`);
  console.log(`pass: ${description}`);
}

const format = (value) => value.toFixed(1);

function assertFullScreen(screen) {
  const { width, height, divisions, occlusions } = screen;
  expect(screen.ready, 'full screen: measurement is Ready');
  expect(divisions.length === 1, `full screen: exactly one division, got ${divisions.length}`);
  const [division] = divisions;
  const center = (division.x + division.width / 2) / width;
  expect(
    center >= 0.45 && center <= 0.55,
    `full screen: division center ${format(division.x + division.width / 2)} is ${(center * 100).toFixed(1)}% of provider width ${format(width)}`,
  );
  expect(Math.abs(division.y) <= 1, `full screen: division y ${format(division.y)} is within 1 point of 0`);
  expect(
    Math.abs(division.height - height) <= 2,
    `full screen: division height ${format(division.height)} is within 2 points of provider height ${format(height)}`,
  );
  expect(occlusions.length === 1, `full screen: exactly one occlusion, got ${occlusions.length}`);
  const [occlusion] = occlusions;
  expect(
    Math.abs(occlusion.x + occlusion.width - width) <= 2,
    `full screen: occlusion right edge ${format(occlusion.x + occlusion.width)} is within 2 points of provider width ${format(width)}`,
  );
  expect(Math.abs(occlusion.y) <= 1, `full screen: occlusion y ${format(occlusion.y)} is within 1 point of 0`);
}

function assertShifted(screen, fullScreen) {
  expect(screen.ready, 'shift 40: measurement is Ready');
  expect(
    screen.width === fullScreen.width && screen.height === fullScreen.height,
    `shift 40: provider ${format(screen.width)} × ${format(screen.height)} matches full screen`,
  );
  expect(screen.divisions.length === 1, `shift 40: exactly one division, got ${screen.divisions.length}`);
  const expected = fullScreen.divisions[0].x - 40;
  expect(
    Math.abs(screen.divisions[0].x - expected) <= 1,
    `shift 40: division x ${format(screen.divisions[0].x)} is within 1 point of ${format(expected)}`,
  );
}

function assertContentBox(screen) {
  expect(screen.ready, 'content box: measurement is Ready');
  expect(screen.divisions.length === 1, `content box: exactly one division, got ${screen.divisions.length}`);
  const [division] = screen.divisions;
  expect(division.y < 0, `content box: division y ${format(division.y)} is above the provider`);
  expect(
    division.height > screen.height,
    `content box: division height ${format(division.height)} exceeds provider height ${format(screen.height)}`,
  );
  expect(screen.occlusions.length === 0, `content box: no occlusion, got ${screen.occlusions.length}`);
}

function assertFlat(screen, folded) {
  expect(screen.ready, '180°: measurement is Ready');
  expect(
    screen.width === folded.width && screen.height === folded.height,
    `180°: provider ${format(screen.width)} × ${format(screen.height)} is unchanged`,
  );
  expect(screen.divisions.length === 0, `180°: no division, got ${screen.divisions.length}`);
}

function assertRefolded(screen, folded) {
  expect(screen.ready, 'back to 130°: measurement is Ready');
  expect(
    screen.width === folded.width && screen.height === folded.height,
    `back to 130°: provider ${format(screen.width)} × ${format(screen.height)} is unchanged`,
  );
  expect(screen.divisions.length === 1, `back to 130°: exactly one division, got ${screen.divisions.length}`);
  const [division] = screen.divisions;
  const [before] = folded.divisions;
  expect(
    ['x', 'y', 'width', 'height'].every((key) => Math.abs(division[key] - before[key]) <= 1),
    `back to 130°: division (${format(division.x)}, ${format(division.y)}, ${format(division.width)}, ${format(division.height)}) matches the one before 180°`,
  );
}

async function main() {
  const toolchain = checkToolchain();
  udid = resolveSimulator(toolchain);
  console.log(`targeting ${udid}`);
  simctl(['bootstatus', udid, '-b'], { timeout: 600_000 });
  mkdirSync(artifacts, { recursive: true });
  if (process.env.E2E_SKIP_BUILD === '1') console.log('E2E_SKIP_BUILD=1, reusing the installed app');
  else buildAndInstall();
  check('agent-device', ['prepare', 'ios-runner', '--platform', 'ios', '--udid', udid, '--timeout', '900000'], {
    timeout: 960_000,
  });
  device(['open', packageId, '--relaunch', '--timeout', '240000'], 300_000);

  fold(0, 130);
  const fullScreen = await settledScreen('01-full-screen-130');
  assertFullScreen(fullScreen);

  device(['press', 'role=button label="Shift 40"', '--settle']);
  assertShifted(await settledScreen('02-shift-40-130'), fullScreen);

  device(['press', 'role=button label="Content box"', '--settle']);
  assertContentBox(await settledScreen('03-content-box-130'));

  device(['press', 'role=button label="Inset 24"', '--settle']);
  const folded = await settledScreen('04-inset-24-130');
  expect(folded.divisions.length === 1, `inset 24: exactly one division, got ${folded.divisions.length}`);
  fold(130, 180);
  assertFlat(await settledScreen('05-inset-24-180'), folded);
  fold(180, 130);
  assertRefolded(await settledScreen('06-inset-24-back-to-130'), folded);
}

try {
  await main();
  console.log('ios end-to-end check passed');
} catch (error) {
  console.error(`\nios end-to-end check failed: ${error.message}`);
  if (udid) {
    const dump = run('agent-device', ['snapshot', '--force-full', ...deviceArgs()], { timeout: 120_000 });
    console.error(`\naccessibility snapshot:\n${dump.stdout ?? ''}${dump.stderr ?? ''}`);
  }
  process.exitCode = 1;
} finally {
  if (udid) {
    const closed = run('agent-device', ['close', ...deviceArgs()], { timeout: 120_000 });
    if (closed.status !== 0) {
      console.error(`\nagent-device close failed:\n${closed.stdout ?? ''}${closed.stderr ?? ''}`);
      process.exitCode = 1;
    }
    run('xcrun', ['simctl', 'terminate', udid, packageId]);
  }
}
