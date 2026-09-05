import { getCycleReadiness } from '../src/engine/realityForge.js';
import { getEraReadiness } from '../src/engine/eras.js';
import { getAvailableTech } from '../src/engine/tech.js';
import { getAvailableUpgrades, getUpgradeCost } from '../src/engine/upgrades.js';
import { getEffectiveCap, getNetRate } from '../src/engine/resources.js';

// Success is an assertion about the requested FINAL cycle. A high-water mark
// is telemetry, never proof that a reset or a later cycle remains playable.
export function scenarioOutcome(state, options, telemetry = {}) {
  const failures = [];
  if (options.stopOnCollapse) {
    if (!telemetry.collapsed) failures.push('the requested challenge did not collapse');
  } else {
    if ((telemetry.prestiges || 0) < (options.prestige || 0)) {
      failures.push(`completed ${telemetry.prestiges || 0}/${options.prestige} requested prestiges`);
    }
    if (state.era < options.targetEra) failures.push(`final era ${state.era}/${options.targetEra}`);
    if (options.targetEra >= 10 && !getCycleReadiness(state).ready) failures.push('final cycle is not ready to prestige');
    if (telemetry.collapsed) failures.push('an unattended cycle collapsed');
  }
  if (telemetry.actionsWhileAway > 0) failures.push('manual actions occurred while absent');
  failures.push(...(telemetry.invalidState || []));
  return { completed: failures.length === 0, failures };
}

export function validateSimulationState(state) {
  const failures = [];
  if (!Number.isInteger(state.era) || state.era < 1 || state.era > 10) failures.push('invalid era');
  for (const [id, resource] of Object.entries(state.resources)) {
    for (const field of ['amount', 'rateAdd', 'rateMult', 'capMult']) {
      if (!Number.isFinite(resource[field]) || resource[field] < 0) failures.push(`${id}.${field} is invalid`);
    }
  }
  for (const field of ['totalTime', 'prestigeMultiplier', 'prestigePoints']) {
    if (!Number.isFinite(state[field]) || state[field] < 0) failures.push(`${field} is invalid`);
  }
  return failures;
}

// Report the actual unsatisfied costs/gates. Summing unrelated resources can
// conceal a dead end forever as food grows while a required input is capped.
export function describeProgressionBlockers(state) {
  const purchases = [
    ...getAvailableTech(state).map(tech => ({ id: tech.id, kind: 'tech', cost: tech.cost })),
    ...getAvailableUpgrades(state).filter(upgrade => !upgrade.repeatable)
      .map(upgrade => ({ id: upgrade.id, kind: 'upgrade', cost: getUpgradeCost(state, upgrade.id) })),
  ];
  return {
    era: state.era,
    eraReadiness: getEraReadiness(state),
    cycleReadiness: state.era >= 10 ? getCycleReadiness(state) : null,
    purchases: purchases.map(purchase => ({
      ...purchase,
      blockers: Object.entries(purchase.cost).filter(([id, cost]) => state.resources[id]?.amount < cost)
        .map(([id, cost]) => ({
          resource: id, have: state.resources[id]?.amount || 0, need: cost,
          capacity: getEffectiveCap(state, id), netRate: getNetRate(state, id),
          overCapacity: getEffectiveCap(state, id) > 0 && cost > getEffectiveCap(state, id),
        })),
    })),
  };
}
