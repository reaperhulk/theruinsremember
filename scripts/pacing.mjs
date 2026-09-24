#!/usr/bin/env node
// Simulate the eight attention personas against the engine and report pacing.
//   node scripts/pacing.mjs                          table for every persona (seeds 1,2)
//   node scripts/pacing.mjs --persona engaged        one persona
//   node scripts/pacing.mjs --horizon 720            override the horizon (hours)
//   node scripts/pacing.mjs --assert                 fail if the pacing contract breaks
//   node scripts/pacing.mjs --capture before.json    save results for a later comparison
//   node scripts/pacing.mjs --baseline before.json   print before → after for every persona
//   node scripts/pacing.mjs --json                   machine-readable results
import { readFileSync, writeFileSync } from 'node:fs';
import { PERSONAS, PERSONA_IDS } from './sim/personas.js';
import { simulate } from './sim/player.js';

const args = process.argv.slice(2);
const value = flag => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : undefined; };
const ids = (value('--persona') || PERSONA_IDS.join(',')).split(',');
const seeds = (value('--seeds') || '1,2').split(',').map(Number);
const horizon = value('--horizon') ? Number(value('--horizon')) * 3600 : undefined;

for (const id of ids) if (!PERSONAS[id]) throw new Error(`Unknown persona ${id}; choose from ${PERSONA_IDS.join(', ')}`);

const fmt = s => s === undefined || s === null ? '—' : s < 3600 ? `${Math.floor(s / 60)}m` : s < 86400 ? `${(s / 3600).toFixed(1)}h` : `${(s / 86400).toFixed(1)}d`;
const results = [];
for (const id of ids) for (const seed of seeds) results.push({ persona: id, seed, ...simulate(PERSONAS[id], { seed, ...(horizon ? { horizon } : {}) }) });

// What each persona must experience. Times are in seconds of wall-clock play.
const MIN = 60, HOUR = 3600, DAY = 86400;
const CONTRACT = {
  newcomer: r => [[r.eraTimes[2] <= 5 * MIN, 'reaches Industrialization within 5 minutes'], [r.eraTimes[3] <= 30 * MIN, 'reaches the Digital Age within 30 minutes'], [r.eraTimes[4] <= 1 * HOUR, 'reaches the Space Age within an hour']],
  engaged: r => [[r.eraTimes[2] <= 3 * MIN, 'reaches Industrialization within 3 minutes'], [r.eraTimes[4] <= 1 * HOUR, 'reaches the Space Age within an hour'], [r.cycleTimes[0] >= 2 * HOUR && r.cycleTimes[0] <= 8 * HOUR, 'first turns the cycle after 2–8 hours'], [r.eraTimes[5] <= 2 * HOUR, 'reaches the Solar System within 2 hours']],
  optimizer: r => [[r.cycleTimes[0] >= 2 * HOUR && r.cycleTimes[0] <= 7 * HOUR, 'first turns the cycle after 2–7 hours'], [r.eraTimes[6] <= 5 * HOUR, 'reaches Interstellar within 5 hours']],
  background: r => [[r.eraTimes[3] <= 45 * MIN, 'reaches the Digital Age within 45 minutes'], [r.eraTimes[5] <= 4 * HOUR, 'reaches the Solar System within 4 hours']],
  check_in: r => [[r.eraTimes[4] <= 6 * HOUR, 'reaches the Space Age within 6 hours'], [r.eraTimes[6] <= 1 * DAY, 'reaches Interstellar within a day']],
  offline_returner: r => [[r.eraTimes[3] <= 12 * HOUR, 'reaches the Digital Age within 12 hours'], [r.eraTimes[5] <= 2 * DAY, 'reaches the Solar System within 2 days']],
  completionist: r => [[r.cycleTimes[0] <= 8 * HOUR, 'turns the cycle within 8 hours'], [r.echoes >= 50, 'catches at least 50 echoes']],
  minimalist: r => [[r.eraTimes[4] <= 3 * HOUR, 'reaches the Space Age within 3 hours without clicking much'], [r.eraTimes[5] <= 8 * HOUR, 'reaches the Solar System within 8 hours']],
};
// Clicking must matter: an engaged player is well ahead of a minimalist.
const crossChecks = () => {
  const failures = [];
  for (const seed of seeds) {
    const engaged = results.find(r => r.persona === 'engaged' && r.seed === seed);
    const minimalist = results.find(r => r.persona === 'minimalist' && r.seed === seed);
    if (engaged && minimalist && !(engaged.eraTimes[4] * 2 <= minimalist.eraTimes[4])) failures.push(`seed ${seed}: engaged play reaches the Space Age less than twice as fast as minimal play`);
  }
  return failures;
};

