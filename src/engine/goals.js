import { upgrades } from '../data/upgrades.js';
import { techTree } from '../data/tech-tree.js';
import { getAvailableUpgrades, getUpgradeCost, purchaseUpgrade } from './upgrades.js';
import { getAvailableTech, unlockTech } from './tech.js';
import { estimateAffordability } from './economy.js';

export function queueGoal(state, kind, id) {
  const definition = kind === 'upgrade' ? upgrades[id] : kind === 'tech' ? techTree[id] : null;
  if (!definition || state.goals?.some(g => g.kind === kind && g.id === id) || (state.goals?.length || 0) >= 5) return state;
  return { ...state, goals: [...(state.goals || []), { kind, id }] };
}
export function removeGoal(state, index) {
  return { ...state, goals: (state.goals || []).filter((_, i) => i !== index) };
}
export function getGoalInfo(state) {
  const goal = state.goals?.[0];
  if (!goal) return null;
  const definition = goal.kind === 'upgrade' ? upgrades[goal.id] : techTree[goal.id];
  if (!definition) return null;
  const cost = goal.kind === 'upgrade' ? getUpgradeCost(state, goal.id) : definition.cost;
  const available = (goal.kind === 'upgrade' ? getAvailableUpgrades(state) : getAvailableTech(state)).some(d => d.id === goal.id);
  return { ...goal, name: definition.name, cost, available, ...estimateAffordability(state, cost) };
}
export function advanceGoal(state) {
  const goal = state.goals?.[0];
  if (!goal) return state;
  if ((goal.kind === 'upgrade' ? state.upgrades : state.tech)[goal.id]) return removeGoal(state, 0);
  const purchased = goal.kind === 'upgrade' ? purchaseUpgrade(state, goal.id) : unlockTech(state, goal.id);
  return purchased ? removeGoal(purchased, 0) : state;
}

// Called only by automatic spending. An explicit player purchase always remains
// possible. A queued future-era goal does not reserve resources prematurely.
export function preservesGoalReserve(state, cost) {
  const goal = state.goals?.[0];
  if (!goal) return true;
  const definition = goal.kind === 'upgrade' ? upgrades[goal.id] : techTree[goal.id];
  if (!definition || definition.era > state.era || (goal.kind === 'upgrade' ? state.upgrades : state.tech)[goal.id]) return true;
  const available = (goal.kind === 'upgrade' ? getAvailableUpgrades(state) : getAvailableTech(state)).some(d => d.id === goal.id);
  if (!available) return true;
  const reserve = goal.kind === 'upgrade' ? getUpgradeCost(state, goal.id) : definition.cost;
  return Object.entries(cost).every(([id, amount]) => !reserve[id] || state.resources[id].amount - amount >= reserve[id]);
}
