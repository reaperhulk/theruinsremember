// Eight attention models. Clicking, buying and catching echoes happen only
// while the persona is actually looking at the game.
//
// sessions: seconds active, then seconds away. `away` is 'open' when the tab
// stays open (full production, no input) or 'closed' (offline efficiency).
export const PERSONAS = {
  newcomer: {
    description: 'First visit: clicks steadily, decides every 20s, often misses echoes.',
    cps: 3, decisionEvery: 20, echoChance: 0.5, upgrades: true, horizon: 2 * 3600,
  },
  engaged: {
    description: 'Plays actively for an evening: 5 clicks/s, decides every 10s.',
    cps: 5, decisionEvery: 10, echoChance: 0.85, upgrades: true, horizon: 8 * 3600,
  },
  optimizer: {
    description: 'Fast clicking, decisions every 2s, catches every echo.',
    cps: 8, decisionEvery: 2, echoChance: 1, upgrades: true, horizon: 8 * 3600,
  },
  background: {
    description: 'Tab stays open; 30s visits every two minutes.',
    cps: 4, decisionEvery: 10, echoChance: 0.9, upgrades: true, horizon: 8 * 3600,
    sessions: { active: 30, away: 90, mode: 'open' },
  },
  check_in: {
    description: 'Closes the game between one-minute visits every ten minutes.',
    cps: 4, decisionEvery: 10, echoChance: 0.9, upgrades: true, horizon: 24 * 3600,
    sessions: { active: 60, away: 540, mode: 'closed' },
  },
  offline_returner: {
    description: 'Two-minute visits separated by four hours offline.',
    cps: 4, decisionEvery: 10, echoChance: 0.9, upgrades: true, horizon: 3 * 86400,
    sessions: { active: 120, away: 4 * 3600, mode: 'closed' },
  },
  completionist: {
    description: 'Deliberate five-second decisions; buys every upgrade it sees.',
    cps: 4, decisionEvery: 5, echoChance: 1, upgrades: 'all', horizon: 8 * 3600,
  },
  minimalist: {
    description: 'Barely clicks; decides every 30s, ignores echoes and upgrades.',
    cps: 0.2, decisionEvery: 30, echoChance: 0, upgrades: false, horizon: 8 * 3600,
  },
};

export const PERSONA_IDS = Object.keys(PERSONAS);
