import { RELICS } from '../data/relics.js';
import { getEffectiveCap } from './resources.js';
import { claimRelic } from './relics.js';

export const DOCTRINE_RESEARCH = {
  reconstruction: { name: 'Remembered Foundations', description: 'The first ten purchases of each run cost 50% less.', cost: 5 },
  expansion: { name: 'Distributed Stores', description: 'Double storage for every resource.', cost: 5 },
  transcendence: { name: 'Echo Cartography', description: 'Relic signals build twice as quickly.', cost: 5 },
};
export const RECONSTRUCTION_PROJECTS = {
  seedVault: { name: 'Seed Vault', era: 3, resource: 'research', description: 'Future cycles start with basic stores 25% full.' },
  relayNetwork: { name: 'Relay Network', era: 6, resource: 'starSystems', description: 'Commission queues resolve twice as quickly.' },
  echoObservatory: { name: 'Echo Observatory', era: 9, resource: 'cosmicPower', description: 'Equip a third relic in every future cycle.' },
};
export function createArchive() {
  return { entries: [], lore: [], shards: 0, research: {}, projects: {}, contributions: {}, savedPlan: null };
}
export function rememberCycle(state) {
  const previous = { ...createArchive(), ...state.archive };
  const cycle = (state.prestigeCount || 0) + 1;
  const entries = [...previous.entries, { cycle, era: state.era, seconds: state.totalTime, doctrine: state.cycleDoctrine, upgrades: Object.keys(state.upgrades).length, depth: state.recursionDepth || 0 }];
  const lore = [...new Set([...previous.lore, ...(state.eventLog || []).filter(e => e.isLore).map(e => e.message)])];
  return { ...previous, entries, lore, shards: previous.shards + 6 };
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
  if (state.prestigeCount < 2 || !def || archive.research[id] || archive.shards < def.cost) return state;
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
  if (state.prestigeCount < 3 || !project || state.era < project.era || archive.projects[id] >= 2 || archive.contributions[id] === state.prestigeCount) return state;
  const resource = state.resources[project.resource];
  const cost = getEffectiveCap(state, project.resource) * 0.25;
  if (!resource?.unlocked || resource.amount < cost) return state;
  return { ...state, resources: { ...state.resources, [project.resource]: { ...resource, amount: resource.amount - cost } },
    archive: { ...archive, projects: { ...archive.projects, [id]: (archive.projects[id] || 0) + 1 }, contributions: { ...archive.contributions, [id]: state.prestigeCount } } };
}
export function saveAutomationPlan(state) {
  if (state.prestigeCount < 1) return state;
  return { ...state, archive: { ...state.archive, savedPlan: { goals: state.goals || [], commissions: state.commissions || [], consumerControls: state.consumerControls || {}, autoBuildOut: state.autoBuildOut !== false } } };
}
export function restoreAutomationPlan(state) {
  const plan = state.archive?.savedPlan;
  if (!plan || state.prestigeCount < 1) return state;
  return { ...state, ...plan };
}
