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

## How It Works

- **10 Eras** spanning primitive survival to multiverse exploration
- **599 upgrades** forming deep prerequisite chains with 10 mutually exclusive doctrine forks
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
- **Resource caps that matter** — storage is a real constraint requiring strategic cap upgrades
- **Consumption chains** — food feeds labor, energy powers electronics, fuel maintains orbital infrastructure, exotic materials sustain colonies
- **Automation cascades** — gathering, routine research, earlier eras, repeatable-upgrade milestones, orbital crews, colonies, and reserve routes become self-managing while exclusive choices and breakthroughs remain yours
- **A final siege against the Forgetting** that freezes destructive timers while you are offline and cannot end an unattended cycle
- **A narrative Chronicle** collecting lore fragments, recovered signals, and codex discoveries that piece together the story of the cycle
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
node scripts/balance-matrix.mjs --seeds 424242,1,42,1337
```

Browser smoke tests:

```bash
npm run dev -- --host 127.0.0.1
node scripts/browser-test.mjs --prestige 3
node scripts/browser-test.mjs --mobile
```

The browser suite reloads real legacy and offline saves, checks automation controls,
advances naturally from a fresh run through Era 7, and then validates late-game
strategic decisions using isolated fixtures. It exercises orbital crew training,
colony mandates, standing trade routes, star-network directives, relic choices,
Dyson commissions, government acts, reality laws, signal locks, the Forgetting
siege, all three cycle doctrines, and prestige. Desktop and mobile runs fail on
progression misses, console errors, or viewport overflow.

The balance harness validates six scenarios across four deterministic seeds:

- `full` for optimal completion pacing
- `casual` for a normal active run
- `lowInteraction` for low-interaction viability
- `passive` for mostly idle viability
- `descent` for pressure during the final siege
- `prestige3` for repeated-cycle milestones

The legacy profiles remain intact as stable economic baselines. A separate
attention-aware matrix tests eight additional player personas across two seeds:

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

The extended stress gate also validates ten prestiges across two seeds. Every pull
request and push to `main` runs lint, 357 unit tests, all 24 legacy balance
scenarios, 16 attention-aware persona scenarios, the prestige stress matrix, a
production build, and desktop/mobile browser journeys before GitHub Pages deployment
is allowed.

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
