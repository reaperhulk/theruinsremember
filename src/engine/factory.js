// Factory Allocation mini-game for Era 2
// Assign workers to production lines for bonus output.
// Workers are drawn from a pool based on labor rate.

const BASE_MAX_WORKERS = 10;
const LINES = ['steel', 'electronics', 'research'];

// Max workers scales with era: min(10 + era*2, 30)
export function getMaxWorkers(state) {
  const era = state.era || 1;
  return Math.min(BASE_MAX_WORKERS + era * 2, 30);
}

// Get available worker pool (based on labor production level)
export function getWorkerPool(state) {
  const laborRate = state.resources.labor?.rateAdd || 0;
  const laborMult = state.resources.labor?.rateMult || 1;
  const maxWorkers = getMaxWorkers(state);
  const eraBonus = Math.max(0, (state.era - 2) * 2);
  return Math.min(Math.floor((laborRate * laborMult) + 2) + eraBonus, maxWorkers);
}

// Get current allocation from state
export function getAllocation(state) {
  return state.factoryAllocation || { steel: 0, electronics: 0, research: 0 };
}

// Get total workers currently assigned
export function getTotalAssigned(state) {
  const alloc = getAllocation(state);
  return LINES.reduce((sum, line) => sum + (alloc[line] || 0), 0);
}

// Assign workers to a production line.
// Returns new state or null if invalid.
export function allocateWorker(state, line, count) {
  if (!LINES.includes(line)) return null;
  if (count < 0) return null;

  const pool = getWorkerPool(state);
  const alloc = { ...getAllocation(state) };
  const currentTotal = LINES.reduce((sum, l) => sum + (l === line ? 0 : (alloc[l] || 0)), 0);

  if (currentTotal + count > pool) return null;

  alloc[line] = count;

  return {
    ...state,
    factoryAllocation: alloc,
  };
}

// Calculate production bonus from factory allocation.
// Each worker on a line gives +0.3/s to that resource.
// Efficiency bonus: when all lines have at least 1 worker, +50% output.
export function getFactoryBonus(state) {
  if (state.era < 2) return {};
  const alloc = getAllocation(state);
  const allFilled = LINES.every(line => (alloc[line] || 0) > 0);
  const efficiencyMult = allFilled ? 1.5 : 1;
  const hasFactoryExpert = state.prestigeUpgrades && state.prestigeUpgrades.factoryExpert;
  const hasSavant = state.prestigeUpgrades && state.prestigeUpgrades.miniGameSavant;
  const prestigeMult = (hasFactoryExpert ? 2 : 1) * (hasSavant ? 1.5 : 1);
  // Full capacity bonus: x2 when all worker slots used
  const totalAssigned = LINES.reduce((sum, l) => sum + (alloc[l] || 0), 0);
  const maxWorkers = getMaxWorkers(state);
  const pool = getWorkerPool(state);
  const fullCapacity = totalAssigned >= pool && pool >= 3 ? 2 : 1;
  const bonus = {};
  for (const line of LINES) {
    const workers = alloc[line] || 0;
    if (workers > 0) {
      bonus[line] = workers * 0.3 * efficiencyMult * prestigeMult * fullCapacity;
    }
  }
  return bonus;
}

// Check if efficiency bonus is active
export function hasEfficiencyBonus(state) {
  const alloc = getAllocation(state);
  return LINES.every(line => (alloc[line] || 0) > 0);
}
