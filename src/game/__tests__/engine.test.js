import { describe, expect, it } from 'vitest';
import { ACHIEVEMENTS, ARCHIVE_RATE, BUILDINGS, ERA_THRESHOLDS, UPGRADES } from '../data.js';
import {
  advanceOffline, buyBuilding, buyMemoryUpgrade, buyUpgrade, catchEcho, click, createState,
  getAvailableUpgrades, getBaseSps, getBuildingCost, getClickValue, getGlobalMultiplier, getMaxAffordable, getNextMemoryAt,
  getAvailableMemories, getPendingMemories, getSpentMemories, getSps, getUpgradeCost, isBuildingRevealed, tick, turnCycle,
} from '../engine.js';

const rng = (...values) => { let i = 0; return () => values[i++ % values.length]; };
const rich = (state, salvage = 1e30) => ({ ...state, salvage, runEarned: Math.max(state.runEarned, salvage), totalEarned: Math.max(state.totalEarned, salvage) });

describe('digging', () => {
  it('starts with nothing and earns one salvage per click', () => {
    const state = click(createState(0));
    expect(state.salvage).toBe(1);
    expect(state.clicks).toBe(1);
    expect(state.clickEarned).toBe(1);
    expect(state.totalEarned).toBe(1);
  });

  it('batches clicks and rejects invalid batches', () => {
    const state = createState(0);
    expect(click(state, 10).salvage).toBe(10);
    expect(click(state, 0)).toBe(state);
    expect(click(state, 1.5)).toBe(state);
  });

  it('click doublers and production shares keep clicking relevant', () => {
    let state = rich({ ...createState(0), clicks: 1000 });
    state = buyUpgrade(state, 'callousedHands');
    state = buyUpgrade(state, 'steadyGrip');
    expect(getClickValue(state)).toBe(4);
    state = buyBuilding(state, 'foundry', 10);
    const sps = getSps(state);
    state = buyUpgrade(state, 'muscleMemory');
    expect(getClickValue(state)).toBeCloseTo(4 + getSps(state) * 0.01);
    expect(getSps(state)).toBeGreaterThanOrEqual(sps);
  });
});

describe('buildings', () => {
  it('cost 15% more each and bulk prices sum the series', () => {
    const state = createState(0);
    expect(getBuildingCost(state, 'scavenger')).toBe(15);
    const one = buyBuilding(rich(state), 'scavenger');
    expect(getBuildingCost(one, 'scavenger')).toBe(Math.ceil(15 * 1.15));
    const ten = getBuildingCost(state, 'scavenger', 10);
    expect(ten).toBe(Math.ceil(15 * (1.15 ** 10 - 1) / 0.15));
  });

  it('cannot be bought without the salvage', () => {
    const state = { ...createState(0), salvage: 14 };
    expect(buyBuilding(state, 'scavenger')).toBe(state);
    expect(buyBuilding({ ...state, salvage: 15 }, 'scavenger').buildings.scavenger).toBe(1);
    expect(buyBuilding(rich(state), 'nope')).toBeTruthy();
  });

  it('max affordable never overspends', () => {
    for (const salvage of [0, 14, 15, 100, 12345, 1e9]) {
      const state = { ...createState(0), salvage };
      const n = getMaxAffordable(state, 'scavenger');
      if (n > 0) expect(getBuildingCost(state, 'scavenger', n)).toBeLessThanOrEqual(salvage);
      expect(getBuildingCost(state, 'scavenger', n + 1)).toBeGreaterThan(salvage);
    }
  });

  it('produce over time and are revealed as salvage is recovered', () => {
    let state = rich(createState(0), 1000);
    state = buyBuilding(state, 'camp');
    // Achievements earned along the way add 1% each.
    const global = getGlobalMultiplier(state);
    expect(global).toBeCloseTo(1 + 0.01 * Object.keys(state.achievements).length);
    expect(getBaseSps(state)).toBeCloseTo(global);
    const later = tick({ ...state, salvage: 0 }, 10, () => 0.5);
    expect(later.salvage).toBeCloseTo(10 * global);
    const fresh = createState(0);
    expect(isBuildingRevealed(fresh, 'scavenger')).toBe(true);
    expect(isBuildingRevealed(fresh, 'foundry')).toBe(false);
    expect(isBuildingRevealed({ ...fresh, runEarned: 600 }, 'foundry')).toBe(true);
  });

  it('every era builds on the last: each building costs and produces more', () => {
    for (let i = 1; i < BUILDINGS.length; i++) {
      expect(BUILDINGS[i].cost).toBeGreaterThan(BUILDINGS[i - 1].cost);
      expect(BUILDINGS[i].sps).toBeGreaterThan(BUILDINGS[i - 1].sps);
      // Past the opening pair, newer buildings take longer to pay for themselves.
      if (i > 1) expect(BUILDINGS[i].cost / BUILDINGS[i].sps).toBeGreaterThan(BUILDINGS[i - 1].cost / BUILDINGS[i - 1].sps);
    }
  });
});

