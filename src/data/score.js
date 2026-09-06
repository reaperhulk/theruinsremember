// One family of tones; each chapter changes register, color and rhythm.
export const SCORE = {
  1: { name: 'Embers', root: 110, voices: [1, 1.5], type: 'sine', pulse: 0 },
  2: { name: 'Working iron', root: 98, voices: [1, 1.5, 2], type: 'triangle', pulse: 4 },
  3: { name: 'The first reply', root: 130.81, voices: [1, 1.25, 2], type: 'sine', pulse: 2 },
  4: { name: 'Above the weather', root: 146.83, voices: [0.5, 1, 1.5], type: 'sine', pulse: 1 },
  5: { name: 'Gardens in orbit', root: 130.81, voices: [1, 1.25, 1.5], type: 'triangle', pulse: 2 },
  6: { name: 'Between lights', root: 123.47, voices: [0.5, 1, 1.5], type: 'sine', pulse: 1 },
  7: { name: 'Borrowed sun', root: 98, voices: [0.5, 1, 1.5, 2], type: 'triangle', pulse: 3 },
  8: { name: 'Many voices', root: 110, voices: [1, 1.25, 1.5, 2], type: 'sine', pulse: 2 },
  9: { name: 'The folded horizon', root: 123.47, voices: [0.5, 1, 1.5, 2.25], type: 'sine', pulse: 1 },
  10: { name: 'The ember returns', root: 110, voices: [0.5, 1, 1.5], type: 'sine', pulse: 0 },
};
export const MEMORY_MOTIF = [0, 3, 7, 2];
