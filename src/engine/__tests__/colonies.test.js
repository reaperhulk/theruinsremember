import { describe, it, expect } from 'vitest';
import { getAssignableColonies, assignColonies, getColonyAssignments, getColonyBonus } from '../colonies.js';
import { createInitialState } from '../state.js';

describe('colonies', () => {
  function makeEra5State() {
    const state = createInitialState();
    state.era = 5;
    state.resources.colonies = { amount: 5.5, unlocked: true, rateAdd: 0, rateMult: 1, capMult: 1, baseRate: 0, cap: 50 };
    state.resources.food = { amount: 100, unlocked: true, rateAdd: 0, rateMult: 1, capMult: 1, baseRate: 0.5, cap: 200 };
    state.resources.research = { amount: 100, unlocked: true, rateAdd: 0, rateMult: 1, capMult: 1, baseRate: 0, cap: 500 };
    state.resources.exoticMaterials = { amount: 100, unlocked: true, rateAdd: 0, rateMult: 1, capMult: 1, baseRate: 0, cap: 200 };
    return state;
  }

  it('assignable colonies based on floor of amount', () => {
    const state = makeEra5State();
    expect(getAssignableColonies(state)).toBe(5);
  });

  it('assigns colonies to a focus', () => {
    const state = makeEra5State();
    const after = assignColonies(state, 'growth', 3);
    expect(after).not.toBeNull();
    expect(getColonyAssignments(after).growth).toBe(3);
  });

  it('rejects over-assignment', () => {
    const state = makeEra5State();
    const result = assignColonies(state, 'growth', 6);
    expect(result).toBeNull();
  });

  it('rejects invalid focus', () => {
    const state = makeEra5State();
    expect(assignColonies(state, 'invalid', 1)).toBeNull();
  });

  it('calculates colony bonus correctly', () => {
    const state = makeEra5State();
    let s = assignColonies(state, 'growth', 2);
    s = assignColonies(s, 'science', 1);
    const bonus = getColonyBonus(s);
    expect(bonus.food).toBeCloseTo(4);      // 2 * 2
    expect(bonus.labor).toBeCloseTo(1);      // 2 * 0.5
    expect(bonus.research).toBeCloseTo(1.5); // 1 * 1.5
    expect(bonus.data).toBeCloseTo(0.8);     // 1 * 0.8
  });

  it('returns empty bonus before era 5', () => {
    const state = createInitialState();
    state.colonyAssignments = { growth: 2, science: 0, industry: 0 };
    expect(getColonyBonus(state)).toEqual({});
  });

  it('allows reassigning colony counts', () => {
    const state = makeEra5State();
    let s = assignColonies(state, 'growth', 3);
    s = assignColonies(s, 'growth', 1);
    expect(getColonyAssignments(s).growth).toBe(1);
  });
});
