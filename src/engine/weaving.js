// Reality Weaving mini-game for Eras 8-10
// Combine reality fragments in patterns for multiplier bonuses.
// Match 3 fragments of the same type for a production multiplier.

const FRAGMENT_TYPES = ['temporal', 'spatial', 'causal', 'quantum'];
const ALL_TYPES = ['temporal', 'spatial', 'causal', 'quantum', 'chaos'];

const TYPE_BONUSES = {
  temporal: { resource: 'cosmicPower', mult: 2 },
  spatial: { resource: 'exoticMatter', mult: 2 },
  causal: { resource: 'universalConstants', mult: 2 },
  quantum: { resource: 'realityFragments', mult: 2 },
};

const WEAVE_COST = { realityFragments: 5 };
const BONUS_DURATION = 60; // seconds
const CHAOS_CHANCE = 0.15; // 15% chance for chaos (wild card) fragment
const COMBO_RESET_TIME = 120; // seconds of no weaving before combo resets

// Generate a random fragment type.
// roll is 0-1 for deterministic testing.
// Chaos fragments act as wild cards.
export function generateFragment(roll = Math.random()) {
  if (roll < CHAOS_CHANCE) return 'chaos';
  const adjusted = (roll - CHAOS_CHANCE) / (1 - CHAOS_CHANCE);
  return FRAGMENT_TYPES[Math.floor(adjusted * FRAGMENT_TYPES.length)];
}

// Get current fragments in the weaving grid
export function getWeavingGrid(state) {
  return state.weavingGrid || [];
}

// Get weaving stats
export function getWeavingStats(state) {
  return {
    totalWeaves: state.totalWeaves || 0,
    grid: getWeavingGrid(state),
    gridSize: 3,
  };
}

// Draw a fragment and add to grid. Costs reality fragments.
// Returns { state, fragment } or { state: null } if can't afford.
export function drawFragment(state, roll = Math.random()) {
  if (state.era < 8) return { state: null, fragment: null };

  // Check cost
  for (const [resourceId, amount] of Object.entries(WEAVE_COST)) {
    const r = state.resources[resourceId];
    if (!r || r.amount < amount) return { state: null, fragment: null };
  }

  // Spend cost
  const newResources = { ...state.resources };
  for (const [resourceId, amount] of Object.entries(WEAVE_COST)) {
    newResources[resourceId] = {
      ...newResources[resourceId],
      amount: newResources[resourceId].amount - amount,
    };
  }

  const fragment = generateFragment(roll);
  const grid = [...getWeavingGrid(state), fragment];

  return {
    state: {
      ...state,
      resources: newResources,
      weavingGrid: grid,
    },
    fragment,
  };
}

// Check if grid has a match (3 of the same type) and resolve it.
// Chaos fragments count as wild cards for any type.
// Consecutive weaves increase the multiplier (combo).
// Returns { state, matched, matchType } or { matched: false }.
export function resolveWeave(state) {
  const grid = getWeavingGrid(state);
  if (grid.length < 3) return { state, matched: false, matchType: null };

  // Count fragments by type
  const counts = {};
  for (const f of grid) {
    counts[f] = (counts[f] || 0) + 1;
  }
  const chaosCount = counts.chaos || 0;

  // Find first type that has 3+ (counting chaos as wild)
  let matchType = FRAGMENT_TYPES.find(t => (counts[t] || 0) >= 3);

  // If no natural match, check if chaos can fill the gap
  if (!matchType && chaosCount > 0) {
    matchType = FRAGMENT_TYPES.find(t => ((counts[t] || 0) + chaosCount) >= 3);
  }

  if (!matchType) return { state, matched: false, matchType: null };

  // Remove 3 fragments: prefer the matched type, then chaos
  let needed = 3;
  let removedType = 0;
  let removedChaos = 0;
  const typeAvailable = counts[matchType] || 0;
  const fromType = Math.min(typeAvailable, needed);
  needed -= fromType;
  const fromChaos = Math.min(chaosCount, needed);

  const newGrid = grid.filter(f => {
    if (f === matchType && removedType < fromType) {
      removedType++;
      return false;
    }
    if (f === 'chaos' && removedChaos < fromChaos) {
      removedChaos++;
      return false;
    }
    return true;
  });

  // Combo: consecutive weaves boost multiplier
  const weaveCombo = (state.weaveCombo || 0) + 1;
  const comboMult = 1 + (weaveCombo - 1) * 0.5; // x1, x1.5, x2, x2.5...

  // Apply bonus as timed effect (era-scaled)
  const bonus = TYPE_BONUSES[matchType];
  const eraScale = 1 + (state.era - 8) * 0.5; // x1 at era 8, x2 at era 10
  const effectMult = bonus.mult * comboMult * Math.max(1, eraScale);
  const effect = {
    id: `weave_${matchType}_${state.totalTime}`,
    endsAt: state.totalTime + BONUS_DURATION,
    description: `Reality Weave: x${effectMult.toFixed(1)} ${bonus.resource}`,
    effects: [
      { resourceId: bonus.resource, rateMultBonus: effectMult },
    ],
  };

  return {
    state: {
      ...state,
      weavingGrid: newGrid,
      totalWeaves: (state.totalWeaves || 0) + 1,
      weaveCombo,
      lastWeaveTime: state.totalTime,
      activeEffects: [...(state.activeEffects || []), effect],
    },
    matched: true,
    matchType,
  };
}

// Check if combo should reset due to inactivity (120s).
// Call this from the tick loop or before weaving.
export function checkComboReset(state) {
  if ((state.weaveCombo || 0) === 0) return state;
  const lastWeaveTime = state.lastWeaveTime || 0;
  if (state.totalTime - lastWeaveTime >= COMBO_RESET_TIME) {
    return { ...state, weaveCombo: 0 };
  }
  return state;
}

// Clear the weaving grid (discard fragments)
export function clearGrid(state) {
  return { ...state, weavingGrid: [] };
}
