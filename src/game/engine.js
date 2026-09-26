// Pure game logic. Every function takes a state and returns a new one (or the
// same object when nothing changed); nothing here touches the browser.
import {
  ACHIEVEMENTS, BUILDINGS, BUILDING_BY_ID, COST_SCALE, ECHO_EFFECTS, ECHO_LIFETIME,
  ARCHIVE_RATE, ECHO_SPAWN_MAX, ECHO_SPAWN_MIN, ERA_COUNT, ERA_THRESHOLDS, MEMORY_DIVISOR,
  MEMORY_UPGRADES, MEMORY_UPGRADE_BY_ID, UPGRADES, UPGRADE_BY_ID,
} from './data.js';
import { MESSAGES } from './lore.js';

export const SAVE_VERSION = 1;

export function createState(now = Date.now()) {
  return {
    version: SAVE_VERSION,
    salvage: 0,
    runEarned: 0,
    totalEarned: 0,
    clicks: 0,
    clickEarned: 0,
    buildings: {},
    upgrades: {},
    achievements: {},
    era: 1,
    highestEra: 1,
    buffs: [],
    echo: { timer: 120, active: null },
    echoesCaught: 0,
    memories: 0,
    bonusMemories: 0,
    memoryUpgrades: {},
    cycles: 0,
    // The message left for the next civilization, chosen at the ending.
    message: null,
    runTime: 0,
    totalTime: 0,
    log: [],
    lastSaved: now,
  };
}

// A fresh cycle keeps everything the ruins remember and nothing else.
function startCycle(state) {
  const fresh = createState(state.lastSaved);
  const buildings = state.memoryUpgrades.starterKit ? { scavenger: 10, camp: 10, foundry: 5 } : {};
  // Inherited salvage counts as recovered this cycle, so it reveals eras and
  // buildings, but it was already counted toward memories once.
  const inherited = Math.floor(state.runEarned * getInheritanceRate(state));
  return {
    ...fresh,
    buildings,
    salvage: inherited,
    runEarned: inherited,
    totalEarned: state.totalEarned,
    clicks: state.clicks,
    clickEarned: state.clickEarned,
    achievements: state.achievements,
    highestEra: state.highestEra,
    echoesCaught: state.echoesCaught,
    memories: state.memories,
    bonusMemories: state.bonusMemories,
    memoryUpgrades: state.memoryUpgrades,
    cycles: state.cycles,
    message: state.message,
    totalTime: state.totalTime,
    log: state.log,
  };
}

const count = (state, id) => state.buildings[id] || 0;

export function getBuildingCount(state) {
  return Object.values(state.buildings).reduce((sum, n) => sum + n, 0);
}

export function getTotalMemories(state) {
  return state.memories + state.bonusMemories;
}

// Spent memories are always the price of the lessons owned, so changing or
// retiring a lesson refunds it automatically.
export function getSpentMemories(state) {
  return MEMORY_UPGRADES.reduce((sum, u) => sum + (state.memoryUpgrades[u.id] ? u.cost : 0), 0);
}

export function getAvailableMemories(state) {
  return Math.max(0, getTotalMemories(state) - getSpentMemories(state));
}

// Everything the owned upgrades contribute, computed once per upgrade set.
const upgradeEffectCache = new WeakMap();
function upgradeEffects(upgrades) {
  let effects = upgradeEffectCache.get(upgrades);
  if (effects) return effects;
  effects = { tiers: {}, global: 1, archivists: 0, clickDoublers: 0, clickShares: 0 };
  for (const id of Object.keys(upgrades)) {
    const upgrade = UPGRADE_BY_ID[id];
    if (!upgrade) continue;
    if (upgrade.kind === 'building') effects.tiers[upgrade.building] = (effects.tiers[upgrade.building] || 0) + 1;
    else if (upgrade.kind === 'global') effects.global *= upgrade.value;
    else if (upgrade.kind === 'archive') effects.archivists++;
    else if (upgrade.kind === 'clickDouble') effects.clickDoublers++;
    else if (upgrade.kind === 'clickShare') effects.clickShares++;
  }
  upgradeEffectCache.set(upgrades, effects);
  return effects;
}

