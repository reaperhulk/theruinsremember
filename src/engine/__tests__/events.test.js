import { describe, it, expect } from 'vitest';
import { checkForEvent, applyEvent, expireEffects, getTimedRateMultiplier } from '../events.js';
import { createInitialState } from '../state.js';
import { events } from '../../data/events.js';
import { getEligibleEvents } from '../../data/events.js';

function makeState(overrides = {}) {
  const state = createInitialState();
  return { ...state, era: 3, totalTime: 100, activeEffects: [], ...overrides };
}

describe('events', () => {
  describe('getEligibleEvents', () => {
    it('returns lore events for era 1', () => {
      const eligible = getEligibleEvents(1);
      expect(eligible.length).toBeGreaterThan(0);
      expect(eligible.every(e => e.minEra <= 1)).toBe(true);
    });

    it('returns era 2 events at era 2', () => {
      const eligible = getEligibleEvents(2);
      expect(eligible.length).toBeGreaterThan(0);
      expect(eligible.every(e => e.minEra <= 2)).toBe(true);
    });

    it('returns era 3 events at era 3', () => {
      const eligible = getEligibleEvents(3);
      expect(eligible.length).toBeGreaterThan(0);
      expect(eligible.every(e => e.minEra <= 3)).toBe(true);
    });

    it('returns more events at higher eras', () => {
      const era4 = getEligibleEvents(4);
      const era8 = getEligibleEvents(8);
      expect(era8.length).toBeGreaterThanOrEqual(era4.length);
    });
  });

  describe('checkForEvent', () => {
    it('returns null event for era 1', () => {
      const state = makeState({ era: 1 });
      const { event } = checkForEvent(state, 1, 0.001);
      expect(event).toBeNull();
    });

    it('can trigger events at era 2', () => {
      const state = makeState({ era: 2 });
      const { event } = checkForEvent(state, 1, 0.001);
      expect(event).not.toBeNull();
    });

    it('returns null event when roll is high', () => {
      const state = makeState();
      const { event } = checkForEvent(state, 1, 0.99);
      expect(event).toBeNull();
    });

    it('triggers an event when roll is low enough', () => {
      const state = makeState();
      // With dt=1, chance = 1 - (1-0.02)^1 = 0.02
      // roll=0.001 < 0.02, so event triggers
      const { state: newState, event } = checkForEvent(state, 1, 0.001);
      expect(event).not.toBeNull();
      expect(event.minEra).toBeLessThanOrEqual(4);
    });

    it('does not mutate original state', () => {
      const state = makeState();
      const original = JSON.parse(JSON.stringify(state));
      checkForEvent(state, 1, 0.001);
      expect(state).toEqual(original);
    });
  });

  describe('applyEvent - instant', () => {
    it('adds resources for alienSignal scaled by era and prestige', () => {
      const state = makeState();
      // Unlock research so it exists and can be granted
      state.resources.research = { ...state.resources.research, unlocked: true, amount: 0 };
      const newState = applyEvent(state, events.alienSignal);
      // Era 3 scale = 1 + (3-1)*0.5 = 2, prestige = 1, so amount = 100 * 2 * 1 = 200
      expect(newState.resources.research.amount).toBe(200);
    });

    it('adds exotic materials for asteroidDiscovery scaled by era and prestige', () => {
      const state = makeState();
      state.resources.exoticMaterials = { ...state.resources.exoticMaterials, unlocked: true, amount: 10 };
      const newState = applyEvent(state, events.asteroidDiscovery);
      // Era 3 scale = 2, prestige = 1, event amount = 50, so 10 + 50*2 = 110
      expect(newState.resources.exoticMaterials.amount).toBe(110);
    });
  });

  describe('applyEvent - timed', () => {
    it('adds active effect for solarFlare', () => {
      const state = makeState({ totalTime: 100 });
      const newState = applyEvent(state, events.solarFlare);
      expect(newState.activeEffects).toHaveLength(1);
      expect(newState.activeEffects[0].id).toBe('solarFlare');
      expect(newState.activeEffects[0].endsAt).toBe(130); // 100 + 30
    });

    it('stacks multiple active effects', () => {
      const state = makeState({ totalTime: 100 });
      let s = applyEvent(state, events.solarFlare);
      s = applyEvent(s, events.solarFlare);
      expect(s.activeEffects).toHaveLength(2);
    });
  });

  describe('expireEffects', () => {
    it('removes expired effects', () => {
      const state = makeState({
        totalTime: 200,
        activeEffects: [
          { id: 'solarFlare', endsAt: 150, effect: events.solarFlare.effect },
          { id: 'darkMatterSurge', endsAt: 250, effect: events.darkMatterSurge.effect },
        ],
      });
      const newState = expireEffects(state);
      expect(newState.activeEffects).toHaveLength(1);
      expect(newState.activeEffects[0].id).toBe('darkMatterSurge');
    });

    it('returns same state if nothing expired', () => {
      const state = makeState({
        totalTime: 100,
        activeEffects: [
          { id: 'solarFlare', endsAt: 200, effect: events.solarFlare.effect },
        ],
      });
      const newState = expireEffects(state);
      expect(newState).toBe(state);
    });

    it('handles empty activeEffects', () => {
      const state = makeState({ activeEffects: [] });
      const newState = expireEffects(state);
      expect(newState).toBe(state);
    });

    it('handles missing activeEffects', () => {
      const state = makeState();
      delete state.activeEffects;
      const newState = expireEffects(state);
      expect(newState).toBe(state);
    });
  });

  describe('getTimedRateMultiplier', () => {
    it('returns 1 with no active effects', () => {
      const state = makeState({ activeEffects: [] });
      expect(getTimedRateMultiplier(state, 'energy')).toBe(1);
    });

    it('returns bonus for matching resource', () => {
      const state = makeState({
        activeEffects: [
          { id: 'solarFlare', endsAt: 200, effect: { resourceId: 'energy', rateMultBonus: 2 } },
        ],
      });
      expect(getTimedRateMultiplier(state, 'energy')).toBe(2);
    });

    it('multiplies stacked effects', () => {
      const state = makeState({
        activeEffects: [
          { id: 'a', endsAt: 200, effect: { resourceId: 'energy', rateMultBonus: 2 } },
          { id: 'b', endsAt: 200, effect: { resourceId: 'energy', rateMultBonus: 3 } },
        ],
      });
      expect(getTimedRateMultiplier(state, 'energy')).toBe(6);
    });

    it('ignores effects for other resources', () => {
      const state = makeState({
        activeEffects: [
          { id: 'a', endsAt: 200, effect: { resourceId: 'darkEnergy', rateMultBonus: 3 } },
        ],
      });
      expect(getTimedRateMultiplier(state, 'energy')).toBe(1);
    });
  });
});
