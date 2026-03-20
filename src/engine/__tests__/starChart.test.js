import { describe, it, expect } from 'vitest';
import { getUnlockedSystems, createRoute, removeRoute, getRoutes, getRouteBonus, routeExists } from '../starChart.js';
import { createInitialState } from '../state.js';

describe('starChart', () => {
  function makeEra6State() {
    const state = createInitialState();
    state.era = 6;
    state.resources.starSystems = { amount: 10, unlocked: true, rateAdd: 0, rateMult: 1, capMult: 1, baseRate: 0, cap: 100 };
    state.resources.darkEnergy = { amount: 100, unlocked: true, rateAdd: 0, rateMult: 1, capMult: 1, baseRate: 0, cap: 500 };
    return state;
  }

  it('unlocks systems based on starSystems amount', () => {
    const state = makeEra6State();
    const systems = getUnlockedSystems(state);
    // floor(10/3) + 2 = 5 systems
    expect(systems).toHaveLength(5);
  });

  it('creates a route between two systems', () => {
    const state = makeEra6State();
    const after = createRoute(state, 'sol', 'alpha');
    expect(after).not.toBeNull();
    expect(getRoutes(after)).toHaveLength(1);
    // Cost: 5 darkEnergy + 1 starSystem
    expect(after.resources.darkEnergy.amount).toBe(95);
    expect(after.resources.starSystems.amount).toBe(9);
  });

  it('rejects duplicate routes', () => {
    const state = makeEra6State();
    const after = createRoute(state, 'sol', 'alpha');
    const again = createRoute(after, 'sol', 'alpha');
    expect(again).toBeNull();
  });

  it('rejects self-routes', () => {
    const state = makeEra6State();
    expect(createRoute(state, 'sol', 'sol')).toBeNull();
  });

  it('rejects routes to unlocked systems', () => {
    const state = makeEra6State();
    state.resources.starSystems.amount = 0; // only 2 systems unlocked
    const result = createRoute(state, 'sol', 'vega'); // vega is 4th system
    expect(result).toBeNull();
  });

  it('removes a route', () => {
    const state = makeEra6State();
    const after = createRoute(state, 'sol', 'alpha');
    const removed = removeRoute(after, 'sol', 'alpha');
    expect(getRoutes(removed)).toHaveLength(0);
  });

  it('calculates route bonus from connected systems', () => {
    const state = makeEra6State();
    const after = createRoute(state, 'sol', 'alpha');
    const bonus = getRouteBonus(after);
    // sol(0.5,0.5) → alpha(0.3,0.3), dist = ~0.283, distMult = ~1.283
    // No network bonus (only 1 connection each) = networkMult 1
    // sol bonus: energy 10, alpha bonus: research 5
    // route gives: half * distMult: energy = 5*1.283 ≈ 6.4, research = 2.5*1.283 ≈ 3.2
    expect(bonus.energy).toBeGreaterThan(5);
    expect(bonus.research).toBeGreaterThan(2);
  });

  it('returns empty bonus before era 6', () => {
    const state = createInitialState();
    state.starRoutes = [{ from: 'sol', to: 'alpha' }];
    expect(getRouteBonus(state)).toEqual({});
  });

  it('routeExists checks both directions', () => {
    const state = makeEra6State();
    const after = createRoute(state, 'sol', 'alpha');
    expect(routeExists(after, 'sol', 'alpha')).toBe(true);
    expect(routeExists(after, 'alpha', 'sol')).toBe(true);
  });

  it('rejects route when cannot afford', () => {
    const state = makeEra6State();
    state.resources.darkEnergy.amount = 0;
    expect(createRoute(state, 'sol', 'alpha')).toBeNull();
  });
});
