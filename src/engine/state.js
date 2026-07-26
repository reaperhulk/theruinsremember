import { resources } from '../data/resources.js';
import { createExpeditionState } from './expeditions.js';

// Migrate a saved state to the current schema by merging with fresh defaults
export function migrateState(saved) {
  const fresh = createInitialState();
  // Ensure all fields exist by merging with defaults
  const migrated = { ...fresh, ...saved };
  // Ensure resources have all required fields
  for (const [id, freshR] of Object.entries(fresh.resources)) {
    if (!migrated.resources[id]) {
      migrated.resources[id] = freshR;
    } else {
      migrated.resources[id] = { ...freshR, ...migrated.resources[id] };
    }
  }
  // Ensure new state fields exist
  if (!migrated.dysonSegments) migrated.dysonSegments = 0;
  if (!migrated.lockedSignals) migrated.lockedSignals = {};
  migrated.senateGov = { leader: null, partner: null, ratified: false, ...(saved.senateGov || {}) };
  if (!migrated.seenLoreEvents) migrated.seenLoreEvents = {};
  if (migrated.autoBuildOut === undefined) migrated.autoBuildOut = true;
  migrated.expedition = { ...createExpeditionState(), ...(saved.expedition || {}) };
  migrated.dockingMissions = { cargo: 0, crew: 0, science: 0, ...(saved.dockingMissions || {}) };
  for (const retiredField of [
    'miningStreak', 'lastMineTime', 'autoMineTimer',
    'factoryAllocation', 'factoryWorkers',
    'hackChallenge', 'hackDifficulty', 'hackSuccesses', 'hackMastery', 'lastHackTime',
    'weavingGrid', 'weavingOffer', 'weaveCombo', 'lastWeaveTime',
    'tuningScore', 'senate',
  ]) {
    delete migrated[retiredField];
  }
  // Guard against broken resource fields from corrupt saves
  for (const [id, r] of Object.entries(migrated.resources)) {
    if (!Number.isFinite(r.capMult) || r.capMult <= 0) migrated.resources[id] = { ...migrated.resources[id], capMult: 1 };
    if (!Number.isFinite(r.rateMult) || r.rateMult <= 0) migrated.resources[id] = { ...migrated.resources[id], rateMult: 1 };
    if (!Number.isFinite(r.rateAdd)) migrated.resources[id] = { ...migrated.resources[id], rateAdd: 0 };
    if (!Number.isFinite(r.amount) || r.amount < 0) migrated.resources[id] = { ...migrated.resources[id], amount: 0 };
  }
  // Guard prestige multiplier against NaN/Infinity from corrupted saves
  if (!Number.isFinite(migrated.prestigeMultiplier) || migrated.prestigeMultiplier <= 0) {
    migrated.prestigeMultiplier = 1;
  }
  migrated.saveVersion = fresh.saveVersion;
  return migrated;
}

export function createInitialState() {
  const resourceState = {};
  for (const r of Object.values(resources)) {
    resourceState[r.id] = {
      amount: 0,
      cap: r.baseCap,
      baseRate: r.baseRate,
      rateMult: 1,
      rateAdd: 0,
      capMult: 1,
      unlocked: r.era === 1,
    };
  }

  // Start with some labor
  resourceState.labor.amount = 10;

  return {
    era: 1,
    resources: resourceState,
    upgrades: {},       // { [upgradeId]: true }
    tech: {},           // { [techId]: true }
    totalTicks: 0,
    totalTime: 0,       // seconds
    prestigeMultiplier: 1,
    lastSaved: Date.now(),
    totalGems: 0,       // relic gems recovered by expeditions
    // Expeditions (Eras 1-3)
    expedition: createExpeditionState(),
    // Events system (Era 3+)
    activeEffects: [],  // [{ id, endsAt, description }]
    eventLog: [],       // [{ message, time }] — last 10 events
    totalWeaves: 0,
    wovenLaws: {},
    // Docking (Era 4+)
    dockingAttempts: 0,
    dockingSuccesses: 0,
    dockingPerfects: 0,
    dockingCombo: 0,
    dockingMission: 'cargo',
    dockingMissions: { cargo: 0, crew: 0, science: 0 },
    dockingContracts: { era: 4, cargo: 0, crew: 0, science: 0 },
    dockingContractsCompleted: { cargo: 0, crew: 0, science: 0 },
    // Trading (Era 6+)
    totalTrades: 0,
    // Era time tracking
    eraStartTime: 0,    // totalTime when current era began
    bestEraTimes: {},
    // Prestige
    prestigeCount: 0,
    prestigePoints: 0,
    prestigeUpgrades: {},
    lifetimeHighestEra: 1,
    lifetimePlayTime: 0,
    achievements: {},
    // Dyson Assembly (Era 7+)
    dysonSegments: 0,
    dysonModules: { frame: 0, collector: 0, forge: 0 },
    // Cosmic Tuning (Era 9+) — locked signal bands for this cycle
    lockedSignals: {},
    // Galactic Senate (Era 8+) — government formed by policy acts
    senateGov: { leader: null, partner: null, ratified: false },
    // Senate directive sliders — percentage focus per faction (sum = 100)
    senatePct: { merchants: 34, scholars: 33, warriors: 33 },
    // The Forgetting (Era 10+) — run-ending siege state
    forgetting: null,
    recursionDepth: 0,
    // Reality Forge (Era 10+)
    realityKeys: {},
    echoPressure: 0,
    relicOffer: [],
    activeRelics: [],
    relicsRecoveredThisRun: 0,
    cycleDoctrine: null,
    nextCycleDoctrine: null,
    cycleGoalRewarded: false,
    cycleMarks: 0,
    // NG+ Echoed Mode (unlocked after True Ending)
    echoMode: false,
    echoResource: 0,
    echoUpgrades: {},
    // Lore event deduplication
    seenLoreEvents: {},
    // UI: hidden repeatable upgrades
    hiddenUpgrades: {},
    // Routine current-era upgrades buy themselves; decisions never do.
    autoBuildOut: true,
    saveVersion: 6,
  };
}
