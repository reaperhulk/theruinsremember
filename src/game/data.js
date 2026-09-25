// Static definitions for the clicker. Everything is priced in one currency,
// salvage, recovered from the ruins by hand and by the things you build.

export const ERA_NAMES = {
  1: 'Planetfall',
  2: 'Industrialization',
  3: 'Digital Age',
  4: 'Space Age',
  5: 'Solar System',
  6: 'Interstellar',
  7: 'Dyson Era',
  8: 'Galactic',
  9: 'Intergalactic',
  10: 'Multiverse',
};
export const ERA_COUNT = 10;

// Every building costs 15% more than the last one of its kind.
export const COST_SCALE = 1.15;

// Two buildings per era. Each costs roughly an order of magnitude more than
// the one before it and pays back more slowly, so the newest building is
// usually the best purchase only once it has become affordable.
export const BUILDINGS = [
  { id: 'scavenger', era: 1, name: 'Scavenger', plural: 'Scavengers', cost: 15, sps: 0.1, description: 'Picks through the wreckage so your hands can rest.' },
  { id: 'camp', era: 1, name: 'Salvage Camp', plural: 'Salvage Camps', cost: 100, sps: 1, description: 'A fire, a tarp, and a crew that sorts what the ruins give up.' },
  { id: 'foundry', era: 2, name: 'Foundry', plural: 'Foundries', cost: 1100, sps: 8, description: 'Melts buried alloys into something useful. The molds were already here.' },
  { id: 'railyard', era: 2, name: 'Rail Yard', plural: 'Rail Yards', cost: 12000, sps: 47, description: 'The old tracks run exactly where you planned to lay new ones.' },
  { id: 'serverFarm', era: 3, name: 'Server Farm', plural: 'Server Farms', cost: 130000, sps: 260, description: 'Wakes the buried network one rack at a time.' },
  { id: 'neuralLab', era: 3, name: 'Neural Lab', plural: 'Neural Labs', cost: 1.4e6, sps: 1400, description: 'Trains minds on archives that already contain their answers.' },
  { id: 'launchPad', era: 4, name: 'Launch Pad', plural: 'Launch Pads', cost: 2e7, sps: 7800, description: 'Lifts salvage crews to the debris ring above.' },
  { id: 'orbitalStation', era: 4, name: 'Orbital Station', plural: 'Orbital Stations', cost: 3.3e8, sps: 44000, description: 'Docks at a berth that bears the name of your ship.' },
  { id: 'asteroidMine', era: 5, name: 'Asteroid Mine', plural: 'Asteroid Mines', cost: 5.1e9, sps: 260000, description: 'Every rock has been mined before. Some tunnels are still lit.' },
  { id: 'colony', era: 5, name: 'Colony', plural: 'Colonies', cost: 7.5e10, sps: 1.6e6, description: 'A new home, built on the hearth of an older one.' },
  { id: 'warpGate', era: 6, name: 'Warp Gate', plural: 'Warp Gates', cost: 1e12, sps: 1e7, description: 'Opens roads through silence to ruins around other stars.' },
  { id: 'seedShip', era: 6, name: 'Seed Ship', plural: 'Seed Ships', cost: 1.4e13, sps: 6.5e7, description: 'Carries survivors to worlds that are waiting for them.' },
  { id: 'dysonSwarm', era: 7, name: 'Dyson Swarm', plural: 'Dyson Swarms', cost: 1.7e14, sps: 4.3e8, description: 'Borrows sunlight. One collector bears a handprint that fits yours.' },
  { id: 'stellarForge', era: 7, name: 'Stellar Forge', plural: 'Stellar Forges', cost: 2.1e15, sps: 2.9e9, description: 'Smelts the ruins of whole systems.' },
  { id: 'hyperlane', era: 8, name: 'Hyperlane', plural: 'Hyperlanes', cost: 2.6e16, sps: 2.1e10, description: 'Joins a galaxy of ruins into one excavation.' },
  { id: 'galacticArchive', era: 8, name: 'Galactic Archive', plural: 'Galactic Archives', cost: 3.1e17, sps: 1.5e11, description: 'Every delegate brings a different version of the same history.' },
  { id: 'voidBridge', era: 9, name: 'Void Bridge', plural: 'Void Bridges', cost: 7.1e21, sps: 1.1e12, description: 'Spans the dark between galaxies. The far end is already built.' },
  { id: 'cosmicLoom', era: 9, name: 'Cosmic Loom', plural: 'Cosmic Looms', cost: 1.2e24, sps: 8.3e12, description: 'Reweaves the background radiation into a map of your civilization.' },
  { id: 'realityEngine', era: 10, name: 'Reality Engine', plural: 'Reality Engines', cost: 1.9e26, sps: 6.4e13, description: 'Salvages the universes next door.' },
  { id: 'echo', era: 10, name: 'Echo of Yourself', plural: 'Echoes of Yourself', cost: 5.4e28, sps: 5.1e14, description: 'You were the ruins all along. Now you can help.' },
];
export const BUILDING_BY_ID = Object.fromEntries(BUILDINGS.map(b => [b.id, b]));

