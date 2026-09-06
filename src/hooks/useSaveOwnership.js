import { useEffect, useState } from 'react';
import { SAVE_KEY } from '../engine/saves.js';

export function useSaveOwnership() {
  const [owned, setOwned] = useState(false);
  const [warning, setWarning] = useState(null);
  useEffect(() => {
    let alive = true, release;
    // Web Locks serialize ownership across tabs, including offline catch-up.
    if (navigator.locks) {
      navigator.locks.request(`${SAVE_KEY}:writer`, { ifAvailable: true }, async lock => {
        if (!alive) return;
        if (!lock) { setWarning('This civilization is open in another tab. Close that tab and reload here to continue.'); return; }
        setOwned(true);
        await new Promise(resolve => { release = resolve; });
      }).catch(() => { if (alive) setWarning('Save ownership could not be established. Reload to try again.'); });
    } else {
      // Older browsers are guarded by the storage-change check in useGameLoop.
      setOwned(true);
    }
    return () => { alive = false; release?.(); };
  }, []);
  return { owned, warning };
}
