#!/usr/bin/env node
/* global process */
// Bot Playtest CLI — configurable game balance testing tool.
// Usage: node scripts/bot-playtest.js [options]
// Zero external dependencies. Run --help for full usage.

import { createInitialState } from '../src/engine/state.js';
import { tick } from '../src/engine/tick.js';
import { purchaseUpgrade, getAvailableUpgrades, getUpgradeCost, buyMaxRepeatable } from '../src/engine/upgrades.js';
import { unlockTech, getAvailableTech } from '../src/engine/tech.js';
import { canAfford, gather, getEffectiveRate, getNetRate } from '../src/engine/resources.js';
import { attemptDock, getDockingInfo, getTargetZone, selectDockingMission } from '../src/engine/docking.js';
import { assignColonies, getAssignableColonies, getColonyBonus } from '../src/engine/colonies.js';
import { getRouteBonus, selectNetworkPlan } from '../src/engine/starChart.js';
import { getWeaveProductionMultiplier, getWeavingStats, weaveRealityLaw } from '../src/engine/weaving.js';
import { executeTrade, getTradeRatio } from '../src/engine/trading.js';
import { commissionDysonModule, getDysonStats } from '../src/engine/dyson.js';
import { getTuningProductionMultiplier, getTuningStats, lockCosmicSignal } from '../src/engine/tuning.js';
import { getExpeditionRoutes, runExpedition } from '../src/engine/expeditions.js';
import { getEraReadiness } from '../src/engine/eras.js';
import { forgeRealityKey, getCycleReadiness, getRealityForgeRecipes } from '../src/engine/realityForge.js';
import { countSenateActs, enactSenatePolicy, getSenateGovernmentMultiplier, getSenatePctBonuses, getSenateStats } from '../src/engine/senate.js';
import { selectNextCycleDoctrine } from '../src/engine/cycles.js';
import { claimRelic, declineRelicOffer } from '../src/engine/relics.js';
import { performPrestige, calculatePrestigeBonus, calculatePrestigePoints, purchasePrestigeUpgrade, getPrestigeShop } from '../src/engine/prestige.js';
import { readFileSync } from 'fs';

