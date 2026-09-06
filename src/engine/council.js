import { upgrades } from '../data/upgrades.js';
import { techTree } from '../data/tech-tree.js';
import { getAvailableUpgrades, getUpgradeCost, purchaseUpgrade } from './upgrades.js';
import { getAvailableTech, unlockTech } from './tech.js';
import { getGoalStatus, queueGoal } from './goals.js';

export function getCouncilGroups(state, kind = 'upgrade') {
  const definitions = kind === 'upgrade' ? upgrades : techTree;
  const owned = kind === 'upgrade' ? state.upgrades : state.tech;
  const available = new Set((kind === 'upgrade' ? getAvailableUpgrades(state) : getAvailableTech(state)).map(d => d.id));
  const seen = new Set(), groups = [];
  for (const def of Object.values(definitions)) {
    const other = definitions[def.exclusiveWith || def.excludes];
    if (!other || def.era > state.era || seen.has(def.id)) continue;
    seen.add(def.id); seen.add(other.id);
    const chosen = [def, other].find(d => owned[d.id]);
    if (def.era < state.era && chosen) continue;
    groups.push({ id: def.id, era: def.era, chosen: chosen?.id, options: [def, other].map(d => ({
      ...d, kind, available: available.has(d.id), owned: !!owned[d.id],
      queued: state.goals?.some(g => g.kind === kind && g.id === d.id),
      cost: kind === 'upgrade' ? getUpgradeCost(state, d.id) : d.cost,
    })) });
  }
  return groups;
}

export function chooseCouncilOption(state, kind, id) {
  if (!['upgrade', 'tech'].includes(kind)) return state;
  const def = (kind === 'upgrade' ? upgrades : techTree)[id];
  if (!def || !(def.exclusiveWith || def.excludes) || def.era > state.era) return state;
  if (['complete', 'obsolete'].includes(getGoalStatus(state, { kind, id }))) return state;
  const purchased = (kind === 'upgrade' ? purchaseUpgrade : unlockTech)(state, id);
  if (purchased) return purchased;
  // An explicit choice may wait for funds/prerequisites. Replace a pending
  // opposing choice instead of silently committing to both alternatives.
  const other = def.exclusiveWith || def.excludes;
  const current = { ...state, goals: (state.goals || []).filter(g => g.kind !== kind || g.id !== other) };
  const queued = queueGoal(current, kind, id);
  const choice = queued.goals.find(g => g.kind === kind && g.id === id);
  return choice ? { ...queued, goals: [choice, ...queued.goals.filter(g => g !== choice)], goalsPaused: false } : state;
}
