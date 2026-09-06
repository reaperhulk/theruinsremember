import { it, expect } from 'vitest';
import { createInitialState } from '../state.js';
import { transitionEra } from '../eras.js';
import { advanceTime } from '../advanceTime.js';
import { advanceBudgeted } from '../advanceBudgeted.js';
const random = seed => () => { seed = Math.imul(seed, 1664525) + 1013904223 | 0; return (seed >>> 0) / 4294967296; };
it('matches reference simulation, including fractions, events, automation and offline siege protection', async () => {
  for (const era of [1, 4, 7, 10]) {
    const state = transitionEra(createInitialState(), era);
    let clock = 0, yields = 0, lastProgress = 0;
    const options = { pauseForgetting: true };
    const result = await advanceBudgeted(state, 83.5, { rng: random(42), options, now: () => clock++, budgetMs: 3, yieldTask: async () => { yields++; }, onProgress: done => { expect(done).toBeGreaterThan(lastProgress); lastProgress = done; } });
    expect(result.state).toEqual(advanceTime(state, 83.5, random(42), 1, options));
    expect(result.done).toBe(83.5); expect(yields).toBeGreaterThan(1);
  }
});
it('cancels between slices without mutating the saved starting state', async () => {
  const state = createInitialState(); let stop = false, clock = 0;
  const result = await advanceBudgeted(state, 100, { now: () => clock++, budgetMs: 2, yieldTask: async () => { stop = true; }, cancelled: () => stop });
  expect(result.cancelled).toBe(true); expect(result.done).toBeLessThan(100); expect(state.totalTime).toBe(0);
});
