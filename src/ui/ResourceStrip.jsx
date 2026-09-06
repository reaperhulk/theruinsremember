import { resources } from '../data/resources.js';
import { gather, isGatheringAutomated } from '../engine/resources.js';
import { formatNumber } from './format.js';

export function ResourceStrip({ state, objective, economy, onUpdate }) {
  return <section className="resource-strip" aria-label="Resources for the current objective">{objective.resources.slice(0, 4).map(id => {
    const resource = state.resources[id];
    return <div className="resource-row focus-resource" key={id}>
      <span className="resource-name">{resources[id].name}</span><strong>{formatNumber(resource.amount)}</strong>
      <span className={economy.net[id] < 0 ? 'rate-negative' : ''}>{economy.net[id] >= 0 ? '+' : ''}{formatNumber(economy.net[id])}/s</span>
      {!isGatheringAutomated(state) && <button className="gather-btn" aria-label={`Gather ${resources[id].name}`} disabled={resource.amount >= economy.capacity[id]} onClick={() => onUpdate(s => gather(s, id))}>+</button>}
    </div>;
  })}</section>;
}
