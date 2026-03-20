import { eraNames, ERA_COUNT } from '../engine/eras.js';
import { calculateProduction } from '../engine/resources.js';

function formatNumber(n) {
  if (n >= 1e12) return (n / 1e12).toFixed(1) + 'T';
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return n.toFixed(1);
}

function formatTime(seconds) {
  if (seconds < 60) return `${Math.floor(seconds)}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.floor(seconds % 60)}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

export function EraProgress({ state }) {
  const currentEra = eraNames[state.era] || `Era ${state.era}`;
  const isMaxEra = state.era >= ERA_COUNT;
  const upgradeCount = Object.keys(state.upgrades || {}).length;
  const techCount = Object.keys(state.tech || {}).length;

  // Calculate total production rate across all unlocked resources
  const rates = calculateProduction(state);
  const totalRate = Object.entries(rates)
    .filter(([id]) => state.resources[id]?.unlocked)
    .reduce((sum, [, rate]) => sum + Math.max(0, rate), 0);

  return (
    <div className="panel era-panel">
      <h2>Era {state.era}: {currentEra}</h2>
      {!isMaxEra && (
        <p className="era-hint">
          Research starred (★) technologies to advance to the next era
        </p>
      )}
      {isMaxEra && (
        <p className="era-hint">You have reached the Multiverse — the final frontier</p>
      )}
      <div className="era-stats">
        <span>Time played: {formatTime(state.totalTime)}</span>
        <span> | Upgrades: {upgradeCount}</span>
        <span> | Tech: {techCount}</span>
        {state.prestigeMultiplier > 1 && (
          <span> | Prestige: x{state.prestigeMultiplier.toFixed(1)}</span>
        )}
        {totalRate > 0 && (
          <span> | Total: {formatNumber(totalRate)}/s</span>
        )}
      </div>
    </div>
  );
}
