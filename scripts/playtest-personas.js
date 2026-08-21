// The complete player-persona catalog. Every persona models when a real
// person is actually present to make a decision; there are no legacy bots
// with supernatural, every-second purchasing behavior.

export const PERSONA_IDS = [
  'newcomer',
  'engaged',
  'optimizer',
  'background',
  'check_in',
  'offline_returner',
  'completionist',
  'minimalist',
];

const PRESTIGE_UPGRADE_ORDER = [
  'fastStart', 'luckyMiner', 'headStart', 'deepPockets',
  'sealMastery', 'wardenEternal',
  'hackMaster', 'dockingPro', 'factoryExpert', 'miniGameSavant',
  'tradeRoutes', 'eventMagnet', 'wisdomOfAges', 'quantumMemory',
  'cosmicInsight', 'perfectMemory', 'universalOptimizer', 'chainMaster',
  'eraMomentum', 'autoClicker', 'achievementHunter', 'temporalEcho',
  'masterWeaver', 'quantumTunneling', 'infinitePatience', 'instantKnowledge',
  'cycleMastery', 'temporalMastery', 'primordialMemory',
  'acceleratedDecay', 'cosmicAwareness', 'eternalReturn',
];

export function createPersonaProfiles() {
  const efficient = {
    gather: true,
    gatherInterval: 5,
    expeditions: true,
    expeditionStrategy: 'deep',
    buyUpgrades: true,
    buyTech: true,
    docking: true,
    dockInterval: 3,
    dockAccuracy: 0,
    colonies: true,
    colonyStrategy: 'diversified',
    starChart: true,
    starChartPlan: 'longHaul',
    weaving: true,
    weaveInterval: 10,
    trading: true,
    tradeStrategy: 'bottleneck',
    dysonAssembly: true,
    cosmicTuning: true,
    senateFocus: 'balanced',
    realityForge: true,
    forgettingDefense: 2,
    buyPrestigeUpgrades: true,
    prestigeUpgradeOrder: PRESTIGE_UPGRADE_ORDER,
  };

  const attentive = {
    ...efficient,
    gatherInterval: 15,
    expeditionStrategy: 'measured',
    dockInterval: 5,
    dockAccuracy: 0.15,
    colonyStrategy: 'growth',
    starChartPlan: 'coreWeb',
    weaveInterval: 0,
    forgettingDefense: 5,
  };

  return {
    newcomer: {
      ...attentive,
      description: 'First-time player: reads guidance, hesitates, and explores most systems every 20 seconds.',
      gatherInterval: 20,
      dockInterval: 20,
      dockAccuracy: 0.25,
      expeditionStrategy: 'safe',
      colonyStrategy: 'growth',
      starChartPlan: 'coreWeb',
      forgettingDefense: 20,
      attention: { decisionInterval: 20, firstDecisionAt: 20 },
    },
    engaged: {
      ...attentive,
      description: 'Engaged player: stays present, explores most systems, and makes decisions every 10 seconds.',
      gatherInterval: 10,
      dockInterval: 10,
      expeditionStrategy: 'measured',
      forgettingDefense: 10,
      attention: { decisionInterval: 10 },
    },
    optimizer: {
      ...efficient,
      description: 'Experienced optimizer: uses every system and makes efficient decisions every 2 seconds.',
      gatherInterval: 2,
      dockInterval: 2,
      attention: { decisionInterval: 2 },
    },
    background: {
      ...attentive,
      description: 'Background player: leaves the game open and checks in for 30 seconds every 2 minutes.',
      gatherInterval: 5,
      dockInterval: 5,
      attention: { decisionInterval: 5, sessionInterval: 120, sessionDuration: 30 },
    },
    check_in: {
      ...attentive,
      description: 'Check-in player: closes the game between one-minute visits every 10 minutes.',
      gatherInterval: 5,
      dockInterval: 5,
      attention: {
        decisionInterval: 5,
        sessionInterval: 600,
        sessionDuration: 60,
        offlineBetweenSessions: true,
      },
    },
    offline_returner: {
      ...attentive,
      description: 'Offline returner: plays for two minutes, then leaves the game closed for four hours.',
      gatherInterval: 5,
      dockInterval: 5,
      attention: {
        decisionInterval: 5,
        sessionInterval: 14400,
        sessionDuration: 120,
        offlineBetweenSessions: true,
      },
    },
    completionist: {
      ...efficient,
      description: 'Completionist: explores every operation and optional choice with deliberate 5-second decisions.',
      gatherInterval: 5,
      dockInterval: 5,
      forgettingDefense: 5,
      attention: { decisionInterval: 5 },
    },
    minimalist: {
      ...efficient,
      description: 'Mechanics minimalist: checks economic decisions every 30 seconds and skips optional operations.',
      gatherInterval: 30,
      expeditions: false,
      expeditionStrategy: 'safe',
      docking: false,
      colonies: false,
      starChart: false,
      weaving: false,
      dysonAssembly: false,
      cosmicTuning: false,
      senateFocus: null,
      realityForge: false,
      relics: false,
      prestigeUpgradeOrder: [
        'fastStart', 'luckyMiner', 'headStart', 'deepPockets',
        'wisdomOfAges', 'quantumMemory', 'tradeRoutes', 'eventMagnet',
        'cosmicInsight', 'universalOptimizer', 'chainMaster', 'eraMomentum',
        'autoClicker',
      ],
      attention: { decisionInterval: 30 },
    },
  };
}

export function getPlayerAttention(profile, elapsedSeconds) {
  const schedule = profile.attention;
  if (!schedule) {
    return {
      present: true,
      decisionWindow: true,
      sessionStart: elapsedSeconds === 0,
      offline: false,
    };
  }

  const phase = schedule.sessionInterval
    ? elapsedSeconds % schedule.sessionInterval
    : elapsedSeconds;
  const present = !schedule.sessionInterval || phase < schedule.sessionDuration;
  const firstDecisionAt = schedule.firstDecisionAt || 0;
  const decisionWindow = present
    && phase >= firstDecisionAt
    && (phase - firstDecisionAt) % schedule.decisionInterval === 0;

  return {
    present,
    decisionWindow,
    sessionStart: phase === 0,
    offline: !present && !!schedule.offlineBetweenSessions,
  };
}
