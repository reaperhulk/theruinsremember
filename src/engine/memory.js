import { CHAPTERS } from '../data/chapters.js';
import { DECISIONS, chosenDecisions } from '../data/decisions.js';

export function rememberDiscovery(state, id, title, text, requires = null) {
  const discoveries = state.archive?.discoveries || {};
  if (discoveries[id] || requires && !discoveries[requires]) return state;
  return { ...state, archive: { ...state.archive, discoveries: { ...discoveries, [id]: { title, text, era: state.era, cycle: state.prestigeCount + 1, read: false, requires } } } };
}
export function recordDecision(state, id) {
  const d = DECISIONS[id];
  return d ? rememberDiscovery(recordChapter(state), `choice:${state.prestigeCount}:${id}`, d.landmark, `${d.memory} ${d.consequence}`, `chapter:${state.prestigeCount}:${state.era}`) : state;
}
export function recordChapter(state) {
  const c = CHAPTERS[state.era];
  const previous = (state.archive?.lastChoices || []).find(id => DECISIONS[id]?.era === state.era);
  const cycle = state.prestigeCount || 0;
  const text = cycle === 0 ? c.discovery : previous ? `You recognize ${DECISIONS[previous].landmark.toLowerCase()}. ${DECISIONS[previous].memory} ${cycle >= 2 ? 'This time, choose what the next civilization will inherit.' : 'Will you make the same choice again?'}` : `${c.discovery} ${cycle >= 2 ? 'You can now leave a deliberate inheritance.' : 'A previous civilization reached this place: yours.'}`;
  return rememberDiscovery(state, `chapter:${cycle}:${state.era}`, c.title, text);
}
export function markDiscoveryRead(state, id) {
  const d = state.archive?.discoveries?.[id];
  return !d || d.read ? state : { ...state, archive: { ...state.archive, discoveries: { ...state.archive.discoveries, [id]: { ...d, read: true } } } };
}
export function inheritancePreview(state) {
  const choices = chosenDecisions(state);
  return { choices, shards: 6 + choices.reduce((n, d) => n + (d.shards || 0), 0), stores: state.upgrades?.forkRefinement ? 0.5 : 0.25,
    relic: state.upgrades?.forkCommunion ? state.activeRelics?.[0] : null,
    question: (state.prestigeCount || 0) === 0 ? 'Who left these ruins? Your next civilization will recognize your choices.' : 'What should survive? Change a branch, or restore a landmark across civilizations.' };
}
export function getNarrativeEnding(state) {
  if (state.trueEnding) return { title: 'The chosen return', text: 'You acquired Eternal Return. Repetition is now a choice: you can continue tending this civilization or begin another with what you preserved.', signal: 'You know how to return. You decide why.' };
  if (state.forgetting?.sealed >= 3 && !state.forgetting?.collapsed) return { title: 'The defended memory', text: 'You completed this civilization after confronting the Forgetting. Its scars remain alongside the structures you chose to protect.', signal: 'Some memories survived because you defended them.' };
  if (Object.values(state.archive?.projects || {}).some(n => n >= 2)) return { title: 'The world that remains', text: 'You completed a civilization and restored a landmark across cycles. A future beginning will inherit more than a warning.', signal: 'Reconstruction has made the next beginning different.' };
  return { title: 'The recognized ruins', text: 'You reached the final iteration. The ruins belong to civilizations you have already lived; your choices determine what follows.', signal: 'The record is yours. Its next chapter remains open.' };
}
