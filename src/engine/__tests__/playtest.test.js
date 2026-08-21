import { spawnSync } from 'node:child_process';
import process from 'node:process';
import { describe, expect, it } from 'vitest';

describe('playtest assertion contract', () => {
  it('fails when assertion mode is requested for a scenario without targets', () => {
    const result = spawnSync(process.execPath, [
      'scripts/bot-playtest.js',
      '--scenario', 'unconfiguredScenario',
      '--max-time', '1',
      '--quiet',
      '--assert-balance',
      '--seed', '1',
    ], { cwd: process.cwd(), encoding: 'utf8' });

    expect(result.status).toBe(1);
    expect(result.stdout).toContain('no balance assertion targets configured');
  });
});
