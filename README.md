<p align="center">
  <img src="logo.png" alt="The Ruins Remember" width="400" />
</p>

<h1 align="center">The Ruins Remember</h1>

<p align="center">
  <strong><a href="https://langui.sh/theruinsremember">Play it now</a></strong>
</p>

An incremental/idle game about the last survivors of humanity crash-landing on a new planet and rebuilding civilization from scratch — only to discover that someone has done all of this before.

## The Story

Survivors of the Great Collapse establish humanity's last hope on an untamed world. As they build, they find strange metal in the soil. Geometric patterns in the bedrock. Foundations laid in perfect rows beneath millennia of dirt. The ruins are too precise, too familiar.

Across 10 eras — from Planetfall through Industrialization, the Digital Age, the Space Age, and beyond to the Multiverse — the player uncovers a single terrible truth: every civilization reaches this point. Every civilization builds these same things. Every civilization falls.

Prestige isn't just a mechanic. It's the cycle itself.

## What your civilization leaves behind

Every era now has an authored chapter and two strategic branches with consequences for later production, operations or inheritance. A shared objective keeps the next useful action visible on desktop and mobile. Your first civilization waits for **Continue** at each earned breakthrough; transition preferences are available in Prestige.

The next civilization recognizes your actual choices. Prestige restores a producing settlement and automatic gathering, while the Archive keeps discoveries, read state, plans and landmarks. World view shows inherited structures, constrained production and optional supply routes. Preferences include a ten-era adaptive score and low-power rendering. Offline progress yields between short processing slices, and only one browser tab can own the save at a time.

Implementation details and all eight personas’ before/after measurements are in [the ten-era delivery report](REVIEW3.md), [the decision-loop revision](REVIEW4.md), and [the construction and supply-route revision](REVIEW5.md).

## How It Works

- **10 Eras** spanning primitive survival to multiverse exploration
- **60 substantial construction projects — six per era**, replacing 564 small production purchases. Each project adds its combined capability at once, previews the production gain, and can be prioritized or funded automatically. Existing saves retain credit for previously built works
- **Optional supply-route puzzles in all ten eras**: draw a path around rubble within 12 steps, taking detours for bonus cargo. Success funds 20–40% of a waiting project's missing supplies, subject to storage capacity. Pause/resume at any time; ordinary progress never requires playing
- **Competing spending priorities and ten paired doctrine choices**, with automatic research, production previews, and optional ×1.5 infrastructure milestones every ten levels
- **Standing expedition assignments**: choose the risk and reward once per early era; the team uses real supplies while you focus elsewhere, including offline
- **115 tech nodes** including mutually exclusive paths that shape each run differently
- **Era-focused operations** that evolve from ruin expeditions into orbital missions, colony mandates, star-network directives, Dyson commissions, cycle laws, galactic government, cosmic signal locks, and the Reality Forge
- **Distinct cycle doctrines** that reshape early, middle, or late eras and award permanent cycle marks for doctrine-specific goals
- **Reality keys with different identities**: faster expeditions, larger storage, stronger operation rewards, or seeded starting resources
- **Recovered Relics** with guaranteed Echo Pressure offers and a two-slot, run-only loadout that dissolves at prestige
- **Finite orbital contracts** with three initial docking decisions before trained crews handle later assignments automatically
- **Self-running colony mandates and standing trade routes** that turn one strategic choice into ongoing staffing and resource exchanges
- **Finite Dyson commissions** that turn thirty assembly clicks into three module choices before automation takes over
- **32 prestige upgrades** including 5 "Ascension" tier endgame upgrades
- **254 reachable achievements** tracking everything from speed milestones to narrative discovery
- **A canvas that reflects your progress** — buildings appear as you buy upgrades, production intensity glows, weather changes, bonus orbs spawn for active players
- **Progression-gated era advancement** — new eras require sufficient upgrade depth, era-local research depth, and the starred breakthrough technology instead of passive waiting
- **Recoverable resource bottlenecks** — expand storage without prerequisite chains, pause consumers, hold reserves, and queue a goal
- **Consumption chains** — food feeds labor, energy powers electronics, fuel maintains orbital infrastructure, exotic materials sustain colonies
- **Automation cascades** — gathering, linear research, construction, repeatable-upgrade milestones, orbital crews, colonies, and reserve routes become self-managing while exclusive choices and chapter departures remain yours
- **An optional siege against the Forgetting** with protected offline timers and retreat; defeat never forces a reset
- **A permanent Archive** that preserves narrative history and saved plans after the first prestige; the second opens doctrine research and exact relic crafting, and the third starts reconstruction projects across cycles
- **Prestige reward planning** that spends newly earned points before starting perks are applied
- **Validated saves and rotating backups**, current-state export, and visible recovery controls
- **Era illustrations from Planetfall** and ambient music with independent music/effects controls
- **A run-director UI layer** that explains what is blocking the next breakthrough instead of leaving progression hidden in raw numbers

## The Experiment

