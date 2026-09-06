import { DECISIONS } from '../data/decisions.js';
import { createInitialState, migrateState } from './state.js';
import { upgrades } from '../data/upgrades.js';
import { techTree } from '../data/tech-tree.js';
import { RELICS } from '../data/relics.js';
import { COMMISSION_TYPES } from './commissions.js';
import { PRODUCTION_ROUTES } from './legacy.js';

export const SAVE_KEY = 'incremental-game-save';
export const BACKUP_KEYS = [`${SAVE_KEY}-backup-1`, `${SAVE_KEY}-backup-2`];
export const CHECKPOINT_KEYS = [`${SAVE_KEY}-before-prestige`, `${SAVE_KEY}-before-migration`, `${SAVE_KEY}-checkpoint`];
export const RECOVERY_KEYS = [...BACKUP_KEYS, ...CHECKPOINT_KEYS];

const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const finite = value => Number.isFinite(value) && value >= 0;
const goal = value => object(value) && (value.kind === 'upgrade' ? !!upgrades[value.id] : value.kind === 'tech' && !!techTree[value.id]);
const commission = value => object(value) && !!COMMISSION_TYPES[value.kind]?.definitions[value.id] && (value.targetLevel === undefined || Number.isSafeInteger(value.targetLevel) && value.targetLevel > 0);
function arrayEntries(value, test, name) {
  if (value !== undefined && (!Array.isArray(value) || !value.every(test))) throw new Error(`Invalid ${name}`);
}
function validateControls(controls) {
  if (controls === undefined) return;
  if (!object(controls)) throw new Error('Invalid consumer controls');
  for (const control of Object.values(controls)) {
    if (!object(control) || control.paused !== undefined && typeof control.paused !== 'boolean' || control.reserveFraction !== undefined && (!finite(control.reserveFraction) || control.reserveFraction > 0.9)) throw new Error('Invalid consumer control');
  }
}
export function validateAutomationPlan(plan) {
  if (!object(plan) || Object.keys(plan).some(key => !['goals', 'commissions', 'consumerControls', 'autoBuildOut', 'protectProgression', 'version', 'choices', 'repeat', 'loadout', 'productionRoute'].includes(key))) throw new Error('Invalid automation plan');
  arrayEntries(plan.goals, goal, 'plan goals');
  arrayEntries(plan.choices, goal, 'plan choices');
  arrayEntries(plan.commissions, commission, 'plan commissions');
  arrayEntries(plan.loadout, id => !!RELICS[id], 'plan relics');
  validateControls(plan.consumerControls);
  if (plan.productionRoute !== undefined && !PRODUCTION_ROUTES[plan.productionRoute]) throw new Error('Invalid plan production route');
  for (const key of ['autoBuildOut', 'protectProgression', 'repeat']) if (plan[key] !== undefined && typeof plan[key] !== 'boolean') throw new Error(`Invalid plan ${key}`);
  return plan;
}

