export const eraNames = {
  1: 'Planetfall',
  2: 'Industrialization',
  3: 'Digital Age',
  4: 'Space Age',
  5: 'Solar System',
  6: 'Interstellar',
  7: 'Dyson Era',
  8: 'Galactic',
  9: 'Intergalactic',
  10: 'Multiverse',
};

export const ERA_COUNT = 10;

import { techTree } from '../data/tech-tree.js';
import { resources as resourceDefs } from '../data/resources.js';
import { upgrades as upgradeDefs } from '../data/upgrades.js';

// Minimum upgrades purchased in the current era before transition is allowed.
const ERA_MIN_UPGRADES = {
  1: 30,   // ~55% of ~55
  2: 35,   // ~63% of ~56
  3: 25,   // ~47% of ~53 — era 3 has bootstrapping delay (software/data start slow)
  4: 35,   // ~60% of ~58 — rocketFuel/orbitalInfra bootstrapping is the natural gate
  5: 42,   // ~72% of ~58
  6: 38,   // ~66% of ~58 — lower to allow non-minigame paths
  7: 40,   // ~66% of ~61
  8: 42,   // ~70% of ~60
  9: 44,   // ~72% of ~61
  10: 42,  // ~71% of ~59
};

// Minimum time (seconds) that must be spent in an era before transition.
// Scales up for later eras to ensure each era feels meaningful.
// Prestige reduces these by 10% per prestige count (min 30% of base).
const ERA_MIN_TIME = {
  1: 0,     // no minimum — era 1 is the intro
  2: 30,    // 30s
  3: 120,   // 2 min
  4: 90,    // 1.5 min
  5: 150,   // 2.5 min
  6: 210,   // 3.5 min
  7: 240,   // 4 min
  8: 300,   // 5 min
  9: 360,   // 6 min
  10: 0,    // era 10 is the final era, no gate
};

export function getMinUpgradesForEra(era) {
  return ERA_MIN_UPGRADES[era] || 10;
}

// Count how many upgrades the player has purchased that belong to the given era.
export function countEraUpgrades(state, era) {
  return Object.keys(state.upgrades || {}).filter(
    id => upgradeDefs[id] && upgradeDefs[id].era === era
  ).length;
}

// Get minimum time required in an era before transition, accounting for prestige.
export function getMinTimeForEra(era, prestigeCount = 0) {
  const base = ERA_MIN_TIME[era] || 0;
  if (base === 0) return 0;
  // Prestige reduces min time by 10% per prestige (min 30% of base)
  const reduction = Math.min(0.7, prestigeCount * 0.1);
  return Math.floor(base * (1 - reduction));
}

// Check if state qualifies for an era transition. Returns next era number or null.
export function checkEraTransition(state) {
  if (state.era >= ERA_COUNT) return null;

  // Find tech nodes that grant the next era
  const nextEra = state.era + 1;
  const gatingTech = Object.values(techTree).find(
    t => t.grantsEra === nextEra && state.tech[t.id]
  );

  if (!gatingTech) return null;

  // Require a minimum number of upgrades purchased in the current era
  const minUpgrades = getMinUpgradesForEra(state.era);
  const currentUpgrades = countEraUpgrades(state, state.era);
  if (currentUpgrades < minUpgrades) return null;

  // Require minimum time spent in the current era
  const eraStartTime = state.eraStartTime || 0;
  const timeInEra = state.totalTime - eraStartTime;
  const minTime = getMinTimeForEra(state.era, state.prestigeCount || 0);
  if (timeInEra < minTime) return null;

  return nextEra;
}

// Transition to a new era. Unlocks resources for that era.
export function transitionEra(state, newEra) {
  if (newEra <= state.era) return state;

  const newResources = { ...state.resources };

  // Unlock resources for the new era
  for (const def of Object.values(resourceDefs)) {
    if (def.era === newEra && newResources[def.id]) {
      newResources[def.id] = {
        ...newResources[def.id],
        unlocked: true,
      };
    }
  }

  // Record best era time (time to reach this era)
  const bestEraTimes = { ...(state.bestEraTimes || {}) };
  const currentTime = state.totalTime;
  if (bestEraTimes[newEra] === undefined || currentTime < bestEraTimes[newEra]) {
    bestEraTimes[newEra] = currentTime;
  }

  return { ...state, era: newEra, resources: newResources, eraStartTime: state.totalTime, bestEraTimes };
}
