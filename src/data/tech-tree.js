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
    cost: { research: 2500, rocketFuel: 800, orbitalInfra: 250 },
    prerequisites: [],
    grantsEra: null,
    description: 'Navigate between planets',
  },
  interplanetaryShip: {
    id: 'interplanetaryShip', name: 'Interplanetary Ship', era: 4,
    cost: { orbitalInfra: 600, rocketFuel: 2000, steel: 2500, research: 4000 },
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
    cost: { megastructures: 100, stellarForge: 350, research: 10000000 },
    prerequisites: [],
    grantsEra: null,
    description: 'Prepare for galactic-scale civilization',
  },
  galacticNetwork: {
    id: 'galacticNetwork', name: 'Galactic Network', era: 7,
    cost: { megastructures: 250, stellarForge: 800, research: 50000000 },
    prerequisites: ['galacticAscendancy'],
    grantsEra: 8,
    description: 'Galaxy-spanning communication and travel network',
  },

  // Era 8 → 9 (Galactic → Intergalactic)
  cosmicEngineering: {
    id: 'cosmicEngineering', name: 'Cosmic Engineering', era: 8,
    cost: { exoticMatter: 2000, galacticInfluence: 100000, research: 100000000 },
    prerequisites: [],
    grantsEra: null,
    description: 'Engineer on a cosmic scale',
  },
  intergalacticBeacon: {
    id: 'intergalacticBeacon', name: 'Intergalactic Beacon', era: 8,
    cost: { exoticMatter: 5000, galacticInfluence: 300000, cosmicPower: 100 },
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
    description: 'Advanced farming techniques',
    effects: [{ type: 'production_mult', target: 'food', value: 2 }],
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
    description: 'Nationwide electrical distribution',
    effects: [{ type: 'production_mult', target: 'energy', value: 2 }, { type: 'production_mult', target: 'electronics', value: 2 }],
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
    description: 'Protect orbital assets — double orbital infrastructure output',
    effects: [{ type: 'production_mult', target: 'orbitalInfra', value: 2 }],
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
    description: 'Perfect orbital trajectories — triple orbital infrastructure output',
    effects: [{ type: 'production_mult', target: 'orbitalInfra', value: 3 }],
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
    description: 'Engineer on a galactic scale — triple galactic influence',
    effects: [{ type: 'production_mult', target: 'galacticInfluence', value: 3 }],
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
    description: 'Unify quantum mechanics and gravity — double colonies and triple orbital infra',
    effects: [{ type: 'production_mult', target: 'colonies', value: 2 }, { type: 'production_mult', target: 'orbitalInfra', value: 3 }],
  },
  darkEnergyManipulation: {
    id: 'darkEnergyManipulation', name: 'Dark Energy Manipulation', era: 6,
    cost: { darkEnergy: 3000, research: 30000, starSystems: 100 },
    prerequisites: ['galacticCartography'],
    grantsEra: null,
    description: 'Directly manipulate dark energy — triple dark energy and double star systems',
    effects: [{ type: 'production_mult', target: 'darkEnergy', value: 3 }, { type: 'production_mult', target: 'starSystems', value: 2 }],
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
    description: 'Weave the fabric of the cosmos — x5 reality fragments and x3 quantum echoes',
    effects: [{ type: 'production_mult', target: 'realityFragments', value: 5 }, { type: 'production_mult', target: 'quantumEchoes', value: 3 }],
  },
  // Era 2 branching: automation vs craftsmanship
  automationTheory: {
    id: 'automationTheory', name: 'Automation Theory', era: 2,
    cost: { research: 50, electronics: 40, steel: 50 },
    prerequisites: ['advancedComputing'],
    grantsEra: null,
    description: 'Full automation — triple labor and double electronics',
    effects: [{ type: 'production_mult', target: 'labor', value: 3 }, { type: 'production_mult', target: 'electronics', value: 2 }],
    excludes: 'artisanCrafts',
  },
  artisanCrafts: {
    id: 'artisanCrafts', name: 'Artisan Crafts', era: 2,
    cost: { research: 50, materials: 50, food: 60 },
    prerequisites: ['advancedComputing'],
    grantsEra: null,
    description: 'Master craftsmanship — triple materials and double food',
    effects: [{ type: 'production_mult', target: 'materials', value: 3 }, { type: 'production_mult', target: 'food', value: 2 }],
    excludes: 'automationTheory',
  },
};

export function getTechForEra(era) {
  return Object.values(techTree).filter(t => t.era <= era);
}
