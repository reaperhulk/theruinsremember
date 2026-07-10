import { describe, expect, it } from 'vitest';
import { createInitialState } from '../state.js';
import { getActiveSystems } from '../operations.js';

describe('operation systems', () => {
  it('counts only systems exposed by the current game', () => {
    const state = createInitialState();
    state.expedition.totalFinds = 2;
    state.dockingAttempts = 1;
    state.starRoutes = [{ from: 'sol', to: 'alpha' }];
    state.factoryAllocation = { steel: 10 };
    state.hackSuccesses = 10;

    expect(getActiveSystems(state)).toEqual(['expeditions', 'orbitalOperations', 'starChart']);
  });
});
