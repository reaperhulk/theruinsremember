#!/usr/bin/env node
// Bot Playtest CLI — configurable game balance testing tool.
// Usage: node scripts/bot-playtest.js [options]
// Zero external dependencies. Run --help for full usage.

import { createInitialState } from '../src/engine/state.js';
import { tick } from '../src/engine/tick.js';
import { purchaseUpgrade, getAvailableUpgrades, getUpgradeCost, buyMaxRepeatable } from '../src/engine/upgrades.js';
import { unlockTech, getAvailableTech } from '../src/engine/tech.js';
import { canAfford, gather, getEffectiveRate } from '../src/engine/resources.js';
import { mine } from '../src/engine/mining.js';
import { allocateWorker, getWorkerPool, getAllocation, getMaxWorkers } from '../src/engine/factory.js';
import { startHack, submitHack } from '../src/engine/hacking.js';
import { attemptDock, getTargetZone } from '../src/engine/docking.js';
import { assignColonies, getAssignableColonies, getColonyAssignments, getTotalColoniesAssigned } from '../src/engine/colonies.js';
import { createRoute, getUnlockedSystems, routeExists, getRoutes } from '../src/engine/starChart.js';
import { drawFragment, resolveWeave, getWeavingGrid } from '../src/engine/weaving.js';
import { executeTrade, getTradeRatio } from '../src/engine/trading.js';
import { assembleDysonSegment } from '../src/engine/dyson.js';
import { applyTuning } from '../src/engine/tuning.js';
import { allocateSenateInfluence, getMaxSenateInfluence, getSenateAllocateCost } from '../src/engine/senate.js';
import { performPrestige, calculatePrestigeBonus, calculatePrestigePoints, purchasePrestigeUpgrade, getPrestigeShop } from '../src/engine/prestige.js';
import { resources as resourceDefs } from '../src/data/resources.js';
import { prestigeUpgrades as prestigeUpgradeDefs } from '../src/data/prestige-upgrades.js';
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
    description: 'Engage everything, buy everything, perfect mini-game play. Baseline for pacing.',
    mine: true, gather: true, gatherInterval: 5,
    buyUpgrades: true, buyTech: true,
    factory: true, factoryStrategy: 'balanced',
    hacking: true, hackInterval: 35,
    docking: true, dockInterval: 3, dockAccuracy: 0,
    colonies: true, colonyStrategy: 'diversified',
    starChart: true,
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
  noMinigames: {
    description: 'Buy upgrades/tech, gather, but skip all mini-games. Tests: are mini-games required?',
    mine: true, gather: true, gatherInterval: 5,
    buyUpgrades: true, buyTech: true,
    factory: false, factoryStrategy: 'balanced',
    hacking: false, hackInterval: 35,
    docking: false, dockInterval: 3, dockAccuracy: 0,
    colonies: false, colonyStrategy: 'diversified',
    starChart: false,
    weaving: false, weaveInterval: 10,
    trading: true, tradeStrategy: 'bottleneck',
    dysonAssembly: false,
    cosmicTuning: false,
    senateFocus: null,
    realityForge: false,
    buyPrestigeUpgrades: true,
    prestigeUpgradeOrder: [
      'fastStart', 'luckyMiner', 'headStart', 'deepPockets',
      'wisdomOfAges', 'quantumMemory', 'tradeRoutes', 'eventMagnet',
      'cosmicInsight', 'universalOptimizer', 'chainMaster', 'eraMomentum',
      'autoClicker',
    ],
  },
  passive: {
    description: 'Only auto-production + upgrade buying. No clicking or mini-games. Tests: minimum viable progression.',
    mine: false, gather: false, gatherInterval: 0,
    buyUpgrades: true, buyTech: true,
    factory: false, factoryStrategy: 'balanced',
    hacking: false, hackInterval: 0,
    docking: false, dockInterval: 0, dockAccuracy: 0,
    colonies: false, colonyStrategy: 'diversified',
    starChart: false,
    weaving: false, weaveInterval: 0,
    trading: false, tradeStrategy: 'bottleneck',
    dysonAssembly: false,
    cosmicTuning: false,
    senateFocus: null,
    realityForge: false,
    buyPrestigeUpgrades: true,
    prestigeUpgradeOrder: [
      'fastStart', 'headStart', 'deepPockets', 'wisdomOfAges',
      'quantumMemory', 'cosmicInsight', 'eraMomentum',
    ],
  },
  clickerOnly: {
    description: 'Mining + gathering every tick, no mini-games. Tests: how far can clicking carry you?',
    mine: true, gather: true, gatherInterval: 1,
    buyUpgrades: true, buyTech: true,
    factory: false, factoryStrategy: 'balanced',
    hacking: false, hackInterval: 0,
    docking: false, dockInterval: 0, dockAccuracy: 0,
    colonies: false, colonyStrategy: 'diversified',
    starChart: false,
    weaving: false, weaveInterval: 0,
    trading: false, tradeStrategy: 'bottleneck',
    dysonAssembly: false,
    cosmicTuning: false,
    senateFocus: null,
    realityForge: false,
    buyPrestigeUpgrades: true,
    prestigeUpgradeOrder: [
      'fastStart', 'luckyMiner', 'headStart', 'deepPockets',
      'wisdomOfAges', 'quantumMemory', 'autoClicker',
    ],
  },
  tradingHeavy: {
    description: 'All systems + aggressive trading of surplus into bottleneck resources. Tests: trading impact.',
    mine: true, gather: true, gatherInterval: 5,
    buyUpgrades: true, buyTech: true,
    factory: true, factoryStrategy: 'balanced',
    hacking: true, hackInterval: 35,
    docking: true, dockInterval: 3, dockAccuracy: 0,
    colonies: true, colonyStrategy: 'diversified',
    starChart: true,
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
};

