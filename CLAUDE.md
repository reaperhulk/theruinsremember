# The Ruins Remember — Incremental Game

## Project Structure
- `src/engine/` — Pure game logic (tick, resources, upgrades, tech, mini-games). No browser deps.
- `src/ui/` — React components (App, panels, canvas).
- `src/hooks/` — React hooks including `useGameLoop.js` (the main game loop).
- `src/data/` — Static data definitions (upgrades, tech, resources, prestige).
- `scripts/` — CLI tools (bot-playtest, browser-harness).

## Dev Commands
- `npm run dev` — Start Vite dev server (default: http://localhost:5173)
- `npm run test` — Run Vitest unit tests
- `npm run build` — Production build to dist/

## Architecture
The engine is **pure and deterministic**: `tick(state, dt, rng)` → new state. All game logic lives in `src/engine/`. The React layer in `src/hooks/useGameLoop.js` drives the loop via `requestAnimationFrame`, throttled to ~10 FPS for state updates.

## Browser Testing with Puppeteer

### Automated Browser Test
```bash
# Start dev server first: npm run dev
node scripts/browser-test.mjs                    # Quick layout validation
node scripts/browser-test.mjs --prestige 2       # Test prestige flow
node scripts/browser-test.mjs --mobile           # Mobile viewport (375x812)
node scripts/browser-test.mjs --screenshots      # Save screenshots to /tmp/game-screenshots/
```

The Puppeteer test drives a real headless Chrome, uses `fastForward()` to pump the engine,
clicks DOM buttons to buy upgrades/tech, and validates layout at Era 10. Exit code 1 if
layout issues found.

### Manual Browser Testing (inject harness)
1. Start the dev server: `npm run dev`
2. Open http://localhost:5173 in Chrome
3. Open DevTools Console and paste contents of `scripts/browser-harness.js`
4. Use `__harness.setSpeed(50)` and `JSON.stringify(__harness.snapshot())`

### Speed Control
`window.__game.setSpeed(n)` scales the dt passed to the engine each frame:
- `1` = normal (real-time)
- `10` = 10x speed
- `50`–`100` = good for rapid testing (higher values work but UI updates are throttled to ~10 FPS so visual feedback caps out)
- `0` = paused

The speed multiplier is applied inside `useGameLoop.js` before dt accumulation. The 1-second dt cap is applied *before* the multiplier, so at 100x speed each frame contributes up to 100s of game time.

### Instant Time Skip
For even faster testing, `__harness.fastForward(seconds)` or `__game.fastForward(seconds)` advances the engine by an arbitrary amount in a single tick. This is instantaneous but skips intermediate event checks.

### Key Harness Functions
```js
__harness.setSpeed(n)          // Set speed multiplier
__harness.pause() / .resume()  // Pause/resume
__harness.snapshot()           // Compact progress summary
__harness.resources()          // Current resource amounts
__harness.fastForward(secs)    // Instant time skip
__harness.giveAll(amount)      // Set all unlocked resources to amount
__harness.waitForEra(n)        // Promise — resolves when era >= n
__harness.waitUntil(fn)        // Promise — resolves when fn(state) is true
__harness.monitor(ms)          // Log snapshots every ms (returns stop fn)
__harness.hardReset()          // Clear save + reload page
```

### Direct State Access
```js
__game.getState()              // Full game state object
__game.setState(fn)            // Apply state transform: fn(prev) → next
__game.getSpeed()              // Current speed multiplier
```

### Common Test Patterns

**Watch the game progress at high speed:**
```js
__harness.setSpeed(50);
// Then periodically call: JSON.stringify(__harness.snapshot())
```

**Skip to a specific era to test late-game content:**
```js
__harness.giveAll(10000);
__harness.fastForward(3600);
JSON.stringify(__harness.snapshot());
```

**Test a specific upgrade's effect:**
```js
// Get state before
const before = JSON.stringify(__harness.resources());
// Fast forward
__harness.fastForward(60);
const after = JSON.stringify(__harness.resources());
// Compare before/after
```

**Wait for a condition then inspect:**
```js
await __harness.waitUntil(s => s.resources.energy?.amount > 100);
JSON.stringify(__harness.snapshot());
```

## Headless Bot Testing
For pure engine testing without a browser:
```bash
node scripts/bot-playtest.js --profile optimal --max-time 14400 --target-era 10
node scripts/bot-playtest.js --scenario speedrun --json > results.json
node scripts/bot-playtest.js --compare results.json  # Regression detection
```

## Game Engine API (key exports)
- `tick(state, dt, rng)` — Advance game state by dt seconds
- `purchaseUpgrade(state, id)` / `getAvailableUpgrades(state)` / `getUpgradeCost(state, id)`
- `unlockTech(state, id)` / `getAvailableTech(state)`
- `canAfford(state, cost)` / `spend(state, cost)` / `gather(state, resourceId)`
- `mine(state)` — Manual mining action
- `performPrestige(state)` — Reset with prestige bonuses
- `createInitialState()` — Fresh game state
