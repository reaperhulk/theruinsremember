import { describe, it, expect } from 'vitest';
import { checkAchievements, getAchievementList } from '../achievements.js';
import { createInitialState } from '../state.js';

describe('achievements', () => {
  it('awards achievement when condition met', () => {
    const state = createInitialState();
    state.totalGems = 1;
    const { state: after, newAchievements } = checkAchievements(state);
    expect(newAchievements.length).toBeGreaterThan(0);
    const firstGem = newAchievements.find(a => a.id === 'firstGem');
    expect(firstGem).toBeTruthy();
    expect(after.achievements.firstGem).toBe(true);
    // Achievements award prestige points based on their reward field
    expect(after.prestigePoints).toBe(1); // firstGem has reward: 1
  });

  it('does not re-award already earned achievements', () => {
    const state = createInitialState();
    state.totalGems = 1;
    state.achievements = { firstGem: true };
    const { newAchievements } = checkAchievements(state);
    const firstGem = newAchievements.find(a => a.id === 'firstGem');
    expect(firstGem).toBeUndefined();
  });

  it('awards multiple achievements at once', () => {
    const state = createInitialState();
    state.era = 3;
    state.totalGems = 10;
    state.upgrades = {};
    for (let i = 0; i < 10; i++) state.upgrades[`u${i}`] = true;
    const { newAchievements } = checkAchievements(state);
    // Should earn: firstGem, gemCollector, industrialize, goDigital, upgrader
    expect(newAchievements.length).toBeGreaterThanOrEqual(5);
  });

  it('getAchievementList shows earned status', () => {
    const state = createInitialState();
    state.achievements = { firstGem: true };
    const list = getAchievementList(state);
    const firstGem = list.find(a => a.id === 'firstGem');
    expect(firstGem.earned).toBe(true);
    const gemCollector = list.find(a => a.id === 'gemCollector');
    expect(gemCollector.earned).toBe(false);
  });
});
