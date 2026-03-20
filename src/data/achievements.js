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

  // --- New achievements ---
  { id: 'quintillion', name: 'Quintillionaire', description: 'Have 1 quintillion of any resource', check: s => Object.values(s.resources || {}).some(r => r.unlocked && r.amount >= 1e18), reward: 15 },
  { id: 'speedrunEra3fast', name: 'Lightning Start', description: 'Reach Era 3 in under 3 minutes', check: s => s.era >= 3 && (s.bestEraTimes?.[3] || Infinity) < 180, reward: 5 },
  { id: 'upgrade250', name: 'Upgrade Overlord', description: 'Purchase 250 upgrades', check: s => Object.keys(s.upgrades || {}).length >= 250, reward: 30 },
  { id: 'techSage', name: 'Tech Sage', description: 'Unlock 50 technologies', check: s => Object.keys(s.tech || {}).length >= 50, reward: 15 },
  { id: 'hack100', name: 'Zero Day', description: 'Complete 100 hacks', check: s => (s.hackSuccesses || 0) >= 100, reward: 10 },
  { id: 'weave100', name: 'Weave Grandmaster', description: 'Complete 100 weaves', check: s => (s.totalWeaves || 0) >= 100, reward: 10 },
  { id: 'docking100', name: 'Flight Commander', description: 'Land 100 perfect docks', check: s => (s.dockingPerfects || 0) >= 100, reward: 10 },
  { id: 'trade500', name: 'Trade Titan', description: 'Complete 500 trades', check: s => (s.totalTrades || 0) >= 500, reward: 15 },
  { id: 'gem5000', name: 'Gem Cosmos', description: 'Find 5000 gems', check: s => (s.totalGems || 0) >= 5000, reward: 20 },
  { id: 'prestigeAscendant', name: 'Prestige Ascendant', description: 'Prestige 50 times', check: s => (s.prestigeCount || 0) >= 50, reward: 25 },
  { id: 'starNetwork15', name: 'Galactic Highway', description: 'Create 15 star routes', check: s => (s.starRoutes?.length || 0) >= 15, reward: 5 },
  { id: 'repeatAddict50', name: 'Industrial Titan', description: 'Buy any repeatable upgrade 50 times', check: s => Object.values(s.upgrades || {}).some(v => typeof v === 'number' && v >= 50), reward: 10 },

  // --- More achievements ---
  { id: 'sextillion', name: 'Sextillionaire', description: 'Have 1 sextillion of any resource', check: s => Object.values(s.resources || {}).some(r => r.unlocked && r.amount >= 1e21), reward: 20 },
  { id: 'speedrunEra5fast', name: 'Hyperdrive', description: 'Reach Era 5 in under 7 minutes', check: s => s.era >= 5 && (s.bestEraTimes?.[5] || Infinity) < 420, reward: 7 },
  { id: 'upgrade300', name: 'Upgrade Deity', description: 'Purchase 300 upgrades', check: s => Object.keys(s.upgrades || {}).length >= 300, reward: 40 },
  { id: 'techOracle', name: 'Tech Oracle', description: 'Unlock 60 technologies', check: s => Object.keys(s.tech || {}).length >= 60, reward: 20 },
  { id: 'hack200', name: 'Rootkit', description: 'Complete 200 hacks', check: s => (s.hackSuccesses || 0) >= 200, reward: 15 },
  { id: 'weave200', name: 'Weave Deity', description: 'Complete 200 weaves', check: s => (s.totalWeaves || 0) >= 200, reward: 15 },
  { id: 'docking200', name: 'Admiral', description: 'Land 200 perfect docks', check: s => (s.dockingPerfects || 0) >= 200, reward: 15 },
  { id: 'trade1000', name: 'Trade Overlord', description: 'Complete 1000 trades', check: s => (s.totalTrades || 0) >= 1000, reward: 20 },
  { id: 'gem10000', name: 'Gem Eternal', description: 'Find 10000 gems', check: s => (s.totalGems || 0) >= 10000, reward: 25 },
  { id: 'prestigeTranscendent', name: 'Prestige Transcendent', description: 'Prestige 100 times', check: s => (s.prestigeCount || 0) >= 100, reward: 50 },
  { id: 'starNetwork25', name: 'Cosmic Web', description: 'Create 25 star routes', check: s => (s.starRoutes?.length || 0) >= 25, reward: 10 },
  { id: 'colonyOverlord', name: 'Colony Overlord', description: 'Assign 50+ colonies', check: s => { const a = s.colonyAssignments || {}; return (a.growth || 0) + (a.science || 0) + (a.industry || 0) >= 50; }, reward: 10 },
  { id: 'marathon72', name: 'Endurance', description: 'Play for 72 hours total', check: s => s.totalTime >= 259200, reward: 15 },

  // --- 12 new achievements ---
  { id: 'septillion', name: 'Septillionaire', description: 'Have 1 septillion of any resource', check: s => Object.values(s.resources || {}).some(r => r.unlocked && r.amount >= 1e24), reward: 25 },
  { id: 'speedrunEra2', name: 'Quick Start', description: 'Reach Era 2 in under 2 minutes', check: s => s.era >= 2 && (s.bestEraTimes?.[2] || Infinity) < 120, reward: 3 },
  { id: 'upgrade350', name: 'Upgrade Ascendant', description: 'Purchase 350 upgrades', check: s => Object.keys(s.upgrades || {}).length >= 350, reward: 50 },
  { id: 'techOmniscient', name: 'Tech Omniscient', description: 'Unlock 65 technologies', check: s => Object.keys(s.tech || {}).length >= 65, reward: 25 },
  { id: 'hack300', name: 'Cyber Overlord', description: 'Complete 300 hacks', check: s => (s.hackSuccesses || 0) >= 300, reward: 20 },
  { id: 'weave300', name: 'Weave Overlord', description: 'Complete 300 weaves', check: s => (s.totalWeaves || 0) >= 300, reward: 20 },
  { id: 'docking300', name: 'Fleet Admiral', description: 'Land 300 perfect docks', check: s => (s.dockingPerfects || 0) >= 300, reward: 20 },
  { id: 'trade2000', name: 'Trade Emperor', description: 'Complete 2000 trades', check: s => (s.totalTrades || 0) >= 2000, reward: 25 },
  { id: 'repeatAddict100', name: 'Industrial God', description: 'Buy any repeatable upgrade 100 times', check: s => Object.values(s.upgrades || {}).some(v => typeof v === 'number' && v >= 100), reward: 15 },
  { id: 'colonyGod', name: 'Colony God', description: 'Assign 100+ colonies', check: s => { const a = s.colonyAssignments || {}; return (a.growth || 0) + (a.science || 0) + (a.industry || 0) >= 100; }, reward: 15 },
  { id: 'starNetwork50', name: 'Universal Highway', description: 'Create 50 star routes', check: s => (s.starRoutes?.length || 0) >= 50, reward: 15 },
  { id: 'prestigeEternal', name: 'Prestige Eternal', description: 'Prestige 200 times', check: s => (s.prestigeCount || 0) >= 200, reward: 100 },

  // --- 10 new achievements ---
  { id: 'octillion', name: 'Octillionaire', description: 'Have 1 octillion of any resource', check: s => Object.values(s.resources || {}).some(r => r.unlocked && r.amount >= 1e27), reward: 30 },
  { id: 'upgrade400', name: 'Upgrade Godhood', description: 'Purchase 400 upgrades', check: s => Object.keys(s.upgrades || {}).length >= 400, reward: 60 },
  { id: 'techArchitect', name: 'Tech Architect', description: 'Unlock 70 technologies', check: s => Object.keys(s.tech || {}).length >= 70, reward: 30 },
  { id: 'speedrunEra8', name: 'Galactic Speedrun', description: 'Reach Era 8 in under 20 minutes', check: s => s.era >= 8 && (s.bestEraTimes?.[8] || Infinity) < 1200, reward: 8 },
  { id: 'hack500', name: 'Cyber Deity', description: 'Complete 500 hacks', check: s => (s.hackSuccesses || 0) >= 500, reward: 25 },
  { id: 'weave500', name: 'Weave Eternal', description: 'Complete 500 weaves', check: s => (s.totalWeaves || 0) >= 500, reward: 25 },
  { id: 'docking500', name: 'Grand Admiral', description: 'Land 500 perfect docks', check: s => (s.dockingPerfects || 0) >= 500, reward: 25 },
  { id: 'repeatAddict200', name: 'Infinite Factory', description: 'Buy any repeatable upgrade 200 times', check: s => Object.values(s.upgrades || {}).some(v => typeof v === 'number' && v >= 200), reward: 20 },
  { id: 'trade5000', name: 'Omniversal Trader', description: 'Complete 5000 trades', check: s => (s.totalTrades || 0) >= 5000, reward: 30 },
  { id: 'marathon168', name: 'Week Runner', description: 'Play for 168 hours total', check: s => s.totalTime >= 604800, reward: 20 },

  // --- 12 new achievements ---
  { id: 'nonillion', name: 'Nonillionaire', description: 'Have 1 nonillion of any resource', check: s => Object.values(s.resources || {}).some(r => r.unlocked && r.amount >= 1e30), reward: 35 },
  { id: 'speedrunEra6', name: 'Interstellar Speedrun', description: 'Reach Era 6 in under 12 minutes', check: s => s.era >= 6 && (s.bestEraTimes?.[6] || Infinity) < 720, reward: 6 },
  { id: 'upgrade500', name: 'Upgrade Transcendence', description: 'Purchase 500 upgrades', check: s => Object.keys(s.upgrades || {}).length >= 500, reward: 75 },
  { id: 'techVisionary', name: 'Tech Visionary', description: 'Unlock 75 technologies', check: s => Object.keys(s.tech || {}).length >= 75, reward: 35 },
  { id: 'hack1000', name: 'Digital Ghost', description: 'Complete 1000 hacks', check: s => (s.hackSuccesses || 0) >= 1000, reward: 30 },
  { id: 'weave1000', name: 'Weave Transcendent', description: 'Complete 1000 weaves', check: s => (s.totalWeaves || 0) >= 1000, reward: 30 },
  { id: 'docking1000', name: 'Celestial Navigator', description: 'Land 1000 perfect docks', check: s => (s.dockingPerfects || 0) >= 1000, reward: 30 },
  { id: 'trade10000', name: 'Universal Merchant', description: 'Complete 10000 trades', check: s => (s.totalTrades || 0) >= 10000, reward: 40 },
  { id: 'gem25000', name: 'Gem Infinity', description: 'Find 25000 gems', check: s => (s.totalGems || 0) >= 25000, reward: 30 },
  { id: 'prestigeOmnipotent', name: 'Prestige Omnipotent', description: 'Prestige 500 times', check: s => (s.prestigeCount || 0) >= 500, reward: 200 },
  { id: 'repeatAddict500', name: 'Infinite Assembly', description: 'Buy any repeatable upgrade 500 times', check: s => Object.values(s.upgrades || {}).some(v => typeof v === 'number' && v >= 500), reward: 25 },
  { id: 'colonyEmpire', name: 'Colony Empire', description: 'Assign 200+ colonies', check: s => { const a = s.colonyAssignments || {}; return (a.growth || 0) + (a.science || 0) + (a.industry || 0) >= 200; }, reward: 20 },

  // --- 10 new achievements ---
  { id: 'decillion', name: 'Decillionaire', description: 'Have 1 decillion of any resource', check: s => Object.values(s.resources || {}).some(r => r.unlocked && r.amount >= 1e33), reward: 40 },
  { id: 'speedrunEra4', name: 'Orbital Speedrun', description: 'Reach Era 4 in under 7 minutes', check: s => s.era >= 4 && (s.bestEraTimes?.[4] || Infinity) < 420, reward: 5 },
  { id: 'speedrunEra9', name: 'Cosmic Speedrun', description: 'Reach Era 9 in under 25 minutes', check: s => s.era >= 9 && (s.bestEraTimes?.[9] || Infinity) < 1500, reward: 9 },
  { id: 'upgrade450', name: 'Upgrade Singularity', description: 'Purchase 450 upgrades', check: s => Object.keys(s.upgrades || {}).length >= 450, reward: 70 },
  { id: 'techEnlightened', name: 'Tech Enlightened', description: 'Unlock 80 technologies', check: s => Object.keys(s.tech || {}).length >= 80, reward: 40 },
  { id: 'hack500long', name: 'Phantom Hacker', description: 'Complete 500 hacks', check: s => (s.hackSuccesses || 0) >= 500, reward: 25 },
  { id: 'docking500long', name: 'Void Pilot', description: 'Land 500 perfect docks', check: s => (s.dockingPerfects || 0) >= 500, reward: 25 },
  { id: 'weave500long', name: 'Fabric Weaver', description: 'Complete 500 weaves', check: s => (s.totalWeaves || 0) >= 500, reward: 25 },
  { id: 'gem50000', name: 'Gem Singularity', description: 'Find 50000 gems', check: s => (s.totalGems || 0) >= 50000, reward: 30 },
  { id: 'repeatAddict1000', name: 'Eternal Assembly', description: 'Buy any repeatable upgrade 1000 times', check: s => Object.values(s.upgrades || {}).some(v => typeof v === 'number' && v >= 1000), reward: 30 },
];
