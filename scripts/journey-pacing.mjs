import { DECISIONS } from '../src/data/decisions.js';
import { upgrades } from '../src/data/upgrades.js';
import { isDecisionUpgrade } from '../src/engine/upgrades.js';
// Resource growth and repeated optional actions do not prove progression.
// Measure purchases and finite objectives separately from eventual reachability.
export function progressSignature(state) {
  return JSON.stringify([state.era, state.prestigeCount, Object.keys(state.tech).length,
    Object.keys(state.upgrades).length, Object.keys(state.wovenLaws).length,
    Object.keys(state.lockedSignals).length, Math.min(30, state.dysonSegments),
    Object.keys(state.realityKeys).length, !!state.nextCycleDoctrine]);
}

export function createPacingMonitor(profile, options = {}) {
  const maxEraActiveSeconds = options.maxEraActiveSeconds ?? 1800;
  const maxStalledActiveSeconds = options.maxStalledActiveSeconds ?? 900;
  const maxEraSeconds = maxEraActiveSeconds + (profile.attention.sessionInterval || 0) * 4;
  const eras = [];
  const failures = [];
  let eraKey = '';
  let signature = '';
  let lastProgressActive = 0;
  let longestGap = 0;
  const intentional = { firstStrategicChoiceSeconds: {}, strategicChoices: 0, routineCommands: 0, chapterReviews: 0, discoveriesAcknowledged: 0 };
  let automaticPurchases = 0, previousPurchases = 0, manualSinceObservation = 0;
  return {
    failures,
    recordCommand(name, state, elapsed) {
      const id = name.startsWith('buy:') ? name.slice(4) : null;
      if (id) {
        manualSinceObservation++;
        if (!isDecisionUpgrade(upgrades[id])) intentional.routineCommands++;
        if (DECISIONS[id]) {
          intentional.strategicChoices++;
          intentional.firstStrategicChoiceSeconds[state.prestigeCount + 1] ??= elapsed;
        }
      }
      if (name === 'continue-era') intentional.chapterReviews++;
      if (name === 'remember-discovery') intentional.discoveriesAcknowledged++;
    },
    observe(state, elapsed, active) {
      const key = `${state.prestigeCount}:${state.era}`;
      if (key !== eraKey) {
        eraKey = key;
        eras.push({ cycle: state.prestigeCount + 1, era: state.era, entered: elapsed, activeAtEntry: active, seconds: 0, activeSeconds: 0 });
      }
      const purchases = Object.keys(state.upgrades).length;
      automaticPurchases += Math.max(0, purchases - previousPurchases - manualSinceObservation);
      previousPurchases = purchases; manualSinceObservation = 0;
      const era = eras.at(-1);
      era.seconds = elapsed - era.entered;
      era.activeSeconds = active - era.activeAtEntry;
      const next = progressSignature(state);
      if (next !== signature) { signature = next; lastProgressActive = active; }
      longestGap = Math.max(longestGap, active - lastProgressActive);
      if (era.activeSeconds > maxEraActiveSeconds || era.seconds > maxEraSeconds) failures.push(`pacing: cycle ${era.cycle} era ${era.era} exceeded its era budget (${era.seconds}s elapsed, ${era.activeSeconds}s present)`);
      if (active - lastProgressActive > maxStalledActiveSeconds) failures.push(`pacing: no meaningful progress for ${active - lastProgressActive}s while present in era ${state.era}`);
    },
    report: () => ({ eras, intentional, automaticPurchases, longestStalledActiveSeconds: longestGap, maxEraActiveSeconds, maxStalledActiveSeconds }),
  };
}
