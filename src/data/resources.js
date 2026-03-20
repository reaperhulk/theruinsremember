// Resource definitions per era
// Each resource: { id, name, era, baseCap, baseRate, description }

export const resources = {
  // Era 1: Planetfall — caps high enough for era 2+ scaled costs
  labor: { id: 'labor', name: 'Labor', era: 1, baseCap: 2000, baseRate: 0, description: 'Manual workforce' },
  food: { id: 'food', name: 'Food', era: 1, baseCap: 5000, baseRate: 0.5, description: 'Sustenance for settlers' },
  materials: { id: 'materials', name: 'Materials', era: 1, baseCap: 5000, baseRate: 0.2, description: 'Raw building materials' },
  energy: { id: 'energy', name: 'Energy', era: 1, baseCap: 5000, baseRate: 0.1, description: 'Power supply' },

  // Era 2: Industrialization
  steel: { id: 'steel', name: 'Steel', era: 2, baseCap: 5000, baseRate: 0, description: 'Refined metal alloy' },
  electronics: { id: 'electronics', name: 'Electronics', era: 2, baseCap: 3000, baseRate: 0, description: 'Electronic components' },
  research: { id: 'research', name: 'Research', era: 2, baseCap: 10000, baseRate: 0, description: 'Scientific knowledge' },

  // Era 3: Digital Age
  software: { id: 'software', name: 'Software', era: 3, baseCap: 1500, baseRate: 0, description: 'Digital programs and algorithms' },
  data: { id: 'data', name: 'Data', era: 3, baseCap: 1000, baseRate: 0, description: 'Collected and processed information' },

  // Era 4: Space Age — caps must exceed scaled costs (5x base)
  rocketFuel: { id: 'rocketFuel', name: 'Rocket Fuel', era: 4, baseCap: 2000, baseRate: 0, description: 'Propellant for rockets' },
  orbitalInfra: { id: 'orbitalInfra', name: 'Orbital Infrastructure', era: 4, baseCap: 1000, baseRate: 0, description: 'Structures in orbit' },

  // Era 5: Solar System — caps must exceed scaled costs (7x base)
  colonies: { id: 'colonies', name: 'Colonies', era: 5, baseCap: 500, baseRate: 0, description: 'Off-world settlements' },
  exoticMaterials: { id: 'exoticMaterials', name: 'Exotic Materials', era: 5, baseCap: 1000, baseRate: 0, description: 'Rare space resources' },

  // Era 6: Interstellar — caps for 10x scaling
  starSystems: { id: 'starSystems', name: 'Star Systems', era: 6, baseCap: 1000, baseRate: 0, description: 'Colonized star systems' },
  darkEnergy: { id: 'darkEnergy', name: 'Dark Energy', era: 6, baseCap: 5000, baseRate: 0, description: 'Mysterious cosmic force' },

  // Era 7: Dyson Era — caps for 12x scaling
  megastructures: { id: 'megastructures', name: 'Megastructures', era: 7, baseCap: 500, baseRate: 0, description: 'Massive stellar-scale constructions' },
  stellarForge: { id: 'stellarForge', name: 'Stellar Forge Output', era: 7, baseCap: 2000, baseRate: 0, description: 'Output from star-powered forges' },

  // Era 8: Galactic — caps for 15x scaling
  galacticInfluence: { id: 'galacticInfluence', name: 'Galactic Influence', era: 8, baseCap: 10000, baseRate: 0, description: 'Political power across the galaxy' },
  exoticMatter: { id: 'exoticMatter', name: 'Exotic Matter', era: 8, baseCap: 3000, baseRate: 0, description: 'Matter with unusual properties' },

  // Era 9: Intergalactic — caps for 18x scaling
  cosmicPower: { id: 'cosmicPower', name: 'Cosmic Power', era: 9, baseCap: 20000, baseRate: 0, description: 'Energy from the cosmos itself' },
  universalConstants: { id: 'universalConstants', name: 'Universal Constants', era: 9, baseCap: 1000, baseRate: 0, description: 'Manipulable laws of physics' },

  // Era 10: Multiverse — caps for 22x scaling
  realityFragments: { id: 'realityFragments', name: 'Reality Fragments', era: 10, baseCap: 10000, baseRate: 0, description: 'Shards of alternate realities' },
  quantumEchoes: { id: 'quantumEchoes', name: 'Quantum Echoes', era: 10, baseCap: 5000, baseRate: 0, description: 'Resonances from parallel universes' },
};

export function getResourcesForEra(era) {
  return Object.values(resources).filter(r => r.era <= era);
}
