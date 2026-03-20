import { eraNames, ERA_COUNT } from '../engine/eras.js';
import { calculateProduction } from '../engine/resources.js';
import { formatNumber, formatTime } from './format.js';

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
        <p className="era-hint" style={{ color: '#bb88ff' }}>
          You have reached the Multiverse — Prestige available for permanent bonuses!
        </p>
      )}
      <div className="era-stats">
        <span>{formatTime(state.totalTime)}</span>
        <span> | {upgradeCount} upgrades</span>
        <span> | {techCount} tech</span>
        {(state.totalGems || 0) > 0 && <span> | {state.totalGems} gems</span>}
        {state.prestigeMultiplier > 1 && (
          <span> | x{state.prestigeMultiplier.toFixed(1)}</span>
        )}
        {totalRate > 0 && (
          <span> | {formatNumber(totalRate)}/s</span>
        )}
      </div>
    </div>
  );
}
