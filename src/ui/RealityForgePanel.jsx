import { useState, memo } from 'react';
import { formatNumber } from './format.js';
import { playClick, playUpgrade } from './AudioManager.js';
import { forgeRealityKey, getCycleReadiness, getRealityForgeRecipes } from '../engine/realityForge.js';
import { CYCLE_DOCTRINES, getCycleGoal, selectNextCycleDoctrine } from '../engine/cycles.js';

export const RealityForgePanel = memo(function RealityForgePanel({ state, onUpdate }) {
  const [lastForged, setLastForged] = useState(null);
  const keys = state.realityKeys || {};
  const recipes = getRealityForgeRecipes(state);
  const cycle = getCycleReadiness(state);
  const cycleGoal = getCycleGoal(state);
  const totalKeys = Object.values(keys).reduce((s, v) => s + v, 0);

  const handleForge = (recipe) => {
    playClick();
    const next = forgeRealityKey(state, recipe.id);
    if (!next) return;
    playUpgrade();
    setLastForged(recipe.label);
    setTimeout(() => setLastForged(null), 1200);
    onUpdate(() => next);
  };

  return (
    <div className="panel reality-forge-panel">
      <h2>Reality Forge ({totalKeys} keys)</h2>
      <p className="text-lore" style={{ fontSize: '0.7em', fontStyle: 'italic', color: '#dd88ff', margin: '0 0 4px' }}>
        The forge was here before you arrived. It remembers every key ever made — including the ones you are about to make.
      </p>
      {cycleGoal && (
        <div className={`cycle-goal ${state.cycleGoalRewarded ? 'ready' : ''}`}>
          <strong>{CYCLE_DOCTRINES[state.cycleDoctrine]?.name} doctrine</strong>
          <span>{cycleGoal.label}: {Math.min(cycleGoal.current, cycleGoal.target)}/{cycleGoal.target}</span>
          <span>{state.cycleGoalRewarded ? 'Complete: +1 cycle mark and +4 prestige points' : 'Complete this cycle for a permanent cycle mark'}</span>
        </div>
      )}
      {lastForged && (
        <div className="operation-result success" style={{ marginBottom: '4px' }}>
          Forged {lastForged}!
        </div>
      )}
      <div className="cycle-doctrines" role="group" aria-label="Choose next-cycle doctrine">
        {Object.values(CYCLE_DOCTRINES).map(doctrine => (
          <button
            key={doctrine.id}
            className={state.nextCycleDoctrine === doctrine.id ? 'active' : ''}
            onClick={() => onUpdate(current => selectNextCycleDoctrine(current, doctrine.id))}
          >
            <strong>{doctrine.name}</strong>
            <span>{doctrine.eraRange}</span>
            <span>{doctrine.description}</span>
          </button>
        ))}
      </div>
      <div className="cycle-readiness" aria-label="Cycle readiness">
        <strong>Cycle readiness {cycle.completed}/{cycle.total}</strong>
        {cycle.requirements.map(requirement => (
          <span key={requirement.id} className={requirement.met ? 'ready' : ''}>
            {requirement.label}: {requirement.current}/{requirement.target}
          </span>
        ))}
        {!cycle.directlyReady && (
          <span className={cycle.fallbackReady ? 'ready' : ''}>
            Passive resonance: {Math.ceil(cycle.fallbackRemaining / 60)}m
          </span>
        )}
      </div>
      <div className="allocation-lines">
        {recipes.map(recipe => {
          const count = recipe.count;
          const affordable = recipe.affordable;
          const hasKey = count > 0;
          return (
            <div key={recipe.id} className="allocation-line" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '2px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="line-label" style={{ color: recipe.color, flex: 1 }}>
                  {recipe.label}: {count} {hasKey && recipe.lore && recipe.id !== 'quantum' && <span style={{ color: '#88ddcc', fontSize: '0.85em' }}>✓</span>}
                </span>
                <span className="line-bonus" style={{ fontSize: '0.7em', color: '#888' }}>
                  {formatNumber(recipe.fragments)} frags + {formatNumber(recipe.echoes)} echoes
                </span>
                <button
                  className={`mine-btn ${affordable ? '' : 'too-expensive'}`}
                  disabled={!affordable}
                  onClick={() => handleForge(recipe)}
                  style={{ fontSize: '0.75em', padding: '3px 8px' }}
                  aria-label={`Forge ${recipe.label}`}
                >
                  Forge
                </button>
              </div>
              <div style={{ fontSize: '0.68em', color: '#776688', fontStyle: 'italic', paddingLeft: '2px' }}>
                {recipe.description} {recipe.lore}
              </div>
              {!recipe.isUnlocked && (
                <div style={{ fontSize: '0.68em', color: '#556677', paddingLeft: '2px' }}>
                  Locked: {recipe.milestone}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {totalKeys > 0 && (
        <div style={{ display: 'flex', gap: '6px', marginTop: '6px', fontSize: '0.75em', flexWrap: 'wrap' }}>
          {recipes.filter(recipe => recipe.count > 0).map(r => (
            <span key={r.id} style={{ color: r.color, border: `1px solid ${r.color}44`, padding: '1px 6px', borderRadius: '3px' }}>
              {r.label} x{keys[r.id]}
            </span>
          ))}
        </div>
      )}
      <p className="operation-hint">
        Keys and cycle marks survive prestige | Choose one doctrine before closing the cycle
      </p>
    </div>
  );
});
