import { createInitialState, migrateState } from './state.js';

export const SAVE_KEY = 'incremental-game-save';
export const BACKUP_KEYS = [`${SAVE_KEY}-backup-1`, `${SAVE_KEY}-backup-2`];

export function parseSave(text) {
  const saved = JSON.parse(text);
  if (!saved || Array.isArray(saved) || !Number.isInteger(saved.era) || saved.era < 1 || saved.era > 10 ||
      !saved.resources || typeof saved.resources !== 'object' || Array.isArray(saved.resources)) throw new Error('Invalid game save');
  if ((saved.saveVersion || 0) > createInitialState().saveVersion) throw new Error('This save needs a newer version of the game');
  for (const field of ['upgrades', 'tech', 'prestigeUpgrades', 'achievements']) {
    if (saved[field] != null && (typeof saved[field] !== 'object' || Array.isArray(saved[field]))) throw new Error(`Invalid ${field}`);
  }
  for (const field of ['eventLog', 'activeEffects', 'activeRelics', 'relicOffer', 'goals', 'commissions', 'plannedPrestigeUpgrades']) {
    if (saved[field] !== undefined && !Array.isArray(saved[field])) throw new Error(`Invalid ${field}`);
  }
  if (saved.archive !== undefined) {
    const archive = saved.archive;
    if (!archive || typeof archive !== 'object' || Array.isArray(archive)) throw new Error('Invalid archive');
    for (const field of ['entries', 'lore']) if (archive[field] !== undefined && !Array.isArray(archive[field])) throw new Error(`Invalid archive ${field}`);
    for (const field of ['research', 'projects', 'contributions']) if (archive[field] !== undefined && (!archive[field] || typeof archive[field] !== 'object' || Array.isArray(archive[field]))) throw new Error(`Invalid archive ${field}`);
    if (archive.shards !== undefined && (!Number.isFinite(archive.shards) || archive.shards < 0)) throw new Error('Invalid memory shards');
  }
  if (saved.forgetting && (!Array.isArray(saved.forgetting.tendrils) || !Array.isArray(saved.forgetting.wardens) || !saved.forgetting.scars || !Number.isFinite(saved.forgetting.meter))) throw new Error('Invalid siege save');
  for (const resource of Object.values(saved.resources)) {
    if (!resource || typeof resource !== 'object') throw new Error('Invalid resource');
    for (const field of ['amount', 'rateAdd', 'rateMult', 'capMult']) {
      if (resource[field] !== undefined && (!Number.isFinite(resource[field]) || resource[field] < 0 || (['rateMult', 'capMult'].includes(field) && resource[field] === 0))) throw new Error(`Invalid resource ${field}`);
    }
  }
  for (const field of ['totalTime', 'prestigeCount', 'prestigePoints', 'prestigeMultiplier', 'lastSaved']) {
    if (saved[field] !== undefined && (!Number.isFinite(saved[field]) || saved[field] < 0)) throw new Error(`Invalid ${field}`);
  }
  return migrateState(saved);
}

export function serializeSave(state, now = Date.now()) {
  const text = JSON.stringify({ ...state, lastSaved: now });
  parseSave(text);
  return text;
}

export function loadSave(storage) {
  let foundInvalid = false;
  for (const key of [SAVE_KEY, ...BACKUP_KEYS]) {
    let text;
    try { text = storage.getItem(key); }
    catch { return { state: null, warning: 'Save storage is unavailable. Export your progress before closing.', blocked: true }; }
    if (!text) continue;
    try {
      const state = parseSave(text);
      return { state, warning: key === SAVE_KEY ? null : 'Recovered your most recent valid backup. The original save has been preserved.', blocked: key !== SAVE_KEY };
    } catch { foundInvalid = true; }
  }
  return { state: null, blocked: foundInvalid, warning: foundInvalid ? 'Your save could not be read. It has been preserved. Restore a backup or import a valid export to continue.' : null };
}

export function writeSave(storage, state, now = Date.now()) {
  try {
    const text = serializeSave(state, now);
    const previous = storage.getItem(SAVE_KEY);
    // Validate before rotating, so a corrupt primary never evicts a good backup.
    if (previous) {
      try {
        parseSave(previous);
        const backup = storage.getItem(BACKUP_KEYS[0]);
        if (backup) { parseSave(backup); storage.setItem(BACKUP_KEYS[1], backup); }
        storage.setItem(BACKUP_KEYS[0], previous);
      } catch (error) {
        // Storage failures must be surfaced; malformed backups stay untouched.
        if (error.name === 'QuotaExceededError' || error.name === 'SecurityError') throw error;
      }
    }
    storage.setItem(SAVE_KEY, text);
    return null;
  } catch { return 'Progress could not be saved. Export a save now; storage may be full or disabled.'; }
}

export function offlineAllowance(state) {
  return state.prestigeUpgrades?.infinitePatience ? 604800 : state.prestigeCount > 0 ? 86400 : 14400;
}
