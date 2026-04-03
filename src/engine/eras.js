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
  9: 5,    // Era 10 gate is already tech-heavy; requiring 30 late upgrades stalls casual runs
  10: 30,  // ~51% of ~59
};

export function getMinUpgradesForEra(era) {
  return ERA_MIN_UPGRADES[era] || 10;
}

// Minimum tech depth in the current era before transition is allowed.
// This replaces fixed dwell timers with build-out/readiness checks.
const ERA_MIN_TECHS = {
  1: 2,    // path tech + era gate
  2: 4,    // path techs + multiple era commitments
  3: 4,
  4: 4,
  5: 4,
  6: 3,
  7: 3,
  8: 3,
  9: 3,
  10: 0,
};

export function getMinTechsForEra(era) {
  return ERA_MIN_TECHS[era] ?? 1;
}

// Count how many upgrades the player has purchased that belong to the given era.
export function countEraUpgrades(state, era) {
  return Object.keys(state.upgrades || {}).filter(
    id => upgradeDefs[id] && upgradeDefs[id].era === era
  ).length;
}

export function countEraTechs(state, era) {
  return Object.keys(state.tech || {}).filter(
    id => techTree[id] && techTree[id].era === era
  ).length;
}

export function getEraReadiness(state, era = state.era) {
  const minUpgrades = getMinUpgradesForEra(era);
  const currentUpgrades = countEraUpgrades(state, era);
  const minTechs = getMinTechsForEra(era);
  const currentTechs = countEraTechs(state, era);

  return {
    minUpgrades,
    currentUpgrades,
    upgradesMet: currentUpgrades >= minUpgrades,
    minTechs,
    currentTechs,
    techsMet: currentTechs >= minTechs,
  };
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

  const readiness = getEraReadiness(state, state.era);
  if (!readiness.upgradesMet || !readiness.techsMet) return null;

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
