export const eraNames = {
  1: 'Planetfall',
  2: 'Industrialization',
  3: 'Digital Age',
  4: 'Space Age',
  5: 'Solar System',
  6: 'Interstellar',
  7: 'Dyson Era',
  8: 'Galactic',
  9: 'Intergalactic',
  10: 'Multiverse',
};

export const ERA_COUNT = 10;

import { techTree } from '../data/tech-tree.js';
import { resources as resourceDefs } from '../data/resources.js';
import { upgrades as upgradeDefs } from '../data/upgrades.js';

// Minimum upgrades purchased in the current era before transition is allowed.
const ERA_MIN_UPGRADES = {
  1: 14,
  2: 16,
  3: 16,
  4: 20,
  5: 30,   // ~52% of ~58 — reduced from 42 to avoid stalls
  6: 30,   // ~52% of ~58
  7: 30,   // ~49% of ~61
  8: 30,   // ~50% of ~60
  9: 5,    // 5 CP-only entry upgrades form a viable path; later upgrades need operation resources
  10: 30,  // ~51% of ~59
};

export function getMinUpgradesForEra(era) {
  return ERA_MIN_UPGRADES[era] || 10;
}

// Minimum tech depth in the current era before transition is allowed.
// This replaces fixed dwell timers with build-out/readiness checks.
const ERA_MIN_TECHS = {
  1: 2,    // path tech + era gate
  2: 3,
  3: 3,
  4: 4,
  5: 4,
  6: 3,
  7: 3,
  8: 3,
  9: 3,
  10: 0,
};

export function getMinTechsForEra(era) {
  return ERA_MIN_TECHS[era] ?? 1;
}

// Count how many upgrades the player has purchased that belong to the given era.
export function countEraUpgrades(state, era) {
  return Object.keys(state.upgrades || {}).filter(
    id => upgradeDefs[id] && upgradeDefs[id].era === era
  ).length;
}

export function countEraTechs(state, era) {
  return Object.keys(state.tech || {}).filter(
    id => techTree[id] && techTree[id].era === era
  ).length;
}

const MASTERY_FALLBACK_SECONDS = 600;

export function getEraMastery(state, era = state.era) {
  const elapsed = era === state.era ? Math.max(0, state.totalTime - (state.eraStartTime || 0)) : 0;
  const fallbackMet = elapsed >= MASTERY_FALLBACK_SECONDS;
  let title = '';
  let detail = '';
  let current = 0;
  let target = 0;

  if (era === 5) {
    title = 'Colony Doctrine';
    const assignments = Object.values(state.colonyAssignments || {});
    if (state.cycleDoctrine === 'expansion') {
      detail = 'Expansion doctrine: assign five colonies in any configuration.';
      current = assignments.reduce((sum, count) => sum + count, 0);
      target = 5;
    } else {
      detail = 'Assign at least one colony to growth, science, and industry.';
      current = assignments.filter(count => count > 0).length;
      target = 3;
    }
  } else if (era === 6) {
    title = 'Route Network';
    detail = state.cycleDoctrine === 'expansion'
      ? 'Expansion doctrine: establish seven high-priority routes.'
      : 'Establish ten routes on the star chart.';
    current = state.starRoutes?.length || 0;
    target = state.cycleDoctrine === 'expansion' ? 7 : 10;
  } else if (era === 7) {
    title = 'Sphere Assembly';
    detail = state.cycleDoctrine === 'expansion'
      ? 'Expansion doctrine: assemble twenty load-bearing Dyson segments.'
      : 'Assemble thirty Dyson segments.';
    current = state.dysonSegments || 0;
    target = state.cycleDoctrine === 'expansion' ? 20 : 30;
  } else if (era === 8) {
    title = 'Galactic Mandate';
    const transcendent = state.cycleDoctrine === 'transcendence';
    detail = transcendent
      ? 'Transcendence doctrine: enact two Senate policy acts or establish two reality laws.'
      : 'Enact three Senate policy acts or establish three reality laws.';
    const government = state.senateGov || {};
    const senateActs = (government.leader ? 1 : 0) + (government.partner ? 1 : 0) + (government.ratified ? 1 : 0);
    current = Math.max(senateActs, Object.keys(state.wovenLaws || {}).length);
    target = transcendent ? 2 : 3;
  } else if (era === 9) {
    title = 'Cosmic Alignment';
    detail = state.cycleDoctrine === 'transcendence'
      ? 'Transcendence doctrine: lock two cosmic signal bands.'
      : 'Lock three cosmic signal bands.';
    current = Object.keys(state.lockedSignals || {}).length;
    target = state.cycleDoctrine === 'transcendence' ? 2 : 3;
  }

  const required = target > 0;
  return {
    required,
    title,
    detail,
    current,
    target,
    fallbackSeconds: MASTERY_FALLBACK_SECONDS,
    fallbackRemaining: Math.max(0, MASTERY_FALLBACK_SECONDS - elapsed),
    completedDirectly: required && current >= target,
    met: !required || current >= target || fallbackMet,
  };
}

