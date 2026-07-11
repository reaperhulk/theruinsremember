import { describe, expect, it } from 'vitest';
import {
  advanceForgetting,
  autoStationWarden,
  FIRST_SURGE_DELAY,
  FORGETTING_BASE_RATE,
  FORGETTING_COLLAPSE,
  getForgettingStats,
  getMemoryConstellation,
  getWardenCapacity,
  placeWarden,
  SCAR_METER_PENALTY,
  TENDRIL_APPROACH_TIME,
  TENDRIL_CONSUME_TIME,
  TENDRIL_SEAL_HOLD,
  WARDEN_MOVE_COOLDOWN,
} from '../forgetting.js';
import { getWeaveProductionMultiplier } from '../weaving.js';
import { hasRelic } from '../relics.js';
import { createInitialState } from '../state.js';

// Deterministic rng: cycles through a fixed sequence.
function makeRng(sequence = [0.5]) {
  let index = 0;
  return () => sequence[index++ % sequence.length];
}

function makeSiegeState() {
  const state = createInitialState();
  state.era = 10;
  state.totalTime = 1000;
  state.wovenLaws = { temporal: true, causal: true };
  state.lockedSignals = { power: true };
  state.starRoutes = [{ from: 'sol', to: 'alpha' }];
  state.activeRelics = ['emberSeed'];
  state.senateGov = { leader: 'merchants', partner: 'scholars', ratified: false };
  return state;
}

// Advance in one-second steps, mirroring the bot loop.
function run(state, seconds, rng) {
  let current = state;
  for (let step = 0; step < seconds; step++) {
    current = { ...current, totalTime: current.totalTime + 1 };
    current = advanceForgetting(current, 1, rng);
  }
  return current;
}

