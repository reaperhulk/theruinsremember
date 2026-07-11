#!/usr/bin/env node
// Hearthlight bot playtest: deterministic profiles play rounds and the
// assertions guard the loop's promises — snappy round 1, defense matters,
// meta lengthens runs. Usage:
//   node hearthlight/scripts/bot-playtest.js [--seed N] [--assert]
import { createInitialState } from '../src/engine/state.js';
import { beginRound, collectEmbers, placeStructure, getEmbersEarned } from '../src/engine/round.js';
import { STRUCTURES } from '../src/engine/structures.js';
import { getAdjacentSlots } from '../src/engine/map.js';
import { endDay, tick } from '../src/engine/tick.js';
import { moveWarden, getWardenCooldown } from '../src/engine/night.js';
import { buyMetaUpgrade, META_UPGRADES } from '../src/engine/meta.js';

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const META_ORDER = ['stoneFoundations', 'swiftWarden', 'morningStockpile', 'deeperDrafts', 'secondWarden', 'outerRing'];

// ── Profiles ────────────────────────────────────────────────────────────────
// passive: never touches anything. builder: places by day, sleeps at night.
// keeper: builds and walks the night.

function pickPlacement(state) {
  const round = state.round;
  const structures = round.slots.filter(slot => slot.structure);
  const defenses = structures.filter(slot => STRUCTURES[slot.structure.type].defensive).length;
  const wantDefense = defenses < Math.ceil((structures.length + 1) / 3);

  const affordable = round.draft.filter(id => STRUCTURES[id].cost <= round.glow);
  if (affordable.length === 0) return null;
  const byPreference = wantDefense
    ? ['watchtower', 'palisade', 'lantern', 'farm', 'well', 'shrine']
    : ['farm', 'well', 'shrine', 'watchtower', 'lantern', 'palisade'];
  const choice = byPreference.find(id => affordable.includes(id)) || affordable[0];

  const empty = round.slots.filter(slot => !slot.structure);
  if (empty.length === 0) return null;
  let slot = empty[0];
  if (choice === 'watchtower' || choice === 'lantern') {
    slot = empty.reduce((best, candidate) => {
      const covers = getAdjacentSlots(round.slots, candidate.id).filter(neighbor => neighbor.structure).length;
      const bestCovers = getAdjacentSlots(round.slots, best.id).filter(neighbor => neighbor.structure).length;
      return covers > bestCovers ? candidate : best;
    }, empty[0]);
  }
  if (choice === 'well') {
    slot = empty.find(candidate =>
      getAdjacentSlots(round.slots, candidate.id).some(neighbor => neighbor.structure?.type === 'farm')) || empty[0];
  }
  return { structureId: choice, slotId: slot.id };
}

function botDay(state, profile, rng) {
  if (profile === 'passive') return state;
  const round = state.round;
  if (!round.placedToday) {
    const placement = pickPlacement(state);
    if (placement) {
      const placed = placeStructure(state, placement.structureId, placement.slotId);
      if (placed) state = placed;
    }
  }
  // Harvest a little, then call the dusk
  if (state.round.placedToday && state.round.time - state.round.phaseStart >= 8) {
    state = endDay(state, rng);
  }
  return state;
}

function botNight(state, profile) {
  if (profile !== 'keeper') return state;
  const round = state.round;
  const guarded = new Set(round.wardens.map(warden => warden.slotId).filter(Boolean));
  const threats = round.shades
    .filter(shade => shade.targetSlotId && shade.phase !== 'held' && !guarded.has(shade.targetSlotId))
    .sort((a, b) => (a.arrivesAt ?? 0) - (b.arrivesAt ?? 0));
  if (threats.length === 0) return state;
  const busy = new Set(round.shades.map(shade => shade.targetSlotId));
  const free = round.wardens.find(warden =>
    round.time - warden.movedAt >= getWardenCooldown(state) &&
    (!warden.slotId || !busy.has(warden.slotId)));
  if (!free) return state;
  const moved = moveWarden(state, free.id, threats[0].targetSlotId);
  return moved || state;
}

