// Orbital docking operation for Era 4
// Timing-based click game: hit the target zone for bonus resources.
// The docking indicator moves back and forth; click when it's in the zone.

import { getEffectiveCap, getEffectivePrestige } from './resources.js';
import { getOperationRewardMultiplier } from './cycles.js';
import { getRelicDockingZoneMultiplier, getRelicOperationMultiplier } from './relics.js';

const PERFECT_ZONE = 0.10;   // 10% center for perfect dock
const BASE_SPEED = 0.6;      // cycles per second at era 4 (~1.7s full sweep)

// Resource rewards for docking — now calculated dynamically based on production rates
const REWARD_MISS = {};
const COOLDOWN = 2; // seconds between dock attempts
export const DOCKING_CONTRACT_QUOTA = 1;

export const DOCKING_MISSIONS = {
  cargo: {
    id: 'cargo',
    name: 'Cargo Lift',
    description: 'Wide approach. Prioritizes fuel and steel deliveries.',
    zoneSize: 0.34,
    payoff: 'Complete: permanent fuel production for this run.',
  },
  crew: {
    id: 'crew',
    name: 'Crew Transfer',
    description: 'Balanced approach. Builds orbital infrastructure and returns food.',
    zoneSize: 0.26,
    payoff: 'Complete: permanent orbital production for this run.',
  },
  science: {
    id: 'science',
    name: 'Science Return',
    description: 'Narrow approach. Recovers research and precursor data.',
    zoneSize: 0.20,
    payoff: 'Complete: permanent research production for this run.',
  },
};

export function getDockingContracts(state) {
  if (state.dockingContracts?.era === state.era) return state.dockingContracts;
  return { era: state.era, cargo: 0, crew: 0, science: 0 };
}

function applyContractPayoff(resources, missionId, era) {
  const payoff = {
    cargo: { resourceId: 'rocketFuel', rateAdd: 3 * era },
    crew: { resourceId: 'orbitalInfra', rateAdd: 1.5 * era },
    science: { resourceId: 'research', rateAdd: 4 * era },
  }[missionId];
  const resource = resources[payoff.resourceId];
  if (!resource) return resources;
  return {
    ...resources,
    [payoff.resourceId]: { ...resource, rateAdd: resource.rateAdd + payoff.rateAdd },
  };
}

export const DOCKING_APPROACHES = {
  cautious: {
    id: 'cautious',
    name: 'Cautious',
    description: 'Wider capture window, but only 70% rewards.',
    zoneMult: 1.3,
    rewardMult: 0.7,
    fuelCost: 0,
  },
  standard: {
    id: 'standard',
    name: 'Standard',
    description: 'Normal capture window and rewards.',
    zoneMult: 1,
    rewardMult: 1,
    fuelCost: 0,
  },
  burn: {
    id: 'burn',
    name: 'Hard Burn',
    description: 'Spend 4 fuel for a narrow approach and 80% more rewards.',
    zoneMult: 0.72,
    rewardMult: 1.8,
    fuelCost: 4,
  },
};

export function selectDockingMission(state, missionId) {
  if (!DOCKING_MISSIONS[missionId]) return state;
  return { ...state, dockingMission: missionId };
}

export function selectDockingApproach(state, approachId) {
  if (!DOCKING_APPROACHES[approachId]) return state;
  return { ...state, dockingApproach: approachId };
}

// Calculate indicator position (0-1) based on time.
// Speed increases slightly with era for higher difficulty.
export function getIndicatorPosition(time, era = 4) {
  const speed = BASE_SPEED * (1 + (era - 4) * 0.05); // +5% per era above 4
  return (Math.sin(time * speed * Math.PI * 2) + 1) / 2;
}

// Get the target zone center (0-1). Changes each attempt.
export function getTargetZone(state) {
  const seed = (state.dockingAttempts || 0) + (state.era || 1) * 17;
  // Deterministic pseudo-random zone position between 0.2 and 0.8
  return 0.2 + ((seed * 7 + 3) % 10) / 10 * 0.6;
}

