import { spawnSync } from 'node:child_process';
import process from 'node:process';
import { describe, expect, it } from 'vitest';
import { createPersonaProfiles, getPlayerAttention, PERSONA_IDS } from '../../../scripts/playtest-personas.js';

function runPlaytest(...args) {
  const result = spawnSync(process.execPath, [
    'scripts/bot-playtest.js',
    '--json',
    '--quiet',
    '--seed', '424242',
    ...args,
  ], { cwd: process.cwd(), encoding: 'utf8' });

  expect(result.status, result.stderr).toBe(0);
  return JSON.parse(result.stdout);
}

describe('attention-aware player personas', () => {
  it('defines exactly the requested standalone, attention-aware personas', () => {
    const personas = createPersonaProfiles();

    expect(Object.keys(personas)).toEqual(PERSONA_IDS);
    expect(Object.values(personas).every(persona => persona.attention?.decisionInterval > 0)).toBe(true);
    expect(personas.minimalist.docking).toBe(false);
    expect(personas.newcomer.attention.firstDecisionAt).toBe(20);
  });

  it('does not expose any superseded legacy bot profiles', () => {
    const result = spawnSync(process.execPath, [
      'scripts/bot-playtest.js', '--list-profiles',
    ], { cwd: process.cwd(), encoding: 'utf8' });

    expect(result.status, result.stderr).toBe(0);
    for (const name of PERSONA_IDS) expect(result.stdout).toMatch(new RegExp(`^\\s*${name}\\s`, 'm'));
    for (const name of ['optimal', 'casual', 'lowInteraction', 'passive', 'clickerOnly', 'tradingHeavy']) {
      expect(result.stdout).not.toMatch(new RegExp(`^\\s*${name}\\s`, 'm'));
    }
  });

  it('makes newcomers wait and limits engaged players to their decision cadence', () => {
    const { newcomer, engaged, optimizer } = createPersonaProfiles();

    expect(getPlayerAttention(newcomer, 0).decisionWindow).toBe(false);
    expect(getPlayerAttention(newcomer, 19).decisionWindow).toBe(false);
    expect(getPlayerAttention(newcomer, 20).decisionWindow).toBe(true);
    expect(getPlayerAttention(newcomer, 21).decisionWindow).toBe(false);
    expect(getPlayerAttention(engaged, 9).decisionWindow).toBe(false);
    expect(getPlayerAttention(engaged, 10).decisionWindow).toBe(true);
    expect(getPlayerAttention(optimizer, 1).decisionWindow).toBe(false);
    expect(getPlayerAttention(optimizer, 2).decisionWindow).toBe(true);
  });

  it('keeps background sessions online while the player is away', () => {
    const { background } = createPersonaProfiles();

    expect(getPlayerAttention(background, 0)).toMatchObject({ present: true, decisionWindow: true, sessionStart: true, offline: false });
    expect(getPlayerAttention(background, 29)).toMatchObject({ present: true, decisionWindow: false, offline: false });
    expect(getPlayerAttention(background, 30)).toMatchObject({ present: false, decisionWindow: false, offline: false });
    expect(getPlayerAttention(background, 119)).toMatchObject({ present: false, offline: false });
    expect(getPlayerAttention(background, 120)).toMatchObject({ present: true, decisionWindow: true, sessionStart: true });
  });

  it('models closed-game check-ins and four-hour offline returns independently', () => {
    const { check_in: checkIn, offline_returner: offlineReturner } = createPersonaProfiles();

    expect(getPlayerAttention(checkIn, 59)).toMatchObject({ present: true, offline: false });
    expect(getPlayerAttention(checkIn, 60)).toMatchObject({ present: false, decisionWindow: false, offline: true });
    expect(getPlayerAttention(checkIn, 599)).toMatchObject({ present: false, offline: true });
    expect(getPlayerAttention(checkIn, 600)).toMatchObject({ present: true, decisionWindow: true, sessionStart: true, offline: false });

    expect(getPlayerAttention(offlineReturner, 119)).toMatchObject({ present: true, offline: false });
    expect(getPlayerAttention(offlineReturner, 120)).toMatchObject({ present: false, offline: true });
    expect(getPlayerAttention(offlineReturner, 14399)).toMatchObject({ present: false, offline: true });
    expect(getPlayerAttention(offlineReturner, 14400)).toMatchObject({ present: true, sessionStart: true, offline: false });
  });

  it('never lets check-in players make manual decisions while the game is closed', () => {
    const run = runPlaytest('--scenario', 'check_in', '--max-time', '75');
    const attention = run.results.engagement.attention;

    expect(attention.sessions).toBe(1);
    expect(attention.activeSeconds).toBe(60);
    expect(attention.awaySeconds).toBe(15);
    expect(attention.offlineSeconds).toBe(15);
    expect(attention.decisionWindows).toBe(12);
    expect(attention.manualActions).toBeGreaterThan(0);
    expect(attention.actionsWhileAway).toBe(0);
  });

  it('reports cumulative elapsed time across prestige resets separately from the final cycle', () => {
    const run = runPlaytest('--scenario', 'prestige3');
    const status = run.results.completionStatus;
    const completedCycleTime = run.results.prestigeLog.reduce((sum, cycle) => sum + cycle.time, 0);

    expect(status.prestigeCount).toBe(3);
    expect(status.cumulativeTime).toBe(completedCycleTime + status.totalTime);
    expect(status.cumulativeTime).toBeGreaterThan(status.totalTime);
  });

  it('prints cumulative multi-cycle durations in the human-readable balance summary', () => {
    const result = spawnSync(process.execPath, [
      'scripts/bot-playtest.js',
      '--scenario', 'prestige3',
      '--quiet',
      '--seed', '424242',
    ], { cwd: process.cwd(), encoding: 'utf8' });

    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain('38m49s');
    expect(result.stdout).not.toContain('5m20s');
  });
});
