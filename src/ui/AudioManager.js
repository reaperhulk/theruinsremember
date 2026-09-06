import { SCORE, MEMORY_MOTIF } from '../data/score.js';
let audioCtx = null;
let muted = false;
let effectsVolume = 0.7;
let musicVolume = 0.18;
let effectsBus;
let musicBus;
let ambientTimer;
let musicEra = 1;
let musicCycle = 0;
let musicActivity = 0;
const cueTimes = new Map();
function allowCue(id, interval) {
  if (muted || document.hidden || effectsVolume === 0) return false;
  const now = performance.now();
  if (now - (cueTimes.get(id) ?? -Infinity) < interval) return false;
  cueTimes.set(id, now); return true;
}
function voice(ctx, bus, frequency, type, start, length, volume, attack = 0.03) {
  const osc = ctx.createOscillator(), gain = ctx.createGain();
  osc.type = type; osc.frequency.value = frequency; osc.connect(gain); gain.connect(bus);
  gain.gain.setValueAtTime(0, start); gain.gain.linearRampToValueAtTime(volume, start + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + length);
  osc.start(start); osc.stop(start + length);
      osc.onended = () => { osc.disconnect(); gain.disconnect(); };
  osc.onended = () => { osc.disconnect(); gain.disconnect(); };
}
export function playDiscovery() {
  if (!allowCue('discovery', 3500)) return;
  try { const ctx = getCtx(); for (const [i, note] of MEMORY_MOTIF.entries()) voice(ctx, effectsBus, 220 * 2 ** (note / 12), 'sine', ctx.currentTime + i * 0.18, 0.65, 0.035); } catch { /* optional output */ }
}
export function playChoice() {
  if (!allowCue('choice', 2000)) return;
  try { const ctx = getCtx(); [147, 220, 294].forEach((f, i) => voice(ctx, effectsBus, f, 'triangle', ctx.currentTime + i * 0.12, 0.8, 0.025)); } catch { /* optional output */ }
}
export function playConstruction() {
  if (!allowCue('construction', 12000)) return;
  try { const ctx = getCtx(); voice(ctx, effectsBus, 165, 'sine', ctx.currentTime, 0.4, 0.018); } catch { /* optional output */ }
}

function getCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (!effectsBus) {
    effectsBus = audioCtx.createGain(); effectsBus.connect(audioCtx.destination);
    musicBus = audioCtx.createGain(); musicBus.connect(audioCtx.destination);
    setVolumes(effectsVolume, musicVolume);
  }
  if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
  return audioCtx;
}

export function setMuted(m) { muted = m; setVolumes(effectsVolume, musicVolume); }
export function isMuted() { return muted; }

export function playClick() {
  if (!allowCue('click', 100)) return;
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(effectsBus);
    osc.frequency.value = 800;
    osc.type = 'sine';
    gain.gain.value = 0.05;
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
    osc.onended = () => { osc.disconnect(); gain.disconnect(); };
  } catch { /* audio may be unavailable */ }
}

export function playUpgrade() {
  if (!allowCue('upgrade', 300)) return;
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(effectsBus);
    osc.frequency.value = 600;
    osc.type = 'triangle';
    gain.gain.value = 0.06;
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
    osc.onended = () => { osc.disconnect(); gain.disconnect(); };
  } catch { /* audio may be unavailable */ }
}

export function playEraTransition() {
  if (!allowCue('eratransition', 2500)) return;
  try {
    const ctx = getCtx();
    [400, 500, 600, 800].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(effectsBus);
      osc.frequency.value = freq;
      osc.type = 'sine';
      gain.gain.value = 0.04;
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.3);
      osc.start(ctx.currentTime + i * 0.15);
      osc.stop(ctx.currentTime + i * 0.15 + 0.3);
      osc.onended = () => { osc.disconnect(); gain.disconnect(); };
    });
  } catch { /* audio may be unavailable */ }
}

export function playGemFound() {
  if (!allowCue('gemfound', 1800)) return;
  try {
    const ctx = getCtx();
    // Sparkle: quick ascending cluster of high tones
    [1047, 1319, 1568, 2093].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(effectsBus);
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.04, ctx.currentTime + i * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.05 + 0.15);
      osc.start(ctx.currentTime + i * 0.05);
      osc.stop(ctx.currentTime + i * 0.05 + 0.15);
      osc.onended = () => { osc.disconnect(); gain.disconnect(); };
    });
  } catch { /* audio may be unavailable */ }
}

