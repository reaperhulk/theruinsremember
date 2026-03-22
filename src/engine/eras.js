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
  3: 25,   // ~47% of ~53 — bootstrapping delay
  4: 35,   // ~60% of ~58 — rocketFuel bootstrapping gate
  5: 42,   // ~72% of ~58
  6: 40,   // ~69% of ~58
  7: 40,   // ~66% of ~61
  8: 38,   // ~63% of ~60
  9: 38,   // ~62% of ~61
  10: 35,  // ~59% of ~59
};

// Time gates removed — era pacing is now fully organic via upgrade/tech costs.
// Kept the function signature for backward compatibility but always returns 0.

export function getMinUpgradesForEra(era) {
  return ERA_MIN_UPGRADES[era] || 10;
}

// Count how many upgrades the player has purchased that belong to the given era.
export function countEraUpgrades(state, era) {
  return Object.keys(state.upgrades || {}).filter(
    id => upgradeDefs[id] && upgradeDefs[id].era === era
  ).length;
}

// Get minimum time required in an era before transition.
// Returns 0 — pacing is handled by upgrade/tech costs, not artificial time gates.
export function getMinTimeForEra(era, prestigeCount = 0) {
  return 0;
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
