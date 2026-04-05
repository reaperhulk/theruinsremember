// Cosmic Tuning — Era 9 mini-game
// Match a frequency slider to a target for cosmicPower & universalConstants rewards.

import { getEffectivePrestige } from './resources.js';

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

// Reward tiers: { threshold, bonus (multiplier on cosmicPower production), label }
export const TUNING_TIERS = [
  { threshold: 100, bonus: 1.50, label: 'Tier IV: +50% Cosmic Power' },
  { threshold:  50, bonus: 1.20, label: 'Tier III: +20% Cosmic Power' },
  { threshold:  25, bonus: 1.10, label: 'Tier II: +10% Cosmic Power' },
  { threshold:  10, bonus: 1.05, label: 'Tier I: +5% Cosmic Power' },
];

// Get the current production bonus for cosmicPower based on tuning score.
export function getTuningProductionBonus(tuningScore) {
  const score = tuningScore || 0;
  for (const tier of TUNING_TIERS) {
    if (score >= tier.threshold) return tier.bonus;
  }
  return 1;
}

// Get the next tier not yet reached.
export function getNextTuningTier(tuningScore) {
  const score = tuningScore || 0;
  return [...TUNING_TIERS].reverse().find(t => t.threshold > score) || null;
}

// Apply a tuning action. Returns { state, cpGain, ucGain } or null if miss/unavailable.
export function applyTuning(state, quality) {
  if (state.era < 9) return null;

  const multiplier = getTuningMultiplier(quality);
  if (multiplier === 0) return null;

  const cp = state.resources.cosmicPower;
  const uc = state.resources.universalConstants;
  if (!cp?.unlocked || !uc?.unlocked) return null;

  const prestigeMult = getEffectivePrestige(state.prestigeMultiplier || 1);
  const cpRate = (cp.baseRate + cp.rateAdd) * cp.rateMult * prestigeMult;
  const ucRate = (uc.baseRate + uc.rateAdd) * uc.rateMult * prestigeMult;
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
