import { getPublicWorks } from '../engine/publicWorks.js';
import { calculateEconomy } from '../engine/economy.js';
import { resources } from '../data/resources.js';
import { formatNumber, formatTime } from './format.js';

export function PublicWorksPanel({ state, onUpdate }) {
  const work = getPublicWorks(state);
  if (!work) return null;
  const income = calculateEconomy(state).construction;
  return <section className="panel public-works-panel" aria-label="Economic route">
    <strong>{work.name} · {Math.floor(work.progress * 100)}%</strong>
    <progress value={work.delivered} max={work.cost} aria-label={`${work.name} supplied`} />
    <p>{work.complete ? 'Economic mastery complete. Earlier resources produce ×5 this era; construction supplies part of the era foundation.' : `${formatNumber(work.delivered)} / ${formatNumber(work.cost)} ${resources[work.resource].name}. Supplies 20% of new production; stronger industry finishes sooner.${income > 0 ? ` About ${formatTime(Math.ceil((work.cost - work.delivered) / income))} remaining.` : ''}`}</p>
    {!work.complete && <label><input type="checkbox" checked={work.enabled} onChange={e => onUpdate(s => ({ ...s, autoPublicWorks: e.target.checked }))} /> Supply the economic route automatically</label>}
  </section>;
}
