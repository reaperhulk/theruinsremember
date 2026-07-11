import { describe, expect, it } from 'vitest';
import { createInitialState } from '../state.js';
import { forgeRealityKey, getCycleReadiness, getRealityForgeRecipes } from '../realityForge.js';
import { upgrades } from '../../data/upgrades.js';

function makeForgeState() {
  const state = createInitialState();
  state.era = 10;
  state.resources.realityFragments = { ...state.resources.realityFragments, unlocked: true, amount: 500 };
  state.resources.quantumEchoes = { ...state.resources.quantumEchoes, unlocked: true, amount: 500 };
  return state;
}

describe('reality forge', () => {
  it('locks earned key recipes until their system milestones are met', () => {
    const state = makeForgeState();
    const recipes = getRealityForgeRecipes(state);
    expect(recipes.find(recipe => recipe.id === 'temporal').isUnlocked).toBe(false);
    expect(recipes.find(recipe => recipe.id === 'quantum').isUnlocked).toBe(true);
  });

  it('forges an unlocked key and consumes its resources', () => {
    const state = makeForgeState();
    state.lockedSignals = { stability: true };
    const after = forgeRealityKey(state, 'temporal');

    expect(after.realityKeys.temporal).toBe(1);
    expect(after.resources.realityFragments.amount).toBe(450);
    expect(after.resources.quantumEchoes.amount).toBe(480);
  });

  it('requires Era 10 depth and a varied key set to close the cycle', () => {
    const state = makeForgeState();
    const era10 = Object.values(upgrades).filter(upgrade => upgrade.era === 10);
    for (const upgrade of era10.slice(0, 20)) state.upgrades[upgrade.id] = true;
    state.realityKeys = { temporal: 1, spatial: 1, quantum: 2 };
    state.nextCycleDoctrine = 'reconstruction';

    expect(getCycleReadiness(state).ready).toBe(true);
    state.realityKeys = { quantum: 4 };
    expect(getCycleReadiness(state).ready).toBe(false);
  });

  it('allows a passive cycle to close after one hour in Era 10', () => {
    const state = makeForgeState();
    state.eraStartTime = 100;
    state.totalTime = 3700;
    state.nextCycleDoctrine = 'reconstruction';

    const readiness = getCycleReadiness(state);
    expect(readiness.directlyReady).toBe(false);
    expect(readiness.fallbackReady).toBe(true);
    expect(readiness.ready).toBe(true);
  });
});