describe('upgrades', () => {
  it('appear when their condition is met and double their building', () => {
    let state = rich(createState(0));
    expect(getAvailableUpgrades(state).some(u => u.id === 'scavenger:1')).toBe(false);
    state = buyBuilding(state, 'scavenger');
    expect(getAvailableUpgrades(state).some(u => u.id === 'scavenger:1')).toBe(true);
    const before = getBaseSps(state);
    state = buyUpgrade(state, 'scavenger:1');
    expect(getBaseSps(state)).toBeCloseTo(before * 2);
    expect(buyUpgrade(state, 'scavenger:1')).toBe(state);
  });

  it('have unique ids and positive prices', () => {
    expect(new Set(UPGRADES.map(u => u.id)).size).toBe(UPGRADES.length);
    expect(UPGRADES.every(u => u.cost > 0)).toBe(true);
    expect(new Set(ACHIEVEMENTS.map(a => a.id)).size).toBe(ACHIEVEMENTS.length);
  });
});

describe('eras', () => {
  it('advance with salvage recovered this cycle and are logged once', () => {
    let state = createState(0);
    state = click(state, ERA_THRESHOLDS[2]);
    expect(state.era).toBe(2);
    expect(state.highestEra).toBe(2);
    expect(state.log.filter(e => e.kind === 'era')).toEqual([expect.objectContaining({ era: 2, first: true })]);
    const far = tick({ ...rich(state, ERA_THRESHOLDS[10]) }, 1, () => 0.5);
    expect(far.era).toBe(10);
  });
});

describe('echoes', () => {
  it('appear after their timer, can be caught, and fade if ignored', () => {
    let state = { ...createState(0), echo: { timer: 1, active: null } };
    state = tick(state, 1, rng(0.5));
    expect(state.echo.active).toBeTruthy();
    const faded = tick(state, 20, rng(0.5));
    expect(faded.echo.active).toBeNull();
    expect(faded.echo.timer).toBeGreaterThan(0);
    const { state: caught, effect } = catchEcho(state, rng(0));
    expect(effect.id).toBe('cache');
    expect(caught.echoesCaught).toBe(1);
    expect(caught.salvage).toBeGreaterThanOrEqual(13);
    expect(catchEcho(caught).effect).toBeNull();
  });

  it('remembrance multiplies production for its duration only', () => {
    let state = buyBuilding(rich(createState(0), 1000), 'camp');
    state = { ...state, salvage: 0, echo: { timer: 0, active: { x: 0.5, y: 0.5, remaining: 5 } } };
    const { state: buffed, effect } = catchEcho(state, rng(0.6));
    expect(effect.id).toBe('remembrance');
    const after = tick(buffed, 100, () => 0.99);
    // 77 seconds at x7, then 23 at x1.
    expect(after.salvage).toBeCloseTo((77 * 7 + 23) * getBaseSps(buffed), 5);
    expect(after.buffs).toEqual([]);
  });

  it('never grant Ancient Hands before the Digital Age', () => {
    const state = { ...createState(0), echo: { timer: 0, active: { x: 0.5, y: 0.5, remaining: 5 } } };
    expect(catchEcho(state, rng(0.99)).effect.id).not.toBe('ancientHands');
    expect(catchEcho({ ...state, era: 3 }, rng(0.99)).effect.id).toBe('ancientHands');
  });

  it('never appear while the game is closed', () => {
    const state = { ...createState(0), echo: { timer: 1, active: null } };
    expect(advanceOffline(state, 3600).state.echo.active).toBeNull();
  });
});

describe('time away', () => {
  it('produces at the offline efficiency', () => {
    const state = { ...buyBuilding(rich(createState(0), 1000), 'camp'), salvage: 0 };
    const sps = getBaseSps(state);
    expect(advanceOffline(state, 1000).earned).toBeCloseTo(100 * sps);
    const patient = { ...state, memoryUpgrades: { patientRuins: true } };
    expect(advanceOffline(patient, 1000).earned).toBeCloseTo(250 * sps);
  });
});