// Permanent and run-long multipliers on all production, excluding echo buffs.
// Memories multiply production by 1 + k·√memories. The square root makes the
// first few memories count for a lot (10 memories ≈ ×2.6) without letting
// later cycles run away.
export function getMemoryStrength(state) {
  const m = state.memoryUpgrades;
  return m.deeperMemory ? 1 : m.deepMemory ? 0.75 : 0.5;
}

export function getMemoryMultiplier(state, memories = getTotalMemories(state)) {
  return 1 + getMemoryStrength(state) * Math.sqrt(memories);
}

// Share of the last cycle's recovered salvage a new cycle starts with.
export function getInheritanceRate(state) {
  const m = state.memoryUpgrades;
  return m.inheritance ? 0.01 : m.headStart ? 0.001 : 0;
}

export function getAchievementBonus(state) {
  return state.memoryUpgrades.resonance ? 0.02 : 0.01;
}

export function getGlobalMultiplier(state) {
  const achievements = Object.keys(state.achievements).length;
  const { global, archivists } = upgradeEffects(state.upgrades);
  return getMemoryMultiplier(state)
    * (1 + getAchievementBonus(state) * achievements)
    * (1 + ARCHIVE_RATE * achievements) ** archivists
    * global
    * (state.memoryUpgrades.unbrokenChain ? 1.5 : 1);
}

export function getBuildingMultiplier(state, buildingId) {
  return 2 ** (upgradeEffects(state.upgrades).tiers[buildingId] || 0);
}

function buffMultiplier(buffs, key) {
  return buffs.reduce((mult, buff) => mult * (buff[key] || 1), 1);
}

// Salvage per second from buildings before echo buffs.
export function getBaseSps(state) {
  const global = getGlobalMultiplier(state);
  let sps = 0;
  for (const building of BUILDINGS) {
    const owned = count(state, building.id);
    if (owned) sps += owned * building.sps * getBuildingMultiplier(state, building.id);
  }
  return sps * global;
}

// One building of this kind produces this much per second, before buffs.
export function getBuildingUnitSps(state, buildingId) {
  return BUILDING_BY_ID[buildingId].sps * getBuildingMultiplier(state, buildingId) * getGlobalMultiplier(state);
}

export function getSps(state) {
  return getBaseSps(state) * buffMultiplier(state.buffs, 'production');
}

export function getClickValue(state) {
  const { clickDoublers, clickShares } = upgradeEffects(state.upgrades);
  const hands = state.memoryUpgrades.rememberedHands;
  const base = 2 ** clickDoublers * (hands ? 2 : 1);
  const handsBonus = state.buffs.reduce((sum, buff) => sum + (buff.clickSeconds || 0), 0) * getBaseSps(state);
  return base + getSps(state) * 0.01 * (clickShares + (hands ? 1 : 0)) + handsBonus;
}

export function getStats(state) {
  return {
    sps: getSps(state),
    baseSps: getBaseSps(state),
    clickValue: getClickValue(state),
    buildingCount: getBuildingCount(state),
    globalMultiplier: getGlobalMultiplier(state),
  };
}

// --- Buildings -------------------------------------------------------------

function buildingDiscount(state) {
  return state.memoryUpgrades.ancestralDiscount ? 0.9 : 1;
}

// Total price of the next `amount` buildings of one kind.
export function getBuildingCost(state, buildingId, amount = 1) {
  const building = BUILDING_BY_ID[buildingId];
  if (!building || amount < 1) return Infinity;
  const first = building.cost * COST_SCALE ** count(state, buildingId) * buildingDiscount(state);
  return Math.ceil(first * (COST_SCALE ** amount - 1) / (COST_SCALE - 1));
}

