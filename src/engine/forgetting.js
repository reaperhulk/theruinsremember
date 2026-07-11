// The Forgetting — the run-ending siege (Era 10+).
// Entropy tendrils creep toward the memories this civilization built.
// Wardens hold them; held tendrils stall the meter; sealed tendrils push it
// back. Unguarded memories are consumed: their bonuses scar for the rest of
// the run and the Forgetting accelerates. All randomness flows through the
// injected rng so runs are deterministic under a seed.
import { STAR_SYSTEMS } from './starChart.js';
import { COSMIC_BANDS } from './tuning.js';
import { REALITY_LAWS } from './weaving.js';
import { SENATE_FACTIONS } from './senate.js';
import { RELICS } from '../data/relics.js';

export const FORGETTING_COLLAPSE = 100;
export const FORGETTING_BASE_RATE = 100 / 7200; // unstalled: two hours to collapse, before scars
export const SCAR_RATE_MULT = 1.03;             // each consumed memory compounds the advance
export const SCAR_METER_PENALTY = 2;
export const SEAL_METER_REWARD = 1.5;
export const HELD_STALL_RATE = 0.02;            // per held tendril per second — two held reverse the meter
export const TENDRIL_APPROACH_TIME = 40;        // seconds, ±15% deterministic jitter
export const TENDRIL_CONSUME_TIME = 25;
export const TENDRIL_SEAL_HOLD = 18;
export const FIRST_SURGE_DELAY = 15;
export const SURGE_INTERVAL = 75;
export const MAX_TENDRILS = 5;
export const WARDEN_MOVE_COOLDOWN = 20;
export const DEPTH_ESCALATION = 1.6;            // per recursion depth (the ladder arrives later)

// Ring layout for non-system memories, arranged around the Archive (0.5, 0.5).
const KIND_RINGS = {
  law: { radius: 0.2, offset: 0.0 },
  lock: { radius: 0.2, offset: 0.5 },
  senate: { radius: 0.14, offset: 0.25 },
  colony: { radius: 0.3, offset: 0.15 },
  dyson: { radius: 0.14, offset: 0.75 },
  relic: { radius: 0.3, offset: 0.65 },
};

function ringPosition(kind, index, count) {
  const ring = KIND_RINGS[kind];
  const angle = ((index + ring.offset) / Math.max(1, count)) * Math.PI * 2 + ring.offset * Math.PI;
  return {
    x: 0.5 + Math.cos(angle) * ring.radius,
    y: 0.5 + Math.sin(angle) * ring.radius,
  };
}

// The memory constellation: every node is something this run actually built.
// Node ids are stable ('law:causal', 'system:sol') so scars survive saves.
export function getMemoryConstellation(state) {
  const nodes = [];

  const systemIds = [...new Set((state.starRoutes || []).flatMap(route => [route.from, route.to]))];
  for (const systemId of systemIds) {
    const system = STAR_SYSTEMS.find(candidate => candidate.id === systemId);
    if (!system) continue;
    nodes.push({ id: `system:${systemId}`, kind: 'system', label: system.name, value: 1, x: system.x, y: system.y });
  }

  const laws = Object.keys(state.wovenLaws || {});
  laws.forEach((lawId, index) => {
    const law = REALITY_LAWS[lawId];
    if (law) nodes.push({ id: `law:${lawId}`, kind: 'law', label: law.name, value: 2, ...ringPosition('law', index, laws.length) });
  });

  const locks = Object.keys(state.lockedSignals || {});
  locks.forEach((bandId, index) => {
    const band = COSMIC_BANDS[bandId];
    if (band) nodes.push({ id: `lock:${bandId}`, kind: 'lock', label: band.name, value: 2, ...ringPosition('lock', index, locks.length) });
  });

  if (state.senateGov?.leader) {
    const leader = SENATE_FACTIONS[state.senateGov.leader];
    nodes.push({ id: 'senate:gov', kind: 'senate', label: `${leader?.name || 'Senate'} Government`, value: 2, ...ringPosition('senate', 0, 1) });
  }

  const colonies = Object.entries(state.colonyAssignments || {}).filter(([, count]) => count > 0);
  colonies.forEach(([focus], index) => {
    nodes.push({ id: `colony:${focus}`, kind: 'colony', label: `${focus[0].toUpperCase()}${focus.slice(1)} Colonies`, value: 1, ...ringPosition('colony', index, colonies.length) });
  });

  if ((state.dysonSegments || 0) > 0) {
    nodes.push({ id: 'dyson:assembly', kind: 'dyson', label: 'Dyson Assembly', value: 1, ...ringPosition('dyson', 0, 1) });
  }

  (state.activeRelics || []).forEach((relicId, index, all) => {
    const relic = RELICS[relicId];
    if (relic) nodes.push({ id: `relic:${relicId}`, kind: 'relic', label: relic.name, value: 2, ...ringPosition('relic', index, all.length) });
  });

  return nodes;
}

