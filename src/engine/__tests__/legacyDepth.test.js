import { describe, it, expect } from 'vitest';
import { createInitialState } from '../state.js';
import { purchaseUpgrade } from '../upgrades.js';
import { queueGoal, advanceGoal } from '../goals.js';
import { saveAutomationPlan, restoreAutomationPlan, togglePlanRepeat, researchDoctrine, DOCTRINE_RESEARCH } from '../archive.js';
import { advanceBlueprint } from '../blueprints.js';
import { getSupplyChains, calculateEconomy } from '../economy.js';
import { selectProductionRoute, hasRelicSynergy } from '../legacy.js';
import { transitionEra } from '../eras.js';
import { performPrestige } from '../prestige.js';
import { parseSave, serializeSave } from '../saves.js';
import { getPublicWorks, advancePublicWorks } from '../publicWorks.js';

describe('new ways to build remembered civilizations', () => {
  it('replays completed choices after serialization and prestige, paying actual costs', () => {
    let state = { ...createInitialState(), prestigeCount: 1 };
    for (const r of Object.values(state.resources)) r.amount = 10000;
    state = purchaseUpgrade(state, 'tools');
    state = purchaseUpgrade(state, 'forkHearth');
    state = togglePlanRepeat(saveAutomationPlan(state));
    expect(state.archive.savedPlan.choices).toContainEqual({ kind: 'upgrade', id: 'forkHearth' });
    state = performPrestige(parseSave(serializeSave(state)));
    expect(state.blueprintActive).toBe(true);
    expect(state.upgrades.forkHearth).toBeUndefined();
    state = advanceGoal(advanceBlueprint(state));
    expect(state.upgrades.forkHearth).toBeUndefined();
    for (const r of Object.values(state.resources)) r.amount = 10000;
    for (let i = 0; i < 5; i++) state = advanceGoal(advanceBlueprint(state));
    expect(state.upgrades.forkHearth).toBe(true);
    expect(state.resources.materials.amount).toBeLessThan(10000);
    expect(state.upgrades.forkQuarry).toBeUndefined();
  });
  it('restores old queue plans safely and never spreads unrelated saved fields', () => {
    let state = { ...createInitialState(), prestigeCount: 1 };
    state.archive.savedPlan = { goals: [{ kind: 'upgrade', id: 'tools' }], commissions: [] };
    state = advanceBlueprint(restoreAutomationPlan(state));
    expect(state.goals).toEqual([{ kind: 'upgrade', id: 'tools' }]);
    const malformed = { ...state, archive: { ...state.archive, savedPlan: { era: 10 } } };
    expect(restoreAutomationPlan(malformed)).toBe(malformed);
  });
  it('a manually changed fork remains valid while its remembered opposite is skipped', () => {
    let state = { ...createInitialState(), prestigeCount: 1 };
    for (const r of Object.values(state.resources)) r.amount = 10000;
    state = purchaseUpgrade(state, 'tools');
    state.archive.savedPlan = { choices: [{ kind: 'upgrade', id: 'forkHearth' }, { kind: 'upgrade', id: 'irrigation' }] };
    state = purchaseUpgrade(state, 'forkQuarry');
    state = advanceGoal(advanceBlueprint(restoreAutomationPlan(state)));
    expect(state.upgrades.irrigation).toBe(true);
    expect(state.upgrades.forkQuarry).toBe(true);
    expect(state.upgrades.forkHearth).toBeUndefined();
  });
  it('alternate routes conserve a shared input and can be reversed without cost', () => {
    let state = { ...createInitialState(), era: 5, protectProgression: false };
    for (const r of Object.values(state.resources)) { r.unlocked = true; r.amount = 0; r.rateAdd = 10; }
    expect(selectProductionRoute(state, 'electrolysis')).toBe(state);
    state.archive.research.logistics = true;
    state = selectProductionRoute(state, 'electrolysis');
    const e = calculateEconomy(state);
    expect(e.consumed.energy).toBeLessThanOrEqual(e.produced.energy);
    expect(e.consumed.rocketFuel).toBe(0);
    expect(getSupplyChains(state).find(c => c.output === 'orbitalInfra').input).toBe('energy');
    const restored = selectProductionRoute(state, 'standard');
    expect(getSupplyChains(restored).find(c => c.output === 'orbitalInfra').input).toBe('rocketFuel');
    expect(restored.resources).toEqual(state.resources);
  });
  it('relic combinations change recipes and completed construction survives a loadout change', () => {
    const state = { ...createInitialState(), era: 5, activeRelics: ['emberSeed', 'colonyCharter'] };
    state.archive.research.resonance = true;
    expect(hasRelicSynergy(state, 'livingWorlds')).toBe(true);
    expect(getSupplyChains(state).find(c => c.output === 'colonies')).toMatchObject({ input: 'food', cost: 1 });
    let wayfinder = { ...state, activeRelics: ['surveyorLens', 'pilgrimMap'] };
    const cost = getPublicWorks(wayfinder).cost;
    wayfinder = advancePublicWorks(wayfinder, { construction: cost });
    const changed = { ...wayfinder, activeRelics: [] };
    expect(getPublicWorks(changed).complete).toBe(true);
  });
  it('restored landmarks supply production again when the next civilization reaches them', () => {
    let state = createInitialState();
    state.archive.projects = { foundryDistrict: 3, orbitalCradle: 3 };
    state = transitionEra(performPrestige(state), 2);
    expect(state.resources.research.rateAdd).toBe(10);
    expect(transitionEra(state, 2)).toBe(state);
    state = transitionEra(state, 4);
    expect(state.resources.rocketFuel.rateAdd).toBe(15);
    expect(state.eventLog.some(e => e.message.includes('Orbital Cradle'))).toBe(true);
  });
  it('research is earned over later prestiges and preserved relics follow the saved loadout', () => {
    let state = { ...createInitialState(), prestigeCount: 2 };
    state.archive.shards = 100;
    for (const [id, def] of Object.entries(DOCTRINE_RESEARCH).filter(([, d]) => d.unlockAt)) {
      expect(researchDoctrine(state, id)).toBe(state);
      expect(researchDoctrine({ ...state, prestigeCount: def.unlockAt }, id).archive.research[id]).toBe(true);
    }
    state.archive.research.conservation = true;
    state.archive.projects.memoryLibrary = 4;
    state = saveAutomationPlan({ ...state, activeRelics: ['emberSeed', 'openCircuit'] });
    expect(performPrestige(state).activeRelics).toEqual(['emberSeed', 'openCircuit']);
  });
  it('paused replay and goals leave explicit player control intact', () => {
    const state = queueGoal({ ...createInitialState(), goalsPaused: true, blueprintActive: true }, 'upgrade', 'tools');
    expect(advanceBlueprint(state)).toBe(state);
    expect(advanceGoal(state)).toBe(state);
  });
});
