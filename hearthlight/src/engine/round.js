// A round: one settlement's life, measured in nights survived.
// Days are for one draft decision and Glow; nights belong to the dark.
import { createSlots, getAdjacentSlots } from './map.js';
import { STRUCTURES, STRUCTURE_IDS } from './structures.js';
import { getDraftSize, getUnlockedRings, getWardenCount } from './meta.js';

export const DAY_LENGTH = 25;
export const START_GLOW = 12;
export const DAWN_GLOW_PER_STRUCTURE = 3;
export const LEVEL_UP_NIGHTS = 3;
export const HEART_MAX = 100;

// Draw today's draft: distinct structures, with visible pity — at least one
// defensive option is always offered.
export function drawDraft(state, rng) {
  const size = getDraftSize(state);
  const pool = [...STRUCTURE_IDS];
  const draft = [];
  while (draft.length < size && pool.length > 0) {
    const totalWeight = pool.reduce((sum, id) => sum + STRUCTURES[id].weight, 0);
    let roll = rng() * totalWeight;
    let pick = pool[0];
    for (const id of pool) {
      roll -= STRUCTURES[id].weight;
      if (roll <= 0) { pick = id; break; }
    }
    draft.push(pick);
    pool.splice(pool.indexOf(pick), 1);
  }
  if (!draft.some(id => STRUCTURES[id].defensive)) {
    draft[draft.length - 1] = 'palisade';
  }
  return draft;
}

export function beginRound(state, rng = Math.random) {
  if (state.round && state.round.phase !== 'fallen') return state;
  const roundState = {
    day: 1,
    phase: 'day',
    time: 0,
    phaseStart: 0,
    glow: START_GLOW + (state.meta.morningStockpile ? 15 : 0),
    heart: HEART_MAX,
    slots: createSlots(getUnlockedRings(state)),
    draft: [],
    placedToday: false,
    shades: [],
    wardens: Array.from({ length: getWardenCount(state) }, (_, index) => ({
      id: index + 1,
      slotId: null,
      movedAt: -999,
    })),
    towerCharges: {},
    nextShadeId: 1,
    log: [{ day: 1, message: 'The Heart is lit. The dark is patient.' }],
  };
  roundState.draft = drawDraft(state, rng);
  return { ...state, totalRounds: state.totalRounds + 1, round: roundState };
}

export function getStructureHp(state, structureId) {
  return STRUCTURES[structureId].hp + (state.meta.stoneFoundations ? 1 : 0);
}

// Glow production per second, including well adjacency and levels.
export function getGlowRate(state) {
  const round = state.round;
  if (!round) return 0;
  let rate = 1; // the Heart's own trickle
  for (const slot of round.slots) {
    if (!slot.structure) continue;
    const def = STRUCTURES[slot.structure.type];
    const levelMult = slot.structure.level >= 2 ? 1.5 : 1;
    rate += (def.glowPerSecond || 0) * levelMult;
    if (def.adjacencyBonus) {
      for (const neighbor of getAdjacentSlots(round.slots, slot.id)) {
        const bonus = neighbor.structure && def.adjacencyBonus[neighbor.structure.type];
        if (bonus) rate += bonus * levelMult;
      }
    }
  }
  return rate;
}

// The one day decision: place a drafted structure on an empty slot.
export function placeStructure(state, structureId, slotId) {
  const round = state.round;
  if (!round || round.phase !== 'day' || round.placedToday) return null;
  if (!round.draft.includes(structureId)) return null;
  const def = STRUCTURES[structureId];
  if (round.glow < def.cost) return null;
  const slotIndex = round.slots.findIndex(slot => slot.id === slotId);
  if (slotIndex < 0 || round.slots[slotIndex].structure) return null;

  const slots = [...round.slots];
  slots[slotIndex] = {
    ...slots[slotIndex],
    structure: {
      type: structureId,
      hp: getStructureHp(state, structureId),
      level: 1,
      nightsSurvived: 0,
    },
  };
  return {
    ...state,
    round: {
      ...round,
      glow: round.glow - def.cost,
      slots,
      placedToday: true,
    },
  };
}

// End the day early (or the timer does it): dusk falls.
export function duskReady(round) {
  return round.phase === 'day';
}

export function countStructures(round, predicate = () => true) {
  return round.slots.filter(slot => slot.structure && predicate(slot)).length;
}

export function getEmbersEarned(round) {
  const nights = round.day - 1;
  const alive = countStructures(round);
  const shrines = countStructures(round, slot => slot.structure.type === 'shrine');
  return Math.max(1, nights + Math.floor(alive / 2) + shrines * 2);
}

// Bank a fallen round: Embers home, round cleared.
export function collectEmbers(state) {
  const round = state.round;
  if (!round || round.phase !== 'fallen') return state;
  const earned = getEmbersEarned(round);
  return {
    ...state,
    embers: state.embers + earned,
    bestNights: Math.max(state.bestNights, round.day - 1),
    lastRound: { nights: round.day - 1, embers: earned },
    round: null,
  };
}
