import { describe, expect, it } from 'vitest';
import { awardCycleGoal, getCycleGoal, getCycleProductionMultiplier, selectNextCycleDoctrine } from '../cycles.js';
import { performPrestige } from '../prestige.js';
import { createInitialState } from '../state.js';

describe('cycle doctrines', () => {
  it('selects the doctrine that will shape the next cycle', () => {
    const state = createInitialState();
    state.era = 10;

    const selected = selectNextCycleDoctrine(state, 'expansion');

    expect(selected.nextCycleDoctrine).toBe('expansion');
  });

  it('applies doctrine production only in its intended eras', () => {
    const state = createInitialState();
    state.cycleDoctrine = 'reconstruction';
    expect(getCycleProductionMultiplier(state)).toBeCloseTo(1.35);
    state.era = 4;
    expect(getCycleProductionMultiplier(state)).toBe(1);
  });

  it('amplifies an active doctrine with Resonance Lock', () => {
    const state = createInitialState();
    state.cycleDoctrine = 'reconstruction';
    state.echoUpgrades.echoResonanceLock = true;
    expect(getCycleProductionMultiplier(state)).toBeCloseTo(1.35 * 1.1);
  });

  it('awards each cycle goal once', () => {
    const state = createInitialState();
    state.cycleDoctrine = 'reconstruction';
    state.expedition.totalFinds = 8;

    const goal = getCycleGoal(state);
    const awarded = awardCycleGoal(state);
    const repeated = awardCycleGoal(awarded);

    expect(goal.complete).toBe(true);
    expect(awarded.cycleMarks).toBe(1);
    expect(awarded.prestigePoints).toBe(4);
    expect(repeated.prestigePoints).toBe(4);
  });

  it.each(['reconstruction', 'expansion', 'transcendence'])(
    'carries the selected %s doctrine into the next cycle',
    doctrineId => {
      const state = createInitialState();
      state.era = 10;

      const selected = selectNextCycleDoctrine(state, doctrineId);
      const nextCycle = performPrestige(selected);

      expect(nextCycle.cycleDoctrine).toBe(doctrineId);
      expect(nextCycle.nextCycleDoctrine).toBeNull();
    },
  );

  it.each([
    ['reconstruction', 1, 4, 1.35],
    ['expansion', 5, 8, 1.3],
    ['transcendence', 9, 7, 1.3],
  ])('limits the %s production advantage to its intended era window', (doctrineId, activeEra, inactiveEra, multiplier) => {
    const state = createInitialState();
    state.cycleDoctrine = doctrineId;
    state.era = activeEra;
    expect(getCycleProductionMultiplier(state)).toBeCloseTo(multiplier);
    state.era = inactiveEra;
    expect(getCycleProductionMultiplier(state)).toBe(1);
  });

  it.each(['reconstruction', 'expansion', 'transcendence'])(
    'recognizes and awards the %s doctrine objective exactly once',
    doctrineId => {
      const state = createInitialState();
      state.cycleDoctrine = doctrineId;
      if (doctrineId === 'reconstruction') state.expedition.totalFinds = 8;
      if (doctrineId === 'expansion') {
        state.dockingMissions = { cargo: 3, crew: 3, science: 3 };
        state.starRoutes = Array.from({ length: 8 }, (_, index) => ({ from: `${index}`, to: `${index + 1}` }));
        state.colonyAssignments = { growth: 1, science: 1, industry: 1 };
      }
      if (doctrineId === 'transcendence') {
        state.wovenLaws = { temporal: true, causal: true, quantum: true };
        state.lockedSignals = { stability: true, power: true, constants: true };
        state.realityKeys = { temporal: 1, spatial: 1, quantum: 1 };
      }

      expect(getCycleGoal(state)?.complete).toBe(true);
      const awarded = awardCycleGoal(state);
      expect(awarded.cycleMarks).toBe(1);
      expect(awardCycleGoal(awarded).cycleMarks).toBe(1);
    },
  );
});
