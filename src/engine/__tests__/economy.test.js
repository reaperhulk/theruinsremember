import { describe, it, expect } from 'vitest';
import { createInitialState } from '../state.js';
import { calculateEconomy, setConsumerControl, expandStorage, estimateAffordability } from '../economy.js';
import { advanceTime } from '../advanceTime.js';
import { getEffectiveCap, canAfford } from '../resources.js';
import { getAvailableUpgrades, buyAllAffordable, purchaseUpgrade } from '../upgrades.js';
import { upgrades } from '../../data/upgrades.js';

describe('player economy contracts', () => {
  it('conserves supply from empty stock, including production in the interval', () => {
    const state = createInitialState();
    state.resources.labor.rateAdd = 100;
    const economy = calculateEconomy(state);
    expect(economy.produced.food).toBe(1.5);
    expect(economy.produced.labor).toBe(1.5);
    expect(economy.amounts.food).toBe(0);
    expect(economy.constrained.labor).toBe('input');
    expect(economy.consumed.food).toBe(economy.produced.labor);
  });

  it('full consumer storage stops drawing input', () => {
    const state = createInitialState();
    state.resources.labor.amount = getEffectiveCap(state, 'labor');
    const economy = calculateEconomy(state);
    expect(economy.consumed.food).toBe(0);
    expect(economy.net.food).toBe(1.5);
  });

  it('pause and reserves recover a starved resource and can be reversed', () => {
    let state = createInitialState();
    state.resources.labor.rateAdd = 100;
    state = setConsumerControl(state, 'labor', { paused: true });
    expect(calculateEconomy(state).net.food).toBe(1.5);
    state = setConsumerControl(state, 'labor', { paused: false, reserveFraction: 0.25 });
    expect(calculateEconomy(state).net.food).toBe(1.5);
    state = setConsumerControl(state, 'labor', { reserveFraction: 0 });
    expect(calculateEconomy(state).net.food).toBe(0);
  });

  it('storage expansion is affordable below the cap and removes a capacity blocker', () => {
    let state = createInitialState();
    const oldCap = getEffectiveCap(state, 'materials');
    const cost = { materials: oldCap * 1.4 };
    expect(estimateAffordability(state, cost).blockers[0].reason).toBe('capacity');
    state.resources.materials.amount = oldCap * 0.6;
    state = expandStorage(state, 'materials');
    expect(state.resources.materials.amount).toBe(0);
    expect(getEffectiveCap(state, 'materials')).toBe(oldCap * 1.5);
    expect(estimateAffordability(state, cost).blockers).toEqual([]);
  });

  it('offline batch size cannot change purchases, events or resource outcomes', () => {
    const initial = createInitialState();
    const makeRng = () => { let n = 3; return () => ((n = (n * 16807) % 2147483647) / 2147483647); };
    const online = advanceTime(initial, 600, makeRng(), 1);
    const offline = advanceTime(initial, 600, makeRng(), 60);
    expect(offline).toEqual(online);
  });

  it('automatic harvests happen without a renderer and survive offline catch-up', () => {
    const state = createInitialState();
    state.autoBuildOut = false;
    state.upgrades.stellarHarvester = true;
    state.resources.research.unlocked = true;
    state.resources.software.unlocked = true;
    const noHarvester = { ...state, upgrades: {} };
    const passive = advanceTime(noHarvester, 90, () => 0.99);
    const harvest = advanceTime(state, 90, () => 0.99, 60, { pauseForgetting: true });
    expect(harvest.resources.research.amount - passive.resources.research.amount).toBeCloseTo(0.8);
    expect(harvest.resources.energy.amount - passive.resources.energy.amount).toBeCloseTo(2);
    expect(harvest.resources.software.amount - passive.resources.software.amount).toBeCloseTo(2);
    expect(advanceTime(state, 90, () => 0.99, 1).resources).toEqual(harvest.resources);
  });

  it('bulk buying leaves every explicit decision to the player', () => {
    const state = createInitialState();
    for (const r of Object.values(state.resources)) r.amount = 1e12;
    const after = buyAllAffordable(state).state;
    for (const def of Object.values(upgrades).filter(u => u.exclusiveWith)) expect(after.upgrades[def.id]).toBeUndefined();
  });

  it('milestone requirements apply to purchases as well as their availability', () => {
    for (const def of Object.values(upgrades).filter(u => u.requireGems || u.requireTrades || u.requirePrestige)) {
      const state = createInitialState();
      state.era = def.era;
      for (const r of Object.values(state.resources)) { r.amount = 1e20; r.unlocked = true; }
      for (const id of def.prerequisites) state.upgrades[id] = true;
      expect(getAvailableUpgrades(state).some(u => u.id === def.id)).toBe(false);
      expect(purchaseUpgrade(state, def.id)).toBeNull();
    }
  });

  it('invalid and locked resource balances cannot buy anything', () => {
    const state = createInitialState();
    state.resources.food.amount = NaN;
    state.resources.steel.amount = 1000;
    expect(canAfford(state, { food: 1 })).toBe(false);
    expect(canAfford(state, { steel: 1 })).toBe(false);
    expect(canAfford(state, { materials: -1 })).toBe(false);
  });
});
