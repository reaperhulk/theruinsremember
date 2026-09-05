import { getActiveGoal, queueGoal } from './goals.js';
import { getAvailableTech } from './tech.js';
import { getAvailableUpgrades, getUpgradeCost, isDecisionUpgrade } from './upgrades.js';
import { techTree } from '../data/tech-tree.js';
import { upgrades } from '../data/upgrades.js';
import { canAfford } from './resources.js';

export function getPurchaseTarget(state) {
  const goal = getActiveGoal(state);
  if (goal) return { ...goal, name: (goal.kind === 'tech' ? techTree : upgrades)[goal.id].name,
    cost: goal.kind === 'tech' ? techTree[goal.id].cost : getUpgradeCost(state, goal.id), queued: true };
  const tech = getAvailableTech(state).find(t => t.grantsEra === state.era + 1);
  if (tech) return { kind: 'tech', id: tech.id, name: tech.name, cost: tech.cost };
  const upgrade = getAvailableUpgrades(state).find(u => !u.repeatable && isDecisionUpgrade(u) && !canAfford(state, getUpgradeCost(state, u.id)));
  return upgrade ? { kind: 'upgrade', id: upgrade.id, name: upgrade.name, cost: getUpgradeCost(state, upgrade.id) } : null;
}

export function prioritizePurchase(state, target) {
  const queued = queueGoal(state, target.kind, target.id);
  const index = queued.goals.findIndex(g => g.kind === target.kind && g.id === target.id);
  if (index < 0) return state;
  return { ...queued, goals: [queued.goals[index], ...queued.goals.filter((_, i) => i !== index)], goalsPaused: false, protectProgression: true };
}
