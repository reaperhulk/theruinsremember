import { buyRoutineBuildOut } from './upgrades.js';
import { researchRoutineTech } from './tech.js';

export const DEVELOPMENT_FOCI = {
  growth: { name: 'Build the economy', description: 'Workshops spend first. More production now; research waits for the remaining funds.' },
  research: { name: 'Prioritize research', description: 'Labs spend first. Reach new technologies sooner; construction competes for what remains.' },
};

export function setDevelopmentFocus(state, focus) {
  return DEVELOPMENT_FOCI[focus] && focus !== state.developmentFocus ? { ...state, developmentFocus: focus } : state;
}

export function advanceDevelopment(state) {
  if (state.autoBuildOut === false) return state;
  const stages = state.developmentFocus === 'research'
    ? [researchRoutineTech, buyRoutineBuildOut] : [buyRoutineBuildOut, researchRoutineTech];
  return stages.reduce((current, advance) => advance(current).state, state);
}
