import { describe, expect, it } from 'vitest';
import { buyBuilding, click, createState, catchEcho } from '../engine.js';
import { SAVE_KEY, LEGACY_SAVE_KEY, exportSave, importLegacySave, importSave, loadSave, parseSave, serializeSave, writeSave } from '../save.js';

function memoryStorage(entries = {}) {
  const data = new Map(Object.entries(entries));
  return { getItem: k => data.get(k) ?? null, setItem: (k, v) => data.set(k, v), removeItem: k => data.delete(k), data };
}

describe('saves', () => {
  it('round-trip a game in progress', () => {
    let state = click(createState(0), 200);
    state = buyBuilding(state, 'scavenger', 3);
    state = catchEcho({ ...state, echo: { timer: 0, active: { x: 0.5, y: 0.5, remaining: 3 } } }, () => 0.6).state;
    const restored = parseSave(serializeSave(state, 1234));
    expect(restored).toEqual({ ...state, lastSaved: 1234, echo: { ...state.echo, active: null } });
    expect(importSave(exportSave(state))).toMatchObject({ buildings: state.buildings, salvage: state.salvage });
  });

  it('reject corrupt values and drop unknown content', () => {
    const text = serializeSave(createState(0));
    expect(() => parseSave(JSON.stringify({ ...JSON.parse(text), salvage: -1 }))).toThrow();
    expect(() => parseSave(JSON.stringify({ ...JSON.parse(text), buildings: { scavenger: 1.5 } }))).toThrow();
    expect(() => parseSave(JSON.stringify({ ...JSON.parse(text), version: 99 }))).toThrow();
    const cleaned = parseSave(JSON.stringify({ ...JSON.parse(text), buildings: { retired: 4 }, upgrades: { retired: true } }));
    expect(cleaned.buildings).toEqual({});
    expect(cleaned.upgrades).toEqual({});
  });

  it('keep a backup and fall back to it', () => {
    const storage = memoryStorage();
    writeSave(storage, click(createState(0), 5));
    writeSave(storage, click(createState(0), 9));
    storage.setItem(SAVE_KEY, '{broken');
    const loaded = loadSave(storage);
    expect(loaded.state.salvage).toBe(5);
    expect(loaded.warning).toMatch(/backup/);
  });

  it('welcome players of the original game with memories and leave the old save alone', () => {
    const legacy = JSON.stringify({ era: 6, lifetimeHighestEra: 8, prestigeCount: 3, resources: { labor: { amount: 5 } } });
    const storage = memoryStorage({ [LEGACY_SAVE_KEY]: legacy });
    const loaded = loadSave(storage);
    expect(loaded.legacy).toBe(true);
    expect(loaded.state.bonusMemories).toBe(8 * 5 + 3 * 10);
    expect(storage.getItem(LEGACY_SAVE_KEY)).toBe(legacy);
    expect(importLegacySave(JSON.stringify({ era: 10, prestigeCount: 1000, resources: {} })).bonusMemories).toBe(250);
    expect(loadSave(memoryStorage()).state).toBeNull();
  });
});

describe('lesson refunds', () => {
  it('refund retired lessons and any the memories can no longer pay for', () => {
    const saved = { ...createState(0), memories: 12, memoryUpgrades: { patientRuins: true, starterKit: true, starterCamp: true, lingeringEcho: true }, spentMemories: 40 };
    const loaded = parseSave(JSON.stringify(saved));
    // starterCamp is retired and Lingering Glimmer now costs more than was
    // earned (and needs Glimmer Sense); both are refunded.
    expect(loaded.memoryUpgrades).toEqual({ patientRuins: true, starterKit: true });
    expect(loaded.spentMemories).toBeUndefined();
  });
});
