import { describe, it, expect } from 'vitest';
import { createInitialState, migrateState } from '../state.js';

describe('migrateState', () => {
  it('adds the expedition model to older saves', () => {
    const migrated = migrateState({ era: 1, resources: createInitialState().resources, saveVersion: 2 });
    expect(migrated.expedition.supplies).toBe(2);
    expect(migrated.expedition.eraFinds).toBe(0);
    expect(migrated.dockingMissions).toEqual({ cargo: 0, crew: 0, science: 0 });
    expect(migrated.saveVersion).toBe(7);
  });

  it('drops retired operation state during migration', () => {
    const migrated = migrateState({
      ...createInitialState(),
      miningStreak: 12,
      factoryAllocation: { steel: 3 },
      hackSuccesses: 9,
    });

    expect(migrated).not.toHaveProperty('miningStreak');
    expect(migrated).not.toHaveProperty('factoryAllocation');
    expect(migrated).not.toHaveProperty('hackSuccesses');
  });

  it('translates earned legacy tuning and senate progress into their replacement decisions', () => {
    const saved = {
      ...createInitialState(),
      era: 9,
      tuningScore: 100,
      senate: { merchants: 20, scholars: 8, warriors: 3 },
    };
    delete saved.lockedSignals;
    delete saved.senateGov;

    const migrated = migrateState(saved);

    expect(migrated.lockedSignals).toEqual({ stability: true, power: true, constants: true });
    expect(migrated.senateGov).toEqual({ leader: 'merchants', partner: 'scholars', ratified: true });
    expect(migrated).not.toHaveProperty('tuningScore');
    expect(migrated).not.toHaveProperty('senate');
  });

  it('preserves partially earned legacy decisions without overwriting modern choices', () => {
    const saved = {
      ...createInitialState(),
      tuningScore: 25,
      senate: { merchants: 0, scholars: 4, warriors: 1 },
    };
    delete saved.lockedSignals;
    delete saved.senateGov;

    const migrated = migrateState(saved);
    expect(migrated.lockedSignals).toEqual({ stability: true, power: true });
    expect(migrated.senateGov).toEqual({ leader: 'scholars', partner: null, ratified: false });

    const modern = migrateState({
      ...saved,
      lockedSignals: { fragments: true },
      senateGov: { leader: 'warriors', partner: 'merchants', ratified: true },
    });
    expect(modern.lockedSignals).toEqual({ fragments: true });
    expect(modern.senateGov.leader).toBe('warriors');
  });

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

  it('round-trips modern mandates, reserve routes, research settings, and siege state', () => {
    const saved = createInitialState();
    saved.era = 10;
    saved.colonyMandate = 'federation';
    saved.colonyAssignments = { growth: 4, science: 4, industry: 4 };
    saved.tradeRoute = { from: 'food', to: 'materials', era: 10 };
    saved.autoBuildOut = false;
    saved.lockedSignals = { stability: true, fragments: true };
    saved.senateGov = { leader: 'scholars', partner: 'warriors', ratified: true };
    saved.forgetting = { meter: 24, wardens: [], tendrils: [], scars: {}, collapsed: false };

    const migrated = migrateState(JSON.parse(JSON.stringify(saved)));

    expect(migrated.colonyMandate).toBe('federation');
    expect(migrated.tradeRoute).toEqual(saved.tradeRoute);
    expect(migrated.autoBuildOut).toBe(false);
    expect(migrated.lockedSignals).toEqual(saved.lockedSignals);
    expect(migrated.senateGov).toEqual(saved.senateGov);
    expect(migrated.forgetting.meter).toBe(24);
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
