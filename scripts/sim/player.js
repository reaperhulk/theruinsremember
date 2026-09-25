// A simulated player. It uses only the public engine API and acts only during
// its persona's attention windows.
import {
  buyBuilding, buyMemoryUpgrade, buyUpgrade, catchEcho, click, createState, getAvailableMemories,
  getAvailableUpgrades, getBaseSps, getBuildingCost, getClickValue, getMemoryMultiplier, getPendingMemories,
  getTotalMemories, getUpgradeCost, isBuildingRevealed, isMemoryUpgradeAvailable, tick, advanceOffline, turnCycle,
} from '../../src/game/engine.js';
import { BUILDINGS, MEMORY_UPGRADES } from '../../src/game/data.js';

export function seededRng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Value of an option = extra salvage per second it brings, counting the
// persona's own clicking.
function gain(state, next, cps) {
  return (getBaseSps(next) - getBaseSps(state)) + cps * (getClickValue(next) - getClickValue(state));
}

function options(state, persona) {
  const list = [];
  for (const building of BUILDINGS) {
    if (!isBuildingRevealed(state, building.id)) continue;
    const cost = getBuildingCost(state, building.id);
    const probe = { ...state, buildings: { ...state.buildings, [building.id]: (state.buildings[building.id] || 0) + 1 } };
    list.push({ kind: 'building', id: building.id, cost, value: gain(state, probe, persona.cps) });
  }
  if (persona.upgrades) {
    for (const upgrade of getAvailableUpgrades(state)) {
      const cost = getUpgradeCost(state, upgrade.id);
      let value = gain(state, { ...state, upgrades: { ...state.upgrades, [upgrade.id]: true } }, persona.cps);
      // Upgrades with no direct yield (echo upgrades) are bought once cheap.
      if (value <= 0) value = persona.upgrades === 'all' || cost < getBaseSps(state) * 60 ? getBaseSps(state) * 0.01 + 1e-9 : 0;
      list.push({ kind: 'upgrade', id: upgrade.id, cost, value });
    }
  }
  return list.filter(o => o.value > 0);
}

// Buy the best-payback option repeatedly; save up when it is not affordable
// yet, unless something cheaper pays for itself before the best arrives.
export function decide(state, persona, counters) {
  for (let guard = 0; guard < 500; guard++) {
    const list = options(state, persona);
    if (!list.length) break;
    const income = Math.max(1e-9, getBaseSps(state) + persona.cps * getClickValue(state));
    const score = o => o.cost / o.value + Math.max(0, o.cost - state.salvage) / income;
    list.sort((a, b) => score(a) - score(b));
    const best = list[0];
    if (best.cost > state.salvage) {
      const all = persona.upgrades === 'all' && list.find(o => o.kind === 'upgrade' && o.cost <= state.salvage);
      if (!all) break;
      state = buyUpgrade(state, all.id);
    } else {
      state = best.kind === 'building' ? buyBuilding(state, best.id) : buyUpgrade(state, best.id);
    }
    counters.actions++;
    counters.purchases++;
  }
  return state;
}

const MEMORY_ORDER = MEMORY_UPGRADES.map(u => u.id);

function spendMemories(state, counters) {
  for (const id of MEMORY_ORDER) {
    if (!isMemoryUpgradeAvailable(state, id)) continue;
    const next = buyMemoryUpgrade(state, id);
    if (next !== state) { state = next; counters.actions++; }
  }
  return state;
}

// Turn the cycle once it would at least double production (what the cycle
// screen previews), is worth at least 10 memories, and the run has had time
// to matter.
function shouldTurnCycle(state) {
  const pending = getPendingMemories(state);
  const total = getTotalMemories(state);
  return pending >= 10 && state.runTime >= 1800 && getMemoryMultiplier(state, total + pending) >= 2 * getMemoryMultiplier(state, total);
}

export function simulate(persona, { seed = 1, horizon = persona.horizon, onCycle } = {}) {
  const rng = seededRng(seed);
  let state = createState(0);
  const counters = { actions: 0, clicks: 0, purchases: 0, echoes: 0, cycles: 0, sessions: 0, active: 0, longestWait: 0 };
  let lastPurchaseActive = 0;
  const eraTimes = { 1: 0 };
  const cycleTimes = [];
  // How long each new run takes to recover what the previous run ended with,
  // as a fraction of that previous run's length.
  const recoveries = [];
  let chase = null;
  let time = 0;
  let clickCarry = 0;
  let nextDecision = 0;
  const sessions = persona.sessions;
  const record = () => {
    if (chase && state.runEarned >= chase.target) {
      recoveries.push((time - chase.start) / chase.length);
      chase = null;
    }
    for (let era = 2; era <= 10; era++) if (eraTimes[era] === undefined && state.highestEra >= era) eraTimes[era] = time;
  };
  const activeStep = seconds => {
    for (let s = 0; s < seconds && time < horizon; s++) {
      clickCarry += persona.cps;
      const clicks = Math.floor(clickCarry);
      if (clicks > 0) {
        state = click(state, clicks);
        clickCarry -= clicks;
        counters.clicks += clicks;
        counters.actions += clicks;
      }
      if (state.echo.active && rng() < persona.echoChance) {
        state = catchEcho(state, rng).state;
        counters.echoes++;
        counters.actions++;
      }
      if (time >= nextDecision) {
        const bought = counters.purchases;
        state = decide(state, persona, counters);
        if (counters.purchases > bought) lastPurchaseActive = counters.active;
        // Longest stretch of attention spent with nothing worth buying.
        counters.longestWait = Math.max(counters.longestWait, counters.active - lastPurchaseActive);
        if (shouldTurnCycle(state)) {
          onCycle?.({ time, state });
          chase = { target: state.runEarned, length: time - (cycleTimes.at(-1) ?? 0), start: time };
          state = spendMemories(turnCycle(state), counters);
          cycleTimes.push(time);
          counters.cycles++;
          counters.actions++;
        }
        nextDecision = time + persona.decisionEvery;
      }
      state = tick(state, 1, rng);
      time++;
      counters.active++;
      record();
    }
  };
  while (time < horizon) {
    counters.sessions++;
    activeStep(sessions ? sessions.active : horizon - time);
    if (!sessions || time >= horizon) break;
    const away = Math.min(sessions.away, horizon - time);
    if (sessions.mode === 'closed') state = advanceOffline(state, away, rng).state;
    else for (let s = 0; s < away; s += 5) state = tick(state, Math.min(5, away - s), rng);
    time += away;
    record();
  }
  return {
    horizon,
    eraTimes,
    cycleTimes,
    recoveries,
    finalEra: state.era,
    highestEra: state.highestEra,
    memories: getTotalMemories(state),
    availableMemories: getAvailableMemories(state),
    pendingMemories: getPendingMemories(state),
    totalEarned: state.totalEarned,
    ...counters,
  };
}
