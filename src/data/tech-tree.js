// Tech tree — nodes that gate era transitions
// Each tech: { id, name, era, cost, prerequisites, grantsEra, description }
// grantsEra: if present, unlocking this tech transitions to that era

export const techTree = {
  // Era 1 → 2
  metallurgy: {
    id: 'metallurgy', name: 'Metallurgy', era: 1,
    cost: { materials: 50, energy: 40 },
    prerequisites: [],
    grantsEra: null,
    description: 'Understanding of metal properties',
  },
  industrialRevolution: {
    id: 'industrialRevolution', name: 'Industrial Revolution', era: 1,
    cost: { materials: 80, energy: 60, labor: 40 },
    prerequisites: ['metallurgy'],
    grantsEra: 2,
    description: 'Transition to machine-based manufacturing',
  },

  // Era 2 → 3 (Digital Age)
  advancedComputing: {
    id: 'advancedComputing', name: 'Advanced Computing', era: 2,
    cost: { research: 80, electronics: 60 },
    prerequisites: [],
    grantsEra: null,
    description: 'Powerful computational systems',
  },
  digitalRevolution: {
    id: 'digitalRevolution', name: 'Digital Revolution', era: 2,
    cost: { research: 200, electronics: 150, steel: 200 },
    prerequisites: ['advancedComputing'],
    grantsEra: 3,
    description: 'The world goes digital — software and data become key resources',
  },

  // Era 3 → 4 (Digital Age → Space Age)
  globalNetwork: {
    id: 'globalNetwork', name: 'Global Network', era: 3,
    cost: { software: 100, data: 60 },
    prerequisites: [],
    grantsEra: null,
    description: 'A planet-spanning digital network — prerequisite for space era tech',
  },
  spaceProgram: {
    id: 'spaceProgram', name: 'Space Program', era: 3,
    cost: { software: 200, data: 120, research: 500 },
    prerequisites: ['globalNetwork'],
    grantsEra: 4,
    description: 'An organized program to reach space',
  },

  // Era 4 → 5 (Space Age → Solar System)
  interplanetaryNav: {
    id: 'interplanetaryNav', name: 'Interplanetary Navigation', era: 4,
    cost: { research: 3500, rocketFuel: 1200, orbitalInfra: 350 },
    prerequisites: [],
    grantsEra: null,
    description: 'Navigate between planets',
  },
  interplanetaryShip: {
    id: 'interplanetaryShip', name: 'Interplanetary Ship', era: 4,
    cost: { orbitalInfra: 800, rocketFuel: 3000, steel: 3500, research: 6000 },
    prerequisites: ['interplanetaryNav'],
    grantsEra: 5,
    description: 'A ship capable of reaching other planets',
  },

  // Era 5 → 6 (Solar System → Interstellar)
  advancedPropulsion: {
    id: 'advancedPropulsion', name: 'Advanced Propulsion', era: 5,
    cost: { research: 5000, exoticMaterials: 200, energy: 50000 },
    prerequisites: [],
    grantsEra: null,
    description: 'Beyond chemical rockets',
  },
  ftlResearch: {
    id: 'ftlResearch', name: 'FTL Research', era: 5,
    cost: { research: 10000, exoticMaterials: 500, colonies: 40 },
    prerequisites: ['advancedPropulsion'],
    grantsEra: 6,
    description: 'Faster-than-light travel theory',
  },

  // Era 6 → 7 (Interstellar → Dyson Era)
  galacticCartography: {
    id: 'galacticCartography', name: 'Galactic Cartography', era: 6,
    cost: { starSystems: 30, research: 3000, darkEnergy: 300 },
    prerequisites: [],
    grantsEra: null,
    description: 'Map the galaxy',
  },
  megaEngineering: {
    id: 'megaEngineering', name: 'Mega Engineering', era: 6,
    cost: { starSystems: 80, darkEnergy: 1000, research: 10000 },
    prerequisites: ['galacticCartography'],
    grantsEra: 7,
    description: 'Engineering on a stellar scale — gateway to the Dyson Era',
  },

  // Era 7 → 8 (Dyson Era → Galactic)
  galacticAscendancy: {
    id: 'galacticAscendancy', name: 'Galactic Ascendancy', era: 7,
    cost: { megastructures: 120, stellarForge: 400, research: 15000000 },
    prerequisites: [],
    grantsEra: null,
    description: 'Prepare for galactic-scale civilization',
  },
  galacticNetwork: {
    id: 'galacticNetwork', name: 'Galactic Network', era: 7,
    cost: { megastructures: 300, stellarForge: 1000, research: 80000000 },
    prerequisites: ['galacticAscendancy'],
    grantsEra: 8,
    description: 'Galaxy-spanning communication and travel network',
  },

  // Era 8 → 9 (Galactic → Intergalactic)
  cosmicEngineering: {
    id: 'cosmicEngineering', name: 'Cosmic Engineering', era: 8,
    cost: { exoticMatter: 1500, galacticInfluence: 80000, research: 80000000 },
    prerequisites: [],
    grantsEra: null,
    description: 'Engineer on a cosmic scale',
  },
  intergalacticBeacon: {
    id: 'intergalacticBeacon', name: 'Intergalactic Beacon', era: 8,
    cost: { exoticMatter: 4000, galacticInfluence: 200000, cosmicPower: 80 },
    prerequisites: ['cosmicEngineering'],
    grantsEra: 9,
    description: 'Signal reaching beyond the galaxy',
  },

  // Era 9 → 10 (Intergalactic → Multiverse)
  realityScience: {
    id: 'realityScience', name: 'Reality Science', era: 9,
    cost: { universalConstants: 10, cosmicPower: 10000, research: 200000000 },
    prerequisites: [],
    grantsEra: null,
    description: 'Study the fabric of reality',
  },
  multiverseDetection: {
    id: 'multiverseDetection', name: 'Multiverse Detection', era: 9,
    cost: { universalConstants: 30, cosmicPower: 30000, realityFragments: 15 },
    prerequisites: ['realityScience'],
    grantsEra: 10,
    description: 'Detect parallel universe signatures',
  },

  // Optional tech nodes — not required for progression, but give bonuses
  agriculture: {
    id: 'agriculture', name: 'Advanced Agriculture', era: 1,
    cost: { food: 30, materials: 15 },
    prerequisites: [],
    grantsEra: null,
    description: 'Advanced farming techniques — increased food output',
    effects: [{ type: 'production_add', target: 'food', value: 1.0 }],
  },
  masonry: {
    id: 'masonry', name: 'Masonry', era: 1,
    cost: { materials: 25, labor: 15 },
    prerequisites: ['metallurgy'],
    grantsEra: null,
    description: 'Stone construction — double materials and energy output',
    effects: [{ type: 'production_mult', target: 'materials', value: 2 }, { type: 'production_mult', target: 'energy', value: 2 }],
  },
  massProduction: {
    id: 'massProduction', name: 'Mass Production', era: 2,
    cost: { steel: 80, electronics: 50, labor: 60 },
    prerequisites: ['advancedComputing'],
    grantsEra: null,
    description: 'Assembly line mastery — triple steel and labor output',
    effects: [{ type: 'production_mult', target: 'steel', value: 3 }, { type: 'production_mult', target: 'labor', value: 3 }],
  },
  electricalGrid: {
    id: 'electricalGrid', name: 'Electrical Grid', era: 2,
    cost: { electronics: 60, steel: 50, energy: 60 },
    prerequisites: ['advancedComputing'],
    grantsEra: null,
    description: 'Nationwide electrical distribution — boosted energy and electronics',
    effects: [{ type: 'production_add', target: 'energy', value: 2.0 }, { type: 'production_add', target: 'electronics', value: 2.0 }],
  },
  neuralInterfaces: {
    id: 'neuralInterfaces', name: 'Neural Interfaces', era: 3,
    cost: { data: 40, software: 60, research: 100 },
    prerequisites: ['globalNetwork'],
    grantsEra: null,
    description: 'Direct brain-computer links accelerate all digital work',
    effects: [{ type: 'production_mult', target: 'research', value: 2 }, { type: 'production_mult', target: 'software', value: 2 }],
  },
  orbitalDefense: {
    id: 'orbitalDefense', name: 'Orbital Defense', era: 4,
    cost: { orbitalInfra: 30, rocketFuel: 80, steel: 120 },
    prerequisites: ['interplanetaryNav'],
    grantsEra: null,
    description: 'Protect orbital assets — boosted orbital infrastructure output',
    effects: [{ type: 'production_add', target: 'orbitalInfra', value: 5.0 }],
  },
  gravitonTheory: {
    id: 'gravitonTheory', name: 'Graviton Theory', era: 5,
    cost: { research: 2000, exoticMaterials: 100 },
    prerequisites: ['advancedPropulsion'],
    grantsEra: null,
    description: 'Understanding gravity — double exotic materials production',
    effects: [{ type: 'production_mult', target: 'exoticMaterials', value: 2 }],
  },
  xenolinguistics: {
    id: 'xenolinguistics', name: 'Xenolinguistics', era: 6,
    cost: { galacticInfluence: 200, research: 20000 },
    prerequisites: ['galacticCartography'],
    grantsEra: null,
    description: 'Communicate with alien civilizations — triple influence output',
    effects: [{ type: 'production_mult', target: 'galacticInfluence', value: 3 }],
  },
  temporalMechanics: {
    id: 'temporalMechanics', name: 'Temporal Mechanics', era: 7,
    cost: { stellarForge: 30, research: 300000, megastructures: 10 },
    prerequisites: ['galacticAscendancy'],
    grantsEra: null,
    description: 'Manipulate time itself — massive research boost',
    effects: [{ type: 'production_mult', target: 'research', value: 5 }],
  },
  darkMatterPhysics: {
    id: 'darkMatterPhysics', name: 'Dark Matter Physics', era: 8,
    cost: { exoticMatter: 1000, darkEnergy: 10000 },
    prerequisites: ['cosmicEngineering'],
    grantsEra: null,
    description: 'Master dark matter — double exotic matter output',
    effects: [{ type: 'production_mult', target: 'exoticMatter', value: 2 }],
  },
  // Era 7 branching: stellarControl vs stellarHarmony
  stellarControl: {
    id: 'stellarControl', name: 'Stellar Control', era: 7,
    cost: { stellarForge: 40, megastructures: 12, research: 400000 },
    prerequisites: ['galacticAscendancy'],
    grantsEra: null,
    description: 'Dominate stars — x5 stellar forge output',
    effects: [{ type: 'production_mult', target: 'stellarForge', value: 5 }],
    excludes: 'stellarHarmony',
  },
  stellarHarmony: {
    id: 'stellarHarmony', name: 'Stellar Harmony', era: 7,
    cost: { stellarForge: 40, megastructures: 12, research: 400000 },
    prerequisites: ['galacticAscendancy'],
    grantsEra: null,
    description: 'Harmonize with stars — x5 megastructure and energy output',
    effects: [{ type: 'production_mult', target: 'megastructures', value: 5 }, { type: 'production_mult', target: 'energy', value: 5 }],
    excludes: 'stellarControl',
  },
  multidimensionalMath: {
    id: 'multidimensionalMath', name: 'Multidimensional Mathematics', era: 9,
    cost: { universalConstants: 30, cosmicPower: 30000, research: 500000000 },
    prerequisites: ['realityScience'],
    grantsEra: null,
    description: 'Understand higher dimensions — triple universal constants output',
    effects: [{ type: 'production_mult', target: 'universalConstants', value: 3 }],
  },
  // Optional era 10 tech choice
  // Era 9 branching: void mastery vs reality mastery
  // Optional era 8 tech
  // Era 4 optional
  orbitalMechanics: {
    id: 'orbitalMechanics', name: 'Orbital Mechanics', era: 4,
    cost: { research: 300, orbitalInfra: 50 },
    prerequisites: ['interplanetaryNav'],
    grantsEra: null,
    description: 'Perfect orbital trajectories — boosted orbital infrastructure output',
    effects: [{ type: 'production_add', target: 'orbitalInfra', value: 10.0 }],
  },
  // Era 6 optional
  subspaceTheory: {
    id: 'subspaceTheory', name: 'Subspace Theory', era: 6,
    cost: { research: 30000, darkEnergy: 3000, starSystems: 100 },
    prerequisites: ['galacticCartography'],
    grantsEra: null,
    description: 'Understand subspace — double star system and dark energy output',
    effects: [{ type: 'production_mult', target: 'starSystems', value: 2 }, { type: 'production_mult', target: 'darkEnergy', value: 2 }],
  },
  // Era 8 branching: expansion vs consolidation
  galacticExpansion: {
    id: 'galacticExpansion', name: 'Galactic Expansion', era: 8,
    cost: { starSystems: 20000, exoticMatter: 2000, galacticInfluence: 50000 },
    prerequisites: ['cosmicEngineering'],
    grantsEra: null,
    description: 'Expand rapidly — x5 star systems and colonies',
    effects: [{ type: 'production_mult', target: 'starSystems', value: 5 }, { type: 'production_mult', target: 'colonies', value: 5 }],
    excludes: 'galacticConsolidation',
  },
  galacticConsolidation: {
    id: 'galacticConsolidation', name: 'Galactic Consolidation', era: 8,
    cost: { galacticInfluence: 80000, research: 50000000, megastructures: 30 },
    prerequisites: ['cosmicEngineering'],
    grantsEra: null,
    description: 'Consolidate power — x5 galactic influence and research',
    effects: [{ type: 'production_mult', target: 'galacticInfluence', value: 5 }, { type: 'production_mult', target: 'research', value: 5 }],
    excludes: 'galacticExpansion',
  },
  galacticEngineering: {
    id: 'galacticEngineering', name: 'Galactic Engineering', era: 8,
    cost: { galacticInfluence: 60000, exoticMatter: 3000, megastructures: 35 },
    prerequisites: ['cosmicEngineering'],
    grantsEra: null,
    description: 'Engineer on a galactic scale — boosted galactic influence',
    effects: [{ type: 'production_add', target: 'galacticInfluence', value: 200.0 }],
  },
  voidMastery: {
    id: 'voidMastery', name: 'Void Mastery', era: 9,
    cost: { cosmicPower: 80000, universalConstants: 80, darkEnergy: 200000 },
    prerequisites: ['multidimensionalMath'],
    grantsEra: null,
    description: 'Master the void — x5 cosmic power and dark energy',
    effects: [{ type: 'production_mult', target: 'cosmicPower', value: 5 }, { type: 'production_mult', target: 'darkEnergy', value: 5 }],
    excludes: 'realityMastery',
  },
  realityMastery: {
    id: 'realityMastery', name: 'Reality Mastery', era: 9,
    cost: { cosmicPower: 80000, universalConstants: 80, realityFragments: 30 },
    prerequisites: ['multidimensionalMath'],
    grantsEra: null,
    description: 'Master reality — x5 universal constants and reality fragments',
    effects: [{ type: 'production_mult', target: 'universalConstants', value: 5 }, { type: 'production_mult', target: 'realityFragments', value: 5 }],
    excludes: 'voidMastery',
  },
  infiniteEnergy: {
    id: 'infiniteEnergy', name: 'Infinite Energy', era: 10,
    cost: { quantumEchoes: 500, realityFragments: 2000, cosmicPower: 10000000 },
    prerequisites: ['omniversalAwareness'],
    grantsEra: null,
    description: 'Tap infinite multiversal energy — x10 all energy and cosmic power',
    effects: [{ type: 'production_mult', target: 'energy', value: 10 }, { type: 'production_mult', target: 'cosmicPower', value: 10 }],
    excludes: 'infiniteKnowledge',
  },
  infiniteKnowledge: {
    id: 'infiniteKnowledge', name: 'Infinite Knowledge', era: 10,
    cost: { quantumEchoes: 500, realityFragments: 2000, research: 100000000000000 },
    prerequisites: ['omniversalAwareness'],
    grantsEra: null,
    description: 'Tap infinite multiversal knowledge — x10 all research and data',
    effects: [{ type: 'production_mult', target: 'research', value: 10 }, { type: 'production_mult', target: 'data', value: 10 }],
    excludes: 'infiniteEnergy',
  },
  omniversalAwareness: {
    id: 'omniversalAwareness', name: 'Omniversal Awareness', era: 10,
    cost: { quantumEchoes: 100, realityFragments: 500, universalConstants: 200 },
    prerequisites: ['multiverseDetection'],
    grantsEra: null,
    description: 'Perceive all realities — quintuple reality fragment output',
    effects: [{ type: 'production_mult', target: 'realityFragments', value: 5 }],
  },

  // Branching choice: Era 3 — pick offense or defense
  offensiveAI: {
    id: 'offensiveAI', name: 'Offensive AI', era: 3,
    cost: { software: 80, data: 50, research: 150 },
    prerequisites: ['globalNetwork'],
    grantsEra: null,
    description: 'Aggressive AI doubles data output but not software',
    effects: [{ type: 'production_mult', target: 'data', value: 3 }],
    excludes: 'defensiveAI',
  },
  defensiveAI: {
    id: 'defensiveAI', name: 'Defensive AI', era: 3,
    cost: { software: 80, data: 50, research: 150 },
    prerequisites: ['globalNetwork'],
    grantsEra: null,
    description: 'Protective AI doubles software output but not data',
    effects: [{ type: 'production_mult', target: 'software', value: 3 }],
    excludes: 'offensiveAI',
  },

  // Branching choice: Era 5 — pick biological or mechanical
  bioEngineering: {
    id: 'bioEngineering', name: 'Biological Engineering', era: 5,
    cost: { research: 3000, colonies: 15, food: 5000 },
    prerequisites: ['advancedPropulsion'],
    grantsEra: null,
    description: 'Bio-enhanced colonists — massive food and labor boost',
    effects: [{ type: 'production_mult', target: 'food', value: 5 }, { type: 'production_mult', target: 'labor', value: 3 }],
    excludes: 'mechEngineering',
  },
  mechEngineering: {
    id: 'mechEngineering', name: 'Mechanical Engineering', era: 5,
    cost: { research: 3000, exoticMaterials: 100, energy: 30000 },
    prerequisites: ['advancedPropulsion'],
    grantsEra: null,
    description: 'Robotic workers — massive energy and materials boost',
    effects: [{ type: 'production_mult', target: 'energy', value: 5 }, { type: 'production_mult', target: 'materials', value: 3 }],
    excludes: 'bioEngineering',
  },

  // New optional tech nodes
  quantumGravity: {
    id: 'quantumGravity', name: 'Quantum Gravity', era: 5,
    cost: { research: 4000, exoticMaterials: 150, energy: 20000 },
    prerequisites: ['advancedPropulsion'],
    grantsEra: null,
    description: 'Unify quantum mechanics and gravity — boosted colonies and orbital infra',
    effects: [{ type: 'production_add', target: 'colonies', value: 10.0 }, { type: 'production_add', target: 'orbitalInfra', value: 20.0 }],
  },
  darkEnergyManipulation: {
    id: 'darkEnergyManipulation', name: 'Dark Energy Manipulation', era: 6,
    cost: { darkEnergy: 3000, research: 30000, starSystems: 100 },
    prerequisites: ['galacticCartography'],
    grantsEra: null,
    description: 'Directly manipulate dark energy — boosted dark energy and star systems',
    effects: [{ type: 'production_add', target: 'darkEnergy', value: 50.0 }, { type: 'production_add', target: 'starSystems', value: 25.0 }],
  },
  antimatterTheory: {
    id: 'antimatterTheory', name: 'Antimatter Theory', era: 4,
    cost: { research: 400, rocketFuel: 150, energy: 500 },
    prerequisites: ['interplanetaryNav'],
    grantsEra: null,
    description: 'Theoretical antimatter physics — double fuel and triple research',
    effects: [{ type: 'production_mult', target: 'rocketFuel', value: 2 }, { type: 'production_mult', target: 'research', value: 3 }],
  },
  cosmicWeaving: {
    id: 'cosmicWeaving', name: 'Cosmic Weaving', era: 10,
    cost: { quantumEchoes: 200, realityFragments: 800, universalConstants: 300 },
    prerequisites: ['omniversalAwareness'],
    grantsEra: null,
    description: 'Weave the fabric of the cosmos — boosted reality fragments and quantum echoes',
    effects: [{ type: 'production_add', target: 'realityFragments', value: 2000.0 }, { type: 'production_add', target: 'quantumEchoes', value: 1000.0 }],
  },
  // Era 2 branching: automation vs craftsmanship
  automationTheory: {
    id: 'automationTheory', name: 'Automation Theory', era: 2,
    cost: { research: 50, electronics: 40, steel: 50 },
    prerequisites: ['advancedComputing'],
    grantsEra: null,
    description: 'Full automation — boosted labor and electronics',
    effects: [{ type: 'production_add', target: 'labor', value: 4.0 }, { type: 'production_add', target: 'electronics', value: 2.0 }],
    excludes: 'artisanCrafts',
  },
  artisanCrafts: {
    id: 'artisanCrafts', name: 'Artisan Crafts', era: 2,
    cost: { research: 50, materials: 50, food: 60 },
    prerequisites: ['advancedComputing'],
    grantsEra: null,
    description: 'Master craftsmanship — boosted materials and food',
    effects: [{ type: 'production_add', target: 'materials', value: 4.0 }, { type: 'production_add', target: 'food', value: 2.0 }],
    excludes: 'automationTheory',
  },

  // --- Worktree Agent: 6 new optional tech nodes ---
  advancedIrrigation: { id: 'advancedIrrigation', name: 'Advanced Irrigation', era: 1, cost: { food: 25, materials: 20, labor: 10 }, prerequisites: ['metallurgy'], grantsEra: null, description: 'Aqueducts and canals boost food output', effects: [{ type: 'production_add', target: 'food', value: 2.0 }] },
  precisionEngineering: { id: 'precisionEngineering', name: 'Precision Engineering', era: 2, cost: { steel: 30, electronics: 20, research: 15 }, prerequisites: ['advancedComputing'], grantsEra: null, description: 'Precise machining boosts steel and electronics', effects: [{ type: 'production_add', target: 'steel', value: 2.0 }, { type: 'production_add', target: 'electronics', value: 4.0 }] },
  distributedAI: { id: 'distributedAI', name: 'Distributed AI', era: 3, cost: { software: 25, data: 15, research: 35 }, prerequisites: ['globalNetwork'], grantsEra: null, description: 'AI distributed across the network boosts data and software', effects: [{ type: 'production_add', target: 'data', value: 6.0 }, { type: 'production_add', target: 'software', value: 3.0 }] },
  antimatterContainment: { id: 'antimatterContainment', name: 'Antimatter Containment', era: 4, cost: { research: 40, rocketFuel: 25, orbitalInfra: 10 }, prerequisites: ['interplanetaryNav'], grantsEra: null, description: 'Safe antimatter storage boosts fuel and exotic materials', effects: [{ type: 'production_add', target: 'rocketFuel', value: 10.0 }, { type: 'production_add', target: 'exoticMaterials', value: 5.0 }] },
  cosmicHarvester: { id: 'cosmicHarvester', name: 'Cosmic Harvester', era: 9, cost: { cosmicPower: 120, universalConstants: 10, exoticMatter: 40 }, prerequisites: ['realityScience'], grantsEra: null, description: 'Harvest cosmic energy at intergalactic scale', effects: [{ type: 'production_add', target: 'cosmicPower', value: 400.0 }, { type: 'production_add', target: 'exoticMatter', value: 200.0 }] },
  realityCompression: { id: 'realityCompression', name: 'Reality Compression', era: 10, cost: { quantumEchoes: 25, realityFragments: 70, universalConstants: 15 }, prerequisites: ['multiverseDetection'], grantsEra: null, description: 'Compress reality for efficiency — x5 fragments and x3 constants', effects: [{ type: 'production_mult', target: 'realityFragments', value: 5 }, { type: 'production_mult', target: 'universalConstants', value: 3 }] },

  // --- 5 new optional tech nodes ---
  hydroponics: { id: 'hydroponics', name: 'Hydroponics', era: 1, cost: { food: 35, materials: 20, labor: 15 }, prerequisites: ['metallurgy'], grantsEra: null, description: 'Soilless farming boosts food and energy output', effects: [{ type: 'production_add', target: 'food', value: 2.0 }, { type: 'production_add', target: 'energy', value: 1.0 }] },
  fusionMiniaturization: { id: 'fusionMiniaturization', name: 'Fusion Miniaturization', era: 4, cost: { research: 350, rocketFuel: 120, orbitalInfra: 40 }, prerequisites: ['interplanetaryNav'], grantsEra: null, description: 'Miniaturized fusion reactors — boosted energy and fuel output', effects: [{ type: 'production_add', target: 'energy', value: 10.0 }, { type: 'production_add', target: 'rocketFuel', value: 5.0 }] },
  stellarArchitecture: { id: 'stellarArchitecture', name: 'Stellar Architecture', era: 7, cost: { megastructures: 15, stellarForge: 25, research: 500000 }, prerequisites: ['galacticAscendancy'], grantsEra: null, description: 'Design stellar-scale structures — boosted megastructures and stellar forge', effects: [{ type: 'production_add', target: 'megastructures', value: 100.0 }, { type: 'production_add', target: 'stellarForge', value: 50.0 }] },
  voidNavigation: { id: 'voidNavigation', name: 'Void Navigation', era: 9, cost: { universalConstants: 20, cosmicPower: 50000, darkEnergy: 100000 }, prerequisites: ['realityScience'], grantsEra: null, description: 'Navigate the void between realities — boosted cosmic power and reality fragments', effects: [{ type: 'production_add', target: 'cosmicPower', value: 400.0 }, { type: 'production_add', target: 'realityFragments', value: 200.0 }] },
  quantumWeaving: { id: 'quantumWeaving', name: 'Quantum Weaving', era: 10, cost: { quantumEchoes: 150, realityFragments: 600, universalConstants: 100 }, prerequisites: ['omniversalAwareness'], grantsEra: null, description: 'Weave quantum echoes into reality — x5 quantum echoes and x3 reality fragments', effects: [{ type: 'production_mult', target: 'quantumEchoes', value: 5 }, { type: 'production_mult', target: 'realityFragments', value: 3 }] },

  // --- 6 new optional tech nodes ---
  animalHusbandry: { id: 'animalHusbandry', name: 'Animal Husbandry', era: 1, cost: { food: 30, labor: 20, materials: 10 }, prerequisites: ['metallurgy'], grantsEra: null, description: 'Domesticate animals — increased labor and food output', effects: [{ type: 'production_add', target: 'labor', value: 1.0 }, { type: 'production_add', target: 'food', value: 2.0 }] },
  semiconductorTheory: { id: 'semiconductorTheory', name: 'Semiconductor Theory', era: 2, cost: { research: 40, electronics: 35, steel: 40 }, prerequisites: ['advancedComputing'], grantsEra: null, description: 'Understand semiconductors — boosted electronics and research', effects: [{ type: 'production_add', target: 'electronics', value: 4.0 }, { type: 'production_add', target: 'research', value: 2.0 }] },
  photonicsTheory: { id: 'photonicsTheory', name: 'Photonics', era: 3, cost: { research: 40, software: 30, data: 20 }, prerequisites: ['globalNetwork'], grantsEra: null, description: 'Light-based computing — boosted data and electronics', effects: [{ type: 'production_add', target: 'data', value: 6.0 }, { type: 'production_add', target: 'electronics', value: 3.0 }] },
  warpFieldTheory: { id: 'warpFieldTheory', name: 'Warp Field Theory', era: 5, cost: { research: 3500, exoticMaterials: 120, energy: 25000 }, prerequisites: ['advancedPropulsion'], grantsEra: null, description: 'Theoretical warp fields — boosted exotic materials and energy', effects: [{ type: 'production_add', target: 'exoticMaterials', value: 10.0 }, { type: 'production_add', target: 'energy', value: 20.0 }] },
  galacticEcology: { id: 'galacticEcology', name: 'Galactic Ecology', era: 6, cost: { starSystems: 40, research: 25000, darkEnergy: 2000 }, prerequisites: ['galacticCartography'], grantsEra: null, description: 'Understand galactic ecosystems — boosted star systems and colonies', effects: [{ type: 'production_add', target: 'starSystems', value: 50.0 }, { type: 'production_add', target: 'colonies', value: 25.0 }] },
  dimensionalPhysics: { id: 'dimensionalPhysics', name: 'Dimensional Physics', era: 8, cost: { exoticMatter: 1200, darkEnergy: 8000, research: 60000000 }, prerequisites: ['cosmicEngineering'], grantsEra: null, description: 'Physics of higher dimensions — boosted exotic matter and cosmic power', effects: [{ type: 'production_add', target: 'exoticMatter', value: 200.0 }, { type: 'production_add', target: 'cosmicPower', value: 100.0 }] },

  // --- 6 new optional tech nodes ---
  geothermalEnergy: { id: 'geothermalEnergy', name: 'Geothermal Energy', era: 1, cost: { materials: 30, energy: 20, labor: 15 }, prerequisites: ['metallurgy'], grantsEra: null, description: 'Tap underground heat — boosted energy and materials output', effects: [{ type: 'production_add', target: 'energy', value: 2.0 }, { type: 'production_add', target: 'materials', value: 1.0 }] },
  microprocessorDesign: { id: 'microprocessorDesign', name: 'Microprocessor Design', era: 2, cost: { electronics: 45, research: 30, steel: 35 }, prerequisites: ['advancedComputing'], grantsEra: null, description: 'Design efficient chips — boosted research and electronics', effects: [{ type: 'production_add', target: 'research', value: 4.0 }, { type: 'production_add', target: 'electronics', value: 2.0 }] },
  swarmIntelligence: { id: 'swarmIntelligence', name: 'Swarm Intelligence', era: 3, cost: { software: 40, data: 25, research: 50 }, prerequisites: ['globalNetwork'], grantsEra: null, description: 'Networked AI swarms — boosted software and research', effects: [{ type: 'production_add', target: 'software', value: 6.0 }, { type: 'production_add', target: 'research', value: 3.0 }] },
  stellarMetallurgy: { id: 'stellarMetallurgy', name: 'Stellar Metallurgy', era: 7, cost: { stellarForge: 20, megastructures: 8, research: 350000 }, prerequisites: ['galacticAscendancy'], grantsEra: null, description: 'Forge metals in stars — boosted stellarForge and materials', effects: [{ type: 'production_add', target: 'stellarForge', value: 100.0 }, { type: 'production_add', target: 'materials', value: 50.0 }] },
  cosmicResonance: { id: 'cosmicResonance', name: 'Cosmic Resonance', era: 9, cost: { cosmicPower: 60000, universalConstants: 50, darkEnergy: 150000 }, prerequisites: ['realityScience'], grantsEra: null, description: 'Resonate with cosmic frequencies — boosted cosmicPower and universalConstants', effects: [{ type: 'production_add', target: 'cosmicPower', value: 400.0 }, { type: 'production_add', target: 'universalConstants', value: 400.0 }] },
  omniversalSynthesis: { id: 'omniversalSynthesis', name: 'Omniversal Synthesis', era: 10, cost: { quantumEchoes: 300, realityFragments: 1000, universalConstants: 200 }, prerequisites: ['omniversalAwareness'], grantsEra: null, description: 'Synthesize resources across realities — x5 all multiverse resources', effects: [{ type: 'production_mult', target: 'quantumEchoes', value: 5 }, { type: 'production_mult', target: 'realityFragments', value: 5 }, { type: 'production_mult', target: 'universalConstants', value: 5 }] },

  // --- 7 new optional tech nodes ---
  windmillDesign: { id: 'windmillDesign', name: 'Windmill Design', era: 1, cost: { materials: 28, energy: 22, labor: 12 }, prerequisites: ['metallurgy'], grantsEra: null, description: 'Efficient windmills — boosted energy and labor output', effects: [{ type: 'production_add', target: 'energy', value: 2.0 }, { type: 'production_add', target: 'labor', value: 1.0 }] },
  thermalDynamics: { id: 'thermalDynamics', name: 'Thermal Dynamics', era: 2, cost: { research: 35, steel: 40, electronics: 25 }, prerequisites: ['advancedComputing'], grantsEra: null, description: 'Mastery of heat transfer — boosted energy and steel output', effects: [{ type: 'production_add', target: 'energy', value: 4.0 }, { type: 'production_add', target: 'steel', value: 2.0 }] },
  quantumEncryption: { id: 'quantumEncryption', name: 'Quantum Encryption', era: 3, cost: { software: 35, data: 25, research: 45 }, prerequisites: ['globalNetwork'], grantsEra: null, description: 'Unbreakable encryption — boosted software and data output', effects: [{ type: 'production_add', target: 'software', value: 6.0 }, { type: 'production_add', target: 'data', value: 3.0 }] },
  gravityPlating: { id: 'gravityPlating', name: 'Gravity Plating', era: 4, cost: { research: 350, orbitalInfra: 40, rocketFuel: 100 }, prerequisites: ['interplanetaryNav'], grantsEra: null, description: 'Artificial gravity — boosted orbital infrastructure and colonies', effects: [{ type: 'production_add', target: 'orbitalInfra', value: 10.0 }, { type: 'production_add', target: 'colonies', value: 5.0 }] },
  stellarNeuroscience: { id: 'stellarNeuroscience', name: 'Stellar Neuroscience', era: 7, cost: { stellarForge: 25, megastructures: 10, research: 400000 }, prerequisites: ['galacticAscendancy'], grantsEra: null, description: 'Map stellar neural networks — boosted research and stellar forge', effects: [{ type: 'production_add', target: 'research', value: 100.0 }, { type: 'production_add', target: 'stellarForge', value: 100.0 }] },
  cosmicCartography: { id: 'cosmicCartography', name: 'Cosmic Cartography', era: 8, cost: { galacticInfluence: 50000, exoticMatter: 2000, starSystems: 15000 }, prerequisites: ['cosmicEngineering'], grantsEra: null, description: 'Map the cosmic web — boosted star systems and galactic influence', effects: [{ type: 'production_add', target: 'starSystems', value: 200.0 }, { type: 'production_add', target: 'galacticInfluence', value: 100.0 }] },
  dimensionalResonance: { id: 'dimensionalResonance', name: 'Dimensional Resonance', era: 9, cost: { cosmicPower: 70000, universalConstants: 60, realityFragments: 20 }, prerequisites: ['realityScience'], grantsEra: null, description: 'Resonate across dimensions — boosted reality fragments and universal constants', effects: [{ type: 'production_add', target: 'realityFragments', value: 400.0 }, { type: 'production_add', target: 'universalConstants', value: 400.0 }] },

  // --- 6 new optional tech nodes ---
  aqueductEngineering: { id: 'aqueductEngineering', name: 'Aqueduct Engineering', era: 1, cost: { materials: 35, labor: 25, food: 20 }, prerequisites: ['metallurgy'], grantsEra: null, description: 'Roman-style aqueducts boost food and energy output', effects: [{ type: 'production_add', target: 'food', value: 2.0 }, { type: 'production_add', target: 'energy', value: 1.0 }] },
  industrialChemistry: { id: 'industrialChemistry', name: 'Industrial Chemistry', era: 2, cost: { research: 45, steel: 50, electronics: 30 }, prerequisites: ['advancedComputing'], grantsEra: null, description: 'Chemical processes boost steel and materials output', effects: [{ type: 'production_add', target: 'steel', value: 4.0 }, { type: 'production_add', target: 'materials', value: 2.0 }] },
  biocomputing: { id: 'biocomputing', name: 'Biocomputing', era: 3, cost: { software: 45, data: 30, research: 55 }, prerequisites: ['globalNetwork'], grantsEra: null, description: 'Biological processors — boosted software and research output', effects: [{ type: 'production_add', target: 'software', value: 6.0 }, { type: 'production_add', target: 'research', value: 3.0 }] },
  solarForge: { id: 'solarForge', name: 'Solar Forge', era: 5, cost: { research: 4500, exoticMaterials: 140, energy: 22000 }, prerequisites: ['advancedPropulsion'], grantsEra: null, description: 'Forge materials in solar fire — boosted exoticMaterials and energy', effects: [{ type: 'production_add', target: 'exoticMaterials', value: 20.0 }, { type: 'production_add', target: 'energy', value: 10.0 }] },
  hyperspaceFolding: { id: 'hyperspaceFolding', name: 'Hyperspace Folding', era: 6, cost: { darkEnergy: 3500, research: 35000, starSystems: 120 }, prerequisites: ['galacticCartography'], grantsEra: null, description: 'Fold hyperspace for instant travel — boosted dark energy and star systems', effects: [{ type: 'production_add', target: 'darkEnergy', value: 50.0 }, { type: 'production_add', target: 'starSystems', value: 50.0 }] },
  gravimetricLensing: { id: 'gravimetricLensing', name: 'Gravimetric Lensing', era: 8, cost: { exoticMatter: 2500, galacticInfluence: 70000, research: 70000000 }, prerequisites: ['cosmicEngineering'], grantsEra: null, description: 'Bend spacetime to observe distant galaxies — boosted galactic influence and exotic matter', effects: [{ type: 'production_add', target: 'galacticInfluence', value: 200.0 }, { type: 'production_add', target: 'exoticMatter', value: 100.0 }] },

  // --- 8 new optional tech nodes ---
  mineralogy: { id: 'mineralogy', name: 'Mineralogy', era: 1, cost: { materials: 32, labor: 18, energy: 15 }, prerequisites: ['metallurgy'], grantsEra: null, description: 'Study mineral composition — boosted materials and energy output', effects: [{ type: 'production_add', target: 'materials', value: 2.0 }, { type: 'production_add', target: 'energy', value: 1.0 }] },
  electromagnetism: { id: 'electromagnetism', name: 'Electromagnetism', era: 2, cost: { research: 40, electronics: 40, steel: 30 }, prerequisites: ['advancedComputing'], grantsEra: null, description: 'Master electromagnetic theory — boosted electronics and energy', effects: [{ type: 'production_add', target: 'electronics', value: 4.0 }, { type: 'production_add', target: 'energy', value: 2.0 }] },
  holographicStorage: { id: 'holographicStorage', name: 'Holographic Storage', era: 3, cost: { data: 35, software: 40, research: 50 }, prerequisites: ['globalNetwork'], grantsEra: null, description: 'Store data in holograms — boosted data and software', effects: [{ type: 'production_add', target: 'data', value: 6.0 }, { type: 'production_add', target: 'software', value: 3.0 }] },
  nuclearPropulsion: { id: 'nuclearPropulsion', name: 'Nuclear Propulsion', era: 4, cost: { research: 380, rocketFuel: 130, orbitalInfra: 45 }, prerequisites: ['interplanetaryNav'], grantsEra: null, description: 'Nuclear thermal rockets — boosted fuel and orbital infra', effects: [{ type: 'production_add', target: 'rocketFuel', value: 10.0 }, { type: 'production_add', target: 'orbitalInfra', value: 5.0 }] },
  stellarEcology: { id: 'stellarEcology', name: 'Stellar Ecology', era: 5, cost: { research: 4200, colonies: 20, exoticMaterials: 130 }, prerequisites: ['advancedPropulsion'], grantsEra: null, description: 'Understand stellar ecosystems — boosted colonies and exotic materials', effects: [{ type: 'production_add', target: 'colonies', value: 20.0 }, { type: 'production_add', target: 'exoticMaterials', value: 10.0 }] },
  neutroniomAlloy: { id: 'neutroniomAlloy', name: 'Neutroniom Alloy', era: 6, cost: { darkEnergy: 4000, starSystems: 80, research: 28000 }, prerequisites: ['galacticCartography'], grantsEra: null, description: 'Forge neutronium alloy — boosted dark energy and exotic materials', effects: [{ type: 'production_add', target: 'darkEnergy', value: 50.0 }, { type: 'production_add', target: 'exoticMaterials', value: 25.0 }] },
  chronoEngineering: { id: 'chronoEngineering', name: 'Chrono-Engineering', era: 7, cost: { stellarForge: 30, megastructures: 14, research: 450000 }, prerequisites: ['galacticAscendancy'], grantsEra: null, description: 'Engineer across timelines — boosted megastructures and stellar forge', effects: [{ type: 'production_add', target: 'megastructures', value: 100.0 }, { type: 'production_add', target: 'stellarForge', value: 100.0 }] },
  entanglementNetwork: { id: 'entanglementNetwork', name: 'Entanglement Network', era: 8, cost: { exoticMatter: 2000, galacticInfluence: 60000, research: 65000000 }, prerequisites: ['cosmicEngineering'], grantsEra: null, description: 'Quantum entanglement across galaxies — boosted exotic matter and galactic influence', effects: [{ type: 'production_add', target: 'exoticMatter', value: 200.0 }, { type: 'production_add', target: 'galacticInfluence', value: 200.0 }] },

  // --- 6 new optional tech nodes ---
  fermentation: { id: 'fermentation', name: 'Fermentation', era: 1, cost: { food: 28, labor: 18, materials: 12 }, prerequisites: ['metallurgy'], grantsEra: null, description: 'Fermented foods preserve longer — boosted food and labor', effects: [{ type: 'production_add', target: 'food', value: 2.0 }, { type: 'production_add', target: 'labor', value: 1.0 }] },
  polymers: { id: 'polymers', name: 'Polymer Science', era: 2, cost: { research: 42, steel: 38, electronics: 28 }, prerequisites: ['advancedComputing'], grantsEra: null, description: 'Synthetic polymers revolutionize manufacturing — boosted steel and materials', effects: [{ type: 'production_add', target: 'steel', value: 4.0 }, { type: 'production_add', target: 'materials', value: 2.0 }] },
  machineVision: { id: 'machineVision', name: 'Machine Vision', era: 3, cost: { data: 28, software: 35, research: 42 }, prerequisites: ['globalNetwork'], grantsEra: null, description: 'Machines that see and understand — boosted data and electronics', effects: [{ type: 'production_add', target: 'data', value: 6.0 }, { type: 'production_add', target: 'electronics', value: 3.0 }] },
  spaceMining: { id: 'spaceMining', name: 'Space Mining', era: 4, cost: { research: 360, rocketFuel: 140, orbitalInfra: 42 }, prerequisites: ['interplanetaryNav'], grantsEra: null, description: 'Mine asteroids industrially — boosted materials and exotic materials', effects: [{ type: 'production_add', target: 'materials', value: 10.0 }, { type: 'production_add', target: 'exoticMaterials', value: 5.0 }] },
  dysonTheory: { id: 'dysonTheory', name: 'Dyson Theory', era: 5, cost: { research: 4800, exoticMaterials: 160, energy: 28000 }, prerequisites: ['advancedPropulsion'], grantsEra: null, description: 'Theoretical framework for Dyson structures — boosted energy and colonies', effects: [{ type: 'production_add', target: 'energy', value: 20.0 }, { type: 'production_add', target: 'colonies', value: 10.0 }] },
  temporalShielding: { id: 'temporalShielding', name: 'Temporal Shielding', era: 7, cost: { stellarForge: 28, megastructures: 12, research: 420000 }, prerequisites: ['galacticAscendancy'], grantsEra: null, description: 'Shield against temporal distortions — boosted stellarForge and darkEnergy', effects: [{ type: 'production_add', target: 'stellarForge', value: 100.0 }, { type: 'production_add', target: 'darkEnergy', value: 50.0 }] },
};

export function getTechForEra(era) {
  return Object.values(techTree).filter(t => t.era <= era);
}
