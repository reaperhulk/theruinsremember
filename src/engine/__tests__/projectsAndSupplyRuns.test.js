import { describe, expect, it } from 'vitest';
import { projects, componentProject } from '../../data/projects.js';
import { upgrades } from '../../data/upgrades.js';
import { createInitialState } from '../state.js';
import { getProjectCost, purchaseProject, isProjectComplete, getProjectStatus } from '../projects.js';
import { queueGoal, advanceGoal } from '../goals.js';
import { advanceDevelopment } from '../development.js';
import { estimateAffordability } from '../economy.js';
import { advanceTime } from '../advanceTime.js';
import { parseSave, serializeSave } from '../saves.js';
import { performPrestige } from '../prestige.js';
import { createSupplyBoard, startSupplyRun, submitSupplyRoute, isSupplyPath, extendSupplyPath, supplyNeighbors, SUPPLY_STEP_BUDGET } from '../supplyRun.js';
import { solveSupplyBoard } from '../../../scripts/supply-run-policy.mjs';

describe('sixty substantial construction projects', () => {
  it('covers all retired production upgrades exactly once without absorbing player choices', () => {
    expect(Object.keys(projects)).toHaveLength(60);
    for (let era = 1; era <= 10; era++) expect(Object.values(projects).filter(project => project.era === era)).toHaveLength(6);
    const members = Object.values(projects).flatMap(project => project.members);
    expect(new Set(members).size).toBe(members.length);
    expect(members.sort()).toEqual(Object.values(upgrades).filter(upgrade => !upgrade.exclusiveWith && !upgrade.repeatable).map(upgrade => upgrade.id).sort());
    const visiting = new Set(), visited = new Set();
    const visit = id => {
      if (visited.has(id)) return;
      expect(visiting.has(id), `${id} must not depend on itself through another project`).toBe(false);
      visiting.add(id);
      for (const prerequisite of projects[id].prerequisites) if (componentProject[prerequisite]) visit(componentProject[prerequisite]);
      visiting.delete(id); visited.add(id);
    };
    Object.keys(projects).forEach(visit);
  });
  it('pays once for the whole project, applies its missing effects once, and gives old saves credit', () => {
    let state = createInitialState();
    state.upgrades.tools = true;
    state.upgrades.housing = true; // A partly built legacy settlement.
    state.resources.labor.rateAdd = 1;
    const cost = getProjectCost(state, 'housing');
    const freshCost = getProjectCost({ ...state, upgrades: { tools: true } }, 'housing');
    expect(cost.materials).toBeLessThan(freshCost.materials);
    for (const [id, amount] of Object.entries(cost)) state.resources[id].amount = amount;
    const before = structuredClone(state);
    const built = purchaseProject(state, 'housing');
    expect(isProjectComplete(built, 'housing')).toBe(true);
    expect(built.runUpgradePurchases).toBe(1);
    expect(built.resources.materials.amount).toBe(0);
    expect(purchaseProject(built, 'housing')).toBeNull();
    expect(state).toEqual(before);
    expect(Object.keys(built.upgrades).filter(id => upgrades[id].exclusiveWith)).toEqual([]);
  });
  it('reserves a project, preserves legacy queued intent on load, and can complete without the activity', () => {
    let state = createInitialState();
    state.upgrades.tools = true;
    state.goals = [{ kind: 'upgrade', id: 'housing' }, { kind: 'upgrade', id: projects.housing.members.find(id => id !== 'housing') }];
    state = parseSave(JSON.stringify(state));
    expect(state.goals).toEqual([{ kind: 'project', id: 'housing' }]);
    const cost = getProjectCost(state, 'housing');
    for (const [id, amount] of Object.entries(cost)) state.resources[id].amount = amount;
    state = advanceGoal(advanceDevelopment(state));
    expect(isProjectComplete(state, 'housing')).toBe(true);
    expect(advanceTime(createInitialState(), 900, () => 0.5).upgrades.foundry).toBe(true);
  });
});