export function getMaxAffordable(state, buildingId) {
  const building = BUILDING_BY_ID[buildingId];
  if (!building) return 0;
  const first = building.cost * COST_SCALE ** count(state, buildingId) * buildingDiscount(state);
  let amount = Math.floor(Math.log(state.salvage * (COST_SCALE - 1) / first + 1) / Math.log(COST_SCALE));
  while (amount > 0 && getBuildingCost(state, buildingId, amount) > state.salvage) amount--;
  return Math.max(0, amount);
}

// A building is shown once this run has earned enough to reveal its era.
export function isBuildingRevealed(state, buildingId) {
  const building = BUILDING_BY_ID[buildingId];
  return !!building && (building === BUILDINGS[0] || count(state, buildingId) > 0 || state.runEarned >= building.cost * 0.5);
}

export function buyBuilding(state, buildingId, amount = 1) {
  if (!BUILDING_BY_ID[buildingId] || !Number.isInteger(amount) || amount < 1) return state;
  const cost = getBuildingCost(state, buildingId, amount);
  if (cost > state.salvage) return state;
  return refresh({
    ...state,
    salvage: state.salvage - cost,
    buildings: { ...state.buildings, [buildingId]: count(state, buildingId) + amount },
  });
}

// --- Upgrades --------------------------------------------------------------

export function getUpgradeCost(state, upgradeId) {
  const upgrade = UPGRADE_BY_ID[upgradeId];
  if (!upgrade) return Infinity;
  const m = state.memoryUpgrades;
  return Math.ceil(upgrade.cost * (m.thePattern ? 0.75 : 1) * (m.rememberedBlueprints && upgrade.kind === 'building' ? 0.5 : 1));
}

export function isUpgradeUnlocked(state, upgradeId) {
  const upgrade = UPGRADE_BY_ID[upgradeId];
  if (!upgrade || state.upgrades[upgradeId]) return false;
  const r = upgrade.requires;
  if (r.building && count(state, r.building) < r.owned) return false;
  if (r.clicks && state.clicks < r.clicks) return false;
  if (r.earned && state.runEarned < r.earned) return false;
  if (r.era && state.era < r.era) return false;
  if (r.echoes && state.echoesCaught < r.echoes) return false;
  if (r.achievements && Object.keys(state.achievements).length < r.achievements) return false;
  return true;
}

export function getAvailableUpgrades(state) {
  return UPGRADES.filter(u => isUpgradeUnlocked(state, u.id))
    .sort((a, b) => getUpgradeCost(state, a.id) - getUpgradeCost(state, b.id));
}

export function buyUpgrade(state, upgradeId) {
  if (!isUpgradeUnlocked(state, upgradeId)) return state;
  const cost = getUpgradeCost(state, upgradeId);
  if (cost > state.salvage) return state;
  return refresh({ ...state, salvage: state.salvage - cost, upgrades: { ...state.upgrades, [upgradeId]: true } });
}

// --- Earning ---------------------------------------------------------------

function earn(state, amount) {
  if (!(amount > 0)) return state;
  return { ...state, salvage: state.salvage + amount, runEarned: state.runEarned + amount, totalEarned: state.totalEarned + amount };
}

export function getEraForEarned(earned) {
  let era = 1;
  for (let next = 2; next <= ERA_COUNT; next++) if (earned >= ERA_THRESHOLDS[next]) era = next;
  return era;
}

function addLog(state, entry) {
  return { ...state, log: [...state.log, { ...entry, time: state.totalTime }].slice(-40) };
}

// Era and achievement bookkeeping after anything that changes the economy.
function refresh(state) {
  let next = state;
  const era = Math.max(next.era, getEraForEarned(next.runEarned));
  if (era !== next.era) {
    for (let reached = next.era + 1; reached <= era; reached++) next = addLog(next, { kind: 'era', era: reached, first: reached > next.highestEra });
    next = { ...next, era, highestEra: Math.max(next.highestEra, era) };
  }
  return checkAchievements(next);
}

