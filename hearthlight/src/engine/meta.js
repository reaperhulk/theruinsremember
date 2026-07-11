// The Ember shop: permanent upgrades bought between rounds.
// Three jobs: start faster, go longer, widen the build space.
// Pre-builds pre-pay costs; they never skip decisions.

export const META_UPGRADES = {
  stoneFoundations: {
    id: 'stoneFoundations',
    name: 'Stone Foundations',
    cost: 5,
    description: 'Every structure endures one extra night of teeth (+1 HP).',
  },
  morningStockpile: {
    id: 'morningStockpile',
    name: 'Morning Stockpile',
    cost: 5,
    description: 'Each round begins with +15 Glow.',
  },
  swiftWarden: {
    id: 'swiftWarden',
    name: 'Swift Warden',
    cost: 8,
    description: 'The Warden repositions faster and banishes held shades sooner.',
  },
  deeperDrafts: {
    id: 'deeperDrafts',
    name: 'Deeper Drafts',
    cost: 8,
    description: 'Each day offers four structures instead of three.',
  },
  outerRing: {
    id: 'outerRing',
    name: 'The Outer Ring',
    cost: 12,
    description: 'Unlocks ten more slots beyond the first circle.',
  },
  secondWarden: {
    id: 'secondWarden',
    name: 'Second Warden',
    cost: 15,
    description: 'Another keeper walks the night.',
  },
};

export function buyMetaUpgrade(state, upgradeId) {
  const upgrade = META_UPGRADES[upgradeId];
  if (!upgrade || state.meta[upgradeId] || state.embers < upgrade.cost) return null;
  return {
    ...state,
    embers: state.embers - upgrade.cost,
    meta: { ...state.meta, [upgradeId]: true },
  };
}

export function getDraftSize(state) {
  return state.meta.deeperDrafts ? 4 : 3;
}

export function getWardenCount(state) {
  return 1 + (state.meta.secondWarden ? 1 : 0);
}

export function getUnlockedRings(state) {
  return state.meta.outerRing ? 2 : 1;
}
