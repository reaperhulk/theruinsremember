import { describe, it, expect } from 'vitest';
import { createInitialState } from '../state.js';
import { tick } from '../tick.js';
import { purchaseUpgrade, getAvailableUpgrades } from '../upgrades.js';
import { unlockTech, getAvailableTech } from '../tech.js';
import { canAfford } from '../resources.js';

// Helper: give enough resources to buy something, then buy it
function giveAndBuy(state, type, id) {
  const defs = type === 'upgrade'
    ? require('../../data/upgrades.js').upgrades
    : require('../../data/tech-tree.js').techTree;
  const def = defs[id];
  if (!def) throw new Error(`Unknown ${type}: ${id}`);

  // Give enough resources
  const newRes = { ...state.resources };
  for (const [resId, amount] of Object.entries(def.cost)) {
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

    // Buy era 1 upgrades in order
    state = giveAndBuy(state, 'upgrade', 'tools');
    expect(state.upgrades.tools).toBe(true);

    state = giveAndBuy(state, 'upgrade', 'irrigation');
    state = giveAndBuy(state, 'upgrade', 'basicPower');
    state = giveAndBuy(state, 'upgrade', 'housing');
    state = giveAndBuy(state, 'upgrade', 'foundry');

    // Foundry should unlock steel
    expect(state.resources.steel.unlocked).toBe(true);
    expect(state.resources.steel.rateAdd).toBeGreaterThan(0);

    // Buy metallurgy tech
    state = giveAndBuy(state, 'tech', 'metallurgy');
    // Buy industrial revolution to transition
    state = giveAndBuy(state, 'tech', 'industrialRevolution');

    // Tick to trigger era transition
    state = tick(state, 0.1);
    expect(state.era).toBe(2);
  });

  it('can progress from Era 2 to Era 3 (Digital Age)', () => {
    let state = createInitialState();
    state.era = 2;
    // Mark era 1 upgrades as done
    state.upgrades = { tools: true, irrigation: true, basicPower: true, housing: true, foundry: true };
    state.tech = { metallurgy: true, industrialRevolution: true };
    // Unlock era 2 resources
    state.resources.steel = { ...state.resources.steel, unlocked: true, rateAdd: 0.3, rateMult: 1 };
    state.resources.electronics = { ...state.resources.electronics, unlocked: true, rateAdd: 0, rateMult: 1 };
    state.resources.research = { ...state.resources.research, unlocked: true, rateAdd: 0, rateMult: 1 };

    // Buy era 2 upgrades (need at least 6 = era*3)
    state = giveAndBuy(state, 'upgrade', 'assemblyLines');
    expect(state.resources.electronics.rateAdd).toBeGreaterThan(0);

    state = giveAndBuy(state, 'upgrade', 'powerGrid');
    state = giveAndBuy(state, 'upgrade', 'computingLab');
    state = giveAndBuy(state, 'upgrade', 'automation');
    state = giveAndBuy(state, 'upgrade', 'steamTurbine');
    state = giveAndBuy(state, 'upgrade', 'industrialFarming');

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
    state.upgrades = { tools: true, irrigation: true, basicPower: true, housing: true, foundry: true, assemblyLines: true, powerGrid: true, computingLab: true };
    state.tech = { metallurgy: true, industrialRevolution: true, advancedComputing: true, digitalRevolution: true };
    state.resources.software = { amount: 0, unlocked: true, rateAdd: 0, rateMult: 1, capMult: 1 };
    state.resources.data = { amount: 0, unlocked: true, rateAdd: 0, rateMult: 1, capMult: 1 };
    state.resources.electronics = { ...state.resources.electronics, unlocked: true, rateAdd: 0.3 };
    state.resources.research = { ...state.resources.research, unlocked: true, rateAdd: 0.5 };

    // Buy Digital Age upgrades (need at least 9 = era*3)
    state = giveAndBuy(state, 'upgrade', 'internet');
    state = giveAndBuy(state, 'upgrade', 'cloudComputing');
    state = giveAndBuy(state, 'upgrade', 'openSource');
    state = giveAndBuy(state, 'upgrade', 'dataCenter');
    state = giveAndBuy(state, 'upgrade', 'aiResearch');
    state = giveAndBuy(state, 'upgrade', 'cyberSecurity');
    state = giveAndBuy(state, 'upgrade', 'quantumComputing');
    state = giveAndBuy(state, 'upgrade', 'energyMatrix');
    state = giveAndBuy(state, 'upgrade', 'suborbitalFlight');
    expect(state.resources.rocketFuel.unlocked).toBe(true);

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
    // Food has baseRate 0.5, so should gain ~5
    expect(state.resources.food.amount).toBeCloseTo(initialFood + 5, 0);
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
