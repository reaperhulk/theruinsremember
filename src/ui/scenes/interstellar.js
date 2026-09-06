import { seededRandom, drawGlowCircle, lerp } from './shared.js';

export function drawEra5(ctx, w, h, t, state) {
  ctx.fillStyle = '#030010';
  ctx.fillRect(0, 0, w, h);

  // Colorful nebula patches in background — gas clouds in purple, blue, and orange
  const nebRng5 = seededRandom(5050);
  const nebulaColors = [
    [120, 60, 180], [60, 80, 200], [200, 100, 40],
    [80, 120, 200], [160, 50, 140], [180, 80, 60],
  ];
  for (let i = 0; i < 8; i++) {
    const nx = nebRng5() * w;
    const ny = nebRng5() * h;
    const nr = 25 + nebRng5() * 60;
    const col = nebulaColors[Math.floor(nebRng5() * nebulaColors.length)];
    const nebAlpha = 0.04 + 0.03 * Math.sin(t * 0.2 + i * 1.5);
    const nebGrad = ctx.createRadialGradient(nx, ny, 0, nx, ny, nr);
    nebGrad.addColorStop(0, `rgba(${col[0]},${col[1]},${col[2]},${nebAlpha * 1.5})`);
    nebGrad.addColorStop(0.4, `rgba(${col[0]},${col[1]},${col[2]},${nebAlpha})`);
    nebGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = nebGrad;
    ctx.beginPath();
    ctx.arc(nx, ny, nr, 0, Math.PI * 2);
    ctx.fill();
  }

  // Parallax star layers
  for (let layer = 0; layer < 3; layer++) {
    const speed = 0.05 + layer * 0.08;
    const count = 30 + layer * 20;
    const rng = seededRandom(500 + layer);
    for (let i = 0; i < count; i++) {
      const baseX = rng() * w;
      const y = rng() * h;
      const x = (baseX + t * speed * 20 * (layer + 1)) % w;
      const size = 0.3 + layer * 0.4;
      const brightness = 0.2 + layer * 0.25 + 0.15 * Math.sin(t * 2 + i);
      ctx.fillStyle = `rgba(255,255,255,${brightness})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Animated warp speed lines — streaks from center outward, FTL travel effect
  const warpIntensity = 0.5 + 0.5 * Math.sin(t * 0.3);
  {
    ctx.save();
    const warpCx = w * 0.5, warpCy = h * 0.5;
    // Continuous warp streaks (always visible, intensity varies)
    for (let i = 0; i < 35; i++) {
      const rng2 = seededRandom(i * 13 + 7);
      const angle = rng2() * Math.PI * 2;
      const startR = 5 + rng2() * 25;
      const len = 25 + rng2() * 80;
      const endR = startR + len;
      const baseAlpha = 0.05 + warpIntensity * 0.25 * rng2();
      // Cycle through phases for animation
      const phase = (t * 2.5 + i * 0.4) % 3;
      const s = startR + phase * 20;
      const e = Math.min(endR, s + len * 0.7);
      // Color varies: mostly blue-white, some purple
      const colorMix = rng2();
      const cr = colorMix < 0.3 ? 180 : colorMix < 0.6 ? 150 : 200;
      const cg = colorMix < 0.3 ? 200 : colorMix < 0.6 ? 150 : 180;
      const cb = 255;
      ctx.strokeStyle = `rgba(${cr},${cg},${cb},${baseAlpha})`;
      ctx.lineWidth = 0.5 + rng2() * 1.5;
      ctx.beginPath();
      ctx.moveTo(warpCx + Math.cos(angle) * s, warpCy + Math.sin(angle) * s);
      ctx.lineTo(warpCx + Math.cos(angle) * e, warpCy + Math.sin(angle) * e);
      ctx.stroke();
    }
    // Bright center convergence point
    const convAlpha = 0.05 + warpIntensity * 0.1;
    const convGrad = ctx.createRadialGradient(warpCx, warpCy, 0, warpCx, warpCy, 15);
    convGrad.addColorStop(0, `rgba(200,220,255,${convAlpha})`);
    convGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = convGrad;
    ctx.beginPath();
    ctx.arc(warpCx, warpCy, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Star systems as nodes
  const systems = [];
  const sysRng = seededRandom(999);
  for (let i = 0; i < 10; i++) {
    systems.push({
      x: 20 + sysRng() * (w - 40),
      y: 15 + sysRng() * (h - 30),
      size: 2 + sysRng() * 3,
      color: ['#ffd080', '#80c0ff', '#ff9090', '#ffffff', '#c0ff80'][Math.floor(sysRng() * 5)],
      connected: [],
    });
  }

  // Connections between nearby systems
  for (let i = 0; i < systems.length; i++) {
    for (let j = i + 1; j < systems.length; j++) {
      const dx = systems[i].x - systems[j].x;
      const dy = systems[i].y - systems[j].y;
      if (Math.sqrt(dx * dx + dy * dy) < 90) {
        systems[i].connected.push(j);
      }
    }
  }

  // Draw pulsing links
  for (let i = 0; i < systems.length; i++) {
    for (const j of systems[i].connected) {
      const pulse = 0.15 + 0.15 * Math.sin(t * 2 + i + j);
      ctx.strokeStyle = `rgba(100,150,255,${pulse})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(systems[i].x, systems[i].y);
      ctx.lineTo(systems[j].x, systems[j].y);
      ctx.stroke();

      // Data/energy packets moving along links
      const packetT = (t * 0.5 + i * 0.3) % 1;
      const px = lerp(systems[i].x, systems[j].x, packetT);
      const py = lerp(systems[i].y, systems[j].y, packetT);
      ctx.fillStyle = `rgba(150,200,255,${0.6 + 0.4 * Math.sin(t * 5)})`;
      ctx.beginPath();
      ctx.arc(px, py, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Draw star route lines based on player's star routes
  const routeCount = state.starRoutes?.length || 0;
  if (routeCount > 0) {
    const routeRng = seededRandom(1337);
    const routesToDraw = Math.min(routeCount, 15);
    for (let r = 0; r < routesToDraw; r++) {
      const fromIdx = Math.floor(routeRng() * systems.length);
      const toIdx = Math.floor(routeRng() * systems.length);
      if (fromIdx === toIdx) continue;
      const from = systems[fromIdx];
      const to = systems[toIdx];
      const pulse = 0.1 + 0.15 * Math.sin(t * 1.5 + r * 0.7);
      ctx.strokeStyle = `rgba(200,150,255,${pulse})`;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  // Draw star systems
  for (const s of systems) {
    drawGlowCircle(ctx, s.x, s.y, s.size * 0.5, s.color.replace(')', ',0.3)').replace('rgb', 'rgba'), s.size * 3);
    ctx.fillStyle = s.color;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
    ctx.fill();
  }

  // Distant supernova flashes — brief bright flares at random positions
  const novaRng = seededRandom(7654);
  for (let i = 0; i < 3; i++) {
    const nx = novaRng() * w;
    const ny = novaRng() * h;
    const novaPhase = (t * 0.15 + i * 2.3) % 5;
    if (novaPhase < 0.4) {
      const novaAlpha = novaPhase < 0.2 ? novaPhase / 0.2 : 1 - (novaPhase - 0.2) / 0.2;
      const novaR = 2 + novaAlpha * 6;
      const novaGrad = ctx.createRadialGradient(nx, ny, 0, nx, ny, novaR);
      novaGrad.addColorStop(0, `rgba(255,255,220,${novaAlpha * 0.8})`);
      novaGrad.addColorStop(0.5, `rgba(255,200,100,${novaAlpha * 0.3})`);
      novaGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = novaGrad;
      ctx.beginPath();
      ctx.arc(nx, ny, novaR, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Colony ships moving between systems
  for (let i = 0; i < 3; i++) {
    const rng3 = seededRandom(i * 31);
    const from = Math.floor(rng3() * systems.length);
    const to = Math.floor(rng3() * systems.length);
    if (from === to) continue;
    const shipT = (t * 0.15 + i * 0.33) % 1;
    const sx = lerp(systems[from].x, systems[to].x, shipT);
    const sy = lerp(systems[from].y, systems[to].y, shipT);
    // Ship
    ctx.fillStyle = '#ddeeff';
    ctx.beginPath();
    const shipAngle = Math.atan2(systems[to].y - systems[from].y, systems[to].x - systems[from].x);
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(shipAngle);
    ctx.moveTo(4, 0);
    ctx.lineTo(-3, -2);
    ctx.lineTo(-3, 2);
    ctx.closePath();
    ctx.fill();
    // Engine trail
    ctx.fillStyle = 'rgba(100,150,255,0.4)';
    ctx.beginPath();
    ctx.arc(-5, 0, 1.5 + Math.sin(t * 10) * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// --- Era 6: Galactic ---
