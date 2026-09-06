import { inheritancePreview } from './memory.js';
import { RELICS } from '../data/relics.js';
import { getEffectiveCap } from './resources.js';
import { claimRelic } from './relics.js';
import { rememberedCommissionPlan } from './blueprints.js';
import { validateAutomationPlan } from './saves.js';
import { PRODUCTION_ROUTES } from './legacy.js';
import { getPublicWorks } from './publicWorks.js';

export const DOCTRINE_RESEARCH = {
  reconstruction: { name: 'Remembered Foundations', description: 'The first ten purchases of each run cost 50% less.', cost: 5 },
  expansion: { name: 'Distributed Stores', description: 'Double storage for every resource.', cost: 5 },
  transcendence: { name: 'Echo Cartography', description: 'Relic signals build twice as quickly.', cost: 5 },
  logistics: { name: 'Alternative Supply Chains', unlockAt: 4, cost: 8, description: 'Unlock reversible electric launch networks and living colonies. Choose which inputs feed your industries.' },
  resonance: { name: 'Relic Resonance', unlockAt: 6, cost: 10, description: 'Unlock three relic combinations that change supply chains and public works.' },
  blueprints: { name: 'Remembered Industry', unlockAt: 7, cost: 12, description: 'With blueprint replay enabled, routine build-out in mastered Eras 1–3 runs every second. Your saved choices still pay their normal prices.' },
  salvage: { name: 'Overflow Reclamation', unlockAt: 9, cost: 14, description: 'Surplus research and cosmic output can finish public works even when storage is full. Construction can use all new production that would overflow.' },
  conservation: { name: 'Relic Conservation', unlockAt: 11, cost: 16, description: 'Preserve the first relic in your saved loadout at the start of every future civilization.' },
  continuity: { name: 'Continuity Atlas', unlockAt: 13, cost: 18, description: 'Completed public works are mapped permanently. Mapped projects require half as many supplies in later civilizations.' },
};
export const RECONSTRUCTION_PROJECTS = {
  seedVault: { name: 'Seed Vault', era: 3, resource: 'research', description: 'Future cycles start with basic stores 25% full.' },
  relayNetwork: { name: 'Relay Network', era: 6, resource: 'starSystems', description: 'Commission queues resolve twice as quickly.' },
  echoObservatory: { name: 'Echo Observatory', era: 9, resource: 'cosmicPower', description: 'Equip a third relic in every future cycle.' },
  foundryDistrict: { name: 'Foundry District', unlockAt: 6, stages: 3, era: 2, resource: 'steel', description: 'A permanent industrial landmark. Entering Era 2 starts restored steel, electronics, and research production.' },
  orbitalCradle: { name: 'Orbital Cradle', unlockAt: 8, stages: 3, era: 4, resource: 'orbitalInfra', description: 'A permanent orbital landmark. Entering Era 4 starts restored fuelworks and construction yards.' },
  memoryLibrary: { name: 'Memory Library', unlockAt: 10, stages: 4, era: 3, resource: 'data', description: 'Relic Conservation carries two saved relics into future civilizations instead of one.' },
  continuityGarden: { name: 'Continuity Garden', unlockAt: 12, stages: 4, era: 10, resource: 'quantumEchoes', description: 'Reclaim overflow for public works. Each reclaimed unit supplies two units of construction; the normal 20% allocation continues.' },
};
export function createArchive() {
  return { entries: [], lore: [], shards: 0, research: {}, projects: {}, contributions: {}, savedPlan: null, mappedWorks: {}, lastBuild: [], lastCommissions: [], discoveries: {}, lastChoices: [] };
}
export function rememberCycle(state) {
  const previous = { ...createArchive(), ...state.archive };
  const cycle = (state.prestigeCount || 0) + 1;
  const entries = [...previous.entries, { cycle, era: state.era, seconds: state.totalTime, doctrine: state.cycleDoctrine, upgrades: Object.keys(state.upgrades).length, depth: state.recursionDepth || 0 }];
  const lore = [...new Set([...previous.lore, ...(state.eventLog || []).filter(e => e.isLore).map(e => e.message)])];
  const mappedWorks = { ...previous.mappedWorks };
  for (const era of Object.keys(state.publicWorks || {})) if (getPublicWorks(state, Number(era))?.complete) mappedWorks[era] = true;
  return { ...previous, entries, lore, shards: previous.shards + inheritancePreview(state).shards, lastChoices: inheritancePreview(state).choices.map(d => d.id), mappedWorks,
    lastBuild: state.buildHistory || [], lastCommissions: rememberedCommissionPlan(state) };
}
export function recordHistory(state, entries) {
  const lore = entries.filter(e => e.isLore || e.message?.startsWith('ERA ')).map(e => e.message);
  if (!lore.length) return state;
  const previous = state.archive || createArchive();
  const merged = [...new Set([...previous.lore, ...lore])];
  return merged.length === previous.lore.length ? state : { ...state, archive: { ...previous, lore: merged } };
}
export function researchDoctrine(state, id) {
  const def = DOCTRINE_RESEARCH[id];
  const archive = state.archive || createArchive();
  if (!def || state.prestigeCount < (def.unlockAt || 2) || archive.research[id] || archive.shards < def.cost) return state;
  return { ...state, archive: { ...archive, shards: archive.shards - def.cost, research: { ...archive.research, [id]: true } } };
}
export function craftRelic(state, id, replaceId = null) {
  const archive = state.archive || createArchive();
  if (state.prestigeCount < 2 || !RELICS[id] || archive.shards < 3 || state.activeRelics.includes(id)) return state;
  const candidate = { ...state, relicOffer: [id] };
  const equipped = claimRelic(candidate, id, replaceId);
  if (equipped === candidate) return state;
  return { ...equipped, relicOffer: state.relicOffer, echoPressure: state.echoPressure,
    archive: { ...archive, shards: archive.shards - 3, relicsCrafted: (archive.relicsCrafted || 0) + 1 } };
}
export function contributeProject(state, id) {
  const project = RECONSTRUCTION_PROJECTS[id];
  const archive = state.archive || createArchive();
  if (!project || state.prestigeCount < (project.unlockAt || 3) || state.era < project.era || archive.projects[id] >= (project.stages || 2) || archive.contributions[id] === state.prestigeCount) return state;
  const resource = state.resources[project.resource];
  const cost = getEffectiveCap(state, project.resource) * 0.25;
  if (!resource?.unlocked || resource.amount < cost) return state;
  return { ...state, resources: { ...state.resources, [project.resource]: { ...resource, amount: resource.amount - cost } },
    archive: { ...archive, projects: { ...archive.projects, [id]: (archive.projects[id] || 0) + 1 }, contributions: { ...archive.contributions, [id]: state.prestigeCount } } };
}
export function saveAutomationPlan(state) {
  if (state.prestigeCount < 1) return state;
  const choices = [...(state.buildHistory?.length ? state.buildHistory : state.archive.lastBuild || []), ...(state.goals || [])]
    .filter((c, i, all) => all.findIndex(other => other.kind === c.kind && other.id === c.id) === i);
  const commissions = rememberedCommissionPlan(state);
  return { ...state, archive: { ...state.archive, savedPlan: {
    version: 2, choices, goals: state.goals || [], commissions: commissions.length ? commissions : state.archive.lastCommissions || [],
    consumerControls: structuredClone(state.consumerControls || {}), autoBuildOut: state.autoBuildOut !== false,
    protectProgression: state.protectProgression !== false, productionRoute: state.productionRoute || 'standard',
    repeat: state.archive.savedPlan?.repeat || false, loadout: [...state.activeRelics],
  } } };
}
export function restoreAutomationPlan(state) {
  const plan = state.archive?.savedPlan;
  if (!plan || state.prestigeCount < 1) return state;
  try { validateAutomationPlan(plan); } catch { return state; }
  return { ...state, blueprintActive: true, goalsPaused: false, goals: [], commissions: [],
    consumerControls: structuredClone(plan.consumerControls || {}), autoBuildOut: plan.autoBuildOut !== false,
    protectProgression: plan.protectProgression !== false,
    productionRoute: state.archive.research.logistics && PRODUCTION_ROUTES[plan.productionRoute] ? plan.productionRoute : 'standard' };
}
export function togglePlanRepeat(state) {
  const plan = state.archive?.savedPlan;
  return plan ? { ...state, archive: { ...state.archive, savedPlan: { ...plan, repeat: !plan.repeat } } } : state;
}
