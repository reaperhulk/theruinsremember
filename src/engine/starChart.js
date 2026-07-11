// Star Chart operation for Eras 6-10
import { getOperationRewardMultiplier } from './cycles.js';
import { getRelicOperationMultiplier, getRelicRouteCostMultiplier } from './relics.js';
// Connect star systems to form trade routes for bonus production.
// Each route connects two systems and gives production bonuses.
// Max routes limited by star systems owned.

const MAX_ROUTES = 10;
const ROUTE_COST = { darkEnergy: 5, starSystems: 1 };

export const STAR_DIRECTIVES = {
  throughput: { id: 'throughput', name: 'Throughput', description: '+30% route output from every connected system.' },
  discovery: { id: 'discovery', name: 'Discovery', description: 'Routes add research and data, but base route output falls 10%.' },
  frontier: { id: 'frontier', name: 'Frontier', description: 'Long routes gain another 60%; short routes lose 20%.' },
};

export const STAR_DIRECTIVE_DURATION = 120;

export function selectStarDirective(state, directiveId) {
  if (!STAR_DIRECTIVES[directiveId]) return state;
  const lastChange = state.lastStarDirectiveTime;
  if (lastChange !== undefined && state.totalTime - lastChange < STAR_DIRECTIVE_DURATION) return state;
  return { ...state, starDirective: directiveId, lastStarDirectiveTime: state.totalTime };
}

export function getStarDirectiveInfo(state) {
  const directive = STAR_DIRECTIVES[state.starDirective] || null;
  const elapsed = state.totalTime - (state.lastStarDirectiveTime ?? -STAR_DIRECTIVE_DURATION);
  return { directive, cooldown: Math.max(0, STAR_DIRECTIVE_DURATION - elapsed) };
}

// Network plans: one strategic commitment that lays the network for you.
// Survey crews add one planned route every ROUTE_LAY_INTERVAL seconds
// (paying normal route costs) until the chart is full. Manual routes on the
// map remain available for hand-tuning.
export const ROUTE_LAY_INTERVAL = 6;

export const NETWORK_PLANS = {
  coreWeb: {
    id: 'coreWeb',
    name: 'Core Web',
    description: 'Dense central hubs. Every system feeds the web. Strongest with Throughput.',
  },
  longHaul: {
    id: 'longHaul',
    name: 'Long Haul',
    description: 'The longest crossings first. Distance pays. Strongest with Frontier.',
  },
  surveyLattice: {
    id: 'surveyLattice',
    name: 'Survey Lattice',
    description: 'Touch every system before doubling up. Strongest with Discovery.',
  },
};

export function selectNetworkPlan(state, planId) {
  if (state.era < 6 || !NETWORK_PLANS[planId]) return state;
  const lastChange = state.lastNetworkPlanTime;
  if (lastChange !== undefined && state.totalTime - lastChange < STAR_DIRECTIVE_DURATION) return state;
  return { ...state, networkPlan: planId, lastNetworkPlanTime: state.totalTime };
}

export function getNetworkPlanInfo(state) {
  const plan = NETWORK_PLANS[state.networkPlan] || null;
  const elapsed = state.totalTime - (state.lastNetworkPlanTime ?? -STAR_DIRECTIVE_DURATION);
  return { plan, cooldown: Math.max(0, STAR_DIRECTIVE_DURATION - elapsed) };
}

function countConnections(routes) {
  const connections = {};
  for (const route of routes) {
    connections[route.from] = (connections[route.from] || 0) + 1;
    connections[route.to] = (connections[route.to] || 0) + 1;
  }
  return connections;
}

function planScore(planId, fromSys, toSys, connections) {
  const dist = getRouteDistance(fromSys, toSys);
  const linked = (connections[fromSys.id] || 0) + (connections[toSys.id] || 0);
  return planId === 'longHaul' ? dist
    : planId === 'coreWeb' ? linked * 10 - dist
      : -linked * 10 + dist; // surveyLattice: unconnected systems first, far reaches preferred
}

function bestCandidateRoute(state, systems, connections, requireFrontier) {
  let best = null;
  let bestScore = -Infinity;
  for (let i = 0; i < systems.length; i++) {
    for (let j = i + 1; j < systems.length; j++) {
      const from = systems[i];
      const to = systems[j];
      if (routeExists(state, from.id, to.id)) continue;
      if (requireFrontier && (connections[from.id] || 0) > 0 && (connections[to.id] || 0) > 0) continue;
      const score = planScore(state.networkPlan, from, to, connections);
      if (score > bestScore) {
        bestScore = score;
        best = { from: from.id, to: to.id };
      }
    }
  }
  return best;
}

// The next route the active plan would lay, or null when the chart is full,
// no plan is set, or no candidate pair remains.
export function getNextPlannedRoute(state) {
  if (!NETWORK_PLANS[state.networkPlan] || getRoutes(state).length >= MAX_ROUTES) return null;
  const systems = getUnlockedSystems(state);
  return bestCandidateRoute(state, systems, countConnections(getRoutes(state)), false);
}

