import { techTree } from '../data/tech-tree.js';
import { spend } from './resources.js';
import { applyEraCostScaling } from './upgrades.js';

// Unlock a tech node. Returns new state or null.
export function unlockTech(state, techId) {
  const def = techTree[techId];
  if (!def) return null;
  if (state.tech[techId]) return null; // already unlocked
  if (def.era > state.era) return null;

  // Check prerequisites
  for (const prereq of def.prerequisites) {
    if (!state.tech[prereq]) return null;
  }

  // Check mutual exclusion
  if (def.excludes && state.tech[def.excludes]) return null;

  // Apply era-based cost multiplier (only for earlier-era resources)
  const cost = applyEraCostScaling(def.cost, def.era);

  const afterSpend = spend(state, cost);
  if (!afterSpend) return null;

  let newState = {
    ...afterSpend,
    tech: { ...afterSpend.tech, [techId]: true },
  };

  // Apply tech effects if any
  if (def.effects && def.effects.length > 0) {
    const newResources = { ...newState.resources };
    for (const effect of def.effects) {
      const target = newResources[effect.target];
      if (!target) continue;
      switch (effect.type) {
        case 'production_mult':
          newResources[effect.target] = { ...target, rateMult: target.rateMult * effect.value };
          break;
        case 'production_add':
          newResources[effect.target] = { ...target, rateAdd: target.rateAdd + effect.value };
          break;
        case 'cap_mult':
          newResources[effect.target] = { ...target, capMult: target.capMult * effect.value };
          break;
        case 'unlock_resource':
          newResources[effect.target] = { ...target, unlocked: true };
          break;
      }
    }
    newState = { ...newState, resources: newResources };
  }

  return newState;
}

// Get the scaled cost for a tech node (with era multiplier applied)
export function getTechCost(def) {
  return applyEraCostScaling(def.cost, def.era);
}

// Get available tech nodes
export function getAvailableTech(state) {
  return Object.values(techTree).filter(def => {
    if (def.era > state.era) return false;
    if (state.tech[def.id]) return false;
    if (def.excludes && state.tech[def.excludes]) return false;
    for (const prereq of def.prerequisites) {
      if (!state.tech[prereq]) return false;
    }
    return true;
  }).map(def => ({ ...def, cost: getTechCost(def) }));
}
