#!/usr/bin/env node
// Temporary iPhone Duo verification driver for the duo-verify workflow. Not for merge.
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const artifacts = join(root, 'e2e', 'artifacts');
const udid = process.env.DUO_UDID;
const packageId = 'reservedregions.example';
const session = 'duo-verify';
const results = [];

function run(args, { allowFailure = false } = {}) {
  const result = spawnSync('agent-device', [...args, '--platform', 'ios', '--udid', udid, '--session', session], {
    encoding: 'utf8',
    timeout: 300_000,
  });
  const out = `${result.stdout ?? ''}${result.stderr ?? ''}`;
  console.log(`$ agent-device ${args.join(' ')} -> ${result.status}\n${out.slice(0, 4000)}`);
  if (result.status !== 0 && !allowFailure) throw new Error(`agent-device ${args.join(' ')} exited ${result.status}`);
  return result.stdout ?? '';
}

function collectStrings(node, out) {
  if (Array.isArray(node)) {
    for (const item of node) collectStrings(item, out);
  } else if (node && typeof node === 'object') {
    for (const [key, value] of Object.entries(node)) {
      if (typeof value === 'string' && ['label', 'value', 'name', 'text', 'title'].includes(key)) out.add(value);
      else collectStrings(value, out);
    }
  }
  return out;
}

const number = String.raw`(-?\d+(?:\.\d+)?)`;
const providerPattern = new RegExp(String.raw`Provider: ${number} × ${number}`);
const regionPattern = new RegExp(String.raw`(division|occlusion) · x ${number} · y ${number} · ${number} × ${number}`);

async function record(step) {
  await delay(1500);
  const raw = run(['snapshot', '--json', '--force-full']);
  writeFileSync(join(artifacts, `${step}.snapshot.json`), raw);
  const texts = [...collectStrings(JSON.parse(raw), new Set())];
  const provider = texts.map((text) => providerPattern.exec(text)).find(Boolean);
  const regions = texts
    .map((text) => regionPattern.exec(text))
    .filter(Boolean)
    .map((m) => ({ kind: m[1], x: +m[2], y: +m[3], width: +m[4], height: +m[5] }));
  const entry = {
    step,
    ready: texts.includes('Measurement: Ready'),
    provider: provider ? { width: +provider[1], height: +provider[2] } : null,
    regions,
    regionText: texts.filter((text) => /Provider:|Measurement:|division|occlusion|No active/.test(text)),
  };
  results.push(entry);
  console.log(`RESULT ${JSON.stringify(entry)}`);
  run(['screenshot', join(artifacts, `${step}.png`)], { allowFailure: true });
  return entry;
}

function select(layout) {
  run(['press', `role=button label="${layout}"`, '--settle']);
}

function fold(keyframes) {
  run(['fold', '--keyframes', JSON.stringify(keyframes)]);
}

async function main() {
  mkdirSync(artifacts, { recursive: true });
  run(['open', packageId, '--relaunch', '--timeout', '240000']);
  await record('01-closed-full-screen');

  fold([
    { atMs: 0, angle: 0 },
    { atMs: 2000, angle: 130 },
  ]);
  await record('02-130-full-screen');
  select('Shift 40');
  await record('03-130-shift-40');
  select('Inset 24');
  await record('04-130-inset-24');
  select('Content box');
  await record('05-130-content-box');

  select('Inset 24');
  await record('06-130-inset-24-again');
  fold([
    { atMs: 0, angle: 130 },
    { atMs: 2000, angle: 180 },
  ]);
  await record('07-180-inset-24');
  fold([
    { atMs: 0, angle: 180 },
    { atMs: 2000, angle: 130 },
  ]);
  await record('08-130-inset-24-refolded');
  select('Full screen');
  await record('09-130-full-screen-again');
}

try {
  await main();
} catch (error) {
  console.error(`driver failed: ${error.stack}`);
  process.exitCode = 1;
} finally {
  writeFileSync(join(artifacts, 'results.json'), JSON.stringify(results, null, 2));
  run(['close'], { allowFailure: true });
}