// Salvage earned this run that reveals each era: the price of its first building.
export const ERA_THRESHOLDS = Object.fromEntries(
  Object.keys(ERA_NAMES).map(era => [era, BUILDINGS.find(b => b.era === Number(era)).cost]),
);
ERA_THRESHOLDS[1] = 0;

// Each tier doubles one building's output. Owning enough of it reveals the
// upgrade; its price is a fixed multiple of the building's base cost.
const TIERS = [
  { owned: 1, price: 10, name: 'Improvised Tools' },
  { owned: 5, price: 50, name: 'Salvaged Blueprints' },
  { owned: 25, price: 500, name: 'Ancestral Methods' },
  { owned: 50, price: 5e4, name: 'Echoed Designs' },
  { owned: 100, price: 5e6, name: 'Remembered Mastery' },
  { owned: 150, price: 5e8, name: 'Perfect Recall' },
  { owned: 200, price: 5e10, name: 'The Pattern Holds' },
  { owned: 250, price: 5e13, name: 'Inevitable' },
];

const CLICK_DOUBLERS = [
  { id: 'callousedHands', name: 'Calloused Hands', cost: 100, clicks: 1, description: 'Clicking is twice as effective.' },
  { id: 'steadyGrip', name: 'Steady Grip', cost: 500, clicks: 50, description: 'Clicking is twice as effective.' },
  { id: 'practicedEye', name: 'Practiced Eye', cost: 10000, clicks: 250, description: 'Clicking is twice as effective.' },
];
// Late click upgrades add a share of production to every click, so clicking
// keeps pace with the economy instead of fading into a rounding error.
const CLICK_SHARES = [
  ['muscleMemory', 'Muscle Memory', 5e4],
  ['instinct', 'Instinct', 5e6],
  ['secondNature', 'Second Nature', 5e8],
  ['handsThatRemember', 'Hands That Remember', 5e10],
  ['theSameMotion', 'The Same Motion', 5e12],
  ['everyHandBefore', 'Every Hand Before', 5e14],
  ['oneHand', 'One Hand', 5e16],
];

// Three chronicle upgrades per era raise all production by 10% each.
const CHRONICLE_NAMES = {
  1: ['Crash Log', 'Survivor Tallies', 'The First Foundation'],
  2: ['Maintenance Notes', 'Familiar Handwriting', 'Buried Works'],
  3: ['Recovered Packets', 'Tomorrow’s Date', 'The Listening Array'],
  4: ['Debris Charts', 'The Empty Berth', 'Orbital Harbor'],
  5: ['Colony Registers', 'Older Hearths', 'Living Sanctuary'],
  6: ['Beacon Logs', 'Planned Routes', 'Wayfinder'],
  7: ['Collector Manifests', 'The Handprint', 'Solar Crown'],
  8: ['Delegate Histories', 'The Same History', 'Hall of Voices'],
  9: ['Background Maps', 'The Loop’s Shape', 'Constant Observatory'],
  10: ['Parallel Notes', 'The Message', 'What We Leave Behind'],
};

