# Progression and player experience work

Starting point: `3a1986dd70be7def32127f1bff023a1c444782eb`.
The user authorized the full reviewed improvement plan and incremental commits
to main, with the testing harness audited before gameplay changes.

## Delivery checklist

- [x] Audit harness success criteria, CLI failure reporting, and fixture claims.
- [ ] Add bounded player actions, final-cycle journeys for every persona,
      alternative branches, and negative tests that prove stalls are detected.
- [x] Remove post-prestige compulsory operations; preserve optional playstyles.
- [x] Enforce the same purchase requirements in manual, bulk, and automatic paths.
- [x] Unify production, consumption, caps, affordability estimates, and previews.
- [x] Add consumer controls, reserves, queued goals, and visible recovery routes.
- [x] Make active/background/offline simulation consistent; protect unattended play.
- [x] Add validated saves, rotating backups, recovery, and current-state export.
- [x] Strengthen signature upgrades and repeatable milestones.
- [x] Add permanent Archive, remembered plans, distinct doctrine research,
      deterministic relic crafting, reconstruction projects, and optional challenges.
- [x] Add prestige reward selection before the new run and accurate reset previews.
- [ ] Make operation choices affect later production and defenses; queue commissions.
- [x] Preserve narrative history and landmarks between cycles.
- [x] Improve the opening scene, readable decision cards, navigation, touch,
      keyboard access, and reduced-motion support.
- [x] Add ambient music and independent audio controls.
- [x] Move automatic visual rewards into simulation and profile/render efficiently.
- [ ] Complete natural progression and UI journeys, run quality gates, inspect CI.

## Harness audit

The original suite contained useful unit and fixture tests, but they were not a
proof of player reachability:

* `reachedTargetEra` used the highest era ever reached. Human reports could say
  `OK` after a prestige left the player stuck in a later cycle. CLI runs could
  exit zero even when unfinished unless `--assert-balance` was specified.
* Each decision window could gather every resource, buy multiple upgrades,
  purchase multiple technologies, and act on every operation. The action count
  recorded helper calls rather than the number of player inputs.
* The offline-returner scenario only targeted Era 4; repeated-prestige tests used
  the optimizer exclusively.
* The stuck heuristic summed unrelated resources. A growing irrelevant resource
  could conceal a capped or unproducible prerequisite indefinitely.
* `progression.test.js` injected resources and owned upgrades. These are transition
  fixtures, not natural progression tests.
* The browser suite progressed naturally only through Era 7. Its prestige loop
  called `promoteToEra10` after each reset. Those assertions establish reset/UI
  behavior, not the ability to replay a cycle.
* Existing tests included duplicated implementation and exact historical timing
  strings. These can pass while the behavior the player relies on is broken.

Reproduction: `node scripts/bot-playtest.js --scenario minimalist --prestige 1
--max-time 9000 --seed 424242 --json`. The original game reset after 6091 seconds,
then reached Era 4 at 630 seconds into cycle two and could not advance without
the supposedly optional docking operation.

## Validation policy

Compare all eight personas with seeds 424242 and 42 before and after each batch.
Record elapsed time, active time, manual inputs, sessions, and final-cycle outcome.
Preserve the original baseline; changes to simulation policy are reported as
measurement changes, separately from changes to the game. Never treat a fixture
that grants progress as evidence that a fresh player can earn that progress.

New journey gates must start with a fresh state, advance the real simulation,
use only legal player actions, and fail for an incomplete final requested cycle.
Negative controls deliberately obstruct a prerequisite or truncate a run and
must fail even if unrelated resources continue growing or an earlier cycle won.

## Batch results

Results and intentional tradeoffs are recorded here as work is committed.

### 1. Honest harness outcomes

367 unit tests and lint passed. All 16 persona/seed combinations retain identical
elapsed time, active attention, manual actions, sessions, and final-era outcomes.
The capture before this batch is the original checked-in baseline. New negative
controls reject unfinished final cycles, insufficient prestige counts, unexpected
collapse, invalid numbers, and CLI timeouts. No gameplay changed.