This game was built entirely through AI coding agents, primarily [Claude Code](https://docs.anthropic.com/en/docs/claude-code) and Codex. No human wrote any of the code directly. The human's role was limited to:

- Describing the initial concept and iteration plan
- Playtesting and providing feedback ("the end of era 4 takes too long", "upgrades feel pointless", "the canvas should be more relevant")
- Asking for research ("look on the internet for how best to balance incrementals")
- Requesting iterations ("do it again", "200 more iterations")
- Naming the game

Everything else — architecture, engine design, data balancing, CSS, canvas rendering, story writing, bug fixing, performance optimization, accessibility — was designed and implemented by the agent across 300+ commits and hundreds of iterative improvement cycles.

The agent researched incremental game design best practices (drawing from Cookie Clicker, Antimatter Dimensions, A Dark Room, Trimps, Synergism, and others), audited its own work repeatedly, simulated playthroughs to find dead spots, and fixed its own bugs.

The game continues to evolve through automated playtesting and player feedback. If you find something broken or have a suggestion, [file an issue](https://github.com/reaperhulk/theruinsremember/issues).

## Running Locally

```bash
npm install
npm run dev
```

## Testing And Playtesting

Pure logic and save/prestige regression coverage:

```bash
npm run test:unit
```

Complete non-browser quality gate:

```bash
npm run test:quality
```

Balance regression matrix and extended prestige stress tests:

```bash
npm run test:balance
npm run test:balance:stress
npm run test:personas
npm run test:impact
node scripts/balance-matrix.mjs --seeds 424242,1,42,1337
```

Natural UI journeys and isolated operation fixtures:

```bash
npm run dev -- --host 127.0.0.1
node scripts/browser-journey.mjs
node scripts/browser-journey.mjs --mobile
node scripts/browser-test.mjs --prestige 3
node scripts/browser-test.mjs --mobile
```

The natural browser journey earns two complete cycles through visible controls,
including a mid-run reload and a planned prestige reward. It never grants
resources, writes ownership, or injects an era. Failures preserve the final state,
command trace, and screenshot in `test-results/`.

The separate operation fixture suite reloads real legacy and offline saves, checks automation controls,
advances naturally from a fresh run through Era 7, and then validates late-game
strategic decisions using isolated fixtures. It exercises orbital crew training,
colony mandates, standing trade routes, star-network directives, relic choices,
Dyson commissions, government acts, reality laws, signal locks, the Forgetting
siege, all three cycle doctrines, and prestige. Desktop and mobile runs fail on
progression misses, console errors, or viewport overflow.

The balance harness validates eight attention-aware player personas across four
deterministic seeds:

- `newcomer`: first-time decisions every 20 seconds, with an initial reading delay
- `engaged`: continuous play with decisions every 10 seconds
- `optimizer`: experienced, efficient decisions every two seconds
- `background`: the game stays open, with 30-second visits every two minutes
- `check_in`: the game closes between one-minute visits every ten minutes
- `offline_returner`: two-minute visits separated by four-hour offline absences
- `completionist`: deliberate five-second decisions across every optional system
- `minimalist`: economic decisions every 30 seconds while skipping optional operations

Personas cannot purchase upgrades, select research, prestige, or perform other manual
actions while away. Closed-game absences use the same offline siege protection as the
game itself. Reports include sessions, decision windows, active/offline time, manual
actions, and cumulative playtime across prestige resets.

The same four-seed matrix additionally checks final-siege collapse and three-prestige
progression. Extended stress coverage validates ten prestiges across two seeds. Every
pull request and push to `main` runs lint, unit and negative-control tests, all 40
seeded balance scenarios, the original 16-row persona impact comparison, two full
cycles for every bounded persona on both seeds, adversarial playstyles, prestige
stress, a production build, and desktop/mobile browser journeys before deployment.

```bash
npm run test:journeys
npm run test:journeys:adversarial
```

The older balance bot retains its historical calibration role; its helper counts
are not individual player inputs. The bounded journey harness counts individual
commands, and only final-cycle completion can pass. See [IMPLEMENTATION.md](IMPLEMENTATION.md)
for the harness audit, reproduced deadlocks, and each batch’s before/after results.

## Required Before/After Impact For Changes

Every change to this repository must present its before/after effect on all eight
personas using the same seeds. This is especially important for gameplay, progression,
economy, automation, player actions, offline behavior, and balance. Capture the
pre-change state first:

```bash
npm run test:impact -- --capture /tmp/theruinsremember-personas-before.json
```

After making the change, compare against that exact snapshot:

```bash
npm run test:impact -- --baseline /tmp/theruinsremember-personas-before.json
```

Report each persona's elapsed completion time, active attention time, manual actions,
session count, and progression outcome, and explicitly explain material regressions.
The checked-in `scripts/baseline-results.json` provides the default comparison used by
`npm run test:quality`; update it only after an intentional, reviewed baseline change.

## Recent Direction

Recent iteration work focused on:

- Presenting the current era operation prominently while keeping prior systems in an archive
- Replacing repeated actions with finite docking choices, colony mandates, star directives, government acts, cycle laws, and signal locks
- Automating routine research, late gathering, trained orbital crews, settlement staffing, standing trade routes, and repeatable-upgrade milestones without taking strategic choices away
- Preserving legacy Senate and tuning progress while making offline final-siege simulation safe
- Making Reality Forge keys and cycle doctrines materially change the next run
- Measuring repeated actions, relic timing, economic waiting, operation latency, attention/check-in patterns, direct rewards, ignored systems, and cumulative prestige time across multiple seeded playtest profiles

## Tech Stack

- React + Vite
- Pure engine functions (no side effects, deterministic)
- Vitest for testing
- Puppeteer for automated browser testing
- Bot playtest system with seeded scenario assertions for balance verification
- HTML5 Canvas for animated scene
- No external runtime dependencies beyond React and Vite

## License

BSD 2-Clause. See [LICENSE](LICENSE).
