import { getNarrativeEnding } from '../engine/memory.js';
import { formatTime } from './format.js';
import { achievements } from '../data/achievements.js';

export function VictoryScreen({ state, onDismiss }) {
  if (!state.gameComplete && !state.trueEnding) return null;

  const isTrueEnding = !!state.trueEnding;
  const ending = getNarrativeEnding(state);

  return (
    <div className="era-transition-overlay" onClick={onDismiss} style={{ zIndex: 1002 }} role="dialog" aria-modal="true" aria-label={ending.title}>
      <div className="era-transition-content" style={{ maxWidth: '500px' }}>
        <h2 style={{ fontSize: '1.5em', color: isTrueEnding ? '#e8c040' : '#c8a040', marginBottom: '16px' }}>
          {ending.title}
        </h2>
        <p style={{ color: '#ccaa88', fontStyle: 'italic', marginBottom: '12px', lineHeight: '1.6' }}>
          {ending.text}
        </p>
        <div className="victory-grid" style={{ fontSize: '0.85em', color: '#888', marginBottom: '16px' }}>
          <div className="victory-card">
            <strong>Cycle Record</strong>
            <div>Prestige cycles: {state.prestigeCount || 0}</div>
            <div>Prestige upgrades: {Object.keys(state.prestigeUpgrades || {}).length}/30</div>
            <div>Total play time: {formatTime((state.lifetimePlayTime || 0) + (state.totalTime || 0))}</div>
          </div>
          <div className="victory-card">
            <strong>World Left Behind</strong>
            <div>Upgrades: {Object.keys(state.upgrades || {}).length} | Tech: {Object.keys(state.tech || {}).length}</div>
            <div>Achievements: {Object.keys(state.achievements || {}).length}/{achievements.length}</div>
            {state.totalGems > 0 && <div>Gems: {state.totalGems} | Trades: {state.totalTrades || 0}</div>}
            <div>Discoveries: {state.expedition?.totalFinds || 0} | Docks: {state.dockingPerfects || 0} | Weaves: {state.totalWeaves || 0}</div>
            {state.dysonSegments > 0 && <div>Dyson: {state.dysonSegments} segments | Signal locks: {Object.keys(state.lockedSignals || {}).length}</div>}
          </div>
          <div className="victory-card victory-card-wide">
            <strong>Final Signal</strong>
            <div>{ending.signal}</div>
          </div>
        </div>
        <div style={{ display: 'none' }}>
          <div>Prestige cycles: {state.prestigeCount || 0}</div>
          <div>Prestige upgrades: {Object.keys(state.prestigeUpgrades || {}).length}/30</div>
          <div>Total play time: {formatTime((state.lifetimePlayTime || 0) + (state.totalTime || 0))}</div>
          <div>Upgrades purchased: {Object.keys(state.upgrades || {}).length}</div>
          <div>Achievements: {Object.keys(state.achievements || {}).length}/{achievements.length}</div>
          {state.totalGems > 0 && <div>Gems found: {state.totalGems}</div>}
          {state.dysonSegments > 0 && <div>Dyson segments: {state.dysonSegments}</div>}
        </div>
        <p style={{ color: isTrueEnding ? '#e8c040' : '#c8a040', fontSize: '1.2em', textAlign: 'center', marginBottom: '8px' }}>
          {ending.signal}
        </p>
        <button onClick={onDismiss} autoFocus>Continue tending this civilization</button>
      </div>
    </div>
  );
}
