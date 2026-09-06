import { DECISIONS, chosenDecisions } from '../data/decisions.js';
import { CHAPTERS } from '../data/chapters.js';
import { getEraReadiness } from './eras.js';
export function getWorldLandmarks(state) {
  const chosen = chosenDecisions(state);
  return Array.from({ length: 10 }, (_, i) => {
    const era = i + 1;
    const current = chosen.find(d => d.era === era);
    const priorId = state.archive?.lastChoices?.find(id => DECISIONS[id]?.era === era);
    const prior = priorId && { id: priorId, ...DECISIONS[priorId] };
    return { era, chapter: CHAPTERS[era], choice: current || prior, status: current ? 'Built this civilization' : prior ? 'Remembered from the last civilization' : era <= state.era ? 'Still undecided' : 'Not yet discovered', current: !!current };
  });
}
export function getWorldStatus(state, economy) {
  const readiness = getEraReadiness(state);
  return { readiness, landmarks: getWorldLandmarks(state), blocked: Object.entries(economy.constrained).filter(([, reason]) => reason === 'input' || reason === 'paused'),
    construction: Math.min(1, readiness.foundationProgress / readiness.minUpgrades) };
}
