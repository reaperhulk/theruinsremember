import { chooseFragment, clearGrid, discardFragment, getWeaveDrawCost, getWeavingStats, resolveWeave, surveyFragments } from '../engine/weaving.js';
import { useState, useRef, useEffect, useCallback, memo } from 'react';

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
  const offer = state.weavingOffer || [];
  const drawCost = getWeaveDrawCost(state);

  const counts = {};
  for (const fragment of grid) counts[fragment] = (counts[fragment] || 0) + 1;
  const chaosCount = counts.chaos || 0;
  const hasMatch = Object.values(counts).some(count => count >= 3) ||
    ['temporal', 'spatial', 'causal', 'quantum'].some(type => ((counts[type] || 0) + chaosCount) >= 3);

  const handleSurvey = useCallback(() => {
    onUpdate(current => surveyFragments(current) || current);
  }, [onUpdate]);

  const handleChoose = useCallback(index => {
    onUpdate(current => chooseFragment(current, index) || current);
  }, [onUpdate]);

  const handleDiscard = useCallback(index => {
    onUpdate(current => discardFragment(current, index));
  }, [onUpdate]);

  const handleWeave = useCallback(() => {
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
  }, [onUpdate]);

  const handleClear = useCallback(() => {
    setLastMatch(null);
    onUpdate(s => clearGrid(s));
  }, [onUpdate]);

  // Keyboard shortcuts: D = survey, W = weave, C = clear
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'd' || e.key === 'D') { e.preventDefault(); handleSurvey(); }
      if ((e.key === 'w' || e.key === 'W') && hasMatch) { e.preventDefault(); handleWeave(); }
      if ((e.key === 'c' || e.key === 'C') && grid.length > 0) { e.preventDefault(); handleClear(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleSurvey, handleWeave, handleClear, hasMatch, grid.length]);

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
          <button key={`${f}-${i}`} className="weave-fragment" style={{ color: TYPE_COLORS[f], borderColor: TYPE_COLORS[f] + '88' }} title={`Discard ${f}${f === 'chaos' ? ' wild thread' : ' thread'}`} role="listitem" onClick={() => handleDiscard(i)}>
            {f === 'chaos' ? '***' : f === 'temporal' ? 'TMP' : f === 'spatial' ? 'SPC' : f === 'causal' ? 'CSL' : 'QNT'}
          </button>
        ))}
        {grid.length === 0 && <span className="empty-message">Survey possible threads, then choose what enters the pattern.</span>}
      </div>
      {offer.length > 0 && (
        <div className="weave-offer" role="group" aria-label="Choose a surveyed reality thread">
          {offer.map((fragment, index) => (
            <button key={`${fragment}-${index}`} onClick={() => handleChoose(index)} style={{ color: TYPE_COLORS[fragment], borderColor: TYPE_COLORS[fragment] }}>
              <strong>{fragment === 'chaos' ? 'Chaos' : fragment}</strong>
              <span>{fragment === 'chaos' ? 'Wild thread' : `Build ${fragment} recipe`}</span>
            </button>
          ))}
        </div>
      )}
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
        <div className="operation-result success">
          Woven {lastMatch}! Boosting {lastMatch === 'temporal' ? 'Cosmic Power' : lastMatch === 'spatial' ? 'Exotic Matter' : lastMatch === 'causal' ? 'Universal Constants' : 'Reality Fragments'} for 60s
        </div>
      )}
      <div className="weave-controls">
        <button className="mine-btn" onClick={handleSurvey} disabled={offer.length > 0} aria-label={`Survey three threads for ${drawCost} reality fragments`}>
          {offer.length > 0 ? 'Choose a thread' : `Survey Threads (${drawCost} fragments)`}
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
      <p className="operation-hint">
        TMP=Temporal SPC=Spatial CSL=Causal QNT=Quantum ***=Chaos(wild)
        <br />Choose one of three surveyed threads | Select a placed thread to discard it | 3 of a kind to weave
        <br />Keys: [D] survey | [W] weave | [C] clear
      </p>
    </div>
  );
});
