import { availableProductionRoutes, selectProductionRoute, PRODUCTION_ROUTES } from '../engine/legacy.js';
import { getWorldStatus } from '../engine/world.js';
import { resources } from '../data/resources.js';
export function WorldStatus({ state, economy, onNavigate, onUpdate }) {
  const world = getWorldStatus(state, economy);
  return <section className="panel world-status" aria-label="World status">
    <h2>{world.landmarks[state.era - 1].chapter.title}</h2>
    <label>Construction · {Math.round(world.construction * 100)}%<progress aria-label="World construction" value={world.construction} max="1" /></label>
    <p>{world.readiness.mastery.required && world.readiness.mastery.met ? 'This age’s operation or economic route is established.' : world.landmarks[state.era - 1].chapter.operation}</p>
    {world.blocked.length > 0 && <p className="world-constraint">{world.blocked.map(([id, reason]) => `${resources[id]?.name}: ${reason === 'paused' ? 'paused' : 'waiting for supplies'}`).join(' · ')}</p>}
    {availableProductionRoutes(state).length > 1 && <label>Supply route <select aria-label="Supply route" value={state.productionRoute} onChange={e => onUpdate(s => selectProductionRoute(s, e.target.value))}>{availableProductionRoutes(state).map(id => <option value={id} key={id}>{PRODUCTION_ROUTES[id].name}</option>)}</select><p>{PRODUCTION_ROUTES[state.productionRoute].description} You can switch back at any time.</p></label>}
    <button onClick={() => onNavigate('mini')}>Manage this age’s operation</button>
    <details><summary>Landmarks and inherited choices</summary><ol>{world.landmarks.map(l => <li key={l.era}><strong>{l.era}. {l.choice?.landmark || l.chapter.title}</strong><span>{l.status}</span>{l.choice && <p>{l.choice.consequence}</p>}</li>)}</ol></details>
  </section>;
}
