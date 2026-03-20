// Colony Management mini-game for Era 5
// Assign colonies to different focus areas for varied outputs.
// Focus types: 'growth' (food+labor), 'science' (research+data), 'industry' (exoticMaterials+energy)

const FOCUS_TYPES = ['growth', 'science', 'industry'];

const FOCUS_BONUSES = {
  growth: { food: 2, labor: 0.5 },
  science: { research: 1.5, data: 0.8 },
  industry: { exoticMaterials: 0.3, energy: 5 },
};

// Get max assignable colonies (based on colonies resource amount)
export function getAssignableColonies(state) {
  const colonies = state.resources.colonies;
  if (!colonies || !colonies.unlocked) return 0;
  return Math.floor(colonies.amount);
}

// Get current colony assignments
export function getColonyAssignments(state) {
  return state.colonyAssignments || { growth: 0, science: 0, industry: 0 };
}

// Get total assigned
export function getTotalColoniesAssigned(state) {
  const assignments = getColonyAssignments(state);
  return FOCUS_TYPES.reduce((sum, f) => sum + (assignments[f] || 0), 0);
}

// Assign colonies to a focus. Returns new state or null if invalid.
export function assignColonies(state, focus, count) {
  if (!FOCUS_TYPES.includes(focus)) return null;
  if (count < 0) return null;

  const maxAssignable = getAssignableColonies(state);
  const assignments = { ...getColonyAssignments(state) };
  const otherTotal = FOCUS_TYPES.reduce(
    (sum, f) => sum + (f === focus ? 0 : (assignments[f] || 0)),
    0
  );

  if (otherTotal + count > maxAssignable) return null;

  assignments[focus] = count;

  return {
    ...state,
    colonyAssignments: assignments,
  };
}

// Calculate production bonuses from colony assignments.
// Each assigned colony gives the focus bonus per second.
// Specialization bonus: if all colonies are on one focus, x2 output.
// Diversification bonus: if all 3 focuses have colonies, +25% to all.
export function getColonyBonus(state) {
  if (state.era < 5) return {};
  const assignments = getColonyAssignments(state);
  const totalAssigned = FOCUS_TYPES.reduce((sum, f) => sum + (assignments[f] || 0), 0);
  if (totalAssigned === 0) return {};

  const activeFocuses = FOCUS_TYPES.filter(f => (assignments[f] || 0) > 0);
  const isSpecialized = activeFocuses.length === 1 && totalAssigned >= 3;
  const isDiversified = activeFocuses.length === 3;
  const focusMult = isSpecialized ? 2 : (isDiversified ? 1.25 : 1);

  // Era scaling: colony bonuses increase with era
  const eraScale = 1 + (state.era - 5) * 0.3; // x1 at era 5, x2.5 at era 10

  const bonus = {};
  for (const focus of FOCUS_TYPES) {
    const count = assignments[focus] || 0;
    if (count > 0) {
      const focusBonus = FOCUS_BONUSES[focus];
      for (const [resource, rate] of Object.entries(focusBonus)) {
        bonus[resource] = (bonus[resource] || 0) + count * rate * focusMult * eraScale;
      }
    }
  }

  return bonus;
}

// Get colony strategy info for display
export function getColonyStrategy(state) {
  const assignments = getColonyAssignments(state);
  const totalAssigned = FOCUS_TYPES.reduce((sum, f) => sum + (assignments[f] || 0), 0);
  const activeFocuses = FOCUS_TYPES.filter(f => (assignments[f] || 0) > 0);
  if (totalAssigned < 1) return { type: 'none', mult: 1 };
  if (activeFocuses.length === 1 && totalAssigned >= 3) return { type: 'specialized', mult: 2 };
  if (activeFocuses.length === 3) return { type: 'diversified', mult: 1.25 };
  return { type: 'mixed', mult: 1 };
}
