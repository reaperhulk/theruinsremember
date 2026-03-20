import { createInitialState } from './state.js';
import { prestigeUpgrades } from '../data/prestige-upgrades.js';
import { upgrades as upgradeDefs } from '../data/upgrades.js';

// Calculate prestige multiplier based on current progress
export function calculatePrestigeBonus(state) {
  const eraBonus = state.era * 0.5;
  const upgradeCount = Object.keys(state.upgrades).length;
  const upgradeBonus = upgradeCount * 0.05;
  const techBonus = Object.keys(state.tech).length * 0.1;
  const gemBonus = (state.totalGems || 0) * 0.02;
  let bonus = 1 + eraBonus + upgradeBonus + techBonus + gemBonus;

  // Wisdom of Ages: +20% bonus per prestige
  if (hasPrestigeUpgrade(state, 'wisdomOfAges')) {
    bonus += (state.prestigeCount || 0) * 0.2;
  }

  return bonus;
}

// Calculate prestige points earned from current run
export function calculatePrestigePoints(state) {
  // Base: 1 point per era reached beyond 5
  let points = Math.max(0, state.era - 5);
  // Bonus point for reaching era 10
  if (state.era >= 10) points += 2;
  // Bonus for upgrades owned (1 point per 10 upgrades)
  points += Math.floor(Object.keys(state.upgrades).length / 10);
  return points;
}

// Get a summary of what the prestige will give
export function getPrestigeSummary(state) {
  const bonus = calculatePrestigeBonus(state);
  const newMultiplier = state.prestigeMultiplier * bonus;
  const points = calculatePrestigePoints(state);
  return {
    currentMultiplier: state.prestigeMultiplier,
    bonus,
    newMultiplier,
    points,
    totalPoints: (state.prestigePoints || 0) + points,
    prestigeCount: (state.prestigeCount || 0) + 1,
    lifetimeEras: Math.max(state.era, state.lifetimeHighestEra || 0),
  };
}

// Check if player has a prestige upgrade
export function hasPrestigeUpgrade(state, upgradeId) {
  return !!(state.prestigeUpgrades && state.prestigeUpgrades[upgradeId]);
}

// Purchase a prestige upgrade. Returns new state or null.
export function purchasePrestigeUpgrade(state, upgradeId) {
  const def = prestigeUpgrades[upgradeId];
  if (!def) return null;
  if (hasPrestigeUpgrade(state, upgradeId)) return null;
  if ((state.prestigePoints || 0) < def.cost) return null;
  // Check prerequisite
  if (def.requires && !hasPrestigeUpgrade(state, def.requires)) return null;

  return {
    ...state,
    prestigePoints: (state.prestigePoints || 0) - def.cost,
    prestigeUpgrades: { ...(state.prestigeUpgrades || {}), [upgradeId]: true },
  };
}

// Get available prestige upgrades for the shop
export function getPrestigeShop(state) {
  return Object.values(prestigeUpgrades).map(u => ({
    ...u,
    owned: hasPrestigeUpgrade(state, u.id),
    affordable: (state.prestigePoints || 0) >= u.cost,
    locked: u.requires && !hasPrestigeUpgrade(state, u.requires),
    requiresName: u.requires ? prestigeUpgrades[u.requires]?.name : null,
  }));
}

// Perform a prestige reset. Returns fresh state with multiplier, lifetime stats, and prestige upgrades.
export function performPrestige(state) {
  const bonus = calculatePrestigeBonus(state);
  const newMultiplier = state.prestigeMultiplier * bonus;
  const points = calculatePrestigePoints(state);

  const freshState = createInitialState();

  // Head Start: x2 starting multiplier
  let startMult = newMultiplier;
  if (hasPrestigeUpgrade(state, 'headStart')) {
    startMult *= 2;
  }

  const newState = {
    ...freshState,
    prestigeMultiplier: startMult,
    prestigeCount: (state.prestigeCount || 0) + 1,
    prestigePoints: (state.prestigePoints || 0) + points,
    prestigeUpgrades: state.prestigeUpgrades || {},
    lifetimeHighestEra: Math.max(state.era, state.lifetimeHighestEra || 0),
    lifetimeGems: (state.lifetimeGems || 0) + (state.totalGems || 0),
    lifetimeTrades: (state.lifetimeTrades || 0) + (state.totalTrades || 0),
    lifetimePlayTime: (state.lifetimePlayTime || 0) + state.totalTime,
    // Track best time per era
    bestEraTimes: state.bestEraTimes || {},
  };

  // Fast Start: auto-purchase era 1 upgrades
  if (hasPrestigeUpgrade(state, 'fastStart')) {
    const era1Upgrades = Object.values(upgradeDefs).filter(u => u.era === 1 && !u.repeatable && !u.requireGems && !u.requireTrades && !u.requirePrestige);
    for (const u of era1Upgrades) {
      newState.upgrades[u.id] = true;
      // Apply effects
      for (const effect of u.effects) {
        const target = newState.resources[effect.target];
        if (!target) continue;
        switch (effect.type) {
          case 'production_mult':
            newState.resources[effect.target] = { ...target, rateMult: target.rateMult * effect.value };
            break;
          case 'production_add':
            newState.resources[effect.target] = { ...target, rateAdd: target.rateAdd + effect.value };
            break;
          case 'unlock_resource':
            newState.resources[effect.target] = { ...target, unlocked: true };
            break;
          case 'cap_mult':
            newState.resources[effect.target] = { ...target, capMult: target.capMult * effect.value };
            break;
        }
      }
    }
  }

  // Quantum Memory: keep 10% of resources
  if (hasPrestigeUpgrade(state, 'quantumMemory')) {
    for (const [id, r] of Object.entries(state.resources)) {
      if (r.unlocked && newState.resources[id]) {
        newState.resources[id] = {
          ...newState.resources[id],
          amount: newState.resources[id].amount + r.amount * 0.1,
        };
      }
    }
  }

  // Deep Pockets: x3 caps
  if (hasPrestigeUpgrade(state, 'deepPockets')) {
    for (const id of Object.keys(newState.resources)) {
      newState.resources[id] = {
        ...newState.resources[id],
        capMult: newState.resources[id].capMult * 3,
      };
    }
  }

  // Persist achievements across prestige
  newState.achievements = state.achievements || {};

  // Perfect Memory: keep mini-game progress
  if (hasPrestigeUpgrade(state, 'perfectMemory')) {
    newState.hackDifficulty = state.hackDifficulty || 0;
    newState.hackSuccesses = state.hackSuccesses || 0;
    newState.dockingSuccesses = state.dockingSuccesses || 0;
    newState.dockingPerfects = state.dockingPerfects || 0;
    newState.totalWeaves = state.totalWeaves || 0;
  }

  // Cosmic Insight: start at Era 2 (also buys era 2 tech)
  if (hasPrestigeUpgrade(state, 'cosmicInsight')) {
    newState.era = 2;
    newState.tech.metallurgy = true;
    newState.tech.industrialRevolution = true;
    // Unlock era 2 resources
    const era2Resources = ['steel', 'electronics', 'research'];
    for (const id of era2Resources) {
      if (newState.resources[id]) {
        newState.resources[id] = { ...newState.resources[id], unlocked: true };
      }
    }
  }

  return newState;
}
