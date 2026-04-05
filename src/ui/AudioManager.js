let audioCtx = null;
let muted = false;

function getCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

export function setMuted(m) { muted = m; }
export function isMuted() { return muted; }

export function playClick() {
  if (muted) return;
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
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
    gain.connect(ctx.destination);
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
      gain.connect(ctx.destination);
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
      gain.connect(ctx.destination);
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
      gain.connect(ctx.destination);
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
    gain.connect(ctx.destination);
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
        gain.connect(ctx.destination);
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
