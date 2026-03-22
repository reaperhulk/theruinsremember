import { useState, useRef, useCallback, useMemo, useEffect, memo } from 'react';
import { getAvailableUpgrades, purchaseUpgrade, getPurchasedUpgrades, getUpgradeCost, buyMaxRepeatable, getUpcomingUpgrades } from '../engine/upgrades.js';
import { canAfford, getEffectiveRate } from '../engine/resources.js';
import { resources as resourceDefs } from '../data/resources.js';
import { upgrades as upgradeDefs } from '../data/upgrades.js';

import { formatNumber } from './format.js';
import { LORE_UPGRADE_IDS } from '../data/lore.js';
import { playUpgrade } from './AudioManager.js';

const LORE_UPGRADE_ID_SET = new Set(LORE_UPGRADE_IDS);

function countEffects(upgrades) {
  let count = 0;
  for (const u of upgrades) {
    count += u.effects.length;
    if (u.mechanic) count++;
  }
  return count;
}

const mechanicDescriptions = {
  clickAll: 'Clicking any resource gives +1 to all others',
  surplusConvert: 'Capped resources trickle to your lowest resource',
  upgradeCountBonus: '+0.5% production per upgrade owned (max 50%)',
  productionPulse: 'All production doubles for 10s every 60s',
  capOverflow: 'Capped resources overflow to research',
  purchaseBurst: 'Buying upgrades grants 5s of all resources',
  eraCompounding: '1.1x multiplier per era (compounds)',
  canvasDataCache: '20% chance on click to find data cache',
  miniGameSynergy: '+10% production per mini-game used',
  dockingBoost: 'Perfect docks boost all production 5% for 30s',
  colonyMultiplier: 'Colony focus multiplies target resources 1.5x',
  autoDeposit: 'Canvas deposits auto-collected after 5s',
  routeBonus: '+3% production per star route',
  hackPermanentBoost: 'Hack successes permanently +1% a random resource',
  prestigeAccumulator: '+5% production per prestige run completed',
  crisisInversion: 'Crisis events boost production instead of reducing it',
  diversityBonus: '1.05x per unlocked resource type',
  compoundingTick: 'Production compounds slightly each tick',
};

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
            <span style={{ color: enough ? '#88cc88' : '#ff6666', fontWeight: enough ? 'normal' : 'bold' }}>
              {resourceName(id)}: {formatNumber(amount)}
              {!enough && <span style={{ fontWeight: 'normal', fontSize: '0.85em', color: '#cc8888' }}> ({formatNumber(have)})</span>}
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

