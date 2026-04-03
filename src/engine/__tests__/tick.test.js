import { describe, it, expect } from 'vitest';
import { tick } from '../tick.js';
import { createInitialState } from '../state.js';
import { upgrades as allUpgradeDefs } from '../../data/upgrades.js';

describe('tick', () => {
  it('advances resources by their production rates', () => {
    const state = createInitialState();
    // Food has baseRate 1.5, rateMult 1
    const before = state.resources.food.amount;
    const after = tick(state, 1);
    expect(after.resources.food.amount).toBeCloseTo(before + 1.5, 5);
  });

  it('enforces resource caps on production', () => {
    const state = createInitialState();
    // Set materials near cap — materials have no consumption chain so it should cap exactly
    state.resources.materials.amount = 4999.5;
    const after = tick(state, 1);
    // Cap enforced at 5000 (baseCap * capMult * eraCapScale = 5000 * 1 * 1)
    expect(after.resources.materials.amount).toBe(5000);
  });

  it('does not produce for locked resources', () => {
    const state = createInitialState();
    // Steel is era 2, locked in era 1
    expect(state.resources.steel.unlocked).toBe(false);
    const after = tick(state, 10);
    expect(after.resources.steel.amount).toBe(0);
  });

  it('increments totalTicks and totalTime', () => {
    const state = createInitialState();
    const after = tick(state, 0.5);
    expect(after.totalTicks).toBe(1);
    expect(after.totalTime).toBeCloseTo(0.5, 5);
  });

  it('applies prestige multiplier to production', () => {
    const state = createInitialState();
    state.prestigeMultiplier = 3;
    const after = tick(state, 1);
    // Food: baseRate 1.5 * rateMult 1 * prestige 3 = 4.5/s
    expect(after.resources.food.amount).toBeCloseTo(4.5, 5);
  });

  it('surplusExchange converts capped resources to lowest', () => {
    const state = createInitialState();
    state.upgrades = { surplusExchange: true };
    state.resources.food = { ...state.resources.food, unlocked: true, amount: 4900, capMult: 1 };
    state.resources.materials = { ...state.resources.materials, unlocked: true, amount: 10, capMult: 1 };
    const after = tick(state, 1);
    // Materials should have increased (received overflow)
    expect(after.resources.materials.amount).toBeGreaterThan(10);
  });

  it('overclockProtocol doubles production during pulse', () => {
    const state = createInitialState();
    state.upgrades = { overclockProtocol: true };
    state.totalTime = 5; // In the pulse window (0-10)
    const after = tick(state, 1);
    // Food should gain more than base 1.5/s (doubled = 3.0/s)
    expect(after.resources.food.amount).toBeGreaterThan(state.resources.food.amount + 2.5);
  });

  it('communalEffort gives bonus per upgrade', () => {
    const state = createInitialState();
    state.upgrades = { communalEffort: true, tools: true, irrigation: true }; // 3 upgrades = +3%
    const baseTick = tick(createInitialState(), 1);
    const bonusTick = tick(state, 1);
    // With communalEffort, production should be slightly higher
    expect(bonusTick.resources.food.amount).toBeGreaterThan(baseTick.resources.food.amount);
  });

  it('galacticMemory (prestigeAccumulator) gives +5% per prestige count', () => {
    const state = createInitialState();
    state.upgrades = { galacticMemory: true };
    state.prestigeCount = 4; // 4 * 5% = 20% bonus
    const baseTick = tick(createInitialState(), 1);
    const bonusTick = tick(state, 1);
    // Food should be higher with 20% prestige bonus
    expect(bonusTick.resources.food.amount).toBeGreaterThan(baseTick.resources.food.amount);
  });

  // entropySiphon test removed — events system removed

  it('echoMultiplier (diversityBonus) scales with unlocked resource count', () => {
    const state = createInitialState();
    state.upgrades = { echoMultiplier: true };
    // Era 1 has ~5 unlocked resources
    const baseTick = tick(createInitialState(), 1);
    const bonusTick = tick(state, 1);
    // 1.05^5 - 1 = ~27.6% bonus
    expect(bonusTick.resources.food.amount).toBeGreaterThan(baseTick.resources.food.amount);
  });

  it('infiniteLoop (compoundingTick) adds small compounding bonus', () => {
    const state = createInitialState();
    state.upgrades = { infiniteLoop: true };
    const baseTick = tick(createInitialState(), 1);
    const bonusTick = tick(state, 1);
    // Should be slightly higher due to compounding
    expect(bonusTick.resources.food.amount).toBeGreaterThan(baseTick.resources.food.amount);
  });

  it('food is consumed by labor production', () => {
    const state = createInitialState();
    state.resources.labor = { ...state.resources.labor, unlocked: true, rateAdd: 2, rateMult: 1 };
    // Give enough food so food-limitation doesn't throttle labor
    state.resources.food.amount = 100;
    // Labor effective rate = (baseRate 0.2 + rateAdd 2) * rateMult 1 * prestige 1 = 2.2/s
    // Food consumed = 2.2 * 1.0 = 2.2/s
    // Food gross rate = (baseRate 1.5 + 0) * 1 * 1 = 1.5/s
    // Food after tick: 100 + 1.5 - 2.2 = 99.3
    const after = tick(state, 1);
    expect(after.resources.food.amount).toBeLessThan(100 + 1.5);
    expect(after.resources.food.amount).toBeCloseTo(100 + 1.5 - 2.2, 1);
  });

  it('energy is consumed by electronics production', () => {
    const state = createInitialState();
    state.resources.electronics = { ...state.resources.electronics, unlocked: true, rateAdd: 3, rateMult: 1 };
    // Give enough energy so throttling doesn't kick in
    state.resources.energy = { ...state.resources.energy, amount: 10 };
    // Electronics effective rate = (baseRate 0.1 + rateAdd 3) * 1 * 1 = 3.1/s
    // Energy consumed = 3.1 * 0.4 = 1.24/s
    // Energy gross rate = (baseRate 0.5 + 0) * 1 * 1 = 0.5/s
    // Net energy = 0.5 - 1.24 = -0.74/s
    const energyBefore = state.resources.energy.amount;
    const after = tick(state, 1);
    expect(after.resources.energy.amount).toBeLessThan(energyBefore + 0.5);
    expect(after.resources.energy.amount).toBeCloseTo(energyBefore + 0.5 - 1.24, 1);
  });

  // --- Mechanic upgrade tests ---

  it('resourcePipeline converts overflow to research when resources are at cap', () => {
    const state = createInitialState();
    state.upgrades = { resourcePipeline: true };
    // Unlock research and set food at cap with production
    state.resources.research = { ...state.resources.research, unlocked: true, amount: 0, rateAdd: 0, rateMult: 1, capMult: 1 };
    state.resources.food = { ...state.resources.food, unlocked: true, amount: 5000, capMult: 1 };
    // Food is at cap (5000) with baseRate 1.5, so overflow should trickle to research
    const after = tick(state, 1);
    // Research should have increased from overflow: 1.5 * 0.1 = 0.15
    expect(after.resources.research.amount).toBeGreaterThan(0);
  });

  it('resourcePipeline does not convert when resources are below cap', () => {
    const state = createInitialState();
    state.upgrades = { resourcePipeline: true };
    state.resources.research = { ...state.resources.research, unlocked: true, amount: 0, rateAdd: 0, rateMult: 1, capMult: 1, baseRate: 0 };
    state.resources.food = { ...state.resources.food, unlocked: true, amount: 100, capMult: 1 };
    const after = tick(state, 1);
    // Research should only have base production, no pipeline overflow
    // No resource is at cap, so pipeline should not contribute
    expect(after.resources.research.amount).toBeLessThan(1);
  });

  it('recursiveOptimizer gives 1.1x per era (era 5 = 1.1^4 bonus)', () => {
    const state = createInitialState();
    state.upgrades = { recursiveOptimizer: true };
    state.era = 5;
    const baseState = createInitialState();
    baseState.era = 5;
    const baseTick = tick(baseState, 1);
    const bonusTick = tick(state, 1);
    // Era 5: 1.1^4 = 1.4641, so bonus fraction = 0.4641
    // Food: 1.5 base + 1.5 * 0.4641 = 1.5 + 0.696 = 2.196
    expect(bonusTick.resources.food.amount).toBeGreaterThan(baseTick.resources.food.amount * 1.4);
  });

  it('recursiveOptimizer gives no bonus at era 1', () => {
    const state = createInitialState();
    state.upgrades = { recursiveOptimizer: true };
    state.era = 1;
    const baseTick = tick(createInitialState(), 1);
    const bonusTick = tick(state, 1);
    // Era 1: 1.1^0 = 1, no bonus
    expect(bonusTick.resources.food.amount).toBeCloseTo(baseTick.resources.food.amount, 5);
  });

  it('orbitalResonance gives +10% per mini-game interacted with', () => {
    const state = createInitialState();
    state.upgrades = { orbitalResonance: true };
    // Interact with 3 mini-games: mining (totalGems), factory, hacking
    state.totalGems = 1;
    state.factoryAllocation = { steel: 1 };
    state.hackSuccesses = 1;
    const baseTick = tick(createInitialState(), 1);
    const bonusTick = tick(state, 1);
    // 3 mini-games * 10% = 30% bonus on food: 1.5 + 1.5*0.3 = 1.95
    expect(bonusTick.resources.food.amount).toBeCloseTo(baseTick.resources.food.amount * 1.3, 1);
  });

  it('orbitalResonance gives no bonus with zero mini-game interaction', () => {
    const state = createInitialState();
    state.upgrades = { orbitalResonance: true };
    // No mini-game interactions
    const baseTick = tick(createInitialState(), 1);
    const bonusTick = tick(state, 1);
    expect(bonusTick.resources.food.amount).toBeCloseTo(baseTick.resources.food.amount, 5);
  });

  it('warpEcho gives +3% per star route', () => {
    const state = createInitialState();
    state.upgrades = { warpEcho: true };
    state.starRoutes = [{ from: 0, to: 1 }, { from: 1, to: 2 }, { from: 2, to: 3 }, { from: 3, to: 4 }, { from: 4, to: 5 }];
    const baseTick = tick(createInitialState(), 1);
    const bonusTick = tick(state, 1);
    // 5 routes * 3% = 15% bonus: 1.5 * 1.15 = 1.725
    expect(bonusTick.resources.food.amount).toBeCloseTo(baseTick.resources.food.amount * 1.15, 1);
  });

  it('warpEcho gives no bonus with zero routes', () => {
    const state = createInitialState();
    state.upgrades = { warpEcho: true };
    state.starRoutes = [];
    const baseTick = tick(createInitialState(), 1);
    const bonusTick = tick(state, 1);
    expect(bonusTick.resources.food.amount).toBeCloseTo(baseTick.resources.food.amount, 5);
  });

  it('fuel is consumed by orbital infra production', () => {
    const state = createInitialState();
    state.era = 4;
    state.resources.orbitalInfra = { ...state.resources.orbitalInfra, unlocked: true, rateAdd: 2, rateMult: 1 };
    state.resources.rocketFuel = { ...state.resources.rocketFuel, unlocked: true, amount: 100, rateAdd: 0, rateMult: 1, capMult: 1 };
    // Orbital rate = (0.4 + 2) * 1 = 2.4/s, fuel consumed = 2.4 * 0.5 = 1.2/s
    // Fuel production = (0.3 + 0) * 1 = 0.3/s, net = 0.3 - 1.2 = -0.9/s
    const after = tick(state, 1);
    expect(after.resources.rocketFuel.amount).toBeCloseTo(100 + 0.3 - 2.4 * 0.5, 1);
  });

  it('auto-purchase only buys non-repeatable upgrades from earlier eras', () => {
    const state = createInitialState();
    state.era = 5;
    state.totalTicks = 59; // Will be 60 on next tick (auto-purchase fires at %60===0)
    // Give the player tons of resources
    for (const id of Object.keys(state.resources)) {
      state.resources[id] = { ...state.resources[id], unlocked: true, amount: 999999 };
    }
    // Pre-own some era 1 upgrades so chain works
    state.upgrades = { tools: true, irrigation: true, basicPower: true };
    const after = tick(state, 0.1);
    // Should have auto-purchased non-repeatable upgrades from era <= 4 (era-1)
    const newUpgrades = Object.keys(after.upgrades).filter(id => !state.upgrades[id]);
    expect(newUpgrades.length).toBeGreaterThan(0);
    for (const id of newUpgrades) {
      const def = allUpgradeDefs[id];
      if (def) {
        expect(def.era).toBeLessThanOrEqual(4); // era 5 - 1 = era 4 max
        expect(def.repeatable).toBeFalsy();
      }
    }
  });

  it('reality fragments produce immediately once era 9 unlocks them', () => {
    const state = createInitialState();
    state.era = 9;
    state.resources.realityFragments = {
      ...state.resources.realityFragments,
      unlocked: true,
      amount: 0,
    };
    const after = tick(state, 10);
    expect(after.resources.realityFragments.amount).toBeGreaterThan(0);
  });

  it('electronics production throttles when energy is depleted', () => {
    const state = createInitialState();
    state.resources.electronics = { ...state.resources.electronics, unlocked: true, rateAdd: 100, rateMult: 1 };
    state.resources.energy = { ...state.resources.energy, unlocked: true, amount: 1 };
    // Electronics rate = 100/s, energy cost = 100 * 0.3 = 30/s for dt=1
    // But only 1 energy available, so scale = 1/30
    // Throttled electronics production = 100 * (1/30) = 3.33/s
    // Energy consumed = 100 * (1/30) * 0.3 = 1.0
    // Energy after = 1 + 0.5 (production) - 1.0 (consumed) = 0.5
    const after = tick(state, 1);
    expect(after.resources.energy.amount).toBeCloseTo(0.5, 1);
    // Electronics should have produced a throttled amount, not full rate
    expect(after.resources.electronics.amount).toBeLessThan(100);
    expect(after.resources.electronics.amount).toBeGreaterThan(0);
  });

  it('initial state includes new mini-game fields', () => {
    const state = createInitialState();
    expect(state.dysonSegments).toBe(0);
    expect(state.tuningScore).toBe(0);
    expect(state.senate).toBeDefined();
    expect(state.senate.merchants).toBe(0);
    expect(state.senate.scholars).toBe(0);
    expect(state.senate.warriors).toBe(0);
    expect(state.realityKeys).toBeDefined();
    expect(Object.keys(state.realityKeys).length).toBe(0);
  });

  it('reality key bonus at 1% per key affects production', () => {
    const state = createInitialState();
    state.realityKeys = { temporal: 10, spatial: 10 }; // 20 keys = +20%
    const baseTick = tick(createInitialState(), 1);
    const bonusTick = tick(state, 1);
    // Food: 1.5 * 1.20 = 1.8
    expect(bonusTick.resources.food.amount).toBeCloseTo(baseTick.resources.food.amount * 1.20, 1);
  });

  it('Dyson auto-assembly adds segments based on count', () => {
    const state = createInitialState();
    state.era = 7;
    state.dysonSegments = 100;
    state.totalTicks = 59; // Will be 60 on next tick (auto-assembly fires at %60===0)
    const after = tick(state, 1);
    // autoRate = Math.min(20, Math.floor(100/10)) = 10
    expect(after.dysonSegments).toBe(110);
  });

  it('Dyson auto-assembly continues beyond 500 segments', () => {
    const state = createInitialState();
    state.era = 7;
    state.dysonSegments = 500;
    state.totalTicks = 59;
    const after = tick(state, 1);
    // autoRate = Math.min(20, Math.floor(500/10)) = 20
    expect(after.dysonSegments).toBe(520);
  });
});
