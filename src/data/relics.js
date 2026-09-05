export const RELICS = {
  emberSeed: {
    id: 'emberSeed',
    availableEra: 1,
    name: 'Ember Seed',
    domain: 'Reconstruction',
    description: 'Food and labor production +45%; energy production -15%.',
  },
  openCircuit: {
    id: 'openCircuit',
    availableEra: 1,
    name: 'Open Circuit',
    domain: 'Industry',
    description: 'Energy and electronics production +40%; resource capacity -10%.',
  },
  surveyorLens: {
    id: 'surveyorLens',
    availableEra: 1,
    name: 'Surveyor Lens',
    domain: 'Expeditions',
    description: 'Risky expeditions gain +15% success and +25% rewards; research gains +10% after Era 3.',
  },
  voidSail: {
    id: 'voidSail',
    availableEra: 4,
    name: 'Void Sail',
    domain: 'Orbital',
    description: 'Docking capture windows +20%; mission rewards +15%.',
  },
  colonyCharter: {
    id: 'colonyCharter',
    availableEra: 5,
    name: 'Colony Charter',
    domain: 'Colonies',
    description: 'Colony output +25% and mandate commitments last half as long.',
  },
  pilgrimMap: {
    id: 'pilgrimMap',
    availableEra: 6,
    name: 'Pilgrim Map',
    domain: 'Star Chart',
    description: 'Star routes cost half as much and produce +25%.',
  },
  brokenCrown: {
    id: 'brokenCrown',
    availableEra: 8,
    name: 'Broken Crown',
    domain: 'Senate',
    description: 'Senate policy acts cost 30% less and directives are 50% stronger.',
  },
  loomNeedle: {
    id: 'loomNeedle',
    availableEra: 8,
    name: 'Loom Needle',
    domain: 'Weaving',
    description: 'Reality Laws are 20% stronger.',
  },
};

export const RELIC_IDS = Object.keys(RELICS);
