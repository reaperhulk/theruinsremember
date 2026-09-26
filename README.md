<p align="center">
  <img src="logo.png" alt="The Ruins Remember" width="400" />
</p>

<h1 align="center">The Ruins Remember</h1>

<p align="center">
  <strong><a href="https://langui.sh/theruinsremember">Play it now</a></strong>
</p>

A clicker incremental about the last survivors of humanity crash-landing on a new planet and rebuilding civilization from scratch — only to discover that someone has done all of this before.

## The Story

Survivors of the Great Collapse establish humanity's last hope on an untamed world. As they build, they find strange metal in the soil. Geometric patterns in the bedrock. Foundations laid in perfect rows beneath millennia of dirt. The ruins are too precise, too familiar.

Across 10 eras — from Planetfall through Industrialization, the Digital Age, the Space Age, and beyond to the Multiverse — the player uncovers a single terrible truth: every civilization reaches this point. Every civilization builds these same things. Every civilization falls.

Prestige isn't just a mechanic. It's the cycle itself.

## How It Works

- **Dig.** Click the ruins to recover salvage. Nothing digs or buys for you at the start.
- **Build.** Twenty buildings across ten eras, from Scavengers to the Echo of Yourself. Each costs 15% more than the last of its kind, and every one you own keeps working, including while you're away.
- **Improve.** Over 400 upgrades: a boost for every building every few purchases of it, click upgrades that add a share of production to every dig, chronicle and archivist upgrades for each era, and 93 discoveries. A discovery turns up each time a cycle doubles its salvage, with a piece of the story.
- **Catch glimmers.** Every few minutes a memory glimmers in the ruins. Catch it for a cache of salvage, seventy-seven seconds of ×7 production, or thirteen seconds where every dig also recovers ten seconds of production.
- **Reach new eras.** Each era is revealed by how much this civilization has recovered, with its own chapter, scene, music and discoveries.
- **Let the cycle turn.** Everything returns to the ruins, and what you recovered becomes memories. They multiply all production forever (ten memories already make you about 2.6× faster), and buy permanent lessons such as a head start, starting buildings and better offline production. The cycle screen shows how much faster you'll be before you commit.
- **Remember.** After the first cycle the ruins become personal: the camp is where you left it, and the notes are in your handwriting. Build the Echo of Yourself to learn the final truth and choose the message the next civilization will find carved into the ruins.
- **Achievements.** 156 of them, each worth +1% production.

A first cycle takes a few hours of active play. The later eras take many cycles over days, and the Multiverse is a long-term goal.

Players of the original resource-management version begin with bonus memories for how far their civilizations reached. Their old save is left untouched.

## The Experiment

This game was built entirely through AI coding agents, primarily [Claude Code](https://docs.anthropic.com/en/docs/claude-code) and Codex. No human wrote any of the code directly. The human's role was limited to:

- Describing the initial concept and iteration plan
- Playtesting and providing feedback ("the end of era 4 takes too long", "upgrades feel pointless", "the canvas should be more relevant")
- Asking for research ("look on the internet for how best to balance incrementals")
- Requesting iterations ("do it again", "200 more iterations")
- Naming the game

Everything else — architecture, engine design, data balancing, CSS, canvas rendering, story writing, bug fixing, performance optimization, accessibility — was designed and implemented by the agent across 300+ commits and hundreds of iterative improvement cycles.

After those cycles a review found the game had drifted away from its brief. Measured only by simulated players optimizing for fewer actions, it had automated clicking and purchasing away and grown two dozen side systems. It was rebuilt as a clicker on a single-currency engine. The era art, soundtrack and story were kept, and simulated personas now check pacing against explicit targets instead of minimizing input.

The agent researched incremental game design best practices (drawing from Cookie Clicker, Antimatter Dimensions, A Dark Room, Trimps, Synergism, and others), audited its own work repeatedly, simulated playthroughs to find dead spots, and fixed its own bugs.

The game continues to evolve through automated playtesting and player feedback. If you find something broken or have a suggestion, [file an issue](https://github.com/reaperhulk/theruinsremember/issues).

## Running Locally

```bash
npm install
npm run dev
```

## Testing

```bash
npm run test:quality   # lint, unit tests, pacing contract, build, asset budget
npm run test:pacing    # eight simulated personas against the pacing contract
npm run test:browser   # real-input browser smoke test (needs npm run dev running)
```

`scripts/pacing.mjs` simulates eight attention patterns: newcomer, engaged, optimizer, background tab, check-in, offline returner, completionist and minimalist. It reports when each reaches every era and first turns the cycle. Use `--capture` and `--baseline` to compare balance changes before and after on identical seeds.
