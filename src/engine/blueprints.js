import { upgrades } from '../data/upgrades.js';
import { techTree } from '../data/tech-tree.js';
import { projects } from '../data/projects.js';
import { queueGoal, getGoalStatus } from './goals.js';
import { canQueueCommission, queueCommission } from './commissions.js';
import { isDecisionUpgrade } from './upgrades.js';

export function recordBuildChoice(state, kind, id) {
  const def = kind === 'project' ? projects[id] : kind === 'upgrade' ? upgrades[id] : techTree[id];
  if (!def || kind !== 'project' && (kind === 'upgrade' ? !isDecisionUpgrade(def) : !def.grantsEra && !def.excludes)) return state;
  const history = state.buildHistory || [];
  if (history.some(c => c.kind === kind && c.id === id)) return state;
  return { ...state, buildHistory: [...history, { kind, id }] };
}

export function advanceBlueprint(state) {
  if (!state.blueprintActive || state.goalsPaused || !state.archive?.savedPlan) return state;
  const plan = state.archive.savedPlan;
  let current = state;
  // Feed a bounded queue with remembered, era-appropriate choices. Purchases
  // still pass through the same costs, exclusions, and prerequisite checks.
  for (const choice of plan.choices || plan.goals || []) {
    if (current.goals.length >= 5) break;
    const status = getGoalStatus(current, choice);
    if (status === 'ready') current = queueGoal(current, choice.kind, choice.id);
  }
  for (const order of plan.commissions || []) {
    if (order.kind === 'dyson' && (current.dysonModules?.[order.id] || 0) >= order.targetLevel) continue;
    if (order.kind === 'dyson' && current.commissions.some(c => c.kind === order.kind && c.id === order.id && c.targetLevel >= order.targetLevel)) continue;
    if (canQueueCommission(current, order.kind, order.id)) current = queueCommission(current, order.kind, order.id);
  }
  return current;
}

export function rememberedCommissionPlan(state) {
  const orders = [];
  for (const [id, count] of Object.entries(state.dysonModules || {})) {
    for (let targetLevel = 1; targetLevel <= count; targetLevel++) orders.push({ kind: 'dyson', id, targetLevel });
  }
  for (const id of Object.keys(state.wovenLaws || {})) orders.push({ kind: 'law', id, targetLevel: 1 });
  for (const id of Object.keys(state.lockedSignals || {})) orders.push({ kind: 'signal', id, targetLevel: 1 });
  return [...orders, ...(state.commissions || [])].filter((order, index, all) => all.findIndex(c => c.kind === order.kind && c.id === order.id && c.targetLevel === order.targetLevel) === index);
}