// Attempt a dock at the given position (0-1).
// Returns { state, result } where result is 'miss' | 'good' | 'perfect'.
export function attemptDock(state, position) {
  if (state.era < 4) return { state, result: 'miss' };

  // Cooldown check
  const lastDock = state.lastDockTime || 0;
  if (state.totalTime - lastDock < COOLDOWN) return { state, result: 'cooldown' };

  const zoneCenter = getTargetZone(state);
  const missionId = DOCKING_MISSIONS[state.dockingMission] ? state.dockingMission : 'cargo';
  const mission = DOCKING_MISSIONS[missionId];
  const approachId = DOCKING_APPROACHES[state.dockingApproach] ? state.dockingApproach : 'standard';
  const approach = DOCKING_APPROACHES[approachId];
  const relicZoneMult = getRelicDockingZoneMultiplier(state);
  const contracts = getDockingContracts(state);
  if ((contracts[missionId] || 0) >= DOCKING_CONTRACT_QUOTA) return { state, result: 'contractComplete' };
  if ((state.resources.rocketFuel?.amount || 0) < approach.fuelCost) return { state, result: 'insufficient' };
  const distFromCenter = Math.abs(position - zoneCenter);

  let result;

  if (distFromCenter <= PERFECT_ZONE * approach.zoneMult * relicZoneMult / 2) {
    result = 'perfect';
  } else if (distFromCenter <= mission.zoneSize * approach.zoneMult * relicZoneMult / 2) {
    result = 'good';
  } else {
    result = 'miss';
  }

  // Calculate dynamic rewards based on current production rates
  const fuelRes = state.resources?.rocketFuel;
  const fuelRate = fuelRes ? ((fuelRes.baseRate || 0) + (fuelRes.rateAdd || 0)) * (fuelRes.rateMult || 1) : 1;
  const effectiveFuelRate = Math.max(1, fuelRate); // minimum 1 so rewards are never zero
  const quality = result === 'perfect' ? 1 : result === 'good' ? 0.4 : 0;
  let rewards = REWARD_MISS;
  if (quality > 0 && missionId === 'cargo') {
    rewards = { rocketFuel: effectiveFuelRate * 18 * quality, steel: effectiveFuelRate * 4 * quality };
  }
  if (quality > 0 && missionId === 'crew') {
    rewards = { orbitalInfra: (4 + effectiveFuelRate * 0.6) * quality, food: effectiveFuelRate * 6 * quality };
  }
  if (quality > 0 && missionId === 'science') {
    rewards = { research: effectiveFuelRate * 14 * quality, data: effectiveFuelRate * 8 * quality };
  }

  // Combo: consecutive successes multiply rewards
  const combo = result !== 'miss' ? (state.dockingCombo || 0) + 1 : 0;
  const comboMult = 1 + Math.min(combo, 5) * 0.2; // max x2 at 5 combo
  const hasDockingPro = state.prestigeUpgrades && state.prestigeUpgrades.dockingPro;
  const dockPrestigeMult = hasDockingPro ? 2 : 1;
  const hasSavant = state.prestigeUpgrades && state.prestigeUpgrades.miniGameSavant;
  const savantMult = hasSavant ? 1.5 : 1;

  // Era scaling: later eras give proportionally more docking rewards
  const eraScale = Math.pow(1.5, Math.max(0, state.era - 4));

  // Apply rewards scaled by prestige, combo, and era
  let newResources = { ...state.resources };
  if (approach.fuelCost > 0) {
    newResources.rocketFuel = {
      ...newResources.rocketFuel,
      amount: newResources.rocketFuel.amount - approach.fuelCost,
    };
  }
  for (const [resourceId, amount] of Object.entries(rewards)) {
    const r = newResources[resourceId];
    if (r && r.unlocked) {
      const scaled = amount * approach.rewardMult * getRelicOperationMultiplier(state, 'docking') * getOperationRewardMultiplier(state) * getEffectivePrestige(state.prestigeMultiplier || 1) * comboMult * dockPrestigeMult * eraScale * savantMult;
      const cap = getEffectiveCap({ ...state, resources: newResources }, resourceId);
      newResources[resourceId] = { ...r, amount: cap > 0 ? Math.min(cap, r.amount + scaled) : r.amount + scaled };
    }
  }

  const contractProgress = (contracts[missionId] || 0) + (result !== 'miss' ? 1 : 0);
  const contractCompleted = result !== 'miss' && contractProgress === DOCKING_CONTRACT_QUOTA;
  if (contractCompleted) newResources = applyContractPayoff(newResources, missionId, state.era);

  const newState = {
    ...state,
    resources: newResources,
    lastDockTime: state.totalTime,
    dockingCombo: combo,
    dockingAttempts: (state.dockingAttempts || 0) + 1,
    dockingSuccesses: result !== 'miss'
      ? (state.dockingSuccesses || 0) + 1
      : (state.dockingSuccesses || 0),
    dockingPerfects: result === 'perfect'
      ? (state.dockingPerfects || 0) + 1
      : (state.dockingPerfects || 0),
    dockingMissions: {
      ...(state.dockingMissions || { cargo: 0, crew: 0, science: 0 }),
      [missionId]: (state.dockingMissions?.[missionId] || 0) + (result !== 'miss' ? 1 : 0),
    },
    dockingContracts: {
      ...contracts,
      [missionId]: contractProgress,
    },
    dockingContractsCompleted: {
      ...(state.dockingContractsCompleted || { cargo: 0, crew: 0, science: 0 }),
      [missionId]: (state.dockingContractsCompleted?.[missionId] || 0) + (contractCompleted ? 1 : 0),
    },
  };


  return {
    state: newState,
    result,
  };
}

// Get zone info for UI rendering
export function getDockingInfo(state) {
  const missionId = DOCKING_MISSIONS[state.dockingMission] ? state.dockingMission : 'cargo';
  const approachId = DOCKING_APPROACHES[state.dockingApproach] ? state.dockingApproach : 'standard';
  const approach = DOCKING_APPROACHES[approachId];
  const relicZoneMult = getRelicDockingZoneMultiplier(state);
  const contracts = getDockingContracts(state);
  return {
    zoneCenter: getTargetZone(state),
    zoneSize: DOCKING_MISSIONS[missionId].zoneSize * approach.zoneMult * relicZoneMult,
    perfectSize: PERFECT_ZONE * approach.zoneMult * relicZoneMult,
    missionId,
    approachId,
    missions: state.dockingMissions || { cargo: 0, crew: 0, science: 0 },
    contracts,
    contractQuota: DOCKING_CONTRACT_QUOTA,
    contractComplete: (contracts[missionId] || 0) >= DOCKING_CONTRACT_QUOTA,
    attempts: state.dockingAttempts || 0,
    successes: state.dockingSuccesses || 0,
    perfects: state.dockingPerfects || 0,
  };
}
