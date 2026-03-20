import { describe, it, expect } from 'vitest';
import { generateChallenge, startHack, submitHack, getHackBonus } from '../hacking.js';
import { createInitialState } from '../state.js';

describe('hacking', () => {
  function makeEra3State() {
    const state = createInitialState();
    state.era = 3;
    state.totalTime = 100;
    state.activeEffects = [];
    return state;
  }

  it('generates challenge with correct length', () => {
    const challenge = generateChallenge(0, [0.1, 0.3, 0.5, 0.7]);
    expect(challenge.sequence).toHaveLength(4);
    expect(challenge.multiplier).toBe(2);
  });

  it('increases length with difficulty', () => {
    const challenge = generateChallenge(3, [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7]);
    expect(challenge.sequence).toHaveLength(7);
    expect(challenge.multiplier).toBe(3.5);
  });

  it('caps length at 8', () => {
    const challenge = generateChallenge(10, [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8]);
    expect(challenge.sequence).toHaveLength(8);
  });

  it('starts a hack with challenge in state', () => {
    const state = makeEra3State();
    const after = startHack(state, [0.1, 0.3, 0.5, 0.7]);
    expect(after.hackChallenge).not.toBeNull();
    expect(after.hackChallenge.sequence).toHaveLength(4);
  });

  it('does nothing before era 3', () => {
    const state = createInitialState();
    const after = startHack(state);
    expect(after.hackChallenge).toBeUndefined();
  });

  it('successful hack adds timed effect and increments difficulty', () => {
    const state = makeEra3State();
    const withChallenge = startHack(state, [0.1, 0.3, 0.5, 0.7]);
    const sequence = withChallenge.hackChallenge.sequence;
    const { state: after, success } = submitHack(withChallenge, sequence);
    expect(success).toBe(true);
    expect(after.hackDifficulty).toBe(1);
    expect(after.hackSuccesses).toBe(1);
    expect(after.hackChallenge).toBeNull();
    expect(after.activeEffects.length).toBe(1);
  });

  it('failed hack decreases difficulty', () => {
    const state = makeEra3State();
    state.hackDifficulty = 3;
    const withChallenge = startHack(state, [0.1, 0.3, 0.5, 0.7]);
    const { state: after, success } = submitHack(withChallenge, ['0', '0', '0', '0']);
    expect(success).toBe(false);
    expect(after.hackDifficulty).toBe(2);
  });

  it('getHackBonus returns multiplier from active hack effects', () => {
    const state = makeEra3State();
    state.activeEffects = [{
      id: 'hack_100',
      endsAt: 130,
      effects: [
        { resourceId: 'data', rateMultBonus: 2 },
        { resourceId: 'software', rateMultBonus: 2 },
      ],
    }];
    expect(getHackBonus(state)).toBe(2);
  });
});
