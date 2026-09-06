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

## Batch 3 — a visible, responsive remembered world

The canvas is split into ten named scene modules and shared rendering services. Actual branch choices appear as solid current landmarks or outlined inherited landmarks, with an accessible HTML ledger. World status reports construction and constrained supplies. Low-power rendering, elapsed-time particles, cached star geometry and shared economy previews reduce repeated work. Recommended affordable purchases are available directly in the persistent objective. Relic replacements show the effects and combinations lost or gained.

Ten score arrangements share a recurring memory motif; later civilizations change its register and shape. Discovery, commitment and construction cues have separate identities and rate limits. Web Audio voices disconnect when finished; both buses respect mute and hidden tabs.

Foreground acceleration and offline catch-up use a six-millisecond slice budget while preserving one-second engine ordering. Offline progress is visible between yields. Web Locks give one tab ownership of simulation and saves; a storage-change guard catches older clients. Backups/import validation remain intact.

Experience diagnostics separate strategic choices, routine commands, chapter reviews and automatic purchases. Browser journeys record navigation and scrolling; a new fixture suite covers 360×800, 390×844, 768×1024, 1366×768, 1440×900, landscape 844×390 and a 683×384 zoom-equivalent viewport in Eras 1, 4, 7 and 10. It also checks keyboard navigation, reduced motion, audio startup and competing tabs. A local civilization-record export is available in Stats. Production asset limits are now checked in CI (1.2 MB JavaScript, 100 KB CSS, 350 KB combined gzip). Measured build before the small relic presentation addition: 1,013,631 JS bytes, 62,176 CSS bytes and 295,107 gzip bytes.

Validation: 437 unit tests passed, including differential catch-up tests in four eras and cancellation. Lint, build and asset checks passed. The previous commit passed all four existing browser jobs. Its adversarial manual-build/minimalist seed 42 found an energy-starvation issue caused by automatically rerouting orbital supplies. Forks now unlock explicit, reversible route selections in World. That failing two-cycle case now passes without changing its budget or the checked-in baseline.

Persona impact: all sixteen progression and absence invariants pass. The route correction costs background seed 424242 one extra session (+120 elapsed seconds, +30 active seconds, +4 actions); keeping resource-routing consent avoids the demonstrated manual-build stall. The minimalist improves another 30–240 seconds. No forced operations, siege collapses or actions during absences were introduced.

| Persona | Seed | Elapsed before → after | Active before → after | Actions before → after | Sessions before → after | Outcome before → after |
|---|---:|---:|---:|---:|---:|---|
| newcomer | 424242 | 1101 → 1101 | 1101 → 1101 | 116 → 116 | 1 → 1 | Era 10 → 10 |
| engaged | 424242 | 941 → 941 | 941 → 941 | 134 → 134 | 1 → 1 | Era 10 → 10 |
| optimizer | 424242 | 571 → 571 | 571 → 571 | 231 → 231 | 1 → 1 | Era 10 → 10 |
| background | 424242 | 1441 → 1561 | 361 → 391 | 124 → 128 | 13 → 14 | Era 10 → 10 |
| check_in | 424242 | 3601 → 3601 | 361 → 361 | 118 → 118 | 7 → 7 | Era 10 → 10 |
| offline_returner | 424242 | 43201 → 43201 | 361 → 361 | 102 → 102 | 4 → 4 | Era 5 → 5 |
| completionist | 424242 | 666 → 666 | 666 → 666 | 174 → 173 | 1 → 1 | Era 10 → 10 |
| minimalist | 424242 | 3541 → 3301 | 3541 → 3301 | 98 → 99 | 1 → 1 | Era 10 → 10 |
| newcomer | 42 | 1041 → 1041 | 1041 → 1041 | 112 → 112 | 1 → 1 | Era 10 → 10 |
| engaged | 42 | 851 → 851 | 851 → 851 | 139 → 136 | 1 → 1 | Era 10 → 10 |
| optimizer | 42 | 451 → 451 | 451 → 451 | 213 → 211 | 1 → 1 | Era 10 → 10 |
| background | 42 | 1441 → 1441 | 361 → 361 | 126 → 126 | 13 → 13 | Era 10 → 10 |
| check_in | 42 | 3601 → 3601 | 361 → 361 | 118 → 118 | 7 → 7 | Era 10 → 10 |
| offline_returner | 42 | 43201 → 43201 | 361 → 361 | 103 → 103 | 4 → 4 | Era 5 → 5 |
| completionist | 42 | 666 → 666 | 666 → 666 | 165 → 165 | 1 → 1 | Era 10 → 10 |
| minimalist | 42 | 3211 → 3181 | 3211 → 3181 | 103 → 101 | 1 → 1 | Era 10 → 10 |

