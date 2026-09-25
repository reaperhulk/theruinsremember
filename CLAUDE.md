# The Ruins Remember — Clicker

A cookie-clicker-style incremental. One currency (salvage), dug by hand and
produced by stackable buildings across ten eras; glimmers (internally `echo`) are the
golden-cookie moments; letting the cycle turn is prestige.

## Project Structure
- `src/game/` — Pure game logic and data. No browser dependencies.
  - `data.js` — buildings, upgrades, glimmers, memory lessons, achievements
  - `engine.js` — `tick`, `click`, purchases, glimmers, offline time, the cycle
  - `save.js` — validated saves, backup, export/import, original-game welcome
  - `lore.js` — chapters and ruins-ticker text for every era
- `src/ui/` — React components, the canvas era scenes (`scenes/`), music and sound.
- `scripts/pacing.mjs` + `scripts/sim/` — persona simulator, pacing contract, before/after impact.
- `scripts/browser-smoke.mjs` — real-input browser test on desktop, tablet and phone.

## Design rules
- The player is the engine at the start: nothing is bought or dug automatically.
  Buildings are the automation, and players buy them.
- Buildings cost `COST_SCALE` (1.15×) more per purchase. Newer buildings pay back
  more slowly than older ones (a unit test checks this).
- Clicking stays relevant through click-share upgrades (1% of production per click each).
- Nothing can be lost to absence. Offline time only produces (at the offline
  efficiency), never shows glimmers, and never turns the cycle.
- Keep the engine pure and deterministic: every function takes an `rng` where randomness matters.

## Checking changes

Run what matches what you changed. `npm run test:quality` (lint, unit tests,
pacing contract, build, asset budget) runs in CI on every push, plus the browser smoke test.

| Change | Required |
| --- | --- |
| Economy, balance, pacing, glimmers, offline, the cycle (`src/game/data.js`, `src/game/engine.js`) | `npm run test:quality`, and a before/after persona comparison in the commit message |
| Other engine or save changes | `npm run test:unit` |
| UI | `npm run lint`, `npm run build`, and `npm run test:browser` with the dev server running |
| Docs, tests, scripts only | Nothing extra |

Before/after persona comparison (identical seeds and attention schedules):

```bash
node scripts/pacing.mjs --capture /tmp/pacing-before.json   # before the change
node scripts/pacing.mjs --baseline /tmp/pacing-before.json  # after the change
```

Report the milestone time, active attention, manual actions, sessions and
outcome for each persona, and explain any regression. Change the pacing contract
in `scripts/pacing.mjs` only on purpose, and say why in the commit.

## Dev Commands
- `npm run dev` — Vite dev server (http://localhost:5173)
- `npm run test` / `npm run test:unit` — Vitest (watch / once)
- `npm run test:pacing` — eight personas × two seeds against the pacing contract
- `node scripts/pacing.mjs --persona check_in --horizon 720` — long-horizon run (hours)
- `npm run test:browser` — browser smoke test (needs the dev server; `PUPPETEER_EXECUTABLE_PATH` to use another Chrome)
- `npm run build` — production build to `dist/`

## Personas (`scripts/sim/personas.js`)
`newcomer`, `engaged`, `optimizer`, `background`, `check_in`, `offline_returner`,
`completionist`, `minimalist`. Each has a click rate, a decision interval, a
glimmer-catch chance, and a session pattern (tab open or closed while away). The
simulated player acts only during its attention windows and uses only the
public engine API.

## Browser access
`window.__game` exposes `getState()`, `setState(fn)`, `fastForward(seconds)`,
`setSpeed(n)` and `getSpeed()` for manual testing in DevTools.
