import { describe, it, expect } from 'vitest';
import { checkEraTransition, transitionEra, getMinUpgradesForEra, countEraUpgrades } from '../eras.js';
import { createInitialState } from '../state.js';
import { upgrades as upgradeDefs } from '../../data/upgrades.js';

describe('eras', () => {
  describe('getMinUpgradesForEra', () => {
    it('returns configured minimum per era', () => {
      expect(getMinUpgradesForEra(1)).toBe(10);
      expect(getMinUpgradesForEra(5)).toBe(18);
      expect(getMinUpgradesForEra(10)).toBe(25);
    });
  });

  describe('countEraUpgrades', () => {
    it('returns 0 when no upgrades purchased', () => {
      const state = createInitialState();
      expect(countEraUpgrades(state, 1)).toBe(0);
    });

    it('counts only upgrades belonging to the specified era', () => {
      const state = createInitialState();
      // Find some era 1 upgrades from the data
      const era1Upgrades = Object.values(upgradeDefs).filter(u => u.era === 1);
      const era2Upgrades = Object.values(upgradeDefs).filter(u => u.era === 2);

      // Purchase two era 1 upgrades and one era 2 upgrade
      if (era1Upgrades.length >= 2) {
        state.upgrades[era1Upgrades[0].id] = true;
        state.upgrades[era1Upgrades[1].id] = true;
      }
      if (era2Upgrades.length >= 1) {
        state.upgrades[era2Upgrades[0].id] = true;
      }

      expect(countEraUpgrades(state, 1)).toBe(2);
      expect(countEraUpgrades(state, 2)).toBe(1);
    });
  });

  describe('checkEraTransition', () => {
    it('returns null when no era-granting tech is unlocked', () => {
      const state = createInitialState();
      expect(checkEraTransition(state)).toBeNull();
    });

    it('returns null when gating tech is unlocked but not enough upgrades', () => {
      const state = createInitialState();
      state.tech.industrialRevolution = true;
      // No upgrades purchased — need 3 for era 1
      expect(checkEraTransition(state)).toBeNull();
    });

    it('returns next era when gating tech is unlocked and enough upgrades purchased', () => {
      const state = createInitialState();
      state.tech.industrialRevolution = true;
      // Purchase 10 era 1 upgrades to meet the minimum
      const era1Upgrades = Object.values(upgradeDefs).filter(u => u.era === 1);
      for (let i = 0; i < 10 && i < era1Upgrades.length; i++) {
        state.upgrades[era1Upgrades[i].id] = true;
      }
      expect(checkEraTransition(state)).toBe(2);
    });

    it('returns null when upgrades are from wrong era', () => {
      const state = createInitialState();
      state.tech.industrialRevolution = true;
      // Purchase era 2 upgrades instead of era 1
      const era2Upgrades = Object.values(upgradeDefs).filter(u => u.era === 2);
      for (let i = 0; i < 10 && i < era2Upgrades.length; i++) {
        state.upgrades[era2Upgrades[i].id] = true;
      }
      expect(checkEraTransition(state)).toBeNull();
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
