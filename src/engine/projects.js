import { projects, componentProject } from '../data/projects.js';
import { upgrades } from '../data/upgrades.js';
import { LORE_UPGRADE_IDS } from '../data/lore.js';
import { applyUpgradeEffects, getUpgradeCost } from './upgrades.js';
import { canAfford, spend } from './resources.js';
import { calculateEconomy } from './economy.js';
import { preservesGoalReserve } from './goals.js';
import { recordHistory } from './archive.js';
import { recordBuildChoice } from './blueprints.js';

const lore = new Set(LORE_UPGRADE_IDS);
export function isProjectComplete(state, id) {
  return !!projects[id] && projects[id].members.every(member => !!state.upgrades[member]);
}
export function getProjectStatus(state, id) {
  const project = projects[id];
  if (!project) return 'obsolete';
  if (isProjectComplete(state, id)) return 'complete';
  const missing = project.prerequisites.filter(p => !state.upgrades[p]);
  if (project.era > state.era || missing.length > (state.prestigeUpgrades?.quantumTunneling ? 1 : 0) ||
      (project.requireGems || 0) > (state.totalGems || 0) ||
      (project.requireTrades || 0) > (state.totalTrades || 0) ||
      (project.requirePrestige || 0) > (state.prestigeCount || 0)) return 'waiting';
  return 'ready';
}
export function getProjectCost(state, id) {
  const project = projects[id];
  if (!project) return null;
  const cost = {};
  for (const member of project.members.filter(member => !state.upgrades[member])) {
    // Shared foundations halve the cost of supporting works. Paying every
    // former job at full price up front would delay the production that used
    // to arrive gradually, turning consolidation into a longer idle wall.
    // The opening digital network reuses industrial electronics and labs;
    // its former standalone price otherwise creates a research bootstrap wall.
    const scale = project.id === 'internet' ? 0.4 : member === project.id ? 1 : 0.5;
    for (const [resource, amount] of Object.entries(getUpgradeCost(state, member))) cost[resource] = (cost[resource] || 0) + amount * scale;
  }
  return Object.fromEntries(Object.entries(cost).map(([id, amount]) => [id, Math.ceil(amount)]));
}
export function getAvailableProjects(state) {
  return Object.values(projects).filter(project => getProjectStatus(state, project.id) === 'ready');
}
export function getProjectForComponent(id) { return componentProject[id]; }
export function countEraProjects(state, era) {
  return Object.values(projects).filter(project => project.era === era && !project.optional && isProjectComplete(state, project.id)).length;
}
export function previewProject(state, id) {
  const project = projects[id];
  if (!project) return null;
  const preview = applyUpgradeEffects(state, project.members.filter(member => !state.upgrades[member]).flatMap(member => upgrades[member].effects));
  return calculateEconomy({ ...preview, upgrades: { ...state.upgrades, ...Object.fromEntries(project.members.map(member => [member, true])) } });
}
export function purchaseProject(state, id) {
  const project = projects[id];
  if (getProjectStatus(state, id) !== 'ready') return null;
  const cost = getProjectCost(state, id);
  if (!canAfford(state, cost)) return null;
  const remaining = project.members.filter(member => !state.upgrades[member]);
  const updated = applyUpgradeEffects(spend(state, cost), remaining.flatMap(member => upgrades[member].effects));
  let next = { ...updated, upgrades: { ...state.upgrades, ...Object.fromEntries(remaining.map(member => [member, true])) },
    runUpgradePurchases: (state.runUpgradePurchases || 0) + 1,
    lastUpgradeTime: state.totalTime,
    lastProject: { id, completedAt: state.totalTime },
    eventLog: [...state.eventLog, { time: state.totalTime, message: `Completed ${project.name}. The settlement has a new capability.` }].slice(-20) };
  next = recordHistory(next, remaining.filter(member => lore.has(member)).map(member => ({ isLore: true, message: `${upgrades[member].name}: ${upgrades[member].description}` })));
  if (state.goals?.some(goal => goal.kind === 'project' && goal.id === id)) next = recordBuildChoice(next, 'project', id);
  return next;
}
export function buildProjects(state) {
  let current = state;
  for (let pass = 0; pass < 6; pass++) {
    let built = false;
    for (const project of getAvailableProjects(current)) {
      if (!preservesGoalReserve(current, getProjectCost(current, project.id))) continue;
      const next = purchaseProject(current, project.id);
      if (next) { current = next; built = true; }
    }
    if (!built) break;
  }
  return { state: current };
}