// Chronicle upgrades per era, in order.
const CHRONICLE_VALUES = [1.1, 1.15, 1.2];

// Archivists turn achievements into growth, one per era from Industrialization:
// each multiplies all production by (1 + ARCHIVE_RATE × achievements).
export const ARCHIVE_RATE = 0.003;
const ARCHIVIST_NAMES = {
  2: 'Foundry Archivists', 3: 'Network Archivists', 4: 'Orbital Archivists', 5: 'Colony Archivists',
  6: 'Beacon Archivists', 7: 'Solar Archivists', 8: 'Galactic Archivists', 9: 'Void Archivists', 10: 'The Last Archivist',
};

const ECHO_UPGRADES = [
  { id: 'faintResonance', name: 'Faint Resonance', cost: 777777, echoes: 7, description: 'Glimmers appear twice as often and linger twice as long.' },
  { id: 'clearResonance', name: 'Clear Resonance', cost: 77777777, echoes: 27, description: 'Glimmers appear twice as often and linger twice as long.' },
  { id: 'lastingEcho', name: 'Lasting Glimmer', cost: 7.7e9, echoes: 77, description: 'Glimmer effects last twice as long.' },
];

function buildUpgrades() {
  const list = [];
  for (const building of BUILDINGS) {
    for (const [index, tier] of TIERS.entries()) {
      list.push({
        id: `${building.id}:${index + 1}`,
        kind: 'building',
        building: building.id,
        name: `${building.plural}: ${tier.name}`,
        cost: building.cost * tier.price,
        description: `${building.plural} are twice as efficient.`,
        requires: { building: building.id, owned: tier.owned },
      });
    }
  }
  for (const doubler of CLICK_DOUBLERS) {
    list.push({ id: doubler.id, kind: 'clickDouble', name: doubler.name, cost: doubler.cost, description: doubler.description, requires: { clicks: doubler.clicks } });
  }
  for (const [id, name, cost] of CLICK_SHARES) {
    list.push({ id, kind: 'clickShare', name, cost, description: 'Each click also recovers 1% of your salvage per second.', requires: { earned: cost / 5 } });
  }
  for (const [era, names] of Object.entries(CHRONICLE_NAMES)) {
    const base = BUILDINGS.find(b => b.era === Number(era)).cost;
    names.forEach((name, index) => list.push({
      id: `chronicle:${era}:${index + 1}`,
      kind: 'global',
      era: Number(era),
      value: CHRONICLE_VALUES[index],
      name,
      cost: Math.max(50, base * [3, 30, 300][index]),
      description: `All production +${Math.round((CHRONICLE_VALUES[index] - 1) * 100)}%.`,
      requires: { era: Number(era), earned: Math.max(20, base * [1, 10, 100][index]) },
    }));
  }
  for (const [era, name] of Object.entries(ARCHIVIST_NAMES)) {
    const base = BUILDINGS.find(b => b.era === Number(era)).cost;
    list.push({
      id: `archivist:${era}`,
      kind: 'archive',
      era: Number(era),
      name,
      cost: base * 20,
      description: `All production +${ARCHIVE_RATE * 100}% for every achievement you have.`,
      requires: { era: Number(era), achievements: Number(era) * 5 },
    });
  }
  for (const upgrade of ECHO_UPGRADES) {
    list.push({ id: upgrade.id, kind: 'echo', name: upgrade.name, cost: upgrade.cost, description: upgrade.description, requires: { echoes: upgrade.echoes } });
  }
  return list;
}

