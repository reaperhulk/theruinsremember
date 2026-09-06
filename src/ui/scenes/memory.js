import { getWorldLandmarks } from '../../engine/world.js';
// A persistent silhouette for each actual branch. Solid = this civilization;
// outlined = inherited. The matching HTML ledger names every landmark.
export function drawWorldMemory(ctx, state, w, h) {
  const landmarks = getWorldLandmarks(state).filter(l => l.choice && l.era <= state.era);
  if (!landmarks.length) return;
  ctx.save();
  ctx.fillStyle = 'rgba(6,17,22,0.85)'; ctx.fillRect(4, h - 22, w - 8, 18);
  for (const [i, l] of landmarks.entries()) {
    const x = 12 + i * (w - 24) / 10, y = h - 8;
    ctx.strokeStyle = l.chapter.color; ctx.fillStyle = l.chapter.color;
    ctx.globalAlpha = l.current ? 0.9 : 0.45;
    ctx.beginPath();
    const alternate = /Quarry|Workforce|Archive|OrbitalYards|Settlement|StellarClaims|MegaGuilds|MatterWorks|Refinement|EchoHarvest/.test(l.choice.id);
    if (alternate) { ctx.rect(x - 3, y - 7, 7, 7); } else { ctx.moveTo(x - 4, y); ctx.lineTo(x, y - 9); ctx.lineTo(x + 4, y); ctx.closePath(); }
    if (l.current) ctx.fill(); else ctx.stroke();
    ctx.font = '5px monospace'; ctx.fillText(String(l.era), x + 6, y);
  }
  ctx.restore();
}
