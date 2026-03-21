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

  const factoryLore = state.era >= 3
    ? 'The machines settle into rhythms older than memory.'
    : null;

  return (
    <div className="panel factory-panel">
      <h2>Factory ({pool} workers){efficient && fullCapacity ? ' — MAX' : efficient ? ' — +50%' : ''}{pool >= getMaxWorkers(state) && <span style={{ fontSize: '0.6em', color: '#888', marginLeft: '4px' }}>cap: {getMaxWorkers(state)}</span>}</h2>
      {factoryLore && <p className="text-lore" style={{ fontSize: '0.7em', fontStyle: 'italic', color: '#7799aa', margin: '0 0 4px' }}>{factoryLore}</p>}
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
                  aria-label={`Remove worker from ${line.label}`}
                >-</button>
                <button
                  disabled={available <= 0}
                  onClick={() => onUpdate(s => allocateWorker(s, line.id, count + 1))}
                  aria-label={`Add worker to ${line.label}`}
                >+</button>
              </div>
            </div>
          );
        })}
      </div>
      <p className="mining-hint">
        {!efficient ? 'Assign at least 1 worker to each line for +50% efficiency bonus' : ''}
        {efficient && !fullCapacity ? `Assign all ${available} remaining worker${available !== 1 ? 's' : ''} for x2 full capacity bonus` : ''}
        {fullCapacity ? `Maximum output! All ${pool} workers assigned (eff x${effMult.toFixed(1)})` : ''}
      </p>
    </div>
  );
}
