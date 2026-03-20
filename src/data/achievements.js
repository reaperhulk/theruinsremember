// Achievements — milestones that reward prestige points or unlock bonuses
// Each achievement: { id, name, description, check: (state) => boolean, reward }
// reward: number of prestige points granted on first completion

export const achievements = [
  // Mining achievements
  { id: 'firstGem', name: 'Lucky Strike', description: 'Find your first gem', check: s => (s.totalGems || 0) >= 1, reward: 1 },
  { id: 'gemCollector', name: 'Gem Collector', description: 'Find 10 gems', check: s => (s.totalGems || 0) >= 10, reward: 1 },
  { id: 'gemHoarder', name: 'Gem Hoarder', description: 'Find 50 gems', check: s => (s.totalGems || 0) >= 50, reward: 2 },

  // Era achievements
  { id: 'industrialize', name: 'Industrialize', description: 'Reach Era 2', check: s => s.era >= 2, reward: 1 },
  { id: 'goDigital', name: 'Go Digital', description: 'Reach Era 3', check: s => s.era >= 3, reward: 1 },
  { id: 'reachSpace', name: 'To the Stars', description: 'Reach Era 4', check: s => s.era >= 4, reward: 1 },
  { id: 'solarSystem', name: 'Solar Pioneer', description: 'Reach Era 5', check: s => s.era >= 5, reward: 1 },
  { id: 'interstellar', name: 'Starfarer', description: 'Reach Era 6', check: s => s.era >= 6, reward: 2 },
  { id: 'dysonBuilder', name: 'Dyson Builder', description: 'Reach Era 7', check: s => s.era >= 7, reward: 2 },
  { id: 'galacticCiv', name: 'Galactic Civilization', description: 'Reach Era 8', check: s => s.era >= 8, reward: 2 },
  { id: 'intergalactic', name: 'Intergalactic', description: 'Reach Era 9', check: s => s.era >= 9, reward: 3 },
  { id: 'multiverse', name: 'Multiverse', description: 'Reach Era 10', check: s => s.era >= 10, reward: 5 },

  // Upgrade achievements
  { id: 'upgrader', name: 'Upgrader', description: 'Purchase 10 upgrades', check: s => Object.keys(s.upgrades || {}).length >= 10, reward: 1 },
  { id: 'megaUpgrader', name: 'Mega Upgrader', description: 'Purchase 30 upgrades', check: s => Object.keys(s.upgrades || {}).length >= 30, reward: 2 },
  { id: 'maxUpgrader', name: 'Upgrade Master', description: 'Purchase 50 upgrades', check: s => Object.keys(s.upgrades || {}).length >= 50, reward: 3 },

  // Trading achievements
  { id: 'firstTrade', name: 'First Trade', description: 'Complete a trade', check: s => (s.totalTrades || 0) >= 1, reward: 1 },
  { id: 'tradeMaster', name: 'Trade Master', description: 'Complete 25 trades', check: s => (s.totalTrades || 0) >= 25, reward: 2 },

  // Mini-game achievements
  { id: 'hacker', name: 'Script Kiddie', description: 'Complete 5 hacks', check: s => (s.hackSuccesses || 0) >= 5, reward: 1 },
  { id: 'eliteHacker', name: 'Elite Hacker', description: 'Complete 20 hacks', check: s => (s.hackSuccesses || 0) >= 20, reward: 2 },
  { id: 'perfectDock', name: 'Ace Pilot', description: 'Land 10 perfect docks', check: s => (s.dockingPerfects || 0) >= 10, reward: 2 },
  { id: 'weaver', name: 'Reality Weaver', description: 'Complete 10 weaves', check: s => (s.totalWeaves || 0) >= 10, reward: 2 },

  // Prestige achievements
  { id: 'firstPrestige', name: 'New Beginning', description: 'Prestige for the first time', check: s => (s.prestigeCount || 0) >= 1, reward: 1 },
  { id: 'prestigeVet', name: 'Veteran', description: 'Prestige 5 times', check: s => (s.prestigeCount || 0) >= 5, reward: 3 },

  // Speed achievements
  { id: 'speedrunEra3', name: 'Speed Demon', description: 'Reach Era 3 in under 5 minutes', check: s => s.era >= 3 && (s.bestEraTimes?.[3] || Infinity) < 300, reward: 3 },
  { id: 'speedrunEra5', name: 'Warp Speed', description: 'Reach Era 5 in under 10 minutes', check: s => s.era >= 5 && (s.bestEraTimes?.[5] || Infinity) < 600, reward: 5 },

  // Collection achievements
  { id: 'allEra1', name: 'Era 1 Complete', description: 'Buy all Era 1 upgrades', check: s => ['tools','irrigation','basicPower','housing','foundry','storehouse'].every(id => s.upgrades?.[id]), reward: 2 },
  { id: 'routeMaster', name: 'Route Master', description: 'Create 5 star routes', check: s => (s.starRoutes?.length || 0) >= 5, reward: 2 },
  { id: 'colonyManager', name: 'Colony Manager', description: 'Assign 10+ colonies', check: s => { const a = s.colonyAssignments || {}; return (a.growth || 0) + (a.science || 0) + (a.industry || 0) >= 10; }, reward: 2 },

  // Combo achievements
  { id: 'dockCombo5', name: 'Docking Ace', description: 'Reach a 5x docking combo', check: s => (s.dockingCombo || 0) >= 5, reward: 3 },
  { id: 'weaveCombo3', name: 'Reality Artist', description: 'Reach a 3x weave combo', check: s => (s.weaveCombo || 0) >= 3, reward: 3 },

  // Resource milestones
  { id: 'million', name: 'Millionaire', description: 'Have 1M of any resource', check: s => Object.values(s.resources || {}).some(r => r.unlocked && r.amount >= 1e6), reward: 2 },
  { id: 'billion', name: 'Billionaire', description: 'Have 1B of any resource', check: s => Object.values(s.resources || {}).some(r => r.unlocked && r.amount >= 1e9), reward: 3 },
  { id: 'trillion', name: 'Trillionaire', description: 'Have 1T of any resource', check: s => Object.values(s.resources || {}).some(r => r.unlocked && r.amount >= 1e12), reward: 5 },

  // Tech achievements
  { id: 'techMaster', name: 'Tech Master', description: 'Unlock 15 technologies', check: s => Object.keys(s.tech || {}).length >= 15, reward: 2 },
  { id: 'branchChosen', name: 'The Path Taken', description: 'Make a branching tech choice', check: s => !!(s.tech?.offensiveAI || s.tech?.defensiveAI || s.tech?.bioEngineering || s.tech?.mechEngineering), reward: 1 },

  // Prestige shop
  { id: 'shopkeeper', name: 'Shopkeeper', description: 'Buy 3 prestige upgrades', check: s => Object.keys(s.prestigeUpgrades || {}).length >= 3, reward: 2 },
  { id: 'fullyUpgraded', name: 'Fully Upgraded', description: 'Buy 8 prestige upgrades', check: s => Object.keys(s.prestigeUpgrades || {}).length >= 8, reward: 5 },

  // Factory
  { id: 'factoryEfficiency', name: 'Efficient Factory', description: 'Get the factory efficiency bonus', check: s => { const a = s.factoryAllocation || {}; return (a.steel||0) > 0 && (a.electronics||0) > 0 && (a.research||0) > 0; }, reward: 1 },

  // Time-based
  { id: 'patient', name: 'Patient Player', description: 'Play for 30 minutes total', check: s => s.totalTime >= 1800, reward: 1 },
  { id: 'dedicated', name: 'Dedicated', description: 'Play for 2 hours total', check: s => s.totalTime >= 7200, reward: 2 },

  // Era 10 endgame
  { id: 'allUpgrades', name: 'Completionist', description: 'Purchase 60 upgrades', check: s => Object.keys(s.upgrades || {}).length >= 60, reward: 5 },
  { id: 'megaUpgrader2', name: 'Upgrade Addict', description: 'Purchase 80 upgrades', check: s => Object.keys(s.upgrades || {}).length >= 80, reward: 7 },
  { id: 'allTech', name: 'Researcher', description: 'Unlock 20 technologies', check: s => Object.keys(s.tech || {}).length >= 20, reward: 3 },
  { id: 'megaTech', name: 'Tech Guru', description: 'Unlock 30 technologies', check: s => Object.keys(s.tech || {}).length >= 30, reward: 5 },

  // Repeatable achievements
  { id: 'repeatBuyer', name: 'Mass Producer', description: 'Buy any repeatable upgrade 5 times', check: s => Object.values(s.upgrades || {}).some(v => typeof v === 'number' && v >= 5), reward: 2 },
  { id: 'repeatAddict', name: 'Factory King', description: 'Buy any repeatable upgrade 10 times', check: s => Object.values(s.upgrades || {}).some(v => typeof v === 'number' && v >= 10), reward: 3 },

  // Misc
  { id: 'starNetwork', name: 'Star Network', description: 'Create 8 star routes', check: s => (s.starRoutes?.length || 0) >= 8, reward: 3 },
  { id: 'gemLegend', name: 'Gem Legend', description: 'Find 100 gems', check: s => (s.totalGems || 0) >= 100, reward: 5 },
  { id: 'tradeEmpire', name: 'Trade Empire', description: 'Complete 50 trades', check: s => (s.totalTrades || 0) >= 50, reward: 3 },
  { id: 'prestigeMaster', name: 'Prestige Master', description: 'Prestige 10 times', check: s => (s.prestigeCount || 0) >= 10, reward: 10 },

  // 120 upgrade milestone
  { id: 'upgradeCollector', name: 'Collector Supreme', description: 'Purchase 100 upgrades', check: s => Object.keys(s.upgrades || {}).length >= 100, reward: 10 },
  { id: 'allAchievements', name: 'Achievement Hunter', description: 'Earn 40 achievements', check: s => Object.keys(s.achievements || {}).length >= 40, reward: 10 },
  { id: 'longGame', name: 'Marathon', description: 'Play for 8 hours total', check: s => s.totalTime >= 28800, reward: 5 },

  // More milestones
  { id: 'upgradeKing', name: 'Upgrade King', description: 'Purchase 120 upgrades', check: s => Object.keys(s.upgrades || {}).length >= 120, reward: 15 },
  { id: 'hundredGems', name: 'Gem Magnate', description: 'Find 200 gems', check: s => (s.totalGems || 0) >= 200, reward: 5 },
  { id: 'tradeBaron', name: 'Trade Baron', description: 'Complete 100 trades', check: s => (s.totalTrades || 0) >= 100, reward: 5 },
  { id: 'speedrunEra10', name: 'Multiversal Speedrun', description: 'Reach Era 10 in under 30 minutes', check: s => s.era >= 10 && (s.bestEraTimes?.[10] || Infinity) < 1800, reward: 10 },

  // More depth
  { id: 'upgradeEmperor', name: 'Upgrade Emperor', description: 'Purchase 140 upgrades', check: s => Object.keys(s.upgrades || {}).length >= 140, reward: 20 },
  { id: 'eventWatcher', name: 'Event Watcher', description: 'Witness 50 events', check: s => (s.eventLog?.length || 0) >= 10 && s.totalTime > 600, reward: 2 },
  { id: 'dockingMaster', name: 'Docking Master', description: 'Land 50 perfect docks', check: s => (s.dockingPerfects || 0) >= 50, reward: 5 },

  // Ultra endgame
  { id: 'upgrade200', name: 'Two Hundred', description: 'Purchase 200 upgrades', check: s => Object.keys(s.upgrades || {}).length >= 200, reward: 25 },
  { id: 'hackerElite', name: 'Hacker Elite', description: 'Complete 50 hacks', check: s => (s.hackSuccesses || 0) >= 50, reward: 5 },
  { id: 'weaveMaster', name: 'Weave Master', description: 'Complete 50 weaves', check: s => (s.totalWeaves || 0) >= 50, reward: 5 },
  { id: 'gemOverlord', name: 'Gem Overlord', description: 'Find 500 gems', check: s => (s.totalGems || 0) >= 500, reward: 10 },
  { id: 'allPrestige', name: 'Prestige Collector', description: 'Buy all prestige upgrades', check: s => Object.keys(s.prestigeUpgrades || {}).length >= 15, reward: 20 },

  // New achievements
  { id: 'quadrillion', name: 'Quadrillionaire', description: 'Have 1 quadrillion of any resource', check: s => Object.values(s.resources || {}).some(r => r.unlocked && r.amount >= 1e15), reward: 10 },
  { id: 'speedrunEra7', name: 'Dyson Speedrun', description: 'Reach Era 7 in under 15 minutes', check: s => s.era >= 7 && (s.bestEraTimes?.[7] || Infinity) < 900, reward: 7 },
  { id: 'upgrade160', name: 'Upgrade Tyrant', description: 'Purchase 160 upgrades', check: s => Object.keys(s.upgrades || {}).length >= 160, reward: 20 },
  { id: 'techScholar', name: 'Tech Scholar', description: 'Unlock 40 technologies', check: s => Object.keys(s.tech || {}).length >= 40, reward: 10 },
  { id: 'eventSurvivor', name: 'Event Survivor', description: 'Witness 100 events', check: s => (s.eventLog?.length || 0) >= 20 && s.totalTime > 1200, reward: 5 },
  { id: 'dockCombo10', name: 'Docking Legend', description: 'Reach a 10x docking combo', check: s => (s.dockingCombo || 0) >= 10, reward: 5 },
  { id: 'weaveCombo5', name: 'Reality Sculptor', description: 'Reach a 5x weave combo', check: s => (s.weaveCombo || 0) >= 5, reward: 5 },
  { id: 'prestigeGrandmaster', name: 'Prestige Grandmaster', description: 'Prestige 20 times', check: s => (s.prestigeCount || 0) >= 20, reward: 15 },
  { id: 'trade200', name: 'Trade Mogul', description: 'Complete 200 trades', check: s => (s.totalTrades || 0) >= 200, reward: 10 },
  { id: 'gem1000', name: 'Gem Deity', description: 'Find 1000 gems', check: s => (s.totalGems || 0) >= 1000, reward: 15 },
  { id: 'repeatAddict20', name: 'Mass Producer Elite', description: 'Buy any repeatable upgrade 20 times', check: s => Object.values(s.upgrades || {}).some(v => typeof v === 'number' && v >= 20), reward: 5 },
  { id: 'marathon24', name: 'Day Runner', description: 'Play for 24 hours total', check: s => s.totalTime >= 86400, reward: 10 },
];
