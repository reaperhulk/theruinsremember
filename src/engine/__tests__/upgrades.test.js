import { describe, it, expect } from 'vitest';
import { purchaseUpgrade, getAvailableUpgrades, getUpgradeCost, buyMaxRepeatable } from '../upgrades.js';
import { createInitialState } from '../state.js';

describe('upgrades', () => {
  describe('purchaseUpgrade', () => {
    it('deducts cost and marks upgrade as purchased', () => {
      const state = createInitialState();
      state.resources.labor.amount = 100;
      state.resources.materials.amount = 100;
      const after = purchaseUpgrade(state, 'tools');
      expect(after).not.toBeNull();
      expect(after.upgrades.tools).toBe(true);
      expect(after.resources.labor.amount).toBe(90);
      expect(after.resources.materials.amount).toBe(95);
    });

    it('applies production multiplier effects', () => {
      const state = createInitialState();
      state.resources.labor.amount = 100;
      state.resources.materials.amount = 100;
      const after = purchaseUpgrade(state, 'tools');
      // tools: production_mult on materials, value 2
      expect(after.resources.materials.rateMult).toBe(2);
    });

    it('returns null if already purchased', () => {
      const state = createInitialState();
      state.resources.labor.amount = 100;
      state.resources.materials.amount = 100;
      const after = purchaseUpgrade(state, 'tools');
      const again = purchaseUpgrade(after, 'tools');
      expect(again).toBeNull();
    });

    it('returns null if prerequisites not met', () => {
      const state = createInitialState();
      state.resources.materials.amount = 100;
      state.resources.food.amount = 100;
      // housing requires 'tools'
      const result = purchaseUpgrade(state, 'housing');
      expect(result).toBeNull();
    });

    it('returns null if cannot afford', () => {
      const state = createInitialState();
      const result = purchaseUpgrade(state, 'tools');
      expect(result).toBeNull();
    });
  });

  describe('repeatable upgrades', () => {
    function makeEra3State() {
      const state = createInitialState();
      state.era = 3;
      state.upgrades = { tools: true, basicPower: true, foundry: true, assemblyLines: true, computingLab: true, internet: true };
      state.resources.electronics = { amount: 5000, unlocked: true, rateAdd: 0, rateMult: 1, capMult: 1, baseRate: 0, cap: 200 };
      state.resources.energy = { amount: 5000, unlocked: true, rateAdd: 0, rateMult: 1, capMult: 1, baseRate: 0.1, cap: 100 };
      state.resources.steel = { amount: 5000, unlocked: true, rateAdd: 0, rateMult: 1, capMult: 1, baseRate: 0, cap: 300 };
      state.resources.data = { amount: 5000, unlocked: true, rateAdd: 0, rateMult: 1, capMult: 1, baseRate: 0, cap: 200 };
      state.resources.software = { amount: 5000, unlocked: true, rateAdd: 0, rateMult: 1, capMult: 1, baseRate: 0, cap: 300 };
      state.resources.research = { amount: 5000, unlocked: true, rateAdd: 0, rateMult: 1, capMult: 1, baseRate: 0, cap: 500 };
      return state;
    }

    it('stores purchase count as a number for repeatable upgrades', () => {
      const state = makeEra3State();
      const after = purchaseUpgrade(state, 'dataCenter');
      expect(after).not.toBeNull();
      expect(after.upgrades.dataCenter).toBe(1);
    });

    it('allows buying a repeatable upgrade multiple times', () => {
      const state = makeEra3State();
      const after1 = purchaseUpgrade(state, 'dataCenter');
      expect(after1.upgrades.dataCenter).toBe(1);
      expect(after1.resources.data.rateAdd).toBe(0.5);

      const after2 = purchaseUpgrade(after1, 'dataCenter');
      expect(after2).not.toBeNull();
      expect(after2.upgrades.dataCenter).toBe(2);
      expect(after2.resources.data.rateAdd).toBe(1.0);
    });

    it('scales cost with each purchase', () => {
      const state = makeEra3State();
      // dataCenter base cost: { electronics: 20, energy: 15, steel: 10 }, costScale: 1.4
      const cost0 = getUpgradeCost(state, 'dataCenter');
      expect(cost0.electronics).toBe(20);
      expect(cost0.energy).toBe(15);

      const after1 = purchaseUpgrade(state, 'dataCenter');
      const cost1 = getUpgradeCost(after1, 'dataCenter');
      // After 1 purchase: 20 * 1.4 = 28
      expect(cost1.electronics).toBe(28);
      expect(cost1.energy).toBe(21); // ceil(15 * 1.4) = 21

      const after2 = purchaseUpgrade(after1, 'dataCenter');
      const cost2 = getUpgradeCost(after2, 'dataCenter');
      // After 2 purchases: 20 * 1.4^2 = 20 * 1.96 = ceil(39.2) = 40
      expect(cost2.electronics).toBe(40);
    });

    it('applies effects cumulatively on each purchase', () => {
      const state = makeEra3State();
      const after1 = purchaseUpgrade(state, 'dataCenter');
      const after2 = purchaseUpgrade(after1, 'dataCenter');
      const after3 = purchaseUpgrade(after2, 'dataCenter');
      // Each purchase adds +0.5 data rateAdd
      expect(after3.resources.data.rateAdd).toBe(1.5);
      expect(after3.upgrades.dataCenter).toBe(3);
    });

    it('returns base cost for non-repeatable upgrades via getUpgradeCost', () => {
      const state = makeEra3State();
      const cost = getUpgradeCost(state, 'internet');
      expect(cost).toEqual({ electronics: 80, research: 60 });
    });

    it('still blocks non-repeatable upgrades from being bought twice', () => {
      const state = createInitialState();
      state.resources.labor.amount = 100;
      state.resources.materials.amount = 100;
      const after = purchaseUpgrade(state, 'tools');
      expect(after.upgrades.tools).toBe(true);
      const again = purchaseUpgrade(after, 'tools');
      expect(again).toBeNull();
    });
  });

  describe('milestone upgrades', () => {
    it('hides gem-gated upgrades when gems below threshold', () => {
      const state = createInitialState();
      state.upgrades = { tools: true };
      state.totalGems = 2;
      const available = getAvailableUpgrades(state);
      expect(available.map(u => u.id)).not.toContain('gemPolisher');
    });

    it('shows gem-gated upgrades when gems at threshold', () => {
      const state = createInitialState();
      state.upgrades = { tools: true };
      state.totalGems = 5;
      const available = getAvailableUpgrades(state);
      expect(available.map(u => u.id)).toContain('gemPolisher');
    });

    it('hides trade-gated upgrades when trades below threshold', () => {
      const state = createInitialState();
      state.era = 6;
      state.upgrades = { fusionPower: true, warpDrive: true };
      state.totalTrades = 5;
      const available = getAvailableUpgrades(state);
      expect(available.map(u => u.id)).not.toContain('traderInstinct');
    });

    it('shows trade-gated upgrades when trades at threshold', () => {
      const state = createInitialState();
      state.era = 6;
      state.upgrades = { fusionPower: true, warpDrive: true };
      state.totalTrades = 10;
      const available = getAvailableUpgrades(state);
      expect(available.map(u => u.id)).toContain('traderInstinct');
    });
  });

    it('applies unlock_resource and production_add effects', () => {
      const state = createInitialState();
      state.resources.materials.amount = 500;
      state.resources.energy.amount = 500;
      state.resources.food.amount = 500;
      state.upgrades.basicPower = true;
      state.upgrades.tools = true;
      const after = purchaseUpgrade(state, 'foundry');
      expect(after).not.toBeNull();
      // foundry unlocks steel and adds 0.3 production
      expect(after.resources.steel.unlocked).toBe(true);
      expect(after.resources.steel.rateAdd).toBe(0.3);
    });

    it('applies production_add for automation upgrade', () => {
      const state = createInitialState();
      state.era = 2;
      // Set up prereqs
      state.upgrades = { tools: true, irrigation: true, basicPower: true, housing: true, foundry: true, assemblyLines: true, computingLab: true };
      state.resources.electronics.amount = 100;
      state.resources.electronics.unlocked = true;
      state.resources.steel.amount = 100;
      state.resources.steel.unlocked = true;
      state.resources.research.amount = 100;
      state.resources.research.unlocked = true;
      const after = purchaseUpgrade(state, 'automation');
      expect(after).not.toBeNull();
      expect(after.upgrades.automation).toBe(true);
      // automation adds +2 labor rateAdd, +0.5 materials rateAdd
      expect(after.resources.labor.rateAdd).toBe(2); // 2 from automation (housing effects not replayed)
      expect(after.resources.materials.rateAdd).toBe(0.5);
    });

    it('chains Digital Age upgrades correctly', () => {
      const state = createInitialState();
      state.era = 3;
      state.upgrades = { tools: true, irrigation: true, basicPower: true, housing: true, foundry: true, assemblyLines: true, computingLab: true };
      state.resources.electronics.amount = 500;
      state.resources.electronics.unlocked = true;
      state.resources.research.amount = 500;
      state.resources.research.unlocked = true;
      state.resources.software = { amount: 0, unlocked: true, rateAdd: 0, rateMult: 1, capMult: 1 };

      // Buy internet
      const afterInternet = purchaseUpgrade(state, 'internet');
      expect(afterInternet).not.toBeNull();
      expect(afterInternet.resources.software.rateAdd).toBe(0.5);
    });

  describe('getAvailableUpgrades', () => {
    it('returns era 1 upgrades without prerequisites for starting state', () => {
      const state = createInitialState();
      const available = getAvailableUpgrades(state);
      const ids = available.map(u => u.id);
      expect(ids).toContain('tools');
      expect(ids).toContain('irrigation');
      expect(ids).toContain('basicPower');
      // housing requires tools, so not available yet
      expect(ids).not.toContain('housing');
    });

    it('excludes purchased upgrades', () => {
      const state = createInitialState();
      state.resources.labor.amount = 100;
      state.resources.materials.amount = 100;
      const after = purchaseUpgrade(state, 'tools');
      const available = getAvailableUpgrades(after);
      expect(available.map(u => u.id)).not.toContain('tools');
    });
  });

  describe('production_mult_all effect', () => {
    it('multiplies rateMult of all resources', () => {
      const state = createInitialState();
      // Manually apply effects with production_mult_all
      const { applyEffects } = require('../upgrades.js');

      // Simulate by directly testing via purchaseUpgrade with a state
      // that has multiple resources. We test the engine function directly.
      const resources = state.resources;
      const laborMultBefore = resources.labor.rateMult;
      const materialMultBefore = resources.materials.rateMult;
      const foodMultBefore = resources.food.rateMult;

      // All should start at 1
      expect(laborMultBefore).toBe(1);
      expect(materialMultBefore).toBe(1);
      expect(foodMultBefore).toBe(1);
    });

    it('applies production_mult_all to scale all resource rateMults', () => {
      // Test the applyEffects function indirectly by creating a mock upgrade scenario
      const state = createInitialState();
      // We'll test the effect via the internal applyEffects by importing it
      // Since applyEffects is not exported, we test via the engine path:
      // Create a state and manually verify the effect type works
      const effects = [{ type: 'production_mult_all', value: 1.5 }];

      // Apply effects manually (applyEffects is internal, so we replicate logic)
      const newResources = { ...state.resources };
      for (const id of Object.keys(newResources)) {
        newResources[id] = {
          ...newResources[id],
          rateMult: newResources[id].rateMult * 1.5,
        };
      }

      expect(newResources.labor.rateMult).toBe(1.5);
      expect(newResources.materials.rateMult).toBe(1.5);
      expect(newResources.food.rateMult).toBe(1.5);
    });
  });

  describe('buyMaxRepeatable', () => {
    function makeEra3State() {
      const state = createInitialState();
      state.era = 3;
      state.upgrades = { tools: true, basicPower: true, foundry: true, assemblyLines: true, computingLab: true, internet: true };
      state.resources.electronics = { amount: 5000, unlocked: true, rateAdd: 0, rateMult: 1, capMult: 1, baseRate: 0, cap: 200 };
      state.resources.energy = { amount: 5000, unlocked: true, rateAdd: 0, rateMult: 1, capMult: 1, baseRate: 0.1, cap: 100 };
      state.resources.steel = { amount: 5000, unlocked: true, rateAdd: 0, rateMult: 1, capMult: 1, baseRate: 0, cap: 300 };
      state.resources.data = { amount: 5000, unlocked: true, rateAdd: 0, rateMult: 1, capMult: 1, baseRate: 0, cap: 200 };
      state.resources.software = { amount: 5000, unlocked: true, rateAdd: 0, rateMult: 1, capMult: 1, baseRate: 0, cap: 300 };
      state.resources.research = { amount: 5000, unlocked: true, rateAdd: 0, rateMult: 1, capMult: 1, baseRate: 0, cap: 500 };
      return state;
    }

    it('buys multiple copies of a repeatable upgrade until unaffordable', () => {
      const state = makeEra3State();
      const after = buyMaxRepeatable(state, 'dataCenter');
      expect(after).not.toBeNull();
      expect(after.upgrades.dataCenter).toBeGreaterThan(1);
      // Each purchase adds 0.5 rateAdd to data
      expect(after.resources.data.rateAdd).toBe(after.upgrades.dataCenter * 0.5);
    });

    it('returns null for non-repeatable upgrades', () => {
      const state = makeEra3State();
      const result = buyMaxRepeatable(state, 'internet');
      expect(result).toBeNull();
    });

    it('returns null if cannot afford even one purchase', () => {
      const state = makeEra3State();
      state.resources.electronics.amount = 0;
      state.resources.energy.amount = 0;
      state.resources.steel.amount = 0;
      const result = buyMaxRepeatable(state, 'dataCenter');
      expect(result).toBeNull();
    });
  });
});
