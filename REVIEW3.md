# Ten-era experience implementation

Starting revision: `c3df40b`. Scope: the complete September 6 plan, all ten eras. Human playtesting is not a delivery gate, as requested.

## Batch 1 — one objective and a usable play surface

A shared engine objective now drives era guidance, suggested purchases, upgrade ranking, and the focused resource strip. Every era has an authored problem and consequence. Desktop uses bounded world/action panes; mobile keeps objectives and relevant resources visible with explicit world/action navigation. Expeditions and orbital contracts use the same Operations tab as later systems. Early onboarding follows earned milestones.

Validation: 425 existing unit tests passed; production build passed. New objective tests cover legal purchases across all ten eras and foundation blockers despite purchased breakthroughs. Natural browser navigation was updated for the two mobile surfaces. Cloud Browser cannot reach this container’s localhost; hosted browser validation follows pushes.

All sixteen impact results are unchanged. Times are simulated seconds; active measures presence. The legacy offline target is an early-era calibration, while separate bounded journeys cover complete cycles.

| Persona | Seed | Elapsed before → after | Active before → after | Actions before → after | Sessions before → after | Outcome |
|---|---:|---:|---:|---:|---:|---|
| newcomer | 424242 | 1121 → 1121 | 1121 → 1121 | 107 → 107 | 1 → 1 | Era 10; target 10; complete |
| engaged | 424242 | 941 → 941 | 941 → 941 | 127 → 127 | 1 → 1 | Era 10; target 10; complete |
| optimizer | 424242 | 577 → 577 | 577 → 577 | 222 → 222 | 1 → 1 | Era 10; target 10; complete |
| background | 424242 | 1441 → 1441 | 361 → 361 | 116 → 116 | 13 → 13 | Era 10; target 10; complete |
| check_in | 424242 | 3601 → 3601 | 361 → 361 | 109 → 109 | 7 → 7 | Era 10; target 10; complete |
| offline_returner | 424242 | 43201 → 43201 | 361 → 361 | 98 → 98 | 4 → 4 | Era 5; target 4; complete |
| completionist | 424242 | 666 → 666 | 666 → 666 | 164 → 164 | 1 → 1 | Era 10; target 10; complete |
| minimalist | 424242 | 3781 → 3781 | 3781 → 3781 | 88 → 88 | 1 → 1 | Era 10; target 10; complete |
| newcomer | 42 | 1061 → 1061 | 1061 → 1061 | 106 → 106 | 1 → 1 | Era 10; target 10; complete |
| engaged | 42 | 821 → 821 | 821 → 821 | 127 → 127 | 1 → 1 | Era 10; target 10; complete |
| optimizer | 42 | 457 → 457 | 457 → 457 | 205 → 205 | 1 → 1 | Era 10; target 10; complete |
| background | 42 | 1441 → 1441 | 361 → 361 | 114 → 114 | 13 → 13 | Era 10; target 10; complete |
| check_in | 42 | 3601 → 3601 | 361 → 361 | 109 → 109 | 7 → 7 | Era 10; target 10; complete |
| offline_returner | 42 | 43201 → 43201 | 361 → 361 | 99 → 99 | 4 → 4 | Era 5; target 4; complete |
| completionist | 42 | 696 → 696 | 696 → 696 | 157 → 157 | 1 → 1 | Era 10; target 10; complete |
| minimalist | 42 | 3391 → 3391 | 3391 → 3391 | 86 → 86 | 1 → 1 | Era 10; target 10; complete |

No progression failures, collapse, timing regressions, or absent-player actions.

## Batch 2 — choices, chapters, and inheritance

All twenty existing forks now have authored future consequences across ten eras, including alternative supply chains, later production, construction efficiency, forge costs/charges, and inheritance. The first civilization offers an earned Continue at each breakthrough; later cycles advance automatically by default. Legacy saves keep automatic transitions. Economic operations remain optional. Interstellar public works cost 650,000 research, down from 1,000,000; previously completed works require 25% fewer supplies next cycle.

The Archive records actual choices with stable discovery IDs, dependencies and persistent read state. Later civilizations recognize those choices. Prestige restores a working settlement (+2 base production and 25% base storage for four early resources), automatic gathering, branch rewards, and an exact branch inheritance preview. Existing prestige perks add to this settlement. Ending text now acknowledges actual unlocks and reconstructed or defended memories.

Validation: 435 unit tests passed, lint/build passed; all sixteen bounded journeys completed two cycles before the additional remembered-public-works discount. First comparison: no stalls, collapses, or actions while absent. Continue adds up to nine intentional decisions; branch changes also affect the subsequent purchase sequence. The one engaged seed taking 30 seconds longer is an intentional first-encounter tradeoff, not a new wait gate. The minimalist improves 3–4 minutes. First-batch CI passed both natural browser journeys and all engine gates; operation fixtures exposed relocated docking navigation and a mobile header overflow, both corrected here.

All values below are seconds or counts; the offline legacy persona targets an earlier era, distinct from the two-cycle journeys.

| Persona | Seed | Elapsed before → after | Active before → after | Actions before → after | Sessions before → after | Outcome before → after |
|---|---:|---:|---:|---:|---:|---|
| newcomer | 424242 | 1121 → 1101 | 1121 → 1101 | 107 → 116 | 1 → 1 | Era 10 → 10 |
| engaged | 424242 | 941 → 941 | 941 → 941 | 127 → 134 | 1 → 1 | Era 10 → 10 |
| optimizer | 424242 | 577 → 571 | 577 → 571 | 222 → 231 | 1 → 1 | Era 10 → 10 |
| background | 424242 | 1441 → 1441 | 361 → 361 | 116 → 124 | 13 → 13 | Era 10 → 10 |
| check_in | 424242 | 3601 → 3601 | 361 → 361 | 109 → 118 | 7 → 7 | Era 10 → 10 |
| offline_returner | 424242 | 43201 → 43201 | 361 → 361 | 98 → 102 | 4 → 4 | Era 5 → 5 |
| completionist | 424242 | 666 → 666 | 666 → 666 | 164 → 174 | 1 → 1 | Era 10 → 10 |
| minimalist | 424242 | 3781 → 3541 | 3781 → 3541 | 88 → 98 | 1 → 1 | Era 10 → 10 |
| newcomer | 42 | 1061 → 1041 | 1061 → 1041 | 106 → 112 | 1 → 1 | Era 10 → 10 |
| engaged | 42 | 821 → 851 | 821 → 851 | 127 → 139 | 1 → 1 | Era 10 → 10 |
| optimizer | 42 | 457 → 451 | 457 → 451 | 205 → 213 | 1 → 1 | Era 10 → 10 |
| background | 42 | 1441 → 1441 | 361 → 361 | 114 → 126 | 13 → 13 | Era 10 → 10 |
| check_in | 42 | 3601 → 3601 | 361 → 361 | 109 → 118 | 7 → 7 | Era 10 → 10 |
| offline_returner | 42 | 43201 → 43201 | 361 → 361 | 99 → 103 | 4 → 4 | Era 5 → 5 |
| completionist | 42 | 696 → 666 | 696 → 666 | 157 → 165 | 1 → 1 | Era 10 → 10 |
| minimalist | 42 | 3391 → 3211 | 3391 → 3211 | 86 → 103 | 1 → 1 | Era 10 → 10 |
