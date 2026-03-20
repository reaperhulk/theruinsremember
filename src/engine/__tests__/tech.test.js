import { describe, it, expect } from 'vitest';
import { unlockTech, getAvailableTech } from '../tech.js';
import { createInitialState } from '../state.js';

describe('tech', () => {
  describe('unlockTech', () => {
    it('deducts cost and marks tech as unlocked', () => {
      const state = createInitialState();
      state.resources.materials.amount = 100;
      state.resources.energy.amount = 100;
      const after = unlockTech(state, 'metallurgy');
      expect(after).not.toBeNull();
      expect(after.tech.metallurgy).toBe(true);
      expect(after.resources.materials.amount).toBe(60);
      expect(after.resources.energy.amount).toBe(70);
    });

    it('returns null if prerequisites not met', () => {
      const state = createInitialState();
      state.resources.materials.amount = 200;
      state.resources.energy.amount = 200;
      state.resources.labor.amount = 200;
      // industrialRevolution requires metallurgy
      const result = unlockTech(state, 'industrialRevolution');
      expect(result).toBeNull();
    });

    it('returns null if already unlocked', () => {
      const state = createInitialState();
      state.resources.materials.amount = 200;
      state.resources.energy.amount = 200;
      const after = unlockTech(state, 'metallurgy');
      const again = unlockTech(after, 'metallurgy');
      expect(again).toBeNull();
    });
  });

  describe('getAvailableTech', () => {
    it('returns tech without prerequisites for era 1', () => {
      const state = createInitialState();
      const available = getAvailableTech(state);
      const ids = available.map(t => t.id);
      expect(ids).toContain('metallurgy');
      expect(ids).not.toContain('industrialRevolution');
    });
  });

  describe('mutual exclusion', () => {
    it('blocks purchase of excluded tech', () => {
      const state = createInitialState();
      state.era = 3;
      state.tech = { globalNetwork: true, offensiveAI: true };
      state.resources.software = { amount: 500, unlocked: true, rateAdd: 0, rateMult: 1, capMult: 1, baseRate: 0, cap: 300 };
      state.resources.data = { amount: 500, unlocked: true, rateAdd: 0, rateMult: 1, capMult: 1, baseRate: 0, cap: 200 };
      state.resources.research = { amount: 500, unlocked: true, rateAdd: 0, rateMult: 1, capMult: 1, baseRate: 0, cap: 500 };
      const result = unlockTech(state, 'defensiveAI');
      expect(result).toBeNull();
    });

    it('hides excluded tech from available list', () => {
      const state = createInitialState();
      state.era = 3;
      state.tech = { globalNetwork: true, offensiveAI: true };
      const available = getAvailableTech(state);
      expect(available.map(t => t.id)).not.toContain('defensiveAI');
    });

    it('applies effects when tech has them', () => {
      const state = createInitialState();
      state.era = 1;
      state.resources.food.amount = 100;
      state.resources.materials.amount = 100;
      const after = unlockTech(state, 'agriculture');
      expect(after).not.toBeNull();
      expect(after.resources.food.rateMult).toBe(2);
    });
  });
});
