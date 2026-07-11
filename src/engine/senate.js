// Galactic Senate operation — Era 8
// Form a government in three policy acts, then steer it with directives.
import { getOperationRewardMultiplier } from './cycles.js';
import { getRelicSenateCostMultiplier, getRelicSenateDirectiveMultiplier } from './relics.js';

export const SENATE_ACT_INTERVAL = 45;

export const SENATE_FACTIONS = {
  merchants: { id: 'merchants', name: 'Merchant Guild', resource: 'exoticMatter', resourceName: 'Exotic Matter' },
  scholars: { id: 'scholars', name: 'Scholar Enclave', resource: 'galacticInfluence', resourceName: 'Galactic Influence' },
  warriors: { id: 'warriors', name: 'Warrior Caste', resource: 'stellarForge', resourceName: 'Stellar Forge' },
};

// Production bonus fractions per government role.
export const SENATE_LEADER_BONUS = 0.3;
export const SENATE_PARTNER_BONUS = 0.15;
export const SENATE_RATIFY_BONUS = 0.1;

const ACT_BASE_COSTS = { mandate: 20, coalition: 40, ratify: 80 };

export function getSenateGovernment(state) {
  return { leader: null, partner: null, ratified: false, ...(state.senateGov || {}) };
}

export function countSenateActs(state) {
  const government = getSenateGovernment(state);
  return (government.leader ? 1 : 0) + (government.partner ? 1 : 0) + (government.ratified ? 1 : 0);
}

// The next act in the fixed mandate → coalition → ratify sequence, or null.
export function getNextSenateAct(state) {
  const government = getSenateGovernment(state);
  if (!government.leader) return 'mandate';
  if (!government.partner) return 'coalition';
  if (!government.ratified) return 'ratify';
  return null;
}

export function getSenateActCost(state, actId = getNextSenateAct(state)) {
  const base = ACT_BASE_COSTS[actId];
  if (!base) return 0;
  return Math.ceil(base * getRelicSenateCostMultiplier(state));
}

export function getSenateStats(state) {
  const government = getSenateGovernment(state);
  const acts = countSenateActs(state);
  const nextAct = getNextSenateAct(state);
  const elapsed = state.totalTime - (state.lastSenateActTime ?? -SENATE_ACT_INTERVAL);
  return {
    government,
    acts,
    nextAct,
    nextActCost: getSenateActCost(state, nextAct),
    cooldown: nextAct ? Math.max(0, SENATE_ACT_INTERVAL - elapsed) : 0,
  };
}

// Enact the next policy act. Mandate and coalition take a faction id; ratify
// takes none. Returns { state, act, faction } or null if unavailable.
export function enactSenatePolicy(state, actId, factionId = null) {
  if (state.era < 8) return null;

  const stats = getSenateStats(state);
  if (stats.nextAct !== actId || stats.cooldown > 0) return null;

  const government = stats.government;
  let newGovernment;
  let faction = null;
  if (actId === 'mandate' || actId === 'coalition') {
    faction = SENATE_FACTIONS[factionId];
    if (!faction || factionId === government.leader) return null;
    newGovernment = actId === 'mandate'
      ? { ...government, leader: factionId }
      : { ...government, partner: factionId };
  } else if (actId === 'ratify') {
    newGovernment = { ...government, ratified: true };
  } else {
    return null;
  }

  const cost = getSenateActCost(state, actId);
  const influence = state.resources.galacticInfluence;
  if (!influence?.unlocked || influence.amount < cost) return null;

  return {
    state: {
      ...state,
      resources: {
        ...state.resources,
        galacticInfluence: { ...influence, amount: influence.amount - cost },
      },
      senateGov: newGovernment,
      lastSenateActTime: state.totalTime,
    },
    act: actId,
    faction,
  };
}

// Government production multiplier for a resource. Bonuses scale with
// operation rewards (doctrine and Causal Keys).
export function getSenateGovernmentMultiplier(state, resourceId) {
  const government = state.senateGov;
  if (!government?.leader) return 1;
  let bonus = 0;
  const leaderResource = SENATE_FACTIONS[government.leader]?.resource;
  const partnerResource = government.partner ? SENATE_FACTIONS[government.partner]?.resource : null;
  if (resourceId === leaderResource) bonus += SENATE_LEADER_BONUS;
  if (resourceId === partnerResource) bonus += SENATE_PARTNER_BONUS;
  if (government.ratified && Object.values(SENATE_FACTIONS).some(faction => faction.resource === resourceId)) {
    bonus += SENATE_RATIFY_BONUS;
  }
  if (bonus === 0) return 1;
  return 1 + bonus * getOperationRewardMultiplier(state);
}

// Set senate directive percentages — adjusting one slider rebalances others proportionally.
// factionId: which faction to set; pct: new percentage 0-100
export function setSenateDirective(state, factionId, pct) {
  if (state.era < 8) return state;
  const clampedPct = Math.max(0, Math.min(100, Math.round(pct)));
  const others = ['merchants', 'scholars', 'warriors'].filter(f => f !== factionId);
  const remaining = 100 - clampedPct;
  const current = state.senatePct || { merchants: 34, scholars: 33, warriors: 33 };
  const otherTotal = others.reduce((sum, f) => sum + (current[f] || 0), 0);
  let newPct = { ...current, [factionId]: clampedPct };
  if (otherTotal === 0) {
    const half = Math.floor(remaining / 2);
    newPct[others[0]] = half;
    newPct[others[1]] = remaining - half;
  } else {
    const scale = remaining / otherTotal;
    const a = Math.round((current[others[0]] || 0) * scale);
    newPct[others[0]] = a;
    newPct[others[1]] = remaining - a;
  }
  return { ...state, senatePct: newPct };
}

// Get senate directive production multipliers from slider percentages.
// Each faction's directive boosts that faction's resource.
export function getSenatePctBonuses(state) {
  const pct = state.senatePct || { merchants: 34, scholars: 33, warriors: 33 };
  const relicMult = getRelicSenateDirectiveMultiplier(state);
  return {
    exoticMatter:      1 + (pct.merchants || 0) * 0.001 * relicMult,
    galacticInfluence: 1 + (pct.scholars || 0) * 0.001 * relicMult,
    stellarForge:      1 + (pct.warriors || 0) * 0.001 * relicMult,
  };
}
