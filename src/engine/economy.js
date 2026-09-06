import { decisionMultiplier } from '../data/decisions.js';
import { resources as definitions } from '../data/resources.js';
import { getEffectivePrestige, getEffectiveCap } from './resources.js';
import { getCycleProductionMultiplier } from './cycles.js';
import { getRelicProductionMultiplier } from './relics.js';
import { getWeaveProductionMultiplier } from './weaving.js';
import { getEraMasteryTier } from './eras.js';
import { getRepeatableMilestoneMultiplier } from './upgrades.js';
import { getColonyBonus } from './colonies.js';
import { getRouteBonus } from './starChart.js';
import { getTimedRateMultiplier } from './events.js';
import { getSenateGovernmentMultiplier, getSenatePctBonuses } from './senate.js';
import { getTuningProductionMultiplier } from './tuning.js';
import { getActiveSystems } from './operations.js';
import { getAvailableUpgrades, getUpgradeCost } from './upgrades.js';
import { getAvailableTech } from './tech.js';
import { getActiveGoal } from './goals.js';
import { techTree } from '../data/tech-tree.js';
import { getPublicWorks } from './publicWorks.js';
import { hasRelicSynergy } from './legacy.js';

export const SUPPLY_CHAINS = [
  { input: 'food', output: 'labor', cost: 1 },
  { input: 'energy', output: 'electronics', cost: 0.4 },
  { input: 'rocketFuel', output: 'orbitalInfra', cost: 0.5 },
  { input: 'exoticMaterials', output: 'colonies', cost: 0.2 },
  { input: 'stellarForge', output: 'megastructures', cost: 0.3 },
];
export function getSupplyChains(state) {
  const alternate = !!state.archive?.research?.logistics;
  const living = hasRelicSynergy(state, 'livingWorlds');
  const efficient = hasRelicSynergy(state, 'closedCircuit');
  return SUPPLY_CHAINS.map(chain => {
    let adjusted = chain;
    if (((state.upgrades?.forkElectrify || alternate) && state.productionRoute === 'electrolysis') && chain.output === 'orbitalInfra') adjusted = { ...chain, input: 'energy', cost: 5 };
    if ((living || (state.upgrades?.forkHearth || alternate) && state.productionRoute === 'biospheres') && chain.output === 'colonies') adjusted = { ...chain, input: 'food', cost: living ? 1 : 2 };
    return efficient ? { ...adjusted, cost: adjusted.cost * 0.5 } : adjusted;
  });
}

// Keep the next affordable step within reach before downstream factories use
// its inputs. Prices use the same era scaling and discounts as purchases.
const reserveChoiceCache = new WeakMap();
function getReserveChoices(state) {
  // Engine transitions replace ownership maps. Idle ticks can reuse the
  // catalogue; production, balances, and capacity are still calculated anew.
  const signature = [state.tech, state.era, state.prestigeUpgrades, state.archive?.research,
    state.totalGems, state.totalTrades, state.prestigeCount, state.echoMode, state.echoUpgrades, Math.min(10, state.runUpgradePurchases || 0),
    Object.keys(state.upgrades).length, Object.keys(state.tech).length];
  const cached = reserveChoiceCache.get(state.upgrades);
  if (cached && signature.every((v, i) => v === cached.signature[i])) return cached.choices;
  const choices = [
    ...getAvailableTech(state).map(d => ({ kind: 'tech', id: d.id, name: d.name, cost: d.cost })),
    ...getAvailableUpgrades(state).filter(d => !d.repeatable).map(d => ({ kind: 'upgrade', id: d.id, name: d.name, cost: getUpgradeCost(state, d.id) })),
  ];
  reserveChoiceCache.set(state.upgrades, { signature, choices });
  return choices;
}
export function getProgressionReserves(state) {
  if (state.protectProgression === false) return {};
  const choices = getReserveChoices(state);
  const goal = state.goalsPaused ? null : getActiveGoal(state);
  const pinned = goal && { ...goal, cost: goal.kind === 'tech' ? techTree[goal.id].cost : getUpgradeCost(state, goal.id) };
  const reserves = {};
  for (const { input, output } of getSupplyChains(state)) {
    if (!state.resources[output]?.unlocked) continue;
    const target = pinned?.cost[input] ? choices.find(c => c.kind === pinned.kind && c.id === pinned.id)
      : choices.filter(c => c.cost[input] > 0).sort((a, b) => a.cost[input] - b.cost[input])[0];
    if (target) reserves[input] = { amount: target.cost[input], name: target.name, kind: target.kind, id: target.id };
  }
  return reserves;
}

