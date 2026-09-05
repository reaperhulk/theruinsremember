import { describe, it, expect } from 'vitest';
import { runPlayerJourney } from '../../../scripts/player-journey.mjs';

describe('fresh-save journeys with bounded legal player commands', { timeout: 30000 }, () => {
  it('detects a deliberately unavailable breakthrough despite continuing resource growth', () => {
    const result = runPlayerJourney({ persona: 'engaged', blockedTech: 'industrialRevolution', maxSeconds: 1200 });
    expect(result.completed).toBe(false);
    expect(result.finalEra).toBe(1);
    expect(result.failures).toContain('final era 1/10');
    expect(result.manualActions).toBeLessThanOrEqual(2 * 120);
  });
  it('does not accept the first completed cycle when the final requested cycle times out', () => {
    const result = runPlayerJourney({ persona: 'engaged', cycles: 2, maxSeconds: 1800 });
    expect(result.cycleResults).toHaveLength(1);
    expect(result.completed).toBe(false);
    expect(result.failures).toContain('finished 1/2 cycles');
  });
  it('earns research, crafts relics, reconstructs projects and completes six cycles naturally', () => {
    const result = runPlayerJourney({ persona: 'engaged', cycles: 6, useNewSystems: true, maxSeconds: 21600 });
    expect(result.completed, JSON.stringify(result.blockers)).toBe(true);
    expect(result.archive.cycles).toBe(5);
    expect(result.archive.research.length).toBeGreaterThan(0);
    expect(result.archive.crafted).toBeGreaterThan(0);
    expect(Object.values(result.archive.projects)).toContain(2);
  });
});