export function playAchievement() {
  if (!allowCue('achievement', 2500)) return;
  try {
    const ctx = getCtx();
    // Fanfare: rising arpeggio C4-E4-G4-C5
    [261, 330, 392, 523].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(effectsBus);
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.07, ctx.currentTime + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.3);
      osc.start(ctx.currentTime + i * 0.08);
      osc.stop(ctx.currentTime + i * 0.08 + 0.3);
      osc.onended = () => { osc.disconnect(); gain.disconnect(); };
    });
  } catch { /* audio may be unavailable */ }
}

export function playCapWarning() {
  if (!allowCue('capwarning', 30000)) return;
  try {
    const ctx = getCtx();
    // Low rumble: sawtooth at ~65 Hz with slow fade
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(effectsBus);
    osc.type = 'sawtooth';
    osc.frequency.value = 65;
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.start();
    osc.stop(ctx.currentTime + 0.6);
      osc.onended = () => { osc.disconnect(); gain.disconnect(); };
  } catch { /* audio may be unavailable */ }
}

export function playPrestige() {
  if (!allowCue('prestige', 2500)) return;
  try {
    const ctx = getCtx();
    // Orchestral swell: two staggered chord waves
    const chords = [
      [261, 330, 392],   // C major
      [294, 370, 440],   // D major
      [349, 440, 523],   // F major
    ];
    let t = 0;
    for (const chord of chords) {
      for (const freq of chord) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(effectsBus);
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.001, ctx.currentTime + t);
        gain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + t + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.7);
        osc.start(ctx.currentTime + t);
        osc.stop(ctx.currentTime + t + 0.7);
      osc.onended = () => { osc.disconnect(); gain.disconnect(); };
      }
      t += 0.25;
    }
  } catch { /* audio may be unavailable */ }
}

export function setVolumes(effects, music) {
  effectsVolume = Math.max(0, Math.min(1, Number(effects) || 0));
  musicVolume = Math.max(0, Math.min(1, Number(music) || 0));
  if (effectsBus) effectsBus.gain.setTargetAtTime(muted || document.hidden ? 0 : effectsVolume, audioCtx.currentTime, 0.04);
  if (musicBus) musicBus.gain.setTargetAtTime(muted || document.hidden ? 0 : musicVolume, audioCtx.currentTime, 0.3);
}
export function setMusicEra(era, cycle = 0, activity = 0) { musicEra = era; musicCycle = cycle; musicActivity = activity; }
export function startAmbient() {
  if (ambientTimer) return;
  let phrase = 0;
  const chord = () => {
    if (muted || document.hidden || musicVolume === 0) return;
    try {
      const ctx = getCtx();
      const score = SCORE[musicEra] || SCORE[1];
      const movement = [1, 1, 0.89, 1.125, 1, 0.75, 0.89, 1][phrase % 8];
      const root = score.root * movement;
      for (const ratio of score.voices) voice(ctx, musicBus, root * ratio, score.type, ctx.currentTime, 9, 0.08 / score.voices.length, 2);
      // The first camp's four-note motif returns in altered register after reset.
      if (phrase % 3 === 0) for (const [i, note] of MEMORY_MOTIF.entries()) {
        const semitones = musicCycle >= 2 ? 7 - note : note;
        voice(ctx, musicBus, root * (musicCycle ? 2 : 1) * 2 ** (semitones / 12), 'sine', ctx.currentTime + 1 + i * 0.7, 2.2, 0.021, 0.2);
      }
      const beats = score.pulse + (musicActivity && score.pulse ? 1 : 0);
      for (let i = 0; i < beats; i++) voice(ctx, musicBus, root / 2, 'triangle', ctx.currentTime + i * 8 / beats, 0.18, 0.012, 0.008);
      phrase++;

    } catch { /* Audio is optional on devices without a supported output. */ }
  };
  chord();
  ambientTimer = setInterval(chord, 8000);
}
export function stopAmbient() { clearInterval(ambientTimer); ambientTimer = null; if (musicBus) musicBus.gain.value = 0; }

export function syncAudioVisibility() { setVolumes(effectsVolume, musicVolume); }
