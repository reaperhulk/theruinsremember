import { describe, expect, it } from 'vitest';
import { awardCycleGoal, getCycleGoal, getCycleProductionMultiplier, selectNextCycleDoctrine } from '../cycles.js';
import { createInitialState } from '../state.js';

describe('cycle doctrines', () => {
  it('selects the doctrine that will shape the next cycle', () => {
    const state = createInitialState();
    state.era = 10;

    const selected = selectNextCycleDoctrine(state, 'expansion');

    expect(selected.nextCycleDoctrine).toBe('expansion');
  });

  it('applies doctrine production only in its intended eras', () => {
    const state = createInitialState();
    state.cycleDoctrine = 'reconstruction';
    expect(getCycleProductionMultiplier(state)).toBeCloseTo(1.35);
    state.era = 4;
    expect(getCycleProductionMultiplier(state)).toBe(1);
  });

  it('awards each cycle goal once', () => {
    const state = createInitialState();
    state.cycleDoctrine = 'reconstruction';
    state.expedition.totalFinds = 8;

    const goal = getCycleGoal(state);
    const awarded = awardCycleGoal(state);
    const repeated = awardCycleGoal(awarded);

    expect(goal.complete).toBe(true);
    expect(awarded.cycleMarks).toBe(1);
    expect(awarded.prestigePoints).toBe(4);
    expect(repeated.prestigePoints).toBe(4);
  });
});
