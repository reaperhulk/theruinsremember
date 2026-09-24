#!/usr/bin/env node
// Simulate the eight personas and report pacing.
//   node scripts/pacing.mjs                      table for all personas
//   node scripts/pacing.mjs --persona engaged    one persona
//   node scripts/pacing.mjs --json               machine-readable results
import { PERSONAS, PERSONA_IDS } from './sim/personas.js';
import { simulate } from './sim/player.js';

const args = process.argv.slice(2);
const value = flag => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : undefined; };
const ids = (value('--persona') || PERSONA_IDS.join(',')).split(',');
const seeds = (value('--seeds') || '1').split(',').map(Number);

const fmt = s => s === undefined ? '—' : s < 3600 ? `${Math.floor(s / 60)}m` : s < 86400 ? `${(s / 3600).toFixed(1)}h` : `${(s / 86400).toFixed(1)}d`;
const results = [];
const horizon = value('--horizon') ? Number(value('--horizon')) * 3600 : undefined;
for (const id of ids) for (const seed of seeds) results.push({ persona: id, seed, ...simulate(PERSONAS[id], { seed, ...(horizon ? { horizon } : {}) }) });
if (args.includes('--json')) console.log(JSON.stringify(results, null, 2));
else {
  console.log('persona           seed horizon  era2  era3  era4  era5  era6  era7  era8  era9 era10  1st cycle cycles mem  clicks buys echoes wait');
  for (const r of results) {
    const eras = [2, 3, 4, 5, 6, 7, 8, 9, 10].map(e => fmt(r.eraTimes[e]).padStart(5)).join(' ');
    console.log(`${r.persona.padEnd(17)} ${String(r.seed).padStart(4)} ${fmt(r.horizon).padStart(7)} ${eras} ${fmt(r.cycleTimes[0]).padStart(10)} ${String(r.cycles).padStart(6)} ${String(r.memories).padStart(4)} ${String(r.clicks).padStart(7)} ${String(r.purchases).padStart(4)} ${String(r.echoes).padStart(6)} ${fmt(r.longestWait).padStart(4)}`);
  }
}
