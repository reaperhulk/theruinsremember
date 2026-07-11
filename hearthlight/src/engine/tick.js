// The round clock: day → dusk → night → dawn, in bounded deterministic
// slices. All randomness flows through the injected rng.
import { DAY_LENGTH, DAWN_GLOW_PER_STRUCTURE, LEVEL_UP_NIGHTS, drawDraft, getGlowRate } from './round.js';
import { advanceNightSlice, nightResolved, spawnShades } from './night.js';

function appendLog(round, day, messages) {
  if (!messages || messages.length === 0) return round.log;
  return [...round.log, ...messages.map(message => ({ day, message }))].slice(-30);
}

function dawn(state, rng) {
  const round = state.round;
  let glow = round.glow;
  const slots = round.slots.map(slot => {
    if (!slot.structure) return slot;
    glow += DAWN_GLOW_PER_STRUCTURE;
    const nightsSurvived = slot.structure.nightsSurvived + 1;
    const levelUp = nightsSurvived >= LEVEL_UP_NIGHTS && slot.structure.level === 1;
    return {
      ...slot,
      structure: {
        ...slot.structure,
        nightsSurvived,
        level: levelUp ? 2 : slot.structure.level,
        hp: levelUp ? slot.structure.hp + 1 : slot.structure.hp,
      },
    };
  });

  const day = round.day + 1;
  const withDawn = {
    ...round,
    day,
    phase: 'day',
    phaseStart: round.time,
    glow,
    slots,
    log: appendLog(round, day, [`Dawn. Night ${round.day} survived.`]),
  };
  withDawn.draft = drawDraft({ ...state, round: withDawn }, rng);
  return { ...state, round: withDawn };
}

export function endDay(state, rng = Math.random) {
  const round = state.round;
  if (!round || round.phase !== 'day') return state;
  return spawnShades(state, rng);
}

export function tick(state, dt, rng = Math.random) {
  let current = state;
  let remaining = dt;
  while (remaining > 0 && current.round && current.round.phase !== 'fallen') {
    const slice = Math.min(1, remaining);
    remaining -= slice;
    const round = current.round;
    const time = round.time + slice;

    if (round.phase === 'day') {
      const glow = round.glow + getGlowRate(current) * slice;
      current = { ...current, round: { ...round, time, glow } };
      if (time - round.phaseStart >= DAY_LENGTH) {
        current = endDay(current, rng);
      }
      continue;
    }

    // Night
    let advanced = advanceNightSlice(current, { ...round, time });
    const log = appendLog(round, round.day, advanced.pendingLog);
    delete advanced.pendingLog;
    advanced = { ...advanced, log };

    if (advanced.heart <= 0) {
      current = {
        ...current,
        round: {
          ...advanced,
          heart: 0,
          phase: 'fallen',
          shades: [],
          log: appendLog(advanced, round.day, ['The Heart goes dark. The town is memory now.']),
        },
      };
      break;
    }

    current = { ...current, round: advanced };
    if (nightResolved(advanced)) {
      current = dawn(current, rng);
    }
  }
  return current;
}