export const UPGRADES = buildUpgrades();
export const UPGRADE_BY_ID = Object.fromEntries(UPGRADES.map(u => [u.id, u]));

// Glimmers are the ruins' golden moments: a memory surfacing for a few
// seconds. Click one before it fades. (Internally they are still `echo`, so
// saves and ids stay stable.)
export const ECHO_EFFECTS = {
  cache: { name: 'Recovered Cache', weight: 45, description: 'A sealed cache of salvage.' },
  remembrance: { name: 'Remembrance', weight: 45, duration: 77, production: 7, description: 'Production ×7 for 77 seconds.' },
  ancientHands: { name: 'Ancient Hands', weight: 10, duration: 13, click: 777, description: 'Clicks ×777 for 13 seconds.' },
};
export const ECHO_SPAWN_MIN = 300;
export const ECHO_SPAWN_MAX = 900;
export const ECHO_LIFETIME = 13;

// Letting the cycle turn converts lifetime salvage into memories. Memories
// multiply all production (see getMemoryMultiplier) and can also be spent
// once on the lessons below.
export const MEMORY_DIVISOR = 1e11;

// Lessons are bought with memories and kept forever. Spending memories never
// lowers their production bonus.
export const MEMORY_UPGRADES = [
  { id: 'patientRuins', name: 'Patient Ruins', cost: 1, description: 'While you are away, the ruins keep producing at 25% instead of 10%.' },
  { id: 'starterKit', name: 'Starter Kit', cost: 3, description: 'Each cycle begins with 10 Scavengers, 10 Salvage Camps and 5 Foundries.' },
  { id: 'headStart', name: 'Head Start', cost: 5, description: 'Each cycle begins with 0.1% of the salvage your last cycle recovered, so the opening eras fly by.' },
  { id: 'rememberedHands', name: 'Remembered Hands', cost: 8, description: 'Clicking is twice as effective, and every click also recovers 1% of your salvage per second.' },
  { id: 'echoSense', name: 'Glimmer Sense', cost: 10, description: 'Glimmers appear 50% more often.' },
  { id: 'ancestralDiscount', name: 'Ancestral Discount', cost: 25, description: 'Buildings cost 10% less.' },
  { id: 'rememberedBlueprints', name: 'Remembered Blueprints', cost: 50, description: 'Building upgrades cost half as much.' },
  { id: 'lingeringEcho', name: 'Lingering Glimmer', cost: 100, description: 'Glimmer effects last 50% longer.', requires: 'echoSense' },
  { id: 'ruinsWait', name: 'The Ruins Wait', cost: 150, description: 'While you are away, production continues at 50%.', requires: 'patientRuins' },
  { id: 'deepMemory', name: 'Deep Memory', cost: 300, description: 'Memories are 50% more powerful.' },
  { id: 'thePattern', name: 'The Pattern', cost: 500, description: 'All upgrades cost 25% less.', requires: 'ancestralDiscount' },
  { id: 'resonance', name: 'Resonance', cost: 1000, description: 'Each achievement adds 2% to production instead of 1%.' },
  { id: 'unbrokenChain', name: 'Unbroken Chain', cost: 2000, description: 'All production +50%.' },
  { id: 'inheritance', name: 'Inheritance', cost: 2000, description: 'Each cycle begins with 1% of the salvage your last cycle recovered instead of 0.1%.', requires: 'headStart' },
  { id: 'nothingIsLost', name: 'Nothing Is Lost', cost: 7500, description: 'While you are away, production continues at full strength.', requires: 'ruinsWait' },
  { id: 'deeperMemory', name: 'Deeper Memory', cost: 25000, description: 'Memories are twice as powerful as they began.', requires: 'deepMemory' },
];
export const MEMORY_UPGRADE_BY_ID = Object.fromEntries(MEMORY_UPGRADES.map(u => [u.id, u]));

