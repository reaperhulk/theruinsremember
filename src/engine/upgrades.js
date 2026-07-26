import { upgrades as upgradeDefs } from '../data/upgrades.js';
import { resources as resourceDefs } from '../data/resources.js';
import { LORE_UPGRADE_IDS } from '../data/lore.js';
import { spend, getEffectivePrestige } from './resources.js';
import { getEraMasteryTier } from './eras.js';

const LORE_UPGRADE_ID_SET = new Set(LORE_UPGRADE_IDS);

// Repeatable milestones: every 25 levels of a repeatable upgrade crosses a
// named breakpoint that multiplies its target resource. Levels stop being
// noise — each one climbs toward the next milestone.
export const REPEATABLE_MILESTONE_STEP = 25;
export const REPEATABLE_MILESTONE_BONUS = 1.12;
const REPEATABLE_DEFS = Object.values(upgradeDefs).filter(def => def.repeatable);

export function getRepeatableLevel(state, upgradeId) {
  const value = state.upgrades?.[upgradeId];
  return typeof value === 'number' ? value : value ? 1 : 0;
}

export function getRepeatableMilestone(state, upgradeId) {
  const level = getRepeatableLevel(state, upgradeId);
  const milestones = Math.floor(level / REPEATABLE_MILESTONE_STEP);
  return {
    level,
    milestones,
    multiplier: Math.pow(REPEATABLE_MILESTONE_BONUS, milestones),
    nextAt: (milestones + 1) * REPEATABLE_MILESTONE_STEP,
  };
}

export function getRepeatableMilestoneMultiplier(state, resourceId) {
  let multiplier = 1;
  for (const def of REPEATABLE_DEFS) {
    if (def.effects?.[0]?.target !== resourceId) continue;
    const milestones = Math.floor(getRepeatableLevel(state, def.id) / REPEATABLE_MILESTONE_STEP);
    if (milestones > 0) multiplier *= Math.pow(REPEATABLE_MILESTONE_BONUS, milestones);
  }
  return multiplier;
}

// Era-based cost multiplier to keep pace with exponential production growth.
// Smooth exponential curve: each era ~15-30x more expensive than previous.
// Also scales resource caps so earlier resources can store enough.
export const ERA_COST_MULTIPLIERS = {
  1: 1, 2: 150, 3: 300, 4: 1800, 5: 6000, 6: 80000, 7: 5000000, 8: 100000000, 9: 3000000000, 10: 500000000000,
};

// Same-era cost exponent per era. Early eras use gentler scaling (sqrt-like),
// later eras use steeper scaling to prevent instant transitions.
// Same-era exponent: controls how much same-era resources cost for same-era
// upgrades. Higher = more expensive = longer eras. Late eras use steeper
// exponents so they don't compress to nothing.
const SAME_ERA_EXPONENT = {
  1: 0.5, 2: 0.5, 3: 0.5, 4: 0.55, 5: 0.6, 6: 0.7, 7: 0.75, 8: 0.8, 9: 0.20, 10: 0.85,
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

  // Echo Mode (NG+): all upgrade costs are 2x
  if (state.echoMode) {
    const doubled = {};
    for (const [resource, amount] of Object.entries(baseCost)) {
      doubled[resource] = amount * 2;
    }
    baseCost = doubled;
  }

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

  // Doctrine forks: owning one side permanently locks out the other
  if (def.exclusiveWith && state.upgrades[def.exclusiveWith]) return null;

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

  const tierBefore = getEraMasteryTier(state).tier;
  let finalState = {
    ...afterEffects,
    upgrades: { ...afterEffects.upgrades, [upgradeId]: newValue },
    lastUpgradeTime: afterEffects.totalTime || 0,
  };

  // Repeatable milestones: announce each crossing
  if (isRepeatable && typeof newValue === 'number' && newValue % REPEATABLE_MILESTONE_STEP === 0) {
    const milestone = getRepeatableMilestone(finalState, upgradeId);
    finalState = {
      ...finalState,
      eventLog: [...(finalState.eventLog || []), {
        message: `MILESTONE: ${def.name} level ${newValue} — ${def.effects[0].target} output x${milestone.multiplier.toFixed(2)}.`,
        time: finalState.totalTime || 0,
      }].slice(-20),
    };
  }

  // Era Mastery Tiers: announce the felt breakpoint every purchase counts toward
  const tierInfo = getEraMasteryTier(finalState);
  if (tierInfo.tier > tierBefore) {
    finalState = {
      ...finalState,
      eventLog: [...(finalState.eventLog || []), {
        message: `ERA MASTERY ${'I'.repeat(tierInfo.tier)}: this era's industries resonate — all production x${tierInfo.multiplier.toFixed(2)}.`,
        time: finalState.totalTime || 0,
      }].slice(-20),
    };
  }

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
    // Doctrine forks: hide the road not taken
    if (def.exclusiveWith && state.upgrades[def.exclusiveWith]) return false;
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

// A decision is an upgrade where the choice itself matters: a doctrine fork
// that locks out its opposite, an upgrade that changes a rule, one that opens
// a new resource, or a lore fragment the player should actually read. Anything
// else is build-out — a confirmation, not a choice. There are 599 upgrades and
// only about 40 of them are decisions by this definition, which is why buying
// upgrades felt like flushing a queue.
export function isDecisionUpgrade(def) {
  if (!def) return false;
  if (def.exclusiveWith) return true;
  if (def.mechanic) return true;
  if (LORE_UPGRADE_ID_SET.has(def.id)) return true;
  return (def.effects || []).some(effect => effect.type === 'unlock_resource');
}

// Build-out the player has already committed to by enabling automation: the
// routine current-era upgrades. Decisions are deliberately left alone, so the
// choices stay in the player's hands while the confirmations stop needing a
// click each. Prior eras are already automated separately in tick().
export function buyRoutineBuildOut(state) {
  let current = state;
  let total = 0;
  const hidden = state.hiddenUpgrades || {};
  for (let pass = 0; pass < 5; pass++) {
    let boughtAny = false;
    for (const def of Object.values(upgradeDefs)) {
      if (def.era !== current.era) continue;
      if (def.repeatable) continue;
      if (current.upgrades[def.id]) continue;
      if (hidden[def.id]) continue;
      if (isDecisionUpgrade(def)) continue;
      const result = purchaseUpgrade(current, def.id);
      if (result) {
        current = result;
        total++;
        boughtAny = true;
      }
    }
    if (!boughtAny) break;
  }
  return { state: current, count: total };
}

// Buy all affordable non-repeatable upgrades (multi-pass for chains).
// Returns { state, count } where count is the number purchased.
export function buyAllAffordable(state) {
  let current = state;
  let total = 0;
  for (let pass = 0; pass < 10; pass++) {
    let boughtAny = false;
    for (const def of Object.values(upgradeDefs)) {
      if (def.era > current.era) continue;
      if (def.repeatable) continue;
      if (current.upgrades[def.id]) continue;
      const result = purchaseUpgrade(current, def.id);
      if (result) {
        current = result;
        total++;
        boughtAny = true;
      }
    }
    if (!boughtAny) break;
  }
  return { state: current, count: total };
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
