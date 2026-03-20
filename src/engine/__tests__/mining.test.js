import { describe, it, expect } from 'vitest';
import { mine, getGemChance } from '../mining.js';
import { createInitialState } from '../state.js';

describe('mining', () => {
  describe('getGemChance', () => {
    it('returns base 10% with no streak', () => {
      const state = createInitialState();
      expect(getGemChance(state)).toBeCloseTo(0.1, 5);
    });

    it('increases by 2% per streak', () => {
      const state = { ...createInitialState(), miningStreak: 5 };
      // 0.1 + 5 * 0.02 = 0.2
      expect(getGemChance(state)).toBeCloseTo(0.2, 5);
    });

    it('caps at 50%', () => {
      const state = { ...createInitialState(), miningStreak: 100 };
      expect(getGemChance(state)).toBeCloseTo(0.5, 5);
    });

    it('handles missing miningStreak gracefully', () => {
      const state = createInitialState();
      delete state.miningStreak;
      expect(getGemChance(state)).toBeCloseTo(0.1, 5);
    });
  });

  describe('mine', () => {
    it('gathers materials on a normal click (no gem)', () => {
      const state = createInitialState();
      const before = state.resources.materials.amount;
      const { state: after, foundGem } = mine(state, 0.99); // high roll = no gem
      expect(foundGem).toBe(false);
      expect(after.resources.materials.amount).toBe(before + 1);
    });

    it('gathers 5x materials when gem is found', () => {
      const state = createInitialState();
      const before = state.resources.materials.amount;
      const { state: after, foundGem } = mine(state, 0.01); // low roll = gem
      expect(foundGem).toBe(true);
      expect(after.resources.materials.amount).toBe(before + 5);
    });

    it('increments streak on miss', () => {
      const state = createInitialState();
      const { state: after } = mine(state, 0.99);
      expect(after.miningStreak).toBe(1);
      const { state: after2 } = mine(after, 0.99);
      expect(after2.miningStreak).toBe(2);
    });

    it('resets streak on gem find', () => {
      const state = { ...createInitialState(), miningStreak: 10 };
      const { state: after, foundGem } = mine(state, 0.01);
      expect(foundGem).toBe(true);
      expect(after.miningStreak).toBe(0);
    });

    it('applies rateMult to mine output', () => {
      const state = createInitialState();
      state.resources.materials.rateMult = 3;
      const before = state.resources.materials.amount;
      const { state: after } = mine(state, 0.99);
      expect(after.resources.materials.amount).toBe(before + 3);
    });

    it('applies prestige multiplier', () => {
      const state = createInitialState();
      state.prestigeMultiplier = 2;
      const before = state.resources.materials.amount;
      const { state: after } = mine(state, 0.99);
      expect(after.resources.materials.amount).toBe(before + 2);
    });

    it('gem + rateMult + prestige stack correctly', () => {
      const state = createInitialState();
      state.resources.materials.rateMult = 2;
      state.prestigeMultiplier = 3;
      const before = state.resources.materials.amount;
      // base = 1 * 2 * 3 = 6, gem = 6 * 5 = 30
      const { state: after, foundGem } = mine(state, 0.01);
      expect(foundGem).toBe(true);
      expect(after.resources.materials.amount).toBe(before + 30);
    });

    it('streak increases gem chance so previously-miss roll becomes a hit', () => {
      // At streak 0: chance = 0.1, roll 0.15 => miss
      // At streak 5: chance = 0.2, roll 0.15 => hit
      const state = { ...createInitialState(), miningStreak: 5 };
      const { foundGem } = mine(state, 0.15);
      expect(foundGem).toBe(true);
    });

    it('does not modify original state', () => {
      const state = createInitialState();
      const originalAmount = state.resources.materials.amount;
      mine(state, 0.99);
      expect(state.resources.materials.amount).toBe(originalAmount);
      expect(state.miningStreak).toBe(0);
    });

    it('returns unchanged state if materials locked', () => {
      const state = createInitialState();
      state.resources.materials.unlocked = false;
      const { state: after, foundGem } = mine(state, 0.01);
      expect(after).toBe(state);
      expect(foundGem).toBe(false);
    });
  });
});
