import { getEffectiveCap } from './resources.js';

export const EXPEDITION_SUPPLY_INTERVAL = 90;
export const EXPEDITION_MAX_SUPPLIES = 3;

export const EXPEDITION_ROUTES = {
  1: [
    {
      id: 'surveyRidge',
      name: 'Survey the Ridge',
      description: 'Map the exposed ruins and mark a dependable route home.',
      chance: 1,
      discovery: 1,
      rewards: { materials: 24, food: 16 },
      risk: 'Certain',
    },
    {
      id: 'salvageWreck',
      name: 'Salvage the Wreck',
      description: 'Cut into unstable compartments for intact power cells.',
      chance: 0.78,
      discovery: 1,
      rewards: { materials: 48, energy: 32 },
      failureRewards: { materials: 10 },
      risk: 'Measured',
    },
    {
      id: 'descendVault',
      name: 'Descend into the Vault',
      description: 'Follow the carved stair beneath the settlement foundations.',
      chance: 0.55,
      discovery: 2,
      rewards: { materials: 70, energy: 45 },
      failureRewards: { materials: 8 },
      gems: 1,
      risk: 'Severe',
    },
  ],
  2: [
    {
      id: 'traceConduits',
      name: 'Trace the Conduits',
      description: 'Follow buried power lines between dormant industrial sites.',
      chance: 1,
      discovery: 1,
      rewards: { steel: 36, electronics: 20 },
      risk: 'Certain',
    },
    {
      id: 'restartFurnace',
      name: 'Restart the Furnace',
      description: 'Bring a precursor smelter online before its containment fails.',
      chance: 0.75,
      discovery: 1,
      rewards: { steel: 80, electronics: 45, energy: 60 },
      failureRewards: { steel: 15 },
      risk: 'Measured',
    },
    {
      id: 'openRelay',
      name: 'Open the Sealed Relay',
      description: 'Bypass a lock whose circuitry mirrors your newest designs.',
      chance: 0.52,
      discovery: 2,
      rewards: { electronics: 100, research: 90 },
      failureRewards: { electronics: 12 },
      gems: 1,
      risk: 'Severe',
    },
  ],
  3: [
    {
      id: 'indexArchive',
      name: 'Index the Archive',
      description: 'Recover intact records before the old storage array decays.',
      chance: 1,
      discovery: 1,
      rewards: { data: 45, software: 30 },
      risk: 'Certain',
    },
    {
      id: 'followGhostSignal',
      name: 'Follow the Ghost Signal',
      description: 'Triangulate a transmission that predicts your own network traffic.',
      chance: 0.72,
      discovery: 1,
      rewards: { data: 95, software: 70, research: 80 },
      failureRewards: { data: 15 },
      risk: 'Measured',
    },
    {
      id: 'wakeRecursiveCore',
      name: 'Wake the Recursive Core',
      description: 'Run the final instruction in a program that already knows your name.',
      chance: 0.5,
      discovery: 2,
      rewards: { data: 160, software: 130, research: 140 },
      failureRewards: { data: 20 },
      gems: 2,
      risk: 'Severe',
    },
  ],
};

export function createExpeditionState() {
  return {
    supplies: 2,
    supplyProgress: 0,
    eraFinds: 0,
    totalFinds: 0,
    attempts: 0,
    successes: 0,
    log: [],
  };
}

export function getExpeditionRoutes(era) {
  if (era <= 1) return EXPEDITION_ROUTES[1];
  if (era === 2) return EXPEDITION_ROUTES[2];
  return EXPEDITION_ROUTES[3];
}

function grantRewards(state, rewards) {
  const resources = { ...state.resources };
  const granted = {};

  for (const [id, amount] of Object.entries(rewards || {})) {
    const resource = resources[id];
    if (!resource?.unlocked) continue;
    const cap = getEffectiveCap(state, id);
    const nextAmount = cap > 0
      ? Math.min(cap, resource.amount + amount)
      : resource.amount + amount;
    const actual = Math.max(0, nextAmount - resource.amount);
    resources[id] = { ...resource, amount: nextAmount };
    if (actual > 0) granted[id] = actual;
  }

  return { ...state, resources, granted };
}

export function advanceExpeditionSupplies(state, dt) {
  const expedition = state.expedition || createExpeditionState();
  if (dt <= 0 || expedition.supplies >= EXPEDITION_MAX_SUPPLIES) return state;

  const totalProgress = expedition.supplyProgress + dt;
  const gained = Math.floor(totalProgress / EXPEDITION_SUPPLY_INTERVAL);
  if (gained <= 0) {
    return { ...state, expedition: { ...expedition, supplyProgress: totalProgress } };
  }

  const supplies = Math.min(EXPEDITION_MAX_SUPPLIES, expedition.supplies + gained);
  const supplyProgress = supplies >= EXPEDITION_MAX_SUPPLIES
    ? 0
    : totalProgress % EXPEDITION_SUPPLY_INTERVAL;
  return { ...state, expedition: { ...expedition, supplies, supplyProgress } };
}

export function runExpedition(state, routeId, rng = Math.random) {
  const expedition = state.expedition || createExpeditionState();
  const route = getExpeditionRoutes(state.era).find(candidate => candidate.id === routeId);
  if (!route || expedition.supplies < 1 || state.era > 3) {
    return { state, result: null };
  }

  const success = rng() < route.chance;
  const rewardSet = success ? route.rewards : route.failureRewards;
  const rewarded = grantRewards(state, rewardSet);
  const discovery = success ? route.discovery : 0;
  const gems = success ? (route.gems || 0) : 0;
  const result = {
    routeId,
    name: route.name,
    success,
    discovery,
    gems,
    rewards: rewarded.granted,
  };
  const nextExpedition = {
    ...expedition,
    supplies: expedition.supplies - 1,
    eraFinds: expedition.eraFinds + discovery,
    totalFinds: expedition.totalFinds + discovery,
    attempts: expedition.attempts + 1,
    successes: expedition.successes + (success ? 1 : 0),
    log: [result, ...(expedition.log || [])].slice(0, 5),
  };
  const message = success
    ? `Expedition: ${route.name} recovered a new trace from the ruins.`
    : `Expedition: ${route.name} returned without a discovery.`;

  return {
    state: {
      ...rewarded,
      expedition: nextExpedition,
      totalGems: (rewarded.totalGems || 0) + gems,
      eventLog: [...(rewarded.eventLog || []), {
        message,
        time: rewarded.totalTime,
        isLore: success && discovery > 1,
      }].slice(-20),
    },
    result,
  };
}
