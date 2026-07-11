// Structure catalog. Placement is drafted, one per day — each entry must be
// a legible decision, not filler.

export const STRUCTURES = {
  farm: {
    id: 'farm',
    name: 'Farm',
    cost: 10,
    hp: 1,
    glowPerSecond: 0.6,
    weight: 3,
    defensive: false,
    description: 'Steady Glow while the sun holds.',
  },
  well: {
    id: 'well',
    name: 'Well',
    cost: 8,
    hp: 1,
    glowPerSecond: 0.2,
    adjacencyBonus: { farm: 0.4 },
    weight: 2,
    defensive: false,
    description: 'A little Glow, and +0.4/s to each neighboring Farm.',
  },
  lantern: {
    id: 'lantern',
    name: 'Lantern',
    cost: 12,
    hp: 1,
    slowsAdjacent: 1.6,
    weight: 2,
    defensive: true,
    description: 'Shades approach lit neighbors far more slowly.',
  },
  watchtower: {
    id: 'watchtower',
    name: 'Watchtower',
    cost: 16,
    hp: 1,
    weight: 2,
    defensive: true,
    description: 'Banishes the first shade to reach a neighbor each night.',
  },
  palisade: {
    id: 'palisade',
    name: 'Palisade',
    cost: 6,
    hp: 3,
    tauntWeight: 3,
    weight: 2,
    defensive: true,
    description: 'Draws the dark to itself. Takes three nights of teeth.',
  },
  shrine: {
    id: 'shrine',
    name: 'Shrine',
    cost: 14,
    hp: 1,
    weight: 1,
    defensive: false,
    description: '+2 Embers at the fall if it still stands.',
  },
};

export const STRUCTURE_IDS = Object.keys(STRUCTURES);