// ─── Built-in Scenarios ─────────────────────────────────────────────────────
const SCENARIOS = {
  full:         { profile: 'optimal',      prestige: 0,  targetEra: 10, maxTime: 14400, purpose: 'Standard pacing baseline' },
  speedrun:     { profile: 'optimal',      prestige: 0,  targetEra: 10, maxTime: 7200,  purpose: 'Optimal time-to-completion' },
  prestige3:    { profile: 'optimal',      prestige: 3,  targetEra: 10, maxTime: 28800, purpose: 'Prestige loop balance' },
  prestige10:   { profile: 'optimal',      prestige: 10, targetEra: 10, maxTime: 86400, purpose: 'Prestige stress test' },
  noMinigames:  { profile: 'noMinigames',  prestige: 0,  targetEra: 10, maxTime: 28800, purpose: 'Mini-game necessity' },
  passive:      { profile: 'passive',      prestige: 0,  targetEra: 10, maxTime: 43200, purpose: 'Minimum viable progression' },
  clickerOnly:  { profile: 'clickerOnly',  prestige: 0,  targetEra: 10, maxTime: 28800, purpose: 'Click-only viability' },
  regression:   { profile: 'optimal',      prestige: 0,  targetEra: 5,  maxTime: 1800,  purpose: 'Quick pacing sanity check' },
  earlyGame:    { profile: 'optimal',      prestige: 0,  targetEra: 3,  maxTime: 900,   purpose: 'Era 1-3 pacing detail' },
  lateGame:     { profile: 'optimal',      prestige: 2,  targetEra: 10, maxTime: 14400, prestigeAtEra: 7, purpose: 'Late-game with prestige' },
};

// ─── Bot Action Functions ───────────────────────────────────────────────────

function botMine(state, profile, t, rng) {
  if (!profile.mine) return state;
  const { state: afterMine } = mine(state, rng(), { skipCooldown: true });
  return afterMine;
}

function botGather(state, profile, t, rng) {
  if (!profile.gather || !profile.gatherInterval) return state;
  if (t % profile.gatherInterval !== 0) return state;
  for (const [id, r] of Object.entries(state.resources)) {
    if (r.unlocked) {
      state = gather(state, id, 1);
    }
  }
  return state;
}

function botBuyUpgrades(state, profile, t, rng) {
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
  // Then repeatable (buy max)
  for (const upgrade of available) {
    if (!upgrade.repeatable) continue;
    const result = buyMaxRepeatable(state, upgrade.id);
    if (result) state = result;
  }
  return state;
}

