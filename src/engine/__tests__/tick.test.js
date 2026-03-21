import { describe, it, expect } from 'vitest';
import { tick } from '../tick.js';
import { createInitialState } from '../state.js';

describe('tick', () => {
  it('advances resources by their production rates', () => {
    const state = createInitialState();
    // Food has baseRate 1.5, rateMult 1
    const before = state.resources.food.amount;
    const after = tick(state, 1);
    expect(after.resources.food.amount).toBeCloseTo(before + 1.5, 5);
  });

  it('enforces resource caps on production', () => {
    const state = createInitialState();
    state.resources.food.amount = 4999.8;
    const after = tick(state, 1);
    // Cap enforced at 5000 (baseCap * capMult = 5000 * 1)
    expect(after.resources.food.amount).toBe(5000);
  });

  it('does not produce for locked resources', () => {
    const state = createInitialState();
    // Steel is era 2, locked in era 1
    expect(state.resources.steel.unlocked).toBe(false);
    const after = tick(state, 10);
    expect(after.resources.steel.amount).toBe(0);
  });

  it('increments totalTicks and totalTime', () => {
    const state = createInitialState();
    const after = tick(state, 0.5);
    expect(after.totalTicks).toBe(1);
    expect(after.totalTime).toBeCloseTo(0.5, 5);
  });

  it('applies prestige multiplier to production', () => {
    const state = createInitialState();
    state.prestigeMultiplier = 3;
    const after = tick(state, 1);
    // Food: baseRate 1.5 * rateMult 1 * prestige 3 = 4.5/s
    expect(after.resources.food.amount).toBeCloseTo(4.5, 5);
  });
});
