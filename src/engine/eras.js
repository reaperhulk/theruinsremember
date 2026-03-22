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
// ~40% of available upgrades per era must be bought. This forces real engagement.
const ERA_MIN_UPGRADES = {
  1: 30,   // ~58% of ~52
  2: 35,   // ~66% of ~53
  3: 35,   // ~69% of ~51
  4: 38,   // ~68% of ~56
  5: 38,   // ~68% of ~56
  6: 38,   // ~67% of ~57
  7: 40,   // ~67% of ~60
  8: 40,   // ~69% of ~58
  9: 42,   // ~71% of ~59
  10: 42,  // ~74% of ~57
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

// Check if state qualifies for an era transition. Returns next era number or null.
export function checkEraTransition(state) {
  if (state.era >= ERA_COUNT) return null;

  // Find tech nodes that grant the next era
  const nextEra = state.era + 1;
  const gatingTech = Object.values(techTree).find(
    t => t.grantsEra === nextEra && state.tech[t.id]
  );

  if (!gatingTech) return null;

  // Require mini-game engagement for era advancement (soft gate)
  const miniGameActive = (state.totalGems || 0) > 0 || // mining
    Object.values(state.factoryAllocation || {}).some(v => v > 0) || // factory
    (state.hackSuccesses || 0) > 0 || // hacking
    (state.dockingAttempts || 0) > 0 || // docking
    Object.values(state.colonyAssignments || {}).some(v => v > 0); // colony
  if (!miniGameActive && state.era >= 2) return null; // Can't advance without using at least 1 mini-game

  // Require a minimum number of upgrades purchased in the current era
  const minUpgrades = getMinUpgradesForEra(state.era);
  const currentUpgrades = countEraUpgrades(state, state.era);
  if (currentUpgrades < minUpgrades) return null;

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
