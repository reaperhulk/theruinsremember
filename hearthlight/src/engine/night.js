// The night: shades creep from the rim toward what you built.
// One verb — move the Warden. Everything else is what you built by day.
import { STRUCTURES } from './structures.js';
import { getAdjacentSlots } from './map.js';

export const NIGHT_MIN_LENGTH = 14;
export const SHADE_FEED_TIME = 5;
export const SHADE_HOLD_TIME = 4.5;
export const SHADE_HOLD_TIME_SWIFT = 3;
export const WARDEN_COOLDOWN = 6;
export const WARDEN_COOLDOWN_SWIFT = 3;
export const HEART_HIT = 15;      // a shade that reaches the Heart
export const STRUCTURE_HIT = 8;   // heart-light lost when a structure falls
export const EMPTY_ARRIVAL_HIT = 8;
export const NIGHT_ESCALATION = 1.15;

// Uncapped and linear: night N sends N shades. The dark always wins
// eventually — how long you delay it is the scoreboard.
export function getShadeCount(night) {
  return night;
}

export function getHoldTime(state) {
  return state.meta.swiftWarden ? SHADE_HOLD_TIME_SWIFT : SHADE_HOLD_TIME;
}

export function getWardenCooldown(state) {
  return state.meta.swiftWarden ? WARDEN_COOLDOWN_SWIFT : WARDEN_COOLDOWN;
}

function lanternSlow(round, slotId) {
  const lit = getAdjacentSlots(round.slots, slotId).some(neighbor =>
    neighbor.structure?.type === 'lantern');
  return lit ? STRUCTURES.lantern.slowsAdjacent : 1;
}

// Dusk: spawn the night's shades with the injected rng.
export function spawnShades(state, rng) {
  const round = state.round;
  const count = getShadeCount(round.day);
  const speed = Math.pow(NIGHT_ESCALATION, round.day - 1);
  const occupied = round.slots.filter(slot => slot.structure);
  const shades = [];
  let nextId = round.nextShadeId;

  for (let index = 0; index < count; index++) {
    let targetSlotId = null;
    if (occupied.length > 0) {
      const totalWeight = occupied.reduce((sum, slot) =>
        sum + (STRUCTURES[slot.structure.type].tauntWeight || 1), 0);
      let roll = rng() * totalWeight;
      let pick = occupied[0];
      for (const slot of occupied) {
        roll -= STRUCTURES[slot.structure.type].tauntWeight || 1;
        if (roll <= 0) { pick = slot; break; }
      }
      targetSlotId = pick.id;
    }
    const approach = ((8 + 5 * rng()) / speed) * (targetSlotId ? lanternSlow(round, targetSlotId) : 1);
    shades.push({
      id: nextId++,
      targetSlotId, // null targets the Heart itself
      spawnAngle: rng() * Math.PI * 2,
      spawnedAt: round.time,
      arrivesAt: round.time + approach,
      phase: 'approach',
      heldSince: null,
      feedsAt: null,
    });
  }

  const towerCharges = {};
  for (const slot of round.slots) {
    if (slot.structure?.type === 'watchtower') towerCharges[slot.id] = 1;
  }

  return {
    ...state,
    round: {
      ...round,
      phase: 'night',
      phaseStart: round.time,
      shades,
      nextShadeId: nextId,
      towerCharges,
      placedToday: false,
    },
  };
}

// The one night action: send a warden to stand on a slot.
export function moveWarden(state, wardenId, slotId) {
  const round = state.round;
  if (!round || round.phase !== 'night') return null;
  const warden = round.wardens.find(candidate => candidate.id === wardenId);
  if (!warden || warden.slotId === slotId) return null;
  if (round.time - warden.movedAt < getWardenCooldown(state)) return null;
  if (!round.slots.some(slot => slot.id === slotId)) return null;
  if (round.wardens.some(other => other.id !== wardenId && other.slotId === slotId)) return null;

  return {
    ...state,
    round: {
      ...round,
      wardens: round.wardens.map(candidate =>
        candidate.id === wardenId ? { ...candidate, slotId, movedAt: round.time } : candidate),
    },
  };
}

function guardedSlotIds(round) {
  return new Set(round.wardens.map(warden => warden.slotId).filter(Boolean));
}

// Advance the night by one bounded slice. Returns the updated round pieces.
export function advanceNightSlice(state, round) {
  const now = round.time;
  const guarded = guardedSlotIds(round);
  const holdTime = getHoldTime(state);
  let { heart } = round;
  let slots = round.slots;
  let towerCharges = { ...round.towerCharges };
  const shades = [];
  const log = [];

  const slotById = id => slots.find(slot => slot.id === id);

  for (const shade of round.shades) {
    let current = shade;

    if (current.phase === 'approach' && now >= current.arrivesAt) {
      const target = current.targetSlotId ? slotById(current.targetSlotId) : null;
      if (current.targetSlotId && (!target || !target.structure)) {
        // The prize is already gone — the shade vents at the Heart.
        heart -= EMPTY_ARRIVAL_HIT;
        log.push('A shade finds only ash and howls at the Heart.');
        continue;
      }
      if (!current.targetSlotId) {
        heart -= HEART_HIT;
        log.push('A shade reaches the Heart. The light gutters.');
        continue;
      }
      // Watchtower intercept: one banish per tower per night.
      const towerSlot = getAdjacentSlots(slots, current.targetSlotId)
        .find(neighbor => neighbor.structure?.type === 'watchtower' && towerCharges[neighbor.id] > 0);
      if (towerSlot) {
        towerCharges = { ...towerCharges, [towerSlot.id]: towerCharges[towerSlot.id] - 1 };
        log.push('The watchtower burns a shade out of the dark.');
        continue;
      }
      current = guarded.has(current.targetSlotId)
        ? { ...current, phase: 'held', heldSince: current.arrivesAt }
        : { ...current, phase: 'feeding', feedsAt: current.arrivesAt + SHADE_FEED_TIME };
    }

    if (current.phase === 'held') {
      if (!guarded.has(current.targetSlotId)) {
        current = { ...current, phase: 'feeding', heldSince: null, feedsAt: now + SHADE_FEED_TIME };
      } else if (now - current.heldSince >= holdTime) {
        log.push('The Warden holds the line. A shade is banished.');
        continue;
      }
    }

    if (current.phase === 'feeding') {
      if (guarded.has(current.targetSlotId)) {
        current = { ...current, phase: 'held', heldSince: now, feedsAt: null };
      } else if (now >= current.feedsAt) {
        const index = slots.findIndex(slot => slot.id === current.targetSlotId);
        const structure = slots[index]?.structure;
        if (structure) {
          const hp = structure.hp - 1;
          slots = [...slots];
          if (hp <= 0) {
            slots[index] = { ...slots[index], structure: null };
            heart -= STRUCTURE_HIT;
            log.push(`The dark takes the ${STRUCTURES[structure.type].name}.`);
          } else {
            slots[index] = { ...slots[index], structure: { ...structure, hp } };
            log.push(`Teeth in the ${STRUCTURES[structure.type].name} — it holds, barely.`);
          }
        }
        continue; // the shade is sated
      }
    }

    shades.push(current);
  }

  return { ...round, heart, slots, towerCharges, shades, pendingLog: log };
}

export function nightResolved(round) {
  return round.shades.length === 0 && round.time - round.phaseStart >= NIGHT_MIN_LENGTH;
}