// ─── Mulberry32 PRNG ────────────────────────────────────────────────────────
function mulberry32(seed) {
  let s = seed | 0;
  return function () {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── CLI Argument Parsing ───────────────────────────────────────────────────
function parseArgs(argv) {
  const args = {
    scenario: 'full',
    profile: 'optimal',
    maxTime: 14400,
    targetEra: 10,
    prestige: 0,
    prestigeAtEra: 7,
    json: false,
    verbose: false,
    quiet: false,
    compare: null,
    assertBalance: false,
    seed: null,
    snapshotInterval: 300,
    listScenarios: false,
    listProfiles: false,
    help: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next = argv[i + 1];
    switch (arg) {
      case '--scenario': args.scenario = next; i++; break;
      case '--profile': args.profile = next; i++; break;
      case '--max-time': args.maxTime = Number(next); i++; break;
      case '--target-era': args.targetEra = Number(next); i++; break;
      case '--prestige': args.prestige = Number(next); i++; break;
      case '--prestige-at-era': args.prestigeAtEra = Number(next); i++; break;
      case '--json': args.json = true; break;
      case '--verbose': args.verbose = true; break;
      case '--quiet': args.quiet = true; break;
      case '--compare': args.compare = next; i++; break;
      case '--assert-balance': args.assertBalance = true; break;
      case '--seed': args.seed = Number(next); i++; break;
      case '--snapshot-interval': args.snapshotInterval = Number(next); i++; break;
      case '--list-scenarios': args.listScenarios = true; break;
      case '--list-profiles': args.listProfiles = true; break;
      case '--help': case '-h': args.help = true; break;
    }
  }
  return args;
}

// ─── Profiles ───────────────────────────────────────────────────────────────
const PROFILES = {
  optimal: {
    description: 'Engage every operation and buy every viable decision. Baseline for pacing.',
    gather: true, gatherInterval: 5,
    expeditions: true, expeditionStrategy: 'deep',
    buyUpgrades: true, buyTech: true,
    docking: true, dockInterval: 3, dockAccuracy: 0,
    colonies: true, colonyStrategy: 'diversified',
    starChart: true, starChartPlan: 'longHaul',
    weaving: true, weaveInterval: 10,
    trading: true, tradeStrategy: 'bottleneck',
    dysonAssembly: true,
    cosmicTuning: true,
    senateFocus: 'balanced',
    realityForge: true,
    buyPrestigeUpgrades: true,
    prestigeUpgradeOrder: [
      'fastStart', 'luckyMiner', 'headStart', 'deepPockets',
      'hackMaster', 'dockingPro', 'factoryExpert', 'miniGameSavant',
      'tradeRoutes', 'eventMagnet', 'wisdomOfAges', 'quantumMemory',
      'cosmicInsight', 'perfectMemory', 'universalOptimizer', 'chainMaster',
      'eraMomentum', 'autoClicker', 'achievementHunter', 'temporalEcho',
      'masterWeaver', 'quantumTunneling', 'infinitePatience', 'instantKnowledge',
      'cycleMastery', 'temporalMastery', 'primordialMemory',
      'acceleratedDecay', 'cosmicAwareness', 'eternalReturn',
    ],
  },
  lowInteraction: {
    description: 'Buy upgrades and tech, gather, but skip optional operations. Tests low-interaction viability.',
    gather: true, gatherInterval: 5,
    expeditions: false, expeditionStrategy: 'safe',
    buyUpgrades: true, buyTech: true,
    docking: false, dockInterval: 3, dockAccuracy: 0,
    colonies: false, colonyStrategy: 'diversified',
    starChart: false,
    weaving: false, weaveInterval: 10,
    trading: true, tradeStrategy: 'bottleneck',
    dysonAssembly: false,
    cosmicTuning: false,
    senateFocus: null,
    realityForge: false,
    relics: false,
    buyPrestigeUpgrades: true,
    prestigeUpgradeOrder: [
      'fastStart', 'luckyMiner', 'headStart', 'deepPockets',
      'wisdomOfAges', 'quantumMemory', 'tradeRoutes', 'eventMagnet',
      'cosmicInsight', 'universalOptimizer', 'chainMaster', 'eraMomentum',
      'autoClicker',
    ],
  },
  passive: {
    description: 'Only auto-production and upgrade buying. Tests minimum viable progression.',
    gather: false, gatherInterval: 0,
    expeditions: false, expeditionStrategy: 'safe',
    buyUpgrades: true, buyTech: true,
    docking: false, dockInterval: 0, dockAccuracy: 0,
    colonies: false, colonyStrategy: 'diversified',
    starChart: false,
    weaving: false, weaveInterval: 0,
    trading: false, tradeStrategy: 'bottleneck',
    dysonAssembly: false,
    cosmicTuning: false,
    senateFocus: null,
    realityForge: false,
    relics: false,
    buyPrestigeUpgrades: true,
    prestigeUpgradeOrder: [
      'fastStart', 'headStart', 'deepPockets', 'wisdomOfAges',
      'quantumMemory', 'cosmicInsight', 'eraMomentum',
    ],
  },
  clickerOnly: {
    description: 'Gather every tick, but skip operations. Tests: how far can manual resource clicks carry you?',
    gather: true, gatherInterval: 1,
    expeditions: false, expeditionStrategy: 'safe',
    buyUpgrades: true, buyTech: true,
    docking: false, dockInterval: 0, dockAccuracy: 0,
    colonies: false, colonyStrategy: 'diversified',
    starChart: false,
    weaving: false, weaveInterval: 0,
    trading: false, tradeStrategy: 'bottleneck',
    dysonAssembly: false,
    cosmicTuning: false,
    senateFocus: null,
    realityForge: false,
    relics: false,
    buyPrestigeUpgrades: true,
    prestigeUpgradeOrder: [
      'fastStart', 'luckyMiner', 'headStart', 'deepPockets',
      'wisdomOfAges', 'quantumMemory', 'autoClicker',
    ],
  },
  tradingHeavy: {
    description: 'All systems + aggressive trading of surplus into bottleneck resources. Tests: trading impact.',
    gather: true, gatherInterval: 5,
    expeditions: true, expeditionStrategy: 'deep',
    buyUpgrades: true, buyTech: true,
    docking: true, dockInterval: 3, dockAccuracy: 0,
    colonies: true, colonyStrategy: 'diversified',
    starChart: true, starChartPlan: 'surveyLattice',
    weaving: true, weaveInterval: 10,
    trading: true, tradeStrategy: 'aggressive',
    dysonAssembly: true,
    cosmicTuning: true,
    senateFocus: 'balanced',
    realityForge: true,
    buyPrestigeUpgrades: true,
    prestigeUpgradeOrder: [
      'fastStart', 'luckyMiner', 'headStart', 'tradeRoutes',
      'deepPockets', 'hackMaster', 'dockingPro', 'factoryExpert',
      'miniGameSavant', 'eventMagnet', 'wisdomOfAges', 'quantumMemory',
      'cosmicInsight', 'perfectMemory', 'universalOptimizer', 'chainMaster',
      'eraMomentum', 'autoClicker', 'achievementHunter', 'temporalEcho',
      'masterWeaver', 'quantumTunneling', 'infinitePatience', 'instantKnowledge',
      'cycleMastery',
    ],
  },
  casual: {
    description: 'Simulates a regular player: gathers infrequently, misses docks, and skips some operations.',
    gather: true, gatherInterval: 15,
    expeditions: true, expeditionStrategy: 'measured',
    buyUpgrades: true, buyTech: true,
    docking: true, dockInterval: 5, dockAccuracy: 0.15,
    colonies: true, colonyStrategy: 'growth',
    starChart: true, starChartPlan: 'coreWeb',
    weaving: false, weaveInterval: 0,
    trading: false, tradeStrategy: 'bottleneck',
    dysonAssembly: true,
    cosmicTuning: true,
    senateFocus: 'merchants',
    realityForge: true,
    buyPrestigeUpgrades: true,
    prestigeUpgradeOrder: [
      'fastStart', 'luckyMiner', 'headStart', 'deepPockets',
      'autoClicker', 'factoryExpert', 'dockingPro', 'hackMaster',
      'wisdomOfAges', 'quantumMemory', 'cosmicInsight',
    ],
  },
};

// ─── Built-in Scenarios ─────────────────────────────────────────────────────
const SCENARIOS = {
  full:         { profile: 'optimal',      prestige: 0,  targetEra: 10, maxTime: 14400, purpose: 'Standard pacing baseline' },
  speedrun:     { profile: 'optimal',      prestige: 0,  targetEra: 10, maxTime: 7200,  purpose: 'Optimal time-to-completion' },
  prestige3:    { profile: 'optimal',      prestige: 3,  targetEra: 10, maxTime: 28800, purpose: 'Prestige loop balance' },
  prestige10:   { profile: 'optimal',      prestige: 10, targetEra: 10, maxTime: 86400, purpose: 'Prestige stress test' },
  lowInteraction:  { profile: 'lowInteraction',  prestige: 0,  targetEra: 10, maxTime: 28800, purpose: 'Optional operation viability' },
  passive:      { profile: 'passive',      prestige: 0,  targetEra: 10, maxTime: 43200, purpose: 'Minimum viable progression' },
  clickerOnly:  { profile: 'clickerOnly',  prestige: 0,  targetEra: 10, maxTime: 28800, purpose: 'Click-only viability' },
  regression:   { profile: 'optimal',      prestige: 0,  targetEra: 5,  maxTime: 1800,  purpose: 'Quick pacing sanity check' },
  earlyGame:    { profile: 'optimal',      prestige: 0,  targetEra: 3,  maxTime: 900,   purpose: 'Era 1-3 pacing detail' },
  lateGame:     { profile: 'optimal',      prestige: 2,  targetEra: 10, maxTime: 14400, prestigeAtEra: 7, purpose: 'Late-game with prestige' },
  casual:       { profile: 'casual',       prestige: 0,  targetEra: 10, maxTime: 28800, purpose: 'Standard casual player experience' },
};

const BALANCE_TARGETS = {
  full: {
    minTime: 720,
    maxTime: 1800,
    requiredEra: 10,
    cycleReady: true,
    maxFirstOperationLatency: 60,
    maxIgnoredOperations: 0,
    maxFirstRelicTime: 600,
    minRelics: 2,
    maxDockingAttempts: 30,
    maxDysonCommissions: 3,
    maxRealityLaws: 3,
    maxTuningLocks: 3,
    maxSenateActs: 3,
    maxStarChartActions: 2,
    eraRanges: {
      2: [90, 240],
      3: [90, 300],
      4: [5, 180],
      5: [25, 180],
      6: [15, 120],
      7: [15, 120],
      8: [120, 240],
      9: [60, 180],
      10: [90, 180],
    },
  },
  casual: { minTime: 1500, maxTime: 14400, requiredEra: 10, cycleReady: true, maxFirstOperationLatency: 180, maxIgnoredOperations: 0, maxFirstRelicTime: 1800, minRelics: 2, maxDockingAttempts: 50, maxDysonCommissions: 3, maxRealityLaws: 3, maxTuningLocks: 3, maxSenateActs: 3, maxStarChartActions: 2 },
  lowInteraction: { minTime: 4800, maxTime: 25200, requiredEra: 10, cycleReady: true },
  passive: { minTime: 5400, maxTime: 25200, requiredEra: 10, cycleReady: true },
};

// ─── Bot Action Functions ───────────────────────────────────────────────────

function botGather(state, profile, t, rng) {
  if (!profile.gather || !profile.gatherInterval) return state;
  // Era 4+ gathering is automated by the engine; a player stops clicking.
  if (state.era >= 4) return state;
  if (t % profile.gatherInterval !== 0) return state;
  for (const [id, r] of Object.entries(state.resources)) {
    if (r.unlocked) {
      state = gather(state, id, 1, rng);
    }
  }
  return state;
}

function botExpedition(state, profile, _t, rng) {
  if (!profile.expeditions || state.era > 3 || (state.expedition?.supplies || 0) < 1) return state;
  const routes = getExpeditionRoutes(state.era);
  const routeIndex = profile.expeditionStrategy === 'deep'
    ? 2
    : profile.expeditionStrategy === 'measured' ? 1 : 0;
  return runExpedition(state, routes[routeIndex].id, rng).state;
}

function botBuyUpgrades(state, profile, _t, _rng) {
  if (!profile.buyUpgrades) return state;
  const available = getAvailableUpgrades(state);
  // Non-repeatable first
  for (const upgrade of available) {
    if (upgrade.repeatable) continue;
    const cost = getUpgradeCost(state, upgrade.id);
    if (canAfford(state, cost)) {
      const result = purchaseUpgrade(state, upgrade.id);
      if (result) state = result;
    }
  }
  // Repeatables are a resource sink, not progression. A competent player
  // finishes the era foundation before spending the bottleneck stockpile.
  if (!getEraReadiness(state).upgradesMet) return state;
  // Then repeatable (buy max)
  for (const upgrade of available) {
    if (!upgrade.repeatable) continue;
    const result = buyMaxRepeatable(state, upgrade.id);
    if (result) state = result;
  }
  return state;
}

function botBuyTech(state, profile, _t, _rng) {
  if (!profile.buyTech) return state;
  const techs = getAvailableTech(state);
  for (const tech of techs) {
    if (canAfford(state, tech.cost)) {
      const result = unlockTech(state, tech.id);
      if (result) state = result;
    }
  }
  return state;
}

function botDock(state, profile, t, rng) {
  if (!profile.docking || state.era < 4) return state;
  const interval = profile.dockInterval || 3;
  if (t % interval !== 0) return state;

  const missions = ['cargo', 'crew', 'science'];
  const dockingInfo = getDockingInfo(state);
  const missionId = missions.find(id => (dockingInfo.contracts[id] || 0) < dockingInfo.contractQuota);
  if (!missionId) return state;
  state = selectDockingMission(state, missionId);

  // Hit the zone center with optional accuracy offset
  const zoneCenter = getTargetZone(state);
  const accuracy = profile.dockAccuracy || 0;
  const offset = accuracy > 0 ? (rng() - 0.5) * accuracy : 0;
  const position = Math.max(0, Math.min(1, zoneCenter + offset));
  const { state: afterDock } = attemptDock(state, position);
  state = afterDock;
  return state;
}

function botColonies(state, profile, t, _rng) {
  if (!profile.colonies || state.era < 5) return state;
  // Re-assign every 30s
  if (t % 30 !== 0) return state;

  const assignable = getAssignableColonies(state);
  if (assignable < 1) return state;

  const strategy = profile.colonyStrategy || 'diversified';
  if (strategy === 'diversified') {
    const perFocus = Math.floor(assignable / 3);
    const remainder = assignable - perFocus * 3;
    for (const [focus, count] of [['growth', perFocus], ['science', perFocus + remainder], ['industry', perFocus]]) {
      const result = assignColonies(state, focus, count);
      if (result) state = result;
    }
  } else if (strategy === 'growth') {
    const result = assignColonies(state, 'growth', assignable);
    if (result) state = result;
  } else if (strategy === 'science') {
    const result = assignColonies(state, 'science', assignable);
    if (result) state = result;
  } else if (strategy === 'industry') {
    const result = assignColonies(state, 'industry', assignable);
    if (result) state = result;
  }
  return state;
}

function botStarChart(state, profile, _t, _rng) {
  if (!profile.starChart || state.era < 6 || state.networkPlan) return state;
  // One strategic commitment: survey crews lay the rest of the network.
  return selectNetworkPlan(state, profile.starChartPlan || 'coreWeb');
}

function botWeave(state, profile, t, _rng) {
  if (!profile.weaving || state.era < 8) return state;
  const interval = profile.weaveInterval || 10;
  if (t % interval !== 0) return state;

  const stats = getWeavingStats(state);
  if (stats.remaining <= 0) return state;
  const lawOrder = ['temporal', 'causal', 'quantum', 'spatial'];
  const lawId = lawOrder.find(id => !stats.laws[id]);
  return weaveRealityLaw(state, lawId)?.state || state;
}

function botTrade(state, profile, t, _rng) {
  if (!profile.trading || state.era < 4) return state;
  // Trade every 30s
  if (t % 30 !== 0) return state;

  const aggressive = profile.tradeStrategy === 'aggressive';
  // trade always triggered when conditions met // always trade when triggered

  // Find bottleneck: unlocked resource with lowest rate needed by next upgrade
  const available = getAvailableUpgrades(state);
  const techs = getAvailableTech(state);

  // Collect all needed resources from unaffordable upgrades/tech
  const needed = {};
  for (const u of available) {
    const cost = getUpgradeCost(state, u.id);
    for (const [resId, amount] of Object.entries(cost)) {
      const r = state.resources[resId];
      if (r && r.unlocked && r.amount < amount) {
        needed[resId] = (needed[resId] || 0) + (amount - r.amount);
      }
    }
  }
  for (const t of techs) {
    for (const [resId, amount] of Object.entries(t.cost)) {
      const r = state.resources[resId];
      if (r && r.unlocked && r.amount < amount) {
        needed[resId] = (needed[resId] || 0) + (amount - r.amount);
      }
    }
  }

  if (Object.keys(needed).length === 0) return state;

  // Sort by most needed
  const bottlenecks = Object.entries(needed).sort((a, b) => b[1] - a[1]);

  // Find surplus: resource with highest amount relative to cap, that we don't need
  const unlocked = Object.entries(state.resources).filter(([, r]) => r.unlocked);
  const surplus = unlocked
    .filter(([id]) => !needed[id])
    .sort((a, b) => b[1].amount - a[1].amount);

  if (surplus.length === 0) return state;

  // Trade surplus into bottleneck
  const maxTrades = aggressive ? 5 : 2;
  let trades = 0;
  for (const [bottleneckId] of bottlenecks) {
    if (trades >= maxTrades) break;
    for (const [surplusId, surplusR] of surplus) {
      if (trades >= maxTrades) break;
      if (surplusR.amount < 10) continue;
      const ratio = getTradeRatio(surplusId, bottleneckId);
      if (!ratio) continue;
      // Trade a reasonable amount
      const tradeAmount = aggressive ? Math.min(50, Math.floor(surplusR.amount * 0.3)) : Math.min(20, Math.floor(surplusR.amount * 0.1));
      if (tradeAmount < 1) continue;
      const result = executeTrade(state, surplusId, bottleneckId, tradeAmount);
      if (result) {
        state = result;
        trades++;
      }
    }
  }
  return state;
}

function botDyson(state, profile, t, _rng) {
  if (!profile.dysonAssembly || state.era < 7) return state;
  // Commission at most three modules; automation handles later growth.
  if (t % 5 !== 0) return state;
  const stats = getDysonStats(state);
  if (stats.remainingModules <= 0) return state;
  const moduleOrder = ['frame', 'collector', 'forge'];
  const result = commissionDysonModule(state, moduleOrder[stats.totalModules % moduleOrder.length]);
  return result ? result.state : state;
}

function botCosmicTuning(state, profile, _t, _rng) {
  if (!profile.cosmicTuning || state.era < 9) return state;
  // Lock Deep Time first (Temporal Key milestone), then the two big output
  // bands, leaving the Fracture Band unlocked. Calibration gaps pace this.
  const lockOrder = ['stability', 'power', 'constants'];
  const stats = getTuningStats(state);
  if (stats.remaining <= 0 || stats.cooldown > 0) return state;
  const nextBand = lockOrder.find(bandId => !stats.locked[bandId]);
  if (!nextBand) return state;
  const result = lockCosmicSignal(state, nextBand);
  return result ? result.state : state;
}

function botSenate(state, profile, _t, _rng) {
  if (!profile.senateFocus || state.era < 8) return state;
  const stats = getSenateStats(state);
  if (!stats.nextAct || stats.cooldown > 0) return state;

  // Coalition choice follows the profile's focus: the focused faction leads
  // and its natural partner joins; 'balanced' pairs merchants with scholars.
  const coalitions = {
    balanced: ['merchants', 'scholars'],
    merchants: ['merchants', 'warriors'],
    scholars: ['scholars', 'merchants'],
    warriors: ['warriors', 'scholars'],
  };
  const [leader, partner] = coalitions[profile.senateFocus] || coalitions.balanced;
  const faction = stats.nextAct === 'mandate' ? leader : stats.nextAct === 'coalition' ? partner : null;
  const result = enactSenatePolicy(state, stats.nextAct, faction);
  return result ? result.state : state;
}

function botRealityForge(state, profile, t, _rng) {
  if (state.era < 10) return state;
  if (!state.nextCycleDoctrine) {
    const doctrines = ['reconstruction', 'expansion', 'transcendence'];
    state = selectNextCycleDoctrine(state, doctrines[(state.prestigeCount || 0) % doctrines.length]);
  }
  if (!profile.realityForge) return state;
  // Forge every 30s
  if (t % 30 !== 0) return state;

  const recipes = getRealityForgeRecipes(state)
    .filter(recipe => recipe.affordable)
    .sort((a, b) => {
      if ((a.count === 0) !== (b.count === 0)) return a.count === 0 ? -1 : 1;
      return (a.fragments + a.echoes) - (b.fragments + b.echoes);
    });
  return recipes.length > 0 ? (forgeRealityKey(state, recipes[0].id) || state) : state;
}

function botRelics(state, profile) {
  if (!state.relicOffer?.length || profile.relics === false) return state;
  const priority = ['surveyorLens', 'openCircuit', 'emberSeed', 'voidSail', 'colonyCharter', 'pilgrimMap', 'loomNeedle', 'brokenCrown'];
  const rank = relicId => priority.indexOf(relicId);
  const offered = [...state.relicOffer].sort((a, b) => rank(a) - rank(b));
  const active = state.activeRelics || [];
  if (active.length < 2) return claimRelic(state, offered[0]);

  const worstActive = [...active].sort((a, b) => rank(b) - rank(a))[0];
  if (rank(offered[0]) < rank(worstActive)) return claimRelic(state, offered[0], worstActive);
  return declineRelicOffer(state);
}

function botPrestigeUpgrades(state, profile, t, _rng) {
  if (!profile.buyPrestigeUpgrades) return state;
  if ((state.prestigePoints || 0) < 2) return state;
  // Only check every 60s
  if (t % 60 !== 0) return state;

  const order = profile.prestigeUpgradeOrder || [];

  // Buy in priority order
  for (const id of order) {
    if (state.prestigeUpgrades?.[id]) continue;
    const result = purchasePrestigeUpgrade(state, id);
    if (result) {
      state = result;
      // Only buy one per check to avoid spending all points at once
      break;
    }
  }

  // Fallback: buy any affordable upgrade not in the order
  const shop = getPrestigeShop(state);
  for (const u of shop) {
    if (u.owned || !u.affordable || u.locked) continue;
    const result = purchasePrestigeUpgrade(state, u.id);
    if (result) {
      state = result;
      break;
    }
  }

  return state;
}

// ─── Data Collection ────────────────────────────────────────────────────────

function createCollector() {
  return {
    eraTimings: { 1: { reachedAt: 0, duration: 0 } },
    resourceSnapshots: [],
    upgradeTimeline: [],
    operationStats: {
      expeditions: { finds: 0, gems: 0 },
      docking: { attempts: 0, successes: 0, perfects: 0 },
      colonies: { assignments: 0 },
      starChart: { routes: 0 },
      weaving: { draws: 0, weaves: 0 },
      dyson: { segments: 0 },
      tuning: { locks: 0 },
      senate: { acts: 0 },
      realityForge: { keys: 0 },
    },
    prestigeLog: [],
    bottlenecks: [],
    engagement: {
      actionsByEra: {},
      directRewardsByOperation: {},
      economicWaitSecondsByEra: {},
      firstOperationLatencyByEra: {},
      upgradeSelections: {},
      techSelections: {},
      doctrineSelections: {},
      relicSelections: {},
      firstRelicTime: null,
      ignoredOperations: [],
      finalPassiveRatesByOperation: {},
    },
    completionStatus: { reachedTargetEra: false, totalTime: 0, finalEra: 1, gameComplete: false },
  };
}

function takeSnapshot(state, t, collector) {
  const readiness = getEraReadiness(state);
  const snap = {
    time: t,
    era: state.era,
    readiness: {
      upgrades: readiness.currentUpgrades,
      upgradeTarget: readiness.minUpgrades,
      foundationProgress: readiness.foundationProgress,
      techs: readiness.currentTechs,
      techTarget: readiness.minTechs,
    },
    resources: {},
  };
  for (const [id, r] of Object.entries(state.resources)) {
    if (r.unlocked) {
      const rate = (r.baseRate + r.rateAdd) * r.rateMult * (state.prestigeMultiplier || 1);
      snap.resources[id] = { amount: Math.floor(r.amount * 10) / 10, rate: Math.floor(rate * 100) / 100 };
    }
  }
  snap.purchaseBlockers = getAvailableUpgrades(state)
    .filter(upgrade => upgrade.era === state.era)
    .map(upgrade => {
      const cost = getUpgradeCost(state, upgrade.id);
      const missing = Object.entries(cost)
        .map(([resource, amount]) => {
          const current = state.resources[resource]?.amount || 0;
          const rate = getNetRate(state, resource);
          const deficit = Math.max(0, amount - current);
          return { resource, deficit, eta: deficit <= 0 ? 0 : rate > 0 ? deficit / rate : null };
        })
        .filter(entry => entry.deficit > 0);
      const eta = missing.some(entry => entry.eta === null)
        ? null
        : Math.max(0, ...missing.map(entry => entry.eta));
      return { id: upgrade.id, eta, missing };
    })
    .filter(entry => entry.missing.length > 0)
    .sort((a, b) => (b.eta ?? Infinity) - (a.eta ?? Infinity))
    .slice(0, 5);
  collector.resourceSnapshots.push(snap);
}

function recordUpgradeTimeline(state, t, collector) {
  collector.upgradeTimeline.push({
    time: t,
    era: state.era,
    upgradeCount: Object.keys(state.upgrades || {}).length,
    techCount: Object.keys(state.tech || {}).length,
  });
}

function updateOperationStats(prevState, state, collector) {
  const s = collector.operationStats;
  s.expeditions.gems = state.totalGems || 0;
  s.expeditions.finds = state.expedition?.totalFinds || 0;
  s.docking.attempts = state.dockingAttempts || 0;
  s.docking.successes = state.dockingSuccesses || 0;
  s.docking.perfects = state.dockingPerfects || 0;
  s.weaving.weaves = state.totalWeaves || 0;
  s.dyson.segments = state.dysonSegments || 0;
  s.tuning.locks = Object.keys(state.lockedSignals || {}).length;
  s.starChart.routes = (state.starRoutes || []).length;
  s.realityForge.keys = Object.values(state.realityKeys || {}).reduce((s, v) => s + v, 0);
  s.senate.acts = countSenateActs(state);
}

function totalResourceAmounts(state) {
  return Object.values(state.resources || {}).reduce((sum, resource) => sum + (resource.amount || 0), 0);
}

function recordSelections(before, after, collector) {
  const engagement = collector.engagement;
  for (const [id, value] of Object.entries(after.upgrades || {})) {
    const previous = before.upgrades?.[id];
    const gained = typeof value === 'number' ? value - (typeof previous === 'number' ? previous : 0) : !previous && value ? 1 : 0;
    if (gained > 0) engagement.upgradeSelections[id] = (engagement.upgradeSelections[id] || 0) + gained;
  }
  for (const id of Object.keys(after.tech || {})) {
    if (!before.tech?.[id]) engagement.techSelections[id] = (engagement.techSelections[id] || 0) + 1;
  }
  if (after.nextCycleDoctrine && after.nextCycleDoctrine !== before.nextCycleDoctrine) {
    engagement.doctrineSelections[after.nextCycleDoctrine] = (engagement.doctrineSelections[after.nextCycleDoctrine] || 0) + 1;
  }
  for (const relicId of after.activeRelics || []) {
    if (!(before.activeRelics || []).includes(relicId)) {
      engagement.relicSelections[relicId] = (engagement.relicSelections[relicId] || 0) + 1;
      if (engagement.firstRelicTime === null) engagement.firstRelicTime = after.totalTime || 0;
    }
  }
}

function recordBotAction(before, after, action, collector) {
  if (after === before) return;
  const era = before.era || 1;
  const byEra = collector.engagement.actionsByEra[era] || {};
  byEra[action] = (byEra[action] || 0) + 1;
  collector.engagement.actionsByEra[era] = byEra;

  const rewardActions = new Set(['expedition', 'docking', 'weaving', 'trading', 'dyson', 'tuning', 'senate', 'realityForge']);
  const directReward = Math.max(0, totalResourceAmounts(after) - totalResourceAmounts(before));
  if (rewardActions.has(action) && directReward > 0) {
    collector.engagement.directRewardsByOperation[action] =
      (collector.engagement.directRewardsByOperation[action] || 0) + directReward;
  }
  recordSelections(before, after, collector);
}

function hasEraOperationProgress(state) {
  if (state.era <= 3) return (state.expedition?.eraFinds || 0) > 0;
  if (state.era === 4) return Object.values(state.dockingMissions || {}).some(count => count > 0);
  if (state.era === 5) return Object.values(state.colonyAssignments || {}).some(count => count > 0);
  if (state.era === 6) return (state.starRoutes?.length || 0) > 0;
  if (state.era === 7) return (state.dysonSegments || 0) > 0;
  if (state.era === 8) return !!state.senateGov?.leader || (state.totalWeaves || 0) > 0;
  if (state.era === 9) return Object.keys(state.lockedSignals || {}).length > 0;
  return Object.values(state.realityKeys || {}).some(count => count > 0);
}

function recordEngagementTick(state, collector) {
  const era = state.era || 1;
  const affordableUpgrade = getAvailableUpgrades(state).some(upgrade => canAfford(state, getUpgradeCost(state, upgrade.id)));
  const affordableTech = getAvailableTech(state).some(tech => canAfford(state, tech.cost));
  if (!affordableUpgrade && !affordableTech) {
    collector.engagement.economicWaitSecondsByEra[era] = (collector.engagement.economicWaitSecondsByEra[era] || 0) + 1;
  }
  if (collector.engagement.firstOperationLatencyByEra[era] === undefined && hasEraOperationProgress(state)) {
    collector.engagement.firstOperationLatencyByEra[era] = Math.max(0, state.totalTime - (state.eraStartTime || 0));
  }
}

function getPassiveOperationRates(state) {
  const sumRates = rates => Object.values(rates).reduce((sum, rate) => sum + Math.max(0, rate), 0);
  const tuningRate = ['cosmicPower', 'universalConstants', 'realityFragments'].reduce(
    (sum, resourceId) => sum + getEffectiveRate(state, resourceId) * (getTuningProductionMultiplier(state, resourceId) - 1),
    0,
  );
  const senateRate = Object.entries(getSenatePctBonuses(state)).reduce(
    (sum, [resourceId, multiplier]) => {
      const combined = multiplier * getSenateGovernmentMultiplier(state, resourceId);
      return sum + getEffectiveRate(state, resourceId) * Math.max(0, combined - 1);
    },
    0,
  );
  const weavingRate = Object.keys(state.wovenLaws || {}).reduce((sum, lawId) => {
    const resourceIds = { temporal: 'cosmicPower', spatial: 'exoticMatter', causal: 'universalConstants', quantum: 'realityFragments' };
    const resourceId = resourceIds[lawId];
    const multiplier = getWeaveProductionMultiplier(state, resourceId);
    return sum + getEffectiveRate(state, resourceId) * Math.max(0, 1 - 1 / multiplier);
  }, 0);
  return {
    colonies: sumRates(getColonyBonus(state)),
    starChart: sumRates(getRouteBonus(state)),
    senate: senateRate,
    weaving: weavingRate,
    tuning: tuningRate,
  };
}

function detectBottlenecks(state, collector) {
  const available = getAvailableUpgrades(state);

  for (const u of available) {
    const cost = getUpgradeCost(state, u.id);
    for (const [resId, amount] of Object.entries(cost)) {
      const r = state.resources[resId];
      if (r && r.unlocked && r.amount < amount) {
        const rate = (r.baseRate + r.rateAdd) * r.rateMult * (state.prestigeMultiplier || 1);
        if (rate <= 0) {
          const existing = collector.bottlenecks.find(b => b.resource === resId && b.era === state.era);
          if (!existing) {
            collector.bottlenecks.push({
              resource: resId,
              era: state.era,
              time: state.totalTime,
              neededBy: u.id,
              amount,
            });
          }
        }
      }
    }
  }
}

// ─── Formatting ─────────────────────────────────────────────────────────────

function fmtTime(seconds) {
  if (seconds >= 3600) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h}h${m.toString().padStart(2, '0')}m${s.toString().padStart(2, '0')}s`;
  }
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}m${s.toString().padStart(2, '0')}s`;
}

function fmtNum(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return n.toFixed(1);
}

// ─── Run a Single Scenario ──────────────────────────────────────────────────

// Log to stderr when in JSON mode so stdout stays clean
let _jsonMode = false;
function log(msg) {
  if (_jsonMode) process.stderr.write(msg + '\n');
  else console.log(msg);
}
function logWrite(msg) {
  if (_jsonMode) process.stderr.write(msg);
  else process.stdout.write(msg);
}

function runScenario(opts) {
  const { profile, maxTime, targetEra, prestige, prestigeAtEra, seed, snapshotInterval, verbose, quiet } = opts;
  const profileDef = PROFILES[profile];
  if (!profileDef) throw new Error(`Unknown profile: ${profile}`);

  const rng = mulberry32(seed);
  const DT = 1;
  const maxTicks = maxTime;
  const collector = createCollector();

  let state = createInitialState();
  let lastEra = 1;
  let stuckCounter = 0;
  let lastProgressCount = 0;
  let prestigesDone = 0;
  let currentCycleStart = 0;
  let reachedTargetAt = null;
  let lastTotalResources = 0;

  for (let t = 0; t < maxTicks; t++) {
    const prevState = state;
    const applyAction = (name, action) => {
      const before = state;
      state = action(state);
      recordBotAction(before, state, name, collector);
    };

    // --- Bot actions ---
    applyAction('relic', current => botRelics(current, profileDef));
    applyAction('gather', current => botGather(current, profileDef, t, rng));
    applyAction('expedition', current => botExpedition(current, profileDef, t, rng));
    applyAction('upgrade', current => botBuyUpgrades(current, profileDef, t, rng));
    applyAction('technology', current => botBuyTech(current, profileDef, t, rng));
    applyAction('docking', current => botDock(current, profileDef, t, rng));
    applyAction('colonies', current => botColonies(current, profileDef, t, rng));
    applyAction('starChart', current => botStarChart(current, profileDef, t, rng));
    applyAction('weaving', current => botWeave(current, profileDef, t, rng));
    applyAction('trading', current => botTrade(current, profileDef, t, rng));
    applyAction('dyson', current => botDyson(current, profileDef, t, rng));
    applyAction('tuning', current => botCosmicTuning(current, profileDef, t, rng));
    applyAction('senate', current => botSenate(current, profileDef, t, rng));
    applyAction('realityForge', current => botRealityForge(current, profileDef, t, rng));
    applyAction('prestigeUpgrade', current => botPrestigeUpgrades(current, profileDef, t, rng));

    // Tick the engine
    state = tick(state, DT, rng);
    recordEngagementTick(state, collector);

    // Track era transitions
    if (state.era !== lastEra) {
      const prevTime = collector.eraTimings[lastEra]?.reachedAt || 0;
      collector.eraTimings[state.era] = {
        reachedAt: state.totalTime,
        duration: state.totalTime - prevTime,
      };
      if (!quiet) {
        log(`  Era ${lastEra} → ${state.era} at ${fmtTime(state.totalTime)} (era took ${fmtTime(state.totalTime - prevTime)})`);
      }
      lastEra = state.era;
      stuckCounter = 0;
    }

    // Prestige check
    if (prestigesDone < prestige && state.era >= prestigeAtEra && getCycleReadiness(state).ready) {
      const bonus = calculatePrestigeBonus(state);
      const points = calculatePrestigePoints(state);
      collector.prestigeLog.push({
        cycle: prestigesDone + 1,
        eraReached: state.era,
        time: state.totalTime - currentCycleStart,
        bonus,
        points,
      });

      if (!quiet) {
        log(`  PRESTIGE #${prestigesDone + 1} at era ${state.era}, ${fmtTime(state.totalTime)} (bonus: ${bonus.toFixed(2)}x, points: ${points})`);
      }

      state = performPrestige(state);
      prestigesDone++;
      lastEra = state.era;
      currentCycleStart = state.totalTime;

      // Reset era timings for new cycle
      collector.eraTimings = { [state.era]: { reachedAt: state.totalTime, duration: 0 } };
    }

    // Snapshots
    if (snapshotInterval > 0 && t > 0 && t % snapshotInterval === 0) {
      takeSnapshot(state, t, collector);
    }

    // Upgrade timeline every 5 min
    if (t > 0 && t % 300 === 0) {
      recordUpgradeTimeline(state, t, collector);
    }

    // Operation stats
    updateOperationStats(prevState, state, collector);

    // Bottleneck detection every 5 min
    if (t % 300 === 0) {
      detectBottlenecks(state, collector);
    }

    // Stuck detection (no new upgrades/tech for extended period)
    // Uses 5-min windows; requires 6 consecutive windows (30 min) with no progress.
    // Also checks if total resource amount is growing — slow accumulation isn't stuck.
    if (t % 300 === 0) {
      const currentCount = Object.keys(state.upgrades || {}).length + Object.keys(state.tech || {}).length;
      const totalResources = Object.values(state.resources)
        .filter(r => r.unlocked)
        .reduce((sum, r) => sum + r.amount, 0);
      if (currentCount === lastProgressCount) {
        // Check if resources are still growing (passive accumulation)
        if (lastTotalResources > 0 && totalResources > lastTotalResources * 1.01) {
          // Resources growing > 1% — not truly stuck, just slow
          stuckCounter = Math.max(0, stuckCounter - 1);
        } else {
          stuckCounter++;
        }
        if (stuckCounter >= 6) {
          if (!quiet) {
            log(`  STUCK at era ${state.era} after ${fmtTime(state.totalTime)} — no progress for 30 min`);
            printResourceSnapshot(state);
          }
          break;
        }
      } else {
        stuckCounter = 0;
      }
      lastProgressCount = currentCount;
      lastTotalResources = totalResources;
    }

    // Verbose output every 60s
    if (verbose && t > 0 && t % 60 === 0) {
      const upgCount = Object.keys(state.upgrades || {}).length;
      const techCount = Object.keys(state.tech || {}).length;
      log(`  [${fmtTime(state.totalTime)}] Era ${state.era} | ${upgCount} upgrades, ${techCount} techs | prestige: ${state.prestigeMultiplier?.toFixed(1) || '1'}x`);
    }

    // Progress update every 10 min (non-quiet, non-verbose)
    if (!quiet && !verbose && t > 0 && t % 600 === 0) {
      const upgCount = Object.keys(state.upgrades || {}).length;
      const techCount = Object.keys(state.tech || {}).length;
      logWrite(`  [${fmtTime(state.totalTime)}] Era ${state.era} | ${upgCount} upgrades, ${techCount} techs\r`);
    }

    // Done? Era 10 runs until the cycle is actually ready; earlier targets get
    // 120 extra ticks to exercise their newly unlocked systems.
    if (state.era >= targetEra) {
      if (!reachedTargetAt) {
        reachedTargetAt = t;
        if (!quiet) {
          log(`  Reached era ${targetEra} at ${fmtTime(state.totalTime)}`);
        }
      }
      if (targetEra >= 10 ? getCycleReadiness(state).ready : t - reachedTargetAt >= 120) break;
    }
  }

  // Final snapshot
  takeSnapshot(state, Math.floor(state.totalTime), collector);
  recordUpgradeTimeline(state, Math.floor(state.totalTime), collector);

  // Completion status
  collector.completionStatus = {
    reachedTargetEra: state.era >= targetEra,
    totalTime: state.totalTime,
    finalEra: state.era,
    gameComplete: state.gameComplete || false,
    cycleReady: getCycleReadiness(state).ready,
    upgradeCount: Object.keys(state.upgrades || {}).length,
    techCount: Object.keys(state.tech || {}).length,
    prestigeCount: prestigesDone,
    prestigeMultiplier: state.prestigeMultiplier || 1,
    activeRelics: state.activeRelics || [],
    relicsRecoveredThisRun: state.relicsRecoveredThisRun || 0,
  };

  const operationActivity = {
    expedition: collector.operationStats.expeditions.finds,
    docking: collector.operationStats.docking.attempts,
    colonies: Object.values(state.colonyAssignments || {}).reduce((sum, count) => sum + count, 0),
    starChart: collector.operationStats.starChart.routes,
    dyson: collector.operationStats.dyson.segments,
    senate: collector.operationStats.senate.acts,
    weaving: collector.operationStats.weaving.weaves,
    tuning: collector.operationStats.tuning.locks,
    realityForge: collector.operationStats.realityForge.keys,
  };
  const configuredOperations = {
    expedition: profileDef.expeditions,
    docking: profileDef.docking,
    colonies: profileDef.colonies,
    starChart: profileDef.starChart,
    dyson: profileDef.dysonAssembly,
    senate: !!profileDef.senateFocus,
    weaving: profileDef.weaving,
    tuning: profileDef.cosmicTuning,
    realityForge: profileDef.realityForge,
  };
  collector.engagement.ignoredOperations = Object.keys(configuredOperations)
    .filter(operation => configuredOperations[operation] && !operationActivity[operation]);
  collector.engagement.finalPassiveRatesByOperation = getPassiveOperationRates(state);

  return { state, collector };
}

// ─── Output Formatting ──────────────────────────────────────────────────────

function printHumanReport(scenarioName, opts, collector) {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  Scenario: ${scenarioName} | Profile: ${opts.profile}`);
  console.log(`${'═'.repeat(60)}`);

  // Era Progression
  console.log('\n── Era Progression ──');
  const eras = Object.keys(collector.eraTimings).map(Number).sort((a, b) => a - b);
  for (const era of eras) {
    const { reachedAt, duration } = collector.eraTimings[era];
    if (era === eras[0] && reachedAt === 0) {
      console.log(`  Era ${era}: start`);
    } else {
      console.log(`  Era ${era}: reached at ${fmtTime(reachedAt)} (took ${fmtTime(duration)})`);
    }
  }

  // Operation contribution
  const mg = collector.operationStats;
  const hasAnyOperation = mg.expeditions.finds > 0 || mg.docking.attempts > 0 ||
    mg.starChart.routes > 0 || mg.weaving.weaves > 0 || mg.dyson.segments > 0 ||
    mg.tuning.locks > 0 || mg.senate.acts > 0 || mg.realityForge.keys > 0;

  if (hasAnyOperation) {
    console.log('\n── Operation Stats ──');
    if (mg.expeditions.finds > 0) console.log(`  Expeditions: ${mg.expeditions.finds} discoveries, ${mg.expeditions.gems} gems`);
    if (mg.docking.attempts > 0) console.log(`  Docking: ${mg.docking.successes}/${mg.docking.attempts} hits (${mg.docking.perfects} perfect)`);
    if (mg.starChart.routes > 0) console.log(`  Star Chart: ${mg.starChart.routes} routes`);
    if (mg.weaving.weaves > 0) console.log(`  Weaving: ${mg.weaving.weaves} weaves`);
    if (mg.dyson.segments > 0) console.log(`  Dyson: ${mg.dyson.segments} segments`);
    if (mg.tuning.locks > 0) console.log(`  Tuning: ${mg.tuning.locks} signal locks`);
    if (mg.senate.acts > 0) console.log(`  Senate: ${mg.senate.acts} policy acts`);
    if (mg.realityForge.keys > 0) console.log(`  Reality Forge: ${mg.realityForge.keys} keys forged`);
  }

  const engagement = collector.engagement;
  console.log('\n── Engagement Audit ──');
  for (const [era, actions] of Object.entries(engagement.actionsByEra)) {
    const repeated = Object.entries(actions).sort((a, b) => b[1] - a[1]).slice(0, 3);
    const wait = engagement.economicWaitSecondsByEra[era] || 0;
    const latency = engagement.firstOperationLatencyByEra[era];
    console.log(`  Era ${era}: ${repeated.map(([name, count]) => `${name} x${count}`).join(', ') || 'no active actions'} | economic wait ${fmtTime(wait)}${latency === undefined ? '' : ` | first operation ${fmtTime(latency)}`}`);
  }
  const rewardEntries = Object.entries(engagement.directRewardsByOperation).sort((a, b) => b[1] - a[1]);
  if (rewardEntries.length > 0) {
    console.log(`  Direct action rewards: ${rewardEntries.map(([name, amount]) => `${name} ${fmtNum(amount)}`).join(', ')}`);
  }
  const passiveRates = Object.entries(engagement.finalPassiveRatesByOperation).filter(([, rate]) => rate > 0);
  if (passiveRates.length > 0) {
    console.log(`  Final passive operation rates: ${passiveRates.map(([name, rate]) => `${name} +${fmtNum(rate)}/s`).join(', ')}`);
  }
  const doctrines = Object.entries(engagement.doctrineSelections);
  if (doctrines.length > 0) console.log(`  Doctrines: ${doctrines.map(([name, count]) => `${name} x${count}`).join(', ')}`);
  const relics = Object.entries(engagement.relicSelections);
  if (relics.length > 0) console.log(`  Relics equipped: ${relics.map(([name, count]) => `${name} x${count}`).join(', ')}`);
  if (engagement.firstRelicTime !== null) console.log(`  First relic equipped at ${fmtTime(engagement.firstRelicTime)}`);
  const upgrades = Object.entries(engagement.upgradeSelections).sort((a, b) => b[1] - a[1]).slice(0, 8);
  if (upgrades.length > 0) console.log(`  Most selected upgrades: ${upgrades.map(([name, count]) => `${name} x${count}`).join(', ')}`);
  if (engagement.ignoredOperations.length > 0) console.log(`  Configured but ignored: ${engagement.ignoredOperations.join(', ')}`);

  // Prestige Cycles
  if (collector.prestigeLog.length > 0) {
    console.log('\n── Prestige Cycles ──');
    for (const p of collector.prestigeLog) {
      console.log(`  Cycle ${p.cycle}: era ${p.eraReached} in ${fmtTime(p.time)} (bonus: ${p.bonus.toFixed(2)}x, points: ${p.points})`);
    }
  }

  // Bottlenecks
  if (collector.bottlenecks.length > 0) {
    console.log('\n── Bottlenecks (0-rate resources blocking progress) ──');
    const unique = [];
    const seen = new Set();
    for (const b of collector.bottlenecks) {
      const key = `${b.resource}-era${b.era}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(b);
      }
    }
    for (const b of unique.slice(0, 10)) {
      console.log(`  ${b.resource} at era ${b.era} (${fmtTime(b.time)}) — needed by ${b.neededBy}: ${fmtNum(b.amount)}`);
    }
  }

  // Summary
  const cs = collector.completionStatus;
  console.log('\n── Summary ──');
  console.log(`  Final era: ${cs.finalEra} | Time: ${fmtTime(cs.totalTime)} | ${cs.reachedTargetEra ? 'COMPLETED' : 'DID NOT COMPLETE'}`);
  console.log(`  Upgrades: ${cs.upgradeCount} | Tech: ${cs.techCount} | Prestiges: ${cs.prestigeCount} (${cs.prestigeMultiplier?.toFixed(1)}x)`);
  if (cs.gameComplete) console.log('  Game marked COMPLETE');
  console.log();
}

