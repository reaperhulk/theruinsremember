import { DYSON_MODULES, commissionDysonModule } from './dyson.js';
import { REALITY_LAWS, weaveRealityLaw } from './weaving.js';
import { COSMIC_BANDS, lockCosmicSignal } from './tuning.js';

export const COMMISSION_TYPES = {
  dyson: { era: 7, definitions: DYSON_MODULES, apply: commissionDysonModule },
  law: { era: 8, definitions: REALITY_LAWS, apply: weaveRealityLaw },
  signal: { era: 9, definitions: COSMIC_BANDS, apply: lockCosmicSignal },
};
export function queueCommission(state, kind, id) {
  const type = COMMISSION_TYPES[kind];
  if (!type || state.era < type.era || !type.definitions[id] || (state.commissions?.length || 0) >= 6 || state.commissions?.some(c => c.kind === kind && c.id === id)) return state;
  return { ...state, commissions: [...(state.commissions || []), { kind, id }] };
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
    if (owned?.[item.id]) { current = removeCommission(current, index); continue; }
    const next = COMMISSION_TYPES[kind].apply(current, item.id)?.state;
    if (next) current = removeCommission(next, index);
  }
  return current;
}