export function checkAchievements(state) {
  let earned = null;
  let stats = null;
  for (const achievement of ACHIEVEMENTS) {
    if (state.achievements[achievement.id]) continue;
    stats ??= getStats(state);
    if (achievement.test(state, stats)) (earned ??= []).push(achievement.id);
  }
  if (!earned) return state;
  let next = { ...state, achievements: { ...state.achievements, ...Object.fromEntries(earned.map(id => [id, true])) } };
  for (const id of earned) next = addLog(next, { kind: 'achievement', id });
  return next;
}

// Dig by hand. `times` batches clicks made within one frame.
export function click(state, times = 1) {
  if (!Number.isInteger(times) || times < 1) return state;
  const value = getClickValue(state) * times;
  return refresh({ ...earn(state, value), clicks: state.clicks + times, clickEarned: state.clickEarned + value });
}

// --- Echoes ----------------------------------------------------------------

function resonance(state) {
  return (state.upgrades.faintResonance ? 2 : 1) * (state.upgrades.clearResonance ? 2 : 1);
}

export function getEchoLifetime(state) {
  return ECHO_LIFETIME * resonance(state);
}

export function nextEchoDelay(state, rng = Math.random) {
  const delay = ECHO_SPAWN_MIN + rng() * (ECHO_SPAWN_MAX - ECHO_SPAWN_MIN);
  return delay / resonance(state) / (state.memoryUpgrades.echoSense ? 1.5 : 1);
}

export function getBuffDuration(state, seconds) {
  return seconds * (state.upgrades.lastingEcho ? 2 : 1) * (state.memoryUpgrades.lingeringEcho ? 1.5 : 1);
}

// Ancient Hands is held back until the Digital Age so a lucky first echo
// cannot skip the opening eras.
function pickEchoEffect(state, rng) {
  const effects = Object.entries(ECHO_EFFECTS).filter(([id]) => id !== 'ancientHands' || state.era >= 3);
  let roll = rng() * effects.reduce((sum, [, effect]) => sum + effect.weight, 0);
  for (const [id, effect] of effects) {
    roll -= effect.weight;
    if (roll < 0) return id;
  }
  return effects[0][0];
}

// Catch the visible echo. Returns the new state and what it gave.
export function catchEcho(state, rng = Math.random) {
  if (!state.echo.active) return { state, effect: null };
  const effectId = pickEchoEffect(state, rng);
  const effect = ECHO_EFFECTS[effectId];
  let next = { ...state, echo: { timer: nextEchoDelay(state, rng), active: null }, echoesCaught: state.echoesCaught + 1 };
  let amount = 0;
  if (effectId === 'cache') {
    amount = Math.min(state.salvage * 0.15, getBaseSps(state) * 900) + 13;
    next = earn(next, amount);
  } else {
    const buff = { id: effectId, remaining: getBuffDuration(state, effect.duration) };
    if (effect.production) buff.production = effect.production;
    if (effect.clickSeconds) buff.clickSeconds = effect.clickSeconds;
    next = { ...next, buffs: [...next.buffs.filter(b => b.id !== effectId), buff] };
  }
  next = addLog(next, { kind: 'echo', effect: effectId, amount });
  return { state: refresh(next), effect: { id: effectId, amount } };
}

// --- Time ------------------------------------------------------------------

export function getOfflineEfficiency(state) {
  const m = state.memoryUpgrades;
  return m.nothingIsLost ? 1 : m.ruinsWait ? 0.5 : m.patientRuins ? 0.25 : 0.1;
}

