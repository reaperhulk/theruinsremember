import { useState, useCallback, useRef, memo } from 'react';
import { getAvailableTech, unlockTech } from '../engine/tech.js';
import { canAfford, getEffectiveRate } from '../engine/resources.js';
import { techTree } from '../data/tech-tree.js';
import { resources as resourceDefs } from '../data/resources.js';
import { formatNumber } from './format.js';

function resourceName(id) {
  return resourceDefs[id]?.name || id;
}

function CostDisplay({ cost, state }) {
  return (
    <span>
      {Object.entries(cost).map(([id, amount], i) => {
        const have = state.resources[id]?.amount || 0;
        const enough = have >= amount;
        return (
          <span key={id}>
            {i > 0 && ', '}
            <span style={{ color: enough ? '#88cc88' : '#ff6666', fontWeight: enough ? 'normal' : 'bold' }}>
              {resourceName(id)}: {formatNumber(amount)}
              {!enough && <span style={{ fontWeight: 'normal', fontSize: '0.85em', color: '#cc8888' }}> ({formatNumber(have)})</span>}
            </span>
          </span>
        );
      })}
    </span>
  );
}

function getTimeToAfford(state, cost) {
  let maxTime = 0;
  for (const [resourceId, amount] of Object.entries(cost)) {
    const r = state.resources[resourceId];
    const have = r ? r.amount : 0;
    if (have >= amount) continue;
    const rate = getEffectiveRate(state, resourceId);
    if (rate <= 0) return Infinity;
    maxTime = Math.max(maxTime, (amount - have) / rate);
  }
  return maxTime;
}

// Get afford progress for tech (same pattern as upgrades)
function getAffordProgress(state, cost) {
  let totalNeeded = 0;
  let totalHave = 0;
  for (const [resourceId, amount] of Object.entries(cost)) {
    const r = state.resources[resourceId];
    const have = r ? Math.min(r.amount, amount) : 0;
    totalHave += have;
    totalNeeded += amount;
  }
  return totalNeeded > 0 ? totalHave / totalNeeded : 0;
}

