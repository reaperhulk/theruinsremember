// Hacking Puzzle mini-game for Era 3
// Pattern-match game: match a generated sequence to boost data/software.
// Success gives a timed production bonus. Longer sequences = bigger bonus.

const SYMBOLS = ['0', '1', '2', '3'];
const BASE_LENGTH = 4;
const MAX_LENGTH = 8;
const BONUS_DURATION = 30; // seconds
const BASE_MULT = 2;

// Generate a hack challenge of given difficulty.
// roll is an array of 0-1 numbers for deterministic testing.
export function generateChallenge(difficulty = 0, rolls = null) {
  const length = Math.min(BASE_LENGTH + difficulty, MAX_LENGTH);
  const sequence = [];
  for (let i = 0; i < length; i++) {
    const r = rolls ? rolls[i] : Math.random();
    sequence.push(SYMBOLS[Math.floor(r * SYMBOLS.length)]);
  }
  return {
    sequence,
    difficulty,
    multiplier: BASE_MULT + difficulty * 0.5,
  };
}

// Start a hack attempt. Returns state with active challenge.
export function startHack(state, rolls = null) {
  if (state.era < 3) return state;
  const difficulty = state.hackDifficulty || 0;
  const challenge = generateChallenge(difficulty, rolls);
  return {
    ...state,
    hackChallenge: challenge,
    hackStartTime: state.totalTime,
  };
}

// Submit a solution. Returns { state, success }.
export function submitHack(state, playerSequence) {
  const challenge = state.hackChallenge;
  if (!challenge) return { state, success: false };

  const success = challenge.sequence.length === playerSequence.length &&
    challenge.sequence.every((s, i) => s === playerSequence[i]);

  if (success) {
    const hasHackMaster = state.prestigeUpgrades && state.prestigeUpgrades.hackMaster;
    const duration = hasHackMaster ? BONUS_DURATION * 2 : BONUS_DURATION;
    // Era scaling: hacks give bigger bonuses in later eras
    const eraScale = 1 + (state.era - 3) * 0.3;
    const hasSavant = state.prestigeUpgrades && state.prestigeUpgrades.miniGameSavant;
    const savantMult = hasSavant ? 1.5 : 1;
    const scaledMult = challenge.multiplier * Math.max(1, eraScale) * savantMult;
    const effect = {
      id: `hack_${state.totalTime}`,
      startedAt: state.totalTime,
      endsAt: state.totalTime + duration,
      description: `Hack Success: x${scaledMult.toFixed(1)} data & software`,
      effects: [
        { resourceId: 'data', rateMultBonus: scaledMult },
        { resourceId: 'software', rateMultBonus: scaledMult },
      ],
    };

    return {
      state: {
        ...state,
        hackChallenge: null,
        hackDifficulty: (state.hackDifficulty || 0) + 1,
        hackSuccesses: (state.hackSuccesses || 0) + 1,
        activeEffects: [...(state.activeEffects || []), effect],
      },
      success: true,
    };
  }

  return {
    state: {
      ...state,
      hackChallenge: null,
      hackDifficulty: Math.max(0, (state.hackDifficulty || 0) - 1),
    },
    success: false,
  };
}

// Get current hack bonus multiplier (from active effects)
export function getHackBonus(state) {
  if (!state.activeEffects) return 1;
  let mult = 1;
  for (const effect of state.activeEffects) {
    if (effect.id && effect.id.startsWith('hack_') && effect.effects) {
      for (const e of effect.effects) {
        if (e.resourceId === 'data') {
          mult *= e.rateMultBonus;
        }
      }
    }
  }
  return mult;
}
