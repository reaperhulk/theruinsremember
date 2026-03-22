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
    description: 'The ancient alloys in the crash debris teach us what ore can become',
  },
  // Era 1 branching: agrarian vs mining focus
  agrarianFocus: {
    id: 'agrarianFocus', name: 'Agrarian Focus', era: 1,
    cost: { food: 40, materials: 20, labor: 20 },
    prerequisites: ['metallurgy'],
    grantsEra: null,
    description: 'The soil yields three times what it should — enriched by cycles of cultivation no living hand remembers performing',
    effects: [{ type: 'cap_mult', target: 'food', value: 3 }, { type: 'production_mult', target: 'food', value: 2.0 }, { type: 'production_mult', target: 'labor', value: 1.5 }],
    excludes: 'miningFocus',
  },
  miningFocus: {
    id: 'miningFocus', name: 'Mining Focus', era: 1,
    cost: { materials: 40, energy: 20, labor: 20 },
    prerequisites: ['metallurgy'],
    grantsEra: null,
    description: 'The deepest mines follow shafts already bored — drill marks from tools that predate your metallurgy, guiding you to the richest veins',
    effects: [{ type: 'cap_mult', target: 'materials', value: 3 }, { type: 'production_mult', target: 'materials', value: 2.0 }, { type: 'production_mult', target: 'energy', value: 1.5 }],
    excludes: 'agrarianFocus',
  },
  industrialRevolution: {
    id: 'industrialRevolution', name: 'Industrial Revolution', era: 1,
    cost: { materials: 80, energy: 60, labor: 40 },
    prerequisites: ['metallurgy'],
    grantsEra: 2,
    description: 'The buried factories showed us the blueprint — we just added steam',
  },

  // Era 2 → 3 (Digital Age)
  advancedComputing: {
    id: 'advancedComputing', name: 'Advanced Computing', era: 2,
    cost: { research: 80, electronics: 60 },
    prerequisites: [],
    grantsEra: null,
    description: 'The old machines left instruction sets — we just had to remember how to read them',
  },
  // Era 2 branching: heavy industry vs electronics revolution
  heavyIndustry: {
    id: 'heavyIndustry', name: 'Heavy Industry', era: 2,
    cost: { steel: 60, labor: 40, energy: 50 },
    prerequisites: ['advancedComputing'],
    grantsEra: null,
    description: 'The furnaces were already built — sealed chambers of refractory brick, rated for temperatures your ancestors could not have calculated',
    effects: [{ type: 'cap_mult', target: 'steel', value: 3 }, { type: 'production_mult', target: 'steel', value: 2.0 }, { type: 'production_mult', target: 'materials', value: 1.5 }],
    excludes: 'electronicsRevolution',
  },
  electronicsRevolution: {
    id: 'electronicsRevolution', name: 'Electronics Revolution', era: 2,
    cost: { electronics: 60, research: 40, energy: 50 },
    prerequisites: ['advancedComputing'],
    grantsEra: null,
    description: 'Circuit diagrams surface from precursor archives — designs that anticipate components you haven\'t invented, bridged with ones you have',
    effects: [{ type: 'cap_mult', target: 'electronics', value: 3 }, { type: 'production_mult', target: 'electronics', value: 2.0 }, { type: 'production_mult', target: 'research', value: 1.5 }],
    excludes: 'heavyIndustry',
  },
  digitalRevolution: {
    id: 'digitalRevolution', name: 'Digital Revolution', era: 2,
    cost: { research: 200, electronics: 150, steel: 200 },
    prerequisites: ['advancedComputing'],
    grantsEra: 3,
    description: 'The ancient servers hum to life as you feed them power. They were waiting for this — the digital age they built once before',
  },

  // Era 3 → 4 (Digital Age → Space Age)
  globalNetwork: {
    id: 'globalNetwork', name: 'Global Network', era: 3,
    cost: { software: 100, data: 60 },
    prerequisites: [],
    grantsEra: null,
    description: 'A planet-spanning network — the buried cables were already there, waiting for current',
  },
  // Era 3 branching: open source vs corporate data
  openSourceMovement: {
    id: 'openSourceMovement', name: 'Open Source Movement', era: 3,
    cost: { software: 80, research: 100, data: 30 },
    prerequisites: ['globalNetwork'],
    grantsEra: null,
    description: 'Contributors worldwide dream the same code — repositories filling with functions written in parallel by minds that share memories they cannot explain',
    effects: [{ type: 'cap_mult', target: 'software', value: 3 }, { type: 'production_mult', target: 'software', value: 3.0 }, { type: 'production_mult', target: 'research', value: 2.0 }],
    excludes: 'corporateData',
  },
  corporateData: {
    id: 'corporateData', name: 'Corporate Data', era: 3,
    cost: { data: 80, research: 100, software: 30 },
    prerequisites: ['globalNetwork'],
    grantsEra: null,
    description: 'The data was always being collected — buried sensors recording everything since the last cycle ended, waiting for someone to read the logs',
    effects: [{ type: 'cap_mult', target: 'data', value: 3 }, { type: 'production_mult', target: 'data', value: 3.0 }, { type: 'production_mult', target: 'electronics', value: 2.0 }],
    excludes: 'openSourceMovement',
  },
  spaceProgram: {
    id: 'spaceProgram', name: 'Space Program', era: 3,
    cost: { software: 200, data: 120, research: 500 },
    prerequisites: ['globalNetwork'],
    grantsEra: 4,
    description: 'The launch pad foundation was ancient. We just built on top of it',
  },

  // Era 4 → 5 (Space Age → Solar System)
  interplanetaryNav: {
    id: 'interplanetaryNav', name: 'Interplanetary Navigation', era: 4,
    cost: { research: 3500, rocketFuel: 1200, orbitalInfra: 350 },
    prerequisites: [],
    grantsEra: null,
    description: 'Star charts etched in the wreckage — coordinates we somehow already knew',
  },
  // Era 4 branching: rocket supremacy vs orbital elegance
  rocketSupremacy: {
    id: 'rocketSupremacy', name: 'Rocket Supremacy', era: 4,
    cost: { rocketFuel: 500, steel: 400, research: 1500 },
    prerequisites: ['interplanetaryNav'],
    grantsEra: null,
    description: 'Burn everything. The fuel reserves are inexhaustible because someone stockpiled them across geological time, knowing you would choose fire',
    effects: [{ type: 'cap_mult', target: 'rocketFuel', value: 3 }, { type: 'production_mult', target: 'rocketFuel', value: 3.0 }, { type: 'production_mult', target: 'steel', value: 2.0 }],
    excludes: 'orbitalElegance',
  },
  orbitalElegance: {
    id: 'orbitalElegance', name: 'Orbital Elegance', era: 4,
    cost: { orbitalInfra: 200, research: 1500, rocketFuel: 300 },
    prerequisites: ['interplanetaryNav'],
    grantsEra: null,
    description: 'The orbits were pre-calculated by a mathematician who died before your sun ignited — efficiency is just remembering where things belong',
    effects: [{ type: 'cap_mult', target: 'orbitalInfra', value: 3 }, { type: 'production_mult', target: 'orbitalInfra', value: 3.0 }, { type: 'production_mult', target: 'research', value: 2.0 }],
    excludes: 'rocketSupremacy',
  },
  interplanetaryShip: {
    id: 'interplanetaryShip', name: 'Interplanetary Ship', era: 4,
    cost: { orbitalInfra: 800, rocketFuel: 3000, steel: 3500, research: 6000 },
    prerequisites: ['interplanetaryNav'],
    grantsEra: 5,
    description: 'The void between worlds holds wreckage from ships exactly like this one',
  },

  // Era 5 → 6 (Solar System → Interstellar)
  advancedPropulsion: {
    id: 'advancedPropulsion', name: 'Advanced Propulsion', era: 5,
    cost: { research: 15000, exoticMaterials: 800, energy: 50000 },
    prerequisites: [],
    grantsEra: null,
    description: 'The engine schematics were carved into the oldest ruin — someone wanted us to find them',
  },
  ftlResearch: {
    id: 'ftlResearch', name: 'FTL Research', era: 5,
    cost: { research: 40000, exoticMaterials: 2000, colonies: 80 },
    prerequisites: ['advancedPropulsion'],
    grantsEra: 6,
    description: 'The math was always impossible — until we found it scratched into a dead ship\'s hull',
  },

  // Era 6 → 7 (Interstellar → Dyson Era)
  galacticCartography: {
    id: 'galacticCartography', name: 'Galactic Cartography', era: 6,
    cost: { starSystems: 80, research: 80000, darkEnergy: 1000 },
    prerequisites: [],
    grantsEra: null,
    description: 'Every dead beacon we relight adds another pin to a map someone drew long before us',
  },
  megaEngineering: {
    id: 'megaEngineering', name: 'Mega Engineering', era: 6,
    cost: { starSystems: 200, darkEnergy: 3000, research: 200000 },
    prerequisites: ['galacticCartography'],
    grantsEra: 7,
    description: 'Half-built Dyson scaffolding orbits every dead star you visit — someone was building this before',
  },

  // Era 7 → 8 (Dyson Era → Galactic)
  galacticAscendancy: {
    id: 'galacticAscendancy', name: 'Galactic Ascendancy', era: 7,
    cost: { megastructures: 120, stellarForge: 400, research: 500000 },
    prerequisites: [],
    grantsEra: null,
    description: 'The Dyson sphere\'s control throne fits a human body perfectly. Coincidence fades',
  },
  galacticNetwork: {
    id: 'galacticNetwork', name: 'Galactic Network', era: 7,
    cost: { megastructures: 300, stellarForge: 1000, research: 800000 },
    prerequisites: ['galacticAscendancy'],
    grantsEra: 8,
    description: 'The network was never offline — just dormant, waiting for someone to remember the access code',
  },

  // Era 8 → 9 (Galactic → Intergalactic)
  cosmicEngineering: {
    id: 'cosmicEngineering', name: 'Cosmic Engineering', era: 8,
    cost: { exoticMatter: 5000, galacticInfluence: 150000, research: 5000000 },
    prerequisites: [],
    grantsEra: null,
    description: 'The ruins at galactic center are tools, not monuments — and they still work',
  },
  intergalacticBeacon: {
    id: 'intergalacticBeacon', name: 'Intergalactic Beacon', era: 8,
    cost: { exoticMatter: 15000, galacticInfluence: 300000, cosmicPower: 2000 },
    prerequisites: ['cosmicEngineering'],
    grantsEra: 9,
    description: 'The signal format was familiar — it matched the distress call that brought us here',
  },

  // Era 9 → 10 (Intergalactic → Multiverse)
  realityScience: {
    id: 'realityScience', name: 'Reality Science', era: 9,
    cost: { universalConstants: 80, cosmicPower: 60000, research: 10000000 },
    prerequisites: [],
    grantsEra: null,
    description: 'Reality has seams. The prior civilization found them. So have we',
  },
  multiverseDetection: {
    id: 'multiverseDetection', name: 'Multiverse Detection', era: 9,
    cost: { universalConstants: 200, cosmicPower: 150000, realityFragments: 100 },
    prerequisites: ['realityScience'],
    grantsEra: 10,
    description: 'The signatures are identical to ours — every universe, the same collapse, the same rebirth',
  },

  // Optional tech nodes — not required for progression, but give bonuses
  agriculture: {
    id: 'agriculture', name: 'Advanced Agriculture', era: 1,
    cost: { food: 30, materials: 15 },
    prerequisites: [],
    grantsEra: null,
    description: 'Crop rotation patterns found carved into stone — the ancient soil remembers what grew here before',
    effects: [{ type: 'production_add', target: 'food', value: 1.0 }],
  },
  masonry: {
    id: 'masonry', name: 'Masonry', era: 1,
    cost: { materials: 25, labor: 15 },
    prerequisites: ['metallurgy'],
    grantsEra: null,
    description: 'The ruins show masonry joints too perfect for primitive tools — we copy what we cannot explain',
    effects: [{ type: 'production_mult', target: 'materials', value: 2 }, { type: 'production_mult', target: 'energy', value: 2 }],
  },
  massProduction: {
    id: 'massProduction', name: 'Mass Production', era: 2,
    cost: { steel: 80, electronics: 50, labor: 60 },
    prerequisites: ['advancedComputing'],
    grantsEra: null,
    description: 'The assembly line was already drawn on the factory floor — we just traced the lines and added machines',
    effects: [{ type: 'production_mult', target: 'steel', value: 3 }, { type: 'production_mult', target: 'labor', value: 3 }],
  },
  electricalGrid: {
    id: 'electricalGrid', name: 'Electrical Grid', era: 2,
    cost: { electronics: 60, steel: 50, energy: 60 },
    prerequisites: ['advancedComputing'],
    grantsEra: null,
    description: 'Buried conduits carry current without resistance — superconductors from an age that should not have known the word',
    effects: [{ type: 'production_add', target: 'energy', value: 2.0 }, { type: 'production_add', target: 'electronics', value: 2.0 }],
  },
  neuralInterfaces: {
    id: 'neuralInterfaces', name: 'Neural Interfaces', era: 3,
    cost: { data: 40, software: 60, research: 100 },
    prerequisites: ['globalNetwork'],
    grantsEra: null,
    description: 'Neural sockets built into the ruins fit human brain patterns exactly — someone designed these interfaces for minds that hadn\'t evolved yet',
    effects: [{ type: 'production_mult', target: 'research', value: 2 }, { type: 'production_mult', target: 'software', value: 2 }],
  },
  orbitalDefense: {
    id: 'orbitalDefense', name: 'Orbital Defense', era: 4,
    cost: { orbitalInfra: 30, rocketFuel: 80, steel: 120 },
    prerequisites: ['interplanetaryNav'],
    grantsEra: null,
    description: 'Defense grid locks onto anchor points that predate your arrival — weapons platforms pre-positioned by a strategist who knew the threats you\'d face',
    effects: [{ type: 'production_add', target: 'orbitalInfra', value: 5.0 }],
  },
  gravitonTheory: {
    id: 'gravitonTheory', name: 'Graviton Theory', era: 5,
    cost: { research: 2000, exoticMaterials: 100 },
    prerequisites: ['advancedPropulsion'],
    grantsEra: null,
    description: 'The graviton equations were half-finished in a precursor lab — the remaining variables solve themselves when you supply your civilization\'s mass',
    effects: [{ type: 'production_mult', target: 'exoticMaterials', value: 2 }, { type: 'cap_mult', target: 'research', value: 5 }],
  },
  xenolinguistics: {
    id: 'xenolinguistics', name: 'Xenolinguistics', era: 6,
    cost: { galacticInfluence: 200, research: 20000 },
    prerequisites: ['galacticCartography'],
    grantsEra: null,
    description: 'Every alien language shares a root grammar with the precursor script — as if all intelligence in this galaxy learned to speak from the same teacher',
    effects: [{ type: 'production_mult', target: 'galacticInfluence', value: 3 }],
  },
  temporalMechanics: {
    id: 'temporalMechanics', name: 'Temporal Mechanics', era: 7,
    cost: { stellarForge: 30, research: 300000, megastructures: 10 },
    prerequisites: ['galacticAscendancy'],
    grantsEra: null,
    description: 'Time is not a river — it is a wheel, and the ruts are deep. Your research merely rediscovers what the wheel has already turned through',
    effects: [{ type: 'production_mult', target: 'research', value: 5 }, { type: 'cap_mult', target: 'research', value: 10 }],
  },
  darkMatterPhysics: {
    id: 'darkMatterPhysics', name: 'Dark Matter Physics', era: 8,
    cost: { exoticMatter: 1000, darkEnergy: 10000 },
    prerequisites: ['cosmicEngineering'],
    grantsEra: null,
    description: 'Dark matter responds to your instruments like a pet to its owner — it has been handled before, by hands shaped exactly like yours',
    effects: [{ type: 'production_mult', target: 'exoticMatter', value: 2 }],
  },
  // Era 7 branching: stellarControl vs stellarHarmony
  stellarControl: {
    id: 'stellarControl', name: 'Stellar Control', era: 7,
    cost: { stellarForge: 40, megastructures: 12, research: 400000 },
    prerequisites: ['galacticAscendancy'],
    grantsEra: null,
    description: 'Crack open the stars and take what burns inside. The scars on every sun say someone did this before — and the stars obeyed then, too',
    effects: [{ type: 'production_mult', target: 'stellarForge', value: 5 }],
    excludes: 'stellarHarmony',
  },
  stellarHarmony: {
    id: 'stellarHarmony', name: 'Stellar Harmony', era: 7,
    cost: { stellarForge: 40, megastructures: 12, research: 400000 },
    prerequisites: ['galacticAscendancy'],
    grantsEra: null,
    description: 'Listen to the stars instead of commanding them. Their rhythms encode construction sequences — melodies that build megastructures from resonance alone',
    effects: [{ type: 'production_mult', target: 'megastructures', value: 5 }, { type: 'production_mult', target: 'energy', value: 5 }],
    excludes: 'stellarControl',
  },
  multidimensionalMath: {
    id: 'multidimensionalMath', name: 'Multidimensional Mathematics', era: 9,
    cost: { universalConstants: 30, cosmicPower: 30000, research: 5000000 },
    prerequisites: ['realityScience'],
    grantsEra: null,
    description: 'The equations describe dimensions that fold into themselves — spaces where the end of the universe touches its beginning, and both look like your face',
    effects: [{ type: 'production_mult', target: 'universalConstants', value: 3 }, { type: 'cap_mult', target: 'research', value: 10 }],
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
    description: 'The trajectories solve themselves — orbital equations whose solutions were cached in the precursor navigation databases, waiting to be queried',
    effects: [{ type: 'production_add', target: 'orbitalInfra', value: 10.0 }],
  },
  // Era 6 optional
  subspaceTheory: {
    id: 'subspaceTheory', name: 'Subspace Theory', era: 6,
    cost: { research: 30000, darkEnergy: 3000, starSystems: 100 },
    prerequisites: ['galacticCartography'],
    grantsEra: null,
    description: 'Subspace is not a theory — it is a road network, built by the last civilization and left intact. The on-ramps are disguised as natural phenomena',
    effects: [{ type: 'production_mult', target: 'starSystems', value: 2 }, { type: 'production_mult', target: 'darkEnergy', value: 2 }],
  },
  // Era 8 branching: expansion vs consolidation
  galacticExpansion: {
    id: 'galacticExpansion', name: 'Galactic Expansion', era: 8,
    cost: { starSystems: 8000, exoticMatter: 2000, galacticInfluence: 50000 },
    prerequisites: ['cosmicEngineering'],
    grantsEra: null,
    description: 'Expand until every star has a flag. The galaxy\'s emptiness is not natural — it was cleared for you, a canvas stretched and primed by invisible hands',
    effects: [{ type: 'production_mult', target: 'starSystems', value: 5 }, { type: 'production_mult', target: 'colonies', value: 5 }],
    excludes: 'galacticConsolidation',
  },
  galacticConsolidation: {
    id: 'galacticConsolidation', name: 'Galactic Consolidation', era: 8,
    cost: { galacticInfluence: 80000, research: 500000, megastructures: 30 },
    prerequisites: ['cosmicEngineering'],
    grantsEra: null,
    description: 'Power concentrates inward. Every civilization that consolidated like this left the same ruins — and the ruins are shaped like a throne',
    effects: [{ type: 'production_mult', target: 'galacticInfluence', value: 5 }, { type: 'production_mult', target: 'research', value: 5 }],
    excludes: 'galacticExpansion',
  },
  galacticEngineering: {
    id: 'galacticEngineering', name: 'Galactic Engineering', era: 8,
    cost: { galacticInfluence: 60000, exoticMatter: 3000, megastructures: 35 },
    prerequisites: ['cosmicEngineering'],
    grantsEra: null,
    description: 'Build across the galaxy using blueprints found in every dead civilization\'s final archive — the same plans, the same ambition, the same ending',
    effects: [{ type: 'production_add', target: 'galacticInfluence', value: 200.0 }],
  },
  voidMastery: {
    id: 'voidMastery', name: 'Void Mastery', era: 9,
    cost: { cosmicPower: 80000, universalConstants: 80, darkEnergy: 100000 },
    prerequisites: ['multidimensionalMath'],
    grantsEra: null,
    description: 'The void is not empty — it is full of the residue of collapsed realities. Master it, and drink from the well of a thousand dead universes',
    effects: [{ type: 'production_mult', target: 'cosmicPower', value: 5 }, { type: 'production_mult', target: 'darkEnergy', value: 5 }],
    excludes: 'realityMastery',
  },
  realityMastery: {
    id: 'realityMastery', name: 'Reality Mastery', era: 9,
    cost: { cosmicPower: 80000, universalConstants: 80, realityFragments: 30 },
    prerequisites: ['multidimensionalMath'],
    grantsEra: null,
    description: 'Reality bends at your touch. The constants shift willingly — they have been adjusted before, by the same hands, wearing the same scars',
    effects: [{ type: 'production_mult', target: 'universalConstants', value: 5 }, { type: 'production_mult', target: 'realityFragments', value: 5 }],
    excludes: 'voidMastery',
  },
  infiniteEnergy: {
    id: 'infiniteEnergy', name: 'Infinite Energy', era: 10,
    cost: { quantumEchoes: 500, realityFragments: 2000, cosmicPower: 500000 },
    prerequisites: ['omniversalAwareness'],
    grantsEra: null,
    description: 'The energy was never created or destroyed — it circulates between realities like blood between chambers of a heart that has always been beating',
    effects: [{ type: 'production_mult', target: 'energy', value: 10 }, { type: 'production_mult', target: 'cosmicPower', value: 10 }],
    excludes: 'infiniteKnowledge',
  },
  infiniteKnowledge: {
    id: 'infiniteKnowledge', name: 'Infinite Knowledge', era: 10,
    cost: { quantumEchoes: 500, realityFragments: 2000, research: 50000000 },
    prerequisites: ['omniversalAwareness'],
    grantsEra: null,
    description: 'Every answer exists already — written in every version of every library. You are not researching. You are remembering what infinity already knows',
    effects: [{ type: 'production_mult', target: 'research', value: 10 }, { type: 'production_mult', target: 'data', value: 10 }],
    excludes: 'infiniteEnergy',
  },
  omniversalAwareness: {
    id: 'omniversalAwareness', name: 'Omniversal Awareness', era: 10,
    cost: { quantumEchoes: 100, realityFragments: 500, universalConstants: 200 },
    prerequisites: ['multiverseDetection'],
    grantsEra: null,
    description: 'You see every reality at once — each one a draft of the same story, written by the same author, ending with the same word: "Again"',
    effects: [{ type: 'production_mult', target: 'realityFragments', value: 5 }],
  },

  // Branching choice: Era 3 — pick offense or defense
  offensiveAI: {
    id: 'offensiveAI', name: 'Offensive AI', era: 3,
    cost: { software: 80, data: 50, research: 150 },
    prerequisites: ['globalNetwork'],
    grantsEra: null,
    description: 'The AI hunts through data with predatory focus — devouring information the way the precursor systems did, burning bright and burning fast',
    effects: [{ type: 'production_mult', target: 'data', value: 3 }],
    excludes: 'defensiveAI',
  },
  defensiveAI: {
    id: 'defensiveAI', name: 'Defensive AI', era: 3,
    cost: { software: 80, data: 50, research: 150 },
    prerequisites: ['globalNetwork'],
    grantsEra: null,
    description: 'The AI builds walls of code around your systems — defensive architectures found in the precursor ruins, proven against threats that haven\'t arrived yet',
    effects: [{ type: 'production_mult', target: 'software', value: 3 }],
    excludes: 'offensiveAI',
  },

  // Branching choice: Era 5 — pick biological or mechanical
  bioEngineering: {
    id: 'bioEngineering', name: 'Biological Engineering', era: 5,
    cost: { research: 3000, colonies: 15, food: 5000 },
    prerequisites: ['advancedPropulsion'],
    grantsEra: null,
    description: 'The genetic modifications were already in your DNA — dormant sequences that activate when exposed to precursor soil chemistry. You were designed for this',
    effects: [{ type: 'production_mult', target: 'food', value: 5 }, { type: 'production_mult', target: 'labor', value: 3 }],
    excludes: 'mechEngineering',
  },
  mechEngineering: {
    id: 'mechEngineering', name: 'Mechanical Engineering', era: 5,
    cost: { research: 3000, exoticMaterials: 100, energy: 30000 },
    prerequisites: ['advancedPropulsion'],
    grantsEra: null,
    description: 'The robots assemble from parts cached in asteroid cores — mechanical bodies designed for hands that no longer exist, now yours to command',
    effects: [{ type: 'production_mult', target: 'energy', value: 5 }, { type: 'production_mult', target: 'materials', value: 3 }],
    excludes: 'bioEngineering',
  },

  // New optional tech nodes
  quantumGravity: {
    id: 'quantumGravity', name: 'Quantum Gravity', era: 5,
    cost: { research: 4000, exoticMaterials: 150, energy: 20000 },
    prerequisites: ['advancedPropulsion'],
    grantsEra: null,
    description: 'The unification was always simple — the precursors knew. They left the answer in a gravitational lens that spells it out when viewed from the right angle',
    effects: [{ type: 'production_add', target: 'colonies', value: 10.0 }, { type: 'production_add', target: 'orbitalInfra', value: 20.0 }],
  },
  darkEnergyManipulation: {
    id: 'darkEnergyManipulation', name: 'Dark Energy Manipulation', era: 6,
    cost: { darkEnergy: 3000, research: 30000, starSystems: 100 },
    prerequisites: ['galacticCartography'],
    grantsEra: null,
    description: 'Dark energy bends to your will like a muscle you forgot you had — atrophied across cycles, now flexing for the first time in this iteration',
    effects: [{ type: 'production_add', target: 'darkEnergy', value: 50.0 }, { type: 'production_add', target: 'starSystems', value: 25.0 }],
  },
  antimatterTheory: {
    id: 'antimatterTheory', name: 'Antimatter Theory', era: 4,
    cost: { research: 400, rocketFuel: 150, energy: 500 },
    prerequisites: ['interplanetaryNav'],
    grantsEra: null,
    description: 'The equations were carved into a reactor wall — antimatter containment solved by someone who never published',
    effects: [{ type: 'production_mult', target: 'rocketFuel', value: 2 }, { type: 'production_mult', target: 'research', value: 3 }],
  },
  cosmicWeaving: {
    id: 'cosmicWeaving', name: 'Cosmic Weaving', era: 10,
    cost: { quantumEchoes: 200, realityFragments: 800, universalConstants: 300 },
    prerequisites: ['omniversalAwareness'],
    grantsEra: null,
    description: 'The loom was always here — its threads are timelines, its pattern is history, and the weaver\'s chair is still warm from the last one who sat here',
    effects: [{ type: 'production_add', target: 'realityFragments', value: 2000.0 }, { type: 'production_add', target: 'quantumEchoes', value: 1000.0 }],
  },
  // Era 2 branching: automation vs craftsmanship
  automationTheory: {
    id: 'automationTheory', name: 'Automation Theory', era: 2,
    cost: { research: 50, electronics: 40, steel: 50 },
    prerequisites: ['advancedComputing'],
    grantsEra: null,
    description: 'The machines run themselves — programmed by hands in a previous cycle, executing instructions cached in crystalline memory since before the crash',
    effects: [{ type: 'production_add', target: 'labor', value: 4.0 }, { type: 'production_add', target: 'electronics', value: 2.0 }],
    excludes: 'artisanCrafts',
  },
  artisanCrafts: {
    id: 'artisanCrafts', name: 'Artisan Crafts', era: 2,
    cost: { research: 50, materials: 50, food: 60 },
    prerequisites: ['advancedComputing'],
    grantsEra: null,
    description: 'The artisans\' hands move with inherited precision — shaping materials in patterns their ancestors carved into bone a cycle ago',
    effects: [{ type: 'production_add', target: 'materials', value: 4.0 }, { type: 'production_add', target: 'food', value: 2.0 }],
    excludes: 'automationTheory',
  },

  // --- Worktree Agent: 6 new optional tech nodes ---
  advancedIrrigation: { id: 'advancedIrrigation', name: 'Advanced Irrigation', era: 1, cost: { food: 25, materials: 20, labor: 10 }, prerequisites: ['metallurgy'], grantsEra: null, description: 'The irrigation channels follow grooves already cut into bedrock — ancient waterways that remember where the rivers ran', effects: [{ type: 'production_add', target: 'food', value: 2.0 }] },
  precisionEngineering: { id: 'precisionEngineering', name: 'Precision Engineering', era: 2, cost: { steel: 30, electronics: 20, research: 15 }, prerequisites: ['advancedComputing'], grantsEra: null, description: 'Tolerances measured in microns — the same tolerances etched into precursor calibration stones buried beneath every workshop', effects: [{ type: 'production_add', target: 'steel', value: 2.0 }, { type: 'production_add', target: 'electronics', value: 4.0 }] },
  distributedAI: { id: 'distributedAI', name: 'Distributed AI', era: 3, cost: { software: 25, data: 15, research: 35 }, prerequisites: ['globalNetwork'], grantsEra: null, description: 'The AI fragments speak to each other in a protocol older than your network — a language they learned from the buried servers', effects: [{ type: 'production_add', target: 'data', value: 6.0 }, { type: 'production_add', target: 'software', value: 3.0 }] },
  antimatterContainment: { id: 'antimatterContainment', name: 'Antimatter Containment', era: 4, cost: { research: 40, rocketFuel: 25, orbitalInfra: 10 }, prerequisites: ['interplanetaryNav'], grantsEra: null, description: 'The containment geometry was found scratched into a dead reactor wall — whoever designed it knew antimatter before they knew fire', effects: [{ type: 'production_add', target: 'rocketFuel', value: 10.0 }, { type: 'production_add', target: 'exoticMaterials', value: 5.0 }] },
  cosmicHarvester: { id: 'cosmicHarvester', name: 'Cosmic Harvester', era: 9, cost: { cosmicPower: 120, universalConstants: 10, exoticMatter: 40 }, prerequisites: ['realityScience'], grantsEra: null, description: 'The harvester collects energy that has been building between galaxies since the last cycle ended — stored like a battery left charging by previous hands', effects: [{ type: 'production_add', target: 'cosmicPower', value: 400.0 }, { type: 'production_add', target: 'exoticMatter', value: 200.0 }] },
  realityCompression: { id: 'realityCompression', name: 'Reality Compression', era: 10, cost: { quantumEchoes: 25, realityFragments: 70, universalConstants: 15 }, prerequisites: ['multiverseDetection'], grantsEra: null, description: 'Reality compresses like a file that has been zipped before — the algorithm knows the patterns because the data has always been the same', effects: [{ type: 'production_add', target: 'realityFragments', value: 2000.0 }, { type: 'production_add', target: 'universalConstants', value: 1000.0 }] },

  // --- 5 new optional tech nodes ---
  hydroponics: { id: 'hydroponics', name: 'Hydroponics', era: 1, cost: { food: 35, materials: 20, labor: 15 }, prerequisites: ['metallurgy'], grantsEra: null, description: 'The nutrient ratios were encoded in seed casings found at the crash site — plants bred for conditions that match your colony exactly', effects: [{ type: 'production_add', target: 'food', value: 2.0 }, { type: 'production_add', target: 'energy', value: 1.0 }] },
  fusionMiniaturization: { id: 'fusionMiniaturization', name: 'Fusion Miniaturization', era: 4, cost: { research: 350, rocketFuel: 120, orbitalInfra: 40 }, prerequisites: ['interplanetaryNav'], grantsEra: null, description: 'The miniaturization trick was simple once you found the schematic — printed on alloy foil inside a precursor thruster nozzle, waiting to be read', effects: [{ type: 'production_add', target: 'energy', value: 10.0 }, { type: 'production_add', target: 'rocketFuel', value: 5.0 }] },
  stellarArchitecture: { id: 'stellarArchitecture', name: 'Stellar Architecture', era: 7, cost: { megastructures: 15, stellarForge: 25, research: 500000 }, prerequisites: ['galacticAscendancy'], grantsEra: null, description: 'The blueprints draw themselves — stellar architecture emerging from calculations that feel less like math and more like remembering a house you once lived in', effects: [{ type: 'production_add', target: 'megastructures', value: 100.0 }, { type: 'production_add', target: 'stellarForge', value: 50.0 }] },
  voidNavigation: { id: 'voidNavigation', name: 'Void Navigation', era: 9, cost: { universalConstants: 20, cosmicPower: 50000, darkEnergy: 100000 }, prerequisites: ['realityScience'], grantsEra: null, description: 'The void between realities is not empty — it is a sea of collapsed possibilities, and the navigation charts were drawn by a version of you that drowned in it', effects: [{ type: 'production_add', target: 'cosmicPower', value: 400.0 }, { type: 'production_add', target: 'realityFragments', value: 200.0 }] },
  quantumWeaving: { id: 'quantumWeaving', name: 'Quantum Weaving', era: 10, cost: { quantumEchoes: 150, realityFragments: 600, universalConstants: 100 }, prerequisites: ['omniversalAwareness'], grantsEra: null, description: 'Each thread is a timeline — pull one and a universe unravels. The pattern that emerges is always the same face, always the same ending', effects: [{ type: 'production_add', target: 'quantumEchoes', value: 2000.0 }, { type: 'production_add', target: 'realityFragments', value: 1000.0 }] },

  // --- 6 new optional tech nodes ---
  animalHusbandry: { id: 'animalHusbandry', name: 'Animal Husbandry', era: 1, cost: { food: 30, labor: 20, materials: 10 }, prerequisites: ['metallurgy'], grantsEra: null, description: 'The animals come when called by names no one taught them — bred for obedience across cycles, their instincts shaped by a thousand forgotten handlers', effects: [{ type: 'production_add', target: 'labor', value: 1.0 }, { type: 'production_add', target: 'food', value: 2.0 }] },
  semiconductorTheory: { id: 'semiconductorTheory', name: 'Semiconductor Theory', era: 2, cost: { research: 40, electronics: 35, steel: 40 }, prerequisites: ['advancedComputing'], grantsEra: null, description: 'The doping patterns in precursor chips follow a logic that anticipates your manufacturing process — designed to be reverse-engineered', effects: [{ type: 'production_add', target: 'electronics', value: 4.0 }, { type: 'production_add', target: 'research', value: 2.0 }] },
  photonicsTheory: { id: 'photonicsTheory', name: 'Photonics', era: 3, cost: { research: 40, software: 30, data: 20 }, prerequisites: ['globalNetwork'], grantsEra: null, description: 'Fiber optic channels found in ruin walls carry light without loss — waveguides grown from crystal that remembers every signal it ever carried', effects: [{ type: 'production_add', target: 'data', value: 6.0 }, { type: 'production_add', target: 'electronics', value: 3.0 }] },
  warpFieldTheory: { id: 'warpFieldTheory', name: 'Warp Field Theory', era: 5, cost: { research: 3500, exoticMaterials: 120, energy: 25000 }, prerequisites: ['advancedPropulsion'], grantsEra: null, description: 'The warp field equations were solved in a dream — seven physicists on three continents, the same dream, the same answer, written on a chalkboard that doesn\'t exist', effects: [{ type: 'production_add', target: 'exoticMaterials', value: 10.0 }, { type: 'production_add', target: 'energy', value: 20.0 }] },
  galacticEcology: { id: 'galacticEcology', name: 'Galactic Ecology', era: 6, cost: { starSystems: 40, research: 25000, darkEnergy: 2000 }, prerequisites: ['galacticCartography'], grantsEra: null, description: 'The galaxy is an ecosystem — every star a cell, every civilization a thought. You are the latest thought in a mind that has been thinking the same thing forever', effects: [{ type: 'production_add', target: 'starSystems', value: 50.0 }, { type: 'production_add', target: 'colonies', value: 25.0 }] },
  dimensionalPhysics: { id: 'dimensionalPhysics', name: 'Dimensional Physics', era: 8, cost: { exoticMatter: 1200, darkEnergy: 8000, research: 600000 }, prerequisites: ['cosmicEngineering'], grantsEra: null, description: 'Higher dimensions fold into your laboratory like origami — shapes that were always there, waiting for someone to notice the creases in spacetime', effects: [{ type: 'production_add', target: 'exoticMatter', value: 200.0 }, { type: 'production_add', target: 'cosmicPower', value: 100.0 }] },

  // --- 6 new optional tech nodes ---
  geothermalEnergy: { id: 'geothermalEnergy', name: 'Geothermal Energy', era: 1, cost: { materials: 30, energy: 20, labor: 15 }, prerequisites: ['metallurgy'], grantsEra: null, description: 'The bore holes were already drilled — thermal vents capped and pressurized by engineers who left the valves labeled in your language', effects: [{ type: 'production_add', target: 'energy', value: 2.0 }, { type: 'production_add', target: 'materials', value: 1.0 }] },
  microprocessorDesign: { id: 'microprocessorDesign', name: 'Microprocessor Design', era: 2, cost: { electronics: 45, research: 30, steel: 35 }, prerequisites: ['advancedComputing'], grantsEra: null, description: 'The chip architecture was found complete in a sealed cleanroom — a design too advanced for its era, waiting for fabrication tools to catch up', effects: [{ type: 'production_add', target: 'research', value: 4.0 }, { type: 'production_add', target: 'electronics', value: 2.0 }] },
  swarmIntelligence: { id: 'swarmIntelligence', name: 'Swarm Intelligence', era: 3, cost: { software: 40, data: 25, research: 50 }, prerequisites: ['globalNetwork'], grantsEra: null, description: 'The swarm converges on solutions using a consensus algorithm found in precursor memory — collective intelligence from a civilization that thought as one', effects: [{ type: 'production_add', target: 'software', value: 6.0 }, { type: 'production_add', target: 'research', value: 3.0 }] },
  stellarMetallurgy: { id: 'stellarMetallurgy', name: 'Stellar Metallurgy', era: 7, cost: { stellarForge: 20, megastructures: 8, research: 350000 }, prerequisites: ['galacticAscendancy'], grantsEra: null, description: 'The star\'s core is a forge that was lit before this universe began — its anvil is spacetime itself, and the metals it produces remember being shaped before', effects: [{ type: 'production_add', target: 'stellarForge', value: 100.0 }, { type: 'production_add', target: 'materials', value: 50.0 }] },
  cosmicResonance: { id: 'cosmicResonance', name: 'Cosmic Resonance', era: 9, cost: { cosmicPower: 60000, universalConstants: 50, darkEnergy: 100000 }, prerequisites: ['realityScience'], grantsEra: null, description: 'The frequency was always there — a hum beneath everything, the background radiation of a universe that remembers being young and being old and being young again', effects: [{ type: 'production_add', target: 'cosmicPower', value: 400.0 }, { type: 'production_add', target: 'universalConstants', value: 400.0 }] },
  omniversalSynthesis: { id: 'omniversalSynthesis', name: 'Omniversal Synthesis', era: 10, cost: { quantumEchoes: 300, realityFragments: 1000, universalConstants: 200 }, prerequisites: ['omniversalAwareness'], grantsEra: null, description: 'Every reality contributes its surplus — a cosmic potluck where every dish is the same, prepared by the same cook wearing different faces', effects: [{ type: 'production_add', target: 'quantumEchoes', value: 2000.0 }, { type: 'production_add', target: 'realityFragments', value: 2000.0 }, { type: 'production_add', target: 'universalConstants', value: 2000.0 }] },

  // --- 7 new optional tech nodes ---
  windmillDesign: { id: 'windmillDesign', name: 'Windmill Design', era: 1, cost: { materials: 28, energy: 22, labor: 12 }, prerequisites: ['metallurgy'], grantsEra: null, description: 'The blade geometry matches grooves carved into hilltop stones — wind catchers designed for currents that blow the same way every cycle', effects: [{ type: 'production_add', target: 'energy', value: 2.0 }, { type: 'production_add', target: 'labor', value: 1.0 }] },
  thermalDynamics: { id: 'thermalDynamics', name: 'Thermal Dynamics', era: 2, cost: { research: 35, steel: 40, electronics: 25 }, prerequisites: ['advancedComputing'], grantsEra: null, description: 'The heat exchangers follow a design found in ruin infrastructure — thermal systems that predate your understanding of temperature itself', effects: [{ type: 'production_add', target: 'energy', value: 4.0 }, { type: 'production_add', target: 'steel', value: 2.0 }] },
  quantumEncryption: { id: 'quantumEncryption', name: 'Quantum Encryption', era: 3, cost: { software: 35, data: 25, research: 45 }, prerequisites: ['globalNetwork'], grantsEra: null, description: 'The cipher was already broken — or rather, the key was left beside the lock, as if the builders wanted future generations to read everything', effects: [{ type: 'production_add', target: 'software', value: 6.0 }, { type: 'production_add', target: 'data', value: 3.0 }] },
  gravityPlating: { id: 'gravityPlating', name: 'Gravity Plating', era: 4, cost: { research: 350, orbitalInfra: 40, rocketFuel: 100 }, prerequisites: ['interplanetaryNav'], grantsEra: null, description: 'The gravity plates were found stacked in a cargo hold — pre-calibrated for the exact rotation of every station you would ever build', effects: [{ type: 'production_add', target: 'orbitalInfra', value: 10.0 }, { type: 'production_add', target: 'colonies', value: 5.0 }] },
  stellarNeuroscience: { id: 'stellarNeuroscience', name: 'Stellar Neuroscience', era: 7, cost: { stellarForge: 25, megastructures: 10, research: 400000 }, prerequisites: ['galacticAscendancy'], grantsEra: null, description: 'Stars think in fusion pulses — and their thoughts, once decoded, contain research papers from a civilization that used suns as libraries', effects: [{ type: 'production_add', target: 'research', value: 100.0 }, { type: 'production_add', target: 'stellarForge', value: 100.0 }] },
  cosmicCartography: { id: 'cosmicCartography', name: 'Cosmic Cartography', era: 8, cost: { galacticInfluence: 50000, exoticMatter: 2000, starSystems: 8000 }, prerequisites: ['cosmicEngineering'], grantsEra: null, description: 'The cosmic web is not a metaphor — it is a network, and every node was labeled by a cartographer who mapped it in a previous cycle', effects: [{ type: 'production_add', target: 'starSystems', value: 200.0 }, { type: 'production_add', target: 'galacticInfluence', value: 100.0 }] },
  dimensionalResonance: { id: 'dimensionalResonance', name: 'Dimensional Resonance', era: 9, cost: { cosmicPower: 70000, universalConstants: 60, realityFragments: 20 }, prerequisites: ['realityScience'], grantsEra: null, description: 'The resonance frequency was found carved into the walls of a dead universe — a tuning fork struck by the last hand that existed there', effects: [{ type: 'production_add', target: 'realityFragments', value: 400.0 }, { type: 'production_add', target: 'universalConstants', value: 400.0 }] },

  // --- 6 new optional tech nodes ---
  aqueductEngineering: { id: 'aqueductEngineering', name: 'Aqueduct Engineering', era: 1, cost: { materials: 35, labor: 25, food: 20 }, prerequisites: ['metallurgy'], grantsEra: null, description: 'The aqueduct channels follow a gradient someone carved into the landscape millennia ago — water remembers where it was taught to flow', effects: [{ type: 'production_add', target: 'food', value: 2.0 }, { type: 'production_add', target: 'energy', value: 1.0 }] },
  industrialChemistry: { id: 'industrialChemistry', name: 'Industrial Chemistry', era: 2, cost: { research: 45, steel: 50, electronics: 30 }, prerequisites: ['advancedComputing'], grantsEra: null, description: 'The reaction catalysts were found pre-mixed in sealed vessels beneath the ruins — chemistry done in advance for hands that had not yet evolved', effects: [{ type: 'production_add', target: 'steel', value: 4.0 }, { type: 'production_add', target: 'materials', value: 2.0 }] },
  biocomputing: { id: 'biocomputing', name: 'Biocomputing', era: 3, cost: { software: 45, data: 30, research: 55 }, prerequisites: ['globalNetwork'], grantsEra: null, description: 'The biocomputers grow from spores found in sealed ruin chambers — organisms engineered to compute, dormant until activated by human neural patterns', effects: [{ type: 'production_add', target: 'software', value: 6.0 }, { type: 'production_add', target: 'research', value: 3.0 }] },
  solarForge: { id: 'solarForge', name: 'Solar Forge', era: 5, cost: { research: 4500, exoticMaterials: 140, energy: 22000 }, prerequisites: ['advancedPropulsion'], grantsEra: null, description: 'The forge orbits inside the corona — its heat shields made from materials that should not survive a star, but do, because they were designed to', effects: [{ type: 'production_add', target: 'exoticMaterials', value: 20.0 }, { type: 'production_add', target: 'energy', value: 10.0 }] },
  hyperspaceFolding: { id: 'hyperspaceFolding', name: 'Hyperspace Folding', era: 6, cost: { darkEnergy: 3500, research: 35000, starSystems: 120 }, prerequisites: ['galacticCartography'], grantsEra: null, description: 'Hyperspace folds along creases that were pressed into spacetime deliberately — origami made of distance, by hands that understood infinity', effects: [{ type: 'production_add', target: 'darkEnergy', value: 50.0 }, { type: 'production_add', target: 'starSystems', value: 50.0 }] },
  gravimetricLensing: { id: 'gravimetricLensing', name: 'Gravimetric Lensing', era: 8, cost: { exoticMatter: 2500, galacticInfluence: 70000, research: 700000 }, prerequisites: ['cosmicEngineering'], grantsEra: null, description: 'The lens focuses on galaxies that are already looking back — their telescopes are pointed at you, built in a previous cycle for this exact moment', effects: [{ type: 'production_add', target: 'galacticInfluence', value: 200.0 }, { type: 'production_add', target: 'exoticMatter', value: 100.0 }] },

  // --- 8 new optional tech nodes ---
  mineralogy: { id: 'mineralogy', name: 'Mineralogy', era: 1, cost: { materials: 32, labor: 18, energy: 15 }, prerequisites: ['metallurgy'], grantsEra: null, description: 'The mineral taxonomy was already complete — a crystal archive found in the deepest shaft, cataloguing ores that had not yet been mined', effects: [{ type: 'production_add', target: 'materials', value: 2.0 }, { type: 'production_add', target: 'energy', value: 1.0 }] },
  electromagnetism: { id: 'electromagnetism', name: 'Electromagnetism', era: 2, cost: { research: 40, electronics: 40, steel: 30 }, prerequisites: ['advancedComputing'], grantsEra: null, description: 'The equations were written in magnetic field lines — invisible text that reveals itself only to instruments sensitive enough to read the ruins', effects: [{ type: 'production_add', target: 'electronics', value: 4.0 }, { type: 'production_add', target: 'energy', value: 2.0 }] },
  holographicStorage: { id: 'holographicStorage', name: 'Holographic Storage', era: 3, cost: { data: 35, software: 40, research: 50 }, prerequisites: ['globalNetwork'], grantsEra: null, description: 'The holographic medium was found already written — layers of interference patterns encoding knowledge from an era that stored memories in light', effects: [{ type: 'production_add', target: 'data', value: 6.0 }, { type: 'production_add', target: 'software', value: 3.0 }] },
  nuclearPropulsion: { id: 'nuclearPropulsion', name: 'Nuclear Propulsion', era: 4, cost: { research: 380, rocketFuel: 130, orbitalInfra: 45 }, prerequisites: ['interplanetaryNav'], grantsEra: null, description: 'The reactor design was found in a derelict ship core — fuel rods still warm, as if the engine was shut down yesterday and not ten thousand years ago', effects: [{ type: 'production_add', target: 'rocketFuel', value: 10.0 }, { type: 'production_add', target: 'orbitalInfra', value: 5.0 }] },
  stellarEcology: { id: 'stellarEcology', name: 'Stellar Ecology', era: 5, cost: { research: 4200, colonies: 20, exoticMaterials: 130 }, prerequisites: ['advancedPropulsion'], grantsEra: null, description: 'Every star system harbors life in the same niches — as if seeded by the same gardener, planting the same garden, across every cycle', effects: [{ type: 'production_add', target: 'colonies', value: 20.0 }, { type: 'production_add', target: 'exoticMaterials', value: 10.0 }] },
  neutroniomAlloy: { id: 'neutroniomAlloy', name: 'Neutroniom Alloy', era: 6, cost: { darkEnergy: 4000, starSystems: 80, research: 28000 }, prerequisites: ['galacticCartography'], grantsEra: null, description: 'The alloy formula was found in neutron star cores — inscribed in degenerate matter by a smith who forged with gravity instead of fire', effects: [{ type: 'production_add', target: 'darkEnergy', value: 50.0 }, { type: 'production_add', target: 'exoticMaterials', value: 25.0 }] },
  chronoEngineering: { id: 'chronoEngineering', name: 'Chrono-Engineering', era: 7, cost: { stellarForge: 30, megastructures: 14, research: 450000 }, prerequisites: ['galacticAscendancy'], grantsEra: null, description: 'The blueprints arrive before you design them — schematics from parallel timelines where you already built what you are only now imagining', effects: [{ type: 'production_add', target: 'megastructures', value: 100.0 }, { type: 'production_add', target: 'stellarForge', value: 100.0 }] },
  entanglementNetwork: { id: 'entanglementNetwork', name: 'Entanglement Network', era: 8, cost: { exoticMatter: 2000, galacticInfluence: 60000, research: 650000 }, prerequisites: ['cosmicEngineering'], grantsEra: null, description: 'Particles separated by billions of light-years respond in unison — they were entangled at the birth of the universe, waiting for someone to listen', effects: [{ type: 'production_add', target: 'exoticMatter', value: 200.0 }, { type: 'production_add', target: 'galacticInfluence', value: 200.0 }] },

  // --- 6 new optional tech nodes ---
  fermentation: { id: 'fermentation', name: 'Fermentation', era: 1, cost: { food: 28, labor: 18, materials: 12 }, prerequisites: ['metallurgy'], grantsEra: null, description: 'The fermentation cultures were found alive in sealed ruin jars — organisms that have been brewing the same recipe since before your species existed', effects: [{ type: 'production_add', target: 'food', value: 2.0 }, { type: 'production_add', target: 'labor', value: 1.0 }] },
  polymers: { id: 'polymers', name: 'Polymer Science', era: 2, cost: { research: 42, steel: 38, electronics: 28 }, prerequisites: ['advancedComputing'], grantsEra: null, description: 'The polymer chains self-assemble from precursor feedstock — molecules that remember their shape and snap together like they have done this before', effects: [{ type: 'production_add', target: 'steel', value: 4.0 }, { type: 'production_add', target: 'materials', value: 2.0 }] },
  machineVision: { id: 'machineVision', name: 'Machine Vision', era: 3, cost: { data: 28, software: 35, research: 42 }, prerequisites: ['globalNetwork'], grantsEra: null, description: 'The vision system recognizes objects it was never trained on — pattern libraries inherited from a machine that watched a previous civilization rise and fall', effects: [{ type: 'production_add', target: 'data', value: 6.0 }, { type: 'production_add', target: 'electronics', value: 3.0 }] },
  spaceMining: { id: 'spaceMining', name: 'Space Mining', era: 4, cost: { research: 360, rocketFuel: 140, orbitalInfra: 42 }, prerequisites: ['interplanetaryNav'], grantsEra: null, description: 'The asteroids were pre-sorted — heavy metals in one cluster, rare earths in another, as if someone organized the belt for the next miners', effects: [{ type: 'production_add', target: 'materials', value: 10.0 }, { type: 'production_add', target: 'exoticMaterials', value: 5.0 }] },
  dysonTheory: { id: 'dysonTheory', name: 'Dyson Theory', era: 5, cost: { research: 4800, exoticMaterials: 160, energy: 28000 }, prerequisites: ['advancedPropulsion'], grantsEra: null, description: 'The framework was not theoretical — the math describes structures already built around dead stars, waiting to be studied and replicated', effects: [{ type: 'production_add', target: 'energy', value: 20.0 }, { type: 'production_add', target: 'colonies', value: 10.0 }] },
  temporalShielding: { id: 'temporalShielding', name: 'Temporal Shielding', era: 7, cost: { stellarForge: 28, megastructures: 12, research: 420000 }, prerequisites: ['galacticAscendancy'], grantsEra: null, description: 'The shields deflect time itself — temporal armor forged from moments that have already passed, hardened by the weight of cycles they have survived', effects: [{ type: 'production_add', target: 'stellarForge', value: 100.0 }, { type: 'production_add', target: 'darkEnergy', value: 50.0 }] },
};

export function getTechForEra(era) {
  return Object.values(techTree).filter(t => t.era <= era);
}
