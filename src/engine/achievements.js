// Achievement system — checks milestones and awards prestige points

import { achievements } from '../data/achievements.js';

// Get list of earned achievement IDs from state
export function getEarnedAchievements(state) {
  return state.achievements || {};
}

// Check all achievements and award any newly completed ones.
// Returns { state, newAchievements } where newAchievements is an array of newly earned.
export function checkAchievements(state) {
  const earned = { ...(state.achievements || {}) };
  const newAchievements = [];

  for (const achievement of achievements) {
    if (earned[achievement.id]) continue;
    try {
      if (achievement.check(state)) {
        earned[achievement.id] = true;
        newAchievements.push(achievement);
      }
    } catch {
      // Skip achievements that error during check
    }
  }

  if (newAchievements.length === 0) return { state, newAchievements: [] };

  // Achievement Hunter prestige upgrade: 50% more points
  const hasAchievementHunter = state.prestigeUpgrades && state.prestigeUpgrades.achievementHunter;
  const rewardMult = hasAchievementHunter ? 1.5 : 1;
  const totalReward = Math.floor(newAchievements.reduce((sum, a) => sum + (a.reward || 0), 0) * rewardMult);

  return {
    state: {
      ...state,
      achievements: earned,
      prestigePoints: (state.prestigePoints || 0) + totalReward,
    },
    newAchievements,
  };
}

// Get achievement display data
export function getAchievementList(state) {
  const earned = state.achievements || {};
  return achievements.map(a => ({
    ...a,
    earned: !!earned[a.id],
    // Remove check function for serialization
    check: undefined,
  }));
}
