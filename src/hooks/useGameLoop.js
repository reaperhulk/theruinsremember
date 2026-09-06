import { advanceBudgeted, advanceSlice } from '../engine/advanceBudgeted.js';
import { useSaveOwnership } from './useSaveOwnership.js';
import { useRef, useState, useCallback, useEffect } from 'react';
import { advanceTime } from '../engine/advanceTime.js';
import { loadSave, writeSave, parseSave, SAVE_KEY, RECOVERY_KEYS, offlineAllowance } from '../engine/saves.js';

export function useGameLoop(initialState) {
  const ownership = useSaveOwnership();
  const ownsRef = useRef(false);
  useEffect(() => { ownsRef.current = ownership.owned; }, [ownership.owned]);
  const [loaded] = useState(() => ({ ...loadSave(localStorage), loadedAt: Date.now() }));
  const [state, setState] = useState(loaded.state || initialState);
  const [saveWarning, setSaveWarning] = useState(loaded.warning);
  const [offlineReport, setOfflineReport] = useState(null);
  const stateRef = useRef(state);
  const blocked = useRef(!!loaded.blocked);
  const busy = useRef(false);
  const speedRef = useRef(1);
  const pending = useRef(0);
  const needsMigration = useRef(!!loaded.needsMigration);
  const initialElapsed = useRef(loaded.state ? Math.max(0, (loaded.loadedAt - loaded.state.lastSaved) / 1000) : 0);

  const commit = useCallback(next => {
    stateRef.current = next;
    setState(next);
  }, []);
  const save = useCallback(() => {
    if (!ownsRef.current || blocked.current || busy.current) return;
    const warning = writeSave(localStorage, stateRef.current, Date.now(), needsMigration.current ? 'migration' : null);
    if (!warning) needsMigration.current = false;
    setSaveWarning(warning);
  }, []);
  const updateState = useCallback(fn => {
    if (!ownsRef.current || blocked.current || busy.current) return;
    const previous = stateRef.current;
    const next = fn(previous) || previous;
    if (next !== previous) { commit(next); save(); }
  }, [commit, save]);

  useEffect(() => {
    if (!ownership.owned) return;
    let cancelled = false;
    let raf;
    let lastFrame = performance.now();
    let lastRender = lastFrame;
    let hiddenAt = document.hidden ? Date.now() : null;
    const catchUp = async elapsed => {
      if (busy.current || elapsed <= 0 || blocked.current) return;
      busy.current = true;
      const before = stateRef.current;
      const seconds = Math.min(elapsed, offlineAllowance(before));
      let current = before;
      setOfflineReport({ processing: true, elapsed: seconds });
      try {
      const result = await advanceBudgeted(current, seconds, {
        options: { pauseForgetting: true }, cancelled: () => cancelled || blocked.current,
        onProgress: done => setOfflineReport({ processing: true, elapsed: seconds, processed: done }),
      });
      if (result.cancelled) { if (!cancelled) setOfflineReport(null); return; }
      current = result.state;
      commit(current);
      initialElapsed.current = 0;
        busy.current = false;
      save();
      setOfflineReport({ elapsed: seconds, gains: Object.fromEntries(Object.entries(current.resources).filter(([, r]) => r.unlocked).map(([id, r]) => [id, r.amount - (before.resources[id]?.amount || 0)])), era: current.era, prevEra: before.era, eraChanged: current.era > before.era, upgradesGained: Object.keys(current.upgrades).length - Object.keys(before.upgrades).length, achievementsGained: Object.keys(current.achievements).length - Object.keys(before.achievements).length, siegePaused: current.era >= 10 });
      lastFrame = performance.now();
      } catch {
        blocked.current = true;
        setOfflineReport(null);
        setSaveWarning('Offline progress could not be recovered. Your original save is preserved. Restore a backup or import a save to continue.');
      } finally {
        busy.current = false;
      }
    };
    const startupGap = initialElapsed.current;
    if (startupGap > 10) catchUp(startupGap);
    const frame = now => {
      const elapsed = Math.max(0, (now - lastFrame) / 1000);
      lastFrame = now;
      if (!document.hidden && !busy.current && !blocked.current) {
        if (elapsed > 5) catchUp(elapsed);
        else pending.current += elapsed * speedRef.current;
        // Fixed one-second simulation frames make foreground, hidden-tab,
        // fast-forward and saved-game catch-up agree on event/purchase timing.
        if (pending.current >= 1 && now - lastRender >= 100) {
          const seconds = Math.min(60, Math.floor(pending.current));
          const result = advanceSlice(stateRef.current, seconds);
          pending.current -= result.done;
          commit(result.state);
          lastRender = now;
        }
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    const visibility = () => {
      if (document.hidden) { hiddenAt = Date.now(); save(); }
      else {
        const gap = hiddenAt == null ? 0 : Math.max(0, (Date.now() - hiddenAt) / 1000);
        hiddenAt = null;
        lastFrame = performance.now();
        catchUp(gap);
      }
    };
    const foreignSave = event => {
      if (event.storageArea !== localStorage || (event.key !== SAVE_KEY && event.key !== null)) return;
      blocked.current = true;
      setSaveWarning('A different tab changed this civilization. Reload to use its latest save; this tab has stopped saving.');
    };
    window.addEventListener('storage', foreignSave);
    const timer = setInterval(save, 15000);
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('pagehide', save);
    window.addEventListener('beforeunload', save);
    window.__game = {
      getState: () => stateRef.current,
      setState: updateState,
      fastForward: seconds => updateState(s => advanceTime(s, seconds)),
      setSpeed: value => { speedRef.current = Number.isFinite(value) ? Math.max(0, value) : 1; },
      getSpeed: () => speedRef.current,
      giveAll: (amount = 1000) => updateState(s => ({ ...s, resources: Object.fromEntries(Object.entries(s.resources).map(([id, r]) => [id, r.unlocked ? { ...r, amount } : r])) })),
    };
    return () => {
      cancelled = true;
      const wasBusy = busy.current;
      busy.current = false;
      cancelAnimationFrame(raf);
      clearInterval(timer);
      document.removeEventListener('visibilitychange', visibility);
      window.removeEventListener('storage', foreignSave);
      window.removeEventListener('pagehide', save);
      window.removeEventListener('beforeunload', save);
      delete window.__game;
      if (!wasBusy) save();
    };
  }, [commit, save, updateState, ownership.owned]);

  const importSave = useCallback(text => {
    if (!ownsRef.current || busy.current) return false;
    const next = parseSave(text);
    try {
      const previous = localStorage.getItem(SAVE_KEY);
      if (previous) localStorage.setItem(`${SAVE_KEY}-replaced`, previous);
    } catch { setSaveWarning('Could not preserve the existing save. Export it before importing.'); return false; }
    blocked.current = false;
    pending.current = 0;
    commit({ ...next, lastSaved: Date.now() });
    save();
    return true;
  }, [commit, save]);
  const restoreBackup = useCallback(() => {
    for (const key of RECOVERY_KEYS) {
      try { const text = localStorage.getItem(key); if (text && importSave(text)) return; } catch { /* try the next backup */ }
    }
    setSaveWarning('No valid backup is available. Import a previously exported save.');
  }, [importSave]);
  const resetSave = useCallback(() => {
    if (!ownsRef.current || busy.current) return;
    try { for (const key of [SAVE_KEY, ...RECOVERY_KEYS, `${SAVE_KEY}-replaced`]) localStorage.removeItem(key); } catch { /* writeSave reports storage failure */ }
    blocked.current = false;
    pending.current = 0;
    commit({ ...initialState, lastSaved: Date.now() });
    save();
  }, [initialState, commit, save]);
  const dismissOfflineReport = useCallback(() => setOfflineReport(null), []);
  return { state, updateState, resetSave, offlineReport, dismissOfflineReport, saveWarning: ownership.warning || saveWarning, isSaveOwner: ownership.owned, restoreBackup, importSave };
}
