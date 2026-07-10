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
});
