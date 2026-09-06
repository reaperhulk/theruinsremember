import { MEMORY_MOTIF } from '../data/score.js';
import { createMusicPlayer } from './MusicPlayer.js';
let audioCtx = null;
let muted = false;
let effectsVolume = 0.7;
export const DEFAULT_AUDIO_LEVELS = { effects: 0.7, music: 0.45 };
let musicVolume = DEFAULT_AUDIO_LEVELS.music;
let effectsBus;
let musicBus;
let musicPlayer;
let musicEnabled = true;
let ambientRequested = false;
let playbackStatus = 'waiting';
const musicListeners = new Set();
export const getMusicStatus = () => playbackStatus;
export function subscribeMusic(listener) { musicListeners.add(listener); return () => musicListeners.delete(listener); }
function reportMusic(status) {
  if (playbackStatus === status) return;
  playbackStatus = status;
  for (const listener of musicListeners) listener();
}
function syncPlayback() {
  const wanted = ambientRequested && musicEnabled && !muted && musicVolume > 0 && !document.hidden;
  if (wanted && audioCtx?.state === 'running' && musicPlayer) { musicPlayer.start(); reportMusic('playing'); }
  else {
    musicPlayer?.stop();
    reportMusic(!musicEnabled || muted || musicVolume === 0 || document.hidden ? 'paused' : 'waiting');
  }
}
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
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    audioCtx.addEventListener('statechange', syncPlayback);
  }
  if (!effectsBus) {
    effectsBus = audioCtx.createGain(); effectsBus.connect(audioCtx.destination);
    musicBus = audioCtx.createGain(); musicBus.connect(audioCtx.destination);
    musicPlayer = createMusicPlayer(audioCtx, musicBus);
    musicPlayer.setScene(musicEra, musicCycle, musicActivity);
    setVolumes(effectsVolume, musicVolume);
  }
  if (audioCtx.state !== 'running' && audioCtx.state !== 'closed' && !document.hidden) audioCtx.resume().then(syncPlayback).catch(() => reportMusic('waiting'));
  return audioCtx;
}

export function setMuted(m) { muted = m; setVolumes(effectsVolume, musicVolume); }
export function isMuted() { return muted; }
export function setMusicEnabled(enabled) { musicEnabled = enabled; setVolumes(effectsVolume, musicVolume); }

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
  if (musicBus) musicBus.gain.setTargetAtTime(muted || !musicEnabled || document.hidden ? 0 : musicVolume, audioCtx.currentTime, 0.12);
  syncPlayback();
}
export function setMusicEra(era, cycle = 0, activity = 0) {
  musicEra = era; musicCycle = cycle; musicActivity = activity;
  musicPlayer?.setScene(era, cycle, activity);
}
export function startAmbient() {
  ambientRequested = true;
  if (!musicEnabled || muted || musicVolume === 0 || document.hidden) return;
  try { getCtx(); setVolumes(effectsVolume, musicVolume); } catch { reportMusic('unavailable'); }
}
export function stopAmbient() { ambientRequested = false; musicPlayer?.stop(); if (musicBus) musicBus.gain.value = 0; reportMusic('paused'); }

export function syncAudioVisibility() {
  setVolumes(effectsVolume, musicVolume);
  if (!document.hidden && ambientRequested) startAmbient();
}
