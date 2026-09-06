import { mkdirSync, writeFileSync } from 'node:fs';
import { runPlayerJourney } from './player-journey.mjs';
import { PERSONA_IDS, createPersonaProfiles } from './playtest-personas.js';

const value = (flag, fallback) => process.argv.includes(flag) ? process.argv[process.argv.indexOf(flag) + 1] : fallback;
const seeds = value('--seeds', '424242,42').split(',').map(Number);
const personas = value('--personas', PERSONA_IDS.join(',')).split(',');
const cycles = Number(value('--cycles', '2'));
const variants = process.argv.includes('--adversarial')
  ? [{ manualBuildOut: true }, { branch: 'reverse' }, { branch: 'random' }, { useRecovery: true, disableProtection: true }, { inefficient: true }, { badLuck: true },
    ...['expedition', 'docking', 'colonies', 'starChart', 'dyson', 'senate', 'weaving', 'tuning', 'realityForge'].map(skip => ({ skip }))]
  : [{}];
if (seeds.some(seed => !Number.isSafeInteger(seed)) || personas.some(id => !PERSONA_IDS.includes(id)) || !Number.isInteger(cycles) || cycles < 1) {
  throw new Error('Invalid seeds, personas, or cycle count');
}
const profiles = createPersonaProfiles();
const operationFlags = { expedition: 'expeditions', docking: 'docking', colonies: 'colonies', starChart: 'starChart', dyson: 'dysonAssembly', senate: 'senateFocus', weaving: 'weaving', tuning: 'cosmicTuning', realityForge: 'realityForge' };
let failures = 0;
const reports = [];
for (const seed of seeds) {
  for (const persona of personas) {
    for (const variant of variants) {
      // The base minimalist already skips these systems. Repeating an
      // identical journey for a disabled operation adds no coverage.
      if (variant.skip && !profiles[persona][operationFlags[variant.skip]]) continue;
      const report = runPlayerJourney({ persona, seed, cycles, ...variant });
      reports.push(report);
      console.log(`${report.completed ? 'PASS' : 'FAIL'} ${persona} seed=${seed} cycles=${report.cycleResults.length}/${cycles} era=${report.finalEra} elapsed=${report.elapsedSeconds}s attention=${report.activeSeconds}s commands=${report.manualActions} ${JSON.stringify(variant)}`);
      if (!report.completed) {
        failures++;
        mkdirSync('test-results', { recursive: true });
        const name = `${persona}-${seed}-${Object.entries(variant).map(([key, value]) => `${key}-${value}`).join('-') || 'default'}`;
        writeFileSync(`test-results/journey-${name}.json`, JSON.stringify(report, null, 2));
        console.error(report.failures.join('; '));
      }
    }
  }
}
mkdirSync('test-results', { recursive: true });
writeFileSync(`test-results/${process.argv.includes('--adversarial') ? 'adversarial' : 'journey'}-summary.json`, JSON.stringify(reports.map(report => ({ ...report, trace: undefined })), null, 2));
if (failures) process.exitCode = 1;