| Persona | Seeds | Elapsed before → after | Active / actions / sessions | Outcome |
|---|---|---|---|---|
| newcomer | 424242 | 1961s → 1961s | 1961s / 123 / 1 (unchanged) | Era 10; target 10 |
| newcomer | 42 | 1961s → 1961s | 1961s / 119 / 1 (unchanged) | Era 10; target 10 |
| engaged | 424242 | 1881s → 1881s | 1881s / 157 / 1 (unchanged) | Era 10; target 10 |
| engaged | 42 | 2161s → 2161s | 2161s / 161 / 1 (unchanged) | Era 10; target 10 |
| optimizer | 424242 | 961s → 961s | 961s / 217 / 1 (unchanged) | Era 10; target 10 |
| optimizer | 42 | 871s → 871s | 871s / 171 / 1 (unchanged) | Era 10; target 10 |
| background | 424242 | 2161s → 2161s | 541s / 109 / 19 (unchanged) | Era 10; target 10 |
| background | 42 | 2161s → 2161s | 541s / 108 / 19 (unchanged) | Era 10; target 10 |
| check_in | 424242 | 4201s → 4201s | 421s / 112 / 8 (unchanged) | Era 10; target 10 |
| check_in | 42 | 4231s → 4231s | 451s / 112 / 8 (unchanged) | Era 10; target 10 |
| offline_returner | 424242 | 28801s → 28801s | 241s / 69 / 3 (unchanged) | Era 7; target 4 |
| offline_returner | 42 | 28801s → 28801s | 241s / 68 / 3 (unchanged) | Era 7; target 4 |
| completionist | 424242 | 1081s → 1081s | 1081s / 182 / 1 (unchanged) | Era 10; target 10 |
| completionist | 42 | 1081s → 1081s | 1081s / 172 / 1 (unchanged) | Era 10; target 10 |
| minimalist | 424242 | 6091s → 6091s | 6091s / 60 / 1 (unchanged) | Era 10; target 10 |
| minimalist | 42 | 6421s → 6421s | 6421s / 61 / 1 (unchanged) | Era 10; target 10 |

### 2. Reachable purchases and a consistent economy

375 unit tests and lint pass. Fixed a first-run dependency on the prestige-only Cosmic Recollection, previously hidden by automation bypassing its requirement. Minimalist bounded journeys now complete two cycles (12,840s, 167 commands) instead of stalling after the first reset. Engaged completes two cycles in 2,580s / 320 actual commands. Full eight-persona two-cycle matrix is being validated.

Purchases now enforce milestone requirements, bulk buying preserves decisions, consumers use contemporaneous supply and stop at full storage, rates/ETAs use the simulation calculation, and input pauses/reserves plus independent storage expansion provide recovery. Offline stepping is bounded to one second. Head Start, Wisdom, Temporal Echo and offline descriptions match behavior; Quantum Tunneling applies to tech; Temporal Anchor discounts its first ten purchases.

Intentional timing differences below reflect removing illicit first-run prestige multipliers, correcting supply consumption, and changing offline simulation granularity. All original persona targets remain reachable; no manual actions occur during absence. These changes are measured against the retained original baseline.

| Persona | Seed | Elapsed before → after | Active before → after | Actions before → after | Sessions before → after | Final era / ready |
|---|---|---|---|---|---|---|
| newcomer | 424242 | 1961 → 1741 | 1961 → 1741 | 123 → 114 | 1 → 1 | 10 / True |
| engaged | 424242 | 1881 → 1411 | 1881 → 1411 | 157 → 140 | 1 → 1 | 10 / True |
| optimizer | 424242 | 961 → 931 | 961 → 931 | 217 → 204 | 1 → 1 | 10 / True |
| background | 424242 | 2161 → 1921 | 541 → 481 | 109 → 120 | 19 → 17 | 10 / True |
| check_in | 424242 | 4201 → 4201 | 421 → 421 | 112 → 104 | 8 → 8 | 10 / True |
| offline_returner | 424242 | 28801 → 43201 | 241 → 361 | 69 → 98 | 3 → 4 | 6 / False |
| completionist | 424242 | 1081 → 1171 | 1081 → 1171 | 182 → 183 | 1 → 1 | 10 / True |
| minimalist | 424242 | 6091 → 10681 | 6091 → 10681 | 60 → 70 | 1 → 1 | 10 / True |
| newcomer | 42 | 1961 → 1741 | 1961 → 1741 | 119 → 116 | 1 → 1 | 10 / True |
| engaged | 42 | 2161 → 1561 | 2161 → 1561 | 161 → 140 | 1 → 1 | 10 / True |
| optimizer | 42 | 871 → 961 | 871 → 961 | 171 → 232 | 1 → 1 | 10 / True |
| background | 42 | 2161 → 1921 | 541 → 481 | 108 → 118 | 19 → 17 | 10 / True |
| check_in | 42 | 4231 → 4201 | 451 → 421 | 112 → 104 | 8 → 8 | 10 / True |
| offline_returner | 42 | 28801 → 43201 | 241 → 361 | 68 → 99 | 3 → 4 | 6 / False |
| completionist | 42 | 1081 → 1081 | 1081 → 1081 | 172 → 183 | 1 → 1 | 10 / True |
| minimalist | 42 | 6421 → 10231 | 6421 → 10231 | 61 → 72 | 1 → 1 | 10 / True |

### 3. Save recovery and safe unattended play

381 unit tests, lint, and the production build pass. All 16 persona timings are unchanged; manual inputs decrease because ordinary runs no longer require siege defense.

