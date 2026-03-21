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
    it('can trigger events at era 1', () => {
      const state = makeState({ era: 1 });
      const { event } = checkForEvent(state, 1, 0.001);
      expect(event).not.toBeNull();
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

  describe('timer bar duration', () => {
    it('active effect tracks correct start and end times for timer bar', () => {
      const state = makeState({ totalTime: 45 });
      const timedEvent = events.solarFlare; // duration: 30s
      const newState = applyEvent(state, timedEvent);
      const effect = newState.activeEffects[0];
      expect(effect.startedAt).toBe(45);
      expect(effect.endsAt).toBe(75); // 45 + 30
      // Timer bar would show remaining = endsAt - currentTime
      const remaining = effect.endsAt - 55; // at time 55, 20s remain
      expect(remaining).toBe(20);
      // Progress fraction: elapsed / duration
      const elapsed = 55 - effect.startedAt; // 10s elapsed
      const duration = effect.endsAt - effect.startedAt; // 30s total
      const fraction = elapsed / duration;
      expect(fraction).toBeCloseTo(1 / 3, 5);
    });
  });

  describe('crisis events', () => {
    it('crisis events have negative effects', () => {
      const crisisEvents = Object.values(events).filter(e => e.id?.startsWith('crisis'));
      expect(crisisEvents.length).toBeGreaterThanOrEqual(5);
      // Each should have effects that are negative resource or < 1 multiplier
      for (const e of crisisEvents) {
        const hasNegative = (e.effects?.some(eff =>
          (eff.type === 'resource' && eff.value < 0) ||
          (eff.type === 'resource_percent' && eff.value < 0) ||
          (eff.type === 'resource_mult' && eff.value < 1)
        )) || (e.effect?.rateMultBonus !== undefined && e.effect.rateMultBonus < 1);
        expect(hasNegative).toBe(true);
      }
    });
  });

  describe('resource_percent effect type', () => {
    it('removes a percentage of current resource amount', () => {
      const state = makeState();
      state.resources.food = { ...state.resources.food, unlocked: true, amount: 1000 };
      // Create a crisis event that uses resource_percent
      const crisisEvent = {
        id: 'testCrisis', name: 'Test Crisis', type: 'instant',
        effects: [{ type: 'resource_percent', target: 'food', value: -0.2 }],
      };
      const newState = applyEvent(state, crisisEvent);
      // Should lose 20% of 1000 = 200, leaving 800
      expect(newState.resources.food.amount).toBe(800);
    });

    it('does not reduce below zero', () => {
      const state = makeState();
      state.resources.food = { ...state.resources.food, unlocked: true, amount: 5 };
      const crisisEvent = {
        id: 'testCrisis', name: 'Test Crisis', type: 'instant',
        effects: [{ type: 'resource_percent', target: 'food', value: -1.5 }],
      };
      const newState = applyEvent(state, crisisEvent);
      expect(newState.resources.food.amount).toBe(0);
    });

    it('scales percentage loss with current amount (not era scaling)', () => {
      const state = makeState({ era: 5 });
      state.resources.food = { ...state.resources.food, unlocked: true, amount: 500 };
      const crisisEvent = {
        id: 'testCrisis', name: 'Test Crisis', type: 'instant',
        effects: [{ type: 'resource_percent', target: 'food', value: -0.1 }],
      };
      const newState = applyEvent(state, crisisEvent);
      // 10% of 500 = 50 lost, 450 remaining
      expect(newState.resources.food.amount).toBe(450);
    });
  });
});