function buildJsonResult(scenarioName, opts, collector, seed) {
  return {
    scenario: scenarioName,
    profile: opts.profile,
    options: {
      maxTime: opts.maxTime,
      targetEra: opts.targetEra,
      prestige: opts.prestige,
      prestigeAtEra: opts.prestigeAtEra,
      seed,
    },
    results: collector,
    metadata: {
      timestamp: new Date().toISOString(),
      seed,
    },
  };
}

function printSummaryTable(allResults) {
  console.log(`\n${'═'.repeat(70)}`);
  console.log('  SCENARIO COMPARISON TABLE');
  console.log(`${'═'.repeat(70)}`);

  const header = `  ${'Scenario'.padEnd(15)} ${'Profile'.padEnd(14)} ${'Final Era'.padEnd(10)} ${'Time'.padEnd(12)} ${'Status'.padEnd(10)}`;
  console.log(header);
  console.log(`  ${'─'.repeat(65)}`);

  for (const { scenarioName, collector } of allResults) {
    const cs = collector.completionStatus;
    const status = cs.reachedTargetEra ? 'OK' : 'STUCK';
    console.log(`  ${scenarioName.padEnd(15)} ${(cs.profile || '').padEnd(14)} ${String(cs.finalEra).padEnd(10)} ${fmtTime(cs.totalTime).padEnd(12)} ${status}`);
  }
  console.log();
}