function mechanicalBonus(state) {
  const u = state.upgrades || {};
  let fraction = 0;
  if (u.communalEffort) fraction += Math.min(0.5 + (state.prestigeCount || 0) * 0.05, Object.keys(u).length * 0.005);
  if (u.overclockProtocol && state.totalTime % 60 < 10) fraction += 1;
  if (u.recursiveOptimizer) fraction += Math.pow(1.1, state.era - 1) - 1;
  if (u.orbitalResonance) fraction += getActiveSystems(state).length * 0.1;
  if (u.warpEcho) fraction += (state.starRoutes?.length || 0) * 0.03;
  if (u.galacticMemory) fraction += (state.prestigeCount || 0) * 0.05;
  if (u.echoMultiplier) fraction += Math.pow(1.05, Object.values(state.resources).filter(r => r.unlocked).length) - 1;
  if (u.infiniteLoop) fraction += 0.001;
  return 1 + fraction / (1 + 0.05 * Math.max(0, state.era - 7));
}

// One calculation powers simulation, numbers shown to the player, and purchase
// previews. Inputs produced during this interval can feed consumers immediately;
// full output storage never consumes inputs for production that will be discarded.
export function calculateEconomy(state, seconds = 1) {
  const dt = Math.max(0.000001, seconds);
  const common = getEffectivePrestige(state.prestigeMultiplier)
    * getCycleProductionMultiplier(state) * getEraMasteryTier(state).multiplier * mechanicalBonus(state);
  const colonies = getColonyBonus(state);
  const routes = getRouteBonus(state);
  const senate = state.era >= 8 ? getSenatePctBonuses(state) : {};
  const gross = {};
  const produced = {};
  const consumed = {};
  const capacity = {};
  const constrained = {};
  const reserves = getProgressionReserves(state);
  for (const [id, resource] of Object.entries(state.resources)) {
    capacity[id] = getEffectiveCap(state, id);
    const base = (definitions[id]?.baseRate || 0) + resource.rateAdd;
    let rate = resource.unlocked ? base * resource.rateMult * common
      * getRelicProductionMultiplier(state, id) * getWeaveProductionMultiplier(state, id)
      * getRepeatableMilestoneMultiplier(state, id) + (colonies[id] || 0) + (routes[id] || 0) * (state.upgrades?.forkOpenNet ? 1.25 : 1) : 0;
    rate *= getTimedRateMultiplier(state, id) * decisionMultiplier(state, id);
    // Supplied infrastructure carries the old economy into its new scale.
    // It helps the economic route fund cross-era inputs without operations.
    if (definitions[id]?.era < state.era && getPublicWorks(state)?.complete) rate *= 5;
    if (state.era >= 8) rate *= (senate[id] || 1) * getSenateGovernmentMultiplier(state, id);
    if (state.era >= 9) rate *= getTuningProductionMultiplier(state, id);
    if (id === 'stellarForge' && state.upgrades.forgeMemory) rate *= 1 + Math.min(100, state.dysonSegments || 0) / 100;
    gross[id] = Math.max(0, rate);
    produced[id] = gross[id] * dt;
    consumed[id] = 0;
  }
  for (const chain of getSupplyChains(state)) {
    const input = state.resources[chain.input];
    const output = state.resources[chain.output];
    if (!input?.unlocked || !output?.unlocked) continue;
    const control = state.consumerControls?.[chain.output] || {};
    const needsProtection = produced[chain.output] * chain.cost >= produced[chain.input] * 0.9 || !!getActiveGoal(state);
    const reserve = Math.max(capacity[chain.input] * (control.reserveFraction || 0), needsProtection ? Math.min(capacity[chain.input], reserves[chain.input]?.amount || 0) : 0);
    const available = Math.max(0, input.amount + produced[chain.input] - consumed[chain.input] - reserve);
    const space = capacity[chain.output] > 0 ? Math.max(0, capacity[chain.output] - output.amount) : Infinity;
    const actual = control.paused ? 0 : Math.min(produced[chain.output], available / chain.cost, space);
    constrained[chain.output] = control.paused ? 'paused' : actual + 1e-9 < produced[chain.output] ? (space <= actual ? 'storage' : 'input') : null;
    produced[chain.output] = actual;
    consumed[chain.input] += actual * chain.cost;
  }
  const net = {};
  const amounts = {};
  const overflow = {};
  const work = getPublicWorks(state);
  let construction = 0;
  if (work?.enabled && !work.complete && state.resources[work.resource]?.unlocked) {
    const income = Math.max(0, produced[work.resource] - consumed[work.resource]);
    const wouldOverflow = Math.max(0, state.resources[work.resource].amount + income - capacity[work.resource]);
    const reclaimed = state.archive?.research?.salvage || state.archive?.projects?.continuityGarden >= 4 ? Math.min(income, wouldOverflow) : 0;
    construction = Math.min(work.cost - work.delivered, Math.max(income * 0.2, reclaimed));
    consumed[work.resource] += construction;
    if (state.archive?.projects?.continuityGarden >= 4 && reclaimed > 0) construction = Math.min(work.cost - work.delivered, construction + reclaimed);
  }
  for (const [id, resource] of Object.entries(state.resources)) {
    const balance = resource.amount + produced[id] - consumed[id];
    const cap = capacity[id] > 0 ? Math.max(capacity[id], resource.amount) : Infinity;
    amounts[id] = Math.max(0, Math.min(cap, balance));
    overflow[id] = Math.max(0, balance - cap);
    net[id] = (amounts[id] - resource.amount) / dt;
    if (!constrained[id] && overflow[id] > 0) constrained[id] = 'storage';
  }
  return { gross, produced, consumed, capacity, constrained, amounts, overflow, net, reserves, construction };
}

