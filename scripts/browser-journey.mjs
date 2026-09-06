#!/usr/bin/env node
// Natural UI journey: no resource grants, ownership writes, era fixtures, or
// engine purchase calls. Only time acceleration and visible player controls.
import { createPacingMonitor } from './journey-pacing.mjs';
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
await page.setViewport(mobile ? { width: 375, height: 812, isMobile: true } : { width: 1366, height: 768 });
const settle = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
const click = async selector => {
  if (mobile) {
    const section = /relic-choice/.test(selector) ? '#section-world' : '#section-actions';
    const navigation = await page.$(section);
    if (navigation) { await navigation.click(); await navigation.dispose(); await settle(); }
  }
  const handle = await page.$(selector);
  if (!handle || await handle.evaluate(el => el.disabled)) { await handle?.dispose(); return false; }
  await handle.evaluate(el => el.scrollIntoView({ block: 'center', inline: 'center' }));
  await settle();
  await handle.hover();
  await settle();
  const target = await handle.evaluate(el => {
    const r = el.getBoundingClientRect();
    const hit = document.elementFromPoint((r.left + r.right) / 2, (Math.max(0, r.top) + Math.min(innerHeight, r.bottom)) / 2);
    return { name: el.textContent.trim().slice(0, 180), hit: hit?.closest('button, a')?.textContent.trim().slice(0, 180), unobscured: !!hit && el.contains(hit) };
  });
  if (!target.unobscured) throw new Error(`Control is obscured: ${selector} ${JSON.stringify(target)}`);
  const changesGame = /upgrade-btn|tech-btn|expedition-route|relic-choice|gather-btn|cycle-doctrines|confirm-yes/.test(selector);
  const before = changesGame && await page.evaluate(() => { const s = window.__game.getState(); return JSON.stringify([s.resources, s.upgrades, s.tech, s.activeRelics, s.nextCycleDoctrine, s.prestigeCount]); });
  await handle.click();
  await handle.dispose();
  await settle();
  if (changesGame) {
    const after = await page.evaluate(() => { const s = window.__game.getState(); return JSON.stringify([s.resources, s.upgrades, s.tech, s.activeRelics, s.nextCycleDoctrine, s.prestigeCount]); });
    if (before === after) throw new Error(`Enabled gameplay control had no effect: ${selector} ${JSON.stringify(target)}`);
  }
  return true;
};
let commands = 0;
let cycles = 0;
let elapsed = 0;
const pacing = createPacingMonitor({ attention: {} });
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
    const state = await page.evaluate(() => { const s = window.__game.getState(); return { era: s.era, prestigeCount: s.prestigeCount, nextDoctrine: s.nextCycleDoctrine, totalTime: s.totalTime, upgrades: Object.keys(s.upgrades).length, ready: !!document.querySelector('.prestige-btn'), progress: { era: s.era, prestigeCount: s.prestigeCount, upgrades: s.upgrades, tech: s.tech, wovenLaws: s.wovenLaws, lockedSignals: s.lockedSignals, dysonSegments: s.dysonSegments, realityKeys: s.realityKeys, nextCycleDoctrine: s.nextCycleDoctrine } }; });
    pacing.observe(state.progress, elapsed, elapsed);
    if (pacing.failures.length) throw new Error(pacing.failures.join('; '));
    if (state.era !== previousEra) {
      console.log(`Cycle ${state.prestigeCount + 1}, era ${state.era}, ${state.totalTime}s, ${state.upgrades} upgrades`);
      previousEra = state.era;
      await page.waitForFunction(() => !document.querySelector('.era-transition-overlay'), { timeout: 15000 });
      if ([1, 4, 7, 10].includes(state.era) && !screenshots.has(state.era)) {
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
      let acted = await click('.era-advance-btn');
      let command = acted ? 'continue-era' : undefined;
      const current = await page.evaluate(() => { const s = window.__game.getState(); return { era: s.era, prestigeCount: s.prestigeCount, nextDoctrine: s.nextCycleDoctrine }; });
      if (!acted && current.era === 10 && !current.nextDoctrine) {
        await click('#tab-mini');
        acted = await click(`.cycle-doctrines button:nth-child(${current.prestigeCount % 3 + 1})`);
        command = 'doctrine';
      }
      if (!acted) {
        const techTurn = (elapsed / 10 + slot) % 2 === 0;
        await click(techTurn ? '#tab-tech' : '#tab-upgrades');
        acted = await click(techTurn ? '.tech-btn.affordable:not(:disabled)' : '.upgrade-btn.affordable:not(:disabled)');
        command = techTurn ? 'research' : 'upgrade';
      }
      if (!acted && state.era <= 3) { await click('#tab-mini'); acted = await click('.expedition-route:not(:disabled)'); command = 'expedition'; }
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
  writeFileSync(`test-results/journey-${mobile ? 'mobile' : 'desktop'}-success.json`, JSON.stringify({ cycles, elapsed, commands, reloaded, errors, pacing: pacing.report() }, null, 2));
  console.log(`PASS ${mobile ? 'mobile' : 'desktop'}: ${cycles} natural cycles, ${elapsed}s, ${commands} gameplay commands, mid-run reload preserved progress.`);
} catch (error) {
  mkdirSync('test-results', { recursive: true });
  await page.screenshot({ path: `test-results/journey-${mobile ? 'mobile' : 'desktop'}.png`, fullPage: true });
  writeFileSync('test-results/browser-journey.json', JSON.stringify({ error: error.message, elapsed, cycles, commands, errors, trace, state: await page.evaluate(() => window.__game?.getState()) }, null, 2));
  process.exitCode = 1;
  console.error(error);
} finally { await browser.close(); }
