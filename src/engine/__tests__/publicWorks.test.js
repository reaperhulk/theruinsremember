import { describe, it, expect } from 'vitest';
import { createInitialState } from '../state.js';
import { calculateEconomy } from '../economy.js';
import { advancePublicWorks, getPublicWorks, PUBLIC_WORKS } from '../publicWorks.js';
import { getEraReadiness } from '../eras.js';
import { getCycleReadiness, getForgeCharges } from '../realityForge.js';
import { upgrades } from '../../data/upgrades.js';

describe('production-funded alternatives', () => {
  it('uses new output, respects pause, and accelerates with production rather than time', () => {
    const state = { ...createInitialState(), era: 4 };
    state.resources.research = { ...state.resources.research, unlocked: true, amount: 100000, rateAdd: 100 };
    const economy = calculateEconomy(state);
    const next = advancePublicWorks(state, economy);
    expect(next.publicWorks[4]).toBeCloseTo(economy.gross.research * 0.2);
    expect(economy.net.research).toBeCloseTo(economy.gross.research * 0.8);
    const stronger = { ...state, resources: { ...state.resources, research: { ...state.resources.research, rateMult: 3 } } };
    expect(calculateEconomy(stronger).construction).toBeCloseTo(economy.construction * 3);
    expect(advancePublicWorks({ ...state, autoPublicWorks: false }, economy).publicWorks).toEqual({});
  });
  it('a supplied economic foundation clears mastery without waiting or operating', () => {
    const state = { ...createInitialState(), era: 6, publicWorks: { 6: PUBLIC_WORKS[6].cost } };
    state.upgrades = Object.fromEntries(Object.values(upgrades).filter(u => u.era === 6).slice(0, 10).map(u => [u.id, true]));
    expect(state.totalTime).toBe(0);
    expect(getEraReadiness(state)).toMatchObject({ upgradesMet: true, mastery: { met: true, completedDirectly: false } });
    expect(getPublicWorks(state).complete).toBe(true);
  });
  it('the Continuity Engine closes an economic cycle and earns a finite forge charge', () => {
    const state = { ...createInitialState(), era: 10, nextCycleDoctrine: 'reconstruction', publicWorks: { 10: PUBLIC_WORKS[10].cost } };
    state.upgrades = Object.fromEntries(Object.values(upgrades).filter(u => u.era === 10).slice(0, 10).map(u => [u.id, true]));
    expect(getCycleReadiness(state)).toMatchObject({ ready: true, economicallyReady: true, fallbackReady: false });
    expect(getForgeCharges(state).earned).toBe(5);
  });
});
