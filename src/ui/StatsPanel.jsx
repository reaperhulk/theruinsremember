import { eraNames, countEraUpgrades } from '../engine/eras.js';
import { getPrestigeSummary } from '../engine/prestige.js';
import { getAchievementList } from '../engine/achievements.js';
import { formatTime, formatNumber } from './format.js';

export function StatsPanel({ state }) {
  const achievementList = getAchievementList(state);
  const earnedCount = achievementList.filter(a => a.earned).length;
  const summary = getPrestigeSummary(state);

  return (
    <div className="panel stats-panel">
      <h2>Statistics — Era {state.era}{earnedCount > 0 ? `, ${earnedCount} achievements` : ''}</h2>
      <div className="stats-grid">
        <div className="stat-row">
          <span>Current Era</span>
          <span>{eraNames[state.era] || `Era ${state.era}`}</span>
        </div>
        <div className="stat-row">
          <span>Play Time</span>
          <span>{formatTime(state.totalTime)}</span>
        </div>
        {state.bestEraTimes && state.bestEraTimes[state.era] && (
          <div className="stat-row">
            <span>Time in Era</span>
            <span>{formatTime(state.totalTime - state.bestEraTimes[state.era])}</span>
          </div>
        )}
        <div className="stat-row">
          <span>Era Upgrades</span>
          <span>{countEraUpgrades(state, state.era)}</span>
        </div>
        <div className="stat-row">
          <span>Unlocked Resources</span>
          <span>{Object.values(state.resources || {}).filter(r => r.unlocked).length}</span>
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
          <span>Star Routes</span>
          <span>{state.starRoutes?.length || 0}</span>
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
        {(state.totalResourcesProduced || 0) > 0 && (
          <div className="stat-row">
            <span>Total Produced</span>
            <span>{formatNumber(state.totalResourcesProduced)} units</span>
          </div>
        )}
        {(state.peakProductionRate || 0) > 0 && (
          <div className="stat-row">
            <span>Peak Rate</span>
            <span>{formatNumber(state.peakProductionRate)}/s</span>
          </div>
        )}
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

      <h3>Achievements ({earnedCount}/{achievementList.length} — {achievementList.filter(a => a.earned).reduce((s, a) => s + (a.reward || 0), 0)} pts earned)</h3>
      <div className="achievement-progress-bar">
        <div className="achievement-progress-fill" style={{ width: `${Math.floor(earnedCount / achievementList.length * 100)}%` }} />
      </div>
      <div className="achievement-list">
        {achievementList.filter(a => a.earned).map(a => (
          <div key={a.id} className="achievement earned">
            <span className="achievement-name">{a.name}</span>
            <span className="achievement-desc">{a.description} (+{a.reward}pts)</span>
          </div>
        ))}
        {achievementList.length - earnedCount > 0 && (
          <div className="achievement locked">
            <span className="achievement-name">+ {achievementList.length - earnedCount} hidden</span>
            <span className="achievement-desc">Keep playing to discover them! ({achievementList.filter(a => !a.earned).reduce((s, a) => s + (a.reward || 0), 0)} pts remaining)</span>
          </div>
        )}
      </div>
    </div>
  );
}
