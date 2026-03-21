import { useState, useRef, useCallback } from 'react';
import { getAvailableUpgrades, purchaseUpgrade, getPurchasedUpgrades, getUpgradeCost, buyMaxRepeatable, getUpcomingUpgrades } from '../engine/upgrades.js';
import { canAfford, getEffectiveRate } from '../engine/resources.js';
import { resources as resourceDefs } from '../data/resources.js';
import { upgrades as upgradeDefs } from '../data/upgrades.js';

import { formatNumber } from './format.js';

const LORE_UPGRADE_IDS = new Set([
  'precursorBeacon', 'deadStarAtlas', 'hollowDyson', 'echoBlueprint',
  'galacticOssuary', 'convergenceCodex', 'universalTombstone',
  'inevitabilityEngine', 'recursionScar', 'finalIteration',
]);

function resourceName(id) {
  return resourceDefs[id]?.name || id;
}

function CostDisplay({ cost, state }) {
  return (
    <span className="upgrade-cost">
      {Object.entries(cost).map(([id, amount], i) => {
        const have = state.resources[id]?.amount || 0;
        const enough = have >= amount;
        return (
          <span key={id}>
            {i > 0 && ', '}
            <span style={{ color: enough ? '#88cc88' : '#ff8888' }}>
              {resourceName(id)}: {formatNumber(amount)}
            </span>
          </span>
        );
      })}
    </span>
  );
}

function formatEffects(effects) {
  return effects.map(e => {
    switch (e.type) {
      case 'production_mult': return `x${e.value} ${resourceName(e.target)}`;
      case 'production_mult_all': return `x${e.value} ALL production`;
      case 'production_add': return `+${e.value} ${resourceName(e.target)}/s`;
      case 'cap_mult': return `x${e.value} ${resourceName(e.target)} cap`;
      case 'unlock_resource': return `Unlock ${resourceName(e.target)}`;
      default: return '';
    }
  }).filter(Boolean).join(', ');
}

// Estimate seconds until affordable (worst bottleneck resource)
function getTimeToAfford(state, cost) {
  let maxTime = 0;
  for (const [resourceId, amount] of Object.entries(cost)) {
    const r = state.resources[resourceId];
    const have = r ? r.amount : 0;
    if (have >= amount) continue;
    const rate = getEffectiveRate(state, resourceId);
    if (rate <= 0) return Infinity;
    const needed = amount - have;
    const time = needed / rate;
    if (time > maxTime) maxTime = time;
  }
  return maxTime;
}

// Calculate overall progress toward affording an upgrade (0-1)
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

