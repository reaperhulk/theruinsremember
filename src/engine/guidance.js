import { queueGoal } from './goals.js';
import { getEraObjective } from './objectives.js';

export function getPurchaseTarget(state) { return getEraObjective(state).target || null; }

export function prioritizePurchase(state, target) {
  const queued = queueGoal(state, target.kind, target.id);
  const index = queued.goals.findIndex(g => g.kind === target.kind && g.id === target.id);
  if (index < 0) return state;
  return { ...queued, goals: [queued.goals[index], ...queued.goals.filter((_, i) => i !== index)], goalsPaused: false, protectProgression: true };
}
