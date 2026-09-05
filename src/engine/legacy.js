import { hasRelic } from './relics.js';

export const PRODUCTION_ROUTES = {
  standard: { name: 'Standard industry', description: 'Orbital infrastructure uses fuel; colonies use exotic materials.' },
  electrolysis: { name: 'Electric launch network', description: 'Orbital infrastructure uses 5 Energy instead of 0.5 Rocket Fuel per unit. Fuel stays available for purchases.' },
  biospheres: { name: 'Living colonies', description: 'Colonies use 2 Food instead of 0.2 Exotic Materials per unit. Exotic materials stay available for construction.' },
};
export function selectProductionRoute(state, id) {
  if (!PRODUCTION_ROUTES[id] || id !== 'standard' && !state.archive?.research?.logistics) return state;
  return { ...state, productionRoute: id };
}
export const RELIC_SYNERGIES = [
  { id: 'livingWorlds', name: 'Living Worlds', relics: ['emberSeed', 'colonyCharter'], description: 'Colonies feed on Food instead of Exotic Materials, at half the living-colony input cost.' },
  { id: 'closedCircuit', name: 'Closed Circuit', relics: ['openCircuit', 'loomNeedle'], description: 'Supply chains use half their normal input. Preserves fuel and energy for breakthroughs.' },
  { id: 'wayfinder', name: 'Wayfinder', relics: ['surveyorLens', 'pilgrimMap'], description: 'Public works need half their normal supplies. Past exploration becomes a construction blueprint.' },
];
export function hasRelicSynergy(state, id) {
  return !!state.archive?.research?.resonance && !!RELIC_SYNERGIES.find(s => s.id === id)?.relics.every(relic => hasRelic(state, relic));
}
export function getRelicSynergies(state) {
  return RELIC_SYNERGIES.map(s => ({ ...s, active: hasRelicSynergy(state, s.id) }));
}
export function applyRestoredInfrastructure(state, era) {
  const projects = state.archive?.projects || {};
  const landmarks = [];
  const resources = { ...state.resources };
  if (era === 2 && projects.foundryDistrict >= 3) {
    for (const [id, rate] of Object.entries({ steel: 5, electronics: 5, research: 10 })) resources[id] = { ...resources[id], unlocked: true, rateAdd: resources[id].rateAdd + rate };
    landmarks.push('The restored Foundry District powers up: steel, electronics, and research are already flowing.');
  }
  if (era === 4 && projects.orbitalCradle >= 3) {
    for (const [id, rate] of Object.entries({ rocketFuel: 15, orbitalInfra: 5 })) resources[id] = { ...resources[id], unlocked: true, rateAdd: resources[id].rateAdd + rate };
    landmarks.push('The Orbital Cradle recognizes your ships. Restored fuelworks and orbital yards are ready.');
  }
  return landmarks.length ? { ...state, resources, eventLog: [...state.eventLog, ...landmarks.map(message => ({ message, time: state.totalTime, isLore: true }))].slice(-20) } : state;
}
