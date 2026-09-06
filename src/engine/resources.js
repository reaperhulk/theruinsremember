import { calculateEconomy } from './economy.js';
import { resources as resourceDefs } from '../data/resources.js';
import { ERA_COST_MULTIPLIERS } from './upgrades.js';
import { getRelicCapacityMultiplier } from './relics.js';

// Soft-scale prestige multiplier: first 10x is linear, beyond that sqrt.
// Prevents early prestiges from trivializing the game while still rewarding
// deep prestige investment. Used everywhere prestige mult affects gameplay.
// Hard cap: effective prestige multiplier never exceeds 50x.
export const PRESTIGE_HARD_CAP = 50;

export function getEffectivePrestige(rawMultiplier) {
  if (!rawMultiplier || rawMultiplier <= 1) return 1;
  if (rawMultiplier <= 10) return rawMultiplier;
  return Math.min(PRESTIGE_HARD_CAP, 10 + Math.sqrt(rawMultiplier - 10) * 3);
}

// All rates and forecasts share the simulation's calculation.
export function getEffectiveRate(state, resourceId) {
  return calculateEconomy(state).gross[resourceId] || 0;
}

export function calculateProduction(state) {
  return calculateEconomy(state).gross;
}

export function getNetRate(state, resourceId) {
  return calculateEconomy(state).net[resourceId] || 0;
}

// Check if we can afford a cost object { resourceId: amount, ... }
export function canAfford(state, cost) {
  for (const [resourceId, amount] of Object.entries(cost)) {
    const r = state.resources[resourceId];
    if (!r || !Number.isFinite(amount) || amount < 0 || !Number.isFinite(r.amount) || r.amount < amount || (amount > 0 && !r.unlocked)) return false;
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

// Development includes gathering from planetfall. Earned industrial and
// prestige automation also remains available when development is paused.
export function isGatheringAutomated(state) {
  return state.autoBuildOut !== false || !!state.autoGather || state.era >= 4 || (state.era >= 2 && !!state.upgrades?.automation);
}

// Manually gather a resource (clicking). Returns new state.
// Gather amount scales with rateMult, prestige, and era so clicking stays relevant.
export function gather(state, resourceId, amount = 1, rng = Math.random) {
  const r = state.resources[resourceId];
  if (!r || !r.unlocked) return state;
  const eraScale = 1 + (state.era - 1) * 1.0;
  const prestigeMult = getEffectivePrestige(state.prestigeMultiplier || 1);
  const gathered = amount * r.rateMult * prestigeMult * eraScale;
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
    if (rng() < 0.2) {
      const dataR = newResources.data;
      const dataRate = (dataR.baseRate + dataR.rateAdd) * dataR.rateMult * getEffectivePrestige(state.prestigeMultiplier || 1);
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
        const bonus = 1 * (otherR.rateMult || 1) * getEffectivePrestige(state.prestigeMultiplier || 1);
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
  // Era scaling: caps grow proportionally to cost multipliers so cross-era costs stay affordable
  const currentEra = state.era || 1;
  const eraCapScale = ERA_COST_MULTIPLIERS[currentEra] || 1;
  const spatialKeyBonus = 1 + (state.realityKeys?.spatial || 0) * 0.15;
  return (state.archive?.research?.expansion ? 2 : 1) * def.baseCap * r.capMult * eraCapScale * spatialKeyBonus * getRelicCapacityMultiplier(state);
}
