// Achievement system — checks milestones and awards prestige points

import { achievements } from '../data/achievements.js';

// Maps achievement ID → (state) => { current, target } for numeric progress display
const ACHIEVEMENT_PROGRESS = {
  firstGem:        s => ({ current: s.totalGems || 0, target: 1 }),
  gemCollector:    s => ({ current: s.totalGems || 0, target: 10 }),
  gemHoarder:      s => ({ current: s.totalGems || 0, target: 50 }),
  gemLegend:       s => ({ current: s.totalGems || 0, target: 100 }),
  hundredGems:     s => ({ current: s.totalGems || 0, target: 200 }),
  gemOverlord:     s => ({ current: s.totalGems || 0, target: 500 }),
  upgrader:        s => ({ current: Object.keys(s.upgrades || {}).length, target: 10 }),
  megaUpgrader:    s => ({ current: Object.keys(s.upgrades || {}).length, target: 30 }),
  maxUpgrader:     s => ({ current: Object.keys(s.upgrades || {}).length, target: 50 }),
  allUpgrades:     s => ({ current: Object.keys(s.upgrades || {}).length, target: 60 }),
  megaUpgrader2:   s => ({ current: Object.keys(s.upgrades || {}).length, target: 80 }),
  upgradeCollector:s => ({ current: Object.keys(s.upgrades || {}).length, target: 100 }),
  upgradeKing:     s => ({ current: Object.keys(s.upgrades || {}).length, target: 120 }),
  upgradeEmperor:  s => ({ current: Object.keys(s.upgrades || {}).length, target: 140 }),
  upgrade200:      s => ({ current: Object.keys(s.upgrades || {}).length, target: 200 }),
  firstTrade:      s => ({ current: s.totalTrades || 0, target: 1 }),
  tradeMaster:     s => ({ current: s.totalTrades || 0, target: 25 }),
  tradeEmpire:     s => ({ current: s.totalTrades || 0, target: 50 }),
  tradeBaron:      s => ({ current: s.totalTrades || 0, target: 100 }),
  hacker:          s => ({ current: s.hackSuccesses || 0, target: 5 }),
  eliteHacker:     s => ({ current: s.hackSuccesses || 0, target: 20 }),
  hackerElite:     s => ({ current: s.hackSuccesses || 0, target: 50 }),
  perfectDock:     s => ({ current: s.dockingPerfects || 0, target: 10 }),
  dockingMaster:   s => ({ current: s.dockingPerfects || 0, target: 50 }),
  weaver:          s => ({ current: s.totalWeaves || 0, target: 10 }),
  weaveMaster:     s => ({ current: s.totalWeaves || 0, target: 50 }),
  firstPrestige:   s => ({ current: s.prestigeCount || 0, target: 1 }),
  prestigeVet:     s => ({ current: s.prestigeCount || 0, target: 5 }),
  prestigeMaster:  s => ({ current: s.prestigeCount || 0, target: 10 }),
  routeMaster:     s => ({ current: s.starRoutes?.length || 0, target: 5 }),
  starNetwork:     s => ({ current: s.starRoutes?.length || 0, target: 8 }),
  dysonBuilder10:  s => ({ current: s.dysonSegments || 0, target: 10 }),
  dysonBuilder100: s => ({ current: s.dysonSegments || 0, target: 100 }),
  cosmicTuner5:    s => ({ current: s.tuningScore || 0, target: 5 }),
  cosmicTuner25:   s => ({ current: s.tuningScore || 0, target: 25 }),
  cosmicTuner100:  s => ({ current: s.tuningScore || 0, target: 100 }),
  dockCombo5:      s => ({ current: s.dockingCombo || 0, target: 5 }),
  weaveCombo3:     s => ({ current: s.weaveCombo || 0, target: 3 }),
  techMaster:      s => ({ current: Object.keys(s.tech || {}).length, target: 15 }),
  allTech:         s => ({ current: Object.keys(s.tech || {}).length, target: 20 }),
  megaTech:        s => ({ current: Object.keys(s.tech || {}).length, target: 30 }),
  shopkeeper:      s => ({ current: Object.keys(s.prestigeUpgrades || {}).length, target: 3 }),
  fullyUpgraded:   s => ({ current: Object.keys(s.prestigeUpgrades || {}).length, target: 8 }),
  allPrestige:     s => ({ current: Object.keys(s.prestigeUpgrades || {}).length, target: 25 }),
  patient:         s => ({ current: Math.min(s.totalTime || 0, 1800), target: 1800 }),
  dedicated:       s => ({ current: Math.min(s.totalTime || 0, 7200), target: 7200 }),
  longGame:        s => ({ current: Math.min(s.totalTime || 0, 28800), target: 28800 }),
  allAchievements: s => ({ current: Object.keys(s.achievements || {}).length, target: 40 }),
  realityForger3:  s => ({ current: Object.values(s.realityKeys || {}).reduce((sum, v) => sum + v, 0), target: 3 }),
  realityForger10: s => ({ current: Object.values(s.realityKeys || {}).reduce((sum, v) => sum + v, 0), target: 10 }),
  senator10:       s => ({ current: (s.senate?.merchants||0)+(s.senate?.scholars||0)+(s.senate?.warriors||0), target: 10 }),
  senator50:       s => ({ current: (s.senate?.merchants||0)+(s.senate?.scholars||0)+(s.senate?.warriors||0), target: 50 }),
};

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

  // Award prestige points for newly earned achievements (only with achievementHunter upgrade)
  const hasAchievementHunter = state.prestigeUpgrades && state.prestigeUpgrades.achievementHunter;
  let pointsEarned = 0;
  if (hasAchievementHunter) {
    const rewardMult = 1.5;
    for (const a of newAchievements) {
      if (a.reward) {
        pointsEarned += Math.floor(a.reward * rewardMult);
      }
    }
  }

  return {
    state: {
      ...state,
      achievements: earned,
      prestigePoints: (state.prestigePoints || 0) + pointsEarned,
    },
    newAchievements,
  };
}

// Get achievement display data
export function getAchievementList(state) {
  const earned = state.achievements || {};
  return achievements.map(a => {
    const progressFn = ACHIEVEMENT_PROGRESS[a.id];
    const progress = progressFn ? progressFn(state) : null;
    return {
      ...a,
      earned: !!earned[a.id],
      progress,
      // Remove check function for serialization
      check: undefined,
    };
  });
}

// Count unearned achievements within 10% of completion (for badge)
export function getAchievementsNearComplete(state) {
  const earned = state.achievements || {};
  let count = 0;
  for (const a of achievements) {
    if (earned[a.id]) continue;
    const progressFn = ACHIEVEMENT_PROGRESS[a.id];
    if (!progressFn) continue;
    const { current, target } = progressFn(state);
    if (target > 0 && current / target >= 0.9) count++;
  }
  return count;
}
