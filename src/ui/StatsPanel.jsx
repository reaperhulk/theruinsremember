import { eraNames } from '../engine/eras.js';
import { getPrestigeSummary } from '../engine/prestige.js';
import { getAchievementList } from '../engine/achievements.js';
import { formatTime } from './format.js';

export function StatsPanel({ state }) {
  const achievementList = getAchievementList(state);
  const earnedCount = achievementList.filter(a => a.earned).length;
  const summary = getPrestigeSummary(state);

  return (
    <div className="panel stats-panel">
      <h2>Statistics</h2>
      <div className="stats-grid">
        <div className="stat-row">
          <span>Current Era</span>
          <span>{eraNames[state.era] || `Era ${state.era}`}</span>
        </div>
        <div className="stat-row">
          <span>Play Time</span>
          <span>{formatTime(state.totalTime)}</span>
        </div>
        <div className="stat-row">
          <span>Upgrades</span>
          <span>{Object.keys(state.upgrades).length}</span>
        </div>
        <div className="stat-row">
          <span>Technologies</span>
          <span>{Object.keys(state.tech).length}</span>
        </div>
        <div className="stat-row">
          <span>Gems Found</span>
          <span>{state.totalGems || 0}</span>
        </div>
        <div className="stat-row">
          <span>Trades</span>
          <span>{state.totalTrades || 0}</span>
        </div>
        <div className="stat-row">
          <span>Hacks</span>
          <span>{state.hackSuccesses || 0}</span>
        </div>
        <div className="stat-row">
          <span>Perfect Docks</span>
          <span>{state.dockingPerfects || 0}</span>
        </div>
        <div className="stat-row">
          <span>Weaves</span>
          <span>{state.totalWeaves || 0}</span>
        </div>
        <div className="stat-row">
          <span>Prestige Count</span>
          <span>{state.prestigeCount || 0}</span>
        </div>
        <div className="stat-row">
          <span>Prestige Points</span>
          <span>{state.prestigePoints || 0}</span>
        </div>
        <div className="stat-row">
          <span>Mini-game Combos</span>
          <span>Dock: {state.dockingCombo || 0} | Weave: {state.weaveCombo || 0}</span>
        </div>
        <div className="stat-row">
          <span>Production Mult</span>
          <span>x{state.prestigeMultiplier.toFixed(1)}</span>
        </div>
        {state.prestigeCount > 0 && (
          <>
            <div className="stat-row">
              <span>Lifetime Play</span>
              <span>{formatTime((state.lifetimePlayTime || 0) + state.totalTime)}</span>
            </div>
            <div className="stat-row">
              <span>Best Era</span>
              <span>{eraNames[state.lifetimeHighestEra] || 'N/A'}</span>
            </div>
          </>
        )}
      </div>

      <h3>Achievements ({earnedCount}/{achievementList.length})</h3>
      <div className="achievement-progress-bar">
        <div className="achievement-progress-fill" style={{ width: `${Math.floor(earnedCount / achievementList.length * 100)}%` }} />
      </div>
      <div className="achievement-list">
        {achievementList.map(a => (
          <div key={a.id} className={`achievement ${a.earned ? 'earned' : 'locked'}`}>
            <span className="achievement-name">
              {a.earned ? a.name : '???'}
            </span>
            <span className="achievement-desc">
              {a.earned ? `${a.description} (+${a.reward}pts)` : 'Hidden'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
