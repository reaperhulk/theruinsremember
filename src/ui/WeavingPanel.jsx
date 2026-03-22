import { drawFragment, resolveWeave, clearGrid, getWeavingStats } from '../engine/weaving.js';
import { useState, useRef, memo } from 'react';

const TYPE_COLORS = {
  temporal: '#ff8866',
  spatial: '#66aaff',
  causal: '#88dd88',
  quantum: '#dd88ff',
  chaos: '#ffdd44',
};

export const WeavingPanel = memo(function WeavingPanel({ state, onUpdate }) {
  const [lastMatch, setLastMatch] = useState(null);
  const [borderFlash, setBorderFlash] = useState(null);
  const flashRef = useRef(null);
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
      if (matched && matchType) {
        clearTimeout(flashRef.current);
        setBorderFlash(matchType);
        flashRef.current = setTimeout(() => setBorderFlash(null), 600);
      }
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
    <div className={`panel weaving-panel${borderFlash ? ' weave-match-flash' : ''}`}
      style={borderFlash ? { '--weave-flash-color': TYPE_COLORS[borderFlash] } : undefined}>
      <h2>Reality Weaving ({stats.totalWeaves} weaves)</h2>
      <div className="dock-info">
        <span>Weaves: {stats.totalWeaves}</span>
        <span>Grid: {grid.length}</span>
        {(state.weaveCombo || 0) > 0 && (
          <span style={{ color: '#ffdd44' }} title="Consecutive successful weaves boost rewards">Combo: x{(1 + ((state.weaveCombo || 0) - 1) * 0.5).toFixed(1)}</span>
        )}
      </div>
      <div className="weave-grid" role="list" aria-label="Weaving grid">
        {grid.map((f, i) => (
          <span key={i} className="weave-fragment" style={{ color: TYPE_COLORS[f], borderColor: TYPE_COLORS[f] + '88' }} title={`${f}${f === 'chaos' ? ' (wild — counts as any type)' : ''}`} role="listitem">
            {f === 'chaos' ? '***' : f === 'temporal' ? 'TMP' : f === 'spatial' ? 'SPC' : f === 'causal' ? 'CSL' : 'QNT'}
          </span>
        ))}
        {grid.length === 0 && <span className="empty-message">Draw fragments to begin (costs 5 reality fragments)</span>}
      </div>
      {grid.length > 0 && (
        <div className="weave-counts" style={{ display: 'flex', gap: '8px', fontSize: '0.75em', marginBottom: '4px' }}>
          {['temporal','spatial','causal','quantum'].map(t => {
            const total = (counts[t]||0) + chaosCount;
            const isClose = total >= 2 && total < 3;
            const isReady = total >= 3;
            return (
              <span key={t} style={{
                color: TYPE_COLORS[t],
                opacity: (counts[t]||0) > 0 || isClose ? 1 : 0.3,
                fontWeight: isReady ? 'bold' : isClose ? 'bold' : 'normal',
                textDecoration: isReady ? 'underline' : 'none',
              }}>
                {t.charAt(0).toUpperCase()}: {(counts[t]||0)}{chaosCount > 0 ? `+${chaosCount}*` : ''}
                {isReady ? ' ✓' : isClose ? ' ·' : ''}
              </span>
            );
          })}
        </div>
      )}
      {lastMatch && (
        <div className="hack-result success">
          Woven {lastMatch}! Boosting {lastMatch === 'temporal' ? 'Cosmic Power' : lastMatch === 'spatial' ? 'Exotic Matter' : lastMatch === 'causal' ? 'Universal Constants' : 'Reality Fragments'} for 60s
        </div>
      )}
      <div className="weave-controls">
        <button className="mine-btn" onClick={handleDraw} aria-label="Draw a random fragment for 5 reality fragments">
          Draw Fragment (5 reality fragments)
        </button>
        <button className="mine-btn" onClick={handleWeave} disabled={!hasMatch} aria-label={hasMatch ? 'Weave matching fragments' : 'Need 3 matching fragments to weave'}>
          {hasMatch ? 'Weave Match!' : 'Weave Match'}
        </button>
        {grid.length > 0 && (
          <button className="reset-btn" onClick={handleClear} style={{ marginTop: '4px' }} aria-label="Clear all fragments from the grid">
            Clear Grid
          </button>
        )}
      </div>
      <p className="mining-hint">
        TMP=Temporal SPC=Spatial CSL=Causal QNT=Quantum ***=Chaos(wild)
        <br />3 of a kind to weave | Chaos counts as any type | Combos boost rewards | Grid clears after 120s
      </p>
    </div>
  );
});
