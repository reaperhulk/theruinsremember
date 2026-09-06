import { memo } from 'react';
import {
  EXPEDITION_MAX_SUPPLIES,
  getExpeditionSupplyInterval,
  getExpeditionSuccessChance,
  getExpeditionRoutes,
  selectExpeditionRoute,
} from '../engine/expeditions.js';
import { resources as resourceDefs } from '../data/resources.js';
import { formatNumber, formatTime } from './format.js';

function formatRewards(rewards) {
  return Object.entries(rewards)
    .map(([id, amount]) => `+${formatNumber(amount)} ${resourceDefs[id]?.name || id}`)
    .join(' / ');
}

export const ExpeditionPanel = memo(function ExpeditionPanel({ state, onUpdate }) {
  const lastResult = state.expedition.log[0];
  const expedition = state.expedition;
  const routes = getExpeditionRoutes(state.era);
  const supplyInterval = getExpeditionSupplyInterval(state);
  const secondsRemaining = Math.max(0, supplyInterval - expedition.supplyProgress);
  const progress = expedition.supplies >= EXPEDITION_MAX_SUPPLIES
    ? 100
    : (expedition.supplyProgress / supplyInterval) * 100;

  const handleRoute = routeId => onUpdate(s => selectExpeditionRoute(s, routeId));

  return (
    <section className="panel expedition-panel" aria-labelledby="expedition-title">
      <div className="expedition-heading">
        <div>
          <span className="panel-kicker">Field operation</span>
          <h2 id="expedition-title">Expedition: {state.era === 1 ? 'The Crash Basin' : state.era === 2 ? 'The Buried Works' : 'The Ghost Network'}</h2>
        </div>
        <div className="expedition-supply" aria-label={`${expedition.supplies} expedition supplies available`}>
          <strong>{expedition.supplies}/{EXPEDITION_MAX_SUPPLIES}</strong>
          <span>supplies</span>
        </div>
      </div>

      <p className="expedition-brief">
        {state.era === 1
          ? 'Choose how far the survivors push beyond the settlement. Safer routes build steadily; deeper routes can replace several routine upgrades.'
          : state.era === 2
          ? 'Industry has exposed an older machine layer. Decide whether to map it, exploit it, or force it open.'
          : 'The network is answering. Every recovered signal makes the next age easier to stabilize.'}
      </p>

      <div className="expedition-meter">
        <div className="expedition-meter-fill" style={{ width: `${progress}%` }} />
      </div>
      <div className="expedition-meta">
        <span>{expedition.eraFinds} discoveries this era</span>
        <span>{expedition.supplies >= EXPEDITION_MAX_SUPPLIES ? 'Supply team ready' : `Next supply in ${formatTime(secondsRemaining)}`}</span>
      </div>

      <p className="operation-commitment">Choose a standing route. The team uses each new supply automatically, including while you are away. Safer routes guarantee discoveries; deep routes risk a wasted supply for larger finds. A new era needs a new assignment.</p>
      {expedition.routeId && <button className="expedition-pause" onClick={() => handleRoute(null)}>Pause expeditions</button>}
      <div className="expedition-routes">
        {routes.map(route => (
          <button
            key={route.id}
            className={`expedition-route risk-${route.risk.toLowerCase()}`}
            aria-pressed={expedition.routeId === route.id}
            disabled={expedition.routeId === route.id}
            onClick={() => handleRoute(route.id)}
          >
            <span className="expedition-route-topline">
              <strong>{expedition.routeId === route.id ? 'Assigned: ' : 'Assign team: '}{route.name}</strong>
              <span>{Math.round(getExpeditionSuccessChance(state, route) * 100)}% success</span>
            </span>
            <span className="expedition-route-desc">{route.description}</span>
            <span className="expedition-route-reward">{route.discovery} discovery {formatRewards(route.rewards)}</span>
          </button>
        ))}
      </div>

      {lastResult && (
        <div className={`expedition-result ${lastResult.success ? 'success' : 'failure'}`} role="status">
          <strong>{lastResult.success ? 'Recovered' : 'Route lost'}</strong>
          <span>
            {lastResult.success
              ? `${lastResult.discovery} discovery${lastResult.discovery === 1 ? '' : 'ies'}${Object.keys(lastResult.rewards).length ? ` / ${formatRewards(lastResult.rewards)}` : ''}${lastResult.gems ? ` / +${lastResult.gems} gem${lastResult.gems === 1 ? '' : 's'}` : ''}`
              : Object.keys(lastResult.rewards).length ? `Partial salvage: ${formatRewards(lastResult.rewards)}` : 'The team returned empty-handed.'}
          </span>
        </div>
      )}

      {expedition.log.length > 0 && (
        <div className="expedition-history" aria-label="Recent expedition outcomes">
          {expedition.log.slice(0, 3).map((entry, index) => (
            <span key={`${entry.routeId}-${index}`} className={entry.success ? 'success' : 'failure'}>
              {entry.success ? 'Recovered' : 'Missed'}: {entry.name}
            </span>
          ))}
        </div>
      )}
    </section>
  );
});
