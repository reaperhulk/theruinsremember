import { describe, it, expect } from 'vitest';
import { getWorkerPool, getMaxWorkers, allocateWorker, getAllocation, getFactoryBonus } from '../factory.js';
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

  describe('era-scaled max workers', () => {
    it('returns 10 + era*2 for low eras', () => {
      const state = makeEra2State();
      // era 2: min(10 + 2*2, 30) = 14
      expect(getMaxWorkers(state)).toBe(14);
    });

    it('caps at 30 workers for high eras', () => {
      const state = makeEra2State();
      state.era = 10;
      // era 10: min(10 + 10*2, 30) = 30
      expect(getMaxWorkers(state)).toBe(30);
    });

    it('allows more workers at higher eras with sufficient labor', () => {
      const state = makeEra2State();
      state.era = 5;
      state.resources.labor.rateAdd = 20;
      // pool = min(floor(20 * 1) + 2, min(10 + 5*2, 30)) = min(22, 20) = 20
      expect(getWorkerPool(state)).toBe(20);
    });

    it('worker pool still limited by labor rate', () => {
      const state = makeEra2State();
      state.era = 10;
      // laborRate = 2, rateMult = 1 => pool = min(floor(2) + 2, 30) = 4
      expect(getWorkerPool(state)).toBe(4);
    });
  });
});
