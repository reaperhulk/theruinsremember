# Construction and supply-route revision

Baseline: `8170842b6cdbca4cb43efab6babc51bfc91a8e37`. Comparisons use identical seeds and attention schedules. Automated policies measure progression and inputs; they do not establish human enjoyment.

## Fewer, larger upgrades

There are **60 construction projects, six per era**, replacing 564 individual one-time production purchases. Ten pairs of exclusive doctrines and fifteen repeatable infrastructure types remain separate. Linear research stays automatic; exclusive research paths remain player choices.

A project pays once and applies its combined effects together. The interface previews production at full supply, resource unlocks, actual cost, funding estimates and prerequisites. Current construction shows three upcoming projects; the chapter catalog shows all six. The world, footer and statistics count completed projects. Infrastructure purchases advance toward a ten-level production multiplier through a single command.

Supporting works cost half their former individual price because their foundations are shared. The opening Internet project costs 40% of its former price to reduce the research bootstrap gap. Charging every old purchase in full before granting any of its production made waits unnecessarily long in the first balance pass. Prices still use the existing resource scaling and earned discounts; there are no free project completions.

Prioritizing a project reserves its full remaining cost. Growth and research policies control spending order. Automatic reservation of every future project was tested and rejected because it prevented research needed to resolve supply bottlenecks; explicit commitments retain full reservation.

Legacy component IDs remain effect and ownership records for save compatibility. Previously built components are neither charged nor applied twice. Queued old production purchases migrate to their projects and deduplicate, including saved automation plans. Former gem, trade and prestige gates on small positive production extras are retired as those works become parts of the six projects; exclusive-choice gates remain. Structural readiness and old achievements retain compatible component credit internally. No existing save is reset.

## A reason to plan while waiting

The optional supply run works in every era. Draw a route from Camp to Exit around rubble with a budget of twelve steps. Every generated board has an eight-step route without bonus cargo, plus a route collecting both caches within twelve steps. Reaching both caches necessarily requires a detour.

Reaching the exit pays 20% of the project's missing supplies quoted when the run began; each cache adds another 10%, rounded up to whole resources and limited by available storage. Success grants actual resources, not a free upgrade. There is one payout per board and a 90-second crew cooldown. Surplus remains useful if construction finishes during the activity.

Mouse drag, touch drag, adjacent-square clicks, and arrow keys plus Enter are supported. Backtracking undoes a step; redraw restarts planning without penalty. There is no timer or failure penalty. Pause and reload retain the route. Offline simulation never solves a board or awards player-earned cargo, and prestige clears the active run. Normal construction continues without participating.

## Optional activity comparison

Engaged persona, two complete naturally earned cycles, bounded to two legal gameplay commands per decision window. The solver sees only the visible grid, cargo markers and step budget. Starting is one command and drawing a complete route is another, matching a single continuous pointer gesture. Thinking time is not separately estimated.

| Seed | Without activity | With activity | Commands without → with | Routes solved | Elapsed reduction |
| --- | --- | --- | ---: | ---: | ---: |
| 424242 | 15m 40s | 15m 00s | 81 → 114 | 7 | 4.3% |
| 42 | 16m 10s | 16m 10s | 89 → 114 | 8 | 0.0% |

The fully rebalanced run is 4.3% faster on one seed and unchanged on the other; the earlier unrebalanced comparison is superseded. Extra route commands consume attention windows, and later choices can offset a locally shorter construction wait. The focused project test verifies that a two-cache success cuts the selected project’s remaining funding estimate by at least 35%, without granting the project for free.

## Required eight-persona comparison

These ordinary persona runs do **not** use supply puzzles. The shorter historical offline-returner target remains unchanged; the separate bounded journey suite requires two full cycles for every persona.