export const UpgradePanel = memo(function UpgradePanel({ state, onUpdate }) {
  const [showPurchased, setShowPurchased] = useState(false);
  const [sortBy, setSortBy] = useState('default');
  const [filterType, setFilterType] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [flashId, setFlashId] = useState(null);
  const [chainFlash, setChainFlash] = useState(false);
  const flashTimerRef = useRef(null);
  const chainTimerRef = useRef(null);
  const seenUpgradeIdsRef = useRef(new Set());
  const [newUpgradeIds, setNewUpgradeIds] = useState(new Set());

  const handlePurchase = useCallback((upgradeId) => {
    playUpgrade();
    setFlashId(upgradeId);
    onUpdate(s => {
      const result = purchaseUpgrade(s, upgradeId);
      // Chain Reaction flash when purchaseBurst fires
      if (result && result.upgrades?.chainReaction) {
        setChainFlash(true);
        clearTimeout(chainTimerRef.current);
        chainTimerRef.current = setTimeout(() => setChainFlash(false), 600);
      }
      return result;
    });
    clearTimeout(flashTimerRef.current);
    flashTimerRef.current = setTimeout(() => setFlashId(null), 400);
  }, [onUpdate]);
  const available = getAvailableUpgrades(state);
  const purchased = getPurchasedUpgrades(state);

  const upcoming = getUpcomingUpgrades(state);

  // Track newly appearing upgrades for "NEW" glow
  useEffect(() => {
    const currentIds = new Set(available.filter(u => !u.repeatable).map(u => u.id));
    const fresh = new Set();
    for (const id of currentIds) {
      if (!seenUpgradeIdsRef.current.has(id)) {
        fresh.add(id);
        seenUpgradeIdsRef.current.add(id);
      }
    }
    if (fresh.size > 0) {
      setNewUpgradeIds(prev => new Set([...prev, ...fresh]));
      const timer = setTimeout(() => {
        setNewUpgradeIds(prev => {
          const next = new Set(prev);
          for (const id of fresh) next.delete(id);
          return next;
        });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [available.length]);

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
  const typeFiltered = filterType === 'all' ? sortedAvailable : sortedAvailable.filter(u =>
    u.effects.some(e => {
      if (filterType === 'mult') return e.type === 'production_mult' || e.type === 'production_mult_all';
      if (filterType === 'add') return e.type === 'production_add';
      if (filterType === 'cap') return e.type === 'cap_mult';
      if (filterType === 'unlock') return e.type === 'unlock_resource';
      return true;
    })
  );

  // Apply text search filter
  const searchLower = searchText.toLowerCase().trim();
  const filteredAvailable = searchLower
    ? typeFiltered.filter(u =>
        u.name.toLowerCase().includes(searchLower) ||
        u.description.toLowerCase().includes(searchLower)
      )
    : typeFiltered;

  const affordableCount = useMemo(() =>
    filteredAvailable.filter(u => canAfford(state, getUpgradeCost(state, u.id))).length,
    [filteredAvailable, state.resources]
  );

  // Pre-compute enables counts for all upgrades (avoids O(N*M) per render)
  const enablesCountMap = useMemo(() => {
    const map = {};
    for (const u of Object.values(upgradeDefs)) {
      if (state.upgrades[u.id]) continue;
      for (const prereq of u.prerequisites) {
        map[prereq] = (map[prereq] || 0) + 1;
      }
    }
    return map;
  }, [state.upgrades]);

  return (
    <div className={`panel upgrade-panel${chainFlash ? ' chain-reaction-flash' : ''}`}>
      <h2>
        Upgrades{filteredAvailable.length > 0 ? ` (${affordableCount}/${filteredAvailable.length})` : ''}
        {upcoming.length > 0 ? `, ${upcoming.length} soon` : ''}
        {purchased.length > 0 && (
          <span
            className="toggle-purchased"
            onClick={() => setShowPurchased(!showPurchased)}
          >
            {showPurchased ? ' (hide owned)' : ` (${purchased.length} owned)`}
          </span>
        )}
      </h2>
      {filteredAvailable.some(u => LORE_UPGRADE_ID_SET.has(u.id)) && (
        <div className="text-hint" style={{ color: '#bb88ff', marginBottom: '4px' }}>
          Purple border = story upgrades — collected in Stats → Codex
        </div>
      )}
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
        const affordableNonRepeatable = filteredAvailable.filter(u => !u.repeatable && u.era === state.era && canAfford(state, getUpgradeCost(state, u.id)));
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
            {affordableNonRepeatable.length > 0 ? `Buy All Affordable (${affordableNonRepeatable.length} upgrades, ${countEffects(affordableNonRepeatable)} effects)` : 'No affordable upgrades'}
          </button>
        );
      })()}
      {available.length > 5 && (
        <input
          type="text"
          placeholder="Search upgrades..."
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          className="upgrade-search"
          style={{ width: '100%', padding: '4px 8px', marginBottom: '4px', background: '#161820', border: '1px solid #2a2418', color: '#d8d0c8', fontFamily: 'inherit', fontSize: '0.8em', borderRadius: '3px', boxSizing: 'border-box' }}
        />
      )}
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
          <p className="empty-message">No upgrades available — explore the Tech Tree for new paths, or buy prerequisite upgrades to unlock more</p>
        )}
        {filteredAvailable.length === 0 && upcoming.length > 0 && (
          <p className="empty-message">Buy prerequisites to unlock {upcoming.length} upcoming upgrade{upcoming.length > 1 ? 's' : ''}</p>
        )}
        {(() => { let firstAffordableFound = false; return filteredAvailable.map(upgrade => {
          const cost = getUpgradeCost(state, upgrade.id);
          const affordable = canAfford(state, cost);
          const count = typeof state.upgrades[upgrade.id] === 'number' ? state.upgrades[upgrade.id] : 0;
          const progress = affordable ? 1 : getAffordProgress(state, cost);
          const isMechanic = !!upgrade.mechanic;
          const isFirstHighlight = affordable && !firstAffordableFound && Object.keys(state.upgrades).length === 0;
          if (affordable && !firstAffordableFound) firstAffordableFound = true;
          return (
            <div key={upgrade.id} className="upgrade-row">
            <button
              className={`upgrade-btn ${affordable ? 'affordable' : 'too-expensive'} ${flashId === upgrade.id ? 'purchase-flash' : ''} ${LORE_UPGRADE_ID_SET.has(upgrade.id) ? 'lore-upgrade' : ''} ${isMechanic ? 'mechanic-upgrade' : ''} ${newUpgradeIds.has(upgrade.id) ? 'new-upgrade' : ''} ${isFirstHighlight ? 'first-upgrade-highlight' : ''}`}
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
              <div className="upgrade-desc" style={LORE_UPGRADE_ID_SET.has(upgrade.id) ? { color: '#998866', fontStyle: 'italic' } : undefined}>{upgrade.description}</div>
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
                {isMechanic && <span className="effect-tag effect-mechanic" title={mechanicDescriptions[upgrade.mechanic] || 'Special mechanic'}>MECHANIC</span>}
              </div>
              {enablesCountMap[upgrade.id] > 0 && (
                <div className="text-hint" style={{ color: enablesCountMap[upgrade.id] >= 5 ? '#ddaa44' : enablesCountMap[upgrade.id] >= 3 ? '#88ccaa' : '#777' }}>Enables {enablesCountMap[upgrade.id]} upgrade{enablesCountMap[upgrade.id] > 1 ? 's' : ''}</div>
              )}
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
                        {eta > 600 ? 'long wait' : `~${eta < 60 ? `${Math.round(eta / 5) * 5 || 5}s` : `${Math.ceil(eta / 60)}m`}`}
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
        }); })()}
      </div>
      {upcoming.length > 0 && (
        <div className="upcoming-section">
          <div className="upcoming-header">Coming Soon</div>
          {upcoming.map(u => {
            // Build prereq chain display: show path to this upgrade
            const missingId = u.prerequisites.find(p => !state.upgrades[p]);
            const missingDef = missingId ? upgradeDefs[missingId] : null;
            // Check if the missing prereq itself has unmet prereqs (2-step chain)
            const grandparentMissing = missingDef
              ? missingDef.prerequisites.find(p => !state.upgrades[p])
              : null;
            const grandparentName = grandparentMissing ? (upgradeDefs[grandparentMissing]?.name || grandparentMissing) : null;
            return (
              <div key={u.id} className="upcoming-upgrade">
                <span className="upcoming-name">{u.name}</span>
                <span className="upcoming-desc">
                  {u.missingPrereq ? (
                    <span style={{ color: '#ffcc44', fontWeight: 'bold' }}>
                      {grandparentName
                        ? `${grandparentName} \u2192 ${u.missingPrereq} \u2192 this`
                        : `Buy ${u.missingPrereq} first`}
                    </span>
                  ) : u.description}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});
