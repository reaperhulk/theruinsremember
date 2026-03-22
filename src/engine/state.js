import { resources } from '../data/resources.js';

export function createInitialState() {
  const resourceState = {};
  for (const r of Object.values(resources)) {
    resourceState[r.id] = {
      amount: 0,
      cap: r.baseCap,
      baseRate: r.baseRate,
      rateMult: 1,
      rateAdd: 0,
      capMult: 1,
      unlocked: r.era === 1,
    };
  }

  // Start with some labor
  resourceState.labor.amount = 10;

  return {
    era: 1,
    resources: resourceState,
    upgrades: {},       // { [upgradeId]: true }
    tech: {},           // { [techId]: true }
    totalTicks: 0,
    totalTime: 0,       // seconds
    prestigeMultiplier: 1,
    lastSaved: Date.now(),
    // Mining mini-game (Era 1+)
    miningStreak: 0,    // consecutive clicks without gem
    totalGems: 0,       // lifetime gems found
    // Events system (Era 3+)
    activeEffects: [],  // [{ id, endsAt, description }]
    eventLog: [],       // [{ message, time }] — last 10 events
    // Trading (Era 6+)
    totalTrades: 0,
    // Era time tracking
    eraStartTime: 0,    // totalTime when current era began
    bestEraTimes: {},
    // Prestige
    prestigeCount: 0,
    prestigePoints: 0,
    prestigeUpgrades: {},
    achievements: {},
    // Dyson Assembly (Era 7+)
    dysonSegments: 0,
    // Cosmic Tuning (Era 9+)
    tuningScore: 0,
    // Galactic Senate (Era 8+)
    senate: { merchants: 0, scholars: 0, warriors: 0 },
    // Reality Forge (Era 10+)
    realityKeys: {},
    saveVersion: 2,
  };
}
