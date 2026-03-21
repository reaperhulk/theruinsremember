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
    return grossRate - orbRate * 0.3;
  }
  if (resourceId === 'exoticMaterials' && state.era >= 5) {
    const colonyRate = getEffectiveRate(state, 'colonies');
    return grossRate - colonyRate * 0.2;
  }
  if (resourceId === 'stellarForge' && state.era >= 7) {
    const megaRate = getEffectiveRate(state, 'megastructures');
    return grossRate - megaRate * 0.3;
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
  const cap = getEffectiveCap(state, resourceId);
  let newAmount = r.amount + gathered;
  // Enforce cap on gathering (clicking)
  if (cap > 0 && newAmount > cap) {
    newAmount = Math.max(r.amount, cap); // don't reduce if already over
  }
  return {
    ...state,
    resources: {
      ...state.resources,
      [resourceId]: { ...r, amount: newAmount },
    },
  };
}

// Get effective cap for a resource
// Caps scale with era distance — earlier resources get bigger caps in later eras
export function getEffectiveCap(state, resourceId) {
  const r = state.resources[resourceId];
  if (!r) return 0;
  const def = resourceDefs[resourceId];
  if (!def) return 0;
  // Era scaling: resources from earlier eras get a small cap boost in later eras
  const eraDiff = Math.max(0, (state.era || 1) - def.era);
  const eraCapScale = 1 + eraDiff * 0.25; // +25% per era beyond origin
  return def.baseCap * r.capMult * eraCapScale;
}
