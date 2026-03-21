import { describe, it, expect } from 'vitest';
import { attemptDock, getDockingInfo, getTargetZone, getIndicatorPosition } from '../docking.js';
import { createInitialState } from '../state.js';

describe('docking', () => {
  function makeEra4State() {
    const state = createInitialState();
    state.era = 4;
    state.totalTime = 100;
    state.lastDockTime = 0; // ensure no cooldown
    state.prestigeMultiplier = 1;
    state.resources.rocketFuel = { amount: 0, unlocked: true, rateAdd: 0, rateMult: 1, capMult: 1, baseRate: 0, cap: 400 };
    state.resources.orbitalInfra = { amount: 0, unlocked: true, rateAdd: 0, rateMult: 1, capMult: 1, baseRate: 0, cap: 100 };
    state.resources.exoticMaterials = { amount: 0, unlocked: true, rateAdd: 0, rateMult: 1, capMult: 1, baseRate: 0, cap: 200 };
    return state;
  }

  it('indicator position oscillates between 0 and 1', () => {
    const p1 = getIndicatorPosition(0);
    expect(p1).toBeGreaterThanOrEqual(0);
    expect(p1).toBeLessThanOrEqual(1);
  });

  it('target zone is deterministic based on attempts', () => {
    const state = makeEra4State();
    const zone1 = getTargetZone(state);
    expect(zone1).toBeGreaterThanOrEqual(0.2);
    expect(zone1).toBeLessThanOrEqual(0.8);
    // Same state gives same zone
    expect(getTargetZone(state)).toBe(zone1);
  });

  it('perfect dock gives best rewards', () => {
    const state = makeEra4State();
    const zone = getTargetZone(state);
    const { state: after, result } = attemptDock(state, zone);
    expect(result).toBe('perfect');
    // effectiveFuelRate=max(1,0)=1, combo=1 → comboMult=1.2
    // perfect: rocketFuel=15*1.2=18, orbitalInfra=(3+0)*1.2=3.6, exoticMaterials=max(1,0)=1*1.2=1.2
    expect(after.resources.rocketFuel.amount).toBeCloseTo(18);
    expect(after.resources.orbitalInfra.amount).toBeCloseTo(3.6);
    expect(after.resources.exoticMaterials.amount).toBeCloseTo(1.2);
    expect(after.dockingPerfects).toBe(1);
  });

  it('good dock gives moderate rewards', () => {
    const state = makeEra4State();
    const zone = getTargetZone(state);
    // Offset from center but within zone
    const { state: after, result } = attemptDock(state, zone + 0.08);
    expect(result).toBe('good');
    // effectiveFuelRate=1, combo=1 → comboMult=1.2, reward: 5*1.2=6
    expect(after.resources.rocketFuel.amount).toBeCloseTo(6);
    expect(after.dockingSuccesses).toBe(1);
  });

  it('miss gives no rewards', () => {
    const state = makeEra4State();
    const { state: after, result } = attemptDock(state, 0.01);
    expect(result).toBe('miss');
    expect(after.resources.rocketFuel.amount).toBe(0);
    expect(after.dockingSuccesses).toBe(0);
  });

  it('does nothing before era 4', () => {
    const state = createInitialState();
    const { result } = attemptDock(state, 0.5);
    expect(result).toBe('miss');
  });

  it('tracks attempt count', () => {
    const state = makeEra4State();
    const { state: after1 } = attemptDock(state, 0.5);
    expect(after1.dockingAttempts).toBe(1);
    // Advance time past cooldown
    after1.totalTime += 3;
    const { state: after2 } = attemptDock(after1, 0.5);
    expect(after2.dockingAttempts).toBe(2);
  });

  it('rejects dock during cooldown', () => {
    const state = makeEra4State();
    const { state: after1 } = attemptDock(state, 0.5);
    // Don't advance time — should be on cooldown
    const { result } = attemptDock(after1, 0.5);
    expect(result).toBe('cooldown');
  });

  it('combo increases rewards on consecutive successes', () => {
    const state = makeEra4State();
    const zone = getTargetZone(state);
    const { state: after1 } = attemptDock(state, zone);
    expect(after1.dockingCombo).toBe(1);
    // Advance past cooldown and dock again
    after1.totalTime += 3;
    const zone2 = getTargetZone(after1);
    const { state: after2 } = attemptDock(after1, zone2);
    expect(after2.dockingCombo).toBe(2);
    // Rewards should be higher due to combo (1 + 2*0.2 = x1.4)
    expect(after2.resources.rocketFuel.amount).toBeGreaterThan(after1.resources.rocketFuel.amount);
  });

  it('getDockingInfo returns zone details', () => {
    const state = makeEra4State();
    const info = getDockingInfo(state);
    expect(info.zoneSize).toBe(0.2);
    expect(info.perfectSize).toBe(0.05);
    expect(info.attempts).toBe(0);
  });
});
