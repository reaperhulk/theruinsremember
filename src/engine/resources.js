import { resources as resourceDefs } from '../data/resources.js';

// Calculate effective production rate for a single resource
export function getEffectiveRate(state, resourceId) {
  const r = state.resources[resourceId];
  if (!r || !r.unlocked) return 0;
  const def = resourceDefs[resourceId];
  if (!def) return 0;
  const realityKeyBonus = 1 + (Object.values(state.realityKeys || {}).reduce((s, v) => s + v, 0) * 0.01);
  return (def.baseRate + r.rateAdd) * r.rateMult * state.prestigeMultiplier * realityKeyBonus;
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
    return grossRate - laborRate * 0.8;
  }
  if (resourceId === 'energy') {
    const elecRate = getEffectiveRate(state, 'electronics');
    return grossRate - elecRate * 0.3;
  }
  if (resourceId === 'rocketFuel' && state.era >= 4) {
    const orbRate = getEffectiveRate(state, 'orbitalInfra');
    return grossRate - orbRate * 0.6;
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
  const eraScale = 1 + (state.era - 1) * 1.0;
  const gathered = amount * r.rateMult * state.prestigeMultiplier * eraScale;
  const cap = getEffectiveCap(state, resourceId);
  let newAmount = r.amount + gathered;
  // Enforce cap on gathering (clicking)
  if (cap > 0 && newAmount > cap) {
    newAmount = Math.max(r.amount, cap); // don't reduce if already over
  }
  let newResources = {
    ...state.resources,
    [resourceId]: { ...r, amount: newAmount },
  };

  // Mechanic: canvasDataCache — 20% chance on any click to get 30s of data production
  let dataMiningProc = false;
  if (state.upgrades?.dataMining && newResources.data?.unlocked) {
    if (Math.random() < 0.2) {
      const dataR = newResources.data;
      const dataRate = (dataR.baseRate + dataR.rateAdd) * dataR.rateMult * (state.prestigeMultiplier || 1);
      if (dataRate > 0) {
        const dataCap = getEffectiveCap({ ...state, resources: newResources }, 'data');
        const burst = dataRate * 30;
        let dataAmount = dataR.amount + burst;
        if (dataCap > 0 && dataAmount > dataCap) {
          dataAmount = Math.max(dataR.amount, dataCap);
        }
        newResources = { ...newResources, data: { ...dataR, amount: dataAmount } };
        dataMiningProc = true;
      }
    }
  }

  // Mechanic: clickAll — clicking any resource also gives +1 to all others
  if (state.upgrades?.scavengerInstinct) {
    for (const [otherId, otherR] of Object.entries(state.resources)) {
      if (otherId !== resourceId && otherR.unlocked) {
        const otherCap = getEffectiveCap({ ...state, resources: newResources }, otherId);
        const bonus = 1 * (otherR.rateMult || 1) * (state.prestigeMultiplier || 1);
        const cur = newResources[otherId] || otherR;
        let otherAmount = cur.amount + bonus;
        if (otherCap > 0 && otherAmount > otherCap) {
          otherAmount = Math.max(cur.amount, otherCap);
        }
        newResources = { ...newResources, [otherId]: { ...cur, amount: otherAmount } };
      }
    }
  }

  let newState = { ...state, resources: newResources };
  if (dataMiningProc) {
    newState = {
      ...newState,
      eventLog: [...(newState.eventLog || []), {
        message: 'Data cache found! Ancient databases yield data.',
        time: newState.totalTime,
      }].slice(-20),
    };
  }
  return newState;
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
