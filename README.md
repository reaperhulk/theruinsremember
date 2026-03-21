# The Ruins Remember

An incremental/idle game about the last survivors of humanity crash-landing on a new planet and rebuilding civilization from scratch — only to discover that someone has done all of this before.

## The Story

Survivors of the Great Collapse establish humanity's last hope on an untamed world. As they build, they find strange metal in the soil. Geometric patterns in the bedrock. Foundations laid in perfect rows beneath millennia of dirt. The ruins are too precise, too familiar.

Across 10 eras — from Planetfall through Industrialization, the Digital Age, the Space Age, and beyond to the Multiverse — the player uncovers a single terrible truth: every civilization reaches this point. Every civilization builds these same things. Every civilization falls.

Prestige isn't just a mechanic. It's the cycle itself.

## How It Works

- **10 Eras** spanning primitive survival to multiverse exploration
- **560+ upgrades** forming deep prerequisite chains with meaningful branching choices
- **110 tech nodes** including mutually exclusive paths that shape each run differently
- **7 mini-games** (mining, factory management, hacking, orbital docking, colony management, star charting, reality weaving)
- **30 prestige upgrades** including 5 "Ascension" tier endgame upgrades
- **280+ achievements** tracking everything from speed milestones to narrative discovery
- **350+ random events** with lore discoveries threaded throughout
- **A canvas that reflects your progress** — buildings appear as you buy upgrades, production intensity glows, weather changes, bonus orbs spawn for active players
- **Resource caps that matter** — storage is a real constraint requiring strategic cap upgrades
- **Consumption chains** — food feeds labor, energy powers electronics, fuel maintains orbital infrastructure, exotic materials sustain colonies
- **Automation cascades** — earlier eras auto-manage as you progress, shifting your focus to new challenges
- **A narrative Codex** collecting lore fragments that piece together the story of the cycle

## The Experiment

This game was built entirely by an AI agent ([Claude Code](https://docs.anthropic.com/en/docs/claude-code)). No human wrote any of the code. The human's role was limited to:

- Describing the initial concept and iteration plan
- Playtesting and providing feedback ("the end of era 4 takes too long", "upgrades feel pointless", "the canvas should be more relevant")
- Asking for research ("look on the internet for how best to balance incrementals")
- Requesting iterations ("do it again", "200 more iterations")
- Naming the game

Everything else — architecture, engine design, data balancing, CSS, canvas rendering, story writing, bug fixing, performance optimization, accessibility — was designed and implemented by the agent across 230+ commits and hundreds of iterative improvement cycles.

The agent researched incremental game design best practices (drawing from Cookie Clicker, Antimatter Dimensions, A Dark Room, Trimps, Synergism, and others), audited its own work repeatedly, simulated playthroughs to find dead spots, and fixed its own bugs.

## Running Locally

```bash
npm install
npm run dev
```

## Tech Stack

- React + Vite
- Pure engine functions (no side effects, deterministic)
- Vitest for testing (197 tests)
- HTML5 Canvas for animated scene
- No external dependencies beyond React and Vite

## License

BSD 2-Clause. See [LICENSE](LICENSE).
