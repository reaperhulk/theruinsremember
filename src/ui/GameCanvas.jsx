import { useRef, useEffect, useCallback } from 'react';
import { mine } from '../engine/mining.js';
import { gather } from '../engine/resources.js';

// --- Shared Helpers ---

// Deterministic pseudo-random from seed
function seededRandom(seed) {
  let s = seed | 0;
  return () => {
    s = (s * 1664525 + 1013904223) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function drawStarField(ctx, w, h, count, seed, twinkleT) {
  const rng = seededRandom(seed);
  for (let i = 0; i < count; i++) {
    const x = rng() * w;
    const y = rng() * h;
    const baseSize = rng() * 1.5 + 0.5;
    const brightness = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(twinkleT * (1 + rng() * 2) + rng() * 6.28));
    ctx.fillStyle = `rgba(255,255,255,${brightness})`;
    ctx.beginPath();
    ctx.arc(x, y, baseSize, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawGlowCircle(ctx, x, y, r, color, glowR) {
  const grad = ctx.createRadialGradient(x, y, r * 0.2, x, y, glowR || r * 2.5);
  grad.addColorStop(0, color);
  grad.addColorStop(0.4, color);
  grad.addColorStop(1, 'transparent');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, glowR || r * 2.5, 0, Math.PI * 2);
  ctx.fill();
}

function lerp(a, b, t) { return a + (b - a) * t; }

// --- Era 1: Planetfall ---
function drawEra1(ctx, w, h, t) {
  // Sky gradient (day cycle)
  const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.65);
  skyGrad.addColorStop(0, '#3a8fd4');
  skyGrad.addColorStop(0.6, '#87CEEB');
  skyGrad.addColorStop(1, '#b5e8ff');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, h);

  // Sun - slow arc across sky
  const sunAngle = (t * 0.08) % (Math.PI * 2);
  const sunX = w * 0.5 + Math.cos(sunAngle - Math.PI * 0.5) * w * 0.4;
  const sunY = h * 0.45 - Math.sin(sunAngle) * h * 0.35;
  drawGlowCircle(ctx, sunX, sunY, 12, '#FFD700', 35);
  ctx.fillStyle = '#FFF8DC';
  ctx.beginPath();
  ctx.arc(sunX, sunY, 12, 0, Math.PI * 2);
  ctx.fill();

  // Animated clouds
  for (let i = 0; i < 5; i++) {
    const cx = ((t * (12 + i * 3) + i * 80) % (w + 80)) - 40;
    const cy = 18 + i * 14;
    const scale = 0.6 + i * 0.12;
    ctx.fillStyle = `rgba(255,255,255,${0.45 + i * 0.06})`;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 22 * scale, 8 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx - 12 * scale, cy + 2, 14 * scale, 6 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + 14 * scale, cy + 2, 16 * scale, 7 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Rolling hills (multiple layers)
  const hillColors = ['#3d7a45', '#4a8c54', '#5a9e62'];
  for (let layer = 0; layer < 3; layer++) {
    const baseY = h * 0.58 + layer * 16;
    ctx.fillStyle = hillColors[layer];
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = 0; x <= w; x += 2) {
      const y = baseY
        + Math.sin(x * 0.02 + layer * 2) * 12
        + Math.sin(x * 0.04 + layer + t * 0.1) * 4;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();
  }

  // Small buildings
  const buildings = [
    { x: 40, w: 16, h: 20 },
    { x: 90, w: 12, h: 14 },
    { x: 200, w: 18, h: 24 },
    { x: 240, w: 10, h: 12 },
  ];
  for (const b of buildings) {
    const groundY = h * 0.72 + Math.sin(b.x * 0.02 + 4) * 12 + Math.sin(b.x * 0.04 + 1 + t * 0.1) * 4;
    // Wall
    ctx.fillStyle = '#c8a97a';
    ctx.fillRect(b.x, groundY - b.h, b.w, b.h);
    // Roof
    ctx.fillStyle = '#8B4513';
    ctx.beginPath();
    ctx.moveTo(b.x - 3, groundY - b.h);
    ctx.lineTo(b.x + b.w / 2, groundY - b.h - 10);
    ctx.lineTo(b.x + b.w + 3, groundY - b.h);
    ctx.closePath();
    ctx.fill();
    // Window
    ctx.fillStyle = '#FFE47a';
    ctx.fillRect(b.x + b.w / 2 - 2, groundY - b.h + 5, 4, 4);
  }

  // Settlers walking
  for (let i = 0; i < 6; i++) {
    const sx = ((t * (15 + i * 5) + i * 50) % (w + 20)) - 10;
    const groundY = h * 0.74 + Math.sin(sx * 0.02 + 4) * 12;
    const legPhase = Math.sin(t * 4 + i * 2);
    // Body
    ctx.fillStyle = '#6B3A2A';
    ctx.beginPath();
    ctx.arc(sx, groundY - 8, 3, 0, Math.PI * 2);
    ctx.fill();
    // Head
    ctx.fillStyle = '#D4A574';
    ctx.beginPath();
    ctx.arc(sx, groundY - 13, 2.5, 0, Math.PI * 2);
    ctx.fill();
    // Legs
    ctx.strokeStyle = '#6B3A2A';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(sx, groundY - 5);
    ctx.lineTo(sx - legPhase * 2, groundY);
    ctx.moveTo(sx, groundY - 5);
    ctx.lineTo(sx + legPhase * 2, groundY);
    ctx.stroke();
  }
}

// --- Era 2: Industrialization ---
function drawEra2(ctx, w, h, t) {
  // Day/night cycle
  const dayPhase = (Math.sin(t * 0.15) + 1) / 2; // 0=night, 1=day
  const skyR = Math.floor(lerp(15, 140, dayPhase));
  const skyG = Math.floor(lerp(10, 120, dayPhase));
  const skyB = Math.floor(lerp(30, 100, dayPhase));

  const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.5);
  skyGrad.addColorStop(0, `rgb(${skyR},${skyG},${skyB})`);
  skyGrad.addColorStop(1, `rgb(${skyR + 30},${skyG + 20},${skyB + 10})`);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, h);

  // Ground
  const groundGrad = ctx.createLinearGradient(0, h * 0.65, 0, h);
  groundGrad.addColorStop(0, '#5a4a3a');
  groundGrad.addColorStop(1, '#3a3025');
  ctx.fillStyle = groundGrad;
  ctx.fillRect(0, h * 0.65, w, h * 0.35);

  // Factories
  const factories = [
    { x: 15, bw: 45, bh: 50, stacks: 2 },
    { x: 80, bw: 35, bh: 40, stacks: 1 },
    { x: 135, bw: 55, bh: 55, stacks: 3 },
    { x: 210, bw: 50, bh: 45, stacks: 2 },
  ];

  for (const f of factories) {
    const baseY = h * 0.65;
    // Building body
    const bGrad = ctx.createLinearGradient(f.x, baseY - f.bh, f.x, baseY);
    bGrad.addColorStop(0, '#666');
    bGrad.addColorStop(1, '#444');
    ctx.fillStyle = bGrad;
    ctx.fillRect(f.x, baseY - f.bh, f.bw, f.bh);

    // Windows with furnace glow
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < Math.floor(f.bw / 12); col++) {
        const wx = f.x + 5 + col * 12;
        const wy = baseY - f.bh + 8 + row * 14;
        const glow = 0.5 + 0.5 * Math.sin(t * 3 + col + row * 2 + f.x);
        ctx.fillStyle = `rgba(255,${Math.floor(120 + glow * 80)},${Math.floor(30 + glow * 30)},${0.6 + glow * 0.4})`;
        ctx.fillRect(wx, wy, 7, 6);
      }
    }

    // Smokestacks
    for (let s = 0; s < f.stacks; s++) {
      const sx = f.x + 8 + s * (f.bw / (f.stacks + 1));
      ctx.fillStyle = '#555';
      ctx.fillRect(sx - 3, baseY - f.bh - 20, 6, 22);

      // Smoke particles rising
      for (let p = 0; p < 8; p++) {
        const age = ((t * 0.8 + p * 0.3 + s + f.x * 0.01) % 2.5);
        const py = baseY - f.bh - 22 - age * 30;
        const px = sx + Math.sin(age * 2 + s) * (age * 6);
        const size = 3 + age * 4;
        const alpha = Math.max(0, 0.4 - age * 0.16);
        ctx.fillStyle = `rgba(150,140,130,${alpha})`;
        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Conveyor belt at bottom
  const beltY = h * 0.78;
  ctx.fillStyle = '#333';
  ctx.fillRect(0, beltY, w, 6);
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 1;
  for (let x = 0; x < w; x += 10) {
    const bx = ((x + t * 30) % w);
    ctx.beginPath();
    ctx.moveTo(bx, beltY);
    ctx.lineTo(bx, beltY + 6);
    ctx.stroke();
  }
  // Boxes on belt
  for (let i = 0; i < 6; i++) {
    const bx = ((i * 50 + t * 30) % (w + 20)) - 10;
    ctx.fillStyle = '#a08050';
    ctx.fillRect(bx, beltY - 6, 8, 6);
  }

  // Smog overlay
  const smogAlpha = 0.08 + (1 - dayPhase) * 0.06;
  ctx.fillStyle = `rgba(100,90,70,${smogAlpha})`;
  ctx.fillRect(0, 0, w, h * 0.5);
}

// --- Era 3: Space Age ---
function drawEra3(ctx, w, h, t) {
  // Deep space background
  ctx.fillStyle = '#000012';
  ctx.fillRect(0, 0, w, h);
  drawStarField(ctx, w, h, 80, 333, t);

  // Earth
  const ex = w * 0.32, ey = h * 0.55, er = 34;
  // Atmosphere glow
  const atmosGrad = ctx.createRadialGradient(ex, ey, er, ex, ey, er + 12);
  atmosGrad.addColorStop(0, 'rgba(100,180,255,0.3)');
  atmosGrad.addColorStop(0.5, 'rgba(100,180,255,0.1)');
  atmosGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = atmosGrad;
  ctx.beginPath();
  ctx.arc(ex, ey, er + 12, 0, Math.PI * 2);
  ctx.fill();
  // Planet body
  const earthGrad = ctx.createRadialGradient(ex - 8, ey - 8, 2, ex, ey, er);
  earthGrad.addColorStop(0, '#5090d0');
  earthGrad.addColorStop(0.3, '#3070b0');
  earthGrad.addColorStop(0.6, '#2a6535');
  earthGrad.addColorStop(0.8, '#3070b0');
  earthGrad.addColorStop(1, '#1a3060');
  ctx.fillStyle = earthGrad;
  ctx.beginPath();
  ctx.arc(ex, ey, er, 0, Math.PI * 2);
  ctx.fill();
  // Cloud swirls on earth
  ctx.save();
  ctx.beginPath();
  ctx.arc(ex, ey, er, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  for (let i = 0; i < 6; i++) {
    const cx = ex - 20 + ((t * 3 + i * 20) % (er * 2 + 10));
    const cy = ey - 15 + i * 8;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 12 + i * 2, 3, 0.3 * i, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Satellites orbiting
  for (let i = 0; i < 3; i++) {
    const angle = t * (0.4 + i * 0.15) + i * 2.1;
    const orbitR = er + 16 + i * 10;
    const sx = ex + Math.cos(angle) * orbitR;
    const sy = ey + Math.sin(angle) * orbitR * 0.5;
    // Orbit trail
    ctx.strokeStyle = 'rgba(100,180,255,0.08)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.ellipse(ex, ey, orbitR, orbitR * 0.5, 0, 0, Math.PI * 2);
    ctx.stroke();
    // Satellite body
    ctx.fillStyle = '#ccc';
    ctx.fillRect(sx - 1, sy - 1, 3, 2);
    // Solar panels
    ctx.fillStyle = '#4488cc';
    ctx.fillRect(sx - 5, sy - 0.5, 3, 1);
    ctx.fillRect(sx + 2, sy - 0.5, 3, 1);
  }

  // ISS-like station
  const issAngle = t * 0.12;
  const issX = ex + Math.cos(issAngle) * (er + 30);
  const issY = ey + Math.sin(issAngle) * (er + 30) * 0.4;
  ctx.fillStyle = '#ddd';
  ctx.fillRect(issX - 8, issY - 1, 16, 2);
  ctx.fillRect(issX - 1, issY - 5, 2, 10);
  ctx.fillStyle = '#4488cc';
  ctx.fillRect(issX - 12, issY - 3, 4, 6);
  ctx.fillRect(issX + 8, issY - 3, 4, 6);

  // Rocket launch
  const rocketCycle = (t * 0.25) % 4;
  if (rocketCycle < 2.5) {
    const progress = Math.min(rocketCycle / 2.5, 1);
    const rx = w * 0.75;
    const ry = h * 0.9 - progress * h * 0.95;
    // Exhaust trail
    for (let p = 0; p < 12; p++) {
      const trailY = ry + 8 + p * 4;
      if (trailY > h) break;
      const alpha = Math.max(0, 0.5 - p * 0.04);
      const spread = p * 1.5;
      ctx.fillStyle = `rgba(255,${150 - p * 8},50,${alpha})`;
      ctx.beginPath();
      ctx.arc(rx + (Math.sin(p + t * 8) * spread * 0.3), trailY, 2 + spread * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
    // Rocket body
    ctx.fillStyle = '#e8e8e8';
    ctx.beginPath();
    ctx.moveTo(rx, ry - 8);
    ctx.lineTo(rx + 4, ry + 6);
    ctx.lineTo(rx - 4, ry + 6);
    ctx.closePath();
    ctx.fill();
    // Nose cone
    ctx.fillStyle = '#cc3333';
    ctx.beginPath();
    ctx.moveTo(rx, ry - 12);
    ctx.lineTo(rx + 2, ry - 6);
    ctx.lineTo(rx - 2, ry - 6);
    ctx.closePath();
    ctx.fill();
  }
}

// --- Era 4: Solar System ---
function drawEra4(ctx, w, h, t) {
  ctx.fillStyle = '#000008';
  ctx.fillRect(0, 0, w, h);
  drawStarField(ctx, w, h, 60, 444, t);

  const cx = w * 0.5, cy = h * 0.5;

  // Sun with glow
  drawGlowCircle(ctx, cx, cy, 10, 'rgba(255,200,50,0.6)', 30);
  const sunGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, 12);
  sunGrad.addColorStop(0, '#fff8e0');
  sunGrad.addColorStop(0.5, '#FFD700');
  sunGrad.addColorStop(1, '#ff8800');
  ctx.fillStyle = sunGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, 12, 0, Math.PI * 2);
  ctx.fill();

  // Planets with orbit trails
  const planets = [
    { r: 26, size: 2, color: '#bbb', speed: 2.5, name: 'mercury' },
    { r: 35, size: 3, color: '#e8c870', speed: 1.6, name: 'venus' },
    { r: 46, size: 3.5, color: '#4488cc', speed: 1.0, name: 'earth', hasColony: true },
    { r: 57, size: 3, color: '#cc6633', speed: 0.7, name: 'mars', hasColony: true },
    { r: 78, size: 7, color: '#d4a050', speed: 0.3, name: 'jupiter' },
    { r: 95, size: 6, color: '#c8b060', speed: 0.18, name: 'saturn', rings: true },
    { r: 108, size: 4, color: '#88bbcc', speed: 0.1, name: 'uranus' },
    { r: 120, size: 3.8, color: '#4466cc', speed: 0.06, name: 'neptune' },
  ];

  // Orbit lines
  for (const p of planets) {
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.ellipse(cx, cy, p.r, p.r * 0.38, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Asteroid belt
  const rng = seededRandom(777);
  for (let i = 0; i < 40; i++) {
    const aR = 65 + rng() * 10;
    const aAngle = rng() * Math.PI * 2 + t * 0.15;
    const ax = cx + Math.cos(aAngle) * aR;
    const ay = cy + Math.sin(aAngle) * aR * 0.38;
    ctx.fillStyle = `rgba(180,170,150,${0.2 + rng() * 0.3})`;
    ctx.fillRect(ax, ay, 1, 1);
  }

  // Draw planets
  for (const p of planets) {
    const angle = t * p.speed * 0.15;
    const px = cx + Math.cos(angle) * p.r;
    const py = cy + Math.sin(angle) * p.r * 0.38;

    // Orbit trail
    ctx.strokeStyle = `rgba(255,255,255,0.08)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let a = 0; a < 40; a++) {
      const trailAngle = angle - a * 0.04;
      const tx = cx + Math.cos(trailAngle) * p.r;
      const ty = cy + Math.sin(trailAngle) * p.r * 0.38;
      if (a === 0) ctx.moveTo(tx, ty);
      else ctx.lineTo(tx, ty);
    }
    ctx.stroke();

    // Planet
    const pGrad = ctx.createRadialGradient(px - p.size * 0.3, py - p.size * 0.3, 0, px, py, p.size);
    pGrad.addColorStop(0, '#fff');
    pGrad.addColorStop(0.3, p.color);
    pGrad.addColorStop(1, '#222');
    ctx.fillStyle = pGrad;
    ctx.beginPath();
    ctx.arc(px, py, p.size, 0, Math.PI * 2);
    ctx.fill();

    // Saturn rings
    if (p.rings) {
      ctx.strokeStyle = 'rgba(200,180,120,0.5)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(px, py, p.size + 4, 2, 0.3, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Colony marker
    if (p.hasColony) {
      const pulse = 0.5 + 0.5 * Math.sin(t * 3);
      ctx.fillStyle = `rgba(0,255,150,${0.4 + pulse * 0.4})`;
      ctx.beginPath();
      ctx.arc(px, py - p.size - 3, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// --- Era 5: Interstellar ---
function drawEra5(ctx, w, h, t) {
  ctx.fillStyle = '#030010';
  ctx.fillRect(0, 0, w, h);

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

  // Warp speed lines
  const warpIntensity = 0.5 + 0.5 * Math.sin(t * 0.3);
  if (warpIntensity > 0.4) {
    ctx.save();
    const warpCx = w * 0.5, warpCy = h * 0.5;
    for (let i = 0; i < 20; i++) {
      const rng2 = seededRandom(i * 13 + 7);
      const angle = rng2() * Math.PI * 2;
      const startR = 10 + rng2() * 30;
      const len = 20 + rng2() * 60;
      const endR = startR + len;
      const alpha = warpIntensity * 0.3 * rng2();
      ctx.strokeStyle = `rgba(180,200,255,${alpha})`;
      ctx.lineWidth = 0.5 + rng2();
      ctx.beginPath();
      const phase = (t * 2 + i * 0.5) % 3;
      const s = startR + phase * 15;
      const e = Math.min(endR, s + len * 0.6);
      ctx.moveTo(warpCx + Math.cos(angle) * s, warpCy + Math.sin(angle) * s);
      ctx.lineTo(warpCx + Math.cos(angle) * e, warpCy + Math.sin(angle) * e);
      ctx.stroke();
    }
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

  // Draw star systems
  for (const s of systems) {
    drawGlowCircle(ctx, s.x, s.y, s.size * 0.5, s.color.replace(')', ',0.3)').replace('rgb', 'rgba'), s.size * 3);
    ctx.fillStyle = s.color;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
    ctx.fill();
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
function drawEra6(ctx, w, h, t) {
  ctx.fillStyle = '#020008';
  ctx.fillRect(0, 0, w, h);
  drawStarField(ctx, w, h, 40, 600, t);

  const cx = w * 0.5, cy = h * 0.5;
  const rotation = t * 0.04;

  // Spiral galaxy
  // Bright core
  drawGlowCircle(ctx, cx, cy, 5, 'rgba(255,240,200,0.8)', 25);
  drawGlowCircle(ctx, cx, cy, 3, 'rgba(255,255,240,0.9)', 12);

  // Spiral arms
  for (let arm = 0; arm < 2; arm++) {
    const armOffset = arm * Math.PI;
    for (let i = 0; i < 200; i++) {
      const dist = 8 + i * 0.5;
      const angle = rotation + armOffset + dist * 0.08;
      const spread = (0.8 + Math.sin(i * 0.3) * 0.5) * (dist * 0.04);

      const rng = seededRandom(arm * 1000 + i);
      const offsetX = (rng() - 0.5) * spread * 8;
      const offsetY = (rng() - 0.5) * spread * 8;

      const x = cx + Math.cos(angle) * dist * 1.2 + offsetX;
      const y = cy + Math.sin(angle) * dist * 0.5 + offsetY;

      if (x < -5 || x > w + 5 || y < -5 || y > h + 5) continue;

      const distFromCenter = Math.sqrt((x - cx) ** 2 + ((y - cy) * 2) ** 2);
      const brightness = Math.max(0.05, 0.5 - distFromCenter / 200);
      const size = 0.5 + rng() * 1.2;

      // Color varies: blue-white near center, red-orange further out
      const colorT = Math.min(1, dist / 100);
      const r = Math.floor(lerp(200, 255, colorT));
      const g = Math.floor(lerp(210, 180, colorT));
      const b = Math.floor(lerp(255, 150, colorT));

      ctx.fillStyle = `rgba(${r},${g},${b},${brightness})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Network lines between key sectors
  const sectorNodes = [];
  const sRng = seededRandom(42);
  for (let i = 0; i < 8; i++) {
    const angle = rotation + i * Math.PI * 0.25;
    const dist = 25 + sRng() * 50;
    sectorNodes.push({
      x: cx + Math.cos(angle) * dist * 1.2,
      y: cy + Math.sin(angle) * dist * 0.5,
    });
  }

  for (let i = 0; i < sectorNodes.length; i++) {
    for (let j = i + 1; j < sectorNodes.length; j++) {
      const dx = sectorNodes[i].x - sectorNodes[j].x;
      const dy = sectorNodes[i].y - sectorNodes[j].y;
      if (Math.sqrt(dx * dx + dy * dy) < 80) {
        const pulse = 0.08 + 0.08 * Math.sin(t * 1.5 + i + j);
        ctx.strokeStyle = `rgba(100,200,255,${pulse})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(sectorNodes[i].x, sectorNodes[i].y);
        ctx.lineTo(sectorNodes[j].x, sectorNodes[j].y);
        ctx.stroke();
      }
    }
  }

  // Glowing key system nodes
  for (const n of sectorNodes) {
    const pulse = 0.5 + 0.5 * Math.sin(t * 2 + n.x);
    ctx.fillStyle = `rgba(100,220,255,${0.3 + pulse * 0.5})`;
    ctx.beginPath();
    ctx.arc(n.x, n.y, 2 + pulse, 0, Math.PI * 2);
    ctx.fill();
  }
}

// --- Era 7: Intergalactic ---
function drawEra7(ctx, w, h, t) {
  // Cosmic background radiation — subtle color variation
  const bgGrad = ctx.createRadialGradient(w * 0.5, h * 0.5, 10, w * 0.5, h * 0.5, w);
  bgGrad.addColorStop(0, '#0a0515');
  bgGrad.addColorStop(0.5, '#050210');
  bgGrad.addColorStop(1, '#020108');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  // Subtle CMB texture
  const cmbRng = seededRandom(77);
  for (let i = 0; i < 100; i++) {
    const x = cmbRng() * w;
    const y = cmbRng() * h;
    const hue = 220 + cmbRng() * 40;
    ctx.fillStyle = `hsla(${hue},40%,15%,${0.03 + cmbRng() * 0.04})`;
    ctx.beginPath();
    ctx.arc(x, y, 8 + cmbRng() * 15, 0, Math.PI * 2);
    ctx.fill();
  }

  drawStarField(ctx, w, h, 50, 700, t);

  // Galaxies at various positions
  const galaxies = [
    { x: w * 0.2, y: h * 0.3, size: 20, color: '#d0a0ff', rot: 0.3, type: 'spiral' },
    { x: w * 0.7, y: h * 0.25, size: 28, color: '#ffe0a0', rot: -0.2, type: 'spiral' },
    { x: w * 0.5, y: h * 0.65, size: 15, color: '#ff9090', rot: 0.8, type: 'elliptical' },
    { x: w * 0.85, y: h * 0.7, size: 12, color: '#90d0ff', rot: 0.1, type: 'spiral' },
    { x: w * 0.15, y: h * 0.75, size: 10, color: '#c0ffc0', rot: -0.5, type: 'elliptical' },
    { x: w * 0.48, y: h * 0.2, size: 8, color: '#ffffaa', rot: 0.4, type: 'elliptical' },
  ];

  for (const g of galaxies) {
    if (g.type === 'spiral') {
      // Mini spiral galaxy
      drawGlowCircle(ctx, g.x, g.y, g.size * 0.15, g.color.replace(')', ',0.4)').replace('rgb', 'rgba') || g.color, g.size * 0.8);
      const gRng = seededRandom(Math.floor(g.x * 100 + g.y));
      for (let arm = 0; arm < 2; arm++) {
        for (let i = 0; i < 60; i++) {
          const dist = 2 + i * g.size * 0.016;
          const angle = t * 0.03 + g.rot + arm * Math.PI + dist * 0.15;
          const spread = dist * 0.15;
          const ox = (gRng() - 0.5) * spread * 3;
          const oy = (gRng() - 0.5) * spread * 3;
          const px = g.x + Math.cos(angle) * dist + ox;
          const py = g.y + Math.sin(angle) * dist * 0.5 + oy;
          const alpha = Math.max(0, 0.35 - dist / (g.size * 2));
          ctx.fillStyle = `rgba(255,255,255,${alpha})`;
          ctx.beginPath();
          ctx.arc(px, py, 0.4 + gRng() * 0.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      // Core
      ctx.fillStyle = g.color;
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.arc(g.x, g.y, g.size * 0.12, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    } else {
      // Elliptical galaxy — fuzzy blob
      const eGrad = ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, g.size);
      eGrad.addColorStop(0, g.color);
      eGrad.addColorStop(0.3, g.color.slice(0, -1) + ',0.4)'.replace('#', 'rgba('));
      // Simpler approach
      eGrad.addColorStop(0.3, 'rgba(255,200,200,0.2)');
      eGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = eGrad;
      ctx.beginPath();
      ctx.ellipse(g.x, g.y, g.size, g.size * 0.7, g.rot, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Void bridges — glowing arcs between galaxies
  const bridges = [[0, 1], [1, 2], [2, 3], [0, 4], [1, 5]];
  for (const [a, b] of bridges) {
    const ga = galaxies[a], gb = galaxies[b];
    const midX = (ga.x + gb.x) / 2;
    const midY = (ga.y + gb.y) / 2 - 15;
    const pulse = 0.15 + 0.1 * Math.sin(t * 0.8 + a + b);

    ctx.strokeStyle = `rgba(150,100,255,${pulse})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(ga.x, ga.y);
    ctx.quadraticCurveTo(midX, midY, gb.x, gb.y);
    ctx.stroke();

    // Glow
    ctx.strokeStyle = `rgba(150,100,255,${pulse * 0.3})`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(ga.x, ga.y);
    ctx.quadraticCurveTo(midX, midY, gb.x, gb.y);
    ctx.stroke();

    // Particles along bridge
    for (let p = 0; p < 3; p++) {
      const bt = ((t * 0.2 + p * 0.33) % 1);
      // Quadratic bezier point
      const bx = (1 - bt) * (1 - bt) * ga.x + 2 * (1 - bt) * bt * midX + bt * bt * gb.x;
      const by = (1 - bt) * (1 - bt) * ga.y + 2 * (1 - bt) * bt * midY + bt * bt * gb.y;
      ctx.fillStyle = `rgba(200,150,255,${0.5 + 0.3 * Math.sin(t * 4 + p)})`;
      ctx.beginPath();
      ctx.arc(bx, by, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// --- Era 8: Multiverse ---
function drawEra8(ctx, w, h, t) {
  // Deep void base
  ctx.fillStyle = '#080010';
  ctx.fillRect(0, 0, w, h);

  // Overlapping translucent reality layers
  for (let layer = 0; layer < 4; layer++) {
    const offsetX = Math.sin(t * 0.3 + layer * 1.5) * 15;
    const offsetY = Math.cos(t * 0.25 + layer * 2) * 10;
    const hue = (layer * 80 + t * 15) % 360;
    const alpha = 0.06 + 0.03 * Math.sin(t * 0.5 + layer);

    ctx.fillStyle = `hsla(${hue},60%,30%,${alpha})`;
    ctx.fillRect(offsetX - 10, offsetY - 10, w + 20, h + 20);

    // Reality grid lines for this layer
    ctx.strokeStyle = `hsla(${hue},70%,50%,${alpha * 0.8})`;
    ctx.lineWidth = 0.5;
    for (let x = 0; x < w; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x + offsetX, 0);
      ctx.lineTo(x + offsetX + Math.sin(t + layer) * 5, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y + offsetY);
      ctx.lineTo(w, y + offsetY + Math.cos(t + layer) * 5);
      ctx.stroke();
    }
  }

  // Shimmering particles (reality fragments)
  const fragRng = seededRandom(888);
  for (let i = 0; i < 60; i++) {
    const baseX = fragRng() * w;
    const baseY = fragRng() * h;
    const drift = fragRng() * Math.PI * 2;
    const px = baseX + Math.sin(t * 0.7 + drift) * 10;
    const py = baseY + Math.cos(t * 0.5 + drift) * 8;
    const hue = (fragRng() * 360 + t * 30) % 360;
    const shimmer = 0.3 + 0.5 * Math.sin(t * 3 + i * 0.7);
    const size = 0.5 + fragRng() * 1.5;
    ctx.fillStyle = `hsla(${hue},80%,70%,${shimmer * 0.6})`;
    ctx.beginPath();
    ctx.arc(px, py, size, 0, Math.PI * 2);
    ctx.fill();
  }

  // Portal effects (swirling circles)
  const portals = [
    { x: w * 0.25, y: h * 0.35, r: 22 },
    { x: w * 0.72, y: h * 0.55, r: 18 },
    { x: w * 0.5, y: h * 0.75, r: 15 },
  ];

  for (const portal of portals) {
    // Outer glow
    const portalHue = (t * 40 + portal.x * 2) % 360;
    const glowGrad = ctx.createRadialGradient(portal.x, portal.y, portal.r * 0.3, portal.x, portal.y, portal.r * 1.5);
    glowGrad.addColorStop(0, `hsla(${portalHue},80%,60%,0.3)`);
    glowGrad.addColorStop(0.5, `hsla(${portalHue + 40},70%,40%,0.15)`);
    glowGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(portal.x, portal.y, portal.r * 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Swirling rings
    for (let ring = 0; ring < 5; ring++) {
      const ringR = portal.r * (0.3 + ring * 0.18);
      const ringAngle = t * (2 + ring * 0.5) * (ring % 2 === 0 ? 1 : -1);
      const ringHue = (portalHue + ring * 30) % 360;
      ctx.strokeStyle = `hsla(${ringHue},80%,65%,${0.25 - ring * 0.04})`;
      ctx.lineWidth = 1.5 - ring * 0.2;
      ctx.beginPath();
      ctx.ellipse(portal.x, portal.y, ringR, ringR * 0.6, ringAngle, 0, Math.PI * 1.5);
      ctx.stroke();
    }

    // Center bright point
    ctx.fillStyle = `hsla(${portalHue},90%,85%,${0.6 + 0.3 * Math.sin(t * 4)})`;
    ctx.beginPath();
    ctx.arc(portal.x, portal.y, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Dimensional rifts — jagged lightning-like tears
  for (let rift = 0; rift < 3; rift++) {
    const riftRng = seededRandom(rift * 50 + 300);
    const startX = riftRng() * w;
    const startY = riftRng() * h * 0.3;
    const riftHue = (t * 50 + rift * 120) % 360;
    const segments = 8;
    const flickerAlpha = 0.2 + 0.3 * Math.abs(Math.sin(t * 5 + rift * 2));

    // Glow behind rift
    ctx.strokeStyle = `hsla(${riftHue},80%,70%,${flickerAlpha * 0.3})`;
    ctx.lineWidth = 6;
    ctx.beginPath();
    let rx = startX, ry = startY;
    ctx.moveTo(rx, ry);
    for (let s = 0; s < segments; s++) {
      rx += (riftRng() - 0.3) * 15 + Math.sin(t * 3 + s) * 3;
      ry += 10 + riftRng() * 10;
      ctx.lineTo(rx, ry);
    }
    ctx.stroke();

    // Sharp rift line
    ctx.strokeStyle = `hsla(${riftHue},90%,80%,${flickerAlpha})`;
    ctx.lineWidth = 1;
    rx = startX; ry = startY;
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    for (let s = 0; s < segments; s++) {
      rx += (riftRng() - 0.3) * 15 + Math.sin(t * 3 + s) * 3;
      ry += 10 + riftRng() * 10;
      ctx.lineTo(rx, ry);
    }
    ctx.stroke();
  }
}

// --- Era 9: Intergalactic ---
function drawIntergalactic(ctx, w, h, t) {
  // Deep cosmic void
  const bgGrad = ctx.createRadialGradient(w * 0.5, h * 0.5, 0, w * 0.5, h * 0.5, w);
  bgGrad.addColorStop(0, '#0a0020');
  bgGrad.addColorStop(0.4, '#050012');
  bgGrad.addColorStop(1, '#020008');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  drawStarField(ctx, w, h, 30, 500, t);

  // Cosmic web — filaments connecting galaxy clusters
  const nodes = [];
  const nodeRng = seededRandom(999);
  for (let i = 0; i < 12; i++) {
    nodes.push({ x: nodeRng() * w, y: nodeRng() * h, size: 3 + nodeRng() * 8 });
  }

  // Draw filaments between nearby nodes
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[i].x - nodes[j].x;
      const dy = nodes[i].y - nodes[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < w * 0.4) {
        const alpha = (1 - dist / (w * 0.4)) * 0.12;
        const pulse = 0.5 + 0.5 * Math.sin(t * 0.5 + i + j);
        ctx.strokeStyle = `rgba(100,60,200,${alpha * pulse})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(nodes[i].x, nodes[i].y);
        const mx = (nodes[i].x + nodes[j].x) / 2 + Math.sin(t * 0.3 + i) * 10;
        const my = (nodes[i].y + nodes[j].y) / 2 + Math.cos(t * 0.4 + j) * 8;
        ctx.quadraticCurveTo(mx, my, nodes[j].x, nodes[j].y);
        ctx.stroke();
      }
    }
  }

  // Galaxy cluster nodes with glow
  for (const node of nodes) {
    const hue = (node.x * 2 + node.y + t * 10) % 360;
    drawGlowCircle(ctx, node.x, node.y, node.size * 0.3, `hsla(${hue},70%,60%,0.6)`, node.size * 1.5);
    ctx.fillStyle = `hsla(${hue},80%,80%,0.7)`;
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.size * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Gravitational lensing arcs near center
  const cx = w * 0.5, cy = h * 0.5;
  for (let arc = 0; arc < 4; arc++) {
    const arcAngle = t * 0.1 + arc * Math.PI / 2;
    const arcR = 30 + arc * 12;
    const hue = (arc * 90 + t * 20) % 360;
    ctx.strokeStyle = `hsla(${hue},60%,60%,${0.08 + 0.05 * Math.sin(t + arc)})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, arcR, arcAngle, arcAngle + Math.PI * 0.6);
    ctx.stroke();
  }

  // Central void attractor
  const voidGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 25);
  voidGrad.addColorStop(0, `rgba(60,0,120,${0.3 + 0.15 * Math.sin(t * 0.8)})`);
  voidGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = voidGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, 25, 0, Math.PI * 2);
  ctx.fill();
}

// --- Era 10: Multiverse ---
function drawMultiverse(ctx, w, h, t) {
  // Shifting void background
  ctx.fillStyle = '#030008';
  ctx.fillRect(0, 0, w, h);

  // Overlapping reality planes with distinct colors
  const planes = [
    { hue: 0, phase: 0, speed: 0.15 },
    { hue: 120, phase: 2, speed: 0.2 },
    { hue: 240, phase: 4, speed: 0.12 },
    { hue: 60, phase: 1, speed: 0.18 },
    { hue: 300, phase: 3, speed: 0.25 },
  ];

  for (const plane of planes) {
    const ox = Math.sin(t * plane.speed + plane.phase) * 20;
    const oy = Math.cos(t * plane.speed * 0.7 + plane.phase) * 15;
    const alpha = 0.04 + 0.02 * Math.sin(t * 0.4 + plane.phase);
    ctx.fillStyle = `hsla(${plane.hue},50%,25%,${alpha})`;
    ctx.fillRect(ox - 20, oy - 20, w + 40, h + 40);
  }

  // Quantum interference pattern
  for (let x = 0; x < w; x += 4) {
    const wave1 = Math.sin(x * 0.05 + t * 2) * 0.5;
    const wave2 = Math.sin(x * 0.08 - t * 1.5) * 0.3;
    const intensity = Math.abs(wave1 + wave2);
    if (intensity > 0.3) {
      ctx.fillStyle = `rgba(200,100,255,${intensity * 0.08})`;
      ctx.fillRect(x, 0, 3, h);
    }
  }

  // Reality bubbles — each is a "universe"
  const bubbleRng = seededRandom(1010);
  for (let i = 0; i < 8; i++) {
    const bx = bubbleRng() * w;
    const by = bubbleRng() * h;
    const br = 10 + bubbleRng() * 25;
    const breathe = 1 + 0.1 * Math.sin(t * 1.2 + i * 0.8);
    const hue = (i * 45 + t * 15) % 360;

    // Membrane
    ctx.strokeStyle = `hsla(${hue},70%,60%,${0.15 + 0.1 * Math.sin(t * 2 + i)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(bx, by, br * breathe, 0, Math.PI * 2);
    ctx.stroke();

    // Interior glow
    const bubbleGrad = ctx.createRadialGradient(bx, by, 0, bx, by, br * breathe);
    bubbleGrad.addColorStop(0, `hsla(${hue},80%,70%,0.12)`);
    bubbleGrad.addColorStop(0.7, `hsla(${hue},60%,40%,0.04)`);
    bubbleGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = bubbleGrad;
    ctx.beginPath();
    ctx.arc(bx, by, br * breathe, 0, Math.PI * 2);
    ctx.fill();

    // Mini stars inside bubble
    for (let s = 0; s < 5; s++) {
      const sx = bx + (bubbleRng() - 0.5) * br * 1.2;
      const sy = by + (bubbleRng() - 0.5) * br * 1.2;
      const dd = Math.sqrt((sx - bx) ** 2 + (sy - by) ** 2);
      if (dd < br * breathe * 0.9) {
        const twinkle = 0.3 + 0.7 * Math.sin(t * 5 + s + i);
        ctx.fillStyle = `rgba(255,255,255,${twinkle * 0.5})`;
        ctx.beginPath();
        ctx.arc(sx, sy, 0.5 + bubbleRng() * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Central nexus — the convergence point of all realities
  const cx = w * 0.5, cy = h * 0.5;
  for (let ring = 0; ring < 6; ring++) {
    const rr = 8 + ring * 7;
    const ringSpeed = (ring % 2 === 0 ? 1 : -1) * (1 + ring * 0.3);
    const hue = (ring * 60 + t * 30) % 360;
    ctx.strokeStyle = `hsla(${hue},80%,65%,${0.2 - ring * 0.025})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rr, rr * 0.6, t * ringSpeed * 0.1, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Nexus core
  const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 12);
  coreGrad.addColorStop(0, `rgba(255,255,255,${0.5 + 0.3 * Math.sin(t * 3)})`);
  coreGrad.addColorStop(0.5, `rgba(200,100,255,0.2)`);
  coreGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, 12, 0, Math.PI * 2);
  ctx.fill();
}

// --- Era 3 (new): Digital Age ---
function drawDigitalAge(ctx, w, h, t) {
  // Dark background with circuit-board feel
  ctx.fillStyle = '#0a0e1a';
  ctx.fillRect(0, 0, w, h);

  // Grid lines (circuit traces)
  ctx.strokeStyle = 'rgba(0, 200, 100, 0.08)';
  ctx.lineWidth = 1;
  for (let x = 0; x < w; x += 20) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y < h; y += 20) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  // Pulsing data nodes at intersections
  const rng = seededRandom(42);
  for (let i = 0; i < 15; i++) {
    const nx = Math.floor(rng() * 14) * 20;
    const ny = Math.floor(rng() * 9) * 20;
    const pulse = 0.5 + 0.5 * Math.sin(t * 3 + i * 1.7);
    ctx.fillStyle = `rgba(0, 255, 150, ${0.3 + pulse * 0.5})`;
    ctx.beginPath();
    ctx.arc(nx, ny, 2 + pulse * 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Flowing data packets along traces
  for (let i = 0; i < 8; i++) {
    const speed = 40 + i * 15;
    const y = 20 + (i % 7) * 20;
    const x = ((t * speed + i * 80) % (w + 20)) - 10;
    ctx.fillStyle = `rgba(100, 200, 255, ${0.6 + 0.4 * Math.sin(t * 5 + i)})`;
    ctx.fillRect(x, y - 1, 6, 2);
  }

  // Central server/globe
  const cx = w * 0.5, cy = h * 0.5;
  const globeR = 25;
  const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, globeR);
  grd.addColorStop(0, 'rgba(0, 150, 255, 0.6)');
  grd.addColorStop(0.7, 'rgba(0, 100, 200, 0.3)');
  grd.addColorStop(1, 'rgba(0, 50, 100, 0)');
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.arc(cx, cy, globeR, 0, Math.PI * 2);
  ctx.fill();

  // Orbiting data rings
  ctx.strokeStyle = 'rgba(0, 200, 255, 0.3)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    const angle = t * (0.5 + i * 0.3) + i * 2.1;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.scale(1, 0.3);
    ctx.beginPath();
    ctx.arc(0, 0, globeR + 8 + i * 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Binary text floating up
  ctx.fillStyle = 'rgba(0, 255, 100, 0.15)';
  ctx.font = '8px monospace';
  for (let i = 0; i < 10; i++) {
    const bx = 15 + (i * 27) % w;
    const by = ((t * 20 + i * 40) % (h + 20)) - 10;
    ctx.fillText(i % 2 ? '01' : '10', bx, h - by);
  }
}

// --- Era 7 (new): Dyson Era ---
function drawDysonEra(ctx, w, h, t) {
  // Deep space background
  ctx.fillStyle = '#050510';
  ctx.fillRect(0, 0, w, h);
  drawStarField(ctx, w, h, 60, 777, t);

  const cx = w * 0.5, cy = h * 0.5;

  // Star at center (being enclosed)
  const starR = 12;
  const starGrd = ctx.createRadialGradient(cx, cy, 0, cx, cy, starR * 3);
  starGrd.addColorStop(0, 'rgba(255, 220, 100, 1)');
  starGrd.addColorStop(0.3, 'rgba(255, 180, 50, 0.6)');
  starGrd.addColorStop(0.7, 'rgba(255, 100, 20, 0.2)');
  starGrd.addColorStop(1, 'rgba(255, 50, 0, 0)');
  ctx.fillStyle = starGrd;
  ctx.beginPath();
  ctx.arc(cx, cy, starR * 3, 0, Math.PI * 2);
  ctx.fill();

  // Dyson sphere rings (multiple rotating rings around the star)
  for (let i = 0; i < 5; i++) {
    const ringR = starR + 15 + i * 8;
    const angle = t * (0.2 + i * 0.15) + i * 1.25;
    const tilt = 0.2 + i * 0.15;
    const pulse = 0.5 + 0.3 * Math.sin(t * 2 + i);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.scale(1, tilt);
    ctx.strokeStyle = `rgba(255, 200, 50, ${0.2 + pulse * 0.3})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, ringR, 0, Math.PI * 2);
    ctx.stroke();

    // Collector panels on ring
    const panelCount = 4 + i * 2;
    for (let j = 0; j < panelCount; j++) {
      const pa = (j / panelCount) * Math.PI * 2;
      const px = Math.cos(pa) * ringR;
      const py = Math.sin(pa) * ringR;
      ctx.fillStyle = `rgba(100, 200, 255, ${0.3 + pulse * 0.4})`;
      ctx.fillRect(px - 2, py - 1, 4, 2);
    }
    ctx.restore();
  }

  // Energy beams from panels to star
  const beamCount = 6;
  for (let i = 0; i < beamCount; i++) {
    const angle = t * 0.5 + (i / beamCount) * Math.PI * 2;
    const fromR = starR + 50;
    const fx = cx + Math.cos(angle) * fromR;
    const fy = cy + Math.sin(angle) * fromR * 0.3;
    ctx.strokeStyle = `rgba(255, 200, 50, ${0.1 + 0.1 * Math.sin(t * 4 + i)})`;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(fx, fy);
    ctx.lineTo(cx, cy);
    ctx.stroke();
  }

  // Megastructure indicator (large arc at edge)
  ctx.strokeStyle = 'rgba(100, 150, 255, 0.2)';
  ctx.lineWidth = 3;
  const arcAngle = t * 0.1;
  ctx.beginPath();
  ctx.arc(cx, cy, 80, arcAngle, arcAngle + Math.PI * 0.6);
  ctx.stroke();
}

// --- Clickable element tracking ---
// Each element: { type, x, y, r (radius for hit detection), resource, amount, label }

function getClickableElements(era, w, h, t) {
  const elements = [];

  if (era === 1) {
    // Sun position (same math as drawEra1)
    const sunAngle = (t * 0.08) % (Math.PI * 2);
    const sunX = w * 0.5 + Math.cos(sunAngle - Math.PI * 0.5) * w * 0.4;
    const sunY = h * 0.45 - Math.sin(sunAngle) * h * 0.35;
    elements.push({ type: 'sun', x: sunX, y: sunY, r: 35, resource: 'energy', amount: 1, label: '+1 Energy' });

    // Ground/hills area — wide clickable strip
    elements.push({ type: 'ground', x: w * 0.5, y: h * 0.75, r: 999, resource: 'materials', amount: 0, label: '+Materials',
      hitTest: (cx, cy) => cy > h * 0.58 });
  }

  if (era === 2) {
    // Factories (same positions as drawEra2)
    const factories = [
      { x: 15, bw: 45, bh: 50, stacks: 2 },
      { x: 80, bw: 35, bh: 40, stacks: 1 },
      { x: 135, bw: 55, bh: 55, stacks: 3 },
      { x: 210, bw: 50, bh: 45, stacks: 2 },
    ];
    const baseY = h * 0.65;
    for (const f of factories) {
      elements.push({
        type: 'factory', x: f.x + f.bw / 2, y: baseY - f.bh / 2, r: 999,
        resource: 'steel', amount: 1, label: '+1 Steel',
        hitTest: (cx, cy) => cx >= f.x && cx <= f.x + f.bw && cy >= baseY - f.bh && cy <= baseY,
      });
    }

    // Conveyor belt area
    const beltY = h * 0.78;
    elements.push({
      type: 'conveyor', x: w * 0.5, y: beltY, r: 999,
      resource: 'electronics', amount: 1, label: '+1 Electronics',
      hitTest: (cx, cy) => cy >= beltY - 8 && cy <= beltY + 10,
    });
  }

  if (era === 3) {
    // Digital Age — click the globe for software, click data nodes for data
    const cx = w * 0.5, cy = h * 0.5;
    elements.push({ type: 'star', x: cx, y: cy, r: 30, resource: 'software', amount: 1, label: '+1 Software' });
    elements.push({
      type: 'space', x: w * 0.5, y: h * 0.5, r: 999, resource: 'data', amount: 1, label: '+1 Data',
      hitTest: () => true, chance: 0.2, discoveryLabel: 'Data mined! +1',
    });
  }

  if (era === 4) {
    // Space Age (was era 3)
    const ex = w * 0.32, ey = h * 0.55, er = 34;
    elements.push({ type: 'planet', x: ex, y: ey, r: er + 12, resource: 'rocketFuel', amount: 1, label: '+1 Rocket Fuel' });
    elements.push({
      type: 'space', x: w * 0.5, y: h * 0.5, r: 999, resource: 'orbitalInfra', amount: 1, label: '+1 Orbital Infra',
      hitTest: () => true, chance: 0.15, discoveryLabel: 'Discovered debris! +1',
    });
  }

  if (era === 5) {
    const cx = w * 0.5, cy = h * 0.5;
    // Sun at center
    elements.push({ type: 'star', x: cx, y: cy, r: 14, resource: 'energy', amount: 1, label: '+1 Energy' });

    // Planets — compute positions same as drawEra4
    const planets = [
      { r: 26, size: 2, speed: 2.5, res: 'exoticMaterials' },
      { r: 35, size: 3, speed: 1.6, res: 'exoticMaterials' },
      { r: 46, size: 3.5, speed: 1.0, res: 'rocketFuel' },
      { r: 57, size: 3, speed: 0.7, res: 'rocketFuel' },
      { r: 78, size: 7, speed: 0.3, res: 'exoticMaterials' },
      { r: 95, size: 6, speed: 0.18, res: 'exoticMaterials' },
      { r: 108, size: 4, speed: 0.1, res: 'exoticMaterials' },
      { r: 120, size: 3.8, speed: 0.06, res: 'exoticMaterials' },
    ];
    for (const p of planets) {
      const angle = t * p.speed * 0.15;
      const px = cx + Math.cos(angle) * p.r;
      const py = cy + Math.sin(angle) * p.r * 0.38;
      elements.push({ type: 'planet', x: px, y: py, r: p.size + 4, resource: p.res, amount: 1, label: '+1 ' + (p.res === 'exoticMaterials' ? 'Exotic Mat.' : 'Rocket Fuel') });
    }

    // Empty space discovery
    elements.push({
      type: 'space', x: w * 0.5, y: h * 0.5, r: 999,
      resource: 'exoticMaterials', amount: 1, label: '+1 Exotic Mat.',
      hitTest: () => true, chance: 0.1, discoveryLabel: 'Found asteroid! +1',
    });
  }

  if (era === 6) {
    // Interstellar (was era 5) — Star systems as clickable nodes
    const sysRng = seededRandom(999);
    for (let i = 0; i < 10; i++) {
      const sx = 20 + sysRng() * (w - 40);
      const sy = 15 + sysRng() * (h - 30);
      const size = 2 + sysRng() * 3;
      sysRng(); // skip color
      elements.push({ type: 'star', x: sx, y: sy, r: size + 6, resource: 'darkEnergy', amount: 1, label: '+1 Dark Energy' });
    }

    elements.push({
      type: 'space', x: w * 0.5, y: h * 0.5, r: 999,
      resource: 'starSystems', amount: 1, label: '+1 Star System',
      hitTest: () => true, chance: 0.08, discoveryLabel: 'New system! +1',
    });
  }

  if (era === 7) {
    // Dyson Era — click the star or megastructures
    const cx = w * 0.5, cy = h * 0.5;
    elements.push({ type: 'star', x: cx, y: cy, r: 20, resource: 'energy', amount: 5, label: '+5 Energy' });
    elements.push({
      type: 'space', x: w * 0.5, y: h * 0.5, r: 999, resource: 'megastructures', amount: 1, label: '+1 Megastructure',
      hitTest: () => true, chance: 0.1, discoveryLabel: 'Component found! +1',
    });
  }

  if (era === 8) {
    const cx = w * 0.5, cy = h * 0.5;
    // Galactic (was era 6) — Galaxy core
    elements.push({ type: 'star', x: cx, y: cy, r: 25, resource: 'galacticInfluence', amount: 1, label: '+1 Influence' });

    // Sector nodes
    const sRng = seededRandom(42);
    const rotation = t * 0.04;
    for (let i = 0; i < 8; i++) {
      const angle = rotation + i * Math.PI * 0.25;
      const dist = 25 + sRng() * 50;
      const nx = cx + Math.cos(angle) * dist * 1.2;
      const ny = cy + Math.sin(angle) * dist * 0.5;
      elements.push({ type: 'star', x: nx, y: ny, r: 8, resource: 'exoticMatter', amount: 1, label: '+1 Exotic Matter' });
    }

    elements.push({
      type: 'space', x: w * 0.5, y: h * 0.5, r: 999,
      resource: 'exoticMatter', amount: 1, label: '+1 Exotic Matter',
      hitTest: () => true, chance: 0.08, discoveryLabel: 'Found exotic matter! +1',
    });
  }

  if (era === 9) {
    // Intergalactic — galaxy clusters + cosmic web
    const galaxies = [
      { x: w * 0.2, y: h * 0.3, size: 20 },
      { x: w * 0.7, y: h * 0.25, size: 28 },
      { x: w * 0.5, y: h * 0.65, size: 15 },
      { x: w * 0.85, y: h * 0.7, size: 12 },
      { x: w * 0.15, y: h * 0.75, size: 10 },
      { x: w * 0.48, y: h * 0.2, size: 8 },
    ];
    for (const g of galaxies) {
      elements.push({ type: 'planet', x: g.x, y: g.y, r: g.size, resource: 'cosmicPower', amount: 1, label: '+1 Cosmic Power' });
    }

    elements.push({
      type: 'space', x: w * 0.5, y: h * 0.5, r: 999,
      resource: 'universalConstants', amount: 1, label: '+1 Universal Const.',
      hitTest: () => true, chance: 0.05, discoveryLabel: 'Constant shifted! +1',
    });
  }

  if (era === 10) {
    // Multiverse — reality portals + quantum echoes
    const portals = [
      { x: w * 0.25, y: h * 0.35, r: 22 },
      { x: w * 0.72, y: h * 0.55, r: 18 },
      { x: w * 0.5, y: h * 0.75, r: 15 },
    ];
    for (const p of portals) {
      elements.push({ type: 'planet', x: p.x, y: p.y, r: p.r, resource: 'realityFragments', amount: 1, label: '+1 Reality Fragment' });
    }

    elements.push({
      type: 'space', x: w * 0.5, y: h * 0.5, r: 999,
      resource: 'quantumEchoes', amount: 1, label: '+1 Quantum Echo',
      hitTest: () => true, chance: 0.1, discoveryLabel: 'Echo detected! +1',
    });
  }

  return elements;
}

// --- Floating text system ---
function drawFloatingTexts(ctx, floatingTexts) {
  for (const ft of floatingTexts) {
    const elapsed = (performance.now() - ft.startTime) / 1000;
    if (elapsed > 0.8) continue;
    const progress = elapsed / 0.8;
    const alpha = 1 - progress;
    const yOffset = progress * 25;
    ctx.save();
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = `rgba(255,255,100,${alpha})`;
    ctx.strokeStyle = `rgba(0,0,0,${alpha * 0.7})`;
    ctx.lineWidth = 2;
    ctx.strokeText(ft.label, ft.x, ft.y - yOffset);
    ctx.fillText(ft.label, ft.x, ft.y - yOffset);
    ctx.restore();
  }
}

// --- Upgrade progress indicator overlay ---
function drawUpgradeIndicator(ctx, w, h, upgradeCount) {
  // Draw small progress dots at bottom of canvas
  const maxDots = 10;
  const filled = Math.min(upgradeCount, maxDots);
  const dotR = 2.5;
  const gap = 8;
  const totalW = maxDots * gap;
  const startX = (w - totalW) / 2;

  ctx.save();
  for (let i = 0; i < maxDots; i++) {
    const x = startX + i * gap + gap / 2;
    const y = h - 6;
    ctx.beginPath();
    ctx.arc(x, y, dotR, 0, Math.PI * 2);
    if (i < filled) {
      ctx.fillStyle = 'rgba(139, 233, 253, 0.8)';
    } else {
      ctx.fillStyle = 'rgba(100, 100, 100, 0.3)';
    }
    ctx.fill();
  }
  if (upgradeCount > maxDots) {
    ctx.font = '8px monospace';
    ctx.fillStyle = 'rgba(139, 233, 253, 0.6)';
    ctx.textAlign = 'center';
    ctx.fillText(`+${upgradeCount - maxDots}`, w / 2, h - 12);
  }
  ctx.restore();
}

// --- Particle system ---
function spawnParticles(particles, x, y, count, color, speed = 50) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const v = (0.3 + Math.random() * 0.7) * speed;
    particles.push({
      x, y,
      vx: Math.cos(angle) * v,
      vy: Math.sin(angle) * v,
      life: 0.5 + Math.random() * 0.5,
      born: performance.now() / 1000,
      color,
      size: 1 + Math.random() * 2,
    });
  }
}

function updateAndDrawParticles(ctx, particles, now) {
  const t = now / 1000;
  const alive = [];
  for (const p of particles) {
    const age = t - p.born;
    if (age > p.life) continue;
    const progress = age / p.life;
    const alpha = 1 - progress;
    const dt = 1 / 60;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 30 * dt; // gravity
    ctx.fillStyle = p.color.replace('1)', `${alpha})`);
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * (1 - progress * 0.5), 0, Math.PI * 2);
    ctx.fill();
    alive.push(p);
  }
  particles.length = 0;
  particles.push(...alive);
}

// --- Main Component ---
export function GameCanvas({ state, onUpdate }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const eraRef = useRef(state.era);
  eraRef.current = state.era;
  const stateRef = useRef(state);
  stateRef.current = state;
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;
  const floatingTextsRef = useRef([]);
  const particlesRef = useRef([]);
  const prevGemsRef = useRef(state.totalGems || 0);
  const prevEraRef = useRef(state.era);

  const handleCanvasClick = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas || !onUpdateRef.current) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const cx = (e.clientX - rect.left) * scaleX;
    const cy = (e.clientY - rect.top) * scaleY;

    const t = performance.now() / 1000;
    const w = canvas.width;
    const h = canvas.height;
    const era = eraRef.current;
    const elements = getClickableElements(era, w, h, t);

    // Check elements in order (specific targets first, 'space' catch-all last)
    const specific = elements.filter(el => el.type !== 'space');
    const catchAll = elements.filter(el => el.type === 'space');
    const ordered = [...specific, ...catchAll];

    for (const el of ordered) {
      let hit = false;
      if (el.hitTest) {
        hit = el.hitTest(cx, cy);
      } else {
        const dx = cx - el.x;
        const dy = cy - el.y;
        hit = (dx * dx + dy * dy) <= el.r * el.r;
      }

      if (!hit) continue;

      // For space catch-all, check chance
      if (el.type === 'space') {
        if (Math.random() > (el.chance || 0.1)) {
          // No discovery — show a miss indicator
          floatingTextsRef.current.push({ x: cx, y: cy, label: '...', startTime: performance.now() });
          return;
        }
        floatingTextsRef.current.push({ x: cx, y: cy, label: el.discoveryLabel || el.label, startTime: performance.now() });
      } else {
        floatingTextsRef.current.push({ x: cx, y: cy, label: el.label, startTime: performance.now() });
      }

      // Era 1 ground triggers mining mini-game
      if (era === 1 && el.type === 'ground') {
        onUpdateRef.current(s => {
          const result = mine(s);
          if (result.foundGem) {
            spawnParticles(particlesRef.current, cx, cy, 15, 'rgba(255,215,0,1)', 80);
          }
          return result.state;
        });
        return;
      }

      // All other clicks use gather + spawn small particles
      const resourceColors = {
        materials: 'rgba(180,140,100,1)', food: 'rgba(100,200,100,1)',
        energy: 'rgba(255,220,50,1)', steel: 'rgba(150,170,190,1)',
        electronics: 'rgba(100,200,255,1)', research: 'rgba(100,255,200,1)',
      };
      spawnParticles(particlesRef.current, cx, cy, 5, resourceColors[el.resource] || 'rgba(255,255,255,1)', 30);
      onUpdateRef.current(s => gather(s, el.resource, el.amount));
      return;
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    function draw(now) {
      const t = now / 1000;
      const w = canvas.width;
      const h = canvas.height;
      const era = eraRef.current;

      ctx.clearRect(0, 0, w, h);

      // Era mapping: 1=Planetfall, 2=Industrialization, 3=Digital Age,
      // 4=Space Age, 5=Solar System, 6=Interstellar, 7=Dyson Era,
      // 8=Galactic, 9=Intergalactic, 10=Multiverse
      switch (era) {
        case 1: drawEra1(ctx, w, h, t); break;
        case 2: drawEra2(ctx, w, h, t); break;
        case 3: drawDigitalAge(ctx, w, h, t); break;
        case 4: drawEra3(ctx, w, h, t); break;  // Space Age
        case 5: drawEra4(ctx, w, h, t); break;  // Solar System
        case 6: drawEra5(ctx, w, h, t); break;  // Interstellar
        case 7: drawDysonEra(ctx, w, h, t); break;
        case 8: drawEra6(ctx, w, h, t); break;  // Galactic
        case 9: drawIntergalactic(ctx, w, h, t); break;
        case 10: drawMultiverse(ctx, w, h, t); break;
        default: drawEra1(ctx, w, h, t); break;
      }

      // Draw upgrade progress indicator
      const upgradeCount = Object.keys(stateRef.current.upgrades || {}).length;
      drawUpgradeIndicator(ctx, w, h, upgradeCount);

      // Draw era name watermark in top-left
      ctx.save();
      ctx.font = 'bold 9px monospace';
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.textAlign = 'left';
      const eraLabels = ['', 'Planetfall', 'Industrial', 'Digital', 'Space', 'Solar', 'Interstellar', 'Dyson', 'Galactic', 'Intergalactic', 'Multiverse'];
      ctx.fillText(eraLabels[era] || '', 4, 12);
      ctx.restore();

      // Prosperity glow — subtle light at top-right based on total upgrades
      if (upgradeCount > 0) {
        const intensity = Math.min(upgradeCount / 50, 1);
        const eraHues = [0, 30, 60, 120, 180, 210, 240, 270, 300, 330, 0];
        const hue = eraHues[era] || 0;
        ctx.save();
        const grad = ctx.createRadialGradient(w - 10, 10, 0, w - 10, 10, 30);
        grad.addColorStop(0, `hsla(${hue}, 80%, 70%, ${intensity * 0.4})`);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fillRect(w - 40, 0, 40, 40);
        ctx.restore();
      }

      // Spawn particles on gem find (detect change)
      const currentGems = stateRef.current.totalGems || 0;
      if (currentGems > prevGemsRef.current) {
        spawnParticles(particlesRef.current, w / 2, h / 2, 20, 'rgba(255,215,0,1)', 60);
        prevGemsRef.current = currentGems;
      }

      // Spawn particles on era transition with era-themed colors
      const currentEra = stateRef.current.era;
      if (currentEra > prevEraRef.current) {
        const eraColors = {
          2: 'rgba(255,180,50,1)',    // industrial orange
          3: 'rgba(0,200,255,1)',     // digital cyan
          4: 'rgba(200,200,255,1)',   // space white-blue
          5: 'rgba(255,200,100,1)',   // solar gold
          6: 'rgba(100,150,255,1)',   // interstellar blue
          7: 'rgba(255,100,50,1)',    // dyson red-orange
          8: 'rgba(180,100,255,1)',   // galactic purple
          9: 'rgba(50,255,200,1)',    // intergalactic teal
          10: 'rgba(255,50,255,1)',   // multiverse magenta
        };
        const color = eraColors[currentEra] || 'rgba(139,233,253,1)';
        // Large central burst
        spawnParticles(particlesRef.current, w / 2, h / 2, 50, color, 150);
        // Secondary ring bursts in white
        spawnParticles(particlesRef.current, w / 2, h / 2, 20, 'rgba(255,255,255,0.9)', 100);
        // Corner bursts for drama
        spawnParticles(particlesRef.current, w * 0.2, h * 0.3, 10, color, 80);
        spawnParticles(particlesRef.current, w * 0.8, h * 0.3, 10, color, 80);
        spawnParticles(particlesRef.current, w * 0.2, h * 0.7, 10, color, 80);
        spawnParticles(particlesRef.current, w * 0.8, h * 0.7, 10, color, 80);
        prevEraRef.current = currentEra;
      }

      // Draw particles
      updateAndDrawParticles(ctx, particlesRef.current, now);

      // Draw floating texts on top
      floatingTextsRef.current = floatingTextsRef.current.filter(
        ft => (performance.now() - ft.startTime) < 800
      );
      drawFloatingTexts(ctx, floatingTextsRef.current);

      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <div className="panel canvas-panel">
      <canvas
        ref={canvasRef}
        width={280}
        height={180}
        onClick={handleCanvasClick}
        style={{ cursor: 'pointer' }}
      />
    </div>
  );
}
