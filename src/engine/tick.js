import { recordChapter } from './memory.js';
import { advanceCommissions } from './commissions.js';
import { advancePublicWorks } from './publicWorks.js';
import { advanceBlueprint } from './blueprints.js';
import { advanceGoal, preservesGoalReserve } from './goals.js';
import { recordHistory } from './archive.js';
import { calculateEconomy } from './economy.js';
import { getEffectiveCap, gather, isGatheringAutomated } from './resources.js';
import { checkEraTransition, transitionEra, needsEraReview } from './eras.js';
import { checkForEvent, expireEffects } from './events.js';
import { advanceColonyMandate } from './colonies.js';
import { advanceDockingContracts } from './docking.js';
import { advanceNetworkPlan } from './starChart.js';
import { checkAchievements } from './achievements.js';
import { purchaseUpgrade, buyRoutineBuildOut, isDecisionUpgrade, getUpgradeCost } from './upgrades.js';
import { upgrades as upgradeDefs } from '../data/upgrades.js';
import { advanceExpeditionSupplies, EXPEDITION_MAX_SUPPLIES, getExpeditionRoutes, runExpedition } from './expeditions.js';
import { awardCycleGoal } from './cycles.js';
import { advanceEchoPressure } from './relics.js';
import { advanceForgetting, pauseForgetting } from './forgetting.js';
import { researchRoutineTech } from './tech.js';
import { advanceTradeRoute } from './trading.js';

function intervalCrossings(startTime, endTime, interval) {
  return Math.max(0, Math.floor(endTime / interval) - Math.floor(startTime / interval));
}

