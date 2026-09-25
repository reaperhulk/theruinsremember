import { useRef, useState } from 'react';
import { BUILDINGS, BUILDING_BY_ID, ERA_NAMES } from '../game/data.js';
import {
  getAvailableUpgrades, getBuildingCost, getBuildingUnitSps, getMaxAffordable, getSps,
  getUpgradeCost, isBuildingRevealed,
} from '../game/engine.js';
import { formatAmount, formatNumber } from './format.js';

const MODES = [1, 10, 100, 'max'];
const UPGRADE_GLYPHS = { building: '⚒', clickDouble: '✋', clickShare: '✋', global: '✦', echo: '◌' };

function upgradeEra(upgrade) {
  return upgrade.kind === 'building' ? BUILDING_BY_ID[upgrade.building].era : upgrade.era || 1;
}

function Upgrades({ state, onBuy }) {
  const [selected, setSelected] = useState(null);
  const [showAll, setShowAll] = useState(false);
  // How the current press began. Taps also fire hover and focus before the
  // click, and Safari's click events carry no pointer type, so decide at
  // pointerdown whether this is a first tap (show it) or a second (buy it).
  const press = useRef(null);
  const available = getAvailableUpgrades(state);
  if (!available.length) return <p className="store-empty">Keep digging. Improvements appear as the ruins give up their secrets.</p>;
  const shown = showAll ? available : available.slice(0, 12);
  const focus = available.find(u => u.id === selected) || null;
  return (
    <div className="upgrades">
      <div className="upgrade-grid" role="list">
        {shown.map(upgrade => {
          const cost = getUpgradeCost(state, upgrade.id);
          const affordable = cost <= state.salvage;
          return (
            <button key={upgrade.id} type="button" role="listitem"
              className={`upgrade-tile era-${upgradeEra(upgrade)}${affordable ? ' affordable' : ''}${selected === upgrade.id ? ' selected' : ''}`}
              aria-label={`${upgrade.name}: ${upgrade.description} Costs ${formatAmount(cost)}.`}
              onPointerDown={event => { press.current = { id: upgrade.id, touch: event.pointerType !== 'mouse', wasSelected: selected === upgrade.id }; }}
              onPointerEnter={event => { if (event.pointerType === 'mouse') setSelected(upgrade.id); }}
              onFocus={() => setSelected(upgrade.id)}
              onClick={() => {
                const tap = press.current?.id === upgrade.id ? press.current : null;
                press.current = null;
                // Touch: the first tap shows what it does, the second buys it.
                if (tap?.touch && !tap.wasSelected) { setSelected(upgrade.id); return; }
                if (affordable) { onBuy(upgrade.id); setSelected(null); } else setSelected(upgrade.id);
              }}>
              <span className="glyph" aria-hidden="true">{UPGRADE_GLYPHS[upgrade.kind]}</span>
            </button>
          );
        })}
        {available.length > 12 && (
          <button type="button" className="upgrade-more" onClick={() => setShowAll(v => !v)}>
            {showAll ? 'Less' : `+${available.length - 12}`}
          </button>
        )}
      </div>
      <div className="upgrade-detail" aria-live="polite">
        {focus ? (
          <>
            <strong>{focus.name}</strong>
            <span>{focus.description}</span>
            <span className="detail-buy">
              <span className={getUpgradeCost(state, focus.id) <= state.salvage ? 'cost ok' : 'cost'}>{formatAmount(getUpgradeCost(state, focus.id))} salvage</span>
              <button type="button" className="primary" disabled={getUpgradeCost(state, focus.id) > state.salvage}
                onClick={() => { onBuy(focus.id); setSelected(null); }}>Buy</button>
            </span>
          </>
        ) : <span className="muted">Hover or tap an improvement to see what it does. Click it, or tap it twice, to buy.</span>}
      </div>
    </div>
  );
}

function Buildings({ state, mode, onBuy }) {
  const sps = getSps(state);
  const revealed = BUILDINGS.filter(b => isBuildingRevealed(state, b.id));
  const next = BUILDINGS.find(b => !isBuildingRevealed(state, b.id));
  return (
    <ul className="buildings">
      {revealed.map(building => {
        const owned = state.buildings[building.id] || 0;
        const amount = mode === 'max' ? Math.max(1, getMaxAffordable(state, building.id)) : mode;
        const cost = getBuildingCost(state, building.id, amount);
        const affordable = cost <= state.salvage;
        const unit = getBuildingUnitSps(state, building.id);
        const share = sps > 0 ? owned * unit / sps * 100 : 0;
        return (
          <li key={building.id}>
            <button type="button" className={`building era-${building.era}${affordable ? ' affordable' : ''}`}
              aria-disabled={!affordable}
              onClick={() => affordable && onBuy(building.id, amount)}
              title={`${building.description}\nEach produces ${formatNumber(unit)}/s.${owned ? ` ${owned} produce ${formatNumber(owned * unit)}/s (${share.toFixed(1)}% of total).` : ''}`}>
              <span className="building-name">
                {building.name}
                <small>{ERA_NAMES[building.era]} · {formatNumber(unit)}/s each</small>
              </span>
              <span className="building-cost">{amount > 1 ? `×${amount} ` : ''}{formatAmount(cost)}</span>
              <span className="building-owned" aria-label={`${owned} owned`}>{owned}</span>
            </button>
          </li>
        );
      })}
      {next && (
        <li>
          <div className="building locked" aria-label="An undiscovered building">
            <span className="building-name">???<small>Recover {formatAmount(next.cost * 0.5)} salvage this cycle to discover it</small></span>
            <span className="building-cost">{formatAmount(next.cost)}</span>
            <span className="building-owned">?</span>
          </div>
        </li>
      )}
    </ul>
  );
}

export function Store({ state, onBuyBuilding, onBuyUpgrade }) {
  const [mode, setMode] = useState(1);
  return (
    <section className="store" aria-label="Store">
      <h2>Improvements</h2>
      <Upgrades state={state} onBuy={onBuyUpgrade} />
      <div className="store-heading">
        <h2>Buildings</h2>
        <div className="buy-mode" role="radiogroup" aria-label="Buy amount">
          {MODES.map(m => (
            <button key={m} type="button" role="radio" aria-checked={mode === m} className={mode === m ? 'active' : ''} onClick={() => setMode(m)}>
              {m === 'max' ? 'Max' : `×${m}`}
            </button>
          ))}
        </div>
      </div>
      <Buildings state={state} mode={mode} onBuy={onBuyBuilding} />
    </section>
  );
}
