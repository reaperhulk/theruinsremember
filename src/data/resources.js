// Resource definitions per era
// Each resource: { id, name, era, baseCap, baseRate, description }

export const resources = {
  // Era 1: Planetfall — caps high enough for era 2+ scaled costs
  labor: { id: 'labor', name: 'Labor', era: 1, baseCap: 2000, baseRate: 0.2, description: 'Manual workforce' },
  food: { id: 'food', name: 'Food', era: 1, baseCap: 5000, baseRate: 1.5, description: 'Sustenance for settlers' },
  materials: { id: 'materials', name: 'Materials', era: 1, baseCap: 5000, baseRate: 0.8, description: 'Raw building materials' },
  energy: { id: 'energy', name: 'Energy', era: 1, baseCap: 5000, baseRate: 0.5, description: 'Power supply' },

  // Era 2: Industrialization — small base rates for bootstrapping
  steel: { id: 'steel', name: 'Steel', era: 2, baseCap: 5000, baseRate: 0.15, description: 'Refined metal alloy' },
  electronics: { id: 'electronics', name: 'Electronics', era: 2, baseCap: 3000, baseRate: 0.1, description: 'Electronic components' },
  research: { id: 'research', name: 'Research', era: 2, baseCap: 10000, baseRate: 0.2, description: 'Scientific knowledge' },

  // Era 3: Digital Age — base rate balances bootstrapping vs meaningful duration
  software: { id: 'software', name: 'Software', era: 3, baseCap: 1500, baseRate: 0.2, description: 'Digital programs and algorithms' },
  data: { id: 'data', name: 'Data', era: 3, baseCap: 1000, baseRate: 0.25, description: 'Collected and processed information' },

  // Era 4: Space Age — moderate base rate to help bootstrapping
  rocketFuel: { id: 'rocketFuel', name: 'Rocket Fuel', era: 4, baseCap: 5000, baseRate: 0.3, description: 'Propellant for rockets' },
  orbitalInfra: { id: 'orbitalInfra', name: 'Orbital Infrastructure', era: 4, baseCap: 1000, baseRate: 0.15, description: 'Structures in orbit' },

  // Era 5: Solar System
  colonies: { id: 'colonies', name: 'Colonies', era: 5, baseCap: 2000, baseRate: 0.05, description: 'Off-world settlements' },
  exoticMaterials: { id: 'exoticMaterials', name: 'Exotic Materials', era: 5, baseCap: 3000, baseRate: 0.08, description: 'Rare space resources' },

  // Era 6: Interstellar
  starSystems: { id: 'starSystems', name: 'Star Systems', era: 6, baseCap: 5000, baseRate: 0.05, description: 'Colonized star systems' },
  darkEnergy: { id: 'darkEnergy', name: 'Dark Energy', era: 6, baseCap: 5000, baseRate: 0.08, description: 'Mysterious cosmic force' },

  // Era 7: Dyson Era
  megastructures: { id: 'megastructures', name: 'Megastructures', era: 7, baseCap: 2000, baseRate: 0.03, description: 'Massive stellar-scale constructions' },
  stellarForge: { id: 'stellarForge', name: 'Stellar Forge Output', era: 7, baseCap: 2000, baseRate: 0.05, description: 'Output from star-powered forges' },

  // Era 8: Galactic
  galacticInfluence: { id: 'galacticInfluence', name: 'Galactic Influence', era: 8, baseCap: 100000, baseRate: 0.1, description: 'Political power across the galaxy' },
  exoticMatter: { id: 'exoticMatter', name: 'Exotic Matter', era: 8, baseCap: 10000, baseRate: 0.05, description: 'Matter with unusual properties' },

  // Era 9: Intergalactic
  cosmicPower: { id: 'cosmicPower', name: 'Cosmic Power', era: 9, baseCap: 20000, baseRate: 0.03, description: 'Energy from the cosmos itself' },
  universalConstants: { id: 'universalConstants', name: 'Universal Constants', era: 9, baseCap: 5000, baseRate: 0.02, description: 'Manipulable laws of physics' },

  // Era 10: Multiverse
  realityFragments: { id: 'realityFragments', name: 'Reality Fragments', era: 10, baseCap: 10000, baseRate: 0.02, description: 'Shards of alternate realities' },
  quantumEchoes: { id: 'quantumEchoes', name: 'Quantum Echoes', era: 10, baseCap: 20000, baseRate: 0.01, description: 'Resonances from parallel universes' },
};

export function getResourcesForEra(era) {
  return Object.values(resources).filter(r => r.era <= era);
}