export function isMemoryScarred(state, nodeId) {
  return !!state.forgetting?.scars?.[nodeId];
}

export function getWardenCapacity(state) {
  return 2 + (state.senateGov?.ratified ? 1 : 0);
}

function createForgetting(state) {
  return {
    meter: 0,
    startedAt: state.totalTime,
    nextSurgeAt: state.totalTime + FIRST_SURGE_DELAY,
    tendrils: [],
    scars: {},
    wardens: [],
    sealed: 0,
    consumed: 0,
    collapsed: false,
    nextTendrilId: 1,
  };
}

function ensureWardens(forgetting, capacity) {
  if (forgetting.wardens.length >= capacity) return forgetting;
  const wardens = [...forgetting.wardens];
  while (wardens.length < capacity) {
    wardens.push({ id: wardens.length + 1, nodeId: null, movedAt: -WARDEN_MOVE_COOLDOWN });
  }
  return { ...forgetting, wardens };
}

function depthFactor(state) {
  return Math.pow(DEPTH_ESCALATION, state.recursionDepth || 0);
}

// Meter advance per second, before held-tendril stalling.
export function getForgettingRate(state) {
  const scarCount = Object.keys(state.forgetting?.scars || {}).length;
  return FORGETTING_BASE_RATE * Math.pow(SCAR_RATE_MULT, scarCount) * depthFactor(state);
}

function guardedNodeIds(forgetting) {
  return new Set(forgetting.wardens.filter(warden => warden.nodeId).map(warden => warden.nodeId));
}

function spawnSurge(forgetting, nodes, now, factor, rng) {
  const targeted = new Set(forgetting.tendrils.map(tendril => tendril.targetId));
  const open = nodes.filter(node => !forgetting.scars[node.id] && !targeted.has(node.id));
  const budget = Math.min(
    1 + Math.floor(forgetting.meter / 25),
    MAX_TENDRILS - forgetting.tendrils.length,
  );

  let updated = forgetting;
  for (let index = 0; index < budget; index++) {
    if (open.length === 0) {
      // Every remaining memory is besieged or scarred. If nothing was ever
      // built there is nothing to feed on; otherwise entropy leaks straight
      // into the Archive.
      if (nodes.length > 0) updated = { ...updated, meter: Math.min(FORGETTING_COLLAPSE, updated.meter + 0.75) };
      continue;
    }
    // Weighted pick: high-value memories draw the Forgetting first.
    const totalWeight = open.reduce((sum, node) => sum + node.value, 0);
    let roll = rng() * totalWeight;
    let pickIndex = 0;
    for (let candidate = 0; candidate < open.length; candidate++) {
      roll -= open[candidate].value;
      if (roll <= 0) { pickIndex = candidate; break; }
    }
    const target = open.splice(pickIndex, 1)[0];
    const jitter = 0.85 + 0.3 * rng();
    updated = {
      ...updated,
      nextTendrilId: updated.nextTendrilId + 1,
      tendrils: [...updated.tendrils, {
        id: updated.nextTendrilId,
        targetId: target.id,
        spawnedAt: now,
        spawnAngle: rng() * Math.PI * 2,
        arrivesAt: now + (TENDRIL_APPROACH_TIME * jitter) / factor,
        phase: 'approach',
        heldSince: null,
        consumesAt: null,
      }],
    };
  }
  return updated;
}

function advanceSlice(forgetting, nodes, now, sliceDt, factor, rng) {
  // Surges open new breaches on a fixed cadence.
  while (forgetting.nextSurgeAt <= now) {
    const surgeAt = forgetting.nextSurgeAt;
    forgetting = spawnSurge(forgetting, nodes, surgeAt, factor, rng);
    forgetting = { ...forgetting, nextSurgeAt: surgeAt + SURGE_INTERVAL / factor };
  }

  const guarded = guardedNodeIds(forgetting);
  const scars = { ...forgetting.scars };
  let { meter, sealed, consumed } = forgetting;
  const tendrils = [];

  for (const tendril of forgetting.tendrils) {
    let current = tendril;

    if (current.phase === 'approach' && now >= current.arrivesAt) {
      if (scars[current.targetId]) {
        // The memory was already lost — entropy drains into the Archive.
        meter = Math.min(FORGETTING_COLLAPSE, meter + 1);
        continue;
      }
      current = guarded.has(current.targetId)
        ? { ...current, phase: 'held', heldSince: current.arrivesAt }
        : { ...current, phase: 'consuming', consumesAt: current.arrivesAt + TENDRIL_CONSUME_TIME / factor };
    }

    if (current.phase === 'held') {
      if (!guarded.has(current.targetId)) {
        current = { ...current, phase: 'consuming', heldSince: null, consumesAt: now + TENDRIL_CONSUME_TIME / factor };
      } else if (now - current.heldSince >= TENDRIL_SEAL_HOLD) {
        sealed += 1;
        meter = Math.max(0, meter - SEAL_METER_REWARD);
        continue;
      }
    }

    if (current.phase === 'consuming') {
      if (guarded.has(current.targetId)) {
        current = { ...current, phase: 'held', heldSince: now, consumesAt: null };
      } else if (now >= current.consumesAt) {
        scars[current.targetId] = true;
        consumed += 1;
        meter = Math.min(FORGETTING_COLLAPSE, meter + SCAR_METER_PENALTY);
        continue;
      }
    }

    tendrils.push(current);
  }

  const heldCount = tendrils.filter(tendril => tendril.phase === 'held').length;
  const scarCount = Object.keys(scars).length;
  const rate = FORGETTING_BASE_RATE * Math.pow(SCAR_RATE_MULT, scarCount) * factor;
  meter = Math.min(FORGETTING_COLLAPSE, Math.max(0, meter + (rate - heldCount * HELD_STALL_RATE) * sliceDt));

  return { ...forgetting, tendrils, scars, meter, sealed, consumed };
}

