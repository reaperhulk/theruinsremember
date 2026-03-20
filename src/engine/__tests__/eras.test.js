import { describe, it, expect } from 'vitest';
import { checkEraTransition, transitionEra } from '../eras.js';
import { createInitialState } from '../state.js';

describe('eras', () => {
  describe('checkEraTransition', () => {
    it('returns null when no era-granting tech is unlocked', () => {
      const state = createInitialState();
      expect(checkEraTransition(state)).toBeNull();
    });

    it('returns next era when gating tech is unlocked', () => {
      const state = createInitialState();
      state.tech.industrialRevolution = true;
      expect(checkEraTransition(state)).toBe(2);
    });

    it('returns null at max era', () => {
      const state = createInitialState();
      state.era = 10;
      expect(checkEraTransition(state)).toBeNull();
    });
  });

  describe('transitionEra', () => {
    it('unlocks resources for the new era', () => {
      const state = createInitialState();
      const after = transitionEra(state, 2);
      expect(after.era).toBe(2);
      expect(after.resources.steel.unlocked).toBe(true);
      expect(after.resources.electronics.unlocked).toBe(true);
      expect(after.resources.research.unlocked).toBe(true);
    });

    it('does not downgrade era', () => {
      const state = createInitialState();
      state.era = 3;
      const after = transitionEra(state, 2);
      expect(after.era).toBe(3);
    });
  });
});