// Core game loop: advance state by dt seconds.
// Optional rng parameter for deterministic bot/testing runs.
export function tick(state, dt, rng = Math.random, options = {}) {
  if (dt <= 0) return state; // Guard against negative or zero dt
  state = recordChapter(expireEffects(state));
  const economy = calculateEconomy(state, dt);
  const rates = economy.gross;
  const newResources = Object.fromEntries(Object.entries(state.resources).map(([id, resource]) => [
    id, { ...resource, amount: economy.amounts[id] },
  ]));

  let newState = {
    ...state,
    resources: newResources,
    totalTicks: state.totalTicks + 1,
    totalTime: state.totalTime + dt,
  };
  newState = advancePublicWorks(newState, economy);

  newState = advanceExpeditionSupplies(newState, dt);
  newState = advanceEchoPressure(newState, dt, rng);
  {
    const wasCollapsed = newState.forgetting?.collapsed;
    newState = options.pauseForgetting || !newState.forgettingChallengeActive
      ? pauseForgetting(newState, dt)
      : advanceForgetting(newState, dt, rng);
    if (!wasCollapsed && newState.forgetting?.collapsed) {
      newState = {
        ...newState,
        eventLog: [...(newState.eventLog || []), {
          message: 'THE FORGETTING: The last memory dims. The cycle claims this civilization.',
          time: newState.totalTime,
          isLore: true,
        }].slice(-20),
      };
    }
    // A lost optional challenge never resets a civilization. The player can
    // retreat, restore the memories, or close the cycle on their own terms.
  }
  if (newState.era <= 3 && newState.prestigeUpgrades?.autoClicker && newState.expedition?.supplies >= EXPEDITION_MAX_SUPPLIES) {
    const safeRoute = getExpeditionRoutes(newState.era)[0];
    newState = runExpedition(newState, safeRoute.id, rng).state;
  }

  const eventResult = checkForEvent(newState, dt, rng());
  newState = eventResult.state;
  if (eventResult.event) {
    const ev = eventResult.event;
    newState = {
      ...newState,
      eventLog: [...(newState.eventLog || []), {
        message: `Event: ${ev.name} — ${ev.description}`,
        time: newState.totalTime,
        isLore: !!ev.isLore,
      }].slice(-20),
    };
  }

  // Milestone lore events — fire once at narrative turning points
  {
    const fired = state.firedMilestoneLore || {};
    const newFired = { ...fired };
    const loreEntries = [];
    if (!fired.era3 && state.era >= 3) {
      newFired.era3 = true;
      loreEntries.push({ message: 'A data core surfaces from the ruins — still powered after eons. The file structure is hauntingly familiar. Someone built this for you to find.', time: newState.totalTime, isLore: true });
    }
    if (!fired.prestige1 && (state.prestigeCount || 0) >= 1) {
      newFired.prestige1 = true;
      loreEntries.push({ message: 'The cycle turns. You remember now — not what was lost, but what was always here, waiting. The ruins recognize the pattern.', time: newState.totalTime, isLore: true });
    }
    if (!fired.gems1000 && (state.totalGems || 0) >= 1000) {
      newFired.gems1000 = true;
      loreEntries.push({ message: 'One thousand gems recovered from the ruins. Each one a memory compressed to crystal — the weight of a civilization stored in your hands.', time: newState.totalTime, isLore: true });
    }
    if (loreEntries.length > 0) {
      newState = {
        ...newState,
        firedMilestoneLore: newFired,
        eventLog: [...(newState.eventLog || []), ...loreEntries].slice(-20),
      };
    }
  }

  // Check weave combo reset (120s inactivity)

  // Track total production for stats
  {
    let totalProduced = newState.totalResourcesProduced || 0;
    const totalRate = Object.entries(rates).reduce((sum, [id, rate]) => {
      return sum + (rate > 0 && newState.resources[id]?.unlocked ? rate : 0);
    }, 0);
    totalProduced += Object.values(economy.produced).reduce((sum, amount) => sum + amount, 0);
    // Track peak production rate (every 30 ticks to reduce overhead)
    const peakRate = intervalCrossings(state.totalTime, newState.totalTime, 30) > 0
      ? Math.max(newState.peakProductionRate || 0, totalRate)
      : (newState.peakProductionRate || 0);
    newState = { ...newState, totalResourcesProduced: totalProduced, peakProductionRate: peakRate };
  }

  // Check for era transition
  const nextEra = checkEraTransition(newState);
  if (nextEra !== null && !needsEraReview(newState)) {
    const eraLabels = { 2: 'Industrialization', 3: 'Digital Age', 4: 'Space Age', 5: 'Solar System', 6: 'Interstellar', 7: 'Dyson Era', 8: 'Galactic', 9: 'Intergalactic', 10: 'Multiverse' };
    newState = recordChapter(transitionEra(newState, nextEra));
    newState = {
      ...newState,
      eventLog: [...(newState.eventLog || []), {
        message: `ERA ${nextEra}: ${eraLabels[nextEra] || 'Unknown'} — Threshold crossed. The ruins answer with new tools, new theories, and older warnings.`,
        time: newState.totalTime,
      }].slice(-20),
    };
  }


  newState = advanceBlueprint(newState);
  newState = advanceGoal(newState);
  newState = advanceCommissions(newState);

  // Auto-purchase earlier era upgrades once a second era exists.
  // Critical for game balance: cross-era costs grow faster than caps,
  // so upgrades MUST be bought while costs are still affordable.
  // Buys ALL affordable upgrades from prior eras (not just one) to
  // prevent deep prerequisite chains from stalling progression.
  const autoPurchaseRuns = intervalCrossings(state.totalTime, newState.totalTime, 30);
  if (newState.era >= 2 && autoPurchaseRuns > 0) {
    const autoPurchaseEra = Math.max(1, newState.era - 1);
    for (let run = 0; run < autoPurchaseRuns; run++) {
      for (let pass = 0; pass < 5; pass++) { // multiple passes for chains
        let boughtAny = false;
        for (const def of Object.values(upgradeDefs)) {
          if (def.era > autoPurchaseEra) continue;
          if (def.repeatable) continue;
          if (newState.upgrades[def.id]) continue;
          if (isDecisionUpgrade(def)) continue;
          if (def.prerequisites.some(p => !newState.upgrades[p])) continue;
          if (!preservesGoalReserve(newState, getUpgradeCost(newState, def.id))) continue;
          const result = purchaseUpgrade(newState, def.id);
          if (result) { newState = result; boughtAny = true; }
        }
        if (!boughtAny) break;
      }
    }
  }

  // Routine build-out: the current era's non-decision upgrades buy themselves
  // so the Decisions tab holds decisions rather than a queue to flush. Forks,
  // rule changes, resource unlocks and lore fragments are never auto-bought.
  const buildOutInterval = newState.blueprintActive && newState.archive?.research?.blueprints && newState.era <= 3 ? 1 : 5;
  const buildOutRuns = intervalCrossings(state.totalTime, newState.totalTime, buildOutInterval);
  if (newState.autoBuildOut !== false && buildOutRuns > 0) {
    for (let run = 0; run < buildOutRuns; run++) {
      const result = buyRoutineBuildOut(newState);
      if (result.count === 0) break;
      newState = result.state;
    }
    if (newState.era >= 2) {
      newState = researchRoutineTech(newState).state;
    }
  }

  if (newState.era >= 5) {
    newState = advanceColonyMandate(newState);
    newState = advanceDockingContracts(newState);
  }
  if (newState.era >= 4) {
    newState = advanceTradeRoute(newState, state.totalTime);
  }

  // Auto-gather: manual gathering is a launch-phase activity. Orbital
  // robotics take over from Era 4; the 3-prestige milestone extends the
  // automation back to planetfall on later cycles.
  const autoGatherInterval = newState.era < 4 && !newState.autoGather ? 5 : 20;
  const autoGatherRuns = intervalCrossings(state.totalTime, newState.totalTime, autoGatherInterval);
  if (isGatheringAutomated(newState) && autoGatherRuns > 0) {
    for (let run = 0; run < autoGatherRuns; run++) {
      for (const [id, r] of Object.entries(newState.resources)) {
        if (r.unlocked) {
          newState = gather(newState, id, 1, rng);
        }
      }
    }
  }

  // Automatic harvesting belongs to simulation, so mounting a canvas or
  // switching tabs cannot change production. Manual discoveries stay optional.
  if (newState.upgrades.stellarHarvester) {
    const runs = intervalCrossings(state.totalTime, newState.totalTime, 30);
    for (let run = 1; run <= runs; run++) {
      const id = ['research', 'energy', 'software'][(Math.floor(state.totalTime / 30) + run) % 3];
      const resource = newState.resources[id];
      if (!resource?.unlocked) continue;
      const cap = getEffectiveCap(newState, id);
      newState = { ...newState, resources: { ...newState.resources, [id]: { ...resource, amount: Math.min(Math.max(cap, resource.amount), resource.amount + economy.gross[id] * 4) } } };
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
            const transfer = Math.min(overflow, overflow * 0.05 * dt);
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

  // Overflow is derived from actual production after consumption and storage.
  if (newState.upgrades?.resourcePipeline && newState.resources.research?.unlocked) {
    const overflow = Object.entries(economy.overflow).reduce((sum, [id, value]) => sum + (id === 'research' ? 0 : value * 0.1), 0);
    const research = newState.resources.research;
    const cap = getEffectiveCap(newState, 'research');
    if (overflow > 0) newState = { ...newState, resources: { ...newState.resources,
      research: { ...research, amount: Math.min(Math.max(cap, research.amount), research.amount + overflow) },
    } };
  }

  // Network plan survey crews lay committed routes on their own schedule
  newState = advanceNetworkPlan(newState, state.totalTime);

  // Dyson auto-assembly: every 60 ticks, auto-add segments based on existing count
  // Auto-rate scales with segments (1 per 10 segments, up to 20/tick)
  const dysonRuns = intervalCrossings(state.totalTime, newState.totalTime, 60);
  if (newState.era >= 7 && (newState.dysonSegments || 0) > 0 && dysonRuns > 0 &&
      !newState.forgetting?.scars?.['dyson:assembly']) {
    for (let run = 0; run < dysonRuns; run++) {
      const autoRate = Math.max(1, Math.min(20, Math.floor((newState.dysonSegments || 0) / 10)));
      newState = { ...newState, dysonSegments: (newState.dysonSegments || 0) + autoRate };
    }
  }

  // Check achievements (every 60 ticks to reduce overhead)
  newState = awardCycleGoal(newState);

  if (intervalCrossings(state.totalTime, newState.totalTime, 60) > 0) {
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

  // Echo Mode accumulation (NG+): echo resource fills at rate = prestige multiplier/s
  if (newState.trueEnding && newState.echoMode) {
    const echoRate = Math.max(1, Math.floor(newState.prestigeMultiplier || 1));
    const echoMult = newState.echoUpgrades?.echoMultiplier ? 2 : 1;
    newState = { ...newState, echoResource: (newState.echoResource || 0) + echoRate * echoMult * dt };
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

  return recordHistory(newState, newState.eventLog || []);
}
