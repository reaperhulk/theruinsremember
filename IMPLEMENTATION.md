# Progression and player experience work

Starting point: `3a1986dd70be7def32127f1bff023a1c444782eb`.
The user authorized the full reviewed improvement plan and incremental commits
to main, with the testing harness audited before gameplay changes.

## Delivery checklist

- [ ] Audit harness success criteria, CLI failure reporting, and fixture claims.
- [ ] Add bounded player actions, final-cycle journeys for every persona,
      alternative branches, and negative tests that prove stalls are detected.
- [ ] Remove post-prestige compulsory operations; preserve optional playstyles.
- [ ] Enforce the same purchase requirements in manual, bulk, and automatic paths.
- [ ] Unify production, consumption, caps, affordability estimates, and previews.
- [ ] Add consumer controls, reserves, queued goals, and visible recovery routes.
- [ ] Make active/background/offline simulation consistent; protect unattended play.
- [ ] Add validated saves, rotating backups, recovery, and current-state export.
- [ ] Strengthen signature upgrades and repeatable milestones.
- [ ] Add permanent Archive, remembered plans, distinct doctrine research,
      deterministic relic crafting, reconstruction projects, and optional challenges.
- [ ] Add prestige reward selection before the new run and accurate reset previews.
- [ ] Make operation choices affect later production and defenses; queue commissions.
- [ ] Preserve narrative history and landmarks between cycles.
- [ ] Improve the opening scene, readable decision cards, navigation, touch,
      keyboard access, and reduced-motion support.
- [ ] Add ambient music and independent audio controls.
- [ ] Move automatic visual rewards into simulation and profile/render efficiently.
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
