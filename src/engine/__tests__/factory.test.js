import { describe, it, expect } from 'vitest';
import { getWorkerPool, allocateWorker, getAllocation, getFactoryBonus } from '../factory.js';
import { createInitialState } from '../state.js';

describe('factory', () => {
  function makeEra2State() {
    const state = createInitialState();
    state.era = 2;
    state.resources.labor.rateAdd = 2;
    state.resources.labor.rateMult = 1;
    state.resources.steel = { amount: 100, unlocked: true, rateAdd: 0, rateMult: 1, capMult: 1, baseRate: 0, cap: 300 };
    state.resources.electronics = { amount: 100, unlocked: true, rateAdd: 0, rateMult: 1, capMult: 1, baseRate: 0, cap: 200 };
    state.resources.research = { amount: 100, unlocked: true, rateAdd: 0, rateMult: 1, capMult: 1, baseRate: 0, cap: 500 };
    return state;
  }

  it('calculates worker pool from labor rate', () => {
    const state = makeEra2State();
    // pool = min(floor(rateAdd * rateMult) + 2, 10) = min(floor(2) + 2, 10) = 4
    expect(getWorkerPool(state)).toBe(4);
  });

  it('allocates workers to a production line', () => {
    const state = makeEra2State();
    const after = allocateWorker(state, 'steel', 2);
    expect(after).not.toBeNull();
    expect(getAllocation(after).steel).toBe(2);
  });

  it('rejects over-allocation', () => {
    const state = makeEra2State();
    const pool = getWorkerPool(state);
    const result = allocateWorker(state, 'steel', pool + 1);
    expect(result).toBeNull();
  });

  it('rejects invalid line', () => {
    const state = makeEra2State();
    expect(allocateWorker(state, 'invalid', 1)).toBeNull();
  });

  it('calculates factory bonus per worker', () => {
    const state = makeEra2State();
    const after = allocateWorker(state, 'steel', 3);
    const bonus = getFactoryBonus(after);
    expect(bonus.steel).toBeCloseTo(0.9);
  });

  it('returns empty bonus before era 2', () => {
    const state = createInitialState();
    state.factoryAllocation = { steel: 2, electronics: 0, research: 0 };
    expect(getFactoryBonus(state)).toEqual({});
  });
});
