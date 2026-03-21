import { getPrestigeShop, purchasePrestigeUpgrade, getPrestigeSummary } from '../engine/prestige.js';
import { eraNames } from '../engine/eras.js';

function getPrestigeInsight(state) {
  const owned = state.prestigeUpgrades || {};
  if (owned.cycleMastery) return 'You have mastered the cycle. Production flows like water through familiar channels.';
  if (owned.quantumTunneling) return 'Prerequisites blur. You remember the shortcuts from last time.';
  if (owned.infinitePatience) return 'Time holds no dominion over one who has lived forever.';
  if (owned.temporalEcho) return 'Events ripple backward through time. You catch their echoes.';
  if (owned.deepPockets) return 'The universe provides more space for those who have walked this path before.';
  if (owned.fastStart) return 'The first steps are muscle memory now.';
  if (Object.keys(owned).length > 0) return 'Each upgrade is a scar from a previous iteration.';
  return null;
}

export function PrestigePanel({ state, onUpdate }) {
  const shop = getPrestigeShop(state);
  const summary = getPrestigeSummary(state);
  const points = state.prestigePoints || 0;
  const bestTimes = state.bestEraTimes || {};

  const cycleCount = state.prestigeCount || 0;
  const prestigeLore = cycleCount === 0
    ? 'Something waits at the end of this path. You can feel it.'
    : cycleCount === 1
    ? 'You remember flashes of a previous life. The ruins make more sense now.'
    : cycleCount === 2
    ? 'The ruins make sense now. You built them.'
    : cycleCount === 3
    ? 'Third iteration. The machines remember you. They were waiting.'
    : cycleCount === 4
    ? 'Fourth cycle. You can feel the grooves worn into reality by your passage.'
    : cycleCount < 10
    ? `Cycle ${cycleCount + 1}. The universe barely resists anymore. It knows the shape of you.`
    : cycleCount < 20
    ? `Cycle ${cycleCount + 1}. You no longer build — you remember. Each upgrade is a memory of a life already lived.`
    : cycleCount < 50
    ? `Cycle ${cycleCount + 1}. The boundary between iterations blurs. Past and future are the same hallway, walked in both directions.`
    : `Cycle ${cycleCount + 1}. You are the cycle. The cycle is you. There is no difference anymore.`;

  return (
    <div className="panel prestige-panel">
      <h2>Prestige{points > 0 ? ` (${points} pts)` : ''} — {shop.filter(u => u.owned).length}/{shop.length}</h2>
      <p className="text-lore" style={{ margin: '0 0 8px', textAlign: 'center' }}>
        {prestigeLore}
      </p>
      {getPrestigeInsight(state) && (
        <p style={{ fontSize: '0.75em', color: '#7799aa', fontStyle: 'italic', margin: '0 0 8px', textAlign: 'center' }}>
          {getPrestigeInsight(state)}
        </p>
      )}
      <div className="prestige-info">
        <div className="stat-row">
          <span>Current Era:</span>
          <span>Era {state.era} ({eraNames[state.era] || 'Unknown'})</span>
        </div>
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
          <span>+{summary.points} pts, x{summary.bonus.toFixed(1)} → total x{summary.newMultiplier.toFixed(1)}{state.era < 7 ? ' (points start at Era 7)' : state.era < 10 ? ' (prestige at Era 10)' : ''}</span>
        </div>
      </div>

      <div className="upgrade-progress-bar" style={{ margin: '4px 0 8px' }}>
        <div className="upgrade-progress-fill" style={{ width: `${Math.floor(shop.filter(u => u.owned).length / shop.length * 100)}%`, background: 'linear-gradient(90deg, #8844cc, #cc44aa)' }} />
      </div>
      <h3>Upgrades ({shop.filter(u => u.owned).length}/{shop.length})</h3>
      <div className="prestige-shop">
        {[...shop].sort((a, b) => {
          // Owned first, then by cost ascending
          if (a.owned !== b.owned) return a.owned ? 1 : -1;
          return (a.cost || 0) - (b.cost || 0);
        }).map(u => (
          <button
            key={u.id}
            className={`upgrade-btn ${u.owned ? 'purchased' : u.locked ? 'locked' : u.affordable ? 'affordable' : 'too-expensive'}`}
            disabled={u.owned || !u.affordable || u.locked}
            onClick={() => onUpdate(s => purchasePrestigeUpgrade(s, u.id))}
            title={u.description}
            style={!u.owned && !u.affordable ? { opacity: u.locked ? 0.4 : 0.65 } : {}}
          >
            <div className="upgrade-name">
              {u.name}
              {u.owned && ' [OWNED]'}
            </div>
            <div className="upgrade-cost">
              {u.cost} points
              {!u.owned && !u.affordable && !u.locked && points > 0 && ` (${Math.floor(points / u.cost * 100)}% — need ${u.cost - points} more)`}
            </div>
            <div className="upgrade-desc">{u.description}</div>
            {u.locked && <div className="upgrade-desc" style={{ color: '#ff8888' }}>Requires: {u.requiresName}</div>}
            {!u.owned && !u.locked && !u.affordable && (
              <div className="upgrade-progress-bar">
                <div className={`upgrade-progress-fill ${points / u.cost > 0.8 ? 'almost' : ''}`} style={{ width: `${Math.min(Math.floor(points / u.cost * 100), 100)}%` }} />
              </div>
            )}
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
