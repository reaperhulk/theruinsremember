import { useCallback, useEffect, useRef, useState } from 'react';
import { advanceOffline, createState, tick } from '../game/engine.js';
import { BACKUP_KEY, SAVE_KEY, importSave, loadSave, writeSave } from '../game/save.js';

// Gaps longer than this (a sleeping laptop, a frozen tab) count as time away.
const AWAY_AFTER = 300;
const SAVE_EVERY = 10000;

// Only one tab may own the save, so two tabs can never overwrite each other.
function useSaveOwnership() {
  const [owned, setOwned] = useState(false);
  const [warning, setWarning] = useState(null);
  useEffect(() => {
    if (!navigator.locks) { setOwned(true); return undefined; }
    let alive = true;
    let release;
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
      if (alive) setWarning('The ruins are open in another tab. Close it and reload here to continue.');
    }, 2000);
    navigator.locks.request(`${SAVE_KEY}:writer`, { signal: controller.signal }, async () => {
      clearTimeout(timeout);
      if (!alive) return;
      setOwned(true);
      await new Promise(resolve => { release = resolve; });
    }).catch(error => {
      clearTimeout(timeout);
      if (alive && error.name !== 'AbortError') setWarning('Save ownership could not be established. Reload to try again.');
    });
    return () => { alive = false; clearTimeout(timeout); controller.abort(); release?.(); };
  }, []);
  return { owned, warning };
}

export function useGame() {
  const ownership = useSaveOwnership();
  const [loaded] = useState(() => {
    const result = loadSave(localStorage);
    return { ...result, loadedAt: Date.now() };
  });
  const [state, setState] = useState(() => loaded.state || createState());
  const [loadWarning] = useState(loaded.warning || null);
  const [warning, setWarning] = useState(null);
  const [away, setAway] = useState(null);
  const [welcome, setWelcome] = useState(loaded.legacy ? loaded.state.bonusMemories : null);
  const stateRef = useRef(state);
  const ownsRef = useRef(false);
  const blocked = useRef(!!loaded.blocked);
  const speed = useRef(1);
  const caughtUp = useRef(false);

  const commit = useCallback(next => { stateRef.current = next; setState(next); }, []);
  const save = useCallback(() => {
    if (!ownsRef.current || blocked.current) return;
    setWarning(writeSave(localStorage, stateRef.current));
  }, []);
  const update = useCallback(fn => {
    if (!ownsRef.current || blocked.current) return;
    const previous = stateRef.current;
    const next = fn(previous);
    if (next && next !== previous) commit(next);
  }, [commit]);

  useEffect(() => { ownsRef.current = ownership.owned; }, [ownership.owned]);

  useEffect(() => {
    if (!ownership.owned) return undefined;
    const catchUp = (seconds, report) => {
      if (seconds <= 0 || blocked.current) return;
      const before = stateRef.current;
      const result = advanceOffline(before, seconds);
      commit(result.state);
      if (report && result.earned > 0) setAway({ seconds, earned: result.earned, eraBefore: before.era, eraAfter: result.state.era });
    };
    if (loaded.state && !caughtUp.current) catchUp(Math.max(0, (loaded.loadedAt - loaded.state.lastSaved) / 1000), true);
    caughtUp.current = true;

    let last = performance.now();
    let raf;
    const advance = () => {
      const now = performance.now();
      const elapsed = (now - last) / 1000;
      if (elapsed < 0.05) return;
      last = now;
      if (blocked.current) return;
      if (elapsed > AWAY_AFTER) catchUp(elapsed, true);
      else commit(tick(stateRef.current, elapsed * speed.current));
    };
    const frame = () => { advance(); raf = requestAnimationFrame(frame); };
    raf = requestAnimationFrame(frame);
    // Background tabs get no animation frames; keep the ruins working anyway.
    const backgroundTimer = setInterval(() => { if (document.hidden) advance(); }, 1000);
    const saveTimer = setInterval(save, SAVE_EVERY);
    const onHide = () => { if (document.hidden) save(); };
    const onForeignSave = event => {
      if (event.storageArea !== localStorage || event.key !== SAVE_KEY) return;
      blocked.current = true;
      setWarning('Another tab changed this save. Reload to continue; this tab has stopped saving.');
    };
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', save);
    window.addEventListener('storage', onForeignSave);
    window.__game = {
      getState: () => stateRef.current,
      setState: fn => update(fn),
      fastForward: seconds => update(s => tick(s, seconds)),
      setSpeed: value => { speed.current = Number.isFinite(value) ? Math.max(0, value) : 1; },
      getSpeed: () => speed.current,
    };
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(backgroundTimer);
      clearInterval(saveTimer);
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', save);
      window.removeEventListener('storage', onForeignSave);
      delete window.__game;
      save();
    };
  }, [ownership.owned, loaded, commit, save, update]);

  const importText = useCallback(text => {
    const next = importSave(text);
    blocked.current = false;
    commit({ ...next, lastSaved: Date.now() });
    save();
  }, [commit, save]);

  const reset = useCallback(() => {
    try { localStorage.removeItem(SAVE_KEY); localStorage.removeItem(BACKUP_KEY); } catch { /* reported on the next save */ }
    blocked.current = false;
    commit(createState());
    save();
  }, [commit, save]);

  return {
    state,
    update,
    save,
    importText,
    reset,
    away,
    dismissAway: () => setAway(null),
    welcome,
    dismissWelcome: () => setWelcome(null),
    warning: ownership.warning || warning || loadWarning,
    ready: ownership.owned,
  };
}
