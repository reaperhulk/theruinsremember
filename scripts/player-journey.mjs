import { approveEraAdvance, needsEraReview, checkEraTransition } from '../src/engine/eras.js';
import { parseSave, serializeSave } from '../src/engine/saves.js';
import { researchDoctrine, craftRelic, contributeProject, RECONSTRUCTION_PROJECTS, DOCTRINE_RESEARCH, saveAutomationPlan, restoreAutomationPlan, togglePlanRepeat } from '../src/engine/archive.js';
import { queueGoal } from '../src/engine/goals.js';
import { selectProductionRoute, hasRelicSynergy } from '../src/engine/legacy.js';
import { RELIC_IDS } from '../src/data/relics.js';
import { createInitialState } from '../src/engine/state.js';
import { setDevelopmentFocus } from '../src/engine/development.js';
import { getAvailableProjects, getProjectCost, purchaseProject } from '../src/engine/projects.js';
import { getSupplyRunTarget, startSupplyRun, submitSupplyRoute } from '../src/engine/supplyRun.js';
import { solveSupplyBoard } from './supply-run-policy.mjs';
import { advanceTime } from '../src/engine/advanceTime.js';
import { tick } from '../src/engine/tick.js';
import { getAvailableUpgrades, getUpgradeCost, purchaseUpgrade, isDecisionUpgrade, buyNextRepeatableMilestone } from '../src/engine/upgrades.js';
import { getAvailableTech, unlockTech, isDecisionTech } from '../src/engine/tech.js';
import { gather, canAfford, isGatheringAutomated, getEffectiveCap } from '../src/engine/resources.js';
import { getExpeditionRoutes, selectExpeditionRoute } from '../src/engine/expeditions.js';
import { getDockingInfo, attemptDock, selectDockingMission } from '../src/engine/docking.js';
import { selectColonyMandate } from '../src/engine/colonies.js';
import { selectNetworkPlan } from '../src/engine/starChart.js';
import { getDysonStats, commissionDysonModule } from '../src/engine/dyson.js';
import { getSenateStats, enactSenatePolicy } from '../src/engine/senate.js';
import { REALITY_LAWS, getWeaveCost, getWeavingStats, weaveRealityLaw } from '../src/engine/weaving.js';
import { COSMIC_BANDS, getTuningStats, lockCosmicSignal } from '../src/engine/tuning.js';
import { getRealityForgeRecipes, forgeRealityKey, getCycleReadiness } from '../src/engine/realityForge.js';
import { selectNextCycleDoctrine } from '../src/engine/cycles.js';
import { getPrestigeShop, purchasePrestigeUpgrade, performPrestige } from '../src/engine/prestige.js';
import { getRelicSlotLimit, claimRelic, declineRelicOffer } from '../src/engine/relics.js';
import { getForgettingStats, placeWarden } from '../src/engine/forgetting.js';
import { createPersonaProfiles, getPlayerAttention } from './playtest-personas.js';
import { mulberry32 } from './bot-playtest.js';
import { getPurchaseTarget, prioritizePurchase } from '../src/engine/guidance.js';
import { calculateEconomy, getCostPressure, expandStorage } from '../src/engine/economy.js';
import { createPacingMonitor } from './journey-pacing.mjs';
import { scenarioOutcome, describeProgressionBlockers, validateSimulationState } from './progression-contract.mjs';

const BUDGETS = { newcomer: 1, engaged: 2, optimizer: 4, background: 2, check_in: 2, offline_returner: 2, completionist: 2, minimalist: 1 };

