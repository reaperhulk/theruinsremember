// Exploration events system (Era 3+)
// Random events that fire during tick and grant instant or timed bonuses.

import { getEligibleEvents } from '../data/events.js';

const BASE_EVENT_CHANCE = 0.02; // 2% per second of gameplay

// Check whether a random event fires this tick.
// `roll` is optional 0-1 number for deterministic testing.
// Returns { state, event } where event is the triggered event object or null.
export function checkForEvent(state, dt, roll = Math.random()) {
  if (state.era < 2) return { state, event: null };

  // Event Magnet prestige upgrade: 50% more events
  const hasEventMagnet = state.prestigeUpgrades && state.prestigeUpgrades.eventMagnet;
  const eventChance = hasEventMagnet ? BASE_EVENT_CHANCE * 1.5 : BASE_EVENT_CHANCE;

  // Probability scales with dt so faster/slower ticks behave consistently
  const chance = 1 - Math.pow(1 - eventChance, dt);
  if (roll >= chance) return { state, event: null };

  const eligible = getEligibleEvents(state.era);
  if (eligible.length === 0) return { state, event: null };

  // Pick a deterministic event based on roll position within the eligible set
  const index = Math.floor((roll / chance) * eligible.length) % eligible.length;
  const event = eligible[index];

  const newState = applyEvent(state, event);
  return { state: newState, event };
}

// Apply an event's effect to the state
export function applyEvent(state, event) {
  if (event.type === 'instant') {
    return applyInstantEvent(state, event);
  }
  if (event.type === 'timed') {
    return applyTimedEvent(state, event);
  }
  return state;
}

function applyInstantEvent(state, event) {
  const { resourceId, amount } = event.effect;
  const r = state.resources[resourceId];
  if (!r) return state;

  // Scale instant rewards by era and prestige so events stay relevant
  const eraScale = 1 + (state.era - 1) * 0.5;
  const scaledAmount = amount * eraScale * state.prestigeMultiplier;

  return {
    ...state,
    resources: {
      ...state.resources,
      [resourceId]: {
        ...r,
        amount: r.amount + scaledAmount,
      },
    },
  };
}

function applyTimedEvent(state, event) {
  const activeEffects = state.activeEffects || [];
  const endsAt = state.totalTime + event.duration;

  return {
    ...state,
    activeEffects: [
      ...activeEffects,
      { id: event.id, endsAt, effect: event.effect, description: event.description },
    ],
  };
}

// Remove expired effects. Call during tick.
export function expireEffects(state) {
  const activeEffects = state.activeEffects || [];
  if (activeEffects.length === 0) return state;

  const remaining = activeEffects.filter(e => e.endsAt > state.totalTime);
  if (remaining.length === activeEffects.length) return state;

  return { ...state, activeEffects: remaining };
}

// Get total rate multiplier bonus from active timed effects for a resource.
export function getTimedRateMultiplier(state, resourceId) {
  const activeEffects = state.activeEffects || [];
  let mult = 1;
  for (const ae of activeEffects) {
    if (ae.effect.resourceId === resourceId && ae.effect.rateMultBonus) {
      mult *= ae.effect.rateMultBonus;
    }
  }
  return mult;
}
