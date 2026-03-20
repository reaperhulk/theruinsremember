import { eraNames, ERA_COUNT } from '../engine/eras.js';

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
      </div>
    </div>
  );
}
