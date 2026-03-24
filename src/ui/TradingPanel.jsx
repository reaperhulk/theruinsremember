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
        eventLog: [...(result.eventLog || []), {
          message: `Traded ${formatNumber(Math.floor(cost))} ${fromDef.name} for ${formatNumber(amount)} ${toDef.name}`,
          time: result.totalTime,
        }].slice(-20),
      };
    });
  };

  // Quick trade suggestions — resources you have plenty of → resources you need
  const quickTrades = [];
  const abundanceThreshold = 100 * Math.pow(10, Math.max(0, state.era - 2));
  const needThreshold = 50 * Math.pow(10, Math.max(0, state.era - 2));
  const sortedByAmount = unlocked
    .map(r => ({ ...r, amount: state.resources[r.id]?.amount || 0, cap: state.resources[r.id]?.capMult || 1 }))
    .filter(r => r.amount > abundanceThreshold)
    .sort((a, b) => b.amount - a.amount);

  if (sortedByAmount.length >= 2) {
    const richest = sortedByAmount[0];
    const neediest = unlocked
      .filter(r => r.id !== richest.id && (state.resources[r.id]?.amount || 0) < needThreshold)
      .slice(0, 2);
    for (const need of neediest) {
      const r = getTradeRatio(richest.id, need.id);
      if (r) quickTrades.push({ from: richest, to: need, ratio: r });
    }
  }

  return (
    <div className="panel trading-panel">
      <h2>Trading ({state.totalTrades || 0} trades)</h2>
      {quickTrades.length > 0 && (
        <div className="trade-quick" style={{ marginBottom: '8px' }}>
          <div style={{ fontSize: '0.75em', color: '#888', marginBottom: '4px' }}>Quick trades:</div>
          {quickTrades.map((qt, i) => {
            const tradeAmount = Math.min(100, Math.floor(state.resources[qt.from.id]?.amount * 0.1));
            const getCost = tradeAmount * (qt.ratio.input / qt.ratio.output);
            return (
              <button
                key={i}
                className="gather-btn"
                style={{ display: 'block', width: '100%', marginBottom: '2px', textAlign: 'left', fontSize: '0.8em' }}
                onClick={() => onUpdate(s => {
                  const result = executeTrade(s, qt.from.id, qt.to.id, tradeAmount);
                  if (!result) return null;
                  return {
                    ...result,
                    eventLog: [...(result.eventLog || []), {
                      message: `Quick traded ${Math.floor(getCost)} ${qt.from.def.name} → ${tradeAmount} ${qt.to.def.name}`,
                      time: result.totalTime,
                    }].slice(-20),
                  };
                })}
              >
                {qt.from.def.name} → {qt.to.def.name} ({tradeAmount} units, {qt.ratio.input}:{qt.ratio.output})
              </button>
            );
          })}
        </div>
      )}
      <div className="trade-controls">
        <div className="trade-row">
          <label>Give:</label>
          <select value={fromId} onChange={e => setFromId(e.target.value)} aria-label="Resource to give">
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
            style={{ width: '60px' }}
            aria-label="Amount to receive"
          />
          <select value={toId} onChange={e => setToId(e.target.value)} aria-label="Resource to receive">
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
