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
  1: 10,  // 10 out of ~40 (25%)
  2: 12,  // 12 out of ~41 (29%)
  3: 14,  // 14 out of ~39 (36%)
  4: 16,  // 16 out of ~44 (36%)
  5: 18,  // 18 out of ~42 (43%)
  6: 18,  // 18 out of ~42 (43%)
  7: 20,  // 20 out of ~45 (44%)
  8: 20,  // 20 out of ~44 (45%)
  9: 22,  // 22 out of ~46 (48%)
  10: 25, // endgame — buy lots
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

  return { ...state, era: newEra, resources: newResources };
}
