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
  3: 20,   // ~38% of ~53 — reduced for faster flow
  4: 30,   // ~52% of ~58
  5: 30,   // ~52% of ~58 — reduced from 42 to avoid stalls
  6: 30,   // ~52% of ~58
  7: 30,   // ~49% of ~61
  8: 30,   // ~50% of ~60
  9: 30,   // ~49% of ~61
  10: 30,  // ~51% of ~59
};

// Minimum upgrades gate: requires purchasing enough era-specific upgrades before
// transitioning. This ensures players engage with each era's content.

export function getMinUpgradesForEra(era) {
  return ERA_MIN_UPGRADES[era] || 10;
}

// Count how many upgrades the player has purchased that belong to the given era.
export function countEraUpgrades(state, era) {
  return Object.keys(state.upgrades || {}).filter(
    id => upgradeDefs[id] && upgradeDefs[id].era === era
  ).length;
}

// Minimum time in era before transition allowed (seconds).
// Prevents late eras from compressing to nothing when production snowballs.
// Scales down with prestige: experienced players earn faster transitions.
const ERA_MIN_TIME = {
  1: 220, 2: 180, 3: 240, 4: 210, 5: 150, 6: 180, 7: 210, 8: 150, 9: 120, 10: 0,
};

export function getMinTimeForEra(era, prestigeCount = 0) {
  const base = ERA_MIN_TIME[era] || 0;
  if (base === 0) return 0;
  // Each prestige reduces minimum time by 15%, down to 10% of base
  const reduction = Math.pow(0.85, prestigeCount);
  return Math.max(base * 0.1, base * reduction);
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
