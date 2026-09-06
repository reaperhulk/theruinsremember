import { SCORE, scoreBar } from '../data/score.js';

const frequency = midi => 440 * 2 ** ((midi - 69) / 12);

// A small synthesized ensemble: mellow keys, bowed pads, bass, and soft taps.
// The same renderer is used by the real-time player and offline audio checks.
export function createMusicInstrument(ctx, destination) {
  const mix = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass'; filter.frequency.value = 3400; filter.Q.value = 0.45;
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -12; limiter.knee.value = 12; limiter.ratio.value = 4;
  limiter.attack.value = 0.008; limiter.release.value = 0.25;
  mix.connect(filter); filter.connect(limiter); limiter.connect(destination);
  const reverb = ctx.createConvolver(), wet = ctx.createGain();
  const impulse = ctx.createBuffer(2, Math.ceil(ctx.sampleRate * 1.8), ctx.sampleRate);
  let seed = 419;
  for (let channel = 0; channel < 2; channel++) {
    const samples = impulse.getChannelData(channel);
    let previous = 0;
    for (let i = 0; i < samples.length; i++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      previous = previous * 0.65 + (seed / 4294967296 * 2 - 1) * 0.35;
      samples[i] = previous * (1 - i / samples.length) ** 3;
    }
  }
  reverb.buffer = impulse; wet.gain.value = 0.2;
  mix.connect(reverb); reverb.connect(wet); wet.connect(limiter);
  const waves = Object.fromEntries(Object.entries({ felt: [0, 1, 0.3, 0.08, 0.025], glass: [0, 1, 0.2, 0.06] }).map(([name, values]) => [name, ctx.createPeriodicWave(new Float32Array(values), new Float32Array(values.length))]));
  const voices = new Set();
  function note(event, score, start, secondsPerBeat) {
    // Do not schedule whole phrases ahead: this cap covers active and queued voices.
    if ([...voices].filter(voice => voice.end > start).length >= 24) return;
    const osc = ctx.createOscillator(), envelope = ctx.createGain(), pan = ctx.createStereoPanner();
    const length = event.beats * secondsPerBeat;
    const pad = event.instrument === 'pad', bass = event.instrument === 'bass';
    const percussion = event.instrument === 'pulse' || event.instrument === 'tick';
    osc.type = pad ? score.pad : event.instrument === 'tick' || event.instrument === 'keys' && score.keys === 'wood' ? 'triangle' : 'sine';
    osc.frequency.value = frequency(event.note);
    if (event.instrument === 'keys' && waves[score.keys]) osc.setPeriodicWave(waves[score.keys]);
    if (event.instrument === 'pulse') {
      osc.frequency.setValueAtTime(95, start); osc.frequency.exponentialRampToValueAtTime(42, start + length);
    }
    if (event.instrument === 'tick') osc.frequency.value = 720;
    const attack = Math.min(length * 0.3, pad ? 0.9 : bass ? 0.08 : percussion ? 0.005 : 0.012);
    envelope.gain.setValueAtTime(0, start);
    envelope.gain.linearRampToValueAtTime(event.gain, start + attack);
    if (pad || bass) {
      envelope.gain.linearRampToValueAtTime(event.gain * 0.7, start + length * 0.72);
      envelope.gain.linearRampToValueAtTime(0, start + length);
    } else envelope.gain.exponentialRampToValueAtTime(0.0001, start + length);
    pan.pan.value = event.pan;
    osc.connect(envelope); envelope.connect(pan); pan.connect(mix);
    const voice = { osc, envelope, pan, start, end: start + length };
    voices.add(voice);
    osc.onended = () => { osc.disconnect(); envelope.disconnect(); pan.disconnect(); voices.delete(voice); };
    osc.start(start); osc.stop(voice.end + 0.02);
  }
  function silence(fade = 0.08) {
    for (const voice of voices) {
      const now = ctx.currentTime;
      voice.envelope.gain.cancelScheduledValues(now);
      voice.envelope.gain.setTargetAtTime(0, now, fade / 4);
      voice.osc.stop(now + fade);
    }
  }
  return { note, silence, get voices() { return voices.size; } };
}

export function createMusicPlayer(ctx, destination) {
  const instrument = createMusicInstrument(ctx, destination);
  let era = 1, cycle = 0, activity = false, bar = 0, pending = [], nextBar = 0, timer = null;
  function schedule() {
    if (ctx.state !== 'running') return;
    // A background interruption drops missed beats instead of playing a backlog.
    if (nextBar < ctx.currentTime - 0.3) { nextBar = ctx.currentTime + 0.03; pending = []; }
    const horizon = ctx.currentTime + 0.22;
    if (nextBar <= horizon) {
      const { score, notes } = scoreBar(era, bar++, cycle, activity);
      const beat = 60 / score.tempo;
      pending.push(...notes.map(event => ({ event, score, beat, time: nextBar + event.at * beat })));
      pending.sort((a, b) => a.time - b.time);
      nextBar += 4 * beat;
    }
    while (pending[0]?.time <= horizon) {
      const { event, score, beat, time } = pending.shift();
      if (time >= ctx.currentTime - 0.05) instrument.note(event, score, Math.max(time, ctx.currentTime), beat);
    }
  }
  const start = () => {
    if (timer !== null) return;
    nextBar = ctx.currentTime + 0.04; pending = [];
    schedule(); timer = setInterval(schedule, 100);
  };
  const stop = () => { clearInterval(timer); timer = null; pending = []; instrument.silence(); };
  return {
    start, stop,
    setScene(nextEra, nextCycle = 0, nextActivity = false) {
      nextEra = SCORE[nextEra] ? nextEra : 1;
      if (nextEra === era && nextCycle === cycle && !!nextActivity === activity) return;
      const playing = timer !== null;
      stop(); era = nextEra; cycle = nextCycle; activity = !!nextActivity; bar = 0;
      if (playing) start();
    },
    get playing() { return timer !== null; },
    get voices() { return instrument.voices; },
  };
}