describe('optional supply-route challenges', () => {
  function waitingForHousing() {
    let state = { ...createInitialState(), autoBuildOut: false, protectProgression: false };
    state.upgrades.tools = true;
    const cost = getProjectCost(state, 'housing');
    for (const [id, amount] of Object.entries(cost)) state.resources[id].amount = amount;
    state.resources.labor.amount = 0;
    state = queueGoal(state, 'project', 'housing');
    expect(getProjectStatus(state, 'housing')).toBe('ready');
    return state;
  }
  it('generates solvable boards with a route through both caches in every era', () => {
    for (let era = 1; era <= 10; era++) for (let seed = 0; seed < 10; seed++) {
      const board = createSupplyBoard(era * 7919 + seed);
      const path = solveSupplyBoard(board);
      expect(isSupplyPath(board, path)).toBe(true);
      expect(path.length).toBeLessThanOrEqual(SUPPLY_STEP_BUDGET + 1);
      expect(board.caches.every(index => path.includes(index))).toBe(true);
      expect(path.length).toBeGreaterThan(9); // Bonus cargo requires a real detour.
      const queue = [[0]];
      let direct;
      while (queue.length && !direct) {
        const route = queue.shift();
        if (route.at(-1) === 24) { direct = route; break; }
        if (route.length >= 9) continue;
        for (const next of supplyNeighbors(route.at(-1))) if (!board.board[next] && !board.caches.includes(next) && !route.includes(next)) queue.push([...route, next]);
      }
      expect(direct).toHaveLength(9); // An eight-step, lower-reward route is always available.
    }
  });
  it('a thoughtful detour funds more supplies and measurably shortens the chosen project wait', () => {
    const state = waitingForHousing();
    const cost = getProjectCost(state, 'housing');
    const before = estimateAffordability(state, cost).seconds;
    const active = startSupplyRun(state, 'housing');
    expect(active.resources).toBe(state.resources);
    const route = solveSupplyBoard(active.supplyRun);
    const result = submitSupplyRoute(active, route);
    expect(result.supplyRun.result.caches).toBe(2);
    expect(result.supplyRun.result.fraction).toBeCloseTo(0.4);
    expect(result.resources.labor.amount).toBe(Math.ceil(cost.labor * 0.4));
    expect(estimateAffordability(result, cost).seconds).toBeLessThan(before * 0.65);
    expect(purchaseProject(result, 'housing')).toBeNull(); // Success accelerates construction, never grants it for free.
    expect(submitSupplyRoute(result, route)).toBe(result);
    expect(startSupplyRun(result, 'housing')).toBe(result);
  });
  it('rejects teleporting, revisiting caches, walls and over-budget routes; backtracking is reversible', () => {
    const state = startSupplyRun(waitingForHousing(), 'housing');
    expect(submitSupplyRoute(state, [0, 24])).toBe(state);
    expect(submitSupplyRoute(state, [0, 1, 0, 1, 24])).toBe(state);
    const solution = solveSupplyBoard(state.supplyRun);
    expect(extendSupplyPath(state.supplyRun, solution.slice(0, 3), solution[1])).toEqual(solution.slice(0, 2));
    expect(submitSupplyRoute(state, [...solution, 24])).toBe(state);
  });
  it('saves a partial route, grants no rewards while absent, and clears the run at prestige', () => {
    let state = startSupplyRun(waitingForHousing(), 'housing');
    const route = solveSupplyBoard(state.supplyRun);
    state = submitSupplyRoute(state, route.slice(0, 4));
    state = parseSave(serializeSave(state));
    expect(state.supplyRun.path).toEqual(route.slice(0, 4));
    const after = advanceTime(state, 600, () => 0.5, 60, { pauseForgetting: true });
    expect(after.supplyRun).toEqual(state.supplyRun);
    expect(submitSupplyRoute(after, route).supplyRun.wins).toBe(1);
    expect(performPrestige(after).supplyRun.phase).toBe('idle');
    expect(() => parseSave(JSON.stringify({ ...state, supplyRun: { ...state.supplyRun, path: [0, 24] } }))).toThrow('supply route');
    expect(() => parseSave(JSON.stringify({ ...state, supplyRun: { ...state.supplyRun, missing: { labor: -100 } } }))).toThrow('supply route');
  });
});
