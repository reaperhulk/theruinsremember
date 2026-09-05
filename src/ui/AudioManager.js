let audioCtx = null;
let muted = false;
let effectsVolume = 0.7;
let musicVolume = 0.18;
let effectsBus;
let musicBus;
let ambientTimer;
let musicEra = 1;

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
  if (muted) return;
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
  } catch { /* audio may be unavailable */ }
}

export function playUpgrade() {
  if (muted) return;
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
  } catch { /* audio may be unavailable */ }
}

export function playEraTransition() {
  if (muted) return;
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
    });
  } catch { /* audio may be unavailable */ }
}

export function playGemFound() {
  if (muted) return;
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
    });
  } catch { /* audio may be unavailable */ }
}

export function playAchievement() {
  if (muted) return;
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
    });
  } catch { /* audio may be unavailable */ }
}

export function playCapWarning() {
  if (muted) return;
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
  } catch { /* audio may be unavailable */ }
}

export function playPrestige() {
  if (muted) return;
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
      }
      t += 0.25;
    }
  } catch { /* audio may be unavailable */ }
}

export function setVolumes(effects, music) {
  effectsVolume = Math.max(0, Math.min(1, Number(effects) || 0));
  musicVolume = Math.max(0, Math.min(1, Number(music) || 0));
  if (effectsBus) effectsBus.gain.value = muted ? 0 : effectsVolume;
  if (musicBus) musicBus.gain.value = muted || document.hidden ? 0 : musicVolume;
}
export function setMusicEra(era) { musicEra = era; }
export function startAmbient() {
  if (ambientTimer) return;
  let phrase = 0;
  const chord = () => {
    if (muted || document.hidden || musicVolume === 0) return;
    try {
      const ctx = getCtx();
      const roots = musicEra <= 3 ? [110, 130.81, 98, 110] : musicEra <= 7 ? [130.81, 146.83, 110, 98] : [98, 123.47, 146.83, 110];
      const root = roots[phrase++ % roots.length];
      for (const ratio of [1, 1.5, musicEra >= 8 ? 2.25 : 2]) {
        const oscillator = ctx.createOscillator();
        const envelope = ctx.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.value = root * ratio;
        oscillator.connect(envelope); envelope.connect(musicBus);
        envelope.gain.setValueAtTime(0, ctx.currentTime);
        envelope.gain.linearRampToValueAtTime(0.045, ctx.currentTime + 2);
        envelope.gain.linearRampToValueAtTime(0, ctx.currentTime + 9);
        oscillator.start(); oscillator.stop(ctx.currentTime + 9);
        oscillator.onended = () => { oscillator.disconnect(); envelope.disconnect(); };
      }
    } catch { /* Audio is optional on devices without a supported output. */ }
  };
  chord();
  ambientTimer = setInterval(chord, 8000);
}
export function stopAmbient() { clearInterval(ambientTimer); ambientTimer = null; if (musicBus) musicBus.gain.value = 0; }

export function syncAudioVisibility() { setVolumes(effectsVolume, musicVolume); }
