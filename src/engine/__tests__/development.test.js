import { describe, expect, it } from 'vitest';
import { createInitialState } from '../state.js';
import { advanceDevelopment, setDevelopmentFocus } from '../development.js';
import { chooseCouncilOption, getCouncilGroups } from '../council.js';
import { advanceGoal } from '../goals.js';
import { selectExpeditionRoute } from '../expeditions.js';
import { advanceTime } from '../advanceTime.js';
import { tick } from '../tick.js';
import { transitionEra } from '../eras.js';
import { parseSave, serializeSave } from '../saves.js';
import { performPrestige } from '../prestige.js';
import { restoreAutomationPlan, saveAutomationPlan } from '../archive.js';

describe('player priorities with automatic development', () => {
  it('makes workshops and labs compete for the same funds without a free bonus', () => {
    const state = createInitialState();
    state.resources.labor.amount = 20;
    state.resources.materials.amount = 50;
    state.resources.energy.amount = 40;
    const before = structuredClone(state);
    const growth = advanceDevelopment(state);
    const research = advanceDevelopment(setDevelopmentFocus(state, 'research'));
    expect(growth.upgrades.tools).toBe(true);
    expect(growth.tech.metallurgy).toBeUndefined();
    expect(research.tech.metallurgy).toBe(true);
    expect(research.upgrades.tools).toBeUndefined();
    expect(research.resources.materials.amount).toBe(0);
    expect(state).toEqual(before);
    expect(advanceDevelopment({ ...state, autoBuildOut: false }).resources).toEqual(state.resources);
    expect(setDevelopmentFocus(state, 'unknown')).toBe(state);
  });

  it('builds the opening economy without gathering clicks and waits for chapter review', () => {
    const state = advanceTime(createInitialState(), 600, () => 0.5);
    expect(state.upgrades.tools).toBe(true);
    expect(state.tech.industrialRevolution).toBe(true);
    expect(state.era).toBe(1);
    expect(state.upgrades.forkHearth).toBeUndefined();
    expect(state.upgrades.forkQuarry).toBeUndefined();
    expect(state.expedition.attempts).toBe(0);
  });

  it('funds an explicit choice after building prerequisites and allows replacing an unfunded choice', () => {
    let state = chooseCouncilOption(createInitialState(), 'upgrade', 'forkHearth');
    expect(state.goals).toEqual([{ kind: 'upgrade', id: 'forkHearth' }]);
    state = chooseCouncilOption(state, 'upgrade', 'forkQuarry');
    expect(state.goals).toEqual([{ kind: 'upgrade', id: 'forkQuarry' }]);
    state = advanceTime(state, 180, () => 0.5);
    expect(state.upgrades.tools).toBe(true);
    expect(state.upgrades.forkQuarry).toBe(true);
    expect(state.upgrades.forkHearth).toBeUndefined();
    expect(chooseCouncilOption(state, 'upgrade', 'forkHearth')).toBe(state);
    expect(chooseCouncilOption(state, 'unknown', 'metallurgy')).toBe(state);
  });

  it('reserves the chosen doctrine before either development policy can spend its cost', () => {
    for (const focus of ['growth', 'research']) {
      let state = setDevelopmentFocus(createInitialState(), focus);
      state.upgrades.tools = true;
      state = chooseCouncilOption(state, 'upgrade', 'forkHearth');
      // Enough for the commitment; competing projects may spend only surplus.
      for (const [id, amount] of Object.entries(getCouncilGroups(state)[0].options[0].cost)) state.resources[id].amount = amount;
      state = advanceGoal(advanceDevelopment(state));
      expect(state.upgrades.forkHearth).toBe(true);
      expect(state.upgrades.forkQuarry).toBeUndefined();
      expect(Object.values(state.resources).every(r => r.amount >= 0)).toBe(true);
    }
  });

  it('never selects an unchosen doctrine or research branch in any of the ten eras', () => {
    for (let era = 1; era <= 10; era++) {
      let state = transitionEra(createInitialState(), era);
      for (const r of Object.values(state.resources)) { r.amount = 1e30; r.unlocked = true; }
      for (let i = 0; i < 10; i++) state = advanceDevelopment(state);
      for (const kind of ['upgrade', 'tech']) for (const group of getCouncilGroups(state, kind)) {
        expect(group.chosen, `${kind} era ${era}: ${group.id}`).toBeUndefined();
        expect(group.options.every(option => !option.owned)).toBe(true);
      }
    }
  });

  it('persists policy through saves, prestige and saved plans; migrates old saves safely', () => {
    let state = setDevelopmentFocus(createInitialState(), 'research');
    state = saveAutomationPlan({ ...state, prestigeCount: 1 });
    state = parseSave(serializeSave(state));
    expect(performPrestige(state).developmentFocus).toBe('research');
    expect(restoreAutomationPlan(setDevelopmentFocus(state, 'growth')).developmentFocus).toBe('research');
    const old = createInitialState();
    old.saveVersion = 11;
    delete old.developmentFocus;
    delete old.expedition.routeId;
    delete old.expedition.paused;
    expect(parseSave(JSON.stringify(old))).toMatchObject({ developmentFocus: 'growth', expedition: { routeId: null, paused: false } });
    expect(() => parseSave(JSON.stringify({ ...state, developmentFocus: 'free' }))).toThrow('development focus');
  });
});

describe('standing expedition assignments', () => {
  it('spends real supplies through offline time, stops when paused, and requires a new-era assignment', () => {
    const initial = createInitialState();
    const assigned = selectExpeditionRoute(initial, 'surveyRidge');
    expect(assigned.resources).toBe(initial.resources);
    expect(assigned.expedition.attempts).toBe(0);
    const first = tick(assigned, 1, () => 0.5);
    expect(first.expedition).toMatchObject({ supplies: 1, attempts: 1, totalFinds: 1 });
    const offline = advanceTime(first, 180, () => 0.5, 1, { pauseForgetting: true });
    expect(offline.expedition).toMatchObject({ supplies: 0, attempts: 4, totalFinds: 4 });
    const paused = selectExpeditionRoute({ ...offline, prestigeUpgrades: { autoClicker: true } }, null);
    expect(advanceTime(paused, 600, () => 0.5).expedition.attempts).toBe(4);
    const nextEra = transitionEra(offline, 2);
    expect(nextEra.expedition.routeId).toBeNull();
    expect(tick(nextEra, 1, () => 0.5).expedition.attempts).toBe(4);
    expect(selectExpeditionRoute(nextEra, 'surveyRidge')).toBe(nextEra);
    expect(parseSave(serializeSave(assigned)).expedition.routeId).toBe('surveyRidge');
    expect(() => parseSave(JSON.stringify({ ...assigned, expedition: { ...assigned.expedition, routeId: 'freeLoot' } }))).toThrow('expedition route');
  });
});
