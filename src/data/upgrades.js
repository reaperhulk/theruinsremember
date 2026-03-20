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
    cost: { materials: 60, energy: 50, food: 30 },
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
      { type: 'production_add', target: 'materials', value: 0.2 },
      { type: 'production_add', target: 'energy', value: 0.3 },
    ],
    description: 'Better tools double materials again and generate energy',
    prerequisites: ['foundry'],
  },
  gemPolisher: {
    id: 'gemPolisher', name: 'Gem Polisher', era: 1,
    cost: { materials: 15, energy: 10 },
    effects: [
      { type: 'production_add', target: 'materials', value: 0.4 },
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
      { type: 'production_add', target: 'research', value: 0.4 },
      { type: 'production_add', target: 'software', value: 0.4 },
    ],
    description: 'Find 20 gems to unlock — deep gem knowledge doubles research & software',
    prerequisites: ['internet'],
    requireGems: 20,
  },
  traderInstinct: {
    id: 'traderInstinct', name: 'Trader Instinct', era: 6,
    cost: { galacticInfluence: 20, starSystems: 5 },
    effects: [
      { type: 'production_add', target: 'galacticInfluence', value: 1.6 },
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
  steelForge: {
    id: 'steelForge', name: 'Steel Forge', era: 2,
    cost: { steel: 12, materials: 20, labor: 15 },
    effects: [
      { type: 'production_add', target: 'electronics', value: 0.1 },
      { type: 'production_add', target: 'steel', value: 0.3 },
    ],
    description: 'A dedicated steel forge doubles steel output and produces basic electronics',
    prerequisites: ['foundry'],
  },
  ironWorks: {
    id: 'ironWorks', name: 'Iron Works', era: 2,
    cost: { steel: 18, energy: 15, labor: 20 },
    effects: [
      { type: 'production_add', target: 'materials', value: 0.3 },
      { type: 'production_add', target: 'steel', value: 0.3 },
    ],
    description: 'Heavy industry doubles materials and boosts steel production',
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
    cost: { electronics: 30, energy: 40, food: 50 },
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
    prerequisites: ['printingPress'],
  },
  steamTurbine: {
    id: 'steamTurbine', name: 'Steam Turbine', era: 2,
    cost: { steel: 20, energy: 15, materials: 25 },
    effects: [
      { type: 'production_add', target: 'energy', value: 0.3 },
      { type: 'production_add', target: 'steel', value: 0.2 },
    ],
    description: 'Steam power boosts energy and steel production',
    prerequisites: ['coalMine'],
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
      { type: 'production_add', target: 'food', value: 0.6 },
    ],
    description: 'Mechanized agriculture triples food output',
    prerequisites: ['textileFactory'],
  },

  // Era 3: Digital Age
  internet: {
    id: 'internet', name: 'Internet', era: 3,
    cost: { electronics: 80, research: 60 },
    effects: [{ type: 'production_add', target: 'software', value: 0.5 }],
    description: 'Global communication network enables software development',
    prerequisites: ['computingLab'],
  },
  digitalSensors: {
    id: 'digitalSensors', name: 'Digital Sensors', era: 3,
    cost: { electronics: 40, research: 30, energy: 25 },
    effects: [
      { type: 'production_add', target: 'data', value: 0.5 },
      { type: 'cap_mult', target: 'data', value: 2 },
    ],
    description: 'Distributed sensors collect environmental data worldwide',
    prerequisites: ['computingLab'],
  },
  patternAnalysis: {
    id: 'patternAnalysis', name: 'Pattern Analysis', era: 3,
    cost: { research: 50, electronics: 35, steel: 15 },
    effects: [
      { type: 'production_add', target: 'research', value: 0.4 },
      { type: 'production_add', target: 'data', value: 0.4 },
    ],
    description: 'Statistical algorithms double research and data analysis',
    prerequisites: ['internet'],
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
    cost: { software: 40, research: 80, electronics: 50 },
    effects: [
      { type: 'production_mult', target: 'research', value: 3 },
      { type: 'production_add', target: 'data', value: 0.3 },
    ],
    description: 'Artificial intelligence accelerates research and generates data',
    prerequisites: ['patternAnalysis'],
  },
  quantumComputing: {
    id: 'quantumComputing', name: 'Quantum Computing', era: 3,
    cost: { data: 40, software: 80, research: 120 },
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
      { type: 'production_add', target: 'research', value: 0.4 },
      { type: 'cap_mult', target: 'data', value: 3 },
    ],
    description: 'Secure systems boost research and expand data storage',
    prerequisites: ['cloudStorage'],
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
  advancedMaterials: {
    id: 'advancedMaterials', name: 'Advanced Materials', era: 4,
    cost: { research: 40, steel: 35, data: 15 },
    effects: [
      { type: 'production_mult', target: 'steel', value: 3 },
      { type: 'production_mult', target: 'materials', value: 2 },
    ],
    description: 'Carbon nanotubes and metamaterials revolutionize construction',
    prerequisites: ['quantumComputing'],
  },
  missionControl: {
    id: 'missionControl', name: 'Mission Control', era: 4,
    cost: { software: 30, electronics: 25, research: 20 },
    effects: [
      { type: 'production_add', target: 'rocketFuel', value: 0.2 },
      { type: 'production_add', target: 'data', value: 0.3 },
    ],
    description: 'Coordinate space missions — steady fuel production and telemetry data',
    prerequisites: ['rocketScience'],
  },
  reusableRockets: {
    id: 'reusableRockets', name: 'Reusable Rockets', era: 4,
    cost: { rocketFuel: 15, steel: 30, research: 20, labor: 50 },
    effects: [{ type: 'production_add', target: 'rocketFuel', value: 0.6 }],
    description: 'Cheaper access to space',
    prerequisites: ['nuclearReactor'],
  },
  solarArrays: {
    id: 'solarArrays', name: 'Solar Arrays', era: 4,
    cost: { electronics: 25, steel: 20, energy: 15 },
    effects: [{ type: 'production_mult', target: 'energy', value: 5 }],
    description: 'Orbital solar panels multiply energy output',
    prerequisites: ['deepSpaceProbe'],
  },
  spaceStation: {
    id: 'spaceStation', name: 'Space Station', era: 4,
    cost: { rocketFuel: 60, steel: 80, electronics: 40, food: 120 },
    effects: [{ type: 'production_add', target: 'orbitalInfra', value: 0.5 }],
    description: 'Permanent orbital habitat',
    prerequisites: ['missionControl'],
  },
  orbitalTelescope: {
    id: 'orbitalTelescope', name: 'Orbital Telescope', era: 4,
    cost: { orbitalInfra: 10, electronics: 20, research: 15 },
    effects: [
      { type: 'production_add', target: 'research', value: 0.6 },
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
    cost: { orbitalInfra: 30, electronics: 60, research: 50 },
    effects: [
      { type: 'production_mult', target: 'electronics', value: 3 },
      { type: 'unlock_resource', target: 'exoticMaterials', value: 1 },
      { type: 'production_add', target: 'exoticMaterials', value: 0.2 },
    ],
    description: 'Manufacture in orbit — gateway to the solar system',
    prerequisites: ['spaceElevator'],
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
      { type: 'production_add', target: 'orbitalInfra', value: 0.6 },
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
    prerequisites: ['advancedMaterials'],
  },
  nuclearReactor: {
    id: 'nuclearReactor', name: 'Nuclear Reactor', era: 4,
    cost: { research: 35, steel: 40, electronics: 15 },
    effects: [
      { type: 'production_add', target: 'energy', value: 1.2 },
      { type: 'production_add', target: 'research', value: 0.3 },
    ],
    description: 'Nuclear fission triples energy and generates research data',
    prerequisites: ['deepSpaceProbe'],
  },
  satelliteNetwork: {
    id: 'satelliteNetwork', name: 'Satellite Network', era: 4,
    cost: { orbitalInfra: 12, electronics: 20, energy: 15 },
    effects: [
      { type: 'production_add', target: 'data', value: 1.2 },
      { type: 'production_add', target: 'research', value: 0.5 },
    ],
    description: 'Orbital satellites triple data collection and boost research',
    prerequisites: ['spaceStation'],
  },

  // Era 5: Solar System
  asteroidMining: {
    id: 'asteroidMining', name: 'Asteroid Mining', era: 5,
    cost: { orbitalInfra: 60, rocketFuel: 100, exoticMaterials: 20, materials: 400 },
    effects: [
      { type: 'production_add', target: 'exoticMaterials', value: 1 },
      { type: 'production_mult', target: 'materials', value: 5 },
    ],
    description: 'Mine the asteroid belt for resources',
    prerequisites: ['zeroGManufacturing'],
  },
  outerColony: {
    id: 'outerColony', name: 'Outer Colony', era: 5,
    cost: { orbitalInfra: 40, rocketFuel: 60, steel: 80 },
    effects: [
      { type: 'production_add', target: 'colonies', value: 0.1 },
      { type: 'production_add', target: 'exoticMaterials', value: 0.3 },
    ],
    description: 'Establish a colony on a nearby moon — first step to system-wide expansion',
    prerequisites: ['zeroGManufacturing'],
  },
  fuelRefinery: {
    id: 'fuelRefinery', name: 'Orbital Fuel Refinery', era: 5,
    cost: { rocketFuel: 50, research: 60, orbitalInfra: 25 },
    effects: [
      { type: 'production_add', target: 'energy', value: 4 },
      { type: 'production_add', target: 'rocketFuel', value: 0.5 },
    ],
    description: 'Refine fuel in orbit — massive energy and fuel boost',
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
    cost: { exoticMaterials: 60, research: 150, energy: 200, food: 250 },
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
    cost: { research: 200, exoticMaterials: 60, colonies: 8 },
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
      { type: 'production_add', target: 'rocketFuel', value: 2 },
      { type: 'production_add', target: 'orbitalInfra', value: 0.3 },
    ],
    description: 'Harness gravity for propulsion — triple fuel and boost orbital infrastructure',
    prerequisites: ['terraforming'],
  },
  solarCollector: {
    id: 'solarCollector', name: 'Solar Collector', era: 5,
    cost: { energy: 60, exoticMaterials: 15, orbitalInfra: 20 },
    effects: [
      { type: 'production_add', target: 'energy', value: 2 },
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
    cost: { darkEnergy: 60, research: 250, exoticMaterials: 120, steel: 1000 },
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
    cost: { starSystems: 15, exoticMaterials: 200, energy: 500, labor: 500 },
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
    cost: { research: 300, starSystems: 20, electronics: 150 },
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
      { type: 'production_add', target: 'galacticInfluence', value: 3.2 },
      { type: 'production_add', target: 'darkEnergy', value: 1 },
    ],
    description: 'First contact — alien knowledge boosts influence and dark energy',
    prerequisites: ['aiGovernance'],
  },

  // Era 7: Dyson Era
  dysonSphere: {
    id: 'dysonSphere', name: 'Dyson Sphere', era: 7,
    cost: { starSystems: 25, exoticMaterials: 150, energy: 800 },
    effects: [
      { type: 'production_add', target: 'megastructures', value: 0.1 },
      { type: 'production_mult', target: 'energy', value: 20 },
    ],
    description: 'Enclose a star to harvest its full energy output',
    prerequisites: ['aiGovernance'],
  },
  starLifting: {
    id: 'starLifting', name: 'Star Lifting', era: 7,
    cost: { megastructures: 12, darkEnergy: 100, research: 250 },
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
      { type: 'production_add', target: 'stellarForge', value: 4.8 },
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
    cost: { stellarForge: 40, megastructures: 25, research: 400 },
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
      { type: 'production_add', target: 'energy', value: 18 },
      { type: 'production_add', target: 'darkEnergy', value: 1 },
    ],
    description: 'Move entire stars — massive energy and dark energy boost',
    prerequisites: ['dysonSphere'],
  },
  gravitonLens: {
    id: 'gravitonLens', name: 'Graviton Lens', era: 7,
    cost: { darkEnergy: 50, stellarForge: 12, research: 90 },
    effects: [
      { type: 'production_add', target: 'darkEnergy', value: 4.8 },
      { type: 'production_add', target: 'starSystems', value: 0.2 },
    ],
    description: 'Gravitational lensing reveals hidden star systems and dark energy',
    prerequisites: ['dysonSphere'],
  },

  // Era 8: Galactic
  wormholeNetwork: {
    id: 'wormholeNetwork', name: 'Wormhole Network', era: 8,
    cost: { galacticInfluence: 200, darkEnergy: 300, exoticMaterials: 300, food: 2000 },
    effects: [
      { type: 'production_mult', target: 'starSystems', value: 10 },
      { type: 'production_add', target: 'exoticMatter', value: 0.5 },
    ],
    description: 'Instant travel across the galaxy',
    prerequisites: ['matrioshkaBrain'],
  },
  darkMatterHarvest: {
    id: 'darkMatterHarvest', name: 'Dark Matter Harvest', era: 8,
    cost: { exoticMatter: 80, darkEnergy: 200, starSystems: 80 },
    effects: [
      { type: 'production_mult', target: 'exoticMatter', value: 3 },
      { type: 'production_mult', target: 'darkEnergy', value: 5 },
    ],
    description: 'Harvest dark matter from galactic filaments',
    prerequisites: ['wormholeNetwork'],
  },
  galacticSenate: {
    id: 'galacticSenate', name: 'Galactic Senate', era: 8,
    cost: { galacticInfluence: 500, starSystems: 100, research: 800, materials: 5000 },
    effects: [{ type: 'production_mult', target: 'galacticInfluence', value: 5 }],
    description: 'Unite civilizations under one government',
    prerequisites: ['wormholeNetwork'],
  },
  culturalAssimilation: {
    id: 'culturalAssimilation', name: 'Cultural Assimilation', era: 8,
    cost: { galacticInfluence: 400, food: 2000, colonies: 60 },
    effects: [
      { type: 'production_add', target: 'galacticInfluence', value: 8 },
      { type: 'production_add', target: 'colonies', value: 16 },
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
      { type: 'production_add', target: 'research', value: 16 },
      { type: 'production_add', target: 'data', value: 60 },
    ],
    description: 'Cross-era synergy — entangled particles revolutionize data and research',
    prerequisites: ['darkMatterHarvest'],
  },
  matterReplicators: {
    id: 'matterReplicators', name: 'Matter Replicators', era: 8,
    cost: { exoticMatter: 100, energy: 1000, research: 600 },
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
    cost: { cosmicPower: 300, exoticMatter: 250, galacticInfluence: 600, steel: 5000 },
    effects: [{ type: 'production_mult', target: 'cosmicPower', value: 5 }],
    description: 'Seed new galaxies with life',
    prerequisites: ['matterReplicators'],
  },
  cosmicInfrastructure: {
    id: 'cosmicInfrastructure', name: 'Cosmic Infrastructure', era: 9,
    cost: { cosmicPower: 80, megastructures: 20, exoticMatter: 50 },
    effects: [
      { type: 'production_add', target: 'cosmicPower', value: 12 },
      { type: 'production_add', target: 'exoticMatter', value: 2 },
    ],
    description: 'Galaxy-spanning infrastructure amplifies cosmic power',
    prerequisites: ['galaxySeeding'],
  },
  voidBridges: {
    id: 'voidBridges', name: 'Void Bridges', era: 9,
    cost: { cosmicPower: 600, darkEnergy: 400, exoticMatter: 300, labor: 3000 },
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
    cost: { universalConstants: 20, cosmicPower: 600, research: 800 },
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
      { type: 'production_add', target: 'quantumEchoes', value: 20 },
      { type: 'production_add', target: 'realityFragments', value: 20 },
      { type: 'production_add', target: 'universalConstants', value: 20 },
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
      { type: 'production_add', target: 'materials', value: 0.6 },
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
    prerequisites: ['industrialFarming'],
  },
  supplyChain: {
    id: 'supplyChain', name: 'Supply Chain', era: 2,
    cost: { steel: 25, electronics: 10, labor: 30 },
    effects: [
      { type: 'production_add', target: 'steel', value: 0.3 },
      { type: 'production_add', target: 'materials', value: 0.3 },
    ],
    description: 'Efficient logistics double steel and materials output',
    prerequisites: ['steelRefinery'],
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
    prerequisites: ['marsColony'],
  },
  gravitySling: {
    id: 'gravitySling', name: 'Gravity Sling', era: 4,
    cost: { rocketFuel: 20, research: 25, orbitalInfra: 8 },
    effects: [
      { type: 'production_add', target: 'rocketFuel', value: 0.6 },
      { type: 'production_add', target: 'orbitalInfra', value: 0.2 },
    ],
    description: 'Gravity assist maneuvers save fuel and build infrastructure',
    prerequisites: ['advancedRocketry'],
  },
  advancedRocketry: {
    id: 'advancedRocketry', name: 'Advanced Rocketry', era: 4,
    cost: { rocketFuel: 20, research: 35, steel: 35 },
    effects: [
      { type: 'production_add', target: 'rocketFuel', value: 1.2 },
      { type: 'cap_mult', target: 'rocketFuel', value: 3 },
    ],
    description: 'Next-gen rockets triple fuel production and capacity',
    prerequisites: ['gravitySling'],
  },
  quantumNetwork: {
    id: 'quantumNetwork', name: 'Quantum Network', era: 4,
    cost: { research: 40, electronics: 30, data: 20 },
    effects: [
      { type: 'production_add', target: 'data', value: 1.2 },
      { type: 'production_add', target: 'electronics', value: 0.6 },
    ],
    description: 'Entangled communication triples data and doubles electronics',
    prerequisites: ['satelliteNetwork'],
  },
  voidHarvester: {
    id: 'voidHarvester', name: 'Void Harvester', era: 8,
    cost: { exoticMatter: 25, darkEnergy: 40, galacticInfluence: 60 },
    effects: [
      { type: 'production_add', target: 'exoticMatter', value: 4 },
      { type: 'production_add', target: 'darkEnergy', value: 4 },
      { type: 'production_add', target: 'galacticInfluence', value: 4 },
    ],
    description: 'Harvest the void — double three key galactic resources',
    prerequisites: ['culturalAssimilation'],
  },

  // Prestige-only upgrades — only available after at least one prestige
  // Era 10 deep endgame
  singularityCore: {
    id: 'singularityCore', name: 'Singularity Core', era: 10,
    cost: { quantumEchoes: 80, realityFragments: 150, exoticMatter: 200 },
    effects: [
      { type: 'production_add', target: 'exoticMatter', value: 150 },
      { type: 'production_add', target: 'darkEnergy', value: 150 },
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
      { type: 'production_add', target: 'food', value: 160 },
      { type: 'production_add', target: 'labor', value: 20 },
    ],
    description: 'Quantum-enhanced agriculture — food becomes effectively unlimited',
    prerequisites: ['darkMatterHarvest'],
  },
  universalFactory: {
    id: 'universalFactory', name: 'Universal Factory', era: 9,
    cost: { cosmicPower: 80, exoticMatter: 40, steel: 1000 },
    effects: [
      { type: 'production_add', target: 'steel', value: 150 },
      { type: 'production_add', target: 'electronics', value: 150 },
      { type: 'production_add', target: 'materials', value: 150 },
    ],
    description: 'Cosmic-scale manufacturing — industrial resources become trivial',
    prerequisites: ['voidBridges'],
  },
  realityFabric: {
    id: 'realityFabric', name: 'Reality Fabric', era: 10,
    cost: { realityFragments: 130, universalConstants: 30, quantumEchoes: 80 },
    effects: [
      { type: 'production_add', target: 'realityFragments', value: 40 },
      { type: 'production_add', target: 'universalConstants', value: 2 },
    ],
    description: 'Weave the fabric of reality — x5 fragments and steady constants',
    prerequisites: ['parallelProcessing'],
  },
  omnipotence: {
    id: 'omnipotence', name: 'Omnipotence', era: 10,
    cost: { quantumEchoes: 150, realityFragments: 200, universalConstants: 50, cosmicPower: 600 },
    effects: [
      { type: 'production_add', target: 'cosmicPower', value: 150 },
      { type: 'production_add', target: 'exoticMatter', value: 150 },
      { type: 'production_add', target: 'darkEnergy', value: 150 },
    ],
    description: 'Achieve omnipotence — x20 to all cosmic-tier production',
    prerequisites: ['infiniteResonance'],
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
  dimensionalWeaver: {
    id: 'dimensionalWeaver', name: 'Dimensional Weaver', era: 10,
    cost: { realityFragments: 100, quantumEchoes: 60, universalConstants: 20 },
    effects: [
      { type: 'production_add', target: 'realityFragments', value: 40 },
      { type: 'production_add', target: 'universalConstants', value: 1 },
    ],
    description: 'Weave dimensions together — x5 reality fragments and bonus constants',
    prerequisites: ['parallelProcessing'],
  },
  quantumSymphony: {
    id: 'quantumSymphony', name: 'Quantum Symphony', era: 10,
    cost: { quantumEchoes: 90, universalConstants: 35, cosmicPower: 400 },
    effects: [
      { type: 'production_add', target: 'quantumEchoes', value: 75 },
      { type: 'production_add', target: 'cosmicPower', value: 75 },
    ],
    description: 'Harmonize quantum echoes across realities — x10 echoes and cosmic power',
    prerequisites: ['omniscienceEngine'],
  },
  multiversalLibrary: {
    id: 'multiversalLibrary', name: 'Multiversal Library', era: 10,
    cost: { quantumEchoes: 70, realityFragments: 120, research: 600 },
    effects: [
      { type: 'production_add', target: 'research', value: 400 },
      { type: 'production_add', target: 'data', value: 400 },
      { type: 'production_add', target: 'software', value: 400 },
    ],
    description: 'Collect all knowledge across all realities — x100 to digital resources',
    prerequisites: ['parallelProcessing'],
  },
  eternityEngine: {
    id: 'eternityEngine', name: 'Eternity Engine', era: 10,
    cost: { quantumEchoes: 150, realityFragments: 250, universalConstants: 40 },
    effects: [
      { type: 'production_add', target: 'quantumEchoes', value: 150 },
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
      { type: 'production_add', target: 'exoticMatter', value: 12 },
    ],
    description: 'Harvest entropy itself — constants and exotic matter',
    prerequisites: ['entropyReversal'],
  },
  voidExplorer: {
    id: 'voidExplorer', name: 'Void Explorer', era: 9,
    cost: { cosmicPower: 80, darkEnergy: 60, universalConstants: 8 },
    effects: [
      { type: 'production_add', target: 'universalConstants', value: 0.2 },
      { type: 'production_add', target: 'darkEnergy', value: 12 },
    ],
    description: 'Explore the void between galaxies',
    prerequisites: ['voidBridges'],
  },
  realityHarvest: {
    id: 'realityHarvest', name: 'Reality Harvest', era: 9,
    cost: { realityFragments: 8, universalConstants: 12, cosmicPower: 100 },
    effects: [
      { type: 'production_add', target: 'realityFragments', value: 12 },
      { type: 'production_add', target: 'cosmicPower', value: 6 },
    ],
    description: 'Harvest reality itself — triple fragments and double cosmic power',
    prerequisites: ['entropyReversal'],
  },
  cosmicMemory: {
    id: 'cosmicMemory', name: 'Cosmic Memory', era: 9,
    cost: { universalConstants: 14, cosmicPower: 120, research: 280 },
    effects: [
      { type: 'production_add', target: 'research', value: 45 },
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
      { type: 'production_add', target: 'universalConstants', value: 6 },
    ],
    description: 'Tap into nearby dimensions for reality fragments',
    prerequisites: ['entropyReversal'],
  },
  cosmicFortress: {
    id: 'cosmicFortress', name: 'Cosmic Fortress', era: 9,
    cost: { cosmicPower: 130, exoticMatter: 70, megastructures: 15 },
    effects: [
      { type: 'production_add', target: 'megastructures', value: 45 },
      { type: 'production_add', target: 'exoticMatter', value: 12 },
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
      { type: 'production_add', target: 'colonies', value: 45 },
      { type: 'production_add', target: 'starSystems', value: 1 },
    ],
    description: 'Connect galaxies — massive colony expansion and star system discovery',
    prerequisites: ['voidBridges'],
  },
  darkMatterLens: {
    id: 'darkMatterLens', name: 'Dark Matter Lens', era: 9,
    cost: { universalConstants: 8, darkEnergy: 60, exoticMatter: 40 },
    effects: [
      { type: 'production_add', target: 'exoticMatter', value: 24 },
      { type: 'production_add', target: 'darkEnergy', value: 12 },
    ],
    description: 'Focus dark matter for exotic material and dark energy amplification',
    prerequisites: ['entropyReversal'],
  },
  galaxyMapper: {
    id: 'galaxyMapper', name: 'Galaxy Mapper', era: 9,
    cost: { cosmicPower: 90, starSystems: 30, research: 250 },
    effects: [
      { type: 'production_add', target: 'starSystems', value: 45 },
      { type: 'production_add', target: 'cosmicPower', value: 3 },
    ],
    description: 'Map the entire observable universe — massive star system discovery',
    prerequisites: ['cosmicInfrastructure'],
  },
  infiniteResonance: {
    id: 'infiniteResonance', name: 'Infinite Resonance', era: 10,
    cost: { quantumEchoes: 200, cosmicPower: 500, universalConstants: 60 },
    effects: [
      { type: 'production_add', target: 'universalConstants', value: 400 },
      { type: 'production_add', target: 'cosmicPower', value: 250 },
    ],
    description: 'Resonance across infinite realities — true endgame power',
    prerequisites: ['multiversalHarmony'],
  },
  quantumEntangledSensors: {
    id: 'quantumEntangledSensors', name: 'Quantum Sensors', era: 7,
    cost: { research: 100, electronics: 40, megastructures: 4 },
    effects: [
      { type: 'production_add', target: 'research', value: 9.6 },
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
      { type: 'production_add', target: 'steel', value: 36 },
    ],
    description: 'Forge materials in neutron star cores — extreme pressure yields',
    prerequisites: ['starLifting'],
  },
  stellarAccelerator: {
    id: 'stellarAccelerator', name: 'Stellar Accelerator', era: 7,
    cost: { megastructures: 8, darkEnergy: 50, research: 100 },
    effects: [
      { type: 'production_add', target: 'research', value: 9.6 },
      { type: 'production_add', target: 'energy', value: 4.8 },
    ],
    description: 'Particle accelerator powered by a star — x5 research and x3 energy',
    prerequisites: ['neuralUplink'],
  },
  planetaryRing: {
    id: 'planetaryRing', name: 'Planetary Ring', era: 7,
    cost: { megastructures: 6, stellarForge: 10, exoticMaterials: 40 },
    effects: [
      { type: 'production_add', target: 'exoticMaterials', value: 2 },
      { type: 'production_add', target: 'colonies', value: 4.8 },
    ],
    description: 'Build a ring around a planet — exotic materials and colonies thrive',
    prerequisites: ['ringWorld'],
  },
  dysonSwarmController: {
    id: 'dysonSwarmController', name: 'Dyson Swarm Controller', era: 7,
    cost: { megastructures: 7, software: 40, energy: 200 },
    effects: [
      { type: 'production_add', target: 'energy', value: 9.6 },
      { type: 'production_add', target: 'megastructures', value: 2.4 },
    ],
    description: 'AI-controlled Dyson swarms — x5 energy and x2 megastructures',
    prerequisites: ['neuralUplink'],
  },
  gravitationalWave: {
    id: 'gravitationalWave', name: 'Gravitational Wave Detector', era: 7,
    cost: { research: 110, megastructures: 5, darkEnergy: 35 },
    effects: [
      { type: 'production_add', target: 'research', value: 4.8 },
      { type: 'production_add', target: 'starSystems', value: 0.2 },
    ],
    description: 'Detect gravitational waves to discover distant star systems',
    prerequisites: ['stellarNursery'],
  },
  antimatterWeapon: {
    id: 'antimatterWeapon', name: 'Antimatter Weapon', era: 7,
    cost: { darkEnergy: 45, stellarForge: 12, exoticMaterials: 35 },
    effects: [
      { type: 'production_add', target: 'galacticInfluence', value: 9.6 },
      { type: 'production_add', target: 'darkEnergy', value: 2.4 },
    ],
    description: 'Project power with antimatter — x5 influence and x2 dark energy',
    prerequisites: ['matrioshkaBrain'],
  },
  ringWorld: {
    id: 'ringWorld', name: 'Ring World', era: 7,
    cost: { megastructures: 10, exoticMaterials: 50, stellarForge: 15 },
    effects: [
      { type: 'production_add', target: 'colonies', value: 5 },
      { type: 'production_add', target: 'food', value: 36 },
      { type: 'cap_mult', target: 'colonies', value: 10 },
    ],
    description: 'Build a ring world — massive colony and food capacity',
    prerequisites: ['stellarNursery'],
  },
  warpGate: {
    id: 'warpGate', name: 'Warp Gate', era: 7,
    cost: { megastructures: 6, darkEnergy: 45, starSystems: 10 },
    effects: [
      { type: 'production_add', target: 'starSystems', value: 4.8 },
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
      { type: 'production_add', target: 'stellarForge', value: 2.4 },
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
      { type: 'production_add', target: 'galacticInfluence', value: 1.6 },
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
      { type: 'production_add', target: 'exoticMaterials', value: 1.6 },
    ],
    description: 'Mine nebulae for dark energy and exotic materials',
    prerequisites: ['warpDrive'],
  },
  stellarNavigation: {
    id: 'stellarNavigation', name: 'Stellar Navigation', era: 6,
    cost: { starSystems: 5, research: 65, darkEnergy: 20 },
    effects: [
      { type: 'production_add', target: 'starSystems', value: 1.6 },
      { type: 'cap_mult', target: 'starSystems', value: 3 },
    ],
    description: 'Better navigation doubles star system discovery and triples capacity',
    prerequisites: ['warpDrive'],
  },
  galacticMining: {
    id: 'galacticMining', name: 'Galactic Mining', era: 6,
    cost: { starSystems: 6, exoticMaterials: 50, labor: 150 },
    effects: [
      { type: 'production_add', target: 'exoticMaterials', value: 6.4 },
      { type: 'production_add', target: 'materials', value: 5 },
    ],
    description: 'Mine across star systems — x5 exotic materials and +5 materials/s',
    prerequisites: ['dysonSwarms'],
  },
  warpConduit: {
    id: 'warpConduit', name: 'Warp Conduit', era: 6,
    cost: { darkEnergy: 35, starSystems: 5, steel: 300 },
    effects: [
      { type: 'production_add', target: 'darkEnergy', value: 3.2 },
      { type: 'cap_mult', target: 'darkEnergy', value: 5 },
    ],
    description: 'Permanent warp conduits triple dark energy and expand capacity',
    prerequisites: ['dysonSwarms'],
  },
  fusionReactor: {
    id: 'fusionReactor', name: 'Fusion Reactor', era: 6,
    cost: { darkEnergy: 25, energy: 150, research: 80 },
    effects: [
      { type: 'production_add', target: 'energy', value: 12 },
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
      { type: 'production_add', target: 'food', value: 3.2 },
    ],
    description: 'Build diplomatic relations — influence and food production soar',
    prerequisites: ['aiGovernance'],
  },
  interstellarBeacon: {
    id: 'interstellarBeacon', name: 'Interstellar Beacon', era: 6,
    cost: { darkEnergy: 40, starSystems: 6, research: 80 },
    effects: [
      { type: 'production_add', target: 'starSystems', value: 0.3 },
      { type: 'production_add', target: 'research', value: 3.2 },
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
    prerequisites: ['quarry'],
  },
  marketplace: {
    id: 'marketplace', name: 'Marketplace', era: 1,
    cost: { food: 18, materials: 12, labor: 8 },
    effects: [
      { type: 'production_add', target: 'food', value: 0.2 },
      { type: 'production_add', target: 'materials', value: 0.2 },
    ],
    description: 'A bustling marketplace doubles food and material trade',
    prerequisites: ['brickworks'],
  },
  granary: {
    id: 'granary', name: 'Granary', era: 1,
    cost: { food: 25, materials: 15, labor: 10 },
    effects: [
      { type: 'cap_mult', target: 'food', value: 3 },
      { type: 'production_add', target: 'food', value: 0.3 },
    ],
    description: 'Store food for lean times — triple capacity and steady supply',
    prerequisites: ['communalKitchen'],
  },
  quarry: {
    id: 'quarry', name: 'Quarry', era: 1,
    cost: { materials: 20, labor: 12, energy: 8 },
    effects: [
      { type: 'production_add', target: 'materials', value: 0.5 },
      { type: 'cap_mult', target: 'materials', value: 3 },
    ],
    description: 'A stone quarry boosts materials and triples storage',
    prerequisites: ['storehouse'],
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
      { type: 'production_add', target: 'energy', value: 0.2 },
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
    prerequisites: ['marketplace'],
  },
  electricMotor: {
    id: 'electricMotor', name: 'Electric Motor', era: 2,
    cost: { electronics: 12, steel: 15, energy: 12 },
    effects: [
      { type: 'production_add', target: 'labor', value: 0.3 },
      { type: 'production_add', target: 'energy', value: 0.3 },
    ],
    description: 'Electric motors double labor efficiency',
    prerequisites: ['steamTurbine'],
  },
  steelRefinery: {
    id: 'steelRefinery', name: 'Steel Refinery', era: 2,
    cost: { steel: 30, energy: 20, labor: 25 },
    effects: [
      { type: 'production_add', target: 'steel', value: 0.3 },
      { type: 'cap_mult', target: 'steel', value: 3 },
    ],
    description: 'Refined smelting doubles steel and triples storage',
    prerequisites: ['steelForge'],
  },
  chemicalPlant: {
    id: 'chemicalPlant', name: 'Chemical Plant', era: 2,
    cost: { steel: 18, energy: 15, materials: 20 },
    effects: [
      { type: 'production_add', target: 'energy', value: 0.5 },
      { type: 'production_add', target: 'materials', value: 0.3 },
    ],
    description: 'Chemical processing doubles materials and generates energy',
    prerequisites: ['electricMotor'],
  },
  telephoneNetwork: {
    id: 'telephoneNetwork', name: 'Telephone Network', era: 2,
    cost: { electronics: 15, steel: 20, energy: 12 },
    effects: [
      { type: 'production_add', target: 'research', value: 0.3 },
      { type: 'production_add', target: 'labor', value: 0.3 },
    ],
    description: 'Instant communication doubles labor efficiency',
    prerequisites: ['computingLab'],
  },
  textileFactory: {
    id: 'textileFactory', name: 'Textile Factory', era: 2,
    cost: { steel: 12, food: 15, labor: 20 },
    effects: [
      { type: 'production_add', target: 'labor', value: 1 },
      { type: 'production_add', target: 'food', value: 0.3 },
    ],
    description: 'Textile manufacturing attracts workers and boosts food supply chains',
    prerequisites: ['textileMill'],
  },
  coalMine: {
    id: 'coalMine', name: 'Coal Mine', era: 2,
    cost: { materials: 20, labor: 20, steel: 10 },
    effects: [
      { type: 'production_add', target: 'energy', value: 0.3 },
      { type: 'production_add', target: 'materials', value: 0.3 },
    ],
    description: 'Deep coal mining doubles energy and produces materials',
    prerequisites: ['steelRefinery'],
  },
  communalKitchen: {
    id: 'communalKitchen', name: 'Communal Kitchen', era: 1,
    cost: { food: 20, materials: 15, labor: 10 },
    effects: [
      { type: 'production_add', target: 'food', value: 0.4 },
      { type: 'production_add', target: 'labor', value: 0.5 },
    ],
    description: 'Shared meals triple food output and provide extra labor',
    prerequisites: ['animalHusbandry'],
  },
  deepMining: {
    id: 'deepMining', name: 'Deep Mining', era: 1,
    cost: { materials: 35, energy: 20, labor: 15 },
    effects: [
      { type: 'production_add', target: 'materials', value: 1 },
      { type: 'production_add', target: 'energy', value: 0.2 },
    ],
    description: 'Dig deeper for rare ores — more materials and energy',
    prerequisites: ['copperSmelter'],
  },
  socialMedia: {
    id: 'socialMedia', name: 'Social Media', era: 3,
    cost: { software: 15, data: 10, electronics: 15 },
    effects: [
      { type: 'production_add', target: 'data', value: 0.4 },
      { type: 'production_add', target: 'software', value: 0.3 },
    ],
    description: 'Social networks double data generation',
    prerequisites: ['virtualReality'],
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
      { type: 'production_add', target: 'electronics', value: 0.4 },
      { type: 'cap_mult', target: 'data', value: 5 },
    ],
    description: 'Decentralized ledger doubles electronics and expands data capacity',
    prerequisites: ['socialMedia'],
  },
  robotics: {
    id: 'robotics', name: 'Robotics', era: 3,
    cost: { electronics: 30, research: 25, steel: 15 },
    effects: [
      { type: 'production_add', target: 'labor', value: 0.8 },
      { type: 'production_add', target: 'electronics', value: 0.5 },
    ],
    description: 'Robotic automation triples labor and generates electronics',
    prerequisites: ['bigData'],
  },
  bigData: {
    id: 'bigData', name: 'Big Data', era: 3,
    cost: { data: 20, software: 15, electronics: 25 },
    effects: [
      { type: 'production_add', target: 'data', value: 0.8 },
      { type: 'production_add', target: 'research', value: 1 },
    ],
    description: 'Massive data analysis triples data output and boosts research',
    prerequisites: ['energyMatrix'],
  },
  encryptionProtocol: {
    id: 'encryptionProtocol', name: 'Encryption Protocol', era: 3,
    cost: { software: 20, data: 12, electronics: 20 },
    effects: [
      { type: 'production_add', target: 'data', value: 0.4 },
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
    prerequisites: ['patternAnalysis','quantumComputing'],
  },
  solarWindCollector: {
    id: 'solarWindCollector', name: 'Solar Wind Collector', era: 5,
    cost: { energy: 50, exoticMaterials: 10, orbitalInfra: 15 },
    effects: [
      { type: 'production_add', target: 'energy', value: 3 },
      { type: 'production_add', target: 'exoticMaterials', value: 0.2 },
    ],
    description: 'Harvest solar wind for energy and trace exotic materials',
    prerequisites: ['fuelRefinery','fusionPower'],
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
      { type: 'production_add', target: 'orbitalInfra', value: 2 },
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
    prerequisites: ['outerColony','bioReactor'],
  },
  dysonBubble: {
    id: 'dysonBubble', name: 'Dyson Bubble', era: 5,
    cost: { exoticMaterials: 25, energy: 70, research: 45 },
    effects: [
      { type: 'production_add', target: 'energy', value: 4 },
      { type: 'cap_mult', target: 'energy', value: 5 },
    ],
    description: 'A proto-Dyson structure — x5 energy production and capacity',
    prerequisites: ['heliumMiner'],
  },
  titanMining: {
    id: 'titanMining', name: 'Titan Mining', era: 5,
    cost: { colonies: 3, rocketFuel: 45, exoticMaterials: 15 },
    effects: [
      { type: 'production_add', target: 'exoticMaterials', value: 0.8 },
      { type: 'production_add', target: 'rocketFuel', value: 1 },
    ],
    description: 'Mine methane lakes on Titan for exotic materials and fuel',
    prerequisites: ['asteroidMining'],
  },
  exoplanetSurvey: {
    id: 'exoplanetSurvey', name: 'Exoplanet Survey', era: 5,
    cost: { orbitalInfra: 25, research: 50, rocketFuel: 30 },
    effects: [
      { type: 'production_add', target: 'colonies', value: 0.3 },
      { type: 'production_add', target: 'exoticMaterials', value: 1 },
    ],
    description: 'Survey distant planets — discover new colonies and materials',
    prerequisites: ['spaceHabitat'],
  },
  wormholeGenerator: {
    id: 'wormholeGenerator', name: 'Wormhole Generator', era: 8,
    cost: { exoticMatter: 30, darkEnergy: 60, research: 160 },
    effects: [
      { type: 'production_add', target: 'starSystems', value: 8 },
      { type: 'production_add', target: 'exoticMatter', value: 1 },
    ],
    description: 'Generate stable wormholes — x3 star systems',
    prerequisites: ['wormholeNetwork'],
  },
  civilizationNetwork: {
    id: 'civilizationNetwork', name: 'Civilization Network', era: 8,
    cost: { galacticInfluence: 80, starSystems: 20, research: 140 },
    effects: [
      { type: 'production_add', target: 'galacticInfluence', value: 4 },
      { type: 'production_add', target: 'research', value: 4 },
      { type: 'production_add', target: 'data', value: 2 },
    ],
    description: 'Connect all civilizations — double influence and research',
    prerequisites: ['galacticSenate'],
  },
  darkMatterConduit: {
    id: 'darkMatterConduit', name: 'Dark Matter Conduit', era: 8,
    cost: { darkEnergy: 70, exoticMatter: 30, research: 170 },
    effects: [
      { type: 'production_add', target: 'darkEnergy', value: 8 },
      { type: 'production_add', target: 'cosmicPower', value: 1 },
    ],
    description: 'Channel dark matter for dark energy and cosmic power',
    prerequisites: ['matterReplicators'],
  },
  galacticHighway: {
    id: 'galacticHighway', name: 'Galactic Highway', era: 8,
    cost: { starSystems: 25, galacticInfluence: 70, darkEnergy: 60 },
    effects: [
      { type: 'production_add', target: 'starSystems', value: 8 },
      { type: 'production_add', target: 'galacticInfluence', value: 4 },
    ],
    description: 'Highways between star systems — x3 systems and x2 influence',
    prerequisites: ['wormholeNetwork'],
  },
  quantumFabric: {
    id: 'quantumFabric', name: 'Quantum Fabric', era: 8,
    cost: { exoticMatter: 25, research: 160, cosmicPower: 10 },
    effects: [
      { type: 'production_add', target: 'exoticMatter', value: 8 },
      { type: 'production_add', target: 'research', value: 8 },
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
      { type: 'production_add', target: 'exoticMatter', value: 4 },
      { type: 'production_add', target: 'energy', value: 16 },
    ],
    description: 'Forge antimatter for massive energy and exotic matter output',
    prerequisites: ['matterReplicators'],
  },
  galacticLibrary: {
    id: 'galacticLibrary', name: 'Galactic Library', era: 8,
    cost: { galacticInfluence: 60, research: 150, data: 50 },
    effects: [
      { type: 'production_add', target: 'research', value: 8 },
      { type: 'production_add', target: 'data', value: 8 },
      { type: 'production_add', target: 'galacticInfluence', value: 1 },
    ],
    description: 'A library spanning the galaxy — knowledge and influence grow together',
    prerequisites: ['galacticSenate'],
  },
  quantumTunneling: {
    id: 'quantumTunneling', name: 'Quantum Tunneling', era: 8,
    cost: { exoticMatter: 25, darkEnergy: 40, research: 180 },
    effects: [
      { type: 'production_add', target: 'starSystems', value: 16 },
      { type: 'production_add', target: 'exoticMatter', value: 1 },
    ],
    description: 'Tunnel through spacetime — rapidly expand star system reach',
    prerequisites: ['wormholeNetwork'],
  },
  neuralProcessor: {
    id: 'neuralProcessor', name: 'Neural Processor', era: 6,
    cost: { electronics: 50, research: 70, starSystems: 5 },
    effects: [
      { type: 'production_add', target: 'electronics', value: 6.4 },
      { type: 'production_add', target: 'software', value: 6.4 },
    ],
    description: 'Interstellar neural computing — x5 electronics and software',
    prerequisites: ['stellarCartography'],
  },
  energyMatrix: {
    id: 'energyMatrix', name: 'Energy Matrix', era: 3,
    cost: { electronics: 35, energy: 25, data: 10 },
    effects: [
      { type: 'production_add', target: 'energy', value: 0.4 },
      { type: 'cap_mult', target: 'energy', value: 3 },
    ],
    description: 'Digital energy management doubles output and triples capacity',
    prerequisites: ['digitalSensors'],
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
    prerequisites: ['cloudStorage'],
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
    prerequisites: ['quantumNetwork'],
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
  lumberMill: {
    id: 'lumberMill', name: 'Lumber Mill', era: 1,
    cost: { materials: 28, labor: 14, energy: 10 },
    effects: [
      { type: 'production_add', target: 'materials', value: 0.2 },
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
      { type: 'production_add', target: 'steel', value: 0.3 },
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
      { type: 'production_add', target: 'electronics', value: 0.3 },
    ],
    description: 'Long-distance communication accelerates research and electronics',
    prerequisites: ['telephoneNetwork'],
  },

  // Era 3

  // Era 4
  orbitalFactory: {
    id: 'orbitalFactory', name: 'Orbital Factory', era: 4,
    cost: { orbitalInfra: 12, steel: 35, electronics: 20 },
    effects: [
      { type: 'production_add', target: 'steel', value: 1.2 },
      { type: 'production_add', target: 'orbitalInfra', value: 0.3 },
    ],
    description: 'Manufacturing in zero-g triples steel and builds orbital infrastructure',
    prerequisites: ['refueling'],
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
    prerequisites: ['quantumReactor'],
  },

  // Era 6
  xenoBotany: {
    id: 'xenoBotany', name: 'Xeno-Botany', era: 6,
    cost: { starSystems: 4, food: 200, research: 60 },
    effects: [
      { type: 'production_add', target: 'food', value: 6.4 },
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
      { type: 'production_add', target: 'data', value: 9.6 },
      { type: 'production_add', target: 'software', value: 9.6 },
    ],
    description: 'Computing at stellar scale — x5 data and software',
    prerequisites: ['matrioshkaBrain'],
  },
  photonSail: {
    id: 'photonSail', name: 'Photon Sail Armada', era: 7,
    cost: { megastructures: 5, darkEnergy: 35, energy: 200 },
    effects: [
      { type: 'production_add', target: 'starSystems', value: 0.3 },
      { type: 'production_add', target: 'colonies', value: 9.6 },
    ],
    description: 'Light-speed armada colonizes new stars rapidly',
    prerequisites: ['dysonSphere'],
  },

  // Era 8
  neutroniumRefinery: {
    id: 'neutroniumRefinery', name: 'Neutronium Refinery', era: 8,
    cost: { exoticMatter: 25, stellarForge: 15, energy: 200 },
    effects: [
      { type: 'production_add', target: 'exoticMatter', value: 8 },
      { type: 'production_add', target: 'stellarForge', value: 1 },
    ],
    description: 'Refine neutron star matter for exotic materials and forge output',
    prerequisites: ['darkMatterHarvest'],
  },

  // Era 9
  galacticSeed: {
    id: 'galacticSeed', name: 'Galactic Seed', era: 9,
    cost: { cosmicPower: 70, exoticMatter: 50, colonies: 20 },
    effects: [
      { type: 'production_add', target: 'colonies', value: 45 },
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
      { type: 'production_add', target: 'realityFragments', value: 40 },
      { type: 'production_add', target: 'quantumEchoes', value: 20 },
    ],
    description: 'Compile raw reality into structured fragments — x5 fragments and x3 echoes',
    prerequisites: ['parallelProcessing'],
  },
  omniversalBeacon: {
    id: 'omniversalBeacon', name: 'Omniversal Beacon', era: 10,
    cost: { quantumEchoes: 110, realityFragments: 160, cosmicPower: 450 },
    effects: [
      { type: 'production_add', target: 'cosmicPower', value: 150 },
      { type: 'production_add', target: 'universalConstants', value: 3 },
    ],
    description: 'Broadcast across every reality — x15 cosmic power and +3 constants/s',
    prerequisites: ['omniscienceEngine'],
  },

  // --- Worktree Agent: 30 new upgrades (3 per era) ---
  oxCart: { id: 'oxCart', name: 'Ox Cart', era: 1, cost: { food: 15, materials: 12, labor: 10 }, effects: [{ type: 'production_add', target: 'labor', value: 0.2 }, { type: 'production_add', target: 'materials', value: 0.4 }], description: 'Beast-drawn carts double labor and haul extra materials', prerequisites: ['huntingParty'] },
  oilRefinery: { id: 'oilRefinery', name: 'Oil Refinery', era: 2, cost: { steel: 25, energy: 20, materials: 30 }, effects: [{ type: 'production_add', target: 'energy', value: 0.6 }, { type: 'production_add', target: 'steel', value: 0.5 }], description: 'Refine petroleum — triple energy and generate steel byproducts', prerequisites: ['steamTurbine'] },
  laboratoryComplex: { id: 'laboratoryComplex', name: 'Laboratory Complex', era: 2, cost: { electronics: 20, steel: 15, research: 10 }, effects: [{ type: 'production_add', target: 'research', value: 0.3 }, { type: 'cap_mult', target: 'research', value: 3 }], description: 'Dedicated labs double research and triple capacity', prerequisites: ['computingLab'] },
  conveyor: { id: 'conveyor', name: 'Conveyor System', era: 2, cost: { steel: 20, electronics: 10, energy: 15 }, effects: [{ type: 'production_add', target: 'steel', value: 0.3 }, { type: 'production_add', target: 'electronics', value: 0.3 }], description: 'Automated conveyors double steel and electronics', prerequisites: ['railroad'] },
  fiberOptic: { id: 'fiberOptic', name: 'Fiber Optic Network', era: 3, cost: { electronics: 30, energy: 20, materials: 25 }, effects: [{ type: 'production_add', target: 'data', value: 0.8 }, { type: 'production_add', target: 'electronics', value: 0.4 }], description: 'High-speed fiber triples data and doubles electronics', prerequisites: ['internet'] },
  autonomousDrone: { id: 'autonomousDrone', name: 'Autonomous Drone', era: 3, cost: { software: 20, electronics: 25, research: 15 }, effects: [{ type: 'production_add', target: 'labor', value: 1 }, { type: 'production_add', target: 'materials', value: 0.4 }], description: 'Drones add labor and double material gathering', prerequisites: ['robotics'] },
  cryoFuelTank: { id: 'cryoFuelTank', name: 'Cryo Fuel Tank', era: 4, cost: { rocketFuel: 20, steel: 30, energy: 15 }, effects: [{ type: 'cap_mult', target: 'rocketFuel', value: 5 }, { type: 'production_add', target: 'rocketFuel', value: 0.3 }], description: 'Cryogenic storage expands fuel capacity x5', prerequisites: ['advancedRocketry'] },
  magneticShield: { id: 'magneticShield', name: 'Magnetic Shield', era: 4, cost: { electronics: 20, energy: 25, steel: 20 }, effects: [{ type: 'production_add', target: 'orbitalInfra', value: 0.6 }, { type: 'cap_mult', target: 'orbitalInfra', value: 3 }], description: 'Magnetic shielding protects orbital assets — double output', prerequisites: ['spaceStation'] },
  nanofabricator: { id: 'nanofabricator', name: 'Nanofabricator', era: 5, cost: { exoticMaterials: 20, research: 40, electronics: 30 }, effects: [{ type: 'production_add', target: 'exoticMaterials', value: 2 }, { type: 'production_add', target: 'electronics', value: 4 }], description: 'Nanoscale fabrication triples exotic materials and x5 electronics', prerequisites: ['massDriver'] },
  gravitySiphon: { id: 'gravitySiphon', name: 'Gravity Siphon', era: 5, cost: { rocketFuel: 40, energy: 50, research: 30 }, effects: [{ type: 'production_add', target: 'energy', value: 4 }, { type: 'production_add', target: 'darkEnergy', value: 0.1 }], description: 'Siphon energy from gravity wells', prerequisites: ['dysonBubble'] },
  cometHarvester: { id: 'cometHarvester', name: 'Comet Harvester', era: 5, cost: { orbitalInfra: 20, rocketFuel: 30, materials: 100 }, effects: [{ type: 'production_add', target: 'exoticMaterials', value: 0.5 }, { type: 'production_add', target: 'food', value: 2 }], description: 'Harvest comets for exotic ice and organic compounds', prerequisites: ['oortCloudMining'] },
  graviticLoom: { id: 'graviticLoom', name: 'Gravitic Loom', era: 6, cost: { darkEnergy: 30, exoticMaterials: 40, starSystems: 5 }, effects: [{ type: 'production_add', target: 'exoticMaterials', value: 3.2 }, { type: 'production_add', target: 'darkEnergy', value: 0.5 }], description: 'Weave exotic materials using gravity — triples output', prerequisites: ['warpDrive'] },
  stellarAcademy: { id: 'stellarAcademy', name: 'Stellar Academy', era: 6, cost: { research: 80, galacticInfluence: 20, starSystems: 4 }, effects: [{ type: 'production_add', target: 'research', value: 6.4 }, { type: 'production_add', target: 'galacticInfluence', value: 0.3 }], description: 'Train across star systems — x5 research', prerequisites: ['aiGovernance'] },
  voidProbe: { id: 'voidProbe', name: 'Void Probe', era: 6, cost: { darkEnergy: 25, starSystems: 3, electronics: 40 }, effects: [{ type: 'production_add', target: 'starSystems', value: 0.1 }, { type: 'production_add', target: 'data', value: 1 }], description: 'Probes into the void discover systems and transmit data', prerequisites: ['stellarCartography'] },
  chronoForge: { id: 'chronoForge', name: 'Chrono Forge', era: 7, cost: { stellarForge: 15, megastructures: 5, darkEnergy: 40 }, effects: [{ type: 'production_add', target: 'stellarForge', value: 4.8 }, { type: 'production_add', target: 'materials', value: 9.6 }], description: 'Forge materials across timelines — x3 stellar and x5 materials', prerequisites: ['starLifting'] },
  galacticSpire: { id: 'galacticSpire', name: 'Galactic Spire', era: 7, cost: { megastructures: 8, research: 100, galacticInfluence: 30 }, effects: [{ type: 'production_add', target: 'megastructures', value: 2.4 }, { type: 'production_add', target: 'galacticInfluence', value: 4.8 }], description: 'A spire visible across the galaxy — doubles megastructures', prerequisites: ['matrioshkaBrain'] },
  stellarGarden: { id: 'stellarGarden', name: 'Stellar Garden', era: 7, cost: { stellarForge: 10, colonies: 10, food: 200 }, effects: [{ type: 'production_add', target: 'colonies', value: 1 }, { type: 'production_add', target: 'food', value: 18 }], description: 'Grow food around stars — x10 food and +1 colony/s', prerequisites: ['stellarNursery'] },
  dimensionalHarvest: { id: 'dimensionalHarvest', name: 'Dimensional Harvest', era: 8, cost: { exoticMatter: 25, darkEnergy: 50, galacticInfluence: 40 }, effects: [{ type: 'production_add', target: 'exoticMatter', value: 8 }, { type: 'production_add', target: 'cosmicPower', value: 0.5 }], description: 'Harvest resources from parallel dimensions', prerequisites: ['darkMatterHarvest'] },
  galacticForge: { id: 'galacticForge', name: 'Galactic Forge', era: 8, cost: { exoticMatter: 20, stellarForge: 15, megastructures: 10 }, effects: [{ type: 'production_add', target: 'stellarForge', value: 16 }, { type: 'production_add', target: 'megastructures', value: 8 }], description: 'A forge spanning the galaxy', prerequisites: ['matterReplicators'] },
  cosmicDiplomacy: { id: 'cosmicDiplomacy', name: 'Cosmic Diplomacy', era: 8, cost: { galacticInfluence: 80, research: 150, starSystems: 20 }, effects: [{ type: 'production_add', target: 'galacticInfluence', value: 16 }, { type: 'production_add', target: 'exoticMatter', value: 1 }], description: 'Cosmic-scale diplomacy — x5 influence', prerequisites: ['galacticSenate'] },
  realityScanner: { id: 'realityScanner', name: 'Reality Scanner', era: 9, cost: { universalConstants: 10, cosmicPower: 80, research: 200 }, effects: [{ type: 'production_add', target: 'universalConstants', value: 12 }, { type: 'production_add', target: 'realityFragments', value: 0.2 }], description: 'Scan across realities — triple constants', prerequisites: ['cosmicInfrastructure'] },
  cosmicArchitect: { id: 'cosmicArchitect', name: 'Cosmic Architect', era: 9, cost: { universalConstants: 12, megastructures: 15, cosmicPower: 120 }, effects: [{ type: 'production_add', target: 'megastructures', value: 45 }, { type: 'production_add', target: 'universalConstants', value: 0.3 }], description: 'Build across the cosmos — x10 megastructures', prerequisites: ['entropyReversal'] },
  echoChorus: { id: 'echoChorus', name: 'Echo Chorus', era: 10, cost: { quantumEchoes: 60, realityFragments: 100, cosmicPower: 200 }, effects: [{ type: 'production_add', target: 'quantumEchoes', value: 40 }, { type: 'production_add', target: 'realityFragments', value: 2 }], description: 'Harmonize echoes across realities — x5 echoes', prerequisites: ['dimensionalAnchors'] },
  omniversalNexus: { id: 'omniversalNexus', name: 'Omniversal Nexus', era: 10, cost: { quantumEchoes: 100, realityFragments: 150, universalConstants: 30, cosmicPower: 400 }, effects: [{ type: 'production_add', target: 'cosmicPower', value: 75 }, { type: 'production_add', target: 'universalConstants', value: 75 }, { type: 'production_add', target: 'exoticMatter', value: 75 }], description: 'The nexus of all realities — x10 cosmic, constants, and exotic', prerequisites: ['omniscienceEngine'] },

  // --- 30 new upgrades (3 per era) ---

  // Era 1
  charcoalPit: { id: 'charcoalPit', name: 'Charcoal Pit', era: 1, cost: { materials: 20, energy: 8, labor: 12 }, effects: [{ type: 'production_add', target: 'energy', value: 0.2 }, { type: 'production_add', target: 'materials', value: 0.3 }], description: 'Burn wood into charcoal — doubles energy and boosts materials', prerequisites: ['waterMill'] },
  fishingWharf: { id: 'fishingWharf', name: 'Fishing Wharf', era: 1, cost: { food: 18, materials: 14, labor: 10 }, effects: [{ type: 'production_add', target: 'food', value: 0.8 }, { type: 'production_add', target: 'labor', value: 0.2 }], description: 'Coastal fishing yields food and doubles labor from dockworkers', prerequisites: ['irrigation'] },

  // Era 2
  cementFactory: { id: 'cementFactory', name: 'Cement Factory', era: 2, cost: { steel: 18, materials: 22, energy: 15 }, effects: [{ type: 'production_add', target: 'materials', value: 0.6 }, { type: 'production_add', target: 'steel', value: 0.3 }], description: 'Cement production triples materials and generates steel', prerequisites: ['hydraulicPress'] },
  wirelessTelegraph: { id: 'wirelessTelegraph', name: 'Wireless Telegraph', era: 2, cost: { electronics: 15, research: 12, steel: 10 }, effects: [{ type: 'production_add', target: 'research', value: 0.3 }, { type: 'production_add', target: 'electronics', value: 0.3 }], description: 'Wireless communication doubles research output', prerequisites: ['telegraphLine'] },
  canningFactory: { id: 'canningFactory', name: 'Canning Factory', era: 2, cost: { steel: 15, food: 20, labor: 15 }, effects: [{ type: 'cap_mult', target: 'food', value: 5 }, { type: 'production_add', target: 'food', value: 0.3 }], description: 'Preserved food doubles output and expands storage x5', prerequisites: ['industrialFarming'] },

  // Era 3
  deepLearning: { id: 'deepLearning', name: 'Deep Learning', era: 3, cost: { data: 20, software: 20, research: 25 }, effects: [{ type: 'production_add', target: 'research', value: 0.8 }, { type: 'production_add', target: 'software', value: 0.5 }], description: 'Deep learning triples research and generates software', prerequisites: ['bigData'] },
  iotNetwork: { id: 'iotNetwork', name: 'IoT Network', era: 3, cost: { electronics: 25, data: 15, software: 12 }, effects: [{ type: 'production_add', target: 'electronics', value: 0.4 }, { type: 'production_add', target: 'data', value: 0.4 }], description: 'Connected devices double electronics and data output', prerequisites: ['cloudComputing'] },
  quantumEncryption: { id: 'quantumEncryption', name: 'Quantum Encryption', era: 3, cost: { research: 30, software: 25, data: 15 }, effects: [{ type: 'cap_mult', target: 'data', value: 5 }, { type: 'production_add', target: 'software', value: 0.4 }], description: 'Unbreakable encryption expands data capacity x5 and doubles software', prerequisites: ['encryptionProtocol'] },

  // Era 4
  plasmaEngine: { id: 'plasmaEngine', name: 'Plasma Engine', era: 4, cost: { rocketFuel: 20, research: 30, energy: 25 }, effects: [{ type: 'production_add', target: 'rocketFuel', value: 1.2 }, { type: 'production_add', target: 'energy', value: 0.6 }], description: 'Plasma propulsion triples fuel efficiency and doubles energy', prerequisites: ['reusableRockets'] },
  astrometryLab: { id: 'astrometryLab', name: 'Astrometry Lab', era: 4, cost: { research: 30, data: 20, orbitalInfra: 8 }, effects: [{ type: 'production_add', target: 'data', value: 1.2 }, { type: 'production_add', target: 'research', value: 0.6 }], description: 'Precision astrometry triples data and doubles research', prerequisites: ['orbitalTelescope'] },

  // Era 5
  quantumReactor: { id: 'quantumReactor', name: 'Quantum Reactor', era: 5, cost: { exoticMaterials: 25, research: 50, energy: 60 }, effects: [{ type: 'production_add', target: 'energy', value: 4 }, { type: 'production_add', target: 'exoticMaterials', value: 0.5 }], description: 'Quantum energy reactions yield x5 energy and exotic byproducts', prerequisites: ['gravitySiphon'] },
  venusDome: { id: 'venusDome', name: 'Venus Dome', era: 5, cost: { colonies: 3, exoticMaterials: 18, rocketFuel: 35 }, effects: [{ type: 'production_add', target: 'colonies', value: 0.2 }, { type: 'production_add', target: 'food', value: 2 }], description: 'Floating domes on Venus grow exotic crops and expand colonies', prerequisites: ['terraforming'] },
  kuiperStation: { id: 'kuiperStation', name: 'Kuiper Station', era: 5, cost: { orbitalInfra: 18, rocketFuel: 30, research: 35 }, effects: [{ type: 'production_add', target: 'research', value: 1 }, { type: 'production_add', target: 'exoticMaterials', value: 0.3 }], description: 'Research station in the Kuiper belt yields discoveries and materials', prerequisites: ['cometHarvester'] },

  // Era 6
  darkMatterProbe: { id: 'darkMatterProbe', name: 'Dark Matter Probe', era: 6, cost: { darkEnergy: 30, research: 70, starSystems: 4 }, effects: [{ type: 'production_add', target: 'darkEnergy', value: 0.8 }, { type: 'production_add', target: 'research', value: 3.2 }], description: 'Probes detect dark matter — boosts dark energy and triples research', prerequisites: ['warpDrive'] },
  starForge: { id: 'starForge', name: 'Star Forge', era: 6, cost: { starSystems: 6, exoticMaterials: 50, energy: 200 }, effects: [{ type: 'production_add', target: 'exoticMaterials', value: 3.2 }, { type: 'production_add', target: 'steel', value: 6.4 }], description: 'Forge materials in stellar cores — x3 exotic and x5 steel', prerequisites: ['dysonSwarms'] },
  quantumRadio: { id: 'quantumRadio', name: 'Quantum Radio', era: 6, cost: { electronics: 45, research: 60, galacticInfluence: 15 }, effects: [{ type: 'production_add', target: 'galacticInfluence', value: 1.6 }, { type: 'production_add', target: 'data', value: 3.2 }], description: 'Instant quantum communication doubles influence and triples data', prerequisites: ['aiGovernance'] },

  // Era 7
  astralLoom: { id: 'astralLoom', name: 'Astral Loom', era: 7, cost: { stellarForge: 14, megastructures: 5, exoticMaterials: 40 }, effects: [{ type: 'production_add', target: 'exoticMaterials', value: 9.6 }, { type: 'production_add', target: 'stellarForge', value: 0.5 }], description: 'Weave exotic materials from starlight — x5 exotic output', prerequisites: ['stellarNursery'] },
  cosmicLens: { id: 'cosmicLens', name: 'Cosmic Lens', era: 7, cost: { research: 100, megastructures: 6, darkEnergy: 40 }, effects: [{ type: 'production_add', target: 'research', value: 9.6 }, { type: 'production_add', target: 'megastructures', value: 0.1 }], description: 'Gravitational lens amplifies research x5 across star systems', prerequisites: ['gravitonLens'] },

  // Era 8
  voidResonator: { id: 'voidResonator', name: 'Void Resonator', era: 8, cost: { exoticMatter: 25, darkEnergy: 45, research: 150 }, effects: [{ type: 'production_add', target: 'darkEnergy', value: 8 }, { type: 'production_add', target: 'exoticMatter', value: 4 }], description: 'Resonate with the void — x3 dark energy and x2 exotic matter', prerequisites: ['darkMatterHarvest'] },
  galacticMind: { id: 'galacticMind', name: 'Galactic Mind', era: 8, cost: { galacticInfluence: 80, research: 160, cosmicPower: 12 }, effects: [{ type: 'production_add', target: 'research', value: 16 }, { type: 'production_add', target: 'galacticInfluence', value: 8 }], description: 'A networked galactic consciousness — x5 research and x3 influence', prerequisites: ['culturalAssimilation'] },
  quantumAnvil: { id: 'quantumAnvil', name: 'Quantum Anvil', era: 8, cost: { exoticMatter: 30, stellarForge: 15, megastructures: 8 }, effects: [{ type: 'production_add', target: 'stellarForge', value: 8 }, { type: 'production_add', target: 'exoticMatter', value: 1.5 }], description: 'Forge matter at quantum precision — x3 stellar forge and +1.5 exotic/s', prerequisites: ['matterReplicators'] },

  // Era 9
  entropyLens: { id: 'entropyLens', name: 'Entropy Lens', era: 9, cost: { universalConstants: 12, cosmicPower: 100, darkEnergy: 70 }, effects: [{ type: 'production_add', target: 'cosmicPower', value: 12 }, { type: 'production_add', target: 'universalConstants', value: 6 }], description: 'Focus entropy into power — x3 cosmic and x2 constants', prerequisites: ['entropyReversal'] },
  dimensionalBeacon: { id: 'dimensionalBeacon', name: 'Dimensional Beacon', era: 9, cost: { cosmicPower: 90, universalConstants: 10, realityFragments: 5 }, effects: [{ type: 'production_add', target: 'realityFragments', value: 0.5 }, { type: 'production_add', target: 'cosmicPower', value: 6 }], description: 'Beacon across dimensions draws reality fragments', prerequisites: ['voidBridges'] },
  cosmicSynthesizer: { id: 'cosmicSynthesizer', name: 'Cosmic Synthesizer', era: 9, cost: { universalConstants: 15, exoticMatter: 50, cosmicPower: 120 }, effects: [{ type: 'production_add', target: 'exoticMatter', value: 24 }, { type: 'production_add', target: 'universalConstants', value: 0.3 }], description: 'Synthesize exotic matter from cosmic energy — x5 exotic matter', prerequisites: ['cosmicInfrastructure'] },

  // Era 10
  echoMatrix: { id: 'echoMatrix', name: 'Echo Matrix', era: 10, cost: { quantumEchoes: 80, realityFragments: 120, cosmicPower: 350 }, effects: [{ type: 'production_add', target: 'quantumEchoes', value: 75 }, { type: 'production_add', target: 'cosmicPower', value: 40 }], description: 'Matrix of echoes across realities — x10 echoes and x5 cosmic power', prerequisites: ['parallelProcessing'] },
  infiniteLattice: { id: 'infiniteLattice', name: 'Infinite Lattice', era: 10, cost: { universalConstants: 35, quantumEchoes: 90, realityFragments: 140 }, effects: [{ type: 'production_add', target: 'universalConstants', value: 75 }, { type: 'production_add', target: 'realityFragments', value: 40 }], description: 'An infinite lattice of constants — x10 constants and x5 fragments', prerequisites: ['omniscienceEngine'] },

  // --- 33 new upgrades (3+ per era) ---

  // Era 1
  apprenticeSmith: { id: 'apprenticeSmith', name: 'Apprentice Smith', era: 1, cost: { materials: 22, labor: 12, energy: 8 }, effects: [{ type: 'production_add', target: 'steel', value: 0.2 }, { type: 'production_add', target: 'labor', value: 0.2 }], description: 'Train apprentice smiths — early steel trickle and double labor', prerequisites: ['copperMine'] },
  huntingParty: { id: 'huntingParty', name: 'Hunting Party', era: 1, cost: { food: 20, labor: 15, materials: 10 }, effects: [{ type: 'production_add', target: 'food', value: 0.4 }, { type: 'production_add', target: 'materials', value: 0.2 }], description: 'Organized hunting triples food and yields hides for materials', prerequisites: ['animalHusbandry'] },
  stoneQuarry: { id: 'stoneQuarry', name: 'Stone Quarry', era: 1, cost: { labor: 18, materials: 15, energy: 10 }, effects: [{ type: 'production_add', target: 'materials', value: 0.2 }, { type: 'cap_mult', target: 'materials', value: 3 }], description: 'Stone quarry doubles material output and triples capacity', prerequisites: ['ropeAndPulley'] },
  potteryKiln: { id: 'potteryKiln', name: 'Pottery Kiln', era: 1, cost: { materials: 14, energy: 12, labor: 8 }, effects: [{ type: 'cap_mult', target: 'food', value: 2 }, { type: 'production_add', target: 'materials', value: 0.3 }], description: 'Pottery stores food and provides trade goods', prerequisites: ['charcoalPit'] },

  // Era 2
  chemicalWorks: { id: 'chemicalWorks', name: 'Chemical Works', era: 2, cost: { steel: 22, energy: 18, research: 10 }, effects: [{ type: 'production_add', target: 'energy', value: 0.3 }, { type: 'production_add', target: 'research', value: 0.3 }], description: 'Chemical processing doubles energy and enables early research', prerequisites: ['chemicalPlant'] },
  textileMill: { id: 'textileMill', name: 'Textile Mill', era: 2, cost: { steel: 12, food: 18, labor: 15 }, effects: [{ type: 'production_add', target: 'food', value: 0.3 }, { type: 'production_add', target: 'labor', value: 0.3 }], description: 'Textile manufacturing doubles food trade value and labor efficiency', prerequisites: ['canningFactory'] },

  // Era 3
  roboticsLab: { id: 'roboticsLab', name: 'Robotics Lab', era: 3, cost: { research: 25, electronics: 18, software: 15 }, effects: [{ type: 'production_add', target: 'labor', value: 1.6 }, { type: 'production_add', target: 'electronics', value: 0.5 }], description: 'Advanced robotics multiplies labor x5 and generates electronics', prerequisites: ['autonomousDrone'] },
  edgeDrones: { id: 'edgeDrones', name: 'Edge Drones', era: 3, cost: { electronics: 20, software: 14, data: 12 }, effects: [{ type: 'production_add', target: 'data', value: 0.4 }, { type: 'production_add', target: 'electronics', value: 0.3 }], description: 'Edge computing drones double data and generate electronics', prerequisites: ['energyMatrix'] },

  // Era 4
  marsOutpost: { id: 'marsOutpost', name: 'Mars Outpost', era: 4, cost: { rocketFuel: 25, steel: 35, food: 30 }, effects: [{ type: 'production_add', target: 'research', value: 0.5 }, { type: 'production_add', target: 'exoticMaterials', value: 0.1 }], description: 'A Martian outpost yields research and trace exotic materials', prerequisites: ['marsRover'] },
  orbitalRefinery: { id: 'orbitalRefinery', name: 'Orbital Refinery', era: 4, cost: { orbitalInfra: 12, steel: 28, energy: 20 }, effects: [{ type: 'production_add', target: 'steel', value: 1.2 }, { type: 'production_add', target: 'exoticMaterials', value: 0.1 }], description: 'Refine ores in orbit — triple steel and produce exotic byproducts', prerequisites: ['spaceDebrisCollector','zeroGManufacturing'] },
  lightSail: { id: 'lightSail', name: 'Light Sail', era: 4, cost: { electronics: 18, rocketFuel: 12, research: 20 }, effects: [{ type: 'production_add', target: 'energy', value: 0.6 }, { type: 'production_add', target: 'rocketFuel', value: 0.6 }], description: 'Light sails double energy and fuel efficiency', prerequisites: ['solarArrays','solarSail'] },

  // Era 5
  heliumMiner: { id: 'heliumMiner', name: 'Helium-3 Miner', era: 5, cost: { rocketFuel: 30, exoticMaterials: 12, energy: 25 }, effects: [{ type: 'production_add', target: 'energy', value: 2 }, { type: 'production_add', target: 'rocketFuel', value: 0.5 }], description: 'Mine helium-3 from gas giants — triple energy and bonus fuel', prerequisites: ['fusionPower'] },

  // Era 6
  darkMatterAntenna: { id: 'darkMatterAntenna', name: 'Dark Matter Antenna', era: 6, cost: { darkEnergy: 28, research: 55, starSystems: 3 }, effects: [{ type: 'production_add', target: 'darkEnergy', value: 1.6 }, { type: 'production_add', target: 'research', value: 1 }], description: 'Detect dark matter signals — double dark energy and steady research', prerequisites: ['warpDrive'] },
  antimatterRefinery: { id: 'antimatterRefinery', name: 'Antimatter Refinery', era: 6, cost: { exoticMaterials: 40, energy: 120, darkEnergy: 20 }, effects: [{ type: 'production_add', target: 'exoticMaterials', value: 3.2 }, { type: 'production_add', target: 'energy', value: 6.4 }], description: 'Refine antimatter at scale — x3 exotic materials and x5 energy', prerequisites: ['dysonSwarms'] },

  // Era 7
  quantumStar: { id: 'quantumStar', name: 'Quantum Star', era: 7, cost: { stellarForge: 15, megastructures: 7, research: 90 }, effects: [{ type: 'production_add', target: 'stellarForge', value: 4.8 }, { type: 'production_add', target: 'research', value: 4.8 }], description: 'Engineer a quantum-state star — x3 forge and x3 research', prerequisites: ['starLifting'] },
  nicollDysonBeam: { id: 'nicollDysonBeam', name: 'Nicoll-Dyson Beam', era: 7, cost: { megastructures: 10, energy: 300, darkEnergy: 45 }, effects: [{ type: 'production_add', target: 'energy', value: 18 }, { type: 'production_add', target: 'galacticInfluence', value: 4.8 }], description: 'Focus a star into a beam — x10 energy and x3 influence projection', prerequisites: ['dysonSphere'] },
  temporalForge: { id: 'temporalForge', name: 'Temporal Forge', era: 7, cost: { stellarForge: 16, megastructures: 6, darkEnergy: 40 }, effects: [{ type: 'production_add', target: 'stellarForge', value: 0.5 }, { type: 'production_add', target: 'megastructures', value: 2.4 }], description: 'Forge materials across timelines — bonus forge output and x2 megastructures', prerequisites: ['stellarNursery'] },

  // Era 8
  intergalacticRelay: { id: 'intergalacticRelay', name: 'Intergalactic Relay', era: 8, cost: { galacticInfluence: 60, darkEnergy: 50, research: 140 }, effects: [{ type: 'production_add', target: 'galacticInfluence', value: 8 }, { type: 'production_add', target: 'research', value: 8 }], description: 'Relay signals between galaxies — x3 influence and x3 research', prerequisites: ['galacticSenate'] },
  voidCondenser: { id: 'voidCondenser', name: 'Void Condenser', era: 8, cost: { darkEnergy: 55, exoticMatter: 25, cosmicPower: 10 }, effects: [{ type: 'production_add', target: 'darkEnergy', value: 16 }, { type: 'production_add', target: 'cosmicPower', value: 0.3 }], description: 'Condense void energy — x5 dark energy and trickle cosmic power', prerequisites: ['darkMatterHarvest'] },

  // Era 9
  cosmicLattice: { id: 'cosmicLattice', name: 'Cosmic Lattice', era: 9, cost: { cosmicPower: 100, universalConstants: 12, exoticMatter: 45 }, effects: [{ type: 'production_add', target: 'cosmicPower', value: 12 }, { type: 'production_add', target: 'exoticMatter', value: 12 }], description: 'A lattice of cosmic filaments — x3 cosmic power and x3 exotic matter', prerequisites: ['cosmicInfrastructure'] },
  temporalArchive: { id: 'temporalArchive', name: 'Temporal Archive', era: 9, cost: { universalConstants: 14, cosmicPower: 110, research: 260 }, effects: [{ type: 'production_add', target: 'universalConstants', value: 12 }, { type: 'production_add', target: 'research', value: 5 }], description: 'Archive knowledge across time — x3 constants and +5 research/s', prerequisites: ['universalTranslator'] },

  // Era 10
  paradoxEngine: { id: 'paradoxEngine', name: 'Paradox Engine', era: 10, cost: { quantumEchoes: 85, realityFragments: 130, universalConstants: 28 }, effects: [{ type: 'production_add', target: 'quantumEchoes', value: 40 }, { type: 'production_add', target: 'universalConstants', value: 40 }], description: 'Harness paradoxes — x5 echoes and x5 constants from logical contradictions', prerequisites: ['parallelProcessing'] },
  multiversalNexus: { id: 'multiversalNexus', name: 'Multiversal Nexus', era: 10, cost: { realityFragments: 160, quantumEchoes: 70, cosmicPower: 400 }, effects: [{ type: 'production_add', target: 'realityFragments', value: 75 }, { type: 'production_add', target: 'cosmicPower', value: 10 }], description: 'A nexus linking all realities — x10 fragments and +10 cosmic/s', prerequisites: ['omniscienceEngine'] },
  eternalCatalyst: { id: 'eternalCatalyst', name: 'Eternal Catalyst', era: 10, cost: { quantumEchoes: 110, universalConstants: 32, realityFragments: 110 }, effects: [{ type: 'production_add', target: 'cosmicPower', value: 75 }, { type: 'production_add', target: 'darkEnergy', value: 75 }, { type: 'production_add', target: 'exoticMatter', value: 75 }], description: 'An eternal catalyst transmuting all cosmic resources — x10 cosmic trio', prerequisites: ['multiversalHarmony'] },

  // --- 30 new upgrades (3 per era) ---

  // Era 1
  clayPit: { id: 'clayPit', name: 'Clay Pit', era: 1, cost: { labor: 12, materials: 8 }, effects: [{ type: 'production_add', target: 'materials', value: 0.4 }, { type: 'cap_mult', target: 'materials', value: 2 }], description: 'Dig clay for building — steady materials and expanded storage', prerequisites: ['stoneMason'] },
  charcoalKiln: { id: 'charcoalKiln', name: 'Charcoal Kiln', era: 1, cost: { materials: 18, labor: 14, food: 10 }, effects: [{ type: 'production_add', target: 'energy', value: 0.2 }, { type: 'production_add', target: 'materials', value: 0.2 }], description: 'Burn wood into charcoal — double energy and extra materials', prerequisites: ['charcoalOven'] },

  // Era 2

  // Era 3
  blockchainLedger: { id: 'blockchainLedger', name: 'Blockchain Ledger', era: 3, cost: { software: 20, data: 15, electronics: 18 }, effects: [{ type: 'production_add', target: 'data', value: 0.8 }, { type: 'cap_mult', target: 'software', value: 3 }], description: 'Distributed ledger triples data output and expands software capacity', prerequisites: ['blockchain'] },

  // Era 4
  marsColony: { id: 'marsColony', name: 'Mars Colony', era: 4, cost: { rocketFuel: 25, steel: 35, food: 50, orbitalInfra: 8 }, effects: [{ type: 'production_add', target: 'research', value: 0.4 }, { type: 'production_add', target: 'materials', value: 0.3 }], description: 'A Martian outpost provides steady research and materials', prerequisites: ['marsOutpost'] },
  orbitalShipyard: { id: 'orbitalShipyard', name: 'Orbital Shipyard', era: 4, cost: { orbitalInfra: 15, steel: 40, electronics: 20 }, effects: [{ type: 'production_add', target: 'orbitalInfra', value: 0.6 }, { type: 'production_add', target: 'steel', value: 0.3 }], description: 'Build ships in orbit — double infrastructure and steady steel', prerequisites: ['orbitalFactory'] },

  // Era 5
  jupiterStation: { id: 'jupiterStation', name: 'Jupiter Station', era: 5, cost: { rocketFuel: 80, exoticMaterials: 25, energy: 100 }, effects: [{ type: 'production_add', target: 'rocketFuel', value: 2 }, { type: 'production_add', target: 'exoticMaterials', value: 0.5 }], description: 'A station in Jupiter orbit — triple fuel and exotic material harvesting', prerequisites: ['ringStation'] },
  cryogenicVaults: { id: 'cryogenicVaults', name: 'Cryogenic Vaults', era: 5, cost: { exoticMaterials: 18, research: 50, energy: 60 }, effects: [{ type: 'cap_mult', target: 'exoticMaterials', value: 3 }, { type: 'cap_mult', target: 'colonies', value: 2 }], description: 'Preserve resources and colonists — triple exotic material and double colony capacity', prerequisites: ['cryogenicVault'] },
  gravityTractor: { id: 'gravityTractor', name: 'Gravity Tractor', era: 5, cost: { orbitalInfra: 30, research: 60, exoticMaterials: 15 }, effects: [{ type: 'production_add', target: 'colonies', value: 2 }, { type: 'production_add', target: 'orbitalInfra', value: 0.3 }], description: 'Redirect asteroids into orbit — triple colony growth and boost infrastructure', prerequisites: ['exoplanetSurvey'] },

  // Era 6
  hyperspaceLane: { id: 'hyperspaceLane', name: 'Hyperspace Lane', era: 6, cost: { darkEnergy: 30, starSystems: 8, research: 70 }, effects: [{ type: 'production_add', target: 'starSystems', value: 1.6 }, { type: 'production_add', target: 'darkEnergy', value: 1.6 }], description: 'Established hyperspace lanes double star system and dark energy output', prerequisites: ['stellarCartography'] },
  voidShield: { id: 'voidShield', name: 'Void Shield', era: 6, cost: { darkEnergy: 25, exoticMaterials: 30, energy: 80 }, effects: [{ type: 'cap_mult', target: 'darkEnergy', value: 3 }, { type: 'production_add', target: 'energy', value: 6.4 }], description: 'Shield against void hazards — triple dark energy capacity and x5 energy', prerequisites: ['dysonSwarms'] },

  // Era 7
  stellarCompressor: { id: 'stellarCompressor', name: 'Stellar Compressor', era: 7, cost: { stellarForge: 14, megastructures: 5, energy: 180 }, effects: [{ type: 'production_add', target: 'stellarForge', value: 2.4 }, { type: 'production_add', target: 'exoticMaterials', value: 4.8 }], description: 'Compress stellar matter — double forge and triple exotic materials', prerequisites: ['starLifting'] },
  chronoAccelerator: { id: 'chronoAccelerator', name: 'Chrono-Accelerator', era: 7, cost: { megastructures: 8, darkEnergy: 40, research: 100 }, effects: [{ type: 'production_add', target: 'research', value: 9.6 }, { type: 'production_add', target: 'software', value: 9.6 }], description: 'Accelerate local time — x5 research and software output', prerequisites: ['matrioshkaBrain'] },
  darkForge: { id: 'darkForge', name: 'Dark Forge', era: 7, cost: { darkEnergy: 45, stellarForge: 10, exoticMaterials: 25 }, effects: [{ type: 'production_add', target: 'darkEnergy', value: 4.8 }, { type: 'production_add', target: 'megastructures', value: 0.05 }], description: 'Forge with dark energy — triple dark energy and trickle megastructures', prerequisites: ['dysonSphere'] },

  // Era 8
  voidAntenna: { id: 'voidAntenna', name: 'Void Antenna', era: 8, cost: { darkEnergy: 70, cosmicPower: 8, research: 120 }, effects: [{ type: 'production_add', target: 'darkEnergy', value: 8 }, { type: 'production_add', target: 'cosmicPower', value: 0.2 }], description: 'Listen to the void — triple dark energy and trickle cosmic power', prerequisites: ['darkMatterHarvest'] },
  federationCharter: { id: 'federationCharter', name: 'Federation Charter', era: 8, cost: { galacticInfluence: 120, starSystems: 60, colonies: 30 }, effects: [{ type: 'production_add', target: 'galacticInfluence', value: 8 }, { type: 'production_add', target: 'colonies', value: 8 }], description: 'A charter uniting civilizations — x3 influence and x3 colonies', prerequisites: ['galacticSenate'] },

  // Era 9
  singularityDrive: { id: 'singularityDrive', name: 'Singularity Drive', era: 9, cost: { cosmicPower: 90, universalConstants: 8, exoticMatter: 40 }, effects: [{ type: 'production_add', target: 'cosmicPower', value: 12 }, { type: 'production_add', target: 'exoticMatter', value: 6 }], description: 'A drive powered by singularities — x3 cosmic power and x2 exotic matter', prerequisites: ['cosmicInfrastructure'] },
  dimensionalScanner: { id: 'dimensionalScanner', name: 'Dimensional Scanner', era: 9, cost: { universalConstants: 10, cosmicPower: 70, darkEnergy: 50 }, effects: [{ type: 'production_add', target: 'universalConstants', value: 6 }, { type: 'production_add', target: 'realityFragments', value: 0.1 }], description: 'Scan adjacent dimensions — double constants and trickle reality fragments', prerequisites: ['voidBridges'] },
  temporalLoop: { id: 'temporalLoop', name: 'Temporal Loop', era: 9, cost: { cosmicPower: 120, universalConstants: 12, research: 200 }, effects: [{ type: 'production_add', target: 'research', value: 24 }, { type: 'production_add', target: 'cosmicPower', value: 6 }], description: 'Loop time for efficiency — x5 research and x2 cosmic power', prerequisites: ['entropyReversal'] },

  // Era 10
  infinityWell: { id: 'infinityWell', name: 'Infinity Well', era: 10, cost: { quantumEchoes: 60, realityFragments: 90, cosmicPower: 300 }, effects: [{ type: 'production_add', target: 'quantumEchoes', value: 20 }, { type: 'production_add', target: 'cosmicPower', value: 40 }], description: 'A well of infinite potential — x3 echoes and x5 cosmic power', prerequisites: ['parallelProcessing'] },
  realityAnchor: { id: 'realityAnchor', name: 'Reality Anchor', era: 10, cost: { realityFragments: 120, universalConstants: 20, exoticMatter: 80 }, effects: [{ type: 'production_add', target: 'realityFragments', value: 40 }, { type: 'production_add', target: 'universalConstants', value: 20 }], description: 'Anchor realities in place — x5 fragments and x3 constants', prerequisites: ['dimensionalAnchors'] },
  omniversalForge: { id: 'omniversalForge', name: 'Omniversal Forge', era: 10, cost: { quantumEchoes: 90, realityFragments: 150, universalConstants: 25 }, effects: [{ type: 'production_add', target: 'quantumEchoes', value: 40 }, { type: 'production_add', target: 'realityFragments', value: 40 }, { type: 'production_add', target: 'exoticMatter', value: 40 }], description: 'Forge across all realities — x5 echoes, fragments, and exotic matter', prerequisites: ['omniscienceEngine'] },

  // --- 33 new upgrades (3+ per era) ---

  // Era 1
  beeKeeping: { id: 'beeKeeping', name: 'Bee Keeping', era: 1, cost: { food: 18, materials: 12, labor: 10 }, effects: [{ type: 'production_add', target: 'food', value: 0.2 }, { type: 'production_add', target: 'energy', value: 0.2 }], description: 'Domesticated bees pollinate crops and produce wax for candles', prerequisites: ['fishTrap'] },
  copperSmelter: { id: 'copperSmelter', name: 'Copper Smelter', era: 1, cost: { materials: 28, energy: 18, labor: 14 }, effects: [{ type: 'production_add', target: 'energy', value: 0.2 }, { type: 'production_add', target: 'steel', value: 0.15 }], description: 'Smelt copper ore for early metalwork and improved energy conductors', prerequisites: ['advancedTools'] },

  // Era 2
  blastFurnace: { id: 'blastFurnace', name: 'Blast Furnace', era: 2, cost: { steel: 20, energy: 22, materials: 18 }, effects: [{ type: 'production_add', target: 'steel', value: 0.6 }, { type: 'production_add', target: 'energy', value: 0.5 }], description: 'Industrial blast furnaces triple steel output with waste heat recovery', prerequisites: ['oilRefinery'] },
  railroadExpansion: { id: 'railroadExpansion', name: 'Railroad Expansion', era: 2, cost: { steel: 18, labor: 22, materials: 15 }, effects: [{ type: 'production_add', target: 'materials', value: 0.6 }, { type: 'production_add', target: 'food', value: 0.3 }], description: 'Extended rail lines triple material transport and double food distribution', prerequisites: ['laborUnion'] },
  clockwork: { id: 'clockwork', name: 'Clockwork Automation', era: 2, cost: { electronics: 12, steel: 15, research: 8 }, effects: [{ type: 'production_add', target: 'electronics', value: 0.3 }, { type: 'production_add', target: 'labor', value: 0.3 }], description: 'Precision clockwork mechanisms automate delicate tasks', prerequisites: ['wirelessTelegraph'] },

  // Era 3
  neuralChip: { id: 'neuralChip', name: 'Neural Chip', era: 3, cost: { electronics: 25, software: 20, research: 30 }, effects: [{ type: 'production_add', target: 'electronics', value: 0.8 }, { type: 'production_add', target: 'data', value: 0.4 }], description: 'Brain-computer interface chips triple electronics and double data output', prerequisites: ['roboticsLab'] },
  meshNetwork: { id: 'meshNetwork', name: 'Mesh Network', era: 3, cost: { software: 18, electronics: 22, data: 14 }, effects: [{ type: 'production_add', target: 'software', value: 0.4 }, { type: 'production_add', target: 'data', value: 0.8 }], description: 'Decentralized mesh networks double software and generate steady data', prerequisites: ['fiberOptic'] },

  // Era 4
  plasmaThrusters: { id: 'plasmaThrusters', name: 'Plasma Thrusters', era: 4, cost: { rocketFuel: 22, research: 28, electronics: 18 }, effects: [{ type: 'production_add', target: 'rocketFuel', value: 0.6 }, { type: 'production_add', target: 'orbitalInfra', value: 0.3 }], description: 'Efficient plasma propulsion doubles fuel economy and builds infrastructure', prerequisites: ['plasmaEngine'] },
  moonMiningFacility: { id: 'moonMiningFacility', name: 'Moon Mining Facility', era: 4, cost: { orbitalInfra: 10, steel: 30, rocketFuel: 18 }, effects: [{ type: 'production_add', target: 'materials', value: 0.8 }, { type: 'production_add', target: 'exoticMaterials', value: 0.15 }], description: 'Extract regolith and rare minerals from the lunar surface', prerequisites: ['lunarBase'] },
  orbitalLab: { id: 'orbitalLab', name: 'Orbital Laboratory', era: 4, cost: { research: 25, orbitalInfra: 8, electronics: 20 }, effects: [{ type: 'production_add', target: 'research', value: 0.6 }, { type: 'production_add', target: 'data', value: 0.4 }], description: 'Zero-gravity experiments double research output and generate data', prerequisites: ['orbitalTelescope'] },

  // Era 5
  oortCloudProbe: { id: 'oortCloudProbe', name: 'Oort Cloud Probe', era: 5, cost: { rocketFuel: 50, research: 45, exoticMaterials: 15 }, effects: [{ type: 'production_add', target: 'exoticMaterials', value: 0.6 }, { type: 'production_add', target: 'research', value: 1 }], description: 'Probes in the Oort Cloud discover exotic matter and new physics', prerequisites: ['jupiterStation'] },
  planetaryShield: { id: 'planetaryShield', name: 'Planetary Shield', era: 5, cost: { colonies: 5, exoticMaterials: 20, energy: 50 }, effects: [{ type: 'production_add', target: 'colonies', value: 2 }, { type: 'cap_mult', target: 'colonies', value: 3 }], description: 'Shield colonies from cosmic hazards — x3 colony growth and capacity', prerequisites: ['atmosphericProcessor'] },

  // Era 6
  subspaceRelay: { id: 'subspaceRelay', name: 'Subspace Relay', era: 6, cost: { darkEnergy: 22, starSystems: 4, research: 50 }, effects: [{ type: 'production_add', target: 'starSystems', value: 1.6 }, { type: 'production_add', target: 'darkEnergy', value: 0.5 }], description: 'Relay through subspace doubles star system discovery and adds dark energy', prerequisites: ['warpDrive'] },
  xenoBiome: { id: 'xenoBiome', name: 'Xeno-Biome', era: 6, cost: { starSystems: 6, food: 400, research: 65 }, effects: [{ type: 'production_add', target: 'food', value: 24 }, { type: 'production_add', target: 'colonies', value: 3.2 }], description: 'Cultivate alien biomes — x20 food and x3 colony viability', prerequisites: ['stellarCartography'] },

  // Era 7
  neutroniumForge: { id: 'neutroniumForge', name: 'Neutronium Forge', era: 7, cost: { stellarForge: 18, megastructures: 6, darkEnergy: 35 }, effects: [{ type: 'production_add', target: 'stellarForge', value: 4.8 }, { type: 'production_add', target: 'megastructures', value: 0.08 }], description: 'Forge neutronium from degenerate matter — x3 stellar forge and bonus megastructures', prerequisites: ['starLifting'] },
  hyperspaceTap: { id: 'hyperspaceTap', name: 'Hyperspace Tap', era: 7, cost: { darkEnergy: 50, megastructures: 8, energy: 200 }, effects: [{ type: 'production_add', target: 'darkEnergy', value: 4.8 }, { type: 'production_add', target: 'energy', value: 9.6 }], description: 'Tap hyperspace for energy — x3 dark energy and x5 energy', prerequisites: ['dysonSphere'] },
  stellarComputeGrid: { id: 'stellarComputeGrid', name: 'Stellar Compute Grid', era: 7, cost: { megastructures: 9, research: 120, software: 60 }, effects: [{ type: 'production_add', target: 'research', value: 9.6 }, { type: 'production_add', target: 'data', value: 9.6 }], description: 'A compute grid spanning stars — x5 research and x5 data', prerequisites: ['matrioshkaBrain'] },

  // Era 8
  darkMatterLoom: { id: 'darkMatterLoom', name: 'Dark Matter Loom', era: 8, cost: { exoticMatter: 35, darkEnergy: 50, megastructures: 12 }, effects: [{ type: 'production_add', target: 'exoticMatter', value: 8 }, { type: 'production_add', target: 'megastructures', value: 4 }], description: 'Weave dark matter into structures — x3 exotic matter and x2 megastructures', prerequisites: ['darkMatterHarvest'] },
  galacticAcademy: { id: 'galacticAcademy', name: 'Galactic Academy', era: 8, cost: { galacticInfluence: 70, research: 150, colonies: 25 }, effects: [{ type: 'production_add', target: 'research', value: 16 }, { type: 'production_add', target: 'galacticInfluence', value: 4 }], description: 'An academy for all species — x5 research and x2 influence', prerequisites: ['galacticSenate'] },
  voidSiphon: { id: 'voidSiphon', name: 'Void Siphon', era: 8, cost: { darkEnergy: 60, cosmicPower: 8, exoticMatter: 20 }, effects: [{ type: 'production_add', target: 'cosmicPower', value: 0.5 }, { type: 'production_add', target: 'darkEnergy', value: 8 }], description: 'Siphon energy from the void — x3 dark energy and trickle cosmic power', prerequisites: ['matterReplicators'] },

  // Era 9
  cosmicAmplifier: { id: 'cosmicAmplifier', name: 'Cosmic Amplifier', era: 9, cost: { cosmicPower: 110, darkEnergy: 60, research: 200 }, effects: [{ type: 'production_add', target: 'cosmicPower', value: 24 }, { type: 'production_add', target: 'darkEnergy', value: 12 }], description: 'Amplify cosmic power x5 and dark energy x3 through resonance', prerequisites: ['cosmicInfrastructure'] },
  temporalAccumulator: { id: 'temporalAccumulator', name: 'Temporal Accumulator', era: 9, cost: { universalConstants: 16, cosmicPower: 130, galacticInfluence: 80 }, effects: [{ type: 'production_add', target: 'universalConstants', value: 12 }, { type: 'production_add', target: 'galacticInfluence', value: 24 }], description: 'Accumulate temporal knowledge — x3 constants and x5 influence', prerequisites: ['universalTranslator'] },

  // Era 10
  quantumForge: { id: 'quantumForge', name: 'Quantum Forge', era: 10, cost: { quantumEchoes: 70, realityFragments: 100, cosmicPower: 350 }, effects: [{ type: 'production_add', target: 'quantumEchoes', value: 40 }, { type: 'production_add', target: 'realityFragments', value: 20 }], description: 'Forge quantum echoes into reality — x5 echoes and x3 fragments', prerequisites: ['dimensionalAnchors'] },
  infiniteRegress: { id: 'infiniteRegress', name: 'Infinite Regress', era: 10, cost: { universalConstants: 30, quantumEchoes: 90, realityFragments: 120 }, effects: [{ type: 'production_add', target: 'universalConstants', value: 40 }, { type: 'production_add', target: 'cosmicPower', value: 40 }], description: 'Infinite recursion amplifies constants x5 and cosmic power x5', prerequisites: ['omniscienceEngine'] },
  realityHarvester: { id: 'realityHarvester', name: 'Reality Harvester', era: 10, cost: { realityFragments: 140, quantumEchoes: 60, universalConstants: 22 }, effects: [{ type: 'production_add', target: 'realityFragments', value: 75 }, { type: 'production_add', target: 'quantumEchoes', value: 2 }], description: 'Harvest fragments from dying realities — x10 fragments and +2 echoes/s', prerequisites: ['realityWeaving'] },

  // --- 30 new upgrades (3 per era) ---

  // Era 1
  stoneMason: { id: 'stoneMason', name: 'Stone Mason', era: 1, cost: { materials: 25, labor: 18 }, effects: [{ type: 'production_add', target: 'materials', value: 0.2 }, { type: 'cap_mult', target: 'materials', value: 2 }], description: 'Skilled masons double material output and storage', prerequisites: ['stoneQuarry'] },
  peatBog: { id: 'peatBog', name: 'Peat Bog Harvest', era: 1, cost: { energy: 15, materials: 18, labor: 10 }, effects: [{ type: 'production_add', target: 'energy', value: 0.2 }, { type: 'production_add', target: 'materials', value: 0.4 }], description: 'Harvest peat for fuel and building material', prerequisites: ['charcoalKiln'] },

  // Era 2
  telegraphNetwork: { id: 'telegraphNetwork', name: 'Telegraph Network', era: 2, cost: { electronics: 14, steel: 18, labor: 20 }, effects: [{ type: 'production_add', target: 'electronics', value: 0.3 }, { type: 'production_add', target: 'research', value: 0.3 }], description: 'Long-distance communication doubles electronics and aids research', prerequisites: ['industrialMemory'] },

  // Era 3
  virtualReality: { id: 'virtualReality', name: 'Virtual Reality', era: 3, cost: { software: 22, electronics: 28, data: 16 }, effects: [{ type: 'production_add', target: 'software', value: 0.4 }, { type: 'production_add', target: 'data', value: 0.4 }], description: 'Immersive VR doubles software development and data collection', prerequisites: ['openSource'] },
  quantumComputer: { id: 'quantumComputer', name: 'Quantum Computer', era: 3, cost: { research: 45, electronics: 35, data: 20 }, effects: [{ type: 'production_add', target: 'research', value: 0.8 }, { type: 'production_add', target: 'data', value: 0.8 }], description: 'Quantum computation triples research speed', prerequisites: ['generativeAI'] },
  socialNetwork: { id: 'socialNetwork', name: 'Social Network', era: 3, cost: { software: 15, data: 12, electronics: 18 }, effects: [{ type: 'production_add', target: 'data', value: 0.8 }, { type: 'production_add', target: 'software', value: 0.4 }], description: 'Social platforms triple data generation', prerequisites: ['temporalEcho','meshNetwork'] },

  // Era 4
  ionDrive: { id: 'ionDrive', name: 'Ion Drive', era: 4, cost: { rocketFuel: 20, research: 30, electronics: 22 }, effects: [{ type: 'production_add', target: 'rocketFuel', value: 0.6 }, { type: 'production_add', target: 'exoticMaterials', value: 0.1 }], description: 'Efficient ion propulsion doubles fuel economy', prerequisites: ['plasmaThrusters'] },
  spaceElevator: { id: 'spaceElevator', name: 'Space Elevator', era: 4, cost: { orbitalInfra: 12, steel: 35, energy: 28 }, effects: [{ type: 'production_add', target: 'orbitalInfra', value: 1.2 }, { type: 'production_add', target: 'materials', value: 0.5 }], description: 'A tether to orbit triples infrastructure buildup', prerequisites: ['refueling'] },
  gravityAssist: { id: 'gravityAssist', name: 'Gravity Assist Lab', era: 4, cost: { research: 32, orbitalInfra: 8, rocketFuel: 15 }, effects: [{ type: 'production_add', target: 'research', value: 0.6 }, { type: 'production_add', target: 'rocketFuel', value: 0.6 }], description: 'Master gravity slingshots for efficient travel', prerequisites: ['deepSpaceRelay'] },

  // Era 5
  cryoHabitat: { id: 'cryoHabitat', name: 'Cryo-Habitat', era: 5, cost: { colonies: 4, exoticMaterials: 18, energy: 40 }, effects: [{ type: 'production_add', target: 'colonies', value: 1 }, { type: 'cap_mult', target: 'colonies', value: 2 }], description: 'Cryogenic habitats double colony growth and capacity', prerequisites: ['venusDome'] },
  xenoArchaeology: { id: 'xenoArchaeology', name: 'Xeno-Archaeology', era: 5, cost: { research: 50, exoticMaterials: 16, colonies: 3 }, effects: [{ type: 'production_add', target: 'research', value: 2 }, { type: 'production_add', target: 'darkEnergy', value: 0.08 }], description: 'Study alien ruins for advanced knowledge', prerequisites: ['helium3Mining','nanofabricator'] },

  // Era 6
  warpBeacon: { id: 'warpBeacon', name: 'Warp Beacon', era: 6, cost: { darkEnergy: 28, starSystems: 5, energy: 80 }, effects: [{ type: 'production_add', target: 'darkEnergy', value: 1.6 }, { type: 'production_add', target: 'starSystems', value: 1.6 }], description: 'Beacons guide ships through warp — double dark energy and star systems', prerequisites: ['warpDrive'] },
  nebulaMiner: { id: 'nebulaMiner', name: 'Nebula Miner', era: 6, cost: { exoticMaterials: 40, starSystems: 4, research: 55 }, effects: [{ type: 'production_add', target: 'exoticMaterials', value: 3.2 }, { type: 'production_add', target: 'darkEnergy', value: 0.3 }], description: 'Mine nebulae for exotic materials and dark energy', prerequisites: ['stellarCartography'] },
  interstellarAcademy: { id: 'interstellarAcademy', name: 'Interstellar Academy', era: 6, cost: { research: 70, galacticInfluence: 15, colonies: 10 }, effects: [{ type: 'production_add', target: 'research', value: 6.4 }, { type: 'production_add', target: 'galacticInfluence', value: 1.6 }], description: 'An academy spanning star systems — x5 research and x2 influence', prerequisites: ['dysonSwarms'] },

  // Era 7
  chronoReactor: { id: 'chronoReactor', name: 'Chrono-Reactor', era: 7, cost: { stellarForge: 20, darkEnergy: 40, megastructures: 7 }, effects: [{ type: 'production_add', target: 'stellarForge', value: 2.4 }, { type: 'production_add', target: 'darkEnergy', value: 2.4 }], description: 'Reactors fueled by temporal loops — double forge and dark energy', prerequisites: ['starLifting'] },
  voidLattice: { id: 'voidLattice', name: 'Void Lattice', era: 7, cost: { megastructures: 10, darkEnergy: 55, energy: 180 }, effects: [{ type: 'production_add', target: 'megastructures', value: 4.8 }, { type: 'production_add', target: 'exoticMatter', value: 0.05 }], description: 'A lattice in the void triples megastructure production', prerequisites: ['dysonSphere'] },

  // Era 8
  galacticRelay: { id: 'galacticRelay', name: 'Galactic Relay', era: 8, cost: { galacticInfluence: 90, exoticMatter: 30, darkEnergy: 55 }, effects: [{ type: 'production_add', target: 'galacticInfluence', value: 8 }, { type: 'production_add', target: 'cosmicPower', value: 0.3 }], description: 'Relay influence across the galaxy — x3 influence and trickle cosmic power', prerequisites: ['galacticSenate'] },
  matterCondenser: { id: 'matterCondenser', name: 'Matter Condenser', era: 8, cost: { exoticMatter: 45, megastructures: 14, darkEnergy: 65 }, effects: [{ type: 'production_add', target: 'exoticMatter', value: 8 }, { type: 'production_add', target: 'darkEnergy', value: 4 }], description: 'Condense exotic matter from the void — x3 exotic matter and x2 dark energy', prerequisites: ['matterReplicators'] },
  cosmicArchive: { id: 'cosmicArchive', name: 'Cosmic Archive', era: 8, cost: { research: 160, galacticInfluence: 80, colonies: 20 }, effects: [{ type: 'production_add', target: 'research', value: 16 }, { type: 'production_add', target: 'universalConstants', value: 0.1 }], description: 'Archive cosmic knowledge — x5 research and trickle universal constants', prerequisites: ['darkMatterHarvest'] },

  // Era 9
  realityProbe: { id: 'realityProbe', name: 'Reality Probe', era: 9, cost: { universalConstants: 14, cosmicPower: 100, exoticMatter: 35 }, effects: [{ type: 'production_add', target: 'universalConstants', value: 6 }, { type: 'production_add', target: 'realityFragments', value: 0.15 }], description: 'Probe adjacent realities for knowledge', prerequisites: ['voidBridges'] },
  entropyEngine: { id: 'entropyEngine', name: 'Entropy Engine', era: 9, cost: { cosmicPower: 130, darkEnergy: 70, research: 220 }, effects: [{ type: 'production_add', target: 'cosmicPower', value: 12 }, { type: 'production_add', target: 'research', value: 12 }], description: 'Harness entropy for power — x3 cosmic power and x3 research', prerequisites: ['entropyReversal'] },
  voidCartographer: { id: 'voidCartographer', name: 'Void Cartographer', era: 9, cost: { universalConstants: 18, cosmicPower: 140, galacticInfluence: 90 }, effects: [{ type: 'production_add', target: 'universalConstants', value: 12 }, { type: 'production_add', target: 'exoticMatter', value: 12 }], description: 'Map the void between realities — x3 constants and x3 exotic matter', prerequisites: ['universalTranslator'] },

  // Era 10
  multiversalLoom: { id: 'multiversalLoom', name: 'Multiversal Loom', era: 10, cost: { quantumEchoes: 80, realityFragments: 110, cosmicPower: 380 }, effects: [{ type: 'production_add', target: 'quantumEchoes', value: 40 }, { type: 'production_add', target: 'realityFragments', value: 3 }], description: 'Weave echoes across realities — x5 quantum echoes and +3 fragments/s', prerequisites: ['dimensionalAnchors'] },
  paradoxResolver: { id: 'paradoxResolver', name: 'Paradox Resolver', era: 10, cost: { universalConstants: 28, quantumEchoes: 95, realityFragments: 130 }, effects: [{ type: 'production_add', target: 'universalConstants', value: 40 }, { type: 'production_add', target: 'realityFragments', value: 40 }], description: 'Resolve paradoxes to stabilize reality — x5 constants and x5 fragments', prerequisites: ['omniscienceEngine'] },
  echoAmplifier: { id: 'echoAmplifier', name: 'Echo Amplifier', era: 10, cost: { quantumEchoes: 100, realityFragments: 80, universalConstants: 20 }, effects: [{ type: 'production_add', target: 'quantumEchoes', value: 75 }, { type: 'production_add', target: 'cosmicPower', value: 20 }], description: 'Amplify quantum echoes from all realities — x10 echoes and x3 cosmic power', prerequisites: ['realityWeaving'] },
  // --- 30 new upgrades (3 per era) — agent batch ---

  // Era 1
  charcoalOven: { id: 'charcoalOven', name: 'Charcoal Oven', era: 1, cost: { materials: 22, energy: 12, labor: 14 }, effects: [{ type: 'production_add', target: 'energy', value: 0.2 }, { type: 'production_add', target: 'materials', value: 0.5 }], description: 'Burn wood into charcoal for efficient fuel', prerequisites: ['potteryKiln'] },
  grainBarn: { id: 'grainBarn', name: 'Grain Barn', era: 1, cost: { food: 28, materials: 20, labor: 10 }, effects: [{ type: 'cap_mult', target: 'food', value: 3 }, { type: 'production_add', target: 'food', value: 0.4 }], description: 'Store surplus grain for lean seasons', prerequisites: ['beeKeeping'] },
  copperMine: { id: 'copperMine', name: 'Copper Mine', era: 1, cost: { labor: 20, materials: 30, energy: 15 }, effects: [{ type: 'production_add', target: 'materials', value: 0.2 }, { type: 'production_add', target: 'labor', value: 0.2 }], description: 'Copper mining doubles material and labor output', prerequisites: ['deepMining'] },

  // Era 2
  railroadNetwork: { id: 'railroadNetwork', name: 'Railroad Network', era: 2, cost: { steel: 24, materials: 20, labor: 22 }, effects: [{ type: 'production_add', target: 'materials', value: 0.3 }, { type: 'production_add', target: 'steel', value: 0.3 }], description: 'Rail transport doubles materials and steel throughput', prerequisites: ['ironWorks'] },
  reagentPlant: { id: 'reagentPlant', name: 'Reagent Plant', era: 2, cost: { steel: 18, energy: 22, research: 10 }, effects: [{ type: 'production_add', target: 'energy', value: 0.3 }, { type: 'production_add', target: 'research', value: 0.5 }], description: 'Chemical processes double energy and boost research', prerequisites: ['chemicalWorks'] },

  // Era 3
  generativeAI: { id: 'generativeAI', name: 'Generative AI', era: 3, cost: { software: 28, data: 22, research: 30 }, effects: [{ type: 'production_add', target: 'data', value: 0.8 }, { type: 'production_add', target: 'research', value: 0.6 }], description: 'Generative models triple data processing', prerequisites: ['deepLearning'] },
  fogComputing: { id: 'fogComputing', name: 'Fog Computing', era: 3, cost: { electronics: 30, software: 18, data: 14 }, effects: [{ type: 'production_add', target: 'electronics', value: 0.4 }, { type: 'production_add', target: 'software', value: 0.4 }], description: 'Distributed fog nodes double electronics and software', prerequisites: ['edgeDrones'] },
  distributedLedger: { id: 'distributedLedger', name: 'Distributed Ledger', era: 3, cost: { data: 25, software: 20, energy: 18 }, effects: [{ type: 'production_add', target: 'data', value: 0.4 }, { type: 'cap_mult', target: 'data', value: 2 }], description: 'Immutable ledger doubles data output and capacity', prerequisites: ['blockchainLedger'] },

  // Era 4
  plasmaShield: { id: 'plasmaShield', name: 'Plasma Shield', era: 4, cost: { energy: 35, orbitalInfra: 10, research: 25 }, effects: [{ type: 'production_add', target: 'energy', value: 0.6 }, { type: 'cap_mult', target: 'orbitalInfra', value: 2 }], description: 'Plasma shielding doubles energy and orbital capacity', prerequisites: ['magneticShield'] },
  asteroidTug: { id: 'asteroidTug', name: 'Asteroid Tug', era: 4, cost: { rocketFuel: 22, steel: 28, orbitalInfra: 8 }, effects: [{ type: 'production_add', target: 'materials', value: 1.2 }, { type: 'production_add', target: 'exoticMaterials', value: 0.15 }], description: 'Redirect asteroids for raw materials', prerequisites: ['advancedMaterials'] },
  deepSpaceRelay: { id: 'deepSpaceRelay', name: 'Deep Space Relay', era: 4, cost: { electronics: 25, orbitalInfra: 12, research: 28 }, effects: [{ type: 'production_add', target: 'research', value: 0.6 }, { type: 'production_add', target: 'electronics', value: 0.6 }], description: 'Relay stations accelerate deep space research', prerequisites: ['xenobiology'] },

  // Era 5
  gravitySmelter: { id: 'gravitySmelter', name: 'Gravity Smelter', era: 5, cost: { exoticMaterials: 20, energy: 45, research: 35 }, effects: [{ type: 'production_add', target: 'exoticMaterials', value: 2 }, { type: 'production_add', target: 'steel', value: 1.5 }], description: 'Smelt materials in zero-g for exotic alloys', prerequisites: ['titanMining'] },
  bioReactor: { id: 'bioReactor', name: 'Bio-Reactor', era: 5, cost: { colonies: 5, food: 40, energy: 30 }, effects: [{ type: 'production_add', target: 'food', value: 2 }, { type: 'production_add', target: 'colonies', value: 1 }], description: 'Biological reactors sustain colonies and triple food', prerequisites: ['geneticEngineering'] },
  antimatterCollider: { id: 'antimatterCollider', name: 'Antimatter Collider', era: 5, cost: { rocketFuel: 30, research: 50, energy: 55 }, effects: [{ type: 'production_add', target: 'rocketFuel', value: 2 }, { type: 'production_add', target: 'research', value: 1 }], description: 'Collide antimatter for fuel and scientific discovery', prerequisites: ['antimatterDrive'] },

  // Era 6
  subspaceAntenna: { id: 'subspaceAntenna', name: 'Subspace Antenna', era: 6, cost: { darkEnergy: 30, starSystems: 6, research: 60 }, effects: [{ type: 'production_add', target: 'darkEnergy', value: 1.6 }, { type: 'production_add', target: 'research', value: 3.2 }], description: 'Broadcast through subspace for dark energy and research', prerequisites: ['stellarCartography'] },
  xenoHorticulture: { id: 'xenoHorticulture', name: 'Xeno-Horticulture', era: 6, cost: { colonies: 8, research: 55, food: 60 }, effects: [{ type: 'production_add', target: 'colonies', value: 1.6 }, { type: 'production_add', target: 'food', value: 6.4 }], description: 'Alien plants sustain colonies and multiply food', prerequisites: ['alienDiplomacy'] },

  // Era 7
  quasarTap: { id: 'quasarTap', name: 'Quasar Tap', era: 7, cost: { stellarForge: 22, darkEnergy: 45, energy: 200 }, effects: [{ type: 'production_add', target: 'energy', value: 9.6 }, { type: 'production_add', target: 'stellarForge', value: 0.5 }], description: 'Tap quasar jets for immense energy', prerequisites: ['stellarEngine'] },
  singularityForge: { id: 'singularityForge', name: 'Singularity Forge', era: 7, cost: { megastructures: 12, stellarForge: 18, research: 160 }, effects: [{ type: 'production_add', target: 'stellarForge', value: 4.8 }, { type: 'production_add', target: 'megastructures', value: 2.4 }], description: 'Forge materials at the event horizon', prerequisites: ['megastructureFoundry'] },
  neuronStar: { id: 'neuronStar', name: 'Neuron Star', era: 7, cost: { research: 180, stellarForge: 15, megastructures: 8 }, effects: [{ type: 'production_add', target: 'research', value: 9.6 }, { type: 'production_add', target: 'data', value: 2.5 }], description: 'A star-scale brain — x5 research and massive data', prerequisites: ['matrioshkaBrain'] },

  // Era 8
  cosmicFountain: { id: 'cosmicFountain', name: 'Cosmic Fountain', era: 8, cost: { exoticMatter: 40, darkEnergy: 60, galacticInfluence: 70 }, effects: [{ type: 'production_add', target: 'exoticMatter', value: 8 }, { type: 'production_add', target: 'cosmicPower', value: 0.4 }], description: 'A fountain of exotic matter from the cosmic void', prerequisites: ['darkMatterHarvest'] },
  influenceBeacon: { id: 'influenceBeacon', name: 'Influence Beacon', era: 8, cost: { galacticInfluence: 100, research: 150, megastructures: 12 }, effects: [{ type: 'production_add', target: 'galacticInfluence', value: 8 }, { type: 'production_add', target: 'research', value: 4 }], description: 'Broadcast influence across the galaxy', prerequisites: ['galacticSenate'] },

  // Era 9
  realityLens: { id: 'realityLens', name: 'Reality Lens', era: 9, cost: { universalConstants: 15, cosmicPower: 120, exoticMatter: 38 }, effects: [{ type: 'production_add', target: 'universalConstants', value: 12 }, { type: 'production_add', target: 'realityFragments', value: 6 }], description: 'Focus reality through a cosmic lens', prerequisites: ['voidBridges'] },
  entropyShield: { id: 'entropyShield', name: 'Entropy Shield', era: 9, cost: { cosmicPower: 140, darkEnergy: 75, research: 210 }, effects: [{ type: 'production_add', target: 'cosmicPower', value: 12 }, { type: 'cap_mult', target: 'cosmicPower', value: 2 }], description: 'Shield against entropy — x3 cosmic power and doubled capacity', prerequisites: ['entropyReversal'] },
  dimensionalAnchor: { id: 'dimensionalAnchor', name: 'Dimensional Anchor', era: 9, cost: { universalConstants: 18, cosmicPower: 110, realityFragments: 8 }, effects: [{ type: 'production_add', target: 'realityFragments', value: 12 }, { type: 'production_add', target: 'universalConstants', value: 0.3 }], description: 'Anchor dimensions for stable fragment harvesting', prerequisites: ['universalTranslator'] },

  // Era 10
  infinityFount: { id: 'infinityFount', name: 'Infinity Fount', era: 10, cost: { quantumEchoes: 85, realityFragments: 105, universalConstants: 24 }, effects: [{ type: 'production_add', target: 'quantumEchoes', value: 40 }, { type: 'production_add', target: 'universalConstants', value: 20 }], description: 'Draw from the infinite well of possibility', prerequisites: ['dimensionalAnchors'] },
  echoSynthesizer: { id: 'echoSynthesizer', name: 'Echo Synthesizer', era: 10, cost: { quantumEchoes: 75, realityFragments: 90, cosmicPower: 400 }, effects: [{ type: 'production_add', target: 'quantumEchoes', value: 75 }, { type: 'production_add', target: 'realityFragments', value: 2.5 }], description: 'Synthesize quantum echoes from raw reality', prerequisites: ['omniscienceEngine'] },
  multiversalHub: { id: 'multiversalHub', name: 'Multiversal Hub', era: 10, cost: { realityFragments: 150, universalConstants: 30, quantumEchoes: 100 }, effects: [{ type: 'production_add', target: 'realityFragments', value: 75 }, { type: 'production_add', target: 'cosmicPower', value: 40 }], description: 'A hub connecting all realities — x10 fragments and x5 cosmic power', prerequisites: ['realityWeaving'] },

  // --- 33 new upgrades (3+ per era) + balance fix parallel paths ---

  // Era 1
  herbGarden: { id: 'herbGarden', name: 'Herb Garden', era: 1, cost: { food: 12, labor: 8 }, effects: [{ type: 'production_add', target: 'food', value: 0.4 }, { type: 'production_add', target: 'energy', value: 0.2 }], description: 'Medicinal herbs improve health and boost food and energy', prerequisites: ['granary'] },
  watchTower: { id: 'watchTower', name: 'Watch Tower', era: 1, cost: { materials: 25, labor: 12, energy: 8 }, effects: [{ type: 'production_add', target: 'labor', value: 0.2 }, { type: 'cap_mult', target: 'energy', value: 2 }], description: 'Watch towers coordinate workers and protect energy stores', prerequisites: ['oxCart'] },

  // Era 2
  canalSystem: { id: 'canalSystem', name: 'Canal System', era: 2, cost: { steel: 18, materials: 25, labor: 20 }, effects: [{ type: 'production_add', target: 'food', value: 0.3 }, { type: 'production_add', target: 'materials', value: 0.5 }], description: 'Canals transport goods and irrigate distant fields', prerequisites: ['textileFactory'] },
  dynamoGenerator: { id: 'dynamoGenerator', name: 'Dynamo Generator', era: 2, cost: { steel: 22, electronics: 8, energy: 15 }, effects: [{ type: 'production_add', target: 'energy', value: 0.6 }, { type: 'production_add', target: 'electronics', value: 0.2 }], description: 'Electromagnetic generators triple energy and produce electronics', prerequisites: ['blastFurnace'] },
  laborUnion: { id: 'laborUnion', name: 'Labor Union', era: 2, cost: { food: 25, labor: 20, materials: 15 }, effects: [{ type: 'production_add', target: 'labor', value: 0.6 }, { type: 'cap_mult', target: 'labor', value: 2 }], description: 'Organized labor triples output and doubles capacity', prerequisites: ['conveyor'] },

  // Era 3
  neuralNetwork: { id: 'neuralNetwork', name: 'Neural Network', era: 3, cost: { software: 22, data: 18, research: 30 }, effects: [{ type: 'production_add', target: 'software', value: 0.4 }, { type: 'production_add', target: 'research', value: 0.4 }], description: 'Deep neural networks double software and research output', prerequisites: ['neuralChip'] },
  digitalTwin: { id: 'digitalTwin', name: 'Digital Twin', era: 3, cost: { software: 20, research: 25, data: 15 }, effects: [{ type: 'production_add', target: 'data', value: 0.8 }, { type: 'production_add', target: 'research', value: 0.5 }], description: 'Digital twins of physical systems triple data collection', prerequisites: ['virtualReality'] },

  // Era 4
  solarSail: { id: 'solarSail', name: 'Solar Sail', era: 4, cost: { research: 25, electronics: 20, rocketFuel: 10 }, effects: [{ type: 'production_add', target: 'energy', value: 1 }, { type: 'production_add', target: 'rocketFuel', value: 0.6 }], description: 'Solar sails harvest light pressure for energy and fuel savings', prerequisites: ['ionDrive'] },
  xenobiology: { id: 'xenobiology', name: 'Xenobiology', era: 4, cost: { research: 30, data: 15, food: 40 }, effects: [{ type: 'production_add', target: 'food', value: 1.2 }, { type: 'production_add', target: 'research', value: 0.5 }], description: 'Study alien biology to improve food production and research', prerequisites: ['astrometryLab'] },

  // Era 5
  cryogenicVault: { id: 'cryogenicVault', name: 'Cryogenic Vault', era: 5, cost: { colonies: 5, research: 40, steel: 60 }, effects: [{ type: 'cap_mult', target: 'colonies', value: 5 }, { type: 'production_add', target: 'colonies', value: 0.1 }], description: 'Preserve colonists in cryo — expand colony capacity and growth', prerequisites: ['gravityTractor'] },
  helium3Mining: { id: 'helium3Mining', name: 'Helium-3 Mining', era: 5, cost: { rocketFuel: 40, exoticMaterials: 15, orbitalInfra: 25 }, effects: [{ type: 'production_add', target: 'rocketFuel', value: 2 }, { type: 'production_add', target: 'energy', value: 2 }], description: 'Mine helium-3 from gas giants for fuel and energy', prerequisites: ['asteroidMining'] },

  // Era 6 (3 regular + already has parallel paths via warpDrive)
  darkEnergyRefinery: { id: 'darkEnergyRefinery', name: 'Dark Energy Refinery', era: 6, cost: { darkEnergy: 30, energy: 120, research: 70 }, effects: [{ type: 'production_add', target: 'darkEnergy', value: 3.2 }, { type: 'production_add', target: 'energy', value: 3 }], description: 'Refine raw dark energy into usable forms — x3 output', prerequisites: ['dysonSwarms'] },
  stellarForgePrototype: { id: 'stellarForgePrototype', name: 'Stellar Forge Prototype', era: 6, cost: { starSystems: 8, exoticMaterials: 60, darkEnergy: 30 }, effects: [{ type: 'production_add', target: 'stellarForge', value: 0.1 }, { type: 'production_add', target: 'exoticMaterials', value: 3.2 }], description: 'A prototype stellar forge — first step toward star-powered industry', prerequisites: ['dysonSwarms'] },
  quantumComms: { id: 'quantumComms', name: 'Quantum Communications', era: 6, cost: { research: 90, electronics: 80, starSystems: 4 }, effects: [{ type: 'production_add', target: 'data', value: 6.4 }, { type: 'production_add', target: 'software', value: 6.4 }], description: 'Instant quantum communication across star systems — x5 data and software', prerequisites: ['stellarCartography'] },

  // Era 7 — BALANCE FIX: add 2 upgrades with aiGovernance prereq for parallel entry
  stellarFoundry: { id: 'stellarFoundry', name: 'Stellar Foundry', era: 7, cost: { starSystems: 20, exoticMaterials: 100, research: 200 }, effects: [{ type: 'production_add', target: 'stellarForge', value: 0.2 }, { type: 'production_add', target: 'megastructures', value: 0.05 }], description: 'Build a stellar-scale foundry — first megastructure production', prerequisites: ['aiGovernance'] },
  cosmicForge: { id: 'cosmicForge', name: 'Cosmic Forge', era: 7, cost: { darkEnergy: 80, starSystems: 18, energy: 500 }, effects: [{ type: 'production_add', target: 'energy', value: 36 }, { type: 'production_add', target: 'darkEnergy', value: 1 }], description: 'Forge cosmic energy from starlight — massive energy and dark energy', prerequisites: ['aiGovernance'] },
  starForgeIgniter: { id: 'starForgeIgniter', name: 'Star Forge Igniter', era: 7, cost: { stellarForge: 14, megastructures: 5, darkEnergy: 40 }, effects: [{ type: 'production_add', target: 'stellarForge', value: 4.8 }, { type: 'production_add', target: 'megastructures', value: 0.1 }], description: 'Ignite stellar forges for maximum output', prerequisites: ['starLifting'] },

  // Era 8 — BALANCE FIX: add 2 upgrades with matrioshkaBrain prereq for parallel entry
  galacticFoundation: { id: 'galacticFoundation', name: 'Galactic Foundation', era: 8, cost: { galacticInfluence: 150, starSystems: 60, research: 400 }, effects: [{ type: 'production_add', target: 'galacticInfluence', value: 8 }, { type: 'production_add', target: 'exoticMatter', value: 0.3 }], description: 'Lay the foundation for galactic civilization — influence and exotic matter', prerequisites: ['matrioshkaBrain'] },
  cosmicLoom: { id: 'cosmicLoom', name: 'Cosmic Loom', era: 8, cost: { darkEnergy: 200, exoticMaterials: 200, megastructures: 15 }, effects: [{ type: 'production_add', target: 'darkEnergy', value: 16 }, { type: 'production_add', target: 'exoticMatter', value: 0.4 }], description: 'Weave dark energy into exotic matter — x5 dark energy and steady matter', prerequisites: ['matrioshkaBrain'] },
  exoticMatterForge: { id: 'exoticMatterForge', name: 'Exotic Matter Forge', era: 8, cost: { exoticMatter: 50, darkEnergy: 100, galacticInfluence: 80 }, effects: [{ type: 'production_add', target: 'exoticMatter', value: 8 }, { type: 'cap_mult', target: 'exoticMatter', value: 5 }], description: 'Forge exotic matter at scale — x3 output and x5 capacity', prerequisites: ['darkMatterHarvest'] },

  // Era 9 — BALANCE FIX: add 2 upgrades with matterReplicators prereq for parallel entry
  cosmicExpansion: { id: 'cosmicExpansion', name: 'Cosmic Expansion', era: 9, cost: { cosmicPower: 200, exoticMatter: 150, darkEnergy: 200 }, effects: [{ type: 'production_add', target: 'exoticMatter', value: 12 }, { type: 'production_add', target: 'cosmicPower', value: 2 }], description: 'Expand your cosmic domain — x3 exotic matter and steady cosmic power', prerequisites: ['matterReplicators'] },
  voidWeaver: { id: 'voidWeaver', name: 'Void Weaver', era: 9, cost: { cosmicPower: 250, darkEnergy: 180, galacticInfluence: 300 }, effects: [{ type: 'production_add', target: 'darkEnergy', value: 24 }, { type: 'production_add', target: 'universalConstants', value: 0.08 }], description: 'Weave the void itself — x5 dark energy and universal constants', prerequisites: ['matterReplicators'] },
  cosmicSentinel: { id: 'cosmicSentinel', name: 'Cosmic Sentinel', era: 9, cost: { cosmicPower: 150, universalConstants: 10, megastructures: 18 }, effects: [{ type: 'production_add', target: 'megastructures', value: 24 }, { type: 'production_add', target: 'cosmicPower', value: 6 }], description: 'Sentinels guard and amplify cosmic infrastructure', prerequisites: ['cosmicInfrastructure'] },

  // Era 10 — BALANCE FIX: add 2 upgrades with entropyReversal prereq for parallel entry
  realityForge: { id: 'realityForge', name: 'Reality Forge', era: 10, cost: { realityFragments: 40, universalConstants: 15, cosmicPower: 300 }, effects: [{ type: 'production_add', target: 'realityFragments', value: 20 }, { type: 'production_add', target: 'quantumEchoes', value: 0.5 }], description: 'Forge new realities from raw fragments — x3 output and quantum echoes', prerequisites: ['entropyReversal'] },
  dimensionalGateway: { id: 'dimensionalGateway', name: 'Dimensional Gateway', era: 10, cost: { universalConstants: 18, cosmicPower: 350, realityFragments: 30 }, effects: [{ type: 'production_add', target: 'realityFragments', value: 0.5 }, { type: 'production_add', target: 'universalConstants', value: 20 }], description: 'Open a gateway between dimensions — fragments and constants flow freely', prerequisites: ['entropyReversal'] },
  quantumHarvester: { id: 'quantumHarvester', name: 'Quantum Harvester', era: 10, cost: { quantumEchoes: 60, realityFragments: 80, cosmicPower: 250 }, effects: [{ type: 'production_add', target: 'quantumEchoes', value: 40 }, { type: 'production_add', target: 'cosmicPower', value: 3 }], description: 'Harvest quantum echoes from parallel realities — x5 echoes and cosmic power', prerequisites: ['dimensionalAnchors'] },

  // --- 33 new upgrades (3+ per era) ---

  // Era 1
  fishTrap: { id: 'fishTrap', name: 'Fish Trap', era: 1, cost: { food: 8, materials: 10, labor: 6 }, effects: [{ type: 'production_add', target: 'food', value: 0.8 }, { type: 'production_add', target: 'food', value: 0.2 }], description: 'Woven fish traps provide reliable protein — double food output', prerequisites: ['fishingWharf'] },

  // Era 2
  pneumaticPress: { id: 'pneumaticPress', name: 'Pneumatic Press', era: 2, cost: { steel: 30, energy: 25, labor: 15 }, effects: [{ type: 'production_add', target: 'steel', value: 0.3 }, { type: 'production_add', target: 'materials', value: 0.6 }], description: 'Compressed air presses shape metal efficiently — double steel', prerequisites: ['cementFactory'] },
  printingPress: { id: 'printingPress', name: 'Printing Press', era: 2, cost: { materials: 30, steel: 18, research: 15 }, effects: [{ type: 'production_add', target: 'research', value: 0.3 }, { type: 'cap_mult', target: 'research', value: 2 }], description: 'Mass-produced knowledge doubles research output and capacity', prerequisites: ['telephoneNetwork'] },

  // Era 3
  firewallMatrix: { id: 'firewallMatrix', name: 'Firewall Matrix', era: 3, cost: { software: 25, research: 20, data: 15 }, effects: [{ type: 'cap_mult', target: 'data', value: 3 }, { type: 'production_add', target: 'software', value: 0.5 }], description: 'Advanced firewalls protect data assets — triple data capacity', prerequisites: ['digitalTwin'] },

  // Era 4
  orbitalMirror: { id: 'orbitalMirror', name: 'Orbital Mirror', era: 4, cost: { energy: 100, orbitalInfra: 15, electronics: 50 }, effects: [{ type: 'production_add', target: 'energy', value: 2.4 }, { type: 'production_add', target: 'research', value: 1 }], description: 'Massive orbital mirrors redirect sunlight — x5 energy', prerequisites: ['asteroidTug'] },

  // Era 5
  atmosphericProcessor: { id: 'atmosphericProcessor', name: 'Atmospheric Processor', era: 5, cost: { colonies: 10, exoticMaterials: 40, energy: 200 }, effects: [{ type: 'production_add', target: 'colonies', value: 2 }, { type: 'production_add', target: 'food', value: 5 }], description: 'Process alien atmospheres into habitable environments', prerequisites: ['cryoHabitat'] },
  helium3Extractor: { id: 'helium3Extractor', name: 'Helium-3 Extractor', era: 5, cost: { energy: 300, exoticMaterials: 50, research: 100 }, effects: [{ type: 'production_add', target: 'energy', value: 4 }, { type: 'production_add', target: 'exoticMaterials', value: 0.3 }], description: 'Extract helium-3 from gas giants for clean fusion — x5 energy', prerequisites: ['antimatterCollider'] },
  massDriver: { id: 'massDriver', name: 'Mass Driver', era: 5, cost: { exoticMaterials: 60, research: 80, rocketFuel: 80 }, effects: [{ type: 'production_add', target: 'exoticMaterials', value: 2 }, { type: 'cap_mult', target: 'exoticMaterials', value: 3 }], description: 'Electromagnetic mass drivers launch cargo between worlds', prerequisites: ['gravitySmelter'] },

  // Era 6
  jumpGate: { id: 'jumpGate', name: 'Jump Gate', era: 6, cost: { starSystems: 6, darkEnergy: 40, research: 80 }, effects: [{ type: 'production_add', target: 'starSystems', value: 3.2 }, { type: 'production_add', target: 'darkEnergy', value: 0.5 }], description: 'Instant jump gates between star systems — x3 colonization speed', prerequisites: ['stellarCartography'] },
  darkFocusArray: { id: 'darkFocusArray', name: 'Dark Focus Array', era: 6, cost: { darkEnergy: 50, energy: 150, research: 60 }, effects: [{ type: 'production_add', target: 'darkEnergy', value: 3.2 }, { type: 'production_add', target: 'energy', value: 3.2 }], description: 'Focus dark energy through an array — triple dark energy and energy', prerequisites: ['darkEnergyRefinery'] },
  xenoAlliance: { id: 'xenoAlliance', name: 'Xeno Alliance', era: 6, cost: { starSystems: 10, exoticMaterials: 50, research: 70 }, effects: [{ type: 'production_add', target: 'exoticMaterials', value: 3.2 }, { type: 'production_add', target: 'starSystems', value: 0.2 }], description: 'An alliance with alien species boosts exotic materials', prerequisites: ['xenoHorticulture'] },

  // Era 7
  dysonLattice: { id: 'dysonLattice', name: 'Dyson Lattice', era: 7, cost: { megastructures: 8, stellarForge: 20, energy: 400 }, effects: [{ type: 'production_add', target: 'megastructures', value: 4.8 }, { type: 'production_add', target: 'energy', value: 9.6 }], description: 'A lattice of Dyson collectors — x3 megastructures and x5 energy', prerequisites: ['singularityForge'] },
  temporalAccelerator: { id: 'temporalAccelerator', name: 'Temporal Accelerator', era: 7, cost: { research: 300, darkEnergy: 60, stellarForge: 15 }, effects: [{ type: 'production_add', target: 'research', value: 9.6 }, { type: 'production_add', target: 'stellarForge', value: 2.4 }], description: 'Accelerate time in localized zones — x5 research', prerequisites: ['quasarTap'] },

  // Era 8
  galacticCouncil: { id: 'galacticCouncil', name: 'Galactic Council', era: 8, cost: { galacticInfluence: 200, exoticMatter: 80, starSystems: 50 }, effects: [{ type: 'production_add', target: 'galacticInfluence', value: 8 }, { type: 'cap_mult', target: 'galacticInfluence', value: 3 }], description: 'Establish a council to govern the galaxy — x3 influence', prerequisites: ['influenceBeacon'] },
  matterTransmuter: { id: 'matterTransmuter', name: 'Matter Transmuter', era: 8, cost: { exoticMatter: 60, darkEnergy: 150, research: 300 }, effects: [{ type: 'production_add', target: 'exoticMatter', value: 8 }, { type: 'production_add', target: 'darkEnergy', value: 2 }], description: 'Transmute ordinary matter into exotic forms — x3 exotic matter', prerequisites: ['exoticMatterForge'] },
  voidShipyard: { id: 'voidShipyard', name: 'Void Shipyard', era: 8, cost: { megastructures: 20, exoticMatter: 70, galacticInfluence: 180 }, effects: [{ type: 'production_add', target: 'megastructures', value: 8 }, { type: 'production_add', target: 'exoticMatter', value: 0.5 }], description: 'Build ships in the void between galaxies — x3 megastructures', prerequisites: ['voidReaper'] },

  // Era 9
  cosmicResonator: { id: 'cosmicResonator', name: 'Cosmic Resonator', era: 9, cost: { cosmicPower: 180, universalConstants: 12, darkEnergy: 200 }, effects: [{ type: 'production_add', target: 'cosmicPower', value: 12 }, { type: 'production_add', target: 'universalConstants', value: 0.1 }], description: 'Resonate with cosmic frequencies for amplified power', prerequisites: ['cosmicExpansion'] },
  constantForge: { id: 'constantForge', name: 'Constant Forge', era: 9, cost: { universalConstants: 14, cosmicPower: 200, exoticMatter: 120 }, effects: [{ type: 'production_add', target: 'universalConstants', value: 12 }, { type: 'cap_mult', target: 'universalConstants', value: 3 }], description: 'Forge universal constants from pure cosmic power', prerequisites: ['dimensionalAnchor'] },
  entropicDynamo: { id: 'entropicDynamo', name: 'Entropic Dynamo', era: 9, cost: { cosmicPower: 220, realityFragments: 15, megastructures: 25 }, effects: [{ type: 'production_add', target: 'cosmicPower', value: 6 }, { type: 'production_add', target: 'exoticMatter', value: 12 }], description: 'Harness entropy itself as a dynamo power source', prerequisites: ['entropyShield'] },

  // Era 10
  echoChamber: { id: 'echoChamber', name: 'Echo Chamber', era: 10, cost: { quantumEchoes: 80, realityFragments: 60, cosmicPower: 400 }, effects: [{ type: 'production_add', target: 'quantumEchoes', value: 40 }, { type: 'production_add', target: 'universalConstants', value: 0.3 }], description: 'Amplify quantum echoes in a resonant chamber — x5 echoes', prerequisites: ['quantumHarvester'] },
  infinityWellspring: { id: 'infinityWellspring', name: 'Infinity Wellspring', era: 10, cost: { universalConstants: 30, cosmicPower: 500, realityFragments: 90 }, effects: [{ type: 'production_add', target: 'universalConstants', value: 20 }, { type: 'production_add', target: 'cosmicPower', value: 20 }], description: 'Tap into an infinite wellspring of universal energy', prerequisites: ['dimensionalGateway'] },

  // --- 5 additional upgrades ---
  ropeAndPulley: { id: 'ropeAndPulley', name: 'Rope and Pulley', era: 1, cost: { materials: 12, labor: 8, food: 6 }, effects: [{ type: 'production_add', target: 'labor', value: 0.2 }, { type: 'production_add', target: 'materials', value: 0.3 }], description: 'Simple machines double labor efficiency', prerequisites: ['lumberMill'] },
  edgeComputing: { id: 'edgeComputing', name: 'Edge Computing', era: 3, cost: { software: 28, data: 18, electronics: 22 }, effects: [{ type: 'production_add', target: 'data', value: 0.8 }, { type: 'production_add', target: 'electronics', value: 0.4 }], description: 'Distributed edge nodes triple data processing', prerequisites: ['fogComputing'] },
  orbitalTether: { id: 'orbitalTether', name: 'Orbital Tether', era: 4, cost: { orbitalInfra: 18, steel: 70, rocketFuel: 40 }, effects: [{ type: 'production_add', target: 'orbitalInfra', value: 1.2 }, { type: 'production_add', target: 'rocketFuel', value: 1 }], description: 'Space elevator tethers triple orbital infrastructure', prerequisites: ['plasmaShield'] },
  voidAnchor: { id: 'voidAnchor', name: 'Void Anchor', era: 9, cost: { cosmicPower: 200, universalConstants: 15, darkEnergy: 250 }, effects: [{ type: 'production_add', target: 'darkEnergy', value: 12 }, { type: 'production_add', target: 'cosmicPower', value: 2 }], description: 'Anchor points in the void stabilize cosmic power', prerequisites: ['voidCartographer'] },
};

// Balance scaling: multiply upgrade costs by era-dependent factors
// This accounts for exponential production growth from multiplicative upgrades
const ERA_COST_SCALE = {
  1: 1,       // Era 1: base costs are fine (clicking-gated)
  2: 2,       // Era 2: double costs
  3: 3,       // Era 3: 3x costs
  4: 8,       // Era 4: 8x costs (need more time here)
  5: 8,       // Era 5: 8x costs
  6: 8,       // Era 6: 8x costs (new resources are scarce, don't over-scale)
  7: 15,      // Era 7: 15x costs (need more time here)
  8: 20,      // Era 8: 20x costs
  9: 12,      // Era 9: 12x costs (new resources are scarce)
  10: 30,     // Era 10: 30x costs (endgame)
};

// Apply scaling to all upgrade costs
for (const upgrade of Object.values(upgrades)) {
  const scale = ERA_COST_SCALE[upgrade.era] || 1;
  if (scale === 1) continue;
  const scaledCost = {};
  for (const [resource, amount] of Object.entries(upgrade.cost)) {
    scaledCost[resource] = Math.ceil(amount * scale);
  }
  upgrade.cost = scaledCost;
}

export function getUpgradesForEra(era) {
  return Object.values(upgrades).filter(u => u.era <= era);
}
