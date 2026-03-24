#!/usr/bin/env node
/**
 * Automated browser playtest using Puppeteer.
 * Primary browser testing tool — validates UI rendering, layout,
 * accessibility, and game flow in a real browser environment.
 *
 * Usage: node scripts/browser-test.mjs [--prestige N] [--mobile] [--screenshots]
 */

import puppeteer from 'puppeteer';
import { mkdirSync, writeFileSync } from 'fs';

const PRESTIGE_CYCLES = parseInt(process.argv.find((_, i, a) => a[i-1] === '--prestige') || '0');
const MOBILE = process.argv.includes('--mobile');
const SCREENSHOTS = process.argv.includes('--screenshots');
const SCREENSHOT_DIR = '/tmp/game-screenshots';
if (SCREENSHOTS) mkdirSync(SCREENSHOT_DIR, { recursive: true });

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
        if (p === 'upgrades') document.querySelectorAll('button').forEach(b => { if (b.textContent.includes('Buy All') && !b.disabled) b.click(); });
        else if (p === 'tech') { document.querySelectorAll('button').forEach(b => { if (b.textContent.includes('Research All') && !b.disabled) b.click(); }); document.querySelectorAll('.tech-btn.affordable').forEach(b => b.click()); document.querySelectorAll('.tech-btn.affordable.era-gate-tech').forEach(b => b.click()); }
        else if (p === 'prestige') document.querySelectorAll('.upgrade-btn.affordable').forEach(b => { if (!b.disabled) b.click(); });
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

async function checkLayout(page) {
  return page.evaluate(() => {
    const issues = [];
    const ok = [];

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

  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'], protocolTimeout: 120000 });
  const page = await browser.newPage();
  await page.setViewport(viewport);

  // Capture console errors
  const consoleErrors = [];
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', err => consoleErrors.push(err.message));

  // Navigate and clear save
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 30000 });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle0', timeout: 30000 });
  await page.waitForFunction(() => window.__game, { timeout: 10000 });
  await new Promise(r => setTimeout(r, 500));

  // Start auto-player
  await startPump(page);
  console.log('Auto-player started');

  let lastEra = 1;
  let cycle = 0;
  const eraTimes = {};

  for (let tick = 0; tick < 120; tick++) { // max 2 min real time
    await new Promise(r => setTimeout(r, 1000));
    const state = await getState(page);

    if (state.era > lastEra) {
      eraTimes[state.era] = state.totalTime;
      console.log(`  Era ${state.era} | ${state.upgrades} upgrades | ${state.tech} tech | ${state.totalTime}s game time`);
      lastEra = state.era;
      await screenshot(page, `cycle${cycle}_era${state.era}`);
    }

    if (state.era >= 10) {
      // Layout checks at era 10
      await stopPump(page);
      await new Promise(r => setTimeout(r, 500));

      // Check each tab
      for (const tab of ['upgrades', 'tech', 'prestige', 'stats']) {
        await page.evaluate(t => document.querySelector('#tab-' + t)?.click(), tab);
        await new Promise(r => setTimeout(r, 200));
      }
      // Back to upgrades for layout check
      await page.evaluate(() => document.querySelector('#tab-upgrades')?.click());
      await new Promise(r => setTimeout(r, 300));

      const layout = await checkLayout(page);
      console.log('\n=== LAYOUT CHECK (Era 10) ===');
      layout.ok.forEach(o => console.log('  ✓ ' + o));
      layout.issues.forEach(i => console.log('  ✗ ' + i));

      await screenshot(page, `cycle${cycle}_era10_check`);

      if (cycle < PRESTIGE_CYCLES) {
        // Prestige
        await page.evaluate(() => document.querySelector('.prestige-btn')?.click());
        await new Promise(r => setTimeout(r, 500));
        await page.evaluate(() => document.querySelector('.confirm-yes')?.click());
        await new Promise(r => setTimeout(r, 1000));
        await startPump(page);
        lastEra = 0;
        cycle++;
        console.log(`\nPrestige #${cycle} complete. Starting cycle ${cycle + 1}...`);
      } else {
        break;
      }
    }
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

  const exitCode = (await checkLayout(page)).issues.length > 0 ? 1 : 0;
  await browser.close();
  process.exit(exitCode);
}

run().catch(e => { console.error(e); process.exit(1); });
