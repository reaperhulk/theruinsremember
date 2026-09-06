// Uses only the board, cargo markers and step budget visible to the player.
import { SUPPLY_STEP_BUDGET, supplyNeighbors } from '../src/engine/supplyRun.js';
export function solveSupplyBoard(run) {
  let best = null, bestCargo = -1;
  const visit = path => {
    const current = path.at(-1);
    if (current === run.board.length - 1) {
      const cargo = run.caches.filter(index => path.includes(index)).length;
      if (cargo > bestCargo) { best = path; bestCargo = cargo; }
      return bestCargo === run.caches.length;
    }
    if (path.length > SUPPLY_STEP_BUDGET) return false;
    for (const next of supplyNeighbors(current)) {
      if (!run.board[next] && !path.includes(next) && visit([...path, next])) return true;
    }
    return false;
  };
  visit([0]);
  return best;
}
