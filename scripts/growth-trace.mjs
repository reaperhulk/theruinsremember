#!/usr/bin/env node
// Traces one persona's production every 30 minutes: era, growth per half
// hour, global multiplier, achievements, pending memories and top buildings.
//   node scripts/growth-trace.mjs [persona]
import { PERSONAS } from './sim/personas.js';
import { decide, seededRng } from './sim/player.js';
import * as e from '../src/game/engine.js';
import { BUILDINGS } from '../src/game/data.js';
const p = PERSONAS[process.argv[2] || 'engaged']; const rng = seededRng(1);
let s = e.createState(0); const c = { actions: 0, purchases: 0 }; let prev = 0;
for (let t = 0; t <= 8 * 3600; t++) {
  s = e.click(s, p.cps); if (s.echo.active && rng() < p.echoChance) s = e.catchEcho(s, rng).state;
  if (t % p.decisionEvery === 0) s = decide(s, p, c);
  s = e.tick(s, 1, rng);
  if (t % 1800 === 0 && t) {
    const sps = e.getBaseSps(s);
    const top = BUILDINGS.map(b => [b.id, s.buildings[b.id] || 0, (s.buildings[b.id] || 0) * e.getBuildingUnitSps(s, b.id) / sps]).filter(x => x[1]).sort((a, b) => b[2] - a[2]).slice(0, 3).map(([id, n, f]) => `${id}×${n} ${(f * 100).toFixed(0)}%`).join(', ');
    console.log(`${(t / 3600).toFixed(1)}h era ${s.era} sps ${sps.toExponential(2)} ×${(sps / prev).toFixed(2)}/30m global ×${e.getGlobalMultiplier(s).toFixed(2)} ach ${Object.keys(s.achievements).length} upg ${Object.keys(s.upgrades).length} pending mem ${e.getPendingMemories(s)} | ${top}`);
    prev = sps;
  }
}
