import { describe, it, expect } from 'vitest';
import { candidateActions, runPlayerJourney } from '../../../scripts/player-journey.mjs';
import { DOCTRINE_RESEARCH, RECONSTRUCTION_PROJECTS } from '../archive.js';
import { createInitialState } from '../state.js';
import { createPersonaProfiles } from '../../../scripts/playtest-personas.js';
import { createPacingMonitor } from '../../../scripts/journey-pacing.mjs';

describe('fresh-save journeys with bounded legal player commands', { timeout: 30000 }, () => {
  it('reverse signal choices invoke real definitions and the third relic slot is used', () => {
    const profile = createPersonaProfiles().engaged;
    const state = { ...createInitialState(), era: 9, activeRelics: ['emberSeed', 'openCircuit'], relicOffer: ['loomNeedle'], archive: { ...createInitialState().archive, projects: { echoObservatory: 2 } } };
    const actions = candidateActions(state, profile, { branch: 'reverse' }, () => 0.5);
    const signal = actions.find(a => a.name.startsWith('signal:'));
    expect(signal.fn(state).lockedSignals).toHaveProperty(signal.name.slice(7));
    expect(actions.find(a => a.name === 'relic').fn(state).activeRelics).toHaveLength(3);
  });
  it('resource growth and repeated optional actions cannot hide a pacing failure', () => {
    const monitor = createPacingMonitor(createPersonaProfiles().engaged, { maxStalledActiveSeconds: 60 });
    const state = createInitialState();
    monitor.observe(state, 0, 0);
    monitor.observe({ ...state, totalTime: 61, totalGems: 10000, resources: { ...state.resources, materials: { ...state.resources.materials, amount: 1000000 } } }, 61, 61);
    expect(monitor.failures).toEqual([expect.stringContaining('no meaningful progress')]);
  });
  it('protects the minimalist fuel path without requiring recovery settings or operations', () => {
    const result = runPlayerJourney({ persona: 'minimalist', maxSeconds: 3600 });
    expect(result.pacing.eras.find(e => e.era === 4)?.seconds).toBeLessThan(900);
    expect(result.finalEra).toBeGreaterThan(4);
    expect(result.rejectedCommands).toEqual([]);
  });
  it('detects a deliberately unavailable breakthrough despite continuing resource growth', () => {
    const result = runPlayerJourney({ persona: 'engaged', blockedTech: 'industrialRevolution', maxSeconds: 1200 });
    expect(result.completed).toBe(false);
    expect(result.finalEra).toBe(1);
    expect(result.failures).toContain('final era 1/10');
    expect(result.manualActions).toBeLessThanOrEqual(2 * 120);
  });
  it('does not accept the first completed cycle when the final requested cycle times out', () => {
    const first = runPlayerJourney({ persona: 'engaged', cycles: 1 });
    const result = runPlayerJourney({ persona: 'engaged', cycles: 2, maxSeconds: first.elapsedSeconds + 30 });
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
  it.each([424242, 42])('uses all legacy unlocks through 22 natural cycles (seed %i)', { timeout: 120000 }, seed => {
    const result = runPlayerJourney({ persona: 'engaged', seed, cycles: 22, useNewSystems: true, collectLegacy: true, maxSeconds: 10800 });
    expect(result.completed, JSON.stringify(result.failures)).toBe(true);
    expect(result.archive.research.sort()).toEqual(Object.keys(DOCTRINE_RESEARCH).sort());
    for (const [id, project] of Object.entries(RECONSTRUCTION_PROJECTS)) expect(result.archive.projects[id], id).toBe(project.stages || 2);
    expect(result.maxRelics).toBe(3);
    expect(result.legacy.synergySeconds).toBeGreaterThan(0);
    expect(result.legacy.conservedRelics).toBeGreaterThan(0);
    expect(result.legacy.replayedChoices).toBeGreaterThan(0);
    expect(result.legacy.restoredVisits).toBeGreaterThan(0);
    expect(result.legacy.commands['production-route']).toBeGreaterThan(0);
  });

});
