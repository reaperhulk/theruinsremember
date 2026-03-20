// Random events that can fire during tick (Era 3+)
// Each event: { id, name, description, minEra, type }
//   type: 'instant' — one-time resource grant
//   type: 'timed'   — temporary effect with a duration (seconds)

export const events = {
  // Era 3: Digital Age
  viralApp: {
    id: 'viralApp',
    name: 'Viral App',
    description: 'Your software goes viral — massive data surge!',
    minEra: 3,
    type: 'instant',
    effect: { resourceId: 'data', amount: 30 },
  },
  openSource: {
    id: 'openSource',
    name: 'Open Source Contribution',
    description: 'The community contributes — software development accelerated!',
    minEra: 3,
    type: 'timed',
    duration: 35,
    effect: { resourceId: 'software', rateMultBonus: 3 },
  },
  hackathon: {
    id: 'hackathon',
    name: 'Hackathon',
    description: 'A hackathon produces breakthrough code!',
    minEra: 3,
    type: 'instant',
    effect: { resourceId: 'software', amount: 20 },
  },

  // Era 4: Space Age
  solarFlare: {
    id: 'solarFlare',
    name: 'Solar Flare',
    description: 'A massive solar flare supercharges your energy collectors!',
    minEra: 4,
    type: 'timed',
    duration: 30,
    effect: { resourceId: 'energy', rateMultBonus: 2 },
  },
  asteroidDiscovery: {
    id: 'asteroidDiscovery',
    name: 'Asteroid Discovery',
    description: 'Scouts discover a mineral-rich asteroid!',
    minEra: 4,
    type: 'instant',
    effect: { resourceId: 'exoticMaterials', amount: 50 },
  },
  alienSignal: {
    id: 'alienSignal',
    name: 'Alien Signal',
    description: 'A decoded alien transmission reveals advanced knowledge!',
    minEra: 4,
    type: 'instant',
    effect: { resourceId: 'research', amount: 100 },
  },
  meteorShower: {
    id: 'meteorShower',
    name: 'Meteor Shower',
    description: 'Meteors rain down raw materials on the surface!',
    minEra: 4,
    type: 'instant',
    effect: { resourceId: 'materials', amount: 200 },
  },
  researchBreakthrough: {
    id: 'researchBreakthrough',
    name: 'Research Breakthrough',
    description: 'Scientists make a breakthrough — research speed doubled!',
    minEra: 4,
    type: 'timed',
    duration: 45,
    effect: { resourceId: 'research', rateMultBonus: 2 },
  },

  // Era 5: Solar System
  cometCapture: {
    id: 'cometCapture',
    name: 'Comet Capture',
    description: 'A passing comet is captured — massive fuel reserves!',
    minEra: 5,
    type: 'instant',
    effect: { resourceId: 'rocketFuel', amount: 150 },
  },
  colonyBoom: {
    id: 'colonyBoom',
    name: 'Colony Boom',
    description: 'Population surge on colonies boosts production!',
    minEra: 5,
    type: 'timed',
    duration: 40,
    effect: { resourceId: 'colonies', rateMultBonus: 3 },
  },

  // Era 6: Interstellar / Dyson Era
  stellarHarvest: {
    id: 'stellarHarvest',
    name: 'Stellar Harvest',
    description: 'A star yields exceptional forge output!',
    minEra: 7,
    type: 'timed',
    duration: 40,
    effect: { resourceId: 'stellarForge', rateMultBonus: 4 },
  },
  megastructureBreakthrough: {
    id: 'megastructureBreakthrough',
    name: 'Megastructure Breakthrough',
    description: 'Engineers discover a more efficient construction method!',
    minEra: 7,
    type: 'instant',
    effect: { resourceId: 'megastructures', amount: 5 },
  },

  darkMatterSurge: {
    id: 'darkMatterSurge',
    name: 'Dark Matter Surge',
    description: 'A dark matter wave passes through your territory!',
    minEra: 6,
    type: 'timed',
    duration: 45,
    effect: { resourceId: 'darkEnergy', rateMultBonus: 3 },
  },
  stellarNursery: {
    id: 'stellarNursery',
    name: 'Stellar Nursery',
    description: 'A star-forming region yields new colonizable systems!',
    minEra: 6,
    type: 'instant',
    effect: { resourceId: 'starSystems', amount: 5 },
  },

  // Era 7: Dyson Era
  stellarForgeIgnition: {
    id: 'stellarForgeIgnition',
    name: 'Stellar Forge Ignition',
    description: 'A forge reaches critical mass — stellar output surges!',
    minEra: 7,
    type: 'timed',
    duration: 40,
    effect: { resourceId: 'stellarForge', rateMultBonus: 4 },
  },
  megastructureBreakthrough: {
    id: 'megastructureBreakthrough',
    name: 'Megastructure Breakthrough',
    description: 'Engineering breakthrough — free megastructure materials!',
    minEra: 7,
    type: 'instant',
    effect: { resourceId: 'megastructures', amount: 5 },
  },

  // Era 8: Galactic
  cosmicWindfall: {
    id: 'cosmicWindfall',
    name: 'Cosmic Windfall',
    description: 'A rift opens, showering the area with exotic matter!',
    minEra: 8,
    type: 'instant',
    effect: { resourceId: 'exoticMatter', amount: 75 },
  },
  diplomaticVictory: {
    id: 'diplomaticVictory',
    name: 'Diplomatic Victory',
    description: 'Your diplomats win over a new sector — influence surges!',
    minEra: 8,
    type: 'timed',
    duration: 60,
    effect: { resourceId: 'galacticInfluence', rateMultBonus: 5 },
  },

  // Era 9: Intergalactic
  voidEcho: {
    id: 'voidEcho',
    name: 'Void Echo',
    description: 'A resonance from the void amplifies cosmic power!',
    minEra: 9,
    type: 'timed',
    duration: 50,
    effect: { resourceId: 'cosmicPower', rateMultBonus: 4 },
  },
  universalFlux: {
    id: 'universalFlux',
    name: 'Universal Flux',
    description: 'Physical constants fluctuate — you capture the energy!',
    minEra: 9,
    type: 'instant',
    effect: { resourceId: 'universalConstants', amount: 10 },
  },

  // Era 10: Multiverse
  realityStorm: {
    id: 'realityStorm',
    name: 'Reality Storm',
    description: 'A storm of realities collides — fragments everywhere!',
    minEra: 10,
    type: 'instant',
    effect: { resourceId: 'realityFragments', amount: 100 },
  },
  quantumResonance: {
    id: 'quantumResonance',
    name: 'Quantum Resonance',
    description: 'Parallel universes harmonize — echoes amplified!',
    minEra: 10,
    type: 'timed',
    duration: 60,
    effect: { resourceId: 'quantumEchoes', rateMultBonus: 5 },
  },
  // Additional events for variety
  goldenAge: {
    id: 'goldenAge',
    name: 'Golden Age',
    description: 'A golden age of prosperity — all production boosted!',
    minEra: 2,
    type: 'timed',
    duration: 45,
    effect: { resourceId: 'food', rateMultBonus: 5 },
  },
  breakthroughResearch: {
    id: 'breakthroughResearch',
    name: 'Breakthrough Research',
    description: 'A eureka moment accelerates research!',
    minEra: 2,
    type: 'timed',
    duration: 30,
    effect: { resourceId: 'steel', rateMultBonus: 4 },
  },
  materialWindfall: {
    id: 'materialWindfall',
    name: 'Material Windfall',
    description: 'A rich vein of materials discovered!',
    minEra: 2,
    type: 'instant',
    effect: { resourceId: 'materials', amount: 50 },
  },
  energySurge: {
    id: 'energySurge',
    name: 'Energy Surge',
    description: 'Power grid hits peak efficiency!',
    minEra: 2,
    type: 'timed',
    duration: 25,
    effect: { resourceId: 'energy', rateMultBonus: 3 },
  },
  solarStorm: {
    id: 'solarStorm',
    name: 'Solar Storm',
    description: 'A massive solar storm energizes your systems!',
    minEra: 4,
    type: 'instant',
    effect: { resourceId: 'energy', amount: 200 },
  },
  colonyBoom: {
    id: 'colonyBoom',
    name: 'Colony Boom',
    description: 'Birth rate spikes across colonies — rapid expansion!',
    minEra: 5,
    type: 'timed',
    duration: 40,
    effect: { resourceId: 'colonies', rateMultBonus: 3 },
  },
  alienArtifact: {
    id: 'alienArtifact',
    name: 'Alien Artifact',
    description: 'An alien artifact is discovered — exotic materials surge!',
    minEra: 5,
    type: 'instant',
    effect: { resourceId: 'exoticMaterials', amount: 50 },
  },
  cosmicWind: {
    id: 'cosmicWind',
    name: 'Cosmic Wind',
    description: 'Cosmic winds fill your sails — dark energy flows!',
    minEra: 6,
    type: 'timed',
    duration: 40,
    effect: { resourceId: 'darkEnergy', rateMultBonus: 4 },
  },
  cosmicHarvest: {
    id: 'cosmicHarvest',
    name: 'Cosmic Harvest',
    description: 'A burst of cosmic energy fuels your civilization!',
    minEra: 9,
    type: 'timed',
    duration: 50,
    effect: { resourceId: 'cosmicPower', rateMultBonus: 4 },
  },
  realityGlitch: {
    id: 'realityGlitch',
    name: 'Reality Glitch',
    description: 'A glitch in reality reveals hidden universal constants!',
    minEra: 9,
    type: 'instant',
    effect: { resourceId: 'universalConstants', amount: 15 },
  },
  dimensionalOverlap: {
    id: 'dimensionalOverlap',
    name: 'Dimensional Overlap',
    description: 'Parallel dimensions briefly overlap — quantum echoes surge!',
    minEra: 10,
    type: 'timed',
    duration: 45,
    effect: { resourceId: 'quantumEchoes', rateMultBonus: 8 },
  },
  multiversalTrade: {
    id: 'multiversalTrade',
    name: 'Multiversal Trade',
    description: 'Trade routes open between realities — reality fragments pour in!',
    minEra: 10,
    type: 'instant',
    effect: { resourceId: 'realityFragments', amount: 200 },
  },
  // New events
  volcanicEruption: {
    id: 'volcanicEruption',
    name: 'Volcanic Eruption',
    description: 'A volcanic eruption exposes rare mineral deposits!',
    minEra: 2,
    type: 'instant',
    effect: { resourceId: 'materials', amount: 60 },
  },
  tradeCaravan: {
    id: 'tradeCaravan',
    name: 'Trade Caravan',
    description: 'A merchant caravan arrives with surplus goods!',
    minEra: 2,
    type: 'instant',
    effect: { resourceId: 'food', amount: 40 },
  },
  dataMigration: {
    id: 'dataMigration',
    name: 'Data Migration',
    description: 'Legacy systems are modernized — software output spikes!',
    minEra: 3,
    type: 'timed',
    duration: 30,
    effect: { resourceId: 'software', rateMultBonus: 5 },
  },
  orbitalDebrisField: {
    id: 'orbitalDebrisField',
    name: 'Orbital Debris Field',
    description: 'A debris field yields salvageable orbital components!',
    minEra: 4,
    type: 'instant',
    effect: { resourceId: 'orbitalInfra', amount: 15 },
  },
  ionStorm: {
    id: 'ionStorm',
    name: 'Ion Storm',
    description: 'An ion storm supercharges rocket fuel production!',
    minEra: 5,
    type: 'timed',
    duration: 35,
    effect: { resourceId: 'rocketFuel', rateMultBonus: 5 },
  },
  nebulaBurst: {
    id: 'nebulaBurst',
    name: 'Nebula Burst',
    description: 'A nebula explosion releases a wave of exotic materials!',
    minEra: 5,
    type: 'instant',
    effect: { resourceId: 'exoticMaterials', amount: 60 },
  },
  warpFieldAnomaly: {
    id: 'warpFieldAnomaly',
    name: 'Warp Field Anomaly',
    description: 'A warp field anomaly reveals hidden star systems!',
    minEra: 6,
    type: 'instant',
    effect: { resourceId: 'starSystems', amount: 10 },
  },
  forgeResonance: {
    id: 'forgeResonance',
    name: 'Forge Resonance',
    description: 'Stellar forges enter resonance — megastructure output surges!',
    minEra: 7,
    type: 'timed',
    duration: 40,
    effect: { resourceId: 'megastructures', rateMultBonus: 6 },
  },
  exoticMatterGeyser: {
    id: 'exoticMatterGeyser',
    name: 'Exotic Matter Geyser',
    description: 'A geyser of exotic matter erupts from a collapsed star!',
    minEra: 8,
    type: 'instant',
    effect: { resourceId: 'exoticMatter', amount: 60 },
  },
  constantShift: {
    id: 'constantShift',
    name: 'Constant Shift',
    description: 'Universal constants shift favorably — production doubles!',
    minEra: 9,
    type: 'timed',
    duration: 45,
    effect: { resourceId: 'universalConstants', rateMultBonus: 6 },
  },
  echoConvergence: {
    id: 'echoConvergence',
    name: 'Echo Convergence',
    description: 'Quantum echoes from countless realities converge!',
    minEra: 10,
    type: 'timed',
    duration: 50,
    effect: { resourceId: 'quantumEchoes', rateMultBonus: 10 },
  },
  multiversalCollision: {
    id: 'multiversalCollision',
    name: 'Multiversal Collision',
    description: 'Two realities collide and fuse — reality fragments scatter!',
    minEra: 10,
    type: 'instant',
    effect: { resourceId: 'realityFragments', amount: 300 },
  },
  temporalAnomaly: {
    id: 'temporalAnomaly',
    name: 'Temporal Anomaly',
    description: 'Time dilates — production accelerates across the board!',
    minEra: 7,
    type: 'timed',
    duration: 30,
    effect: { resourceId: 'megastructures', rateMultBonus: 5 },
  },
  darkEnergyCascade: {
    id: 'darkEnergyCascade',
    name: 'Dark Energy Cascade',
    description: 'A cascade of dark energy floods nearby space!',
    minEra: 6,
    type: 'instant',
    effect: { resourceId: 'darkEnergy', amount: 50 },
  },
  rocketBoost: {
    id: 'rocketBoost',
    name: 'Rocket Boost',
    description: 'Optimized fuel mixture — rocket fuel production surges!',
    minEra: 4,
    type: 'timed',
    duration: 35,
    effect: { resourceId: 'rocketFuel', rateMultBonus: 4 },
  },
  dataBreeze: {
    id: 'dataBreeze',
    name: 'Data Breeze',
    description: 'A surge of information flows through networks!',
    minEra: 3,
    type: 'timed',
    duration: 30,
    effect: { resourceId: 'data', rateMultBonus: 4 },
  },
  exoticDiscovery: {
    id: 'exoticDiscovery',
    name: 'Exotic Discovery',
    description: 'Explorers find a cache of exotic materials!',
    minEra: 5,
    type: 'instant',
    effect: { resourceId: 'exoticMaterials', amount: 40 },
  },
  influenceSurge: {
    id: 'influenceSurge',
    name: 'Influence Surge',
    description: 'Your civilization inspires the galaxy!',
    minEra: 8,
    type: 'timed',
    duration: 45,
    effect: { resourceId: 'galacticInfluence', rateMultBonus: 4 },
  },
  laborRevolution: {
    id: 'laborRevolution',
    name: 'Labor Revolution',
    description: 'Workers unite for greater efficiency!',
    minEra: 2,
    type: 'timed',
    duration: 35,
    effect: { resourceId: 'labor', rateMultBonus: 3 },
  },
  orbitalCache: {
    id: 'orbitalCache',
    name: 'Orbital Cache',
    description: 'Discover an ancient orbital cache!',
    minEra: 4,
    type: 'instant',
    effect: { resourceId: 'orbitalInfra', amount: 10 },
  },
  galacticConference: {
    id: 'galacticConference',
    name: 'Galactic Conference',
    description: 'A conference of civilizations boosts influence!',
    minEra: 8,
    type: 'instant',
    effect: { resourceId: 'galacticInfluence', amount: 100 },
  },
  stellarAlchemy: {
    id: 'stellarAlchemy',
    name: 'Stellar Alchemy',
    description: 'Stars forge rare elements — stellar forge output surges!',
    minEra: 7,
    type: 'timed',
    duration: 35,
    effect: { resourceId: 'stellarForge', rateMultBonus: 5 },
  },
  cosmicRenewal: {
    id: 'cosmicRenewal',
    name: 'Cosmic Renewal',
    description: 'The universe itself regenerates — cosmic power replenished!',
    minEra: 9,
    type: 'instant',
    effect: { resourceId: 'cosmicPower', amount: 150 },
  },
  realityEcho: {
    id: 'realityEcho',
    name: 'Reality Echo',
    description: 'An echo from another reality — universal constants revealed!',
    minEra: 9,
    type: 'timed',
    duration: 40,
    effect: { resourceId: 'universalConstants', rateMultBonus: 5 },
  },
  foodFestival: {
    id: 'foodFestival',
    name: 'Food Festival',
    description: 'A bountiful harvest — food production doubled!',
    minEra: 2,
    type: 'timed',
    duration: 25,
    effect: { resourceId: 'food', rateMultBonus: 3 },
  },
  electronicsBoom: {
    id: 'electronicsBoom',
    name: 'Electronics Boom',
    description: 'Consumer electronics demand drives innovation!',
    minEra: 3,
    type: 'timed',
    duration: 30,
    effect: { resourceId: 'electronics', rateMultBonus: 3 },
  },
  softwareRevolution: {
    id: 'softwareRevolution',
    name: 'Software Revolution',
    description: 'A paradigm shift in software engineering!',
    minEra: 3,
    type: 'timed',
    duration: 35,
    effect: { resourceId: 'software', rateMultBonus: 4 },
  },
  materialsBonanza: {
    id: 'materialsBonanza',
    name: 'Materials Bonanza',
    description: 'Rich deposits uncovered!',
    minEra: 2,
    type: 'instant',
    effect: { resourceId: 'materials', amount: 80 },
  },
  colonyExpansion: {
    id: 'colonyExpansion',
    name: 'Colony Expansion',
    description: 'Rapid colonization event!',
    minEra: 5,
    type: 'timed',
    duration: 35,
    effect: { resourceId: 'colonies', rateMultBonus: 5 },
  },
  laborShortage: {
    id: 'laborShortage',
    name: 'Labor Shortage Resolved',
    description: 'New immigrants arrive — labor production boosted!',
    minEra: 2,
    type: 'instant',
    effect: { resourceId: 'labor', amount: 30 },
  },
  starSystemDiscovery: {
    id: 'starSystemDiscovery',
    name: 'Star System Discovery',
    description: 'Astronomers discover a cluster of new star systems!',
    minEra: 6,
    type: 'instant',
    effect: { resourceId: 'starSystems', amount: 8 },
  },
  exoticMatterVein: {
    id: 'exoticMatterVein',
    name: 'Exotic Matter Vein',
    description: 'A rich vein of exotic matter found in deep space!',
    minEra: 8,
    type: 'timed',
    duration: 45,
    effect: { resourceId: 'exoticMatter', rateMultBonus: 5 },
  },
  megastructureInspiration: {
    id: 'megastructureInspiration',
    name: 'Megastructure Inspiration',
    description: 'Engineers have a breakthrough in megastructure design!',
    minEra: 7,
    type: 'instant',
    effect: { resourceId: 'megastructures', amount: 8 },
  },
  cosmicAlchemy: {
    id: 'cosmicAlchemy',
    name: 'Cosmic Alchemy',
    description: 'Transmutation of cosmic elements yields cosmic power!',
    minEra: 9,
    type: 'instant',
    effect: { resourceId: 'cosmicPower', amount: 200 },
  },
  quantumFluctuation: {
    id: 'quantumFluctuation',
    name: 'Quantum Fluctuation',
    description: 'A quantum event creates quantum echoes from nothing!',
    minEra: 10,
    type: 'instant',
    effect: { resourceId: 'quantumEchoes', amount: 50 },
  },
  electricalStorm: {
    id: 'electricalStorm',
    name: 'Electrical Storm',
    description: 'A massive storm supercharges energy systems!',
    minEra: 2,
    type: 'instant',
    effect: { resourceId: 'energy', amount: 40 },
  },
  innovationWave: {
    id: 'innovationWave',
    name: 'Innovation Wave',
    description: 'A wave of innovation sweeps across industries!',
    minEra: 3,
    type: 'timed',
    duration: 30,
    effect: { resourceId: 'electronics', rateMultBonus: 4 },
  },
  supernova: {
    id: 'supernova',
    name: 'Supernova',
    description: 'A nearby supernova showers the system with stellar forge material!',
    minEra: 7,
    type: 'instant',
    effect: { resourceId: 'stellarForge', amount: 20 },
  },
  cosmicInspiration: {
    id: 'cosmicInspiration',
    name: 'Cosmic Inspiration',
    description: 'The vastness of space inspires breakthroughs!',
    minEra: 5,
    type: 'timed',
    duration: 40,
    effect: { resourceId: 'research', rateMultBonus: 5 },
  },
  darkEnergyWell: {
    id: 'darkEnergyWell',
    name: 'Dark Energy Well',
    description: 'A natural dark energy well discovered!',
    minEra: 6,
    type: 'timed',
    duration: 45,
    effect: { resourceId: 'darkEnergy', rateMultBonus: 5 },
  },
  quantumBreakthrough: {
    id: 'quantumBreakthrough',
    name: 'Quantum Breakthrough',
    description: 'A quantum computing breakthrough revolutionizes all processing!',
    minEra: 3,
    type: 'timed',
    duration: 30,
    effect: { resourceId: 'research', rateMultBonus: 4 },
  },
  stellarForgeOverdrive: {
    id: 'stellarForgeOverdrive',
    name: 'Stellar Forge Overdrive',
    description: 'The forge reaches peak efficiency!',
    minEra: 7,
    type: 'timed',
    duration: 35,
    effect: { resourceId: 'stellarForge', rateMultBonus: 6 },
  },
  cosmicAlignment: {
    id: 'cosmicAlignment',
    name: 'Cosmic Alignment',
    description: 'Galaxies align — cosmic power surges!',
    minEra: 9,
    type: 'timed',
    duration: 50,
    effect: { resourceId: 'cosmicPower', rateMultBonus: 6 },
  },
  realityWave: {
    id: 'realityWave',
    name: 'Reality Wave',
    description: 'A wave of pure reality washes across dimensions!',
    minEra: 10,
    type: 'timed',
    duration: 40,
    effect: { resourceId: 'realityFragments', rateMultBonus: 10 },
  },
  resourceSurge: {
    id: 'resourceSurge',
    name: 'Resource Surge',
    description: 'A universal surge of productivity!',
    minEra: 2,
    type: 'instant',
    effect: { resourceId: 'steel', amount: 30 },
  },
  exoticMatterRain: {
    id: 'exoticMatterRain',
    name: 'Exotic Matter Rain',
    description: 'Exotic particles rain from a collapsing dimension!',
    minEra: 8,
    type: 'instant',
    effect: { resourceId: 'exoticMatter', amount: 40 },
  },
  steelBoom: {
    id: 'steelBoom',
    name: 'Steel Boom',
    description: 'New ore deposits found — steel production surges!',
    minEra: 2,
    type: 'timed',
    duration: 30,
    effect: { resourceId: 'steel', rateMultBonus: 5 },
  },
  researchGrant: {
    id: 'researchGrant',
    name: 'Research Grant',
    description: 'Government funding accelerates research!',
    minEra: 3,
    type: 'timed',
    duration: 40,
    effect: { resourceId: 'research', rateMultBonus: 3 },
  },
  cometImpact: {
    id: 'cometImpact',
    name: 'Comet Impact',
    description: 'A comet delivers rare materials from deep space!',
    minEra: 5,
    type: 'instant',
    effect: { resourceId: 'exoticMaterials', amount: 80 },
  },

  // --- New events ---

  // Era 2
  ironRush: {
    id: 'ironRush',
    name: 'Iron Rush',
    description: 'A massive iron deposit is uncovered — steel floods the market!',
    minEra: 2,
    type: 'instant',
    effect: { resourceId: 'steel', amount: 50 },
  },
  bumperHarvest: {
    id: 'bumperHarvest',
    name: 'Bumper Harvest',
    description: 'Perfect weather yields a record-breaking harvest!',
    minEra: 2,
    type: 'timed',
    duration: 30,
    effect: { resourceId: 'food', rateMultBonus: 4 },
  },

  // Era 3
  cloudComputing: {
    id: 'cloudComputing',
    name: 'Cloud Computing Boom',
    description: 'Cloud infrastructure scales exponentially — data production surges!',
    minEra: 3,
    type: 'timed',
    duration: 35,
    effect: { resourceId: 'data', rateMultBonus: 5 },
  },
  chipBreakthrough: {
    id: 'chipBreakthrough',
    name: 'Chip Breakthrough',
    description: 'A new semiconductor process yields a flood of electronics!',
    minEra: 3,
    type: 'instant',
    effect: { resourceId: 'electronics', amount: 40 },
  },

  // Era 4
  gravityAssist: {
    id: 'gravityAssist',
    name: 'Gravity Assist',
    description: 'A planetary alignment provides free delta-v — rocket fuel saved!',
    minEra: 4,
    type: 'instant',
    effect: { resourceId: 'rocketFuel', amount: 120 },
  },
  orbitalFactory: {
    id: 'orbitalFactory',
    name: 'Orbital Factory Online',
    description: 'A zero-g factory enters service — orbital infrastructure booms!',
    minEra: 4,
    type: 'timed',
    duration: 40,
    effect: { resourceId: 'orbitalInfra', rateMultBonus: 4 },
  },

  // Era 5
  terraformingSuccess: {
    id: 'terraformingSuccess',
    name: 'Terraforming Success',
    description: 'A planet completes terraforming — new colonies established!',
    minEra: 5,
    type: 'instant',
    effect: { resourceId: 'colonies', amount: 10 },
  },

  // Era 6
  interstellarBeacon: {
    id: 'interstellarBeacon',
    name: 'Interstellar Beacon',
    description: 'An ancient beacon activates, revealing hidden star systems!',
    minEra: 6,
    type: 'instant',
    effect: { resourceId: 'starSystems', amount: 12 },
  },
  darkMatterLens: {
    id: 'darkMatterLens',
    name: 'Dark Matter Lens',
    description: 'A gravitational lens focuses dark energy into your collectors!',
    minEra: 6,
    type: 'timed',
    duration: 50,
    effect: { resourceId: 'darkEnergy', rateMultBonus: 6 },
  },

  // Era 7
  dysonSwarmSync: {
    id: 'dysonSwarmSync',
    name: 'Dyson Swarm Synchronization',
    description: 'All Dyson satellites align — stellar forge output peaks!',
    minEra: 7,
    type: 'timed',
    duration: 45,
    effect: { resourceId: 'stellarForge', rateMultBonus: 7 },
  },

  // Era 8
  galacticSummit: {
    id: 'galacticSummit',
    name: 'Galactic Summit',
    description: 'A summit of elder civilizations grants vast influence!',
    minEra: 8,
    type: 'instant',
    effect: { resourceId: 'galacticInfluence', amount: 150 },
  },
  exoticMatterRefinery: {
    id: 'exoticMatterRefinery',
    name: 'Exotic Matter Refinery',
    description: 'A new refinery process multiplies exotic matter yield!',
    minEra: 8,
    type: 'timed',
    duration: 50,
    effect: { resourceId: 'exoticMatter', rateMultBonus: 6 },
  },

  // Era 9
  intergalacticTide: {
    id: 'intergalacticTide',
    name: 'Intergalactic Tide',
    description: 'A tide of energy sweeps between galaxies — cosmic power floods in!',
    minEra: 9,
    type: 'instant',
    effect: { resourceId: 'cosmicPower', amount: 250 },
  },

  // Era 10
  omniversalRipple: {
    id: 'omniversalRipple',
    name: 'Omniversal Ripple',
    description: 'A ripple across all realities deposits reality fragments!',
    minEra: 10,
    type: 'instant',
    effect: { resourceId: 'realityFragments', amount: 400 },
  },
  parallelConvergence: {
    id: 'parallelConvergence',
    name: 'Parallel Convergence',
    description: 'Infinite parallel selves synchronize — quantum echoes explode!',
    minEra: 10,
    type: 'timed',
    duration: 55,
    effect: { resourceId: 'quantumEchoes', rateMultBonus: 12 },
  },

  // --- More events for variety ---

  // Era 2
  feudalReform: {
    id: 'feudalReform',
    name: 'Feudal Reform',
    description: 'A progressive reform doubles labor efficiency!',
    minEra: 2,
    type: 'timed',
    duration: 30,
    effect: { resourceId: 'labor', rateMultBonus: 4 },
  },
  mineralVein: {
    id: 'mineralVein',
    name: 'Deep Mineral Vein',
    description: 'Miners strike a deep vein of precious minerals!',
    minEra: 2,
    type: 'instant',
    effect: { resourceId: 'materials', amount: 90 },
  },

  // Era 3
  aiAssistant: {
    id: 'aiAssistant',
    name: 'AI Assistant',
    description: 'An AI assistant automates routine tasks — data output triples!',
    minEra: 3,
    type: 'timed',
    duration: 40,
    effect: { resourceId: 'data', rateMultBonus: 3 },
  },
  serverFarm: {
    id: 'serverFarm',
    name: 'Server Farm Expansion',
    description: 'A new server farm comes online — electronics production boosted!',
    minEra: 3,
    type: 'instant',
    effect: { resourceId: 'electronics', amount: 35 },
  },

  // Era 4
  spaceElevator: {
    id: 'spaceElevator',
    name: 'Space Elevator',
    description: 'A space elevator slashes launch costs — orbital infrastructure surges!',
    minEra: 4,
    type: 'timed',
    duration: 45,
    effect: { resourceId: 'orbitalInfra', rateMultBonus: 5 },
  },
  fusionIgnition: {
    id: 'fusionIgnition',
    name: 'Fusion Ignition',
    description: 'Fusion reactors achieve net positive energy!',
    minEra: 4,
    type: 'instant',
    effect: { resourceId: 'energy', amount: 300 },
  },

  // Era 5
  ringWorldBlueprint: {
    id: 'ringWorldBlueprint',
    name: 'Ringworld Blueprint',
    description: 'Ancient blueprints for a ringworld are decoded — colony potential soars!',
    minEra: 5,
    type: 'instant',
    effect: { resourceId: 'colonies', amount: 15 },
  },

  // Era 6
  hyperlaneSurvey: {
    id: 'hyperlaneSurvey',
    name: 'Hyperlane Survey',
    description: 'Scouts map new hyperlanes — star systems discovered!',
    minEra: 6,
    type: 'timed',
    duration: 40,
    effect: { resourceId: 'starSystems', rateMultBonus: 5 },
  },

  // Era 7
  neutronStarCapture: {
    id: 'neutronStarCapture',
    name: 'Neutron Star Capture',
    description: 'Engineers harness a neutron star — stellar forge output spikes!',
    minEra: 7,
    type: 'instant',
    effect: { resourceId: 'stellarForge', amount: 30 },
  },
  matrioshkaBrain: {
    id: 'matrioshkaBrain',
    name: 'Matrioshka Brain',
    description: 'A computational megastructure comes online — research explodes!',
    minEra: 7,
    type: 'timed',
    duration: 50,
    effect: { resourceId: 'research', rateMultBonus: 8 },
  },

  // Era 8
  federationPact: {
    id: 'federationPact',
    name: 'Federation Pact',
    description: 'A galactic federation is formed — influence skyrockets!',
    minEra: 8,
    type: 'timed',
    duration: 55,
    effect: { resourceId: 'galacticInfluence', rateMultBonus: 6 },
  },
  voidMining: {
    id: 'voidMining',
    name: 'Void Mining',
    description: 'Mining the void between galaxies yields exotic matter!',
    minEra: 8,
    type: 'instant',
    effect: { resourceId: 'exoticMatter', amount: 90 },
  },

  // Era 9
  universalHarmony: {
    id: 'universalHarmony',
    name: 'Universal Harmony',
    description: 'All universal constants align perfectly — production maximized!',
    minEra: 9,
    type: 'timed',
    duration: 55,
    effect: { resourceId: 'universalConstants', rateMultBonus: 8 },
  },
  cosmicSingularity: {
    id: 'cosmicSingularity',
    name: 'Cosmic Singularity',
    description: 'A singularity erupts with cosmic power!',
    minEra: 9,
    type: 'instant',
    effect: { resourceId: 'cosmicPower', amount: 350 },
  },

  // Era 10
  infinityMirror: {
    id: 'infinityMirror',
    name: 'Infinity Mirror',
    description: 'Realities reflect endlessly — reality fragments multiply!',
    minEra: 10,
    type: 'timed',
    duration: 50,
    effect: { resourceId: 'realityFragments', rateMultBonus: 12 },
  },
  multiversalSymphony: {
    id: 'multiversalSymphony',
    name: 'Multiversal Symphony',
    description: 'All realities resonate in harmony — quantum echoes flood in!',
    minEra: 10,
    type: 'instant',
    effect: { resourceId: 'quantumEchoes', amount: 100 },
  },

  // --- 16 new events ---

  // Era 2
  apprenticeGuild: { id: 'apprenticeGuild', name: 'Apprentice Guild', description: 'A guild of apprentices boosts labor productivity!', minEra: 2, type: 'timed', duration: 30, effect: { resourceId: 'labor', rateMultBonus: 5 } },
  coalDiscovery: { id: 'coalDiscovery', name: 'Coal Discovery', description: 'A massive coal deposit is discovered — energy reserves soar!', minEra: 2, type: 'instant', effect: { resourceId: 'energy', amount: 60 } },

  // Era 3
  cryptoMiningBoom: { id: 'cryptoMiningBoom', name: 'Crypto Mining Boom', description: 'A crypto boom drives electronics and data production!', minEra: 3, type: 'timed', duration: 35, effect: { resourceId: 'electronics', rateMultBonus: 5 } },
  openDataInitiative: { id: 'openDataInitiative', name: 'Open Data Initiative', description: 'Governments release massive datasets — data floods in!', minEra: 3, type: 'instant', effect: { resourceId: 'data', amount: 50 } },

  // Era 4
  titanExpedition: { id: 'titanExpedition', name: 'Titan Expedition', description: 'An expedition to Titan uncovers exotic fuel reserves!', minEra: 4, type: 'instant', effect: { resourceId: 'rocketFuel', amount: 150 } },
  solarWindSurge: { id: 'solarWindSurge', name: 'Solar Wind Surge', description: 'Intense solar winds supercharge orbital infrastructure!', minEra: 4, type: 'timed', duration: 35, effect: { resourceId: 'orbitalInfra', rateMultBonus: 5 } },

  // Era 5
  iceGiantMining: { id: 'iceGiantMining', name: 'Ice Giant Mining', description: 'Mining operations on Uranus yield exotic materials!', minEra: 5, type: 'instant', effect: { resourceId: 'exoticMaterials', amount: 70 } },
  gravityLensing: { id: 'gravityLensing', name: 'Gravity Lensing', description: 'Gravitational lensing reveals hidden colonies!', minEra: 5, type: 'timed', duration: 40, effect: { resourceId: 'colonies', rateMultBonus: 4 } },

  // Era 6
  stellarNova: { id: 'stellarNova', name: 'Stellar Nova', description: 'A nearby nova scatters dark energy across your territory!', minEra: 6, type: 'instant', effect: { resourceId: 'darkEnergy', amount: 60 } },
  firstContactProtocol: { id: 'firstContactProtocol', name: 'First Contact Protocol', description: 'Alien contact protocols yield galactic influence!', minEra: 6, type: 'timed', duration: 45, effect: { resourceId: 'galacticInfluence', rateMultBonus: 4 } },

  // Era 7
  stellarQuake: { id: 'stellarQuake', name: 'Stellar Quake', description: 'A stellar quake shakes loose megastructure materials!', minEra: 7, type: 'instant', effect: { resourceId: 'megastructures', amount: 10 } },
  dysonFlare: { id: 'dysonFlare', name: 'Dyson Flare', description: 'A Dyson sphere flare overcharges the stellar forge!', minEra: 7, type: 'timed', duration: 40, effect: { resourceId: 'stellarForge', rateMultBonus: 8 } },

  // Era 8
  galacticRenaissance: { id: 'galacticRenaissance', name: 'Galactic Renaissance', description: 'A cultural renaissance sweeps the galaxy — influence explodes!', minEra: 8, type: 'timed', duration: 50, effect: { resourceId: 'galacticInfluence', rateMultBonus: 7 } },
  exoticMatterCascade: { id: 'exoticMatterCascade', name: 'Exotic Matter Cascade', description: 'A cascade reaction multiplies exotic matter yield!', minEra: 8, type: 'instant', effect: { resourceId: 'exoticMatter', amount: 100 } },

  // Era 9
  cosmicDawn: { id: 'cosmicDawn', name: 'Cosmic Dawn', description: 'The dawn of a new cosmic epoch — cosmic power surges!', minEra: 9, type: 'timed', duration: 55, effect: { resourceId: 'cosmicPower', rateMultBonus: 7 } },

  // Era 10
  omniversalBloom: { id: 'omniversalBloom', name: 'Omniversal Bloom', description: 'All realities bloom simultaneously — reality fragments rain down!', minEra: 10, type: 'instant', effect: { resourceId: 'realityFragments', amount: 500 } },

  // --- 16 new events ---

  // Era 2
  inventorsFair: { id: 'inventorsFair', name: 'Inventors Fair', description: 'Brilliant minds gather — electronics production accelerated!', minEra: 2, type: 'timed', duration: 30, effect: { resourceId: 'electronics', rateMultBonus: 4 } },
  floodPlainBounty: { id: 'floodPlainBounty', name: 'Flood Plain Bounty', description: 'Fertile floodplains yield an enormous harvest!', minEra: 2, type: 'instant', effect: { resourceId: 'food', amount: 70 } },

  // Era 3
  viralAlgorithm: { id: 'viralAlgorithm', name: 'Viral Algorithm', description: 'An algorithm goes viral — software production surges!', minEra: 3, type: 'timed', duration: 35, effect: { resourceId: 'software', rateMultBonus: 6 } },
  dataCenterExpansion: { id: 'dataCenterExpansion', name: 'Data Center Expansion', description: 'A new mega data center comes online — data floods in!', minEra: 3, type: 'instant', effect: { resourceId: 'data', amount: 60 } },

  // Era 4
  microMeteorShower: { id: 'microMeteorShower', name: 'Micro-Meteor Shower', description: 'Tiny meteors carry exotic trace elements — research boosted!', minEra: 4, type: 'timed', duration: 30, effect: { resourceId: 'research', rateMultBonus: 5 } },
  orbitalManufacturing: { id: 'orbitalManufacturing', name: 'Orbital Manufacturing Surge', description: 'Zero-G manufacturing hits peak — steel output spikes!', minEra: 4, type: 'instant', effect: { resourceId: 'steel', amount: 150 } },

  // Era 5
  kuiperBeltStrike: { id: 'kuiperBeltStrike', name: 'Kuiper Belt Strike', description: 'Miners hit a massive Kuiper belt deposit — colonies boom!', minEra: 5, type: 'timed', duration: 35, effect: { resourceId: 'colonies', rateMultBonus: 6 } },

  // Era 6
  warpFieldHarvest: { id: 'warpFieldHarvest', name: 'Warp Field Harvest', description: 'A warp field collapses and releases energy — galactic influence surges!', minEra: 6, type: 'timed', duration: 40, effect: { resourceId: 'galacticInfluence', rateMultBonus: 5 } },
  nebularCondensation: { id: 'nebularCondensation', name: 'Nebular Condensation', description: 'A nebula condenses into star-forming clouds — star systems discovered!', minEra: 6, type: 'instant', effect: { resourceId: 'starSystems', amount: 15 } },

  // Era 7
  dysonRingAlignment: { id: 'dysonRingAlignment', name: 'Dyson Ring Alignment', description: 'All Dyson rings align — megastructure construction accelerated!', minEra: 7, type: 'timed', duration: 45, effect: { resourceId: 'megastructures', rateMultBonus: 8 } },

  // Era 8
  cosmicFilamentDiscovery: { id: 'cosmicFilamentDiscovery', name: 'Cosmic Filament Discovery', description: 'A cosmic filament is tapped for exotic matter!', minEra: 8, type: 'timed', duration: 50, effect: { resourceId: 'exoticMatter', rateMultBonus: 7 } },

  // Era 9
  voidWhisper: { id: 'voidWhisper', name: 'Void Whisper', description: 'Whispers from the void reveal universal constants!', minEra: 9, type: 'instant', effect: { resourceId: 'universalConstants', amount: 20 } },
  intergalacticMigration: { id: 'intergalacticMigration', name: 'Intergalactic Migration', description: 'A wave of intergalactic migrants brings cosmic knowledge!', minEra: 9, type: 'timed', duration: 50, effect: { resourceId: 'cosmicPower', rateMultBonus: 8 } },

  // Era 10
  realityFracture: { id: 'realityFracture', name: 'Reality Fracture', description: 'A fracture in reality spills quantum echoes everywhere!', minEra: 10, type: 'instant', effect: { resourceId: 'quantumEchoes', amount: 150 } },
  omniversalHarvest: { id: 'omniversalHarvest', name: 'Omniversal Harvest', description: 'All realities contribute to a massive harvest of fragments!', minEra: 10, type: 'timed', duration: 55, effect: { resourceId: 'realityFragments', rateMultBonus: 15 } },

  // --- 18 new events ---

  // Era 2
  guildMasterwork: { id: 'guildMasterwork', name: 'Guild Masterwork', description: 'Master artisans produce a legendary work — steel output surges!', minEra: 2, type: 'timed', duration: 30, effect: { resourceId: 'steel', rateMultBonus: 6 } },
  granaryOverflow: { id: 'granaryOverflow', name: 'Granary Overflow', description: 'An overflowing granary feeds the masses — food floods in!', minEra: 2, type: 'instant', effect: { resourceId: 'food', amount: 80 } },

  // Era 3
  quantumLeak: { id: 'quantumLeak', name: 'Quantum Leak', description: 'A quantum computing leak yields free research data!', minEra: 3, type: 'instant', effect: { resourceId: 'research', amount: 60 } },
  cyberHeist: { id: 'cyberHeist', name: 'Cyber Heist', description: 'A white-hat heist recovers stolen software assets!', minEra: 3, type: 'timed', duration: 30, effect: { resourceId: 'software', rateMultBonus: 5 } },

  // Era 4
  asteroidRedirect: { id: 'asteroidRedirect', name: 'Asteroid Redirect', description: 'An asteroid is redirected into orbit — exotic materials harvested!', minEra: 4, type: 'instant', effect: { resourceId: 'exoticMaterials', amount: 30 } },
  solarSailBoost: { id: 'solarSailBoost', name: 'Solar Sail Boost', description: 'Solar sails catch a perfect wind — energy production spikes!', minEra: 4, type: 'timed', duration: 35, effect: { resourceId: 'energy', rateMultBonus: 5 } },

  // Era 5
  magnetarPulse: { id: 'magnetarPulse', name: 'Magnetar Pulse', description: 'A magnetar pulse energizes exotic materials extraction!', minEra: 5, type: 'timed', duration: 40, effect: { resourceId: 'exoticMaterials', rateMultBonus: 5 } },

  // Era 6
  alienLibrary: { id: 'alienLibrary', name: 'Alien Library', description: 'An ancient alien library is discovered — research accelerates!', minEra: 6, type: 'timed', duration: 45, effect: { resourceId: 'research', rateMultBonus: 6 } },
  wormholeCollapse: { id: 'wormholeCollapse', name: 'Wormhole Collapse', description: 'A collapsing wormhole showers the area with dark energy!', minEra: 6, type: 'instant', effect: { resourceId: 'darkEnergy', amount: 80 } },

  // Era 7
  stellarFusion: { id: 'stellarFusion', name: 'Stellar Fusion Event', description: 'Two stars merge — stellar forge output goes critical!', minEra: 7, type: 'timed', duration: 45, effect: { resourceId: 'stellarForge', rateMultBonus: 9 } },
  megastructureCache: { id: 'megastructureCache', name: 'Megastructure Cache', description: 'Ancient megastructure blueprints accelerate construction!', minEra: 7, type: 'instant', effect: { resourceId: 'megastructures', amount: 12 } },

  // Era 8
  darkMatterResonance: { id: 'darkMatterResonance', name: 'Dark Matter Resonance', description: 'Dark matter resonates across the galaxy — exotic matter surges!', minEra: 8, type: 'timed', duration: 50, effect: { resourceId: 'exoticMatter', rateMultBonus: 8 } },
  galacticUnification: { id: 'galacticUnification', name: 'Galactic Unification', description: 'A unification event grants massive galactic influence!', minEra: 8, type: 'instant', effect: { resourceId: 'galacticInfluence', amount: 200 } },

  // Era 9
  cosmicEpiphany: { id: 'cosmicEpiphany', name: 'Cosmic Epiphany', description: 'A moment of cosmic clarity reveals universal constants!', minEra: 9, type: 'instant', effect: { resourceId: 'universalConstants', amount: 25 } },
  voidResonanceCascade: { id: 'voidResonanceCascade', name: 'Void Resonance Cascade', description: 'A cascade through the void amplifies cosmic power!', minEra: 9, type: 'timed', duration: 50, effect: { resourceId: 'cosmicPower', rateMultBonus: 9 } },

  // Era 10
  realityBloom: { id: 'realityBloom', name: 'Reality Bloom', description: 'A spontaneous blooming of new realities scatters fragments everywhere!', minEra: 10, type: 'instant', effect: { resourceId: 'realityFragments', amount: 600 } },
  quantumSymphony: { id: 'quantumSymphony', name: 'Quantum Symphony', description: 'All quantum states harmonize — echoes multiply exponentially!', minEra: 10, type: 'timed', duration: 60, effect: { resourceId: 'quantumEchoes', rateMultBonus: 15 } },
  omniversalConvergence: { id: 'omniversalConvergence', name: 'Omniversal Convergence', description: 'All realities converge momentarily — every resource surges!', minEra: 10, type: 'timed', duration: 40, effect: { resourceId: 'universalConstants', rateMultBonus: 10 } },

  // --- 16 new events ---
  // Era 2
  steelRush: { id: 'steelRush', name: 'Steel Rush', description: 'A steel boom sweeps the nation — production surges!', minEra: 2, type: 'timed', duration: 30, effect: { resourceId: 'steel', rateMultBonus: 5 } },
  inventorsFair: { id: 'inventorsFair', name: 'Inventors Fair', description: 'Brilliant minds gather — electronics output spikes!', minEra: 2, type: 'instant', effect: { resourceId: 'electronics', amount: 25 } },

  // Era 3
  aiAwakening: { id: 'aiAwakening', name: 'AI Awakening', description: 'An AI system achieves a breakthrough — research soars!', minEra: 3, type: 'timed', duration: 35, effect: { resourceId: 'research', rateMultBonus: 4 } },
  cloudBurst: { id: 'cloudBurst', name: 'Cloud Burst', description: 'Cloud infrastructure overperforms — data flood!', minEra: 3, type: 'instant', effect: { resourceId: 'data', amount: 45 } },

  // Era 4
  gravityLensing: { id: 'gravityLensing', name: 'Gravity Lensing Event', description: 'A gravitational lens reveals hidden orbital paths!', minEra: 4, type: 'instant', effect: { resourceId: 'orbitalInfra', amount: 20 } },

  // Era 5
  fusionIgnition: { id: 'fusionIgnition', name: 'Fusion Ignition', description: 'Sustained fusion reaction achieved — energy output explodes!', minEra: 5, type: 'timed', duration: 40, effect: { resourceId: 'energy', rateMultBonus: 6 } },
  exoplanetDiscovery: { id: 'exoplanetDiscovery', name: 'Exoplanet Discovery', description: 'A habitable exoplanet discovered — colony rush!', minEra: 5, type: 'instant', effect: { resourceId: 'colonies', amount: 8 } },

  // Era 6
  interstellarWindfall: { id: 'interstellarWindfall', name: 'Interstellar Windfall', description: 'An interstellar trade convoy arrives with exotic goods!', minEra: 6, type: 'instant', effect: { resourceId: 'exoticMaterials', amount: 80 } },
  galacticTide: { id: 'galacticTide', name: 'Galactic Tide', description: 'Gravitational tides push new star systems into range!', minEra: 6, type: 'timed', duration: 35, effect: { resourceId: 'starSystems', rateMultBonus: 5 } },

  // Era 7
  stellarCollapse: { id: 'stellarCollapse', name: 'Stellar Collapse', description: 'A collapsing star feeds the forge — output skyrockets!', minEra: 7, type: 'timed', duration: 35, effect: { resourceId: 'stellarForge', rateMultBonus: 6 } },

  // Era 8
  diplomaticSummit: { id: 'diplomaticSummit', name: 'Diplomatic Summit', description: 'A galactic summit boosts your standing dramatically!', minEra: 8, type: 'instant', effect: { resourceId: 'galacticInfluence', amount: 150 } },
  darkMatterTide: { id: 'darkMatterTide', name: 'Dark Matter Tide', description: 'A tide of dark matter washes through your sector!', minEra: 8, type: 'timed', duration: 50, effect: { resourceId: 'exoticMatter', rateMultBonus: 6 } },

  // Era 9
  voidWhisper: { id: 'voidWhisper', name: 'Void Whisper', description: 'Whispers from the void reveal hidden constants!', minEra: 9, type: 'instant', effect: { resourceId: 'universalConstants', amount: 20 } },

  // Era 10
  paradoxWave: { id: 'paradoxWave', name: 'Paradox Wave', description: 'A wave of paradoxes resolves into pure quantum echoes!', minEra: 10, type: 'instant', effect: { resourceId: 'quantumEchoes', amount: 80 } },
  realityFracture: { id: 'realityFracture', name: 'Reality Fracture', description: 'Reality fractures and reforms — fragments rain down!', minEra: 10, type: 'timed', duration: 45, effect: { resourceId: 'realityFragments', rateMultBonus: 12 } },

  // --- 18 new events ---

  // Era 2
  steamExplosion: { id: 'steamExplosion', name: 'Steam Explosion', description: 'A controlled steam explosion yields tremendous energy!', minEra: 2, type: 'instant', effect: { resourceId: 'energy', amount: 55 } },
  copperVein: { id: 'copperVein', name: 'Copper Vein', description: 'Miners strike a massive copper vein — materials flood in!', minEra: 2, type: 'timed', duration: 30, effect: { resourceId: 'materials', rateMultBonus: 5 } },

  // Era 3
  openSourceRally: { id: 'openSourceRally', name: 'Open Source Rally', description: 'The community rallies around a key project — software output surges!', minEra: 3, type: 'timed', duration: 30, effect: { resourceId: 'software', rateMultBonus: 6 } },
  cyberDefense: { id: 'cyberDefense', name: 'Cyber Defense Victory', description: 'Repelling a cyber attack yields new security data!', minEra: 3, type: 'instant', effect: { resourceId: 'data', amount: 50 } },

  // Era 4
  solarEclipse: { id: 'solarEclipse', name: 'Solar Eclipse', description: 'An eclipse reveals new orbital mechanics insights!', minEra: 4, type: 'instant', effect: { resourceId: 'research', amount: 150 } },
  debrisRecycling: { id: 'debrisRecycling', name: 'Debris Recycling', description: 'Space debris is recycled into usable steel and components!', minEra: 4, type: 'timed', duration: 35, effect: { resourceId: 'steel', rateMultBonus: 5 } },

  // Era 5
  terraformSuccess: { id: 'terraformSuccess', name: 'Terraforming Success', description: 'A planet is successfully terraformed — colonies boom!', minEra: 5, type: 'instant', effect: { resourceId: 'colonies', amount: 10 } },
  antimatterCache: { id: 'antimatterCache', name: 'Antimatter Cache', description: 'A natural antimatter cache provides enormous fuel reserves!', minEra: 5, type: 'timed', duration: 40, effect: { resourceId: 'rocketFuel', rateMultBonus: 6 } },

  // Era 6
  firstContact: { id: 'firstContact', name: 'First Contact', description: 'Peaceful alien contact boosts galactic influence!', minEra: 6, type: 'instant', effect: { resourceId: 'galacticInfluence', amount: 30 } },
  hyperlaneDiscovery: { id: 'hyperlaneDiscovery', name: 'Hyperlane Discovery', description: 'A natural hyperlane is mapped — star system access surges!', minEra: 6, type: 'timed', duration: 40, effect: { resourceId: 'starSystems', rateMultBonus: 6 } },

  // Era 7
  dysonCapture: { id: 'dysonCapture', name: 'Dyson Capture', description: 'A Dyson sphere captures a solar flare — massive energy!', minEra: 7, type: 'instant', effect: { resourceId: 'energy', amount: 500 } },
  forgeHarmonic: { id: 'forgeHarmonic', name: 'Forge Harmonic', description: 'Stellar forges enter harmonic resonance — output triples!', minEra: 7, type: 'timed', duration: 35, effect: { resourceId: 'megastructures', rateMultBonus: 8 } },

  // Era 8
  galacticEnlightenment: { id: 'galacticEnlightenment', name: 'Galactic Enlightenment', description: 'An enlightenment of science sweeps the galaxy!', minEra: 8, type: 'timed', duration: 45, effect: { resourceId: 'research', rateMultBonus: 6 } },
  exoticMatterRift: { id: 'exoticMatterRift', name: 'Exotic Matter Rift', description: 'A rift opens, pouring exotic matter into normal space!', minEra: 8, type: 'instant', effect: { resourceId: 'exoticMatter', amount: 100 } },

  // Era 9
  cosmicHarmonics: { id: 'cosmicHarmonics', name: 'Cosmic Harmonics', description: 'The cosmos vibrates in harmony — universal constants stabilize!', minEra: 9, type: 'timed', duration: 50, effect: { resourceId: 'universalConstants', rateMultBonus: 8 } },
  voidBloom: { id: 'voidBloom', name: 'Void Bloom', description: 'The void blooms with cosmic energy — power erupts!', minEra: 9, type: 'instant', effect: { resourceId: 'cosmicPower', amount: 300 } },

  // Era 10
  omniversalEcho: { id: 'omniversalEcho', name: 'Omniversal Echo', description: 'An echo reverberates across all realities — quantum echoes multiply!', minEra: 10, type: 'timed', duration: 55, effect: { resourceId: 'quantumEchoes', rateMultBonus: 15 } },
  realityMerge: { id: 'realityMerge', name: 'Reality Merge', description: 'Two parallel realities merge briefly — fragments explode!', minEra: 10, type: 'instant', effect: { resourceId: 'realityFragments', amount: 500 } },

  // --- 18 new events ---

  // Era 2
  workshopFire: { id: 'workshopFire', name: 'Workshop Discovery', description: 'A fire reveals hidden metal deposits — steel floods in!', minEra: 2, type: 'instant', effect: { resourceId: 'steel', amount: 45 } },
  harvestMoon: { id: 'harvestMoon', name: 'Harvest Moon', description: 'A harvest moon blesses the fields — food output surges!', minEra: 2, type: 'timed', duration: 30, effect: { resourceId: 'food', rateMultBonus: 5 } },

  // Era 3
  algorithmicBreakthrough: { id: 'algorithmicBreakthrough', name: 'Algorithmic Breakthrough', description: 'A new algorithm revolutionizes data processing!', minEra: 3, type: 'timed', duration: 35, effect: { resourceId: 'software', rateMultBonus: 5 } },
  serverOptimization: { id: 'serverOptimization', name: 'Server Optimization', description: 'Server farms reach peak efficiency — data floods in!', minEra: 3, type: 'instant', effect: { resourceId: 'data', amount: 55 } },

  // Era 4
  orbitalResonance: { id: 'orbitalResonance', name: 'Orbital Resonance', description: 'Orbital mechanics align perfectly — infrastructure booms!', minEra: 4, type: 'timed', duration: 40, effect: { resourceId: 'orbitalInfra', rateMultBonus: 5 } },
  deepSpaceSignal: { id: 'deepSpaceSignal', name: 'Deep Space Signal', description: 'A mysterious signal carries encoded research data!', minEra: 4, type: 'instant', effect: { resourceId: 'research', amount: 120 } },

  // Era 5
  jupiterSlingshot: { id: 'jupiterSlingshot', name: 'Jupiter Slingshot', description: 'A gravity assist around Jupiter yields enormous fuel savings!', minEra: 5, type: 'instant', effect: { resourceId: 'rocketFuel', amount: 200 } },
  colonyGoldenAge: { id: 'colonyGoldenAge', name: 'Colony Golden Age', description: 'Colonies enter a golden age — rapid expansion!', minEra: 5, type: 'timed', duration: 40, effect: { resourceId: 'colonies', rateMultBonus: 5 } },

  // Era 6
  darkEnergySpring: { id: 'darkEnergySpring', name: 'Dark Energy Spring', description: 'A natural dark energy spring erupts in your territory!', minEra: 6, type: 'instant', effect: { resourceId: 'darkEnergy', amount: 70 } },
  interstellarRush: { id: 'interstellarRush', name: 'Interstellar Rush', description: 'A gold rush mentality drives star system colonization!', minEra: 6, type: 'timed', duration: 45, effect: { resourceId: 'starSystems', rateMultBonus: 6 } },

  // Era 7
  forgeOvercharge: { id: 'forgeOvercharge', name: 'Forge Overcharge', description: 'All stellar forges overcharge simultaneously — massive output!', minEra: 7, type: 'timed', duration: 40, effect: { resourceId: 'stellarForge', rateMultBonus: 10 } },
  megastructureBlitz: { id: 'megastructureBlitz', name: 'Megastructure Blitz', description: 'A construction blitz completes megastructures ahead of schedule!', minEra: 7, type: 'instant', effect: { resourceId: 'megastructures', amount: 15 } },

  // Era 8
  galacticAlliance: { id: 'galacticAlliance', name: 'Galactic Alliance', description: 'A grand alliance forms — influence and exotic matter pour in!', minEra: 8, type: 'timed', duration: 50, effect: { resourceId: 'galacticInfluence', rateMultBonus: 8 } },
  exoticMatterGeyser2: { id: 'exoticMatterGeyser2', name: 'Exotic Matter Eruption', description: 'An exotic matter eruption floods your refineries!', minEra: 8, type: 'instant', effect: { resourceId: 'exoticMatter', amount: 120 } },

  // Era 9
  cosmicTremor: { id: 'cosmicTremor', name: 'Cosmic Tremor', description: 'A tremor in the fabric of space amplifies cosmic power!', minEra: 9, type: 'timed', duration: 50, effect: { resourceId: 'cosmicPower', rateMultBonus: 8 } },
  universalConstantShift: { id: 'universalConstantShift', name: 'Universal Constant Shift', description: 'Constants shift favorably — a windfall of knowledge!', minEra: 9, type: 'instant', effect: { resourceId: 'universalConstants', amount: 30 } },

  // Era 10
  realityCascade: { id: 'realityCascade', name: 'Reality Cascade', description: 'A cascade of collapsing realities yields unprecedented fragments!', minEra: 10, type: 'instant', effect: { resourceId: 'realityFragments', amount: 700 } },
  quantumFlood: { id: 'quantumFlood', name: 'Quantum Flood', description: 'A flood of quantum echoes from infinite parallel selves!', minEra: 10, type: 'timed', duration: 55, effect: { resourceId: 'quantumEchoes', rateMultBonus: 18 } },

  // --- 16 new events ---
  // Era 2
  ironRush: { id: 'ironRush', name: 'Iron Rush', description: 'Prospectors discover a massive iron deposit — steel production surges!', minEra: 2, type: 'timed', duration: 30, effect: { resourceId: 'steel', rateMultBonus: 5 } },
  inventorsFair: { id: 'inventorsFair', name: 'Inventors Fair', description: 'Brilliant minds gather and share ideas — electronics windfall!', minEra: 2, type: 'instant', effect: { resourceId: 'electronics', amount: 30 } },

  // Era 3
  aiAwakening: { id: 'aiAwakening', name: 'AI Awakening', description: 'An AI system achieves a new level of insight — research triples!', minEra: 3, type: 'timed', duration: 25, effect: { resourceId: 'research', rateMultBonus: 5 } },
  dataLake: { id: 'dataLake', name: 'Data Lake Overflow', description: 'Archived data lakes release stored information!', minEra: 3, type: 'instant', effect: { resourceId: 'data', amount: 40 } },

  // Era 4
  gravitationalSlingshot: { id: 'gravitationalSlingshot', name: 'Gravitational Slingshot', description: 'A perfect planetary alignment boosts fuel efficiency!', minEra: 4, type: 'timed', duration: 30, effect: { resourceId: 'rocketFuel', rateMultBonus: 6 } },
  spaceStationBoom: { id: 'spaceStationBoom', name: 'Space Station Boom', description: 'A new generation of space stations goes online!', minEra: 4, type: 'instant', effect: { resourceId: 'orbitalInfra', amount: 20 } },

  // Era 5
  exoplanetGoldmine: { id: 'exoplanetGoldmine', name: 'Exoplanet Goldmine', description: 'An exoplanet with extraordinary mineral wealth is discovered!', minEra: 5, type: 'instant', effect: { resourceId: 'exoticMaterials', amount: 80 } },

  // Era 6
  hyperlaneBreach: { id: 'hyperlaneBreach', name: 'Hyperlane Breach', description: 'A natural hyperlane opens — rapid star system colonization!', minEra: 6, type: 'timed', duration: 40, effect: { resourceId: 'starSystems', rateMultBonus: 6 } },

  // Era 7
  stellarRenaissance: { id: 'stellarRenaissance', name: 'Stellar Renaissance', description: 'A cultural renaissance in stellar engineering inspires breakthroughs!', minEra: 7, type: 'timed', duration: 45, effect: { resourceId: 'megastructures', rateMultBonus: 8 } },
  forgeHarmonic: { id: 'forgeHarmonic', name: 'Forge Harmonic', description: 'All stellar forges achieve harmonic resonance!', minEra: 7, type: 'instant', effect: { resourceId: 'stellarForge', amount: 25 } },

  // Era 8
  influenceTide: { id: 'influenceTide', name: 'Influence Tide', description: 'A tide of political goodwill sweeps the galaxy!', minEra: 8, type: 'instant', effect: { resourceId: 'galacticInfluence', amount: 200 } },
  exoticMatterStorm: { id: 'exoticMatterStorm', name: 'Exotic Matter Storm', description: 'A storm of exotic matter sweeps through your territory!', minEra: 8, type: 'timed', duration: 40, effect: { resourceId: 'exoticMatter', rateMultBonus: 6 } },

  // Era 9
  cosmicConvergence: { id: 'cosmicConvergence', name: 'Cosmic Convergence', description: 'Cosmic forces converge — universal constants multiply!', minEra: 9, type: 'timed', duration: 45, effect: { resourceId: 'universalConstants', rateMultBonus: 8 } },
  voidRipple: { id: 'voidRipple', name: 'Void Ripple', description: 'A ripple through the void yields a burst of cosmic power!', minEra: 9, type: 'instant', effect: { resourceId: 'cosmicPower', amount: 300 } },

  // Era 10
  realityBloom: { id: 'realityBloom', name: 'Reality Bloom', description: 'Realities bloom like flowers — fragments rain from everywhere!', minEra: 10, type: 'instant', effect: { resourceId: 'realityFragments', amount: 500 } },
  echoSymphony: { id: 'echoSymphony', name: 'Echo Symphony', description: 'Infinite echoes sing in harmony — quantum echoes amplified beyond measure!', minEra: 10, type: 'timed', duration: 50, effect: { resourceId: 'quantumEchoes', rateMultBonus: 15 } },
};

// Get events eligible for the current era
export function getEligibleEvents(era) {
  return Object.values(events).filter(e => era >= e.minEra);
}
