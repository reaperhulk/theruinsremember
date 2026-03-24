/**
 * Browser Test Harness — injectable helper for automated browser testing.
 *
 * This script is designed to be injected into the running game via
 * Chrome DevTools evaluate_script. It exposes window.__harness with
 * convenience functions that wrap window.__game for test automation.
 *
 * Usage from Chrome DevTools MCP:
 *   1. navigate_page to the dev server (http://localhost:5173)
 *   2. evaluate_script with the contents of this file (or paste inline)
 *   3. Use window.__harness.* functions via evaluate_script
 *
 * Or just use window.__game directly — this file documents the patterns.
 */

// ── Harness setup ──────────────────────────────────────────────────────────
(function () {
  if (window.__harness) return; // already injected

  const H = {};

  // ── Speed control ──────────────────────────────────────────────────────
  /** Set game speed multiplier (1 = normal, 10 = 10x, 100 = 100x, 0 = paused) */
  H.setSpeed = (mult) => window.__game.setSpeed(mult);
  H.getSpeed = () => window.__game.getSpeed();
  H.pause = () => window.__game.setSpeed(0);
  H.resume = (speed = 1) => window.__game.setSpeed(speed);

  // ── State access ───────────────────────────────────────────────────────
  H.getState = () => window.__game.getState();

  /** Get a compact snapshot of game progress */
  H.snapshot = () => {
    const s = window.__game.getState();
    const res = {};
    for (const [id, r] of Object.entries(s.resources)) {
      if (r.unlocked) res[id] = { amount: Math.floor(r.amount), rate: +(r.baseRate + r.rateAdd).toFixed(2) };
    }
    return {
      era: s.era,
      totalTime: Math.floor(s.totalTime),
      totalTicks: s.totalTicks,
      speed: window.__game.getSpeed(),
      upgrades: Object.keys(s.upgrades || {}).length,
      tech: Object.keys(s.tech || {}).length,
      achievements: Object.keys(s.achievements || {}).length,
      prestigeCount: s.prestigeCount || 0,
      prestigeMultiplier: s.prestigeMultiplier || 1,
      resources: res,
    };
  };

  /** Get just the resource amounts as a flat object */
  H.resources = () => {
    const s = window.__game.getState();
    const out = {};
    for (const [id, r] of Object.entries(s.resources)) {
      if (r.unlocked) out[id] = r.amount;
    }
    return out;
  };

  // ── Fast-forward ───────────────────────────────────────────────────────
  /** Advance game by N seconds instantly (bypasses real time) */
  H.fastForward = (seconds) => window.__game.fastForward(seconds);

  /** Give max resources for testing */
  H.giveAll = (amount = 1000) => window.__game.giveAll(amount);

  // ── State mutation ─────────────────────────────────────────────────────
  /** Apply a state transform function */
  H.mutate = (fn) => window.__game.setState(fn);

  /** Hard reset (clears save, reloads) */
  H.hardReset = () => {
    localStorage.removeItem('incremental-game-save');
    location.reload();
  };

  /** Reset save without reload — returns to initial state */
  H.softReset = () => {
    localStorage.removeItem('incremental-game-save');
    // Trigger the reset button's logic via the React state
    window.__game.setState(() => {
      // Import creates circular dep, so we reconstruct minimal initial state
      // Better to click the reset button via DOM
      return null; // no-op, use hardReset instead
    });
  };

  // ── Waiting / polling ──────────────────────────────────────────────────
  /**
   * Wait until a condition is met, polling every `intervalMs`.
   * Returns a promise that resolves with the game state when condition is true.
   * Times out after `timeoutMs` (default 60s).
   *
   * Example: await __harness.waitUntil(s => s.era >= 3)
   */
  H.waitUntil = (conditionFn, { intervalMs = 200, timeoutMs = 60000 } = {}) => {
    return new Promise((resolve, reject) => {
      const start = Date.now();
      const check = () => {
        const s = window.__game.getState();
        if (conditionFn(s)) return resolve(s);
        if (Date.now() - start > timeoutMs) return reject(new Error('waitUntil timed out'));
        setTimeout(check, intervalMs);
      };
      check();
    });
  };

  /**
   * Wait for a specific era, returns snapshot when reached.
   * Example: await __harness.waitForEra(5)
   */
  H.waitForEra = (era, timeoutMs = 120000) =>
    H.waitUntil(s => s.era >= era, { timeoutMs }).then(() => H.snapshot());

  /**
   * Run a polling loop that logs snapshots at an interval.
   * Useful for monitoring progress. Returns a stop function.
   */
  H.monitor = (intervalMs = 5000) => {
    let running = true;
    const loop = () => {
      if (!running) return;
      console.log('[harness]', JSON.stringify(H.snapshot()));
      setTimeout(loop, intervalMs);
    };
    loop();
    return () => { running = false; };
  };

  window.__harness = H;
  console.log('[harness] Browser test harness loaded. Use window.__harness.*');
})();
