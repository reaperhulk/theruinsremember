import { RELICS, RELIC_IDS } from '../data/relics.js';

export const RELIC_SLOT_LIMIT = 2;
export const ECHO_PRESSURE_TARGET = 100;
export const ECHO_PRESSURE_PER_SECOND = 0.24;

export function hasRelic(state, relicId) {
  return (state.activeRelics || []).includes(relicId);
}

function createRelicOffer(state, rolls) {
  const active = new Set(state.activeRelics || []);
  const pool = RELIC_IDS.filter(id => !active.has(id));
  const offer = [];
  for (let index = 0; index < 3 && pool.length > 0; index++) {
    const roll = rolls[index] ?? 0;
    const poolIndex = Math.min(pool.length - 1, Math.floor(roll * pool.length));
    offer.push(pool.splice(poolIndex, 1)[0]);
  }
  return offer;
}

export function addEchoPressure(state, amount, rolls = [Math.random(), Math.random(), Math.random()]) {
  if (amount <= 0 || state.relicOffer?.length) return state;
  const pressure = Math.min(ECHO_PRESSURE_TARGET, (state.echoPressure || 0) + amount);
  if (pressure < ECHO_PRESSURE_TARGET) return { ...state, echoPressure: pressure };
  return {
    ...state,
    echoPressure: ECHO_PRESSURE_TARGET,
    relicOffer: createRelicOffer(state, rolls),
  };
}

export function advanceEchoPressure(state, dt, rng = Math.random) {
  if (dt <= 0 || state.relicOffer?.length) return state;
  const nextPressure = (state.echoPressure || 0) + dt * ECHO_PRESSURE_PER_SECOND;
  if (nextPressure < ECHO_PRESSURE_TARGET) return { ...state, echoPressure: nextPressure };
  return addEchoPressure(state, ECHO_PRESSURE_TARGET, [rng(), rng(), rng()]);
}

export function claimRelic(state, relicId, replaceRelicId = null) {
  if (!(state.relicOffer || []).includes(relicId) || !RELICS[relicId]) return state;
  const active = [...(state.activeRelics || [])];
  if (active.length >= RELIC_SLOT_LIMIT) {
    const replaceIndex = active.indexOf(replaceRelicId);
    if (replaceIndex < 0) return state;
    active.splice(replaceIndex, 1, relicId);
  } else {
    active.push(relicId);
  }
  return {
    ...state,
    activeRelics: active,
    relicOffer: [],
    echoPressure: 0,
    relicsRecoveredThisRun: (state.relicsRecoveredThisRun || 0) + 1,
  };
}

export function declineRelicOffer(state) {
  if (!state.relicOffer?.length) return state;
  return { ...state, relicOffer: [], echoPressure: 0 };
}

export function getRelicProductionMultiplier(state, resourceId) {
  let multiplier = 1;
  if (hasRelic(state, 'emberSeed')) {
    if (resourceId === 'food' || resourceId === 'labor') multiplier *= 1.45;
    if (resourceId === 'energy') multiplier *= 0.85;
  }
  if (hasRelic(state, 'openCircuit') && (resourceId === 'energy' || resourceId === 'electronics')) multiplier *= 1.4;
  if (hasRelic(state, 'surveyorLens') && state.era > 3 && resourceId === 'research') multiplier *= 1.1;
  return multiplier;
}

export function getRelicCapacityMultiplier(state) {
  return hasRelic(state, 'openCircuit') ? 0.9 : 1;
}

export function getRelicOperationMultiplier(state, operationId) {
  if (operationId === 'expedition' && hasRelic(state, 'surveyorLens')) return 1.25;
  if (operationId === 'docking' && hasRelic(state, 'voidSail')) return 1.15;
  if (operationId === 'colonies' && hasRelic(state, 'colonyCharter')) return 1.25;
  if (operationId === 'starChart' && hasRelic(state, 'pilgrimMap')) return 1.25;
  if (operationId === 'weaving' && hasRelic(state, 'loomNeedle')) return 1.2;
  return 1;
}

export function getRelicExpeditionChanceBonus(state) {
  return hasRelic(state, 'surveyorLens') ? 0.15 : 0;
}

export function getRelicDockingZoneMultiplier(state) {
  return hasRelic(state, 'voidSail') ? 1.2 : 1;
}

export function getRelicMandateDuration(state, baseDuration) {
  return hasRelic(state, 'colonyCharter') ? baseDuration / 2 : baseDuration;
}

export function getRelicRouteCostMultiplier(state) {
  return hasRelic(state, 'pilgrimMap') ? 0.5 : 1;
}

export function getRelicSenateCostMultiplier(state) {
  return hasRelic(state, 'brokenCrown') ? 0.7 : 1;
}

export function getRelicSenateDirectiveMultiplier(state) {
  return hasRelic(state, 'brokenCrown') ? 1.5 : 1;
}
