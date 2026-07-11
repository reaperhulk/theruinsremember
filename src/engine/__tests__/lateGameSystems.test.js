import { describe, expect, it } from 'vitest';
import { detectArchetype, getArchetypeSuggestions } from '../advisor.js';
import { commissionDysonModule, getDysonStats } from '../dyson.js';
import {
  enactSenatePolicy,
  getSenateGovernmentMultiplier,
  getSenatePctBonuses,
  getSenateStats,
  SENATE_ACT_INTERVAL,
  setSenateDirective,
} from '../senate.js';
import {
  COSMIC_BANDS,
  getTuningProductionMultiplier,
  getTuningStats,
  lockCosmicSignal,
  TUNING_LOCK_INTERVAL,
  TUNING_LOCK_LIMIT,
} from '../tuning.js';
import { createInitialState } from '../state.js';

describe('late-game systems', () => {
  it('commissions a Dyson module and reports scaling stats', () => {
    const state = createInitialState();
    state.era = 7;
    state.resources.stellarForge = { ...state.resources.stellarForge, unlocked: true };
    state.resources.megastructures = { ...state.resources.megastructures, unlocked: true };
    const result = commissionDysonModule(state, 'forge');
    expect(result.state.dysonSegments).toBe(10);
    expect(result.reserve).toBeGreaterThan(0);
    expect(result.state.dysonModules.forge).toBe(1);
    expect(getDysonStats({ ...result.state, dysonSegments: 25 }).bonusMult).toBe(1.25);
  });

  it('limits manual Dyson work to three strategic commissions', () => {
    let state = createInitialState();
    state.era = 7;
    for (const id of ['stellarForge', 'megastructures', 'energy']) {
      state.resources[id] = { ...state.resources[id], unlocked: true };
    }
    for (const moduleId of ['frame', 'collector', 'forge']) {
      state = commissionDysonModule(state, moduleId).state;
      state.totalTime += 61;
    }

    expect(state.dysonSegments).toBe(30);
    expect(getDysonStats(state).remainingModules).toBe(0);
    expect(commissionDysonModule(state, 'forge')).toBeNull();
  });

  it('forms a government in three deliberate policy acts', () => {
    let state = createInitialState();
    state.era = 8;
    state.resources.galacticInfluence = {
      ...state.resources.galacticInfluence,
      unlocked: true,
      amount: 500,
    };

    // Acts follow the mandate → coalition → ratify sequence
    expect(enactSenatePolicy(state, 'coalition', 'scholars')).toBeNull();
    state = enactSenatePolicy(state, 'mandate', 'merchants').state;
    expect(state.senateGov.leader).toBe('merchants');

    // Deliberation blocks the next act; the leader cannot also be partner
    expect(enactSenatePolicy(state, 'coalition', 'scholars')).toBeNull();
    state = { ...state, totalTime: state.totalTime + SENATE_ACT_INTERVAL };
    expect(enactSenatePolicy(state, 'coalition', 'merchants')).toBeNull();
    state = enactSenatePolicy(state, 'coalition', 'scholars').state;
    state = { ...state, totalTime: state.totalTime + SENATE_ACT_INTERVAL };
    state = enactSenatePolicy(state, 'ratify').state;
    expect(getSenateStats(state).nextAct).toBeNull();

    // Government bonuses: leader 1.3, partner 1.15, ratify +0.1 each
    expect(getSenateGovernmentMultiplier(state, 'exoticMatter')).toBeCloseTo(1.4);
    expect(getSenateGovernmentMultiplier(state, 'galacticInfluence')).toBeCloseTo(1.25);
    expect(getSenateGovernmentMultiplier(state, 'stellarForge')).toBeCloseTo(1.1);

    const directed = setSenateDirective(state, 'scholars', 70);
    expect(Object.values(directed.senatePct).reduce((sum, value) => sum + value, 0)).toBe(100);
    expect(getSenatePctBonuses(directed).galacticInfluence).toBeCloseTo(1.07);
  });

  it('locks signal bands with calibration gaps and a hard limit', () => {
    let state = createInitialState();
    state.era = 9;

    const first = lockCosmicSignal(state, 'power');
    expect(first.band.id).toBe('power');
    state = first.state;
    expect(getTuningStats(state).lockedCount).toBe(1);

    // Calibration interval blocks an immediate second lock
    expect(getTuningStats(state).cooldown).toBeGreaterThan(0);
    expect(lockCosmicSignal(state, 'constants')).toBeNull();

    // After the interval passes, further locks work up to the limit
    state = { ...state, totalTime: state.totalTime + TUNING_LOCK_INTERVAL };
    state = lockCosmicSignal(state, 'stability').state;
    state = { ...state, totalTime: state.totalTime + TUNING_LOCK_INTERVAL };
    state = lockCosmicSignal(state, 'constants').state;
    expect(getTuningStats(state).lockedCount).toBe(TUNING_LOCK_LIMIT);
    state = { ...state, totalTime: state.totalTime + TUNING_LOCK_INTERVAL };
    expect(lockCosmicSignal(state, 'fragments')).toBeNull();

    // Locked bands apply visible boosts and drags
    expect(Object.keys(COSMIC_BANDS)).toHaveLength(4);
    const powerOnly = { ...createInitialState(), era: 9, lockedSignals: { power: true } };
    expect(getTuningProductionMultiplier(powerOnly, 'cosmicPower')).toBeCloseTo(1.6);
    expect(getTuningProductionMultiplier(powerOnly, 'universalConstants')).toBeCloseTo(0.9);
    expect(getTuningProductionMultiplier(powerOnly, 'realityFragments')).toBe(1);
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
