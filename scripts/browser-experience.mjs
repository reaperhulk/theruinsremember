// Isolated UI fixtures complement the separately required natural journeys.
import puppeteer, { PUPPETEER_REVISIONS } from 'puppeteer';
import { Browser, computeExecutablePath, detectBrowserPlatform } from '@puppeteer/browsers';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import { runPlayerJourney } from './player-journey.mjs';
const snapshots = {};
const earned = runPlayerJourney({ persona: 'engaged', seed: 42, cycles: 2, observe: state => { snapshots[`${state.prestigeCount}:${state.era}`] = state; } });
assert(earned.completed, 'Fixture source must complete two naturally earned cycles');
const executable = computeExecutablePath({ browser: Browser.CHROMEHEADLESSSHELL, buildId: PUPPETEER_REVISIONS['chrome-headless-shell'], cacheDir: process.env.PUPPETEER_CACHE_DIR || join(homedir(), '.cache', 'puppeteer'), platform: detectBrowserPlatform() });
const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'], executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || (existsSync(executable) ? executable : undefined) });
const page = await browser.newPage();
const errors = [], checks = [];
page.on('pageerror', error => errors.push(error.message));
const url = process.env.GAME_URL || 'http://127.0.0.1:5173';
const settle = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
// Exercise native input. scrollIntoView/locator clicks can scroll overflow:hidden
// ancestors and make controls reachable to automation that a player cannot reach.
async function checkNativeScroll(selector, { touch = false } = {}) {
  const geometry = await page.$eval(selector, el => {
    const r = el.getBoundingClientRect(), parent = document.querySelector('.game-layout').getBoundingClientRect();
    return { top: r.top, bottom: r.bottom, x: r.left + r.width / 2, y: r.top + r.height / 2, height: r.height, maximum: el.scrollHeight - el.clientHeight, parentTop: parent.top, parentBottom: parent.bottom };
  });
  assert(geometry.top >= geometry.parentTop - 2 && geometry.bottom <= geometry.parentBottom + 2,
    `${selector} extends outside its visible play area: ${JSON.stringify(geometry)}`);
  if (geometry.maximum < 2) return { selector, scrollable: false };
  await page.focus(selector);
  await page.keyboard.press('Home');
  await page.waitForFunction(s => document.querySelector(s).scrollTop < 2, {}, selector);
  if (touch) {
    const distance = Math.min(120, geometry.height / 3);
    await page.touchscreen.touchStart(geometry.x, geometry.y + distance / 2);
    for (let step = 1; step <= 5; step++) await page.touchscreen.touchMove(geometry.x, geometry.y + distance / 2 - distance * step / 5);
    await page.touchscreen.touchEnd();
  } else {
    await page.mouse.move(geometry.x, geometry.y);
    await page.mouse.wheel({ deltaY: Math.min(240, geometry.maximum) });
  }
  await page.waitForFunction(s => document.querySelector(s).scrollTop > 0, {}, selector);
  const gestureScroll = await page.$eval(selector, el => el.scrollTop);
  await page.keyboard.press('End');
  await page.waitForFunction(s => { const el = document.querySelector(s); return el.scrollHeight - el.clientHeight - el.scrollTop < 2; }, {}, selector);
  assert.equal(await page.$eval('.game-layout', el => el.scrollTop), 0, 'The clipped parent must never scroll');
  await page.keyboard.press('Home');
  await page.waitForFunction(s => document.querySelector(s).scrollTop < 2, {}, selector);
  return { selector, gesture: touch ? 'touch' : 'wheel', gestureScroll, keyboardReachedBottom: true };
}
mkdirSync('test-results', { recursive: true });
try {
  await page.setViewport({ width: 1366, height: 768, hasTouch: true });
  await page.evaluateOnNewDocument(() => {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (Audio) window.AudioContext = class extends Audio {
      constructor(...args) { super(...args); window.__audioAudit = { context: this, voices: 0, peak: 0, started: 0 }; }
      createOscillator() {
        const node = super.createOscillator(), audit = window.__audioAudit;
        audit.voices++; audit.started++; audit.peak = Math.max(audit.peak, audit.voices);
        node.addEventListener('ended', () => audit.voices--); return node;
      }
    };
  });
  await page.goto(url, { waitUntil: 'networkidle0' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle0' });
  await page.waitForFunction(() => !!window.__game);
  await page.evaluate(() => window.__game.setSpeed(0));
  await page.click('h1');
  await checkNativeScroll('.tab-content');
  // Scroll a fresh player's last queued-purchase control into view, then click
  // its visible coordinates. No locator click or programmatic scrolling here.
  const target = await page.$eval('.tab-content', pane => {
    const button = [...pane.querySelectorAll('.queue-goal-btn:not(:disabled)')].at(-1);
    const r = button.getBoundingClientRect(), p = pane.getBoundingClientRect();
    return { x: p.left + p.width / 2, y: p.top + p.height / 2, deltaY: r.top + r.height / 2 - (p.top + p.height / 2), initiallyBelowPane: r.top >= p.bottom };
  });
  assert(target.initiallyBelowPane, 'Fresh-game regression must start with an offscreen control');
  await page.mouse.move(target.x, target.y);
  await page.mouse.wheel({ deltaY: target.deltaY });
  await page.waitForFunction(() => {
    const b = [...document.querySelectorAll('.queue-goal-btn:not(:disabled)')].at(-1), r = b.getBoundingClientRect();
    return document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2) === b;
  });
  const click = await page.$eval('.tab-content', pane => { const r = [...pane.querySelectorAll('.queue-goal-btn:not(:disabled)')].at(-1).getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  await page.mouse.click(click.x, click.y);
  await page.waitForFunction(() => window.__game.getState().goals.length === 1);
  checks.push({ freshGameScrollAndClick: true });
  const viewports = [[360, 800], [390, 844], [768, 1024], [1366, 768], [1440, 900], [844, 390], [683, 384]];
  for (let era = 1; era <= 10; era++) {
    await page.evaluate(fixture => window.__game.setState(() => fixture), snapshots[`0:${era}`]);
    await page.waitForFunction(() => !document.querySelector('.era-transition-overlay'));
    if (era === 10) assert(await page.$eval('.objective-panel progress', el => el.value === el.max), 'Earned economic readiness must show a completed inheritance meter');
    for (const [width, height] of viewports) {
      await page.setViewport({ width, height, hasTouch: true, deviceScaleFactor: width === 683 ? 2 : 1 });
      await settle();
      await page.evaluate(() => { document.querySelector('#section-actions')?.click(); document.querySelector('#tab-upgrades')?.click(); });
      await settle();
      const layout = await page.evaluate(() => {
        const rect = selector => { const r = document.querySelector(selector)?.getBoundingClientRect(); return r && { top: r.top, bottom: r.bottom, left: r.left, right: r.right, height: r.height }; };
        return { width: innerWidth, height: innerHeight, scrollWidth: document.documentElement.scrollWidth, scrollHeight: document.documentElement.scrollHeight, objective: rect('.objective-panel'), resources: rect('.resource-strip'), tabs: rect('.tab-bar'), primary: rect('.objective-link, .objective-purchase, .era-advance-btn'), actions: rect('.tab-content') };
      });
      assert(layout.scrollWidth <= width + 2, `Horizontal overflow: era ${era}, ${width}`);
      assert(layout.scrollHeight <= height + 2, `Page scroll: era ${era}, ${width}×${height}`);
      for (const id of ['objective', 'resources', 'tabs', 'primary']) assert(layout[id] && layout[id].top >= 0 && layout[id].bottom <= height + 2, `${id} outside viewport: era ${era}, ${width}×${height}`);
      assert(layout.actions.height >= 90, `Action pane collapsed: era ${era}, ${width}×${height}`);
      const actionsScroll = await checkNativeScroll('.tab-content', { touch: width === 390 });
      if (width <= 900) await page.click('#section-world');
      const worldScroll = await checkNativeScroll('.left-column', { touch: width === 390 });
      if (width <= 900) await page.click('#section-actions');
      checks.push({ era, width, height, ...layout, actionsScroll, worldScroll });
      if ([1, 4, 7, 10].includes(era) && [390, 1366].includes(width)) await page.screenshot({ path: `test-results/experience-era-${era}-${width}.png` });
    }
  }
  await page.evaluate(fixture => window.__game.setState(() => fixture), snapshots['1:1']);
  await page.setViewport({ width: 390, height: 844, hasTouch: true }); await settle();
  await page.screenshot({ path: 'test-results/experience-after-prestige.png' });
  const inherited = await page.evaluate(() => { const s = window.__game.getState(); return { choices: s.archive.lastChoices.length, autoGather: s.autoGather, production: s.resources.materials.rateAdd }; });
  assert(inherited.choices > 0 && inherited.autoGather && inherited.production > 0);
  checks.push({ inherited });
  await page.evaluate(fixture => window.__game.setState(() => fixture), snapshots['0:10']);
  await page.waitForFunction(() => !document.querySelector('.era-transition-overlay'));
  await page.setViewport({ width: 390, height: 844, hasTouch: true });
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await page.click('#section-world'); await page.waitForSelector('.world-status', { visible: true });
  await page.click('.world-status button'); await page.waitForSelector('.operations-shell', { visible: true });
  await page.focus('#tab-mini'); await page.keyboard.press('End'); await settle();
  assert.equal(await page.$eval('[role=tab][aria-selected=true]', el => el.id), 'tab-stats');
  await page.keyboard.press('Home'); await settle();
  assert.equal(await page.$eval('[role=tab][aria-selected=true]', el => el.id), 'tab-upgrades');
  const audio = await page.evaluate(() => ({ state: window.__audioAudit?.context.state, started: window.__audioAudit?.started, peak: window.__audioAudit?.peak }));
  assert.equal(audio.state, 'running'); assert(audio.started > 0); assert(audio.peak < 40, 'Unbounded audio voice accumulation');
  checks.push({ audio, reducedMotion: true, keyboardNavigation: true });
  // One tab owns simulation and durable writes; another must remain read-only.
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('incremental-game-save')).nextCycleDoctrine);
  const other = await browser.newPage();
  other.on('pageerror', error => errors.push(error.message));
  await other.goto(url, { waitUntil: 'networkidle0' });
  await other.waitForFunction(() => document.querySelector('.save-warning')?.textContent.includes('another tab'));
  assert.equal(await other.evaluate(() => !!window.__game), false);
  await other.click('#tab-mini');
  await other.waitForSelector('.cycle-doctrines button');
  await other.click('.cycle-doctrines button:not(.active)');
  assert.equal(await other.evaluate(() => JSON.parse(localStorage.getItem('incremental-game-save')).nextCycleDoctrine), saved);
  await page.close();
  await other.reload({ waitUntil: 'networkidle0' });
  await other.waitForFunction(() => !!window.__game);
  assert.equal(await other.evaluate(() => window.__game.getState().era), 10);
  checks.push({ exclusiveSaveOwnership: true, reloadAfterOwnerClosed: true });
  assert.deepEqual(errors, []);
  console.log(`PASS ${checks.length} experience checks: seven viewport sizes, all ten eras, native wheel/touch/keyboard scrolling, fresh-game scroll and click, reduced motion, browser audio, and save ownership.`);
} catch (error) {
  process.exitCode = 1; console.error(error);
  if (!page.isClosed()) await page.screenshot({ path: 'test-results/experience-failure.png', fullPage: true });
} finally {
  writeFileSync('test-results/experience.json', JSON.stringify({ checks, errors }, null, 2));
  await browser.close();
}
