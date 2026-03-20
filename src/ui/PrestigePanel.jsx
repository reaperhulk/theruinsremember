import { getPrestigeShop, purchasePrestigeUpgrade, getPrestigeSummary } from '../engine/prestige.js';

export function PrestigePanel({ state, onUpdate }) {
  const shop = getPrestigeShop(state);
  const summary = getPrestigeSummary(state);
  const points = state.prestigePoints || 0;
  const bestTimes = state.bestEraTimes || {};

  return (
    <div className="panel prestige-panel">
      <h2>Prestige ({points} pts, {shop.filter(u => u.owned).length}/{shop.length} owned)</h2>
      <div className="prestige-info">
        <div className="stat-row">
          <span>Prestige Points:</span>
          <span>{points}</span>
        </div>
        <div className="stat-row">
          <span>Prestige Count:</span>
          <span>{state.prestigeCount || 0}</span>
        </div>
        <div className="stat-row">
          <span>Current Multiplier:</span>
          <span>x{state.prestigeMultiplier.toFixed(1)}</span>
        </div>
        <div className="stat-row">
          <span>Next Prestige:</span>
          <span>+{summary.points} pts, x{summary.bonus.toFixed(1)} → total x{summary.newMultiplier.toFixed(1)}{state.era < 10 ? ' (Era 10 needed)' : ''}</span>
        </div>
      </div>

      <h3>Upgrades ({shop.filter(u => u.owned).length}/{shop.length})</h3>
      <div className="prestige-shop">
        {shop.map(u => (
          <button
            key={u.id}
            className={`upgrade-btn ${u.owned ? 'purchased' : u.locked ? 'locked' : u.affordable ? 'affordable' : 'too-expensive'}`}
            disabled={u.owned || !u.affordable || u.locked}
            onClick={() => onUpdate(s => purchasePrestigeUpgrade(s, u.id))}
            title={u.description}
          >
            <div className="upgrade-name">
              {u.name}
              {u.owned && ' [OWNED]'}
            </div>
            <div className="upgrade-cost">{u.cost} points</div>
            <div className="upgrade-desc">{u.description}</div>
            {u.locked && <div className="upgrade-desc" style={{ color: '#ff8888' }}>Requires: {u.requiresName}</div>}
          </button>
        ))}
      </div>

      <h3>Milestones</h3>
      <div className="stats-grid">
        <div className="stat-row">
          <span>Total Prestiges:</span>
          <span>{state.prestigeCount || 0}</span>
        </div>
        <div className="stat-row">
          <span>Highest Era:</span>
          <span>{state.lifetimeHighestEra || state.era}</span>
        </div>
        <div className="stat-row">
          <span>Lifetime Gems:</span>
          <span>{(state.lifetimeGems || 0) + (state.totalGems || 0)}</span>
        </div>
        <div className="stat-row">
          <span>Lifetime Trades:</span>
          <span>{(state.lifetimeTrades || 0) + (state.totalTrades || 0)}</span>
        </div>
        <div className="stat-row">
          <span>Lifetime Play:</span>
          <span>{Math.floor(((state.lifetimePlayTime || 0) + state.totalTime) / 60)}m</span>
        </div>
        <div className="stat-row">
          <span>Upgrades Owned:</span>
          <span>{Object.keys(state.upgrades || {}).length} / {Object.keys(state.prestigeUpgrades || {}).length} prestige</span>
        </div>
      </div>
      {Object.keys(bestTimes).length > 0 && (
        <>
          <h3>Best Era Times</h3>
          <div className="stats-grid">
            {Object.entries(bestTimes)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([era, time]) => (
                <div key={era} className="stat-row">
                  <span>Era {era}:</span>
                  <span>{Math.floor(time / 60)}m {Math.floor(time % 60)}s</span>
                </div>
              ))}
          </div>
        </>
      )}
    </div>
  );
}
