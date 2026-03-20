import { resources as resourceDefs } from '../data/resources.js';

// Calculate effective production rate for a single resource
export function getEffectiveRate(state, resourceId) {
  const r = state.resources[resourceId];
  if (!r || !r.unlocked) return 0;
  const def = resourceDefs[resourceId];
  if (!def) return 0;
  return (def.baseRate + r.rateAdd) * r.rateMult * state.prestigeMultiplier;
}

// Calculate all production rates
export function calculateProduction(state) {
  const rates = {};
  for (const id of Object.keys(state.resources)) {
    rates[id] = getEffectiveRate(state, id);
  }
  return rates;
}

// Calculate net production (accounting for consumption)
export function getNetRate(state, resourceId) {
  const grossRate = getEffectiveRate(state, resourceId);
  if (resourceId === 'food') {
    const laborRate = getEffectiveRate(state, 'labor');
    return grossRate - laborRate * 0.3;
  }
  if (resourceId === 'energy') {
    const elecRate = getEffectiveRate(state, 'electronics');
    return grossRate - elecRate * 0.2;
  }
  if (resourceId === 'rocketFuel' && state.era >= 4) {
    const orbRate = getEffectiveRate(state, 'orbitalInfra');
    return grossRate - orbRate * 0.5;
  }
  return grossRate;
}

// Check if we can afford a cost object { resourceId: amount, ... }
export function canAfford(state, cost) {
  for (const [resourceId, amount] of Object.entries(cost)) {
    const r = state.resources[resourceId];
    if (!r || r.amount < amount) return false;
  }
  return true;
}

// Spend resources. Returns new state or null if can't afford.
export function spend(state, cost) {
  if (!canAfford(state, cost)) return null;
  const newResources = { ...state.resources };
  for (const [resourceId, amount] of Object.entries(cost)) {
    newResources[resourceId] = {
      ...newResources[resourceId],
      amount: newResources[resourceId].amount - amount,
    };
  }
  return { ...state, resources: newResources };
}

// Manually gather a resource (clicking). Returns new state.
// Gather amount scales with rateMult, prestige, and era so clicking stays relevant.
export function gather(state, resourceId, amount = 1) {
  const r = state.resources[resourceId];
  if (!r || !r.unlocked) return state;
  const eraScale = 1 + (state.era - 1) * 0.5;
  const gathered = amount * r.rateMult * state.prestigeMultiplier * eraScale;
  return {
    ...state,
    resources: {
      ...state.resources,
      [resourceId]: { ...r, amount: r.amount + gathered },
    },
  };
}

// Get effective cap for a resource
export function getEffectiveCap(state, resourceId) {
  const r = state.resources[resourceId];
  if (!r) return 0;
  const def = resourceDefs[resourceId];
  if (!def) return 0;
  return def.baseCap * r.capMult;
}
