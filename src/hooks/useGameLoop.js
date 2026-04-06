import { useRef, useState, useCallback, useEffect } from 'react';
import { tick } from '../engine/tick.js';
import { migrateState } from '../engine/state.js';

const SAVE_KEY = 'incremental-game-save';
const SAVE_INTERVAL = 15000; // 15 seconds — more frequent saves

export function useGameLoop(initialState) {
  const [offlineReport, setOfflineReport] = useState(null);

  const [state, setState] = useState(() => {
    // Try to load saved state
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Calculate offline progress
        const now = Date.now();
        const elapsed = (now - parsed.lastSaved) / 1000;
        const migrated = migrateState(parsed);
        if (elapsed > 10) {
          // Cap offline time: 4h for first run, 24h for prestiged, 7d with infinitePatience
          const maxOffline = (parsed.prestigeUpgrades?.infinitePatience) ? 604800 :
                             (parsed.prestigeCount > 0) ? 86400 : 14400; // 7 days, 24 hours, or 4 hours
          const offlineDt = Math.min(elapsed, maxOffline);
          const before = migrated;

          // Process offline in chunks for proper event/achievement checking
          const chunkSize = 60;
          const maxChunks = (parsed.prestigeUpgrades?.infinitePatience) ? 10080 :
                            (parsed.prestigeCount > 0) ? 1440 : 240; // 7 days, 24 hours, or 4 hours of chunks
          const chunks = Math.min(Math.floor(offlineDt / chunkSize), maxChunks);
          let tickState = migrated;
          for (let i = 0; i < chunks; i++) {
            tickState = tick(tickState, chunkSize);
          }
          const remainder = offlineDt - chunks * chunkSize;
          if (remainder > 0) tickState = tick(tickState, remainder);
          const after = tickState;

          // Calculate resource gains for offline report
          const gains = {};
          for (const [id, r] of Object.entries(after.resources)) {
            if (r.unlocked) {
              const gained = r.amount - (before.resources[id]?.amount || 0);
              if (gained > 0) gains[id] = gained;
            }
          }
          // Track upgrades and achievements earned offline
          const upgradesGained = Object.keys(after.upgrades || {}).length - Object.keys(before.upgrades || {}).length;
          const achievementsGained = Object.keys(after.achievements || {}).length - Object.keys(before.achievements || {}).length;
          // Store offline report (will be shown by UI)
          // For large offline periods, show processing indicator briefly
          const eraChanged = after.era > before.era;
          if (chunks > 100) {
            setOfflineReport({ elapsed: offlineDt, processing: true, gains: {}, era: after.era, prevEra: before.era, eraChanged, upgradesGained: 0, achievementsGained: 0 });
            setTimeout(() => setOfflineReport({ elapsed: offlineDt, gains, era: after.era, prevEra: before.era, eraChanged, upgradesGained, achievementsGained }), 300);
          } else {
            setTimeout(() => setOfflineReport({ elapsed: offlineDt, gains, era: after.era, prevEra: before.era, eraChanged, upgradesGained, achievementsGained }), 100);
          }
          return after;
        }
        return migrated;
      } catch {
        // Corrupted save, start fresh
      }
    }
    return initialState;
  });

  const stateRef = useRef(state);
  stateRef.current = state;

  // Expose debug helpers on window for play-testing
  useEffect(() => {
    window.__game = {
      getState: () => stateRef.current,
      setState: (fn) => setState(prev => fn(prev) || prev),
      fastForward: (seconds) => setState(prev => tick(prev, seconds)),
      setSpeed: (mult) => { speedRef.current = Math.max(0, mult); },
      getSpeed: () => speedRef.current,
      giveAll: (amount = 1000) => setState(prev => {
        const res = { ...prev.resources };
        for (const [id, r] of Object.entries(res)) {
          if (r.unlocked) res[id] = { ...r, amount: amount };
        }
        return { ...prev, resources: res };
      }),
    };
    return () => { delete window.__game; };
  }, []);

  const lastTimeRef = useRef(performance.now());
  const lastStateUpdateRef = useRef(performance.now());
  const accumulatedDtRef = useRef(0);
  const rafRef = useRef(null);
  const saveTimerRef = useRef(null);
  const speedRef = useRef(1);

  const gameLoop = useCallback((now) => {
    const dt = (now - lastTimeRef.current) / 1000;
    lastTimeRef.current = now;

    // Cap dt to avoid spiral of death (e.g., tab was hidden)
    const cappedDt = Math.max(0, Math.min(dt, 1)) * speedRef.current;
    accumulatedDtRef.current += cappedDt;

    // Throttle React state updates to ~10fps (100ms) while canvas animates at 60fps
    if (now - lastStateUpdateRef.current > 100) {
      const accDt = accumulatedDtRef.current;
      accumulatedDtRef.current = 0;
      lastStateUpdateRef.current = now;
      setState(prev => tick(prev, accDt));
    }

    rafRef.current = requestAnimationFrame(gameLoop);
  }, []);

  // Start/stop the loop
  useEffect(() => {
    lastTimeRef.current = performance.now();
    rafRef.current = requestAnimationFrame(gameLoop);

    // Auto-save with error handling for quota/disabled localStorage
    const safeSave = () => {
      try {
        const toSave = { ...stateRef.current, lastSaved: Date.now() };
        localStorage.setItem(SAVE_KEY, JSON.stringify(toSave));
      } catch {
        // localStorage may be full or disabled — silently skip
      }
    };
    saveTimerRef.current = setInterval(safeSave, SAVE_INTERVAL);

    // Save on tab close / page unload
    const handleBeforeUnload = () => safeSave();
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      cancelAnimationFrame(rafRef.current);
      clearInterval(saveTimerRef.current);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      safeSave();
    };
  }, [gameLoop]);

  const updateState = useCallback((fn) => {
    setState(prev => {
      const result = fn(prev);
      if (result && result !== prev) {
        // Save immediately on meaningful state changes (upgrades, era transitions)
        const upgradesBefore = Object.keys(prev.upgrades || {}).length;
        const upgradesAfter = Object.keys(result.upgrades || {}).length;
        if (upgradesAfter > upgradesBefore || result.era !== prev.era) {
          try {
            const toSave = { ...result, lastSaved: Date.now() };
            localStorage.setItem(SAVE_KEY, JSON.stringify(toSave));
          } catch { /* localStorage may be full */ }
        }
      }
      return result || prev;
    });
  }, []);

  const resetSave = useCallback(() => {
    localStorage.removeItem(SAVE_KEY);
    setState(initialState);
  }, [initialState]);

  const dismissOfflineReport = useCallback(() => setOfflineReport(null), []);

  return { state, updateState, resetSave, offlineReport, dismissOfflineReport };
}
