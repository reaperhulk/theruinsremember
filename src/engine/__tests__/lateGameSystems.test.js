import { describe, expect, it } from 'vitest';
import { detectArchetype, getArchetypeSuggestions } from '../advisor.js';
import { assembleDysonSegment, getDysonStats } from '../dyson.js';
import {
  allocateSenateInfluence,
  getSenateInfo,
  getSenatePctBonuses,
  setSenateDirective,
} from '../senate.js';
import {
  applyTuning,
  getNextTuningTier,
  getTuningProductionBonus,
  getTuningQuality,
} from '../tuning.js';
import { createInitialState } from '../state.js';

describe('late-game systems', () => {
  it('assembles Dyson segments and reports scaling stats', () => {
    const state = createInitialState();
    state.era = 7;
    state.resources.stellarForge = { ...state.resources.stellarForge, unlocked: true };
    state.resources.megastructures = { ...state.resources.megastructures, unlocked: true };
    const result = assembleDysonSegment(state);
    expect(result.state.dysonSegments).toBe(1);
    expect(result.sfGain).toBeGreaterThan(0);
    expect(getDysonStats({ ...result.state, dysonSegments: 25 }).bonusMult).toBe(1.25);
  });

  it('allocates senate influence and keeps directives normalized', () => {
    const state = createInitialState();
    state.era = 8;
    state.resources.galacticInfluence = {
      ...state.resources.galacticInfluence,
      unlocked: true,
      amount: 500,
    };
    const allocated = allocateSenateInfluence(state, 'merchants', 1);
    expect(allocated.senate.merchants).toBe(1);
    expect(getSenateInfo(allocated).majorityFaction).toBe('merchants');

    const directed = setSenateDirective(allocated, 'scholars', 70);
    expect(Object.values(directed.senatePct).reduce((sum, value) => sum + value, 0)).toBe(100);
    expect(getSenatePctBonuses(directed).exoticMatter).toBeCloseTo(1.07);
  });

  it('scores tuning and advances production tiers', () => {
    const state = createInitialState();
    state.era = 9;
    state.resources.cosmicPower = { ...state.resources.cosmicPower, unlocked: true };
    state.resources.universalConstants = { ...state.resources.universalConstants, unlocked: true };
    expect(getTuningQuality(2)).toBe('perfect');
    const result = applyTuning(state, 'perfect');
    expect(result.state.tuningScore).toBe(5);
    expect(getNextTuningTier(result.state.tuningScore).threshold).toBe(10);
    expect(getTuningProductionBonus(100)).toBe(1.5);
  });

  it('detects advisor archetypes and returns available suggestions', () => {
    const state = createInitialState();
    expect(detectArchetype(state)).toBe('engineer');
    state.tech.miningFocus = true;
    expect(detectArchetype(state)).toBe('extractor');
    const suggestions = getArchetypeSuggestions(createInitialState());
    expect(Object.keys(suggestions)).toEqual(['extractor', 'engineer', 'explorer']);
  });
});