export function UpgradePanel({ state, onUpdate }) {
  const [showPurchased, setShowPurchased] = useState(false);
  const [sortBy, setSortBy] = useState('default');
  const [filterType, setFilterType] = useState('all');
  const [flashId, setFlashId] = useState(null);

  const handlePurchase = useCallback((upgradeId) => {
    setFlashId(upgradeId);
    onUpdate(s => purchaseUpgrade(s, upgradeId));
    setTimeout(() => setFlashId(null), 400);
  }, [onUpdate]);
  const available = getAvailableUpgrades(state);
  const purchased = getPurchasedUpgrades(state);

  const upcoming = getUpcomingUpgrades(state);

  // Sort upgrades
  const sortedAvailable = [...available].sort((a, b) => {
    if (sortBy === 'affordable') {
      const aAfford = canAfford(state, getUpgradeCost(state, a.id)) ? 0 : 1;
      const bAfford = canAfford(state, getUpgradeCost(state, b.id)) ? 0 : 1;
      return aAfford - bAfford;
    }
    if (sortBy === 'cheapest') {
      const aCost = Object.values(getUpgradeCost(state, a.id)).reduce((s, v) => s + v, 0);
      const bCost = Object.values(getUpgradeCost(state, b.id)).reduce((s, v) => s + v, 0);
      return aCost - bCost;
    }
    return 0;
  });

  // Apply effect type filter
  const filteredAvailable = filterType === 'all' ? sortedAvailable : sortedAvailable.filter(u =>
    u.effects.some(e => {
      if (filterType === 'mult') return e.type === 'production_mult' || e.type === 'production_mult_all';
      if (filterType === 'add') return e.type === 'production_add';
      if (filterType === 'cap') return e.type === 'cap_mult';
      if (filterType === 'unlock') return e.type === 'unlock_resource';
      return true;
    })
  );

  return (
    <div className="panel upgrade-panel">
      <h2>
        Upgrades{filteredAvailable.length > 0 ? ` (${filteredAvailable.filter(u => canAfford(state, getUpgradeCost(state, u.id))).length}/${filteredAvailable.length})` : ''}{upcoming.length > 0 ? ` — ${upcoming.length} soon` : ''}
        {purchased.length > 0 && (
          <span
            className="toggle-purchased"
            onClick={() => setShowPurchased(!showPurchased)}
          >
            {showPurchased ? ' (hide owned)' : ` (${purchased.length} owned)`}
          </span>
        )}
      </h2>
      {showPurchased && purchased.length > 0 && (
        <div className="purchased-list">
          {purchased.map(u => (
            <div key={u.id} className="purchased-upgrade">
              <span className="purchased-name">
                {u.name}
                {u.purchaseCount > 1 && ` (x${u.purchaseCount})`}
              </span>
              <span className="purchased-desc">{u.description}</span>
            </div>
          ))}
        </div>
      )}
      {(() => {
        const affordableNonRepeatable = filteredAvailable.filter(u => !u.repeatable && canAfford(state, getUpgradeCost(state, u.id)));
        return available.length > 0 && (
          <button
            className="gather-btn"
            style={{ width: '100%', marginBottom: '4px', padding: '4px', fontSize: '0.8em' }}
            disabled={affordableNonRepeatable.length === 0}
            onClick={() => onUpdate(s => {
              let current = s;
              for (const u of affordableNonRepeatable) {
                const next = purchaseUpgrade(current, u.id);
                if (next) current = next;
              }
              return current;
            })}
          >
            {affordableNonRepeatable.length > 0 ? `Buy All Affordable (${affordableNonRepeatable.length})` : 'No affordable upgrades'}
          </button>
        );
      })()}
      {available.length > 0 && (
        <div className="upgrade-sort">
          <button className={sortBy === 'default' ? 'active' : ''} onClick={() => setSortBy('default')}>All</button>
          <button className={sortBy === 'affordable' ? 'active' : ''} onClick={() => setSortBy('affordable')}>Can Buy</button>
          <button className={sortBy === 'cheapest' ? 'active' : ''} onClick={() => setSortBy('cheapest')}>Cheap</button>
          <span style={{ borderLeft: '1px solid #333', margin: '0 4px' }} />
          <button className={filterType === 'all' ? 'active' : ''} onClick={() => setFilterType('all')}>Any</button>
          <button className={filterType === 'mult' ? 'active' : ''} onClick={() => setFilterType('mult')}>xN</button>
          <button className={filterType === 'add' ? 'active' : ''} onClick={() => setFilterType('add')}>+N</button>
          <button className={filterType === 'cap' ? 'active' : ''} onClick={() => setFilterType('cap')}>Cap</button>
        </div>
      )}
      <div className="upgrade-list">
        {filteredAvailable.length === 0 && upcoming.length === 0 && (
          <p className="empty-message">No upgrades available — buy prerequisite upgrades to unlock more</p>
        )}
        {filteredAvailable.length === 0 && upcoming.length > 0 && (
          <p className="empty-message">Buy prerequisites to unlock {upcoming.length} upcoming upgrade{upcoming.length > 1 ? 's' : ''}</p>
        )}
        {filteredAvailable.map(upgrade => {
          const cost = getUpgradeCost(state, upgrade.id);
          const affordable = canAfford(state, cost);
          const count = typeof state.upgrades[upgrade.id] === 'number' ? state.upgrades[upgrade.id] : 0;
          const progress = affordable ? 1 : getAffordProgress(state, cost);
          return (
            <div key={upgrade.id} className="upgrade-row">
            <button
              className={`upgrade-btn ${affordable ? 'affordable' : 'too-expensive'} ${flashId === upgrade.id ? 'purchase-flash' : ''} ${LORE_UPGRADE_IDS.has(upgrade.id) ? 'lore-upgrade' : ''}`}
              disabled={!affordable}
              onClick={() => handlePurchase(upgrade.id)}
              title={`${upgrade.description}\nEffects: ${formatEffects(upgrade.effects)}`}
            >
              <div className="upgrade-name">
                {upgrade.prerequisites.length > 0 && <span className="chain-depth" title="Chain depth">{'→'.repeat(Math.min(upgrade.prerequisites.length, 3))}</span>}
                {upgrade.name}
                {upgrade.repeatable && count > 0 && ` (x${count})`}
                {upgrade.repeatable && <span className="repeatable-badge">repeatable</span>}
              </div>
              <div className="upgrade-cost"><CostDisplay cost={cost} state={state} /></div>
              <div className="upgrade-desc">{upgrade.description}</div>
              <div className="upgrade-effects">
                {upgrade.effects.map((e, i) => {
                  let label = '';
                  let cls = 'effect-tag';
                  switch (e.type) {
                    case 'production_mult': label = `x${e.value} ${resourceName(e.target)}`; cls += ' effect-mult'; break;
                    case 'production_mult_all': label = `x${e.value} ALL production`; cls += ' effect-mult'; break;
                    case 'production_add': label = `+${e.value} ${resourceName(e.target)}/s`; cls += ' effect-add'; break;
                    case 'cap_mult': label = `x${e.value} ${resourceName(e.target)} cap`; cls += ' effect-cap'; break;
                    case 'unlock_resource': label = `Unlock ${resourceName(e.target)}`; cls += ' effect-unlock'; break;
                  }
                  return <span key={i} className={cls}>{label}</span>;
                })}
              </div>
              {(() => {
                const enablesCount = Object.values(upgradeDefs).filter(u =>
                  u.prerequisites.includes(upgrade.id) && !state.upgrades[u.id]
                ).length;
                return enablesCount > 0 ? <div style={{ fontSize: '0.7em', color: '#88ccaa' }}>Enables {enablesCount} upgrade{enablesCount > 1 ? 's' : ''}</div> : null;
              })()}
              {!affordable && (() => {
                const eta = getTimeToAfford(state, cost);
                return (
                  <div className="upgrade-progress-bar">
                    <div
                      className={`upgrade-progress-fill ${progress > 0.8 ? 'almost' : ''}`}
                      style={{ width: `${Math.floor(progress * 100)}%` }}
                    />
                    {eta < Infinity && eta > 0 && (
                      <span className="upgrade-eta" style={{ position: 'absolute', right: '4px', top: '0', fontSize: '0.7em', color: '#888', lineHeight: '8px' }}>
                        ~{eta < 60 ? `${Math.ceil(eta)}s` : eta < 3600 ? `${Math.ceil(eta / 60)}m` : `${Math.floor(eta / 3600)}h`}
                      </span>
                    )}
                  </div>
                );
              })()}
            </button>
            {upgrade.repeatable && affordable && (
              <button
                className="upgrade-btn buy-max-btn affordable"
                onClick={() => onUpdate(s => buyMaxRepeatable(s, upgrade.id))}
                title="Buy as many as you can afford"
                style={{ fontSize: '0.8em', padding: '4px 8px' }}
              >
                Max
              </button>
            )}
            </div>
          );
        })}
      </div>
      {upcoming.length > 0 && (
        <div className="upcoming-section">
          <div className="upcoming-header">Coming Soon</div>
          {upcoming.map(u => (
            <div key={u.id} className="upcoming-upgrade">
              <span className="upcoming-name">{u.name}</span>
              <span className="upcoming-desc">
                {u.missingPrereq ? (
                  <span style={{ color: '#ffcc44', fontWeight: 'bold' }}>Buy {u.missingPrereq} first</span>
                ) : u.description}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
