import { describe, expect, it } from 'vitest';
import {
  getWeaveCost,
  getWeaveProductionMultiplier,
  getWeavingStats,
  weaveRealityLaw,
} from '../weaving.js';
import { createInitialState } from '../state.js';

describe('weaving', () => {
  function makeEra8State() {
    const state = createInitialState();
    state.era = 8;
    state.totalTime = 200;
    state.resources.realityFragments = {
      ...state.resources.realityFragments,
      amount: 200,
      unlocked: true,
    };
    return state;
  }

  it('establishes a permanent law for the current cycle', () => {
    const state = makeEra8State();
    const result = weaveRealityLaw(state, 'temporal');

    expect(result.state.wovenLaws).toEqual({ temporal: true });
    expect(result.state.totalWeaves).toBe(1);
    expect(result.state.resources.realityFragments.amount).toBe(180);
    expect(getWeaveProductionMultiplier(result.state, 'cosmicPower')).toBe(1.5);
  });

  it('increases cost with each established law', () => {
    const state = makeEra8State();
    expect(getWeaveCost(state)).toBe(20);
    state.wovenLaws = { temporal: true, spatial: true };
    expect(getWeaveCost(state)).toBe(60);
    state.prestigeUpgrades = { masterWeaver: true };
    expect(getWeaveCost(state)).toBe(30);
  });

  it('requires stabilization time between laws', () => {
    let state = weaveRealityLaw(makeEra8State(), 'temporal').state;
    expect(weaveRealityLaw(state, 'spatial')).toBeNull();
    state.totalTime += 45;
    expect(weaveRealityLaw(state, 'spatial')).not.toBeNull();
  });

  it('allows three distinct laws and rejects further weaving', () => {
    let state = makeEra8State();
    for (const lawId of ['temporal', 'spatial', 'causal']) {
      state = weaveRealityLaw(state, lawId).state;
      state.totalTime += 45;
    }

    expect(getWeavingStats(state).wovenCount).toBe(3);
    expect(getWeavingStats(state).remaining).toBe(0);
    expect(weaveRealityLaw(state, 'quantum')).toBeNull();
    expect(weaveRealityLaw(state, 'temporal')).toBeNull();
  });

  it('rejects weaving before era 8 or without enough fragments', () => {
    const early = createInitialState();
    expect(weaveRealityLaw(early, 'temporal')).toBeNull();

    const poor = makeEra8State();
    poor.resources.realityFragments.amount = 19;
    expect(weaveRealityLaw(poor, 'temporal')).toBeNull();
  });

  it('scales law strength with operations bonuses and the Loom Needle', () => {
    const state = makeEra8State();
    state.wovenLaws = { quantum: true };
    state.activeRelics = ['loomNeedle'];
    state.cycleDoctrine = 'expansion';
    expect(getWeaveProductionMultiplier(state, 'realityFragments')).toBeGreaterThan(1.6);
    expect(getWeaveProductionMultiplier(state, 'food')).toBe(1);
  });
});
