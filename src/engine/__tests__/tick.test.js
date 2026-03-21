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

  it('surplusExchange converts capped resources to lowest', () => {
    const state = createInitialState();
    state.upgrades = { surplusExchange: true };
    state.resources.food = { ...state.resources.food, unlocked: true, amount: 4900, capMult: 1 };
    state.resources.materials = { ...state.resources.materials, unlocked: true, amount: 10, capMult: 1 };
    const after = tick(state, 1);
    // Materials should have increased (received overflow)
    expect(after.resources.materials.amount).toBeGreaterThan(10);
  });

  it('overclockProtocol doubles production during pulse', () => {
    const state = createInitialState();
    state.upgrades = { overclockProtocol: true };
    state.totalTime = 5; // In the pulse window (0-10)
    const after = tick(state, 1);
    // Food should gain more than base 1.5/s (doubled = 3.0/s)
    expect(after.resources.food.amount).toBeGreaterThan(state.resources.food.amount + 2.5);
  });

  it('communalEffort gives bonus per upgrade', () => {
    const state = createInitialState();
    state.upgrades = { communalEffort: true, tools: true, irrigation: true }; // 3 upgrades = +3%
    const baseTick = tick(createInitialState(), 1);
    const bonusTick = tick(state, 1);
    // With communalEffort, production should be slightly higher
    expect(bonusTick.resources.food.amount).toBeGreaterThan(baseTick.resources.food.amount);
  });
});