export function parseSave(text) {
  const saved = JSON.parse(text);
  if (!saved || Array.isArray(saved) || !Number.isInteger(saved.era) || saved.era < 1 || saved.era > 10 ||
      !saved.resources || typeof saved.resources !== 'object' || Array.isArray(saved.resources)) throw new Error('Invalid game save');
  if ((saved.saveVersion || 0) > createInitialState().saveVersion) throw new Error('This save needs a newer version of the game');
  if (saved.eraReviewMode !== undefined && !['first', 'always', 'automatic'].includes(saved.eraReviewMode)) throw new Error('Invalid chapter transitions');
  if (saved.eraReviewApproved !== undefined && (!Number.isInteger(saved.eraReviewApproved) || saved.eraReviewApproved > 9)) throw new Error('Invalid chapter approval');
  const defaults = createInitialState();
  for (const [key, value] of Object.entries(defaults)) {
    if (saved[key] === undefined) continue;
    if (object(value) && !object(saved[key])) throw new Error(`Invalid ${key}`);
    if (typeof value === 'number' && (!Number.isFinite(saved[key]) || saved[key] < 0)) throw new Error(`Invalid ${key}`);
    if (typeof value === 'boolean' && typeof saved[key] !== 'boolean') throw new Error(`Invalid ${key}`);
  }
  for (const key of ['publicWorks', 'realityKeys', 'bestEraTimes', 'dysonModules']) {
    if (saved[key] && !Object.values(saved[key]).every(finite)) throw new Error(`Invalid ${key}`);
  }
  if (saved.completedPublicWorks && !Object.values(saved.completedPublicWorks).every(v => typeof v === 'boolean')) throw new Error('Invalid completed public works');
  for (const field of ['upgrades', 'tech', 'prestigeUpgrades', 'achievements']) {
    if (saved[field] != null && (typeof saved[field] !== 'object' || Array.isArray(saved[field]))) throw new Error(`Invalid ${field}`);
  }
  for (const field of ['eventLog', 'activeEffects', 'activeRelics', 'relicOffer', 'goals', 'commissions', 'plannedPrestigeUpgrades']) {
    if (saved[field] !== undefined && !Array.isArray(saved[field])) throw new Error(`Invalid ${field}`);
  }
  arrayEntries(saved.goals, goal, 'goals');
  arrayEntries(saved.commissions, commission, 'commissions');
  arrayEntries(saved.buildHistory, goal, 'build history');
  for (const key of ['activeRelics', 'relicOffer']) arrayEntries(saved[key], id => typeof id === 'string' && !!RELICS[id], key);
  arrayEntries(saved.eventLog, e => object(e) && typeof e.message === 'string', 'event log');
  arrayEntries(saved.activeEffects, e => object(e) && finite(e.endsAt) && (e.effect === undefined || object(e.effect)) && (e.effects === undefined || Array.isArray(e.effects) && e.effects.every(object)), 'active effects');
  arrayEntries(saved.plannedPrestigeUpgrades, id => typeof id === 'string', 'prestige plan');
  validateControls(saved.consumerControls);
  if (saved.productionRoute !== undefined && !PRODUCTION_ROUTES[saved.productionRoute]) throw new Error('Invalid production route');
  for (const key of ['autoBuildOut', 'protectProgression', 'goalsPaused']) if (saved[key] !== undefined && typeof saved[key] !== 'boolean') throw new Error(`Invalid ${key}`);
  if (saved.archive !== undefined) {
    const archive = saved.archive;
    if (!archive || typeof archive !== 'object' || Array.isArray(archive)) throw new Error('Invalid archive');
    for (const field of ['entries', 'lore']) if (archive[field] !== undefined && !Array.isArray(archive[field])) throw new Error(`Invalid archive ${field}`);
    for (const field of ['research', 'projects', 'contributions']) if (archive[field] !== undefined && (!archive[field] || typeof archive[field] !== 'object' || Array.isArray(archive[field]))) throw new Error(`Invalid archive ${field}`);
    if (archive.shards !== undefined && (!Number.isFinite(archive.shards) || archive.shards < 0)) throw new Error('Invalid memory shards');
    arrayEntries(archive.entries, e => object(e) && Number.isInteger(e.cycle) && finite(e.seconds) && Number.isInteger(e.era) && e.era >= 1 && e.era <= 10, 'archive entries');
    arrayEntries(archive.lore, e => typeof e === 'string', 'archive lore');
    if (archive.savedPlan != null) validateAutomationPlan(archive.savedPlan);
    arrayEntries(archive.lastChoices, id => !!DECISIONS[id], 'remembered choices');
    if (archive.discoveries !== undefined && (!object(archive.discoveries) || !Object.values(archive.discoveries).every(d => object(d) && typeof d.title === 'string' && typeof d.text === 'string' && typeof d.read === 'boolean' && Number.isInteger(d.era) && d.era >= 1 && d.era <= 10 && Number.isInteger(d.cycle) && d.cycle > 0 && (d.requires == null || typeof d.requires === 'string')))) throw new Error('Invalid discoveries');
    arrayEntries(archive.lastBuild, goal, 'remembered build');
    arrayEntries(archive.lastCommissions, commission, 'remembered commissions');
    if (archive.mappedWorks !== undefined && (!object(archive.mappedWorks) || !Object.values(archive.mappedWorks).every(v => typeof v === 'boolean'))) throw new Error('Invalid mapped works');
  }
  if (saved.forgetting && (!Array.isArray(saved.forgetting.tendrils) || !Array.isArray(saved.forgetting.wardens) || !saved.forgetting.scars || !Number.isFinite(saved.forgetting.meter))) throw new Error('Invalid siege save');
  if (saved.forgetting) {
    arrayEntries(saved.forgetting.tendrils, t => object(t) && typeof t.targetId === 'string' && finite(t.arrivesAt) && ['approach', 'held', 'consuming'].includes(t.phase), 'siege tendrils');
    arrayEntries(saved.forgetting.wardens, w => object(w) && Number.isInteger(w.id) && (w.nodeId === null || typeof w.nodeId === 'string') && Number.isFinite(w.movedAt), 'siege wardens');
  }
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
  for (const key of [SAVE_KEY, ...RECOVERY_KEYS]) {
    let text;
    try { text = storage.getItem(key); }
    catch { return { state: null, warning: 'Save storage is unavailable. Export your progress before closing.', blocked: true }; }
    if (!text) continue;
    try {
      const state = parseSave(text);
      return { state, needsMigration: JSON.parse(text).saveVersion !== state.saveVersion, warning: key === SAVE_KEY ? null : 'Recovered your most recent valid backup. The original save has been preserved.', blocked: key !== SAVE_KEY };
    } catch { foundInvalid = true; }
  }
  return { state: null, blocked: foundInvalid, warning: foundInvalid ? 'Your save could not be read. It has been preserved. Restore a backup or import a valid export to continue.' : null };
}

export function writeSave(storage, state, now = Date.now(), checkpoint = null) {
  try {
    const text = serializeSave(state, now);
    const previous = storage.getItem(SAVE_KEY);
    // Validate before rotating, so a corrupt primary never evicts a good backup.
    if (previous) {
      try {
        const prior = parseSave(previous);
        if (checkpoint === 'migration') storage.setItem(CHECKPOINT_KEYS[1], previous);
        if (state.prestigeCount > prior.prestigeCount) storage.setItem(CHECKPOINT_KEYS[0], previous);
        const durable = storage.getItem(CHECKPOINT_KEYS[2]);
        if (!durable || now - parseSave(durable).lastSaved >= 600000) storage.setItem(CHECKPOINT_KEYS[2], previous);
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
