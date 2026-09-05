import { describe, it, expect } from 'vitest';
import { createInitialState, migrateState } from '../state.js';
import { parseSave, serializeSave, loadSave, writeSave, SAVE_KEY, BACKUP_KEYS } from '../saves.js';
import { advanceTime } from '../advanceTime.js';
import { beginForgettingChallenge, retreatFromForgetting } from '../forgetting.js';

function storage() {
  const values = new Map();
  return { getItem: key => values.get(key) || null, setItem: (key, value) => values.set(key, value) };
}
describe('save and unattended progress protection', () => {
  it('rotates valid saves and recovers a backup without overwriting the corrupt primary', () => {
    const store = storage();
    const state = createInitialState();
    writeSave(store, state, 100);
    writeSave(store, { ...state, totalTime: 20 }, 200);
    writeSave(store, { ...state, totalTime: 40 }, 300);
    store.setItem(SAVE_KEY, '{broken');
    const result = loadSave(store);
    expect(result.state.totalTime).toBe(20);
    expect(result.blocked).toBe(true);
    expect(store.getItem(SAVE_KEY)).toBe('{broken');
    expect(parseSave(store.getItem(BACKUP_KEYS[1])).totalTime).toBe(0);
  });
  it('rejects corrupt values, future versions, and malformed structures', () => {
    const initial = createInitialState();
    for (const patch of [{ era: 11 }, { saveVersion: 999 }, { upgrades: [] }, { totalTime: -10 }, { resources: { food: { amount: null } } }]) {
      expect(() => parseSave(JSON.stringify({ ...initial, ...patch }))).toThrow();
    }
  });
  it('reports storage failures and never mistakes corruption for a fresh game', () => {
    const store = storage();
    store.setItem(SAVE_KEY, '{}');
    expect(loadSave(store)).toMatchObject({ state: null, blocked: true });
    store.setItem = () => { throw new DOMException('full', 'QuotaExceededError'); };
    expect(writeSave(store, createInitialState())).toMatch(/could not be saved/);
  });
  it('exports current progress and migration leaves the original object intact', () => {
    const state = createInitialState();
    const before = JSON.stringify(state);
    const migrated = migrateState(state);
    migrated.resources.food.amount = 70;
    expect(JSON.stringify(state)).toBe(before);
    expect(parseSave(serializeSave(migrated, 123)).resources.food.amount).toBe(70);
  });
  it('an unattended era ten never starts a siege or resets progress', () => {
    const state = { ...createInitialState(), era: 10 };
    const after = advanceTime(state, 10800, () => 0.99);
    expect(after.forgetting).toBeNull();
    expect(after.prestigeCount).toBe(0);
    expect(after.era).toBe(10);
  });
  it('a failed optional siege permits retreat and never forces prestige', () => {
    let state = beginForgettingChallenge({ ...createInitialState(), era: 10 });
    state = { ...state, forgetting: { ...state.forgetting, collapsed: true, collapsedAt: 0, scars: { 'dyson:assembly': true } } };
    state = advanceTime(state, 20, () => 0.99);
    expect(state.prestigeCount).toBe(0);
    const after = retreatFromForgetting(state);
    expect(after.forgetting).toBeNull();
    expect(after.forgettingChallengeActive).toBe(false);
    expect(after.era).toBe(10);
  });
});
