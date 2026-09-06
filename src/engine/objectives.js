import { CHAPTERS } from '../data/chapters.js';
import { techTree } from '../data/tech-tree.js';
import { upgrades } from '../data/upgrades.js';
import { getEraReadiness, checkEraTransition } from './eras.js';
import { getCycleReadiness } from './realityForge.js';
import { getUpgradeCost, isDecisionUpgrade } from './upgrades.js';
import { getAvailableTech, isDecisionTech } from './tech.js';
import { getActiveGoal } from './goals.js';
import { canAfford } from './resources.js';
import { projects } from '../data/projects.js';
import { getAvailableProjects, getProjectCost } from './projects.js';

const asTarget = (state, def, kind) => def && ({ kind, id: def.id, name: def.name,
  cost: kind === 'project' ? getProjectCost(state, def.id) : kind === 'tech' ? def.cost : getUpgradeCost(state, def.id), automated: kind === 'project' || (kind === 'tech' ? !isDecisionTech(def) : !isDecisionUpgrade(def)) });

// A cheap breakthrough is not the next step while its foundation is missing.
export function getEraObjective(state) {
  const chapter = CHAPTERS[state.era];
  const readiness = getEraReadiness(state);
  const availableTech = getAvailableTech(state).filter(t => state.autoBuildOut === false || !isDecisionTech(t));
  const availableUpgrades = getAvailableProjects(state);
  const rank = (a, b) => Number(canAfford(state, getProjectCost(state, b.id))) - Number(canAfford(state, getProjectCost(state, a.id)))
    || Number(b.era === state.era) - Number(a.era === state.era) || a.stage - b.stage;
  const localUpgrades = availableUpgrades.filter(u => u.era === state.era).sort(rank);
  const localTech = availableTech.filter(t => t.era === state.era);
  let stage, title, detail, target, destination = 'upgrades';
  const cycle = state.era === 10 ? getCycleReadiness(state) : null;
  if (cycle) {
    if (cycle.ready) { stage = 'ready'; title = 'Your inheritance is ready'; detail = 'Review what survives and begin the next civilization.'; destination = 'prestige'; }
    else if (!state.nextCycleDoctrine) { stage = 'doctrine'; title = 'Choose the next civilization’s purpose'; detail = chapter.operation; destination = 'mini'; }
    else { stage = 'cycle'; title = 'Complete the inheritance'; detail = `${cycle.completed}/${cycle.total} forge conditions met. The Continuity Engine is an alternative route.`; destination = 'mini'; target = asTarget(state, localUpgrades[0], 'project'); }
  } else if (checkEraTransition(state)) {
    stage = 'ready'; title = 'The next age is ready'; detail = chapter.consequence;
  } else if (!readiness.upgradesMet) {
    stage = 'foundation'; title = state.era === 1 ? 'Restore a working settlement' : 'Establish this age’s economy';
    const minimum = Math.max(0, readiness.minimumEconomicUpgrades - readiness.currentUpgrades);
    detail = minimum ? 'Complete the next construction project to strengthen this age’s foundation. Workshops build as resources arrive.'
      : `${Math.max(0, readiness.minUpgrades - readiness.foundationProgress)} foundation progress remaining. ${chapter.operation}.`;
    target = asTarget(state, localUpgrades[0] || availableUpgrades.sort(rank)[0], 'project');
  } else if (!readiness.mastery.met) {
    stage = 'mastery'; title = readiness.mastery.title; detail = chapter.operation; destination = 'mini';
    target = asTarget(state, localUpgrades[0], 'project');
  } else if (!readiness.techsMet) {
    stage = 'research'; title = 'Complete this age’s research'; detail = `${readiness.currentTechs}/${readiness.minTechs} local technologies researched. ${chapter.consequence}`;
    target = asTarget(state, localTech.find(t => canAfford(state, t.cost)) || localTech[0], 'tech'); destination = 'tech';
  } else {
    stage = 'breakthrough'; title = 'Prepare the breakthrough'; detail = chapter.consequence; destination = 'tech';
    const gate = Object.values(techTree).find(t => t.grantsEra === state.era + 1);
    const path = new Set();
    const visit = id => { if (path.has(id) || state.tech[id]) return; path.add(id); techTree[id]?.prerequisites.forEach(visit); };
    if (gate) visit(gate.id);
    target = asTarget(state, availableTech.find(t => path.has(t.id)) || localTech[0], 'tech');
  }
  const goal = getActiveGoal(state);
  if (goal) target = { ...asTarget(state, (goal.kind === 'project' ? projects : goal.kind === 'tech' ? techTree : upgrades)[goal.id], goal.kind), queued: true };
  const resources = [...new Set([...Object.keys(target?.cost || {}), ...chapter.resources])].filter(id => state.resources[id]?.unlocked);
  return { chapter, readiness, cycle, stage, title, detail, target, destination, resources,
    foundation: Math.min(1, readiness.foundationProgress / readiness.minUpgrades),
    research: readiness.minTechs ? Math.min(1, readiness.currentTechs / readiness.minTechs) : 1 };
}
