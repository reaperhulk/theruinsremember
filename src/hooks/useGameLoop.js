import { useRef, useState, useCallback, useEffect } from 'react';
import { tick } from '../engine/tick.js';
import { createInitialState } from '../engine/state.js';

function migrateState(saved) {
  const fresh = createInitialState();
  // Ensure all fields exist by merging with defaults
  const migrated = { ...fresh, ...saved };
  // Ensure resources have all required fields
  for (const [id, freshR] of Object.entries(fresh.resources)) {
    if (!migrated.resources[id]) {
      migrated.resources[id] = freshR;
    } else {
      migrated.resources[id] = { ...freshR, ...migrated.resources[id] };
    }
  }
  migrated.saveVersion = 2;
  return migrated;
}

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
          // Cap offline time at 24 hours
          const offlineDt = Math.min(elapsed, 86400);
          const before = migrated;

          // Process offline in chunks for proper event/achievement checking
          const chunkSize = 60;
          const chunks = Math.min(Math.floor(offlineDt / chunkSize), 1440);
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
          // Store offline report (will be shown by UI)
          // For large offline periods, show processing indicator briefly
          if (chunks > 100) {
            setOfflineReport({ elapsed: offlineDt, processing: true, gains: {} });
            setTimeout(() => setOfflineReport({ elapsed: offlineDt, gains }), 300);
          } else {
            setTimeout(() => setOfflineReport({ elapsed: offlineDt, gains }), 100);
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
  const rafRef = useRef(null);
  const saveTimerRef = useRef(null);

  const gameLoop = useCallback((now) => {
    const dt = (now - lastTimeRef.current) / 1000;
    lastTimeRef.current = now;

    // Cap dt to avoid spiral of death (e.g., tab was hidden)
    const cappedDt = Math.min(dt, 1);

    setState(prev => tick(prev, cappedDt));
    rafRef.current = requestAnimationFrame(gameLoop);
  }, []);

  // Start/stop the loop
  useEffect(() => {
    lastTimeRef.current = performance.now();
    rafRef.current = requestAnimationFrame(gameLoop);

    // Auto-save
    saveTimerRef.current = setInterval(() => {
      const toSave = { ...stateRef.current, lastSaved: Date.now() };
      localStorage.setItem(SAVE_KEY, JSON.stringify(toSave));
    }, SAVE_INTERVAL);

    return () => {
      cancelAnimationFrame(rafRef.current);
      clearInterval(saveTimerRef.current);
      // Save on unmount
      const toSave = { ...stateRef.current, lastSaved: Date.now() };
      localStorage.setItem(SAVE_KEY, JSON.stringify(toSave));
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
          const toSave = { ...result, lastSaved: Date.now() };
          localStorage.setItem(SAVE_KEY, JSON.stringify(toSave));
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
