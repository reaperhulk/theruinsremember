import { describe, expect, it } from 'vitest';
import { comparePersonaSnapshots, formatPersonaImpact, summarizePersonaRun } from '../../../scripts/persona-impact.mjs';
import { PERSONA_IDS } from '../../../scripts/playtest-personas.js';

function createResult(persona, seed = 424242) {
  return {
    persona,
    seed,
    elapsedSeconds: 600,
    activeSeconds: 300,
    offlineSeconds: 300,
    manualActions: 20,
    sessions: 3,
    finalEra: 10,
    targetEra: 10,
    completed: true,
    cycleReady: true,
    collapsed: false,
    actionsWhileAway: 0,
  };
}

function createSnapshot() {
  return {
    schemaVersion: 1,
    seeds: [424242],
    personas: PERSONA_IDS,
    results: PERSONA_IDS.map(persona => createResult(persona)),
  };
}

describe('mandatory persona impact reports', () => {
  it('extracts cumulative pacing, attention, outcome, and absence metrics from a playtest', () => {
    const summary = summarizePersonaRun({
      profile: 'check_in',
      options: { seed: 42, targetEra: 10 },
      results: {
        completionStatus: {
          cumulativeTime: 4200,
          finalEra: 10,
          reachedTargetEra: true,
          cycleReady: true,
          forgettingCollapsed: false,
        },
        engagement: {
          attention: {
            activeSeconds: 420,
            offlineSeconds: 3780,
            manualActions: 110,
            sessions: 8,
            actionsWhileAway: 0,
          },
        },
      },
    });

    expect(summary).toMatchObject({
      persona: 'check_in',
      seed: 42,
      elapsedSeconds: 4200,
      activeSeconds: 420,
      offlineSeconds: 3780,
      manualActions: 110,
      sessions: 8,
      finalEra: 10,
      completed: true,
    });
  });

  it('presents before/after timing, attention, actions, sessions, and progression for every persona', () => {
    const before = createSnapshot();
    const after = createSnapshot();
    Object.assign(after.results.find(result => result.persona === 'background'), {
      elapsedSeconds: 660,
      activeSeconds: 330,
      manualActions: 23,
      sessions: 4,
    });

    const comparison = comparePersonaSnapshots(before, after);
    const background = comparison.rows.find(row => row.persona === 'background');

    expect(comparison.failures).toEqual([]);
    expect(comparison.rows).toHaveLength(PERSONA_IDS.length);
    expect(background).toMatchObject({ elapsedDelta: 60, activeDelta: 30, actionsDelta: 3, sessionsDelta: 1 });
    expect(formatPersonaImpact(comparison)).toContain('10m00s → 11m00s');
    expect(formatPersonaImpact(comparison)).toContain('+1m00s');
  });

  it('fails the comparison when a persona or seed is omitted', () => {
    const before = createSnapshot();
    const after = createSnapshot();
    after.results = after.results.filter(result => result.persona !== 'minimalist');

    expect(comparePersonaSnapshots(before, after).failures)
      .toContain('Missing minimalist seed 424242 in the after snapshot');
  });

  it('reports broken progression, siege collapse, and impossible actions while absent', () => {
    const before = createSnapshot();
    const after = createSnapshot();
    Object.assign(after.results.find(result => result.persona === 'check_in'), {
      finalEra: 4,
      completed: false,
      cycleReady: false,
      collapsed: true,
      actionsWhileAway: 2,
    });

    const comparison = comparePersonaSnapshots(before, after);
    expect(comparison.failures).toEqual([
      'check_in seed 424242 no longer reaches Era 10',
      'check_in seed 424242 is no longer ready to prestige',
      'check_in seed 424242 collapsed during the final siege',
      'check_in seed 424242 performed 2 actions while absent',
    ]);
  });
});
