# Soundtrack revision

The faint sustained ambient loop is replaced by an original instrumental score for all ten eras. Each named theme has a tempo, harmonic progression, melody, bass, and instrumentation. The 32-bar arrangement develops through a theme, variation, quieter passage, and return. Later civilizations add a light arpeggio layer; Era 10 recalls the opening theme.

The header exposes Music play/pause with the actual playback state. Preferences shows the theme name, independent music/effects sliders with percentages, and a master mute. Existing saved volumes and mute choices are retained; new players start at 45% music. A click or keypress unlocks browser playback. Pausing survives reloads; background tabs stop scheduling voices and resume when visible. Short fades, a 24-voice music limit, soft low-pass filtering, reverb, and compression keep output bounded. Music uses its own clock and does not touch simulation time or game randomness. No external audio requests or new runtime dependencies are needed.

## Verification

Local lint, all 451 unit tests, the four-seed balance matrix, persona impact gate, production build, and asset budgets passed. Total compressed JavaScript/CSS is 302,077 bytes, within the existing 350,000-byte budget.

The browser experience deployment gate now checks first-click audibility, pause/resume, zero-volume recovery, separate effects/music controls, master mute, persisted preferences, and background suspension/recovery. It checks the open controls at 360, 390, and 1366 pixels. All ten themes are rendered to actual PCM through the production instruments, with RMS/peak checks for audible, finite, unclipped output. The uploaded experience diagnostics include the measurements, a 28-second opening-theme WAV, and control screenshots. Existing native wheel, touch, and keyboard scrolling checks still cover all ten eras at seven viewport sizes. Deployment also requires the existing natural desktop/mobile two-cycle journeys and operation fixtures.

## Required before/after persona impact

The temporary baseline was captured from `a629f28` before this batch. Identical seeds 424242 and 42 were run after the audio/UI changes. Times below are seconds; actions count the historical balance harness's manual decisions. The checked-in calibration baseline is unchanged.

| Persona | Seed | Elapsed before → after (s) | Active before → after (s) | Actions before → after | Sessions before → after | Outcome before → after |
|---|---:|---:|---:|---:|---:|---|
| newcomer | 424242 | 841 → 841 | 841 → 841 | 50 → 50 | 1 → 1 | Era 10, cycle ready → same |
| newcomer | 42 | 821 → 821 | 821 → 821 | 49 → 49 | 1 → 1 | Era 10, cycle ready → same |
| engaged | 424242 | 661 → 661 | 661 → 661 | 50 → 50 | 1 → 1 | Era 10, cycle ready → same |
| engaged | 42 | 691 → 691 | 691 → 691 | 50 → 50 | 1 → 1 | Era 10, cycle ready → same |
| optimizer | 424242 | 703 → 703 | 703 → 703 | 51 → 51 | 1 → 1 | Era 10, cycle ready → same |
| optimizer | 42 | 573 → 573 | 573 → 573 | 52 → 52 | 1 → 1 | Era 10, cycle ready → same |
| background | 424242 | 1081 → 1081 | 271 → 271 | 58 → 58 | 10 → 10 | Era 10, cycle ready → same |
| background | 42 | 1081 → 1081 | 271 → 271 | 57 → 57 | 10 → 10 | Era 10, cycle ready → same |
| check_in | 424242 | 2431 → 2431 | 271 → 271 | 57 → 57 | 5 → 5 | Era 10, cycle ready → same |
| check_in | 42 | 2431 → 2431 | 271 → 271 | 58 → 58 | 5 → 5 | Era 10, cycle ready → same |
| offline_returner | 424242 | 43201 → 43201 | 361 → 361 | 31 → 31 | 4 → 4 | Era 6 target complete → same |
| offline_returner | 42 | 43201 → 43201 | 361 → 361 | 30 → 30 | 4 → 4 | Era 6 target complete → same |
| completionist | 424242 | 581 → 581 | 581 → 581 | 51 → 51 | 1 → 1 | Era 10, cycle ready → same |
| completionist | 42 | 716 → 716 | 716 → 716 | 55 → 55 | 1 → 1 | Era 10, cycle ready → same |
| minimalist | 424242 | 3331 → 3331 | 3331 → 3331 | 45 → 45 | 1 → 1 | Era 10, cycle ready → same |
| minimalist | 42 | 2251 → 2251 | 2251 → 2251 | 44 → 44 | 1 → 1 | Era 10, cycle ready → same |

All 16 comparisons are identical in elapsed time, attention, actions, sessions, and progression. There are no new stalls, forced participation, siege collapses, or actions while absent. The offline-returner calibration scenario intentionally reaches Era 6 against its Era 4 target; the separate bounded-journey gate covers its complete cycles. Audio remains optional.

## Browser runner correction

The first CI run passed actual first-click output, pause/resume, volume, mute, and preference reload checks, then timed out waiting for a background tab. The old headless-shell executable does not apply the full browser's tab visibility behavior. The experience suite now installs and uses full Chrome, consistent with [Puppeteer's documented distinction between the two modes](https://pptr.dev/guides/headless-modes). The production audio code and all assertions are retained. This runner-only follow-up uses the verified post-audio snapshot as its baseline; all 16 before/after rows above apply again with identical values.

Full Chrome passed 82 experience checks. All ten rendered tracks measured RMS 0.049–0.055 at the default volume, with peak amplitude below 0.244. The live player peaked at 18 simultaneous voices including effects; there were no page errors. Reviewing the screenshots revealed that Chrome had restored the Preferences disclosure open after reload, so the screenshot loop toggled it closed and incorrectly accepted its zero-size rectangle. A second test correction explicitly opens the panel and requires nonzero dimensions and hit-test access to every input, select, and button. This test-only correction again uses the verified post-audio snapshot; the same 16 before/after rows apply with no changed metrics.

That stricter check caught a real 360-pixel clipping problem: an older mobile `.header-controls { overflow-x: auto }` rule also clipped the absolutely positioned volume panel vertically. The current wrapping header now explicitly uses visible overflow so its menus can extend over the game. The same native hit-test assertions remain required. The pre-fix snapshot and post-fix comparison again produce the identical 16 persona rows above; no engine files or calibration baselines changed.

The control check also waits for two rendered frames after resizing, then confirms the disclosure's actual `open` state before measuring. A nonzero rectangle alone does not establish that native details content is painted. Failure diagnostics now identify the element intercepting each control. This test-only refinement was compared against the same verified pre-change engine snapshot, with the same unchanged 16 rows.
