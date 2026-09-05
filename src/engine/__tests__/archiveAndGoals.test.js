import { describe, it, expect } from 'vitest';
import { createInitialState } from '../state.js';
import { performPrestige, getPrestigeSummary, togglePrestigePlan } from '../prestige.js';
import { researchDoctrine, craftRelic, contributeProject, recordHistory } from '../archive.js';
import { queueGoal, advanceGoal, preservesGoalReserve } from '../goals.js';
import { queueCommission, advanceCommissions } from '../commissions.js';
import { calculateEconomy } from '../economy.js';
import { getUpgradeCost, purchaseUpgrade, previewUpgrade } from '../upgrades.js';
import { getEffectiveCap } from '../resources.js';
import { getWardenCapacity } from '../forgetting.js';

describe('persistent rewards and deliberate automation', () => {
  it('selecting a starting perk spends newly earned points before the next run begins', () => {
    let state = { ...createInitialState(), era: 10 };
    state = togglePrestigePlan(state, 'headStart');
    expect(state.plannedPrestigeUpgrades).toContain('headStart');
    const preview = getPrestigeSummary(state);
    const next = performPrestige(state);
    expect(next.prestigeUpgrades.headStart).toBe(true);
    expect(next.prestigePoints).toBe(preview.totalPoints);
    expect(next.prestigeMultiplier).toBe(preview.newMultiplier);
    expect(next.prestigeMultiplier).toBeGreaterThan(performPrestige({ ...state, plannedPrestigeUpgrades: [] }).prestigeMultiplier);
    expect(next.plannedPrestigeUpgrades).toEqual([]);
  });
  it('cannot overspend or bypass prerequisites with planned rewards', () => {
    const state = { ...createInitialState(), era: 10, plannedPrestigeUpgrades: ['eternalReturn', 'temporalMastery'] };
    const next = performPrestige(state);
    expect(next.prestigeUpgrades.eternalReturn).toBeUndefined();
    expect(next.prestigeUpgrades.temporalMastery).toBeUndefined();
    expect(next.prestigePoints).toBeGreaterThanOrEqual(0);
  });
  it('keeps extremely long prestige histories finite and the preview exact', () => {
    const state = { ...createInitialState(), era: 10, prestigeMultiplier: Number.MAX_VALUE, prestigeUpgrades: { headStart: true } };
    const next = performPrestige(state);
    expect(next.prestigeMultiplier).toBe(Number.MAX_SAFE_INTEGER);
    expect(getPrestigeSummary(state).newMultiplier).toBe(next.prestigeMultiplier);
    expect(JSON.parse(JSON.stringify(next)).prestigeMultiplier).toBe(next.prestigeMultiplier);
  });
  it('preserves narrative beyond the rolling event log and across resets', () => {
    let state = createInitialState();
    state = recordHistory(state, [{ isLore: true, message: 'A remembered city.' }]);
    state.eventLog = [];
    const next = performPrestige(state);
    expect(next.archive.lore).toContain('A remembered city.');
    expect(next.archive.entries).toHaveLength(1);
    expect(next.archive.shards).toBe(6);
  });
  it('different prestige counts open research, crafting and multicycle projects', () => {
    let state = performPrestige(createInitialState());
    expect(researchDoctrine(state, 'expansion')).toBe(state);
    state = performPrestige(state);
    const beforeCap = getEffectiveCap(state, 'materials');
    state = researchDoctrine(state, 'expansion');
    expect(getEffectiveCap(state, 'materials')).toBe(beforeCap * 2);
    state = craftRelic(state, 'openCircuit');
    expect(state.activeRelics).toContain('openCircuit');
    expect(state.archive.shards).toBe(4);
    expect(craftRelic(state, 'openCircuit')).toBe(state);
  });
  it('a project takes two distinct cycles and its reward applies to the next start', () => {
    let state = { ...createInitialState(), prestigeCount: 3, era: 3 };
    state.resources.research = { ...state.resources.research, unlocked: true, amount: getEffectiveCap(state, 'research') };
    state = contributeProject(state, 'seedVault');
    expect(state.archive.projects.seedVault).toBe(1);
    expect(contributeProject(state, 'seedVault')).toBe(state);
    state = { ...performPrestige(state), era: 3 };
    state.resources.research = { ...state.resources.research, unlocked: true, amount: getEffectiveCap(state, 'research') };
    state = contributeProject(state, 'seedVault');
    const next = performPrestige(state);
    expect(next.archive.projects.seedVault).toBe(2);
    expect(next.resources.food.amount).toBe(getEffectiveCap(next, 'food') / 4);
  });
  it('queued purchases reserve resources without blocking prerequisite research', () => {
    let state = queueGoal(createInitialState(), 'upgrade', 'tools');
    expect(preservesGoalReserve(state, { materials: 1 })).toBe(false);
    state = queueGoal(createInitialState(), 'upgrade', 'advancedTools');
    expect(preservesGoalReserve(state, { materials: 1 })).toBe(true);
    expect(advanceGoal(state)).toBe(state);
  });
  it('a queued purchase uses the normal command and leaves the rejected fork unavailable', () => {
    let state = createInitialState();
    state.resources.materials.amount = 1000;
    state.resources.food.amount = 1000;
    state.resources.labor.amount = 1000;
    state.resources.energy.amount = 1000;
    state = purchaseUpgrade(state, 'tools');
    state = queueGoal(state, 'upgrade', 'forkHearth');
    state = advanceGoal(state);
    expect(state.upgrades.forkHearth).toBe(true);
    expect(purchaseUpgrade(state, 'forkQuarry')).toBeNull();
    expect(state.goals).toEqual([]);
  });
  it('signature previews match purchased production without modifying the original', () => {
    const state = createInitialState();
    for (const [id, cost] of Object.entries(getUpgradeCost(state, 'tools'))) state.resources[id].amount = cost;
    const before = JSON.stringify(state);
    const preview = previewUpgrade(state, 'tools');
    const after = purchaseUpgrade(state, 'tools');
    expect(preview.gross).toEqual(calculateEconomy(after).gross);
    expect(JSON.stringify(state)).toBe(before);
  });
  it('commission queues spend resources and respect cooldowns and finite limits', () => {
    let state = { ...createInitialState(), era: 9 };
    for (const r of Object.values(state.resources)) { r.unlocked = true; r.amount = 1000000; }
    state = queueCommission(queueCommission(state, 'dyson', 'frame'), 'dyson', 'collector');
    state = queueCommission(state, 'law', 'temporal');
    const after = advanceCommissions(state);
    expect(after.dysonModules.frame).toBe(1);
    expect(after.commissions).toHaveLength(1);
    expect(advanceCommissions(after).dysonModules.collector).toBe(0);
    expect(after.resources.realityFragments.amount).toBeLessThan(state.resources.realityFragments.amount);
  });
  it('can deliberately commission two frames for an extra Warden, within the three-module limit', () => {
    let state = { ...createInitialState(), era: 7 };
    for (const r of Object.values(state.resources)) r.unlocked = true;
    state = queueCommission(queueCommission(queueCommission(state, 'dyson', 'frame'), 'dyson', 'frame'), 'dyson', 'collector');
    expect(queueCommission(state, 'dyson', 'forge')).toBe(state);
    state = advanceCommissions(state);
    expect(state.dysonModules.frame).toBe(1);
    expect(getWardenCapacity(state)).toBe(2);
    expect(advanceCommissions(state).commissions).toHaveLength(2);
    state = advanceCommissions({ ...state, totalTime: 105 });
    expect(state.dysonModules.frame).toBe(2);
    expect(getWardenCapacity(state)).toBe(3);
    state = advanceCommissions({ ...state, totalTime: 210 });
    expect(state.dysonModules.collector).toBe(1);
    expect(state.commissions).toEqual([]);
    expect(queueCommission(state, 'dyson', 'frame')).toBe(state);
  });
});