## Batch 4 — browser startup ownership correction

The expanded browser gate exposed a development-mode race: React’s setup/cleanup/setup cycle could make an immediate Web Lock request mistake its own previous request for another tab. Acquisition now queues briefly with an abortable request, and cleanup cancels pending acquisition. A real competing tab still receives a read-only message. The failing browser artifact contained no JavaScript errors and visibly showed the incorrect other-tab warning.

The engine quality gate, all 16 two-cycle journeys, all adversarial journeys, and both ten-prestige stress runs pass. Lint/build pass for this correction. The following direct comparison confirms that startup ownership does not change any persona timing, attention, actions, sessions or outcome. Browser results remain a required CI gate on this commit.

| Persona | Seed | Elapsed before → after | Active before → after | Actions before → after | Sessions before → after | Outcome before → after |
|---|---:|---:|---:|---:|---:|---|
| newcomer | 424242 | 1101 → 1101 | 1101 → 1101 | 116 → 116 | 1 → 1 | Era 10 → 10 |
| engaged | 424242 | 941 → 941 | 941 → 941 | 134 → 134 | 1 → 1 | Era 10 → 10 |
| optimizer | 424242 | 571 → 571 | 571 → 571 | 231 → 231 | 1 → 1 | Era 10 → 10 |
| background | 424242 | 1561 → 1561 | 391 → 391 | 128 → 128 | 14 → 14 | Era 10 → 10 |
| check_in | 424242 | 3601 → 3601 | 361 → 361 | 118 → 118 | 7 → 7 | Era 10 → 10 |
| offline_returner | 424242 | 43201 → 43201 | 361 → 361 | 102 → 102 | 4 → 4 | Era 5 → 5 |
| completionist | 424242 | 666 → 666 | 666 → 666 | 173 → 173 | 1 → 1 | Era 10 → 10 |
| minimalist | 424242 | 3301 → 3301 | 3301 → 3301 | 99 → 99 | 1 → 1 | Era 10 → 10 |
| newcomer | 42 | 1041 → 1041 | 1041 → 1041 | 112 → 112 | 1 → 1 | Era 10 → 10 |
| engaged | 42 | 851 → 851 | 851 → 851 | 136 → 136 | 1 → 1 | Era 10 → 10 |
| optimizer | 42 | 451 → 451 | 451 → 451 | 211 → 211 | 1 → 1 | Era 10 → 10 |
| background | 42 | 1441 → 1441 | 361 → 361 | 126 → 126 | 13 → 13 | Era 10 → 10 |
| check_in | 42 | 3601 → 3601 | 361 → 361 | 118 → 118 | 7 → 7 | Era 10 → 10 |
| offline_returner | 42 | 43201 → 43201 | 361 → 361 | 103 → 103 | 4 → 4 | Era 5 → 5 |
| completionist | 42 | 666 → 666 | 666 → 666 | 165 → 165 | 1 → 1 | Era 10 → 10 |
| minimalist | 42 | 3181 → 3181 | 3181 → 3181 | 101 → 101 | 1 → 1 | Era 10 → 10 |

Human comprehension, listening fatigue and response latency on physical mobile devices remain unmeasured. No human playtesting was used as a stopping gate. Automated completion is evidence of reachability, not a claim that those human-experience targets have been measured.
