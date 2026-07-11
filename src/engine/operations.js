export function getActiveSystems(state) {
  const systems = [];
  if ((state.expedition?.totalFinds || 0) > 0) systems.push('expeditions');
  if ((state.dockingAttempts || 0) > 0) systems.push('orbitalOperations');
  if (Object.values(state.colonyAssignments || {}).some(count => count > 0)) systems.push('colonies');
  if ((state.starRoutes?.length || 0) > 0) systems.push('starChart');
  if ((state.dysonSegments || 0) > 0) systems.push('dyson');
  if (Object.values(state.senate || {}).some(count => count > 0)) systems.push('senate');
  if (Object.keys(state.wovenLaws || {}).length > 0) systems.push('weaving');
  if (Object.keys(state.lockedSignals || {}).length > 0) systems.push('tuning');
  if (Object.values(state.realityKeys || {}).some(count => count > 0)) systems.push('realityForge');
  return systems;
}
