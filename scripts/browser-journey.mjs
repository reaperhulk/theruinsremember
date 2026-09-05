#!/usr/bin/env node
// Natural UI journey: no resource grants, ownership writes, era fixtures, or
// engine purchase calls. Only time acceleration and visible player controls.
import puppeteer, { PUPPETEER_REVISIONS } from 'puppeteer';
import { Browser, computeExecutablePath, detectBrowserPlatform } from '@puppeteer/browsers';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const mobile = process.argv.includes('--mobile');
const requestedCycles = Number(process.env.JOURNEY_CYCLES || 2);
const executable = computeExecutablePath({ browser: Browser.CHROMEHEADLESSSHELL, buildId: PUPPETEER_REVISIONS['chrome-headless-shell'], cacheDir: process.env.PUPPETEER_CACHE_DIR || join(homedir(), '.cache', 'puppeteer'), platform: detectBrowserPlatform() });
const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'], executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || (existsSync(executable) ? executable : undefined) });
const page = await browser.newPage();
const errors = [];
const trace = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
await page.setViewport(mobile ? { width: 375, height: 812, isMobile: true } : { width: 1280, height: 900 });
const settle = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
const click = async selector => {
  const handle = await page.$(selector);
  if (!handle || await handle.evaluate(el => el.disabled)) { await handle?.dispose(); return false; }
  await handle.click();
  await handle.dispose();
  await settle();
  return true;
};
let commands = 0;
let cycles = 0;
let elapsed = 0;
try {
  await page.goto(process.env.GAME_URL || 'http://127.0.0.1:5173', { waitUntil: 'networkidle0' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle0' });
  await page.waitForFunction(() => !!window.__game);
  await page.evaluate(() => window.__game.setSpeed(0));
  let previousEra = 0;
  const screenshots = new Set();
  let reloaded = false;
  while (elapsed < requestedCycles * 21600 && cycles < requestedCycles) {
    const state = await page.evaluate(() => { const s = window.__game.getState(); return { era: s.era, prestigeCount: s.prestigeCount, nextDoctrine: s.nextCycleDoctrine, totalTime: s.totalTime, upgrades: Object.keys(s.upgrades).length, ready: !!document.querySelector('.prestige-btn') }; });
    if (state.era !== previousEra) {
      console.log(`Cycle ${state.prestigeCount + 1}, era ${state.era}, ${state.totalTime}s, ${state.upgrades} upgrades`);
      previousEra = state.era;
      await page.waitForFunction(() => !document.querySelector('.era-transition-overlay'), { timeout: 15000 });
      if ([1, 5, 10].includes(state.era) && !screenshots.has(state.era)) {
        mkdirSync('test-results', { recursive: true });
        await page.screenshot({ path: `test-results/${mobile ? 'mobile' : 'desktop'}-era-${state.era}.png`, fullPage: true });
        screenshots.add(state.era);
      }
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 2);
      if (overflow) throw new Error(`Horizontal overflow in era ${state.era}`);
    }
    if (state.ready) {
      cycles++;
      trace.push({ elapsed, cycle: cycles, command: 'cycle-ready' });
      if (cycles === requestedCycles) break;
      await click('#tab-prestige');
      await page.waitForSelector('.prestige-allocation', { timeout: 10000 });
      // Allocate an actual affordable reward before resetting.
      if (await click('.prestige-allocation input[type="checkbox"]:not(:disabled)')) commands++;
      if (!await click('.prestige-btn')) throw new Error('Prestige control disappeared');
      commands++;
      if (!await click('.confirm-yes')) throw new Error('Prestige confirmation missing');
      commands++;
      const count = await page.evaluate(() => window.__game.getState().prestigeCount);
      if (count !== cycles) throw new Error('Prestige did not create the expected cycle');
      continue;
    }
    // Verify a real reload of naturally earned mid-run progress.
    if (!reloaded && state.era >= 4) {
      await page.reload({ waitUntil: 'networkidle0' });
      await page.waitForFunction(() => !!window.__game);
      await page.evaluate(() => window.__game.setSpeed(0));
      const restored = await page.evaluate(() => window.__game.getState());
      if (restored.era !== state.era || Object.keys(restored.upgrades).length < state.upgrades) throw new Error('Reload lost earned progress');
      reloaded = true;
    }
    for (let slot = 0; slot < 2; slot++) {
      let acted = false;
      let command;
      if (state.era === 10 && !state.nextDoctrine) {
        await click('#tab-mini');
        acted = await click(`.cycle-doctrines button:nth-child(${state.prestigeCount % 3 + 1})`);
        command = 'doctrine';
      }
      if (!acted) {
        const techTurn = (elapsed / 10 + slot) % 2 === 0;
        await click(techTurn ? '#tab-tech' : '#tab-upgrades');
        acted = await click(techTurn ? '.tech-btn.affordable:not(:disabled)' : '.upgrade-btn.affordable:not(:disabled)');
        command = techTurn ? 'research' : 'upgrade';
      }
      if (!acted && state.era <= 3) { acted = await click('.expedition-route:not(:disabled)'); command = 'expedition'; }
      if (!acted) { acted = await click('.relic-choice button:not(:disabled)'); command = 'relic'; }
      if (!acted && state.era < 4) { acted = await click('.resource-row .gather-btn:not(:disabled)'); command = 'gather'; }
      if (acted) { commands++; trace.push({ elapsed, era: state.era, command }); if (trace.length > 100) trace.shift(); }
    }
    await page.evaluate(() => window.__game.fastForward(10));
    await settle();
    elapsed += 10;
  }
  if (cycles !== requestedCycles) throw new Error(`Only ${cycles}/${requestedCycles} cycles complete`);
  if (errors.length) throw new Error(errors.join('\n'));
  mkdirSync('test-results', { recursive: true });
  writeFileSync(`test-results/journey-${mobile ? 'mobile' : 'desktop'}-success.json`, JSON.stringify({ cycles, elapsed, commands, reloaded, errors }, null, 2));
  console.log(`PASS ${mobile ? 'mobile' : 'desktop'}: ${cycles} natural cycles, ${elapsed}s, ${commands} gameplay commands, mid-run reload preserved progress.`);
} catch (error) {
  mkdirSync('test-results', { recursive: true });
  await page.screenshot({ path: `test-results/journey-${mobile ? 'mobile' : 'desktop'}.png`, fullPage: true });
  writeFileSync('test-results/browser-journey.json', JSON.stringify({ error: error.message, elapsed, cycles, commands, errors, trace, state: await page.evaluate(() => window.__game?.getState()) }, null, 2));
  process.exitCode = 1;
  console.error(error);
} finally { await browser.close(); }
