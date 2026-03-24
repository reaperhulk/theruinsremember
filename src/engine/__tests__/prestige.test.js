import { describe, it, expect } from 'vitest';
import { calculatePrestigeBonus, performPrestige, getPrestigeSummary, calculatePrestigePoints, purchasePrestigeUpgrade, hasPrestigeUpgrade, getPrestigeShop } from '../prestige.js';
import { createInitialState } from '../state.js';

describe('prestige', () => {
  it('calculates bonus based on era (base component)', () => {
    const state = createInitialState();
    state.era = 8;
    // 1 + era*0.3 + upgrades*0.02 + tech*0.05 + gems*0.01
    // = 1 + 2.4 + 0 + 0 + 0 = 3.4
    expect(calculatePrestigeBonus(state)).toBeCloseTo(3.4);
  });

  it('includes upgrade and tech bonuses', () => {
    const state = createInitialState();
    state.era = 2;
    state.upgrades = { tools: true, irrigation: true }; // 2 upgrades
    state.tech = { metallurgy: true }; // 1 tech
    // 1 + 2*0.3 + 2*0.02 + 1*0.05 + 0 = 1 + 0.6 + 0.04 + 0.05 = 1.69
    expect(calculatePrestigeBonus(state)).toBeCloseTo(1.69);
  });

  it('caps prestige bonus at 10x', () => {
    const state = createInitialState();
    state.era = 10;
    state.upgrades = {};
    for (let i = 0; i < 200; i++) state.upgrades[`fake${i}`] = true;
    state.tech = {};
    for (let i = 0; i < 50; i++) state.tech[`fakeTech${i}`] = true;
    state.totalGems = 500;
    // Without cap: 1 + 10*0.3 + 200*0.02 + 50*0.05 + 500*0.01 = 1+3+4+2.5+5 = 15.5
    // Should be capped to 10
    expect(calculatePrestigeBonus(state)).toBe(10);
  });

  it('includes gem bonus', () => {
    const state = createInitialState();
    state.era = 1;
    state.totalGems = 10;
    // 1 + 0.3 + 0 + 0 + 10*0.01 = 1.4
    expect(calculatePrestigeBonus(state)).toBeCloseTo(1.4);
  });

  it('resets state with increased multiplier (additive)', () => {
    const state = createInitialState();
    state.era = 4;
    state.resources.food.amount = 100;
    const after = performPrestige(state);
    expect(after.era).toBe(1);
    expect(after.resources.food.amount).toBe(0);
    // bonus = 1 + 4*0.3 = 2.2, mult = 1 + 2.2 = 3.2 (additive)
    expect(after.prestigeMultiplier).toBeCloseTo(3.2);
  });

  it('tracks prestige count and lifetime stats', () => {
    const state = createInitialState();
    state.era = 4;
    state.totalTime = 100;
    state.totalGems = 5;
    state.totalTrades = 3;
    const after = performPrestige(state);
    expect(after.prestigeCount).toBe(1);
    expect(after.lifetimeHighestEra).toBe(4);
    expect(after.lifetimeGems).toBe(5);
    expect(after.lifetimeTrades).toBe(3);
    expect(after.lifetimePlayTime).toBe(100);
  });

  it('accumulates lifetime stats across prestiges', () => {
    const state = createInitialState();
    state.era = 3;
    state.totalTime = 50;
    state.totalGems = 2;
    state.prestigeCount = 1;
    state.lifetimeHighestEra = 5;
    state.lifetimeGems = 10;
    state.lifetimePlayTime = 200;
    const after = performPrestige(state);
    expect(after.prestigeCount).toBe(2);
    expect(after.lifetimeHighestEra).toBe(5); // max(3, 5) = 5
    expect(after.lifetimeGems).toBe(12);
    expect(after.lifetimePlayTime).toBe(250);
  });

  it('getPrestigeSummary provides preview info', () => {
    const state = createInitialState();
    state.era = 6;
    state.prestigeMultiplier = 2;
    const summary = getPrestigeSummary(state);
    expect(summary.currentMultiplier).toBe(2);
    expect(summary.bonus).toBeCloseTo(2.8); // 1 + 6*0.3
    expect(summary.newMultiplier).toBeCloseTo(4.8); // 2 + 2.8 (additive)
    expect(summary.prestigeCount).toBe(1);
  });

  describe('prestige points', () => {
    it('gives no points before era 7', () => {
      const state = createInitialState();
      state.era = 6;
      expect(calculatePrestigePoints(state)).toBe(0);
    });

    it('calculates points based on era reached', () => {
      const state = createInitialState();
      state.era = 7;
      // Era 7 = 5 points (no upgrades, no mini-games)
      expect(calculatePrestigePoints(state)).toBe(5);
    });

    it('gives graduated points for deep eras', () => {
      const state = createInitialState();
      state.era = 10;
      // Era 7=5, 8=+7, 9=+9, 10=+9 = 30 (no upgrades, no mini-games)
      expect(calculatePrestigePoints(state)).toBe(30);
    });
  });

  describe('prestige shop', () => {
    it('purchases a prestige upgrade', () => {
      const state = createInitialState();
      state.prestigePoints = 5;
      const after = purchasePrestigeUpgrade(state, 'luckyMiner');
      expect(after).not.toBeNull();
      expect(after.prestigePoints).toBe(3); // 5 - 2
      expect(hasPrestigeUpgrade(after, 'luckyMiner')).toBe(true);
    });

    it('rejects purchase without enough points', () => {
      const state = createInitialState();
      state.prestigePoints = 1;
      expect(purchasePrestigeUpgrade(state, 'luckyMiner')).toBeNull();
    });

    it('rejects duplicate purchase', () => {
      const state = createInitialState();
      state.prestigePoints = 10;
      state.prestigeUpgrades = { luckyMiner: true };
      expect(purchasePrestigeUpgrade(state, 'luckyMiner')).toBeNull();
    });

    it('getPrestigeShop shows owned and affordable status', () => {
      const state = createInitialState();
      state.prestigePoints = 3;
      state.prestigeUpgrades = { luckyMiner: true };
      const shop = getPrestigeShop(state);
      const lucky = shop.find(u => u.id === 'luckyMiner');
      expect(lucky.owned).toBe(true);
      const fast = shop.find(u => u.id === 'fastStart');
      expect(fast.owned).toBe(false);
      expect(fast.affordable).toBe(true); // costs 3, have 3
    });
  });

  describe('prestige upgrade effects', () => {
    it('Fast Start auto-purchases era 1 upgrades', () => {
      const state = createInitialState();
      state.era = 10;
      state.prestigeUpgrades = { fastStart: true };
      const after = performPrestige(state);
      expect(after.upgrades.tools).toBe(true);
      expect(after.upgrades.irrigation).toBe(true);
      expect(after.upgrades.basicPower).toBe(true);
      expect(after.upgrades.housing).toBe(true);
      expect(after.upgrades.foundry).toBe(true);
      expect(after.upgrades.advancedTools).toBe(true);
      // Effects should be applied — rateMult should be > 1 from era 1 upgrades
      expect(after.resources.materials.rateMult).toBeGreaterThan(1);
    });

    it('Quantum Memory keeps 10% of resources', () => {
      const state = createInitialState();
      state.era = 10;
      state.resources.food.amount = 1000;
      state.prestigeUpgrades = { quantumMemory: true };
      const after = performPrestige(state);
      // Starts with 0 + 10% of 1000 = 100
      expect(after.resources.food.amount).toBe(100);
    });

    it('Head Start adds 50% of multiplier', () => {
      const state = createInitialState();
      state.era = 4;
      state.prestigeUpgrades = { headStart: true };
      const bonus = calculatePrestigeBonus(state); // 2.2
      const newMult = state.prestigeMultiplier + bonus; // 1 + 2.2 = 3.2
      const after = performPrestige(state);
      // headStart adds 50% of newMult: 3.2 + 3.2*0.5 = 4.8
      expect(after.prestigeMultiplier).toBeCloseTo(newMult + newMult * 0.5);
    });

    it('Deep Pockets triples all caps', () => {
      const state = createInitialState();
      state.era = 10;
      state.prestigeUpgrades = { deepPockets: true };
      const after = performPrestige(state);
      expect(after.resources.food.capMult).toBe(3);
      expect(after.resources.labor.capMult).toBe(3);
    });

    it('prestige upgrades persist across resets', () => {
      const state = createInitialState();
      state.era = 10;
      state.prestigeUpgrades = { luckyMiner: true, fastStart: true };
      const after = performPrestige(state);
      expect(after.prestigeUpgrades.luckyMiner).toBe(true);
      expect(after.prestigeUpgrades.fastStart).toBe(true);
    });
  });
});
