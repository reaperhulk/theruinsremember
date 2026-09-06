// Original themes. Melody entries are chord-tone degrees; -1 leaves a breath.
// Four eight-bar sections move from a theme to variation, space, and a return.
const EMBERS = [[0,-1,2,1,0,-1,3,2], [1,-1,0,-1,2,1,0,-1], [2,3,-1,2,1,-1,0,1], [2,-1,1,0,-1,-1,0,-1]];
const CIRCUIT = [[0,2,1,2,3,-1,2,1], [0,1,2,-1,1,0,2,-1], [3,2,1,2,0,1,-1,2], [1,0,-1,2,1,-1,0,-1]];
const HORIZON = [[2,-1,-1,3,2,-1,1,-1], [0,-1,1,-1,2,-1,-1,1], [3,-1,2,1,-1,2,3,-1], [2,-1,1,-1,0,-1,-1,-1]];
const GARDEN = [[0,1,2,-1,1,3,2,-1], [2,-1,1,0,1,-1,2,3], [3,2,-1,1,2,1,0,-1], [1,2,-1,1,0,-1,-1,-1]];

export const SCORE = {
  1: { name: 'Embers', root: 45, tempo: 68, major: false, melody: EMBERS, keys: 'felt', pad: 'sine', pulse: 0, arpeggio: 0 },
  2: { name: 'Working Iron', root: 43, tempo: 80, major: false, melody: CIRCUIT, keys: 'wood', pad: 'triangle', pulse: 1, arpeggio: 0.35 },
  3: { name: 'The First Reply', root: 48, tempo: 86, major: false, melody: CIRCUIT, keys: 'glass', pad: 'sine', pulse: 0.7, arpeggio: 0.65 },
  4: { name: 'Above the Weather', root: 50, tempo: 66, major: true, melody: HORIZON, keys: 'felt', pad: 'triangle', pulse: 0, arpeggio: 0.3 },
  5: { name: 'Gardens in Orbit', root: 48, tempo: 74, major: true, melody: GARDEN, keys: 'wood', pad: 'sine', pulse: 0.35, arpeggio: 0.3 },
  6: { name: 'Between Lights', root: 47, tempo: 64, major: false, melody: HORIZON, keys: 'glass', pad: 'sine', pulse: 0.25, arpeggio: 0.55 },
  7: { name: 'Borrowed Sun', root: 43, tempo: 82, major: false, melody: CIRCUIT, keys: 'wood', pad: 'triangle', pulse: 1, arpeggio: 0.7 },
  8: { name: 'Many Voices', root: 45, tempo: 76, major: true, melody: GARDEN, keys: 'felt', pad: 'triangle', pulse: 0.5, arpeggio: 0.45 },
  9: { name: 'The Folded Horizon', root: 47, tempo: 62, major: false, melody: HORIZON, keys: 'glass', pad: 'sine', pulse: 0, arpeggio: 0.45 },
  10: { name: 'The Ember Returns', root: 45, tempo: 68, major: false, melody: EMBERS, keys: 'felt', pad: 'triangle', pulse: 0.2, arpeggio: 0.35 },
};
export const MEMORY_MOTIF = [0, 3, 7, 2];
const MINOR_CHORDS = [[0,3],[-4,4],[3,4],[-2,4],[0,3],[-5,3],[-4,4],[-2,4]];
const MAJOR_CHORDS = [[0,4],[-5,4],[-3,3],[-7,4],[0,4],[-3,3],[-7,4],[-5,4]];

// Score time is independent of game speed, simulation ticks, and game RNG.
export function scoreBar(era, bar, cycle = 0, activity = false) {
  const score = SCORE[era] || SCORE[1];
  const [offset, third] = (score.major ? MAJOR_CHORDS : MINOR_CHORDS)[bar % 8];
  const root = score.root + offset, chord = [0, third, 7, 12];
  const section = Math.floor(bar / 8) % 4;
  const notes = [];
  const add = (instrument, note, at, beats, gain, pan = 0) => notes.push({ instrument, note, at, beats, gain, pan });
  for (const [i, tone] of chord.slice(0, 3).entries()) add('pad', root + 12 + tone, i * 0.025, 4.5, 0.075, (i - 1) * 0.45);
  add('bass', root - 12, 0, 3.8, 0.19);
  if (section !== 2 || bar % 2 === 0) {
    const melody = score.melody[bar % score.melody.length];
    for (const [i, degree] of melody.entries()) {
      if (degree < 0) continue;
      const voice = section === 1 && i === 6 ? 3 : degree;
      add('keys', root + 24 + chord[voice], i * 0.5, i === 7 ? 1.1 : 0.9, 0.16 * (i % 2 ? 0.8 : 1), Math.sin(bar + i) * 0.28);
    }
  }
  const arp = score.arpeggio + (cycle > 0 ? 0.2 : 0) + (activity ? 0.1 : 0);
  if (arp && section !== 2) for (let i = 0; i < 8; i++) add('arp', root + 12 + chord[(i + bar) % 4], i * 0.5 + 0.25, 0.65, 0.045 * arp, i % 2 ? 0.45 : -0.45);
  if (section === 3 && bar % 4 === 0) for (const [i, tone] of [0, third, 7, 2].entries()) add('memory', score.root + 36 + tone, i, 1.6, 0.055, 0.15);
  if (score.pulse) for (let i = 0; i < 4; i++) add(i % 2 ? 'tick' : 'pulse', root - 12, i, 0.25, score.pulse * (i % 2 ? 0.028 : 0.11));
  return { score, notes };
}
