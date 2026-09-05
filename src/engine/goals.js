import { upgrades } from '../data/upgrades.js';
import { techTree } from '../data/tech-tree.js';
import { getAvailableUpgrades, getUpgradeCost, purchaseUpgrade } from './upgrades.js';
import { getAvailableTech, unlockTech } from './tech.js';
import { estimateAffordability } from './economy.js';

export function queueGoal(state, kind, id) {
  const definition = kind === 'upgrade' ? upgrades[id] : kind === 'tech' ? techTree[id] : null;
  if (!definition || ['obsolete', 'complete'].includes(getGoalStatus(state, { kind, id })) || state.goals?.some(g => g.kind === kind && g.id === id) || (state.goals?.length || 0) >= 5) return state;
  return { ...state, goals: [...(state.goals || []), { kind, id }] };
}
export function removeGoal(state, index) {
  return { ...state, goals: (state.goals || []).filter((_, i) => i !== index) };
}
export function getGoalStatus(state, goal) {
  if (!goal || !['upgrade', 'tech'].includes(goal.kind)) return 'obsolete';
  const definitions = goal.kind === 'upgrade' ? upgrades : techTree;
  const owned = goal.kind === 'upgrade' ? state.upgrades : state.tech;
  const def = definitions[goal.id];
  if (!def) return 'obsolete';
  if (owned[goal.id]) return 'complete';
  const impossible = (id, seen = new Set()) => {
    const d = definitions[id];
    if (!d || seen.has(id)) return true;
    if (owned[id]) return false;
    if (owned[d.exclusiveWith || d.excludes]) return true;
    return d.prerequisites.filter(p => impossible(p, new Set([...seen, id]))).length > (state.prestigeUpgrades?.quantumTunneling ? 1 : 0);
  };
  if (impossible(goal.id)) return 'obsolete';
  const available = goal.kind === 'upgrade' ? getAvailableUpgrades(state) : getAvailableTech(state);
  return available.some(d => d.id === goal.id) ? 'ready' : 'waiting';
}
export function getActiveGoal(state) {
  return (state.goals || []).find(g => getGoalStatus(state, g) === 'ready');
}
export function moveGoal(state, index, direction) {
  const goals = [...(state.goals || [])];
  const target = index + direction;
  if (!goals[index] || target < 0 || target >= goals.length) return state;
  [goals[index], goals[target]] = [goals[target], goals[index]];
  return { ...state, goals };
}
export function getGoalInfo(state) {
  const goal = getActiveGoal(state) || state.goals?.[0];
  if (!goal) return null;
  const definition = goal.kind === 'upgrade' ? upgrades[goal.id] : techTree[goal.id];
  if (!definition) return null;
  const cost = goal.kind === 'upgrade' ? getUpgradeCost(state, goal.id) : definition.cost;
  const available = (goal.kind === 'upgrade' ? getAvailableUpgrades(state) : getAvailableTech(state)).some(d => d.id === goal.id);
  return { ...goal, name: definition.name, cost, available, ...estimateAffordability(state, cost) };
}
export function advanceGoal(state) {
  const removed = (state.goals || []).filter(g => ['complete', 'obsolete'].includes(getGoalStatus(state, g)));
  let current = removed.length ? { ...state, goals: state.goals.filter(g => !removed.includes(g)),
    goalNotice: removed.some(g => getGoalStatus(state, g) === 'obsolete') ? 'Removed a goal that conflicts with your choices. Remaining goals can continue.' : state.goalNotice } : state;
  if (current.goalsPaused) return current;
  const goal = getActiveGoal(current);
  if (!goal) return current;
  const purchased = goal.kind === 'upgrade' ? purchaseUpgrade(current, goal.id) : unlockTech(current, goal.id);
  return purchased ? removeGoal(purchased, current.goals.indexOf(goal)) : current;
}

// Called only by automatic spending. An explicit player purchase always remains
// possible. A queued future-era goal does not reserve resources prematurely.
export function preservesGoalReserve(state, cost) {
  const goal = state.goalsPaused ? null : getActiveGoal(state);
  if (!goal) return true;
  const definition = goal.kind === 'upgrade' ? upgrades[goal.id] : techTree[goal.id];
  if (!definition || definition.era > state.era || (goal.kind === 'upgrade' ? state.upgrades : state.tech)[goal.id]) return true;
  const available = (goal.kind === 'upgrade' ? getAvailableUpgrades(state) : getAvailableTech(state)).some(d => d.id === goal.id);
  if (!available) return true;
  const reserve = goal.kind === 'upgrade' ? getUpgradeCost(state, goal.id) : definition.cost;
  return Object.entries(cost).every(([id, amount]) => !reserve[id] || state.resources[id].amount - amount >= reserve[id]);
}
