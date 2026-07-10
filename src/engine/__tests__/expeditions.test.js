import { describe, expect, it } from 'vitest';
import { createInitialState } from '../state.js';
import {
  advanceExpeditionSupplies,
  EXPEDITION_MAX_SUPPLIES,
  EXPEDITION_SUPPLY_INTERVAL,
  getExpeditionRoutes,
  getExpeditionSupplyInterval,
  runExpedition,
} from '../expeditions.js';
import { tick } from '../tick.js';

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

  it('applies prestige cartography to supply recovery', () => {
    const state = createInitialState();
    state.expedition.supplies = 0;
    state.prestigeUpgrades.luckyMiner = true;

    expect(getExpeditionSupplyInterval(state)).toBe(60);
    const recovered = advanceExpeditionSupplies(state, 60);
    expect(recovered.expedition.supplies).toBe(1);
  });

  it('uses Temporal Keys to accelerate future expedition supplies', () => {
    const state = createInitialState();
    state.realityKeys.temporal = 2;
    expect(getExpeditionSupplyInterval(state)).toBe(80);
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

  it('applies Operations Savant to expedition resource rewards', () => {
    const state = createInitialState();
    state.prestigeUpgrades.miniGameSavant = true;

    const { state: after } = runExpedition(state, 'surveyRidge', () => 0);

    expect(after.resources.materials.amount).toBe(state.resources.materials.amount + 36);
    expect(after.resources.food.amount).toBe(state.resources.food.amount + 24);
  });

  it('uses Causal Keys to increase operation rewards', () => {
    const state = createInitialState();
    state.realityKeys.causal = 2;
    const { state: after } = runExpedition(state, 'surveyRidge', () => 0);
    expect(after.resources.materials.amount).toBeCloseTo(state.resources.materials.amount + 28.8);
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

  it('uses Pattern Memory to improve risky expedition outcomes', () => {
    const baseline = createInitialState();
    expect(runExpedition(baseline, 'descendVault', () => 0.6).result.success).toBe(false);

    const remembered = createInitialState();
    remembered.prestigeUpgrades.hackMaster = true;
    expect(runExpedition(remembered, 'descendVault', () => 0.6).result.success).toBe(true);
  });

  it('dispatches a safe survey drone when supplies fill', () => {
    const state = createInitialState();
    state.prestigeUpgrades.autoClicker = true;
    state.expedition.supplies = EXPEDITION_MAX_SUPPLIES;

    const after = tick(state, 1, () => 0);
    expect(after.expedition.supplies).toBe(EXPEDITION_MAX_SUPPLIES - 1);
    expect(after.expedition.eraFinds).toBe(1);
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
