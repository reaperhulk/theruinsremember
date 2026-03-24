// Exploration events system (Era 3+)
// Random events that fire during tick and grant instant or timed bonuses.

import { getEligibleEvents } from '../data/events.js';
import { getEffectivePrestige } from './resources.js';

const BASE_EVENT_CHANCE = 0.02; // 2% per second of gameplay

// Check whether a random event fires this tick.
// `roll` is optional 0-1 number for deterministic testing.
// Returns { state, event } where event is the triggered event object or null.
export function checkForEvent(state, dt, roll = Math.random()) {
  if (state.era < 1) return { state, event: null };

  // Event Magnet prestige upgrade: 50% more events
  const hasEventMagnet = state.prestigeUpgrades && state.prestigeUpgrades.eventMagnet;
  // Temporal Echo prestige upgrade: scales with prestige count (1.25x per prestige, capped at 3x)
  const hasTemporalEcho = state.prestigeUpgrades && state.prestigeUpgrades.temporalEcho;
  const echoBonus = hasTemporalEcho ? Math.min(2, 1 + 0.15 * (state.prestigeCount || 1)) : 1;
  let eventChance = BASE_EVENT_CHANCE;
  if (hasEventMagnet) eventChance *= 1.5;
  eventChance *= echoBonus;

  // Probability scales with dt so faster/slower ticks behave consistently
  const chance = 1 - Math.pow(1 - eventChance, dt);
  if (roll >= chance) return { state, event: null };

  const eligible = getEligibleEvents(state.era);
  if (eligible.length === 0) return { state, event: null };

  // Pick event using weighted selection — events with a `chance` field are rarer
  const weights = eligible.map(e => e.chance || 1);
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  const target = (roll / chance) * totalWeight;
  let cumulative = 0;
  let event = eligible[0];
  for (let i = 0; i < eligible.length; i++) {
    cumulative += weights[i];
    if (target < cumulative) { event = eligible[i]; break; }
  }

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
  // Support multi-effect events via an `effects` array
  if (event.effects) {
    let s = state;
    for (const fx of event.effects) {
      const r = s.resources[fx.target];
      if (!r) continue;

      if (fx.type === 'resource_percent') {
        // Remove a percentage of current amount — scales naturally with progress
        const current = r.amount || 0;
        const loss = current * Math.abs(fx.value);
        s = {
          ...s,
          resources: {
            ...s.resources,
            [fx.target]: { ...r, amount: Math.max(0, current - loss) },
          },
        };
      } else {
        const eraScale = 1 + (s.era - 1) * 0.5;
        const scaledAmount = fx.value * eraScale * getEffectivePrestige(s.prestigeMultiplier || 1);
        s = {
          ...s,
          resources: {
            ...s.resources,
            [fx.target]: {
              ...r,
              amount: Math.max(0, r.amount + scaledAmount),
            },
          },
        };
      }
    }
    return s;
  }

  const { resourceId, amount } = event.effect;
  const r = state.resources[resourceId];
  if (!r) return state;

  // Scale instant rewards by era and effective prestige so events stay relevant
  const eraScale = 1 + (state.era - 1) * 0.5;
  const scaledAmount = amount * eraScale * getEffectivePrestige(state.prestigeMultiplier || 1);

  return {
    ...state,
    resources: {
      ...state.resources,
      [resourceId]: {
        ...r,
        amount: Math.max(0, r.amount + scaledAmount),
      },
    },
  };
}

function applyTimedEvent(state, event) {
  const activeEffects = state.activeEffects || [];
  const startedAt = state.totalTime;
  const endsAt = startedAt + event.duration;

  // For events with an effects array, convert to the internal effect format
  const effect = event.effect || (event.effects && event.effects.length > 0
    ? { resourceId: event.effects[0].target, rateMultBonus: event.effects[0].value }
    : {});

  return {
    ...state,
    activeEffects: [
      ...activeEffects,
      { id: event.id, startedAt, endsAt, effect, description: event.description },
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
    // Support singular .effect format (events, docking)
    if (ae.effect) {
      const matches = ae.effect.resourceId === resourceId || ae.effect.resourceId === 'all';
      if (matches && ae.effect.rateMultBonus) {
        mult *= ae.effect.rateMultBonus;
      }
    }
    // Support plural .effects array format (hacking)
    if (ae.effects) {
      for (const eff of ae.effects) {
        const matches = eff.resourceId === resourceId || eff.resourceId === 'all';
        if (matches && eff.rateMultBonus) {
          mult *= eff.rateMultBonus;
        }
      }
    }
  }
  mult = Math.max(0.25, mult);

  // Mechanic: crisisInversion — if owned and mult < 1, invert it (capped at 4x)
  if (state.upgrades?.entropySiphon && mult < 1) {
    mult = Math.min(4, 1 / mult);
  }

  return mult;
}
