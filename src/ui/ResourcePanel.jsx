import { calculateEconomy, getSupplyChains, setConsumerControl, expandStorage } from '../engine/economy.js';
import { useState, useCallback, useRef, useEffect, useMemo, memo } from 'react';
import { resources as resourceDefs } from '../data/resources.js';
import { getEffectiveCap, getEffectivePrestige, gather, isGatheringAutomated } from '../engine/resources.js';
import { eraNames } from '../engine/eras.js';
import { getColonyBonus } from '../engine/colonies.js';
import { getRouteBonus } from '../engine/starChart.js';
import { formatNumber, formatTime } from './format.js';

export const ResourcePanel = memo(function ResourcePanel({ state, onUpdate, economy: suppliedEconomy }) {
  const [collapsed, setCollapsed] = useState({});
  const [autoCollapse] = useState(true);
  const [floats, setFloats] = useState([]);
  const [expandedResource, setExpandedResource] = useState(null);
  const seenResourcesRef = useRef(new Set());
  const [newResources, setNewResources] = useState(new Set());
  const prevRatesRef = useRef({});
  const [boostedResources, setBoostedResources] = useState(new Set());
  const economy = useMemo(() => suppliedEconomy || calculateEconomy(state), [state, suppliedEconomy]);
  const chains = getSupplyChains(state);
  const gatheringAutomated = isGatheringAutomated(state);

  const handleGather = useCallback((resourceId, amount) => {
    onUpdate(s => gather(s, resourceId));
    const id = Date.now() + Math.random();
    setFloats(f => [...f, { id, text: `+${amount > 1 ? formatNumber(amount) : '1'}`, resourceId }]);
    setTimeout(() => setFloats(f => f.filter(fl => fl.id !== id)), 800);
  }, [onUpdate]);

  // Track newly appearing resources
  useEffect(() => {
    const currentIds = Object.entries(state.resources)
      .filter(([, r]) => r.unlocked)
      .map(([id]) => id);
    const fresh = new Set();
    for (const id of currentIds) {
      if (!seenResourcesRef.current.has(id)) {
        fresh.add(id);
        seenResourcesRef.current.add(id);
      }
    }
    if (fresh.size > 0) {
      setNewResources(prev => new Set([...prev, ...fresh]));
      // Clear "new" status after animation completes
      setTimeout(() => {
        setNewResources(prev => {
          const next = new Set(prev);
          for (const id of fresh) next.delete(id);
          return next;
        });
      }, 2000);
    }
  }, [state.resources]);

  const unlockedResources = Object.entries(state.resources)
    .filter(([, r]) => r.unlocked)
    .map(([id, r]) => ({
      id,
      ...r,
      def: resourceDefs[id],
      rate: economy.net[id],
      cap: getEffectiveCap(state, id),
    }));

  // Detect rate boosts (e.g., from multiplier upgrades)
  useEffect(() => {
    const boosted = new Set();
    for (const r of unlockedResources) {
      const prev = prevRatesRef.current[r.id] || 0;
      if (r.rate > prev * 1.5 && prev > 0) {
        boosted.add(r.id);
      }
      prevRatesRef.current[r.id] = r.rate;
    }
    if (boosted.size > 0) {
      setBoostedResources(prev => new Set([...prev, ...boosted]));
      setTimeout(() => {
        setBoostedResources(prev => {
          const next = new Set(prev);
          for (const id of boosted) next.delete(id);
          return next;
        });
      }, 600);
    }
  }, [unlockedResources]);

  // Group by era
  const byEra = {};
  for (const r of unlockedResources) {
    const era = r.def?.era || 1;
    if (!byEra[era]) byEra[era] = [];
    byEra[era].push(r);
  }

  const eras = Object.keys(byEra).map(Number).sort((a, b) => a - b);

  const overclockActive = state.upgrades?.overclockProtocol && ((state.totalTime || 0) % 60) < 10;

  // Detect critically throttled consumption chains — only warn when resource
  // is actually draining (net negative), not just heavily consumed
  const throttledChains = [];
  for (const { input, output } of chains) {
    if (!state.resources[output]?.unlocked) continue;
    if (economy.net[input] < 0) throttledChains.push(`${resourceDefs[input].name} draining`);
    else if (economy.constrained[output] === 'input') throttledChains.push(`${resourceDefs[output].name} needs ${resourceDefs[input].name}`);
  }
  const cappedResources = unlockedResources.filter(r => r.cap > 0 && r.amount >= r.cap * 0.98 && economy.gross[r.id] > 0);

  return (
    <div className="panel resource-panel" style={overclockActive ? { borderColor: '#cc9933', boxShadow: '0 0 8px rgba(204, 153, 51, 0.3)' } : undefined}>
      <h2>Resources ({unlockedResources.length} unlocked)</h2>
      <div className="resource-status-strip">
        <span className="resource-status-pill">{unlockedResources.filter(r => r.rate > 0).length} accumulating</span>
        <span className="resource-status-pill" style={{ color: '#88dd88' }}>+{formatNumber(unlockedResources.reduce((s, r) => s + Math.max(0, r.rate), 0))}/s net total</span>
        <span className="resource-status-pill">{cappedResources.length} capped</span>
        {throttledChains.length > 0 && <span className="resource-status-pill">{throttledChains.length} strained</span>}
      </div>
      {throttledChains.length >= 2 && (
        <div className="resource-alert">
          ⚠ Multiple supply chains strained: {throttledChains.join(', ')} — production severely reduced
        </div>
      )}
      {eras.map(era => {
        const isOld = era < state.era;
        const isCollapsed = collapsed[era] !== undefined ? collapsed[era] : (autoCollapse && isOld && eras.length > 2);
        const resources = byEra[era];

        return (
          <div key={era} className="resource-era-group">
            {eras.length > 1 && (
              <div
                className={`resource-era-header ${isOld ? 'old-era' : 'current-era'}`}
                onClick={() => setCollapsed(c => ({ ...c, [era]: !c[era] }))}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setCollapsed(c => ({ ...c, [era]: !c[era] })); }}}
                tabIndex={0}
                role="button"
                aria-expanded={!isCollapsed}
                aria-label={`${eraNames[era]} resources, ${isCollapsed ? 'collapsed' : 'expanded'}`}
              >
                <span>{isCollapsed ? '>' : 'v'} {eraNames[era]}</span>
                {isCollapsed && (
                  <span className="collapsed-summary">
                    {resources.map(r => `${r.def?.name}: ${formatNumber(r.amount)}`).join(', ')}
                  </span>
                )}
              </div>
            )}
            {!isCollapsed && (
              <div className="resource-list">
                {resources.map(r => {
                  const tooltipParts = [r.def?.description || r.id];
                  if (r.baseRate > 0) tooltipParts.push(`Base: ${r.baseRate}/s`);
                  if (r.rateAdd > 0) tooltipParts.push(`Upgrade bonus: +${r.rateAdd.toFixed(1)}/s`);
                  if (r.rateMult > 1) tooltipParts.push(`Upgrade mult: x${r.rateMult}`);
                  // Operation bonuses
                  const cb = getColonyBonus(state);
                  if (cb[r.id]) tooltipParts.push(`Colonies: +${cb[r.id].toFixed(1)}/s`);
                  const rb = getRouteBonus(state);
                  if (rb[r.id]) tooltipParts.push(`Star routes: +${rb[r.id].toFixed(1)}/s`);
                  if (state.prestigeMultiplier > 1) tooltipParts.push(`Prestige: x${formatNumber(getEffectivePrestige(state.prestigeMultiplier))}`);
                  for (const chain of chains.filter(c => c.input === r.id && state.resources[c.output]?.unlocked)) tooltipParts.push(`Feeds ${resourceDefs[chain.output].name}: ${chain.cost} per unit`);
                  tooltipParts.push(`Net income: ${formatNumber(r.rate)}/s`);
                  tooltipParts.push(`Potential production: ${formatNumber(economy.gross[r.id])}/s`);
                  if (r.cap > 0) tooltipParts.push(`Cap: ${formatNumber(r.cap)}`);
                  const tooltip = tooltipParts.join('\n');
                  return (
                    <div key={r.id} className={`resource-row-wrapper`}>
                    <div
                      className={`resource-row ${r.rate > 0 ? 'producing' : ''} ${newResources.has(r.id) ? 'new-resource' : ''} ${boostedResources.has(r.id) ? 'rate-boosted' : ''} ${economy.consumed[r.id] > 0 ? 'consuming' : ''} ${r.cap > 0 && r.amount >= r.cap * 0.98 && economy.gross[r.id] > 0 ? 'resource-capped' : r.cap > 0 && r.amount >= r.cap * 0.9 && economy.gross[r.id] > 0 ? 'resource-near-cap' : ''}`}
                      title={tooltip}
                      style={r.cap > 0 ? { '--resource-fill': `${Math.min(100, Math.max(0, (r.amount / r.cap) * 100))}%` } : undefined}
                    >
                      <span className="resource-name" style={{ cursor: 'pointer', textDecoration: expandedResource === r.id ? 'underline' : 'none', borderBottom: expandedResource === r.id ? 'none' : '1px dotted #556' }} onClick={() => setExpandedResource(expandedResource === r.id ? null : r.id)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpandedResource(expandedResource === r.id ? null : r.id); }}} tabIndex={0} role="button" aria-expanded={expandedResource === r.id}>
                        {r.def?.name || r.id}
                      </span>
                      <span className={`resource-amount ${r.cap > 0 && r.amount / r.cap > 0.9 ? 'near-cap' : ''}`}>
                        {formatNumber(r.amount)}
                        {r.cap > 0 && r.amount / r.cap > 0.8 && (
                          <span className="cap-indicator" title={`Cap: ${formatNumber(r.cap)}`}>
                            /{formatNumber(r.cap)}
                          </span>
                        )}
                        {r.cap > 0 && r.amount >= r.cap * 0.98 && economy.gross[r.id] > 0 && (
                          <span className="text-danger" style={{ fontSize: '0.6em', marginLeft: '4px' }} title="Buy cap upgrades (Cap filter) to increase storage">FULL</span>
                        )}
                        {state.upgrades?.surplusExchange && r.cap > 0 && r.amount >= r.cap * 0.95 && (
                          <span style={{ fontSize: '0.6em', color: '#88aa44', marginLeft: '4px' }} title="Surplus Exchange: overflow converting to lowest resource">&#x267B;</span>
                        )}
                      </span>
                      <span className="resource-rate">
                        {economy.constrained[r.id] === 'paused' ? 'Paused' : economy.constrained[r.id] === 'storage' && r.rate === 0 ? 'Storage full · +0/s' : <>
                          {r.rate > 0 && <span className="rate-active" />}
                          <span className={r.rate < 0 ? 'rate-negative' : ''}>{r.rate >= 0 ? '+' : ''}{formatNumber(r.rate)}/s</span>
                          {economy.constrained[r.id] === 'input' && <span className="text-hint"> · input limited</span>}
                        </>}
                      </span>
                      <span className="resource-gather" style={{ position: 'relative' }}>
                        {gatheringAutomated ? (
                          <span className="resource-auto-label" title="Industrial systems gather this resource automatically">AUTO</span>
                        ) : <button
                          className="gather-btn"
                          disabled={r.cap > 0 && r.amount >= r.cap}
                          onClick={() => {
                            const eraScale = 1 + (state.era - 1);
                            const pm = getEffectivePrestige(state.prestigeMultiplier || 1);
                            const base = r.rateMult > 1 ? r.rateMult : 1;
                            handleGather(r.id, base * pm * eraScale);
                          }}
                          aria-label={`Gather ${r.def?.name || r.id}`}
                        >
                          {(() => {
                            const eraScale = 1 + (state.era - 1);
                            const prestigeMult = getEffectivePrestige(state.prestigeMultiplier || 1);
                            const base = r.rateMult > 1 ? r.rateMult : 1;
                            return '+' + formatNumber(base * prestigeMult * eraScale);
                          })()}
                        </button>}
                        {floats.filter(f => f.resourceId === r.id).map(f => (
                          <span key={f.id} className="gather-float">{f.text}</span>
                        ))}
                      </span>
                    </div>
                    {expandedResource === r.id && (() => {
                      const baseRate = r.def?.baseRate || 0;
                      const upgradeAdd = r.rateAdd || 0;
                      const mult = r.rateMult || 1;
                      const cb = getColonyBonus(state);
                      const rb = getRouteBonus(state);
                      const prestigeMult = getEffectivePrestige(state.prestigeMultiplier || 1);
                      const net = economy.net[r.id];
                      const cap = r.cap;
                      const pctFull = cap > 0 ? Math.floor(r.amount / cap * 100) : 0;
                      return (
                        <div className="resource-details" style={{ fontSize: '13px', background: '#1a1a2a', padding: '4px 8px', margin: '0 0 2px 0', borderLeft: '2px solid #555', color: '#aaa' }}>
                          <div>Base: {baseRate}/s</div>
                          {upgradeAdd > 0 && <div>Upgrades: +{upgradeAdd.toFixed(1)}/s</div>}
                          {mult > 1 && <div>Multiplier: x{mult}</div>}
                          {cb[r.id] > 0 && <div>Colonies: +{cb[r.id].toFixed(1)}/s</div>}
                          {rb[r.id] > 0 && <div>Star routes: +{rb[r.id].toFixed(1)}/s</div>}
                          {prestigeMult > 1 && <div>Prestige: x{formatNumber(prestigeMult)}</div>}
                          {chains.filter(c => c.input === r.id && state.resources[c.output]?.unlocked).map(c => <div key={c.output}>Feeds {resourceDefs[c.output].name}: {c.cost} per unit</div>)}
                          <div>Potential production: {formatNumber(economy.gross[r.id])}/s</div>
                          <div>Consumed / construction: {formatNumber(economy.consumed[r.id])}/s</div>
                          {economy.reserves[r.id] && state.protectProgression !== false && <div>Protected purchase: {economy.reserves[r.id].name} · up to {formatNumber(economy.reserves[r.id].amount)} saved when input is strained</div>}
                          <div style={{ color: net < 0 ? '#ff9966' : '#88dd88' }}>Net income: {formatNumber(net)}/s</div>
                          {cap > 0 && <div>Cap: {formatNumber(cap)} ({pctFull}% full)
                            <button disabled={r.amount < cap * 0.6} onClick={() => onUpdate(s => expandStorage(s, r.id))}>Expand storage ×1.5 · {formatNumber(cap * 0.6)} {r.def?.name}</button>
                          </div>}
                          {chains.filter(chain => chain.input === r.id && state.resources[chain.output]?.unlocked).map(chain => (
                            <div key={chain.output} className="consumer-controls">
                              <label><input type="checkbox" checked={!!state.consumerControls?.[chain.output]?.paused} onChange={e => onUpdate(s => setConsumerControl(s, chain.output, { paused: e.target.checked }))} /> Pause {resourceDefs[chain.output]?.name} consumption</label>
                              <label>Reserve <select value={state.consumerControls?.[chain.output]?.reserveFraction || 0} onChange={e => onUpdate(s => setConsumerControl(s, chain.output, { reserveFraction: Number(e.target.value) }))}>
                                <option value={0}>None</option><option value={0.25}>25% of storage</option><option value={0.5}>50% of storage</option><option value={0.9}>90% of storage</option>
                              </select></label>
                            </div>
                          ))}
                          {net > 0 && cap > 0 && r.amount < cap && (
                            <div style={{ color: '#aabbcc' }}>Full in: {formatTime(Math.ceil((cap - r.amount) / net))}</div>
                          )}
                          {net > 0 && cap === 0 && (
                            <div style={{ color: '#aabbcc' }}>+{formatNumber(net * 60)} per min</div>
                          )}
                          {net < 0 && r.amount > 0 && (
                            <div style={{ color: '#ff9966' }}>Empty in: {formatTime(Math.ceil(r.amount / Math.abs(net)))}</div>
                          )}
                        </div>
                      );
                    })()}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
});
