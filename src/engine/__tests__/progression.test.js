import { describe, it, expect } from 'vitest';
import { createInitialState } from '../state.js';
import { tick } from '../tick.js';
import { purchaseUpgrade, getUpgradeCost } from '../upgrades.js';
import { unlockTech, getTechCost } from '../tech.js';
import { upgrades as upgradeDefs } from '../../data/upgrades.js';
import { techTree } from '../../data/tech-tree.js';
import { getMinUpgradesForEra } from '../eras.js';

// Helper: give enough resources to buy something, then buy it
function giveAndBuy(state, type, id) {
  const defs = type === 'upgrade' ? upgradeDefs : techTree;
  const def = defs[id];
  if (!def) throw new Error(`Unknown ${type}: ${id}`);

  // Get the actual (era-scaled) cost
  const cost = type === 'upgrade' ? getUpgradeCost(state, id) : getTechCost(def);

  // Give enough resources
  const newRes = { ...state.resources };
  for (const [resId, amount] of Object.entries(cost)) {
    if (newRes[resId]) {
      newRes[resId] = { ...newRes[resId], amount: newRes[resId].amount + amount + 10, unlocked: true };
    }
  }
  const withRes = { ...state, resources: newRes };

  if (type === 'upgrade') return purchaseUpgrade(withRes, id);
  return unlockTech(withRes, id);
}

describe('progression integration', () => {
  it('can progress from Era 1 to Era 2 via upgrades and tech', () => {
    let state = createInitialState();
    state.totalGems = 1; // mini-game engagement

    // Buy enough era 1 upgrades to meet the minimum (30)
    const era1Upgrades = Object.values(upgradeDefs).filter(u => u.era === 1);
    const minRequired = getMinUpgradesForEra(1);
    for (let i = 0; i < minRequired && i < era1Upgrades.length; i++) {
      state.upgrades[era1Upgrades[i].id] = true;
    }

    // Buy metallurgy tech
    state = giveAndBuy(state, 'tech', 'metallurgy');
    // Buy industrial revolution to transition
    state = giveAndBuy(state, 'tech', 'industrialRevolution');

    // Tick enough time to pass era min time gate, then trigger transition
    state = tick(state, 300);
    expect(state.era).toBe(2);
  });

  it('can progress from Era 2 to Era 3 (Digital Age)', () => {
    let state = createInitialState();
    state.era = 2;
    state.totalTime = 600; // ensure min time-in-era is met
    state.eraStartTime = 0;
    state.totalGems = 1; // mini-game engagement
    // Mark era 1 upgrades as done
    state.upgrades = { tools: true, irrigation: true, basicPower: true, housing: true, foundry: true };
    state.tech = { metallurgy: true, industrialRevolution: true };
    // Unlock era 2 resources
    state.resources.steel = { ...state.resources.steel, unlocked: true, rateAdd: 0.3, rateMult: 1 };
    state.resources.electronics = { ...state.resources.electronics, unlocked: true, rateAdd: 0, rateMult: 1 };
    state.resources.research = { ...state.resources.research, unlocked: true, rateAdd: 0, rateMult: 1 };

    // Buy enough era 2 upgrades to meet the minimum (35)
    const era2Upgrades = Object.values(upgradeDefs).filter(u => u.era === 2);
    const minRequired = getMinUpgradesForEra(2);
    for (let i = 0; i < minRequired && i < era2Upgrades.length; i++) {
      state.upgrades[era2Upgrades[i].id] = true;
    }

    // Buy tech to transition
    state = giveAndBuy(state, 'tech', 'advancedComputing');
    state = giveAndBuy(state, 'tech', 'digitalRevolution');

    state = tick(state, 0.1);
    expect(state.era).toBe(3);

    // Digital Age resources should be unlocked
    expect(state.resources.software.unlocked).toBe(true);
    expect(state.resources.data.unlocked).toBe(true);
  });

  it('can progress from Era 3 (Digital Age) to Era 4 (Space Age)', () => {
    let state = createInitialState();
    state.era = 3;
    state.totalTime = 600; // ensure min time-in-era is met
    state.eraStartTime = 0;
    state.totalGems = 1; // mini-game engagement
    state.upgrades = { tools: true, irrigation: true, basicPower: true, housing: true, foundry: true, assemblyLines: true, powerGrid: true, computingLab: true };
    state.tech = { metallurgy: true, industrialRevolution: true, advancedComputing: true, digitalRevolution: true };
    state.resources.software = { amount: 0, unlocked: true, rateAdd: 0, rateMult: 1, capMult: 1 };
    state.resources.data = { amount: 0, unlocked: true, rateAdd: 0, rateMult: 1, capMult: 1 };
    state.resources.electronics = { ...state.resources.electronics, unlocked: true, rateAdd: 0.3 };
    state.resources.research = { ...state.resources.research, unlocked: true, rateAdd: 0.5 };

    // Buy enough era 3 upgrades to meet the minimum (35)
    const era3Upgrades = Object.values(upgradeDefs).filter(u => u.era === 3);
    const minRequired = getMinUpgradesForEra(3);
    for (let i = 0; i < minRequired && i < era3Upgrades.length; i++) {
      state.upgrades[era3Upgrades[i].id] = true;
    }

    // Buy tech to transition
    state = giveAndBuy(state, 'tech', 'globalNetwork');
    state = giveAndBuy(state, 'tech', 'spaceProgram');

    state = tick(state, 0.1);
    expect(state.era).toBe(4);
  });

  it('tick advances resources over time', () => {
    let state = createInitialState();
    const initialFood = state.resources.food.amount;

    // Tick 10 seconds
    state = tick(state, 10);
    // Food has baseRate 1.5, so should gain ~15
    expect(state.resources.food.amount).toBeCloseTo(initialFood + 15, 0);
  });

  it('events fire in era 3+', () => {
    let state = createInitialState();
    state.era = 3;
    state.resources.software = { amount: 0, unlocked: true, rateAdd: 0, rateMult: 1, capMult: 1 };
    state.resources.data = { amount: 0, unlocked: true, rateAdd: 0, rateMult: 1, capMult: 1 };

    // Tick many times with low rolls to trigger events
    let eventCount = 0;
    for (let i = 0; i < 100; i++) {
      const prev = (state.eventLog || []).length;
      state = tick(state, 1);
      if ((state.eventLog || []).length > prev) eventCount++;
    }
    // With 2% chance per second over 100 ticks, should get at least 1 event
    expect(eventCount).toBeGreaterThan(0);
  });
});
