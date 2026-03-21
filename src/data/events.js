// Random events that can fire during tick (Era 3+)
// Each event: { id, name, description, minEra, type }
//   type: 'instant' — one-time resource grant
//   type: 'timed'   — temporary effect with a duration (seconds)

export const events = {
  // Era 1: Early discovery — hooks the player with a resource burst
  firstDiscovery: {
    id: 'firstDiscovery', name: 'Sealed Cache', minEra: 1, type: 'instant', chance: 0.15,
    description: 'While clearing rubble from the crash site, you find a sealed cache of supplies — someone left these here deliberately.',
    effects: [
      { type: 'resource', target: 'materials', value: 30 },
      { type: 'resource', target: 'food', value: 20 },
      { type: 'resource', target: 'energy', value: 15 },
    ],
    isLore: true,
  },
  // Era 3: Digital Age
  viralApp: {
    id: 'viralApp',
    name: 'Viral App',
    description: 'The code spreads through networks too fast — as if the infrastructure was designed to propagate exactly this pattern.',
    minEra: 3,
    type: 'instant',
    effect: { resourceId: 'data', amount: 30 },
  },
  openSource: {
    id: 'openSource',
    name: 'Open Source Contribution',
    description: 'Anonymous contributors submit code that references functions not yet written — open source from a future that has already shipped.',
    minEra: 3,
    type: 'timed',
    duration: 35,
    effect: { resourceId: 'software', rateMultBonus: 3 },
  },
  hackathon: {
    id: 'hackathon',
    name: 'Hackathon',
    description: 'Programmers work through the night and discover their solutions match code cached in precursor memory banks — debugging someone else\'s prophecy.',
    minEra: 3,
    type: 'instant',
    effect: { resourceId: 'software', amount: 20 },
  },

  // Era 4: Space Age
  solarFlare: {
    id: 'solarFlare',
    name: 'Solar Flare',
    description: 'The flare follows a pattern logged in precursor archives — predicted to the millisecond, thousands of years in advance.',
    minEra: 4,
    type: 'timed',
    duration: 30,
    effect: { resourceId: 'energy', rateMultBonus: 2 },
  },
  asteroidDiscovery: {
    id: 'asteroidDiscovery',
    name: 'Asteroid Discovery',
    description: 'The asteroid has been hollowed out and refilled with sorted minerals — a cache left by hands that knew exactly what you would need.',
    minEra: 4,
    type: 'instant',
    effect: { resourceId: 'exoticMaterials', amount: 50 },
  },
  alienSignal: {
    id: 'alienSignal',
    name: 'Alien Signal',
    description: 'The signal isn\'t alien — the carrier wave matches your ship\'s communication standard. The message is a research paper, dated forty thousand years from now.',
    minEra: 4,
    type: 'instant',
    effect: { resourceId: 'research', amount: 100 },
  },
  meteorShower: {
    id: 'meteorShower',
    name: 'Meteor Shower',
    description: 'The meteors fall in a pattern — concentric rings centered on the ruins. Each fragment contains refined alloys that shouldn\'t exist in nature.',
    minEra: 4,
    type: 'instant',
    effect: { resourceId: 'materials', amount: 200 },
  },
  researchBreakthrough: {
    id: 'researchBreakthrough',
    name: 'Research Breakthrough',
    description: 'A researcher falls asleep at her desk and wakes with the solution fully formed — equations she never learned, in handwriting that isn\'t hers.',
    minEra: 4,
    type: 'timed',
    duration: 45,
    effect: { resourceId: 'research', rateMultBonus: 2 },
  },

  // Era 5: Solar System
  cometCapture: {
    id: 'cometCapture',
    name: 'Comet Capture',
    description: 'The comet\'s trajectory was too perfect -- it fell directly into your fuel processors, as if aimed. The ice inside contained isotopes that don\'t occur naturally.',
    minEra: 5,
    type: 'instant',
    effect: { resourceId: 'rocketFuel', amount: 150 },
  },
  colonyPopSurge: {
    id: 'colonyPopSurge',
    name: 'Population Surge',
    description: 'Colony birth rates spike in sync across every settlement — as if responding to a signal no one consciously sent.',
    minEra: 5,
    type: 'timed',
    duration: 40,
    effect: { resourceId: 'colonies', rateMultBonus: 3 },
  },

  // Era 6: Interstellar / Dyson Era
  stellarHarvest: {
    id: 'stellarHarvest',
    name: 'Stellar Harvest',
    description: 'The star shudders and releases a cache of pre-refined metals from its corona. As if it had been storing them. As if it knew you were coming.',
    minEra: 7,
    type: 'timed',
    duration: 40,
    effect: { resourceId: 'stellarForge', rateMultBonus: 4 },
  },
  megastructureRuinDiscovery: {
    id: 'megastructureRuinDiscovery',
    name: 'Ruin Discovery',
    description: 'Engineers disassemble a ruin and find construction techniques preserved like a lesson left for them.',
    minEra: 7,
    type: 'instant',
    effect: { resourceId: 'megastructures', amount: 5 },
  },

  darkMatterSurge: {
    id: 'darkMatterSurge',
    name: 'Dark Matter Surge',
    description: 'A dark matter wavefront sweeps through your territory on a schedule that matches ancient timing logs found in the precursor archives.',
    minEra: 6,
    type: 'timed',
    duration: 45,
    effect: { resourceId: 'darkEnergy', rateMultBonus: 3 },
  },
  stellarNursery: {
    id: 'stellarNursery',
    name: 'Stellar Nursery',
    description: 'A stellar nursery blooms. Each newborn star has a planet with breathable air and tilled soil.',
    minEra: 6,
    type: 'instant',
    effect: { resourceId: 'starSystems', amount: 15 },
  },

  // Era 7: Dyson Era
  stellarForgeIgnition: {
    id: 'stellarForgeIgnition',
    name: 'Stellar Forge Ignition',
    description: 'The forge reaches a critical threshold your predecessors called "remembering" — stellar matter flows as if guided by instinct.',
    minEra: 7,
    type: 'timed',
    duration: 40,
    effect: { resourceId: 'stellarForge', rateMultBonus: 4 },
  },
  megastructureBreakthrough: {
    id: 'megastructureBreakthrough',
    name: 'Megastructure Breakthrough',
    description: 'Engineers find the answer in a dream — the same dream, reported independently by twelve teams on different worlds.',
    minEra: 7,
    type: 'instant',
    effect: { resourceId: 'megastructures', amount: 5 },
  },

  // Era 8: Galactic
  cosmicWindfall: {
    id: 'cosmicWindfall',
    name: 'Cosmic Windfall',
    description: 'A rift tears open in exactly the coordinates predicted by a ruin inscription dated to the previous cycle. Exotic matter pours through like an offering.',
    minEra: 8,
    type: 'instant',
    effect: { resourceId: 'exoticMatter', amount: 75 },
  },
  diplomaticVictory: {
    id: 'diplomaticVictory',
    name: 'Diplomatic Victory',
    description: 'Your diplomats arrive to find the sector already flying flags that bear your insignia. They have been expecting you for centuries.',
    minEra: 8,
    type: 'timed',
    duration: 60,
    effect: { resourceId: 'galacticInfluence', rateMultBonus: 5 },
  },

  // Era 9: Intergalactic
  voidEcho: {
    id: 'voidEcho',
    name: 'Void Echo',
    description: 'A resonance hums from the intergalactic void -- a harmonic that matches the frequency of your civilization\'s power grid exactly. The void remembers you.',
    minEra: 9,
    type: 'timed',
    duration: 50,
    effect: { resourceId: 'cosmicPower', rateMultBonus: 4 },
  },
  universalFlux: {
    id: 'universalFlux',
    name: 'Universal Flux',
    description: 'The constants shift to values that favor your technology — as if the universe is tuning itself to your specifications.',
    minEra: 9,
    type: 'instant',
    effect: { resourceId: 'universalConstants', amount: 30 },
  },

  // Era 10: Multiverse
  realityStorm: {
    id: 'realityStorm',
    name: 'Reality Storm',
    description: 'Realities collide and scatter fragments of themselves — each piece a memory from a version of you that chose differently.',
    minEra: 10,
    type: 'instant',
    effect: { resourceId: 'realityFragments', amount: 100 },
  },
  quantumResonance: {
    id: 'quantumResonance',
    name: 'Quantum Resonance',
    description: 'Parallel selves reach the same conclusion simultaneously — a billion minds think one thought, and the echoes multiply.',
    minEra: 10,
    type: 'timed',
    duration: 60,
    effect: { resourceId: 'quantumEchoes', rateMultBonus: 5 },
  },
  // Additional events for variety
  goldenAge: {
    id: 'goldenAge',
    name: 'Golden Age',
    description: 'Prosperity arrives on schedule — the old calendars marked this season as \'the flowering\' in every cycle.',
    minEra: 2,
    type: 'timed',
    duration: 45,
    effect: { resourceId: 'food', rateMultBonus: 5 },
  },
  breakthroughResearch: {
    id: 'breakthroughResearch',
    name: 'Breakthrough Research',
    description: 'Researchers find their breakthrough on a page already bookmarked — the answer was waiting for the question.',
    minEra: 2,
    type: 'timed',
    duration: 30,
    effect: { resourceId: 'steel', rateMultBonus: 4 },
  },
  materialWindfall: {
    id: 'materialWindfall',
    name: 'Material Windfall',
    description: 'Miners break through into a vein too pure to be natural — refined and waiting, like a pantry stocked before the guests arrive.',
    minEra: 2,
    type: 'instant',
    effect: { resourceId: 'materials', amount: 50 },
  },
  energySurge: {
    id: 'energySurge',
    name: 'Energy Surge',
    description: 'The grid hums at a frequency that matches precursor power signatures — old conduits waking up.',
    minEra: 2,
    type: 'timed',
    duration: 25,
    effect: { resourceId: 'energy', rateMultBonus: 3 },
  },
  solarStorm: {
    id: 'solarStorm',
    name: 'Solar Storm',
    description: 'The storm follows a schedule found in the precursor almanac — electromagnetic seasons that repeat every thousand years, to the hour.',
    minEra: 4,
    type: 'instant',
    effect: { resourceId: 'energy', amount: 200 },
  },
  colonyBoom: {
    id: 'colonyBoom',
    name: 'Colony Boom',
    description: 'Birth rates spike in unison across colonies that have never communicated — as if responding to a signal encoded in the precursor genetics.',
    minEra: 5,
    type: 'timed',
    duration: 40,
    effect: { resourceId: 'colonies', rateMultBonus: 3 },
  },
  alienArtifact: {
    id: 'alienArtifact',
    name: 'Alien Artifact',
    description: 'The artifact bears your civilization\'s insignia — carved before your civilization existed. Inside: exotic materials, sorted and labeled.',
    minEra: 5,
    type: 'instant',
    effect: { resourceId: 'exoticMaterials', amount: 50 },
  },
  cosmicWind: {
    id: 'cosmicWind',
    name: 'Cosmic Wind',
    description: 'The winds blow from the void between galaxies, carrying particles arranged in patterns that spell out coordinates — directions to something that wants to be found.',
    minEra: 6,
    type: 'timed',
    duration: 40,
    effect: { resourceId: 'darkEnergy', rateMultBonus: 4 },
  },
  cosmicHarvest: {
    id: 'cosmicHarvest',
    name: 'Cosmic Harvest',
    description: 'The harvest arrives on schedule — cosmic radiation peaking at exactly the wavelength your collectors were tuned to, by hands that built them a cycle ago.',
    minEra: 9,
    type: 'timed',
    duration: 50,
    effect: { resourceId: 'cosmicPower', rateMultBonus: 4 },
  },
  realityGlitch: {
    id: 'realityGlitch',
    name: 'Reality Glitch',
    description: 'Reality stutters like a scratched record — and in the skip, you glimpse the machinery underneath. The constants were set by hand.',
    minEra: 9,
    type: 'instant',
    effect: { resourceId: 'universalConstants', amount: 15 },
  },
  dimensionalOverlap: {
    id: 'dimensionalOverlap',
    name: 'Dimensional Overlap',
    description: 'For thirty seconds, you can see through the walls of reality into the next version over. They are looking back. They wave.',
    minEra: 10,
    type: 'timed',
    duration: 45,
    effect: { resourceId: 'quantumEchoes', rateMultBonus: 8 },
  },
  multiversalTrade: {
    id: 'multiversalTrade',
    name: 'Multiversal Trade',
    description: 'Trade routes open between versions of you — each one sends what the other needs, with invoices dated to a future that has already been invoiced.',
    minEra: 10,
    type: 'instant',
    effect: { resourceId: 'realityFragments', amount: 200 },
  },
  // New events
  volcanicEruption: {
    id: 'volcanicEruption',
    name: 'Volcanic Eruption',
    description: 'The eruption follows fault lines that radiate from the central ruin — as if the volcano was designed to reveal what lies beneath.',
    minEra: 2,
    type: 'instant',
    effect: { resourceId: 'materials', amount: 60 },
  },
  tradeCaravan: {
    id: 'tradeCaravan',
    name: 'Trade Caravan',
    description: 'Traders arrive following roads that were buried until today — the paths rose to the surface on schedule.',
    minEra: 2,
    type: 'instant',
    effect: { resourceId: 'food', amount: 40 },
  },
  dataMigration: {
    id: 'dataMigration',
    name: 'Data Migration',
    description: 'The legacy systems don\'t need modernizing — they were always modern. The old code runs on hardware that hasn\'t been invented yet.',
    minEra: 3,
    type: 'timed',
    duration: 30,
    effect: { resourceId: 'software', rateMultBonus: 5 },
  },
  orbitalDebrisField: {
    id: 'orbitalDebrisField',
    name: 'Orbital Debris Field',
    description: 'The debris is too well-organized to be wreckage — components sorted by function, drifting in formation, waiting to be collected by the next crew.',
    minEra: 4,
    type: 'instant',
    effect: { resourceId: 'orbitalInfra', amount: 35 },
  },
  ionStorm: {
    id: 'ionStorm',
    name: 'Ion Storm',
    description: 'The ion storm traces the exact trajectory of your fuel supply lines — a coincidence, or a delivery route carved into the magnetosphere long ago.',
    minEra: 5,
    type: 'timed',
    duration: 35,
    effect: { resourceId: 'rocketFuel', rateMultBonus: 5 },
  },
  nebulaBurst: {
    id: 'nebulaBurst',
    name: 'Nebula Burst',
    description: 'The nebula doesn\'t explode — it opens, like a flower on a timer, releasing materials that were sealed inside before the star that made it died.',
    minEra: 5,
    type: 'instant',
    effect: { resourceId: 'exoticMaterials', amount: 60 },
  },
  warpFieldAnomaly: {
    id: 'warpFieldAnomaly',
    name: 'Warp Field Anomaly',
    description: 'The anomaly peels back a layer of spacetime like old wallpaper — behind it, star systems that were hidden on purpose, waiting to be found on schedule.',
    minEra: 6,
    type: 'instant',
    effect: { resourceId: 'starSystems', amount: 10 },
  },
  forgeResonance: {
    id: 'forgeResonance',
    name: 'Forge Resonance',
    description: 'The forges vibrate in sync across light-years — a chord struck by a hand that reached across time. The resonance builds megastructures from memory.',
    minEra: 7,
    type: 'timed',
    duration: 40,
    effect: { resourceId: 'megastructures', rateMultBonus: 6 },
  },
  exoticMatterGeyser: {
    id: 'exoticMatterGeyser',
    name: 'Exotic Matter Geyser',
    description: 'The collapsed star coughs up matter it swallowed eons ago — refined, sorted, and pressurized. Stars do not refine. Something inside the star did.',
    minEra: 8,
    type: 'instant',
    effect: { resourceId: 'exoticMatter', amount: 60 },
  },
  constantShift: {
    id: 'constantShift',
    name: 'Constant Shift',
    description: 'The constants shift to values that make your technology more efficient — as if reality is adjusting its settings to accommodate you. It has done this before.',
    minEra: 9,
    type: 'timed',
    duration: 45,
    effect: { resourceId: 'universalConstants', rateMultBonus: 6 },
  },
  echoConvergence: {
    id: 'echoConvergence',
    name: 'Echo Convergence',
    description: 'Every version of you reaches the same breakthrough simultaneously. The convergence feels less like coincidence and more like choreography.',
    minEra: 10,
    type: 'timed',
    duration: 50,
    effect: { resourceId: 'quantumEchoes', rateMultBonus: 10 },
  },
  multiversalCollision: {
    id: 'multiversalCollision',
    name: 'Multiversal Collision',
    description: 'Two realities collide at the seam where you made different choices — the collision scatters fragments of both, and neither version remembers which was real.',
    minEra: 10,
    type: 'instant',
    effect: { resourceId: 'realityFragments', amount: 300 },
  },
  temporalAnomaly: {
    id: 'temporalAnomaly',
    name: 'Temporal Anomaly',
    description: 'Time dilates around the megastructures — the ruins at their core are older than the universe, and they bend time like a memory bends truth.',
    minEra: 7,
    type: 'timed',
    duration: 30,
    effect: { resourceId: 'megastructures', rateMultBonus: 5 },
  },
  darkEnergyCascade: {
    id: 'darkEnergyCascade',
    name: 'Dark Energy Cascade',
    description: 'Dark energy pours from a wound in spacetime that was sutured shut by the last civilization — the stitches just came loose.',
    minEra: 6,
    type: 'instant',
    effect: { resourceId: 'darkEnergy', amount: 50 },
  },
  rocketBoost: {
    id: 'rocketBoost',
    name: 'Rocket Boost',
    description: 'The optimal fuel mixture was scratched into the inside of a thruster cone — instructions from a dead engineer to a living one they would never meet.',
    minEra: 4,
    type: 'timed',
    duration: 35,
    effect: { resourceId: 'rocketFuel', rateMultBonus: 4 },
  },
  dataBreeze: {
    id: 'dataBreeze',
    name: 'Data Breeze',
    description: 'Data floods in from servers that were never switched on — cached responses to questions you haven\'t asked yet, from a network that remembers the future.',
    minEra: 3,
    type: 'timed',
    duration: 30,
    effect: { resourceId: 'data', rateMultBonus: 4 },
  },
  exoticDiscovery: {
    id: 'exoticDiscovery',
    name: 'Exotic Discovery',
    description: 'The cache was buried at exactly the depth your drills can reach — deeper caches exist, sealed with warnings addressed to civilizations that haven\'t evolved yet.',
    minEra: 5,
    type: 'instant',
    effect: { resourceId: 'exoticMaterials', amount: 40 },
  },
  influenceSurge: {
    id: 'influenceSurge',
    name: 'Influence Surge',
    description: 'Your influence spreads through networks that were already configured to amplify your signal — as if the galaxy was a megaphone built for your voice.',
    minEra: 8,
    type: 'timed',
    duration: 45,
    effect: { resourceId: 'galacticInfluence', rateMultBonus: 4 },
  },
  laborRevolution: {
    id: 'laborRevolution',
    name: 'Labor Revolution',
    description: 'Workers adopt techniques none of them learned — hands moving in practiced unison, building with efficiency inherited from lives they don\'t remember.',
    minEra: 2,
    type: 'timed',
    duration: 35,
    effect: { resourceId: 'labor', rateMultBonus: 3 },
  },
  orbitalCache: {
    id: 'orbitalCache',
    name: 'Orbital Cache',
    description: 'The cache was in a decaying orbit — timed to arrive at exactly this point in your civilization\'s development. The packaging says "Just in time."',
    minEra: 4,
    type: 'instant',
    effect: { resourceId: 'orbitalInfra', amount: 30 },
  },
  galacticConference: {
    id: 'galacticConference',
    name: 'Galactic Conference',
    description: 'The delegates arrive with histories that mention you by name — their archives describe this conference, its agenda, and its outcome. The minutes were written in advance.',
    minEra: 8,
    type: 'instant',
    effect: { resourceId: 'galacticInfluence', amount: 100 },
  },
  stellarAlchemy: {
    id: 'stellarAlchemy',
    name: 'Stellar Alchemy',
    description: 'The stars transmute elements in sequences that match alchemical formulas found in the oldest ruins — stellar fusion following a recipe.',
    minEra: 7,
    type: 'timed',
    duration: 35,
    effect: { resourceId: 'stellarForge', rateMultBonus: 5 },
  },
  cosmicRenewal: {
    id: 'cosmicRenewal',
    name: 'Cosmic Renewal',
    description: 'The universe regenerates along fault lines left by the previous cycle\'s collapse — healing itself from a wound it has healed a thousand times before.',
    minEra: 9,
    type: 'instant',
    effect: { resourceId: 'cosmicPower', amount: 150 },
  },
  realityEcho: {
    id: 'realityEcho',
    name: 'Reality Echo',
    description: 'An echo arrives from a reality where you already finished — the constants they discovered are identical to the ones you are about to find.',
    minEra: 9,
    type: 'timed',
    duration: 40,
    effect: { resourceId: 'universalConstants', rateMultBonus: 5 },
  },
  foodFestival: {
    id: 'foodFestival',
    name: 'Food Festival',
    description: 'The harvest follows a calendar carved into the oldest standing wall — feast days that repeat across every cycle, as if the earth was trained.',
    minEra: 2,
    type: 'timed',
    duration: 25,
    effect: { resourceId: 'food', rateMultBonus: 3 },
  },
  electronicsBoom: {
    id: 'electronicsBoom',
    name: 'Electronics Boom',
    description: 'Consumers independently design the same device — a gadget found in precursor ruins, reinvented from genetic memory across a hundred workshops.',
    minEra: 3,
    type: 'timed',
    duration: 30,
    effect: { resourceId: 'electronics', rateMultBonus: 3 },
  },
  softwareRevolution: {
    id: 'softwareRevolution',
    name: 'Software Revolution',
    description: 'The paradigm shift feels less like invention and more like recovery — engineers rediscovering techniques from the precursor codebase, function by function.',
    minEra: 3,
    type: 'timed',
    duration: 35,
    effect: { resourceId: 'software', rateMultBonus: 4 },
  },
  materialsBonanza: {
    id: 'materialsBonanza',
    name: 'Materials Bonanza',
    description: 'Excavators break through into a sealed cavern packed with pre-sorted ore — stacked in bins, labeled in a script no one can read. Someone stockpiled this.',
    minEra: 2,
    type: 'instant',
    effect: { resourceId: 'materials', amount: 80 },
  },
  colonyExpansion: {
    id: 'colonyExpansion',
    name: 'Colony Expansion',
    description: 'Colonists report finding their own names carved into doorframes at each new settlement — a welcome from inhabitants who knew who was coming.',
    minEra: 5,
    type: 'timed',
    duration: 35,
    effect: { resourceId: 'colonies', rateMultBonus: 5 },
  },
  laborShortage: {
    id: 'laborShortage',
    name: 'Labor Shortage Resolved',
    description: 'The new workers arrive with skills no one taught them — hands that know the tools, eyes that read the blueprints, from lives they never lived.',
    minEra: 2,
    type: 'instant',
    effect: { resourceId: 'labor', amount: 30 },
  },
  starSystemDiscovery: {
    id: 'starSystemDiscovery',
    name: 'Star System Discovery',
    description: 'The star systems were always there — cloaked behind a field that deactivated on a timer set by the last civilization to use them.',
    minEra: 6,
    type: 'instant',
    effect: { resourceId: 'starSystems', amount: 8 },
  },
  exoticMatterVein: {
    id: 'exoticMatterVein',
    name: 'Exotic Matter Vein',
    description: 'The vein runs through a region of space that pulses with residual heat — the exhaust trail of something that passed through here, leaving gifts in its wake.',
    minEra: 8,
    type: 'timed',
    duration: 45,
    effect: { resourceId: 'exoticMatter', rateMultBonus: 5 },
  },
  megastructureInspiration: {
    id: 'megastructureInspiration',
    name: 'Megastructure Inspiration',
    description: 'Twelve engineering teams on different worlds independently sketch the same blueprint — a megastructure design dreamed by minds that share a forgotten memory.',
    minEra: 7,
    type: 'instant',
    effect: { resourceId: 'megastructures', amount: 8 },
  },
  cosmicAlchemy: {
    id: 'cosmicAlchemy',
    name: 'Cosmic Alchemy',
    description: 'Elements transmute along pathways that trace the ruins\' deepest carvings — alchemy that works because the cosmos was designed to allow it.',
    minEra: 9,
    type: 'instant',
    effect: { resourceId: 'cosmicPower', amount: 200 },
  },
  quantumFluctuation: {
    id: 'quantumFluctuation',
    name: 'Quantum Fluctuation',
    description: 'Quantum echoes crystallize from the vacuum — not from nothing, but from the residue of decisions made by parallel selves who chose differently and shattered.',
    minEra: 10,
    type: 'instant',
    effect: { resourceId: 'quantumEchoes', amount: 150 },
  },
  electricalStorm: {
    id: 'electricalStorm',
    name: 'Electrical Storm',
    description: 'Lightning follows fault lines that radiate from the central ruin — as if the storm is a circuit and the ruins are its ground.',
    minEra: 2,
    type: 'instant',
    effect: { resourceId: 'energy', amount: 40 },
  },
  innovationWave: {
    id: 'innovationWave',
    name: 'Innovation Wave',
    description: 'Innovation sweeps through workshops in sync — a thousand inventors reaching the same solution at the same moment, guided by instinct older than industry.',
    minEra: 3,
    type: 'timed',
    duration: 30,
    effect: { resourceId: 'electronics', rateMultBonus: 4 },
  },
  supernova: {
    id: 'supernova',
    name: 'Supernova',
    description: 'The supernova detonates on schedule — the precursor star charts marked it with a date and a note: "Collect the iron."',
    minEra: 7,
    type: 'instant',
    effect: { resourceId: 'stellarForge', amount: 20 },
  },
  cosmicInspiration: {
    id: 'cosmicInspiration',
    name: 'Cosmic Inspiration',
    description: 'Scientists stare into the void and see patterns — not in the stars, but in the spaces between them. The gaps spell out equations.',
    minEra: 5,
    type: 'timed',
    duration: 40,
    effect: { resourceId: 'research', rateMultBonus: 5 },
  },
  darkEnergyWell: {
    id: 'darkEnergyWell',
    name: 'Dark Energy Well',
    description: 'The well was capped by the last civilization — a cork of neutronium that dissolved on a timer. What pours out has been aging for a billion years.',
    minEra: 6,
    type: 'timed',
    duration: 45,
    effect: { resourceId: 'darkEnergy', rateMultBonus: 5 },
  },
  quantumBreakthrough: {
    id: 'quantumBreakthrough',
    name: 'Quantum Breakthrough',
    description: 'The breakthrough was inevitable — the quantum state your processors collapsed into was the only stable configuration, designed by the universe\'s initial conditions.',
    minEra: 3,
    type: 'timed',
    duration: 30,
    effect: { resourceId: 'research', rateMultBonus: 4 },
  },
  stellarForgeOverdrive: {
    id: 'stellarForgeOverdrive',
    name: 'Stellar Forge Overdrive',
    description: 'The forge remembers a rhythm from before — its core oscillates at frequencies that match the precursor power signatures, running hotter than physics allows.',
    minEra: 7,
    type: 'timed',
    duration: 35,
    effect: { resourceId: 'stellarForge', rateMultBonus: 6 },
  },
  cosmicAlignment: {
    id: 'cosmicAlignment',
    name: 'Cosmic Alignment',
    description: 'The galaxies align along an axis that matches the precursor cosmological constant — a geometry of power, repeating every cycle like clockwork made of light.',
    minEra: 9,
    type: 'timed',
    duration: 50,
    effect: { resourceId: 'cosmicPower', rateMultBonus: 6 },
  },
  realityWave: {
    id: 'realityWave',
    name: 'Reality Wave',
    description: 'A wave of unfiltered reality washes through the barriers between worlds — carrying fragments of lives you lived and forgot, crystallizing into something tangible.',
    minEra: 10,
    type: 'timed',
    duration: 40,
    effect: { resourceId: 'realityFragments', rateMultBonus: 10 },
  },
  resourceSurge: {
    id: 'resourceSurge',
    name: 'Resource Surge',
    description: 'Every furnace burns hotter, every mill spins faster — the machinery responds to a harmonic that radiates from the central ruin, as if the planet itself is helping.',
    minEra: 2,
    type: 'instant',
    effect: { resourceId: 'steel', amount: 30 },
  },
  exoticMatterRain: {
    id: 'exoticMatterRain',
    name: 'Exotic Matter Rain',
    description: 'A parallel dimension collapses and its debris rains into yours — exotic matter from a reality where you already failed, recycled into fuel for this attempt.',
    minEra: 8,
    type: 'instant',
    effect: { resourceId: 'exoticMatter', amount: 100 },
  },
  steelBoom: {
    id: 'steelBoom',
    name: 'Steel Boom',
    description: 'The ore deposits surface along fracture lines that trace the outline of buried structures — the ruins are shedding their skin, revealing steel underneath.',
    minEra: 2,
    type: 'timed',
    duration: 30,
    effect: { resourceId: 'steel', rateMultBonus: 5 },
  },
  researchGrant: {
    id: 'researchGrant',
    name: 'Research Grant',
    description: 'The funding arrives from an account that predates your government — a trust established by the precursor administration, releasing on a schedule that matches your need.',
    minEra: 3,
    type: 'timed',
    duration: 40,
    effect: { resourceId: 'research', rateMultBonus: 3 },
  },
  cometImpact: {
    id: 'cometImpact',
    name: 'Comet Impact',
    description: 'The comet\'s trajectory was too precise to be natural. It delivered its payload of exotic minerals to exactly the right coordinates — as if answering a requisition filed millennia ago.',
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
  apprenticeGuild: { id: 'apprenticeGuild', name: 'Apprentice Guild', description: 'The apprentices work with inherited instinct — their hands shaping metal in patterns taught by teachers who died a cycle ago.', minEra: 2, type: 'timed', duration: 30, effect: { resourceId: 'labor', rateMultBonus: 5 } },
  coalDiscovery: { id: 'coalDiscovery', name: 'Coal Discovery', description: 'A massive coal deposit is discovered — energy reserves soar!', minEra: 2, type: 'instant', effect: { resourceId: 'energy', amount: 60 } },

  // Era 3
  cryptoMiningBoom: { id: 'cryptoMiningBoom', name: 'Crypto Mining Boom', description: 'A crypto boom drives electronics and data production!', minEra: 3, type: 'timed', duration: 35, effect: { resourceId: 'electronics', rateMultBonus: 5 } },
  openDataInitiative: { id: 'openDataInitiative', name: 'Open Data Initiative', description: 'The released datasets contain entries dated before the government existed — records from an administration that governed this world in a previous age.', minEra: 3, type: 'instant', effect: { resourceId: 'data', amount: 50 } },

  // Era 4
  titanExpedition: { id: 'titanExpedition', name: 'Titan Expedition', description: 'An expedition to Titan uncovers exotic fuel reserves!', minEra: 4, type: 'instant', effect: { resourceId: 'rocketFuel', amount: 150 } },
  solarWindSurge: { id: 'solarWindSurge', name: 'Solar Wind Surge', description: 'Intense solar winds supercharge orbital infrastructure!', minEra: 4, type: 'timed', duration: 35, effect: { resourceId: 'orbitalInfra', rateMultBonus: 5 } },

  // Era 5
  iceGiantMining: { id: 'iceGiantMining', name: 'Ice Giant Mining', description: 'Mining operations on Uranus yield exotic materials!', minEra: 5, type: 'instant', effect: { resourceId: 'exoticMaterials', amount: 70 } },
  gravityLensing: { id: 'gravityLensing', name: 'Gravity Lensing', description: 'Gravitational lensing reveals hidden colonies!', minEra: 5, type: 'timed', duration: 40, effect: { resourceId: 'colonies', rateMultBonus: 4 } },

  // Era 6
  stellarNova: { id: 'stellarNova', name: 'Stellar Nova', description: 'The nova detonates on schedule — the precursor timing logs predicted it to the hour. Dark energy washes over your collectors like a gift.', minEra: 6, type: 'instant', effect: { resourceId: 'darkEnergy', amount: 60 } },
  firstContactProtocol: { id: 'firstContactProtocol', name: 'First Contact Protocol', description: 'The aliens already know your name. Their contact protocols reference your species by a designation older than either civilization.', minEra: 6, type: 'timed', duration: 45, effect: { resourceId: 'galacticInfluence', rateMultBonus: 4 } },

  // Era 7
  stellarQuake: { id: 'stellarQuake', name: 'Stellar Quake', description: 'The quake follows fault lines mapped in precursor geology — it shakes free construction materials cached in the star\'s mantle eons ago.', minEra: 7, type: 'instant', effect: { resourceId: 'megastructures', amount: 10 } },
  dysonFlare: { id: 'dysonFlare', name: 'Dyson Flare', description: 'The sphere vents plasma in a pattern your engineers recognize — the same emergency protocol, from the same star, from a previous cycle.', minEra: 7, type: 'timed', duration: 40, effect: { resourceId: 'stellarForge', rateMultBonus: 8 } },

  // Era 8
  galacticRenaissance: { id: 'galacticRenaissance', name: 'Galactic Renaissance', description: 'A cultural renaissance sweeps the galaxy — art and philosophy from a thousand species, all converging on the same conclusion.', minEra: 8, type: 'timed', duration: 50, effect: { resourceId: 'galacticInfluence', rateMultBonus: 7 } },
  exoticMatterCascade: { id: 'exoticMatterCascade', name: 'Exotic Matter Cascade', description: 'The cascade follows a reaction path described in the Convergence Codex — matter converting itself, guided by equations older than the galaxy.', minEra: 8, type: 'instant', effect: { resourceId: 'exoticMatter', amount: 100 } },

  // Era 9
  cosmicDawn: { id: 'cosmicDawn', name: 'Cosmic Dawn', description: 'A new epoch begins — the same epoch that has begun before, on the same schedule, in the same way. The cosmos does not improvise.', minEra: 9, type: 'timed', duration: 55, effect: { resourceId: 'cosmicPower', rateMultBonus: 7 } },

  // Era 10
  omniversalBloom: { id: 'omniversalBloom', name: 'Omniversal Bloom', description: 'All realities bloom simultaneously — reality fragments rain down!', minEra: 10, type: 'instant', effect: { resourceId: 'realityFragments', amount: 500 } },

  // --- 16 new events ---

  // Era 2
  inventorsGathering: { id: 'inventorsGathering', name: 'Inventors Gathering', description: 'Brilliant minds gather — electronics production accelerated!', minEra: 2, type: 'timed', duration: 30, effect: { resourceId: 'electronics', rateMultBonus: 4 } },
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
  voidWhisper: { id: 'voidWhisper', name: 'Void Whisper', description: 'The void between galaxies carries a message encoded in gravitational waves — universal constants, expressed as coordinates to what comes next.', minEra: 9, type: 'instant', effect: { resourceId: 'universalConstants', amount: 20 } },
  intergalacticMigration: { id: 'intergalacticMigration', name: 'Intergalactic Migration', description: 'Migrants arrive from galaxies you haven\'t contacted — they carry technology identical to yours, developed independently but inevitably.', minEra: 9, type: 'timed', duration: 50, effect: { resourceId: 'cosmicPower', rateMultBonus: 8 } },

  // Era 10
  realityFracture: { id: 'realityFracture', name: 'Reality Fracture', description: 'Reality cracks along a fault line that matches your timeline exactly — echoes of parallel selves spill through the gap, whispering solutions.', minEra: 10, type: 'instant', effect: { resourceId: 'quantumEchoes', amount: 150 } },
  omniversalHarvest: { id: 'omniversalHarvest', name: 'Omniversal Harvest', description: 'Every version of you reaches the same milestone simultaneously — reality fragments cascade across the multiverse like dominoes.', minEra: 10, type: 'timed', duration: 55, effect: { resourceId: 'realityFragments', rateMultBonus: 15 } },

  // --- 18 new events ---

  // Era 2
  guildMasterwork: { id: 'guildMasterwork', name: 'Guild Masterwork', description: 'The masterwork matches a design found sealed in the deepest ruin — the artisan swears she invented it, but her hands knew the shape before she did.', minEra: 2, type: 'timed', duration: 30, effect: { resourceId: 'steel', rateMultBonus: 6 } },
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
  alienLibrary: { id: 'alienLibrary', name: 'Alien Library', description: 'The library\'s catalog system matches your own filing conventions. Every book is written in a language you almost understand. The dedication pages all say the same thing.', minEra: 6, type: 'timed', duration: 45, effect: { resourceId: 'research', rateMultBonus: 6 } },
  wormholeCollapse: { id: 'wormholeCollapse', name: 'Wormhole Collapse', description: 'A collapsing wormhole showers the area with dark energy!', minEra: 6, type: 'instant', effect: { resourceId: 'darkEnergy', amount: 80 } },

  // Era 7
  stellarFusion: { id: 'stellarFusion', name: 'Stellar Fusion Event', description: 'Two stars merge — stellar forge output goes critical!', minEra: 7, type: 'timed', duration: 45, effect: { resourceId: 'stellarForge', rateMultBonus: 9 } },
  megastructureCache: { id: 'megastructureCache', name: 'Megastructure Cache', description: 'Ancient megastructure blueprints accelerate construction!', minEra: 7, type: 'instant', effect: { resourceId: 'megastructures', amount: 12 } },

  // Era 8
  darkMatterResonance: { id: 'darkMatterResonance', name: 'Dark Matter Resonance', description: 'Dark matter filaments vibrate at a frequency that matches your exotic matter refineries — tuned by a previous civilization to this exact harmonic.', minEra: 8, type: 'timed', duration: 50, effect: { resourceId: 'exoticMatter', rateMultBonus: 8 } },
  galacticUnification: { id: 'galacticUnification', name: 'Galactic Unification', description: 'A billion species sign the same treaty — word for word, clause for clause, as if they all read the same draft written before any of them existed.', minEra: 8, type: 'instant', effect: { resourceId: 'galacticInfluence', amount: 200 } },

  // Era 9
  cosmicEpiphany: { id: 'cosmicEpiphany', name: 'Cosmic Epiphany', description: 'A moment of clarity — the constants were never random. They are coordinates, and you are standing at the destination.', minEra: 9, type: 'instant', effect: { resourceId: 'universalConstants', amount: 25 } },
  voidResonanceCascade: { id: 'voidResonanceCascade', name: 'Void Resonance Cascade', description: 'The void between superclusters hums at the frequency of your power grid — a sympathetic resonance spanning billions of light-years.', minEra: 9, type: 'timed', duration: 50, effect: { resourceId: 'cosmicPower', rateMultBonus: 9 } },

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
  gravityLensOrbital: { id: 'gravityLensOrbital', name: 'Gravity Lens Discovery', description: 'A gravitational lens reveals hidden orbital paths!', minEra: 4, type: 'instant', effect: { resourceId: 'orbitalInfra', amount: 20 } },

  // Era 5
  sustainedFusion: { id: 'sustainedFusion', name: 'Sustained Fusion', description: 'Sustained fusion reaction achieved — energy output explodes!', minEra: 5, type: 'timed', duration: 40, effect: { resourceId: 'energy', rateMultBonus: 6 } },
  exoplanetDiscovery: { id: 'exoplanetDiscovery', name: 'Exoplanet Discovery', description: 'A habitable exoplanet discovered — colony rush!', minEra: 5, type: 'instant', effect: { resourceId: 'colonies', amount: 8 } },

  // Era 6
  interstellarWindfall: { id: 'interstellarWindfall', name: 'Interstellar Windfall', description: 'An interstellar trade convoy arrives with exotic goods!', minEra: 6, type: 'instant', effect: { resourceId: 'exoticMaterials', amount: 80 } },
  galacticTide: { id: 'galacticTide', name: 'Galactic Tide', description: 'Gravitational tides push new star systems into range!', minEra: 6, type: 'timed', duration: 35, effect: { resourceId: 'starSystems', rateMultBonus: 5 } },

  // Era 7
  stellarCollapse: { id: 'stellarCollapse', name: 'Stellar Collapse', description: 'A collapsing star feeds the forge — output skyrockets!', minEra: 7, type: 'timed', duration: 35, effect: { resourceId: 'stellarForge', rateMultBonus: 6 } },

  // Era 8
  diplomaticSummit: { id: 'diplomaticSummit', name: 'Diplomatic Summit', description: 'The summit agenda was already drafted — in your language, by delegates who died millennia ago. Every motion passes unanimously.', minEra: 8, type: 'instant', effect: { resourceId: 'galacticInfluence', amount: 150 } },
  darkMatterTide: { id: 'darkMatterTide', name: 'Dark Matter Tide', description: 'A tide of dark matter washes through your sector!', minEra: 8, type: 'timed', duration: 50, effect: { resourceId: 'exoticMatter', rateMultBonus: 6 } },

  // Era 9
  voidMurmur: { id: 'voidMurmur', name: 'Void Murmur', description: 'Deep murmurs from the void crystallize into universal constants!', minEra: 9, type: 'instant', effect: { resourceId: 'universalConstants', amount: 25 } },

  // Era 10
  paradoxWave: { id: 'paradoxWave', name: 'Paradox Wave', description: 'A wave of paradoxes resolves into pure quantum echoes!', minEra: 10, type: 'instant', effect: { resourceId: 'quantumEchoes', amount: 80 } },
  realityShatter: { id: 'realityShatter', name: 'Reality Shatter', description: 'Reality shatters and reforms — fragments rain down!', minEra: 10, type: 'timed', duration: 45, effect: { resourceId: 'realityFragments', rateMultBonus: 12 } },

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
  firstContact: { id: 'firstContact', name: 'First Contact', description: 'The aliens greet you by name. Their oldest records describe your arrival with the certainty of prophecy — because it has happened before.', minEra: 6, type: 'instant', effect: { resourceId: 'galacticInfluence', amount: 80 } },
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
  oreStrike: { id: 'oreStrike', name: 'Ore Strike', description: 'Miners strike a massive ore deposit — steel production surges!', minEra: 2, type: 'timed', duration: 30, effect: { resourceId: 'steel', rateMultBonus: 5 } },
  tinkerersFair: { id: 'tinkerersFair', name: 'Tinkerers Fair', description: 'Brilliant tinkerers gather and share inventions — electronics windfall!', minEra: 2, type: 'instant', effect: { resourceId: 'electronics', amount: 30 } },

  // Era 3
  sentientAlgorithm: { id: 'sentientAlgorithm', name: 'Sentient Algorithm', description: 'An algorithm achieves a new level of insight — research triples!', minEra: 3, type: 'timed', duration: 25, effect: { resourceId: 'research', rateMultBonus: 5 } },
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
  forgeChorus: { id: 'forgeChorus', name: 'Forge Chorus', description: 'Every forge across the galaxy hums the same note — a frequency the precursors called "the song of making." The chorus builds things from sound alone.', minEra: 7, type: 'instant', effect: { resourceId: 'stellarForge', amount: 25 } },

  // Era 8
  influenceTide: { id: 'influenceTide', name: 'Influence Tide', description: 'A tide of political goodwill sweeps the galaxy!', minEra: 8, type: 'instant', effect: { resourceId: 'galacticInfluence', amount: 200 } },
  exoticMatterStorm: { id: 'exoticMatterStorm', name: 'Exotic Matter Storm', description: 'A storm of exotic matter sweeps through your territory!', minEra: 8, type: 'timed', duration: 40, effect: { resourceId: 'exoticMatter', rateMultBonus: 6 } },

  // Era 9
  cosmicConvergence: { id: 'cosmicConvergence', name: 'Cosmic Convergence', description: 'Cosmic forces converge — universal constants multiply!', minEra: 9, type: 'timed', duration: 45, effect: { resourceId: 'universalConstants', rateMultBonus: 8 } },
  voidRipple: { id: 'voidRipple', name: 'Void Ripple', description: 'A ripple through the void yields a burst of cosmic power!', minEra: 9, type: 'instant', effect: { resourceId: 'cosmicPower', amount: 300 } },

  // Era 10
  realityBlossom: { id: 'realityBlossom', name: 'Reality Blossom', description: 'Realities blossom like flowers — fragments rain from everywhere!', minEra: 10, type: 'instant', effect: { resourceId: 'realityFragments', amount: 500 } },
  echoSymphony: { id: 'echoSymphony', name: 'Echo Symphony', description: 'Infinite echoes sing in harmony — quantum echoes amplified beyond measure!', minEra: 10, type: 'timed', duration: 50, effect: { resourceId: 'quantumEchoes', rateMultBonus: 15 } },

  // Final push to 1000 content items
  geologicalSurvey: { id: 'geologicalSurvey', name: 'Geological Survey', description: 'Rich mineral deposits found beneath the surface!', minEra: 2, type: 'instant', effect: { resourceId: 'materials', amount: 60 } },
  scientificRenaissance: { id: 'scientificRenaissance', name: 'Scientific Renaissance', description: 'A burst of scientific progress!', minEra: 3, type: 'timed', duration: 40, effect: { resourceId: 'research', rateMultBonus: 5 } },
  orbitalAlignment: { id: 'orbitalAlignment', name: 'Orbital Alignment', description: 'Planets align for optimal launch windows!', minEra: 4, type: 'timed', duration: 35, effect: { resourceId: 'rocketFuel', rateMultBonus: 5 } },
  solarMaximum: { id: 'solarMaximum', name: 'Solar Maximum', description: 'The sun reaches peak activity — energy floods your collectors!', minEra: 5, type: 'timed', duration: 45, effect: { resourceId: 'energy', rateMultBonus: 8 } },
  interstellarCurrent: { id: 'interstellarCurrent', name: 'Interstellar Current', description: 'A current of dark energy sweeps through the sector!', minEra: 6, type: 'instant', effect: { resourceId: 'darkEnergy', amount: 80 } },
  galacticHarmonics: { id: 'galacticHarmonics', name: 'Galactic Harmonics', description: 'Stellar vibrations produce exotic materials!', minEra: 7, type: 'instant', effect: { resourceId: 'stellarForge', amount: 30 } },
  cosmicEpoch: { id: 'cosmicEpoch', name: 'Cosmic Epoch', description: 'The epoch transition was scheduled in the precursor calendars — exotic matter coalesces on cue, as if the universe is following a script.', minEra: 8, type: 'timed', duration: 50, effect: { resourceId: 'exoticMatter', rateMultBonus: 6 } },
  entropyShift: { id: 'entropyShift', name: 'Entropy Shift', description: 'Entropy momentarily reverses — universal constants crystallize!', minEra: 9, type: 'instant', effect: { resourceId: 'universalConstants', amount: 25 } },
  multiversalEcho: { id: 'multiversalEcho', name: 'Multiversal Echo', description: 'An echo from every reality simultaneously — massive fragment surge!', minEra: 10, type: 'instant', effect: { resourceId: 'realityFragments', amount: 800 } },
  dimensionalCollapse: { id: 'dimensionalCollapse', name: 'Dimensional Collapse', description: 'A dimension collapses — quantum echoes scatter everywhere!', minEra: 10, type: 'timed', duration: 40, effect: { resourceId: 'quantumEchoes', rateMultBonus: 20 } },

  // --- 12 new events ---

  // Era 2
  masterCraftsman: { id: 'masterCraftsman', name: 'Master Craftsman', description: 'A legendary craftsman inspires the workforce — labor surges!', minEra: 2, type: 'timed', duration: 35, effect: { resourceId: 'labor', rateMultBonus: 6 } },
  ironVeinDiscovery: { id: 'ironVeinDiscovery', name: 'Iron Vein Discovery', description: 'A massive iron vein is discovered deep underground — materials flood in!', minEra: 2, type: 'instant', effect: { resourceId: 'materials', amount: 100 } },

  // Era 3
  neuralNetBreakthrough: { id: 'neuralNetBreakthrough', name: 'Neural Net Breakthrough', description: 'A neural network achieves superhuman analysis — software output explodes!', minEra: 3, type: 'timed', duration: 40, effect: { resourceId: 'software', rateMultBonus: 7 } },

  // Era 4
  moonbaseExpansion: { id: 'moonbaseExpansion', name: 'Moonbase Expansion', description: 'A lunar base doubles in size — orbital infrastructure booms!', minEra: 4, type: 'timed', duration: 40, effect: { resourceId: 'orbitalInfra', rateMultBonus: 6 } },

  // Era 5
  dysonPrototype: { id: 'dysonPrototype', name: 'Dyson Prototype', description: 'A Dyson prototype captures unexpected solar energy — exotic materials found!', minEra: 5, type: 'instant', effect: { resourceId: 'exoticMaterials', amount: 90 } },

  // Era 6
  warpFieldStabilization: { id: 'warpFieldStabilization', name: 'Warp Field Stabilization', description: 'Warp fields stabilize perfectly — star system colonization accelerates!', minEra: 6, type: 'timed', duration: 45, effect: { resourceId: 'starSystems', rateMultBonus: 7 } },

  // Era 7
  singularityCapture: { id: 'singularityCapture', name: 'Singularity Capture', description: 'A micro-singularity is captured — megastructure output surges!', minEra: 7, type: 'timed', duration: 40, effect: { resourceId: 'megastructures', rateMultBonus: 10 } },
  stellarForgeChain: { id: 'stellarForgeChain', name: 'Stellar Forge Chain Reaction', description: 'Multiple forges enter chain reaction — stellar forge output triples!', minEra: 7, type: 'instant', effect: { resourceId: 'stellarForge', amount: 35 } },

  // Era 8
  cosmicPowerSurge: { id: 'cosmicPowerSurge', name: 'Cosmic Power Surge', description: 'A massive surge of cosmic power ripples through the galaxy!', minEra: 8, type: 'timed', duration: 45, effect: { resourceId: 'cosmicPower', rateMultBonus: 5 } },

  // Era 9
  universalResonance: { id: 'universalResonance', name: 'Universal Resonance', description: 'Every constant aligns to values that favor your exact technology — the universe is not random, it is rehearsed.', minEra: 9, type: 'timed', duration: 50, effect: { resourceId: 'universalConstants', rateMultBonus: 10 } },

  // Era 10
  realityHarmonicConvergence: { id: 'realityHarmonicConvergence', name: 'Reality Harmonic Convergence', description: 'All realities enter harmonic convergence — fragments and echoes flood in!', minEra: 10, type: 'timed', duration: 60, effect: { resourceId: 'realityFragments', rateMultBonus: 18 } },
  quantumCascadeEvent: { id: 'quantumCascadeEvent', name: 'Quantum Cascade', description: 'A cascade of quantum events produces an unprecedented echo surge!', minEra: 10, type: 'instant', effect: { resourceId: 'quantumEchoes', amount: 200 } },

  // --- 22 new late-game events (eras 6-10) ---

  // Era 6
  darkEnergyVortex: { id: 'darkEnergyVortex', name: 'Dark Energy Vortex', description: 'A spiraling vortex of dark energy concentrates in your sector — collectors overload!', minEra: 6, type: 'timed', duration: 50, effect: { resourceId: 'darkEnergy', rateMultBonus: 7 } },
  stellarCartography: { id: 'stellarCartography', name: 'Stellar Cartography', description: 'Advanced cartography reveals an entire hidden star cluster!', minEra: 6, type: 'instant', effect: { resourceId: 'starSystems', amount: 18 } },
  interstellarTributeFleet: { id: 'interstellarTributeFleet', name: 'Interstellar Tribute Fleet', description: 'A tribute fleet from a distant civilization arrives bearing exotic gifts!', minEra: 6, type: 'instant', effect: { resourceId: 'exoticMaterials', amount: 100 } },
  darkEnergyLattice: { id: 'darkEnergyLattice', name: 'Dark Energy Lattice', description: 'Dark energy crystallizes into a harvestable lattice structure!', minEra: 6, type: 'timed', duration: 45, effect: { resourceId: 'darkEnergy', rateMultBonus: 8 } },

  // Era 7
  dysonSphereOverclock: { id: 'dysonSphereOverclock', name: 'Dyson Sphere Overclock', description: 'Emergency overclock pushes the Dyson sphere beyond rated capacity!', minEra: 7, type: 'timed', duration: 35, effect: { resourceId: 'stellarForge', rateMultBonus: 12 } },
  megastructureAvalanche: { id: 'megastructureAvalanche', name: 'Megastructure Avalanche', description: 'Self-replicating constructors finish a wave of megastructures simultaneously!', minEra: 7, type: 'instant', effect: { resourceId: 'megastructures', amount: 20 } },
  stellarForgeSupernova: { id: 'stellarForgeSupernova', name: 'Stellar Forge Supernova', description: 'A controlled supernova feeds the forge with stellar plasma!', minEra: 7, type: 'instant', effect: { resourceId: 'stellarForge', amount: 40 } },
  nicollDysonBeam: { id: 'nicollDysonBeam', name: 'Nicoll-Dyson Beam', description: 'The Dyson sphere focuses a beam of pure energy — megastructure output surges!', minEra: 7, type: 'timed', duration: 40, effect: { resourceId: 'megastructures', rateMultBonus: 10 } },

  // Era 8
  galacticSenateVote: { id: 'galacticSenateVote', name: 'Galactic Senate Vote', description: 'The senate votes in your favor — influence skyrockets!', minEra: 8, type: 'timed', duration: 55, effect: { resourceId: 'galacticInfluence', rateMultBonus: 9 } },
  exoticMatterSingularity: { id: 'exoticMatterSingularity', name: 'Exotic Matter Singularity', description: 'An exotic matter singularity forms — matter pours from its event horizon!', minEra: 8, type: 'instant', effect: { resourceId: 'exoticMatter', amount: 150 } },
  galacticLibraryAccess: { id: 'galacticLibraryAccess', name: 'Galactic Library Access', description: 'Access to a Type III civilization library is granted — research explodes!', minEra: 8, type: 'timed', duration: 45, effect: { resourceId: 'research', rateMultBonus: 10 } },
  exoticMatterFountain: { id: 'exoticMatterFountain', name: 'Exotic Matter Fountain', description: 'A fountain of exotic matter erupts from a white hole!', minEra: 8, type: 'timed', duration: 50, effect: { resourceId: 'exoticMatter', rateMultBonus: 9 } },

  // Era 9
  cosmicStringHarvest: { id: 'cosmicStringHarvest', name: 'Cosmic String Harvest', description: 'A cosmic string is harvested for its immense energy — cosmic power floods in!', minEra: 9, type: 'instant', effect: { resourceId: 'cosmicPower', amount: 400 } },
  universalConstantLock: { id: 'universalConstantLock', name: 'Universal Constant Lock', description: 'Scientists lock universal constants in a favorable configuration!', minEra: 9, type: 'timed', duration: 55, effect: { resourceId: 'universalConstants', rateMultBonus: 12 } },
  bigCrunchEcho: { id: 'bigCrunchEcho', name: 'Big Crunch Echo', description: 'An echo of a universe\'s big crunch releases compressed cosmic power!', minEra: 9, type: 'instant', effect: { resourceId: 'cosmicPower', amount: 500 } },
  darkFlowSurge: { id: 'darkFlowSurge', name: 'Dark Flow Surge', description: 'The mysterious dark flow accelerates — universal constants crystallize!', minEra: 9, type: 'timed', duration: 50, effect: { resourceId: 'universalConstants', rateMultBonus: 10 } },

  // Era 10
  omniversalGenesis: { id: 'omniversalGenesis', name: 'Omniversal Genesis', description: 'A new universe is born within the multiverse — reality fragments condense from the chaos!', minEra: 10, type: 'instant', effect: { resourceId: 'realityFragments', amount: 1000 } },
  quantumDecoherenceWave: { id: 'quantumDecoherenceWave', name: 'Quantum Decoherence Wave', description: 'A wave of decoherence collapses infinite possibilities into quantum echoes!', minEra: 10, type: 'timed', duration: 60, effect: { resourceId: 'quantumEchoes', rateMultBonus: 20 } },
  multiversalRift: { id: 'multiversalRift', name: 'Multiversal Rift', description: 'A permanent rift between realities tears open — fragments pour through endlessly!', minEra: 10, type: 'timed', duration: 50, effect: { resourceId: 'realityFragments', rateMultBonus: 20 } },
  infiniteMirrorHall: { id: 'infiniteMirrorHall', name: 'Infinite Mirror Hall', description: 'Realities reflect infinitely inward — quantum echoes compound beyond measure!', minEra: 10, type: 'instant', effect: { resourceId: 'quantumEchoes', amount: 250 } },
  realitySeedPlanting: { id: 'realitySeedPlanting', name: 'Reality Seed Planting', description: 'Seeds of new realities are planted and bloom instantly — fragments scatter!', minEra: 10, type: 'instant', effect: { resourceId: 'realityFragments', amount: 800 } },
  quantumEntanglementStorm: { id: 'quantumEntanglementStorm', name: 'Quantum Entanglement Storm', description: 'A storm of entangled particles synchronizes across realities — echoes multiply!', minEra: 10, type: 'timed', duration: 55, effect: { resourceId: 'quantumEchoes', rateMultBonus: 22 } },

  // --- 10 new cross-chain events ---

  // Era 2
  forgeBreakthrough: { id: 'forgeBreakthrough', name: 'Forge Breakthrough', description: 'A revolutionary forging technique doubles steel throughput!', minEra: 2, type: 'timed', duration: 35, effect: { resourceId: 'steel', rateMultBonus: 6 } },

  // Era 3
  neuralNetworkSurge: { id: 'neuralNetworkSurge', name: 'Neural Network Surge', description: 'Neural networks achieve emergent intelligence — research breakthroughs cascade!', minEra: 3, type: 'timed', duration: 40, effect: { resourceId: 'research', rateMultBonus: 6 } },

  // Era 4
  orbitalManeuverBonus: { id: 'orbitalManeuverBonus', name: 'Orbital Maneuver', description: 'A perfect orbital insertion saves enormous fuel — reserves flood in!', minEra: 4, type: 'instant', effect: { resourceId: 'rocketFuel', amount: 180 } },

  // Era 5
  colonyFederationPact: { id: 'colonyFederationPact', name: 'Colony Federation Pact', description: 'Colonies form a federation — expansion accelerates dramatically!', minEra: 5, type: 'timed', duration: 45, effect: { resourceId: 'colonies', rateMultBonus: 6 } },

  // Era 6
  darkEnergyGeyser: { id: 'darkEnergyGeyser', name: 'Dark Energy Geyser', description: 'The geyser erupts from coordinates marked on precursor maps with a single word: "Drink." The dark energy tastes of collapsed timelines.', minEra: 6, type: 'timed', duration: 50, effect: { resourceId: 'darkEnergy', rateMultBonus: 8 } },
  starSystemCascade: { id: 'starSystemCascade', name: 'Star System Cascade', description: 'A cascade of gravitational interactions reveals hidden star systems!', minEra: 6, type: 'instant', effect: { resourceId: 'starSystems', amount: 20 } },

  // Era 7
  forgeQuantumLock: { id: 'forgeQuantumLock', name: 'Forge Quantum Lock', description: 'Quantum-locked stellar forges achieve perfect efficiency!', minEra: 7, type: 'timed', duration: 40, effect: { resourceId: 'stellarForge', rateMultBonus: 10 } },

  // Era 8
  galacticTradeWindfall: { id: 'galacticTradeWindfall', name: 'Galactic Trade Windfall', description: 'A galactic trade route opens — exotic matter and influence pour in!', minEra: 8, type: 'instant', effect: { resourceId: 'exoticMatter', amount: 130 } },

  // Era 9
  cosmicPowerWave: { id: 'cosmicPowerWave', name: 'Cosmic Power Wave', description: 'A wave of pure cosmic energy sweeps through the intergalactic void!', minEra: 9, type: 'timed', duration: 55, effect: { resourceId: 'cosmicPower', rateMultBonus: 10 } },

  // Era 10
  realityEchoStorm: { id: 'realityEchoStorm', name: 'Reality Echo Storm', description: 'A storm of echoing realities creates a torrent of fragments and echoes!', minEra: 10, type: 'timed', duration: 50, effect: { resourceId: 'realityFragments', rateMultBonus: 18 } },

  // --- Lore Discovery Events ---

  // Era 1: Planetfall
  loreMetalFragments: { id: 'loreMetalFragments', isLore: true, name: 'Strange Metal Fragments', description: 'Scavengers find metal shards in the crash debris — too precise, too old. These aren\'t from your ship.', minEra: 1, type: 'instant', effect: { resourceId: 'materials', amount: 15 } },
  loreBuriedFoundation: { id: 'loreBuriedFoundation', isLore: true, name: 'Buried Foundation', description: 'Digging a latrine, a settler hits stone — cut stone, laid in perfect rows, under millennia of soil.', minEra: 1, type: 'instant', effect: { resourceId: 'materials', amount: 20 } },
  loreEerieSignal: { id: 'loreEerieSignal', isLore: true, name: 'Eerie Signal', description: 'The comms array picks up a repeating signal from deep underground. It matches no known encoding.', minEra: 1, type: 'instant', effect: { resourceId: 'energy', amount: 10 } },

  // Era 2: Industrialization
  loreBuriedMachine: { id: 'loreBuriedMachine', isLore: true, name: 'Buried Machine', description: 'Miners breach a sealed chamber. Inside: a machine, intact, its purpose unknowable. It looks like it was mass-produced.', minEra: 2, type: 'instant', effect: { resourceId: 'steel', amount: 30 } },
  loreAncientFactory: { id: 'loreAncientFactory', isLore: true, name: 'Ancient Factory Floor', description: 'An excavation reveals a factory floor stretching for kilometers. The assembly lines mirror your own designs.', minEra: 2, type: 'instant', effect: { resourceId: 'research', amount: 40 } },
  loreFamiliarBlueprint: { id: 'loreFamiliarBlueprint', isLore: true, name: 'Familiar Blueprint', description: 'Engineers recover a schematic from the ruins. It\'s for a furnace. Your furnace. The same one you just built.', minEra: 2, type: 'timed', duration: 30, effect: { resourceId: 'steel', rateMultBonus: 3 } },

  // Era 3: Digital Age
  loreAncientDataCore: { id: 'loreAncientDataCore', isLore: true, name: 'Ancient Data Core', description: 'A data core surfaces from the ruins, still powered after eons. The file structure is hauntingly familiar.', minEra: 3, type: 'instant', effect: { resourceId: 'data', amount: 25 } },
  loreDeadLanguageWarning: { id: 'loreDeadLanguageWarning', isLore: true, name: 'Dead Language Warning', description: 'Linguists crack the ancient script. The first decoded phrase: "DO NOT REPEAT OUR MISTAKES."', minEra: 3, type: 'instant', effect: { resourceId: 'research', amount: 50 } },
  loreGoldenAgeRecords: { id: 'loreGoldenAgeRecords', isLore: true, name: 'Golden Age Records', description: 'Archives describe a golden age — limitless energy, perfect health, infinite ambition. Then the records simply stop.', minEra: 3, type: 'timed', duration: 30, effect: { resourceId: 'software', rateMultBonus: 3 } },

  // Era 4: Space Age
  loreOrbitalGraveyard: { id: 'loreOrbitalGraveyard', isLore: true, name: 'Orbital Graveyard', description: 'The debris field resolves on sensors: thousands of ships, all facing outward, as if fleeing something below.', minEra: 4, type: 'instant', effect: { resourceId: 'orbitalInfra', amount: 10 } },
  loreGhostStation: { id: 'loreGhostStation', isLore: true, name: 'Ghost Station', description: 'A derelict station drifts in high orbit. Life support still cycles. No bodies. No logs. Just empty halls and running machines.', minEra: 4, type: 'instant', effect: { resourceId: 'research', amount: 80 } },
  loreFamiliarHulls: { id: 'loreFamiliarHulls', isLore: true, name: 'Familiar Hulls', description: 'The wreckage uses the same alloy ratios as your own ships. The design language is unmistakable. These were your people.', minEra: 4, type: 'instant', effect: { resourceId: 'rocketFuel', amount: 60 } },

  // Era 5: Solar System
  loreTerraformedRuins: { id: 'loreTerraformedRuins', isLore: true, name: 'Terraformed Ruins', description: 'Mars has breathable air in its deepest valleys. Someone terraformed it, long ago. The atmosphere is reverting.', minEra: 5, type: 'instant', effect: { resourceId: 'colonies', amount: 5 } },
  loreFeralBiosphere: { id: 'loreFeralBiosphere', isLore: true, name: 'Feral Biosphere', description: 'Europa\'s subsurface ocean teems with engineered life gone wild. The genetic markers are unmistakably human-derived.', minEra: 5, type: 'instant', effect: { resourceId: 'exoticMaterials', amount: 30 } },
  loreAbandonedColony: { id: 'loreAbandonedColony', isLore: true, name: 'Abandoned Colony', description: 'Titan\'s colony domes are intact but empty. Dinner plates still set on tables. Whatever happened, it happened fast.', minEra: 5, type: 'timed', duration: 35, effect: { resourceId: 'colonies', rateMultBonus: 3 } },

  // Era 6: Interstellar
  loreAncientBeacon: { id: 'loreAncientBeacon', isLore: true, name: 'Ancient FTL Beacon', description: 'The beacon has been pulsing for ten thousand years. Its message, once decoded: coordinates. Hundreds of dead worlds.', minEra: 6, type: 'instant', effect: { resourceId: 'starSystems', amount: 8 } },
  loreDeadCivilization: { id: 'loreDeadCivilization', isLore: true, name: 'Dead Civilization', description: 'You reach a star system marked on the ancient maps. Cities of glass, silent and perfect. Population: zero.', minEra: 6, type: 'instant', effect: { resourceId: 'darkEnergy', amount: 40 } },
  loreStarMapNetwork: { id: 'loreStarMapNetwork', isLore: true, name: 'Star Map Network', description: 'The beacons form a network — a map of every civilization that ever rose and fell. Your star is on it. Marked "active."', minEra: 6, type: 'timed', duration: 40, effect: { resourceId: 'starSystems', rateMultBonus: 4 } },

  // Era 7: Dyson Era
  loreDarkDyson: { id: 'loreDarkDyson', isLore: true, name: 'The Dark Sphere', description: 'The Dyson sphere is older than your sun. Its builders left no name, no record — only this impossible monument to ambition.', minEra: 7, type: 'instant', effect: { resourceId: 'stellarForge', amount: 20 } },
  loreIdenticalDesign: { id: 'loreIdenticalDesign', isLore: true, name: 'Identical Design', description: 'Your engineers overlay their Dyson blueprints on the ancient sphere. A perfect match. They hadn\'t shared their plans with anyone.', minEra: 7, type: 'instant', effect: { resourceId: 'megastructures', amount: 8 } },
  loreSphereWhispers: { id: 'loreSphereWhispers', isLore: true, name: 'Sphere Whispers', description: 'Deep in the sphere\'s core, sensors detect faint EM patterns. Not random noise — structured, repetitive. Like a heartbeat, or a countdown.', minEra: 7, type: 'timed', duration: 40, effect: { resourceId: 'stellarForge', rateMultBonus: 5 } },

  // Era 8: Galactic
  loreRuinsSpanGalaxies: { id: 'loreRuinsSpanGalaxies', isLore: true, name: 'Galactic Ruins', description: 'The ruins aren\'t scattered — they\'re layered. Civilization after civilization, building on the bones of the last. You are the newest layer.', minEra: 8, type: 'instant', effect: { resourceId: 'galacticInfluence', amount: 100 } },
  loreAllCivilizations: { id: 'loreAllCivilizations', isLore: true, name: 'Universal Pattern', description: 'Carbon-based, silicon-based, plasma-based — it doesn\'t matter. Every species that achieves spaceflight follows the same path. Every single one.', minEra: 8, type: 'instant', effect: { resourceId: 'exoticMatter', amount: 50 } },
  loreLastMessage: { id: 'loreLastMessage', isLore: true, name: 'The Last Message', description: 'A billion-year-old transmission, preserved in exotic matter: "We thought we were different. We thought we could break the cycle."', minEra: 8, type: 'timed', duration: 45, effect: { resourceId: 'exoticMatter', rateMultBonus: 4 } },

  // Era 9: Intergalactic
  lorePatternClarity: { id: 'lorePatternClarity', isLore: true, name: 'The Pattern', description: 'Expand. Transcend. Collapse. Reset. The cosmic web itself is shaped by it — a trillion cycles of ambition and ash.', minEra: 9, type: 'instant', effect: { resourceId: 'cosmicPower', amount: 200 } },
  loreNoExceptions: { id: 'loreNoExceptions', isLore: true, name: 'No Exceptions', description: 'Your scientists search for a single civilization that survived past this point. After mapping ten billion galaxies, they find none.', minEra: 9, type: 'instant', effect: { resourceId: 'universalConstants', amount: 15 } },
  loreFinalUnderstanding: { id: 'loreFinalUnderstanding', isLore: true, name: 'Final Understanding', description: 'The universe isn\'t hostile. It\'s a machine — designed to produce civilizations, harvest their knowledge, and start again.', minEra: 9, type: 'timed', duration: 50, effect: { resourceId: 'cosmicPower', rateMultBonus: 5 } },

  // Era 10: Multiverse
  loreCycleRevealed: { id: 'loreCycleRevealed', isLore: true, name: 'The Cycle Revealed', description: 'Prestige. The word surfaces from the oldest archives, from every reality simultaneously. They all called it the same thing.', minEra: 10, type: 'instant', effect: { resourceId: 'realityFragments', amount: 300 } },
  loreYouveBeenHereBefore: { id: 'loreYouveBeenHereBefore', isLore: true, name: 'You\'ve Been Here Before', description: 'A reality fragment resolves into a memory: you, sitting here, making the same choices. The fragment is from the future.', minEra: 10, type: 'instant', effect: { resourceId: 'quantumEchoes', amount: 100 } },
  loreTheLoopItself: { id: 'loreTheLoopItself', isLore: true, name: 'The Loop Itself', description: 'There is no escape. There was never meant to be. The loop is the point — the universe dreaming itself awake, over and over, forever.', minEra: 10, type: 'timed', duration: 60, effect: { resourceId: 'realityFragments', rateMultBonus: 8 } },

  // --- Story Events: Echoes of a Prior Civilization ---

  // Era 1: Planetfall — Strange metal, geometric patterns, ancient foundations
  storyStrangeMetal: { id: 'storyStrangeMetal', isLore: true, name: 'Strange Metal in the Soil', description: 'A work crew pulls something from the mud — an alloy too uniform to be natural, too corroded to be from the ship. The soil here is threaded with it, like veins in flesh.', minEra: 1, chance: 0.006, type: 'instant', effect: { resourceId: 'materials', amount: 25 } },
  storyGeometricRock: { id: 'storyGeometricRock', isLore: true, name: 'Geometric Patterns', description: 'A cliff face collapses, revealing hexagonal basalt columns — except they aren\'t basalt. The angles are too precise. Someone carved these, then buried them under a mountain.', minEra: 1, chance: 0.006, type: 'instant', effect: { resourceId: 'materials', amount: 20 } },
  storyAncientFoundation: { id: 'storyAncientFoundation', isLore: true, name: 'The Foundation Beneath', description: 'The crash site sits on bedrock — or what you thought was bedrock. Ground-penetrating scans reveal a grid of foundations extending kilometers in every direction. Your landing site isn\'t random. It\'s an address.', minEra: 1, chance: 0.006, type: 'instant', effect: { resourceId: 'energy', amount: 15 } },

  // Era 2: Industrialization — Buried machinery, sealed chamber, factory ruins
  storyWorkshopGhost: { id: 'storyWorkshopGhost', isLore: true, name: 'Workshop Ghost', description: 'A factory worker swears the assembly line moved on its own overnight — the conveyor alignment matches blueprints no one drew.', minEra: 2, chance: 0.006, type: 'instant', effect: { resourceId: 'steel', amount: 35 } },

  storyBuriedGears: { id: 'storyBuriedGears', isLore: true, name: 'Buried Gears', description: 'A mining shaft breaks into a cavity. Inside, gears the size of houses — frozen mid-turn, their teeth worn smooth by centuries of operation before whatever stopped them. The lubricant is synthetic. Identical to yours.', minEra: 2, chance: 0.006, type: 'instant', effect: { resourceId: 'steel', amount: 40 } },
  storySealedChamber: { id: 'storySealedChamber', isLore: true, name: 'The Sealed Chamber', description: 'Behind a door that took three days to cut open: a workshop, hermetically sealed, tools hanging on pegboards. A wrench fits your bolts. A caliper reads your units. Dust covers everything. No footprints but yours.', minEra: 2, chance: 0.006, type: 'instant', effect: { resourceId: 'research', amount: 50 } },
  storyMirrorFactory: { id: 'storyMirrorFactory', isLore: true, name: 'Mirror Factory', description: 'The ancient assembly line stretches into darkness. Your engineers walk it in silence. Every station, every conveyor, every safety rail — it\'s their factory. The one they designed last month. Built ten thousand years ago.', minEra: 2, chance: 0.006, type: 'instant', effect: { resourceId: 'electronics', amount: 20 } },

  // Era 3: Digital Age — Ancient data storage, holographic message, digital ghosts
  storyDigitalPhantom: { id: 'storyDigitalPhantom', isLore: true, name: 'Digital Phantom', description: 'A subroutine appears in the network that no one wrote. It optimizes power distribution perfectly. Its creation date is three thousand years ago.', minEra: 3, chance: 0.006, type: 'instant', effect: { resourceId: 'software', amount: 30 } },

  storyFragmentaryRecording: { id: 'storyFragmentaryRecording', isLore: true, name: 'Fragmentary Recording', description: 'The ancient storage medium yields 0.003% of its data. Enough for twelve seconds of video: a city skyline, children playing, a sunset. The architecture is wrong but the people — the people look like us.', minEra: 3, chance: 0.006, type: 'instant', effect: { resourceId: 'data', amount: 35 } },
  storyHolographicMessage: { id: 'storyHolographicMessage', isLore: true, name: 'Holographic Message', description: 'The projector activates without warning. A figure appears — human-shaped, human-faced — speaking urgently in a language no one knows. It points at a star chart. Then at you. Then it loops.', minEra: 3, chance: 0.006, type: 'instant', effect: { resourceId: 'research', amount: 60 } },
  storyDigitalGhosts: { id: 'storyDigitalGhosts', isLore: true, name: 'Digital Ghosts', description: 'The recovered hardware boots to a login screen. Behind it: processes still running, subroutines tending data gardens for an absent user. When you query the system, it asks for a password. Your lead programmer\'s birthday works.', minEra: 3, chance: 0.006, type: 'instant', effect: { resourceId: 'software', amount: 25 } },

  // Era 4: Space Age — Orbital debris, space elevator foundation, derelict ship
  storyOrbitalMemory: { id: 'storyOrbitalMemory', isLore: true, name: 'Orbital Memory', description: 'The space station\'s navigation computer already has orbital data for every planet. It was loaded before the first launch.', minEra: 4, chance: 0.006, type: 'instant', effect: { resourceId: 'orbitalInfra', amount: 12 } },

  storyUnnaturalDebris: { id: 'storyUnnaturalDebris', isLore: true, name: 'Unnatural Debris', description: 'The orbital debris field isn\'t natural. Spectral analysis reveals hull plating, reactor shielding, and something that might have been a window. It\'s arranged in a perfect Keplerian graveyard orbit — parked, not crashed.', minEra: 4, chance: 0.006, type: 'instant', effect: { resourceId: 'orbitalInfra', amount: 15 } },
  storyElevatorFoundation: { id: 'storyElevatorFoundation', isLore: true, name: 'Elevator Foundation', description: 'The equatorial ridge isn\'t geological. It\'s the anchor point of a space elevator, the cable long since severed, the counterweight still orbiting as a captured asteroid. Your engineers had chosen the same site for theirs.', minEra: 4, chance: 0.006, type: 'instant', effect: { resourceId: 'rocketFuel', amount: 80 } },
  storyDerelictShip: { id: 'storyDerelictShip', isLore: true, name: 'The Derelict', description: 'The derelict drifts in L2. Its cockpit seats adjust to human proportions. Its controls fall naturally under human hands. On the captain\'s console, scratched into the metal with something sharp: a tally. Four hundred and twelve marks.', minEra: 4, chance: 0.006, type: 'instant', effect: { resourceId: 'research', amount: 100 } },

  // Era 5: Solar System — Past terraforming, abandoned colonies, matching star map
  storyTerraformScars: { id: 'storyTerraformScars', isLore: true, name: 'Terraform Scars', description: 'The neighboring planet bears the unmistakable scars of terraforming — atmospheric processors rusting on plateaus, canal systems choked with red dust. Someone tried to make this world green. The timeline puts it at fifty thousand years ago.', minEra: 5, chance: 0.006, type: 'instant', effect: { resourceId: 'colonies', amount: 8 } },
  storyAbandonedBelongings: { id: 'storyAbandonedBelongings', isLore: true, name: 'Abandoned Belongings', description: 'The colony dome is pressurized. Inside: personal effects. A child\'s drawing of two suns. A journal in an unknown script. A photograph — faded, cracked — of a family standing in front of this exact dome. In the background, your ship, landing.', minEra: 5, chance: 0.006, type: 'instant', effect: { resourceId: 'exoticMaterials', amount: 40 } },
  storyMatchingStarMap: { id: 'storyMatchingStarMap', isLore: true, name: 'The Matching Star Map', description: 'The ancient star map is perfect — every system cataloged, every resource noted, every route plotted. Your expansion plan, drafted by committee last year, matches it point for point. The map is dated. It\'s from the next cycle.', minEra: 5, chance: 0.006, type: 'instant', effect: { resourceId: 'exoticMaterials', amount: 50 } },

  // Era 6: Interstellar — Ancient beacons, dead civilizations, familiar coordinates
  storyEchoingBeacon: { id: 'storyEchoingBeacon', isLore: true, name: 'Echoing Beacon', description: 'An ancient FTL beacon activates as you approach. Its signal predates your arrival by millennia — but it\'s broadcasting your ship\'s transponder code.', minEra: 6, chance: 0.006, type: 'instant', effect: { resourceId: 'starSystems', amount: 50 } },
  storyStarGraveyard: { id: 'storyStarGraveyard', isLore: true, name: 'Star Graveyard', description: 'A cluster of dead stars, each surrounded by debris that was once a civilization. Every one reached exactly this stage of development.', minEra: 6, chance: 0.006, type: 'instant', effect: { resourceId: 'darkEnergy', amount: 200 } },
  storyFamiliarCoordinates: { id: 'storyFamiliarCoordinates', isLore: true, name: 'Familiar Coordinates', description: 'The navigation computer flags an anomaly — the ancient star maps don\'t just show where civilizations were. They show where you\'re going next.', minEra: 6, chance: 0.006, type: 'instant', effect: { resourceId: 'galacticInfluence', amount: 80 } },

  // Era 7: Dyson Era — Mirror sphere, stellar archive, resonance cascade
  storyMirrorSphere: { id: 'storyMirrorSphere', isLore: true, name: 'Mirror Sphere', description: 'The abandoned Dyson sphere\'s control interface accepts your authentication codes. It was built by hands with the same fingerprints as yours.', minEra: 7, chance: 0.006, type: 'instant', effect: { resourceId: 'megastructures', amount: 15 } },
  storyStellarArchive: { id: 'storyStellarArchive', isLore: true, name: 'Stellar Archive', description: 'Inside the sphere, a library of stellar engineering data. The last entry reads: \'If you are reading this, you are us. Do not build the Engine.\'', minEra: 7, chance: 0.006, type: 'instant', effect: { resourceId: 'stellarForge', amount: 100 } },
  storyResonanceCascade: { id: 'storyResonanceCascade', isLore: true, name: 'Resonance Cascade', description: 'Your stellar forge resonates with frequencies from the ancient sphere. For a moment, both activate simultaneously across a million years.', minEra: 7, chance: 0.006, type: 'instant', effect: { resourceId: 'stellarForge', amount: 150 } },

  // Era 8: Galactic — Senate of ghosts, convergence signal, memory plague
  storySenateOfGhosts: { id: 'storySenateOfGhosts', isLore: true, name: 'Senate of Ghosts', description: 'The galactic senate chamber has seats for every species that ever achieved interstellar travel. Every seat is empty. Every nameplate reads the same word in different languages: \'Again.\'', minEra: 8, chance: 0.006, type: 'instant', effect: { resourceId: 'galacticInfluence', amount: 300 } },
  storyConvergenceSignal: { id: 'storyConvergenceSignal', isLore: true, name: 'Convergence Signal', description: 'Every galaxy in the local cluster is broadcasting the same signal: a countdown. It started before any civilization existed. It ends... soon.', minEra: 8, chance: 0.006, type: 'instant', effect: { resourceId: 'exoticMatter', amount: 150 } },
  storyMemoryPlague: { id: 'storyMemoryPlague', isLore: true, name: 'Memory Plague', description: 'Crew members report dreams of lives they never lived — building civilizations on planets they\'ve never seen. The dreams are memories. Not theirs.', minEra: 8, chance: 0.006, type: 'instant', effect: { resourceId: 'exoticMatter', amount: 120 } },

  // Era 9: Intergalactic — The counter, void whisper, pattern recognition
  storyTheCounter: { id: 'storyTheCounter', isLore: true, name: 'The Counter', description: 'Deep in the cosmic web, an ancient machine counts. It displays: \'7,832,040,991\'. As you watch, it increments by one.', minEra: 9, chance: 0.006, type: 'instant', effect: { resourceId: 'cosmicPower', amount: 300 } },
  storyVoidWhisper: { id: 'storyVoidWhisper', isLore: true, name: 'Void Whisper', description: 'Between galaxies, where nothing should exist, a voice transmits in your language: \'You always get this far. You never get further.\'', minEra: 9, chance: 0.006, type: 'instant', effect: { resourceId: 'universalConstants', amount: 25 } },
  storyPatternRecognition: { id: 'storyPatternRecognition', isLore: true, name: 'Pattern Recognition', description: 'Your scientists overlay the cosmic microwave background with the expansion pattern of every civilization ever detected. They match perfectly. The universe is the blueprint.', minEra: 9, chance: 0.006, type: 'instant', effect: { resourceId: 'cosmicPower', amount: 250 } },

  // Era 10: Multiverse — Mirror self, archive complete, final transmission
  storyMirrorSelf: { id: 'storyMirrorSelf', isLore: true, name: 'Mirror Self', description: 'Through a dimensional rift, you see yourself. Not a copy — you. Making the same decisions. Building the same things. About to prestige.', minEra: 10, chance: 0.006, type: 'instant', effect: { resourceId: 'realityFragments', amount: 100 } },
  storyTheArchiveComplete: { id: 'storyTheArchiveComplete', isLore: true, name: 'The Archive Complete', description: 'Every piece of data you\'ve collected across every reality assembles into one truth: there is no beginning. There is no end. There is only the cycle.', minEra: 10, chance: 0.006, type: 'instant', effect: { resourceId: 'quantumEchoes', amount: 50 } },
  storyFinalTransmission: { id: 'storyFinalTransmission', isLore: true, name: 'Final Transmission', description: 'A message from the next iteration arrives before you send it: \'We tried to break the cycle too. See you on the other side.\'', minEra: 10, chance: 0.006, type: 'instant', effect: { resourceId: 'realityFragments', amount: 150 } },

  // --- Interactive & Mini-Game-Affecting Events ---

  factorySurge: {
    id: 'factorySurge',
    name: 'Factory Surge',
    description: 'A worker discovers an efficiency breakthrough — factory output doubled for 30 seconds!',
    minEra: 2,
    chance: 0.015,
    type: 'timed',
    duration: 30,
    effect: { resourceId: 'steel', rateMultBonus: 2 },
  },
  miningVein: {
    id: 'miningVein',
    name: 'Mining Vein',
    description: 'Miners strike a rich vein of ore — materials flood in!',
    minEra: 1,
    chance: 0.015,
    type: 'instant',
    effect: { resourceId: 'materials', amount: 500 },
  },
  dataBreach: {
    id: 'dataBreach',
    name: 'Data Breach',
    description: 'Ancient databases cascade open in sequence, each one referencing the next — a chain letter from the precursors, each message containing the key to the next vault.',
    minEra: 3,
    chance: 0.015,
    type: 'timed',
    duration: 45,
    effect: { resourceId: 'data', rateMultBonus: 3 },
  },
  solarFlareStrike: {
    id: 'solarFlareStrike',
    name: 'Solar Flare',
    description: 'A solar flare bathes the colony in energy — but sensitive electronics are damaged.',
    minEra: 4,
    chance: 0.015,
    type: 'instant',
    effects: [{ type: 'resource', target: 'energy', value: 2000 }, { type: 'resource', target: 'electronics', value: -200 }],
  },
  navigationError: {
    id: 'navigationError',
    name: 'Navigation Error',
    description: 'A miscalculated trajectory leads to a fuel-rich asteroid — rapid harvesting begins!',
    minEra: 4,
    chance: 0.015,
    type: 'timed',
    duration: 20,
    effect: { resourceId: 'rocketFuel', rateMultBonus: 2 },
  },
  colonyBoomSettlers: {
    id: 'colonyBoomSettlers',
    name: 'Colony Boom',
    description: 'A wave of settlers arrives from deep space — new colonies established!',
    minEra: 5,
    chance: 0.015,
    type: 'instant',
    effect: { resourceId: 'colonies', amount: 50 },
  },
  realityTear: {
    id: 'realityTear',
    name: 'Reality Tear',
    description: 'A brief tear in spacetime deposits fragments of another reality.',
    minEra: 8,
    chance: 0.008,
    type: 'instant',
    effect: { resourceId: 'realityFragments', amount: 25 },
  },
  researchEureka: {
    id: 'researchEureka',
    name: 'Research Eureka',
    description: 'A breakthrough cascades through every lab — research output tripled!',
    minEra: 2,
    chance: 0.015,
    type: 'timed',
    duration: 60,
    effect: { resourceId: 'research', rateMultBonus: 3 },
  },
  exoticMeteor: {
    id: 'exoticMeteor',
    name: 'Exotic Meteor',
    description: 'An exotic meteor shower delivers rare materials from beyond the solar system.',
    minEra: 5,
    chance: 0.015,
    type: 'instant',
    effect: { resourceId: 'exoticMaterials', amount: 200 },
  },
  cycleEcho: {
    id: 'cycleEcho',
    name: 'Cycle Echo',
    description: 'For a moment, you feel the combined knowledge of every previous iteration — all production doubled!',
    minEra: 7,
    chance: 0.008,
    type: 'timed',
    duration: 30,
    effect: { resourceId: 'all', rateMultBonus: 2 },
  },
  // --- Crisis Events: negative effects that create tension ---
  crisisFamine: {
    id: 'crisisFamine',
    name: 'Blight',
    description: 'Blight strikes the food supply! Production halved for 30 seconds. The ancient soil fights back.',
    minEra: 2,
    type: 'timed',
    chance: 0.005,
    duration: 30,
    effect: { resourceId: 'food', rateMultBonus: 0.5 },
  },
  crisisPowerSurge: {
    id: 'crisisPowerSurge',
    name: 'Power Surge',
    description: 'A power surge from the buried grid destroys stored electronics! The old systems are unstable.',
    minEra: 2,
    type: 'instant',
    chance: 0.005,
    effects: [
      { type: 'resource_percent', target: 'electronics', value: -0.15 },
    ],
  },
  crisisQuake: {
    id: 'crisisQuake',
    name: 'Seismic Event',
    description: 'Something shifts beneath the ruins — a structure deeper than any you built. The tremors feel deliberate, like a lock turning.',
    minEra: 3,
    type: 'timed',
    chance: 0.004,
    duration: 20,
    effect: { resourceId: 'materials', rateMultBonus: 0.3 },
  },
  crisisDataCorruption: {
    id: 'crisisDataCorruption',
    name: 'Data Corruption',
    description: 'Ancient malware activates in the recovered systems! Data and software corrupted.',
    minEra: 3,
    type: 'instant',
    chance: 0.004,
    effects: [
      { type: 'resource_percent', target: 'data', value: -0.10 },
      { type: 'resource_percent', target: 'software', value: -0.10 },
    ],
  },
  crisisFuelLeak: {
    id: 'crisisFuelLeak',
    name: 'Fuel Leak',
    description: 'The fuel lines rupture along seams that match ancient fault lines — the planet\'s geology shifting on a schedule older than your civilization. The earth remembers what flows here.',
    minEra: 4,
    type: 'timed',
    chance: 0.004,
    duration: 25,
    effect: { resourceId: 'rocketFuel', rateMultBonus: 0.33 },
  },
  crisisColonyRevolt: {
    id: 'crisisColonyRevolt',
    name: 'Colony Revolt',
    description: 'Colonists unearth a precursor monument bearing their own names. Shaken, they demand answers before resuming work.',
    minEra: 5,
    type: 'timed',
    chance: 0.004,
    duration: 30,
    effect: { resourceId: 'colonies', rateMultBonus: 0.5 },
  },
  crisisWarpInstability: {
    id: 'crisisWarpInstability',
    name: 'Warp Instability',
    description: 'The warp field collapses along the same fracture lines that destroyed the precursor fleet — the ruins contain logs of this exact failure, down to the timestamp.',
    minEra: 6,
    type: 'instant',
    chance: 0.004,
    effects: [
      { type: 'resource_percent', target: 'darkEnergy', value: -0.15 },
    ],
  },
  crisisStellarFlare: {
    id: 'crisisStellarFlare',
    name: 'Stellar Flare',
    description: 'The Dyson sphere channels a stellar flare directly at your systems. Forge output critically reduced.',
    minEra: 7,
    type: 'timed',
    chance: 0.003,
    duration: 20,
    effect: { resourceId: 'stellarForge', rateMultBonus: 0.25 },
  },
  crisisRealityGlitch: {
    id: 'crisisRealityGlitch',
    name: 'Reality Glitch',
    description: 'Reality stutters. For a moment, everything that exists simply... doesn\'t. Resources scattered across dimensions.',
    minEra: 8,
    type: 'instant',
    chance: 0.003,
    effects: [
      { type: 'resource_percent', target: 'exoticMatter', value: -0.10 },
      { type: 'resource_percent', target: 'galacticInfluence', value: -0.10 },
    ],
  },

  // Mechanic-themed lore events
  loreOverclockPulse: {
    id: 'loreOverclockPulse',
    name: 'Resonant Pulse',
    description: 'The ruins respond to your overclock pulses. For a moment, buried machines pulse in sync — a heartbeat from a civilization that never truly stopped.',
    minEra: 3,
    type: 'instant',
    chance: 0.006,
    effect: { resourceId: 'research', amount: 20 },
    isLore: true,
  },
  loreScavengerWhisper: {
    id: 'loreScavengerWhisper',
    name: 'Guided Scavenge',
    description: 'Your scavenger teams report the ruins seem to WANT to be found. Supplies appear where you need them, as if placed there moments before you arrived.',
    minEra: 2,
    type: 'instant',
    chance: 0.006,
    effect: { resourceId: 'materials', amount: 25 },
    isLore: true,
  },
  loreWarpGrooves: {
    id: 'loreWarpGrooves',
    name: 'Spacetime Grooves',
    description: 'Star routes trace the same paths the precursors used. The spacetime grooves make travel effortless — like water finding old channels worn smooth by a thousand floods.',
    minEra: 6,
    type: 'instant',
    chance: 0.006,
    effect: { resourceId: 'starSystems', amount: 5 },
    isLore: true,
  },
};

// Get events eligible for the current era
export function getEligibleEvents(era) {
  return Object.values(events).filter(e => era >= e.minEra);
}