export const TechTree = memo(function TechTree({ state, onUpdate }) {
  const [flashId, setFlashId] = useState(null);
  const [showUnlocked, setShowUnlocked] = useState(false);
  const flashTimerRef = useRef(null);
  const available = getAvailableTech(state);
  const unlocked = Object.keys(state.tech || {});

  const handleUnlock = useCallback((techId) => {
    setFlashId(techId);
    onUpdate(s => unlockTech(s, techId));
    const tech = techTree[techId];
    clearTimeout(flashTimerRef.current);
    flashTimerRef.current = setTimeout(() => setFlashId(null), tech?.grantsEra ? 800 : 400);
  }, [onUpdate]);

  // Show unlocked techs count
  const unlockedCount = unlocked.length;

  const affordableTechs = available.filter(t => canAfford(state, t.cost));

  if (available.length === 0) {
    return (
      <div className="panel tech-panel">
        <h2>Technology (0 available){unlockedCount > 0 && (
          <span className="toggle-purchased" onClick={() => setShowUnlocked(!showUnlocked)}>
            {showUnlocked ? ' (hide done)' : `, ${unlockedCount} done`}
          </span>
        )}</h2>
        {showUnlocked && unlocked.length > 0 && (
          <div className="purchased-list">
            {unlocked.map(id => {
              const tech = techTree[id];
              return tech ? (
                <div key={id} className="purchased-upgrade">
                  <span className="purchased-name">{tech.name}</span>
                  <span className="purchased-desc">{tech.description}</span>
                </div>
              ) : null;
            })}
          </div>
        )}
        <p className="empty-message">No research available</p>
      </div>
    );
  }

  return (
    <div className="panel tech-panel">
      <h2>Technology{available.length > 0 ? ` (${available.length} available)` : ''}{unlockedCount > 0 && (
          <span className="toggle-purchased" onClick={() => setShowUnlocked(!showUnlocked)}>
            {showUnlocked ? ' (hide done)' : `, ${unlockedCount} done`}
          </span>
        )}</h2>
      {showUnlocked && unlocked.length > 0 && (
        <div className="purchased-list">
          {unlocked.map(id => {
            const tech = techTree[id];
            return tech ? (
              <div key={id} className="purchased-upgrade">
                <span className="purchased-name">{tech.name}</span>
                <span className="purchased-desc">{tech.description}</span>
              </div>
            ) : null;
          })}
        </div>
      )}
      {affordableTechs.length >= 2 && (
        <button
          className="buy-all-btn"
          onClick={() => onUpdate(s => {
            let current = s;
            for (const tech of available.filter(t => canAfford(current, t.cost))) {
              const next = unlockTech(current, tech.id);
              if (next) current = next;
            }
            return current;
          })}
        >
          Research All Affordable ({affordableTechs.length})
        </button>
      )}
      <div className="tech-list">
        {available.sort((a, b) => (b.grantsEra ? 1 : 0) - (a.grantsEra ? 1 : 0)).map(tech => {
          const affordable = canAfford(state, tech.cost);
          const progress = affordable ? 1 : getAffordProgress(state, tech.cost);
          // Show prerequisite chain info
          const prereqNames = tech.prerequisites
            .map(p => techTree[p]?.name || p)
            .filter(Boolean);
          // Count how many other techs this one enables
          const enablesCount = Object.values(techTree).filter(t =>
            t.prerequisites.includes(tech.id) && !state.tech[t.id]
          ).length;
          return (
            <button
              key={tech.id}
              className={`tech-btn ${affordable ? 'affordable' : 'too-expensive'} ${flashId === tech.id ? (tech.grantsEra ? 'breakthrough-flash' : 'purchase-flash') : ''} ${tech.grantsEra ? 'era-gate-tech' : ''}`}
              disabled={!affordable}
              onClick={() => handleUnlock(tech.id)}
              title={tech.description}
            >
              <div className="tech-name">
                {tech.name}
                {tech.grantsEra && <span className="era-gate"> ★ Era {tech.grantsEra}</span>}
              </div>
              <div className="tech-cost"><CostDisplay cost={tech.cost} state={state} /></div>
              <div className="tech-desc">{tech.description}</div>
              {tech.effects && tech.effects.length > 0 && (
                <div className="upgrade-effects">
                  {tech.effects.map((e, i) => {
                    let label = '';
                    let cls = 'effect-tag';
                    switch (e.type) {
                      case 'production_mult': label = `x${e.value} ${resourceName(e.target)}`; cls += ' effect-mult'; break;
                      case 'production_add': label = `+${e.value} ${resourceName(e.target)}/s`; cls += ' effect-add'; break;
                      case 'cap_mult': label = `x${e.value} ${resourceName(e.target)} cap`; cls += ' effect-cap'; break;
                      case 'unlock_resource': label = `Unlock ${resourceName(e.target)}`; cls += ' effect-unlock'; break;
                    }
                    return label ? <span key={i} className={cls}>{label}</span> : null;
                  })}
                </div>
              )}
              {prereqNames.length > 0 && (
                <div className="tech-prereqs">Requires: {prereqNames.join(', ')}</div>
              )}
              {enablesCount > 0 && (
                <div className="tech-prereqs" style={{ color: '#88ccaa' }}>
                  Unlocks {enablesCount} more tech{enablesCount > 1 ? 's' : ''}
                </div>
              )}
              {tech.excludes && (
                <div className="tech-prereqs" style={{
                  color: '#ffcc44',
                  background: 'rgba(255,204,68,0.1)',
                  border: '1px solid rgba(255,204,68,0.3)',
                  borderRadius: '3px',
                  padding: '2px 6px',
                  marginTop: '2px',
                  fontWeight: 'bold',
                  fontSize: '0.85em',
                }}>
                  ⚠ Choose one (permanent choice): {tech.name} OR {techTree[tech.excludes]?.name || tech.excludes}
                </div>
              )}
              {!affordable && (() => {
                const eta = getTimeToAfford(state, tech.cost);
                return (
                  <div className="upgrade-progress-bar">
                    <div className="upgrade-progress-fill" style={{ width: `${Math.floor(progress * 100)}%` }} />
                    {eta < Infinity && eta > 0 && (
                      <span style={{ position: 'absolute', right: '4px', top: '0', fontSize: '0.7em', color: '#888', lineHeight: '8px' }}>
                        ~{eta < 60 ? `${Math.round(eta / 5) * 5 || 5}s` : eta < 3600 ? `${Math.ceil(eta / 60)}m` : `${Math.floor(eta / 3600)}h`}
                      </span>
                    )}
                  </div>
                );
              })()}
            </button>
          );
        })}
      </div>
    </div>
  );
});
