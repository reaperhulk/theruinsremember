import { getWorkerPool, getAllocation, getTotalAssigned, allocateWorker, hasEfficiencyBonus, getMaxWorkers } from '../engine/factory.js';

const LINES = [
  { id: 'steel', label: 'Steel', color: '#8899aa' },
  { id: 'electronics', label: 'Electronics', color: '#88ccee' },
  { id: 'research', label: 'Research', color: '#aaddaa' },
];

export function FactoryPanel({ state, onUpdate }) {
  const pool = getWorkerPool(state);
  const allocation = getAllocation(state);
  const totalAssigned = getTotalAssigned(state);
  const available = pool - totalAssigned;
  const efficient = hasEfficiencyBonus(state);
  const fullCapacity = available === 0 && pool >= 3;
  const effMult = (efficient ? 1.5 : 1) * (fullCapacity ? 2 : 1);

  return (
    <div className="panel factory-panel">
      <h2>Factory ({pool} workers){efficient && fullCapacity ? ' — MAX' : efficient ? ' — +50%' : ''}</h2>
      <div className="factory-info">
        <span>Workers: {available}/{pool} available</span>
        {efficient && <span style={{ color: '#88ff88' }}>+50%</span>}
        {fullCapacity && <span style={{ color: '#ffdd44' }}>x2 full!</span>}
      </div>
      <div className="upgrade-progress-bar" style={{ margin: '2px 0 6px' }}>
        <div
          className={`upgrade-progress-fill ${totalAssigned / pool > 0.8 ? 'almost' : ''}`}
          style={{ width: `${pool > 0 ? Math.floor(totalAssigned / pool * 100) : 0}%` }}
        />
      </div>
      <div className="factory-lines">
        {LINES.map(line => {
          const count = allocation[line.id] || 0;
          return (
            <div key={line.id} className="factory-line">
              <span className="line-label" style={{ color: line.color }}>
                {line.label}: {count}
              </span>
              <span className="line-bonus">+{(count * 0.3 * effMult).toFixed(1)}/s</span>
              <div className="line-controls">
                <button
                  disabled={count <= 0}
                  onClick={() => onUpdate(s => allocateWorker(s, line.id, count - 1))}
                >-</button>
                <button
                  disabled={available <= 0}
                  onClick={() => onUpdate(s => allocateWorker(s, line.id, count + 1))}
                >+</button>
              </div>
            </div>
          );
        })}
      </div>
      <p className="mining-hint">
        {!efficient ? 'Fill all lines for +50%' : ''}
        {efficient && !fullCapacity ? ' — use all workers for x2' : ''}
        {fullCapacity ? ' — Maximum output!' : ''}
      </p>
    </div>
  );
}
