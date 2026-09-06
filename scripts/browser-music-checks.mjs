import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';

export async function installAudioAudit(page) {
  await page.evaluateOnNewDocument(() => {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return;
    window.AudioContext = class extends Audio {
      constructor(...args) {
        super(...args);
        const analyser = this.createAnalyser(); analyser.fftSize = 2048;
        const samples = new Float32Array(analyser.fftSize);
        window.__audioAudit = { context: this, analyser, voices: 0, peak: 0, started: 0,
          rms() { analyser.getFloatTimeDomainData(samples); return Math.sqrt(samples.reduce((sum, value) => sum + value * value, 0) / samples.length); } };
      }
      createOscillator() {
        const node = super.createOscillator(), audit = window.__audioAudit;
        audit.voices++; audit.started++; audit.peak = Math.max(audit.peak, audit.voices);
        node.addEventListener('ended', () => audit.voices--); return node;
      }
      createGain() {
        const node = super.createGain(), connect = node.connect.bind(node), context = this;
        node.connect = (destination, ...args) => {
          const result = connect(destination, ...args);
          if (destination === context.destination) connect(window.__audioAudit.analyser);
          return result;
        };
        return node;
      }
    };
  });
}

export async function checkMusic(page, browser, checks) {
  const playing = () => page.waitForFunction(() => document.querySelector('.music-toggle').getAttribute('aria-pressed') === 'true' && window.__audioAudit?.rms() > 0.008);
  const silent = () => page.waitForFunction(() => window.__audioAudit.rms() < 0.0008);
  assert.equal(await page.$eval('.music-toggle', button => button.getAttribute('aria-pressed')), 'false');
  await page.click('.music-toggle'); await playing();
  checks.push({ musicStartsOnItsFirstClick: true, outputRms: await page.evaluate(() => window.__audioAudit.rms()) });
  await page.click('.music-toggle'); await silent();
  assert.equal(await page.$eval('.music-toggle', button => button.getAttribute('aria-pressed')), 'false');
  await page.click('.music-toggle'); await playing();
  await page.click('.audio-controls summary');
  await page.focus('[aria-label="Effects volume"]'); await page.keyboard.press('Home');
  await page.focus('[aria-label="Music volume"]'); await page.keyboard.press('Home'); await silent();
  // Real keyboard range input, including recovery from a saved zero volume.
  for (let i = 0; i < 7; i++) await page.keyboard.press('ArrowRight');
  await playing();
  assert.equal(await page.$eval('[aria-label="Music volume"]', input => input.value), '0.35');
  await page.click('.audio-mute-all'); await silent();
  await page.click('.music-toggle'); await playing();
  assert.equal(await page.$eval('.audio-mute-all', button => button.getAttribute('aria-pressed')), 'false');
  await page.click('.music-toggle'); await silent();
  await page.waitForFunction(() => localStorage.getItem('musicEnabled') === 'false' && JSON.parse(localStorage.getItem('audioLevels')).music === 0.35);
  await page.reload({ waitUntil: 'networkidle0' });
  await page.waitForFunction(() => !!window.__game);
  await page.evaluate(() => window.__game.setSpeed(0));
  await page.click('h1');
  assert.equal(await page.$eval('.music-toggle', button => button.getAttribute('aria-pressed')), 'false');
  assert.equal(await page.$eval('[aria-label="Music volume"]', input => input.value), '0.35');
  assert.equal(await page.$eval('[aria-label="Effects volume"]', input => input.value), '0');
  await page.click('.music-toggle'); await playing();
  checks.push({ independentMusicControls: true, volumeAndPausePersist: true, resumesFromZeroVolume: true });

  const other = await browser.newPage();
  await other.bringToFront();
  await page.waitForFunction(() => document.hidden && window.__audioAudit.voices === 0, { polling: 100 });
  const scheduled = await page.evaluate(() => window.__audioAudit.started);
  await page.waitForFunction(() => window.__audioAudit.rms() < 0.0008, { polling: 100 });
  assert.equal(await page.evaluate(() => window.__audioAudit.started), scheduled, 'Hidden tabs must stop scheduling music');
  await page.bringToFront(); await playing(); await other.close();
  checks.push({ musicPausesWhenHidden: true, musicResumesWhenVisible: true });

  for (const width of [360, 390, 1366]) {
    await page.setViewport({ width, height: width < 600 ? 844 : 768, hasTouch: true });
    await page.click('.audio-controls summary');
    const panel = await page.$eval('.preferences-body', element => {
      const r = element.getBoundingClientRect();
      return { left: r.left, right: r.right, bottom: r.bottom, windowWidth: innerWidth, windowHeight: innerHeight };
    });
    assert(panel.left >= 0 && panel.right <= panel.windowWidth && panel.bottom <= panel.windowHeight, `Music controls overflow at ${width}: ${JSON.stringify(panel)}`);
    await page.screenshot({ path: `test-results/music-controls-${width}.png` });
    await page.click('.audio-controls summary');
  }
  checks.push({ musicControlsFitDesktopAndMobile: true });
  await page.setViewport({ width: 1366, height: 768, hasTouch: true });

  // Render actual PCM through the production instruments and mix. This catches
  // silent, barely audible, clipped, or missing tracks that oscillator counts miss.
  const rendered = await page.evaluate(async () => {
    const { createMusicInstrument } = await import('/src/ui/MusicPlayer.js');
    const { SCORE, scoreBar } = await import('/src/data/score.js');
    const rows = [];
    let preview;
    for (let era = 1; era <= 10; era++) {
      const seconds = 16 * 4 * 60 / SCORE[era].tempo + 2;
      const context = new OfflineAudioContext(2, Math.ceil(seconds * 22050), 22050);
      const bus = context.createGain(); bus.gain.value = 0.45; bus.connect(context.destination);
      const instrument = createMusicInstrument(context, bus), events = [];
      for (let bar = 0; bar < 16; bar++) {
        const { score, notes } = scoreBar(era, bar);
        const beat = 60 / score.tempo;
        for (const event of notes) events.push({ event, score, beat, time: (bar * 4 + event.at) * beat });
      }
      events.sort((a, b) => a.time - b.time);
      for (const event of events) instrument.note(event.event, event.score, event.time, event.beat);
      const buffer = await context.startRendering(), samples = buffer.getChannelData(0);
      let square = 0, peak = 0, finite = true;
      for (const value of samples) { square += value * value; peak = Math.max(peak, Math.abs(value)); finite &&= Number.isFinite(value); }
      const rms = Math.sqrt(square / samples.length);
      rows.push({ era, name: SCORE[era].name, seconds, rms, peak, finite });
      if (era === 1) {
        const length = Math.min(samples.length, 22050 * 28), bytes = new Uint8Array(44 + length * 2), data = new DataView(bytes.buffer);
        const label = (offset, text) => [...text].forEach((char, index) => data.setUint8(offset + index, char.charCodeAt(0)));
        label(0, 'RIFF'); data.setUint32(4, bytes.length - 8, true); label(8, 'WAVE'); label(12, 'fmt '); data.setUint32(16, 16, true);
        data.setUint16(20, 1, true); data.setUint16(22, 1, true); data.setUint32(24, 22050, true); data.setUint32(28, 44100, true); data.setUint16(32, 2, true); data.setUint16(34, 16, true);
        label(36, 'data'); data.setUint32(40, length * 2, true);
        for (let i = 0; i < length; i++) data.setInt16(44 + i * 2, Math.round(Math.max(-1, Math.min(1, samples[i])) * 32767), true);
        let binary = ''; for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
        preview = btoa(binary);
      }
    }
    return { rows, preview };
  });
  writeFileSync('test-results/embers-preview.wav', Buffer.from(rendered.preview, 'base64'));
  writeFileSync('test-results/music-render.json', JSON.stringify(rendered.rows, null, 2));
  for (const row of rendered.rows) assert(row.finite && row.rms > 0.012 && row.rms < 0.16 && row.peak < 0.8, `Music level out of range: ${JSON.stringify(row)}`);
  checks.push({ renderedSoundtracks: rendered.rows });
}
