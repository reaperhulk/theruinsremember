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
import { upgrades } from '../src/data/upgrades.js';
import { prestigeUpgrades } from '../src/data/prestige-upgrades.js';

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

async function reloadWithSave(page, save, offlineSeconds = 0) {
  const script = await page.evaluateOnNewDocument((serialized, elapsed) => {
    const restored = JSON.parse(serialized);
    restored.lastSaved = Date.now() - elapsed * 1000;
    localStorage.setItem('incremental-game-save', JSON.stringify(restored));
  }, JSON.stringify(save), offlineSeconds);
  await page.reload({ waitUntil: 'networkidle0', timeout: 30000 });
  await page.removeScriptToEvaluateOnNewDocument(script.identifier);
  await page.waitForFunction(() => window.__game, { timeout: 10000 });
}

async function exercisePersistenceAndAutomation(page) {
  const legacySave = await page.evaluate(() => {
    const initial = window.__game.getState();
    const legacy = {
      ...initial,
      era: 9,
      totalTime: 500,
      tuningScore: 100,
      senate: { merchants: 20, scholars: 8, warriors: 3 },
      lastSaved: Date.now(),
    };
    delete legacy.lockedSignals;
    delete legacy.senateGov;
    return legacy;
  });
  await reloadWithSave(page, legacySave);
  const migrated = await page.evaluate(() => {
    const state = window.__game.getState();
    return {
      locks: Object.keys(state.lockedSignals || {}).sort(),
      leader: state.senateGov?.leader,
      partner: state.senateGov?.partner,
      ratified: state.senateGov?.ratified,
    };
  });

  const offlineSave = await page.evaluate(() => {
    const state = window.__game.getState();
    const totalTime = 1000;
    const offline = {
      ...state,
      era: 10,
      totalTime,
      autoBuildOut: false,
      lockedSignals: { stability: true },
      forgetting: {
        meter: 40,
        startedAt: totalTime - 20,
        depthStartedAt: totalTime - 10,
        nextSurgeAt: totalTime + 15,
        tendrils: [{
          id: 1,
          targetId: 'lock:stability',
          spawnedAt: totalTime - 5,
          spawnAngle: 1,
          arrivesAt: totalTime + 20,
          phase: 'approach',
          heldSince: null,
          consumesAt: null,
        }],
        scars: {},
        wardens: [{ id: 1, nodeId: null, movedAt: totalTime - 5 }],
        sealed: 0,
        consumed: 0,
        collapsed: false,
        nextTendrilId: 2,
      },
    };
    return offline;
  });
  await reloadWithSave(page, offlineSave, 3 * 60 * 60);
  await page.waitForFunction(() => document.querySelector('.offline-report'), { timeout: 10000 });
  const protectedOffline = await page.evaluate(() => {
    const state = window.__game.getState();
    return {
      era: state.era,
      prestigeCount: state.prestigeCount || 0,
      meter: state.forgetting?.meter,
      reportExplainsProtection: document.querySelector('.offline-report')?.textContent.includes('The Forgetting waited'),
    };
  });

  const clearSave = await page.evaluateOnNewDocument(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle0', timeout: 30000 });
  await page.removeScriptToEvaluateOnNewDocument(clearSave.identifier);
  await page.waitForFunction(() => window.__game && document.querySelector('.buildout-toggle'), { timeout: 10000 });
  const automation = await page.evaluate(() => {
    const toggle = document.querySelector('.buildout-toggle');
    const initiallyEnabled = toggle?.getAttribute('aria-pressed') === 'true';
    toggle?.click();
    return { initiallyEnabled };
  });
  await new Promise(resolve => setTimeout(resolve, 100));
  automation.disabledAfterClick = await page.evaluate(() => (
    window.__game.getState().autoBuildOut === false &&
    document.querySelector('.buildout-toggle')?.getAttribute('aria-pressed') === 'false'
  ));
  await page.evaluate(() => document.querySelector('.buildout-toggle')?.click());
  await new Promise(resolve => setTimeout(resolve, 100));
  automation.enabledAfterSecondClick = await page.evaluate(() => (
    window.__game.getState().autoBuildOut === true &&
    document.querySelector('.buildout-toggle')?.getAttribute('aria-pressed') === 'true'
  ));

  return { migrated, protectedOffline, automation };
}

async function promoteToEra10(page) {
  const era10UpgradeIds = Object.values(upgrades).filter(upgrade => upgrade.era === 10).slice(0, 20).map(upgrade => upgrade.id);
  await page.evaluate((upgradeIds) => {
    window.__game.setState(state => ({
      ...state,
      era: 10,
      lockedSignals: { stability: true },
      dockingSuccesses: 9,
      realityKeys: { temporal: 1, spatial: 1, quantum: 2 },
      nextCycleDoctrine: 'reconstruction',
      upgrades: { ...state.upgrades, ...Object.fromEntries(upgradeIds.map(id => [id, true])) },
      lifetimeHighestEra: Math.max(10, state.lifetimeHighestEra || 1),
      resources: Object.fromEntries(Object.entries(state.resources).map(([id, resource]) => [
        id,
        { ...resource, unlocked: true, amount: Math.max(resource.amount || 0, 1000) },
      ])),
    }));
  }, era10UpgradeIds);
  await new Promise(resolve => setTimeout(resolve, 300));
}

async function exerciseOrbitalOperations(page) {
  await page.evaluate(() => {
    window.__game.setState(state => ({
      ...state,
      era: 4,
      totalTime: Math.max(100, state.totalTime),
      eraStartTime: Math.max(100, state.totalTime),
      dockingMissions: { cargo: 0, crew: 0, science: 0 },
      dockingContracts: { era: 4, cargo: 0, crew: 0, science: 0 },
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

async function exerciseRelicOffer(page) {
  await page.evaluate(() => {
    window.__game.setState(state => ({
      ...state,
      echoPressure: 100,
      relicOffer: ['surveyorLens', 'voidSail', 'loomNeedle'],
    }));
  });
  await new Promise(resolve => setTimeout(resolve, 100));
  const offered = await page.evaluate(() => document.querySelectorAll('.relic-choice').length);
  await page.evaluate(() => document.querySelector('.relic-choice button')?.click());
  await new Promise(resolve => setTimeout(resolve, 100));
  return page.evaluate(offeredCount => ({
    offeredCount,
    activeCount: document.querySelectorAll('.active-relics > div').length,
    pressure: window.__game.getState().echoPressure,
  }), offered);
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

  const persistence = await exercisePersistenceAndAutomation(page);
  const migrationFailed = persistence.migrated.locks.join(',') !== 'constants,power,stability'
    || persistence.migrated.leader !== 'merchants'
    || persistence.migrated.partner !== 'scholars'
    || !persistence.migrated.ratified;
  const offlineFailed = persistence.protectedOffline.era !== 10
    || persistence.protectedOffline.prestigeCount !== 0
    || persistence.protectedOffline.meter < 40
    || persistence.protectedOffline.meter >= 41
    || !persistence.protectedOffline.reportExplainsProtection;
  const automationFailed = !persistence.automation.initiallyEnabled
    || !persistence.automation.disabledAfterClick
    || !persistence.automation.enabledAfterSecondClick;
  console.log(`  Legacy save migration: ${migrationFailed ? 'FAILED' : 'Senate government and three signal locks preserved'}`);
  console.log(`  Offline siege protection: ${offlineFailed ? 'FAILED' : 'three offline hours, no collapse or reset'}`);
  console.log(`  Automation controls: ${automationFailed ? 'FAILED' : 'build-out toggles off and on'}`);

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

    if (state.era >= 7) {
      earlyGameReached = true;
      console.log(`  Natural progression reached Era ${state.era} without injecting late-game state`);
      break;
    }
  }

  await stopPump(page);
  const orbitalOperations = await exerciseOrbitalOperations(page);
  const operationFailed = !orbitalOperations.panelVisible || orbitalOperations.missionCount !== 3;
  console.log(`  Orbital operations: ${orbitalOperations.missionCount}/3 mission choices${operationFailed ? ' (FAILED)' : ''}`);
  const relicAudit = await exerciseRelicOffer(page);
  const relicFailed = relicAudit.offeredCount !== 3 || relicAudit.activeCount !== 1 || relicAudit.pressure >= 1;
  console.log(`  Recovered relic offer: ${relicFailed ? 'FAILED' : '3 choices, 1 equipped'}`);
  await screenshot(page, 'orbital_operations');
  await stopPump(page);
  await promoteToEra10(page);
  await page.evaluate(() => document.querySelector('#tab-mini')?.click());
  await new Promise(resolve => setTimeout(resolve, 150));
  const operationShell = await page.evaluate(() => ({
    heading: document.querySelector('.operations-heading h2')?.textContent || '',
    archiveOptions: document.querySelectorAll('.operation-archive option').length,
    legacyTabs: document.querySelectorAll('.mini-game-tabs').length,
  }));
  const operationShellFailed = operationShell.heading !== 'Reality Forge' || operationShell.archiveOptions < 8 || operationShell.legacyTabs !== 0;
  console.log(`  Era-focused operation shell: ${operationShellFailed ? 'FAILED' : `${operationShell.archiveOptions - 1} archived systems`}`);
  const dysonMounted = await page.evaluate(() => {
    const select = document.querySelector('.operation-archive select');
    if (!select) return false;
    select.value = 'dyson';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  });
  await new Promise(resolve => setTimeout(resolve, 100));
  if (dysonMounted) await page.evaluate(() => document.querySelector('.dyson-modules button')?.click());
  await new Promise(resolve => setTimeout(resolve, 100));
  const dysonAudit = dysonMounted && await page.evaluate(() => ({
    moduleChoices: document.querySelectorAll('.dyson-modules button').length,
    commissioned: document.querySelector('.dyson-heading strong')?.textContent || '',
  }));
  const dysonFailed = !dysonAudit || dysonAudit.moduleChoices !== 3 || !dysonAudit.commissioned.includes('1/3');
  console.log(`  Dyson commissions: ${dysonFailed ? 'FAILED' : '3 choices, first wing commissioned'}`);
  const tuningMounted = await page.evaluate(() => {
    const select = document.querySelector('.operation-archive select');
    if (!select) return false;
    select.value = 'tuning';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  });
  await new Promise(resolve => setTimeout(resolve, 150));
  if (tuningMounted) await page.evaluate(() => document.querySelector('.signal-bands button:not([disabled])')?.click());
  await new Promise(resolve => setTimeout(resolve, 100));
  const tuningAudit = tuningMounted && await page.evaluate(() => ({
      visible: !!document.querySelector('.tuning-panel'),
      bandChoices: document.querySelectorAll('.signal-bands button').length,
      lockedHeading: document.querySelector('.tuning-header strong')?.textContent || '',
    }));
  const tuningFailed = !tuningAudit?.visible || tuningAudit.bandChoices !== 4 || !tuningAudit.lockedHeading.includes('2/3');
  console.log(`  Cosmic tuning locks: ${tuningFailed ? 'FAILED' : '4 bands, second signal locked'}`);

  const weavingMounted = await page.evaluate(() => {
    const select = document.querySelector('.operation-archive select');
    if (!select) return 0;
    select.value = 'weaving';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    return 1;
  });
  await new Promise(resolve => setTimeout(resolve, 100));
  if (weavingMounted) await page.evaluate(() => document.querySelector('.reality-laws button:not(:disabled)')?.click());
  await new Promise(resolve => setTimeout(resolve, 100));
  const weavingAudit = weavingMounted && await page.evaluate(() => ({
    lawChoices: document.querySelectorAll('.reality-laws button').length,
    established: document.querySelector('.weaving-heading strong')?.textContent || '',
  }));
  const weavingFailed = !weavingAudit || weavingAudit.lawChoices !== 4 || !weavingAudit.established.includes('1/3');
  console.log(`  Reality laws: ${weavingFailed ? 'FAILED' : '4 choices, first law established'}`);
  const senateMounted = await page.evaluate(() => {
    const select = document.querySelector('.operation-archive select');
    if (!select) return false;
    select.value = 'senate';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  });
  await new Promise(resolve => setTimeout(resolve, 100));
  if (senateMounted) await page.evaluate(() => document.querySelector('.senate-acts button:not([disabled])')?.click());
  await new Promise(resolve => setTimeout(resolve, 100));
  const senateAudit = senateMounted && await page.evaluate(() => ({
    factionChoices: document.querySelectorAll('.senate-acts button').length,
    acts: document.querySelector('.senate-panel .tuning-header strong')?.textContent || '',
  }));
  const senateFailed = !senateAudit || senateAudit.factionChoices !== 3 || !senateAudit.acts.includes('1/3');
  console.log(`  Senate policy acts: ${senateFailed ? 'FAILED' : '3 factions, mandate granted'}`);
  const colonyMounted = await page.evaluate(() => {
    const select = document.querySelector('.operation-archive select');
    if (!select) return false;
    select.value = 'colony';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  });
  await new Promise(resolve => setTimeout(resolve, 100));
  if (colonyMounted) {
    await page.evaluate(() => {
      const federation = [...document.querySelectorAll('.colony-mandates button')]
        .find(button => button.textContent.includes('Federation'));
      federation?.click();
    });
  }
  await new Promise(resolve => setTimeout(resolve, 100));
  const colonyAudit = colonyMounted && await page.evaluate(() => {
    const state = window.__game.getState();
    return {
      mandate: state.colonyMandate,
      choices: document.querySelectorAll('.colony-mandates button').length,
      staffed: Object.values(state.colonyAssignments || {}).filter(count => count > 0).length,
      explainsAutomation: document.querySelector('.colony-panel')?.textContent.includes('automatically assigns'),
    };
  });
  const colonyFailed = !colonyAudit || colonyAudit.mandate !== 'federation'
    || colonyAudit.choices !== 4 || colonyAudit.staffed !== 3 || !colonyAudit.explainsAutomation;
  console.log(`  Colony mandate automation: ${colonyFailed ? 'FAILED' : '4 mandates, federation staffs every focus'}`);
  const chartMounted = await page.evaluate(() => {
    const select = document.querySelector('.operation-archive select');
    if (!select) return false;
    select.value = 'starChart';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  });
  await new Promise(resolve => setTimeout(resolve, 100));
  if (chartMounted) await page.evaluate(() => document.querySelector('.network-plans button:not([disabled])')?.click());
  await new Promise(resolve => setTimeout(resolve, 100));
  const chartAudit = chartMounted && await page.evaluate(() => ({
    planChoices: document.querySelectorAll('.network-plans button').length,
    committed: !!document.querySelector('.network-plans button.active'),
  }));
  const chartFailed = !chartAudit || chartAudit.planChoices !== 3 || !chartAudit.committed;
  console.log(`  Star chart plans: ${chartFailed ? 'FAILED' : '3 plans, one committed'}`);
  // The Forgetting: seed a deterministic siege, drive it from the DOM mirror
  await page.evaluate(() => {
    window.__game.setState(state => ({
      ...state,
      forgetting: {
        meter: 12,
        startedAt: state.totalTime - 60,
        nextSurgeAt: state.totalTime + 3600,
        tendrils: [{ id: 1, targetId: 'lock:stability', spawnedAt: state.totalTime - 5, spawnAngle: 1.2, arrivesAt: state.totalTime + 300, phase: 'approach', heldSince: null, consumesAt: null }],
        scars: {},
        wardens: [
          { id: 1, nodeId: null, movedAt: -100 },
          { id: 2, nodeId: null, movedAt: -100 },
        ],
        sealed: 0, consumed: 0, collapsed: false, nextTendrilId: 2,
      },
    }));
  });
  const siegeMounted = await page.evaluate(() => {
    const select = document.querySelector('.operation-archive select');
    if (select) {
      select.value = '';
      select.dispatchEvent(new Event('change', { bubbles: true }));
    }
    return true;
  }) && await new Promise(resolve => setTimeout(() => resolve(true), 150)) && await page.evaluate(() => {
    const tab = [...document.querySelectorAll('.operation-modes button')].find(button => /Forgetting/.test(button.textContent));
    if (!tab) return false;
    tab.click();
    return true;
  });
  await new Promise(resolve => setTimeout(resolve, 200));
  if (siegeMounted) await page.evaluate(() => document.querySelector('.siege-threat-btn')?.click());
  await new Promise(resolve => setTimeout(resolve, 200));
  const siegeAudit = siegeMounted && await page.evaluate(() => ({
    canvas: !!document.querySelector('.siege-canvas'),
    meter: !!document.querySelector('.siege-meter'),
    stationed: document.querySelector('.forgetting-panel .tuning-header strong')?.textContent || '',
    wardenRows: document.querySelectorAll('.siege-warden-status').length,
  }));
  const siegeFailed = !siegeAudit || !siegeAudit.canvas || !siegeAudit.meter || siegeAudit.wardenRows < 2 || !siegeAudit.stationed.includes('1/2');
  if (siegeFailed) console.log('    siege debug:', JSON.stringify(siegeAudit));
  console.log(`  Forgetting siege: ${siegeFailed ? 'FAILED' : 'canvas + mirror, warden stationed via mirror'}`);
  const forgeReady = await page.evaluate(() => {
    const select = document.querySelector('.operation-archive select');
    if (!select) return false;
    select.value = '';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  });
  await new Promise(resolve => setTimeout(resolve, 150));
  const cycleReadyVisible = forgeReady && await page.evaluate(() => (
    !!document.querySelector('.reality-forge-panel .cycle-readiness') &&
    !!document.querySelector('.prestige-btn') &&
    document.querySelectorAll('.cycle-doctrines button').length === 3
  ));
  const forgeFailed = !cycleReadyVisible;
  console.log(`  Reality Forge cycle readiness: ${cycleReadyVisible ? 'visible' : 'FAILED'}`);

  let doctrineCycleFailed = false;
  const doctrineOrder = ['reconstruction', 'expansion', 'transcendence'];
  for (let cycle = 0; cycle < PRESTIGE_CYCLES; cycle++) {
    const doctrineId = doctrineOrder[cycle % doctrineOrder.length];
    if (cycle === 0) {
      await page.evaluate(() => window.__game.setState(state => ({
        ...state,
        prestigeUpgrades: { ...state.prestigeUpgrades, fastStart: true },
      })));
      await new Promise(r => setTimeout(r, 100));
    }
    await page.evaluate(index => document.querySelectorAll('.cycle-doctrines button')[index]?.click(), cycle % doctrineOrder.length);
    await new Promise(r => setTimeout(r, 100));
    await page.evaluate(() => document.querySelector('.prestige-btn')?.click());
    await new Promise(r => setTimeout(r, 200));
    await page.evaluate(() => document.querySelector('.confirm-yes')?.click());
    await new Promise(r => setTimeout(r, 300));
    const cycleStart = await page.evaluate(() => {
      const state = window.__game.getState();
      return {
        doctrine: state.cycleDoctrine,
        food: state.resources.food.amount,
        quantumKeys: state.realityKeys?.quantum || 0,
        forkHearth: !!state.upgrades.forkHearth,
        forkQuarry: !!state.upgrades.forkQuarry,
      };
    });
    const expectedSeed = cycleStart.quantumKeys * 25;
    if (cycleStart.doctrine !== doctrineId || cycleStart.food < expectedSeed || cycleStart.forkHearth || cycleStart.forkQuarry) {
      doctrineCycleFailed = true;
    }
    console.log(`  Cycle ${cycle + 1} begins with ${cycleStart.doctrine || 'no'} doctrine and ${Math.floor(cycleStart.food)} food`);
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
  console.log(`  Prestige upgrades: ${final.prestigeUpgrades}/${Object.keys(prestigeUpgrades).length}`);
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
  const exitCode = finalLayout.issues.length > 0 || tabIssues.length > 0 || consoleErrors.length > 0 || progressionFailed || migrationFailed || offlineFailed || automationFailed || operationFailed || relicFailed || operationShellFailed || dysonFailed || tuningFailed || weavingFailed || senateFailed || colonyFailed || chartFailed || siegeFailed || forgeFailed || doctrineCycleFailed ? 1 : 0;
  await browser.close();
  process.exit(exitCode);
}

run().catch(e => { console.error(e); process.exit(1); });
