import { useState } from 'react';
import { resources as resourceDefs } from '../data/resources.js';
import { getEffectiveRate, gather } from '../engine/resources.js';
import { eraNames } from '../engine/eras.js';
import { getFactoryBonus } from '../engine/factory.js';
import { getColonyBonus } from '../engine/colonies.js';
import { getRouteBonus } from '../engine/starChart.js';

function formatNumber(n) {
  if (n >= 1e12) return (n / 1e12).toFixed(1) + 'T';
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return n.toFixed(1);
}

export function ResourcePanel({ state, onUpdate }) {
  const [collapsed, setCollapsed] = useState({});
  const [autoCollapse, setAutoCollapse] = useState(true);

  const unlockedResources = Object.entries(state.resources)
    .filter(([, r]) => r.unlocked)
    .map(([id, r]) => ({
      id,
      ...r,
      def: resourceDefs[id],
      rate: getEffectiveRate(state, id),
    }));

  // Group by era
  const byEra = {};
  for (const r of unlockedResources) {
    const era = r.def?.era || 1;
    if (!byEra[era]) byEra[era] = [];
    byEra[era].push(r);
  }

  const eras = Object.keys(byEra).map(Number).sort((a, b) => a - b);

  return (
    <div className="panel resource-panel">
      <h2>Resources</h2>
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
                  if (state.prestigeMultiplier > 1) tooltipParts.push(`Prestige: x${state.prestigeMultiplier.toFixed(1)}`);
                  // Consumption info
                  if (r.id === 'food' && r.rate > 0) tooltipParts.push(`Consumed by: labor (0.3/labor/s)`);
                  if (r.id === 'energy') tooltipParts.push(`Consumed by: electronics (0.2/elec/s)`);
                  if (r.id === 'rocketFuel' && state.era >= 4) tooltipParts.push(`Consumed by: orbital infra (0.5/orbital/s)`);
                  const tooltip = tooltipParts.join('\n');
                  return (
                    <div key={r.id} className={`resource-row ${r.rate > 0 ? 'producing' : ''}`} title={tooltip}>
                      <span className="resource-name">
                        {r.def?.name || r.id}
                      </span>
                      <span className="resource-amount">
                        {formatNumber(r.amount)}
                      </span>
                      <span className="resource-rate">
                        {r.rate > 0 ? `+${formatNumber(r.rate)}/s` : ''}
                      </span>
                      <span className="resource-gather">
                        <button
                          className="gather-btn"
                          onClick={() => onUpdate(s => gather(s, r.id))}
                        >
                          +{r.rateMult > 1 ? formatNumber(r.rateMult) : '1'}
                        </button>
                      </span>
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
}