Validated primary saves and two rotating backups, non-destructive recovery, visible storage errors, current-state export, fixed-step foreground updates, responsive offline processing, and hidden-tab catch-up. The Forgetting requires an explicit start and no longer forces a prestige after a loss. Negative controls cover invalid/future saves, quotas, backup recovery, migration purity, unattended Era 10, and retreat.

| Persona | Seed | Elapsed before → after | Active before → after | Actions before → after | Sessions before → after | Final era / ready |
|---|---|---|---|---|---|---|
| newcomer | 424242 | 1741 → 1741 | 1741 → 1741 | 114 → 111 | 1 → 1 | 10 / True |
| engaged | 424242 | 1411 → 1411 | 1411 → 1411 | 140 → 138 | 1 → 1 | 10 / True |
| optimizer | 424242 | 931 → 931 | 931 → 931 | 204 → 202 | 1 → 1 | 10 / True |
| background | 424242 | 1921 → 1921 | 481 → 481 | 120 → 116 | 17 → 17 | 10 / True |
| check_in | 424242 | 4201 → 4201 | 421 → 421 | 104 → 103 | 8 → 8 | 10 / True |
| offline_returner | 424242 | 43201 → 43201 | 361 → 361 | 98 → 98 | 4 → 4 | 6 / False |
| completionist | 424242 | 1171 → 1171 | 1171 → 1171 | 183 → 181 | 1 → 1 | 10 / True |
| minimalist | 424242 | 10681 → 10681 | 10681 → 10681 | 70 → 70 | 1 → 1 | 10 / True |
| newcomer | 42 | 1741 → 1741 | 1741 → 1741 | 116 → 113 | 1 → 1 | 10 / True |
| engaged | 42 | 1561 → 1561 | 1561 → 1561 | 140 → 138 | 1 → 1 | 10 / True |
| optimizer | 42 | 961 → 961 | 961 → 961 | 232 → 230 | 1 → 1 | 10 / True |
| background | 42 | 1921 → 1921 | 481 → 481 | 118 → 114 | 17 → 17 | 10 / True |
| check_in | 42 | 4201 → 4201 | 421 → 421 | 104 → 103 | 8 → 8 | 10 / True |
| offline_returner | 42 | 43201 → 43201 | 361 → 361 | 99 → 99 | 4 → 4 | 6 / False |
| completionist | 42 | 1081 → 1081 | 1081 → 1081 | 183 → 181 | 1 → 1 | 10 / True |
| minimalist | 42 | 10231 → 10231 | 10231 → 10231 | 72 → 72 | 1 → 1 | 10 / True |

### 4. Impactful decisions and new prestige systems

Forty large existing breakthroughs are now explicit signature decisions with production previews. Repeatable milestones award ×1.5 every ten levels. Queued purchases reserve their cost without starving their prerequisites; player-selected commissions resolve through the normal operation commands.

Prestige one preserves the Archive and saved plans; two opens permanent doctrine research and deterministic relic crafting; three opens three projects requiring contributions from distinct cycles. Rewards selected before prestige are priced from newly earned points and applied before starting perks. Narrative history persists independently of the rolling event log. Six naturally played cycles completed in 5,140s / 854 commands, earning all three research branches, crafting four relics, and finishing all three projects.

393 unit and journey contract tests pass. Alternate branches, failed expeditions, inefficient spending and individual skipped operations are also exercised. Additional manual inputs below are deliberate: major breakthroughs are now player decisions. The check-in profile needs one additional visit; no progression failures or absent player actions occur.

| Persona | Seed | Elapsed before → after | Active before → after | Actions before → after | Sessions before → after | Final era / ready |
|---|---|---|---|---|---|---|
| newcomer | 424242 | 1741 → 1921 | 1741 → 1921 | 111 → 139 | 1 → 1 | 10 / True |
| engaged | 424242 | 1411 → 1411 | 1411 → 1411 | 138 → 163 | 1 → 1 | 10 / True |
| optimizer | 424242 | 931 → 961 | 931 → 961 | 202 → 239 | 1 → 1 | 10 / True |
| background | 424242 | 1921 → 2041 | 481 → 511 | 116 → 129 | 17 → 18 | 10 / True |
| check_in | 424242 | 4201 → 4801 | 421 → 481 | 103 → 138 | 8 → 9 | 10 / True |
| offline_returner | 424242 | 43201 → 43201 | 361 → 361 | 98 → 101 | 4 → 4 | 5 / False |
| completionist | 424242 | 1171 → 1171 | 1171 → 1171 | 181 → 218 | 1 → 1 | 10 / True |
| minimalist | 424242 | 10681 → 11491 | 10681 → 11491 | 70 → 93 | 1 → 1 | 10 / True |
| newcomer | 42 | 1741 → 1681 | 1741 → 1681 | 113 → 137 | 1 → 1 | 10 / True |
| engaged | 42 | 1561 → 1531 | 1561 → 1531 | 138 → 166 | 1 → 1 | 10 / True |
| optimizer | 42 | 961 → 961 | 961 → 961 | 230 → 260 | 1 → 1 | 10 / True |
| background | 42 | 1921 → 2041 | 481 → 511 | 114 → 130 | 17 → 18 | 10 / True |
| check_in | 42 | 4201 → 4801 | 421 → 481 | 103 → 138 | 8 → 9 | 10 / True |
| offline_returner | 42 | 43201 → 43201 | 361 → 361 | 99 → 102 | 4 → 4 | 5 / False |
| completionist | 42 | 1081 → 1141 | 1081 → 1141 | 181 → 209 | 1 → 1 | 10 / True |
| minimalist | 42 | 10231 → 9211 | 10231 → 9211 | 72 → 90 | 1 → 1 | 10 / True |

