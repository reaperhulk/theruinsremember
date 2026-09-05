#!/usr/bin/env node
/* global process */
// Bot Playtest CLI — configurable game balance testing tool.
// Usage: node scripts/bot-playtest.js [options]
// Zero external dependencies. Run --help for full usage.

import { createInitialState } from '../src/engine/state.js';
import { tick } from '../src/engine/tick.js';
import { purchaseUpgrade, getAvailableUpgrades, getUpgradeCost, buyMaxRepeatable, isDecisionUpgrade } from '../src/engine/upgrades.js';
import { unlockTech, getAvailableTech, isDecisionTech } from '../src/engine/tech.js';
import { canAfford, gather, getEffectiveRate, getNetRate, isGatheringAutomated } from '../src/engine/resources.js';
import { attemptDock, getDockingInfo, getTargetZone, selectDockingMission } from '../src/engine/docking.js';
import { getColonyBonus, selectColonyMandate } from '../src/engine/colonies.js';
import { getRouteBonus, selectNetworkPlan } from '../src/engine/starChart.js';
import { getWeaveProductionMultiplier, getWeavingStats, weaveRealityLaw } from '../src/engine/weaving.js';
import { getTradeRatio, setTradeRoute } from '../src/engine/trading.js';
import { commissionDysonModule, getDysonStats } from '../src/engine/dyson.js';
import { getTuningProductionMultiplier, getTuningStats, lockCosmicSignal } from '../src/engine/tuning.js';
import { getExpeditionRoutes, runExpedition } from '../src/engine/expeditions.js';
import { getEraReadiness } from '../src/engine/eras.js';
import { forgeRealityKey, getCycleReadiness, getRealityForgeRecipes } from '../src/engine/realityForge.js';
import { countSenateActs, enactSenatePolicy, getSenateGovernmentMultiplier, getSenatePctBonuses, getSenateStats } from '../src/engine/senate.js';
import { selectNextCycleDoctrine } from '../src/engine/cycles.js';
import { descendRecursion, getForgettingStats, placeWarden } from '../src/engine/forgetting.js';
import { claimRelic, declineRelicOffer } from '../src/engine/relics.js';
import { performPrestige, calculatePrestigeBonus, calculatePrestigePoints, purchasePrestigeUpgrade, getPrestigeShop } from '../src/engine/prestige.js';
import { createPersonaProfiles, getPlayerAttention } from './playtest-personas.js';
import { readFileSync } from 'fs';
import { pathToFileURL } from 'node:url';
import { scenarioOutcome, validateSimulationState, describeProgressionBlockers } from './progression-contract.mjs';

