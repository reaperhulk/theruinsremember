import { describe, expect, it } from 'vitest';
import { createInitialState } from '../state.js';
import {
  addEchoPressure,
  advanceEchoPressure,
  claimRelic,
  declineRelicOffer,
  getRelicCapacityMultiplier,
  getRelicDockingZoneMultiplier,
  getRelicProductionMultiplier,
} from '../relics.js';
import { runExpedition } from '../expeditions.js';
import { performPrestige } from '../prestige.js';

describe('recovered relics', () => {
  it('guarantees a unique three-relic offer when pressure fills', () => {
    const state = createInitialState();
    const after = advanceEchoPressure(state, 1000, () => 0.25);

    expect(after.echoPressure).toBe(100);
    expect(after.relicOffer).toHaveLength(3);
    expect(new Set(after.relicOffer).size).toBe(3);
  });

  it('adds a large pressure jump after a failed severe expedition', () => {
    const state = createInitialState();
    const { state: after, result } = runExpedition(state, 'descendVault', () => 0.99);

    expect(result.success).toBe(false);
    expect(after.echoPressure).toBe(40);
  });

  it('equips two relics and requires an explicit replacement after that', () => {
    let state = createInitialState();
    state = { ...state, relicOffer: ['emberSeed', 'openCircuit', 'voidSail'], echoPressure: 100 };
    state = claimRelic(state, 'emberSeed');
    state = { ...state, relicOffer: ['openCircuit', 'voidSail', 'pilgrimMap'], echoPressure: 100 };
    state = claimRelic(state, 'openCircuit');
    state = { ...state, relicOffer: ['voidSail', 'pilgrimMap', 'loomNeedle'], echoPressure: 100 };

    expect(claimRelic(state, 'voidSail').activeRelics).toEqual(['emberSeed', 'openCircuit']);
    expect(claimRelic(state, 'voidSail', 'emberSeed').activeRelics).toEqual(['voidSail', 'openCircuit']);
  });

  it('can decline an offer and begin building pressure again', () => {
    const state = addEchoPressure(createInitialState(), 100, [0, 0.2, 0.4]);
    const declined = declineRelicOffer(state);
    expect(declined.relicOffer).toEqual([]);
    expect(declined.echoPressure).toBe(0);
  });

  it('applies focused benefits and tradeoffs', () => {
    const state = createInitialState();
    state.activeRelics = ['emberSeed', 'openCircuit'];

    expect(getRelicProductionMultiplier(state, 'food')).toBeCloseTo(1.45);
    expect(getRelicProductionMultiplier(state, 'energy')).toBeCloseTo(0.85 * 1.4);
    expect(getRelicCapacityMultiplier(state)).toBe(0.9);
    state.activeRelics = ['voidSail'];
    expect(getRelicDockingZoneMultiplier(state)).toBe(1.2);
  });

  it('dissolves the entire relic loadout on prestige', () => {
    const state = createInitialState();
    state.era = 10;
    state.activeRelics = ['emberSeed', 'voidSail'];
    state.echoPressure = 73;
    state.relicOffer = ['pilgrimMap'];

    const after = performPrestige(state);
    expect(after.activeRelics).toEqual([]);
    expect(after.echoPressure).toBe(0);
    expect(after.relicOffer).toEqual([]);
  });
});
