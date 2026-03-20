// Trading system (Era 6+)
// Exchange resources at ratios based on their era tiers.

import { resources as resourceDefs } from '../data/resources.js';

// Trade ratios:
//   Same era: 1:1
//   Trading up (lower era -> higher era): 10:1 per era difference
//   Trading down (higher era -> lower era): 1:5 per era difference

export function getTradeRatio(fromResourceId, toResourceId) {
  const fromDef = resourceDefs[fromResourceId];
  const toDef = resourceDefs[toResourceId];
  if (!fromDef || !toDef) return null;

  const eraDiff = toDef.era - fromDef.era;

  if (eraDiff === 0) {
    // Same era: 1:1
    return { input: 1, output: 1 };
  } else if (eraDiff > 0) {
    // Trading up: expensive — need 10^eraDiff input per 1 output
    return { input: Math.pow(10, eraDiff), output: 1 };
  } else {
    // Trading down: cheap — 1 input gives 5^|eraDiff| output
    return { input: 1, output: Math.pow(5, Math.abs(eraDiff)) };
  }
}

// Execute a trade. Returns new state or null if invalid/unaffordable.
// `amount` is how many units of `toResource` you want to receive.
export function executeTrade(state, fromResource, toResource, amount) {
  if (state.era < 6) return null;
  if (fromResource === toResource) return null;
  if (amount <= 0) return null;

  const fromDef = resourceDefs[fromResource];
  const toDef = resourceDefs[toResource];
  if (!fromDef || !toDef) return null;

  const fromR = state.resources[fromResource];
  const toR = state.resources[toResource];
  if (!fromR || !toR) return null;
  if (!fromR.unlocked || !toR.unlocked) return null;

  const ratio = getTradeRatio(fromResource, toResource);
  if (!ratio) return null;

  // Trade Routes prestige upgrade: 50% better ratios
  const hasTradeRoutes = state.prestigeUpgrades && state.prestigeUpgrades.tradeRoutes;
  const tradeBoost = hasTradeRoutes ? 0.67 : 1; // pay 67% of cost

  // Cost = amount * (input / output) * tradeBoost
  const cost = amount * (ratio.input / ratio.output) * tradeBoost;
  if (fromR.amount < cost) return null;

  return {
    ...state,
    resources: {
      ...state.resources,
      [fromResource]: {
        ...fromR,
        amount: fromR.amount - cost,
      },
      [toResource]: {
        ...toR,
        amount: toR.amount + amount,
      },
    },
    totalTrades: (state.totalTrades || 0) + 1,
  };
}
