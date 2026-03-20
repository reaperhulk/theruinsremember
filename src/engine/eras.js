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

// Check if state qualifies for an era transition. Returns next era number or null.
export function checkEraTransition(state) {
  if (state.era >= ERA_COUNT) return null;

  // Find tech nodes that grant the next era
  const nextEra = state.era + 1;
  const gatingTech = Object.values(techTree).find(
    t => t.grantsEra === nextEra && state.tech[t.id]
  );

  return gatingTech ? nextEra : null;
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