function playRound(state, profile, rng, maxSeconds = 1200) {
  state = beginRound(state, rng);
  let seconds = 0;
  while (state.round && state.round.phase !== 'fallen' && seconds < maxSeconds) {
    if (state.round.phase === 'day') state = botDay(state, profile, rng);
    else state = botNight(state, profile);
    state = tick(state, 1, rng);
    seconds++;
  }
  const nights = state.round ? state.round.day - 1 : 0;
  const embers = state.round ? getEmbersEarned(state.round) : 0;
  const fell = state.round?.phase === 'fallen';
  state = fell ? collectEmbers(state) : state;
  return { state, nights, embers, seconds, fell };
}

function spendEmbers(state) {
  let current = state;
  for (const id of META_ORDER) {
    const bought = buyMetaUpgrade(current, id);
    if (bought) current = bought;
  }
  return current;
}

// ── Scenarios ───────────────────────────────────────────────────────────────
const seedArg = process.argv.indexOf('--seed');
const seed = seedArg >= 0 ? Number(process.argv[seedArg + 1]) : 424242;
const assertMode = process.argv.includes('--assert');

console.log(`Hearthlight playtest | seed ${seed}\n`);
const results = {};

for (const profile of ['passive', 'builder', 'keeper']) {
  const rng = mulberry32(seed);
  const outcome = playRound(createInitialState(), profile, rng);
  results[profile] = outcome;
  console.log(`  round 1 ${profile.padEnd(8)} nights ${String(outcome.nights).padStart(2)} | embers ${String(outcome.embers).padStart(2)} | ${outcome.seconds}s | ${outcome.fell ? 'fell' : 'SURVIVED CAP'}`);
}

// The meta arc: a keeper plays five rounds, spending Embers between them.
{
  const rng = mulberry32(seed);
  let state = createInitialState();
  const arc = [];
  for (let roundIndex = 0; roundIndex < 5; roundIndex++) {
    const outcome = playRound(state, 'keeper', rng);
    state = spendEmbers(outcome.state);
    arc.push(outcome);
  }
  results.arc = arc;
  console.log(`\n  keeper meta arc: nights ${arc.map(r => r.nights).join(' → ')} | embers banked ${state.embers} | meta owned ${Object.keys(state.meta).length}/${Object.keys(META_UPGRADES).length}`);
  console.log(`  round lengths:   ${arc.map(r => `${r.seconds}s`).join(' → ')}`);
}

// Determinism: identical seeds, identical rounds.
{
  const play = () => {
    const rng = mulberry32(seed);
    return playRound(createInitialState(), 'keeper', rng);
  };
  const a = play();
  const b = play();
  results.deterministic = a.nights === b.nights && a.embers === b.embers && a.seconds === b.seconds;
  console.log(`\n  determinism: ${results.deterministic ? 'OK' : 'BROKEN'}`);
}

if (assertMode) {
  const arc = results.arc;
  const issues = [];
  if (!results.deterministic) issues.push('same seed produced different rounds');
  if (!results.passive.fell) issues.push('a do-nothing round never ends');
  if (results.passive.seconds > 400) issues.push(`passive round dragged ${results.passive.seconds}s`);
  if (results.keeper.seconds > 420) issues.push(`round 1 keeper took ${results.keeper.seconds}s — first round must be snappy`);
  if (results.keeper.nights < 2) issues.push('a played first round dies before night 2');
  if (results.keeper.nights < results.passive.nights) issues.push('playing is worse than doing nothing');
  if (results.keeper.embers < 3) issues.push('first round pays too little to buy anything');
  const first = arc[0].nights;
  const last = arc[arc.length - 1].nights;
  if (last <= first) issues.push(`meta does not lengthen runs (${first} → ${last})`);
  if (arc[arc.length - 1].seconds <= arc[0].seconds) issues.push('later rounds are not longer in real time');

  console.log('\n── Assertions ──');
  if (issues.length > 0) {
    for (const issue of issues) console.log(`  ✗ ${issue}`);
    process.exit(1);
  }
  console.log('  ✓ all loop promises hold');
}
