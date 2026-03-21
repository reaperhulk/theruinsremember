import { useState } from 'react';
import { eraNames, countEraUpgrades } from '../engine/eras.js';
import { getPrestigeSummary } from '../engine/prestige.js';
import { getAchievementList } from '../engine/achievements.js';
import { getEffectiveRate } from '../engine/resources.js';
import { resources as resourceDefs } from '../data/resources.js';
import { upgrades as upgradeDefs } from '../data/upgrades.js';
import { formatTime, formatNumber } from './format.js';

const LORE_UPGRADE_IDS = [
  'precursorBeacon', 'deadStarAtlas', 'hollowDyson', 'echoBlueprint',
  'galacticOssuary', 'convergenceCodex', 'universalTombstone', 'inevitabilityEngine',
  'recursionScar', 'finalIteration',
];

export function StatsPanel({ state }) {
  const [showCodex, setShowCodex] = useState(false);
  const achievementList = getAchievementList(state);
  const earnedCount = achievementList.filter(a => a.earned).length;
  const summary = getPrestigeSummary(state);

  // Lore codex — discovered lore upgrades
  const discoveredLore = LORE_UPGRADE_IDS
    .filter(id => state.upgrades?.[id])
    .map(id => upgradeDefs[id])
    .filter(Boolean);
  // Lore events from event log
  const loreEvents = (state.eventLog || [])
    .filter(e => e.message && (
      e.message.includes('ruins') || e.message.includes('ancient') || e.message.includes('Precursor') ||
      e.message.includes('Ghost') || e.message.includes('derelict') || e.message.includes('Strange') ||
      e.message.includes('buried') || e.message.includes('sealed') || e.message.includes('holographic') ||
      e.message.includes('tally') || e.message.includes('star map') || e.message.includes('photograph') ||
      e.message.includes('foundation') || e.message.includes('geometric') || e.message.includes('wreckage')
    ));

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
          <span>x{(state.prestigeMultiplier || 1).toFixed(1)}</span>
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

      {(discoveredLore.length > 0 || loreEvents.length > 0) && (
        <>
          <h3 onClick={() => setShowCodex(!showCodex)} style={{ cursor: 'pointer' }}>
            Codex {showCodex ? '(hide)' : `(${discoveredLore.length + loreEvents.length} entries)`}
          </h3>
          {showCodex && (
            <div className="achievement-list" style={{ marginBottom: '8px' }}>
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
          )}
        </>
      )}

      <h3>Achievements ({earnedCount}/{achievementList.length} — {achievementList.filter(a => a.earned).reduce((s, a) => s + (a.reward || 0), 0)} pts earned)</h3>
      <div className="achievement-progress-bar">
        <div className="achievement-progress-fill" style={{ width: `${Math.floor(earnedCount / achievementList.length * 100)}%` }} />
      </div>
      {achievementList.filter(a => !a.earned).length > 0 && achievementList.filter(a => !a.earned).length <= 20 && (
        <div className="achievement-list" style={{ marginBottom: '6px' }}>
          <div style={{ fontSize: '0.75em', color: '#888', marginBottom: '2px' }}>Next up:</div>
          {achievementList.filter(a => !a.earned).slice(0, 3).map(a => (
            <div key={a.id} className="achievement locked" style={{ opacity: 0.7 }}>
              <span className="achievement-name">? {a.name}</span>
              <span className="achievement-desc">{a.description} (+{a.reward}pts)</span>
            </div>
          ))}
        </div>
      )}
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
