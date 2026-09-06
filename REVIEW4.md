# Decision loop revision

Baseline: `56b5af493ac8d1e9ab6ec505570906f468c7bac2`. All before/after results below use the same seeds and attention schedules. These are automated policy estimates, not human judgments of enjoyment.

## Changed behavior

- Gathering, ordinary upgrades (including the forty signature production milestones), and linear research including breakthroughs proceed automatically at real cost from Era 1 through Era 10. Chapter review still controls first-civilization departures.
- Growth puts workshops first; research puts labs first. Both compete for the same resources and respect ready queued commitments. The choice can be reversed and survives saves, prestige, and saved plans.
- The Council presents each exclusive doctrine and research branch with its alternative, immediate gains and sacrifices, current net income, costs, and inherited consequence where applicable. The default screen no longer recommends one side just because it is affordable.
- A player can commit before funding. Construction supplies prerequisites, then reserves and pays the cost. Unfunded opposing commitments can be replaced; funded choices remain exclusive for that civilization. Automatic development never chooses a new doctrine or research branch.
- Expedition routes are standing assignments. Real supplies and normal risk govern each attempt, including offline. Pause also stops inherited survey drones. A new era clears the route assignment.
- Routine purchases remain inspectable in the full catalog. Discoveries are archived automatically; dismissal is optional.

## Bounded command comparison

Engaged persona, seed 42, two naturally earned cycles, at most two legal gameplay commands per decision window:

| Measure | Before | After |
| --- | ---: | ---: |
| Manual commands | 303 | 89 |
| First civilization | 18m 40s | 14m 00s |
| Second civilization | 10m 00s | 2m 50s |
| Doctrine choices across both | 17 | 18 |
| Chapter reviews | 9 | 9 |
| Rejected commands | 0 | 0 |

Manual commands decreased 70.6%. Navigation is tracked separately in browser journeys. The automatic development model removes approval work; it does not demonstrate that every remaining choice is equally interesting.

## Required eight-persona comparison

| Persona | Seed | Elapsed before → after | Active before → after | Actions before → after | Sessions before → after | Outcome before → after |
| --- | ---: | --- | --- | ---: | ---: | --- |
| newcomer | 424242 | 18m 21s → 15m 01s | 18m 21s → 15m 01s | 116 → 53 | 1 → 1 | Era 10 → 10; target completed |
| newcomer | 42 | 17m 21s → 15m 21s | 17m 21s → 15m 21s | 112 → 54 | 1 → 1 | Era 10 → 10; target completed |
| engaged | 424242 | 15m 41s → 13m 31s | 15m 41s → 13m 31s | 134 → 58 | 1 → 1 | Era 10 → 10; target completed |
| engaged | 42 | 14m 11s → 13m 31s | 14m 11s → 13m 31s | 136 → 56 | 1 → 1 | Era 10 → 10; target completed |
| optimizer | 424242 | 9m 31s → 9m 31s | 9m 31s → 9m 31s | 231 → 57 | 1 → 1 | Era 10 → 10; target completed |
| optimizer | 42 | 7m 31s → 9m 19s | 7m 31s → 9m 19s | 211 → 54 | 1 → 1 | Era 10 → 10; target completed |
| background | 424242 | 26m 01s → 18m 06s | 6m 31s → 4m 36s | 128 → 58 | 14 → 10 | Era 10 → 10; target completed |
| background | 42 | 24m 01s → 18m 01s | 6m 01s → 4m 31s | 126 → 63 | 13 → 10 | Era 10 → 10; target completed |
| check_in | 424242 | 1h 00m 01s → 40m 56s | 6m 01s → 4m 56s | 118 → 51 | 7 → 5 | Era 10 → 10; target completed |
| check_in | 42 | 1h 00m 01s → 40m 06s | 6m 01s → 4m 06s | 118 → 52 | 7 → 5 | Era 10 → 10; target completed |
| offline_returner | 424242 | 12h 00m 01s → 12h 00m 01s | 6m 01s → 6m 01s | 102 → 33 | 4 → 4 | Era 5 → 6; target completed |
| offline_returner | 42 | 12h 00m 01s → 12h 00m 01s | 6m 01s → 6m 01s | 103 → 32 | 4 → 4 | Era 5 → 6; target completed |
| completionist | 424242 | 11m 06s → 11m 31s | 11m 06s → 11m 31s | 173 → 58 | 1 → 1 | Era 10 → 10; target completed |
| completionist | 42 | 11m 06s → 10m 46s | 11m 06s → 10m 46s | 165 → 55 | 1 → 1 | Era 10 → 10; target completed |
| minimalist | 424242 | 55m 01s → 34m 31s | 55m 01s → 34m 31s | 99 → 55 | 1 → 1 | Era 10 → 10; target completed |
| minimalist | 42 | 53m 01s → 43m 01s | 53m 01s → 43m 01s | 101 → 54 | 1 → 1 | Era 10 → 10; target completed |

The offline-returner comparison uses the pre-existing shorter target. The separate bounded journey suite completes two full cycles for that persona on both seeds.

Regressions: optimizer seed 42 takes 108s more active/elapsed time; completionist seed 424242 takes 25s more. Automatic five-second spending and changed purchase order can lose to rapid manual optimization even while eliminating 157 and 115 actions respectively. No tested persona loses its target, collapses in the final siege, or performs a manual action while absent. No new participation requirement was added.

The legacy balance minimums now allow newcomers to finish in 14 minutes (previously 15) and background players in 15 minutes (previously 20): removing command-gated waits intentionally shortens those runs. Existing maximum times, absence limits, required sessions, operation participation and completion checks remain. The optimizer must now finish with zero manual gathers. The legacy forge policy tries its first affordable key at a real attention window, avoiding a test-only 30-second alignment that could skip the operation before a faster economic finish. The checked-in baseline is unchanged.

## Verification

- 444 unit/regression tests, including limited-funds spending competition, goal reserves and replacement, automatic opening progression, exclusive-choice protection in all ten eras, save migration, inherited policy, and offline expedition pause/costs.
- Four-seed balance matrix and required eight-persona impact comparison.
- Sixteen bounded two-cycle journeys and 46 adverse-policy journeys, including research priority, reverse/random branches, bad luck, manual development, inefficient spending, and skipped operations.
- Ten-prestige stress on both seeds; existing 22-cycle legacy tests remain in the unit suite.
- Required GitHub Actions browser matrix: natural desktop/mobile two-cycle journeys, operation/prestige coverage, and seven viewport sizes in all ten eras. Native wheel/touch/keyboard checks preserve the scrolling regression; new coordinate-click checks cover policy selection, replacement of a queued doctrine, expedition assignment, and reload persistence.
- Production build and asset budgets.

Browser and deployment results are attached to the commit’s GitHub Actions run.
