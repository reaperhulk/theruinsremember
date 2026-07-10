import { getArchivedOperations, getCurrentOperations, getDefaultOperation } from '../data/operations.js';

export function OperationsPanel({ state, activeOperation, onSelect, renderOperation }) {
  const current = getCurrentOperations(state.era);
  const archived = getArchivedOperations(state.era);
  const selectedCurrent = current.find(operation => operation.id === activeOperation);
  const selectedArchive = archived.find(operation => operation.id === activeOperation);
  const selected = selectedCurrent || selectedArchive || current.at(-1) || archived.at(-1);

  if (!selected) return null;

  const selectCurrent = operationId => onSelect(operationId || getDefaultOperation(state.era));

  return (
    <section className="operations-shell" aria-labelledby="operations-heading">
      <header className="operations-heading">
        <div>
          <span className="panel-kicker">Era {state.era} command</span>
          <h2 id="operations-heading">{selected.label}</h2>
          <p>{selected.description}</p>
        </div>
        {archived.length > 0 && (
          <label className="operation-archive">
            <span>Previous operations</span>
            <select
              value={selectedArchive?.id || ''}
              onChange={event => selectCurrent(event.target.value)}
              aria-label="Open a previous operation"
            >
              <option value="">Current era</option>
              {archived.map(operation => (
                <option key={operation.id} value={operation.id}>{operation.label}</option>
              ))}
            </select>
          </label>
        )}
      </header>

      {current.length > 1 && !selectedArchive && (
        <div className="operation-modes" role="tablist" aria-label="Current era operations">
          {current.map(operation => (
            <button
              key={operation.id}
              className={selected.id === operation.id ? 'active' : ''}
              onClick={() => onSelect(operation.id)}
              role="tab"
              aria-selected={selected.id === operation.id}
            >
              {operation.label}
            </button>
          ))}
        </div>
      )}

      {selectedArchive && (
        <button className="operation-return" onClick={() => selectCurrent('')}>
          Return to current era
        </button>
      )}

      <div className="operation-stage">{renderOperation(selected.id)}</div>
    </section>
  );
}
