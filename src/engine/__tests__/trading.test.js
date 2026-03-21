import { describe, it, expect } from 'vitest';
import { executeTrade, getTradeRatio } from '../trading.js';
import { createInitialState } from '../state.js';

function makeState(overrides = {}) {
  const state = createInitialState();
  // Default to era 6 with some unlocked resources and amounts
  const s = { ...state, era: 6, ...overrides };
  // Unlock all resources up to era 6
  for (const [id, r] of Object.entries(s.resources)) {
    if (r.unlocked || parseInt(id) <= 5) {
      // keep as-is
    }
  }
  return s;
}

function withUnlocked(state, resourceId, amount = 100) {
  return {
    ...state,
    resources: {
      ...state.resources,
      [resourceId]: {
        ...state.resources[resourceId],
        unlocked: true,
        amount,
      },
    },
  };
}

describe('trading', () => {
  describe('getTradeRatio', () => {
    it('returns 1:1 for same-era resources', () => {
      // food and materials are both era 1
      const ratio = getTradeRatio('food', 'materials');
      expect(ratio).toEqual({ input: 1, output: 1 });
    });

    it('returns 4:1 for trading up one era', () => {
      // materials (era 1) -> steel (era 2)
      const ratio = getTradeRatio('materials', 'steel');
      expect(ratio).toEqual({ input: 4, output: 1 });
    });

    it('returns 64:1 for trading up three eras', () => {
      // materials (era 1) -> rocketFuel (era 4)
      const ratio = getTradeRatio('materials', 'rocketFuel');
      expect(ratio).toEqual({ input: 64, output: 1 });
    });

    it('returns 1:5 for trading down one era', () => {
      // steel (era 2) -> food (era 1)
      const ratio = getTradeRatio('steel', 'food');
      expect(ratio).toEqual({ input: 1, output: 5 });
    });

    it('returns 1:125 for trading down three eras', () => {
      // rocketFuel (era 4) -> food (era 1)
      const ratio = getTradeRatio('rocketFuel', 'food');
      expect(ratio).toEqual({ input: 1, output: 125 });
    });

    it('returns null for unknown resources', () => {
      expect(getTradeRatio('nonexistent', 'food')).toBeNull();
      expect(getTradeRatio('food', 'nonexistent')).toBeNull();
    });
  });

  describe('executeTrade', () => {
    it('returns null if era < 4', () => {
      let state = makeState({ era: 3 });
      state = withUnlocked(state, 'food', 100);
      state = withUnlocked(state, 'materials', 0);
      const result = executeTrade(state, 'food', 'materials', 10);
      expect(result).toBeNull();
    });

    it('returns null for same resource', () => {
      let state = makeState();
      state = withUnlocked(state, 'food', 100);
      expect(executeTrade(state, 'food', 'food', 10)).toBeNull();
    });

    it('returns null for zero or negative amount', () => {
      let state = makeState();
      state = withUnlocked(state, 'food', 100);
      state = withUnlocked(state, 'materials', 0);
      expect(executeTrade(state, 'food', 'materials', 0)).toBeNull();
      expect(executeTrade(state, 'food', 'materials', -5)).toBeNull();
    });

    it('returns null if from resource is locked', () => {
      let state = makeState();
      state = withUnlocked(state, 'materials', 0);
      // steel is locked by default
      expect(executeTrade(state, 'steel', 'materials', 1)).toBeNull();
    });

    it('returns null if to resource is locked', () => {
      let state = makeState();
      state = withUnlocked(state, 'food', 100);
      // steel is locked by default
      expect(executeTrade(state, 'food', 'steel', 1)).toBeNull();
    });

    it('returns null if cannot afford', () => {
      let state = makeState();
      state = withUnlocked(state, 'food', 5);
      state = withUnlocked(state, 'materials', 0);
      // same era 1:1, want 10 but only have 5
      expect(executeTrade(state, 'food', 'materials', 10)).toBeNull();
    });

    it('trades same-era resources 1:1', () => {
      let state = makeState();
      state = withUnlocked(state, 'food', 50);
      state = withUnlocked(state, 'materials', 10);
      const result = executeTrade(state, 'food', 'materials', 20);
      expect(result).not.toBeNull();
      expect(result.resources.food.amount).toBe(30);
      expect(result.resources.materials.amount).toBe(30);
    });

    it('trades up at 4:1 per era difference', () => {
      let state = makeState();
      state = withUnlocked(state, 'materials', 100); // era 1
      state = withUnlocked(state, 'steel', 0);       // era 2
      // 1 era diff up: 4:1. Want 5 steel, costs 20 materials.
      const result = executeTrade(state, 'materials', 'steel', 5);
      expect(result).not.toBeNull();
      expect(result.resources.materials.amount).toBe(80);
      expect(result.resources.steel.amount).toBe(5);
    });

    it('trades down at 1:5 per era difference', () => {
      let state = makeState();
      state = withUnlocked(state, 'steel', 10);      // era 2
      state = withUnlocked(state, 'materials', 0);   // era 1
      // 1 era diff down: 1:5. Trade 2 steel for 10 materials.
      const result = executeTrade(state, 'steel', 'materials', 10);
      expect(result).not.toBeNull();
      expect(result.resources.steel.amount).toBe(8);
      expect(result.resources.materials.amount).toBe(10);
    });

    it('does not mutate original state', () => {
      let state = makeState();
      state = withUnlocked(state, 'food', 50);
      state = withUnlocked(state, 'materials', 10);
      const original = JSON.parse(JSON.stringify(state));
      executeTrade(state, 'food', 'materials', 20);
      expect(state).toEqual(original);
    });

    it('handles multi-era trade up correctly', () => {
      let state = makeState();
      state = withUnlocked(state, 'food', 10000);         // era 1
      state = withUnlocked(state, 'rocketFuel', 0);       // era 4
      // 3 era diff up: 64:1. Want 3 rocketFuel, costs 192 food.
      const result = executeTrade(state, 'food', 'rocketFuel', 3);
      expect(result).not.toBeNull();
      expect(result.resources.food.amount).toBe(9808);
      expect(result.resources.rocketFuel.amount).toBe(3);
    });

    it('returns null for nonexistent resources', () => {
      const state = makeState();
      expect(executeTrade(state, 'unobtanium', 'food', 1)).toBeNull();
    });
  });
});
