import { getAvailableProjects, getProjectCost, getProjectStatus } from './projects.js';
import { canAfford, getEffectiveCap } from './resources.js';
import { projects } from '../data/projects.js';
import { resources as resourceDefinitions } from '../data/resources.js';

export const SUPPLY_GRID_SIZE = 5;
export const SUPPLY_STEP_BUDGET = 12;
export const SUPPLY_RUN_COOLDOWN = 90;
export const SUPPLY_RUN_NAMES = ['The Crash Basin', 'Buried Conduits', 'The Ghost Network', 'Orbital Debris', 'The Broken Convoy', 'Dark-Space Relays', 'The Hollow Sphere', 'The Lost Hyperlane', 'The Fractured Constant', 'The Unfinished Timeline'];

export function createSupplyRun() {
  return { phase: 'idle', wins: 0, cooldownUntil: 0, projectId: null, board: null, caches: [], path: [0], missing: {}, result: null };
}
export function getSupplyRunTarget(state) {
  const committed = state.goals?.find(goal => goal.kind === 'project' && getProjectStatus(state, goal.id) === 'ready' && !canAfford(state, getProjectCost(state, goal.id)));
  return committed?.id || getAvailableProjects(state).find(project => !(state.era === 1 && project.id === 'tools') && !canAfford(state, getProjectCost(state, project.id)))?.id || null;
}
export function supplyNeighbors(index) {
  const x = index % SUPPLY_GRID_SIZE, y = Math.floor(index / SUPPLY_GRID_SIZE);
  return [[x + 1, y], [x, y + 1], [x - 1, y], [x, y - 1]].filter(([nx, ny]) => nx >= 0 && ny >= 0 && nx < SUPPLY_GRID_SIZE && ny < SUPPLY_GRID_SIZE).map(([nx, ny]) => ny * SUPPLY_GRID_SIZE + nx);
}
export function createSupplyBoard(seed) {
  let cursor = seed >>> 0;
  const random = () => { cursor = (Math.imul(cursor, 1664525) + 1013904223) >>> 0; return cursor / 4294967296; };
  const exit = SUPPLY_GRID_SIZE ** 2 - 1;
  const distance = index => 2 * (SUPPLY_GRID_SIZE - 1) - index % SUPPLY_GRID_SIZE - Math.floor(index / SUPPLY_GRID_SIZE);
  const search = path => {
    const current = path.at(-1);
    if (current === exit) return path;
    const neighbors = supplyNeighbors(current).filter(index => !path.includes(index) && path.length + distance(index) <= SUPPLY_STEP_BUDGET)
      .map(index => ({ index, rank: random() })).sort((a, b) => a.rank - b.rank);
    for (const { index } of neighbors) { const solution = search([...path, index]); if (solution) return solution; }
    return null;
  };
  const direct = [0];
  while (direct.at(-1) !== exit) {
    const next = supplyNeighbors(direct.at(-1)).filter(index => distance(index) < distance(direct.at(-1)));
    direct.push(next[Math.floor(random() * next.length)]);
  }
  const manhattan = (a, b) => Math.abs(a % SUPPLY_GRID_SIZE - b % SUPPLY_GRID_SIZE) + Math.abs(Math.floor(a / SUPPLY_GRID_SIZE) - Math.floor(b / SUPPLY_GRID_SIZE));
  let path, caches;
  for (let attempt = 0; attempt < 64 && !caches; attempt++) {
    path = search([0]);
    const detours = path.filter(index => !direct.includes(index));
    for (const a of detours) for (const b of detours) {
      // Both caches must actually cost extra steps, even on an empty board.
      if (a !== b && Math.min(manhattan(0, a) + manhattan(a, b) + manhattan(b, exit), manhattan(0, b) + manhattan(b, a) + manhattan(a, exit)) > 8) caches = [a, b];
    }
  }
  if (!caches) {
    direct.splice(0, direct.length, 0, 5, 10, 15, 20, 21, 22, 23, 24);
    path = [0, 1, 2, 7, 6, 11, 16, 17, 18, 19, 24];
    caches = [2, 16];
  }
  const board = Array.from({ length: SUPPLY_GRID_SIZE ** 2 }, (_, index) => !path.includes(index) && !direct.includes(index) && random() < 0.3);
  return { board, caches };
}
export function startSupplyRun(state, projectId = getSupplyRunTarget(state)) {
  const previous = state.supplyRun || createSupplyRun();
  if (previous.phase === 'active' || state.totalTime < previous.cooldownUntil || getProjectStatus(state, projectId) !== 'ready') return state;
  const cost = getProjectCost(state, projectId);
  const missing = Object.fromEntries(Object.entries(cost).map(([id, amount]) => [id, Math.max(0, amount - state.resources[id].amount)]).filter(([, amount]) => amount > 0));
  if (!Object.keys(missing).length) return state;
  const seed = Math.floor(state.totalTime) + state.era * 7919 + state.prestigeCount * 104729 + previous.wins * 15485863;
  return { ...state, supplyRun: { ...previous, ...createSupplyBoard(seed), phase: 'active', projectId, era: state.era, missing, path: [0], result: null } };
}
export function isSupplyPath(run, path) {
  if (!run.board || !Array.isArray(path) || path[0] !== 0 || path.length > SUPPLY_STEP_BUDGET + 1 || new Set(path).size !== path.length) return false;
  return path.every((index, i) => Number.isInteger(index) && index >= 0 && index < run.board.length && !run.board[index] && (!i || supplyNeighbors(path[i - 1]).includes(index)));
}
export function extendSupplyPath(run, path, index) {
  if (index === path.at(-2)) return path.slice(0, -1);
  const next = [...path, index];
  return isSupplyPath(run, next) ? next : path;
}
export function submitSupplyRoute(state, path) {
  const run = state.supplyRun;
  if (!run || run.phase !== 'active' || !isSupplyPath(run, path)) return state;
  if (path.at(-1) !== SUPPLY_GRID_SIZE ** 2 - 1) return path.length === run.path.length && path.every((index, i) => index === run.path[i]) ? state : { ...state, supplyRun: { ...run, path } };
  const caches = run.caches.filter(index => path.includes(index)).length;
  const fraction = 0.2 + caches * 0.1;
  const resources = { ...state.resources }, rewards = {};
  for (const [id, missing] of Object.entries(run.missing)) {
    const resource = resources[id];
    if (!resource?.unlocked) continue;
    const cap = getEffectiveCap(state, id);
    const amount = Math.min(Math.ceil(missing * fraction), cap > 0 ? Math.max(0, cap - resource.amount) : Infinity);
    if (amount > 0) { rewards[id] = amount; resources[id] = { ...resource, amount: resource.amount + amount }; }
  }
  return { ...state, resources, supplyRun: { ...run, path, phase: 'complete', wins: run.wins + 1, cooldownUntil: state.totalTime + SUPPLY_RUN_COOLDOWN, result: { rewards, caches, fraction } } };
}
export function abandonSupplyRun(state) {
  return state.supplyRun?.phase === 'active' ? { ...state, supplyRun: { ...createSupplyRun(), wins: state.supplyRun.wins, cooldownUntil: state.supplyRun.cooldownUntil } } : state;
}

