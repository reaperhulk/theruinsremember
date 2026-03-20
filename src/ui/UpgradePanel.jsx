import { useState } from 'react';
import { getAvailableUpgrades, purchaseUpgrade, getPurchasedUpgrades, getUpgradeCost, buyMaxRepeatable } from '../engine/upgrades.js';
import { canAfford } from '../engine/resources.js';

function formatCost(cost) {
  return Object.entries(cost)
    .map(([id, amount]) => `${id}: ${amount}`)
    .join(', ');
}

function formatEffects(effects) {
  return effects.map(e => {
    switch (e.type) {
      case 'production_mult': return `x${e.value} ${e.target}`;
      case 'production_mult_all': return `x${e.value} ALL production`;
      case 'production_add': return `+${e.value} ${e.target}/s`;
      case 'cap_mult': return `x${e.value} ${e.target} cap`;
      case 'unlock_resource': return `Unlock ${e.target}`;
      default: return '';
    }
  }).filter(Boolean).join(', ');
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
  const [sortBy, setSortBy] = useState('default'); // 'default' | 'affordable' | 'cheapest'
  const available = getAvailableUpgrades(state);
  const purchased = getPurchasedUpgrades(state);

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

  return (
    <div className="panel upgrade-panel">
      <h2>
        Upgrades
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
      {available.length > 3 && (
        <div className="upgrade-sort">
          <button className={sortBy === 'default' ? 'active' : ''} onClick={() => setSortBy('default')}>Default</button>
          <button className={sortBy === 'affordable' ? 'active' : ''} onClick={() => setSortBy('affordable')}>Affordable</button>
          <button className={sortBy === 'cheapest' ? 'active' : ''} onClick={() => setSortBy('cheapest')}>Cheapest</button>
        </div>
      )}
      <div className="upgrade-list">
        {sortedAvailable.length === 0 && (
          <p className="empty-message">No upgrades available</p>
        )}
        {sortedAvailable.map(upgrade => {
          const cost = getUpgradeCost(state, upgrade.id);
          const affordable = canAfford(state, cost);
          const count = typeof state.upgrades[upgrade.id] === 'number' ? state.upgrades[upgrade.id] : 0;
          const progress = affordable ? 1 : getAffordProgress(state, cost);
          return (
            <div key={upgrade.id} className="upgrade-row">
            <button
              className={`upgrade-btn ${affordable ? 'affordable' : 'too-expensive'}`}
              disabled={!affordable}
              onClick={() => onUpdate(s => purchaseUpgrade(s, upgrade.id))}
              title={`${upgrade.description}\nEffects: ${formatEffects(upgrade.effects)}`}
            >
              <div className="upgrade-name">
                {upgrade.name}
                {upgrade.repeatable && count > 0 && ` (x${count})`}
                {upgrade.repeatable && <span className="repeatable-badge">repeatable</span>}
              </div>
              <div className="upgrade-cost">{formatCost(cost)}</div>
              <div className="upgrade-desc">{upgrade.description}</div>
              <div className="upgrade-effects">
                {upgrade.effects.map((e, i) => {
                  let label = '';
                  let cls = 'effect-tag';
                  switch (e.type) {
                    case 'production_mult': label = `x${e.value} ${e.target}`; cls += ' effect-mult'; break;
                    case 'production_mult_all': label = `x${e.value} ALL production`; cls += ' effect-mult'; break;
                    case 'production_add': label = `+${e.value} ${e.target}/s`; cls += ' effect-add'; break;
                    case 'cap_mult': label = `x${e.value} ${e.target} cap`; cls += ' effect-cap'; break;
                    case 'unlock_resource': label = `Unlock ${e.target}`; cls += ' effect-unlock'; break;
                  }
                  return <span key={i} className={cls}>{label}</span>;
                })}
              </div>
              {!affordable && (
                <div className="upgrade-progress-bar">
                  <div
                    className={`upgrade-progress-fill ${progress > 0.8 ? 'almost' : ''}`}
                    style={{ width: `${Math.floor(progress * 100)}%` }}
                  />
                </div>
              )}
            </button>
            {upgrade.repeatable && affordable && (
              <button
                className="upgrade-btn buy-max-btn affordable"
                onClick={() => onUpdate(s => buyMaxRepeatable(s, upgrade.id))}
                title="Buy as many as you can afford"
              >
                Buy Max
              </button>
            )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
