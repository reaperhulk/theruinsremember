// Upgrade catalog per era
// Each upgrade: { id, name, era, cost, effects, description, prerequisites }
// effects: array of { type, target, value }
//   type: 'production_mult' | 'production_add' | 'cap_mult' | 'unlock_resource'
//   target: resource id
//   value: multiplier or flat amount

export const upgrades = {
  // Era 1: Planetfall
  tools: {
    id: 'tools', name: 'Stone Tools', era: 1,
    cost: { labor: 10, materials: 5 },
    effects: [{ type: 'production_mult', target: 'materials', value: 2 }],
    description: 'Basic tools double material production',
    prerequisites: [],
  },
  irrigation: {
    id: 'irrigation', name: 'Irrigation', era: 1,
    cost: { labor: 15, materials: 10 },
    effects: [{ type: 'production_mult', target: 'food', value: 2 }],
    description: 'Irrigated fields double food output',
    prerequisites: [],
  },
  basicPower: {
    id: 'basicPower', name: 'Basic Power', era: 1,
    cost: { labor: 20, materials: 15 },
    effects: [{ type: 'production_mult', target: 'energy', value: 3 }],
    description: 'Wind and water power triple energy output',
    prerequisites: [],
  },
  housing: {
    id: 'housing', name: 'Housing', era: 1,
    cost: { materials: 20, food: 15 },
    effects: [{ type: 'production_add', target: 'labor', value: 1 }],
    description: 'Proper housing provides steady labor',
    prerequisites: ['tools'],
  },
  expandWorkforce: {
    id: 'expandWorkforce', name: 'Expand Workforce', era: 1,
    cost: { food: 10, materials: 8 },
    effects: [{ type: 'production_add', target: 'labor', value: 0.5 }],
    description: 'Each expansion adds +0.5 labor/s',
    prerequisites: ['housing'],
    repeatable: true,
    costScale: 1.5,
  },
  storehouse: {
    id: 'storehouse', name: 'Storehouse', era: 1,
    cost: { materials: 30, labor: 15 },
    effects: [
      { type: 'cap_mult', target: 'food', value: 2 },
      { type: 'cap_mult', target: 'materials', value: 2 },
    ],
    description: 'Double food and material storage capacity',
    prerequisites: ['tools'],
  },
  foundry: {
    id: 'foundry', name: 'Foundry', era: 1,
    cost: { materials: 50, energy: 40, food: 20 },
    effects: [
      { type: 'unlock_resource', target: 'steel', value: 1 },
      { type: 'production_add', target: 'steel', value: 0.3 },
    ],
    description: 'Smelt metals into steel — gateway to industrialization',
    prerequisites: ['basicPower', 'tools'],
  },

  // Milestone upgrades — unlock based on achievements
  advancedTools: {
    id: 'advancedTools', name: 'Advanced Tools', era: 1,
    cost: { materials: 40, energy: 20, labor: 20 },
    effects: [
      { type: 'production_mult', target: 'materials', value: 2 },
      { type: 'production_add', target: 'energy', value: 0.3 },
    ],
    description: 'Better tools double materials again and generate energy',
    prerequisites: ['foundry'],
  },
  gemPolisher: {
    id: 'gemPolisher', name: 'Gem Polisher', era: 1,
    cost: { materials: 15, energy: 10 },
    effects: [
      { type: 'production_mult', target: 'materials', value: 3 },
      { type: 'production_add', target: 'energy', value: 0.5 },
    ],
    description: 'Find 5 gems to unlock — gem expertise boosts production',
    prerequisites: ['tools'],
    requireGems: 5,
  },
  gemMastery: {
    id: 'gemMastery', name: 'Gem Mastery', era: 3,
    cost: { research: 30, data: 15 },
    effects: [
      { type: 'production_mult', target: 'research', value: 2 },
      { type: 'production_mult', target: 'software', value: 2 },
    ],
    description: 'Find 20 gems to unlock — deep gem knowledge doubles research & software',
    prerequisites: ['internet'],
    requireGems: 20,
  },
  traderInstinct: {
    id: 'traderInstinct', name: 'Trader Instinct', era: 6,
    cost: { galacticInfluence: 20, starSystems: 5 },
    effects: [
      { type: 'production_mult', target: 'galacticInfluence', value: 2 },
      { type: 'production_add', target: 'starSystems', value: 0.2 },
    ],
    description: 'Complete 10 trades to unlock — trade expertise boosts influence',
    prerequisites: ['warpDrive'],
    requireTrades: 10,
  },

  // Era 2: Industrialization
  assemblyLines: {
    id: 'assemblyLines', name: 'Assembly Lines', era: 2,
    cost: { steel: 15, energy: 20, food: 25 },
    effects: [
      { type: 'production_mult', target: 'steel', value: 3 },
      { type: 'production_add', target: 'electronics', value: 0.3 },
    ],
    description: 'Mass production of steel and basic electronics',
    prerequisites: ['foundry'],
  },
  powerGrid: {
    id: 'powerGrid', name: 'Power Grid', era: 2,
    cost: { steel: 40, electronics: 15 },
    effects: [{ type: 'production_mult', target: 'energy', value: 3 }],
    description: 'Centralized power distribution',
    prerequisites: ['assemblyLines'],
  },
  computingLab: {
    id: 'computingLab', name: 'Computing Lab', era: 2,
    cost: { electronics: 15, energy: 25, food: 30 },
    effects: [{ type: 'production_add', target: 'research', value: 0.5 }],
    description: 'Begin scientific research',
    prerequisites: ['assemblyLines'],
  },
  automation: {
    id: 'automation', name: 'Automation', era: 2,
    cost: { electronics: 25, steel: 30, research: 15 },
    effects: [
      { type: 'production_add', target: 'labor', value: 2 },
      { type: 'production_add', target: 'materials', value: 0.5 },
    ],
    description: 'Machines replace manual labor — automated resource gathering',
    prerequisites: ['computingLab'],
  },
  steamTurbine: {
    id: 'steamTurbine', name: 'Steam Turbine', era: 2,
    cost: { steel: 20, energy: 15, materials: 25 },
    effects: [
      { type: 'production_mult', target: 'energy', value: 2 },
      { type: 'production_add', target: 'steel', value: 0.2 },
    ],
    description: 'Steam power boosts energy and steel production',
    prerequisites: ['powerGrid'],
  },
  factoryFloor: {
    id: 'factoryFloor', name: 'Factory Floor', era: 2,
    cost: { steel: 15, electronics: 10, labor: 20 },
    effects: [{ type: 'production_add', target: 'electronics', value: 0.2 }],
    description: 'Each factory floor adds +0.2 electronics/s',
    prerequisites: ['assemblyLines'],
    repeatable: true,
    costScale: 1.4,
  },
  industrialFarming: {
    id: 'industrialFarming', name: 'Industrial Farming', era: 2,
    cost: { steel: 10, energy: 15, food: 20 },
    effects: [
      { type: 'production_mult', target: 'food', value: 3 },
    ],
    description: 'Mechanized agriculture triples food output',
    prerequisites: ['assemblyLines'],
  },

  // Era 3: Digital Age
  internet: {
    id: 'internet', name: 'Internet', era: 3,
    cost: { electronics: 40, research: 30 },
    effects: [{ type: 'production_add', target: 'software', value: 0.5 }],
    description: 'Global communication network enables software development',
    prerequisites: ['computingLab'],
  },
  cloudComputing: {
    id: 'cloudComputing', name: 'Cloud Computing', era: 3,
    cost: { software: 15, electronics: 30, energy: 20 },
    effects: [{ type: 'production_add', target: 'data', value: 1 }],
    description: 'Distributed computing generates massive data streams',
    prerequisites: ['internet'],
  },
  openSource: {
    id: 'openSource', name: 'Open Source', era: 3,
    cost: { software: 10, research: 20 },
    effects: [{ type: 'production_mult', target: 'software', value: 3 }],
    description: 'Collaborative development triples software output',
    prerequisites: ['internet'],
  },
  dataCenter: {
    id: 'dataCenter', name: 'Data Center', era: 3,
    cost: { electronics: 20, energy: 15, steel: 10 },
    effects: [{ type: 'production_add', target: 'data', value: 0.5 }],
    description: 'Each data center adds +0.5 data/s — build more for more data',
    prerequisites: ['internet'],
    repeatable: true,
    costScale: 1.4,
  },
  aiResearch: {
    id: 'aiResearch', name: 'AI Research', era: 3,
    cost: { software: 20, research: 40, electronics: 25 },
    effects: [
      { type: 'production_mult', target: 'research', value: 3 },
      { type: 'production_add', target: 'data', value: 0.3 },
    ],
    description: 'Artificial intelligence accelerates research and generates data',
    prerequisites: ['internet'],
  },
  quantumComputing: {
    id: 'quantumComputing', name: 'Quantum Computing', era: 3,
    cost: { data: 15, software: 30, research: 50 },
    effects: [
      { type: 'production_mult', target: 'electronics', value: 5 },
      { type: 'unlock_resource', target: 'rocketFuel', value: 1 },
      { type: 'production_add', target: 'rocketFuel', value: 0.2 },
    ],
    description: 'Quantum computers unlock next-generation technology — gateway to space',
    prerequisites: ['aiResearch'],
  },
  cyberSecurity: {
    id: 'cyberSecurity', name: 'Cyber Security', era: 3,
    cost: { software: 25, data: 10, research: 30 },
    effects: [
      { type: 'production_mult', target: 'research', value: 2 },
      { type: 'cap_mult', target: 'data', value: 3 },
    ],
    description: 'Secure systems boost research and expand data storage',
    prerequisites: ['cloudComputing'],
  },

  // Era 4: Space Age
  rocketScience: {
    id: 'rocketScience', name: 'Rocket Science', era: 4,
    cost: { research: 30, steel: 25, electronics: 15 },
    effects: [
      { type: 'production_add', target: 'rocketFuel', value: 0.3 },
    ],
    description: 'Advanced rocket technology boosts fuel production',
    prerequisites: ['quantumComputing'],
  },
  reusableRockets: {
    id: 'reusableRockets', name: 'Reusable Rockets', era: 4,
    cost: { rocketFuel: 15, steel: 30, research: 20, labor: 50 },
    effects: [{ type: 'production_mult', target: 'rocketFuel', value: 2 }],
    description: 'Cheaper access to space',
    prerequisites: ['rocketScience'],
  },
  solarArrays: {
    id: 'solarArrays', name: 'Solar Arrays', era: 4,
    cost: { electronics: 25, steel: 20, energy: 15 },
    effects: [{ type: 'production_mult', target: 'energy', value: 5 }],
    description: 'Orbital solar panels multiply energy output',
    prerequisites: ['reusableRockets'],
  },
  spaceStation: {
    id: 'spaceStation', name: 'Space Station', era: 4,
    cost: { rocketFuel: 30, steel: 40, electronics: 20, food: 60 },
    effects: [{ type: 'production_add', target: 'orbitalInfra', value: 0.5 }],
    description: 'Permanent orbital habitat',
    prerequisites: ['reusableRockets'],
  },
  orbitalTelescope: {
    id: 'orbitalTelescope', name: 'Orbital Telescope', era: 4,
    cost: { orbitalInfra: 10, electronics: 20, research: 15 },
    effects: [
      { type: 'production_mult', target: 'research', value: 2 },
      { type: 'production_add', target: 'data', value: 0.5 },
    ],
    description: 'Deep space observations accelerate research and data collection',
    prerequisites: ['spaceStation'],
  },
  launchComplex: {
    id: 'launchComplex', name: 'Launch Complex', era: 4,
    cost: { steel: 30, energy: 20, rocketFuel: 10 },
    effects: [{ type: 'production_add', target: 'rocketFuel', value: 0.2 }],
    description: 'Each launch complex adds +0.2 rocket fuel/s',
    prerequisites: ['rocketScience'],
    repeatable: true,
    costScale: 1.5,
  },
  zeroGManufacturing: {
    id: 'zeroGManufacturing', name: 'Zero-G Manufacturing', era: 4,
    cost: { orbitalInfra: 15, electronics: 30, research: 25 },
    effects: [
      { type: 'production_mult', target: 'electronics', value: 3 },
      { type: 'unlock_resource', target: 'exoticMaterials', value: 1 },
      { type: 'production_add', target: 'exoticMaterials', value: 0.2 },
    ],
    description: 'Manufacture in orbit — gateway to the solar system',
    prerequisites: ['spaceStation'],
  },

  spaceDebrisCollector: {
    id: 'spaceDebrisCollector', name: 'Space Debris Collector', era: 4,
    cost: { orbitalInfra: 8, steel: 20, electronics: 10 },
    effects: [
      { type: 'production_add', target: 'materials', value: 0.5 },
      { type: 'production_add', target: 'electronics', value: 0.2 },
    ],
    description: 'Collect space debris — recycle into materials and electronics',
    prerequisites: ['spaceStation'],
  },
  refueling: {
    id: 'refueling', name: 'Orbital Refueling', era: 4,
    cost: { orbitalInfra: 8, rocketFuel: 15, steel: 20 },
    effects: [
      { type: 'production_mult', target: 'orbitalInfra', value: 2 },
      { type: 'cap_mult', target: 'rocketFuel', value: 3 },
    ],
    description: 'Refuel in orbit — double infrastructure and triple fuel capacity',
    prerequisites: ['spaceStation'],
  },
  deepSpaceProbe: {
    id: 'deepSpaceProbe', name: 'Deep Space Probe', era: 4,
    cost: { rocketFuel: 20, electronics: 15, research: 25 },
    effects: [
      { type: 'production_add', target: 'data', value: 0.5 },
      { type: 'production_add', target: 'research', value: 0.3 },
    ],
    description: 'Probes transmit data from deep space — steady data and research',
    prerequisites: ['rocketScience'],
  },
  nuclearReactor: {
    id: 'nuclearReactor', name: 'Nuclear Reactor', era: 4,
    cost: { research: 35, steel: 40, electronics: 15 },
    effects: [
      { type: 'production_mult', target: 'energy', value: 3 },
      { type: 'production_add', target: 'research', value: 0.3 },
    ],
    description: 'Nuclear fission triples energy and generates research data',
    prerequisites: ['rocketScience'],
  },
  satelliteNetwork: {
    id: 'satelliteNetwork', name: 'Satellite Network', era: 4,
    cost: { orbitalInfra: 12, electronics: 20, energy: 15 },
    effects: [
      { type: 'production_mult', target: 'data', value: 3 },
      { type: 'production_add', target: 'research', value: 0.5 },
    ],
    description: 'Orbital satellites triple data collection and boost research',
    prerequisites: ['spaceStation'],
  },
  spaceElevator: {
    id: 'spaceElevator', name: 'Space Elevator', era: 4,
    cost: { steel: 50, research: 25, energy: 30 },
    effects: [
      { type: 'production_mult', target: 'orbitalInfra', value: 3 },
      { type: 'production_mult', target: 'steel', value: 2 },
    ],
    description: 'Cheap orbital access triples infrastructure and doubles steel output',
    prerequisites: ['spaceStation'],
  },

  // Era 5: Solar System
  asteroidMining: {
    id: 'asteroidMining', name: 'Asteroid Mining', era: 5,
    cost: { orbitalInfra: 30, rocketFuel: 50, exoticMaterials: 10, materials: 200 },
    effects: [
      { type: 'production_add', target: 'exoticMaterials', value: 1 },
      { type: 'production_mult', target: 'materials', value: 5 },
    ],
    description: 'Mine the asteroid belt for resources',
    prerequisites: ['zeroGManufacturing'],
  },
  geneticEngineering: {
    id: 'geneticEngineering', name: 'Genetic Engineering', era: 5,
    cost: { research: 40, food: 60, data: 20 },
    effects: [
      { type: 'production_mult', target: 'food', value: 10 },
      { type: 'production_mult', target: 'labor', value: 3 },
    ],
    description: 'Optimized biology boosts food and labor output dramatically',
    prerequisites: ['asteroidMining'],
  },
  terraforming: {
    id: 'terraforming', name: 'Terraforming', era: 5,
    cost: { exoticMaterials: 30, research: 60, energy: 80, food: 100 },
    effects: [{ type: 'production_add', target: 'colonies', value: 0.2 }],
    description: 'Make other worlds habitable',
    prerequisites: ['asteroidMining'],
  },
  orbitalHabitat: {
    id: 'orbitalHabitat', name: 'Orbital Habitat', era: 5,
    cost: { exoticMaterials: 15, energy: 40, steel: 50 },
    effects: [{ type: 'production_add', target: 'colonies', value: 0.1 }],
    description: 'Each habitat adds +0.1 colonies/s — expand across the system',
    prerequisites: ['terraforming'],
    repeatable: true,
    costScale: 1.6,
  },
  fusionPower: {
    id: 'fusionPower', name: 'Fusion Power', era: 5,
    cost: { research: 60, exoticMaterials: 25, colonies: 3 },
    effects: [
      { type: 'production_mult', target: 'energy', value: 10 },
      { type: 'unlock_resource', target: 'darkEnergy', value: 1 },
      { type: 'production_add', target: 'darkEnergy', value: 0.2 },
    ],
    description: 'Nearly limitless energy — gateway to the stars',
    prerequisites: ['terraforming'],
  },
  antimatterDrive: {
    id: 'antimatterDrive', name: 'Antimatter Drive', era: 5,
    cost: { exoticMaterials: 40, research: 80, rocketFuel: 60 },
    effects: [
      { type: 'production_mult', target: 'rocketFuel', value: 5 },
      { type: 'production_mult', target: 'exoticMaterials', value: 3 },
    ],
    description: 'Antimatter propulsion — vastly more efficient than fusion',
    prerequisites: ['fusionPower'],
  },
  gravityWell: {
    id: 'gravityWell', name: 'Gravity Well', era: 5,
    cost: { rocketFuel: 40, research: 50, exoticMaterials: 20 },
    effects: [
      { type: 'production_mult', target: 'rocketFuel', value: 3 },
      { type: 'production_add', target: 'orbitalInfra', value: 0.3 },
    ],
    description: 'Harness gravity for propulsion — triple fuel and boost orbital infrastructure',
    prerequisites: ['terraforming'],
  },
  solarCollector: {
    id: 'solarCollector', name: 'Solar Collector', era: 5,
    cost: { energy: 60, exoticMaterials: 15, orbitalInfra: 20 },
    effects: [
      { type: 'production_mult', target: 'energy', value: 3 },
      { type: 'cap_mult', target: 'energy', value: 5 },
    ],
    description: 'Harvest solar energy across the system — triple output and expand capacity',
    prerequisites: ['asteroidMining'],
  },
  miningDrone: {
    id: 'miningDrone', name: 'Mining Drone', era: 5,
    cost: { exoticMaterials: 10, electronics: 30, rocketFuel: 20 },
    effects: [{ type: 'production_add', target: 'exoticMaterials', value: 0.3 }],
    description: 'Each drone adds +0.3 exotic materials/s',
    prerequisites: ['asteroidMining'],
    repeatable: true,
    costScale: 1.5,
  },

  // Era 6: Interstellar
  warpDrive: {
    id: 'warpDrive', name: 'Warp Drive', era: 6,
    cost: { darkEnergy: 30, research: 100, exoticMaterials: 60, steel: 500 },
    effects: [{ type: 'production_add', target: 'starSystems', value: 0.1 }],
    description: 'Travel between stars',
    prerequisites: ['fusionPower'],
  },
  stellarCartography: {
    id: 'stellarCartography', name: 'Stellar Cartography', era: 6,
    cost: { starSystems: 3, research: 60, data: 30 },
    effects: [{ type: 'production_mult', target: 'starSystems', value: 3 }],
    description: 'Map the stars to discover systems faster',
    prerequisites: ['warpDrive'],
  },
  dysonSwarms: {
    id: 'dysonSwarms', name: 'Dyson Swarms', era: 6,
    cost: { starSystems: 5, exoticMaterials: 80, energy: 200, labor: 200 },
    effects: [{ type: 'production_mult', target: 'energy', value: 50 }],
    description: 'Harvest stellar energy',
    prerequisites: ['warpDrive'],
  },
  colonialFleet: {
    id: 'colonialFleet', name: 'Colonial Fleet', era: 6,
    cost: { darkEnergy: 20, steel: 200, colonies: 5 },
    effects: [{ type: 'production_add', target: 'starSystems', value: 0.05 }],
    description: 'Each fleet expands +0.05 star systems/s',
    prerequisites: ['warpDrive'],
    repeatable: true,
    costScale: 1.5,
  },
  aiGovernance: {
    id: 'aiGovernance', name: 'AI Governance', era: 6,
    cost: { research: 100, starSystems: 8, electronics: 60 },
    effects: [
      { type: 'production_mult', target: 'research', value: 10 },
      { type: 'unlock_resource', target: 'galacticInfluence', value: 1 },
      { type: 'production_add', target: 'galacticInfluence', value: 0.5 },
    ],
    description: 'Superintelligent administration — gateway to galactic scale',
    prerequisites: ['dysonSwarms'],
  },
  darkEnergyCollector: {
    id: 'darkEnergyCollector', name: 'Dark Energy Collector', era: 6,
    cost: { darkEnergy: 15, exoticMaterials: 20, energy: 100 },
    effects: [{ type: 'production_add', target: 'darkEnergy', value: 0.1 }],
    description: 'Each collector adds +0.1 dark energy/s',
    prerequisites: ['warpDrive'],
    repeatable: true,
    costScale: 1.5,
  },
  alienDiplomacy: {
    id: 'alienDiplomacy', name: 'Alien Diplomacy', era: 6,
    cost: { galacticInfluence: 30, research: 80, food: 300 },
    effects: [
      { type: 'production_mult', target: 'galacticInfluence', value: 3 },
      { type: 'production_add', target: 'darkEnergy', value: 1 },
    ],
    description: 'First contact — alien knowledge boosts influence and dark energy',
    prerequisites: ['aiGovernance'],
  },

  // Era 7: Dyson Era
  dysonSphere: {
    id: 'dysonSphere', name: 'Dyson Sphere', era: 7,
    cost: { starSystems: 8, exoticMaterials: 60, energy: 300 },
    effects: [
      { type: 'production_add', target: 'megastructures', value: 0.1 },
      { type: 'production_mult', target: 'energy', value: 20 },
    ],
    description: 'Enclose a star to harvest its full energy output',
    prerequisites: ['aiGovernance'],
  },
  starLifting: {
    id: 'starLifting', name: 'Star Lifting', era: 7,
    cost: { megastructures: 5, darkEnergy: 40, research: 80 },
    effects: [
      { type: 'production_add', target: 'stellarForge', value: 0.3 },
      { type: 'production_mult', target: 'materials', value: 10 },
    ],
    description: 'Extract matter directly from stars',
    prerequisites: ['dysonSphere'],
  },
  stellarNursery: {
    id: 'stellarNursery', name: 'Stellar Nursery', era: 7,
    cost: { stellarForge: 10, megastructures: 3, darkEnergy: 30 },
    effects: [
      { type: 'production_mult', target: 'stellarForge', value: 3 },
      { type: 'production_add', target: 'exoticMaterials', value: 2 },
    ],
    description: 'Cultivate new stars for exotic material harvesting',
    prerequisites: ['starLifting'],
  },
  megastructureFoundry: {
    id: 'megastructureFoundry', name: 'Megastructure Foundry', era: 7,
    cost: { stellarForge: 8, energy: 200, exoticMaterials: 30 },
    effects: [{ type: 'production_add', target: 'megastructures', value: 0.05 }],
    description: 'Each foundry adds +0.05 megastructures/s',
    prerequisites: ['starLifting'],
    repeatable: true,
    costScale: 1.6,
  },
  matrioshkaBrain: {
    id: 'matrioshkaBrain', name: 'Matrioshka Brain', era: 7,
    cost: { stellarForge: 15, megastructures: 8, research: 120 },
    effects: [
      { type: 'production_mult', target: 'research', value: 20 },
      { type: 'unlock_resource', target: 'galacticInfluence', value: 1 },
      { type: 'production_add', target: 'galacticInfluence', value: 0.3 },
    ],
    description: 'A star-sized computer — gateway to galactic civilization',
    prerequisites: ['starLifting'],
  },
  neuralUplink: {
    id: 'neuralUplink', name: 'Neural Uplink', era: 7,
    cost: { megastructures: 6, research: 100, software: 50 },
    effects: [
      { type: 'production_mult', target: 'software', value: 20 },
      { type: 'production_mult', target: 'data', value: 10 },
    ],
    description: 'Cross-era synergy — stellar computing revolutionizes software and data',
    prerequisites: ['matrioshkaBrain'],
  },
  stellarEngine: {
    id: 'stellarEngine', name: 'Stellar Engine', era: 7,
    cost: { megastructures: 7, stellarForge: 12, energy: 250 },
    effects: [
      { type: 'production_mult', target: 'energy', value: 10 },
      { type: 'production_add', target: 'darkEnergy', value: 1 },
    ],
    description: 'Move entire stars — massive energy and dark energy boost',
    prerequisites: ['dysonSphere'],
  },
  gravitonLens: {
    id: 'gravitonLens', name: 'Graviton Lens', era: 7,
    cost: { darkEnergy: 50, stellarForge: 12, research: 90 },
    effects: [
      { type: 'production_mult', target: 'darkEnergy', value: 3 },
      { type: 'production_add', target: 'starSystems', value: 0.2 },
    ],
    description: 'Gravitational lensing reveals hidden star systems and dark energy',
    prerequisites: ['dysonSphere'],
  },

  // Era 8: Galactic
  wormholeNetwork: {
    id: 'wormholeNetwork', name: 'Wormhole Network', era: 8,
    cost: { galacticInfluence: 50, darkEnergy: 80, exoticMaterials: 100, food: 500 },
    effects: [
      { type: 'production_mult', target: 'starSystems', value: 10 },
      { type: 'production_add', target: 'exoticMatter', value: 0.5 },
    ],
    description: 'Instant travel across the galaxy',
    prerequisites: ['matrioshkaBrain'],
  },
  darkMatterHarvest: {
    id: 'darkMatterHarvest', name: 'Dark Matter Harvest', era: 8,
    cost: { exoticMatter: 15, darkEnergy: 50, starSystems: 20 },
    effects: [
      { type: 'production_mult', target: 'exoticMatter', value: 3 },
      { type: 'production_mult', target: 'darkEnergy', value: 5 },
    ],
    description: 'Harvest dark matter from galactic filaments',
    prerequisites: ['wormholeNetwork'],
  },
  galacticSenate: {
    id: 'galacticSenate', name: 'Galactic Senate', era: 8,
    cost: { galacticInfluence: 100, starSystems: 30, research: 200, materials: 1000 },
    effects: [{ type: 'production_mult', target: 'galacticInfluence', value: 5 }],
    description: 'Unite civilizations under one government',
    prerequisites: ['wormholeNetwork'],
  },
  culturalAssimilation: {
    id: 'culturalAssimilation', name: 'Cultural Assimilation', era: 8,
    cost: { galacticInfluence: 80, food: 400, colonies: 20 },
    effects: [
      { type: 'production_mult', target: 'galacticInfluence', value: 3 },
      { type: 'production_mult', target: 'colonies', value: 5 },
    ],
    description: 'Unified culture accelerates expansion and influence',
    prerequisites: ['galacticSenate'],
  },
  replicatorArray: {
    id: 'replicatorArray', name: 'Replicator Array', era: 8,
    cost: { exoticMatter: 10, research: 100, energy: 150 },
    effects: [{ type: 'production_add', target: 'exoticMatter', value: 0.3 }],
    description: 'Each array adds +0.3 exotic matter/s',
    prerequisites: ['wormholeNetwork'],
    repeatable: true,
    costScale: 1.5,
  },
  galacticFarm: {
    id: 'galacticFarm', name: 'Galactic Farm', era: 8,
    cost: { galacticInfluence: 40, colonies: 15, food: 300 },
    effects: [{ type: 'production_add', target: 'galacticInfluence', value: 0.3 }],
    description: 'Each farm adds +0.3 galactic influence/s',
    prerequisites: ['galacticSenate'],
    repeatable: true,
    costScale: 1.5,
  },
  quantumEntanglement: {
    id: 'quantumEntanglement', name: 'Quantum Entanglement', era: 8,
    cost: { exoticMatter: 30, research: 180, darkEnergy: 60 },
    effects: [
      { type: 'production_mult', target: 'research', value: 5 },
      { type: 'production_mult', target: 'data', value: 20 },
    ],
    description: 'Cross-era synergy — entangled particles revolutionize data and research',
    prerequisites: ['darkMatterHarvest'],
  },
  matterReplicators: {
    id: 'matterReplicators', name: 'Matter Replicators', era: 8,
    cost: { exoticMatter: 20, energy: 300, research: 200 },
    effects: [
      { type: 'production_mult', target: 'exoticMatter', value: 5 },
      { type: 'unlock_resource', target: 'cosmicPower', value: 1 },
      { type: 'production_add', target: 'cosmicPower', value: 0.5 },
    ],
    description: 'Create matter from energy — gateway to intergalactic expansion',
    prerequisites: ['galacticSenate'],
  },

  // Era 9: Intergalactic
  galaxySeeding: {
    id: 'galaxySeeding', name: 'Galaxy Seeding', era: 9,
    cost: { cosmicPower: 100, exoticMatter: 80, galacticInfluence: 200, steel: 2000 },
    effects: [{ type: 'production_mult', target: 'cosmicPower', value: 5 }],
    description: 'Seed new galaxies with life',
    prerequisites: ['matterReplicators'],
  },
  cosmicInfrastructure: {
    id: 'cosmicInfrastructure', name: 'Cosmic Infrastructure', era: 9,
    cost: { cosmicPower: 80, megastructures: 20, exoticMatter: 50 },
    effects: [
      { type: 'production_mult', target: 'cosmicPower', value: 3 },
      { type: 'production_add', target: 'exoticMatter', value: 2 },
    ],
    description: 'Galaxy-spanning infrastructure amplifies cosmic power',
    prerequisites: ['galaxySeeding'],
  },
  voidBridges: {
    id: 'voidBridges', name: 'Void Bridges', era: 9,
    cost: { cosmicPower: 200, darkEnergy: 150, exoticMatter: 100, labor: 1000 },
    effects: [{ type: 'production_add', target: 'universalConstants', value: 0.1 }],
    description: 'Bridge the void between galaxy clusters',
    prerequisites: ['galaxySeeding'],
  },
  universalTranslator: {
    id: 'universalTranslator', name: 'Universal Translator', era: 9,
    cost: { universalConstants: 5, galacticInfluence: 150, research: 250 },
    effects: [
      { type: 'production_mult', target: 'galacticInfluence', value: 10 },
      { type: 'production_add', target: 'universalConstants', value: 0.05 },
    ],
    description: 'Communicate across all civilizations — cross-era influence multiplier',
    prerequisites: ['voidBridges'],
  },
  galaxyCluster: {
    id: 'galaxyCluster', name: 'Galaxy Cluster', era: 9,
    cost: { cosmicPower: 60, exoticMatter: 30, darkEnergy: 40 },
    effects: [{ type: 'production_add', target: 'universalConstants', value: 0.05 }],
    description: 'Each cluster adds +0.05 universal constants/s',
    prerequisites: ['voidBridges'],
    repeatable: true,
    costScale: 1.6,
  },
  cosmicBeacon: {
    id: 'cosmicBeacon', name: 'Cosmic Beacon', era: 9,
    cost: { cosmicPower: 40, darkEnergy: 30, galacticInfluence: 50 },
    effects: [{ type: 'production_add', target: 'cosmicPower', value: 0.5 }],
    description: 'Each beacon adds +0.5 cosmic power/s',
    prerequisites: ['galaxySeeding'],
    repeatable: true,
    costScale: 1.5,
  },
  entropyReversal: {
    id: 'entropyReversal', name: 'Entropy Reversal', era: 9,
    cost: { universalConstants: 8, cosmicPower: 200, research: 300 },
    effects: [
      { type: 'production_mult', target: 'universalConstants', value: 5 },
      { type: 'unlock_resource', target: 'realityFragments', value: 1 },
      { type: 'production_add', target: 'realityFragments', value: 0.3 },
    ],
    description: 'Reverse entropy itself — gateway to the multiverse',
    prerequisites: ['voidBridges'],
  },

  // Era 10: Multiverse
  realityWeaving: {
    id: 'realityWeaving', name: 'Reality Weaving', era: 10,
    cost: { realityFragments: 50, universalConstants: 20, cosmicPower: 400, food: 2000 },
    effects: [{ type: 'production_mult', target: 'realityFragments', value: 5 }],
    description: 'Weave new realities from fragments',
    prerequisites: ['entropyReversal'],
  },
  dimensionalAnchors: {
    id: 'dimensionalAnchors', name: 'Dimensional Anchors', era: 10,
    cost: { realityFragments: 100, exoticMatter: 150, darkEnergy: 200 },
    effects: [{ type: 'production_add', target: 'quantumEchoes', value: 1 }],
    description: 'Stabilize connections to parallel universes',
    prerequisites: ['realityWeaving'],
  },
  parallelProcessing: {
    id: 'parallelProcessing', name: 'Parallel Processing', era: 10,
    cost: { quantumEchoes: 30, realityFragments: 80, research: 500 },
    effects: [
      { type: 'production_mult', target: 'quantumEchoes', value: 5 },
      { type: 'production_mult', target: 'research', value: 50 },
    ],
    description: 'Process data across parallel universes — exponential research gains',
    prerequisites: ['dimensionalAnchors'],
  },
  realityLoom: {
    id: 'realityLoom', name: 'Reality Loom', era: 10,
    cost: { quantumEchoes: 15, universalConstants: 5, cosmicPower: 100 },
    effects: [{ type: 'production_add', target: 'realityFragments', value: 0.2 }],
    description: 'Each loom weaves +0.2 reality fragments/s',
    prerequisites: ['realityWeaving'],
    repeatable: true,
    costScale: 1.5,
  },
  omniscienceEngine: {
    id: 'omniscienceEngine', name: 'Omniscience Engine', era: 10,
    cost: { quantumEchoes: 50, realityFragments: 200, universalConstants: 30 },
    effects: [
      { type: 'production_mult', target: 'quantumEchoes', value: 10 },
      { type: 'production_mult', target: 'realityFragments', value: 10 },
    ],
    description: 'See across all realities simultaneously — the ultimate achievement',
    prerequisites: ['dimensionalAnchors'],
  },
  dimensionalRift: {
    id: 'dimensionalRift', name: 'Dimensional Rift', era: 10,
    cost: { realityFragments: 20, universalConstants: 5, quantumEchoes: 10 },
    effects: [{ type: 'production_add', target: 'quantumEchoes', value: 0.5 }],
    description: 'Each rift adds +0.5 quantum echoes/s',
    prerequisites: ['dimensionalAnchors'],
    repeatable: true,
    costScale: 1.5,
  },
  infinityMirror: {
    id: 'infinityMirror', name: 'Infinity Mirror', era: 10,
    cost: { quantumEchoes: 40, realityFragments: 100, universalConstants: 15 },
    effects: [
      { type: 'production_mult', target: 'quantumEchoes', value: 3 },
      { type: 'production_mult', target: 'realityFragments', value: 3 },
      { type: 'production_mult', target: 'universalConstants', value: 3 },
    ],
    description: 'Reflect reality upon itself — triple all multiverse resources',
    prerequisites: ['dimensionalAnchors'],
  },
  multiversalHarmony: {
    id: 'multiversalHarmony', name: 'Multiversal Harmony', era: 10,
    cost: { quantumEchoes: 100, realityFragments: 300, universalConstants: 50, cosmicPower: 800 },
    effects: [
      { type: 'production_mult', target: 'cosmicPower', value: 100 },
      { type: 'production_mult', target: 'universalConstants', value: 50 },
      { type: 'production_mult', target: 'exoticMatter', value: 100 },
    ],
    description: 'All realities harmonize — endgame capstone that supercharges cosmic production',
    prerequisites: ['omniscienceEngine'],
  },

  // Era synergy upgrades — boost multiple resources at once
  railroad: {
    id: 'railroad', name: 'Railroad', era: 2,
    cost: { steel: 25, materials: 20, labor: 25 },
    effects: [
      { type: 'production_mult', target: 'materials', value: 3 },
      { type: 'production_add', target: 'steel', value: 0.5 },
    ],
    description: 'Rail transport triples materials and boosts steel production',
    prerequisites: ['automation'],
  },
  warehouse: {
    id: 'warehouse', name: 'Warehouse', era: 2,
    cost: { steel: 20, materials: 30, labor: 15 },
    effects: [
      { type: 'cap_mult', target: 'steel', value: 3 },
      { type: 'cap_mult', target: 'electronics', value: 3 },
      { type: 'cap_mult', target: 'research', value: 2 },
    ],
    description: 'Industrial storage expands capacity for steel, electronics, and research',
    prerequisites: ['assemblyLines'],
  },
  supplyChain: {
    id: 'supplyChain', name: 'Supply Chain', era: 2,
    cost: { steel: 25, electronics: 10, labor: 30 },
    effects: [
      { type: 'production_mult', target: 'steel', value: 2 },
      { type: 'production_mult', target: 'materials', value: 2 },
    ],
    description: 'Efficient logistics double steel and materials output',
    prerequisites: ['powerGrid', 'automation'],
  },
  asteroidDefense: {
    id: 'asteroidDefense', name: 'Asteroid Defense', era: 4,
    cost: { rocketFuel: 25, electronics: 15, research: 20 },
    effects: [
      { type: 'production_add', target: 'exoticMaterials', value: 0.1 },
      { type: 'cap_mult', target: 'orbitalInfra', value: 3 },
    ],
    description: 'Deflect asteroids — salvage exotic materials and protect orbital assets',
    prerequisites: ['zeroGManufacturing'],
  },
  lunarBase: {
    id: 'lunarBase', name: 'Lunar Base', era: 4,
    cost: { orbitalInfra: 10, steel: 30, food: 40, rocketFuel: 15 },
    effects: [
      { type: 'production_add', target: 'research', value: 0.5 },
      { type: 'production_add', target: 'materials', value: 0.5 },
    ],
    description: 'A permanent base on the Moon — research and materials',
    prerequisites: ['spaceStation'],
  },
  gravitySling: {
    id: 'gravitySling', name: 'Gravity Sling', era: 4,
    cost: { rocketFuel: 20, research: 25, orbitalInfra: 8 },
    effects: [
      { type: 'production_mult', target: 'rocketFuel', value: 2 },
      { type: 'production_add', target: 'orbitalInfra', value: 0.2 },
    ],
    description: 'Gravity assist maneuvers save fuel and build infrastructure',
    prerequisites: ['reusableRockets'],
  },
  ionDrive: {
    id: 'ionDrive', name: 'Ion Drive', era: 4,
    cost: { electronics: 25, research: 30, energy: 20 },
    effects: [
      { type: 'production_add', target: 'orbitalInfra', value: 0.3 },
      { type: 'production_mult', target: 'electronics', value: 2 },
    ],
    description: 'Efficient ion propulsion — more orbital infrastructure and electronics',
    prerequisites: ['solarArrays'],
  },
  advancedRocketry: {
    id: 'advancedRocketry', name: 'Advanced Rocketry', era: 4,
    cost: { rocketFuel: 20, research: 35, steel: 35 },
    effects: [
      { type: 'production_mult', target: 'rocketFuel', value: 3 },
      { type: 'cap_mult', target: 'rocketFuel', value: 3 },
    ],
    description: 'Next-gen rockets triple fuel production and capacity',
    prerequisites: ['reusableRockets'],
  },
  quantumNetwork: {
    id: 'quantumNetwork', name: 'Quantum Network', era: 4,
    cost: { research: 40, electronics: 30, data: 20 },
    effects: [
      { type: 'production_mult', target: 'data', value: 3 },
      { type: 'production_mult', target: 'electronics', value: 2 },
    ],
    description: 'Entangled communication triples data and doubles electronics',
    prerequisites: ['orbitalTelescope'],
  },
  voidHarvester: {
    id: 'voidHarvester', name: 'Void Harvester', era: 8,
    cost: { exoticMatter: 25, darkEnergy: 40, galacticInfluence: 60 },
    effects: [
      { type: 'production_mult', target: 'exoticMatter', value: 2 },
      { type: 'production_mult', target: 'darkEnergy', value: 2 },
      { type: 'production_mult', target: 'galacticInfluence', value: 2 },
    ],
    description: 'Harvest the void — double three key galactic resources',
    prerequisites: ['culturalAssimilation'],
  },

  // Prestige-only upgrades — only available after at least one prestige
  // Era 10 deep endgame
  temporalLoop: {
    id: 'temporalLoop', name: 'Temporal Loop', era: 10,
    cost: { quantumEchoes: 60, universalConstants: 25, cosmicPower: 300 },
    effects: [
      { type: 'production_mult', target: 'cosmicPower', value: 5 },
      { type: 'production_mult', target: 'universalConstants', value: 5 },
    ],
    description: 'Loop time itself — feedback amplifies cosmic production',
    prerequisites: ['parallelProcessing'],
  },
  singularityCore: {
    id: 'singularityCore', name: 'Singularity Core', era: 10,
    cost: { quantumEchoes: 80, realityFragments: 150, exoticMatter: 200 },
    effects: [
      { type: 'production_mult', target: 'exoticMatter', value: 20 },
      { type: 'production_mult', target: 'darkEnergy', value: 20 },
    ],
    description: 'A singularity at the heart of all realities — massive exotic and dark production',
    prerequisites: ['omniscienceEngine'],
  },

  // Trickle-down upgrades — higher-tier resources produce lower-tier byproducts
  // Cross-era late-game upgrades
  quantumFarming: {
    id: 'quantumFarming', name: 'Quantum Farming', era: 8,
    cost: { exoticMatter: 15, food: 300, research: 150 },
    effects: [
      { type: 'production_mult', target: 'food', value: 100 },
      { type: 'production_add', target: 'labor', value: 20 },
    ],
    description: 'Quantum-enhanced agriculture — food becomes effectively unlimited',
    prerequisites: ['darkMatterHarvest'],
  },
  universalFactory: {
    id: 'universalFactory', name: 'Universal Factory', era: 9,
    cost: { cosmicPower: 80, exoticMatter: 40, steel: 1000 },
    effects: [
      { type: 'production_mult', target: 'steel', value: 50 },
      { type: 'production_mult', target: 'electronics', value: 50 },
      { type: 'production_mult', target: 'materials', value: 50 },
    ],
    description: 'Cosmic-scale manufacturing — industrial resources become trivial',
    prerequisites: ['voidBridges'],
  },
  realityFabric: {
    id: 'realityFabric', name: 'Reality Fabric', era: 10,
    cost: { realityFragments: 130, universalConstants: 30, quantumEchoes: 80 },
    effects: [
      { type: 'production_mult', target: 'realityFragments', value: 5 },
      { type: 'production_add', target: 'universalConstants', value: 2 },
    ],
    description: 'Weave the fabric of reality — x5 fragments and steady constants',
    prerequisites: ['parallelProcessing'],
  },
  omnipotence: {
    id: 'omnipotence', name: 'Omnipotence', era: 10,
    cost: { quantumEchoes: 150, realityFragments: 200, universalConstants: 50, cosmicPower: 600 },
    effects: [
      { type: 'production_mult', target: 'cosmicPower', value: 20 },
      { type: 'production_mult', target: 'exoticMatter', value: 20 },
      { type: 'production_mult', target: 'darkEnergy', value: 20 },
    ],
    description: 'Achieve omnipotence — x20 to all cosmic-tier production',
    prerequisites: ['infiniteResonance'],
  },
  cosmicOrchestra: {
    id: 'cosmicOrchestra', name: 'Cosmic Orchestra', era: 10,
    cost: { quantumEchoes: 120, realityFragments: 180, universalConstants: 35 },
    effects: [
      { type: 'production_mult', target: 'quantumEchoes', value: 3 },
      { type: 'production_mult', target: 'realityFragments', value: 3 },
      { type: 'production_mult', target: 'universalConstants', value: 3 },
    ],
    description: 'All of reality plays in harmony — x3 to all multiverse resources',
    prerequisites: ['multiversalHarmony'],
  },
  omniversalTrade: {
    id: 'omniversalTrade', name: 'Omniversal Trade', era: 10,
    cost: { quantumEchoes: 70, realityFragments: 100, universalConstants: 25 },
    effects: [
      { type: 'production_add', target: 'realityFragments', value: 3 },
      { type: 'production_add', target: 'quantumEchoes', value: 2 },
      { type: 'production_add', target: 'cosmicPower', value: 5 },
    ],
    description: 'Trade between parallel realities — everything flows',
    prerequisites: ['realityWeaving'],
  },
  infinityWell: {
    id: 'infinityWell', name: 'Infinity Well', era: 10,
    cost: { quantumEchoes: 100, universalConstants: 40, realityFragments: 150 },
    effects: [
      { type: 'production_mult', target: 'realityFragments', value: 10 },
      { type: 'production_mult', target: 'universalConstants', value: 10 },
      { type: 'cap_mult', target: 'quantumEchoes', value: 10 },
    ],
    description: 'An infinite well of power — x10 fragments and constants, x10 echo capacity',
    prerequisites: ['omniscienceEngine'],
  },
  echoAmplifier: {
    id: 'echoAmplifier', name: 'Echo Amplifier', era: 10,
    cost: { quantumEchoes: 80, realityFragments: 90, cosmicPower: 300 },
    effects: [
      { type: 'production_mult', target: 'quantumEchoes', value: 5 },
      { type: 'production_add', target: 'realityFragments', value: 5 },
    ],
    description: 'Amplify echoes across the multiverse — x5 echoes and +5 fragments/s',
    prerequisites: ['realityWeaving'],
  },
  dimensionalWeaver: {
    id: 'dimensionalWeaver', name: 'Dimensional Weaver', era: 10,
    cost: { realityFragments: 100, quantumEchoes: 60, universalConstants: 20 },
    effects: [
      { type: 'production_mult', target: 'realityFragments', value: 5 },
      { type: 'production_add', target: 'universalConstants', value: 1 },
    ],
    description: 'Weave dimensions together — x5 reality fragments and bonus constants',
    prerequisites: ['parallelProcessing'],
  },
  quantumSymphony: {
    id: 'quantumSymphony', name: 'Quantum Symphony', era: 10,
    cost: { quantumEchoes: 90, universalConstants: 35, cosmicPower: 400 },
    effects: [
      { type: 'production_mult', target: 'quantumEchoes', value: 10 },
      { type: 'production_mult', target: 'cosmicPower', value: 10 },
    ],
    description: 'Harmonize quantum echoes across realities — x10 echoes and cosmic power',
    prerequisites: ['omniscienceEngine'],
  },
  realityAnchor: {
    id: 'realityAnchor', name: 'Reality Anchor', era: 10,
    cost: { universalConstants: 30, quantumEchoes: 50, realityFragments: 80 },
    effects: [
      { type: 'production_mult', target: 'universalConstants', value: 10 },
      { type: 'production_add', target: 'quantumEchoes', value: 2 },
    ],
    description: 'Anchor yourself across realities — amplify constants and echoes',
    prerequisites: ['dimensionalAnchors'],
  },
  multiversalLibrary: {
    id: 'multiversalLibrary', name: 'Multiversal Library', era: 10,
    cost: { quantumEchoes: 70, realityFragments: 120, research: 600 },
    effects: [
      { type: 'production_mult', target: 'research', value: 100 },
      { type: 'production_mult', target: 'data', value: 100 },
      { type: 'production_mult', target: 'software', value: 100 },
    ],
    description: 'Collect all knowledge across all realities — x100 to digital resources',
    prerequisites: ['parallelProcessing'],
  },
  eternityEngine: {
    id: 'eternityEngine', name: 'Eternity Engine', era: 10,
    cost: { quantumEchoes: 150, realityFragments: 250, universalConstants: 40 },
    effects: [
      { type: 'production_mult', target: 'quantumEchoes', value: 20 },
      { type: 'production_add', target: 'realityFragments', value: 10 },
    ],
    description: 'An engine that runs for eternity — the ultimate quantum echo amplifier',
    prerequisites: ['multiversalHarmony'],
  },
  entropyHarvester: {
    id: 'entropyHarvester', name: 'Entropy Harvester', era: 9,
    cost: { universalConstants: 15, cosmicPower: 130, exoticMatter: 50 },
    effects: [
      { type: 'production_add', target: 'universalConstants', value: 0.5 },
      { type: 'production_mult', target: 'exoticMatter', value: 3 },
    ],
    description: 'Harvest entropy itself — constants and exotic matter',
    prerequisites: ['entropyReversal'],
  },
  voidExplorer: {
    id: 'voidExplorer', name: 'Void Explorer', era: 9,
    cost: { cosmicPower: 80, darkEnergy: 60, universalConstants: 8 },
    effects: [
      { type: 'production_add', target: 'universalConstants', value: 0.2 },
      { type: 'production_mult', target: 'darkEnergy', value: 3 },
    ],
    description: 'Explore the void between galaxies',
    prerequisites: ['voidBridges'],
  },
  realityHarvest: {
    id: 'realityHarvest', name: 'Reality Harvest', era: 9,
    cost: { realityFragments: 8, universalConstants: 12, cosmicPower: 100 },
    effects: [
      { type: 'production_mult', target: 'realityFragments', value: 3 },
      { type: 'production_mult', target: 'cosmicPower', value: 2 },
    ],
    description: 'Harvest reality itself — triple fragments and double cosmic power',
    prerequisites: ['entropyReversal'],
  },
  cosmicMemory: {
    id: 'cosmicMemory', name: 'Cosmic Memory', era: 9,
    cost: { universalConstants: 14, cosmicPower: 120, research: 280 },
    effects: [
      { type: 'production_mult', target: 'research', value: 10 },
      { type: 'production_add', target: 'universalConstants', value: 0.3 },
    ],
    description: 'The universe remembers — x10 research from cosmic memory banks',
    prerequisites: ['universalTranslator'],
  },
  dimensionalTap: {
    id: 'dimensionalTap', name: 'Dimensional Tap', era: 9,
    cost: { universalConstants: 10, cosmicPower: 90, realityFragments: 5 },
    effects: [
      { type: 'production_add', target: 'realityFragments', value: 0.5 },
      { type: 'production_mult', target: 'universalConstants', value: 2 },
    ],
    description: 'Tap into nearby dimensions for reality fragments',
    prerequisites: ['entropyReversal'],
  },
  hyperspaceLane: {
    id: 'hyperspaceLane', name: 'Hyperspace Lane', era: 9,
    cost: { cosmicPower: 110, darkEnergy: 80, starSystems: 20 },
    effects: [
      { type: 'production_mult', target: 'starSystems', value: 5 },
      { type: 'production_add', target: 'darkEnergy', value: 3 },
    ],
    description: 'Hyperspace lanes enable rapid expansion — x5 star systems',
    prerequisites: ['galaxySeeding'],
  },
  cosmicFortress: {
    id: 'cosmicFortress', name: 'Cosmic Fortress', era: 9,
    cost: { cosmicPower: 130, exoticMatter: 70, megastructures: 15 },
    effects: [
      { type: 'production_mult', target: 'megastructures', value: 10 },
      { type: 'production_mult', target: 'exoticMatter', value: 3 },
    ],
    description: 'A fortress spanning galaxies — x10 megastructures and x3 exotic matter',
    prerequisites: ['cosmicInfrastructure'],
  },
  temporalBattery: {
    id: 'temporalBattery', name: 'Temporal Battery', era: 9,
    cost: { universalConstants: 12, cosmicPower: 100, research: 200 },
    effects: [
      { type: 'cap_mult', target: 'cosmicPower', value: 10 },
      { type: 'cap_mult', target: 'universalConstants', value: 10 },
    ],
    description: 'Store cosmic energy across time — x10 capacity for cosmic and constants',
    prerequisites: ['cosmicInfrastructure'],
  },
  intergalacticHighway: {
    id: 'intergalacticHighway', name: 'Intergalactic Highway', era: 9,
    cost: { cosmicPower: 100, exoticMatter: 60, starSystems: 25 },
    effects: [
      { type: 'production_mult', target: 'colonies', value: 10 },
      { type: 'production_add', target: 'starSystems', value: 1 },
    ],
    description: 'Connect galaxies — massive colony expansion and star system discovery',
    prerequisites: ['voidBridges'],
  },
  darkMatterLens: {
    id: 'darkMatterLens', name: 'Dark Matter Lens', era: 9,
    cost: { universalConstants: 8, darkEnergy: 60, exoticMatter: 40 },
    effects: [
      { type: 'production_mult', target: 'exoticMatter', value: 5 },
      { type: 'production_mult', target: 'darkEnergy', value: 3 },
    ],
    description: 'Focus dark matter for exotic material and dark energy amplification',
    prerequisites: ['entropyReversal'],
  },
  galaxyMapper: {
    id: 'galaxyMapper', name: 'Galaxy Mapper', era: 9,
    cost: { cosmicPower: 90, starSystems: 30, research: 250 },
    effects: [
      { type: 'production_mult', target: 'starSystems', value: 10 },
      { type: 'production_add', target: 'cosmicPower', value: 3 },
    ],
    description: 'Map the entire observable universe — massive star system discovery',
    prerequisites: ['cosmicInfrastructure'],
  },
  voidSiphon: {
    id: 'voidSiphon', name: 'Void Siphon', era: 9,
    cost: { cosmicPower: 120, darkEnergy: 80, universalConstants: 10 },
    effects: [
      { type: 'production_mult', target: 'darkEnergy', value: 10 },
      { type: 'production_add', target: 'cosmicPower', value: 2 },
    ],
    description: 'Siphon energy from the void between galaxies',
    prerequisites: ['entropyReversal'],
  },
  chronoAccelerator: {
    id: 'chronoAccelerator', name: 'Chrono Accelerator', era: 9,
    cost: { universalConstants: 15, cosmicPower: 150, research: 350 },
    effects: [
      { type: 'production_mult', target: 'research', value: 20 },
      { type: 'production_mult', target: 'cosmicPower', value: 3 },
    ],
    description: 'Accelerate time itself — x20 research and x3 cosmic power',
    prerequisites: ['universalTranslator'],
  },
  infiniteResonance: {
    id: 'infiniteResonance', name: 'Infinite Resonance', era: 10,
    cost: { quantumEchoes: 200, cosmicPower: 500, universalConstants: 60 },
    effects: [
      { type: 'production_mult', target: 'universalConstants', value: 100 },
      { type: 'production_mult', target: 'cosmicPower', value: 50 },
    ],
    description: 'Resonance across infinite realities — true endgame power',
    prerequisites: ['multiversalHarmony'],
  },
  quantumEntangledSensors: {
    id: 'quantumEntangledSensors', name: 'Quantum Sensors', era: 7,
    cost: { research: 100, electronics: 40, megastructures: 4 },
    effects: [
      { type: 'production_mult', target: 'research', value: 5 },
      { type: 'production_add', target: 'data', value: 3 },
    ],
    description: 'Sensors spanning star systems — x5 research and +3 data/s',
    prerequisites: ['matrioshkaBrain'],
  },
  neutronStarForge: {
    id: 'neutronStarForge', name: 'Neutron Star Forge', era: 7,
    cost: { stellarForge: 18, darkEnergy: 50, megastructures: 6 },
    effects: [
      { type: 'production_add', target: 'exoticMaterials', value: 3 },
      { type: 'production_mult', target: 'steel', value: 20 },
    ],
    description: 'Forge materials in neutron star cores — extreme pressure yields',
    prerequisites: ['starLifting'],
  },
  stellarAccelerator: {
    id: 'stellarAccelerator', name: 'Stellar Accelerator', era: 7,
    cost: { megastructures: 8, darkEnergy: 50, research: 100 },
    effects: [
      { type: 'production_mult', target: 'research', value: 5 },
      { type: 'production_mult', target: 'energy', value: 3 },
    ],
    description: 'Particle accelerator powered by a star — x5 research and x3 energy',
    prerequisites: ['neuralUplink'],
  },
  planetaryRing: {
    id: 'planetaryRing', name: 'Planetary Ring', era: 7,
    cost: { megastructures: 6, stellarForge: 10, exoticMaterials: 40 },
    effects: [
      { type: 'production_add', target: 'exoticMaterials', value: 2 },
      { type: 'production_mult', target: 'colonies', value: 3 },
    ],
    description: 'Build a ring around a planet — exotic materials and colonies thrive',
    prerequisites: ['ringWorld'],
  },
  dysonSwarmController: {
    id: 'dysonSwarmController', name: 'Dyson Swarm Controller', era: 7,
    cost: { megastructures: 7, software: 40, energy: 200 },
    effects: [
      { type: 'production_mult', target: 'energy', value: 5 },
      { type: 'production_mult', target: 'megastructures', value: 2 },
    ],
    description: 'AI-controlled Dyson swarms — x5 energy and x2 megastructures',
    prerequisites: ['neuralUplink'],
  },
  gravitationalWave: {
    id: 'gravitationalWave', name: 'Gravitational Wave Detector', era: 7,
    cost: { research: 110, megastructures: 5, darkEnergy: 35 },
    effects: [
      { type: 'production_mult', target: 'research', value: 3 },
      { type: 'production_add', target: 'starSystems', value: 0.2 },
    ],
    description: 'Detect gravitational waves to discover distant star systems',
    prerequisites: ['stellarNursery'],
  },
  antimatterWeapon: {
    id: 'antimatterWeapon', name: 'Antimatter Weapon', era: 7,
    cost: { darkEnergy: 45, stellarForge: 12, exoticMaterials: 35 },
    effects: [
      { type: 'production_mult', target: 'galacticInfluence', value: 5 },
      { type: 'production_mult', target: 'darkEnergy', value: 2 },
    ],
    description: 'Project power with antimatter — x5 influence and x2 dark energy',
    prerequisites: ['matrioshkaBrain'],
  },
  orbitalShipyard: {
    id: 'orbitalShipyard', name: 'Orbital Shipyard', era: 7,
    cost: { megastructures: 5, stellarForge: 10, steel: 400 },
    effects: [
      { type: 'production_add', target: 'megastructures', value: 0.2 },
      { type: 'production_mult', target: 'steel', value: 10 },
    ],
    description: 'Build ships in orbit — x10 steel and +0.2 megastructures/s',
    prerequisites: ['dysonSphere'],
  },
  stellarCompressor: {
    id: 'stellarCompressor', name: 'Stellar Compressor', era: 7,
    cost: { stellarForge: 20, megastructures: 8, darkEnergy: 55 },
    effects: [
      { type: 'production_mult', target: 'darkEnergy', value: 5 },
      { type: 'production_mult', target: 'stellarForge', value: 2 },
    ],
    description: 'Compress stellar matter — x5 dark energy and x2 stellar forge',
    prerequisites: ['gravitonLens'],
  },
  ringWorld: {
    id: 'ringWorld', name: 'Ring World', era: 7,
    cost: { megastructures: 10, exoticMaterials: 50, stellarForge: 15 },
    effects: [
      { type: 'production_add', target: 'colonies', value: 5 },
      { type: 'production_mult', target: 'food', value: 20 },
      { type: 'cap_mult', target: 'colonies', value: 10 },
    ],
    description: 'Build a ring world — massive colony and food capacity',
    prerequisites: ['stellarNursery'],
  },
  warpGate: {
    id: 'warpGate', name: 'Warp Gate', era: 7,
    cost: { megastructures: 6, darkEnergy: 45, starSystems: 10 },
    effects: [
      { type: 'production_mult', target: 'starSystems', value: 3 },
      { type: 'production_add', target: 'megastructures', value: 0.1 },
    ],
    description: 'Permanent warp gates triple star system discovery',
    prerequisites: ['matrioshkaBrain'],
  },
  dimensionalForge: {
    id: 'dimensionalForge', name: 'Dimensional Forge', era: 7,
    cost: { megastructures: 8, stellarForge: 15, darkEnergy: 50 },
    effects: [
      { type: 'production_add', target: 'exoticMaterials', value: 5 },
      { type: 'production_mult', target: 'stellarForge', value: 2 },
    ],
    description: 'Forge materials across dimensions — boosts exotic and stellar production',
    prerequisites: ['stellarNursery'],
  },

  stellarMining: {
    id: 'stellarMining', name: 'Stellar Mining', era: 7,
    cost: { stellarForge: 10, megastructures: 4, materials: 500 },
    effects: [
      { type: 'production_add', target: 'steel', value: 5 },
      { type: 'production_add', target: 'electronics', value: 3 },
    ],
    description: 'Stellar forges produce steel and electronics as byproducts',
    prerequisites: ['starLifting'],
  },
  tradeHub: {
    id: 'tradeHub', name: 'Interstellar Trade Hub', era: 6,
    cost: { starSystems: 5, galacticInfluence: 15, steel: 250 },
    effects: [
      { type: 'production_mult', target: 'galacticInfluence', value: 2 },
      { type: 'production_add', target: 'materials', value: 3 },
    ],
    description: 'A hub for interstellar trade — influence and material flows',
    prerequisites: ['stellarCartography'],
  },
  nebulaMining: {
    id: 'nebulaMining', name: 'Nebula Mining', era: 6,
    cost: { darkEnergy: 25, starSystems: 4, exoticMaterials: 30 },
    effects: [
      { type: 'production_add', target: 'darkEnergy', value: 0.5 },
      { type: 'production_mult', target: 'exoticMaterials', value: 2 },
    ],
    description: 'Mine nebulae for dark energy and exotic materials',
    prerequisites: ['warpDrive'],
  },
  stellarNavigation: {
    id: 'stellarNavigation', name: 'Stellar Navigation', era: 6,
    cost: { starSystems: 5, research: 65, darkEnergy: 20 },
    effects: [
      { type: 'production_mult', target: 'starSystems', value: 2 },
      { type: 'cap_mult', target: 'starSystems', value: 3 },
    ],
    description: 'Better navigation doubles star system discovery and triples capacity',
    prerequisites: ['warpDrive'],
  },
  galacticMining: {
    id: 'galacticMining', name: 'Galactic Mining', era: 6,
    cost: { starSystems: 6, exoticMaterials: 50, labor: 150 },
    effects: [
      { type: 'production_mult', target: 'exoticMaterials', value: 5 },
      { type: 'production_add', target: 'materials', value: 5 },
    ],
    description: 'Mine across star systems — x5 exotic materials and +5 materials/s',
    prerequisites: ['dysonSwarms'],
  },
  subspaceRelay: {
    id: 'subspaceRelay', name: 'Subspace Relay', era: 6,
    cost: { darkEnergy: 30, electronics: 40, starSystems: 4 },
    effects: [
      { type: 'production_mult', target: 'software', value: 3 },
      { type: 'production_mult', target: 'data', value: 3 },
    ],
    description: 'Faster-than-light data relay — x3 software and data across the stars',
    prerequisites: ['aiGovernance'],
  },
  warpConduit: {
    id: 'warpConduit', name: 'Warp Conduit', era: 6,
    cost: { darkEnergy: 35, starSystems: 5, steel: 300 },
    effects: [
      { type: 'production_mult', target: 'darkEnergy', value: 3 },
      { type: 'cap_mult', target: 'darkEnergy', value: 5 },
    ],
    description: 'Permanent warp conduits triple dark energy and expand capacity',
    prerequisites: ['dysonSwarms'],
  },
  xenoArchaeology: {
    id: 'xenoArchaeology', name: 'Xeno-Archaeology', era: 6,
    cost: { starSystems: 4, research: 70, data: 30 },
    effects: [
      { type: 'production_add', target: 'exoticMaterials', value: 1 },
      { type: 'production_mult', target: 'research', value: 2 },
    ],
    description: 'Ancient alien ruins yield exotic materials and knowledge',
    prerequisites: ['stellarCartography'],
  },
  fusionReactor: {
    id: 'fusionReactor', name: 'Fusion Reactor', era: 6,
    cost: { darkEnergy: 25, energy: 150, research: 80 },
    effects: [
      { type: 'production_mult', target: 'energy', value: 10 },
      { type: 'production_add', target: 'darkEnergy', value: 0.5 },
    ],
    description: 'Interstellar fusion — x10 energy and bonus dark energy',
    prerequisites: ['warpDrive'],
  },
  diplomaticCorps: {
    id: 'diplomaticCorps', name: 'Diplomatic Corps', era: 6,
    cost: { galacticInfluence: 20, food: 200, labor: 100 },
    effects: [
      { type: 'production_add', target: 'galacticInfluence', value: 1 },
      { type: 'production_mult', target: 'food', value: 3 },
    ],
    description: 'Build diplomatic relations — influence and food production soar',
    prerequisites: ['aiGovernance'],
  },
  interstellarBeacon: {
    id: 'interstellarBeacon', name: 'Interstellar Beacon', era: 6,
    cost: { darkEnergy: 40, starSystems: 6, research: 80 },
    effects: [
      { type: 'production_add', target: 'starSystems', value: 0.3 },
      { type: 'production_mult', target: 'research', value: 3 },
    ],
    description: 'Broadcast across the stars — attract systems and amplify research',
    prerequisites: ['dysonSwarms'],
  },
  microchipFab: {
    id: 'microchipFab', name: 'Microchip Fab', era: 2,
    cost: { electronics: 20, steel: 15, energy: 15 },
    effects: [
      { type: 'production_mult', target: 'electronics', value: 3 },
    ],
    description: 'Dedicated fabrication triples electronics output',
    prerequisites: ['assemblyLines'],
  },
  brickworks: {
    id: 'brickworks', name: 'Brickworks', era: 1,
    cost: { materials: 18, energy: 10, labor: 8 },
    effects: [
      { type: 'production_add', target: 'materials', value: 0.3 },
      { type: 'cap_mult', target: 'labor', value: 2 },
    ],
    description: 'Brick production boosts materials and doubles labor capacity',
    prerequisites: ['basicPower'],
  },
  marketplace: {
    id: 'marketplace', name: 'Marketplace', era: 1,
    cost: { food: 18, materials: 12, labor: 8 },
    effects: [
      { type: 'production_mult', target: 'food', value: 2 },
      { type: 'production_mult', target: 'materials', value: 2 },
    ],
    description: 'A bustling marketplace doubles food and material trade',
    prerequisites: ['housing'],
  },
  granary: {
    id: 'granary', name: 'Granary', era: 1,
    cost: { food: 25, materials: 15, labor: 10 },
    effects: [
      { type: 'cap_mult', target: 'food', value: 3 },
      { type: 'production_add', target: 'food', value: 0.3 },
    ],
    description: 'Store food for lean times — triple capacity and steady supply',
    prerequisites: ['irrigation'],
  },
  quarry: {
    id: 'quarry', name: 'Quarry', era: 1,
    cost: { materials: 20, labor: 12, energy: 8 },
    effects: [
      { type: 'production_add', target: 'materials', value: 0.5 },
      { type: 'cap_mult', target: 'materials', value: 3 },
    ],
    description: 'A stone quarry boosts materials and triples storage',
    prerequisites: ['tools'],
  },
  animalHusbandry: {
    id: 'animalHusbandry', name: 'Animal Husbandry', era: 1,
    cost: { food: 15, labor: 8, materials: 10 },
    effects: [
      { type: 'production_add', target: 'food', value: 0.5 },
      { type: 'production_add', target: 'labor', value: 0.3 },
    ],
    description: 'Domesticated animals provide food and labor',
    prerequisites: ['irrigation'],
  },
  waterMill: {
    id: 'waterMill', name: 'Water Mill', era: 1,
    cost: { materials: 15, energy: 5, labor: 10 },
    effects: [
      { type: 'production_mult', target: 'energy', value: 2 },
      { type: 'production_add', target: 'food', value: 0.3 },
    ],
    description: 'Water-powered mills double energy and grind grain for food',
    prerequisites: ['basicPower'],
  },
  tradePost: {
    id: 'tradePost', name: 'Trade Post', era: 1,
    cost: { materials: 25, food: 20 },
    effects: [
      { type: 'production_add', target: 'food', value: 0.5 },
      { type: 'production_add', target: 'materials', value: 0.3 },
    ],
    description: 'A trading post generates food and materials from passing travelers',
    prerequisites: ['storehouse'],
  },
  printingPress: {
    id: 'printingPress', name: 'Printing Press', era: 2,
    cost: { steel: 12, materials: 15, labor: 15 },
    effects: [
      { type: 'production_add', target: 'research', value: 0.3 },
      { type: 'cap_mult', target: 'research', value: 2 },
    ],
    description: 'Mass printed books expand research capacity',
    prerequisites: ['computingLab'],
  },
  electricMotor: {
    id: 'electricMotor', name: 'Electric Motor', era: 2,
    cost: { electronics: 12, steel: 15, energy: 12 },
    effects: [
      { type: 'production_mult', target: 'labor', value: 2 },
      { type: 'production_add', target: 'energy', value: 0.3 },
    ],
    description: 'Electric motors double labor efficiency',
    prerequisites: ['powerGrid'],
  },
  steelRefinery: {
    id: 'steelRefinery', name: 'Steel Refinery', era: 2,
    cost: { steel: 30, energy: 20, labor: 25 },
    effects: [
      { type: 'production_mult', target: 'steel', value: 2 },
      { type: 'cap_mult', target: 'steel', value: 3 },
    ],
    description: 'Refined smelting doubles steel and triples storage',
    prerequisites: ['assemblyLines'],
  },
  chemicalPlant: {
    id: 'chemicalPlant', name: 'Chemical Plant', era: 2,
    cost: { steel: 18, energy: 15, materials: 20 },
    effects: [
      { type: 'production_add', target: 'energy', value: 0.5 },
      { type: 'production_mult', target: 'materials', value: 2 },
    ],
    description: 'Chemical processing doubles materials and generates energy',
    prerequisites: ['powerGrid'],
  },
  telephoneNetwork: {
    id: 'telephoneNetwork', name: 'Telephone Network', era: 2,
    cost: { electronics: 15, steel: 20, energy: 12 },
    effects: [
      { type: 'production_add', target: 'research', value: 0.3 },
      { type: 'production_mult', target: 'labor', value: 2 },
    ],
    description: 'Instant communication doubles labor efficiency',
    prerequisites: ['computingLab'],
  },
  textileFactory: {
    id: 'textileFactory', name: 'Textile Factory', era: 2,
    cost: { steel: 12, food: 15, labor: 20 },
    effects: [
      { type: 'production_add', target: 'labor', value: 1 },
      { type: 'production_mult', target: 'food', value: 2 },
    ],
    description: 'Textile manufacturing attracts workers and boosts food supply chains',
    prerequisites: ['assemblyLines'],
  },
  coalMine: {
    id: 'coalMine', name: 'Coal Mine', era: 2,
    cost: { materials: 20, labor: 20, steel: 10 },
    effects: [
      { type: 'production_mult', target: 'energy', value: 2 },
      { type: 'production_add', target: 'materials', value: 0.3 },
    ],
    description: 'Deep coal mining doubles energy and produces materials',
    prerequisites: ['powerGrid'],
  },
  communalKitchen: {
    id: 'communalKitchen', name: 'Communal Kitchen', era: 1,
    cost: { food: 20, materials: 15, labor: 10 },
    effects: [
      { type: 'production_mult', target: 'food', value: 3 },
      { type: 'production_add', target: 'labor', value: 0.5 },
    ],
    description: 'Shared meals triple food output and provide extra labor',
    prerequisites: ['irrigation'],
  },
  deepMining: {
    id: 'deepMining', name: 'Deep Mining', era: 1,
    cost: { materials: 35, energy: 20, labor: 15 },
    effects: [
      { type: 'production_add', target: 'materials', value: 1 },
      { type: 'production_mult', target: 'energy', value: 2 },
    ],
    description: 'Dig deeper for rare ores — more materials and energy',
    prerequisites: ['foundry'],
  },
  socialMedia: {
    id: 'socialMedia', name: 'Social Media', era: 3,
    cost: { software: 15, data: 10, electronics: 15 },
    effects: [
      { type: 'production_mult', target: 'data', value: 2 },
      { type: 'production_add', target: 'software', value: 0.3 },
    ],
    description: 'Social networks double data generation',
    prerequisites: ['internet'],
  },
  machinelearning: {
    id: 'machinelearning', name: 'Machine Learning', era: 3,
    cost: { data: 15, software: 18, research: 25 },
    effects: [
      { type: 'production_mult', target: 'research', value: 2 },
      { type: 'production_mult', target: 'data', value: 2 },
    ],
    description: 'ML algorithms double research and data analysis',
    prerequisites: ['aiResearch'],
  },
  virtualReality: {
    id: 'virtualReality', name: 'Virtual Reality', era: 3,
    cost: { software: 25, electronics: 20, research: 20 },
    effects: [
      { type: 'production_mult', target: 'software', value: 2 },
      { type: 'production_add', target: 'data', value: 0.5 },
    ],
    description: 'VR doubles software output and generates data from simulations',
    prerequisites: ['openSource'],
  },
  cloudStorage: {
    id: 'cloudStorage', name: 'Cloud Storage', era: 3,
    cost: { data: 15, electronics: 20, energy: 15 },
    effects: [
      { type: 'cap_mult', target: 'data', value: 3 },
      { type: 'cap_mult', target: 'software', value: 3 },
      { type: 'production_add', target: 'data', value: 0.3 },
    ],
    description: 'Distributed cloud storage expands digital capacity',
    prerequisites: ['cloudComputing'],
  },
  blockchain: {
    id: 'blockchain', name: 'Blockchain', era: 3,
    cost: { software: 20, electronics: 15, data: 10 },
    effects: [
      { type: 'production_mult', target: 'electronics', value: 2 },
      { type: 'cap_mult', target: 'data', value: 5 },
    ],
    description: 'Decentralized ledger doubles electronics and expands data capacity',
    prerequisites: ['openSource'],
  },
  robotics: {
    id: 'robotics', name: 'Robotics', era: 3,
    cost: { electronics: 30, research: 25, steel: 15 },
    effects: [
      { type: 'production_mult', target: 'labor', value: 3 },
      { type: 'production_add', target: 'electronics', value: 0.5 },
    ],
    description: 'Robotic automation triples labor and generates electronics',
    prerequisites: ['aiResearch'],
  },
  bigData: {
    id: 'bigData', name: 'Big Data', era: 3,
    cost: { data: 20, software: 15, electronics: 25 },
    effects: [
      { type: 'production_mult', target: 'data', value: 3 },
      { type: 'production_add', target: 'research', value: 1 },
    ],
    description: 'Massive data analysis triples data output and boosts research',
    prerequisites: ['aiResearch'],
  },
  encryptionProtocol: {
    id: 'encryptionProtocol', name: 'Encryption Protocol', era: 3,
    cost: { software: 20, data: 12, electronics: 20 },
    effects: [
      { type: 'production_mult', target: 'data', value: 2 },
      { type: 'cap_mult', target: 'software', value: 3 },
    ],
    description: 'Secure data doubles production and triples software capacity',
    prerequisites: ['cyberSecurity'],
  },
  suborbitalFlight: {
    id: 'suborbitalFlight', name: 'Suborbital Flight', era: 3,
    cost: { research: 35, steel: 20, energy: 25 },
    effects: [
      { type: 'production_add', target: 'research', value: 1 },
      { type: 'cap_mult', target: 'research', value: 2 },
    ],
    description: 'Suborbital experiments boost research output and capacity',
    prerequisites: ['quantumComputing'],
  },
  solarWindCollector: {
    id: 'solarWindCollector', name: 'Solar Wind Collector', era: 5,
    cost: { energy: 50, exoticMaterials: 10, orbitalInfra: 15 },
    effects: [
      { type: 'production_add', target: 'energy', value: 3 },
      { type: 'production_add', target: 'exoticMaterials', value: 0.2 },
    ],
    description: 'Harvest solar wind for energy and trace exotic materials',
    prerequisites: ['fusionPower'],
  },
  oortCloudMining: {
    id: 'oortCloudMining', name: 'Oort Cloud Mining', era: 5,
    cost: { rocketFuel: 40, exoticMaterials: 12, research: 35 },
    effects: [
      { type: 'production_add', target: 'exoticMaterials', value: 0.5 },
      { type: 'production_add', target: 'rocketFuel', value: 0.3 },
    ],
    description: 'Mine the Oort Cloud for exotic materials and fuel',
    prerequisites: ['antimatterDrive'],
  },
  ringStation: {
    id: 'ringStation', name: 'Ring Station', era: 5,
    cost: { orbitalInfra: 20, exoticMaterials: 20, steel: 70 },
    effects: [
      { type: 'production_mult', target: 'orbitalInfra', value: 3 },
      { type: 'production_add', target: 'exoticMaterials', value: 0.5 },
    ],
    description: 'A rotating ring station triples orbital infrastructure',
    prerequisites: ['asteroidMining'],
  },
  spaceHabitat: {
    id: 'spaceHabitat', name: 'Space Habitat', era: 5,
    cost: { orbitalInfra: 25, food: 70, steel: 60 },
    effects: [
      { type: 'production_add', target: 'labor', value: 3 },
      { type: 'production_add', target: 'food', value: 2 },
    ],
    description: 'Self-sustaining habitats in space — labor and food in orbit',
    prerequisites: ['terraforming'],
  },
  outerPlanetsMission: {
    id: 'outerPlanetsMission', name: 'Outer Planets Mission', era: 5,
    cost: { rocketFuel: 50, research: 45, orbitalInfra: 15 },
    effects: [
      { type: 'production_add', target: 'research', value: 1.5 },
      { type: 'production_add', target: 'data', value: 1 },
    ],
    description: 'Missions to outer planets yield research and data breakthroughs',
    prerequisites: ['geneticEngineering'],
  },
  dysonBubble: {
    id: 'dysonBubble', name: 'Dyson Bubble', era: 5,
    cost: { exoticMaterials: 25, energy: 70, research: 45 },
    effects: [
      { type: 'production_mult', target: 'energy', value: 5 },
      { type: 'cap_mult', target: 'energy', value: 5 },
    ],
    description: 'A proto-Dyson structure — x5 energy production and capacity',
    prerequisites: ['fusionPower'],
  },
  titanMining: {
    id: 'titanMining', name: 'Titan Mining', era: 5,
    cost: { colonies: 3, rocketFuel: 45, exoticMaterials: 15 },
    effects: [
      { type: 'production_add', target: 'exoticMaterials', value: 0.8 },
      { type: 'production_mult', target: 'rocketFuel', value: 2 },
    ],
    description: 'Mine methane lakes on Titan for exotic materials and fuel',
    prerequisites: ['asteroidMining'],
  },
  marsColony: {
    id: 'marsColony', name: 'Mars Colony', era: 5,
    cost: { colonies: 2, rocketFuel: 30, food: 50, steel: 80 },
    effects: [
      { type: 'production_mult', target: 'colonies', value: 2 },
      { type: 'production_add', target: 'research', value: 1 },
    ],
    description: 'Establish on Mars — double colony output and boost research',
    prerequisites: ['terraforming'],
  },
  jupiterOutpost: {
    id: 'jupiterOutpost', name: 'Jupiter Outpost', era: 5,
    cost: { orbitalInfra: 20, rocketFuel: 35, food: 60 },
    effects: [
      { type: 'production_add', target: 'exoticMaterials', value: 0.5 },
      { type: 'production_add', target: 'rocketFuel', value: 0.3 },
    ],
    description: 'Outpost on Jupiter harvests atmospheric resources',
    prerequisites: ['asteroidMining'],
  },
  heliumMining: {
    id: 'heliumMining', name: 'Helium-3 Mining', era: 5,
    cost: { colonies: 4, rocketFuel: 40, research: 40 },
    effects: [
      { type: 'production_mult', target: 'energy', value: 5 },
      { type: 'production_add', target: 'rocketFuel', value: 0.5 },
    ],
    description: 'Mine lunar helium-3 for clean fusion fuel',
    prerequisites: ['fusionPower'],
  },
  exoplanetSurvey: {
    id: 'exoplanetSurvey', name: 'Exoplanet Survey', era: 5,
    cost: { orbitalInfra: 25, research: 50, rocketFuel: 30 },
    effects: [
      { type: 'production_add', target: 'colonies', value: 0.3 },
      { type: 'production_mult', target: 'exoticMaterials', value: 2 },
    ],
    description: 'Survey distant planets — discover new colonies and materials',
    prerequisites: ['terraforming'],
  },
  galacticAcademy: {
    id: 'galacticAcademy', name: 'Galactic Academy', era: 8,
    cost: { galacticInfluence: 60, research: 150, data: 40 },
    effects: [
      { type: 'production_mult', target: 'research', value: 5 },
      { type: 'production_add', target: 'software', value: 3 },
    ],
    description: 'Galaxy-spanning academy — x5 research and +3 software/s',
    prerequisites: ['culturalAssimilation'],
  },
  wormholeGenerator: {
    id: 'wormholeGenerator', name: 'Wormhole Generator', era: 8,
    cost: { exoticMatter: 30, darkEnergy: 60, research: 160 },
    effects: [
      { type: 'production_mult', target: 'starSystems', value: 3 },
      { type: 'production_add', target: 'exoticMatter', value: 1 },
    ],
    description: 'Generate stable wormholes — x3 star systems',
    prerequisites: ['wormholeNetwork'],
  },
  civilizationNetwork: {
    id: 'civilizationNetwork', name: 'Civilization Network', era: 8,
    cost: { galacticInfluence: 80, starSystems: 20, research: 140 },
    effects: [
      { type: 'production_mult', target: 'galacticInfluence', value: 2 },
      { type: 'production_mult', target: 'research', value: 2 },
      { type: 'production_add', target: 'data', value: 2 },
    ],
    description: 'Connect all civilizations — double influence and research',
    prerequisites: ['galacticSenate'],
  },
  cosmicForge: {
    id: 'cosmicForge', name: 'Cosmic Forge', era: 8,
    cost: { exoticMatter: 35, cosmicPower: 12, stellarForge: 20 },
    effects: [
      { type: 'production_mult', target: 'stellarForge', value: 5 },
      { type: 'production_add', target: 'exoticMaterials', value: 3 },
    ],
    description: 'Forge matter at cosmic scale — x5 stellar forge',
    prerequisites: ['matterReplicators'],
  },
  darkMatterConduit: {
    id: 'darkMatterConduit', name: 'Dark Matter Conduit', era: 8,
    cost: { darkEnergy: 70, exoticMatter: 30, research: 170 },
    effects: [
      { type: 'production_mult', target: 'darkEnergy', value: 3 },
      { type: 'production_add', target: 'cosmicPower', value: 1 },
    ],
    description: 'Channel dark matter for dark energy and cosmic power',
    prerequisites: ['matterReplicators'],
  },
  galacticHighway: {
    id: 'galacticHighway', name: 'Galactic Highway', era: 8,
    cost: { starSystems: 25, galacticInfluence: 70, darkEnergy: 60 },
    effects: [
      { type: 'production_mult', target: 'starSystems', value: 3 },
      { type: 'production_mult', target: 'galacticInfluence', value: 2 },
    ],
    description: 'Highways between star systems — x3 systems and x2 influence',
    prerequisites: ['wormholeNetwork'],
  },
  quantumFabric: {
    id: 'quantumFabric', name: 'Quantum Fabric', era: 8,
    cost: { exoticMatter: 25, research: 160, cosmicPower: 10 },
    effects: [
      { type: 'production_mult', target: 'exoticMatter', value: 3 },
      { type: 'production_mult', target: 'research', value: 3 },
    ],
    description: 'Weave quantum fabric — triple exotic matter and research',
    prerequisites: ['culturalAssimilation'],
  },
  singularityHarvester: {
    id: 'singularityHarvester', name: 'Singularity Harvester', era: 8,
    cost: { exoticMatter: 20, galacticInfluence: 50, darkEnergy: 50 },
    effects: [
      { type: 'production_add', target: 'exoticMatter', value: 2 },
      { type: 'production_add', target: 'cosmicPower', value: 1 },
    ],
    description: 'Harvest energy from black hole singularities',
    prerequisites: ['wormholeNetwork'],
  },
  antimatterForge: {
    id: 'antimatterForge', name: 'Antimatter Forge', era: 8,
    cost: { exoticMatter: 30, cosmicPower: 15, energy: 250 },
    effects: [
      { type: 'production_mult', target: 'exoticMatter', value: 2 },
      { type: 'production_mult', target: 'energy', value: 5 },
    ],
    description: 'Forge antimatter for massive energy and exotic matter output',
    prerequisites: ['matterReplicators'],
  },
  galacticLibrary: {
    id: 'galacticLibrary', name: 'Galactic Library', era: 8,
    cost: { galacticInfluence: 60, research: 150, data: 50 },
    effects: [
      { type: 'production_mult', target: 'research', value: 3 },
      { type: 'production_mult', target: 'data', value: 3 },
      { type: 'production_add', target: 'galacticInfluence', value: 1 },
    ],
    description: 'A library spanning the galaxy — knowledge and influence grow together',
    prerequisites: ['galacticSenate'],
  },
  quantumTunneling: {
    id: 'quantumTunneling', name: 'Quantum Tunneling', era: 8,
    cost: { exoticMatter: 25, darkEnergy: 40, research: 180 },
    effects: [
      { type: 'production_mult', target: 'starSystems', value: 5 },
      { type: 'production_add', target: 'exoticMatter', value: 1 },
    ],
    description: 'Tunnel through spacetime — rapidly expand star system reach',
    prerequisites: ['wormholeNetwork'],
  },
  neuralProcessor: {
    id: 'neuralProcessor', name: 'Neural Processor', era: 6,
    cost: { electronics: 50, research: 70, starSystems: 5 },
    effects: [
      { type: 'production_mult', target: 'electronics', value: 5 },
      { type: 'production_mult', target: 'software', value: 5 },
    ],
    description: 'Interstellar neural computing — x5 electronics and software',
    prerequisites: ['stellarCartography'],
  },
  energyMatrix: {
    id: 'energyMatrix', name: 'Energy Matrix', era: 3,
    cost: { electronics: 35, energy: 25, data: 10 },
    effects: [
      { type: 'production_mult', target: 'energy', value: 2 },
      { type: 'cap_mult', target: 'energy', value: 3 },
    ],
    description: 'Digital energy management doubles output and triples capacity',
    prerequisites: ['cloudComputing'],
  },
  cosmicFarming: {
    id: 'cosmicFarming', name: 'Cosmic Farming', era: 9,
    cost: { cosmicPower: 60, colonies: 15, food: 500 },
    effects: [
      { type: 'production_add', target: 'food', value: 50 },
      { type: 'production_add', target: 'labor', value: 10 },
      { type: 'production_add', target: 'colonies', value: 0.5 },
    ],
    description: 'Cosmic-scale agriculture — massive food, labor, and colony output',
    prerequisites: ['cosmicInfrastructure'],
  },

  veteranWisdom: {
    id: 'veteranWisdom', name: 'Veteran Wisdom', era: 1,
    cost: { labor: 5, food: 5 },
    effects: [
      { type: 'production_mult', target: 'labor', value: 2 },
      { type: 'production_mult', target: 'food', value: 2 },
      { type: 'production_mult', target: 'materials', value: 2 },
      { type: 'production_mult', target: 'energy', value: 2 },
    ],
    description: 'Past-life knowledge doubles all Era 1 production (prestige-only)',
    prerequisites: [],
    requirePrestige: 1,
  },
  temporalEcho: {
    id: 'temporalEcho', name: 'Temporal Echo', era: 3,
    cost: { research: 15, software: 10 },
    effects: [
      { type: 'production_mult', target: 'research', value: 5 },
      { type: 'production_mult', target: 'data', value: 5 },
    ],
    description: 'Echoes from past timelines accelerate digital progress (prestige-only)',
    prerequisites: ['internet'],
    requirePrestige: 1,
  },
  industrialMemory: {
    id: 'industrialMemory', name: 'Industrial Memory', era: 2,
    cost: { steel: 10, electronics: 5 },
    effects: [
      { type: 'production_mult', target: 'steel', value: 3 },
      { type: 'production_mult', target: 'electronics', value: 3 },
    ],
    description: 'Remember industrial techniques — triple steel and electronics (prestige-only)',
    prerequisites: ['assemblyLines'],
    requirePrestige: 1,
  },
  spaceMemory: {
    id: 'spaceMemory', name: 'Space Memory', era: 4,
    cost: { rocketFuel: 5, orbitalInfra: 3 },
    effects: [
      { type: 'production_mult', target: 'rocketFuel', value: 3 },
      { type: 'production_mult', target: 'orbitalInfra', value: 3 },
    ],
    description: 'Remember spacefaring techniques — triple fuel and orbital output (prestige-only)',
    prerequisites: ['rocketScience'],
    requirePrestige: 1,
  },
  cosmicRecollection: {
    id: 'cosmicRecollection', name: 'Cosmic Recollection', era: 6,
    cost: { darkEnergy: 10, starSystems: 3 },
    effects: [
      { type: 'production_mult', target: 'starSystems', value: 5 },
      { type: 'production_mult', target: 'darkEnergy', value: 5 },
    ],
    description: 'Remember the cosmos from past lives (prestige-only)',
    prerequisites: ['warpDrive'],
    requirePrestige: 1,
  },
  multiversalMemory: {
    id: 'multiversalMemory', name: 'Multiversal Memory', era: 9,
    cost: { cosmicPower: 50, universalConstants: 3 },
    effects: [
      { type: 'production_mult', target: 'cosmicPower', value: 10 },
      { type: 'production_mult', target: 'universalConstants', value: 10 },
    ],
    description: 'Remember the multiverse from past lives (prestige-only)',
    prerequisites: ['galaxySeeding'],
    requirePrestige: 2,
  },

  // --- New upgrades ---

  // Era 1
  potteryKiln: {
    id: 'potteryKiln', name: 'Pottery Kiln', era: 1,
    cost: { materials: 22, energy: 12, labor: 10 },
    effects: [
      { type: 'cap_mult', target: 'food', value: 2 },
      { type: 'production_add', target: 'materials', value: 0.4 },
    ],
    description: 'Fired clay vessels expand food storage and generate materials',
    prerequisites: ['basicPower'],
  },
  lumberMill: {
    id: 'lumberMill', name: 'Lumber Mill', era: 1,
    cost: { materials: 28, labor: 14, energy: 10 },
    effects: [
      { type: 'production_mult', target: 'materials', value: 2 },
      { type: 'production_add', target: 'energy', value: 0.4 },
    ],
    description: 'Processed lumber doubles material output and fuels energy',
    prerequisites: ['tools'],
  },

  // Era 2
  hydraulicPress: {
    id: 'hydraulicPress', name: 'Hydraulic Press', era: 2,
    cost: { steel: 22, energy: 18, labor: 15 },
    effects: [
      { type: 'production_mult', target: 'steel', value: 2 },
      { type: 'production_add', target: 'materials', value: 0.5 },
    ],
    description: 'Hydraulic forging doubles steel and produces raw materials',
    prerequisites: ['steamTurbine'],
  },
  telegraphLine: {
    id: 'telegraphLine', name: 'Telegraph Line', era: 2,
    cost: { electronics: 10, steel: 12, energy: 10 },
    effects: [
      { type: 'production_add', target: 'research', value: 0.4 },
      { type: 'production_mult', target: 'electronics', value: 2 },
    ],
    description: 'Long-distance communication accelerates research and electronics',
    prerequisites: ['computingLab'],
  },

  // Era 3
  neuralNetwork: {
    id: 'neuralNetwork', name: 'Neural Network', era: 3,
    cost: { data: 18, software: 22, research: 30 },
    effects: [
      { type: 'production_mult', target: 'software', value: 2 },
      { type: 'production_mult', target: 'research', value: 2 },
    ],
    description: 'Deep neural networks double software and research output',
    prerequisites: ['machinelearning'],
  },
  edgeComputing: {
    id: 'edgeComputing', name: 'Edge Computing', era: 3,
    cost: { electronics: 25, data: 12, energy: 18 },
    effects: [
      { type: 'production_mult', target: 'data', value: 2 },
      { type: 'production_add', target: 'electronics', value: 0.5 },
    ],
    description: 'Distributed edge nodes double data output and produce electronics',
    prerequisites: ['cloudComputing'],
  },

  // Era 4
  orbitalFactory: {
    id: 'orbitalFactory', name: 'Orbital Factory', era: 4,
    cost: { orbitalInfra: 12, steel: 35, electronics: 20 },
    effects: [
      { type: 'production_mult', target: 'steel', value: 3 },
      { type: 'production_add', target: 'orbitalInfra', value: 0.3 },
    ],
    description: 'Manufacturing in zero-g triples steel and builds orbital infrastructure',
    prerequisites: ['spaceStation'],
  },
  marsRover: {
    id: 'marsRover', name: 'Mars Rover', era: 4,
    cost: { rocketFuel: 18, electronics: 20, research: 20 },
    effects: [
      { type: 'production_add', target: 'research', value: 0.5 },
      { type: 'production_add', target: 'data', value: 0.3 },
    ],
    description: 'Robotic rovers on Mars discover new data and boost research',
    prerequisites: ['rocketScience'],
  },

  // Era 5
  cryogenicStorage: {
    id: 'cryogenicStorage', name: 'Cryogenic Storage', era: 5,
    cost: { exoticMaterials: 15, energy: 40, research: 30 },
    effects: [
      { type: 'cap_mult', target: 'rocketFuel', value: 5 },
      { type: 'cap_mult', target: 'exoticMaterials', value: 3 },
    ],
    description: 'Cryo-tanks massively expand fuel and exotic material storage',
    prerequisites: ['fusionPower'],
  },
  solarSail: {
    id: 'solarSail', name: 'Solar Sail Fleet', era: 5,
    cost: { exoticMaterials: 18, energy: 45, orbitalInfra: 15 },
    effects: [
      { type: 'production_mult', target: 'colonies', value: 2 },
      { type: 'production_add', target: 'energy', value: 2 },
    ],
    description: 'Light-propelled fleets double colony growth and harvest solar energy',
    prerequisites: ['asteroidMining'],
  },

  // Era 6
  hyperdriveCore: {
    id: 'hyperdriveCore', name: 'Hyperdrive Core', era: 6,
    cost: { darkEnergy: 30, exoticMaterials: 40, research: 75 },
    effects: [
      { type: 'production_mult', target: 'starSystems', value: 2 },
      { type: 'production_mult', target: 'darkEnergy', value: 2 },
    ],
    description: 'Upgraded hyperdrive doubles star system discovery and dark energy',
    prerequisites: ['warpDrive'],
  },
  xenoBotany: {
    id: 'xenoBotany', name: 'Xeno-Botany', era: 6,
    cost: { starSystems: 4, food: 200, research: 60 },
    effects: [
      { type: 'production_mult', target: 'food', value: 5 },
      { type: 'production_add', target: 'exoticMaterials', value: 0.5 },
    ],
    description: 'Alien plant life revolutionizes food production and yields exotic materials',
    prerequisites: ['stellarCartography'],
  },

  // Era 7
  stellarComputer: {
    id: 'stellarComputer', name: 'Stellar Computer', era: 7,
    cost: { stellarForge: 14, megastructures: 6, research: 90 },
    effects: [
      { type: 'production_mult', target: 'data', value: 5 },
      { type: 'production_mult', target: 'software', value: 5 },
    ],
    description: 'Computing at stellar scale — x5 data and software',
    prerequisites: ['matrioshkaBrain'],
  },
  photonSail: {
    id: 'photonSail', name: 'Photon Sail Armada', era: 7,
    cost: { megastructures: 5, darkEnergy: 35, energy: 200 },
    effects: [
      { type: 'production_add', target: 'starSystems', value: 0.3 },
      { type: 'production_mult', target: 'colonies', value: 5 },
    ],
    description: 'Light-speed armada colonizes new stars rapidly',
    prerequisites: ['dysonSphere'],
  },

  // Era 8
  cosmicSentinel: {
    id: 'cosmicSentinel', name: 'Cosmic Sentinel', era: 8,
    cost: { galacticInfluence: 70, exoticMatter: 30, darkEnergy: 50 },
    effects: [
      { type: 'production_mult', target: 'galacticInfluence', value: 3 },
      { type: 'cap_mult', target: 'galacticInfluence', value: 5 },
    ],
    description: 'Galaxy-guarding sentinels triple influence and expand its capacity',
    prerequisites: ['galacticSenate'],
  },
  neutroniumRefinery: {
    id: 'neutroniumRefinery', name: 'Neutronium Refinery', era: 8,
    cost: { exoticMatter: 25, stellarForge: 15, energy: 200 },
    effects: [
      { type: 'production_mult', target: 'exoticMatter', value: 3 },
      { type: 'production_add', target: 'stellarForge', value: 1 },
    ],
    description: 'Refine neutron star matter for exotic materials and forge output',
    prerequisites: ['darkMatterHarvest'],
  },

  // Era 9
  cosmicLoom: {
    id: 'cosmicLoom', name: 'Cosmic Loom', era: 9,
    cost: { universalConstants: 12, cosmicPower: 110, realityFragments: 6 },
    effects: [
      { type: 'production_add', target: 'realityFragments', value: 0.8 },
      { type: 'production_mult', target: 'universalConstants', value: 3 },
    ],
    description: 'Weave cosmic threads into reality fragments and amplify constants',
    prerequisites: ['entropyReversal'],
  },
  galacticSeed: {
    id: 'galacticSeed', name: 'Galactic Seed', era: 9,
    cost: { cosmicPower: 70, exoticMatter: 50, colonies: 20 },
    effects: [
      { type: 'production_mult', target: 'colonies', value: 10 },
      { type: 'production_add', target: 'cosmicPower', value: 2 },
    ],
    description: 'Seed entire galaxies with civilizations — massive colony and power boost',
    prerequisites: ['galaxySeeding'],
  },

  // Era 10
  realityCompiler: {
    id: 'realityCompiler', name: 'Reality Compiler', era: 10,
    cost: { quantumEchoes: 60, universalConstants: 20, realityFragments: 90 },
    effects: [
      { type: 'production_mult', target: 'realityFragments', value: 5 },
      { type: 'production_mult', target: 'quantumEchoes', value: 3 },
    ],
    description: 'Compile raw reality into structured fragments — x5 fragments and x3 echoes',
    prerequisites: ['parallelProcessing'],
  },
  omniversalBeacon: {
    id: 'omniversalBeacon', name: 'Omniversal Beacon', era: 10,
    cost: { quantumEchoes: 110, realityFragments: 160, cosmicPower: 450 },
    effects: [
      { type: 'production_mult', target: 'cosmicPower', value: 15 },
      { type: 'production_add', target: 'universalConstants', value: 3 },
    ],
    description: 'Broadcast across every reality — x15 cosmic power and +3 constants/s',
    prerequisites: ['omniscienceEngine'],
  },
};

export function getUpgradesForEra(era) {
  return Object.values(upgrades).filter(u => u.era <= era);
}