export function isValidSupplyRun(run) {
  const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  const amounts = value => object(value) && Object.entries(value).every(([id, amount]) => Object.hasOwn(resourceDefinitions, id) && Number.isFinite(amount) && amount >= 0);
  if (!object(run) || !['idle', 'active', 'complete'].includes(run.phase) || !Number.isSafeInteger(run.wins) || run.wins < 0 || !Number.isFinite(run.cooldownUntil) || run.cooldownUntil < 0) return false;
  if (run.phase === 'idle') return run.board === null && run.projectId === null && run.result === null && Array.isArray(run.caches) && run.caches.length === 0 && Array.isArray(run.path) && run.path.length === 1 && run.path[0] === 0 && amounts(run.missing) && Object.keys(run.missing).length === 0;
  if (!Object.hasOwn(projects, run.projectId) || !Number.isInteger(run.era) || run.era < projects[run.projectId].era || run.era > 10 || !Array.isArray(run.board) || run.board.length !== SUPPLY_GRID_SIZE ** 2 || !run.board.every(value => typeof value === 'boolean') || run.board[0] || run.board.at(-1)) return false;
  if (!Array.isArray(run.caches) || run.caches.length !== 2 || new Set(run.caches).size !== 2 || !run.caches.every(index => Number.isInteger(index) && index > 0 && index < run.board.length - 1 && !run.board[index]) || !isSupplyPath(run, run.path) || !amounts(run.missing)) return false;
  if (run.phase === 'complete') return run.path.at(-1) === run.board.length - 1 && object(run.result) && amounts(run.result.rewards) && run.result.caches === run.caches.filter(index => run.path.includes(index)).length && Math.abs(run.result.fraction - (0.2 + run.result.caches * 0.1)) < 1e-9;
  return run.result === null;
}
