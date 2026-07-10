import { describe, expect, it } from 'vitest';
import { createInitialState } from '../state.js';
import {
  advanceExpeditionSupplies,
  EXPEDITION_MAX_SUPPLIES,
  EXPEDITION_SUPPLY_INTERVAL,
  getExpeditionRoutes,
  runExpedition,
} from '../expeditions.js';

describe('expeditions', () => {
  it('offers a distinct set of routes in each early era', () => {
    expect(getExpeditionRoutes(1).map(route => route.id)).toHaveLength(3);
    expect(getExpeditionRoutes(2).map(route => route.id)).not.toEqual(getExpeditionRoutes(1).map(route => route.id));
    expect(getExpeditionRoutes(3).map(route => route.id)).not.toEqual(getExpeditionRoutes(2).map(route => route.id));
  });

  it('recovers supplies over simulated and offline time', () => {
    const state = createInitialState();
    state.expedition.supplies = 0;

    const almost = advanceExpeditionSupplies(state, EXPEDITION_SUPPLY_INTERVAL - 1);
    expect(almost.expedition.supplies).toBe(0);
    expect(almost.expedition.supplyProgress).toBe(EXPEDITION_SUPPLY_INTERVAL - 1);

    const recovered = advanceExpeditionSupplies(almost, EXPEDITION_SUPPLY_INTERVAL * 2 + 1);
    expect(recovered.expedition.supplies).toBe(EXPEDITION_MAX_SUPPLIES);
    expect(recovered.expedition.supplyProgress).toBe(0);
  });

  it('spends a supply and grants discovery credit and capped rewards on success', () => {
    const state = createInitialState();
    state.resources.materials.amount = 4990;

    const { state: after, result } = runExpedition(state, 'surveyRidge', () => 0);

    expect(result.success).toBe(true);
    expect(after.expedition.supplies).toBe(1);
    expect(after.expedition.eraFinds).toBe(1);
    expect(after.expedition.totalFinds).toBe(1);
    expect(after.resources.materials.amount).toBe(5000);
    expect(after.eventLog.at(-1).message).toContain('Survey the Ridge');
  });

  it('records a failed risky route without awarding discoveries', () => {
    const state = createInitialState();
    const { state: after, result } = runExpedition(state, 'descendVault', () => 0.99);

    expect(result.success).toBe(false);
    expect(after.expedition.supplies).toBe(1);
    expect(after.expedition.eraFinds).toBe(0);
    expect(after.expedition.attempts).toBe(1);
    expect(after.expedition.successes).toBe(0);
  });

  it('does not run without supplies or after the early-game expedition arc', () => {
    const noSupplies = createInitialState();
    noSupplies.expedition.supplies = 0;
    expect(runExpedition(noSupplies, 'surveyRidge', () => 0).result).toBeNull();

    const lateState = createInitialState();
    lateState.era = 4;
    expect(runExpedition(lateState, 'indexArchive', () => 0).result).toBeNull();
  });
});