function runComparison(currentResults, compareFile) {
  let previousData;
  try {
    previousData = JSON.parse(readFileSync(compareFile, 'utf-8'));
  } catch {
    console.error(`  ERROR: Could not load comparison file: ${compareFile}`);
    return;
  }

  // Handle both single result and array
  const prevResults = Array.isArray(previousData) ? previousData : [previousData];
  const currResults = currentResults;

  console.log(`\n${'═'.repeat(60)}`);
  console.log('  REGRESSION COMPARISON');
  console.log(`${'═'.repeat(60)}`);

  for (const curr of currResults) {
    const prev = prevResults.find(p => (p.scenarioName || p.scenario) === curr.scenarioName);
    if (!prev) continue;

    console.log(`\n  Scenario: ${curr.scenarioName}`);

    const currTimings = curr.collector.eraTimings;
    const prevTimings = prev.collector?.eraTimings || prev.results?.eraTimings;

    if (!prevTimings) continue;

    const allEras = new Set([...Object.keys(currTimings), ...Object.keys(prevTimings)]);
    let regressions = 0;

    for (const era of [...allEras].sort((a, b) => Number(a) - Number(b))) {
      const currT = currTimings[era]?.reachedAt;
      const prevT = prevTimings[era]?.reachedAt;
      if (currT == null || prevT == null || prevT === 0) continue;

      const delta = currT - prevT;
      const pct = ((delta / prevT) * 100).toFixed(1);
      const flag = delta > prevT * 0.1 ? ' ⚠️  REGRESSION' : delta < -prevT * 0.1 ? ' ✓ IMPROVEMENT' : '';

      if (delta > prevT * 0.1) regressions++;
      console.log(`    Era ${era}: ${fmtTime(prevT)} → ${fmtTime(currT)} (${delta >= 0 ? '+' : ''}${pct}%)${flag}`);
    }

    // Final comparison
    const currCS = curr.collector.completionStatus;
    const prevCS = prev.collector?.completionStatus || prev.results?.completionStatus;
    if (prevCS) {
      console.log(`    Final: era ${prevCS.finalEra} → ${currCS.finalEra} | ${fmtTime(prevCS.totalTime)} → ${fmtTime(currCS.totalTime)}`);
    }

    if (regressions > 0) {
      console.log(`    ⚠️  ${regressions} era(s) regressed by >10%`);
    } else {
      console.log('    No significant regressions detected.');
    }
  }
  console.log();
}

