import { preservesGoalReserve } from './goals.js';
import { recordBuildChoice } from './blueprints.js';
import { techTree } from '../data/tech-tree.js';
import { spend } from './resources.js';

// Unlock a tech node. Returns new state or null.
export function unlockTech(state, techId) {
  const def = techTree[techId];
  if (!def) return null;
  if (state.tech[techId]) return null; // already unlocked
  if (def.era > state.era) return null;

  // Check prerequisites
  const missing = def.prerequisites.filter(prereq => !state.tech[prereq]).length;
  if (missing > (state.prestigeUpgrades?.quantumTunneling ? 1 : 0)) return null;

  // Check mutual exclusion
  if (def.excludes && state.tech[def.excludes]) return null;

  // Tech costs are final values — no era scaling
  const cost = { ...def.cost };

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

  return recordBuildChoice(newState, 'tech', techId);
}

// Get the scaled cost for a tech node (with era multiplier applied)
// Tech costs are defined as final values — no era scaling applied
// (unlike upgrades which have base costs that get scaled by era multiplier)
export function getTechCost(def) {
  return { ...def.cost };
}

// Get available tech nodes
export function getAvailableTech(state) {
  return Object.values(techTree).filter(def => {
    if (def.era > state.era) return false;
    if (state.tech[def.id]) return false;
    if (def.excludes && state.tech[def.excludes]) return false;
    const missing = def.prerequisites.filter(prereq => !state.tech[prereq]).length;
    if (missing > (state.prestigeUpgrades?.quantumTunneling ? 1 : 0)) return false;
    return true;
  }).map(def => ({ ...def, cost: getTechCost(def) }));
}

export function isDecisionTech(def) {
  return !!def?.excludes;
}

// Labs fund linear research, including the next age’s breakthrough. The
// chapter review still controls departure; exclusive branches remain manual.
export function researchRoutineTech(state) {
  let current = state;
  let count = 0;
  for (let pass = 0; pass < 5; pass++) {
    let progressed = false;
    for (const tech of getAvailableTech(current)) {
      if (isDecisionTech(tech) || !preservesGoalReserve(current, tech.cost)) continue;
      const result = unlockTech(current, tech.id);
      if (result) {
        current = result;
        count++;
        progressed = true;
      }
    }
    if (!progressed) break;
  }
  return { state: current, count };
}
