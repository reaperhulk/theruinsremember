import { seededRandom, drawGlowCircle } from './shared.js';

export function drawEra1(ctx, w, h, t, state) {
  // Painterly sky gradient — deep blue-purple at top to warm sunrise at horizon
  const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.65);
  skyGrad.addColorStop(0, '#1a2040');
  skyGrad.addColorStop(0.3, '#2a3055');
  skyGrad.addColorStop(0.55, '#3a5070');
  skyGrad.addColorStop(0.75, '#604830');
  skyGrad.addColorStop(0.9, '#c07040');
  skyGrad.addColorStop(1, '#e09050');
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

  // Animated clouds — back layer (slower, more translucent, higher)
  for (let i = 0; i < 4; i++) {
    const cx = ((t * (5 + i * 2) + i * 110) % (w + 120)) - 60;
    const cy = 10 + i * 18;
    const scale = 0.9 + i * 0.15;
    ctx.fillStyle = `rgba(200,180,160,${0.12 + i * 0.03})`;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 30 * scale, 10 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx - 18 * scale, cy + 3, 20 * scale, 8 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + 20 * scale, cy + 2, 22 * scale, 9 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Animated clouds — front layer (faster, brighter)
  for (let i = 0; i < 5; i++) {
    const cx = ((t * (12 + i * 3) + i * 80) % (w + 80)) - 40;
    const cy = 18 + i * 14;
    const scale = 0.6 + i * 0.12;
    ctx.fillStyle = `rgba(255,240,220,${0.35 + i * 0.06})`;
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

  // Rolling hills (multiple layers) — alien terrain with color variation
  const hillColors = [
    ['#2a4a30', '#1e3825'],   // far hills: dark alien green
    ['#3d6840', '#2d5535'],   // mid hills
    ['#4a7a4a', '#3a6838'],   // near hills: mossy
  ];
  for (let layer = 0; layer < 3; layer++) {
    const baseY = h * 0.58 + layer * 16;
    // Gradient per hill layer for depth
    const hillGrad = ctx.createLinearGradient(0, baseY - 12, 0, baseY + 30);
    hillGrad.addColorStop(0, hillColors[layer][0]);
    hillGrad.addColorStop(1, hillColors[layer][1]);
    ctx.fillStyle = hillGrad;
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = 0; x <= w; x += 2) {
      const y = baseY
        + Math.sin(x * 0.02 + layer * 2) * 12
        + Math.sin(x * 0.04 + layer + t * 0.1) * 4
        + Math.sin(x * 0.09 + layer * 3.7) * 3; // extra undulation for alien feel
      ctx.lineTo(x, y);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();
  }

  // Subtle ground texture — scattered rocks/pebbles on nearest hill
  const rngGround = seededRandom(77);
  for (let i = 0; i < 20; i++) {
    const rx = rngGround() * w;
    const ry = h * 0.74 + Math.sin(rx * 0.02 + 4) * 12 + rngGround() * 10;
    const rr = 0.8 + rngGround() * 1.5;
    ctx.fillStyle = `rgba(60,80,50,${0.2 + rngGround() * 0.15})`;
    ctx.beginPath();
    ctx.arc(rx, ry, rr, 0, Math.PI * 2);
    ctx.fill();
  }

  // Small buildings — scale with upgrade count
  const upgradeTotal = Object.keys(state?.upgrades || {}).length;
  const visibleBuildings = Math.min(Math.floor(upgradeTotal / 3), 4);
  const allBuildings = [
    { x: 40, w: 16, h: 20 },
    { x: 90, w: 12, h: 14 },
    { x: 200, w: 18, h: 24 },
    { x: 240, w: 10, h: 12 },
  ];
  const buildings = allBuildings.slice(0, visibleBuildings);
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

  // Wrecked ship hull in background (half-buried)
  const wreckX = w * 0.7;
  const wreckGroundY = h * 0.68 + Math.sin(wreckX * 0.02 + 4) * 12;

  // Cooling metal glow underneath the wreck
  const glowPulse = 0.5 + 0.3 * Math.sin(t * 0.6);
  const wreckGlow = ctx.createRadialGradient(wreckX, wreckGroundY, 5, wreckX, wreckGroundY, 45);
  wreckGlow.addColorStop(0, `rgba(255,120,40,${0.15 * glowPulse})`);
  wreckGlow.addColorStop(0.5, `rgba(255,80,20,${0.08 * glowPulse})`);
  wreckGlow.addColorStop(1, 'rgba(255,60,10,0)');
  ctx.fillStyle = wreckGlow;
  ctx.beginPath();
  ctx.arc(wreckX, wreckGroundY, 45, 0, Math.PI * 2);
  ctx.fill();

  // Scattered debris around the crash site
  const rngDebris = seededRandom(99);
  for (let i = 0; i < 8; i++) {
    const dx = wreckX - 40 + rngDebris() * 80;
    const dy = wreckGroundY - 5 + rngDebris() * 15;
    const dSize = 1 + rngDebris() * 2.5;
    const dAngle = rngDebris() * Math.PI;
    ctx.save();
    ctx.translate(dx, dy);
    ctx.rotate(dAngle);
    ctx.fillStyle = `rgba(${100 + Math.floor(rngDebris() * 40)},${90 + Math.floor(rngDebris() * 30)},${100 + Math.floor(rngDebris() * 30)},0.6)`;
    ctx.fillRect(-dSize, -dSize * 0.4, dSize * 2, dSize * 0.8);
    ctx.restore();
  }

  // Main hull
  ctx.fillStyle = '#8a8a9a';
  ctx.beginPath();
  ctx.ellipse(wreckX, wreckGroundY, 28, 10, -0.15, 0, Math.PI);
  ctx.fill();
  ctx.fillStyle = '#6a6a7a';
  ctx.beginPath();
  ctx.ellipse(wreckX, wreckGroundY, 28, 10, -0.15, Math.PI, Math.PI * 2);
  ctx.fill();

  // Scorch marks on the hull
  ctx.strokeStyle = 'rgba(40,30,20,0.3)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(wreckX - 15, wreckGroundY - 5);
  ctx.quadraticCurveTo(wreckX - 5, wreckGroundY - 8, wreckX + 8, wreckGroundY - 3);
  ctx.stroke();

  // Hull detail lines
  ctx.strokeStyle = '#5a5a6a';
  ctx.lineWidth = 0.8;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(wreckX - 20 + i * 12, wreckGroundY - 6);
    ctx.lineTo(wreckX - 18 + i * 12, wreckGroundY + 2);
    ctx.stroke();
  }
  // Broken antenna sticking out
  ctx.strokeStyle = '#aaa';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(wreckX + 10, wreckGroundY - 8);
  ctx.lineTo(wreckX + 16, wreckGroundY - 22);
  ctx.lineTo(wreckX + 20, wreckGroundY - 20);
  ctx.stroke();

  // Gouge/trench behind the wreck (crash furrow)
  ctx.strokeStyle = 'rgba(50,40,30,0.25)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(wreckX + 28, wreckGroundY + 2);
  ctx.quadraticCurveTo(wreckX + 50, wreckGroundY + 5, wreckX + 70, wreckGroundY + 8);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(50,40,30,0.12)';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(wreckX + 55, wreckGroundY + 6);
  ctx.quadraticCurveTo(wreckX + 75, wreckGroundY + 10, wreckX + 90, wreckGroundY + 14);
  ctx.stroke();

  // Fireflies / lightning bugs in the evening sky — tiny yellow dots that blink
  const fireflyRng = seededRandom(142);
  for (let i = 0; i < 8; i++) {
    const fx = fireflyRng() * w;
    const fy = h * 0.45 + fireflyRng() * (h * 0.35);
    const blinkPhase = Math.sin(t * (1.5 + fireflyRng() * 3) + fireflyRng() * 6.28);
    if (blinkPhase > 0.3) {
      const ffAlpha = (blinkPhase - 0.3) * 0.7;
      ctx.fillStyle = `rgba(255,240,80,${ffAlpha})`;
      ctx.beginPath();
      ctx.arc(fx + Math.sin(t * 0.5 + i) * 3, fy + Math.cos(t * 0.7 + i) * 2, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Birds in the sky
  for (let i = 0; i < 4; i++) {
    const bx = ((t * (8 + i * 4) + i * 70) % (w + 60)) - 30;
    const by = 30 + i * 12 + Math.sin(t * 1.5 + i) * 3;
    ctx.strokeStyle = `rgba(30,30,30,${0.3 + i * 0.08})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(bx - 4, by + 2);
    ctx.quadraticCurveTo(bx - 2, by - 2, bx, by);
    ctx.quadraticCurveTo(bx + 2, by - 2, bx + 4, by + 2);
    ctx.stroke();
  }

  // Weather system — rain transitions to snow as era 2 approaches
  const eraUpgradeCount = Object.keys(state?.upgrades || {}).length;
  const industrialProgress = Math.min(eraUpgradeCount / 8, 1); // 0=natural, 1=polluted
  const weatherCycle = (Math.sin(t * 0.05) + 1) / 2; // 0-1 slow cycle
  if (weatherCycle > 0.6) { // weather appears ~40% of the time
    const weatherIntensity = (weatherCycle - 0.6) / 0.4;
    const isSnow = industrialProgress > 0.6;
    const dropCount = Math.floor(weatherIntensity * 30);
    const rng = seededRandom(Math.floor(t * 2));
    for (let i = 0; i < dropCount; i++) {
      const dx = rng() * w;
      const dy = ((rng() * h + t * (isSnow ? 20 : 120)) % (h + 10)) - 5;
      if (isSnow) {
        // Snow — slow falling dots
        ctx.fillStyle = `rgba(220,230,240,${0.3 + rng() * 0.3})`;
        ctx.beginPath();
        ctx.arc(dx + Math.sin(t * 0.8 + i) * 3, dy, 1 + rng(), 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Rain — fast falling lines
        ctx.strokeStyle = `rgba(150,180,220,${0.15 + rng() * 0.15})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(dx, dy);
        ctx.lineTo(dx - 1, dy + 5 + rng() * 3);
        ctx.stroke();
      }
    }
  }

  // Animated grass/plants swaying at bottom
  for (let gx = 0; gx < w; gx += 4) {
    const groundY = h * 0.74 + Math.sin(gx * 0.02 + 4) * 12 + Math.sin(gx * 0.04 + 1 + t * 0.1) * 4;
    const sway = Math.sin(t * 1.5 + gx * 0.15) * 3;
    const grassH = 6 + Math.sin(gx * 0.7) * 3;
    ctx.strokeStyle = `rgba(80,${140 + Math.floor(Math.sin(gx) * 20)},60,0.6)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(gx, groundY);
    ctx.quadraticCurveTo(gx + sway * 0.5, groundY - grassH * 0.6, gx + sway, groundY - grassH);
    ctx.stroke();
  }

  // Smoke trails from crash site — multiple plumes
  for (let plume = 0; plume < 3; plume++) {
    const plumeOffX = [-8, 5, 18][plume];
    const plumeSpeed = [0.4, 0.3, 0.35][plume];
    const plumeCount = [6, 5, 4][plume];
    for (let p = 0; p < plumeCount; p++) {
      const age = ((t * plumeSpeed + p * 0.5 + plume * 0.7) % 3.5);
      const drift = Math.sin(age * 1.2 + plume * 2.1 + p) * (age * 5);
      const smokeX = wreckX + plumeOffX + drift;
      const smokeY = wreckGroundY - 8 - age * 20;
      const size = 2 + age * 3.5;
      const alpha = Math.max(0, 0.22 - age * 0.06);
      // Dark smoke core
      ctx.fillStyle = `rgba(80,80,90,${alpha * 0.6})`;
      ctx.beginPath();
      ctx.arc(smokeX, smokeY, size * 0.6, 0, Math.PI * 2);
      ctx.fill();
      // Lighter smoke edge
      ctx.fillStyle = `rgba(140,135,130,${alpha})`;
      ctx.beginPath();
      ctx.arc(smokeX, smokeY, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Settlers walking — with heads, arms, and tools
  for (let i = 0; i < 6; i++) {
    const sx = ((t * (15 + i * 5) + i * 50) % (w + 20)) - 10;
    const groundY = h * 0.74 + Math.sin(sx * 0.02 + 4) * 12;
    const legPhase = Math.sin(t * 4 + i * 2);
    const armPhase = Math.sin(t * 4 + i * 2 + 1);
    // Body (torso)
    ctx.fillStyle = ['#6B3A2A', '#5A4A3A', '#4A3A2A', '#7A4530', '#554030', '#6A4028'][i];
    ctx.fillRect(sx - 1.5, groundY - 11, 3, 6);
    // Head
    ctx.fillStyle = '#D4A574';
    ctx.beginPath();
    ctx.arc(sx, groundY - 13, 2.5, 0, Math.PI * 2);
    ctx.fill();
    // Arms
    ctx.strokeStyle = '#6B3A2A';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sx, groundY - 9);
    ctx.lineTo(sx - 3 - armPhase * 1.5, groundY - 6);
    ctx.moveTo(sx, groundY - 9);
    ctx.lineTo(sx + 3 + armPhase * 1.5, groundY - 6);
    ctx.stroke();
    // Legs
    ctx.strokeStyle = '#5A3020';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(sx, groundY - 5);
    ctx.lineTo(sx - legPhase * 2, groundY);
    ctx.moveTo(sx, groundY - 5);
    ctx.lineTo(sx + legPhase * 2, groundY);
    ctx.stroke();
    // Tool — alternate between pickaxe, spear, and carrying bundle
    const toolType = i % 3;
    ctx.strokeStyle = '#8B7355';
    ctx.lineWidth = 0.8;
    if (toolType === 0) {
      // Pickaxe over shoulder
      const toolTip = sx + 4 + armPhase;
      ctx.beginPath();
      ctx.moveTo(sx + 2, groundY - 7);
      ctx.lineTo(toolTip, groundY - 16);
      ctx.stroke();
      ctx.strokeStyle = '#999';
      ctx.beginPath();
      ctx.moveTo(toolTip - 2, groundY - 16);
      ctx.lineTo(toolTip + 2, groundY - 14);
      ctx.stroke();
    } else if (toolType === 1) {
      // Walking staff / spear
      ctx.beginPath();
      ctx.moveTo(sx + 3, groundY - 8);
      ctx.lineTo(sx + 4, groundY - 18);
      ctx.stroke();
    } else {
      // Carrying bundle on back
      ctx.fillStyle = 'rgba(140,110,70,0.7)';
      ctx.beginPath();
      ctx.arc(sx - 2, groundY - 10, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Production particles rising from buildings
  if (buildings.length > 0) {
    const prodRate = Object.values(state?.resources || {})
      .filter(r => r.unlocked)
      .reduce((sum, r) => sum + Math.max(0, (r.baseRate + r.rateAdd) * r.rateMult), 0);
    const particleDensity = Math.min(Math.floor(prodRate / 5), 15);
    const prodColors = ['rgba(100,200,100,', 'rgba(180,140,100,', 'rgba(255,220,100,'];
    for (let i = 0; i < particleDensity; i++) {
      const b = buildings[i % buildings.length];
      const groundY = h * 0.72 + Math.sin(b.x * 0.02 + 4) * 12 + Math.sin(b.x * 0.04 + 1 + t * 0.1) * 4;
      const bx = b.x + b.w / 2 + (Math.sin(t * 3 + i * 7.1) * 0.5) * 15;
      const driftY = (t * 10 + i * 13.7) % 25;
      const by = groundY - b.h - 5 - driftY;
      const alpha = 0.15 + 0.2 * (1 - driftY / 25);
      const colorBase = prodColors[i % prodColors.length];
      ctx.fillStyle = `${colorBase}${alpha})`;
      ctx.beginPath();
      ctx.arc(bx, by, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// --- Era 2: Industrialization ---
