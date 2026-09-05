import { useState } from 'react';
import { getAvailableUpgrades } from '../engine/upgrades.js';
import { getAvailableTech } from '../engine/tech.js';
import { queueGoal, removeGoal, getGoalInfo, getGoalStatus, moveGoal } from '../engine/goals.js';
import { COMMISSION_TYPES, canQueueCommission, queueCommission, removeCommission } from '../engine/commissions.js';
import { expandStorage, getSupplyChains, setConsumerControl } from '../engine/economy.js';
import { resources as resourceDefs } from '../data/resources.js';
import { getEffectiveCap } from '../engine/resources.js';
import { formatTime, formatNumber } from './format.js';

export function GoalsPanel({ state, onUpdate }) {
  const [selection, setSelection] = useState('');
  const goal = getGoalInfo(state);
  const options = [...getAvailableTech(state).map(t => ({ value: `tech:${t.id}`, name: t.name })), ...getAvailableUpgrades(state).filter(u => !u.repeatable).map(u => ({ value: `upgrade:${u.id}`, name: u.name }))];
  return <details className="panel goals-panel">
    <summary>Next goal{goal ? `: ${goal.name}` : " · plan purchases and reserves"}</summary>
    <p>Queue up to five purchases. Automation saves for the first available goal and buys it when ready.</p>
    <label><input type="checkbox" checked={state.protectProgression !== false} onChange={e => onUpdate(s => ({ ...s, protectProgression: e.target.checked }))} /> Protect purchase savings from resource consumers</label>
    <label><input type="checkbox" checked={!!state.goalsPaused} onChange={e => onUpdate(s => ({ ...s, goalsPaused: e.target.checked }))} /> Pause queued purchases</label>
    {state.goalNotice && <p role="status">{state.goalNotice}</p>}
    <label>Purchase <select value={selection} onChange={e => setSelection(e.target.value)}><option value="">Choose a goal</option>{options.map(option => <option key={option.value} value={option.value}>{option.name}</option>)}</select></label>
    <button disabled={!selection || state.goals.length >= 5} onClick={() => { const [kind, id] = selection.split(':'); onUpdate(s => queueGoal(s, kind, id)); }}>Queue purchase</button>
    {state.goals.length > 0 && <ol>{state.goals.map((item, index) => <li key={`${item.kind}:${item.id}`}>{options.find(o => o.value === `${item.kind}:${item.id}`)?.name || item.id} · {getGoalStatus(state, item)} <button disabled={index === 0} onClick={() => onUpdate(s => moveGoal(s, index, -1))}>Earlier</button><button disabled={index === state.goals.length - 1} onClick={() => onUpdate(s => moveGoal(s, index, 1))}>Later</button><button onClick={() => onUpdate(s => removeGoal(s, index))}>Cancel</button></li>)}</ol>}
    {goal && <div role="status"><strong>{goal.name}</strong><p>{!goal.available ? 'Waiting for prerequisites or this era. Other automation can continue.' : Number.isFinite(goal.seconds) ? `Estimated ${formatTime(Math.ceil(goal.seconds))} at current net production.` : 'This goal needs a change to storage or production.'}</p>
      {goal.blockers.map(blocker => <p key={blocker.id}>{resourceDefs[blocker.id]?.name}: {blocker.reason === 'capacity' ? 'Required cost exceeds storage.' : blocker.reason === 'locked' ? 'Resource not unlocked yet.' : 'No net income at present.'}
        {blocker.reason === 'capacity' && <button disabled={state.resources[blocker.id].amount < getEffectiveCap(state, blocker.id) * 0.6} onClick={() => onUpdate(s => expandStorage(s, blocker.id))}>Expand storage · {formatNumber(getEffectiveCap(state, blocker.id) * 0.6)} {resourceDefs[blocker.id]?.name}</button>}
        {blocker.reason === 'production' && getSupplyChains(state).filter(c => c.input === blocker.id && state.resources[c.output]?.unlocked).map(c => <button key={c.output} onClick={() => onUpdate(s => setConsumerControl(s, c.output, { paused: !state.consumerControls?.[c.output]?.paused }))}>{state.consumerControls?.[c.output]?.paused ? 'Resume' : 'Pause'} {resourceDefs[c.output]?.name}</button>)}
      </p>)}
    </div>}
    {state.era >= 7 && <details><summary>Commission queue · {state.commissions.length}/6</summary><p>Choose operations now; their normal costs and cooldowns still apply.</p>{Object.entries(COMMISSION_TYPES).filter(([, type]) => state.era >= type.era).map(([kind, type]) => <div key={kind}>{Object.entries(type.definitions).map(([id, def]) => <button key={id} disabled={!canQueueCommission(state, kind, id)} onClick={() => onUpdate(s => queueCommission(s, kind, id))}>Queue {def.name || def.label || id}</button>)}</div>)}<ol>{state.commissions.map((c, i) => <li key={`${c.kind}:${c.id}:${i}`}>{c.id} <button onClick={() => onUpdate(s => removeCommission(s, i))}>Cancel</button></li>)}</ol></details>}
  </details>;
}
