// Dyson Assembly operation — commission three structural modules, then automate.

import { getEffectivePrestige } from './resources.js';

export const DYSON_MODULE_LIMIT = 3;
export const DYSON_COMMISSION_INTERVAL = 60;

// Perfect Memory: the hands remember — commissioning takes half the time.
function commissionInterval(state) {
  return DYSON_COMMISSION_INTERVAL * (state.prestigeUpgrades?.perfectMemory ? 0.5 : 1);
}

export const DYSON_MODULES = {
  frame: {
    id: 'frame',
    name: 'Frame Network',
    description: '+10 segments, Megastructure production, and an immediate construction reserve.',
    resourceId: 'megastructures',
    ratePerEra: 0.4,
  },
  collector: {
    id: 'collector',
    name: 'Collector Swarm',
    description: '+10 segments, Energy production, and an immediate power reserve.',
    resourceId: 'energy',
    ratePerEra: 5,
  },
  forge: {
    id: 'forge',
    name: 'Stellar Foundry',
    description: '+10 segments, Stellar Forge production, and an immediate alloy reserve.',
    resourceId: 'stellarForge',
    ratePerEra: 0.8,
  },
};

export function getDysonModules(state) {
  return { frame: 0, collector: 0, forge: 0, ...(state.dysonModules || {}) };
}

export function commissionDysonModule(state, moduleId) {
  if (state.era < 7 || !DYSON_MODULES[moduleId]) return null;
  const modules = getDysonModules(state);
  const totalModules = Object.values(modules).reduce((sum, count) => sum + count, 0);
  if (totalModules >= DYSON_MODULE_LIMIT) return null;
  if (state.lastDysonCommissionTime !== undefined && state.totalTime - state.lastDysonCommissionTime < commissionInterval(state)) return null;

  const module = DYSON_MODULES[moduleId];
  const resource = state.resources[module.resourceId];
  if (!resource?.unlocked) return null;
  const prestigeMult = getEffectivePrestige(state.prestigeMultiplier || 1);
  const currentRate = (resource.baseRate + resource.rateAdd) * resource.rateMult * prestigeMult;
  const rateAdd = module.ratePerEra * state.era;
  const reserve = Math.max(10, currentRate * 20);

  return {
    state: {
      ...state,
      dysonSegments: (state.dysonSegments || 0) + 10,
      dysonModules: { ...modules, [moduleId]: modules[moduleId] + 1 },
      lastDysonCommissionTime: state.totalTime,
      resources: {
        ...state.resources,
        [module.resourceId]: {
          ...resource,
          amount: resource.amount + reserve,
          rateAdd: resource.rateAdd + rateAdd,
        },
      },
    },
    module,
    reserve,
    rateAdd,
  };
}

export function getDysonStats(state) {
  const segments = state.dysonSegments || 0;
  const modules = getDysonModules(state);
  const totalModules = Object.values(modules).reduce((sum, count) => sum + count, 0);
  const elapsed = state.totalTime - (state.lastDysonCommissionTime ?? -DYSON_COMMISSION_INTERVAL);
  const interval = commissionInterval(state);
  return {
    segments,
    modules,
    totalModules,
    remainingModules: Math.max(0, DYSON_MODULE_LIMIT - totalModules),
    commissionCooldown: totalModules >= DYSON_MODULE_LIMIT ? 0 : Math.max(0, interval - elapsed),
    completion: Math.floor(segments / 10) * 10,
    milestone: Math.floor(segments / 10),
    nextMilestone: (Math.floor(segments / 10) + 1) * 10,
    autoRate: segments > 0 ? Math.min(20, Math.floor(segments / 10)) : 0,
    bonusMult: 1 + segments / 100,
  };
}
