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

export const SUPPLY_CHAINS = [
  { input: 'food', output: 'labor', cost: 1 },
  { input: 'energy', output: 'electronics', cost: 0.4 },
  { input: 'rocketFuel', output: 'orbitalInfra', cost: 0.5 },
  { input: 'exoticMaterials', output: 'colonies', cost: 0.2 },
  { input: 'stellarForge', output: 'megastructures', cost: 0.3 },
];

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
  for (const [id, resource] of Object.entries(state.resources)) {
    capacity[id] = getEffectiveCap(state, id);
    const base = (definitions[id]?.baseRate || 0) + resource.rateAdd;
    let rate = resource.unlocked ? base * resource.rateMult * common
      * getRelicProductionMultiplier(state, id) * getWeaveProductionMultiplier(state, id)
      * getRepeatableMilestoneMultiplier(state, id) + (colonies[id] || 0) + (routes[id] || 0) : 0;
    rate *= getTimedRateMultiplier(state, id);
    if (state.era >= 8) rate *= (senate[id] || 1) * getSenateGovernmentMultiplier(state, id);
    if (state.era >= 9) rate *= getTuningProductionMultiplier(state, id);
    if (id === 'stellarForge' && state.upgrades.forgeMemory) rate *= 1 + Math.min(100, state.dysonSegments || 0) / 100;
    gross[id] = Math.max(0, rate);
    produced[id] = gross[id] * dt;
    consumed[id] = 0;
  }
  for (const chain of SUPPLY_CHAINS) {
    const input = state.resources[chain.input];
    const output = state.resources[chain.output];
    if (!input?.unlocked || !output?.unlocked) continue;
    const control = state.consumerControls?.[chain.output] || {};
    const reserve = capacity[chain.input] * (control.reserveFraction || 0);
    const available = Math.max(0, input.amount + produced[chain.input] - reserve);
    const space = capacity[chain.output] > 0 ? Math.max(0, capacity[chain.output] - output.amount) : Infinity;
    const actual = control.paused ? 0 : Math.min(produced[chain.output], available / chain.cost, space);
    constrained[chain.output] = control.paused ? 'paused' : actual + 1e-9 < produced[chain.output] ? (space <= actual ? 'storage' : 'input') : null;
    produced[chain.output] = actual;
    consumed[chain.input] += actual * chain.cost;
  }
  const net = {};
  const amounts = {};
  const overflow = {};
  for (const [id, resource] of Object.entries(state.resources)) {
    const balance = resource.amount + produced[id] - consumed[id];
    const cap = capacity[id] > 0 ? Math.max(capacity[id], resource.amount) : Infinity;
    amounts[id] = Math.max(0, Math.min(cap, balance));
    overflow[id] = Math.max(0, balance - cap);
    net[id] = (amounts[id] - resource.amount) / dt;
  }
  return { gross, produced, consumed, capacity, constrained, amounts, overflow, net };
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

export function estimateAffordability(state, cost, economy = calculateEconomy(state)) {
  let seconds = 0;
  const blockers = [];
  for (const [id, required] of Object.entries(cost || {})) {
    const have = state.resources[id]?.amount || 0;
    if (have >= required) continue;
    if (!state.resources[id]?.unlocked) blockers.push({ id, reason: 'locked', required });
    else if (economy.capacity[id] > 0 && required > economy.capacity[id]) blockers.push({ id, reason: 'capacity', required });
    else if (economy.net[id] <= 0) blockers.push({ id, reason: 'production', required });
    else seconds = Math.max(seconds, (required - have) / economy.net[id]);
  }
  return { seconds: blockers.length ? Infinity : seconds, blockers };
}
