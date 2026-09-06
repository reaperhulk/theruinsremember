import { upgrades } from './upgrades.js';

// These are the construction upgrades in the current game. Legacy upgrade
// definitions remain as effect/save records, not individual construction jobs.
const CHAPTER_PROJECTS = {
  1: ['tools', 'housing', 'basicPower', 'irrigation', 'foundry', 'settlerMonument'],
  2: ['assemblyLines', 'powerGrid', 'computingLab', 'automation', 'microchipFab', 'industrialRevolution'],
  3: ['internet', 'openSource', 'patternAnalysis', 'aiResearch', 'quantumComputing', 'digitalSingularity'],
  4: ['rocketScience', 'advancedMaterials', 'solarArrays', 'spaceStation', 'zeroGManufacturing', 'spaceAgeCapstone'],
  5: ['asteroidMining', 'outerColony', 'geneticEngineering', 'terraforming', 'fusionPower', 'solarAgeCapstone'],
  6: ['warpDrive', 'stellarCartography', 'dysonSwarms', 'aiGovernance', 'stellarForgePrototype', 'interstellarCapstone'],
  7: ['dysonSphere', 'starLifting', 'stellarNursery', 'matrioshkaBrain', 'neuronStar', 'dysonCapstone'],
  8: ['wormholeNetwork', 'darkMatterHarvest', 'galacticSenate', 'matterReplicators', 'galacticAcademy', 'galacticCapstone'],
  9: ['galaxySeeding', 'cosmicInfrastructure', 'voidBridges', 'universalTranslator', 'entropyReversal', 'intergalacticCapstone'],
  10: ['realityWeaving', 'dimensionalAnchors', 'parallelProcessing', 'omniscienceEngine', 'multiversalHarmony', 'multiverseCapstone'],
};

const construction = Object.values(upgrades).filter(u => !u.exclusiveWith && !u.repeatable);
const milestones = new Set(Object.values(CHAPTER_PROJECTS).flat());
export const projects = {};
export const componentProject = {};

for (const [chapter, anchors] of Object.entries(CHAPTER_PROJECTS)) {
  const era = Number(chapter);
  const ancestors = (id, seen = new Set()) => {
    if (seen.has(id)) return seen;
    seen.add(id);
    for (const prerequisite of upgrades[id]?.prerequisites || []) ancestors(prerequisite, seen);
    return seen;
  };
  // Order authored landmarks by their original dependency graph. Each project
  // includes its prerequisites and a share of the era's supporting works.
  const ordered = [...anchors].sort((a, b) => ancestors(a).has(b) ? 1 : ancestors(b).has(a) ? -1 : anchors.indexOf(a) - anchors.indexOf(b));
  const pending = new Set(construction.filter(u => u.era === era).map(u => u.id));
  for (const [stage, id] of ordered.entries()) {
    const members = [];
    const include = member => {
      if (!pending.has(member)) return;
      for (const prerequisite of upgrades[member].prerequisites) include(prerequisite);
      pending.delete(member);
      members.push(member);
    };
    const target = stage === 0 ? 1 : Math.ceil(pending.size / (ordered.length - stage));
    include(id);
    // Add ready supporting works to each landmark, rather than placing most
    // of the era's production in a single giant second purchase.
    while (members.length < target) {
      const next = [...pending].find(member => !milestones.has(member) && upgrades[member].prerequisites.every(p => !pending.has(p)));
      if (!next) break;
      include(next);
    }
    if (stage === ordered.length - 1) for (const member of [...pending]) include(member);
    projects[id] = { ...upgrades[id], members, stage, project: true };
    for (const member of members) componentProject[member] = id;
  }
}

for (const project of Object.values(projects)) {
  const members = new Set(project.members);
  project.prerequisites = [...new Set(project.members.flatMap(id => upgrades[id].prerequisites).filter(id => !members.has(id)))];
  project.effects = project.members.flatMap(id => upgrades[id].effects);
}
