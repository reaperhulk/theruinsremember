export const CYCLE_DOCTRINES = {
  reconstruction: {
    id: 'reconstruction',
    name: 'Reconstruction',
    description: 'Eras 1-3 produce 35% faster. Recover 8 expedition discoveries this cycle.',
    eraRange: 'Eras 1-3',
  },
  expansion: {
    id: 'expansion',
    name: 'Expansion',
    description: 'Eras 4-7 produce 30% faster. Build 20 points of orbital and stellar infrastructure.',
    eraRange: 'Eras 4-7',
  },
  transcendence: {
    id: 'transcendence',
    name: 'Transcendence',
    description: 'Eras 8-10 produce 30% faster. Stabilize 75 points of late-reality operations.',
    eraRange: 'Eras 8-10',
  },
};

export function selectNextCycleDoctrine(state, doctrineId) {
  if (state.era < 10 || !CYCLE_DOCTRINES[doctrineId]) return state;
  return { ...state, nextCycleDoctrine: doctrineId };
}

export function getCycleProductionMultiplier(state) {
  let multiplier = 1 + (state.cycleMarks || 0) * 0.01;
  if (state.cycleDoctrine === 'reconstruction' && state.era <= 3) multiplier *= 1.35;
  if (state.cycleDoctrine === 'expansion' && state.era >= 4 && state.era <= 7) multiplier *= 1.3;
  if (state.cycleDoctrine === 'transcendence' && state.era >= 8) multiplier *= 1.3;
  if (state.cycleDoctrine && state.echoUpgrades?.echoResonanceLock) multiplier *= 1.1;
  return multiplier;
}

export function getOperationRewardMultiplier(state) {
  const causalBonus = 1 + (state.realityKeys?.causal || 0) * 0.1;
  const doctrineBonus = state.cycleDoctrine === 'expansion' ? 1.2 : 1;
  return causalBonus * doctrineBonus;
}

export function getCycleGoal(state) {
  if (state.cycleDoctrine === 'reconstruction') {
    const current = state.expedition?.totalFinds || 0;
    return { id: 'reconstruction', label: 'Recover expedition discoveries', current, target: 8, complete: current >= 8 };
  }
  if (state.cycleDoctrine === 'expansion') {
    const missions = Object.values(state.dockingMissions || {}).reduce((sum, count) => sum + count, 0);
    const routes = state.starRoutes?.length || 0;
    const colonies = Object.values(state.colonyAssignments || {}).filter(count => count > 0).length;
    const current = missions + routes + colonies;
    return { id: 'expansion', label: 'Build mission, colony, and route infrastructure', current, target: 20, complete: current >= 20 };
  }
  if (state.cycleDoctrine === 'transcendence') {
    const keys = Object.values(state.realityKeys || {}).reduce((sum, count) => sum + count, 0);
    const current = (state.totalWeaves || 0) * 5 + (state.tuningScore || 0) + keys * 10;
    return { id: 'transcendence', label: 'Stabilize late-reality operations', current, target: 75, complete: current >= 75 };
  }
  return null;
}

export function awardCycleGoal(state) {
  if (state.cycleGoalRewarded) return state;
  const goal = getCycleGoal(state);
  if (!goal?.complete) return state;
  return {
    ...state,
    cycleGoalRewarded: true,
    cycleMarks: (state.cycleMarks || 0) + 1,
    prestigePoints: (state.prestigePoints || 0) + 4,
    eventLog: [...(state.eventLog || []), {
      message: `Cycle doctrine complete: ${CYCLE_DOCTRINES[state.cycleDoctrine].name}. +1 cycle mark, +4 prestige points.`,
      time: state.totalTime,
    }].slice(-20),
  };
}
