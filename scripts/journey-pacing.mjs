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
  return {
    failures,
    observe(state, elapsed, active) {
      const key = `${state.prestigeCount}:${state.era}`;
      if (key !== eraKey) {
        eraKey = key;
        eras.push({ cycle: state.prestigeCount + 1, era: state.era, entered: elapsed, activeAtEntry: active, seconds: 0, activeSeconds: 0 });
      }
      const era = eras.at(-1);
      era.seconds = elapsed - era.entered;
      era.activeSeconds = active - era.activeAtEntry;
      const next = progressSignature(state);
      if (next !== signature) { signature = next; lastProgressActive = active; }
      longestGap = Math.max(longestGap, active - lastProgressActive);
      if (era.activeSeconds > maxEraActiveSeconds || era.seconds > maxEraSeconds) failures.push(`pacing: cycle ${era.cycle} era ${era.era} exceeded its era budget (${era.seconds}s elapsed, ${era.activeSeconds}s present)`);
      if (active - lastProgressActive > maxStalledActiveSeconds) failures.push(`pacing: no meaningful progress for ${active - lastProgressActive}s while present in era ${state.era}`);
    },
    report: () => ({ eras, longestStalledActiveSeconds: longestGap, maxEraActiveSeconds, maxStalledActiveSeconds }),
  };
}
