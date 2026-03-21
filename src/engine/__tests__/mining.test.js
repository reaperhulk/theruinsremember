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
    it('first mine gives +20 materials burst', () => {
      const state = createInitialState();
      const before = state.resources.materials.amount;
      const { state: after, foundGem } = mine(state, 0.99);
      expect(foundGem).toBe(false);
      expect(after.resources.materials.amount).toBe(before + 20);
      expect(after.miningStreak).toBe(1);
    });

    it('gathers materials on a normal click (no gem)', () => {
      const state = createInitialState();
      state.miningStreak = 1; // bypass first-mine burst
      state.totalGems = 1;
      const before = state.resources.materials.amount;
      // fullRate = (0.8 + 0) * 1 * 1 = 0.8, rateScale = max(1, 0.8) = 1
      // baseGather = 1 * 1 * 1 = 1
      const { state: after, foundGem } = mine(state, 0.99); // high roll = no gem
      expect(foundGem).toBe(false);
      expect(after.resources.materials.amount).toBe(before + 1);
    });

    it('gathers 5x materials when gem is found', () => {
      const state = createInitialState();
      state.miningStreak = 5; // ensure gem chance > 0.01
      state.totalGems = 1;
      const before = state.resources.materials.amount;
      // fullRate = 0.8, rateScale = max(1, 0.8) = 1, baseGather = 1
      // gemQuality = 1 + floor(1/25)*0.5 = 1
      // gathered = 1 * 5 * 1 = 5
      const { state: after, foundGem } = mine(state, 0.01); // low roll = gem
      expect(foundGem).toBe(true);
      expect(after.resources.materials.amount).toBe(before + 5);
    });

    it('increments streak on miss', () => {
      const state = createInitialState();
      // First mine (burst) sets streak to 1
      const { state: after } = mine(state, 0.99);
      expect(after.miningStreak).toBe(1);
      const { state: after2 } = mine(after, 0.99);
      expect(after2.miningStreak).toBe(2);
    });

    it('resets streak on gem find', () => {
      const state = { ...createInitialState(), miningStreak: 10, totalGems: 1 };
      const { state: after, foundGem } = mine(state, 0.01);
      expect(foundGem).toBe(true);
      expect(after.miningStreak).toBe(0);
    });

    it('applies rateMult to mine output', () => {
      const state = createInitialState();
      state.miningStreak = 1;
      state.totalGems = 1;
      state.resources.materials.rateMult = 3;
      const before = state.resources.materials.amount;
      // fullRate = (0.8 + 0) * 3 * 1 = 2.4, rateScale = max(1, 2.4) = 2.4
      // baseGather = 2.4 * 1 * 1 = 2.4
      const { state: after } = mine(state, 0.99);
      expect(after.resources.materials.amount).toBeCloseTo(before + 2.4, 5);
    });

    it('applies prestige multiplier', () => {
      const state = createInitialState();
      state.miningStreak = 1;
      state.totalGems = 1;
      state.prestigeMultiplier = 2;
      const before = state.resources.materials.amount;
      // fullRate = (0.8 + 0) * 1 * 2 = 1.6, rateScale = max(1, 1.6) = 1.6
      // baseGather = 1.6 * 1 * 1 = 1.6
      const { state: after } = mine(state, 0.99);
      expect(after.resources.materials.amount).toBeCloseTo(before + 1.6, 5);
    });

    it('gem + rateMult + prestige stack correctly', () => {
      const state = createInitialState();
      state.miningStreak = 5;
      state.totalGems = 1;
      state.resources.materials.rateMult = 2;
      state.prestigeMultiplier = 3;
      const before = state.resources.materials.amount;
      // fullRate = (0.8 + 0) * 2 * 3 = 4.8, rateScale = max(1, 4.8) = 4.8
      // baseGather = 4.8 * 1 * 1 = 4.8, gem = 4.8 * 5 * 1 = 24
      const { state: after, foundGem } = mine(state, 0.01);
      expect(foundGem).toBe(true);
      expect(after.resources.materials.amount).toBeCloseTo(before + 24, 5);
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

    it('first mine burst only fires once', () => {
      const state = createInitialState();
      const first = mine(state, 0.99);
      expect(first.state.resources.materials.amount).toBeGreaterThanOrEqual(20); // Burst
      const second = mine(first.state, 0.99);
      // Second mine should NOT give burst (miningStreak > 0)
      expect(second.state.resources.materials.amount - first.state.resources.materials.amount).toBeLessThan(20);
    });
  });
});