// Advance the siege. Called from tick with the injected rng; handles large dt
// in bounded one-second slices so high-speed testing stays exact.
export function advanceForgetting(state, dt, rng = Math.random) {
  if (state.era < 10 || dt <= 0) return state;

  let forgetting = state.forgetting || createForgetting(state);
  if (forgetting.collapsed) return state.forgetting ? state : { ...state, forgetting };
  forgetting = ensureWardens(forgetting, getWardenCapacity(state));

  const nodes = getMemoryConstellation(state);
  const factor = depthFactor(state);
  const startTime = state.totalTime - dt;
  let elapsed = 0;
  while (elapsed < dt) {
    const sliceDt = Math.min(1, dt - elapsed);
    elapsed += sliceDt;
    forgetting = advanceSlice(forgetting, nodes, startTime + elapsed, sliceDt, factor, rng);
    if (forgetting.meter >= FORGETTING_COLLAPSE) {
      forgetting = { ...forgetting, meter: FORGETTING_COLLAPSE, collapsed: true, tendrils: [] };
      break;
    }
  }

  return { ...state, forgetting };
}

// The only manual action: position a warden on a memory node.
// Returns { state, warden, node } or null if unavailable.
export function placeWarden(state, wardenId, nodeId) {
  const forgetting = state.forgetting;
  if (state.era < 10 || !forgetting || forgetting.collapsed) return null;

  const warden = forgetting.wardens.find(candidate => candidate.id === wardenId);
  if (!warden || warden.nodeId === nodeId) return null;
  if (state.totalTime - warden.movedAt < WARDEN_MOVE_COOLDOWN) return null;

  const node = getMemoryConstellation(state).find(candidate => candidate.id === nodeId);
  if (!node || forgetting.scars[nodeId]) return null;
  if (forgetting.wardens.some(other => other.nodeId === nodeId)) return null;

  return {
    state: {
      ...state,
      forgetting: {
        ...forgetting,
        wardens: forgetting.wardens.map(candidate =>
          candidate.id === wardenId ? { ...candidate, nodeId, movedAt: state.totalTime } : candidate),
      },
    },
    warden,
    node,
  };
}

// Snapshot for UI, bots, and tests.
export function getForgettingStats(state) {
  const forgetting = state.forgetting;
  const nodes = getMemoryConstellation(state);
  if (!forgetting) {
    return { active: false, meter: 0, ratePerSecond: 0, tendrils: [], wardens: [], nodes, sealed: 0, consumed: 0, collapsed: false };
  }
  const heldCount = forgetting.tendrils.filter(tendril => tendril.phase === 'held').length;
  const nodeById = Object.fromEntries(nodes.map(node => [node.id, node]));
  return {
    active: state.era >= 10,
    meter: forgetting.meter,
    ratePerSecond: getForgettingRate(state) - heldCount * HELD_STALL_RATE,
    tendrils: forgetting.tendrils.map(tendril => ({
      ...tendril,
      targetLabel: nodeById[tendril.targetId]?.label || tendril.targetId,
      eta: tendril.phase === 'approach' ? Math.max(0, tendril.arrivesAt - state.totalTime)
        : tendril.phase === 'consuming' ? Math.max(0, tendril.consumesAt - state.totalTime)
          : Math.max(0, TENDRIL_SEAL_HOLD - (state.totalTime - tendril.heldSince)),
    })),
    wardens: forgetting.wardens.map(warden => ({
      ...warden,
      cooldownRemaining: Math.max(0, WARDEN_MOVE_COOLDOWN - (state.totalTime - warden.movedAt)),
    })),
    nodes: nodes.map(node => ({ ...node, scarred: !!forgetting.scars[node.id] })),
    sealed: forgetting.sealed,
    consumed: forgetting.consumed,
    collapsed: forgetting.collapsed,
  };
}
