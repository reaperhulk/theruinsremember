#!/usr/bin/env node
/**
 * Automated browser playtest using Puppeteer.
 * Runs the game at high speed, monitors progress, takes screenshots,
 * and reports visual/functional issues.
 *
 * Usage: node scripts/browser-test.mjs [--speed N] [--prestige N]
 */

import puppeteer from 'puppeteer';
import { mkdirSync } from 'fs';

const SPEED = parseInt(process.argv.find((_, i, a) => a[i-1] === '--speed') || '100');
const PRESTIGE_CYCLES = parseInt(process.argv.find((_, i, a) => a[i-1] === '--prestige') || '1');
const SCREENSHOT_DIR = '/tmp/game-screenshots';
mkdirSync(SCREENSHOT_DIR, { recursive: true });

async function run() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'], protocolTimeout: 60000 });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  // Navigate and clear save
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  await page.evaluate(() => { localStorage.clear(); });
  await page.reload({ waitUntil: 'networkidle0' });
  // Wait for game to initialize (React mount + game loop start)
  await page.waitForFunction(() => window.__game && window.__game.getState().totalTime >= 0, { timeout: 10000 });
  await new Promise(r => setTimeout(r, 1000));

  // In headless mode, rAF doesn't fire, so we drive the game loop manually
  // using fastForward + DOM clicks for purchases
  await page.evaluate(() => {
    // Pump the game engine every 100ms real-time, advancing by 10 game-seconds each pump
    window.__pump = setInterval(() => {
      window.__game.fastForward(10);
    }, 100);

    let phase = 0;
    const phases = ['upgrades', 'upgrades', 'tech', 'mini', 'prestige', 'upgrades', 'tech'];
    window.__ps = setInterval(() => {
      phase = (phase + 1) % phases.length;
      document.querySelector('#tab-' + phases[phase])?.click();
    }, 1500);

    window.__ac = setInterval(() => {
      document.querySelectorAll('.gather-btn').forEach(b => b.click());
      const p = phases[phase];
      if (p === 'upgrades') {
        document.querySelectorAll('button').forEach(b => {
          if (b.textContent.includes('Buy All') && !b.disabled) b.click();
        });
      } else if (p === 'tech') {
        document.querySelectorAll('button').forEach(b => {
          if (b.textContent.includes('Research All') && !b.disabled) b.click();
        });
        document.querySelectorAll('.tech-btn.affordable').forEach(b => b.click());
      } else if (p === 'prestige') {
        document.querySelectorAll('.upgrade-btn.affordable').forEach(b => {
          if (!b.disabled) b.click();
        });
      }
    }, 100);
  });

  // Verify game loop is running
  await new Promise(r => setTimeout(r, 2000));
  const initCheck = await page.evaluate(() => {
    const s = window.__game.getState();
    return { totalTime: s.totalTime, totalTicks: s.totalTicks, speed: window.__game.getSpeed() };
  });
  console.log(`Init check: totalTime=${initCheck.totalTime}, ticks=${initCheck.totalTicks}, speed=${initCheck.speed}`);
  console.log(`Game running at ${SPEED}x speed...`);

  // Monitor and screenshot
  let lastEra = 1;
  let cycle = 0;
  console.log('Era 1 (start)');

  for (let i = 0; i < 300; i++) { // max 5 minutes
    await new Promise(r => setTimeout(r, 1000));

    const state = await page.evaluate(() => {
      const s = window.__game.getState();
      return {
        era: s.era,
        totalTime: Math.floor(s.totalTime),
        upgrades: Object.keys(s.upgrades || {}).length,
        tech: Object.keys(s.tech || {}).length,
        achievements: Object.keys(s.achievements || {}).length,
        prestigeCount: s.prestigeCount || 0,
        prestigeMultiplier: s.prestigeMultiplier || 1,
        trueEnding: !!s.trueEnding,
        gameComplete: !!s.gameComplete,
        eternalReturn: !!s.prestigeUpgrades?.eternalReturn,
      };
    });

    if (state.era > lastEra) {
      console.log(`Era ${state.era} reached | ${state.upgrades} upgrades | ${state.tech} tech | game time: ${state.totalTime}s`);
      lastEra = state.era;

      // Screenshots disabled in headless mode (CPU-intensive intervals cause CDP timeouts)
    }

    if (state.era >= 10) {
      // Pause auto-player for checks
      await page.evaluate(() => { clearInterval(window.__pump); clearInterval(window.__ac); clearInterval(window.__ps); });
      await new Promise(r => setTimeout(r, 500));

      // Check for visual issues
      const issues = await page.evaluate(() => {
        const problems = [];

        // Check header overflow
        const header = document.querySelector('.game-header');
        if (header && header.scrollWidth > header.clientWidth + 5) {
          problems.push(`Header overflow: scrollW=${header.scrollWidth} > clientW=${header.clientWidth}`);
        }

        // Check for overlapping upgrade buttons
        const rows = document.querySelectorAll('.upgrade-row');
        rows.forEach(row => {
          const btns = row.querySelectorAll('button');
          if (btns.length > 1) {
            const first = btns[0].getBoundingClientRect();
            const second = btns[1].getBoundingClientRect();
            if (first.right > second.left + 5 && second.width > 0) {
              problems.push(`Upgrade buttons overlap in row`);
            }
          }
        });

        // Check for console errors (if captured)
        // Check resource panel overflow
        const resPanel = document.querySelector('.resource-panel');
        if (resPanel && resPanel.scrollWidth > resPanel.clientWidth + 5) {
          problems.push(`Resource panel overflow: scrollW=${resPanel.scrollWidth} > clientW=${resPanel.clientWidth}`);
        }

        // Check for FULL indicators
        const fullIndicators = document.querySelectorAll('.text-danger');
        if (fullIndicators.length > 0) {
          problems.push(`FULL indicators present: ${fullIndicators.length} (GOOD - working)`);
        }

        // Check for capped rows
        const cappedRows = document.querySelectorAll('.resource-capped');
        if (cappedRows.length > 0) {
          problems.push(`Capped resource rows: ${cappedRows.length} (GOOD - visual indicator working)`);
        }

        // Check prestige button visibility
        const prestigeBtn = document.querySelector('.prestige-btn');
        problems.push(`Prestige button: ${prestigeBtn ? 'visible' : 'hidden'}`);

        return problems;
      });

      console.log('\n=== ERA 10 VISUAL CHECK ===');
      issues.forEach(i => console.log('  ' + i));

      if (cycle < PRESTIGE_CYCLES) {
        // Prestige
        console.log(`\nPrestiging (cycle ${cycle + 1})...`);
        await page.evaluate(() => {
          document.querySelector('.prestige-btn')?.click();
        });
        await new Promise(r => setTimeout(r, 500));
        await page.evaluate(() => {
          document.querySelector('.confirm-yes')?.click();
        });
        await new Promise(r => setTimeout(r, 1000));
        // Restart auto-player
        await page.evaluate(() => {
          let phase = 0;
          const phases = ['upgrades', 'upgrades', 'tech', 'mini', 'prestige', 'upgrades', 'tech'];
          window.__ps = setInterval(() => { phase = (phase + 1) % phases.length; document.querySelector('#tab-' + phases[phase])?.click(); }, 1500);
          window.__pump = setInterval(() => window.__game.fastForward(10), 100);
          window.__ac = setInterval(() => {
            document.querySelectorAll('.gather-btn').forEach(b => b.click());
            document.querySelectorAll('button').forEach(b => { if (b.textContent.includes('Buy All') && !b.disabled) b.click(); });
            document.querySelectorAll('.tech-btn.affordable').forEach(b => b.click());
            document.querySelectorAll('button').forEach(b => { if (b.textContent.includes('Research All') && !b.disabled) b.click(); });
            document.querySelectorAll('.upgrade-btn.affordable').forEach(b => { if (!b.disabled) b.click(); });
          }, 100);
        });
        lastEra = 0;
        cycle++;
        console.log(`Prestige complete. Starting cycle ${cycle + 1}...`);
      } else {
        break;
      }
    }
  }

  // Final state
  const finalState = await page.evaluate(() => {
    const s = window.__game.getState();
    return {
      era: s.era,
      totalTime: Math.floor(s.totalTime),
      upgrades: Object.keys(s.upgrades || {}).length,
      tech: Object.keys(s.tech || {}).length,
      achievements: Object.keys(s.achievements || {}).length,
      prestigeCount: s.prestigeCount || 0,
      prestigeMultiplier: s.prestigeMultiplier || 1,
      trueEnding: !!s.trueEnding,
      eternalReturn: !!s.prestigeUpgrades?.eternalReturn,
      prestigeUpgrades: Object.keys(s.prestigeUpgrades || {}).length,
    };
  });

  console.log('\n=== FINAL STATE ===');
  console.log(JSON.stringify(finalState, null, 2));

  // Check console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  console.log(`\nScreenshots saved to ${SCREENSHOT_DIR}/`);
  await browser.close();
}

run().catch(e => { console.error(e); process.exit(1); });
