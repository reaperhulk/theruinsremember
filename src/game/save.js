// Saving, loading, and carrying players over from the original game.
import { MESSAGES } from './lore.js';
import { ACHIEVEMENT_BY_ID, BUILDING_BY_ID, ECHO_EFFECTS, MEMORY_UPGRADE_BY_ID, UPGRADE_BY_ID } from './data.js';
import { SAVE_VERSION, createState, getEraForEarned } from './engine.js';

export const SAVE_KEY = 'the-ruins-remember-save';
export const BACKUP_KEY = `${SAVE_KEY}-backup`;
// The original resource-management game saved here. It is only ever read.
export const LEGACY_SAVE_KEY = 'incremental-game-save';

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const amount = value => Number.isFinite(value) && value >= 0;

function flags(value, known) {
  if (!isObject(value)) return {};
  return Object.fromEntries(Object.keys(value).filter(id => known[id] && value[id]).map(id => [id, true]));
}

// Validate and normalise a parsed save. Unknown ids are dropped so data
// changes can retire content without breaking old saves.
export function parseSave(text) {
  const saved = JSON.parse(text);
  if (!isObject(saved) || saved.version !== SAVE_VERSION) throw new Error('Not a save for this version of the game');
  const fresh = createState(saved.lastSaved);
  const state = { ...fresh };
  for (const key of ['salvage', 'runEarned', 'totalEarned', 'clicks', 'clickEarned', 'echoesCaught', 'memories', 'bonusMemories', 'spentMemories', 'cycles', 'runTime', 'totalTime', 'lastSaved']) {
    if (saved[key] === undefined) continue;
    if (!amount(saved[key])) throw new Error(`Invalid ${key}`);
    state[key] = saved[key];
  }
  if (state.runEarned > state.totalEarned) throw new Error('Invalid earnings');
  if (state.spentMemories > state.memories + state.bonusMemories) throw new Error('Invalid memories');
  state.buildings = {};
  if (isObject(saved.buildings)) {
    for (const [id, n] of Object.entries(saved.buildings)) {
      if (!BUILDING_BY_ID[id]) continue;
      if (!Number.isSafeInteger(n) || n < 0) throw new Error('Invalid buildings');
      if (n > 0) state.buildings[id] = n;
    }
  }
  state.upgrades = flags(saved.upgrades, UPGRADE_BY_ID);
  state.achievements = flags(saved.achievements, ACHIEVEMENT_BY_ID);
  state.memoryUpgrades = flags(saved.memoryUpgrades, MEMORY_UPGRADE_BY_ID);
  state.era = Math.max(getEraForEarned(state.runEarned), Number.isInteger(saved.era) ? Math.min(10, Math.max(1, saved.era)) : 1);
  state.highestEra = Math.max(state.era, Number.isInteger(saved.highestEra) ? Math.min(10, saved.highestEra) : 1);
  state.buffs = Array.isArray(saved.buffs)
    ? saved.buffs.filter(b => isObject(b) && ECHO_EFFECTS[b.id] && amount(b.remaining))
      .map(b => ({ id: b.id, remaining: b.remaining, ...(ECHO_EFFECTS[b.id].production ? { production: ECHO_EFFECTS[b.id].production } : {}), ...(ECHO_EFFECTS[b.id].click ? { click: ECHO_EFFECTS[b.id].click } : {}) }))
    : [];
  const timer = saved.echo?.timer;
  state.echo = { timer: amount(timer) ? timer : fresh.echo.timer, active: null };
  state.message = MESSAGES[saved.message] ? saved.message : null;
  state.log = Array.isArray(saved.log) ? saved.log.filter(isObject).slice(-40) : [];
  return state;
}

export function serializeSave(state, now = Date.now()) {
  return JSON.stringify({ ...state, lastSaved: now });
}

// Players of the original game keep a head start: memories for how far their
// civilizations reached. The old save is left untouched.
export function importLegacySave(text, now = Date.now()) {
  const old = JSON.parse(text);
  if (!isObject(old) || !isObject(old.resources)) throw new Error('Not a legacy save');
  const era = Math.min(10, Math.max(1, Number(old.lifetimeHighestEra) || Number(old.era) || 1));
  const cycles = Math.max(0, Math.floor(Number(old.prestigeCount) || 0));
  const bonusMemories = Math.min(250, era * 5 + cycles * 10);
  const state = createState(now);
  return {
    ...state,
    bonusMemories,
    log: [{ kind: 'legacy', memories: bonusMemories, era, cycles, time: 0 }],
  };
}

export function loadSave(storage, now = Date.now()) {
  let text;
  try { text = storage.getItem(SAVE_KEY); } catch {
    return { state: null, warning: 'Save storage is unavailable. Export your progress before closing.' };
  }
  if (text) {
    try { return { state: parseSave(text) }; } catch { /* fall back to the backup */ }
    try {
      const backup = storage.getItem(BACKUP_KEY);
      if (backup) return { state: parseSave(backup), warning: 'Your save could not be read, so the most recent backup was restored.' };
    } catch { /* no usable backup */ }
    return { state: null, blocked: true, warning: 'Your save could not be read. It has been left in place; import an export or reset to continue.' };
  }
  try {
    const legacy = storage.getItem(LEGACY_SAVE_KEY);
    if (legacy) return { state: importLegacySave(legacy, now), legacy: true };
  } catch { /* an unreadable legacy save just means a fresh start */ }
  return { state: null };
}

export function writeSave(storage, state, now = Date.now()) {
  try {
    const previous = storage.getItem(SAVE_KEY);
    if (previous) storage.setItem(BACKUP_KEY, previous);
    storage.setItem(SAVE_KEY, serializeSave(state, now));
    return null;
  } catch {
    return 'Progress could not be saved. Export a save now; storage may be full or disabled.';
  }
}

export function exportSave(state) {
  const bytes = new TextEncoder().encode(serializeSave(state));
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export function importSave(text) {
  const trimmed = text.trim();
  if (trimmed.startsWith('{')) return parseSave(trimmed);
  const bytes = Uint8Array.from(atob(trimmed), char => char.charCodeAt(0));
  return parseSave(new TextDecoder().decode(bytes));
}
