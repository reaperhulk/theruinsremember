import { unlockTech } from '../engine/tech.js';
import { purchaseUpgrade } from '../engine/upgrades.js';
import { playUpgrade } from './AudioManager.js';
import { getPurchaseTarget, prioritizePurchase } from '../engine/guidance.js';
import { calculateEconomy, getCostPressure, expandStorage, getSupplyChains, setConsumerControl } from '../engine/economy.js';
import { resources } from '../data/resources.js';
import { formatNumber, formatTime } from './format.js';

export function PurchaseGuidance({ state, onUpdate }) {
  const target = getPurchaseTarget(state);
  if (!target) return null;
  const economy = calculateEconomy(state);
  const pressure = getCostPressure(state, target.cost, economy);
  return <section className="panel purchase-guidance" aria-label="Purchase guidance">
    <strong>{target.queued ? 'Queued goal' : 'Next purchase'}: {target.name}</strong>
    <p>{pressure.length === 0 ? 'Affordable now.' : Number.isFinite(pressure[0].eta) ? `About ${formatTime(Math.ceil(pressure[0].eta))} at current net income.` : 'Waiting alone will not fund this purchase at current production and storage.'}</p>
    {pressure.slice(0, 2).map(p => <div key={p.id} className="purchase-blocker">
      <span>{resources[p.id].name}: {p.reason === 'capacity' ? 'needs more storage' : p.reason === 'locked' ? 'not unlocked yet' : p.reason === 'production' ? 'no net income' : `${formatNumber(p.missing)} needed · ${formatTime(Math.ceil(p.eta))}`}</span>
      {p.reason === 'capacity' && <button disabled={state.resources[p.id].amount < economy.capacity[p.id] * 0.6} onClick={() => onUpdate(s => expandStorage(s, p.id))}>Expand storage · {formatNumber(economy.capacity[p.id] * 0.6)} {resources[p.id].name}</button>}
      {p.reason === 'production' && getSupplyChains(state).filter(c => c.input === p.id && state.resources[c.output]?.unlocked).map(c => <button key={c.output} onClick={() => onUpdate(s => setConsumerControl(s, c.output, { paused: !s.consumerControls?.[c.output]?.paused }))}>{state.consumerControls?.[c.output]?.paused ? 'Resume' : 'Pause'} {resources[c.output].name}</button>)}
    </div>)}
    {pressure.length === 0 && <button className="primary-purchase" onClick={() => { onUpdate(s => target.kind === 'tech' ? unlockTech(s, target.id) : purchaseUpgrade(s, target.id)); playUpgrade(); }}>{target.kind === 'tech' ? 'Research' : 'Build'} {target.name}</button>}
    {(!target.queued || state.goalsPaused || state.protectProgression === false) && <button disabled={!target.queued && state.goals.length >= 5} onClick={() => onUpdate(s => prioritizePurchase(s, target))}>Protect and queue this purchase</button>}
    {target.queued && !state.goalsPaused && <small>Automation saves for this purchase; input protection releases as savings permit. Forecast excludes future purchases and event rewards.</small>}
  </section>;
}
