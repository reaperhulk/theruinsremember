import { useState } from 'react';
import { resources as resourceDefs } from '../data/resources.js';
import { executeTrade, getTradeRatio } from '../engine/trading.js';
import { formatNumber } from './format.js';

export function TradingPanel({ state, onUpdate }) {
  const [fromId, setFromId] = useState('');
  const [toId, setToId] = useState('');
  const [amount, setAmount] = useState(10);

  const unlocked = Object.entries(state.resources)
    .filter(([, r]) => r.unlocked)
    .map(([id]) => ({ id, def: resourceDefs[id] }))
    .filter(r => r.def);

  const ratio = fromId && toId && fromId !== toId ? getTradeRatio(fromId, toId) : null;
  const cost = ratio ? amount * (ratio.input / ratio.output) : 0;
  const canTrade = ratio && state.resources[fromId]?.amount >= cost && amount > 0;

  const handleTrade = () => {
    if (!canTrade) return;
    onUpdate(s => {
      const result = executeTrade(s, fromId, toId, amount);
      if (!result) return null;
      const fromDef = resourceDefs[fromId];
      const toDef = resourceDefs[toId];
      return {
        ...result,
        totalTrades: (result.totalTrades || 0) + 1,
        eventLog: [...(result.eventLog || []), {
          message: `Traded ${cost.toFixed(0)} ${fromDef.name} for ${amount} ${toDef.name}`,
          time: result.totalTime,
        }].slice(-10),
      };
    });
  };

  return (
    <div className="panel trading-panel">
      <h2>Trading{(state.totalTrades || 0) > 0 ? ` (${state.totalTrades} trades)` : ''}</h2>
      <div className="trade-controls">
        <div className="trade-row">
          <label>Give:</label>
          <select value={fromId} onChange={e => setFromId(e.target.value)}>
            <option value="">Select...</option>
            {unlocked.map(r => (
              <option key={r.id} value={r.id}>
                {r.def.name} [Era {r.def.era}] ({formatNumber(state.resources[r.id].amount)})
              </option>
            ))}
          </select>
        </div>
        <div className="trade-row">
          <label>Receive:</label>
          <input
            type="number"
            min="1"
            value={amount}
            onChange={e => setAmount(Math.max(1, parseInt(e.target.value) || 1))}
          />
        </div>
        <div className="trade-row">
          <label>Of:</label>
          <select value={toId} onChange={e => setToId(e.target.value)}>
            <option value="">Select...</option>
            {unlocked.filter(r => r.id !== fromId).map(r => (
              <option key={r.id} value={r.id}>
                {r.def.name} [Era {r.def.era}] ({formatNumber(state.resources[r.id].amount)})
              </option>
            ))}
          </select>
        </div>
        {ratio && fromId && toId && (
          <div className="trade-preview">
            Cost: {formatNumber(cost)} {resourceDefs[fromId]?.name} for {amount} {resourceDefs[toId]?.name}
            <span className="trade-ratio">
              ({ratio.input}:{ratio.output})
            </span>
          </div>
        )}
        <div className="trade-row" style={{ gap: '4px' }}>
          <button className="gather-btn" onClick={() => setAmount(1)} style={{ flex: 1 }}>1</button>
          <button className="gather-btn" onClick={() => setAmount(10)} style={{ flex: 1 }}>10</button>
          <button className="gather-btn" onClick={() => setAmount(100)} style={{ flex: 1 }}>100</button>
          <button className="gather-btn" onClick={() => setAmount(1000)} style={{ flex: 1 }}>1K</button>
          {ratio && fromId && (
            <button className="gather-btn" onClick={() => {
              const maxAmount = Math.floor(state.resources[fromId]?.amount * (ratio.output / ratio.input));
              if (maxAmount > 0) setAmount(maxAmount);
            }} style={{ flex: 1, color: '#ffdd44' }}>Max</button>
          )}
        </div>
        <button
          className={`trade-btn ${canTrade ? 'affordable' : 'too-expensive'}`}
          disabled={!canTrade}
          onClick={handleTrade}
        >
          Trade ({state.totalTrades || 0} completed)
        </button>
      </div>
    </div>
  );
}
