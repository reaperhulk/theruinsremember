#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { PERSONA_IDS } from './playtest-personas.js';

export const DEFAULT_PERSONA_SEEDS = [424242, 42];
const DEFAULT_BASELINE_PATH = fileURLToPath(new URL('./baseline-results.json', import.meta.url));

export function summarizePersonaRun(run) {
  const status = run.results.completionStatus;
  const attention = run.results.engagement.attention;

  return {
    persona: run.profile,
    seed: run.options.seed,
    elapsedSeconds: status.cumulativeTime,
    activeSeconds: attention.activeSeconds,
    offlineSeconds: attention.offlineSeconds,
    manualActions: attention.manualActions,
    sessions: attention.sessions,
    finalEra: status.finalEra,
    targetEra: run.options.targetEra,
    completed: status.completed ?? (status.finalEra >= run.options.targetEra && (run.options.targetEra < 10 || status.cycleReady)),
    cycleReady: status.cycleReady,
    collapsed: status.forgettingCollapsed,
    actionsWhileAway: attention.actionsWhileAway,
  };
}

export function capturePersonaSnapshot(seeds = DEFAULT_PERSONA_SEEDS) {
  const results = [];
  for (const seed of seeds) {
    const run = spawnSync(process.execPath, [
      'scripts/bot-playtest.js',
      '--scenario', PERSONA_IDS.join(','),
      '--seed', String(seed),
      '--json',
      '--quiet',
    ], {
      cwd: process.cwd(),
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
    });

    if (run.error || run.status !== 0) {
      throw new Error(`Could not capture persona seed ${seed}: ${run.error?.message || run.stderr || `exit ${run.status}`}`);
    }

    const runs = JSON.parse(run.stdout);
    results.push(...runs.map(summarizePersonaRun));
  }

  return {
    schemaVersion: 1,
    description: 'Attention-aware player persona impact baseline',
    seeds,
    personas: PERSONA_IDS,
    results,
  };
}

export function comparePersonaSnapshots(before, after) {
  const failures = [];
  const rows = [];
  const previous = new Map(before.results.map(result => [`${result.persona}:${result.seed}`, result]));
  const current = new Map(after.results.map(result => [`${result.persona}:${result.seed}`, result]));

  for (const persona of PERSONA_IDS) {
    for (const seed of before.seeds) {
      const key = `${persona}:${seed}`;
      const prior = previous.get(key);
      const next = current.get(key);
      if (!prior || !next) {
        failures.push(`Missing ${persona} seed ${seed} in the ${prior ? 'after' : 'before'} snapshot`);
        continue;
      }

      if (!next.completed || next.finalEra < next.targetEra) failures.push(`${persona} seed ${seed} no longer reaches Era ${next.targetEra}`);
      if (prior.cycleReady && !next.cycleReady) failures.push(`${persona} seed ${seed} is no longer ready to prestige`);
      if (next.collapsed) failures.push(`${persona} seed ${seed} collapsed during the final siege`);
      if (next.actionsWhileAway > 0) failures.push(`${persona} seed ${seed} performed ${next.actionsWhileAway} actions while absent`);

      rows.push({
        persona,
        seed,
        before: prior,
        after: next,
        elapsedDelta: next.elapsedSeconds - prior.elapsedSeconds,
        activeDelta: next.activeSeconds - prior.activeSeconds,
        actionsDelta: next.manualActions - prior.manualActions,
        sessionsDelta: next.sessions - prior.sessions,
      });
    }
  }

  return { rows, failures };
}

function formatDuration(seconds) {
  const sign = seconds < 0 ? '-' : '';
  const absolute = Math.abs(seconds);
  const hours = Math.floor(absolute / 3600);
  const minutes = Math.floor((absolute % 3600) / 60);
  const remaining = absolute % 60;
  if (hours > 0) return `${sign}${hours}h${String(minutes).padStart(2, '0')}m${String(remaining).padStart(2, '0')}s`;
  return `${sign}${minutes}m${String(remaining).padStart(2, '0')}s`;
}

function formatDelta(value, duration = false) {
  if (value === 0) return duration ? '0m00s' : '0';
  return `${value > 0 ? '+' : ''}${duration ? formatDuration(value) : value}`;
}

export function formatPersonaImpact(comparison) {
  const lines = [
    'PERSONA IMPACT: BEFORE → AFTER',
    'Persona           Seed        Elapsed before → after       Δ elapsed  Δ active  Δ actions  Δ sessions  Outcome',
    '────────────────────────────────────────────────────────────────────────────────────────────────────────────────',
  ];

  for (const row of comparison.rows) {
    const elapsed = `${formatDuration(row.before.elapsedSeconds)} → ${formatDuration(row.after.elapsedSeconds)}`;
    const outcome = `Era ${row.before.finalEra} → ${row.after.finalEra}`;
    lines.push([
      row.persona.padEnd(17),
      String(row.seed).padEnd(10),
      elapsed.padEnd(28),
      formatDelta(row.elapsedDelta, true).padStart(10),
      formatDelta(row.activeDelta, true).padStart(9),
      formatDelta(row.actionsDelta).padStart(10),
      formatDelta(row.sessionsDelta).padStart(11),
      outcome,
    ].join('  '));
  }

  if (comparison.failures.length > 0) {
    lines.push('', ...comparison.failures.map(failure => `FAIL: ${failure}`));
  } else {
    lines.push('', `Compared ${comparison.rows.length} persona/seed combinations; all progression and absence invariants passed.`);
  }

  return lines.join('\n');
}

function parseArguments(args) {
  const options = { baseline: DEFAULT_BASELINE_PATH, capture: null, seeds: null };
  for (let index = 0; index < args.length; index++) {
    const argument = args[index];
    if (argument === '--baseline') options.baseline = args[++index];
    else if (argument === '--capture') options.capture = args[++index];
    else if (argument === '--seeds') options.seeds = args[++index]?.split(',').map(Number);
    else throw new Error(`Unknown argument: ${argument}`);
  }

  if (options.seeds && (!options.seeds.length || options.seeds.some(seed => !Number.isSafeInteger(seed)))) {
    throw new Error('Seeds must be a comma-separated list of safe integers');
  }
  return options;
}

function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.capture) {
    const snapshot = capturePersonaSnapshot(options.seeds || DEFAULT_PERSONA_SEEDS);
    writeFileSync(options.capture, `${JSON.stringify(snapshot, null, 2)}\n`);
    console.log(`Captured ${snapshot.results.length} persona/seed baselines in ${options.capture}`);
    return;
  }

  const baseline = JSON.parse(readFileSync(options.baseline, 'utf8'));
  if (baseline.schemaVersion !== 1 || !Array.isArray(baseline.seeds) || !Array.isArray(baseline.results)) {
    throw new Error(`Invalid persona baseline: ${options.baseline}`);
  }
  const current = capturePersonaSnapshot(options.seeds || baseline.seeds);
  const comparison = comparePersonaSnapshots(baseline, current);
  console.log(formatPersonaImpact(comparison));
  if (comparison.failures.length > 0) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
