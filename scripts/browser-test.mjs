#!/usr/bin/env node
/**
 * Automated browser playtest using Puppeteer.
 * Primary browser testing tool — validates UI rendering, layout,
 * accessibility, and game flow in a real browser environment.
 *
 * Usage: node scripts/browser-test.mjs [--prestige N] [--mobile] [--screenshots]
 */

import puppeteer, { PUPPETEER_REVISIONS } from 'puppeteer';
import { Browser, computeExecutablePath, detectBrowserPlatform } from '@puppeteer/browsers';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const PRESTIGE_CYCLES = parseInt(process.argv.find((_, i, a) => a[i-1] === '--prestige') || '0');
const MOBILE = process.argv.includes('--mobile');
const SCREENSHOTS = process.argv.includes('--screenshots');
const GAME_URL = process.env.GAME_URL || 'http://localhost:5173';
const SCREENSHOT_DIR = '/tmp/game-screenshots';
if (SCREENSHOTS) mkdirSync(SCREENSHOT_DIR, { recursive: true });

const managedHeadlessShell = computeExecutablePath({
  browser: Browser.CHROMEHEADLESSSHELL,
  buildId: PUPPETEER_REVISIONS['chrome-headless-shell'],
  cacheDir: process.env.PUPPETEER_CACHE_DIR || join(homedir(), '.cache', 'puppeteer'),
  platform: detectBrowserPlatform(),
});

// ── Helpers ──────────────────────────────────────────────────────────────

function startPump(page) {
  return page.evaluate(() => {
    let phase = 0;
    const phases = ['upgrades', 'tech', 'prestige', 'upgrades', 'tech', 'upgrades'];
    window.__pump = setInterval(() => {
      for (let i = 0; i < 5; i++) window.__game.fastForward(10);
      const p = phases[phase++ % phases.length];
      document.querySelector('#tab-' + p)?.click();
      setTimeout(() => {
        if (p === 'upgrades') {
          const buyAll = [...document.querySelectorAll('button')].find(b => b.textContent.includes('Buy All') && !b.disabled);
          if (buyAll) buyAll.click();
          else document.querySelector('.upgrade-btn.affordable:not(:disabled)')?.click();
        }
        else if (p === 'tech') { document.querySelectorAll('button').forEach(b => { if (b.textContent.includes('Research All') && !b.disabled) b.click(); }); document.querySelectorAll('.tech-btn.affordable').forEach(b => b.click()); document.querySelectorAll('.tech-btn.affordable.era-gate-tech').forEach(b => b.click()); }
        else if (p === 'prestige') document.querySelectorAll('.upgrade-btn.affordable').forEach(b => { if (!b.disabled) b.click(); });
        const expeditionRoutes = [...document.querySelectorAll('.expedition-route:not(:disabled)')];
        expeditionRoutes.at(-1)?.click();
        document.querySelectorAll('.gather-btn').forEach(b => b.click());
      }, 10);
    }, 80);
  });
}

function stopPump(page) {
  return page.evaluate(() => {
    clearInterval(window.__pump);
    clearInterval(window.__ac);
    clearInterval(window.__ps);
  });
}

async function screenshot(page, name) {
  if (!SCREENSHOTS) return;
  await stopPump(page);
  await new Promise(r => setTimeout(r, 200));
  await page.screenshot({ path: `${SCREENSHOT_DIR}/${name}.png` });
  await startPump(page);
}

async function getState(page) {
  return page.evaluate(() => {
    const s = window.__game.getState();
    return {
      era: s.era, totalTime: Math.floor(s.totalTime),
      upgrades: Object.keys(s.upgrades || {}).length,
      tech: Object.keys(s.tech || {}).length,
      achievements: Object.keys(s.achievements || {}).length,
      prestigeCount: s.prestigeCount || 0,
      prestigeMultiplier: s.prestigeMultiplier || 1,
      trueEnding: !!s.trueEnding, gameComplete: !!s.gameComplete,
      eternalReturn: !!s.prestigeUpgrades?.eternalReturn,
      prestigeUpgrades: Object.keys(s.prestigeUpgrades || {}).length,
    };
  });
}

async function promoteToEra10(page) {
  await page.evaluate(() => {
    window.__game.setState(state => ({
      ...state,
      era: 10,
      lifetimeHighestEra: Math.max(10, state.lifetimeHighestEra || 1),
      resources: Object.fromEntries(Object.entries(state.resources).map(([id, resource]) => [
        id,
        { ...resource, unlocked: true, amount: Math.max(resource.amount || 0, 1000) },
      ])),
    }));
  });
  await new Promise(resolve => setTimeout(resolve, 300));
}

