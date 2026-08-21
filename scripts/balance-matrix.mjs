#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

const DEFAULT_SEEDS = [424242, 1, 42, 1337];
const DEFAULT_SCENARIOS = 'full,casual,lowInteraction,passive,descent,prestige3';

const seedsArgumentIndex = process.argv.indexOf('--seeds');
const scenarioArgumentIndex = process.argv.indexOf('--scenario');
const seeds = seedsArgumentIndex < 0
  ? DEFAULT_SEEDS
  : process.argv[seedsArgumentIndex + 1]?.split(',').map(Number);
const scenarios = scenarioArgumentIndex < 0
  ? DEFAULT_SCENARIOS
  : process.argv[scenarioArgumentIndex + 1];

if (!seeds?.length || seeds.some(seed => !Number.isSafeInteger(seed)) || !scenarios) {
  console.error('Usage: node scripts/balance-matrix.mjs [--seeds 424242,1,42,1337] [--scenario full,casual,...]');
  process.exit(2);
}

let failures = 0;
for (const seed of seeds) {
  console.log(`\nSeed ${seed}: ${scenarios}`);
  const result = spawnSync(process.execPath, [
    'scripts/bot-playtest.js',
    '--scenario', scenarios,
    '--seed', String(seed),
    '--quiet',
    '--assert-balance',
  ], { cwd: process.cwd(), stdio: 'inherit' });
  if (result.error || result.status !== 0) failures++;
}

if (failures > 0) {
  console.error(`\n${failures}/${seeds.length} seeded balance runs failed.`);
  process.exit(1);
}

console.log(`\nAll ${seeds.length} seeded balance runs passed.`);
