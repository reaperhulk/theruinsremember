// Star Chart mini-game for Eras 6-7
// Connect star systems to form trade routes for bonus production.
// Each route connects two systems and gives production bonuses.
// Max routes limited by star systems owned.

const MAX_ROUTES = 10;
const ROUTE_COST = { darkEnergy: 5, starSystems: 1 };

// Available star system nodes (unlocked progressively)
const STAR_SYSTEMS = [
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
    const r = state.resources[resourceId];
    if (!r || r.amount < amount) return null;
  }

  // Spend cost
  const newResources = { ...state.resources };
  for (const [resourceId, amount] of Object.entries(ROUTE_COST)) {
    newResources[resourceId] = {
      ...newResources[resourceId],
      amount: newResources[resourceId].amount - amount,
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

    // Distance multiplier: longer routes = better (1x to 2x)
    const dist = getRouteDistance(fromSys, toSys);
    const distMult = 1 + dist;

    // Network bonus: systems with 2+ connections get +50%
    const fromNetBonus = (connections[route.from] || 0) >= 2 ? 1.5 : 1;
    const toNetBonus = (connections[route.to] || 0) >= 2 ? 1.5 : 1;
    const networkMult = (fromNetBonus + toNetBonus) / 2;

    // Combine bonuses from both systems
    const combined = { ...fromSys.bonus };
    for (const [resource, amount] of Object.entries(toSys.bonus)) {
      combined[resource] = (combined[resource] || 0) + amount;
    }

    // Each route gives half the combined bonus, scaled by distance and network
    for (const [resource, amount] of Object.entries(combined)) {
      bonus[resource] = (bonus[resource] || 0) + amount * 0.5 * distMult * networkMult * savantMult;
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
