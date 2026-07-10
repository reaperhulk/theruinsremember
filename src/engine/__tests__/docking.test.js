import { describe, it, expect } from 'vitest';
import { attemptDock, getDockingInfo, getTargetZone, getIndicatorPosition, selectDockingApproach, selectDockingMission } from '../docking.js';
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
    // Cargo reward: rocketFuel=18*1.2=21.6.
    expect(after.resources.rocketFuel.amount).toBeCloseTo(21.6);
    expect(after.dockingPerfects).toBe(1);
    expect(after.dockingMissions.cargo).toBe(1);
  });

  it('good dock gives moderate rewards', () => {
    const state = makeEra4State();
    const zone = getTargetZone(state);
    // Offset from center but within zone
    const { state: after, result } = attemptDock(state, zone + 0.08);
    expect(result).toBe('good');
    // Good cargo reward is 40% of perfect, with the x1.2 first-combo bonus.
    expect(after.resources.rocketFuel.amount).toBeCloseTo(8.64);
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
    expect(info.zoneSize).toBe(0.34);
    expect(info.perfectSize).toBe(0.10);
    expect(info.attempts).toBe(0);
  });

  it('perfect dock rewards scale with fuel production rate', () => {
    const state = makeEra4State();
    state.resources.rocketFuel = {
      ...state.resources.rocketFuel,
      unlocked: true, amount: 100,
      baseRate: 0, rateAdd: 5, rateMult: 2, // fuelRate = (0 + 5) * 2 = 10
    };
    const zone = getTargetZone(state); // use exact zone center for perfect
    const { state: after, result } = attemptDock(state, zone);
    expect(result).toBe('perfect');
    // effectiveFuelRate = max(1, 10) = 10
    // perfect cargo reward: rocketFuel = 10 * 18 = 180
    // combo = 1 → comboMult = 1 + 1*0.2 = 1.2
    // eraScale = 1.5^(4-4) = 1, prestige = 1
    // total fuel gained = 180 * 1 * 1.2 * 1 * 1 * 1 = 216
    expect(after.resources.rocketFuel.amount).toBe(100 + 216);
    expect(after.resources.rocketFuel.amount).toBeGreaterThan(200);
  });

  it('offers mission-specific difficulty and tracks each mission separately', () => {
    let state = makeEra4State();
    state = selectDockingMission(state, 'science');
    const info = getDockingInfo(state);
    expect(info.missionId).toBe('science');
    expect(info.zoneSize).toBe(0.20);

    const { state: after, result } = attemptDock(state, getTargetZone(state));
    expect(result).toBe('perfect');
    expect(after.dockingMissions.science).toBe(1);
    expect(after.dockingMissions.cargo).toBe(0);
  });

  it('makes Hard Burn narrower and more rewarding at a fuel cost', () => {
    let state = makeEra4State();
    state.resources.rocketFuel.amount = 100;
    const standardWidth = getDockingInfo(state).zoneSize;
    state = selectDockingApproach(state, 'burn');
    const burnWidth = getDockingInfo(state).zoneSize;
    const { state: after, result } = attemptDock(state, getTargetZone(state));

    expect(burnWidth).toBeLessThan(standardWidth);
    expect(result).toBe('perfect');
    expect(after.resources.rocketFuel.amount).toBeGreaterThan(100);
  });

  it('rejects Hard Burn without its fuel reserve', () => {
    const state = selectDockingApproach(makeEra4State(), 'burn');
    expect(attemptDock(state, getTargetZone(state)).result).toBe('insufficient');
  });
});
