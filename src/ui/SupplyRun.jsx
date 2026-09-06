import { useEffect, useRef, useState } from 'react';
import { projects } from '../data/projects.js';
import { resources } from '../data/resources.js';
import { createSupplyRun, getSupplyRunTarget, startSupplyRun, extendSupplyPath, submitSupplyRoute, SUPPLY_GRID_SIZE, SUPPLY_STEP_BUDGET, SUPPLY_RUN_NAMES } from '../engine/supplyRun.js';
import { formatNumber, formatTime } from './format.js';

export function SupplyRun({ state, onUpdate }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(null);
  const dialog = useRef(null), board = useRef(null), gesture = useRef(null);
  const run = state.supplyRun || createSupplyRun();
  const target = getSupplyRunTarget(state);
  const cooldown = Math.max(0, run.cooldownUntil - state.totalTime);
  const path = draft || run.path;
  const goal = SUPPLY_GRID_SIZE ** 2 - 1;
  const found = run.caches.filter(index => path.includes(index)).length;

  useEffect(() => {
    const element = dialog.current;
    if (open && element && !element.open) element.showModal();
    if (!open && element?.open) element.close();
  }, [open]);

  const close = () => { gesture.current = null; setDraft(null); setOpen(false); };
  const start = () => {
    if (run.phase !== 'active') onUpdate(s => startSupplyRun(s, target));
    setOpen(true);
  };
  const indexAt = event => {
    const rect = board.current.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left) / rect.width * SUPPLY_GRID_SIZE);
    const y = Math.floor((event.clientY - rect.top) / rect.height * SUPPLY_GRID_SIZE);
    return x < 0 || x >= SUPPLY_GRID_SIZE || y < 0 || y >= SUPPLY_GRID_SIZE ? -1 : y * SUPPLY_GRID_SIZE + x;
  };
  const moveGesture = event => {
    if (!gesture.current || run.phase !== 'active') return;
    const index = indexAt(event);
    const next = extendSupplyPath(run, gesture.current, index);
    if (next !== gesture.current) { gesture.current = next; setDraft(next); }
  };
  const finishGesture = () => {
    const route = gesture.current;
    gesture.current = null;
    setDraft(null);
    if (route) onUpdate(s => submitSupplyRoute(s, route));
  };
  const moveKey = (event, index) => {
    const offsets = { ArrowUp: -SUPPLY_GRID_SIZE, ArrowDown: SUPPLY_GRID_SIZE, ArrowLeft: -1, ArrowRight: 1 };
    if (!(event.key in offsets)) return;
    event.preventDefault();
    const next = index + offsets[event.key];
    if (next < 0 || next > goal || Math.abs(next % SUPPLY_GRID_SIZE - index % SUPPLY_GRID_SIZE) > 1) return;
    board.current.querySelector(`[data-cell="${next}"]`)?.focus();
  };

  if (!target && run.phase === 'idle') return null;
  return <section className="panel supply-teaser" aria-label="Recover construction supplies">
    <div><span className="panel-kicker">Something to do while the builders work</span><h2>Find a better route through the ruins</h2><p>Connect the supply line. Take detours for extra cargo. A successful route funds 20–40% of your project’s missing supplies.</p></div>
    <button className="supply-open" disabled={run.phase !== 'active' && (!target || cooldown > 0)} onClick={start}>{run.phase === 'active' ? `Resume route for ${projects[run.projectId]?.name}` : cooldown > 0 ? `Crew preparing · ${formatTime(Math.ceil(cooldown))}` : target ? `Recover cargo for ${projects[target].name}` : 'All available projects are funded'}</button>
    <dialog ref={dialog} className="supply-dialog" onCancel={event => { event.preventDefault(); close(); }} onClose={() => setOpen(false)} aria-labelledby="supply-run-title">
      <header className="supply-dialog-heading"><div><span className="panel-kicker">{SUPPLY_RUN_NAMES[(run.era || state.era) - 1]}</span><h2 id="supply-run-title">A route worth taking</h2></div><button className="supply-close" onClick={close}>{run.phase === 'complete' ? 'Return to settlement' : 'Pause and return'}</button></header>
      {run.board && <div className="supply-body">
        <div className="supply-playfield">
          <div className="supply-board" ref={board} role="group" aria-label="Draw a supply route from camp to the exit" onPointerDown={event => {
            if (run.phase !== 'active' || event.button !== 0) return;
            const index = indexAt(event);
            if (index !== 0 && index !== run.path.at(-1)) return;
            gesture.current = index === 0 ? [0] : [...run.path];
            setDraft(gesture.current);
            event.currentTarget.setPointerCapture(event.pointerId);
          }} onPointerMove={moveGesture} onPointerUp={finishGesture} onPointerCancel={finishGesture}>
            {run.board.map((blocked, index) => <button key={index} type="button" data-cell={index} data-blocked={blocked} data-cache={run.caches.includes(index)} className={`supply-cell${blocked ? ' rubble' : ''}${path.includes(index) ? ' connected' : ''}${run.caches.includes(index) ? ' cache' : ''}`} aria-label={`Row ${Math.floor(index / SUPPLY_GRID_SIZE) + 1}, column ${index % SUPPLY_GRID_SIZE + 1}: ${index === 0 ? 'camp' : index === goal ? 'exit' : blocked ? 'blocked' : run.caches.includes(index) ? 'bonus cargo' : 'open ground'}`} aria-disabled={blocked || run.phase !== 'active'} onKeyDown={event => moveKey(event, index)} onClick={() => {
              if (run.phase === 'active') onUpdate(s => submitSupplyRoute(s, extendSupplyPath(s.supplyRun, s.supplyRun.path, index)));
            }}>
              {index === 0 ? <span>Camp</span> : index === goal ? <span>Exit</span> : blocked ? <svg viewBox="0 0 40 40" aria-hidden="true"><path d="M5 30L10 15L21 8L32 16L35 30Z" /></svg> : run.caches.includes(index) ? <svg viewBox="0 0 40 40" aria-hidden="true"><path d="M10 12H30V30H10Z M8 12L20 5L32 12 M20 12V30" /></svg> : null}
            </button>)}
            <svg className="supply-route" viewBox="0 0 500 500" aria-hidden="true"><polyline points={path.map(index => `${(index % SUPPLY_GRID_SIZE) * 100 + 50},${Math.floor(index / SUPPLY_GRID_SIZE) * 100 + 50}`).join(' ')} /></svg>
          </div>
          <div className="supply-meters"><strong>{SUPPLY_STEP_BUDGET - path.length + 1} steps left</strong><span>{found}/2 bonus caches</span><span>{20 + found * 10}% cargo</span></div>
        </div>
        <div className="supply-instructions">
          {run.phase === 'complete' ? <div className="supply-result" role="status"><h3>{run.result.caches === 2 ? 'Every cache recovered' : 'Supply line restored'}</h3><p>Cargo recovered for <strong>{projects[run.projectId]?.name}</strong>. Any surplus stays in storage for future construction.</p><ul>{Object.entries(run.result.rewards).map(([id, amount]) => <li key={id}>+{formatNumber(amount)} {resources[id].name}</li>)}</ul><p>The builders keep working. The crew will be ready for another run in {formatTime(Math.ceil(cooldown))}.</p></div> : <>
            <h3>Help build {projects[run.projectId]?.name}</h3>
            <p>Drag from Camp to Exit through neighboring squares. Avoid rubble. You have {SUPPLY_STEP_BUDGET} steps.</p><p>Reaching the exit earns 20% of the missing supplies. Each gold cache adds another 10%. Plan a detour that still reaches the exit.</p>
            <p className="supply-controls">You can also click adjacent squares. Use arrow keys to focus a square and Enter to extend the route. Backtrack one square to undo.</p>
            <button className="supply-reset" onClick={() => { gesture.current = null; setDraft(null); onUpdate(s => submitSupplyRoute(s, [0])); }}>Redraw route</button>
            <small>No timer or failure penalty. Your settlement continues while this is paused.</small>
          </>}
        </div>
      </div>}
    </dialog>
  </section>;
}