function assertBalanceTargets(allResults) {
  let failures = 0;
  console.log(`\n${'═'.repeat(60)}`);
  console.log('  BALANCE ASSERTIONS');
  console.log(`${'═'.repeat(60)}`);

  for (const { scenarioName, collector } of allResults) {
    const target = BALANCE_TARGETS[scenarioName];
    if (!target) continue;

    const status = collector.completionStatus;
    const issues = [];
    if (status.finalEra < target.requiredEra) issues.push(`final era ${status.finalEra} < ${target.requiredEra}`);
    if (target.cycleReady && !status.cycleReady) issues.push('cycle not ready to prestige');
    if (target.maxIgnoredOperations != null && collector.engagement.ignoredOperations.length > target.maxIgnoredOperations) {
      issues.push(`ignored configured operations: ${collector.engagement.ignoredOperations.join(', ')}`);
    }
    if (target.maxFirstRelicTime != null && (collector.engagement.firstRelicTime === null || collector.engagement.firstRelicTime > target.maxFirstRelicTime)) {
      issues.push(collector.engagement.firstRelicTime === null ? 'no relic equipped' : `first relic took ${fmtTime(collector.engagement.firstRelicTime)}`);
    }
    if (target.minRelics != null && status.activeRelics.length < target.minRelics) issues.push(`only ${status.activeRelics.length}/${target.minRelics} relics equipped`);
    if (target.maxDockingAttempts != null && collector.operationStats.docking.attempts > target.maxDockingAttempts) {
      issues.push(`docking repeated ${collector.operationStats.docking.attempts} times`);
    }
    if (target.maxDysonCommissions != null) {
      const commissions = Object.values(collector.engagement.actionsByEra).reduce((sum, actions) => sum + (actions.dyson || 0), 0);
      if (commissions > target.maxDysonCommissions) issues.push(`Dyson commissioned ${commissions} times`);
    }
    if (target.maxRealityLaws != null && collector.operationStats.weaving.weaves > target.maxRealityLaws) {
      issues.push(`Reality Laws established ${collector.operationStats.weaving.weaves} times`);
    }
    if (target.maxTuningLocks != null && collector.operationStats.tuning.locks > target.maxTuningLocks) {
      issues.push(`signal bands locked ${collector.operationStats.tuning.locks} times`);
    }
    if (target.maxSenateActs != null && collector.operationStats.senate.acts > target.maxSenateActs) {
      issues.push(`senate acts enacted ${collector.operationStats.senate.acts} times`);
    }
    if (target.maxStarChartActions != null) {
      const chartActions = Object.values(collector.engagement.actionsByEra).reduce((sum, actions) => sum + (actions.starChart || 0), 0);
      if (chartActions > target.maxStarChartActions) issues.push(`star chart acted ${chartActions} times`);
    }
    if (target.maxFirstOperationLatency != null) {
      for (const [era, latency] of Object.entries(collector.engagement.firstOperationLatencyByEra)) {
        if (latency > target.maxFirstOperationLatency) issues.push(`era ${era} first operation took ${fmtTime(latency)}`);
      }
    }
    if (target.minTime != null && status.totalTime < target.minTime) issues.push(`too fast (${fmtTime(status.totalTime)} < ${fmtTime(target.minTime)})`);
    if (target.maxTime != null && status.totalTime > target.maxTime) issues.push(`too slow (${fmtTime(status.totalTime)} > ${fmtTime(target.maxTime)})`);
    for (const [era, [minDuration, maxDuration]] of Object.entries(target.eraRanges || {})) {
      const timing = collector.eraTimings[era];
      if (!timing) {
        issues.push(`era ${era} timing missing`);
      } else if (timing.duration < minDuration || timing.duration > maxDuration) {
        issues.push(`era ${Number(era) - 1} duration ${fmtTime(timing.duration)} outside ${fmtTime(minDuration)}-${fmtTime(maxDuration)}`);
      }
    }

    if (issues.length > 0) {
      failures++;
      console.log(`  ✗ ${scenarioName}: ${issues.join(', ')}`);
    } else {
      console.log(`  ✓ ${scenarioName}: ${fmtTime(status.totalTime)}`);
    }
  }

  if (failures > 0) {
    console.log(`\n  ${failures} balance assertion${failures === 1 ? '' : 's'} failed.`);
  } else {
    console.log('\n  All balance assertions passed.');
  }
  return failures === 0;
}

