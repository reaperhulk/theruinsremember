import { createInitialState, migrateState } from '../src/engine/state.js';
import { advanceTime } from '../src/engine/advanceTime.js';
import { tick } from '../src/engine/tick.js';
import { getAvailableUpgrades, getUpgradeCost, purchaseUpgrade, isDecisionUpgrade, buyNextRepeatableMilestone } from '../src/engine/upgrades.js';
import { getAvailableTech, unlockTech, isDecisionTech } from '../src/engine/tech.js';
import { gather, canAfford, isGatheringAutomated, getEffectiveCap } from '../src/engine/resources.js';
import { getExpeditionRoutes, runExpedition } from '../src/engine/expeditions.js';
import { getDockingInfo, attemptDock, selectDockingMission } from '../src/engine/docking.js';
import { selectColonyMandate } from '../src/engine/colonies.js';
import { selectNetworkPlan } from '../src/engine/starChart.js';
import { getDysonStats, commissionDysonModule } from '../src/engine/dyson.js';
import { getSenateStats, enactSenatePolicy } from '../src/engine/senate.js';
import { getWeavingStats, weaveRealityLaw } from '../src/engine/weaving.js';
import { getTuningStats, lockCosmicSignal } from '../src/engine/tuning.js';
import { getRealityForgeRecipes, forgeRealityKey, getCycleReadiness } from '../src/engine/realityForge.js';
import { selectNextCycleDoctrine } from '../src/engine/cycles.js';
import { getPrestigeShop, purchasePrestigeUpgrade, performPrestige } from '../src/engine/prestige.js';
import { claimRelic, declineRelicOffer } from '../src/engine/relics.js';
import { getForgettingStats, placeWarden } from '../src/engine/forgetting.js';
import { createPersonaProfiles, getPlayerAttention } from './playtest-personas.js';
import { mulberry32 } from './bot-playtest.js';
import { scenarioOutcome, describeProgressionBlockers, validateSimulationState } from './progression-contract.mjs';

const BUDGETS = { newcomer: 1, engaged: 2, optimizer: 4, background: 2, check_in: 2, offline_returner: 2, completionist: 2, minimalist: 1 };

// Each returned transition is ONE visible player command. No giveAll, direct
// ownership writes, hidden prerequisite bypass, or batch of exclusive choices.
function candidateActions(state, profile, options, rng) {
  const reverse = options.branch === 'reverse';
  const ordered = values => reverse ? [...values].reverse() : values;
  const actions = [];
  const add = (name, fn) => actions.push({ name, fn });
  const techs = ordered(getAvailableTech(state)).filter(tech => tech.id !== options.blockedTech);
  for (const tech of techs) {
    if (state.autoBuildOut !== false && state.era >= 2 && !isDecisionTech(tech)) continue;
    if (canAfford(state, tech.cost)) add(`research:${tech.id}`, s => unlockTech(s, tech.id));
  }
  const upgrades = ordered(getAvailableUpgrades(state));
  for (const upgrade of upgrades) {
    if (upgrade.repeatable) continue;
    if (state.autoBuildOut !== false && !isDecisionUpgrade(upgrade)) continue;
    if (canAfford(state, getUpgradeCost(state, upgrade.id))) add(`buy:${upgrade.id}`, s => purchaseUpgrade(s, upgrade.id));
  }
  if (state.era <= 3 && profile.expeditions && options.skip !== 'expedition') {
    const routes = getExpeditionRoutes(state.era);
    const route = routes[profile.expeditionStrategy === 'safe' ? 0 : profile.expeditionStrategy === 'deep' ? 2 : 1];
    if (state.expedition.supplies >= 1) add(`expedition:${route.id}`, s => runExpedition(s, route.id, rng).state);
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
    if (stats.nextAct && stats.cooldown <= 0) {
      const faction = stats.nextAct === 'mandate' ? 'merchants' : stats.nextAct === 'coalition' ? 'scholars' : null;
      add(`senate:${stats.nextAct}`, s => enactSenatePolicy(s, stats.nextAct, faction)?.state);
    }
  }
  if (state.era >= 8 && profile.weaving && options.skip !== 'weaving') {
    const stats = getWeavingStats(state);
    const id = ordered(['temporal', 'causal', 'quantum', 'spatial']).find(id => !stats.laws[id]);
    if (stats.remaining > 0) add(`law:${id}`, s => weaveRealityLaw(s, id)?.state);
  }
  if (state.era >= 9 && profile.cosmicTuning && options.skip !== 'tuning') {
    const stats = getTuningStats(state);
    const id = ordered(['stability', 'power', 'constants', 'fracture']).find(id => !stats.locked[id]);
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
    add('relic', s => s.activeRelics.length < 2 ? claimRelic(s, s.relicOffer[0]) : declineRelicOffer(s));
  }
  if (profile.buyPrestigeUpgrades) {
    const shop = getPrestigeShop(state);
    const order = profile.prestigeUpgradeOrder || [];
    const upgrade = [...shop].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id)).find(u => !u.owned && !u.locked && u.affordable);
    if (upgrade) add(`memory:${upgrade.id}`, s => purchasePrestigeUpgrade(s, upgrade.id));
  }
  if (!isGatheringAutomated(state) && profile.gather) {
    const resources = Object.entries(state.resources).filter(([id, r]) => r.unlocked && r.amount < getEffectiveCap(state, id));
    const lowest = resources.sort((a, b) => a[1].amount / getEffectiveCap(state, a[0]) - b[1].amount / getEffectiveCap(state, b[0]))[0];
    if (lowest) add(`gather:${lowest[0]}`, s => gather(s, lowest[0], 1, rng));
  }
  if (options.inefficient && rng() < 0.35) {
    const repeatable = upgrades.find(u => u.repeatable && canAfford(state, getUpgradeCost(state, u.id)));
    if (repeatable) actions.unshift({ name: `milestone:${repeatable.id}`, fn: s => buyNextRepeatableMilestone(s, repeatable.id) });
  }
  return actions;
}

