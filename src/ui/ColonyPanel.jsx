import { getAssignableColonies, getColonyAssignments, getTotalColoniesAssigned, assignColonies, getColonyBonus, getColonyStrategy } from '../engine/colonies.js';
import { formatNumber } from './format.js';
import { resources as resourceDefs } from '../data/resources.js';

function resourceName(id) { return resourceDefs[id]?.name || id; }

const FOCUS_TYPES = [
  { id: 'growth', label: 'Growth', desc: 'food +2, labor +0.5', color: '#88dd88' },
  { id: 'science', label: 'Science', desc: 'research +1.5, data +0.8', color: '#88bbee' },
  { id: 'industry', label: 'Industry', desc: 'exotic +0.3, energy +5', color: '#ddaa66' },
];

export function ColonyPanel({ state, onUpdate }) {
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
    onUpdate(s => {
      let st = assignColonies(s, 'growth', each);
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
      <h2>Colonies ({formatNumber(maxColonies)} total{strategy.type !== 'none' ? ` — ${strategy.type}` : ''})</h2>
      <div className="factory-info">
        <span>Colonies: {formatNumber(available)}/{formatNumber(maxColonies)} available</span>
        {maxColonies >= 3 && (
          <button className="gather-btn" onClick={handleEvenSplit} style={{ fontSize: '0.7em', padding: '1px 6px' }}>
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
              <span className="line-bonus">{focus.desc} each</span>
              <div className="line-controls">
                <button
                  disabled={count <= 0}
                  onClick={() => onUpdate(s => assignColonies(s, focus.id, count - 1))}
                >-</button>
                <button
                  disabled={available <= 0}
                  onClick={() => onUpdate(s => assignColonies(s, focus.id, count + 1))}
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
      {strategy.type !== 'none' && (
        <div className="colony-bonus" style={{ color: strategy.type === 'specialized' ? '#ffdd44' : strategy.type === 'diversified' ? '#88ccff' : '#888' }}>
          Strategy: {strategy.type} (x{strategy.mult})
        </div>
      )}
      <p className="mining-hint">Specialize x2 | Diversify x1.25 | Era bonus scales output</p>
    </div>
  );
}