export function getEraReadiness(state, era = state.era) {
  const minUpgrades = getMinUpgradesForEra(era);
  const currentUpgrades = countEraUpgrades(state, era);
  const minTechs = getMinTechsForEra(era);
  const currentTechs = countEraTechs(state, era);
  const discoveryValue = state.cycleDoctrine === 'reconstruction' ? 3 : 2;
  const discoveryCap = state.cycleDoctrine === 'reconstruction' ? 10 : 8;
  const discoveryCredits = era <= 3 && era === state.era
    ? Math.min(discoveryCap, (state.expedition?.eraFinds || 0) * discoveryValue)
    : 0;
  const operationCredits = era === 4 && era === state.era
    ? Object.values(state.dockingMissions || {}).reduce((sum, count) => sum + (count > 0 ? 3 : 0), 0)
    : 0;
  const activityCredits = discoveryCredits + operationCredits;
  const minimumEconomicUpgrades = era <= 3
    ? Math.ceil(minUpgrades * (state.cycleDoctrine === 'reconstruction' ? 0.3 : 0.4))
    : era === 4 ? 12 : minUpgrades;
  const foundationProgress = currentUpgrades + activityCredits;
  const mastery = getEraMastery(state, era);

  return {
    minUpgrades,
    currentUpgrades,
    discoveryCredits,
    operationCredits,
    activityCredits,
    activityLabel: era <= 3 ? 'discovery' : era === 4 ? 'operation' : 'activity',
    minimumEconomicUpgrades,
    foundationProgress,
    upgradesMet: currentUpgrades >= minimumEconomicUpgrades && foundationProgress >= minUpgrades,
    minTechs,
    currentTechs,
    techsMet: currentTechs >= minTechs,
    mastery,
  };
}

// Check if state qualifies for an era transition. Returns next era number or null.
export function checkEraTransition(state) {
  if (state.era >= ERA_COUNT) return null;

  // Find tech nodes that grant the next era
  const nextEra = state.era + 1;
  const gatingTech = Object.values(techTree).find(
    t => t.grantsEra === nextEra && state.tech[t.id]
  );

  if (!gatingTech) return null;

  const readiness = getEraReadiness(state, state.era);
  if (!readiness.upgradesMet || !readiness.techsMet || !readiness.mastery.met) return null;

  return nextEra;
}

// Transition to a new era. Unlocks resources for that era.
export function transitionEra(state, newEra) {
  if (newEra <= state.era) return state;

  const newResources = { ...state.resources };

  // Unlock resources for the new era
  for (const def of Object.values(resourceDefs)) {
    if (def.era === newEra && newResources[def.id]) {
      newResources[def.id] = {
        ...newResources[def.id],
        unlocked: true,
      };
    }
  }

  // Record best era time (time to reach this era)
  const bestEraTimes = { ...(state.bestEraTimes || {}) };
  const currentTime = state.totalTime;
  if (bestEraTimes[newEra] === undefined || currentTime < bestEraTimes[newEra]) {
    bestEraTimes[newEra] = currentTime;
  }

  const expedition = state.expedition
    ? { ...state.expedition, eraFinds: 0, supplies: Math.max(1, state.expedition.supplies) }
    : state.expedition;

  return { ...state, era: newEra, resources: newResources, expedition, eraStartTime: state.totalTime, bestEraTimes };
}