// Achievements add 1% to all production each.
function buildAchievements() {
  const list = [];
  const earned = [[1, 'First Find'], [1e3, 'A Useful Pile'], [1e5, 'Salvage Economy'], [1e6, 'Millionaire of Rubble'], [1e9, 'Billions Buried'],
    [1e12, 'Trillion-Year Midden'], [1e15, 'Deep Strata'], [1e18, 'Geological Record'], [1e21, 'Stellar Inventory'], [1e24, 'Galactic Ledger'], [1e27, 'Everything, Twice']];
  for (const [amount, name] of earned) list.push({ id: `earned:${amount}`, name, description: `Recover ${amount.toLocaleString('en-US')} salvage in total.`, test: s => s.totalEarned >= amount });
  const rates = [[1, 'Trickle'], [10, 'Stream'], [100, 'River'], [1e3, 'Flood'], [1e5, 'Industry'], [1e7, 'Planetary'], [1e9, 'Stellar'], [1e11, 'Galactic'], [1e13, 'Cosmic'], [1e15, 'Recursive']];
  for (const [amount, name] of rates) list.push({ id: `rate:${amount}`, name, description: `Reach ${amount.toLocaleString('en-US')} salvage per second.`, test: (s, stats) => stats.sps >= amount });
  const clicks = [[1, 'Dig'], [100, 'Keep Digging'], [1000, 'Blistered'], [10000, 'Unrelenting'], [100000, 'The Hand Remembers']];
  for (const [amount, name] of clicks) list.push({ id: `clicks:${amount}`, name, description: `Dig by hand ${amount.toLocaleString('en-US')} times.`, test: s => s.clicks >= amount });
  const clickEarned = [[1e3, 'Handful'], [1e6, 'Armful'], [1e9, 'Landslide'], [1e12, 'Hands of the Cycle']];
  for (const [amount, name] of clickEarned) list.push({ id: `clickEarned:${amount}`, name, description: `Dig up ${amount.toLocaleString('en-US')} salvage by hand.`, test: s => s.clickEarned >= amount });
  for (const building of BUILDINGS) {
    for (const count of [1, 50, 100, 150, 200]) {
      list.push({ id: `own:${building.id}:${count}`, name: count === 1 ? `First ${building.name}` : `${count} ${building.plural}`, description: `Own ${count} ${count === 1 ? building.name : building.plural}.`, test: s => (s.buildings[building.id] || 0) >= count });
    }
  }
  for (const count of [100, 500, 1000, 2000]) list.push({ id: `buildings:${count}`, name: `${count} Structures`, description: `Own ${count} buildings at once.`, test: (s, stats) => stats.buildingCount >= count });
  for (const count of [20, 50, 100, 150]) list.push({ id: `upgrades:${count}`, name: `${count} Improvements`, description: `Own ${count} upgrades at once.`, test: s => Object.keys(s.upgrades).length >= count });
  for (const [era, name] of Object.entries(ERA_NAMES)) {
    if (era === '1') continue;
    list.push({ id: `era:${era}`, name, description: `Reach the ${name} era.`, test: s => s.highestEra >= Number(era) });
  }
  for (const [count, name] of [[1, 'Caught the Light'], [7, 'Listening'], [27, 'Attuned'], [77, 'Resonant'], [777, 'Nothing Escapes You']]) {
    list.push({ id: `echoes:${count}`, name, description: `Catch ${count} glimmer${count === 1 ? '' : 's'}.`, test: s => s.echoesCaught >= count });
  }
  for (const [count, name] of [[1, 'The Cycle Turns'], [5, 'Again'], [10, 'And Again'], [25, 'The Loop']]) {
    list.push({ id: `cycles:${count}`, name, description: `Let the cycle turn ${count} time${count === 1 ? '' : 's'}.`, test: s => s.cycles >= count });
  }
  return list;
}

export const ACHIEVEMENTS = buildAchievements();
export const ACHIEVEMENT_BY_ID = Object.fromEntries(ACHIEVEMENTS.map(a => [a.id, a]));