describe('the Forgetting', () => {
  it('builds the constellation from what the run actually built', () => {
    const nodes = getMemoryConstellation(makeSiegeState());
    const ids = nodes.map(node => node.id).sort();
    expect(ids).toEqual([
      'law:causal', 'law:temporal', 'lock:power',
      'relic:emberSeed', 'senate:gov', 'system:alpha', 'system:sol',
    ]);
  });

  it('activates at era 10 with wardens and a pure time meter before surges', () => {
    const rng = makeRng();
    const state = run(makeSiegeState(), FIRST_SURGE_DELAY - 5, rng);
    expect(state.forgetting).toBeTruthy();
    expect(state.forgetting.wardens).toHaveLength(getWardenCapacity(state));
    expect(state.forgetting.meter).toBeCloseTo(FORGETTING_BASE_RATE * (FIRST_SURGE_DELAY - 5), 3);
    expect(state.forgetting.tendrils).toHaveLength(0);
  });

  it('grants a third warden to a ratified government', () => {
    const state = makeSiegeState();
    state.senateGov = { ...state.senateGov, ratified: true };
    expect(getWardenCapacity(state)).toBe(3);
  });

  it('consumes an unguarded memory and scars its bonus', () => {
    const rng = makeRng([0.01, 0.5, 0.5]); // low roll targets the first open node
    const before = makeSiegeState();
    const horizon = FIRST_SURGE_DELAY + TENDRIL_APPROACH_TIME * 1.15 + TENDRIL_CONSUME_TIME + 3;
    const after = run(before, Math.ceil(horizon), rng);

    expect(after.forgetting.consumed).toBeGreaterThanOrEqual(1);
    const scarredIds = Object.keys(after.forgetting.scars);
    expect(scarredIds.length).toBe(after.forgetting.consumed);
    expect(after.forgetting.meter).toBeGreaterThan(SCAR_METER_PENALTY - 0.5);

    // Scarred bonuses go silent through their hooks
    for (const nodeId of scarredIds) {
      if (nodeId === 'law:temporal') expect(getWeaveProductionMultiplier(after, 'cosmicPower')).toBe(1);
      if (nodeId === 'relic:emberSeed') expect(hasRelic(after, 'emberSeed')).toBe(false);
    }
  });

  it('holds and seals a tendril when a warden guards the target', () => {
    const rng = makeRng([0.01, 0.5, 0.5]);
    let state = run(makeSiegeState(), FIRST_SURGE_DELAY + 1, rng);
    expect(state.forgetting.tendrils).toHaveLength(1);
    const targetId = state.forgetting.tendrils[0].targetId;

    const placed = placeWarden(state, 1, targetId);
    expect(placed).toBeTruthy();
    state = placed.state;

    const meterBefore = state.forgetting.meter;
    state = run(state, Math.ceil(TENDRIL_APPROACH_TIME * 1.15 + TENDRIL_SEAL_HOLD + 2), rng);
    expect(state.forgetting.sealed).toBeGreaterThanOrEqual(1);
    expect(Object.keys(state.forgetting.scars)).toHaveLength(0);
    // Sealing pushed the meter back below plain time-accumulation
    expect(state.forgetting.meter).toBeLessThan(meterBefore + FORGETTING_BASE_RATE * 100);
  });

  it('enforces the warden reposition cooldown and occupancy', () => {
    const rng = makeRng();
    let state = run(makeSiegeState(), 2, rng);

    const first = placeWarden(state, 1, 'law:temporal');
    expect(first).toBeTruthy();
    state = first.state;
    // Same warden cannot move again immediately
    expect(placeWarden(state, 1, 'law:causal')).toBeNull();
    // Another warden cannot stack on the same node
    expect(placeWarden(state, 2, 'law:temporal')).toBeNull();
    // After the cooldown the warden moves freely
    state = { ...state, totalTime: state.totalTime + WARDEN_MOVE_COOLDOWN };
    expect(placeWarden(state, 1, 'law:causal')).toBeTruthy();
  });

  it('leaves an empty civilization almost nothing to feed on', () => {
    const rng = makeRng();
    const empty = createInitialState();
    empty.era = 10;
    empty.totalTime = 1000;
    const after = run(empty, 300, rng);
    expect(after.forgetting.tendrils).toHaveLength(0);
    expect(after.forgetting.meter).toBeCloseTo(FORGETTING_BASE_RATE * 300, 2);
  });

  it('collapses at the threshold and freezes', () => {
    const rng = makeRng();
    let state = makeSiegeState();
    state = run(state, 1, rng);
    state = { ...state, forgetting: { ...state.forgetting, meter: FORGETTING_COLLAPSE - 0.001 } };
    state = run(state, 5, rng);
    expect(state.forgetting.collapsed).toBe(true);
    expect(state.forgetting.tendrils).toHaveLength(0);
    expect(placeWarden(state, 1, 'law:temporal')).toBeNull();
    const frozen = run(state, 10, rng);
    expect(frozen.forgetting.meter).toBe(FORGETTING_COLLAPSE);
  });

  it('is deterministic under the same rng seed', () => {
    const runOnce = () => {
      const rng = makeRng([0.13, 0.87, 0.42, 0.66, 0.09]);
      return run(makeSiegeState(), 400, rng);
    };
    const a = runOnce();
    const b = runOnce();
    expect(JSON.stringify(a.forgetting)).toBe(JSON.stringify(b.forgetting));
  });

  it('auto-stations the best available warden', () => {
    const rng = makeRng();
    let state = run(makeSiegeState(), 2, rng);

    // Idle warden goes first
    let result = autoStationWarden(state, 'law:temporal');
    expect(result.warden.id).toBe(1);
    state = result.state;

    // Second idle warden next; both now on cooldown
    result = autoStationWarden(state, 'law:causal');
    expect(result.warden.id).toBe(2);
    state = result.state;
    expect(autoStationWarden(state, 'lock:power')).toBeNull();

    // Off cooldown, a non-holding warden repositions
    state = { ...state, totalTime: state.totalTime + WARDEN_MOVE_COOLDOWN };
    result = autoStationWarden(state, 'lock:power');
    expect(result).toBeTruthy();
  });

  it('reports stats for bots and UI', () => {
    const rng = makeRng([0.01, 0.5, 0.5]);
    const state = run(makeSiegeState(), FIRST_SURGE_DELAY + 2, rng);
    const stats = getForgettingStats(state);
    expect(stats.active).toBe(true);
    expect(stats.tendrils).toHaveLength(1);
    expect(stats.tendrils[0].eta).toBeGreaterThan(0);
    expect(stats.tendrils[0].targetLabel).toBeTruthy();
    expect(stats.nodes.some(node => node.scarred)).toBe(false);
    expect(stats.wardens).toHaveLength(2);
  });
});
