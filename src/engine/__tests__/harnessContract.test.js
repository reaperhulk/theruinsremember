import { describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import process from 'node:process';
import { createInitialState } from '../state.js';
import { scenarioOutcome, validateSimulationState } from '../../../scripts/progression-contract.mjs';

describe('progression harness failure detection', () => {
  it('rejects a completed earlier cycle followed by an incomplete final cycle', () => {
    const state = { ...createInitialState(), era: 4, prestigeCount: 1 };
    const outcome = scenarioOutcome(state, { targetEra: 10, prestige: 1 }, { prestiges: 1, peakEra: 10 });
    expect(outcome.completed).toBe(false);
    expect(outcome.failures).toContain('final era 4/10');
  });

  it('does not mistake arrival in the Multiverse for a completed cycle', () => {
    const outcome = scenarioOutcome({ ...createInitialState(), era: 10 }, { targetEra: 10, prestige: 0 });
    expect(outcome.completed).toBe(false);
    expect(outcome.failures).toContain('final cycle is not ready to prestige');
  });

  it('requires every requested prestige even when the final era is sufficient', () => {
    const outcome = scenarioOutcome(createInitialState(), { targetEra: 1, prestige: 3 }, { prestiges: 2 });
    expect(outcome.completed).toBe(false);
  });

  it('only treats a collapse as success for an explicitly requested collapse scenario', () => {
    const state = createInitialState();
    expect(scenarioOutcome(state, { targetEra: 1 }, { collapsed: true }).completed).toBe(false);
    expect(scenarioOutcome(state, { stopOnCollapse: true }, { collapsed: true }).completed).toBe(true);
  });

  it('rejects invalid numbers that could make affordability comparisons silently pass', () => {
    const state = createInitialState();
    state.resources.food.amount = NaN;
    state.resources.energy.rateMult = Infinity;
    expect(validateSimulationState(state)).toEqual(['food.amount is invalid', 'energy.rateMult is invalid']);
  });

  it('returns a nonzero exit status for an unfinished CLI run even without balance assertions', () => {
    const result = spawnSync(process.execPath, [
      'scripts/bot-playtest.js', '--scenario', 'engaged', '--max-time', '1', '--quiet', '--json', '--seed', '1',
    ], { encoding: 'utf8' });
    expect(result.status).toBe(1);
    const report = JSON.parse(result.stdout);
    expect(report.results.completionStatus.completed).toBe(false);
    expect(report.results.completionStatus.failureReasons.length).toBeGreaterThan(0);
    expect(report.results.blockers.era).toBe(1);
  });
});
