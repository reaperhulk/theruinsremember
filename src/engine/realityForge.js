import { upgrades as upgradeDefs } from '../data/upgrades.js';

export const REALITY_KEY_RECIPES = [
  {
    id: 'temporal',
    label: 'Temporal Key',
    fragments: 50,
    echoes: 20,
    color: '#ff8866',
    description: 'Next cycles recover expedition supplies 5 seconds faster per key.',
    lore: 'Frozen moments compressed into a key. Time bends around whoever holds it.',
    milestone: 'Reach Cosmic Tuning score 50',
    unlocked: state => (state.tuningScore || 0) >= 50,
  },
  {
    id: 'spatial',
    label: 'Spatial Key',
    fragments: 30,
    echoes: 40,
    color: '#66aaff',
    description: 'Resource capacity increases 15% per key in every future cycle.',
    lore: 'Space itself yields a path. The forge routes echoes through folded geometry.',
    milestone: 'Complete 9 successful orbital operations',
    unlocked: state => (state.dockingSuccesses || 0) >= 9,
  },
  {
    id: 'causal',
    label: 'Causal Key',
    fragments: 40,
    echoes: 30,
    color: '#88dd88',
    description: 'Operation rewards increase 10% per key in every future cycle.',
    lore: 'Effect becomes cause. The causal loop feeds more echoes into the present.',
    milestone: 'Establish the Causal Certainty law',
    unlocked: state => !!state.wovenLaws?.causal,
  },
  {
    id: 'quantum',
    label: 'Quantum Key',
    fragments: 20,
    echoes: 50,
    color: '#dd88ff',
    description: 'Each future cycle begins with 25 extra basic resources per key.',
    lore: 'Superposition of states collapsed into permanence. The forge approves.',
    milestone: 'Reach the Reality Forge',
    unlocked: state => state.era >= 10,
  },
];

export const CYCLE_FALLBACK_SECONDS = 3600;

export function getRealityForgeRecipes(state) {
  const fragments = state.resources.realityFragments?.amount || 0;
  const echoes = state.resources.quantumEchoes?.amount || 0;
  return REALITY_KEY_RECIPES.map(recipe => ({
    ...recipe,
    count: state.realityKeys?.[recipe.id] || 0,
    isUnlocked: recipe.unlocked(state),
    affordable: recipe.unlocked(state) && fragments >= recipe.fragments && echoes >= recipe.echoes,
  }));
}

export function forgeRealityKey(state, recipeId) {
  if (state.era < 10) return null;
  const recipe = getRealityForgeRecipes(state).find(candidate => candidate.id === recipeId);
  if (!recipe?.affordable) return null;

  const fragments = state.resources.realityFragments;
  const echoes = state.resources.quantumEchoes;
  return {
    ...state,
    realityKeys: {
      ...(state.realityKeys || {}),
      [recipe.id]: (state.realityKeys?.[recipe.id] || 0) + 1,
    },
    resources: {
      ...state.resources,
      realityFragments: { ...fragments, amount: fragments.amount - recipe.fragments },
      quantumEchoes: { ...echoes, amount: echoes.amount - recipe.echoes },
    },
  };
}

export function getCycleReadiness(state) {
  const era10Upgrades = Object.keys(state.upgrades || {}).filter(
    id => upgradeDefs[id]?.era === 10
  ).length;
  const keyCounts = Object.values(state.realityKeys || {});
  const totalKeys = keyCounts.reduce((sum, count) => sum + count, 0);
  const distinctKeys = keyCounts.filter(count => count > 0).length;
  const requirements = [
    { id: 'era', label: 'Reach the Multiverse', current: Math.min(state.era, 10), target: 10, met: state.era >= 10 },
    { id: 'upgrades', label: 'Era 10 decisions', current: era10Upgrades, target: 20, met: era10Upgrades >= 20 },
    { id: 'totalKeys', label: 'Reality keys forged', current: totalKeys, target: 4, met: totalKeys >= 4 },
    { id: 'distinctKeys', label: 'Distinct key types', current: distinctKeys, target: 3, met: distinctKeys >= 3 },
    { id: 'doctrine', label: 'Next-cycle doctrine selected', current: state.nextCycleDoctrine ? 1 : 0, target: 1, met: !!state.nextCycleDoctrine },
  ];
  const era10Elapsed = state.era >= 10 ? Math.max(0, state.totalTime - (state.eraStartTime || 0)) : 0;
  const completed = requirements.filter(requirement => requirement.met).length;
  const directlyReady = requirements.every(requirement => requirement.met);
  const fallbackRemaining = Math.max(0, CYCLE_FALLBACK_SECONDS - era10Elapsed);
  const fallbackReady = state.era >= 10 && fallbackRemaining === 0 && !!state.nextCycleDoctrine;

  return {
    ready: directlyReady || fallbackReady,
    directlyReady,
    fallbackReady,
    fallbackRemaining,
    requirements,
    completed,
    total: requirements.length,
    era10Upgrades,
    totalKeys,
    distinctKeys,
  };
}
