// Reality Weaving operation: establish three permanent laws for the current cycle.
import { getOperationRewardMultiplier } from './cycles.js';
import { getRelicOperationMultiplier } from './relics.js';

export const REALITY_LAW_LIMIT = 3;
export const REALITY_LAW_INTERVAL = 45;

export const REALITY_LAWS = {
  temporal: {
    id: 'temporal',
    name: 'Temporal Current',
    resourceId: 'cosmicPower',
    resourceName: 'Cosmic Power',
    description: 'Time flows toward usable power.',
  },
  spatial: {
    id: 'spatial',
    name: 'Spatial Abundance',
    resourceId: 'exoticMatter',
    resourceName: 'Exotic Matter',
    description: 'Every volume contains more than it should.',
  },
  causal: {
    id: 'causal',
    name: 'Causal Certainty',
    resourceId: 'universalConstants',
    resourceName: 'Universal Constants',
    description: 'Useful causes become reliable effects.',
  },
  quantum: {
    id: 'quantum',
    name: 'Quantum Confluence',
    resourceId: 'realityFragments',
    resourceName: 'Reality Fragments',
    description: 'Adjacent possibilities collapse in your favor.',
  },
};

export function getWovenLaws(state) {
  return { ...(state.wovenLaws || {}) };
}

export function getWeaveCost(state) {
  const wovenCount = Object.keys(getWovenLaws(state)).length;
  const baseCost = 20 * (wovenCount + 1);
  return state.prestigeUpgrades?.masterWeaver ? Math.ceil(baseCost / 2) : baseCost;
}

export function getWeavingStats(state) {
  const laws = getWovenLaws(state);
  const wovenCount = Object.keys(laws).length;
  const elapsed = state.totalTime - (state.lastLawWeaveTime ?? -REALITY_LAW_INTERVAL);
  return {
    totalWeaves: state.totalWeaves || 0,
    laws,
    wovenCount,
    remaining: Math.max(0, REALITY_LAW_LIMIT - wovenCount),
    cooldown: wovenCount >= REALITY_LAW_LIMIT ? 0 : Math.max(0, REALITY_LAW_INTERVAL - elapsed),
  };
}

export function getWeaveProductionMultiplier(state, resourceId) {
  const law = Object.values(REALITY_LAWS).find(candidate => candidate.resourceId === resourceId);
  if (!law || !state.wovenLaws?.[law.id]) return 1;
  if (state.forgetting?.scars?.[`law:${law.id}`]) return 1; // consumed by the Forgetting
  const savantMultiplier = state.prestigeUpgrades?.miniGameSavant ? 1.5 : 1;
  const bonus = 0.5 * savantMultiplier * getOperationRewardMultiplier(state) * getRelicOperationMultiplier(state, 'weaving');
  return 1 + bonus;
}

export function weaveRealityLaw(state, lawId) {
  const law = REALITY_LAWS[lawId];
  if (state.era < 8 || !law) return null;

  const stats = getWeavingStats(state);
  if (stats.remaining <= 0 || stats.laws[lawId] || stats.cooldown > 0) return null;

  const fragments = state.resources.realityFragments;
  const cost = getWeaveCost(state);
  if (!fragments?.unlocked || fragments.amount < cost) return null;

  return {
    state: {
      ...state,
      resources: {
        ...state.resources,
        realityFragments: { ...fragments, amount: fragments.amount - cost },
      },
      wovenLaws: { ...stats.laws, [lawId]: true },
      totalWeaves: (state.totalWeaves || 0) + 1,
      lastLawWeaveTime: state.totalTime,
    },
    law,
    cost,
  };
}