// Each returned transition is ONE visible player command. No giveAll, direct
// ownership writes, hidden prerequisite bypass, or batch of exclusive choices.
export function candidateActions(state, profile, options, rng) {
  if (needsEraReview(state) && checkEraTransition(state)) return [{ name: 'continue-era', fn: approveEraAdvance }];
  const reverse = options.branch === 'reverse';
  const rank = value => [...`${options.seed || 424242}:${state.prestigeCount}:${value.id || value}`].reduce((hash, c) => Math.imul(hash ^ c.charCodeAt(0), 16777619) >>> 0, 2166136261);
  const ordered = values => options.branch === 'random' ? [...values].sort((a, b) => rank(a) - rank(b)) : reverse ? [...values].reverse() : values;
  const actions = [];
  if (options.useRecovery) {
    const target = getPurchaseTarget(state);
    const economy = calculateEconomy(state);
    const pressure = target && getCostPressure(state, target.cost, economy);
    const storage = pressure?.find(p => p.reason === 'capacity' && state.resources[p.id].amount >= economy.capacity[p.id] * 0.6);
    if (storage) return [{ name: 'expand-storage', fn: s => expandStorage(s, storage.id) }];
    if (target && (state.protectProgression === false || pressure.some(p => p.reason === 'production')) && (!target.queued || state.protectProgression === false) && (target.queued || state.goals.length < 5)) return [{ name: 'protect-purchase', fn: s => prioritizePurchase(s, target) }];
  }
  const add = (name, fn) => actions.push({ name, fn });
  if (options.useSupplyRuns) {
    const run = state.supplyRun;
    if (run.phase === 'active') {
      const route = solveSupplyBoard(run);
      if (route) add('draw-supply-route', s => submitSupplyRoute(s, route));
    } else if (run.cooldownUntil <= state.totalTime && getSupplyRunTarget(state)) {
      add('start-supply-run', startSupplyRun);
    }
  }
  const techs = ordered(getAvailableTech(state)).filter(tech => tech.id !== options.blockedTech);
  for (const tech of techs) {
    if (state.autoBuildOut !== false && !isDecisionTech(tech)) continue;
    if (canAfford(state, tech.cost)) add(`research:${tech.id}`, s => unlockTech(s, tech.id));
  }
  const upgrades = ordered(getAvailableUpgrades(state));
  if (state.autoBuildOut === false) for (const project of ordered(getAvailableProjects(state))) {
    if (canAfford(state, getProjectCost(state, project.id))) add(`project:${project.id}`, s => purchaseProject(s, project.id));
  }
  for (const upgrade of upgrades) {
    if (upgrade.repeatable) continue;
    if (!isDecisionUpgrade(upgrade)) continue;
    if (canAfford(state, getUpgradeCost(state, upgrade.id))) add(`buy:${upgrade.id}`, s => purchaseUpgrade(s, upgrade.id));
  }
  if (state.era <= 3 && profile.expeditions && options.skip !== 'expedition') {
    const routes = getExpeditionRoutes(state.era);
    const route = routes[profile.expeditionStrategy === 'safe' ? 0 : profile.expeditionStrategy === 'deep' ? 2 : 1];
    if (state.expedition.routeId !== route.id) add(`expedition:${route.id}`, s => selectExpeditionRoute(s, route.id));
  }
  if (state.era === 4 && profile.docking && options.skip !== 'docking') {
    const info = getDockingInfo(state);
    const mission = ['cargo', 'crew', 'science'].find(id => (info.contracts[id] || 0) < info.contractQuota);
    if (mission && info.cooldown <= 0) {
      if (state.dockingMission !== mission) add(`mission:${mission}`, s => selectDockingMission(s, mission));
      else add('dock', s => attemptDock(s, options.badLuck ? 0 : rng()).state);
    }
  }
  if (state.era >= 5 && profile.colonies && options.skip !== 'colonies' && !state.colonyMandate) {
    add('mandate', s => selectColonyMandate(s, reverse ? 'extraction' : 'federation'));
  }
  if (state.era >= 6 && profile.starChart && options.skip !== 'starChart' && !state.networkPlan) {
    add('network', s => selectNetworkPlan(s, reverse ? 'longHaul' : 'coreWeb'));
  }
  if (state.era >= 7 && profile.dysonAssembly && options.skip !== 'dyson') {
    const stats = getDysonStats(state);
    if (stats.remainingModules > 0 && stats.commissionCooldown <= 0) {
      const id = ordered(['frame', 'collector', 'forge'])[stats.totalModules];
      add(`dyson:${id}`, s => commissionDysonModule(s, id)?.state);
    }
  }
  if (state.era >= 8 && profile.senateFocus && options.skip !== 'senate') {
    const stats = getSenateStats(state);
    if (stats.nextAct && stats.cooldown <= 0 && canAfford(state, { galacticInfluence: stats.nextActCost })) {
      const faction = stats.nextAct === 'mandate' ? 'merchants' : stats.nextAct === 'coalition' ? 'scholars' : null;
      add(`senate:${stats.nextAct}`, s => enactSenatePolicy(s, stats.nextAct, faction)?.state);
    }
  }
  if (state.era >= 8 && profile.weaving && options.skip !== 'weaving') {
    const stats = getWeavingStats(state);
    const id = ordered(Object.keys(REALITY_LAWS)).find(id => !stats.laws[id]);
    if (stats.remaining > 0 && stats.cooldown <= 0 && canAfford(state, { realityFragments: getWeaveCost(state) })) add(`law:${id}`, s => weaveRealityLaw(s, id)?.state);
  }
  if (state.era >= 9 && profile.cosmicTuning && options.skip !== 'tuning') {
    const stats = getTuningStats(state);
    const id = ordered(Object.keys(COSMIC_BANDS)).find(id => !stats.locked[id]);
    if (stats.remaining > 0 && stats.cooldown <= 0) add(`signal:${id}`, s => lockCosmicSignal(s, id)?.state);
  }
  if (state.era >= 10) {
    if (!state.nextCycleDoctrine) add('next-doctrine', s => selectNextCycleDoctrine(s, ordered(['reconstruction', 'expansion', 'transcendence'])[(s.prestigeCount || 0) % 3]));
    if (profile.realityForge && options.skip !== 'realityForge') {
      const recipe = getRealityForgeRecipes(state).filter(r => r.affordable).sort((a, b) => a.count - b.count)[0];
      if (recipe) add(`key:${recipe.id}`, s => forgeRealityKey(s, recipe.id));
    }
    if (state.forgetting && profile.forgettingDefense) {
      const stats = getForgettingStats(state);
      const guarded = new Set(stats.wardens.map(w => w.nodeId));
      const threat = stats.tendrils.filter(t => t.phase !== 'held' && !guarded.has(t.targetId)).sort((a, b) => a.eta - b.eta)[0];
      const warden = stats.wardens.find(w => w.cooldownRemaining <= 0 && !stats.tendrils.some(t => t.targetId === w.nodeId));
      if (threat && warden) actions.unshift({ name: 'defend', fn: s => placeWarden(s, warden.id, threat.targetId)?.state });
    }
  }
  if (state.relicOffer.length && profile.relics !== false) {
    add('relic', s => s.activeRelics.length < getRelicSlotLimit(s) ? claimRelic(s, s.relicOffer[0]) : declineRelicOffer(s));
  }
  if (profile.buyPrestigeUpgrades) {
    const shop = getPrestigeShop(state);
    const order = profile.prestigeUpgradeOrder || [];
    const upgrade = [...shop].sort((a, b) => (order.includes(a.id) ? order.indexOf(a.id) : 999) - (order.includes(b.id) ? order.indexOf(b.id) : 999)).find(u => !u.owned && !u.locked && u.affordable);
    if (upgrade) add(`memory:${upgrade.id}`, s => purchasePrestigeUpgrade(s, upgrade.id));
  }
  if (options.useNewSystems && profile.buyPrestigeUpgrades) {
    if (options.collectLegacy && state.archive.research.logistics) {
      const route = state.prestigeCount % 2 ? 'electrolysis' : 'biospheres';
      if (state.productionRoute !== route) add('production-route', s => selectProductionRoute(s, route));
    }
    if (options.collectLegacy && Object.keys(state.archive.research).length === Object.keys(DOCTRINE_RESEARCH).length && state.archive.shards >= 3) {
      const pair = ['openCircuit', 'loomNeedle'];
      const relic = pair.find(id => !state.activeRelics.includes(id)) || (state.activeRelics.length < getRelicSlotLimit(state) && RELIC_IDS.find(id => !state.activeRelics.includes(id)));
      const replace = state.activeRelics.length >= getRelicSlotLimit(state) ? state.activeRelics.find(id => !pair.includes(id)) : null;
      if (relic) add('craft-loadout', s => craftRelic(s, relic, replace));
    }
    if (options.collectLegacy && state.archive.research.conservation && state.archive.savedPlan && (state.activeRelics.length > state.archive.savedPlan.loadout.length || ['openCircuit', 'loomNeedle'].every(id => state.activeRelics.includes(id)) && !['openCircuit', 'loomNeedle'].every(id => state.archive.savedPlan.loadout.includes(id)))) add('save-loadout', saveAutomationPlan);
    if (state.prestigeCount >= 2) {
      const research = ordered(Object.keys(DOCTRINE_RESEARCH)).find(id => !state.archive.research[id] && state.prestigeCount >= (DOCTRINE_RESEARCH[id].unlockAt || 2));
      if (research && state.archive.shards >= DOCTRINE_RESEARCH[research].cost) add('research-doctrine', s => researchDoctrine(s, research));
      if (!state.archive.relicsCrafted && state.archive.shards >= 3) {
        const relic = ['openCircuit', ...RELIC_IDS].find(id => !state.activeRelics.includes(id));
        const replace = state.activeRelics.length >= getRelicSlotLimit(state) ? state.activeRelics.at(-1) : null;
        if (relic) add('craft-relic', s => craftRelic(s, relic, replace));
      }
    }
    if (state.prestigeCount >= 3) for (const [id, project] of Object.entries(RECONSTRUCTION_PROJECTS)) {
      if (state.prestigeCount >= (project.unlockAt || 3) && state.era >= project.era && !(state.archive.projects[id] >= (project.stages || 2)) && state.archive.contributions[id] !== state.prestigeCount && state.resources[project.resource].amount >= getEffectiveCap(state, project.resource) * 0.25) add(`project:${id}`, s => contributeProject(s, id));
    }
    if (state.prestigeCount >= 1 && !state.archive.savedPlan && state.era >= 9) add('save-blueprint', saveAutomationPlan);
    if (state.archive.savedPlan && !state.archive.savedPlan.repeat) add('repeat-blueprint', togglePlanRepeat);
    if (state.archive.savedPlan && !state.blueprintActive) add('restore-blueprint', restoreAutomationPlan);
    if (!state.goals.length && !state.blueprintActive) {
      const goal = techs.find(t => t.grantsEra && !canAfford(state, t.cost));
      if (goal) add('queue-research', s => queueGoal(s, 'tech', goal.id));
    }
  }
  if (!isGatheringAutomated(state) && profile.gather) {
    const resources = Object.entries(state.resources).filter(([id, r]) => r.unlocked && r.amount < getEffectiveCap(state, id));
    const lowest = resources.sort((a, b) => a[1].amount / getEffectiveCap(state, a[0]) - b[1].amount / getEffectiveCap(state, b[0]))[0];
    if (lowest) add(`gather:${lowest[0]}`, s => gather(s, lowest[0], 1, rng));
  }
  if (options.inefficient && rng() < 0.35) {
    // The current construction panel offers only this era's infrastructure.
    const repeatable = upgrades.find(u => u.repeatable && u.era === state.era && canAfford(state, getUpgradeCost(state, u.id)));
    if (repeatable) actions.unshift({ name: `milestone:${repeatable.id}`, fn: s => buyNextRepeatableMilestone(s, repeatable.id) });
  }
  if (options.collectLegacy) {
    const legacyActions = actions.filter(a => /^(project:|research-doctrine|craft-loadout|save-loadout|production-route)/.test(a.name));
    if (legacyActions.length) return legacyActions;
  }
  return actions;
}

