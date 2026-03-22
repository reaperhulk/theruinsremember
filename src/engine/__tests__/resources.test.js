import { describe, it, expect } from 'vitest';
import { calculateProduction, canAfford, spend, getEffectiveRate, getNetRate, gather } from '../resources.js';
import { createInitialState } from '../state.js';

describe('resources', () => {
  describe('getEffectiveRate', () => {
    it('returns base rate for era 1 resources', () => {
      const state = createInitialState();
      expect(getEffectiveRate(state, 'food')).toBeCloseTo(1.5, 5);
      expect(getEffectiveRate(state, 'materials')).toBeCloseTo(0.8, 5);
      expect(getEffectiveRate(state, 'energy')).toBeCloseTo(0.5, 5);
    });

    it('returns 0 for locked resources', () => {
      const state = createInitialState();
      expect(getEffectiveRate(state, 'steel')).toBe(0);
    });

    it('applies rateMult and rateAdd', () => {
      const state = createInitialState();
      state.resources.food.rateMult = 2;
      state.resources.food.rateAdd = 1;
      // (baseRate 1.5 + rateAdd 1) * rateMult 2 * prestige 1 = 5
      expect(getEffectiveRate(state, 'food')).toBeCloseTo(5, 5);
    });

    it('applies reality key bonus correctly', () => {
      const state = createInitialState();
      state.realityKeys = { temporal: 5, spatial: 5 }; // 10 total = +10%
      // food: (baseRate 1.5 + 0) * 1 * prestige 1 * 1.10 = 1.65
      expect(getEffectiveRate(state, 'food')).toBeCloseTo(1.65, 5);
    });

    it('applies reality key bonus with zero keys', () => {
      const state = createInitialState();
      state.realityKeys = {};
      // No bonus: (baseRate 1.5 + 0) * 1 * 1 * 1.0 = 1.5
      expect(getEffectiveRate(state, 'food')).toBeCloseTo(1.5, 5);
    });
  });

  describe('calculateProduction', () => {
    it('returns rates for all resources', () => {
      const state = createInitialState();
      const rates = calculateProduction(state);
      expect(rates.food).toBeCloseTo(1.5, 5);
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
      state.resources.labor.amount = 2500; // over cap of 2000
      const after = gather(state, 'labor');
      // Cap enforcement: already over, stays at current (doesn't reduce)
      expect(after.resources.labor.amount).toBe(2500);
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

    it('scavengerInstinct gives +1 to all other resources on gather', () => {
      const state = createInitialState();
      state.upgrades = { scavengerInstinct: true };
      state.resources.food.unlocked = true;
      state.resources.materials.unlocked = true;
      state.resources.energy.unlocked = true;
      const before = state.resources.materials.amount;
      const after = gather(state, 'food');
      // Materials should have increased by at least 1
      expect(after.resources.materials.amount).toBeGreaterThan(before);
    });
  });

  describe('getNetRate', () => {
    it('returns gross rate when no consumption', () => {
      const state = createInitialState();
      state.resources.materials.rateAdd = 2;
      const net = getNetRate(state, 'materials');
      const gross = getEffectiveRate(state, 'materials');
      // materials has no consumption chain, so net === gross
      expect(net).toBe(gross);
      // gross = (baseRate 0.8 + rateAdd 2) * 1 * 1 = 2.8
      expect(net).toBeCloseTo(2.8, 5);
    });

    it('subtracts food consumed by labor', () => {
      const state = createInitialState();
      state.resources.labor = { ...state.resources.labor, unlocked: true, rateAdd: 2, rateMult: 1 };
      // labor effective rate = (baseRate 0.2 + rateAdd 2) * 1 * 1 = 2.2
      // food gross = (1.5 + 0) * 1 * 1 = 1.5
      // food net = 1.5 - 2.2 * 1.0 = 1.5 - 2.2 = -0.7
      const grossFood = getEffectiveRate(state, 'food');
      const netFood = getNetRate(state, 'food');
      expect(netFood).toBeLessThan(grossFood);
      expect(netFood).toBeCloseTo(grossFood - 2.2 * 1.0, 5);
    });

    it('subtracts energy consumed by electronics', () => {
      const state = createInitialState();
      state.resources.electronics = { ...state.resources.electronics, unlocked: true, rateAdd: 3, rateMult: 1 };
      // electronics effective rate = (0.1 + 3) * 1 * 1 = 3.1
      // energy gross = (0.5 + 0) * 1 * 1 = 0.5
      // energy net = 0.5 - 3.1 * 0.5 = 0.5 - 1.55 = -1.05
      const netEnergy = getNetRate(state, 'energy');
      // energy net = 0.5 - 3.1 * 0.4 = 0.5 - 1.24 = -0.74
      expect(netEnergy).toBeCloseTo(-0.74, 5);
    });
  });
});
