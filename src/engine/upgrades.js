import { upgrades as upgradeDefs } from '../data/upgrades.js';
import { canAfford, spend } from './resources.js';

// Apply upgrade effects to state
function applyEffects(state, effects) {
  const newResources = { ...state.resources };
  for (const effect of effects) {
    const target = newResources[effect.target];
    if (!target) continue;

    switch (effect.type) {
      case 'production_mult':
        newResources[effect.target] = {
          ...target,
          rateMult: target.rateMult * effect.value,
        };
        break;
      case 'production_add':
        newResources[effect.target] = {
          ...target,
          rateAdd: target.rateAdd + effect.value,
        };
        break;
      case 'cap_mult':
        newResources[effect.target] = {
          ...target,
          capMult: target.capMult * effect.value,
        };
        break;
      case 'unlock_resource':
        newResources[effect.target] = {
          ...target,
          unlocked: true,
        };
        break;
    }
  }

  // Handle production_mult_all as a second pass (no target needed)
  for (const effect of effects) {
    if (effect.type === 'production_mult_all') {
      for (const id of Object.keys(newResources)) {
        newResources[id] = {
          ...newResources[id],
          rateMult: newResources[id].rateMult * effect.value,
        };
      }
    }
  }

  return { ...state, resources: newResources };
}

// Scale cost for repeatable upgrades: baseCost * costScale^count
function getScaledCost(baseCost, costScale, count) {
  const scale = Math.pow(costScale, count);
  const scaled = {};
  for (const [resource, amount] of Object.entries(baseCost)) {
    scaled[resource] = Math.ceil(amount * scale);
  }
  return scaled;
}

// Get the current cost for an upgrade (handles repeatable scaling)
export function getUpgradeCost(state, upgradeId) {
  const def = upgradeDefs[upgradeId];
  if (!def) return null;
  if (!def.repeatable) return def.cost;
  const count = typeof state.upgrades[upgradeId] === 'number' ? state.upgrades[upgradeId] : 0;
  // Universal Optimizer prestige upgrade: reduce cost scaling by 20%
  const hasOptimizer = state.prestigeUpgrades && state.prestigeUpgrades.universalOptimizer;
  const scale = hasOptimizer ? (def.costScale || 1.5) * 0.8 : (def.costScale || 1.5);
  return getScaledCost(def.cost, scale, count);
}

// Purchase an upgrade. Returns new state or null if can't purchase.
export function purchaseUpgrade(state, upgradeId) {
  const def = upgradeDefs[upgradeId];
  if (!def) return null;
  if (def.era > state.era) return null;

  const isRepeatable = def.repeatable === true;
  const purchaseCount = typeof state.upgrades[upgradeId] === 'number'
    ? state.upgrades[upgradeId]
    : (state.upgrades[upgradeId] ? 1 : 0);

  // Non-repeatable: can't buy again
  if (!isRepeatable && state.upgrades[upgradeId]) return null;

  // Check prerequisites
  for (const prereq of def.prerequisites) {
    if (!state.upgrades[prereq]) return null;
  }

  // Get actual cost (scaled for repeatables)
  const cost = isRepeatable
    ? getScaledCost(def.cost, def.costScale || 1.5, purchaseCount)
    : def.cost;

  // Check and spend cost
  const afterSpend = spend(state, cost);
  if (!afterSpend) return null;

  // Apply effects
  const afterEffects = applyEffects(afterSpend, def.effects);

  const newValue = isRepeatable ? purchaseCount + 1 : true;

  return {
    ...afterEffects,
    upgrades: { ...afterEffects.upgrades, [upgradeId]: newValue },
  };
}

// Buy as many of a repeatable upgrade as affordable. Returns new state or null.
export function buyMaxRepeatable(state, upgradeId) {
  const def = upgradeDefs[upgradeId];
  if (!def || !def.repeatable) return null;

  let current = state;
  let purchased = 0;
  while (true) {
    const next = purchaseUpgrade(current, upgradeId);
    if (!next) break;
    current = next;
    purchased++;
  }
  return purchased > 0 ? current : null;
}

// Get list of upgrades available to purchase
export function getAvailableUpgrades(state) {
  return Object.values(upgradeDefs).filter(def => {
    if (def.era > state.era) return false;
    // Non-repeatable: hide if purchased
    if (!def.repeatable && state.upgrades[def.id]) return false;
    // Check prerequisites
    for (const prereq of def.prerequisites) {
      if (!state.upgrades[prereq]) return false;
    }
    // Check milestone requirements
    if (def.requireGems && (state.totalGems || 0) < def.requireGems) return false;
    if (def.requireTrades && (state.totalTrades || 0) < def.requireTrades) return false;
    if (def.requirePrestige && (state.prestigeCount || 0) < def.requirePrestige) return false;
    return true;
  });
}

// Get list of "coming soon" upgrades — prerequisites almost met (need 1 more)
export function getUpcomingUpgrades(state) {
  return Object.values(upgradeDefs).filter(def => {
    if (def.era > state.era) return false;
    if (def.repeatable && state.upgrades[def.id]) return false;
    if (!def.repeatable && state.upgrades[def.id]) return false;
    if (def.prerequisites.length === 0) return false;

    // Count unmet prerequisites
    const unmet = def.prerequisites.filter(p => !state.upgrades[p]).length;
    // Show if exactly 1 prerequisite is missing
    return unmet === 1;
  }).map(def => {
    // Find the missing prerequisite
    const missingPrereq = def.prerequisites.find(p => !state.upgrades[p]);
    const missingName = missingPrereq ? (upgradeDefs[missingPrereq]?.name || missingPrereq) : null;
    return { ...def, missingPrereq: missingName };
  }).slice(0, 5); // Show max 5 upcoming
}

// Get list of purchased upgrades
export function getPurchasedUpgrades(state) {
  return Object.keys(state.upgrades).map(id => {
    const def = upgradeDefs[id];
    if (!def) return null;
    const count = typeof state.upgrades[id] === 'number' ? state.upgrades[id] : 1;
    return { ...def, purchaseCount: count };
  }).filter(Boolean);
}
