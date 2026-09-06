import { upgrades } from '../data/upgrades.js';
import { techTree } from '../data/tech-tree.js';
import { getAvailableUpgrades, getUpgradeCost, purchaseUpgrade } from './upgrades.js';
import { getAvailableTech, unlockTech } from './tech.js';
import { estimateAffordability } from './economy.js';
import { projects } from '../data/projects.js';
import { getProjectCost, getProjectStatus, purchaseProject, getAvailableProjects } from './projects.js';

export const getGoalDefinition = goal => (goal.kind === 'project' ? projects : goal.kind === 'tech' ? techTree : upgrades)[goal.id];
const goalCost = (state, goal) => goal.kind === 'project' ? getProjectCost(state, goal.id) : goal.kind === 'upgrade' ? getUpgradeCost(state, goal.id) : techTree[goal.id]?.cost;
const availableGoals = (state, kind) => (kind === 'project' ? getAvailableProjects : kind === 'upgrade' ? getAvailableUpgrades : getAvailableTech)(state);

export function queueGoal(state, kind, id) {
  const definition = ['upgrade', 'tech', 'project'].includes(kind) ? getGoalDefinition({ kind, id }) : null;
  if (!definition || ['obsolete', 'complete'].includes(getGoalStatus(state, { kind, id })) || state.goals?.some(g => g.kind === kind && g.id === id) || (state.goals?.length || 0) >= 5) return state;
  return { ...state, goals: [...(state.goals || []), { kind, id }] };
}
export function removeGoal(state, index) {
  return { ...state, goals: (state.goals || []).filter((_, i) => i !== index) };
}
export function getGoalStatus(state, goal) {
  if (!goal || !['upgrade', 'tech', 'project'].includes(goal.kind)) return 'obsolete';
  if (goal.kind === 'project') return getProjectStatus(state, goal.id);
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
  const missing = def.prerequisites.filter(id => !owned[id]).length;
  if (def.era > state.era || missing > (state.prestigeUpgrades?.quantumTunneling ? 1 : 0)
    || (def.requireGems || 0) > (state.totalGems || 0) || (def.requireTrades || 0) > (state.totalTrades || 0)
    || (def.requirePrestige || 0) > (state.prestigeCount || 0)) return 'waiting';
  return 'ready';
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
  const definition = getGoalDefinition(goal);
  if (!definition) return null;
  const cost = goalCost(state, goal);
  const available = availableGoals(state, goal.kind).some(d => d.id === goal.id);
  return { ...goal, name: definition.name, cost, available, ...estimateAffordability(state, cost) };
}
export function advanceGoal(state) {
  const removed = (state.goals || []).filter(g => ['complete', 'obsolete'].includes(getGoalStatus(state, g)));
  let current = removed.length ? { ...state, goals: state.goals.filter(g => !removed.includes(g)),
    goalNotice: removed.some(g => getGoalStatus(state, g) === 'obsolete') ? 'Removed a goal that conflicts with your choices. Remaining goals can continue.' : state.goalNotice } : state;
  if (current.goalsPaused) return current;
  const goal = getActiveGoal(current);
  if (!goal) return current;
  const purchased = (goal.kind === 'project' ? purchaseProject : goal.kind === 'upgrade' ? purchaseUpgrade : unlockTech)(current, goal.id);
  return purchased ? removeGoal(purchased, current.goals.indexOf(goal)) : current;
}

// Called only by automatic spending. An explicit player purchase always remains
// possible. A queued future-era goal does not reserve resources prematurely.
export function preservesGoalReserve(state, cost) {
  const goal = state.goalsPaused ? null : getActiveGoal(state);
  if (!goal) return true;
  const definition = getGoalDefinition(goal);
  if (!definition || definition.era > state.era || getGoalStatus(state, goal) === 'complete') return true;
  const available = availableGoals(state, goal.kind).some(d => d.id === goal.id);
  if (!available) return true;
  const reserve = goalCost(state, goal);
  return Object.entries(cost).every(([id, amount]) => !reserve[id] || state.resources[id].amount - amount >= reserve[id]);
}
