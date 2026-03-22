// Cosmic Tuning — Era 9 mini-game
// Match a frequency slider to a target for cosmicPower & universalConstants rewards.

// Determine quality from the distance between player frequency and target.
export function getTuningQuality(distance) {
  if (distance <= 2) return 'perfect';
  if (distance <= 8) return 'good';
  if (distance <= 20) return 'ok';
  return 'miss';
}

// Get the reward multiplier for a quality level.
export function getTuningMultiplier(quality) {
  if (quality === 'perfect') return 5;
  if (quality === 'good') return 2;
  if (quality === 'ok') return 1;
  return 0;
}

// Apply a tuning action. Returns { state, cpGain, ucGain } or null if miss/unavailable.
export function applyTuning(state, quality) {
  if (state.era < 9) return null;

  const multiplier = getTuningMultiplier(quality);
  if (multiplier === 0) return null;

  const cp = state.resources.cosmicPower;
  const uc = state.resources.universalConstants;
  if (!cp?.unlocked || !uc?.unlocked) return null;

  const cpRate = (cp.baseRate + cp.rateAdd) * cp.rateMult * (state.prestigeMultiplier || 1);
  const ucRate = (uc.baseRate + uc.rateAdd) * uc.rateMult * (state.prestigeMultiplier || 1);
  const cpGain = Math.max(1, cpRate * multiplier);
  const ucGain = Math.max(0.5, ucRate * multiplier * 0.5);

  return {
    state: {
      ...state,
      tuningScore: (state.tuningScore || 0) + multiplier,
      resources: {
        ...state.resources,
        cosmicPower: { ...cp, amount: cp.amount + cpGain },
        universalConstants: { ...uc, amount: uc.amount + ucGain },
      },
    },
    cpGain,
    ucGain,
  };
}
