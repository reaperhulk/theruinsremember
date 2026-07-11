// Persistent state: Embers, meta upgrades, records. The round lives inside.

export function createInitialState() {
  return {
    embers: 0,
    meta: {},          // { [metaUpgradeId]: true }
    bestNights: 0,
    totalRounds: 0,
    lastRound: null,   // { nights, embers } from the most recent fall
    round: null,
  };
}