// ─── Mulberry32 PRNG ────────────────────────────────────────────────────────
export function mulberry32(seed) {
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
    scenario: 'engaged',
    profile: 'engaged',
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
      case '--allow-incomplete': args.allowIncomplete = true; break;
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

// ─── Attention-Aware Player Personas ────────────────────────────────────────
const PROFILES = createPersonaProfiles();

// ─── Built-in Scenarios ─────────────────────────────────────────────────────
export const SCENARIOS = {
  newcomer:     { profile: 'newcomer',     prestige: 0,  targetEra: 10, maxTime: 28800, purpose: 'First-time player comprehension and pacing' },
  engaged:      { profile: 'engaged',      prestige: 0,  targetEra: 10, maxTime: 21600, purpose: 'Attentive normal-player experience' },
  optimizer:    { profile: 'optimizer',    prestige: 0,  targetEra: 10, maxTime: 14400, purpose: 'Experienced attention-aware speed benchmark' },
  background:   { profile: 'background',   prestige: 0,  targetEra: 10, maxTime: 43200, purpose: 'Open background play with two-minute check-ins' },
  check_in:     { profile: 'check_in',     prestige: 0,  targetEra: 10, maxTime: 86400, purpose: 'Closed-game visits every ten minutes' },
  offline_returner: { profile: 'offline_returner', prestige: 0, targetEra: 4, maxTime: 57600, purpose: 'Four-hour offline returns and honest unattended progress' },
  completionist: { profile: 'completionist', prestige: 0, targetEra: 10, maxTime: 21600, purpose: 'Deliberate exploration of every strategic operation' },
  minimalist:   { profile: 'minimalist',   prestige: 0,  targetEra: 10, maxTime: 43200, purpose: 'Economic-only progression with honest decision intervals' },
  descent:      { profile: 'optimizer',    prestige: 0,  targetEra: 10, maxTime: 21600, profileOverrides: { maxRecursionDepth: 12 }, stopOnCollapse: true, purpose: 'Final-siege recursion and forced-collapse coverage' },
  prestige3:    { profile: 'optimizer',    prestige: 3,  targetEra: 10, maxTime: 28800, purpose: 'Attention-aware prestige loop balance' },
  prestige10:   { profile: 'optimizer',    prestige: 10, targetEra: 10, maxTime: 86400, purpose: 'Attention-aware prestige stress test' },
};

const BALANCE_TARGETS = {
  optimizer: {
    minTime: 720,
    maxTime: 1800,
    requiredEra: 10,
    cycleReady: true,
    maxFirstOperationLatency: 60,
    maxIgnoredOperations: 0,
    maxFirstRelicTime: 600,
    minRelics: 2,
    maxDockingAttempts: 30,
    maxDockingActions: 3,
    maxColonyActions: 1,
    maxTradingActions: 7,
    maxGatherActions: 120,
    maxTechnologyActions: 30,
    maxUpgradeActions: 120,
    maxDysonCommissions: 3,
    maxRealityLaws: 3,
    maxTuningLocks: 3,
    maxSenateActs: 3,
    maxStarChartActions: 2,
    minTendrilsSealed: 1,
    maxMemoriesConsumed: 0,
    noCollapse: true,
    maxDecisionWindowRatio: 0.51,
    maxActionsWhileAway: 0,
    // Key N bounds the duration of era N-1.
    eraRanges: {
      2: [60, 240],
      3: [60, 300],
      4: [5, 180],
      // Era 4 dwell is pinned by an affordability cliff under doctrine-fork
      // power; contracts, techs, and mastery still all complete. Floor
      // recalibrated 25s -> 20s when forks landed (total run grew ~90s).
      5: [20, 180],
      6: [15, 180],
      // Eras 6 and 7 introduce the star chart and the Dyson sphere and used to
      // be over in 59s and 124s. Route surveying and Dyson commissioning are
      // now paced so the operations can be seen; the ceilings move with them.
      7: [75, 240],
      8: [120, 260],
      9: [60, 180],
      10: [90, 180],
    },
  },
  descent: { minRecursionDepth: 2, requireCollapse: true, minStatePrestiges: 1 },
  // The compression floor: with three prestiges banked the final run must
  // still take minutes, not seconds — decisions replay every cycle.
  prestige3: { minTime: 210, requiredEra: 10, cycleReady: true, minPrestiges: 3 },
  prestige10: { minTime: 120, maxTime: 1800, requiredEra: 10, cycleReady: true, minPrestiges: 10 },
  newcomer: { minTime: 900, maxTime: 7200, requiredEra: 10, cycleReady: true, noCollapse: true, maxDecisionWindowRatio: 0.06, maxActionsWhileAway: 0 },
  engaged: { minTime: 600, maxTime: 5400, requiredEra: 10, cycleReady: true, noCollapse: true, maxDecisionWindowRatio: 0.11, maxActionsWhileAway: 0 },
  background: { minTime: 1200, maxTime: 10800, requiredEra: 10, cycleReady: true, noCollapse: true, minSessions: 4, minAwaySeconds: 300, maxActiveRatio: 0.35, maxActionsWhileAway: 0 },
  check_in: { minTime: 1800, maxTime: 43200, requiredEra: 10, cycleReady: true, noCollapse: true, minSessions: 3, minOfflineSeconds: 600, maxActiveRatio: 0.2, maxActionsWhileAway: 0 },
  offline_returner: { minTime: 28800, maxTime: 57600, requiredEra: 4, noCollapse: true, minSessions: 3, minOfflineSeconds: 28000, maxActiveRatio: 0.05, maxActionsWhileAway: 0 },
  completionist: { minTime: 600, maxTime: 5400, requiredEra: 10, cycleReady: true, noCollapse: true, maxIgnoredOperations: 0, maxDecisionWindowRatio: 0.21, maxActionsWhileAway: 0 },
  minimalist: { minTime: 4800, maxTime: 25200, requiredEra: 10, cycleReady: true, noCollapse: true, maxDecisionWindowRatio: 0.04, maxActionsWhileAway: 0 },
};

// ─── Bot Action Functions ───────────────────────────────────────────────────

function botGather(state, profile, t, rng) {
  if (!profile.gather || !profile.gatherInterval) return state;
  if (isGatheringAutomated(state)) return state;
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

function botBuyUpgrades(state, profile, t, _rng) {
  if (!profile.buyUpgrades) return state;
  const available = getAvailableUpgrades(state);
  // Non-repeatable first
  for (const upgrade of available) {
    if (upgrade.repeatable) continue;
    if (state.autoBuildOut !== false && !isDecisionUpgrade(upgrade)) continue;
    const cost = getUpgradeCost(state, upgrade.id);
    if (canAfford(state, cost)) {
      const result = purchaseUpgrade(state, upgrade.id);
      if (result) state = result;
    }
  }
  // Repeatables are a resource sink, not progression. A competent player
  // finishes the era foundation before spending the bottleneck stockpile.
  if (!getEraReadiness(state).upgradesMet) return state;
  if (t % 15 !== 0) return state;
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
    if (state.era >= 2 && state.autoBuildOut !== false && !isDecisionTech(tech)) continue;
    if (canAfford(state, tech.cost)) {
      const result = unlockTech(state, tech.id);
      if (result) state = result;
    }
  }
  return state;
}

function botDock(state, profile, t, rng) {
  if (!profile.docking || state.era !== 4) return state;
  const interval = profile.dockInterval || 3;
  if (t % interval !== 0) return state;

  const missions = ['cargo', 'crew', 'science'];
  const dockingInfo = getDockingInfo(state);
  if (dockingInfo.cooldown > 0) return state;
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

function botColonies(state, profile, _t, _rng) {
  if (!profile.colonies || state.era < 5) return state;
  if (state.colonyMandate) return state;
  const mandates = {
    diversified: 'federation',
    growth: 'resilience',
    science: 'inquiry',
    industry: 'extraction',
  };
  return selectColonyMandate(state, mandates[profile.colonyStrategy] || 'federation');
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
  if (state.tradeRoute?.era === state.era) return state;
  // Reassess a standing reserve route at most once per era.
  if (t % 30 !== 0) return state;

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

  for (const [bottleneckId] of bottlenecks) {
    for (const [surplusId, surplusR] of surplus) {
      if (surplusR.amount < 10) continue;
      const ratio = getTradeRatio(surplusId, bottleneckId);
      if (!ratio) continue;
      return setTradeRoute(state, surplusId, bottleneckId);
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

function botForgetting(state, profile, t, _rng) {
  if (!profile.forgettingDefense || state.era < 10 || !state.forgetting || state.forgetting.collapsed) return state;
  if (t % profile.forgettingDefense !== 0) return state;

  const stats = getForgettingStats(state);
  const guarded = new Set(stats.wardens.map(warden => warden.nodeId).filter(Boolean));
  // Most urgent live threat on an unguarded, unscarred memory
  const threats = stats.tendrils
    .filter(tendril => tendril.phase !== 'held' && !guarded.has(tendril.targetId))
    .sort((a, b) => a.eta - b.eta);
  if (threats.length === 0) return state;

  // A warden is free if it is off-cooldown and not holding a live tendril
  const busy = new Set(stats.tendrils.map(tendril => tendril.targetId));
  const free = stats.wardens.find(warden =>
    warden.cooldownRemaining <= 0 && (!warden.nodeId || !busy.has(warden.nodeId)));
  if (!free) return state;

  const result = placeWarden(state, free.id, threats[0].targetId);
  return result ? result.state : state;
}

function botDescend(state, profile, _t, _rng) {
  if (!profile.maxRecursionDepth || state.era < 10) return state;
  if ((state.recursionDepth || 0) >= profile.maxRecursionDepth) return state;
  const result = descendRecursion(state);
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
      forgetting: { sealed: 0, consumed: 0, meterMax: 0, depthMax: 0, collapsed: false },
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
      attention: {
        sessions: 0,
        decisionWindows: 0,
        activeSeconds: 0,
        awaySeconds: 0,
        offlineSeconds: 0,
        manualActions: 0,
        actionsWhileAway: 0,
      },
    },
    // High-water mark. A scenario can end BELOW its peak by design — the
    // descent scenario runs until the Forgetting collapses, and collapse
    // forces a prestige that resets era to 1 and totalTime to 0. Judging
    // completion by the final state labelled a healthy run STUCK / 0m00s.
    peak: { era: 1, time: 0 },
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
    availableUpgradeIds: getAvailableUpgrades(state).map(upgrade => upgrade.id),
    ownedUpgradeIds: Obje…20107 tokens truncated…iege: ${siegeFailed ? 'FAILED' : 'canvas + mirror, warden stationed via mirror'}`);
  const forgeReady = await page.evaluate(() => {
    const select = document.querySelector('.operation-archive select');
    if (!select) return false;
    select.value = '';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  });
  await new Promise(resolve => setTimeout(resolve, 150));
  const cycleReadyVisible = forgeReady && await page.evaluate(() => (
    !!document.querySelector('.reality-forge-panel .cycle-readiness') &&
    !!document.querySelector('.prestige-btn') &&
    document.querySelectorAll('.cycle-doctrines button').length === 3
  ));
  const forgeFailed = !cycleReadyVisible;
  console.log(`  Reality Forge cycle readiness: ${cycleReadyVisible ? 'visible' : 'FAILED'}`);

  let doctrineCycleFailed = false;
  const doctrineOrder = ['reconstruction', 'expansion', 'transcendence'];
  for (let cycle = 0; cycle < PRESTIGE_CYCLES; cycle++) {
    const doctrineId = doctrineOrder[cycle % doctrineOrder.length];
    if (cycle === 0) {
      await page.evaluate(() => window.__game.setState(state => ({
        ...state,
        prestigeUpgrades: { ...state.prestigeUpgrades, fastStart: true },
      })));
      await new Promise(r => setTimeout(r, 100));
    }
    await page.evaluate(index => document.querySelectorAll('.cycle-doctrines button')[index]?.click(), cycle % doctrineOrder.length);
    await new Promise(r => setTimeout(r, 100));
    await page.evaluate(() => document.querySelector('.prestige-btn')?.click());
    await new Promise(r => setTimeout(r, 200));
    await page.evaluate(() => document.querySelector('.confirm-yes')?.click());
    await new Promise(r => setTimeout(r, 300));
    const cycleStart = await page.evaluate(() => {
      const state = window.__game.getState();
      return {
        doctrine: state.cycleDoctrine,
        food: state.resources.food.amount,
        quantumKeys: state.realityKeys?.quantum || 0,
        forkHearth: !!state.upgrades.forkHearth,
        forkQuarry: !!state.upgrades.forkQuarry,
      };
    });
    const expectedSeed = cycleStart.quantumKeys * 25;
    if (cycleStart.doctrine !== doctrineId || cycleStart.food < expectedSeed || cycleStart.forkHearth || cycleStart.forkQuarry) {
      doctrineCycleFailed = true;
    }
    console.log(`  Cycle ${cycle + 1} begins with ${cycleStart.doctrine || 'no'} doctrine and ${Math.floor(cycleStart.food)} food`);
    await loadEra10Fixture(page);
    console.log(`  Prestige reset fixture ${cycle + 1} checked (not a progression journey)`);
  }

  // Always run layout check at current state
  await stopPump(page);
  await new Promise(r => setTimeout(r, 300));
  await page.evaluate(() => document.querySelector('#tab-upgrades')?.click());
  await new Promise(r => setTimeout(r, 200));
  const layout = await checkLayout(page);
  console.log('\n=== LAYOUT CHECK ===');
  layout.ok.forEach(o => console.log('  ✓ ' + o));
  layout.issues.forEach(i => console.log('  ✗ ' + i));
  await screenshot(page, 'era10_check');
  await stopPump(page);

  const tabIssues = [];
  for (const tab of ['tech', 'mini', 'trading', 'prestige', 'stats']) {
    await page.evaluate(tabId => document.querySelector('#tab-' + tabId)?.click(), tab);
    await new Promise(r => setTimeout(r, 100));
    const tabLayout = await checkLayout(page);
    tabIssues.push(...tabLayout.issues.map(issue => `${tab}: ${issue}`));
  }
  await page.evaluate(() => document.querySelector('#tab-upgrades')?.click());

  // Final state
  const final = await getState(page);
  console.log('\n=== FINAL STATE ===');
  console.log(`  Era: ${final.era} | Upgrades: ${final.upgrades} | Tech: ${final.tech}`);
  console.log(`  Achievements: ${final.achievements} | Prestige: ${final.prestigeCount} (x${final.prestigeMultiplier})`);
  console.log(`  Prestige upgrades: ${final.prestigeUpgrades}/${Object.keys(prestigeUpgrades).length}`);
  if (final.trueEnding) console.log('  TRUE ENDING achieved');

  // Console errors
  if (consoleErrors.length > 0) {
    console.log(`\n=== CONSOLE ERRORS (${consoleErrors.length}) ===`);
    [...new Set(consoleErrors)].slice(0, 10).forEach(e => console.log('  ' + e.substring(0, 120)));
  } else {
    console.log('\n  ✓ No console errors');
  }

  // Mobile check
  if (MOBILE) {
    const mobileLayout = await checkLayout(page);
    console.log('\n=== MOBILE LAYOUT ===');
    mobileLayout.ok.forEach(o => console.log('  ✓ ' + o));
    mobileLayout.issues.forEach(i => console.log('  ✗ ' + i));
  }

  if (SCREENSHOTS) console.log(`\nScreenshots: ${SCREENSHOT_DIR}/`);

  const finalLayout = await checkLayout(page);
  const progressionFailed = !earlyGameReached || final.era < 10 || final.prestigeCount < PRESTIGE_CYCLES;
  if (progressionFailed) {
    console.log(`\n  ✗ Progression target missed: era ${final.era}/10, prestige ${final.prestigeCount}/${PRESTIGE_CYCLES}`);
  }
  tabIssues.forEach(issue => console.log('  ✗ ' + issue));
  const exitCode = finalLayout.issues.length > 0 || tabIssues.length > 0 || consoleErrors.length > 0 || progressionFailed || migrationFailed || offlineFailed || automationFailed || operationFailed || relicFailed || operationShellFailed || dysonFailed || tuningFailed || weavingFailed || senateFailed || colonyFailed || tradeRouteFailed || chartFailed || siegeFailed || forgeFailed || doctrineCycleFailed ? 1 : 0;
  await browser.close();
  process.exit(exitCode);
}

run().catch(e => { console.error(e); process.exit(1); });