// Production over `dt` seconds, split at each buff's expiry.
function integrate(state, dt, efficiency) {
  const base = getBaseSps(state) * efficiency;
  let buffs = state.buffs;
  let earned = 0;
  let left = dt;
  while (left > 0) {
    const step = Math.min(left, ...buffs.map(b => b.remaining));
    earned += base * buffMultiplier(buffs, 'production') * step;
    buffs = buffs.map(b => ({ ...b, remaining: b.remaining - step })).filter(b => b.remaining > 1e-9);
    left -= step;
  }
  return { earned, buffs };
}

// Advance the game by dt seconds. Offline time produces at reduced efficiency
// and never shows echoes, since nobody is there to catch them.
export function tick(state, dt, rng = Math.random, { offline = false } = {}) {
  if (!(dt > 0)) return state;
  const { earned, buffs } = integrate(state, dt, offline ? getOfflineEfficiency(state) : 1);
  let next = earn({ ...state, buffs, runTime: state.runTime + dt, totalTime: state.totalTime + dt }, earned);
  let { timer, active } = state.echo;
  if (offline) {
    active = null;
    timer = Math.max(30, timer - dt);
  } else if (active) {
    const remaining = active.remaining - dt;
    if (remaining <= 0) {
      active = null;
      timer = nextEchoDelay(state, rng);
    } else active = { ...active, remaining };
  } else {
    timer -= dt;
    if (timer <= 0) {
      active = { x: 0.15 + rng() * 0.7, y: 0.15 + rng() * 0.7, remaining: getEchoLifetime(state) };
      timer = 0;
    }
  }
  next = { ...next, echo: { timer, active } };
  return refresh(next);
}

// Catch up after the game was closed. Production is linear between purchases,
// so any gap is resolved in one step.
export function advanceOffline(state, seconds, rng = Math.random) {
  if (!(seconds > 0)) return { state, earned: 0, seconds: 0 };
  const next = tick(state, seconds, rng, { offline: true });
  return { state: next, earned: next.totalEarned - state.totalEarned, seconds };
}

// --- The cycle -------------------------------------------------------------

export function getMemoriesForEarned(totalEarned) {
  return Math.floor(Math.cbrt(totalEarned / MEMORY_DIVISOR));
}

export function getPendingMemories(state) {
  return Math.max(0, getMemoriesForEarned(state.totalEarned) - state.memories);
}

// Salvage needed in total before the next memory is earned.
export function getNextMemoryAt(state) {
  const target = Math.max(getMemoriesForEarned(state.totalEarned), state.memories) + 1;
  return target ** 3 * MEMORY_DIVISOR;
}

export function turnCycle(state) {
  const pending = getPendingMemories(state);
  const next = startCycle({ ...state, memories: state.memories + pending, cycles: state.cycles + 1 });
  return refresh(addLog(next, { kind: 'cycle', memories: pending, cycle: next.cycles }));
}

export function isMemoryUpgradeAvailable(state, id) {
  const upgrade = MEMORY_UPGRADE_BY_ID[id];
  return !!upgrade && !state.memoryUpgrades[id] && (!upgrade.requires || !!state.memoryUpgrades[upgrade.requires]);
}

export function buyMemoryUpgrade(state, id) {
  if (!isMemoryUpgradeAvailable(state, id)) return state;
  const upgrade = MEMORY_UPGRADE_BY_ID[id];
  if (getAvailableMemories(state) < upgrade.cost) return state;
  return refresh({ ...state, memoryUpgrades: { ...state.memoryUpgrades, [id]: true } });
}

// --- The ending ------------------------------------------------------------

// Owning an Echo of Yourself lets you choose (or rewrite) the message the
// ruins will carry into every later cycle.
export function canLeaveMessage(state) {
  return (state.buildings.echo || 0) > 0;
}

export function leaveMessage(state, id) {
  if (!MESSAGES[id] || !canLeaveMessage(state) || state.message === id) return state;
  return addLog({ ...state, message: id }, { kind: 'message', id });
}