// ─── Resource Snapshot (for stuck detection) ────────────────────────────────

function printResourceSnapshot(state) {
  log('  Resources:');
  for (const [id, r] of Object.entries(state.resources)) {
    if (r.unlocked) {
      const rate = (r.baseRate + r.rateAdd) * r.rateMult * (state.prestigeMultiplier || 1);
      log(`    ${id}: ${fmtNum(r.amount)} (rate: ${rate.toFixed(2)}/s)`);
    }
  }
  const avail = getAvailableUpgrades(state);
  const unaffordable = avail.filter(u => !canAfford(state, getUpgradeCost(state, u.id)));
  if (unaffordable.length > 0) {
    log('  Unaffordable upgrades:');
    for (const u of unaffordable.slice(0, 5)) {
      const cost = getUpgradeCost(state, u.id);
      log(`    ${u.id}: ${JSON.stringify(cost)}`);
    }
  }
  const availTech = getAvailableTech(state);
  const unaffordTech = availTech.filter(t => !canAfford(state, t.cost));
  if (unaffordTech.length > 0) {
    log('  Unaffordable tech:');
    for (const t of unaffordTech.slice(0, 5)) {
      log(`    ${t.id}: ${JSON.stringify(t.cost)}`);
    }
  }
}

// ─── Help ───────────────────────────────────────────────────────────────────

