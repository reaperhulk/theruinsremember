// Orbital Docking mini-game for Era 4
// Timing-based click game: hit the target zone for bonus resources.
// The docking indicator moves back and forth; click when it's in the zone.

const ZONE_SIZE = 0.2;       // 20% of the bar is the target zone
const PERFECT_ZONE = 0.05;   // 5% center for perfect dock
const BASE_SPEED = 1.5;      // cycles per second at era 4

// Resource rewards for docking
const REWARD_MISS = {};
const REWARD_GOOD = { rocketFuel: 3, orbitalInfra: 1 };
const REWARD_PERFECT = { rocketFuel: 8, orbitalInfra: 3, exoticMaterials: 1 };
const COOLDOWN = 2; // seconds between dock attempts

// Calculate indicator position (0-1) based on time.
// Speed increases slightly with era for higher difficulty.
export function getIndicatorPosition(time, era = 4) {
  const speed = BASE_SPEED + (era - 4) * 0.15;
  return (Math.sin(time * speed * Math.PI * 2) + 1) / 2;
}

// Get the target zone center (0-1). Changes each attempt.
export function getTargetZone(state) {
  const seed = state.dockingAttempts || 0;
  // Deterministic pseudo-random zone position between 0.2 and 0.8
  return 0.2 + ((seed * 7 + 3) % 10) / 10 * 0.6;
}

// Attempt a dock at the given position (0-1).
// Returns { state, result } where result is 'miss' | 'good' | 'perfect'.
export function attemptDock(state, position) {
  if (state.era < 4) return { state, result: 'miss' };

  // Cooldown check
  const lastDock = state.lastDockTime || 0;
  if (state.totalTime - lastDock < COOLDOWN) return { state, result: 'cooldown' };

  const zoneCenter = getTargetZone(state);
  const distFromCenter = Math.abs(position - zoneCenter);

  let result;
  let rewards;

  if (distFromCenter <= PERFECT_ZONE / 2) {
    result = 'perfect';
    rewards = REWARD_PERFECT;
  } else if (distFromCenter <= ZONE_SIZE / 2) {
    result = 'good';
    rewards = REWARD_GOOD;
  } else {
    result = 'miss';
    rewards = REWARD_MISS;
  }

  // Combo: consecutive successes multiply rewards
  const combo = result !== 'miss' ? (state.dockingCombo || 0) + 1 : 0;
  const comboMult = 1 + Math.min(combo, 5) * 0.2; // max x2 at 5 combo
  const hasDockingPro = state.prestigeUpgrades && state.prestigeUpgrades.dockingPro;
  const dockPrestigeMult = hasDockingPro ? 2 : 1;
  const hasSavant = state.prestigeUpgrades && state.prestigeUpgrades.miniGameSavant;
  const savantMult = hasSavant ? 1.5 : 1;

  // Era scaling: later eras give proportionally more docking rewards
  const eraScale = Math.pow(1.5, Math.max(0, state.era - 4));

  // Apply rewards scaled by prestige, combo, and era
  const newResources = { ...state.resources };
  for (const [resourceId, amount] of Object.entries(rewards)) {
    const r = newResources[resourceId];
    if (r && r.unlocked) {
      const scaled = amount * state.prestigeMultiplier * comboMult * dockPrestigeMult * eraScale * savantMult;
      newResources[resourceId] = { ...r, amount: r.amount + scaled };
    }
  }

  return {
    state: {
      ...state,
      resources: newResources,
      lastDockTime: state.totalTime,
      dockingCombo: combo,
      dockingAttempts: (state.dockingAttempts || 0) + 1,
      dockingSuccesses: result !== 'miss'
        ? (state.dockingSuccesses || 0) + 1
        : (state.dockingSuccesses || 0),
      dockingPerfects: result === 'perfect'
        ? (state.dockingPerfects || 0) + 1
        : (state.dockingPerfects || 0),
    },
    result,
  };
}

// Get zone info for UI rendering
export function getDockingInfo(state) {
  return {
    zoneCenter: getTargetZone(state),
    zoneSize: ZONE_SIZE,
    perfectSize: PERFECT_ZONE,
    attempts: state.dockingAttempts || 0,
    successes: state.dockingSuccesses || 0,
    perfects: state.dockingPerfects || 0,
  };
}
