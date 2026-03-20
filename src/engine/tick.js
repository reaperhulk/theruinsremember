import { calculateProduction } from './resources.js';
import { checkEraTransition, transitionEra } from './eras.js';
import { checkForEvent, expireEffects, getTimedRateMultiplier } from './events.js';
import { getFactoryBonus } from './factory.js';
import { getColonyBonus } from './colonies.js';
import { getRouteBonus } from './starChart.js';
import { mine } from './mining.js';
import { checkAchievements } from './achievements.js';
import { checkComboReset } from './weaving.js';

// Resource consumption rates
const FOOD_PER_LABOR = 0.3;       // Food consumed per labor/s
const ENERGY_PER_ELECTRONICS = 0.2; // Energy consumed per electronics/s
const FUEL_PER_ORBITAL = 0.5;     // Fuel consumed per orbitalInfra/s

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

    const newAmount = r.amount + effectiveRate * dt;
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
      }].slice(-10),
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

  // Track best era times
  if (newState.bestEraTimes && newState.era > 1) {
    const currentEraTime = newState.bestEraTimes[newState.era];
    if (currentEraTime === undefined) {
      newState = {
        ...newState,
        bestEraTimes: { ...newState.bestEraTimes, [newState.era]: newState.totalTime },
      };
    }
  }

  // Check for era transition
  const nextEra = checkEraTransition(newState);
  if (nextEra !== null) {
    newState = transitionEra(newState, nextEra);
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
        ].slice(-10),
      };
    } else {
      newState = afterAchievements;
    }
  }

  return newState;
}
