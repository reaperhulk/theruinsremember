import { useEffect, useState } from 'react';
import { SAVE_KEY } from '../engine/saves.js';

export function useSaveOwnership() {
  const [owned, setOwned] = useState(false);
  const [warning, setWarning] = useState(null);
  useEffect(() => {
    let alive = true, release, timeout;
    const controller = new AbortController();
    // Queue briefly so a React remount or closing document can release its
    // previous request. An immediate ifAvailable request races Strict Mode's
    // setup/cleanup/setup sequence and can mistake this same tab for another.
    if (navigator.locks) {
      timeout = setTimeout(() => {
        controller.abort();
        if (alive) setWarning('This civilization is open in another tab. Close that tab and reload here to continue.');
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
    } else {
      // Older browsers are guarded by the storage-change check in useGameLoop.
      setOwned(true);
    }
    return () => { alive = false; clearTimeout(timeout); controller.abort(); release?.(); };
  }, []);
  return { owned, warning };
}
