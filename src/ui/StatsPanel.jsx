import { useState, memo } from 'react';
import { eraNames, countEraUpgrades } from '../engine/eras.js';
import { getAchievementList } from '../engine/achievements.js';
import { getEffectiveRate, getEffectivePrestige } from '../engine/resources.js';
import { resources as resourceDefs } from '../data/resources.js';
import { upgrades as upgradeDefs } from '../data/upgrades.js';
import { formatTime, formatNumber } from './format.js';
import { LORE_UPGRADE_IDS } from '../data/lore.js';

function AchievementWithProgress({ a }) {
  const [hovered, setHovered] = useState(false);
  const pct = a.progress ? Math.min(100, Math.floor((a.progress.current / a.progress.target) * 100)) : 0;
  const near = a.progress && pct >= 90;
  return (
    <div
      className="achievement locked"
      style={{ opacity: 0.7, position: 'relative' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span className="achievement-name" style={near ? { color: '#ffcc66' } : undefined}>
        {near ? '★ ' : '? '}{a.name}
      </span>
      <span className="achievement-desc">{a.description}</span>
      {a.progress && (
        <div className="upgrade-progress-bar" style={{ marginTop: '3px' }}>
          <div
            className={`upgrade-progress-fill${pct >= 90 ? ' almost' : ''}`}
            style={{ width: `${pct}%` }}
          />
          {hovered && (
            <span style={{ position: 'absolute', right: '4px', top: '0', fontSize: '0.7em', color: '#aaa', lineHeight: '8px' }}>
              {formatNumber(a.progress.current)} / {formatNumber(a.progress.target)}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

const ACHIEVEMENT_CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'mining', label: 'Mining' },
  { key: 'eras', label: 'Eras' },
  { key: 'upgrades', label: 'Upgrades' },
  { key: 'trading', label: 'Trading' },
  { key: 'minigames', label: 'Mini-Games' },
  { key: 'prestige', label: 'Prestige' },
  { key: 'collection', label: 'Collection' },
  { key: 'milestones', label: 'Milestones' },
];

export const StatsPanel = memo(function StatsPanel({ state }) {
  const [showCodexOverride, setShowCodexOverride] = useState(null);
  const [showEarned, setShowEarned] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const achievementList = getAchievementList(state);
  const earnedCount = achievementList.filter(a => a.earned).length;

  // Lore codex — discovered lore upgrades
  const discoveredLore = LORE_UPGRADE_IDS
    .filter(id => state.upgrades?.[id])
    .map(id => upgradeDefs[id])
    .filter(Boolean);
  // Lore events from event log
  const loreEvents = (state.eventLog || []).filter(e => e.isLore);
  const chronicle = [...discoveredLore.map(u => ({
    type: 'upgrade',
    era: u.era,
    title: u.name,
    body: u.description,
  })), ...loreEvents.map(e => ({
    type: 'echo',
    era: state.era,
    title: 'Recovered Echo',
    body: e.message,
  }))].slice(-8).reverse();

  return (
    <div className="panel stats-panel">
      <h2>Statistics ({earnedCount} achievements)</h2>
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
          <span>Time in Era</span>
          <span>{formatTime(Math.max(0, (state.totalTime || 0) - (state.eraStartTime || 0)))}</span>
        </div>
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
          <span>{Object.keys(state.upgrades || {}).length}</span>
        </div>
        <div className="stat-row">
          <span>Technologies</span>
          <span>{Object.keys(state.tech || {}).length}</span>
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
          <span>x{formatNumber(state.prestigeMultiplier || 1)}{state.prestigeMultiplier > 10 &&
            ` (eff: x${formatNumber(getEffectivePrestige(state.prestigeMultiplier))})`
          }</span>
        </div>
        {(state.lifetimePlayTime || 0) > 0 && (
          <div className="stat-row">
            <span>Lifetime Play</span>
            <span>{formatTime((state.lifetimePlayTime || 0) + (state.totalTime || 0))}</span>
          </div>
        )}
        {state.lastUpgradeTime > 0 && (
          <div className="stat-row">
            <span>Since Last Upgrade</span>
            <span style={{ color: (state.totalTime - state.lastUpgradeTime) > 120 ? '#ffaa44' : '#888' }}>
              {formatTime(state.totalTime - state.lastUpgradeTime)}
            </span>
          </div>
        )}
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
              <span>Best Era</span>
              <span>{eraNames[state.lifetimeHighestEra] || 'N/A'}</span>
            </div>
          </>
        )}
      </div>

      <h3>Production Rates</h3>
      <div className="stats-grid">
        {Object.entries(state.resources)
          .filter(([, r]) => r.unlocked)
          .map(([id]) => ({ id, rate: getEffectiveRate(state, id), name: resourceDefs[id]?.name || id }))
          .filter(r => r.rate > 0)
          .sort((a, b) => b.rate - a.rate)
          .slice(0, 8)
          .map(r => (
            <div key={r.id} className="stat-row">
              <span>{r.name}</span>
              <span style={{ color: '#88dd88' }}>+{formatNumber(r.rate)}/s</span>
            </div>
          ))}
      </div>

      {(discoveredLore.length > 0 || loreEvents.length > 0) && (() => {
        const undiscoveredLore = LORE_UPGRADE_IDS.filter(id => !state.upgrades?.[id]);
        const totalLore = LORE_UPGRADE_IDS.length;
        const hasUndiscovered = undiscoveredLore.length > 0 && loreEvents.length > 0;
        const defaultOpen = hasUndiscovered || discoveredLore.length > 0;
        const showCodex = showCodexOverride !== null ? showCodexOverride : defaultOpen;
        return (
        <>
          <h3 onClick={() => setShowCodexOverride(showCodex ? false : true)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setShowCodexOverride(showCodex ? false : true); }}} tabIndex={0} role="button" aria-expanded={showCodex} style={{ cursor: 'pointer' }}>
            Chronicle ({discoveredLore.length}/{totalLore} artifacts) {showCodex ? '(hide)' : '(show)'}
          </h3>
          {showCodex && (
            <div style={{ marginBottom: '8px' }}>
              <div className="chronicle-list">
                {chronicle.map((entry, i) => (
                  <div key={`${entry.title}-${i}`} className={`chronicle-entry chronicle-${entry.type}`}>
                    <span className="chronicle-era">Era {entry.era}</span>
                    <strong>{entry.title}</strong>
                    <span>{entry.body}</span>
                  </div>
                ))}
              </div>
              <div className="achievement-list" style={{ marginBottom: '8px', marginTop: '8px' }}>
              {(() => {
                // Group discovered lore by era
                const byEra = {};
                for (const u of discoveredLore) {
                  const era = u.era || 0;
                  if (!byEra[era]) byEra[era] = [];
                  byEra[era].push(u);
                }
                const sortedEras = Object.keys(byEra).map(Number).sort((a, b) => a - b);
                return sortedEras.map(era => (
                  <div key={`era-${era}`}>
                    <div style={{ fontSize: '0.8em', fontWeight: 'bold', color: '#aa88cc', margin: '6px 0 2px', borderBottom: '1px solid #333' }}>
                      Era {era}: {eraNames[era] || `Era ${era}`}
                    </div>
                    {byEra[era].map(u => (
                      <div key={u.id} className="achievement earned" style={{ borderLeft: '2px solid #bb88ff', marginLeft: '8px' }}>
                        <span className="achievement-name">{u.name}</span>
                        <span className="achievement-desc" style={{ color: '#ccaa88', fontStyle: 'italic' }}>{u.description}</span>
                      </div>
                    ))}
                  </div>
                ));
              })()}
              {undiscoveredLore.map(id => {
                const def = upgradeDefs[id];
                return def ? (
                  <div key={id} className="achievement locked" style={{ opacity: 0.4 }}>
                    <span className="achievement-name">? Era {def.era}: ???</span>
                    <span className="achievement-desc">Purchase lore upgrades to reveal...</span>
                  </div>
                ) : null;
              })}
              {loreEvents.length > 0 && (
                <div style={{ fontSize: '0.8em', fontWeight: 'bold', color: '#aa8866', margin: '6px 0 2px', borderBottom: '1px solid #333' }}>
                  Echoes & Fragments
                </div>
              )}
              {loreEvents.slice(-10).map((e, i) => (
                <div key={i} className="achievement earned" style={{ borderLeft: '2px solid #888866', marginLeft: '8px' }}>
                  <span className="achievement-desc" style={{ color: '#aa9977', fontStyle: 'italic' }}>{e.message}</span>
                </div>
              ))}
              {discoveredLore.length === 0 && loreEvents.length > 0 && (
                <div style={{ fontSize: '0.7em', color: '#666', marginTop: '4px' }}>
                  Purchase lore upgrades to uncover the full story...
                </div>
              )}
              </div>
            </div>
          )}
        </>
        );
      })()}

      <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        Achievements ({earnedCount}/{achievementList.length})
        <button
          onClick={() => setShowEarned(v => !v)}
          style={{ fontSize: '0.7em', padding: '1px 6px', cursor: 'pointer', background: '#222', border: '1px solid #444', color: '#aaa', borderRadius: '3px', fontFamily: 'inherit' }}
        >
          {showEarned ? 'Show Locked Only' : 'Show All'}
        </button>
      </h3>
      <div className="achievement-progress-bar">
        <div className="achievement-progress-fill" style={{ width: `${Math.floor(earnedCount / achievementList.length * 100)}%` }} />
      </div>
      <div className="filter-chips" style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '6px' }}>
        {ACHIEVEMENT_CATEGORIES.map(cat => {
          const count = cat.key === 'all'
            ? achievementList.length
            : achievementList.filter(a => a.category === cat.key).length;
          return (
            <button
              key={cat.key}
              className={categoryFilter === cat.key ? 'active' : ''}
              onClick={() => setCategoryFilter(cat.key)}
              style={{ fontSize: '0.7em', padding: '1px 6px', cursor: 'pointer', background: categoryFilter === cat.key ? '#2a2418' : '#222', border: `1px solid ${categoryFilter === cat.key ? '#886622' : '#444'}`, color: categoryFilter === cat.key ? '#ddbb66' : '#aaa', borderRadius: '3px', fontFamily: 'inherit' }}
            >
              {cat.label}<span style={{ fontSize: '0.8em', marginLeft: '2px', opacity: 0.7 }}>{count}</span>
            </button>
          );
        })}
      </div>
      {!showEarned && (() => {
        const filtered = categoryFilter === 'all' ? achievementList : achievementList.filter(a => a.category === categoryFilter);
        const lockedAchievements = filtered.filter(a => !a.earned).sort((a, b) => (a.reward || 0) - (b.reward || 0)).slice(0, 15);
        const totalLocked = filtered.filter(a => !a.earned).length;
        return (
          <div className="achievement-list" style={{ marginBottom: '6px' }}>
            <div style={{ fontSize: '0.75em', color: '#888', marginBottom: '2px' }}>
              {totalLocked > 15 ? `Showing 15 of ${totalLocked} locked (easiest first)` : `Locked (${totalLocked} remaining)`}:
            </div>
            {lockedAchievements.map(a => (
              <AchievementWithProgress key={a.id} a={a} />
            ))}
          </div>
        );
      })()}
      {showEarned && (() => {
        const filtered = categoryFilter === 'all' ? achievementList : achievementList.filter(a => a.category === categoryFilter);
        const filteredLocked = filtered.filter(a => !a.earned);
        const filteredEarned = filtered.filter(a => a.earned);
        return (
        <>
          {filteredLocked.length > 0 && filteredLocked.length <= 20 && (
            <div className="achievement-list" style={{ marginBottom: '6px' }}>
              <div style={{ fontSize: '0.75em', color: '#888', marginBottom: '2px' }}>Next up:</div>
              {filteredLocked.slice(0, 3).map(a => (
                <AchievementWithProgress key={a.id} a={a} />
              ))}
            </div>
          )}
          <div className="achievement-list">
            {filteredEarned.reverse().map(a => (
              <div key={a.id} className="achievement earned">
                <span className="achievement-name">{a.name}</span>
                <span className="achievement-desc">{a.description}</span>
              </div>
            ))}
            {filteredLocked.length > 0 && (
              <div className="achievement locked">
                <span className="achievement-name">+ {filteredLocked.length} hidden</span>
                <span className="achievement-desc">Keep playing to discover them!</span>
              </div>
            )}
          </div>
        </>
        );
      })()}
    </div>
  );
});