| Persona | Seed | Elapsed before → after | Active before → after | Actions before → after | Sessions before → after | Outcome before → after |
| --- | ---: | --- | --- | ---: | ---: | --- |
| newcomer | 424242 | 15m 01s → 14m 01s | 15m 01s → 14m 01s | 53 → 50 | 1 → 1 | Era 10 → 10; target completed |
| newcomer | 42 | 15m 21s → 13m 41s | 15m 21s → 13m 41s | 54 → 49 | 1 → 1 | Era 10 → 10; target completed |
| engaged | 424242 | 13m 31s → 11m 01s | 13m 31s → 11m 01s | 58 → 50 | 1 → 1 | Era 10 → 10; target completed |
| engaged | 42 | 13m 31s → 11m 31s | 13m 31s → 11m 31s | 56 → 50 | 1 → 1 | Era 10 → 10; target completed |
| optimizer | 424242 | 9m 31s → 11m 43s | 9m 31s → 11m 43s | 57 → 51 | 1 → 1 | Era 10 → 10; target completed |
| optimizer | 42 | 9m 19s → 9m 33s | 9m 19s → 9m 33s | 54 → 52 | 1 → 1 | Era 10 → 10; target completed |
| background | 424242 | 18m 06s → 18m 01s | 4m 36s → 4m 31s | 58 → 58 | 10 → 10 | Era 10 → 10; target completed |
| background | 42 | 18m 01s → 18m 01s | 4m 31s → 4m 31s | 63 → 57 | 10 → 10 | Era 10 → 10; target completed |
| check_in | 424242 | 40m 56s → 40m 31s | 4m 56s → 4m 31s | 51 → 57 | 5 → 5 | Era 10 → 10; target completed |
| check_in | 42 | 40m 06s → 40m 31s | 4m 06s → 4m 31s | 52 → 58 | 5 → 5 | Era 10 → 10; target completed |
| offline_returner | 424242 | 12h 0m 01s → 12h 0m 01s | 6m 01s → 6m 01s | 33 → 31 | 4 → 4 | Era 6 → 6; target completed |
| offline_returner | 42 | 12h 0m 01s → 12h 0m 01s | 6m 01s → 6m 01s | 32 → 30 | 4 → 4 | Era 6 → 6; target completed |
| completionist | 424242 | 11m 31s → 9m 41s | 11m 31s → 9m 41s | 58 → 51 | 1 → 1 | Era 10 → 10; target completed |
| completionist | 42 | 10m 46s → 11m 56s | 10m 46s → 11m 56s | 55 → 55 | 1 → 1 | Era 10 → 10; target completed |
| minimalist | 424242 | 34m 31s → 55m 31s | 34m 31s → 55m 31s | 55 → 45 | 1 → 1 | Era 10 → 10; target completed |
| minimalist | 42 | 43m 01s → 37m 31s | 43m 01s → 37m 31s | 54 → 44 | 1 → 1 | Era 10 → 10; target completed |

Regressions are retained in this report: optimizer takes 132s/14s longer on the two seeds; completionist seed 42 takes 70s longer; check-in seed 42 takes 25s longer and both check-in seeds issue six more commands. Minimalist seed 424242 takes 21 minutes longer, despite ten fewer manual commands; the other minimalist seed is 5m30s faster. Larger purchases defer their production until fully funded, and changed timing alters branch/relic ordering in these policies. This revision prioritizes fewer, consequential construction events and an optional way to shorten their wait; it does not claim uniformly faster idle completion. No persona loses its target, performs actions while absent, or collapses in the final siege.

The balance minimums allow newcomers to finish in 13 minutes (previously 14) and completionists in 8 minutes (previously 10), reflecting the shared-construction discount. The optimizer's Digital Age maximum becomes 5m30s (previously 4m); the measured four-seed maximum is 5m10s. Other maximums, attention/absence conditions, operation coverage, bounded journey pacing limits, and the checked-in baseline remain unchanged. Both legacy and bounded policies now buy only the current era's visible infrastructure milestones; they cannot repeatedly spend through retired purchase controls. The explicit legacy explorer now crafts an unowned relic with a legal replacement when its slots are full, and completes available reconstruction contributions before leaving a cycle.

## Verification

- 451 unit/regression tests include project atomicity and partial-save credit, migration and reservations, no-activity progression, 100 boards across all ten eras with genuine bonus detours, reward limits and duplicate prevention, invalid routes, save/resume, offline behavior and prestige resets.
- Four-seed balance matrix and the required sixteen-row impact report.
- Sixteen bounded two-cycle journeys, plus fifty adverse-policy journeys including optional supply runs, manual development, inefficient spending, alternate branches, bad luck and skipped operations.
- Ten-prestige stress on both seeds and existing 22-cycle legacy-unlock coverage.
- Required browser workflow: natural desktop/mobile two-cycle journeys, operation/prestige coverage, seven viewport sizes across all ten eras, and native wheel/touch/keyboard scrolling. Supply checks draw with mouse and touch, extend with keyboard, pause, reload, resume, and verify real cargo rewards.
- Production build and asset budgets. Browser results and deployment status are attached to this commit's GitHub Actions run.