// When the chart is full but a newly charted system sits unconnected, crews
// re-lay the least valuable interior route toward the frontier. Removals only
// touch routes whose endpoints keep other connections, so connected systems
// never drop off the network and the process terminates.
function rerouteTowardFrontier(state) {
  if (!NETWORK_PLANS[state.networkPlan]) return null;
  const systems = getUnlockedSystems(state);
  const routes = getRoutes(state);
  const connections = countConnections(routes);
  const frontier = bestCandidateRoute(state, systems, connections, true);
  if (!frontier) return null;

  const interior = routes.filter(route =>
    (connections[route.from] || 0) >= 2 && (connections[route.to] || 0) >= 2);
  if (interior.length === 0) return null;
  const systemById = id => systems.find(system => system.id === id) || { id, x: 0.5, y: 0.5 };
  const worst = interior.reduce((lowest, route) =>
    planScore(state.networkPlan, systemById(route.from), systemById(route.to), connections)
      < planScore(state.networkPlan, systemById(lowest.from), systemById(lowest.to), connections) ? route : lowest);

  return createRoute(removeRoute(state, worst.from, worst.to), frontier.from, frontier.to);
}

// Lay or re-lay one planned route per interval crossing, paying normal costs.
export function advanceNetworkPlan(state, previousTime) {
  if (state.era < 6 || !state.networkPlan) return state;
  const interval = ROUTE_LAY_INTERVAL * (state.prestigeUpgrades?.perfectMemory ? 0.5 : 1);
  const crossings = Math.floor(state.totalTime / interval) - Math.floor(previousTime / interval);
  let updated = state;
  for (let run = 0; run < crossings; run++) {
    const next = getNextPlannedRoute(updated);
    if (next) {
      const result = createRoute(updated, next.from, next.to);
      if (!result) break;
      updated = result;
      continue;
    }
    const rerouted = rerouteTowardFrontier(updated);
    if (!rerouted) break;
    updated = rerouted;
  }
  return updated;
}

// Available star system nodes (unlocked progressively)
export const STAR_SYSTEMS = [
  { id: 'sol', name: 'Sol', x: 0.5, y: 0.5, bonus: { energy: 10 } },
  { id: 'alpha', name: 'Alpha Centauri', x: 0.3, y: 0.3, bonus: { research: 5 } },
  { id: 'sirius', name: 'Sirius', x: 0.7, y: 0.2, bonus: { materials: 20 } },
  { id: 'vega', name: 'Vega', x: 0.2, y: 0.7, bonus: { electronics: 5 } },
  { id: 'polaris', name: 'Polaris', x: 0.8, y: 0.6, bonus: { exoticMaterials: 2 } },
  { id: 'betelgeuse', name: 'Betelgeuse', x: 0.4, y: 0.1, bonus: { stellarForge: 1 } },
  { id: 'rigel', name: 'Rigel', x: 0.6, y: 0.8, bonus: { darkEnergy: 3 } },
  { id: 'antares', name: 'Antares', x: 0.1, y: 0.4, bonus: { megastructures: 0.2 } },
  { id: 'proxima', name: 'Proxima', x: 0.9, y: 0.3, bonus: { colonies: 0.5 } },
  { id: 'capella', name: 'Capella', x: 0.3, y: 0.9, bonus: { food: 15 } },
  { id: 'deneb', name: 'Deneb', x: 0.7, y: 0.4, bonus: { cosmicPower: 1 } },
  { id: 'altair', name: 'Altair', x: 0.5, y: 0.1, bonus: { exoticMatter: 1 } },
];

// Get unlocked star systems based on starSystems resource
export function getUnlockedSystems(state) {
  const amount = state.resources.starSystems?.amount || 0;
  const count = Math.min(Math.floor(amount / 3) + 2, STAR_SYSTEMS.length);
  return STAR_SYSTEMS.slice(0, count);
}

// Get current routes
export function getRoutes(state) {
  return state.starRoutes || [];
}

// Check if a route already exists between two systems
export function routeExists(state, fromId, toId) {
  const routes = getRoutes(state);
  return routes.some(r =>
    (r.from === fromId && r.to === toId) ||
    (r.from === toId && r.to === fromId)
  );
}

