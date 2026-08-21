import { describe, expect, it } from 'vitest';
import { advanceTime } from '../advanceTime.js';
import { createInitialState } from '../state.js';

describe('advanceTime', () => {
  it('advances in bounded simulation steps', () => {
    const state = createInitialState();
    const after = advanceTime(state, 10, () => 0.99, 1);
    expect(after.totalTime).toBe(10);
    expect(after.totalTicks).toBe(10);
  });

  it('preserves elapsed-time periodic behavior across step sizes', () => {
    const makeState = () => {
      const state = createInitialState();
      state.era = 7;
      state.dysonSegments = 100;
      return state;
    };

    const oneSecondSteps = advanceTime(makeState(), 60, () => 0.99, 1);
    const tenSecondSteps = advanceTime(makeState(), 60, () => 0.99, 10);
    expect(oneSecondSteps.dysonSegments).toBe(110);
    expect(tenSecondSteps.dysonSegments).toBe(110);
  });

  it('ignores non-positive durations and rejects invalid step sizes', () => {
    const state = createInitialState();
    expect(advanceTime(state, 0)).toBe(state);
    expect(() => advanceTime(state, 1, Math.random, 0)).toThrow(RangeError);
  });

  it('preserves an active siege and its threat timers while simulating offline production', () => {
    const state = createInitialState();
    state.era = 10;
    state.totalTime = 100;
    state.lockedSignals = { stability: true };
    state.forgetting = {
      meter: 40,
      startedAt: 80,
      depthStartedAt: 90,
      nextSurgeAt: 115,
      tendrils: [{
        id: 1,
        targetId: 'lock:stability',
        spawnedAt: 95,
        arrivesAt: 120,
        phase: 'approach',
        heldSince: null,
        consumesAt: null,
      }],
      scars: {},
      wardens: [{ id: 1, nodeId: null, movedAt: 95 }],
      sealed: 0,
      consumed: 0,
      collapsed: false,
      nextTendrilId: 2,
    };

    const after = advanceTime(state, 10800, () => 0.99, 60, { pauseForgetting: true });

    expect(after.era).toBe(10);
    expect(after.prestigeCount).toBe(0);
    expect(after.forgetting.meter).toBe(40);
    expect(after.forgetting.nextSurgeAt - after.totalTime).toBe(15);
    expect(after.forgetting.tendrils[0].arrivesAt - after.totalTime).toBe(20);
    expect(after.forgetting.wardens[0].movedAt - after.totalTime).toBe(-5);
  });

  it('does not create or advance an unattended siege when offline simulation reaches era 10', () => {
    const state = createInitialState();
    state.era = 10;
    state.totalTime = 100;

    const after = advanceTime(state, 10800, () => 0.99, 60, { pauseForgetting: true });

    expect(after.era).toBe(10);
    expect(after.prestigeCount).toBe(0);
    expect(after.forgetting).toBeNull();
  });
});
