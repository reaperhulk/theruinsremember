// Achievements — milestones that reward prestige points or unlock bonuses
// Each achievement: { id, name, description, check: (state) => boolean, reward }
// reward: number of prestige points granted on first completion

import { upgrades } from './upgrades.js';

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
  { id: 'eventWatcher', name: 'Event Watcher', description: 'Play for 10 minutes with events active', check: s => s.era >= 2 && s.totalTime > 600, reward: 2 },
  { id: 'dockingMaster', name: 'Docking Master', description: 'Land 50 perfect docks', check: s => (s.dockingPerfects || 0) >= 50, reward: 5 },

  // Ultra endgame
  { id: 'upgrade200', name: 'Two Hundred', description: 'Purchase 200 upgrades', check: s => Object.keys(s.upgrades || {}).length >= 200, reward: 25 },
  { id: 'hackerElite', name: 'Hacker Elite', description: 'Complete 50 hacks', check: s => (s.hackSuccesses || 0) >= 50, reward: 5 },
  { id: 'weaveMaster', name: 'Weave Master', description: 'Complete 50 weaves', check: s => (s.totalWeaves || 0) >= 50, reward: 5 },
  { id: 'gemOverlord', name: 'Gem Overlord', description: 'Find 500 gems', check: s => (s.totalGems || 0) >= 500, reward: 10 },
  { id: 'allPrestige', name: 'Prestige Collector', description: 'Buy all prestige upgrades', check: s => Object.keys(s.prestigeUpgrades || {}).length >= 25, reward: 20 },

  // New achievements
  { id: 'quadrillion', name: 'Quadrillionaire', description: 'Have 1 quadrillion of any resource', check: s => Object.values(s.resources || {}).some(r => r.unlocked && r.amount >= 1e15), reward: 10 },
  { id: 'speedrunEra7', name: 'Dyson Speedrun', description: 'Reach Era 7 in under 15 minutes', check: s => s.era >= 7 && (s.bestEraTimes?.[7] || Infinity) < 900, reward: 7 },
  { id: 'upgrade160', name: 'Upgrade Tyrant', description: 'Purchase 160 upgrades', check: s => Object.keys(s.upgrades || {}).length >= 160, reward: 20 },
  { id: 'techScholar', name: 'Tech Scholar', description: 'Unlock 40 technologies', check: s => Object.keys(s.tech || {}).length >= 40, reward: 10 },
  { id: 'eventSurvivor', name: 'Event Survivor', description: 'Play for 20 minutes with events active', check: s => s.era >= 2 && s.totalTime > 1200, reward: 5 },
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
  { id: 'starNetwork15', name: 'Galactic Highway', description: 'Create 7 star routes', check: s => (s.starRoutes?.length || 0) >= 7, reward: 5 },
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
  { id: 'starNetwork25', name: 'Cosmic Web', description: 'Create 9 star routes', check: s => (s.starRoutes?.length || 0) >= 9, reward: 10 },
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
  { id: 'starNetwork50', name: 'Full Network', description: 'Create the maximum 10 star routes', check: s => (s.starRoutes?.length || 0) >= 10, reward: 15 },
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
  { id: 'hack750', name: 'Phantom Hacker', description: 'Complete 750 hacks', check: s => (s.hackSuccesses || 0) >= 750, reward: 25 },
  { id: 'docking750', name: 'Void Pilot', description: 'Land 750 perfect docks', check: s => (s.dockingPerfects || 0) >= 750, reward: 25 },
  { id: 'weave750', name: 'Fabric Weaver', description: 'Complete 750 weaves', check: s => (s.totalWeaves || 0) >= 750, reward: 25 },
  { id: 'gem50000', name: 'Gem Singularity', description: 'Find 50000 gems', check: s => (s.totalGems || 0) >= 50000, reward: 30 },
  { id: 'repeatAddict1000', name: 'Eternal Assembly', description: 'Buy any repeatable upgrade 1000 times', check: s => Object.values(s.upgrades || {}).some(v => typeof v === 'number' && v >= 1000), reward: 30 },

  // --- 12 new achievements ---
  { id: 'undecillion', name: 'Undecillionaire', description: 'Have 1 undecillion of any resource', check: s => Object.values(s.resources || {}).some(r => r.unlocked && r.amount >= 1e36), reward: 45 },
  { id: 'speedrunEra10fast', name: 'Reality Bender', description: 'Reach Era 10 in under 20 minutes', check: s => s.era >= 10 && (s.bestEraTimes?.[10] || Infinity) < 1200, reward: 15 },
  { id: 'upgrade550', name: 'Upgrade Infinity', description: 'Purchase 550 upgrades', check: s => Object.keys(s.upgrades || {}).length >= 550, reward: 80 },
  { id: 'techTranscendent', name: 'Tech Transcendent', description: 'Unlock 85 technologies', check: s => Object.keys(s.tech || {}).length >= 85, reward: 45 },
  { id: 'hack1500', name: 'Digital Phantom', description: 'Complete 1500 hacks', check: s => (s.hackSuccesses || 0) >= 1500, reward: 35 },
  { id: 'weave1500', name: 'Weave Omniscient', description: 'Complete 1500 weaves', check: s => (s.totalWeaves || 0) >= 1500, reward: 35 },
  { id: 'docking1500', name: 'Stellar Navigator', description: 'Land 1500 perfect docks', check: s => (s.dockingPerfects || 0) >= 1500, reward: 35 },
  { id: 'trade15000', name: 'Omniversal Bazaar', description: 'Complete 15000 trades', check: s => (s.totalTrades || 0) >= 15000, reward: 45 },
  { id: 'gem100000', name: 'Gem Omnipotence', description: 'Find 100000 gems', check: s => (s.totalGems || 0) >= 100000, reward: 40 },
  { id: 'prestigeInfinite', name: 'Prestige Infinite', description: 'Prestige 1000 times', check: s => (s.prestigeCount || 0) >= 1000, reward: 300 },
  { id: 'allEra10Upgrades', name: 'Multiverse Master', description: 'Buy all Era 10 upgrades', check: s => { const era10 = ['realityWeaving','dimensionalAnchors','parallelProcessing','realityLoom','omniscienceEngine','dimensionalRift','infinityMirror','multiversalHarmony','infinityWell','echoSynthesizer','multiversalNexus']; return era10.every(id => s.upgrades?.[id]); }, reward: 50 },
  { id: 'colonyGalactic', name: 'Galactic Colonizer', description: 'Assign 500+ colonies', check: s => { const a = s.colonyAssignments || {}; return (a.growth || 0) + (a.science || 0) + (a.industry || 0) >= 500; }, reward: 25 },

  // --- 12 new achievements ---
  { id: 'speedrunEra2fast', name: 'Blitz Start', description: 'Reach Era 2 in under 90 seconds', check: s => s.era >= 2 && (s.bestEraTimes?.[2] || Infinity) < 90, reward: 5 },
  { id: 'allEra2', name: 'Era 2 Complete', description: 'Buy all Era 2 gateway upgrades', check: s => ['assemblyLines','steelForge','ironWorks','powerGrid','computingLab'].every(id => s.upgrades?.[id]), reward: 3 },
  { id: 'duodecillion', name: 'Duodecillionaire', description: 'Have 1 duodecillion of any resource', check: s => Object.values(s.resources || {}).some(r => r.unlocked && r.amount >= 1e39), reward: 50 },
  { id: 'parallelPaths', name: 'Parallel Paths', description: 'Buy 3 upgrades in the same era within 30 seconds', check: s => (s.fastUpgradeBurst || 0) >= 3, reward: 3 },
  { id: 'darkEnergyMaster', name: 'Dark Energy Master', description: 'Accumulate 1000 dark energy', check: s => (s.resources?.darkEnergy?.amount || 0) >= 1000, reward: 5 },
  { id: 'cosmicPowerSurge', name: 'Cosmic Power Surge', description: 'Accumulate 5000 cosmic power', check: s => (s.resources?.cosmicPower?.amount || 0) >= 5000, reward: 10 },
  { id: 'stellarForgemaster', name: 'Stellar Forgemaster', description: 'Accumulate 500 stellar forge', check: s => (s.resources?.stellarForge?.amount || 0) >= 500, reward: 7 },
  { id: 'megaBuilder', name: 'Mega Builder', description: 'Accumulate 200 megastructures', check: s => (s.resources?.megastructures?.amount || 0) >= 200, reward: 8 },
  { id: 'exoticHoarder', name: 'Exotic Hoarder', description: 'Accumulate 10000 exotic matter', check: s => (s.resources?.exoticMatter?.amount || 0) >= 10000, reward: 10 },
  { id: 'starConqueror', name: 'Star Conqueror', description: 'Control 500 star systems', check: s => (s.resources?.starSystems?.amount || 0) >= 500, reward: 8 },
  { id: 'realityShaper', name: 'Reality Shaper', description: 'Accumulate 1000 reality fragments', check: s => (s.resources?.realityFragments?.amount || 0) >= 1000, reward: 15 },
  { id: 'quantumMaster', name: 'Quantum Master', description: 'Accumulate 500 quantum echoes', check: s => (s.resources?.quantumEchoes?.amount || 0) >= 500, reward: 15 },

  // --- 12 new achievements ---
  { id: 'tredecillion', name: 'Tredecillionaire', description: 'Have 1 tredecillion of any resource', check: s => Object.values(s.resources || {}).some(r => r.unlocked && r.amount >= 1e42), reward: 55 },
  { id: 'upgrade600', name: 'Upgrade Eternity', description: 'Purchase 600 upgrades', check: s => Object.keys(s.upgrades || {}).length >= 600, reward: 90 },
  { id: 'techInfinite', name: 'Tech Infinite', description: 'Unlock 90 technologies', check: s => Object.keys(s.tech || {}).length >= 90, reward: 50 },
  { id: 'speedrunEra10ultra', name: 'Reality Breaker', description: 'Reach Era 10 in under 15 minutes', check: s => s.era >= 10 && (s.bestEraTimes?.[10] || Infinity) < 900, reward: 20 },
  { id: 'hack2000', name: 'Neural Ghost', description: 'Complete 2000 hacks', check: s => (s.hackSuccesses || 0) >= 2000, reward: 40 },
  { id: 'weave2000', name: 'Weave Infinity', description: 'Complete 2000 weaves', check: s => (s.totalWeaves || 0) >= 2000, reward: 40 },
  { id: 'docking2000', name: 'Cosmic Admiral', description: 'Land 2000 perfect docks', check: s => (s.dockingPerfects || 0) >= 2000, reward: 40 },
  { id: 'trade25000', name: 'Omniversal Exchange', description: 'Complete 25000 trades', check: s => (s.totalTrades || 0) >= 25000, reward: 50 },
  { id: 'gem30000', name: 'Gem Multiverse', description: 'Find 30000 gems', check: s => (s.totalGems || 0) >= 30000, reward: 35 },
  { id: 'repeatAddict2000', name: 'Perpetual Machine', description: 'Buy any repeatable upgrade 2000 times', check: s => Object.values(s.upgrades || {}).some(v => typeof v === 'number' && v >= 2000), reward: 35 },
  { id: 'starNetworkFull', name: 'Omniversal Web', description: 'Fill all 10 star route slots', check: s => (s.starRoutes?.length || 0) >= 10, reward: 20 },
  { id: 'marathon720', name: 'Month Runner', description: 'Play for 720 hours total', check: s => s.totalTime >= 2592000, reward: 30 },

  // Final push — 1000 content milestone
  { id: 'allEras', name: 'All Eras', description: 'Visit every era in a single run', check: s => s.era >= 10, reward: 10 },
  { id: 'speedrunEra2v2', name: 'Quick Industrialist', description: 'Reach Era 2 in under 100 seconds', check: s => s.era >= 2 && (s.bestEraTimes?.[2] || Infinity) < 100, reward: 4 },
  { id: 'gemStreak20', name: 'Hot Streak', description: 'Reach a mining streak of 20', check: s => (s.miningStreak || 0) >= 20, reward: 2 },
  { id: 'combo3dock', name: 'Triple Dock', description: 'Reach a 3x docking combo', check: s => (s.dockingCombo || 0) >= 3, reward: 2 },
  { id: 'firstWeave', name: 'First Weave', description: 'Complete your first reality weave', check: s => (s.totalWeaves || 0) >= 1, reward: 1 },
  { id: 'firstHack', name: 'First Hack', description: 'Complete your first hack', check: s => (s.hackSuccesses || 0) >= 1, reward: 1 },
  { id: 'firstDock', name: 'First Dock', description: 'Land your first dock', check: s => (s.dockingSuccesses || 0) >= 1, reward: 1 },
  { id: 'firstRoute', name: 'First Route', description: 'Create your first star route', check: s => (s.starRoutes?.length || 0) >= 1, reward: 1 },
  { id: 'allMiniGames', name: 'Mini-Game Master', description: 'Use all 7 mini-games (mine, factory, hack, dock, colony, star chart, weave)', check: s => (s.totalGems || 0) > 0 && Object.keys(s.factoryAllocation || {}).length > 0 && (s.hackSuccesses || 0) > 0 && (s.dockingAttempts || 0) > 0 && (s.colonyAssignments?.growth || 0) + (s.colonyAssignments?.science || 0) + (s.colonyAssignments?.industry || 0) > 0 && (s.starRoutes?.length || 0) > 0 && (s.totalWeaves || 0) > 0, reward: 10 },
  { id: 'tenPrestigeUpgrades', name: 'Prestige Veteran', description: 'Buy 10 prestige upgrades', check: s => Object.keys(s.prestigeUpgrades || {}).length >= 10, reward: 5 },
  { id: 'resourceDiversifier', name: 'Resource Diversifier', description: 'Have 15 unlocked resources simultaneously', check: s => Object.values(s.resources || {}).filter(r => r.unlocked).length >= 15, reward: 3 },
  { id: 'upgradeSavant', name: 'Upgrade Savant', description: 'Purchase 250 upgrades', check: s => Object.keys(s.upgrades || {}).length >= 250, reward: 15 },
  { id: 'eventCollector', name: 'Event Collector', description: 'Play for 5 minutes in Era 3+', check: s => s.era >= 3 && s.totalTime > 300, reward: 3 },
  { id: 'factoryMaxed', name: 'Factory Maxed', description: 'Assign 20+ factory workers', check: s => { const a = s.factoryAllocation || {}; return (a.steel||0) + (a.electronics||0) + (a.research||0) >= 20; }, reward: 5 },
  { id: 'thousandContent', name: 'Content Complete', description: 'You found the 1000th piece of content — the multiverse is truly infinite', check: s => s.era >= 10 && Object.keys(s.upgrades || {}).length >= 100, reward: 100 },

  // --- 6 new achievements ---
  { id: 'crossChainMaster', name: 'Cross-Chain Master', description: 'Purchase 180 upgrades', check: s => Object.keys(s.upgrades || {}).length >= 180, reward: 20 },
  { id: 'deepChainExplorer', name: 'Deep Chain Explorer', description: 'Purchase 220 upgrades', check: s => Object.keys(s.upgrades || {}).length >= 220, reward: 25 },
  { id: 'synergist', name: 'Synergist', description: 'Have 20+ unlocked resources simultaneously', check: s => Object.values(s.resources || {}).filter(r => r.unlocked).length >= 20, reward: 5 },
  { id: 'eventVeteran', name: 'Event Veteran', description: 'Play for 1 hour total', check: s => s.totalTime > 3600, reward: 10 },
  { id: 'factoryEmpire', name: 'Factory Empire', description: 'Assign 30 factory workers (max capacity)', check: s => { const a = s.factoryAllocation || {}; return (a.steel||0) + (a.electronics||0) + (a.research||0) >= 30; }, reward: 10 },
  { id: 'cosmicCollector', name: 'Cosmic Collector', description: 'Have 1e12 of cosmic power, exotic matter, and dark energy at the same time', check: s => { const r = s.resources || {}; return (r.cosmicPower?.amount || 0) >= 1e12 && (r.exoticMatter?.amount || 0) >= 1e12 && (r.darkEnergy?.amount || 0) >= 1e12; }, reward: 15 },

  // --- Chain completion and cross-chain achievements ---
  { id: 'allEra3', name: 'Era 3 Complete', description: 'Buy all Era 3 gateway upgrades', check: s => ['servers','neuralNet','bigData','cloudInfra','aiResearch'].every(id => s.upgrades?.[id]), reward: 3 },
  { id: 'allEra4', name: 'Era 4 Complete', description: 'Buy all Era 4 gateway upgrades', check: s => ['rocketEngines','orbitalStation','solarArray','spacePort','fusionReactor'].every(id => s.upgrades?.[id]), reward: 4 },
  { id: 'allEra5', name: 'Era 5 Complete', description: 'Buy all Era 5 gateway upgrades', check: s => ['interplanetaryDrive','asteroidMining','colonyShip','titaniumForge','exoticExtractor'].every(id => s.upgrades?.[id]), reward: 5 },
  { id: 'chainReaction', name: 'Chain Reaction', description: 'Complete all gateway upgrades in eras 1 through 5', check: s => ['tools','irrigation','basicPower','housing','foundry','storehouse','assemblyLines','steelForge','ironWorks','powerGrid','computingLab','servers','neuralNet','bigData','cloudInfra','aiResearch','rocketEngines','orbitalStation','solarArray','spacePort','fusionReactor','interplanetaryDrive','asteroidMining','colonyShip','titaniumForge','exoticExtractor'].every(id => s.upgrades?.[id]), reward: 20 },
  { id: 'crossChainBuyer', name: 'Cross-Chain Buyer', description: 'Own upgrades from 6 different eras simultaneously', check: s => { const u = s.upgrades || {}; const keys = Object.keys(u); const eras = new Set(); const eraMap = { tools: 1, irrigation: 1, basicPower: 1, assemblyLines: 2, steelForge: 2, servers: 3, neuralNet: 3, rocketEngines: 4, orbitalStation: 4, interplanetaryDrive: 5, colonyShip: 5, warpDrive: 6, darkEnergyTap: 6, stellarForge: 7, dysonSwarm: 7, galacticSenate: 8, exoticRefinery: 8, cosmicLens: 9, universalDecoder: 9, realityWeaving: 10, dimensionalAnchors: 10 }; keys.forEach(k => { if (eraMap[k]) eras.add(eraMap[k]); }); return eras.size >= 6; }, reward: 5 },
  { id: 'crossChainVeteran', name: 'Cross-Chain Veteran', description: 'Own upgrades from 8 different eras simultaneously', check: s => { const u = s.upgrades || {}; const keys = Object.keys(u); const eras = new Set(); const eraMap = { tools: 1, irrigation: 1, assemblyLines: 2, steelForge: 2, servers: 3, neuralNet: 3, rocketEngines: 4, orbitalStation: 4, interplanetaryDrive: 5, colonyShip: 5, warpDrive: 6, darkEnergyTap: 6, stellarForge: 7, dysonSwarm: 7, galacticSenate: 8, exoticRefinery: 8, cosmicLens: 9, universalDecoder: 9, realityWeaving: 10, dimensionalAnchors: 10 }; keys.forEach(k => { if (eraMap[k]) eras.add(eraMap[k]); }); return eras.size >= 8; }, reward: 10 },
  { id: 'crossChainOmniscient', name: 'Cross-Chain Omniscient', description: 'Own upgrades from all 10 eras simultaneously', check: s => { const u = s.upgrades || {}; const keys = Object.keys(u); const eras = new Set(); const eraMap = { tools: 1, irrigation: 1, assemblyLines: 2, steelForge: 2, servers: 3, neuralNet: 3, rocketEngines: 4, orbitalStation: 4, interplanetaryDrive: 5, colonyShip: 5, warpDrive: 6, darkEnergyTap: 6, stellarForge: 7, dysonSwarm: 7, galacticSenate: 8, exoticRefinery: 8, cosmicLens: 9, universalDecoder: 9, realityWeaving: 10, dimensionalAnchors: 10 }; keys.forEach(k => { if (eraMap[k]) eras.add(eraMap[k]); }); return eras.size >= 10; }, reward: 25 },

  // --- Era speed achievements ---
  { id: 'speedrunEra6fast', name: 'FTL Rush', description: 'Reach Era 6 in under 8 minutes', check: s => s.era >= 6 && (s.bestEraTimes?.[6] || Infinity) < 480, reward: 8 },
  { id: 'speedrunEra7fast', name: 'Dyson Blitz', description: 'Reach Era 7 in under 10 minutes', check: s => s.era >= 7 && (s.bestEraTimes?.[7] || Infinity) < 600, reward: 10 },
  { id: 'speedrunEra8fast', name: 'Galactic Blitz', description: 'Reach Era 8 in under 15 minutes', check: s => s.era >= 8 && (s.bestEraTimes?.[8] || Infinity) < 900, reward: 10 },
  { id: 'speedrunEra9fast', name: 'Cosmic Blitz', description: 'Reach Era 9 in under 18 minutes', check: s => s.era >= 9 && (s.bestEraTimes?.[9] || Infinity) < 1080, reward: 12 },

  // --- Late-game resource milestones ---
  { id: 'darkEnergyLord', name: 'Dark Energy Lord', description: 'Accumulate 10000 dark energy', check: s => (s.resources?.darkEnergy?.amount || 0) >= 10000, reward: 10 },
  { id: 'megastructureTitan', name: 'Megastructure Titan', description: 'Accumulate 1000 megastructures', check: s => (s.resources?.megastructures?.amount || 0) >= 1000, reward: 12 },
  { id: 'stellarForgeOverlord', name: 'Stellar Forge Overlord', description: 'Accumulate 2000 stellar forge', check: s => (s.resources?.stellarForge?.amount || 0) >= 2000, reward: 12 },
  { id: 'realityArchitect', name: 'Reality Architect', description: 'Accumulate 5000 reality fragments', check: s => (s.resources?.realityFragments?.amount || 0) >= 5000, reward: 20 },
  { id: 'quantumOverlord', name: 'Quantum Overlord', description: 'Accumulate 2000 quantum echoes', check: s => (s.resources?.quantumEchoes?.amount || 0) >= 2000, reward: 20 },
  { id: 'cosmicPowerOverlord', name: 'Cosmic Power Overlord', description: 'Accumulate 25000 cosmic power', check: s => (s.resources?.cosmicPower?.amount || 0) >= 25000, reward: 15 },
  { id: 'universalConstantLord', name: 'Universal Constant Lord', description: 'Accumulate 500 universal constants', check: s => (s.resources?.universalConstants?.amount || 0) >= 500, reward: 15 },
  { id: 'starConqueror1000', name: 'Star Emperor', description: 'Control 1000 star systems', check: s => (s.resources?.starSystems?.amount || 0) >= 1000, reward: 12 },
  { id: 'exoticMatterOverlord', name: 'Exotic Matter Overlord', description: 'Accumulate 50000 exotic matter', check: s => (s.resources?.exoticMatter?.amount || 0) >= 50000, reward: 15 },
  { id: 'galacticInfluencePeak', name: 'Galactic Hegemon', description: 'Accumulate 50000 galactic influence', check: s => (s.resources?.galacticInfluence?.amount || 0) >= 50000, reward: 15 },

  // Cross-chain achievements
  { id: 'crossChainMaster', name: 'Cross-Chain Master', description: 'Purchase 10 cross-chain upgrades', check: s => { const cc = ['irrigatedForge','communalWorkshop','electrifiedRails','industrialComputer','dataForge','secureAI','orbitalFuelSynthesis','telescopeNetwork','colonyRefinery','fusionMiningRig','darkStarProbe','diplomaticTradePact','forgePoweredMega','neutronRingWorld','influenceMatterConduit','quantumReplicator','constantPowerLoop','voidConstantHarvester','echoRealityFeedback','fragmentConstantSynthesis']; return cc.filter(id => s.upgrades?.[id]).length >= 10; }, reward: 10 },
  { id: 'crossChainLegend', name: 'Cross-Chain Legend', description: 'Purchase all 20 cross-chain upgrades', check: s => { const cc = ['irrigatedForge','communalWorkshop','electrifiedRails','industrialComputer','dataForge','secureAI','orbitalFuelSynthesis','telescopeNetwork','colonyRefinery','fusionMiningRig','darkStarProbe','diplomaticTradePact','forgePoweredMega','neutronRingWorld','influenceMatterConduit','quantumReplicator','constantPowerLoop','voidConstantHarvester','echoRealityFeedback','fragmentConstantSynthesis']; return cc.every(id => s.upgrades?.[id]); }, reward: 25 },
  { id: 'earlyBridge', name: 'Bridge Builder', description: 'Purchase a cross-chain upgrade in eras 1, 2, and 3', check: s => (s.upgrades?.irrigatedForge || s.upgrades?.communalWorkshop) && (s.upgrades?.electrifiedRails || s.upgrades?.industrialComputer) && (s.upgrades?.dataForge || s.upgrades?.secureAI), reward: 5 },
  { id: 'cosmicBridge', name: 'Cosmic Bridge', description: 'Purchase cross-chain upgrades in eras 8, 9, and 10', check: s => (s.upgrades?.influenceMatterConduit || s.upgrades?.quantumReplicator) && (s.upgrades?.constantPowerLoop || s.upgrades?.voidConstantHarvester) && (s.upgrades?.echoRealityFeedback || s.upgrades?.fragmentConstantSynthesis), reward: 15 },
  { id: 'upgradecentennial', name: 'Upgrade Centennial', description: 'Purchase 100 upgrades', check: s => Object.keys(s.upgrades || {}).length >= 100, reward: 10 },

  // Strategy achievements
  { id: 'diverseColony', name: 'Diverse Colony', description: 'Have colonies in all 3 focus types', check: s => { const a = s.colonyAssignments || {}; return (a.growth || 0) > 0 && (a.science || 0) > 0 && (a.industry || 0) > 0; }, reward: 2 },
  { id: 'factoryFull', name: 'Full Capacity', description: 'Use all factory workers at once', check: s => { const a = s.factoryAllocation || {}; const total = (a.steel||0) + (a.electronics||0) + (a.research||0); return total > 0 && total >= (s.factoryWorkers || 3); }, reward: 2 },
  { id: 'techBrancher', name: 'Path Divergent', description: 'Make 3 branching tech choices', check: s => { const branches = [['offensiveAI','defensiveAI'],['bioEngineering','mechEngineering'],['stellarControl','stellarHarmony'],['galacticExpansion','galacticConsolidation'],['voidMastery','realityMastery'],['infiniteEnergy','infiniteKnowledge'],['automationTheory','artisanCrafts']]; return branches.filter(([a,b]) => s.tech?.[a] || s.tech?.[b]).length >= 3; }, reward: 5 },
  { id: 'capBreaker', name: 'Cap Breaker', description: 'Have any resource with cap multiplier over 10x', check: s => Object.values(s.resources || {}).some(r => r.capMult >= 10), reward: 3 },
  { id: 'productionRate100', name: 'Production Powerhouse', description: 'Reach 100/s total production rate', check: s => { let total = 0; for (const r of Object.values(s.resources || {})) { if (r.unlocked && r.baseRate + r.rateAdd > 0) total += (r.baseRate + r.rateAdd) * r.rateMult; } return total >= 100; }, reward: 5 },

  // --- Lore & new content achievements ---
  { id: 'ruinsExplorer', name: 'Ruins Explorer', description: 'Purchase any 3 lore upgrades', check: s => { const lore = ['precursorBeacon','deadStarAtlas','hollowDyson','echoBlueprint','galacticOssuary','convergenceCodex','universalTombstone','inevitabilityEngine','recursionScar','finalIteration']; return lore.filter(id => s.upgrades?.[id]).length >= 3; }, reward: 5 },
  { id: 'truthSeeker', name: 'Truth Seeker', description: 'Purchase all 10 lore upgrades', check: s => { const lore = ['precursorBeacon','deadStarAtlas','hollowDyson','echoBlueprint','galacticOssuary','convergenceCodex','universalTombstone','inevitabilityEngine','recursionScar','finalIteration']; return lore.every(id => s.upgrades?.[id]); }, reward: 25 },
  { id: 'pathChosen', name: 'The Path Chosen', description: 'Make a branching choice in Era 1', check: s => !!(s.tech?.agrarianFocus || s.tech?.miningFocus), reward: 1 },
  { id: 'fourCrossroads', name: 'Four Crossroads', description: 'Make branching choices in all 4 early eras', check: s => { const pairs = [['agrarianFocus','miningFocus'],['heavyIndustry','electronicsRevolution'],['openSourceMovement','corporateData'],['rocketSupremacy','orbitalElegance']]; return pairs.every(([a,b]) => s.tech?.[a] || s.tech?.[b]); }, reward: 10 },
  { id: 'capstoneBuilder', name: 'Capstone Builder', description: 'Buy all 3 era capstone upgrades', check: s => !!(s.upgrades?.settlerMonument && s.upgrades?.industrialRevolution && s.upgrades?.digitalSingularity), reward: 10 },
  { id: 'deepWeb', name: 'Deep Web', description: 'Buy 5 upgrades that have 2+ prerequisites', check: s => { let count = 0; for (const id of Object.keys(s.upgrades || {})) { const u = upgrades[id]; if (u && u.prerequisites && u.prerequisites.length >= 2) count++; } return count >= 5; }, reward: 3 },
  { id: 'storyWitnessed', name: 'Story Witnessed', description: 'Play long enough in a late era to witness the story unfold', check: s => s.totalTime > 600 && s.era >= 3, reward: 2 },
  { id: 'era1Mastery', name: 'Era 1 Mastery', description: 'Buy the Era 1 capstone upgrade', check: s => !!s.upgrades?.settlerMonument, reward: 3 },
  { id: 'cycleAwareness', name: 'Cycle Awareness', description: 'Buy the Recursion Scar lore upgrade', check: s => !!s.upgrades?.recursionScar, reward: 15 },
  { id: 'finalTruth', name: 'Final Truth', description: 'Buy the Final Iteration lore upgrade', check: s => !!s.upgrades?.finalIteration, reward: 20 },

  // --- Gap-filling achievements ---

  // Upgrade milestones
  { id: 'upgrader25', name: 'Quarter Century', description: 'Purchase 25 upgrades', check: s => Object.keys(s.upgrades || {}).length >= 25, reward: 1 },
  { id: 'upgrader75', name: 'Seventy-Five Strong', description: 'Purchase 75 upgrades', check: s => Object.keys(s.upgrades || {}).length >= 75, reward: 5 },
  { id: 'upgrader150', name: 'Sesquicentennial', description: 'Purchase 150 upgrades', check: s => Object.keys(s.upgrades || {}).length >= 150, reward: 10 },
  { id: 'upgrader175', name: 'Rising Titan', description: 'Purchase 175 upgrades', check: s => Object.keys(s.upgrades || {}).length >= 175, reward: 10 },
  { id: 'upgrader225', name: 'Relentless Buyer', description: 'Purchase 225 upgrades', check: s => Object.keys(s.upgrades || {}).length >= 225, reward: 10 },

  // Gem milestones
  { id: 'gem25', name: 'Gem Enthusiast', description: 'Find 25 gems', check: s => (s.totalGems || 0) >= 25, reward: 1 },
  { id: 'gem75', name: 'Gem Prospector', description: 'Find 75 gems', check: s => (s.totalGems || 0) >= 75, reward: 3 },

  // Trade milestones
  { id: 'trade10', name: 'Novice Trader', description: 'Complete 10 trades', check: s => (s.totalTrades || 0) >= 10, reward: 1 },
  { id: 'trade75', name: 'Shrewd Dealer', description: 'Complete 75 trades', check: s => (s.totalTrades || 0) >= 75, reward: 3 },

  // Hack milestones
  { id: 'hack15', name: 'Code Monkey', description: 'Complete 15 hacks', check: s => (s.hackSuccesses || 0) >= 15, reward: 1 },
  { id: 'hack30', name: 'Grey Hat', description: 'Complete 30 hacks', check: s => (s.hackSuccesses || 0) >= 30, reward: 2 },
  { id: 'hack75', name: 'Black Hat', description: 'Complete 75 hacks', check: s => (s.hackSuccesses || 0) >= 75, reward: 5 },

  // Dock perfect milestones
  { id: 'dock3', name: 'Smooth Landing', description: 'Land 3 perfect docks', check: s => (s.dockingPerfects || 0) >= 3, reward: 1 },
  { id: 'dock20', name: 'Seasoned Pilot', description: 'Land 20 perfect docks', check: s => (s.dockingPerfects || 0) >= 20, reward: 2 },
  { id: 'dock35', name: 'Precision Pilot', description: 'Land 35 perfect docks', check: s => (s.dockingPerfects || 0) >= 35, reward: 3 },
  { id: 'dock75', name: 'Top Gun', description: 'Land 75 perfect docks', check: s => (s.dockingPerfects || 0) >= 75, reward: 5 },

  // Weave milestones
  { id: 'weave3', name: 'Thread Puller', description: 'Complete 3 weaves', check: s => (s.totalWeaves || 0) >= 3, reward: 1 },
  { id: 'weave15', name: 'Pattern Maker', description: 'Complete 15 weaves', check: s => (s.totalWeaves || 0) >= 15, reward: 1 },
  { id: 'weave30', name: 'Loom Operator', description: 'Complete 30 weaves', check: s => (s.totalWeaves || 0) >= 30, reward: 2 },
  { id: 'weave75', name: 'Tapestry Artisan', description: 'Complete 75 weaves', check: s => (s.totalWeaves || 0) >= 75, reward: 5 },

  // Time played milestones
  { id: 'oneHour', name: 'Getting Started', description: 'Play for 1 hour total', check: s => s.totalTime >= 3600, reward: 1 },
  { id: 'fourHours', name: 'Invested', description: 'Play for 4 hours total', check: s => s.totalTime >= 14400, reward: 3 },
  { id: 'twelveHours', name: 'Half Day', description: 'Play for 12 hours total', check: s => s.totalTime >= 43200, reward: 5 },

  // --- Mini-game mastery achievements ---
  { id: 'miningLegend', name: 'Mining Legend', description: 'Find 250 gems', check: s => (s.totalGems || 0) >= 250, reward: 7 },
  { id: 'factoryOptimizer', name: 'Factory Optimizer', description: 'Have all factory lines at max with full capacity bonus', check: s => { const a = s.factoryAllocation || {}; return (a.steel || 0) >= 10 && (a.electronics || 0) >= 10 && (a.research || 0) >= 10; }, reward: 5 },
  { id: 'hackMilestone40', name: 'Hack Streak', description: 'Complete 40 hacks', check: s => (s.hackSuccesses || 0) >= 40, reward: 4 },
  { id: 'perfectRun75', name: 'Perfect Run', description: 'Land 75 perfect docks', check: s => (s.dockingPerfects || 0) >= 75, reward: 5 },
  { id: 'weaveArtist', name: 'Weave Artist', description: 'Complete 40 weaves', check: s => (s.totalWeaves || 0) >= 40, reward: 4 },
  { id: 'starMapper', name: 'Star Mapper', description: 'Create 10 star routes', check: s => (s.starRoutes?.length || 0) >= 10, reward: 3 },
  { id: 'colonyEmpire50', name: 'Colony Empire', description: 'Assign 50+ colonies', check: s => { const a = s.colonyAssignments || {}; return (a.growth || 0) + (a.science || 0) + (a.industry || 0) >= 50; }, reward: 5 },
  { id: 'allMiniGames', name: 'All Mini-Games', description: 'Have activity in all 7 mini-games', check: s => (s.totalGems || 0) > 0 && (s.hackSuccesses || 0) > 0 && (s.dockingPerfects || 0) > 0 && (s.totalWeaves || 0) > 0 && (s.starRoutes?.length || 0) > 0 && Object.values(s.colonyAssignments || {}).some(v => v > 0) && Object.values(s.factoryAllocation || {}).some(v => v > 0), reward: 10 },
  { id: 'comboKing', name: 'Combo King', description: 'Reach 3x dock combo AND 2x weave combo', check: s => (s.dockingCombo || 0) >= 3 && (s.weaveCombo || 0) >= 2, reward: 5 },
  { id: 'grandMiner', name: 'Grand Miner', description: 'Find 1500 gems', check: s => (s.totalGems || 0) >= 1500, reward: 10 },

  // The ultimate endgame achievement
  { id: 'theFinalTruth', name: 'The Final Truth', description: 'You understand now. The ruins were yours. The cycle is you. And it begins again.', check: s => {
    return s.era >= 10 &&
      s.upgrades?.recursionScar &&
      s.upgrades?.finalIteration &&
      Object.keys(s.prestigeUpgrades || {}).length >= 25;
  }, reward: 100 },

  // Game complete flag achievement
  { id: 'gameComplete', name: 'Cycle Complete', description: 'You have seen everything. You have done everything. And yet... the button calls to you.', check: s => {
    return s.era >= 10 &&
      s.upgrades?.recursionScar &&
      s.upgrades?.finalIteration &&
      s.upgrades?.multiverseCapstone &&
      Object.keys(s.prestigeUpgrades || {}).length >= 25 &&
      (s.prestigeCount || 0) >= 1;
  }, reward: 200 },

  // Ascension achievements
  { id: 'ascensionBegins', name: 'Ascension Begins', description: 'Purchase Temporal Mastery — the first ascension upgrade', check: s => !!(s.prestigeUpgrades?.temporalMastery), reward: 25 },
  { id: 'trueEnding', name: 'True Ending', description: 'Purchase Eternal Return — the final upgrade in the game. There is nothing more.', check: s => !!(s.prestigeUpgrades?.eternalReturn), reward: 500 },
];