// Create a route between two star systems.
// Costs darkEnergy and starSystems. Returns new state or null.
export function createRoute(state, fromId, toId) {
  if (state.era < 6) return null;
  if (fromId === toId) return null;

  const systems = getUnlockedSystems(state);
  const fromSys = systems.find(s => s.id === fromId);
  const toSys = systems.find(s => s.id === toId);
  if (!fromSys || !toSys) return null;

  if (routeExists(state, fromId, toId)) return null;
  if (getRoutes(state).length >= MAX_ROUTES) return null;

  // Check cost
  for (const [resourceId, amount] of Object.entries(ROUTE_COST)) {
    const scaledAmount = amount * getRelicRouteCostMultiplier(state);
    const r = state.resources[resourceId];
    if (!r || r.amount < scaledAmount) return null;
  }

  // Spend cost
  const newResources = { ...state.resources };
  for (const [resourceId, amount] of Object.entries(ROUTE_COST)) {
    const scaledAmount = amount * getRelicRouteCostMultiplier(state);
    newResources[resourceId] = {
      ...newResources[resourceId],
      amount: newResources[resourceId].amount - scaledAmount,
    };
  }

  const newRoute = { from: fromId, to: toId };

  return {
    ...state,
    resources: newResources,
    starRoutes: [...getRoutes(state), newRoute],
  };
}

// Remove a route. Returns new state.
export function removeRoute(state, fromId, toId) {
  const routes = getRoutes(state);
  const filtered = routes.filter(r =>
    !((r.from === fromId && r.to === toId) || (r.from === toId && r.to === fromId))
  );
  return { ...state, starRoutes: filtered };
}

// Calculate distance between two systems for route quality
function getRouteDistance(fromSys, toSys) {
  const dx = fromSys.x - toSys.x;
  const dy = fromSys.y - toSys.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// Calculate production bonus from all routes.
// Each route gives bonuses based on connected systems.
// Longer routes give more bonus (distance multiplier).
// Network bonus: each system connected to 2+ routes gets +50%.
export function getRouteBonus(state) {
  if (state.era < 6) return {};
  const routes = getRoutes(state);
  const bonus = {};
  const hasSavant = state.prestigeUpgrades && state.prestigeUpgrades.miniGameSavant;
  const savantMult = hasSavant ? 1.5 : 1;
  const operationMult = getOperationRewardMultiplier(state);
  const relicMult = getRelicOperationMultiplier(state, 'starChart');
  const directive = state.starDirective || 'throughput';

  // Count connections per system for network bonus
  const connections = {};
  for (const route of routes) {
    connections[route.from] = (connections[route.from] || 0) + 1;
    connections[route.to] = (connections[route.to] || 0) + 1;
  }

  for (const route of routes) {
    const fromSys = STAR_SYSTEMS.find(s => s.id === route.from);
    const toSys = STAR_SYSTEMS.find(s => s.id === route.to);
    if (!fromSys || !toSys) continue;
    if (state.forgetting?.scars?.[`system:${route.from}`] || state.forgetting?.scars?.[`system:${route.to}`]) continue; // consumed

    // Distance multiplier: longer routes = better (1x to 2x)
    const dist = getRouteDistance(fromSys, toSys);
    const distMult = 1 + dist;
    const directiveMult = directive === 'throughput'
      ? 1.3
      : directive === 'discovery'
        ? 0.9
        : dist >= 0.5 ? 1.6 : 0.8;

    // Network bonus: systems with 2+ connections get +50%
    const fromNetBonus = (connections[route.from] || 0) >= 2 ? 1.5 : 1;
    const toNetBonus = (connections[route.to] || 0) >= 2 ? 1.5 : 1;
    const networkMult = (fromNetBonus + toNetBonus) / 2;

    // Combine bonuses from both systems
    const combined = { ...fromSys.bonus };
    for (const [resource, amount] of Object.entries(toSys.bonus)) {
      combined[resource] = (combined[resource] || 0) + amount;
    }

    // Each route gives half the combined bonus, scaled by distance, network, and resource multiplier
    for (const [resource, amount] of Object.entries(combined)) {
      const r = state.resources[resource];
      const resourceMult = r ? (r.rateMult || 1) : 1;
      bonus[resource] = (bonus[resource] || 0) + amount * 0.5 * distMult * networkMult * directiveMult * resourceMult * savantMult * operationMult * relicMult;
    }
    if (directive === 'discovery') {
      bonus.research = (bonus.research || 0) + 2 * distMult * networkMult * savantMult * operationMult * relicMult;
      bonus.data = (bonus.data || 0) + distMult * networkMult * savantMult * operationMult * relicMult;
    }
  }

  return bonus;
}

// Get route stats for display
export function getRouteStats(state) {
  const routes = getRoutes(state);
  const connections = {};
  for (const route of routes) {
    connections[route.from] = (connections[route.from] || 0) + 1;
    connections[route.to] = (connections[route.to] || 0) + 1;
  }
  const hubSystems = Object.values(connections).filter(c => c >= 2).length;
  const connectedSystems = Object.keys(connections).length;
  const totalSystems = getUnlockedSystems(state).length;
  const allConnected = connectedSystems >= totalSystems && totalSystems >= 4;
  return { routes: routes.length, hubSystems, connectedSystems, totalSystems, allConnected };
}
