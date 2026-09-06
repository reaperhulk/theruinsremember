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
