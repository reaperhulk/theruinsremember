// Economic routes are supplied by actual production. Better industry shortens
// construction; operation objectives remain an independent route through an era.
export const PUBLIC_WORKS = {
  4: { name: 'Orbital Supply Fleet', resource: 'research', cost: 25000 },
  5: { name: 'Settlement Foundries', resource: 'research', cost: 200000 },
  6: { name: 'Interstellar Survey Array', resource: 'research', cost: 1000000 },
  7: { name: 'Autonomous Sphere Architects', resource: 'research', cost: 5000000 },
  8: { name: 'Galactic Reconstruction Charter', resource: 'research', cost: 50000000 },
  9: { name: 'Cosmic Calibration Array', resource: 'cosmicPower', cost: 50000 },
  10: { name: 'Continuity Engine', resource: 'quantumEchoes', cost: 2000000 },
};
export function getPublicWorks(state, era = state.era) {
  const def = PUBLIC_WORKS[era];
  if (!def) return null;
  const delivered = state.publicWorks?.[era] || 0;
  return { ...def, delivered, progress: Math.min(1, delivered / def.cost), complete: delivered >= def.cost,
    enabled: state.autoPublicWorks !== false };
}
export function advancePublicWorks(state, economy) {
  const work = getPublicWorks(state);
  if (!work || work.complete || !work.enabled) return state;
  // Only a share of new production is earmarked; existing savings and queued
  // purchase reserves cannot be consumed by construction.
  const amount = economy.construction;
  if (amount <= 0) return state;
  const complete = work.delivered + amount >= work.cost;
  return { ...state, publicWorks: { ...state.publicWorks, [state.era]: work.delivered + amount },
    eventLog: complete ? [...state.eventLog, { time: state.totalTime, message: `${work.name} supplied. Economic mastery complete; the next era can open without operations.` }].slice(-20) : state.eventLog };
}
