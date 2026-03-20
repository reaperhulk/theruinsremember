import { eraNames, ERA_COUNT, getMinUpgradesForEra, countEraUpgrades } from '../engine/eras.js';
import { upgrades as upgradeDefs } from '../data/upgrades.js';
import { calculateProduction } from '../engine/resources.js';
import { formatNumber, formatTime } from './format.js';

export function EraProgress({ state }) {
  const currentEra = eraNames[state.era] || `Era ${state.era}`;
  const isMaxEra = state.era >= ERA_COUNT;
  const upgradeCount = Object.keys(state.upgrades || {}).length;
  const techCount = Object.keys(state.tech || {}).length;
  const eraUpgradeCount = countEraUpgrades(state, state.era);
  const minUpgrades = getMinUpgradesForEra(state.era);
  const upgradesMet = eraUpgradeCount >= minUpgrades;
  const totalEraUpgrades = Object.values(upgradeDefs).filter(u => u.era === state.era).length;
  const eraCompletion = totalEraUpgrades > 0 ? Math.floor(eraUpgradeCount / totalEraUpgrades * 100) : 0;

  // Calculate total production rate across all unlocked resources
  const rates = calculateProduction(state);
  const totalRate = Object.entries(rates)
    .filter(([id]) => state.resources[id]?.unlocked)
    .reduce((sum, [, rate]) => sum + Math.max(0, rate), 0);

  return (
    <div className="panel era-panel">
      <h2>Era {state.era}: {currentEra}</h2>
      {!isMaxEra && !upgradesMet && (
        <p className="era-hint">
          Buy {minUpgrades - eraUpgradeCount} more upgrades, then research ★ tech to advance
        </p>
      )}
      {!isMaxEra && upgradesMet && (
        <p className="era-hint" style={{ color: '#88ff88' }}>
          Research starred (★) technologies to advance to the next era
        </p>
      )}
      {!isMaxEra && (
        <>
          <p className="era-hint" style={{ color: upgradesMet ? '#88ff88' : '#ffcc44' }}>
            Upgrades: {eraUpgradeCount}/{minUpgrades} needed ({eraCompletion}% of era)
            {upgradesMet ? ' ✓' : ''}
          </p>
          {!upgradesMet && (
            <div className="upgrade-progress-bar" style={{ margin: '2px 0 4px' }}>
              <div className={`upgrade-progress-fill ${eraUpgradeCount / minUpgrades > 0.8 ? 'almost' : ''}`} style={{ width: `${Math.floor(eraUpgradeCount / minUpgrades * 100)}%` }} />
            </div>
          )}
        </>
      )}
      {isMaxEra && (
        <p className="era-hint" style={{ color: '#bb88ff' }}>
          You have reached the Multiverse — Prestige available for permanent bonuses!
        </p>
      )}
      <div className="era-stats">
        <span>{formatTime(state.totalTime)}</span>
        <span> | {upgradeCount} upgrades | {techCount} tech</span>
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
