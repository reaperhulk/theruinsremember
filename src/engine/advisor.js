// Build planner / playstyle advisor
// Reads current tech choices and suggests the next 2-3 unlocks per archetype.
// Archetypes: Extractor (mining/resources), Engineer (factory/efficiency), Explorer (mini-game/events)

import { techTree } from '../data/tech-tree.js';
import { getAvailableTech } from './tech.js';

// Archetype definitions — sets of tech IDs that signal each playstyle
const ARCHETYPE_SIGNALS = {
  extractor: new Set(['miningFocus', 'spaceMining', 'deepDrilling', 'asteroidMining', 'voidMining', 'darkMatterExtraction', 'quantumExcavation', 'precisionEngineering', 'advancedIrrigation']),
  engineer: new Set(['agrarianFocus', 'advancedComputing', 'globalNetwork', 'offensiveAI', 'defensiveAI', 'automatedFactories', 'matrioshkaBrain', 'stellarControl', 'distributedAI', 'precisionEngineering']),
  explorer: new Set(['stellarHarmony', 'xenoarchaeology', 'tradeRoutes', 'dysonConstruction', 'realityScience', 'warpTheory', 'cosmicCartography', 'spaceWeaving', 'quantumMapping']),
};

// Archetype-preferred next techs (in priority order)
const ARCHETYPE_PRIORITIES = {
  extractor: ['miningFocus', 'deepDrilling', 'spaceMining', 'asteroidMining', 'voidMining', 'darkMatterExtraction', 'quantumExcavation', 'advancedIrrigation'],
  engineer: ['agrarianFocus', 'advancedComputing', 'globalNetwork', 'automatedFactories', 'matrioshkaBrain', 'stellarControl', 'distributedAI', 'precisionEngineering'],
  explorer: ['stellarHarmony', 'xenoarchaeology', 'dysonConstruction', 'realityScience', 'tradeRoutes', 'spaceWeaving', 'quantumMapping', 'cosmicCartography'],
};

// Detect current archetype based on unlocked techs
export function detectArchetype(state) {
  const unlockedIds = Object.keys(state.tech || {});
  const scores = { extractor: 0, engineer: 0, explorer: 0 };
  for (const id of unlockedIds) {
    for (const [arch, signals] of Object.entries(ARCHETYPE_SIGNALS)) {
      if (signals.has(id)) scores[arch]++;
    }
  }
  // Return the archetype with the highest score (default: engineer)
  const best = Object.entries(scores).reduce((a, b) => b[1] > a[1] ? b : a);
  return best[1] > 0 ? best[0] : 'engineer';
}

// Get next suggested techs for each archetype from currently available (not locked)
export function getArchetypeSuggestions(state) {
  const available = getAvailableTech(state);
  const availableIds = new Set(available.map(t => t.id));
  const result = {};

  for (const [arch, priorities] of Object.entries(ARCHETYPE_PRIORITIES)) {
    // Pick first 2-3 priority techs that are available
    const suggestions = priorities
      .filter(id => availableIds.has(id))
      .slice(0, 3)
      .map(id => techTree[id])
      .filter(Boolean);

    // If not enough from priority list, fill with any available tech relevant to the archetype
    if (suggestions.length < 2) {
      const extras = available
        .filter(t => ARCHETYPE_SIGNALS[arch].has(t.id) && !suggestions.find(s => s.id === t.id))
        .slice(0, 3 - suggestions.length);
      suggestions.push(...extras);
    }

    result[arch] = suggestions;
  }
  return result;
}

export const ARCHETYPE_LABELS = {
  extractor: { name: 'Extractor', desc: 'Mining, resources, raw output', color: '#cc8844' },
  engineer: { name: 'Engineer', desc: 'Factory, efficiency, scaling', color: '#4488cc' },
  explorer: { name: 'Explorer', desc: 'Mini-games, events, discovery', color: '#44cc88' },
};