export function runPlayerJourney(options = {}) {
  const { persona = 'engaged', seed = 424242, cycles = 1, maxSeconds = 172800 } = options;
  const profile = createPersonaProfiles()[persona];
  if (!profile) throw new Error(`Unknown persona: ${persona}`);
  const rng = options.badLuck ? () => 0.999999 : mulberry32(seed);
  let state = createInitialState();
  if (options.developmentFocus) state = setDevelopmentFocus(state, options.developmentFocus);
  let elapsed = 0;
  let commands = 0;
  let activeSeconds = 0;
  let sessions = 0;
  let offlineSeconds = 0;
  let cursor = 0;
  const trace = [];
  const cycleResults = [];
  let invalidState = [];
  const rejectedCommands = [];
  const pacing = createPacingMonitor(profile, options);
  let maxRelics = 0;
  const legacy = { commands: {}, synergySeconds: 0, conservedRelics: 0, replayedChoices: 0, restoredVisits: 0 };
  // Setting an exposed initial preference is allowed; owning upgrades is not.
  if (options.manualBuildOut) state = { ...state, autoBuildOut: false };
  if (options.disableProtection) state = { ...state, protectProgression: false };
  while (elapsed < maxSeconds) {
    const attention = getPlayerAttention(profile, elapsed);
    options.observe?.(state); // Read-only snapshots for the separate UI fixture suite.
    pacing.observe(state, elapsed, activeSeconds);
    if (pacing.failures.length) break;
    maxRelics = Math.max(maxRelics, state.activeRelics.length);
    if (attention.sessionStart) sessions++;
    if (attention.offline) {
      const phase = elapsed % profile.attention.sessionInterval;
      const gap = Math.min(maxSeconds - elapsed, profile.attention.sessionInterval - phase);
      // Exactly the save serialization, migration, and catch-up path used by
      // a closing browser. No player command can occur during this interval.
      state = parseSave(serializeSave(state));
      state = advanceTime(state, gap, rng, 60, { pauseForgetting: true });
      elapsed += gap;
      offlineSeconds += gap;
      continue;
    }
    if (attention.decisionWindow) {
      let budget = BUDGETS[persona];
      const outstandingProjects = options.useNewSystems && Object.entries(RECONSTRUCTION_PROJECTS).some(([id, p]) => state.prestigeCount >= (p.unlockAt || 3) && state.era >= p.era && (state.archive.projects[id] || 0) < (p.stages || 2) && state.archive.contributions[id] !== state.prestigeCount);
      const affordableLoadout = options.collectLegacy && Object.keys(state.archive.research).length === Object.keys(DOCTRINE_RESEARCH).length && state.archive.shards >= 3 && (state.activeRelics.length < getRelicSlotLimit(state) || ['openCircuit', 'loomNeedle'].some(id => !state.activeRelics.includes(id)));
      if (getCycleReadiness(state).ready && !outstandingProjects && !affordableLoadout) {
        cycleResults.push({ cycle: (state.prestigeCount || 0) + 1, elapsed, duration: state.totalTime });
        if (cycleResults.length >= cycles) break;
        state = performPrestige(state);
        legacy.conservedRelics += state.activeRelics.length;
        commands++;
        budget--;
        cursor = 0;
      }
      for (let slot = 0; slot < budget; slot++) {
        const candidates = candidateActions(state, profile, options, rng);
        if (!candidates.length) break;
        // Rotate through available commands so an affordable repeatable or
        // an always-present operation cannot starve research forever.
        let acted = false;
        for (let probe = 0; probe < candidates.length; probe++) {
          const candidate = candidates[(cursor + probe) % candidates.length];
          const next = candidate.fn(state);
          if (!next || next === state) {
            rejectedCommands.push({ elapsed, era: state.era, command: candidate.name });
            continue;
          }
          state = next;
          legacy.commands[candidate.name] = (legacy.commands[candidate.name] || 0) + 1;
          commands++;
          trace.push({ elapsed, era: state.era, command: candidate.name });
          pacing.recordCommand(candidate.name, state, elapsed);
          if (trace.length > 30) trace.shift();
          cursor = (cursor + probe + 1) % candidates.length;
          acted = true;
          break;
        }
        if (!acted) break;
      }
    }
    if (attention.present) activeSeconds++;
    const previousEra = state.era;
    const previousChoices = state.buildHistory.length;
    if (hasRelicSynergy(state, 'closedCircuit')) legacy.synergySeconds++;
    state = tick(state, 1, rng);
    if (state.blueprintActive) legacy.replayedChoices += Math.max(0, state.buildHistory.length - previousChoices);
    if (state.era !== previousEra && (state.era === 2 && state.archive.projects.foundryDistrict >= 3 || state.era === 4 && state.archive.projects.orbitalCradle >= 3)) legacy.restoredVisits++;
    elapsed++;
    if (elapsed % 60 === 0) {
      invalidState = validateSimulationState(state);
      if (invalidState.length) break;
    }
  }
  const outcome = scenarioOutcome(state, { targetEra: 10, prestige: cycles - 1 }, {
    prestiges: state.prestigeCount || 0, collapsed: !!state.forgetting?.collapsed, invalidState,
  });
  const completed = outcome.completed && cycleResults.length >= cycles && !pacing.failures.length && !rejectedCommands.length;
  return {
    persona, seed, options, completed, elapsedSeconds: elapsed, activeSeconds, offlineSeconds,
    pacing: pacing.report(), rejectedCommands, maxRelics, legacy,
    manualActions: commands, sessions, finalEra: state.era, cycleResults,
    archive: { cycles: state.archive.entries.length, research: Object.keys(state.archive.research), projects: state.archive.projects, crafted: state.archive.relicsCrafted || 0 },
    failures: completed ? [] : [...outcome.failures, ...pacing.failures, ...(rejectedCommands.length ? [`${rejectedCommands.length} advertised commands were rejected`] : []), ...(cycleResults.length < cycles ? [`finished ${cycleResults.length}/${cycles} cycles`] : [])],
    blockers: completed ? null : describeProgressionBlockers(state), trace: completed ? undefined : trace,
  };
}