// The five quantities every before/after comparison reports.
const summary = r => ({
  milestone: r.cycleTimes[0] ?? r.eraTimes[Math.max(...Object.keys(r.eraTimes).map(Number))],
  milestoneLabel: r.cycleTimes[0] !== undefined ? 'first cycle' : `era ${Math.max(...Object.keys(r.eraTimes).map(Number))}`,
  active: r.active,
  actions: r.actions,
  sessions: r.sessions,
  outcome: `era ${r.highestEra}, ${r.memories} memories, ${r.cycles} cycle${r.cycles === 1 ? '' : 's'}`,
});

if (args.includes('--json')) console.log(JSON.stringify(results, null, 2));
else if (!value('--baseline')) {
  console.log('persona           seed horizon  era2  era3  era4  era5  era6  era7  era8  era9 era10  1st cycle cycles  mem   clicks  buys echoes');
  for (const r of results) {
    const eras = [2, 3, 4, 5, 6, 7, 8, 9, 10].map(e => fmt(r.eraTimes[e]).padStart(5)).join(' ');
    console.log(`${r.persona.padEnd(17)} ${String(r.seed).padStart(4)} ${fmt(r.horizon).padStart(7)} ${eras} ${fmt(r.cycleTimes[0]).padStart(10)} ${String(r.cycles).padStart(6)} ${String(r.memories).padStart(4)} ${String(r.clicks).padStart(8)} ${String(r.purchases).padStart(5)} ${String(r.echoes).padStart(6)}`);
  }
}

if (value('--capture')) {
  writeFileSync(value('--capture'), JSON.stringify(results, null, 2));
  console.log(`Captured ${results.length} persona/seed results in ${value('--capture')}`);
}

if (value('--baseline')) {
  const before = JSON.parse(readFileSync(value('--baseline'), 'utf8'));
  console.log('PERSONA IMPACT: BEFORE → AFTER (identical seeds and attention schedules)');
  console.log('persona           seed  milestone before → after             active before → after  actions before → after  sessions  outcome before → after');
  for (const r of results) {
    const old = before.find(b => b.persona === r.persona && b.seed === r.seed);
    if (!old) { console.log(`${r.persona.padEnd(17)} ${String(r.seed).padStart(4)}  (no baseline)`); continue; }
    const [a, b] = [summary(old), summary(r)];
    const milestone = `${a.milestoneLabel} ${fmt(a.milestone)} → ${b.milestoneLabel} ${fmt(b.milestone)}`;
    console.log(`${r.persona.padEnd(17)} ${String(r.seed).padStart(4)}  ${milestone.padEnd(36)} ${`${fmt(a.active)} → ${fmt(b.active)}`.padEnd(22)} ${`${a.actions} → ${b.actions}`.padEnd(23)} ${`${a.sessions} → ${b.sessions}`.padEnd(9)} ${a.outcome} → ${b.outcome}`);
  }
}

if (args.includes('--assert')) {
  const failures = crossChecks();
  for (const r of results) for (const [ok, rule] of CONTRACT[r.persona](r)) if (!ok) failures.push(`${r.persona} seed ${r.seed} ${rule}`);
  if (failures.length) {
    console.error(`Pacing contract failed:\n- ${failures.join('\n- ')}`);
    process.exit(1);
  }
  console.log(`Pacing contract holds for ${results.length} persona/seed runs.`);
}
