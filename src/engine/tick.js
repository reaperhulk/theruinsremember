import { calculateProduction, getEffectiveCap, gather, getEffectivePrestige } from './resources.js';
import { checkEraTransition, transitionEra } from './eras.js';
import { checkForEvent, expireEffects, getTimedRateMultiplier } from './events.js';
import { getFactoryBonus } from './factory.js';
import { getColonyBonus } from './colonies.js';
import { getRouteBonus } from './starChart.js';
import { mine } from './mining.js';
import { checkAchievements } from './achievements.js';
import { checkComboReset } from './weaving.js';
import { purchaseUpgrade } from './upgrades.js';
import { upgrades as upgradeDefs } from '../data/upgrades.js';

// Resource consumption rates — moderate tension without breaking non-minigame paths
const FOOD_PER_LABOR = 1.0;       // Food consumed per labor/s
const ENERGY_PER_ELECTRONICS = 0.4; // Energy consumed per electronics/s
const FUEL_PER_ORBITAL = 0.7;     // Fuel consumed per orbitalInfra/s

// Apply a fractional production bonus to all producing resources, respecting caps
function applyProductionBonus(state, fraction, dt) {
  let updated = state;
  const prestigeMult = getEffectivePrestige(updated.prestigeMultiplier || 1);
  for (const [id, r] of Object.entries(updated.resources)) {
    if (r.unlocked && (r.baseRate + r.rateAdd) > 0) {
      const rate = (r.baseRate + r.rateAdd) * r.rateMult * prestigeMult;
      const bonus = rate * fraction * dt;
      const cap = getEffectiveCap(updated, id);
      const newAmount = Math.min(r.amount + bonus, cap > 0 ? cap : Infinity);
      updated = { ...updated, resources: { ...updated.resources, [id]: { ...r, amount: newAmount } } };
    }
  }
  return updated;
}

