import { describe, it, expect } from 'vitest';
import { unlockTech, getAvailableTech, isDecisionTech, researchRoutineTech } from '../tech.js';
import { createInitialState } from '../state.js';
import { techTree } from '../../data/tech-tree.js';

describe('tech', () => {
  describe('unlockTech', () => {
    it('deducts cost and marks tech as unlocked', () => {
      const state = createInitialState();
      state.resources.materials.amount = 100;
      state.resources.energy.amount = 100;
      const after = unlockTech(state, 'metallurgy');
      expect(after).not.toBeNull();
      expect(after.tech.metallurgy).toBe(true);
      // metallurgy costs materials: 50, energy: 40
      expect(after.resources.materials.amount).toBe(50);
      expect(after.resources.energy.amount).toBe(60);
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
    it.each(
      Object.values(techTree)
        .filter(tech => tech.excludes && tech.id < tech.excludes)
        .map(tech => [tech.id, tech.excludes]),
    )('protects both directions of the %s versus %s research branch', (leftId, rightId) => {
      const left = techTree[leftId];
      const right = techTree[rightId];
      expect(right.excludes).toBe(leftId);

      for (const [chosenId, rejectedId] of [[leftId, rightId], [rightId, leftId]]) {
        const state = createInitialState();
        state.era = Math.max(left.era, right.era);
        state.tech = Object.fromEntries(
          [...new Set([...left.prerequisites, ...right.prerequisites])].map(id => [id, true]),
        );
        for (const [id, resource] of Object.entries(state.resources)) {
          state.resources[id] = { ...resource, unlocked: true, amount: 1e30 };
        }

        const chosen = unlockTech(state, chosenId);
        expect(chosen?.tech[chosenId]).toBe(true);
        expect(unlockTech(chosen, rejectedId)).toBeNull();
        expect(getAvailableTech(chosen).map(tech => tech.id)).not.toContain(rejectedId);
      }
    });

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
      // agriculture now gives production_add +1 food (was production_mult x2)
      expect(after.resources.food.rateAdd).toBe(1);
    });
  });

  describe('routine research automation', () => {
    it('requires decisions only for exclusive research paths', () => {
      expect(isDecisionTech({ grantsEra: 2 })).toBe(false);
      expect(isDecisionTech({ excludes: 'otherBranch' })).toBe(true);
      expect(isDecisionTech({ id: 'routineResearch' })).toBe(false);
    });

    it('funds linear research and its breakthrough without departing the era', () => {
      const state = createInitialState();
      for (const [id, resource] of Object.entries(state.resources)) {
        state.resources[id] = { ...resource, unlocked: true, amount: 1e8 };
      }

      const { state: researched, count } = researchRoutineTech(state);

      expect(count).toBeGreaterThan(0);
      expect(researched.tech.metallurgy).toBe(true);
      expect(researched.tech.industrialRevolution).toBe(true);
      expect(researched.era).toBe(1);
    });

    it('never selects either side of an exclusive research branch', () => {
      const state = createInitialState();
      state.era = 3;
      state.tech = { globalNetwork: true };
      for (const [id, resource] of Object.entries(state.resources)) {
        state.resources[id] = { ...resource, unlocked: true, amount: 1e20 };
      }

      const { state: researched } = researchRoutineTech(state);

      expect(researched.tech.offensiveAI).toBeUndefined();
      expect(researched.tech.defensiveAI).toBeUndefined();
    });
  });
});