function printHelp() {
  console.log(`
Bot Playtest CLI — Configurable game balance testing tool.

Usage: node scripts/bot-playtest.js [options]

Options:
  --scenario <name,...>     Comma-separated scenario names (default: full)
  --profile <name>          Bot behavior profile (default: optimal)
  --max-time <seconds>      Max game-time before abort (default: 14400)
  --target-era <N>          Stop at this era (default: 10)
  --prestige <N>            Number of prestige resets (default: 0)
  --prestige-at-era <N>     Era at which bot prestiges (default: 7)
  --json                    JSON output mode
  --verbose                 Per-tick detail every 60s
  --quiet                   Only final report
  --compare <file>          Compare against previous JSON run
  --assert-balance          Enforce built-in pacing targets for key scenarios
  --seed <N>                Fixed RNG seed for deterministic runs
  --snapshot-interval <N>   Seconds between snapshots (default: 300)
  --list-scenarios          Print built-in scenarios and exit
  --list-profiles           Print bot profiles and exit
  -h, --help                Show this help

Examples:
  node scripts/bot-playtest.js --scenario full --json > baseline.json
  node scripts/bot-playtest.js --scenario full --json --compare baseline.json
  node scripts/bot-playtest.js --scenario full,lowInteraction,passive --quiet
  node scripts/bot-playtest.js --scenario prestige3 --verbose
  node scripts/bot-playtest.js --seed 42 --verbose
  node scripts/bot-playtest.js --scenario full,casual,lowInteraction,passive --seed 424242 --quiet --assert-balance
`);
}

