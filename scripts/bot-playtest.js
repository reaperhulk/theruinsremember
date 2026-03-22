#!/usr/bin/env node
// Bot playtest: simulates a full game run and reports era timings.
// Usage: node scripts/bot-playtest.js

import { createInitialState } from '../src/engine/state.js';
import { tick } from '../src/engine/tick.js';
import { purchaseUpgrade, getAvailableUpgrades, getUpgradeCost, buyMaxRepeatable } from '../src/engine/upgrades.js';
import { unlockTech, getAvailableTech } from '../src/engine/tech.js';
import { canAfford, gather } from '../src/engine/resources.js';
import { mine } from '../src/engine/mining.js';

const DT = 1; // 1 second per tick
const MAX_TICKS = 60 * 60 * 4; // 4 hours max
const TARGET_ERA = 10;

let state = createInitialState();
const eraTimings = { 1: 0 };
let lastEra = 1;
let stuckCounter = 0;
let lastUpgradeCount = 0;

for (let t = 0; t < MAX_TICKS; t++) {
  // --- Bot actions (every tick) ---

  // 1. Mine for gems (materials boost)
  const { state: afterMine } = mine(state, Math.random(), { skipCooldown: true });
  state = afterMine;

  // 2. Gather all unlocked resources (simulates clicking)
  if (t % 5 === 0) {
    for (const [id, r] of Object.entries(state.resources)) {
      if (r.unlocked) {
        state = gather(state, id, 1);
      }
    }
  }

  // 3. Buy available upgrades (prioritize non-repeatable, then repeatable)
  const available = getAvailableUpgrades(state);
  for (const upgrade of available) {
    if (upgrade.repeatable) continue;
    const cost = getUpgradeCost(state, upgrade.id);
    if (canAfford(state, cost)) {
      const result = purchaseUpgrade(state, upgrade.id);
      if (result) {
        state = result;
      }
    }
  }

  // Buy repeatable upgrades (buy max)
  for (const upgrade of available) {
    if (!upgrade.repeatable) continue;
    const result = buyMaxRepeatable(state, upgrade.id);
    if (result) {
      state = result;
    }
  }

  // 4. Buy available tech
  const techs = getAvailableTech(state);
  for (const tech of techs) {
    if (canAfford(state, tech.cost)) {
      const result = unlockTech(state, tech.id);
      if (result) {
        state = result;
      }
    }
  }

  // 5. Tick the game engine
  state = tick(state, DT);

  // Track era transitions
  if (state.era !== lastEra) {
    eraTimings[state.era] = state.totalTime;
    const prevTime = eraTimings[lastEra] || 0;
    const elapsed = state.totalTime - prevTime;
    console.log(`  Era ${lastEra} → ${state.era} at ${fmtTime(state.totalTime)} (era took ${fmtTime(elapsed)})`);
    lastEra = state.era;
    stuckCounter = 0;
  }

  // Detect stuck state (no new upgrades for 5 minutes)
  if (t % 300 === 0) {
    const currentCount = Object.keys(state.upgrades).length + Object.keys(state.tech).length;
    if (currentCount === lastUpgradeCount) {
      stuckCounter++;
      if (stuckCounter >= 3) {
        console.log(`  STUCK at era ${state.era} after ${fmtTime(state.totalTime)} — no progress for 15 min`);
        printResourceSnapshot(state);
        break;
      }
    } else {
      stuckCounter = 0;
    }
    lastUpgradeCount = currentCount;
  }

  // Done?
  if (state.era >= TARGET_ERA) {
    console.log(`  Reached era ${TARGET_ERA} at ${fmtTime(state.totalTime)}`);
    break;
  }

  // Progress update every 10 minutes of game time
  if (t > 0 && t % 600 === 0) {
    const upgCount = Object.keys(state.upgrades).length;
    const techCount = Object.keys(state.tech).length;
    process.stdout.write(`  [${fmtTime(state.totalTime)}] Era ${state.era} | ${upgCount} upgrades, ${techCount} techs\r`);
  }
}

// Final summary
console.log('\n=== Bot Playtest Results ===');
console.log(`Total time: ${fmtTime(state.totalTime)}`);
console.log(`Final era: ${state.era}`);
console.log(`Upgrades: ${Object.keys(state.upgrades).length}, Tech: ${Object.keys(state.tech).length}`);
console.log('\nEra timings:');
const eras = Object.keys(eraTimings).map(Number).sort((a, b) => a - b);
for (let i = 0; i < eras.length; i++) {
  const era = eras[i];
  const start = i > 0 ? eraTimings[eras[i - 1]] : 0;
  const duration = eraTimings[era] - start;
  console.log(`  Era ${era}: reached at ${fmtTime(eraTimings[era])}${i > 0 ? ` (took ${fmtTime(duration)})` : ' (start)'}`);
}

function fmtTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}m${s.toString().padStart(2, '0')}s`;
}

function printResourceSnapshot(state) {
  console.log('  Resources:');
  for (const [id, r] of Object.entries(state.resources)) {
    if (r.unlocked) {
      console.log(`    ${id}: ${r.amount.toFixed(1)} (rate: ${((r.baseRate + r.rateAdd) * r.rateMult).toFixed(2)}/s)`);
    }
  }
  // Show what's available but unaffordable
  const avail = getAvailableUpgrades(state);
  const unaffordable = avail.filter(u => !canAfford(state, getUpgradeCost(state, u.id)));
  if (unaffordable.length > 0) {
    console.log('  Unaffordable upgrades:');
    for (const u of unaffordable.slice(0, 5)) {
      const cost = getUpgradeCost(state, u.id);
      console.log(`    ${u.id}: ${JSON.stringify(cost)}`);
    }
  }
  const availTech = getAvailableTech(state);
  const unaffordTech = availTech.filter(t => !canAfford(state, t.cost));
  if (unaffordTech.length > 0) {
    console.log('  Unaffordable tech:');
    for (const t of unaffordTech.slice(0, 5)) {
      console.log(`    ${t.id}: ${JSON.stringify(t.cost)}`);
    }
  }
}