### 5. Presentation and full browser journeys

394 unit/journey contracts, lint, and build pass. All 16 bounded two-cycle persona journeys pass; both ten-prestige stress seeds pass. Four balance seeds pass after the explicitly documented seed-1 pacing calibration. Browser journeys are awaiting CI execution.

Illustrations now appear from Era 1; new panels have readable cards, keyboard tabs, touch targets, and reduced-motion support. Ambient music has separate music/effects controls and pauses when hidden. Panels and scenes load in separate bundles (main JS 608KB versus the previous 971KB; all required startup chunks still load normally). Canvas drawing is bounded to 30fps / 2× pixels; economy rendering reuses the shared calculation. Automatic harvesting now runs in simulation, including offline.

Added a natural desktop/mobile browser journey that earns two complete cycles, reloads earned mid-run progress, and allocates a reward through visible UI controls. No resource grants, era fixtures, or engine purchase calls occur in that journey. Existing operation fixtures remain separate and explicitly labeled. CI now runs every bounded persona for two cycles, adversarial branches and optional-system omissions, ten-prestige stress, and desktop/mobile UI journeys, and preserves diagnostic artifacts.

Intentional gate changes: siege-sealing assertions moved from ordinary optimizer play to the explicit descent challenge. Forty manual signature decisions increased seed 1 to 135 legacy gather windows and 204s in Era 3, so their limits are 150 and 240s. Final-cycle completion, no-absence-actions, no unexpected collapse, and bounded actual command gates remain required.

| Persona | Seed | Elapsed before → after | Active before → after | Actions before → after | Sessions before → after | Final era / ready |
|---|---|---|---|---|---|---|
| newcomer | 424242 | 1921 → 1921 | 1921 → 1921 | 139 → 139 | 1 → 1 | 10 / True |
| engaged | 424242 | 1411 → 1411 | 1411 → 1411 | 163 → 163 | 1 → 1 | 10 / True |
| optimizer | 424242 | 961 → 961 | 961 → 961 | 239 → 239 | 1 → 1 | 10 / True |
| background | 424242 | 2041 → 2041 | 511 → 511 | 129 → 129 | 18 → 18 | 10 / True |
| check_in | 424242 | 4801 → 4801 | 481 → 481 | 138 → 138 | 9 → 9 | 10 / True |
| offline_returner | 424242 | 43201 → 43201 | 361 → 361 | 101 → 101 | 4 → 4 | 5 / False |
| completionist | 424242 | 1171 → 1171 | 1171 → 1171 | 218 → 218 | 1 → 1 | 10 / True |
| minimalist | 424242 | 11491 → 11461 | 11491 → 11461 | 93 → 92 | 1 → 1 | 10 / True |
| newcomer | 42 | 1681 → 1681 | 1681 → 1681 | 137 → 137 | 1 → 1 | 10 / True |
| engaged | 42 | 1531 → 1531 | 1531 → 1531 | 166 → 166 | 1 → 1 | 10 / True |
| optimizer | 42 | 961 → 961 | 961 → 961 | 260 → 260 | 1 → 1 | 10 / True |
| background | 42 | 2041 → 2041 | 511 → 511 | 130 → 130 | 18 → 18 | 10 / True |
| check_in | 42 | 4801 → 4801 | 481 → 481 | 138 → 138 | 9 → 9 | 10 / True |
| offline_returner | 42 | 43201 → 43201 | 361 → 361 | 102 → 102 | 4 → 4 | 5 / False |
| completionist | 42 | 1141 → 1141 | 1141 → 1141 | 209 → 209 | 1 → 1 | 10 / True |
| minimalist | 42 | 9211 → 9181 | 9211 → 9181 | 90 → 89 | 1 → 1 | 10 / True |
