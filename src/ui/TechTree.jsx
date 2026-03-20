import { useState, useCallback } from 'react';
import { getAvailableTech, unlockTech } from '../engine/tech.js';
import { canAfford, getEffectiveRate } from '../engine/resources.js';
import { techTree } from '../data/tech-tree.js';
import { resources as resourceDefs } from '../data/resources.js';

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
            <span style={{ color: enough ? '#88cc88' : '#ff8888' }}>
              {resourceName(id)}: {amount}
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

export function TechTree({ state, onUpdate }) {
  const [flashId, setFlashId] = useState(null);
  const available = getAvailableTech(state);
  const unlocked = Object.keys(state.tech || {});

  const handleUnlock = useCallback((techId) => {
    setFlashId(techId);
    onUpdate(s => unlockTech(s, techId));
    setTimeout(() => setFlashId(null), 400);
  }, [onUpdate]);

  // Show unlocked techs count
  const unlockedCount = unlocked.length;

  if (available.length === 0) {
    return (
      <div className="panel tech-panel">
        <h2>Technology{unlockedCount > 0 ? ` — ${unlockedCount} done` : ''}</h2>
        <p className="empty-message">No research available</p>
      </div>
    );
  }

  return (
    <div className="panel tech-panel">
      <h2>Technology{available.length > 0 ? ` (${available.length} available)` : ''}{unlockedCount > 0 ? ` — ${unlockedCount} done` : ''}</h2>
      <div className="tech-list">
        {available.sort((a, b) => (b.grantsEra ? 1 : 0) - (a.grantsEra ? 1 : 0)).map(tech => {
          const affordable = canAfford(state, tech.cost);
          const progress = affordable ? 1 : getAffordProgress(state, tech.cost);
          // Show prerequisite chain info
          const prereqNames = tech.prerequisites
            .map(p => techTree[p]?.name || p)
            .filter(Boolean);
          return (
            <button
              key={tech.id}
              className={`tech-btn ${affordable ? 'affordable' : 'too-expensive'} ${flashId === tech.id ? 'purchase-flash' : ''}`}
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
              {tech.excludes && (
                <div className="tech-prereqs" style={{ color: '#ff8866' }}>
                  Choose one: excludes {techTree[tech.excludes]?.name || tech.excludes}
                </div>
              )}
              {!affordable && (() => {
                const eta = getTimeToAfford(state, tech.cost);
                return (
                  <div className="upgrade-progress-bar">
                    <div className="upgrade-progress-fill" style={{ width: `${Math.floor(progress * 100)}%` }} />
                    {eta < Infinity && eta > 0 && (
                      <span style={{ position: 'absolute', right: '4px', top: '0', fontSize: '0.7em', color: '#888', lineHeight: '8px' }}>
                        ~{eta < 60 ? `${Math.ceil(eta)}s` : eta < 3600 ? `${Math.ceil(eta / 60)}m` : `${Math.floor(eta / 3600)}h`}
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
}
