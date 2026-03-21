import { calculateProduction, getEffectiveCap, gather } from './resources.js';
import { checkEraTransition, transitionEra } from './eras.js';
import { checkForEvent, expireEffects, getTimedRateMultiplier } from './events.js';
import { getFactoryBonus } from './factory.js';
import { getColonyBonus } from './colonies.js';
import { getRouteBonus } from './starChart.js';
import { mine } from './mining.js';
import { checkAchievements } from './achievements.js';
import { checkComboReset } from './weaving.js';
import { purchaseUpgrade, getUpgradeCost } from './upgrades.js';
import { upgrades as upgradeDefs } from '../data/upgrades.js';

// Resource consumption rates
const FOOD_PER_LABOR = 0.3;       // Food consumed per labor/s
const ENERGY_PER_ELECTRONICS = 0.2; // Energy consumed per electronics/s
const FUEL_PER_ORBITAL = 0.3;     // Fuel consumed per orbitalInfra/s

// Core game loop: advance state by dt seconds
export function tick(state, dt) {
  const rates = calculateProduction(state);

  // Add mini-game bonuses to production rates
  const factoryBonus = getFactoryBonus(state);
  const colonyBonus = getColonyBonus(state);
  const routeBonus = getRouteBonus(state);
  for (const bonus of [factoryBonus, colonyBonus, routeBonus]) {
    for (const [id, amount] of Object.entries(bonus)) {
      rates[id] = (rates[id] || 0) + amount;
    }
  }

  // Food consumption: labor production costs food
  const laborRate = rates.labor || 0;
  const foodCost = laborRate * FOOD_PER_LABOR * dt;
  const foodAvailable = state.resources.food?.amount || 0;
  const foodLimited = foodCost > 0 && foodAvailable < foodCost;
  const laborScale = foodLimited ? foodAvailable / foodCost : 1;

  // Advance resources (apply timed event multipliers)
  const newResources = { ...state.resources };
  for (const [id, rate] of Object.entries(rates)) {
    if (rate === 0) continue;
    const r = newResources[id];
    if (!r || !r.unlocked) continue;

    let effectiveRate = rate;
    if (id === 'labor') effectiveRate = rate * laborScale;

    // Apply timed effect multipliers
    const timedMult = getTimedRateMultiplier(state, id);
    effectiveRate *= timedMult;

    const cap = getEffectiveCap(state, id);
    let newAmount = r.amount + effectiveRate * dt;
    // Enforce resource cap: production cannot push above cap
    if (cap > 0 && newAmount > cap && effectiveRate > 0) {
      newAmount = Math.max(r.amount, cap); // don't reduce if already over cap (e.g. from giveAll)
    }
    newResources[id] = { ...r, amount: Math.max(0, newAmount) };
  }

  // Deduct food consumed by labor
  if (laborRate > 0 && newResources.food) {
    const consumed = laborRate * laborScale * FOOD_PER_LABOR * dt;
    newResources.food = {
      ...newResources.food,
      amount: Math.max(0, newResources.food.amount - consumed),
    };
  }

  // Deduct energy consumed by electronics production (Era 2+)
  const electronicsRate = rates.electronics || 0;
  if (electronicsRate > 0 && newResources.energy) {
    const energyCost = electronicsRate * ENERGY_PER_ELECTRONICS * dt;
    newResources.energy = {
      ...newResources.energy,
      amount: Math.max(0, newResources.energy.amount - energyCost),
    };
  }

  // Deduct fuel consumed by orbital infra production (Era 4+)
  const orbitalRate = rates.orbitalInfra || 0;
  if (orbitalRate > 0 && newResources.rocketFuel) {
    const fuelCost = orbitalRate * FUEL_PER_ORBITAL * dt;
    newResources.rocketFuel = {
      ...newResources.rocketFuel,
      amount: Math.max(0, newResources.rocketFuel.amount - fuelCost),
    };
  }

  // Era 5+: colonies consume exoticMaterials (building materials for colonies)
  if (state.era >= 5 && newResources.exoticMaterials?.unlocked && newResources.colonies?.unlocked) {
    const colonyRate = ((newResources.colonies.baseRate + newResources.colonies.rateAdd) * newResources.colonies.rateMult * state.prestigeMultiplier);
    if (colonyRate > 0) {
      const consumed = colonyRate * 0.2 * dt;
      newResources.exoticMaterials = { ...newResources.exoticMaterials, amount: Math.max(0, newResources.exoticMaterials.amount - consumed) };
    }
  }

  // Era 7+: megastructures consume stellarForge output
  if (state.era >= 7 && newResources.stellarForge?.unlocked && newResources.megastructures?.unlocked) {
    const megaRate = ((newResources.megastructures.baseRate + newResources.megastructures.rateAdd) * newResources.megastructures.rateMult * state.prestigeMultiplier);
    if (megaRate > 0) {
      const consumed = megaRate * 0.3 * dt;
      newResources.stellarForge = { ...newResources.stellarForge, amount: Math.max(0, newResources.stellarForge.amount - consumed) };
    }
  }

  let newState = {
    ...state,
    resources: newResources,
    totalTicks: state.totalTicks + 1,
    totalTime: state.totalTime + dt,
  };

  // Expire timed effects
  newState = expireEffects(newState);

  // Check weave combo reset (120s inactivity)
  newState = checkComboReset(newState);

  // Random events (Era 3+)
  const { state: afterEvent, event } = checkForEvent(newState, dt);
  if (event) {
    newState = {
      ...afterEvent,
      eventLog: [...(afterEvent.eventLog || []), {
        message: `${event.name}: ${event.description}`,
        time: afterEvent.totalTime,
        ...(event.isLore ? { isLore: true } : {}),
      }].slice(-20),
    };
  } else {
    newState = afterEvent;
  }

  // Auto-mine (prestige upgrade)
  if (newState.prestigeUpgrades && newState.prestigeUpgrades.autoClicker) {
    const autoMineTimer = (newState.autoMineTimer || 0) + dt;
    if (autoMineTimer >= 1) {
      const { state: minedState, foundGem } = mine(newState);
      newState = {
        ...minedState,
        autoMineTimer: autoMineTimer - 1,
        totalGems: foundGem ? (minedState.totalGems || 0) + 1 : (minedState.totalGems || 0),
      };
    } else {
      newState = { ...newState, autoMineTimer };
    }
  }

  // Track total production for stats
  {
    let totalProduced = newState.totalResourcesProduced || 0;
    const totalRate = Object.entries(rates).reduce((sum, [id, rate]) => {
      return sum + (rate > 0 && newState.resources[id]?.unlocked ? rate : 0);
    }, 0);
    totalProduced += totalRate * dt;
    // Track peak production rate (every 30 ticks to reduce overhead)
    const peakRate = newState.totalTicks % 30 === 0
      ? Math.max(newState.peakProductionRate || 0, totalRate)
      : (newState.peakProductionRate || 0);
    newState = { ...newState, totalResourcesProduced: totalProduced, peakProductionRate: peakRate };
  }

  // Check for era transition
  const nextEra = checkEraTransition(newState);
  if (nextEra !== null) {
    const eraLabels = { 2: 'Industrialization', 3: 'Digital Age', 4: 'Space Age', 5: 'Solar System', 6: 'Interstellar', 7: 'Dyson Era', 8: 'Galactic', 9: 'Intergalactic', 10: 'Multiverse' };
    newState = transitionEra(newState, nextEra);
    newState = {
      ...newState,
      eventLog: [...(newState.eventLog || []), {
        message: `ERA ${nextEra}: ${eraLabels[nextEra] || 'Unknown'} — New resources and upgrades unlocked!`,
        time: newState.totalTime,
      }].slice(-20),
    };
  }

  // Auto-purchase earlier era upgrades when in era 5+
  if (newState.era >= 5 && newState.totalTicks % 60 === 0) {
    const autoPurchaseEra = Math.max(1, newState.era - 3); // Auto-buy eras 1-2 when in era 5, 1-3 when in era 6, etc.
    for (const def of Object.values(upgradeDefs)) {
      if (def.era > autoPurchaseEra) continue;
      if (def.repeatable) continue;
      if (newState.upgrades[def.id]) continue;
      // Check prerequisites
      if (def.prerequisites.some(p => !newState.upgrades[p])) continue;
      // Check affordability using getUpgradeCost
      const cost = getUpgradeCost(newState, def.id);
      if (!cost) continue;
      const result = purchaseUpgrade(newState, def.id);
      if (result) {
        newState = result;
        break; // One per tick to avoid lag
      }
    }
  }

  // Auto-gather (prestige milestone: 3+ prestiges)
  if (newState.autoGather && newState.totalTicks % 20 === 0) {
    // Gather each unlocked resource once
    for (const [id, r] of Object.entries(newState.resources)) {
      if (r.unlocked) {
        newState = gather(newState, id, 1);
      }
    }
  }

  // Check achievements (every 60 ticks to reduce overhead)
  if (newState.totalTicks % 60 === 0) {
    const { state: afterAchievements, newAchievements } = checkAchievements(newState);
    if (newAchievements.length > 0) {
      newState = {
        ...afterAchievements,
        eventLog: [
          ...(afterAchievements.eventLog || []),
          ...newAchievements.map(a => ({
            message: `Achievement: ${a.name} — ${a.description} (+${a.reward} prestige pts)`,
            time: afterAchievements.totalTime,
          })),
        ].slice(-20),
      };
    } else {
      newState = afterAchievements;
    }
  }

  // Check game completion
  if (!newState.gameComplete && newState.era >= 10 &&
      newState.upgrades?.recursionScar && newState.upgrades?.finalIteration &&
      Object.keys(newState.prestigeUpgrades || {}).length >= 25) {
    newState = {
      ...newState,
      gameComplete: true,
      eventLog: [...(newState.eventLog || []), {
        message: 'THE FINAL TRUTH: The ruins were yours. The cycle is you. And it begins again.',
        time: newState.totalTime,
      }].slice(-20),
    };
  }

  // True Ending: purchasing eternalReturn marks the definitive completion
  if (!newState.trueEnding && newState.prestigeUpgrades?.eternalReturn) {
    newState = {
      ...newState,
      trueEnding: true,
      eventLog: [...(newState.eventLog || []), {
        message: 'TRUE ENDING: You have purchased every upgrade, unlocked every secret, and closed the loop. The cycle is complete. There is nothing left but the eternal return.',
        time: newState.totalTime,
        isLore: true,
      }].slice(-20),
    };
  }

  return newState;
}
