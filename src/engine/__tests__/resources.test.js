import { describe, it, expect } from 'vitest';
import { calculateProduction, canAfford, spend, getEffectiveRate, gather } from '../resources.js';
import { createInitialState } from '../state.js';

describe('resources', () => {
  describe('getEffectiveRate', () => {
    it('returns base rate for era 1 resources', () => {
      const state = createInitialState();
      expect(getEffectiveRate(state, 'food')).toBeCloseTo(0.5, 5);
      expect(getEffectiveRate(state, 'materials')).toBeCloseTo(0.2, 5);
      expect(getEffectiveRate(state, 'energy')).toBeCloseTo(0.1, 5);
    });

    it('returns 0 for locked resources', () => {
      const state = createInitialState();
      expect(getEffectiveRate(state, 'steel')).toBe(0);
    });

    it('applies rateMult and rateAdd', () => {
      const state = createInitialState();
      state.resources.food.rateMult = 2;
      state.resources.food.rateAdd = 1;
      // (baseRate 0.5 + rateAdd 1) * rateMult 2 * prestige 1 = 3
      expect(getEffectiveRate(state, 'food')).toBeCloseTo(3, 5);
    });
  });

  describe('calculateProduction', () => {
    it('returns rates for all resources', () => {
      const state = createInitialState();
      const rates = calculateProduction(state);
      expect(rates.food).toBeCloseTo(0.5, 5);
      expect(rates.steel).toBe(0); // locked
    });
  });

  describe('canAfford', () => {
    it('returns true when resources are sufficient', () => {
      const state = createInitialState();
      state.resources.labor.amount = 20;
      expect(canAfford(state, { labor: 10 })).toBe(true);
    });

    it('returns false when resources are insufficient', () => {
      const state = createInitialState();
      expect(canAfford(state, { labor: 100 })).toBe(false);
    });
  });

  describe('spend', () => {
    it('deducts resources on spend', () => {
      const state = createInitialState();
      state.resources.labor.amount = 20;
      const after = spend(state, { labor: 10 });
      expect(after.resources.labor.amount).toBe(10);
    });

    it('returns null if cannot afford', () => {
      const state = createInitialState();
      const result = spend(state, { labor: 1000 });
      expect(result).toBeNull();
    });
  });

  describe('gather', () => {
    it('adds 1 to the resource amount', () => {
      const state = createInitialState();
      const before = state.resources.labor.amount;
      const after = gather(state, 'labor');
      expect(after.resources.labor.amount).toBe(before + 1);
    });

    it('caps gathering at resource cap', () => {
      const state = createInitialState();
      state.resources.labor.amount = 500; // over cap
      const after = gather(state, 'labor');
      // Cap enforcement: already over, stays at current
      expect(after.resources.labor.amount).toBe(500);
    });

    it('applies prestige multiplier', () => {
      const state = createInitialState();
      state.prestigeMultiplier = 3;
      const before = state.resources.labor.amount;
      const after = gather(state, 'labor');
      expect(after.resources.labor.amount).toBe(before + 3);
    });

    it('scales with rateMult from upgrades', () => {
      const state = createInitialState();
      state.resources.food.rateMult = 4;
      const before = state.resources.food.amount;
      const after = gather(state, 'food');
      // 1 * rateMult 4 * prestige 1 = 4
      expect(after.resources.food.amount).toBe(before + 4);
    });

    it('returns same state for locked resources', () => {
      const state = createInitialState();
      const after = gather(state, 'steel');
      expect(after).toBe(state);
    });
  });
});
