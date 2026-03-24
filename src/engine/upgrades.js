import { upgrades as upgradeDefs } from '../data/upgrades.js';
import { resources as resourceDefs } from '../data/resources.js';
import { spend, getEffectivePrestige } from './resources.js';

// Era-based cost multiplier to keep pace with exponential production growth.
// Smooth exponential curve: each era ~15-30x more expensive than previous.
// Also scales resource caps so earlier resources can store enough.
export const ERA_COST_MULTIPLIERS = {
  1: 1, 2: 70, 3: 150, 4: 800, 5: 5000, 6: 20000, 7: 5000000, 8: 100000000, 9: 3000000000, 10: 1000000000000,
};

// Same-era cost exponent per era. Early eras use gentler scaling (sqrt-like),
// later eras use steeper scaling to prevent instant transitions.
// Same-era exponent: controls how much same-era resources cost for same-era
// upgrades. Higher = more expensive = longer eras. Late eras use steeper
// exponents so they don't compress to nothing.
const SAME_ERA_EXPONENT = {
  1: 0.5, 2: 0.5, 3: 0.5, 4: 0.55, 5: 0.6, 6: 0.7, 7: 0.75, 8: 0.8, 9: 0.85, 10: 0.85,
};

// Apply era-based cost scaling per resource:
// - Earlier-era resources: full multiplier (player has high production)
// - Same-era resources: eraMult^exponent (era-dependent, steeper in late game)
export function applyEraCostScaling(baseCost, upgradeEra) {
  const eraMult = ERA_COST_MULTIPLIERS[upgradeEra] || 1;
  if (eraMult <= 1) return baseCost;
  const exponent = SAME_ERA_EXPONENT[upgradeEra] || 0.6;
  const sameEraMult = Math.ceil(Math.pow(eraMult, exponent));
  const scaled = {};
  for (const [resource, amount] of Object.entries(baseCost)) {
    const resourceEra = resourceDefs[resource]?.era || 1;
    if (resourceEra < upgradeEra) {
      scaled[resource] = Math.ceil(amount * eraMult);
    } else {
      scaled[resource] = Math.ceil(amount * sameEraMult);
    }
  }
  return scaled;
}

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

// Get the current cost for an upgrade (handles repeatable scaling and prestige discounts)
export function getUpgradeCost(state, upgradeId) {
  const def = upgradeDefs[upgradeId];
  if (!def) return null;

  let baseCost = def.cost;

  // Chain Master prestige upgrade: 30% discount on cross-chain upgrades (2+ prereqs)
  const hasChainMaster = state.prestigeUpgrades && state.prestigeUpgrades.chainMaster;
  if (hasChainMaster && def.prerequisites.length >= 2) {
    const discounted = {};
    for (const [resource, amount] of Object.entries(baseCost)) {
      discounted[resource] = Math.ceil(amount * 0.7);
    }
    baseCost = discounted;
  }

  // Apply era-based cost multiplier (only for earlier-era resources)
  baseCost = applyEraCostScaling(baseCost, def.era);

  if (!def.repeatable) return baseCost;
  const count = typeof state.upgrades[upgradeId] === 'number' ? state.upgrades[upgradeId] : 0;
  // Universal Optimizer prestige upgrade: reduce cost scaling by 20%
  const hasOptimizer = state.prestigeUpgrades && state.prestigeUpgrades.universalOptimizer;
  const scale = hasOptimizer ? (def.costScale || 1.5) * 0.8 : (def.costScale || 1.5);
  return getScaledCost(baseCost, scale, count);
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

  // Check prerequisites (quantumTunneling allows skipping 1 unmet prereq)
  const unmetPrereqs = def.prerequisites.filter(p => !state.upgrades[p]);
  const hasQT = state.prestigeUpgrades?.quantumTunneling;
  if (unmetPrereqs.length > (hasQT ? 1 : 0)) return null;

  // Get actual cost (scaled for repeatables, with prestige discounts)
  const cost = getUpgradeCost(state, upgradeId);

  // Check and spend cost
  const afterSpend = spend(state, cost);
  if (!afterSpend) return null;

  // Apply effects
  const afterEffects = applyEffects(afterSpend, def.effects);

  const newValue = isRepeatable ? purchaseCount + 1 : true;

  let finalState = {
    ...afterEffects,
    upgrades: { ...afterEffects.upgrades, [upgradeId]: newValue },
    lastUpgradeTime: afterEffects.totalTime || 0,
  };

  // Mechanic: purchaseBurst — every upgrade purchase triggers a burst of all resources
  if (finalState.upgrades?.chainReaction) {
    const burstResources = { ...finalState.resources };
    for (const [id, r] of Object.entries(burstResources)) {
      if (!r.unlocked) continue;
      const rate = (r.baseRate + r.rateAdd) * r.rateMult * getEffectivePrestige(finalState.prestigeMultiplier || 1);
      if (rate > 0) {
        const burst = rate * 5; // 5 seconds worth of production
        const cap = r.baseCap > 0 ? r.baseCap * r.capMult : Infinity;
        burstResources[id] = { ...r, amount: Math.min(r.amount + burst, cap > 0 ? cap : Infinity) };
      }
    }
    finalState = {
      ...finalState,
      resources: burstResources,
      eventLog: [...(finalState.eventLog || []), {
        message: 'Chain Reaction! Purchase triggers a burst of all resources.',
        time: finalState.totalTime,
      }].slice(-20),
    };
  }

  return finalState;
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
    // Check prerequisites (quantumTunneling allows skipping 1 unmet prereq)
    const unmetPrereqs = def.prerequisites.filter(p => !state.upgrades[p]);
    const hasQT = state.prestigeUpgrades?.quantumTunneling;
    if (unmetPrereqs.length > (hasQT ? 1 : 0)) return false;
    // Check milestone requirements
    if (def.requireGems && (state.totalGems || 0) < def.requireGems) return false;
    if (def.requireTrades && (state.totalTrades || 0) < def.requireTrades) return false;
    if (def.requirePrestige && (state.prestigeCount || 0) < def.requirePrestige) return false;
    return true;
  }).sort((a, b) => {
    if (a.era !== b.era) return a.era - b.era;
    const aDepth = a.prerequisites.length;
    const bDepth = b.prerequisites.length;
    if (aDepth !== bDepth) return aDepth - bDepth;
    return a.id.localeCompare(b.id);
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
