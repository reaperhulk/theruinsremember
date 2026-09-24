// The era scenes were drawn for the original resource economy. They read a
// handful of fields to decide how built-up the world looks; this adapter
// derives those fields from how many of the era's buildings you own.
import { BUILDINGS } from '../game/data.js';

const RATE_IDS = ['steel', 'software', 'data', 'rocketFuel', 'stellarForge', 'food', 'materials', 'energy'];

export function sceneState(state) {
  const eraOwned = BUILDINGS.filter(b => b.era === state.era).reduce((sum, b) => sum + (state.buildings[b.id] || 0), 0);
  const growth = Math.min(1, eraOwned / 60);
  const rate = growth * 12;
  const resources = Object.fromEntries(RATE_IDS.map(id => [id, { unlocked: true, amount: 0, baseRate: rate / RATE_IDS.length * 3, rateAdd: 0, rateMult: 1 }]));
  resources.colonies = { amount: growth * 120 };
  resources.galacticInfluence = { amount: growth * 750 };
  resources.cosmicPower = { amount: growth * 600 };
  resources.realityFragments = { amount: growth * 350 };
  return {
    era: state.era,
    upgrades: Object.fromEntries(Array.from({ length: Math.round(growth * 60) }, (_, i) => [`built${i}`, true])),
    resources,
    dysonSegments: Math.round(growth * 100),
    starRoutes: Array.from({ length: Math.round(growth * 8) }),
    senateGov: {},
  };
}
