import { markDiscoveryRead } from '../engine/memory.js';
export function Discoveries({ state, onUpdate, all = false }) {
  const entries = Object.entries(state.archive?.discoveries || {}).filter(([, d]) => all || !d.read && d.cycle === state.prestigeCount + 1 && d.era === state.era);
  if (!entries.length) return null;
  return <section className="discoveries" aria-label="Discoveries">
    {entries.slice(all ? -60 : -1).reverse().map(([id, d]) => <article key={id}><span className="panel-kicker">Civilization {d.cycle} · Era {d.era} · {d.read ? 'Remembered' : 'New discovery'}</span><h3>{d.title}</h3><p>{d.text}</p>{!d.read && <button onClick={() => onUpdate(s => markDiscoveryRead(s, id))}>Remember this</button>}</article>)}
  </section>;
}
