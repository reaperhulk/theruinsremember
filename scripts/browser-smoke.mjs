#!/usr/bin/env node
// Plays the first minutes through real browser input on desktop and phone
// sizes: dig, buy, catch an echo, reload, and carry over an original-game save.
// Start the dev server first: npm run dev -- --host 127.0.0.1
//   node scripts/browser-smoke.mjs [--url http://127.0.0.1:5173/] [--screenshots]
import puppeteer, { PUPPETEER_REVISIONS } from 'puppeteer';
import { Browser, computeExecutablePath, detectBrowserPlatform } from '@puppeteer/browsers';
import { existsSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const args = process.argv.slice(2);
const url = args.includes('--url') ? args[args.indexOf('--url') + 1] : 'http://127.0.0.1:5173/';
const screenshots = args.includes('--screenshots');
const shotDir = 'test-results';
if (screenshots) mkdirSync(shotDir, { recursive: true });

const cached = computeExecutablePath({ browser: Browser.CHROMEHEADLESSSHELL, buildId: PUPPETEER_REVISIONS['chrome-headless-shell'], cacheDir: process.env.PUPPETEER_CACHE_DIR || join(homedir(), '.cache', 'puppeteer'), platform: detectBrowserPlatform() });
const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'],
  executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || (existsSync(cached) ? cached : undefined),
});

const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };

async function session(name, viewport, setup, setupArg) {
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.setViewport(viewport);
  if (setup) await page.evaluateOnNewDocument(setup, setupArg);
  await page.goto(url, { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => window.__game, { timeout: 10000 });
  const state = () => page.evaluate(() => window.__game.getState());
  const shot = async label => { if (screenshots) await page.screenshot({ path: `${shotDir}/${name}-${label}.png` }); };
  const overflow = () => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  return { page, errors, state, shot, overflow, close: () => context.close() };
}

async function play(name, viewport) {
  const s = await session(name, viewport);
  const { page } = s;
  // Below 1100px the store and journal share a column behind section buttons.
  const mobile = viewport.width <= 1100;
  await page.evaluate(() => window.__game.setSpeed(0));
  await s.shot('start');

  // Dig by hand with real pointer input.
  const target = await page.$('.dig-target');
  const box = await target.boundingBox();
  check(box && box.width >= 200 && box.height >= 120, `${name}: the dig target is too small (${JSON.stringify(box)})`);
  for (let i = 0; i < 20; i++) await page.mouse.click(box.x + box.width * (0.3 + (i % 5) * 0.1), box.y + box.height / 2);
  let state = await s.state();
  check(state.clicks === 20 && state.salvage === 20, `${name}: 20 digs gave ${state.clicks} clicks and ${state.salvage} salvage`);
  const counter = await page.$eval('.salvage span', el => el.textContent);
  check(counter === '20', `${name}: counter shows ${counter}`);

  // Buy the first building from the store.
  if (mobile) await page.click('.mobile-nav button:first-child');
  await page.click('.buildings .building.affordable');
  state = await s.state();
  check(state.buildings.scavenger === 1 && state.salvage === 5, `${name}: buying a Scavenger left ${JSON.stringify(state.buildings)} and ${state.salvage} salvage`);

  // Buy an upgrade by clicking its tile (touch needs a second tap).
  await page.evaluate(() => window.__game.setState(s => ({ ...s, salvage: s.salvage + 200, runEarned: s.runEarned + 200, totalEarned: s.totalEarned + 200 })));
  const tile = await page.waitForSelector('.upgrade-tile.affordable');
  if (viewport.hasTouch) {
    // The first tap only shows what the improvement does.
    await tile.tap();
    const detail = await page.$eval('.upgrade-detail', el => el.textContent);
    check(Object.keys((await s.state()).upgrades).length === 0 && /salvage/.test(detail), `${name}: the first tap bought the improvement instead of showing it (${detail})`);
    await tile.tap();
  } else await tile.click();
  state = await s.state();
  check(Object.keys(state.upgrades).length >= 1, `${name}: no upgrade was bought from the tile`);

  // Production runs in real time.
  await page.evaluate(() => window.__game.setSpeed(1));
  const before = (await s.state()).totalEarned;
  await new Promise(resolve => setTimeout(resolve, 1500));
  check((await s.state()).totalEarned > before, `${name}: buildings did not produce`);

  // An echo appears in the ruins and can be caught.
  await page.evaluate(() => window.__game.setState(s => ({ ...s, echo: { timer: 0, active: { x: 0.4, y: 0.4, remaining: 12 } } })));
  await page.waitForSelector('.echo-orb');
  await page.click('.echo-orb');
  state = await s.state();
  check(state.echoesCaught === 1 && !state.echo.active, `${name}: the echo was not caught`);
  await s.shot('playing');

  // Every journal tab opens without errors.
  if (mobile) await page.click('.mobile-nav button:last-child');
  for (const label of ['The Cycle', 'Achievements', 'Stats', 'Options', 'Chronicle']) {
    const [tab] = await page.$$(`xpath/.//button[@role="tab"][contains(., "${label}")]`);
    check(!!tab, `${name}: missing ${label} tab`);
    if (tab) await tab.click().catch(async error => {
      throw new Error(`${label}: ${error.message} ${JSON.stringify(await tab.evaluate(el => ({ connected: el.isConnected, rect: el.getBoundingClientRect().toJSON(), top: document.elementFromPoint(el.getBoundingClientRect().x + 5, el.getBoundingClientRect().y + 5)?.outerHTML.slice(0, 120) })))}`);
    });
  }
  await s.shot('journal');
  check(await s.overflow() <= 0, `${name}: page scrolls horizontally by ${await s.overflow()}px`);

  // Progress survives a reload.
  await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));
  const saved = await s.state();
  await page.reload({ waitUntil: 'networkidle0' });
  await page.waitForFunction(() => window.__game);
  state = await s.state();
  check(state.buildings.scavenger === saved.buildings.scavenger && state.clicks === saved.clicks, `${name}: reload lost progress`);
  check(s.errors.length === 0, `${name}: console errors: ${s.errors.join(' | ')}`);
  await s.close();
}

async function legacy() {
  const old = JSON.stringify({ era: 7, lifetimeHighestEra: 9, prestigeCount: 2, resources: { labor: { amount: 1 } } });
  const t = await session('legacy', { width: 1280, height: 800 }, text => {
    if (!localStorage.getItem('the-ruins-remember-save')) localStorage.setItem('incremental-game-save', text);
  }, old);
  await t.page.waitForSelector('.modal');
  const text = await t.page.$eval('.modal', el => el.textContent);
  check(/65 memories/.test(text), `legacy: welcome said "${text}"`);
  check((await t.state()).bonusMemories === 65, 'legacy: memories were not granted');
  await t.shot('welcome');
  await t.page.click('.modal button');
  check(!(await t.page.$('.modal')), 'legacy: welcome did not close');
  check(t.errors.length === 0, `legacy: console errors: ${t.errors.join(' | ')}`);
  await t.close();
}

try {
  await play('desktop', { width: 1366, height: 768 });
  await play('tablet', { width: 900, height: 1100, isMobile: true, hasTouch: true });
  await play('phone', { width: 375, height: 812, isMobile: true, hasTouch: true });
  await legacy();
} catch (error) {
  failures.push(`crashed: ${error.stack}`);
}
await browser.close();
if (failures.length) {
  console.error(`Browser smoke test failed:\n- ${failures.join('\n- ')}`);
  process.exit(1);
}
console.log('Browser smoke test passed on desktop, tablet and phone, plus the legacy welcome.');
