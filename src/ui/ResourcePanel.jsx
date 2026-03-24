import { useState, useCallback, useRef, useEffect, memo } from 'react';
import { resources as resourceDefs } from '../data/resources.js';
import { getEffectiveRate, getEffectiveCap, getNetRate, gather } from '../engine/resources.js';
import { eraNames } from '../engine/eras.js';
import { getFactoryBonus } from '../engine/factory.js';
import { getColonyBonus } from '../engine/colonies.js';
import { getRouteBonus } from '../engine/starChart.js';
import { formatNumber } from './format.js';

export const ResourcePanel = memo(function ResourcePanel({ state, onUpdate }) {
  const [collapsed, setCollapsed] = useState({});
  const [autoCollapse] = useState(true);
  const [floats, setFloats] = useState([]);
  const [expandedResource, setExpandedResource] = useState(null);
  const seenResourcesRef = useRef(new Set());
  const [newResources, setNewResources] = useState(new Set());
  const prevRatesRef = useRef({});
  const [boostedResources, setBoostedResources] = useState(new Set());

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
      rate: getEffectiveRate(state, id),
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
  }, [state.upgrades]);

  // Group by era
  const byEra = {};
  for (const r of unlockedResources) {
    const era = r.def?.era || 1;
    if (!byEra[era]) byEra[era] = [];
    byEra[era].push(r);
  }

  const eras = Object.keys(byEra).map(Number).sort((a, b) => a - b);

  const overclockActive = state.upgrades?.overclockProtocol && ((state.totalTime || 0) % 60) < 10;

  // Detect throttled consumption chains
  const throttledChains = [];
  if (state.resources.food?.unlocked && getEffectiveRate(state, 'labor') > 0) {
    const net = getNetRate(state, 'food');
    const gross = getEffectiveRate(state, 'food');
    if (gross > 0 && net / gross < 0.2) throttledChains.push('Food → Labor');
  }
  if (state.resources.energy?.unlocked && getEffectiveRate(state, 'electronics') > 0) {
    const net = getNetRate(state, 'energy');
    const gross = getEffectiveRate(state, 'energy');
    if (gross > 0 && net / gross < 0.2) throttledChains.push('Energy → Electronics');
  }
  if (state.era >= 4 && state.resources.rocketFuel?.unlocked && getEffectiveRate(state, 'orbitalInfra') > 0) {
    const net = getNetRate(state, 'rocketFuel');
    const gross = getEffectiveRate(state, 'rocketFuel');
    if (gross > 0 && net / gross < 0.2) throttledChains.push('Fuel → Orbital');
  }
  if (state.era >= 5 && state.resources.exoticMaterials?.unlocked && getEffectiveRate(state, 'colonies') > 0) {
    const net = getNetRate(state, 'exoticMaterials');
    const gross = getEffectiveRate(state, 'exoticMaterials');
    if (gross > 0 && net / gross < 0.2) throttledChains.push('Exotic → Colonies');
  }
  if (state.era >= 7 && state.resources.stellarForge?.unlocked && getEffectiveRate(state, 'megastructures') > 0) {
    const net = getNetRate(state, 'stellarForge');
    const gross = getEffectiveRate(state, 'stellarForge');
    if (gross > 0 && net / gross < 0.2) throttledChains.push('Forge → Mega');
  }

  return (
    <div className="panel resource-panel" style={overclockActive ? { borderColor: '#cc9933', boxShadow: '0 0 8px rgba(204, 153, 51, 0.3)' } : undefined}>
      <h2>Resources ({unlockedResources.length} unlocked)</h2>
      {throttledChains.length >= 2 && (
        <div style={{ fontSize: '0.75em', color: '#ff8844', padding: '2px 8px', marginBottom: '4px', background: 'rgba(255,100,50,0.1)', borderRadius: '3px' }}>
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
                  // Mini-game bonuses
                  const fb = getFactoryBonus(state);
                  if (fb[r.id]) tooltipParts.push(`Factory: +${fb[r.id].toFixed(1)}/s`);
                  const cb = getColonyBonus(state);
                  if (cb[r.id]) tooltipParts.push(`Colonies: +${cb[r.id].toFixed(1)}/s`);
                  const rb = getRouteBonus(state);
                  if (rb[r.id]) tooltipParts.push(`Star routes: +${rb[r.id].toFixed(1)}/s`);
                  if (state.prestigeMultiplier > 1) tooltipParts.push(`Prestige: x${formatNumber(state.prestigeMultiplier)}`);
                  // Consumption info
                  if (r.id === 'food' && r.rate > 0) tooltipParts.push(`Consumed by: labor (0.8/labor/s)`);
                  if (r.id === 'energy') tooltipParts.push(`Consumed by: electronics (0.3/elec/s)`);
                  if (r.id === 'rocketFuel' && state.era >= 4) tooltipParts.push(`Consumed by: orbital infra (0.6/orbital/s)`);
                  if (r.id === 'exoticMaterials' && state.era >= 5) tooltipParts.push(`Consumed by: colonies (0.2/colony/s)`);
                  if (r.id === 'stellarForge' && state.era >= 7) tooltipParts.push(`Consumed by: megastructures (0.3/mega/s)`);
                  tooltipParts.push(`Effective: ${formatNumber(r.rate)}/s`);
                  if (r.cap > 0) tooltipParts.push(`Cap: ${formatNumber(r.cap)}`);
                  const tooltip = tooltipParts.join('\n');
                  return (
                    <div key={r.id} className={`resource-row-wrapper`}>
                    <div className={`resource-row ${r.rate > 0 ? 'producing' : ''} ${newResources.has(r.id) ? 'new-resource' : ''} ${boostedResources.has(r.id) ? 'rate-boosted' : ''} ${((r.id === 'food' && getEffectiveRate(state, 'labor') > 0) || (r.id === 'energy' && getEffectiveRate(state, 'electronics') > 0) || (r.id === 'rocketFuel' && state.era >= 4 && getEffectiveRate(state, 'orbitalInfra') > 0) || (r.id === 'exoticMaterials' && state.era >= 5 && getEffectiveRate(state, 'colonies') > 0) || (r.id === 'stellarForge' && state.era >= 7 && getEffectiveRate(state, 'megastructures') > 0)) ? 'consuming' : ''} ${r.cap > 0 && r.amount >= r.cap * 0.98 && r.rate > 0 ? 'resource-capped' : ''}`} title={tooltip}>
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
                        {r.cap > 0 && r.amount >= r.cap * 0.98 && r.rate > 0 && (
                          <span className="text-danger" style={{ fontSize: '0.6em', marginLeft: '4px' }} title="Buy cap upgrades (Cap filter) to increase storage">FULL</span>
                        )}
                        {state.upgrades?.surplusExchange && r.cap > 0 && r.amount >= r.cap * 0.95 && (
                          <span style={{ fontSize: '0.6em', color: '#88aa44', marginLeft: '4px' }} title="Surplus Exchange: overflow converting to lowest resource">&#x267B;</span>
                        )}
                      </span>
                      <span className="resource-rate">
                        {r.rate > 0 ? (() => {
                          const net = getNetRate(state, r.id);
                          const isConsumed = ['food','energy','rocketFuel','exoticMaterials','stellarForge'].includes(r.id) && net < r.rate;
                          // Check if this resource is throttled by its supply chain
                          const supplyChain = { labor: 'food', electronics: 'energy', orbitalInfra: 'rocketFuel', colonies: 'exoticMaterials', megastructures: 'stellarForge' };
                          const supplier = supplyChain[r.id];
                          const isThrottled = supplier && state.resources[supplier]?.unlocked &&
                            getNetRate(state, supplier) < 0;
                          if (isConsumed) {
                            return <>
                              {net > 0 && <span className="rate-active" />}
                              <span className={net < 0 ? 'rate-negative' : ''} style={{ color: net >= 0 ? '#88dd88' : '#ff6644' }}>
                                {net >= 0 ? '+' : ''}{formatNumber(net)}/s
                                {net < 0 && <span className="rate-warning" title="Consumption exceeds production!"> DRAINING</span>}
                              </span>
                            </>;
                          }
                          if (isThrottled) {
                            return <>
                              <span className="rate-active" />
                              <span style={{ color: '#ddaa44' }}>+{formatNumber(r.rate)}/s</span>
                              <span style={{ fontSize: '0.6em', color: '#ddaa44', marginLeft: '3px' }} title={`Production limited — ${resourceDefs[supplier]?.name || supplier} supply is low`}>SLOW</span>
                            </>;
                          }
                          return <><span className="rate-active" />+{formatNumber(r.rate)}/s</>;
                        })() : ''}
                      </span>
                      <span className="resource-gather" style={{ position: 'relative', opacity: r.rate > 0 ? 0.3 : 1 }}>
                        <button
                          className="gather-btn"
                          onClick={() => handleGather(r.id, r.rateMult > 1 ? r.rateMult : 1)}
                          aria-label={`Gather ${r.def?.name || r.id}. +${r.rateMult > 1 ? formatNumber(r.rateMult) : '1'}`}
                        >
                          +{r.rateMult > 1 ? formatNumber(r.rateMult) : '1'}
                        </button>
                        {floats.filter(f => f.resourceId === r.id).map(f => (
                          <span key={f.id} className="gather-float">{f.text}</span>
                        ))}
                      </span>
                    </div>
                    {expandedResource === r.id && (() => {
                      const baseRate = r.def?.baseRate || 0;
                      const upgradeAdd = r.rateAdd || 0;
                      const mult = r.rateMult || 1;
                      const fb = getFactoryBonus(state);
                      const cb = getColonyBonus(state);
                      const rb = getRouteBonus(state);
                      const prestigeMult = state.prestigeMultiplier || 1;
                      const net = getNetRate(state, r.id);
                      const cap = r.cap;
                      const pctFull = cap > 0 ? Math.floor(r.amount / cap * 100) : 0;
                      return (
                        <div style={{ fontSize: '0.7em', background: '#1a1a2a', padding: '4px 8px', margin: '0 0 2px 0', borderLeft: '2px solid #555', color: '#aaa' }}>
                          <div>Base: {baseRate}/s</div>
                          {upgradeAdd > 0 && <div>Upgrades: +{upgradeAdd.toFixed(1)}/s</div>}
                          {mult > 1 && <div>Multiplier: x{mult}</div>}
                          {fb[r.id] > 0 && <div>Factory: +{fb[r.id].toFixed(1)}/s</div>}
                          {cb[r.id] > 0 && <div>Colonies: +{cb[r.id].toFixed(1)}/s</div>}
                          {rb[r.id] > 0 && <div>Star routes: +{rb[r.id].toFixed(1)}/s</div>}
                          {prestigeMult > 1 && <div>Prestige: x{formatNumber(prestigeMult)}</div>}
                          {r.id === 'food' && getEffectiveRate(state, 'labor') > 0 && (
                            <div style={{ color: '#ff9966' }}>Consumed by: labor (0.8/labor/s)</div>
                          )}
                          {r.id === 'energy' && getEffectiveRate(state, 'electronics') > 0 && (
                            <div style={{ color: '#ff9966' }}>Consumed by: electronics (0.3/elec/s)</div>
                          )}
                          {r.id === 'rocketFuel' && state.era >= 4 && getEffectiveRate(state, 'orbitalInfra') > 0 && (
                            <div style={{ color: '#ff9966' }}>Consumed by: orbital infra (0.6/orbital/s)</div>
                          )}
                          {r.id === 'exoticMaterials' && state.era >= 5 && state.resources.colonies?.unlocked && (
                            <div style={{ color: '#ff9966' }}>Consumed by: colonies (0.2/colony/s)</div>
                          )}
                          {r.id === 'stellarForge' && state.era >= 7 && state.resources.megastructures?.unlocked && (
                            <div style={{ color: '#ff9966' }}>Consumed by: megastructures (0.3/mega/s)</div>
                          )}
                          <div style={{ color: '#88dd88' }}>Effective: {formatNumber(r.rate)}/s{net !== r.rate ? ` (net: ${formatNumber(net)}/s)` : ''}</div>
                          {cap > 0 && <div>Cap: {formatNumber(cap)} ({pctFull}% full)</div>}
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