async function exerciseOrbitalOperations(page) {
  await page.evaluate(() => {
    window.__game.setState(state => ({
      ...state,
      era: 4,
      totalTime: Math.max(100, state.totalTime),
      resources: Object.fromEntries(Object.entries(state.resources).map(([id, resource]) => [
        id,
        { ...resource, unlocked: resource.unlocked || ['rocketFuel', 'orbitalInfra'].includes(id), amount: Math.max(resource.amount || 0, 1000) },
      ])),
    }));
  });
  await new Promise(resolve => setTimeout(resolve, 300));
  return page.evaluate(() => {
    const missions = [...document.querySelectorAll('.docking-missions button')];
    missions[1]?.click();
    return {
      missionCount: missions.length,
      panelVisible: !!document.querySelector('.docking-panel'),
    };
  });
}

async function checkLayout(page) {
  return page.evaluate(() => {
    const issues = [];
    const ok = [];

    const viewportWidth = document.documentElement.clientWidth;
    const documentWidth = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
    if (documentWidth > viewportWidth + 2)
      issues.push(`Document overflow: ${documentWidth} > ${viewportWidth}`);
    else ok.push(`Document fits viewport: ${viewportWidth}px`);

    // Header overflow
    const header = document.querySelector('.game-header');
    if (header && header.scrollWidth > header.clientWidth + 5)
      issues.push(`Header overflow: ${header.scrollWidth} > ${header.clientWidth}`);
    else ok.push('Header fits');

    // Panel overflow
    document.querySelectorAll('.panel').forEach(p => {
      if (p.scrollWidth > p.clientWidth + 20)
        issues.push(`Panel overflow: ${p.className.split(' ')[1] || 'unknown'}`);
    });

    // Upgrade card width (should be > 200px, not collapsed)
    const upgradeBtn = document.querySelector('.upgrade-row .upgrade-btn:first-child');
    if (upgradeBtn) {
      const w = upgradeBtn.getBoundingClientRect().width;
      if (w < 100) issues.push(`Upgrade card collapsed: ${Math.round(w)}px`);
      else if (w > viewportWidth + 2) issues.push(`Upgrade card overflows viewport: ${Math.round(w)}px > ${viewportWidth}px`);
      else ok.push(`Upgrade cards: ${Math.round(w)}px wide`);
    }

    // Upgrade name visible
    const nameDiv = document.querySelector('.upgrade-name');
    if (nameDiv) {
      const h = nameDiv.getBoundingClientRect().height;
      if (h < 5) issues.push('Upgrade name invisible');
      else ok.push(`Upgrade name: ${nameDiv.textContent.substring(0, 25)}`);
    }

    // Resource rows
    const rows = document.querySelectorAll('.resource-row');
    if (rows.length > 0) ok.push(`${rows.length} resource rows`);

    // Era panel guidance
    const eraPanel = document.querySelector('.era-panel');
    const eraHint = eraPanel?.querySelector('.era-hint');
    if (!eraPanel) issues.push('Era panel missing');
    else ok.push('Era panel visible');
    if (!eraHint || !eraHint.textContent.trim()) issues.push('Era guidance missing');
    else ok.push('Era guidance visible');

    // FULL/SLOW indicators
    const full = document.querySelectorAll('.text-danger');
    const slow = document.querySelectorAll('[title*="Production limited"]');
    const capped = document.querySelectorAll('.resource-capped');
    if (full.length) ok.push(`${full.length} FULL indicators`);
    if (slow.length) ok.push(`${slow.length} SLOW indicators`);
    if (capped.length) ok.push(`${capped.length} capped rows`);

    // Prestige button
    const prestige = document.querySelector('.prestige-btn');
    ok.push(`Prestige btn: ${prestige ? 'visible' : 'hidden'}`);

    // Actionability
    const actionable = [...document.querySelectorAll('button')]
      .filter(btn => !btn.disabled && btn.offsetParent !== null);
    const primaryActionable = actionable.filter(btn =>
      btn.classList.contains('upgrade-btn') ||
      btn.classList.contains('tech-btn') ||
      btn.classList.contains('gather-btn') ||
      btn.classList.contains('prestige-btn')
    );
    if (primaryActionable.length === 0) issues.push('No actionable economy controls visible');
    else ok.push(`${primaryActionable.length} actionable controls`);

    // Throttle warning
    const throttle = document.querySelector('[style*="supply chains"]');
    if (throttle) ok.push('Throttle warning shown');

    // Toast container
    const toasts = document.querySelectorAll('.toast');
    if (toasts.length > 3) issues.push(`Toast spam: ${toasts.length} visible`);

    return { issues, ok };
  });
}

// ── Main ─────────────────────────────────────────────────────────────────