describe('the cycle', () => {
  it('turns lifetime salvage into memories and keeps what the ruins remember', () => {
    // Memories are the cube root of lifetime salvage over MEMORY_DIVISOR (1e11).
    let state = rich(createState(0), 8e11);
    state = buyBuilding(state, 'camp', 10);
    expect(getPendingMemories(state)).toBe(2);
    expect(getNextMemoryAt(state)).toBe(27e11);
    const next = turnCycle(state);
    expect(next.memories).toBe(2);
    expect(next.cycles).toBe(1);
    expect(next.salvage).toBe(0);
    expect(next.buildings).toEqual({});
    expect(next.totalEarned).toBe(state.totalEarned);
    expect(next.achievements).toEqual(expect.objectContaining(state.achievements));
    expect(getPendingMemories(next)).toBe(0);
  });

  it('memories raise production and pay for lessons', () => {
    let state = { ...createState(0), memories: 10, buildings: { camp: 1 } };
    expect(getBaseSps(state)).toBeCloseTo(1.1);
    state = buyMemoryUpgrade(state, 'starterKit');
    expect(getSpentMemories(state)).toBe(3);
    expect(getAvailableMemories(state)).toBe(7);
    // Spending memories never lowers their production bonus.
    expect(getBaseSps({ ...state, achievements: {} })).toBeCloseTo(1.1);
    expect(buyMemoryUpgrade(state, 'starterKit')).toBe(state);
    expect(buyMemoryUpgrade(state, 'lingeringEcho')).toBe(state);
    const next = turnCycle(state);
    expect(next.buildings).toEqual({ scavenger: 10, camp: 10, foundry: 5 });
  });

  it('lessons change how a cycle plays', () => {
    const base = { ...createState(0), buildings: { camp: 10 }, memories: 100000 };
    const learn = (...ids) => ({ ...base, memoryUpgrades: Object.fromEntries(ids.map(id => [id, true])) });
    // Remembered Hands: double clicks plus a share of production.
    expect(getClickValue(learn('rememberedHands'))).toBeCloseTo(2 + getSps(base) * 0.01);
    // Discounts on buildings and on building upgrades.
    expect(getBuildingCost(learn('ancestralDiscount'), 'camp')).toBe(Math.ceil(100 * 1.15 ** 10 * 0.9));
    expect(getUpgradeCost(learn('rememberedBlueprints'), 'camp:1')).toBe(500);
    expect(getUpgradeCost(learn('rememberedBlueprints'), 'callousedHands')).toBe(100);
    expect(getUpgradeCost(learn('thePattern', 'rememberedBlueprints'), 'camp:1')).toBe(375);
    // Deeper memories and resonance raise what memories and achievements are worth.
    const noAch = s => ({ ...s, achievements: {} });
    expect(getGlobalMultiplier(noAch(learn('deepMemory'))) / getGlobalMultiplier(noAch(base))).toBeCloseTo(1501 / 1001);
    expect(getGlobalMultiplier(noAch(learn('deeperMemory'))) / getGlobalMultiplier(noAch(base))).toBeCloseTo(2001 / 1001);
    const achieved = { ...base, achievements: Object.fromEntries(ACHIEVEMENTS.slice(0, 50).map(a => [a.id, true])) };
    expect(getGlobalMultiplier({ ...achieved, memoryUpgrades: { resonance: true } }) / getGlobalMultiplier(achieved)).toBeCloseTo(2 / 1.5);
    expect(getGlobalMultiplier(learn('unbrokenChain')) / getGlobalMultiplier(base)).toBeCloseTo(1.5);
    // Inheritance: a cycle starts with 1% of what the last one recovered.
    const inherited = turnCycle({ ...learn('inheritance'), runEarned: 5e12, totalEarned: 5e12 });
    expect(inherited.salvage).toBe(5e10);
    expect(inherited.runEarned).toBe(5e10);
    expect(inherited.era).toBeGreaterThan(1);
  });
});

describe('archivists', () => {
  it('multiply production by achievements and wait for enough of them', () => {
    const achievements = n => Object.fromEntries(ACHIEVEMENTS.slice(0, n).map(a => [a.id, true]));
    let state = rich({ ...createState(0), era: 3, achievements: achievements(14) });
    expect(getAvailableUpgrades(state).some(u => u.id === 'archivist:3')).toBe(false);
    state = { ...state, achievements: achievements(40) };
    expect(getAvailableUpgrades(state).some(u => u.id === 'archivist:3')).toBe(true);
    state = buyUpgrade(state, 'archivist:3');
    expect(state.upgrades['archivist:3']).toBe(true);
    const { 'archivist:3': _, ...without } = state.upgrades;
    const count = Object.keys(state.achievements).length;
    expect(getGlobalMultiplier(state) / getGlobalMultiplier({ ...state, upgrades: without })).toBeCloseTo(1 + ARCHIVE_RATE * count);
  });
});