function botBuyTech(state, profile, t, rng) {
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

function botFactory(state, profile, t, rng) {
  if (!profile.factory || state.era < 2) return state;
  // Re-allocate every 30s to adjust for changing worker pool
  if (t % 30 !== 0) return state;

  const pool = getWorkerPool(state);
  if (pool < 1) return state;

  const strategy = profile.factoryStrategy || 'balanced';
  let alloc;
  if (strategy === 'balanced') {
    const perLine = Math.floor(pool / 3);
    const remainder = pool - perLine * 3;
    alloc = { steel: perLine, electronics: perLine, research: perLine + remainder };
  } else if (strategy === 'steel') {
    alloc = { steel: pool, electronics: 0, research: 0 };
  } else if (strategy === 'electronics') {
    alloc = { steel: 0, electronics: pool, research: 0 };
  } else if (strategy === 'research') {
    alloc = { steel: 0, electronics: 0, research: pool };
  } else {
    // Default balanced
    const perLine = Math.floor(pool / 3);
    const remainder = pool - perLine * 3;
    alloc = { steel: perLine, electronics: perLine, research: perLine + remainder };
  }

  // Apply allocations (must set each line individually via allocateWorker)
  for (const [line, count] of Object.entries(alloc)) {
    const result = allocateWorker(state, line, count);
    if (result) state = result;
  }
  return state;
}

function botHack(state, profile, t, rng) {
  if (!profile.hacking || state.era < 3) return state;
  const interval = profile.hackInterval || 35;
  if (t % interval !== 0) return state;

  // Start a hack and immediately solve it (bot always knows the answer)
  const rolls = [];
  for (let i = 0; i < 8; i++) rolls.push(rng());
  state = startHack(state, rolls);
  if (state.hackChallenge) {
    const { state: afterHack } = submitHack(state, state.hackChallenge.sequence);
    state = afterHack;
  }
  return state;
}

function botDock(state, profile, t, rng) {
  if (!profile.docking || state.era < 4) return state;
  const interval = profile.dockInterval || 3;
  if (t % interval !== 0) return state;

  // Hit the zone center with optional accuracy offset
  const zoneCenter = getTargetZone(state);
  const accuracy = profile.dockAccuracy || 0;
  const offset = accuracy > 0 ? (rng() - 0.5) * accuracy : 0;
  const position = Math.max(0, Math.min(1, zoneCenter + offset));
  const { state: afterDock } = attemptDock(state, position);
  state = afterDock;
  return state;
}

function botColonies(state, profile, t, rng) {
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

function botStarChart(state, profile, t, rng) {
  if (!profile.starChart || state.era < 6) return state;
  // Try to create routes every 60s
  if (t % 60 !== 0) return state;

  const systems = getUnlockedSystems(state);
  const routes = getRoutes(state);
  if (routes.length >= 10) return state;

  // Connect all possible pairs, prioritizing longest distances
  for (let i = 0; i < systems.length; i++) {
    for (let j = i + 1; j < systems.length; j++) {
      if (routeExists(state, systems[i].id, systems[j].id)) continue;
      const result = createRoute(state, systems[i].id, systems[j].id);
      if (result) {
        state = result;
        if (getRoutes(state).length >= 10) return state;
      }
    }
  }
  return state;
}

function botWeave(state, profile, t, rng) {
  if (!profile.weaving || state.era < 8) return state;
  const interval = profile.weaveInterval || 10;
  if (t % interval !== 0) return state;

  // Draw 3 fragments then resolve
  for (let i = 0; i < 3; i++) {
    const { state: afterDraw } = drawFragment(state, rng());
    if (afterDraw) state = afterDraw;
    else break;
  }
  const { state: afterWeave } = resolveWeave(state);
  if (afterWeave) state = afterWeave;
  return state;
}

function botTrade(state, profile, t, rng) {
  if (!profile.trading || state.era < 4) return state;
  // Trade every 30s
  if (t % 30 !== 0) return state;

  const aggressive = profile.tradeStrategy === 'aggressive';
  const tradeInterval = aggressive ? 1 : 1; // always trade when triggered

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

function botDyson(state, profile, t, rng) {
  if (!profile.dysonAssembly || state.era < 7) return state;
  // Assemble every 5s (clicking manually)
  if (t % 5 !== 0) return state;

  const result = assembleDysonSegment(state);
  return result ? result.state : state;
}

function botCosmicTuning(state, profile, t, rng) {
  if (!profile.cosmicTuning || state.era < 9) return state;
  // Tune every 10s with perfect accuracy
  if (t % 10 !== 0) return state;

  const result = applyTuning(state, 'perfect');
  return result ? result.state : state;
}

function botSenate(state, profile, t, rng) {
  if (!profile.senateFocus || state.era < 8) return state;
  // Allocate every 60s
  if (t % 60 !== 0) return state;

  const senate = state.senate || { merchants: 0, scholars: 0, warriors: 0 };
  const totalInfluence = senate.merchants + senate.scholars + senate.warriors;
  const maxInfluence = getMaxSenateInfluence(state);
  if (totalInfluence >= maxInfluence) return state;

  // Choose faction based on strategy
  const focus = profile.senateFocus;
  let faction;
  if (focus === 'balanced') {
    // Add to the lowest faction
    const min = Math.min(senate.merchants, senate.scholars, senate.warriors);
    if (senate.merchants === min) faction = 'merchants';
    else if (senate.scholars === min) faction = 'scholars';
    else faction = 'warriors';
  } else {
    faction = focus; // 'merchants', 'scholars', or 'warriors'
  }

  const result = allocateSenateInfluence(state, faction, 1);
  return result || state;
}

function botRealityForge(state, profile, t, rng) {
  if (!profile.realityForge || state.era < 10) return state;
  // Forge every 30s
  if (t % 30 !== 0) return state;

  const rf = state.resources.realityFragments;
  const qe = state.resources.quantumEchoes;
  if (!rf?.unlocked || !qe?.unlocked) return state;

  // Try each recipe, pick the cheapest affordable one
  const recipes = [
    { id: 'temporal', fragments: 50, echoes: 20 },
    { id: 'spatial', fragments: 30, echoes: 40 },
    { id: 'causal', fragments: 40, echoes: 30 },
    { id: 'quantum', fragments: 20, echoes: 50 },
  ];

  for (const recipe of recipes) {
    if (rf.amount >= recipe.fragments && qe.amount >= recipe.echoes) {
      const newKeys = { ...(state.realityKeys || {}) };
      newKeys[recipe.id] = (newKeys[recipe.id] || 0) + 1;
      return {
        ...state,
        realityKeys: newKeys,
        resources: {
          ...state.resources,
          realityFragments: { ...rf, amount: rf.amount - recipe.fragments },
          quantumEchoes: { ...qe, amount: qe.amount - recipe.echoes },
        },
      };
    }
  }
  return state;
}

function botPrestigeUpgrades(state, profile, t, rng) {
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
    miniGameStats: {
      mining: { attempts: 0, gems: 0 },
      factory: { allocations: 0 },
      hacking: { attempts: 0, successes: 0 },
      docking: { attempts: 0, successes: 0, perfects: 0 },
      colonies: { assignments: 0 },
      starChart: { routes: 0 },
      weaving: { draws: 0, weaves: 0 },
      dyson: { segments: 0 },
      tuning: { tunes: 0, score: 0 },
      senate: { allocations: 0 },
      realityForge: { keys: 0 },
    },
    prestigeLog: [],
    bottlenecks: [],
    completionStatus: { reachedTargetEra: false, totalTime: 0, finalEra: 1, gameComplete: false },
  };
}

function takeSnapshot(state, t, collector) {
  const snap = { time: t, era: state.era, resources: {} };
  for (const [id, r] of Object.entries(state.resources)) {
    if (r.unlocked) {
      const rate = (r.baseRate + r.rateAdd) * r.rateMult * (state.prestigeMultiplier || 1);
      snap.resources[id] = { amount: Math.floor(r.amount * 10) / 10, rate: Math.floor(rate * 100) / 100 };
    }
  }
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

function updateMiniGameStats(prevState, state, collector) {
  const s = collector.miniGameStats;
  s.mining.gems = state.totalGems || 0;
  s.hacking.successes = state.hackSuccesses || 0;
  s.docking.attempts = state.dockingAttempts || 0;
  s.docking.successes = state.dockingSuccesses || 0;
  s.docking.perfects = state.dockingPerfects || 0;
  s.weaving.weaves = state.totalWeaves || 0;
  s.dyson.segments = state.dysonSegments || 0;
  s.tuning.score = state.tuningScore || 0;
  s.starChart.routes = (state.starRoutes || []).length;
  s.realityForge.keys = Object.values(state.realityKeys || {}).reduce((s, v) => s + v, 0);
  s.senate.allocations = (state.senate?.merchants || 0) + (state.senate?.scholars || 0) + (state.senate?.warriors || 0);
}

function detectBottlenecks(state, collector) {
  const available = getAvailableUpgrades(state);
  const techs = getAvailableTech(state);

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

  for (let t = 0; t < maxTicks; t++) {
    const prevState = state;

    // --- Bot actions ---
    state = botMine(state, profileDef, t, rng);
    state = botGather(state, profileDef, t, rng);
    state = botBuyUpgrades(state, profileDef, t, rng);
    state = botBuyTech(state, profileDef, t, rng);
    state = botFactory(state, profileDef, t, rng);
    state = botHack(state, profileDef, t, rng);
    state = botDock(state, profileDef, t, rng);
    state = botColonies(state, profileDef, t, rng);
    state = botStarChart(state, profileDef, t, rng);
    state = botWeave(state, profileDef, t, rng);
    state = botTrade(state, profileDef, t, rng);
    state = botDyson(state, profileDef, t, rng);
    state = botCosmicTuning(state, profileDef, t, rng);
    state = botSenate(state, profileDef, t, rng);
    state = botRealityForge(state, profileDef, t, rng);
    state = botPrestigeUpgrades(state, profileDef, t, rng);

    // Tick the engine
    state = tick(state, DT);

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
    if (prestigesDone < prestige && state.era >= prestigeAtEra) {
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

    // Mini-game stats
    updateMiniGameStats(prevState, state, collector);

    // Bottleneck detection every 5 min
    if (t % 300 === 0) {
      detectBottlenecks(state, collector);
    }

    // Stuck detection (no new upgrades/tech for 5 minutes)
    if (t % 300 === 0) {
      const currentCount = Object.keys(state.upgrades || {}).length + Object.keys(state.tech || {}).length;
      if (currentCount === lastProgressCount) {
        stuckCounter++;
        if (stuckCounter >= 3) {
          if (!quiet) {
            log(`  STUCK at era ${state.era} after ${fmtTime(state.totalTime)} — no progress for 15 min`);
            printResourceSnapshot(state);
          }
          break;
        }
      } else {
        stuckCounter = 0;
      }
      lastProgressCount = currentCount;
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

    // Done?
    if (state.era >= targetEra) {
      if (!quiet) {
        log(`  Reached era ${targetEra} at ${fmtTime(state.totalTime)}`);
      }
      break;
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
    upgradeCount: Object.keys(state.upgrades || {}).length,
    techCount: Object.keys(state.tech || {}).length,
    prestigeCount: prestigesDone,
    prestigeMultiplier: state.prestigeMultiplier || 1,
  };

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

  // Mini-Game Contribution
  const mg = collector.miniGameStats;
  const hasAnyMini = mg.mining.gems > 0 || mg.hacking.successes > 0 || mg.docking.attempts > 0 ||
    mg.starChart.routes > 0 || mg.weaving.weaves > 0 || mg.dyson.segments > 0 ||
    mg.tuning.score > 0 || mg.senate.allocations > 0 || mg.realityForge.keys > 0;

  if (hasAnyMini) {
    console.log('\n── Mini-Game Stats ──');
    if (mg.mining.gems > 0) console.log(`  Mining: ${mg.mining.gems} gems found`);
    if (mg.factory.allocations > 0 || true) console.log(`  Factory: active`);
    if (mg.hacking.successes > 0) console.log(`  Hacking: ${mg.hacking.successes} successes`);
    if (mg.docking.attempts > 0) console.log(`  Docking: ${mg.docking.successes}/${mg.docking.attempts} hits (${mg.docking.perfects} perfect)`);
    if (mg.starChart.routes > 0) console.log(`  Star Chart: ${mg.starChart.routes} routes`);
    if (mg.weaving.weaves > 0) console.log(`  Weaving: ${mg.weaving.weaves} weaves`);
    if (mg.dyson.segments > 0) console.log(`  Dyson: ${mg.dyson.segments} segments`);
    if (mg.tuning.score > 0) console.log(`  Tuning: score ${mg.tuning.score}`);
    if (mg.senate.allocations > 0) console.log(`  Senate: ${mg.senate.allocations} influence allocated`);
    if (mg.realityForge.keys > 0) console.log(`  Reality Forge: ${mg.realityForge.keys} keys forged`);
  }

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
  } catch (e) {
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
  --seed <N>                Fixed RNG seed for deterministic runs
  --snapshot-interval <N>   Seconds between snapshots (default: 300)
  --list-scenarios          Print built-in scenarios and exit
  --list-profiles           Print bot profiles and exit
  -h, --help                Show this help

Examples:
  node scripts/bot-playtest.js --scenario full --json > baseline.json
  node scripts/bot-playtest.js --scenario full --json --compare baseline.json
  node scripts/bot-playtest.js --scenario full,noMinigames,passive --quiet
  node scripts/bot-playtest.js --scenario prestige3 --verbose
  node scripts/bot-playtest.js --seed 42 --verbose
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
    if (p.mine) systems.push('mine');
    if (p.gather) systems.push('gather');
    if (p.factory) systems.push('factory');
    if (p.hacking) systems.push('hack');
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