// Core game loop: advance state by dt seconds.
// Optional rng parameter for deterministic bot/testing runs.
export function tick(state, dt, rng = Math.random) {
  if (dt <= 0) return state; // Guard against negative or zero dt
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

  // Consumption throttling: when the consumed resource runs low,
  // throttle the consuming resource's production proportionally.
  // This prevents resources from producing at full rate when their
  // input resource is depleted (consistent across all 5 chains).

  // Chain 1: food → labor
  const laborRate = rates.labor || 0;
  const foodCost = laborRate * FOOD_PER_LABOR * dt;
  const foodAvailable = state.resources.food?.amount || 0;
  const foodLimited = foodCost > 0 && foodAvailable < foodCost;
  const laborScale = foodLimited ? foodAvailable / foodCost : 1;

  // Chain 2: energy → electronics
  const electronicsRate = rates.electronics || 0;
  const energyCostTotal = electronicsRate * ENERGY_PER_ELECTRONICS * dt;
  const energyAvailable = state.resources.energy?.amount || 0;
  const energyLimited = energyCostTotal > 0 && energyAvailable < energyCostTotal;
  const electronicsScale = energyLimited ? energyAvailable / energyCostTotal : 1;

  // Chain 3: rocketFuel → orbitalInfra
  const orbitalRate = rates.orbitalInfra || 0;
  const fuelCostTotal = orbitalRate * FUEL_PER_ORBITAL * dt;
  const fuelAvailable = state.resources.rocketFuel?.amount || 0;
  const fuelLimited = fuelCostTotal > 0 && fuelAvailable < fuelCostTotal;
  const orbitalScale = fuelLimited ? fuelAvailable / fuelCostTotal : 1;

  // Chain 4: exoticMaterials → colonies (Era 5+)
  const colonyProdRate = rates.colonies || 0;
  const exoticCostTotal = colonyProdRate * 0.2 * dt;
  const exoticAvailable = state.resources.exoticMaterials?.amount || 0;
  const exoticLimited = state.era >= 5 && exoticCostTotal > 0 && exoticAvailable < exoticCostTotal;
  const colonyScale = exoticLimited ? exoticAvailable / exoticCostTotal : 1;

  // Chain 5: stellarForge → megastructures (Era 7+)
  const megaProdRate = rates.megastructures || 0;
  const forgeCostTotal = megaProdRate * 0.3 * dt;
  const forgeAvailable = state.resources.stellarForge?.amount || 0;
  const forgeLimited = state.era >= 7 && forgeCostTotal > 0 && forgeAvailable < forgeCostTotal;
  const megaScale = forgeLimited ? forgeAvailable / forgeCostTotal : 1;

  // Advance resources (apply timed event multipliers)
  const newResources = { ...state.resources };
  for (const [id, rate] of Object.entries(rates)) {
    if (rate === 0) continue;
    const r = newResources[id];
    if (!r || !r.unlocked) continue;

    let effectiveRate = rate;
    if (id === 'labor') effectiveRate = rate * laborScale;
    if (id === 'electronics') effectiveRate = rate * electronicsScale;
    if (id === 'orbitalInfra') effectiveRate = rate * orbitalScale;
    if (id === 'colonies') effectiveRate = rate * colonyScale;
    if (id === 'megastructures') effectiveRate = rate * megaScale;

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
  if (electronicsRate > 0 && newResources.energy) {
    const energyCost = electronicsRate * electronicsScale * ENERGY_PER_ELECTRONICS * dt;
    newResources.energy = {
      ...newResources.energy,
      amount: Math.max(0, newResources.energy.amount - energyCost),
    };
  }

  // Deduct fuel consumed by orbital infra production (Era 4+)
  if (orbitalRate > 0 && newResources.rocketFuel) {
    const fuelCost = orbitalRate * orbitalScale * FUEL_PER_ORBITAL * dt;
    newResources.rocketFuel = {
      ...newResources.rocketFuel,
      amount: Math.max(0, newResources.rocketFuel.amount - fuelCost),
    };
  }

  // Era 5+: colonies consume exoticMaterials
  if (state.era >= 5 && newResources.exoticMaterials?.unlocked && newResources.colonies?.unlocked) {
    if (colonyProdRate > 0) {
      const consumed = colonyProdRate * colonyScale * 0.2 * dt;
      newResources.exoticMaterials = { ...newResources.exoticMaterials, amount: Math.max(0, newResources.exoticMaterials.amount - consumed) };
    }
  }

  // Era 7+: megastructures consume stellarForge output
  if (state.era >= 7 && newResources.stellarForge?.unlocked && newResources.megastructures?.unlocked) {
    if (megaProdRate > 0) {
      const consumed = megaProdRate * megaScale * 0.3 * dt;
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
  const { state: afterEvent, event } = checkForEvent(newState, dt, rng());
  if (event) {
    // Skip lore events already seen this run
    if (event.isLore && afterEvent.seenLoreEvents?.[event.id]) {
      newState = afterEvent;
    } else {
      newState = {
        ...afterEvent,
        eventLog: [...(afterEvent.eventLog || []), {
          message: `${event.name}: ${event.description}`,
          time: afterEvent.totalTime,
          ...(event.isLore ? { isLore: true } : {}),
        }].slice(-20),
      };
      // Track lore events so they only fire once per run
      if (event.isLore) {
        newState.seenLoreEvents = { ...(newState.seenLoreEvents || {}), [event.id]: true };
      }
    }
  } else {
    newState = afterEvent;
  }

  // Auto-mine (prestige upgrade)
  if (newState.prestigeUpgrades && newState.prestigeUpgrades.autoClicker) {
    const autoMineTimer = (newState.autoMineTimer || 0) + dt;
    if (autoMineTimer >= 1) {
      const { state: minedState, foundGem } = mine(newState, rng(), { skipCooldown: true });
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


  // Auto-purchase earlier era upgrades when in era 3+.
  // Critical for game balance: cross-era costs grow faster than caps,
  // so upgrades MUST be bought while costs are still affordable.
  if (newState.era >= 3 && newState.totalTicks % 30 === 0) {
    const autoPurchaseEra = Math.max(1, newState.era - 1);
    for (const def of Object.values(upgradeDefs)) {
      if (def.era > autoPurchaseEra) continue;
      if (def.repeatable) continue;
      if (newState.upgrades[def.id]) continue;
      if (def.prerequisites.some(p => !newState.upgrades[p])) continue;
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

  // Mechanic: surplusConvert — resources at cap trickle to lowest resource
  if (newState.upgrades?.surplusExchange) {
    const unlocked = Object.entries(newState.resources).filter(([, r]) => r.unlocked);
    const lowest = unlocked.reduce((min, [id, r]) => {
      const cap = getEffectiveCap(newState, id);
      const pct = cap > 0 ? r.amount / cap : 1;
      return pct < min.pct ? { id, pct } : min;
    }, { id: null, pct: 1 });

    if (lowest.id) {
      let converted = 0;
      for (const [id, r] of unlocked) {
        const cap = getEffectiveCap(newState, id);
        if (cap > 0 && r.amount >= cap * 0.95 && id !== lowest.id) {
          const overflow = r.amount - cap * 0.9;
          if (overflow > 0) {
            const transfer = overflow * 0.05 * dt;
            newState = { ...newState, resources: { ...newState.resources, [id]: { ...newState.resources[id], amount: newState.resources[id].amount - transfer } } };
            converted += transfer;
          }
        }
      }
      if (converted > 0) {
        const lr = newState.resources[lowest.id];
        newState = { ...newState, resources: { ...newState.resources, [lowest.id]: { ...lr, amount: lr.amount + converted * 0.5 } } };
      }
    }
  }

  // Mechanic: upgradeCountBonus — +1% production per upgrade owned
  if (newState.upgrades?.communalEffort) {
    const upgradeCount = Object.keys(newState.upgrades).length;
    const maxBonus = 0.5 + (newState.prestigeCount || 0) * 0.05; // scales with prestige
    const bonusFraction = Math.min(maxBonus, upgradeCount * 0.005);
    newState = applyProductionBonus(newState, bonusFraction, dt);
  }

  // Mechanic: productionPulse — double production for 10s every 60s
  if (newState.upgrades?.overclockProtocol) {
    const cyclePos = (newState.totalTime || 0) % 60;
    if (cyclePos < 10) {
      newState = applyProductionBonus(newState, 1, dt);
    }
  }

  // Mechanic: capOverflow — capped resources overflow to research
  if (newState.upgrades?.resourcePipeline && newState.resources.research?.unlocked) {
    let totalOverflow = 0;
    for (const [id, r] of Object.entries(newState.resources)) {
      if (id === 'research' || !r.unlocked) continue;
      const cap = getEffectiveCap(newState, id);
      if (cap > 0 && r.amount >= cap) {
        const rate = (r.baseRate + r.rateAdd) * r.rateMult * getEffectivePrestige(newState.prestigeMultiplier || 1);
        totalOverflow += rate * dt * 0.1;
      }
    }
    if (totalOverflow > 0) {
      const rr = newState.resources.research;
      const rCap = getEffectiveCap(newState, 'research');
      newState = { ...newState, resources: { ...newState.resources, research: { ...rr, amount: Math.min(rr.amount + totalOverflow, rCap > 0 ? rCap : Infinity) } } };
    }
  }

  // Mechanic: eraCompounding — each era multiplies production by 1.1x
  if (newState.upgrades?.recursiveOptimizer) {
    const eraBonus = Math.pow(1.1, (newState.era || 1) - 1);
    if (eraBonus > 1) {
      newState = applyProductionBonus(newState, eraBonus - 1, dt);
    }
  }

  // miniGameSynergy: +10% per mini-game interacted with
  if (newState.upgrades?.orbitalResonance) {
    let miniCount = 0;
    if ((newState.totalGems || 0) > 0) miniCount++;
    if ((newState.factoryAllocation?.steel || 0) > 0 || (newState.factoryAllocation?.electronics || 0) > 0) miniCount++;
    if ((newState.hackSuccesses || 0) > 0) miniCount++;
    if ((newState.dockingAttempts || 0) > 0) miniCount++;
    if ((newState.colonyAssignments?.growth || 0) > 0 || (newState.colonyAssignments?.science || 0) > 0) miniCount++;
    if ((newState.starRoutes?.length || 0) > 0) miniCount++;
    if ((newState.totalWeaves || 0) > 0) miniCount++;

    if (miniCount > 0) {
      newState = applyProductionBonus(newState, miniCount * 0.10, dt);
    }
  }

  // routeBonus: +3% per star route
  if (newState.upgrades?.warpEcho) {
    const routes = newState.starRoutes?.length || 0;
    if (routes > 0) {
      newState = applyProductionBonus(newState, routes * 0.03, dt);
    }
  }

  // Mechanic: prestigeAccumulator — +5% production per prestige run completed
  if (newState.upgrades?.galacticMemory) {
    const prestigeBonus = (newState.prestigeCount || 0) * 0.05;
    if (prestigeBonus > 0) {
      newState = applyProductionBonus(newState, prestigeBonus, dt);
    }
  }

  // Mechanic: diversityBonus — 1.05^count multiplier per unlocked resource type
  if (newState.upgrades?.echoMultiplier) {
    const unlockedCount = Object.values(newState.resources).filter(r => r.unlocked).length;
    const diversityMult = Math.pow(1.05, unlockedCount) - 1;
    if (diversityMult > 0) {
      newState = applyProductionBonus(newState, diversityMult, dt);
    }
  }

  // Mechanic: compoundingTick — production compounds slightly each tick
  if (newState.upgrades?.infiniteLoop) {
    newState = applyProductionBonus(newState, 0.001, dt);
  }

  // Dyson auto-assembly: every 60 ticks, auto-add segments based on existing count
  // Auto-rate scales with segments (1 per 10 segments, up to 20/tick)
  if (newState.era >= 7 && (newState.dysonSegments || 0) > 0 && newState.totalTicks % 60 === 0) {
    const autoRate = Math.max(1, Math.min(20, Math.floor((newState.dysonSegments || 0) / 10)));
    if (autoRate > 0) {
      newState = { ...newState, dysonSegments: (newState.dysonSegments || 0) + autoRate };
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
            message: `Achievement: ${a.name} — ${a.description}`,
            time: afterAchievements.totalTime,
          })),
        ].slice(-20),
      };
    } else {
      newState = afterAchievements;
    }
  }

  // Check game completion — must match achievement condition in achievements.js
  if (!newState.gameComplete && newState.era >= 10 &&
      newState.upgrades?.recursionScar && newState.upgrades?.finalIteration &&
      newState.upgrades?.multiverseCapstone &&
      Object.keys(newState.prestigeUpgrades || {}).length >= 25 &&
      (newState.prestigeCount || 0) >= 1) {
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
