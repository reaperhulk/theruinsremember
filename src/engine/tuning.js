// Cosmic Tuning operation — lock three of four visible signal bands for the cycle.
import { getOperationRewardMultiplier } from './cycles.js';

export const TUNING_LOCK_LIMIT = 3;
export const TUNING_LOCK_INTERVAL = 50;

// Each band is a fully visible tradeoff: a strong boost with a stated drag,
// or the smaller penalty-free Deep Time band. Locks reset at prestige.
export const COSMIC_BANDS = {
  power: {
    id: 'power',
    name: 'Radiant Band',
    description: 'Pour the signal into raw output. Precision suffers.',
    boost: { cosmicPower: 0.6 },
    drag: { universalConstants: 0.1 },
  },
  constants: {
    id: 'constants',
    name: 'Lattice Band',
    description: 'Sharpen the constants. Raw power bleeds away.',
    boost: { universalConstants: 0.6 },
    drag: { cosmicPower: 0.1 },
  },
  fragments: {
    id: 'fragments',
    name: 'Fracture Band',
    description: 'Split reality along useful seams. The lattice frays.',
    boost: { realityFragments: 0.6 },
    drag: { universalConstants: 0.1 },
  },
  stability: {
    id: 'stability',
    name: 'Deep Time Band',
    description: 'A slow, even signal from before the first cycle. No drawbacks.',
    boost: { cosmicPower: 0.25, universalConstants: 0.25 },
    drag: {},
  },
};

export function getLockedSignals(state) {
  return { ...(state.lockedSignals || {}) };
}

export function getTuningStats(state) {
  const locked = getLockedSignals(state);
  const lockedCount = Object.keys(locked).length;
  const elapsed = state.totalTime - (state.lastSignalLockTime ?? -TUNING_LOCK_INTERVAL);
  return {
    locked,
    lockedCount,
    remaining: Math.max(0, TUNING_LOCK_LIMIT - lockedCount),
    cooldown: lockedCount >= TUNING_LOCK_LIMIT ? 0 : Math.max(0, TUNING_LOCK_INTERVAL - elapsed),
  };
}

// Production multiplier from locked bands. Boosts scale with operation
// rewards (doctrine and Causal Keys); drags stay fixed so synergies never
// deepen a penalty.
export function getTuningProductionMultiplier(state, resourceId) {
  const locked = state.lockedSignals;
  if (!locked) return 1;
  let multiplier = 1;
  let rewardMultiplier = null;
  for (const band of Object.values(COSMIC_BANDS)) {
    if (!locked[band.id]) continue;
    const boost = band.boost[resourceId];
    if (boost) {
      rewardMultiplier ??= getOperationRewardMultiplier(state);
      multiplier *= 1 + boost * rewardMultiplier;
    }
    const drag = band.drag[resourceId];
    if (drag) multiplier *= 1 - drag;
  }
  return multiplier;
}

// Lock a signal band. Returns { state, band } or null if unavailable.
export function lockCosmicSignal(state, bandId) {
  const band = COSMIC_BANDS[bandId];
  if (state.era < 9 || !band) return null;

  const stats = getTuningStats(state);
  if (stats.remaining <= 0 || stats.locked[bandId] || stats.cooldown > 0) return null;

  return {
    state: {
      ...state,
      lockedSignals: { ...stats.locked, [bandId]: true },
      lastSignalLockTime: state.totalTime,
    },
    band,
  };
}
