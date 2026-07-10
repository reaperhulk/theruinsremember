import { describe, it, expect } from 'vitest';
import { checkEraTransition, transitionEra, getEraMastery, getEraReadiness, getMinUpgradesForEra, getMinTechsForEra, countEraUpgrades, countEraTechs } from '../eras.js';
import { createInitialState } from '../state.js';
import { upgrades as upgradeDefs } from '../../data/upgrades.js';

describe('eras', () => {
  describe('getMinUpgradesForEra', () => {
    it('returns configured minimum per era', () => {
      expect(getMinUpgradesForEra(1)).toBe(14);
      expect(getMinUpgradesForEra(5)).toBe(30);
      expect(getMinUpgradesForEra(10)).toBe(30);
    });
  });

  describe('getMinTechsForEra', () => {
    it('returns configured research depth per era', () => {
      expect(getMinTechsForEra(1)).toBe(2);
      expect(getMinTechsForEra(5)).toBe(4);
      expect(getMinTechsForEra(10)).toBe(0);
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

  describe('countEraTechs', () => {
    it('counts only tech from the specified era', () => {
      const state = createInitialState();
      state.tech.metallurgy = true;
      state.tech.industrialRevolution = true;
      state.tech.advancedComputing = true;

      expect(countEraTechs(state, 1)).toBe(2);
      expect(countEraTechs(state, 2)).toBe(1);
    });
  });

  it('counts distinct orbital operations toward the Era 4 foundation', () => {
    const state = createInitialState();
    state.era = 4;
    const era4Upgrades = Object.values(upgradeDefs).filter(upgrade => upgrade.era === 4);
    for (let index = 0; index < 12; index++) state.upgrades[era4Upgrades[index].id] = true;
    state.dockingMissions = { cargo: 1, crew: 1, science: 1 };

    const readiness = getEraReadiness(state);
    expect(readiness.operationCredits).toBe(9);
    expect(readiness.foundationProgress).toBe(21);
    expect(readiness.upgradesMet).toBe(true);
  });

  describe('era mastery', () => {
    it('recognizes direct system mastery in later eras', () => {
      const state = createInitialState();
      state.era = 7;
      state.dysonSegments = 30;

      expect(getEraMastery(state).completedDirectly).toBe(true);
      expect(getEraMastery(state).met).toBe(true);
    });

    it('provides an idle fallback without pretending the system was mastered', () => {
      const state = createInitialState();
      state.era = 7;
      state.eraStartTime = 100;
      state.totalTime = 700;

      expect(getEraMastery(state).completedDirectly).toBe(false);
      expect(getEraMastery(state).met).toBe(true);
      expect(getEraMastery(state).fallbackRemaining).toBe(0);
    });

    it('gives Expansion a different colony and route mastery path', () => {
      const state = createInitialState();
      state.cycleDoctrine = 'expansion';
      state.era = 5;
      state.colonyAssignments = { growth: 5, science: 0, industry: 0 };
      expect(getEraMastery(state).completedDirectly).toBe(true);

      state.era = 6;
      state.starRoutes = Array.from({ length: 7 }, (_, index) => ({ from: `a${index}`, to: `b${index}` }));
      expect(getEraMastery(state).target).toBe(7);
      expect(getEraMastery(state).completedDirectly).toBe(true);
    });

    it('gives Transcendence shorter late-operation mastery paths', () => {
      const state = createInitialState();
      state.cycleDoctrine = 'transcendence';
      state.era = 8;
      state.totalWeaves = 2;
      expect(getEraMastery(state).completedDirectly).toBe(true);

      state.era = 9;
      state.tuningScore = 30;
      expect(getEraMastery(state).completedDirectly).toBe(true);
    });
  });

  it('lets Reconstruction substitute more discoveries for early build-out', () => {
    const state = createInitialState();
    state.cycleDoctrine = 'reconstruction';
    state.expedition.eraFinds = 3;
    const era1Upgrades = Object.values(upgradeDefs).filter(upgrade => upgrade.era === 1);
    for (let index = 0; index < 5; index++) state.upgrades[era1Upgrades[index].id] = true;

    const readiness = getEraReadiness(state);
    expect(readiness.discoveryCredits).toBe(9);
    expect(readiness.minimumEconomicUpgrades).toBe(5);
    expect(readiness.upgradesMet).toBe(true);
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

    it('returns next era when gating tech is unlocked and enough upgrades and era research are purchased', () => {
      const state = createInitialState();
      state.tech.metallurgy = true;
      state.tech.industrialRevolution = true;
      // Purchase 14 era 1 upgrades to meet the minimum without expeditions
      const era1Upgrades = Object.values(upgradeDefs).filter(u => u.era === 1);
      for (let i = 0; i < 14 && i < era1Upgrades.length; i++) {
        state.upgrades[era1Upgrades[i].id] = true;
      }
      expect(checkEraTransition(state)).toBe(2);
    });

    it('accepts a smaller economic build-out when expeditions supply discoveries', () => {
      const state = createInitialState();
      state.tech.metallurgy = true;
      state.tech.industrialRevolution = true;
      state.expedition.eraFinds = 4;
      const era1Upgrades = Object.values(upgradeDefs).filter(u => u.era === 1);
      for (let i = 0; i < 6; i++) state.upgrades[era1Upgrades[i].id] = true;

      expect(checkEraTransition(state)).toBe(2);
    });

    it('still requires a minimum economic foundation with many discoveries', () => {
      const state = createInitialState();
      state.tech.metallurgy = true;
      state.tech.industrialRevolution = true;
      state.expedition.eraFinds = 99;
      const era1Upgrades = Object.values(upgradeDefs).filter(u => u.era === 1);
      for (let i = 0; i < 5; i++) state.upgrades[era1Upgrades[i].id] = true;

      expect(checkEraTransition(state)).toBeNull();
    });

    it('returns null when gating tech is unlocked but era research depth is too low', () => {
      const state = createInitialState();
      state.tech.industrialRevolution = true;
      const era1Upgrades = Object.values(upgradeDefs).filter(u => u.era === 1);
      for (let i = 0; i < 14 && i < era1Upgrades.length; i++) {
        state.upgrades[era1Upgrades[i].id] = true;
      }
      expect(checkEraTransition(state)).toBeNull();
    });

    it('returns null when upgrades are from wrong era', () => {
      const state = createInitialState();
      state.tech.industrialRevolution = true;
      // Purchase era 2 upgrades instead of era 1
      const era2Upgrades = Object.values(upgradeDefs).filter(u => u.era === 2);
      for (let i = 0; i < 14 && i < era2Upgrades.length; i++) {
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
      expect(after.expedition.eraFinds).toBe(0);
      expect(after.expedition.supplies).toBeGreaterThanOrEqual(1);
    });

    it('unlocks reality fragments on entering era 9', () => {
      const state = createInitialState();
      state.era = 8;
      const after = transitionEra(state, 9);
      expect(after.era).toBe(9);
      expect(after.resources.realityFragments.unlocked).toBe(true);
    });

    it('does not downgrade era', () => {
      const state = createInitialState();
      state.era = 3;
      const after = transitionEra(state, 2);
      expect(after.era).toBe(3);
    });
  });
});
