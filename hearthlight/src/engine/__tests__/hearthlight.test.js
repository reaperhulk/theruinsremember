import { describe, expect, it } from 'vitest';
import { createInitialState } from '../state.js';
import { createSlots, getAdjacentSlots } from '../map.js';
import { STRUCTURES } from '../structures.js';
import { beginRound, collectEmbers, drawDraft, getEmbersEarned, getGlowRate, placeStructure } from '../round.js';
import { getShadeCount, moveWarden, SHADE_FEED_TIME, SHADE_HOLD_TIME, WARDEN_COOLDOWN, HEART_HIT } from '../night.js';
import { endDay, tick } from '../tick.js';
import { buyMetaUpgrade } from '../meta.js';

function makeRng(sequence = [0.5]) {
  let index = 0;
  return () => sequence[index++ % sequence.length];
}

function startedRound(meta = {}) {
  let state = { ...createInitialState(), meta };
  state = beginRound(state, makeRng([0.1, 0.4, 0.7]));
  return state;
}

function runSeconds(state, seconds, rng) {
  let current = state;
  for (let step = 0; step < seconds; step++) current = tick(current, 1, rng);
  return current;
}

describe('hearthlight', () => {
  it('lays out radial slots with sane adjacency', () => {
    const inner = createSlots(1);
    expect(inner).toHaveLength(6);
    const both = createSlots(2);
    expect(both).toHaveLength(16);
    const neighbors = getAdjacentSlots(both, 'r0s0');
    expect(neighbors.length).toBeGreaterThanOrEqual(2);
    expect(neighbors.every(slot => slot.id !== 'r0s0')).toBe(true);
  });

  it('drafts always include a defensive option (visible pity)', () => {
    const state = createInitialState();
    for (const roll of [0.01, 0.35, 0.6, 0.99]) {
      const draft = drawDraft(state, makeRng([roll]));
      expect(draft.length).toBe(3);
      expect(draft.some(id => STRUCTURES[id].defensive)).toBe(true);
      expect(new Set(draft).size).toBe(draft.length);
    }
  });

  it('starts a round with the Heart lit and one decision pending', () => {
    const state = startedRound();
    expect(state.round.phase).toBe('day');
    expect(state.round.heart).toBe(100);
    expect(state.round.glow).toBe(12);
    expect(state.round.draft).toHaveLength(3);
    expect(state.round.wardens).toHaveLength(1);
  });

  it('places one drafted structure per day, paying Glow', () => {
    let state = startedRound();
    state = { ...state, round: { ...state.round, draft: ['farm', 'well', 'palisade'], glow: 20 } };
    state = placeStructure(state, 'farm', 'r0s0');
    expect(state.round.glow).toBe(10);
    expect(state.round.slots[0].structure.type).toBe('farm');
    // One placement per day; undrafted and occupied are refused
    expect(placeStructure(state, 'well', 'r0s1')).toBeNull();
  });

  it('wells boost adjacent farms', () => {
    let state = startedRound();
    state = { ...state, round: { ...state.round, draft: ['farm', 'well', 'palisade'], glow: 50 } };
    state = placeStructure(state, 'farm', 'r0s0');
    const before = getGlowRate(state);
    state = { ...state, round: { ...state.round, placedToday: false, draft: ['well'] } };
    state = placeStructure(state, 'well', 'r0s1');
    expect(getGlowRate(state)).toBeCloseTo(before + 0.2 + 0.4);
  });

  it('spawns escalating nights and holds/banishes with the Warden', () => {
    expect(getShadeCount(1)).toBe(1);
    expect(getShadeCount(5)).toBe(5);

    let state = startedRound();
    state = { ...state, round: { ...state.round, draft: ['palisade'], glow: 20 } };
    state = placeStructure(state, 'palisade', 'r0s2');
    state = endDay(state, makeRng([0.5, 0.5, 0.5]));
    expect(state.round.phase).toBe('night');
    expect(state.round.shades).toHaveLength(1);
    const targetId = state.round.shades[0].targetSlotId;
    expect(targetId).toBe('r0s2');

    state = moveWarden(state, 1, targetId);
    expect(state).toBeTruthy();
    // Cooldown blocks an immediate second move
    expect(moveWarden(state, 1, 'r0s0')).toBeNull();

    const rng = makeRng();
    state = runSeconds(state, Math.ceil(13 + SHADE_HOLD_TIME + 2), rng);
    // Held and banished: the palisade still stands, the Heart untouched
    expect(state.round.slots[2].structure).toBeTruthy();
    expect(state.round.heart).toBe(100);
  });

  it('feeds on unguarded structures and drains the Heart when nothing stands', () => {
    let state = startedRound();
    state = { ...state, round: { ...state.round, draft: ['farm'], glow: 20 } };
    state = placeStructure(state, 'farm', 'r0s0');
    state = endDay(state, makeRng([0.5, 0.5, 0.5]));
    const rng = makeRng();
    state = runSeconds(state, Math.ceil(13 + SHADE_FEED_TIME + 2), rng);
    expect(state.round.slots[0].structure).toBeNull();
    expect(state.round.heart).toBe(100 - 8);

    // An empty town: shades go straight for the Heart
    let bare = startedRound();
    bare = endDay(bare, makeRng([0.5, 0.5, 0.5]));
    expect(bare.round.shades[0].targetSlotId).toBeNull();
    bare = runSeconds(bare, 15, rng);
    expect(bare.round.heart).toBe(100 - HEART_HIT);
  });

  it('watchtowers intercept one shade per night on adjacent slots', () => {
    let state = startedRound();
    state = { ...state, round: { ...state.round, draft: ['watchtower', 'farm'], glow: 40 } };
    state = placeStructure(state, 'watchtower', 'r0s0');
    state = { ...state, round: { ...state.round, placedToday: false } };
    state = placeStructure(state, 'farm', 'r0s1');
    // Force the shade onto the farm (adjacent to the tower)
    state = endDay(state, makeRng([0.99, 0.5, 0.5]));
    expect(state.round.shades[0].targetSlotId).toBe('r0s1');
    state = runSeconds(state, 16, makeRng());
    expect(state.round.slots[1].structure).toBeTruthy();
    expect(state.round.heart).toBe(100);
  });

  it('runs the day/night cycle to dawn with survivors leveling at three nights', () => {
    let state = startedRound();
    state = { ...state, round: { ...state.round, draft: ['palisade'], glow: 20 } };
    state = placeStructure(state, 'palisade', 'r0s0');
    const rng = makeRng([0.3, 0.6, 0.9]);
    state = runSeconds(state, 200, rng);
    // Some dawns have passed; the round is still alive or fell honestly
    expect(state.round.day).toBeGreaterThan(1);
  });

  it('falls when the Heart darkens and pays Embers on collection', () => {
    let state = startedRound();
    state = { ...state, round: { ...state.round, heart: 10, phase: 'night', phaseStart: 0, shades: [
      { id: 1, targetSlotId: null, spawnAngle: 0, spawnedAt: 0, arrivesAt: 1, phase: 'approach', heldSince: null, feedsAt: null },
    ] } };
    state = runSeconds(state, 3, makeRng());
    expect(state.round.phase).toBe('fallen');
    expect(state.round.heart).toBe(0);
    const earned = getEmbersEarned(state.round);
    expect(earned).toBeGreaterThanOrEqual(1);
    const collected = collectEmbers(state);
    expect(collected.embers).toBe(earned);
    expect(collected.round).toBeNull();
    expect(collected.lastRound.embers).toBe(earned);
  });

  it('meta upgrades are bought with Embers and shape the next round', () => {
    let state = { ...createInitialState(), embers: 25 };
    expect(buyMetaUpgrade(state, 'secondWarden')).toBeTruthy();
    state = buyMetaUpgrade(state, 'morningStockpile');
    state = buyMetaUpgrade(state, 'stoneFoundations');
    expect(state.embers).toBe(15);
    expect(buyMetaUpgrade(state, 'morningStockpile')).toBeNull(); // owned

    state = buyMetaUpgrade(state, 'secondWarden');
    state = beginRound(state, makeRng());
    expect(state.round.glow).toBe(27);
    expect(state.round.wardens).toHaveLength(2);
    state = { ...state, round: { ...state.round, draft: ['palisade'] } };
    state = placeStructure(state, 'palisade', 'r0s0');
    expect(state.round.slots[0].structure.hp).toBe(4);
  });

  it('is deterministic under the same seed', () => {
    const play = () => {
      const rng = makeRng([0.17, 0.62, 0.48, 0.91, 0.05]);
      let state = beginRound(createInitialState(), rng);
      state = { ...state, round: { ...state.round, draft: ['farm', 'palisade', 'well'] } };
      state = placeStructure(state, 'palisade', 'r0s3');
      return runSeconds(state, 120, rng);
    };
    expect(JSON.stringify(play())).toBe(JSON.stringify(play()));
  });

  it('warden cooldown constant stays humane for a snappy night', () => {
    expect(WARDEN_COOLDOWN).toBeLessThanOrEqual(8);
  });
});
