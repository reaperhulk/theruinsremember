import { describe, it, expect } from 'vitest';
import { createInitialState, migrateState } from '../state.js';

describe('migrateState', () => {
  it('fills missing fields from fresh state', () => {
    const oldSave = { era: 3, resources: { food: { unlocked: true, amount: 100 } } };
    const migrated = migrateState(oldSave);
    expect(migrated.era).toBe(3);
    expect(migrated.resources.food.amount).toBe(100);
    expect(migrated.dysonSegments).toBe(0);
    expect(migrated.seenLoreEvents).toEqual({});
    expect(migrated.realityKeys).toBeDefined();
  });

  it('preserves existing data', () => {
    const state = createInitialState();
    state.era = 5;
    state.upgrades = { tools: true };
    const migrated = migrateState(state);
    expect(migrated.era).toBe(5);
    expect(migrated.upgrades.tools).toBe(true);
  });

  it('initializes seenLoreEvents for saves that predate the field', () => {
    // Simulate a v1 save that has no seenLoreEvents field at all
    const oldSave = {
      era: 6,
      resources: { food: { unlocked: true, amount: 500 } },
      upgrades: { tools: true },
      tech: {},
      totalTicks: 1000,
      totalTime: 500,
      prestigeMultiplier: 1,
      eventLog: [],
    };
    // Explicitly ensure the field is absent
    delete oldSave.seenLoreEvents;
    const migrated = migrateState(oldSave);
    expect(migrated.seenLoreEvents).toBeDefined();
    expect(migrated.seenLoreEvents).toEqual({});
  });
});
