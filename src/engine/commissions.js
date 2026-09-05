import { DYSON_MODULES, DYSON_MODULE_LIMIT, commissionDysonModule } from './dyson.js';
import { REALITY_LAWS, weaveRealityLaw } from './weaving.js';
import { COSMIC_BANDS, lockCosmicSignal } from './tuning.js';

export const COMMISSION_TYPES = {
  dyson: { era: 7, definitions: DYSON_MODULES, apply: commissionDysonModule },
  law: { era: 8, definitions: REALITY_LAWS, apply: weaveRealityLaw },
  signal: { era: 9, definitions: COSMIC_BANDS, apply: lockCosmicSignal },
};
export function canQueueCommission(state, kind, id) {
  const type = COMMISSION_TYPES[kind];
  if (!type || state.era < type.era || !type.definitions[id] || (state.commissions?.length || 0) >= 6) return false;
  if (kind === 'dyson') {
    const built = Object.values(state.dysonModules || {}).reduce((sum, count) => sum + count, 0);
    return built + (state.commissions || []).filter(c => c.kind === kind).length < DYSON_MODULE_LIMIT;
  }
  const owned = kind === 'law' ? state.wovenLaws : state.lockedSignals;
  return !owned?.[id] && !state.commissions?.some(c => c.kind === kind && c.id === id);
}
export function queueCommission(state, kind, id) {
  if (!canQueueCommission(state, kind, id)) return state;
  const targetLevel = kind === 'dyson' ? (state.dysonModules?.[id] || 0) + (state.commissions || []).filter(c => c.kind === kind && c.id === id).length + 1 : 1;
  return { ...state, commissions: [...(state.commissions || []), { kind, id, targetLevel }] };
}
export function removeCommission(state, index) {
  return { ...state, commissions: (state.commissions || []).filter((_, i) => i !== index) };
}
export function advanceCommissions(state) {
  let current = state;
  // Different systems can operate concurrently, but each uses its actual
  // command, costs, finite choice limit, and cooldown. No choice is invented.
  for (const kind of Object.keys(COMMISSION_TYPES)) {
    const index = current.commissions?.findIndex(c => c.kind === kind) ?? -1;
    if (index < 0) continue;
    const item = current.commissions[index];
    const owned = kind === 'dyson' ? current.dysonModules : kind === 'law' ? current.wovenLaws : current.lockedSignals;
    const complete = kind === 'dyson' ? (owned?.[item.id] || 0) >= (item.targetLevel || 1) || Object.values(owned || {}).reduce((sum, count) => sum + count, 0) >= DYSON_MODULE_LIMIT : !!owned?.[item.id];
    if (complete) { current = removeCommission(current, index); continue; }
    const next = COMMISSION_TYPES[kind].apply(current, item.id)?.state;
    if (next) current = removeCommission(next, index);
  }
  return current;
}
