import { memo } from 'react';
import { getAssignableColonies, getColonyAssignments, getTotalColoniesAssigned, assignColonies, getColonyBonus, getColonyStrategy } from '../engine/colonies.js';
import { formatNumber } from './format.js';
import { resources as resourceDefs } from '../data/resources.js';

function resourceName(id) { return resourceDefs[id]?.name || id; }

const FOCUS_TYPES = [
  { id: 'growth', label: 'Growth', desc: 'food +2, labor +0.5', color: '#88dd88' },
  { id: 'science', label: 'Science', desc: 'research +1.5, data +0.8', color: '#88bbee' },
  { id: 'industry', label: 'Industry', desc: 'exotic +0.3, energy +5', color: '#ddaa66' },
];

export const ColonyPanel = memo(function ColonyPanel({ state, onUpdate }) {
  const maxColonies = getAssignableColonies(state);
  const assignments = getColonyAssignments(state);
  const totalAssigned = getTotalColoniesAssigned(state);
  const available = maxColonies - totalAssigned;
  const bonus = getColonyBonus(state);
  const strategy = getColonyStrategy(state);

  // Quick-assign: evenly split all colonies
  const handleEvenSplit = () => {
    if (maxColonies < 3) return;
    const each = Math.floor(maxColonies / 3);
    const remainder = maxColonies - each * 3;
    onUpdate(s => {
      let st = assignColonies(s, 'growth', each + remainder);
      st = st ? assignColonies(st, 'science', each) : s;
      st = st ? assignColonies(st, 'industry', each) : s;
      return st;
    });
  };

  // Distribution bar
  const barSegments = FOCUS_TYPES.map(f => ({
    color: f.color,
    width: maxColonies > 0 ? ((assignments[f.id] || 0) / maxColonies) * 100 : 0,
  }));

  return (
    <div className="panel colony-panel">
      <h2>Colonies ({Math.floor(maxColonies)}){strategy.type !== 'none' ? `, ${strategy.type}` : ''}</h2>
      <div className="factory-info">
        <span>Colonies: {Math.floor(available)}/{Math.floor(maxColonies)} available</span>
        {maxColonies >= 3 && (
          <button className="gather-btn" onClick={handleEvenSplit} style={{ fontSize: '0.7em', padding: '2px 8px' }} aria-label="Evenly split colonies across all focus types">
            Even Split
          </button>
        )}
      </div>
      {maxColonies > 0 && totalAssigned > 0 && (
        <div className="colony-bar">
          {barSegments.map((seg, i) => (
            seg.width > 0 ? (
              <div key={i} className="colony-bar-segment" style={{ width: `${seg.width}%`, background: seg.color }} />
            ) : null
          ))}
        </div>
      )}
      <div className="factory-lines">
        {FOCUS_TYPES.map(focus => {
          const count = assignments[focus.id] || 0;
          return (
            <div key={focus.id} className="factory-line">
              <span className="line-label" style={{ color: focus.color }}>
                {focus.label}: {count}
              </span>
              <span className="line-bonus">{count > 0 ? `${focus.desc} x${count}` : focus.desc}</span>
              <div className="line-controls">
                <button
                  disabled={count <= 0}
                  onClick={() => onUpdate(s => assignColonies(s, focus.id, count - 1))}
                  aria-label={`Remove colony from ${focus.label}`}
                >-</button>
                <button
                  disabled={available <= 0}
                  onClick={() => onUpdate(s => assignColonies(s, focus.id, count + 1))}
                  aria-label={`Add colony to ${focus.label}`}
                >+</button>
              </div>
            </div>
          );
        })}
      </div>
      {Object.keys(bonus).length > 0 && (
        <div className="colony-bonus">
          Bonus: {Object.entries(bonus).map(([r, v]) => `${resourceName(r)} +${v.toFixed(1)}`).join(', ')}
        </div>
      )}
      {totalAssigned > 0 && (
        <div className="colony-bonus" style={{ color: strategy.type === 'specialized' ? '#ffdd44' : strategy.type === 'diversified' ? '#88ccff' : '#ff9966' }}>
          {strategy.type === 'specialized' && `Strategy: Specialized (x2) — All colonies in one focus`}
          {strategy.type === 'diversified' && `Strategy: Diversified (x1.25) — Colonies in all 3 focuses`}
          {strategy.type === 'mixed' && `Strategy: Mixed — No bonus! Specialize or diversify`}
          {strategy.type === 'none' && `Assign colonies to earn bonuses`}
        </div>
      )}
      {state.era >= 6 && (
        <p className="text-lore" style={{ fontSize: '0.75em', margin: '4px 0 0' }}>
          Every colony site matches coordinates from the ancient maps.
        </p>
      )}
      <p className="mining-hint">Specialize x2 | Diversify x1.25 | Era bonus scales output</p>
    </div>
  );
});