export function setConsumerControl(state, output, patch) {
  if (!SUPPLY_CHAINS.some(chain => chain.output === output)) return state;
  const previous = state.consumerControls?.[output] || {};
  const control = {
    paused: patch.paused ?? previous.paused ?? false,
    reserveFraction: Math.max(0, Math.min(0.9, patch.reserveFraction ?? previous.reserveFraction ?? 0)),
  };
  return { ...state, consumerControls: { ...state.consumerControls, [output]: control } };
}

// An unconditional, repeatable escape from storage deadlocks. It is paid for
// entirely with the resource whose storage expands, below its current cap.
export function expandStorage(state, id) {
  const resource = state.resources[id];
  const cap = getEffectiveCap(state, id);
  if (!resource?.unlocked || !Number.isFinite(cap) || cap <= 0 || resource.amount < cap * 0.6) return state;
  return { ...state, resources: { ...state.resources, [id]: {
    ...resource, amount: resource.amount - cap * 0.6, capMult: resource.capMult * 1.5,
  } } };
}

export function getCostPressure(state, cost, economy = calculateEconomy(state)) {
  return Object.entries(cost || {}).map(([id, required]) => {
    const have = state.resources[id]?.amount || 0;
    const missing = Math.max(0, required - have);
    const reason = !state.resources[id]?.unlocked ? 'locked'
      : economy.capacity[id] > 0 && required > economy.capacity[id] ? 'capacity'
        : economy.net[id] <= 0 ? 'production' : null;
    return { id, required, missing, reason: missing > 0 ? reason : null, eta: missing <= 0 ? 0 : reason ? Infinity : missing / economy.net[id] };
  }).filter(p => p.missing > 0).sort((a, b) => a.eta === b.eta ? a.id.localeCompare(b.id) : b.eta - a.eta);
}
export function estimateAffordability(state, cost, economy = calculateEconomy(state)) {
  const pressure = getCostPressure(state, cost, economy);
  return { seconds: pressure[0]?.eta || 0, blockers: pressure.filter(p => p.reason).map(({ id, reason, required }) => ({ id, reason, required })) };
}