export function runPlayerJourney(options = {}) {
  const { persona = 'engaged', seed = 424242, cycles = 1, maxSeconds = 172800 } = options;
  const profile = createPersonaProfiles()[persona];
  if (!profile) throw new Error(`Unknown persona: ${persona}`);
  const rng = options.badLuck ? () => 0.999999 : mulberry32(seed);
  let state = createInitialState();
  let elapsed = 0;
  let commands = 0;
  let activeSeconds = 0;
  let sessions = 0;
  let offlineSeconds = 0;
  let cursor = 0;
  const trace = [];
  const cycleResults = [];
  let invalidState = [];
  // Setting an exposed initial preference is allowed; owning upgrades is not.
  if (options.manualBuildOut) state = { ...state, autoBuildOut: false };
  while (elapsed < maxSeconds) {
    const attention = getPlayerAttention(profile, elapsed);
    if (attention.sessionStart) sessions++;
    if (attention.offline) {
      const phase = elapsed % profile.attention.sessionInterval;
      const gap = Math.min(maxSeconds - elapsed, profile.attention.sessionInterval - phase);
      // Exactly the save serialization, migration, and catch-up path used by
      // a closing browser. No player command can occur during this interval.
      state = migrateState(JSON.parse(JSON.stringify(state)));
      state = advanceTime(state, gap, rng, 60, { pauseForgetting: true });
      elapsed += gap;
      offlineSeconds += gap;
      continue;
    }
    if (attention.decisionWindow) {
      let budget = BUDGETS[persona];
      if (getCycleReadiness(state).ready) {
        cycleResults.push({ cycle: (state.prestigeCount || 0) + 1, elapsed, duration: state.totalTime });
        if (cycleResults.length >= cycles) break;
        state = performPrestige(state);
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
          if (!next || next === state) continue;
          state = next;
          commands++;
          trace.push({ elapsed, era: state.era, command: candidate.name });
          if (trace.length > 30) trace.shift();
          cursor = (cursor + probe + 1) % candidates.length;
          acted = true;
          break;
        }
        if (!acted) break;
      }
    }
    if (attention.present) activeSeconds++;
    state = tick(state, 1, rng);
    elapsed++;
    if (elapsed % 60 === 0) {
      invalidState = validateSimulationState(state);
      if (invalidState.length) break;
    }
  }
  const outcome = scenarioOutcome(state, { targetEra: 10, prestige: cycles - 1 }, {
    prestiges: state.prestigeCount || 0, collapsed: !!state.forgetting?.collapsed, invalidState,
  });
  const completed = outcome.completed && cycleResults.length >= cycles;
  return {
    persona, seed, options, completed, elapsedSeconds: elapsed, activeSeconds, offlineSeconds,
    manualActions: commands, sessions, finalEra: state.era, cycleResults,
    failures: completed ? [] : [...outcome.failures, ...(cycleResults.length < cycles ? [`finished ${cycleResults.length}/${cycles} cycles`] : [])],
    blockers: completed ? null : describeProgressionBlockers(state), trace: completed ? undefined : trace,
  };
}