// ─── Main ───────────────────────────────────────────────────────────────────

const args = parseArgs(process.argv.slice(2));

if (args.help) {
  printHelp();
  process.exit(0);
}

if (args.listScenarios) {
  console.log('\nBuilt-in Scenarios:');
  console.log(`  ${'Name'.padEnd(15)} ${'Profile'.padEnd(14)} ${'Prestiges'.padEnd(10)} ${'Target'.padEnd(8)} ${'Max Time'.padEnd(10)} Purpose`);
  console.log(`  ${'─'.repeat(80)}`);
  for (const [name, s] of Object.entries(SCENARIOS)) {
    console.log(`  ${name.padEnd(15)} ${s.profile.padEnd(14)} ${String(s.prestige).padEnd(10)} ${String(s.targetEra).padEnd(8)} ${fmtTime(s.maxTime).padEnd(10)} ${s.purpose}`);
  }
  console.log();
  process.exit(0);
}

if (args.listProfiles) {
  console.log('\nBot Profiles:');
  for (const [name, p] of Object.entries(PROFILES)) {
    const systems = [];
    if (p.gather) systems.push('gather');
    if (p.docking) systems.push('dock');
    if (p.colonies) systems.push('colonies');
    if (p.starChart) systems.push('starChart');
    if (p.weaving) systems.push('weave');
    if (p.trading) systems.push('trade');
    if (p.dysonAssembly) systems.push('dyson');
    if (p.cosmicTuning) systems.push('tuning');
    if (p.senateFocus) systems.push('senate');
    if (p.realityForge) systems.push('forge');
    console.log(`  ${name.padEnd(15)} ${p.description}`);
    console.log(`${''.padEnd(17)}Systems: ${systems.join(', ') || 'none'}`);
  }
  console.log();
  process.exit(0);
}

// Resolve scenarios
_jsonMode = args.json;
const scenarioNames = args.scenario.split(',').map(s => s.trim());
const allResults = [];
const jsonOutputs = [];

const globalSeed = args.seed != null ? args.seed : Math.floor(Math.random() * 2147483647);

for (const scenarioName of scenarioNames) {
  // Merge scenario defaults with CLI overrides
  const scenarioDef = SCENARIOS[scenarioName];
  const opts = {
    profile: scenarioDef ? scenarioDef.profile : args.profile,
    maxTime: scenarioDef ? scenarioDef.maxTime : args.maxTime,
    targetEra: scenarioDef ? scenarioDef.targetEra : args.targetEra,
    prestige: scenarioDef ? scenarioDef.prestige : args.prestige,
    prestigeAtEra: scenarioDef?.prestigeAtEra || args.prestigeAtEra,
    seed: globalSeed,
    snapshotInterval: args.snapshotInterval,
    verbose: args.verbose,
    quiet: args.quiet,
  };

  // CLI overrides take precedence when explicitly provided
  const rawArgs = process.argv.slice(2);
  if (rawArgs.includes('--profile')) opts.profile = args.profile;
  if (rawArgs.includes('--max-time')) opts.maxTime = args.maxTime;
  if (rawArgs.includes('--target-era')) opts.targetEra = args.targetEra;
  if (rawArgs.includes('--prestige')) opts.prestige = args.prestige;
  if (rawArgs.includes('--prestige-at-era')) opts.prestigeAtEra = args.prestigeAtEra;

  if (!args.quiet) {
    log(`\nRunning scenario: ${scenarioName} (profile: ${opts.profile}, target: era ${opts.targetEra}, max: ${fmtTime(opts.maxTime)}, seed: ${opts.seed})`);
  }

  const { state, collector } = runScenario(opts);
  collector.completionStatus.profile = opts.profile;

  allResults.push({ scenarioName, opts, collector, state });
  jsonOutputs.push(buildJsonResult(scenarioName, opts, collector, opts.seed));
}

// Output
if (args.json) {
  const output = jsonOutputs.length === 1 ? jsonOutputs[0] : jsonOutputs;
  console.log(JSON.stringify(output, null, 2));
} else if (args.quiet) {
  // Summary table only
  printSummaryTable(allResults);
} else {
  // Full human-readable reports
  for (const { scenarioName, opts, collector } of allResults) {
    printHumanReport(scenarioName, opts, collector);
  }
  if (allResults.length > 1) {
    printSummaryTable(allResults);
  }
}

// Comparison
if (args.compare) {
  runComparison(allResults, args.compare);
}

if (args.assertBalance) {
  const passed = assertBalanceTargets(allResults);
  if (!passed) process.exit(1);
}
