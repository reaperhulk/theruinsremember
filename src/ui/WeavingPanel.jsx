import { drawFragment, resolveWeave, clearGrid, getWeavingStats } from '../engine/weaving.js';
import { useState } from 'react';

const TYPE_COLORS = {
  temporal: '#ff8866',
  spatial: '#66aaff',
  causal: '#88dd88',
  quantum: '#dd88ff',
  chaos: '#ffdd44',
};

export function WeavingPanel({ state, onUpdate }) {
  const [lastMatch, setLastMatch] = useState(null);
  const stats = getWeavingStats(state);
  const grid = stats.grid;

  const handleDraw = () => {
    onUpdate(s => {
      const { state: newState } = drawFragment(s);
      return newState;
    });
  };

  const handleWeave = () => {
    onUpdate(s => {
      const { state: newState, matched, matchType } = resolveWeave(s);
      setLastMatch(matched ? matchType : null);
      return newState;
    });
  };

  const handleClear = () => {
    setLastMatch(null);
    onUpdate(s => clearGrid(s));
  };

  // Count fragments by type
  const counts = {};
  for (const f of grid) {
    counts[f] = (counts[f] || 0) + 1;
  }
  const chaosCount = counts.chaos || 0;
  const hasMatch = Object.values(counts).some(c => c >= 3) ||
    ['temporal','spatial','causal','quantum'].some(t => ((counts[t]||0) + chaosCount) >= 3);

  return (
    <div className="panel weaving-panel">
      <h2>Reality Weaving</h2>
      <div className="dock-info">
        <span>Weaves: {stats.totalWeaves}</span>
        <span>Grid: {grid.length}</span>
        {(state.weaveCombo || 0) > 0 && (
          <span style={{ color: '#ffdd44' }}>Combo: x{(1 + ((state.weaveCombo || 0) - 1) * 0.5).toFixed(1)}</span>
        )}
      </div>
      <div className="weave-grid">
        {grid.map((f, i) => (
          <span key={i} className="weave-fragment" style={{ color: TYPE_COLORS[f] }} title={f}>
            {f === 'chaos' ? '*' : f.charAt(0).toUpperCase()}
          </span>
        ))}
        {grid.length === 0 && <span className="empty-message">Draw fragments to begin</span>}
      </div>
      {grid.length > 0 && (
        <div className="weave-counts" style={{ display: 'flex', gap: '8px', fontSize: '0.75em', marginBottom: '4px' }}>
          {['temporal','spatial','causal','quantum'].map(t => (
            <span key={t} style={{ color: TYPE_COLORS[t], opacity: (counts[t]||0) > 0 ? 1 : 0.3 }}>
              {t.charAt(0).toUpperCase()}: {(counts[t]||0)}{chaosCount > 0 ? `+${chaosCount}*` : ''}
            </span>
          ))}
        </div>
      )}
      {lastMatch && (
        <div className="hack-result success">
          Woven {lastMatch}! x2 {lastMatch === 'temporal' ? 'cosmicPower' : lastMatch === 'spatial' ? 'exoticMatter' : lastMatch === 'causal' ? 'universalConstants' : 'realityFragments'} for 60s
        </div>
      )}
      <div className="weave-controls">
        <button className="mine-btn" onClick={handleDraw}>
          Draw Fragment (5 reality fragments)
        </button>
        <button className="mine-btn" onClick={handleWeave} disabled={!hasMatch}>
          Weave Match
        </button>
        {grid.length > 0 && (
          <button className="reset-btn" onClick={handleClear} style={{ marginTop: '4px' }}>
            Clear Grid
          </button>
        )}
      </div>
      <p className="mining-hint">Draw 3 of the same type (chaos * is wild), consecutive weaves increase bonus</p>
    </div>
  );
}
