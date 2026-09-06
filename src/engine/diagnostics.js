import { chosenDecisions } from '../data/decisions.js';
export function civilizationRecord(state) {
  const discoveries = Object.values(state.archive?.discoveries || {});
  return { version: 1, civilization: state.prestigeCount + 1, era: state.era, elapsedSeconds: state.totalTime,
    choices: chosenDecisions(state).map(({ id, era, landmark, consequence }) => ({ id, era, landmark, consequence })),
    discoveries: { found: discoveries.length, acknowledged: discoveries.filter(d => d.read).length },
    rememberedChoices: state.archive?.lastChoices || [], completedPublicWorks: Object.keys(state.completedPublicWorks || {}),
    cycles: state.archive?.entries || [], chapterTransitions: state.eraReviewMode };
}