async function run() {
  const viewport = MOBILE
    ? { width: 375, height: 812, isMobile: true, deviceScaleFactor: 2 }
    : { width: 1280, height: 900 };

  console.log(`Browser test: ${MOBILE ? 'mobile (375x812)' : 'desktop (1280x900)'}, ${PRESTIGE_CYCLES} prestige cycles`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox'],
    protocolTimeout: 120000,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || (existsSync(managedHeadlessShell) ? managedHeadlessShell : undefined),
  });
  const page = await browser.newPage();
  await page.setViewport(viewport);

  // Capture console errors
  const consoleErrors = [];
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', err => consoleErrors.push(err.message));

  // Navigate and clear save
  await page.goto(GAME_URL, { waitUntil: 'networkidle0', timeout: 30000 });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle0', timeout: 30000 });
  await page.waitForFunction(() => window.__game, { timeout: 10000 });
  await new Promise(r => setTimeout(r, 500));

  // Start auto-player
  await startPump(page);
  console.log('Auto-player started');

  let lastEra = 1;
  let earlyGameReached = false;

  for (let tick = 0; tick < 30; tick++) {
    await new Promise(r => setTimeout(r, 1000));
    const state = await getState(page);

    if (state.era > lastEra) {
      console.log(`  Era ${state.era} | ${state.upgrades} upgrades | ${state.tech} tech | ${state.totalTime}s game time`);
      lastEra = state.era;
      await screenshot(page, `early_era${state.era}`);
    }

    if (state.era >= 3) {
      earlyGameReached = true;
      break;
    }
  }

  await stopPump(page);
  const orbitalOperations = await exerciseOrbitalOperations(page);
  const operationFailed = !orbitalOperations.panelVisible || orbitalOperations.missionCount !== 3;
  console.log(`  Orbital operations: ${orbitalOperations.missionCount}/3 mission choices${operationFailed ? ' (FAILED)' : ''}`);
  await screenshot(page, 'orbital_operations');
  await stopPump(page);
  await promoteToEra10(page);

  for (let cycle = 0; cycle < PRESTIGE_CYCLES; cycle++) {
    await page.evaluate(() => document.querySelector('.prestige-btn')?.click());
    await new Promise(r => setTimeout(r, 200));
    await page.evaluate(() => document.querySelector('.confirm-yes')?.click());
    await new Promise(r => setTimeout(r, 300));
    await promoteToEra10(page);
    console.log(`  Prestige cycle ${cycle + 1} completed`);
  }

  // Always run layout check at current state
  await stopPump(page);
  await new Promise(r => setTimeout(r, 300));
  await page.evaluate(() => document.querySelector('#tab-upgrades')?.click());
  await new Promise(r => setTimeout(r, 200));
  const layout = await checkLayout(page);
  console.log('\n=== LAYOUT CHECK ===');
  layout.ok.forEach(o => console.log('  ✓ ' + o));
  layout.issues.forEach(i => console.log('  ✗ ' + i));
  await screenshot(page, 'era10_check');
  await stopPump(page);

  const tabIssues = [];
  for (const tab of ['tech', 'mini', 'trading', 'prestige', 'stats']) {
    await page.evaluate(tabId => document.querySelector('#tab-' + tabId)?.click(), tab);
    await new Promise(r => setTimeout(r, 100));
    const tabLayout = await checkLayout(page);
    tabIssues.push(...tabLayout.issues.map(issue => `${tab}: ${issue}`));
  }
  await page.evaluate(() => document.querySelector('#tab-upgrades')?.click());

  // Final state
  const final = await getState(page);
  console.log('\n=== FINAL STATE ===');
  console.log(`  Era: ${final.era} | Upgrades: ${final.upgrades} | Tech: ${final.tech}`);
  console.log(`  Achievements: ${final.achievements} | Prestige: ${final.prestigeCount} (x${final.prestigeMultiplier})`);
  console.log(`  Prestige upgrades: ${final.prestigeUpgrades}/30`);
  if (final.trueEnding) console.log('  TRUE ENDING achieved');

  // Console errors
  if (consoleErrors.length > 0) {
    console.log(`\n=== CONSOLE ERRORS (${consoleErrors.length}) ===`);
    [...new Set(consoleErrors)].slice(0, 10).forEach(e => console.log('  ' + e.substring(0, 120)));
  } else {
    console.log('\n  ✓ No console errors');
  }

  // Mobile check
  if (MOBILE) {
    const mobileLayout = await checkLayout(page);
    console.log('\n=== MOBILE LAYOUT ===');
    mobileLayout.ok.forEach(o => console.log('  ✓ ' + o));
    mobileLayout.issues.forEach(i => console.log('  ✗ ' + i));
  }

  if (SCREENSHOTS) console.log(`\nScreenshots: ${SCREENSHOT_DIR}/`);

  const finalLayout = await checkLayout(page);
  const progressionFailed = !earlyGameReached || final.era < 10 || final.prestigeCount < PRESTIGE_CYCLES;
  if (progressionFailed) {
    console.log(`\n  ✗ Progression target missed: era ${final.era}/10, prestige ${final.prestigeCount}/${PRESTIGE_CYCLES}`);
  }
  tabIssues.forEach(issue => console.log('  ✗ ' + issue));
  const exitCode = finalLayout.issues.length > 0 || tabIssues.length > 0 || consoleErrors.length > 0 || progressionFailed || operationFailed ? 1 : 0;
  await browser.close();
  process.exit(exitCode);
}

run().catch(e => { console.error(e); process.exit(1); });
