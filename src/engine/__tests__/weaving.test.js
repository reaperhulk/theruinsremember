import { describe, it, expect } from 'vitest';
import { generateFragment, drawFragment, resolveWeave, clearGrid, getWeavingStats } from '../weaving.js';
import { createInitialState } from '../state.js';

describe('weaving', () => {
  function makeEra8State() {
    const state = createInitialState();
    state.era = 8;
    state.totalTime = 200;
    state.activeEffects = [];
    state.resources.realityFragments = { amount: 100, unlocked: true, rateAdd: 0, rateMult: 1, capMult: 1, baseRate: 0, cap: 500 };
    return state;
  }

  it('generates fragment from roll', () => {
    // Chaos at < 0.15, then regular types
    expect(generateFragment(0)).toBe('chaos');
    expect(generateFragment(0.1)).toBe('chaos');
    expect(generateFragment(0.2)).toBe('temporal');
    expect(generateFragment(0.5)).toBe('spatial');
    expect(generateFragment(0.7)).toBe('causal');
    expect(generateFragment(0.9)).toBe('quantum');
  });

  it('draws a fragment and adds to grid', () => {
    const state = makeEra8State();
    const { state: after, fragment } = drawFragment(state, 0.2);
    expect(after).not.toBeNull();
    expect(fragment).toBe('temporal');
    expect(after.weavingGrid).toHaveLength(1);
    expect(after.resources.realityFragments.amount).toBe(95);
  });

  it('rejects draw when cannot afford', () => {
    const state = makeEra8State();
    state.resources.realityFragments.amount = 2;
    const { state: after } = drawFragment(state, 0.1);
    expect(after).toBeNull();
  });

  it('rejects draw before era 8', () => {
    const state = createInitialState();
    state.resources.realityFragments = { amount: 100, unlocked: true, rateAdd: 0, rateMult: 1, capMult: 1, baseRate: 0, cap: 500 };
    const { state: after } = drawFragment(state, 0.1);
    expect(after).toBeNull();
  });

  it('resolves a match of 3', () => {
    const state = makeEra8State();
    state.weavingGrid = ['temporal', 'temporal', 'temporal'];
    const { state: after, matched, matchType } = resolveWeave(state);
    expect(matched).toBe(true);
    expect(matchType).toBe('temporal');
    expect(after.weavingGrid).toHaveLength(0);
    expect(after.totalWeaves).toBe(1);
    expect(after.activeEffects).toHaveLength(1);
    expect(after.activeEffects[0].effect.resourceId).toBe('cosmicPower');
  });

  it('does not resolve with less than 3 matches', () => {
    const state = makeEra8State();
    state.weavingGrid = ['temporal', 'temporal', 'spatial'];
    const { matched } = resolveWeave(state);
    expect(matched).toBe(false);
  });

  it('only removes 3 of matched type, keeps rest', () => {
    const state = makeEra8State();
    state.weavingGrid = ['temporal', 'spatial', 'temporal', 'temporal', 'spatial'];
    const { state: after, matched } = resolveWeave(state);
    expect(matched).toBe(true);
    expect(after.weavingGrid).toEqual(['spatial', 'spatial']);
  });

  it('clears grid', () => {
    const state = makeEra8State();
    state.weavingGrid = ['temporal', 'spatial'];
    const after = clearGrid(state);
    expect(after.weavingGrid).toHaveLength(0);
  });

  it('getWeavingStats returns grid info', () => {
    const state = makeEra8State();
    state.weavingGrid = ['temporal'];
    state.totalWeaves = 5;
    const stats = getWeavingStats(state);
    expect(stats.totalWeaves).toBe(5);
    expect(stats.grid).toHaveLength(1);
  });

  it('chaos fragments act as wild cards', () => {
    const state = makeEra8State();
    state.weavingGrid = ['temporal', 'temporal', 'chaos'];
    const { state: after, matched, matchType } = resolveWeave(state);
    expect(matched).toBe(true);
    expect(matchType).toBe('temporal');
    expect(after.weavingGrid).toHaveLength(0);
  });

  it('combo increases multiplier on consecutive weaves', () => {
    const state = makeEra8State();
    state.weavingGrid = ['temporal', 'temporal', 'temporal'];
    const { state: after1 } = resolveWeave(state);
    expect(after1.weaveCombo).toBe(1);
    // First weave: x2 base, combo 1 = x1 mult = x2 total
    expect(after1.activeEffects[0].effect.rateMultBonus).toBe(2);

    // Second weave
    after1.weavingGrid = ['spatial', 'spatial', 'spatial'];
    const { state: after2 } = resolveWeave(after1);
    expect(after2.weaveCombo).toBe(2);
    // Combo 2 = x1.5 mult, base 2 = x3 total
    expect(after2.activeEffects[1].effect.rateMultBonus).toBe(3);
  });
});
