import { useRef, useEffect, useCallback } from 'react';
import { mine } from '../engine/mining.js';
import { gather, getEffectiveCap, getEffectiveRate } from '../engine/resources.js';
import { countEraUpgrades, getMinUpgradesForEra } from '../engine/eras.js';
import { playClick } from './AudioManager.js';

// --- Shared Helpers ---

// Module-level parallax offset (set per frame by the canvas component)
let _parallaxX = 0, _parallaxY = 0;

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
  const px = _parallaxX * 4;
  const py = _parallaxY * 3;
  for (let i = 0; i < count; i++) {
    const baseX = rng() * w;
    const baseY = rng() * h;
    const baseSize = rng() * 1.5 + 0.5;
    const depth = 0.5 + rng() * 0.5; // parallax depth layer
    const x = baseX + px * depth;
    const y = baseY + py * depth;
    const brightness = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(twinkleT * (1 + rng() * 2) + rng() * 6.28));
    if (x < -5 || x > w + 5 || y < -5 || y > h + 5) continue;
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

const ruinLore = [
  'A carved stone bears an inscription: "We built. We grew. We\u2014" The rest is worn away.',
  'Beneath the rubble, a perfectly preserved gear. It fits your machines exactly.',
  'A child\'s toy, made of alloys that shouldn\'t exist for another three eras.',
  'Foundation stones with your colony\'s coordinates etched into them. Dated 40,000 years ago.',
  'A mirror that shows a city where your camp stands. The streets match your planned layout.',
  'Sealed jars containing seeds of every crop you\'ve planted. Already labeled.',
  'A blueprint for a machine you haven\'t invented yet. The handwriting is yours.',
  'A countdown timer, still running. It started before your species existed.',
];

const resourceColorMap = {
  materials: 'rgba(180,140,100,1)', food: 'rgba(100,200,100,1)',
  energy: 'rgba(255,220,50,1)', steel: 'rgba(150,170,190,1)',
  electronics: 'rgba(100,200,255,1)', research: 'rgba(100,255,200,1)',
  software: 'rgba(0,200,180,1)', data: 'rgba(80,180,255,1)',
  rocketFuel: 'rgba(255,120,50,1)', orbitalInfra: 'rgba(180,180,220,1)',
  exoticMaterials: 'rgba(200,150,255,1)', colonies: 'rgba(100,220,150,1)',
  darkEnergy: 'rgba(120,80,200,1)', starSystems: 'rgba(180,200,255,1)',
  galacticInfluence: 'rgba(100,220,255,1)', megastructures: 'rgba(200,180,100,1)',
  stellarForge: 'rgba(255,180,80,1)', exoticMatter: 'rgba(220,100,255,1)',
  cosmicPower: 'rgba(180,100,255,1)', universalConstants: 'rgba(200,220,255,1)',
  realityFragments: 'rgba(255,150,200,1)', quantumEchoes: 'rgba(150,200,255,1)',
};

// --- Era 1: Planetfall ---
function drawEra1(ctx, w, h, t, state) {
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
function drawEra2(ctx, w, h, t, state) {
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

  // Ground with cobblestone texture
  const groundGrad = ctx.createLinearGradient(0, h * 0.65, 0, h);
  groundGrad.addColorStop(0, '#5a4a3a');
  groundGrad.addColorStop(1, '#3a3025');
  ctx.fillStyle = groundGrad;
  ctx.fillRect(0, h * 0.65, w, h * 0.35);

  // Cobblestone / industrial ground texture
  const rngCobble = seededRandom(123);
  for (let i = 0; i < 30; i++) {
    const cx = rngCobble() * w;
    const cy = h * 0.68 + rngCobble() * (h * 0.3);
    const cr = 1.5 + rngCobble() * 2;
    ctx.strokeStyle = `rgba(80,70,55,${0.15 + rngCobble() * 0.1})`;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.arc(cx, cy, cr, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Puddles (reflective spots)
  const rngPuddle = seededRandom(456);
  for (let i = 0; i < 5; i++) {
    const px = 20 + rngPuddle() * (w - 40);
    const py = h * 0.72 + rngPuddle() * (h * 0.18);
    const pw = 6 + rngPuddle() * 10;
    const ph = 2 + rngPuddle() * 3;
    const puddleGrad = ctx.createRadialGradient(px, py, 0, px, py, pw);
    puddleGrad.addColorStop(0, `rgba(${skyR + 40},${skyG + 30},${skyB + 20},0.15)`);
    puddleGrad.addColorStop(1, 'rgba(60,50,40,0)');
    ctx.fillStyle = puddleGrad;
    ctx.beginPath();
    ctx.ellipse(px, py, pw, ph, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Railway tracks across the bottom
  const trackY = h * 0.82;
  ctx.strokeStyle = 'rgba(100,90,75,0.4)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, trackY);
  ctx.lineTo(w, trackY);
  ctx.moveTo(0, trackY + 5);
  ctx.lineTo(w, trackY + 5);
  ctx.stroke();
  // Railroad ties
  ctx.strokeStyle = 'rgba(80,60,40,0.3)';
  ctx.lineWidth = 2;
  for (let rx = 0; rx < w; rx += 8) {
    ctx.beginPath();
    ctx.moveTo(rx, trackY - 1);
    ctx.lineTo(rx, trackY + 6);
    ctx.stroke();
  }

  // Steel production rate affects smoke thickness
  const steelRate = state ? ((state.resources?.steel?.baseRate || 0) + (state.resources?.steel?.rateAdd || 0)) * (state.resources?.steel?.rateMult || 1) : 0;
  const smokeDensity = Math.min(1, steelRate * 0.15);

  // Factories — scale with upgrade count
  const factoryCount = Math.min(Math.floor(Object.keys(state?.upgrades || {}).length / 10) + 1, 6);
  const allFactories = [
    { x: 15, bw: 45, bh: 50, stacks: 2 },
    { x: 80, bw: 35, bh: 40, stacks: 1 },
    { x: 135, bw: 55, bh: 55, stacks: 3 },
    { x: 210, bw: 50, bh: 45, stacks: 2 },
    { x: 50, bw: 40, bh: 38, stacks: 1 },
    { x: 170, bw: 48, bh: 52, stacks: 2 },
  ];
  const factories = allFactories.slice(0, factoryCount);

  for (let fi = 0; fi < factories.length; fi++) {
    const f = factories[fi];
    const baseY = h * 0.65;

    // Building body with slight variation per factory
    const bGrad = ctx.createLinearGradient(f.x, baseY - f.bh, f.x, baseY);
    const shade = fi % 2 === 0 ? 0 : 15;
    bGrad.addColorStop(0, `rgb(${102 + shade},${102 + shade},${102 + shade})`);
    bGrad.addColorStop(1, `rgb(${68 + shade},${68 + shade},${68 + shade})`);
    ctx.fillStyle = bGrad;
    ctx.fillRect(f.x, baseY - f.bh, f.bw, f.bh);

    // Roofline detail — sawtooth or flat depending on factory
    if (fi % 3 === 0) {
      ctx.fillStyle = '#5a5a5a';
      for (let rx = f.x; rx < f.x + f.bw - 5; rx += 10) {
        ctx.beginPath();
        ctx.moveTo(rx, baseY - f.bh);
        ctx.lineTo(rx + 5, baseY - f.bh - 6);
        ctx.lineTo(rx + 10, baseY - f.bh);
        ctx.fill();
      }
    }

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

    // Smokestacks — varied heights
    for (let s = 0; s < f.stacks; s++) {
      const sx = f.x + 8 + s * (f.bw / (f.stacks + 1));
      const stackH = 20 + (s % 2) * 8 + (fi % 3) * 4; // varied heights
      const stackW = 5 + (s % 2);

      // Stack body
      ctx.fillStyle = '#555';
      ctx.fillRect(sx - stackW / 2, baseY - f.bh - stackH, stackW, stackH + 2);
      // Stack cap
      ctx.fillStyle = '#4a4a4a';
      ctx.fillRect(sx - stackW / 2 - 1, baseY - f.bh - stackH - 2, stackW + 2, 3);

      // Smoke particles rising — thickness scales with steel production
      const smokeCount = Math.floor(4 + smokeDensity * 8);
      for (let p = 0; p < smokeCount; p++) {
        const age = ((t * 0.8 + p * 0.3 + s + f.x * 0.01) % 2.5);
        const py = baseY - f.bh - stackH - 4 - age * 30;
        const px = sx + Math.sin(age * 2 + s) * (age * 6);
        const size = (3 + age * 4) * (0.6 + smokeDensity * 0.6);
        const alpha = Math.max(0, (0.3 + smokeDensity * 0.2) - age * 0.14);
        ctx.fillStyle = `rgba(150,140,130,${alpha})`;
        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Sparks from chimneys — occasional bright particles
      if (smokeDensity > 0.1) {
        const sparkCount = Math.floor(2 + smokeDensity * 4);
        for (let sp = 0; sp < sparkCount; sp++) {
          const sparkAge = ((t * 1.5 + sp * 0.7 + s * 1.3 + fi * 2.1) % 1.5);
          if (sparkAge < 0.8) {
            const sparkX = sx + Math.sin(sparkAge * 4 + sp * 3) * (sparkAge * 8);
            const sparkY = baseY - f.bh - stackH - 4 - sparkAge * 25;
            const sparkAlpha = Math.max(0, 0.8 - sparkAge * 1.2);
            ctx.fillStyle = `rgba(255,${Math.floor(200 - sparkAge * 150)},${Math.floor(50 - sparkAge * 50)},${sparkAlpha})`;
            ctx.beginPath();
            ctx.arc(sparkX, sparkY, 0.8, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }

    // Water tower on every other factory
    if (fi % 2 === 1 && fi < 4) {
      const wtX = f.x + f.bw - 6;
      const wtBaseY = baseY - f.bh;
      // Legs
      ctx.strokeStyle = '#666';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(wtX - 3, wtBaseY);
      ctx.lineTo(wtX - 1, wtBaseY - 15);
      ctx.moveTo(wtX + 3, wtBaseY);
      ctx.lineTo(wtX + 1, wtBaseY - 15);
      ctx.stroke();
      // Tank
      ctx.fillStyle = '#7a7a7a';
      ctx.fillRect(wtX - 4, wtBaseY - 20, 8, 6);
      ctx.fillStyle = '#6a6a6a';
      ctx.beginPath();
      ctx.ellipse(wtX, wtBaseY - 20, 4, 1.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Catwalk between adjacent factories
    if (fi > 0 && fi < factories.length) {
      const prevF = factories[fi - 1];
      const cwY = baseY - Math.min(f.bh, prevF.bh) + 5;
      const cwFromX = prevF.x + prevF.bw;
      const cwToX = f.x;
      if (cwToX > cwFromX && cwToX - cwFromX < 50) {
        ctx.strokeStyle = 'rgba(120,120,120,0.4)';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(cwFromX, cwY);
        ctx.lineTo(cwToX, cwY);
        ctx.moveTo(cwFromX, cwY + 3);
        ctx.lineTo(cwToX, cwY + 3);
        ctx.stroke();
        // Railing posts
        for (let rx = cwFromX; rx <= cwToX; rx += 6) {
          ctx.beginPath();
          ctx.moveTo(rx, cwY);
          ctx.lineTo(rx, cwY + 3);
          ctx.stroke();
        }
      }
    }
  }

  // Clock tower silhouette on first factory
  if (factories.length > 0) {
    const cf = factories[0];
    const ctX = cf.x + cf.bw - 4;
    const ctBaseY = h * 0.65 - cf.bh;
    ctx.fillStyle = '#4a4a4a';
    ctx.fillRect(ctX - 3, ctBaseY - 22, 6, 22);
    // Belfry top
    ctx.beginPath();
    ctx.moveTo(ctX - 5, ctBaseY - 22);
    ctx.lineTo(ctX, ctBaseY - 30);
    ctx.lineTo(ctX + 5, ctBaseY - 22);
    ctx.closePath();
    ctx.fill();
    // Clock face
    ctx.fillStyle = 'rgba(255,240,200,0.6)';
    ctx.beginPath();
    ctx.arc(ctX, ctBaseY - 14, 3, 0, Math.PI * 2);
    ctx.fill();
    // Clock hands
    const hrAngle = (t * 0.1) % (Math.PI * 2);
    const minAngle = (t * 0.8) % (Math.PI * 2);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(ctX, ctBaseY - 14);
    ctx.lineTo(ctX + Math.sin(hrAngle) * 1.8, ctBaseY - 14 - Math.cos(hrAngle) * 1.8);
    ctx.moveTo(ctX, ctBaseY - 14);
    ctx.lineTo(ctX + Math.sin(minAngle) * 2.5, ctBaseY - 14 - Math.cos(minAngle) * 2.5);
    ctx.stroke();
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

  // Animated gears on factory exteriors
  const gearPositions = [
    { x: 60, y: h * 0.65 - 8, r: 6 },
    { x: 155, y: h * 0.65 - 12, r: 8 },
    { x: 235, y: h * 0.65 - 6, r: 5 },
  ];
  for (const g of gearPositions) {
    const teeth = g.r > 6 ? 8 : 6;
    const angle = t * 1.5 * (g.r > 6 ? 1 : -1.4);
    ctx.save();
    ctx.translate(g.x, g.y);
    ctx.rotate(angle);
    // Gear body
    ctx.fillStyle = '#777';
    ctx.beginPath();
    ctx.arc(0, 0, g.r * 0.65, 0, Math.PI * 2);
    ctx.fill();
    // Gear teeth
    for (let i = 0; i < teeth; i++) {
      const a = (i / teeth) * Math.PI * 2;
      ctx.fillStyle = '#888';
      ctx.beginPath();
      ctx.moveTo(Math.cos(a - 0.2) * g.r * 0.55, Math.sin(a - 0.2) * g.r * 0.55);
      ctx.lineTo(Math.cos(a - 0.15) * g.r, Math.sin(a - 0.15) * g.r);
      ctx.lineTo(Math.cos(a + 0.15) * g.r, Math.sin(a + 0.15) * g.r);
      ctx.lineTo(Math.cos(a + 0.2) * g.r * 0.55, Math.sin(a + 0.2) * g.r * 0.55);
      ctx.closePath();
      ctx.fill();
    }
    // Center hole
    ctx.fillStyle = '#444';
    ctx.beginPath();
    ctx.arc(0, 0, g.r * 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Production particles rising from factories
  if (factories.length > 0) {
    const prodRate = Object.values(state?.resources || {})
      .filter(r => r.unlocked)
      .reduce((sum, r) => sum + Math.max(0, (r.baseRate + r.rateAdd) * r.rateMult), 0);
    const particleDensity = Math.min(Math.floor(prodRate / 5), 15);
    const baseY = h * 0.65;
    const prodColors = ['rgba(150,170,190,', 'rgba(100,200,255,', 'rgba(255,220,100,'];
    for (let i = 0; i < particleDensity; i++) {
      const f = factories[i % factories.length];
      const fx = f.x + f.bw / 2 + (Math.sin(t * 2.5 + i * 5.3) * 0.5) * f.bw * 0.6;
      const driftY = (t * 12 + i * 11.3) % 30;
      const fy = baseY - f.bh - 5 - driftY;
      const alpha = 0.15 + 0.2 * (1 - driftY / 30);
      const colorBase = prodColors[i % prodColors.length];
      ctx.fillStyle = `${colorBase}${alpha})`;
      ctx.beginPath();
      ctx.arc(fx, fy, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Pollution haze — gradient overlay that thickens with production
  const hazeThickness = 0.06 + smokeDensity * 0.12 + (1 - dayPhase) * 0.06;
  const hazeGrad = ctx.createLinearGradient(0, 0, 0, h * 0.55);
  hazeGrad.addColorStop(0, `rgba(90,75,55,${hazeThickness * 1.2})`);
  hazeGrad.addColorStop(0.4, `rgba(100,85,65,${hazeThickness * 0.8})`);
  hazeGrad.addColorStop(0.7, `rgba(110,95,70,${hazeThickness * 0.4})`);
  hazeGrad.addColorStop(1, 'rgba(110,95,70,0)');
  ctx.fillStyle = hazeGrad;
  ctx.fillRect(0, 0, w, h * 0.55);
}

// --- Era 3: Space Age ---
function drawEra3(ctx, w, h, t, state) {
  // Deep space background
  ctx.fillStyle = '#000012';
  ctx.fillRect(0, 0, w, h);
  // Colored star field — blue-white, yellow, and red stars
  const starRng = seededRandom(333);
  const spx = _parallaxX * 4, spy = _parallaxY * 3;
  const starColors = [[200,220,255],[255,255,255],[255,240,200],[255,200,100],[255,150,120],[180,200,255]];
  for (let i = 0; i < 80; i++) {
    const baseX = starRng() * w, baseY = starRng() * h;
    const baseSize = starRng() * 1.5 + 0.5;
    const depth = 0.5 + starRng() * 0.5;
    const ssx = baseX + spx * depth, ssy = baseY + spy * depth;
    if (ssx < -5 || ssx > w + 5 || ssy < -5 || ssy > h + 5) continue;
    const brightness = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(t * (1 + starRng() * 2) + starRng() * 6.28));
    const col = starColors[Math.floor(starRng() * starColors.length)];
    ctx.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},${brightness})`;
    ctx.beginPath();
    ctx.arc(ssx, ssy, baseSize, 0, Math.PI * 2);
    ctx.fill();
  }

  // Earth
  const ex = w * 0.32, ey = h * 0.55, er = 34;

  // Outer atmospheric glow ring
  const outerAtmos = ctx.createRadialGradient(ex, ey, er - 2, ex, ey, er + 18);
  outerAtmos.addColorStop(0, 'rgba(80,160,255,0)');
  outerAtmos.addColorStop(0.5, 'rgba(100,180,255,0.25)');
  outerAtmos.addColorStop(0.75, 'rgba(120,200,255,0.15)');
  outerAtmos.addColorStop(1, 'transparent');
  ctx.fillStyle = outerAtmos;
  ctx.beginPath();
  ctx.arc(ex, ey, er + 18, 0, Math.PI * 2);
  ctx.fill();

  // Planet body — ocean base
  const earthGrad = ctx.createRadialGradient(ex - 8, ey - 8, 2, ex, ey, er);
  earthGrad.addColorStop(0, '#5090d0');
  earthGrad.addColorStop(0.4, '#3070b0');
  earthGrad.addColorStop(0.8, '#2060a0');
  earthGrad.addColorStop(1, '#1a3060');
  ctx.fillStyle = earthGrad;
  ctx.beginPath();
  ctx.arc(ex, ey, er, 0, Math.PI * 2);
  ctx.fill();

  // Continent patches as color blobs
  ctx.save();
  ctx.beginPath();
  ctx.arc(ex, ey, er, 0, Math.PI * 2);
  ctx.clip();
  const continentRng = seededRandom(4455);
  const continents = [
    { ox: -12, oy: -8, cw: 16, ch: 12 },
    { ox: 6, oy: -14, cw: 14, ch: 10 },
    { ox: 10, oy: -2, cw: 18, ch: 14 },
    { ox: 18, oy: -10, cw: 12, ch: 8 },
    { ox: -18, oy: 10, cw: 10, ch: 6 },
    { ox: 14, oy: 12, cw: 14, ch: 8 },
  ];
  const cRot = t * 0.06;
  for (const c of continents) {
    const crx = ex + Math.cos(cRot) * c.ox - Math.sin(cRot) * c.oy;
    const cry = ey + Math.sin(cRot) * c.ox * 0.3 + Math.cos(cRot) * c.oy;
    const distFromCenter = Math.sqrt((crx - ex) ** 2 + (cry - ey) ** 2);
    if (distFromCenter > er - 3) continue;
    const green = 0.3 + continentRng() * 0.15;
    ctx.fillStyle = `rgba(50,${Math.floor(120 + continentRng() * 60)},50,${green})`;
    ctx.beginPath();
    ctx.ellipse(crx, cry, c.cw * 0.5, c.ch * 0.5, continentRng() * 0.5, 0, Math.PI * 2);
    ctx.fill();
    if (continentRng() > 0.5) {
      ctx.fillStyle = 'rgba(160,140,80,0.2)';
      ctx.beginPath();
      ctx.ellipse(crx + 2, cry + 1, c.cw * 0.25, c.ch * 0.25, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // Cloud swirls — multiple layers
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  for (let i = 0; i < 8; i++) {
    const cloudX = ex - 20 + ((t * 3 + i * 18) % (er * 2 + 10));
    const cloudY = ey - 18 + i * 7;
    ctx.beginPath();
    ctx.ellipse(cloudX, cloudY, 10 + i * 2.5, 2.5 + Math.sin(i) * 1, 0.2 * i, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.07)';
  for (let i = 0; i < 4; i++) {
    const wx = ex - 25 + ((t * 4 + i * 30) % (er * 2 + 20));
    const wy = ey - 10 + i * 12;
    ctx.beginPath();
    ctx.ellipse(wx, wy, 18, 1.5, -0.15 * i, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Terminator shadow (day/night line)
  const termGrad = ctx.createLinearGradient(ex - er, ey, ex + er, ey);
  termGrad.addColorStop(0, 'rgba(0,0,0,0)');
  termGrad.addColorStop(0.6, 'rgba(0,0,0,0)');
  termGrad.addColorStop(0.85, 'rgba(0,0,20,0.3)');
  termGrad.addColorStop(1, 'rgba(0,0,20,0.5)');
  ctx.fillStyle = termGrad;
  ctx.beginPath();
  ctx.arc(ex, ey, er, 0, Math.PI * 2);
  ctx.fill();

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

  // ISS-like station — detailed with solar panels, docking ports, rotating section
  const issAngle = t * 0.12;
  const issX = ex + Math.cos(issAngle) * (er + 30);
  const issY = ey + Math.sin(issAngle) * (er + 30) * 0.4;
  // Main truss
  ctx.fillStyle = '#ddd';
  ctx.fillRect(issX - 10, issY - 1, 20, 2);
  // Central module
  ctx.fillStyle = '#bbc';
  ctx.fillRect(issX - 3, issY - 4, 6, 8);
  // Pressurized modules
  ctx.fillStyle = '#ccd';
  ctx.fillRect(issX - 1, issY - 6, 2, 3);
  ctx.fillRect(issX - 1, issY + 3, 2, 3);
  // Large gold solar panels (4 pairs)
  ctx.fillStyle = '#c8a030';
  ctx.fillRect(issX - 14, issY - 4, 4, 8);
  ctx.fillRect(issX - 19, issY - 3, 4, 6);
  ctx.fillRect(issX + 10, issY - 4, 4, 8);
  ctx.fillRect(issX + 15, issY - 3, 4, 6);
  // Docking ports
  ctx.fillStyle = '#999';
  ctx.beginPath();
  ctx.arc(issX, issY - 7, 1.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(issX, issY + 7, 1.2, 0, Math.PI * 2);
  ctx.fill();
  // Rotating section
  ctx.strokeStyle = 'rgba(200,200,220,0.6)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.ellipse(issX + 6, issY, 3, 3, t * 2, 0, Math.PI * 2);
  ctx.stroke();
  // Satellite dishes that slowly rotate
  for (let d = 0; d < 2; d++) {
    const dishX = issX + (d === 0 ? -8 : 8);
    const dishY = issY + (d === 0 ? -5 : 5);
    const dishAngle = t * 0.3 + d * Math.PI;
    ctx.save();
    ctx.translate(dishX, dishY);
    ctx.rotate(dishAngle);
    ctx.strokeStyle = '#bbb';
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.arc(0, 0, 2.5, -0.8, 0.8);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 2);
    ctx.stroke();
    ctx.restore();
  }

  // Rocket launch — frequency scales with rocketFuel production
  const fuelRate = state ? ((state.resources?.rocketFuel?.baseRate || 0) + (state.resources?.rocketFuel?.rateAdd || 0)) * (state.resources?.rocketFuel?.rateMult || 1) : 0;
  const launchFrequency = Math.max(0.1, 2 - fuelRate * 0.1);
  const rocketSpeed = 1 / (launchFrequency * 4);
  const rocketCycle = (t * rocketSpeed) % 4;
  if (rocketCycle < 2.5) {
    const progress = Math.min(rocketCycle / 2.5, 1);
    const rx = w * 0.75;
    const ry = h * 0.9 - progress * h * 0.95;
    // Extended exhaust trail — fading particles behind the rocket
    for (let p = 0; p < 25; p++) {
      const trailY = ry + 8 + p * 5;
      if (trailY > h) break;
      const alpha = Math.max(0, 0.6 - p * 0.025);
      const spread = p * 1.8;
      ctx.fillStyle = `rgba(255,${Math.max(0, 200 - p * 10)},${Math.max(0, 80 - p * 4)},${alpha})`;
      ctx.beginPath();
      ctx.arc(rx + (Math.sin(p * 0.7 + t * 8) * spread * 0.25), trailY, 2.5 + spread * 0.2, 0, Math.PI * 2);
      ctx.fill();
      if (p > 5) {
        ctx.fillStyle = `rgba(200,200,220,${alpha * 0.3})`;
        ctx.beginPath();
        ctx.arc(rx + (Math.sin(p * 1.1 + t * 6) * spread * 0.4), trailY, 1 + spread * 0.15, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // Rocket body
    ctx.fillStyle = '#e8e8e8';
    ctx.beginPath();
    ctx.moveTo(rx, ry - 8);
    ctx.lineTo(rx + 4, ry + 6);
    ctx.lineTo(rx - 4, ry + 6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#aaa';
    ctx.fillRect(rx - 3, ry, 6, 2);
    // Nose cone
    ctx.fillStyle = '#cc3333';
    ctx.beginPath();
    ctx.moveTo(rx, ry - 12);
    ctx.lineTo(rx + 2, ry - 6);
    ctx.lineTo(rx - 2, ry - 6);
    ctx.closePath();
    ctx.fill();
    // Fins
    ctx.fillStyle = '#cc3333';
    ctx.beginPath();
    ctx.moveTo(rx - 4, ry + 4);
    ctx.lineTo(rx - 6, ry + 8);
    ctx.lineTo(rx - 3, ry + 6);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(rx + 4, ry + 4);
    ctx.lineTo(rx + 6, ry + 8);
    ctx.lineTo(rx + 3, ry + 6);
    ctx.closePath();
    ctx.fill();
    // Engine glow
    ctx.fillStyle = `rgba(255,200,50,${0.6 + 0.3 * Math.sin(t * 15)})`;
    ctx.beginPath();
    ctx.arc(rx, ry + 7, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

// --- Era 4: Solar System ---
function drawEra4(ctx, w, h, t, state) {
  ctx.fillStyle = '#000008';
  ctx.fillRect(0, 0, w, h);
  drawStarField(ctx, w, h, 60, 444, t);

  const cx = w * 0.5, cy = h * 0.5;

  // Sun with prominent glow and corona
  drawGlowCircle(ctx, cx, cy, 14, 'rgba(255,200,50,0.7)', 45);
  drawGlowCircle(ctx, cx, cy, 10, 'rgba(255,180,30,0.4)', 60);

  // Corona rays extending outward
  for (let r = 0; r < 12; r++) {
    const rayAngle = r * (Math.PI * 2 / 12) + t * 0.05;
    const rayLen = 18 + 8 * Math.sin(t * 0.7 + r * 1.3);
    const rayAlpha = 0.06 + 0.04 * Math.sin(t * 1.5 + r);
    ctx.strokeStyle = `rgba(255,220,100,${rayAlpha})`;
    ctx.lineWidth = 2 + Math.sin(t + r) * 0.5;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(rayAngle) * 15, cy + Math.sin(rayAngle) * 15);
    ctx.lineTo(cx + Math.cos(rayAngle) * (15 + rayLen), cy + Math.sin(rayAngle) * (15 + rayLen));
    ctx.stroke();
  }

  const sunGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, 14);
  sunGrad.addColorStop(0, '#fffef0');
  sunGrad.addColorStop(0.3, '#FFD700');
  sunGrad.addColorStop(0.7, '#ff9900');
  sunGrad.addColorStop(1, '#ff6600');
  ctx.fillStyle = sunGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, 14, 0, Math.PI * 2);
  ctx.fill();

  // Animated solar prominences — arcs of fire rising and falling
  for (let f = 0; f < 5; f++) {
    const promAngle = f * (Math.PI * 2 / 5) + t * 0.15;
    const promHeight = 5 + 6 * Math.sin(t * 1.2 + f * 2.0);
    const promBase1x = cx + Math.cos(promAngle - 0.15) * 14;
    const promBase1y = cy + Math.sin(promAngle - 0.15) * 14;
    const promBase2x = cx + Math.cos(promAngle + 0.15) * 14;
    const promBase2y = cy + Math.sin(promAngle + 0.15) * 14;
    const promPeakx = cx + Math.cos(promAngle) * (14 + promHeight);
    const promPeaky = cy + Math.sin(promAngle) * (14 + promHeight);
    const promAlpha = 0.15 + 0.1 * Math.sin(t * 2 + f);
    ctx.strokeStyle = `rgba(255,180,50,${promAlpha})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(promBase1x, promBase1y);
    ctx.quadraticCurveTo(promPeakx, promPeaky, promBase2x, promBase2y);
    ctx.stroke();
    // Glow at peak
    ctx.fillStyle = `rgba(255,200,80,${promAlpha * 0.6})`;
    ctx.beginPath();
    ctx.arc(promPeakx, promPeaky, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Planets with orbit trails — speed scales with player progress
  const prodScale = state ? Math.min(2, 1 + Object.keys(state.upgrades || {}).length * 0.01) : 1;
  const planets = [
    { r: 26, size: 2, color: '#bbb', speed: 2.5 * prodScale, name: 'mercury' },
    { r: 35, size: 3, color: '#e8c870', speed: 1.6 * prodScale, name: 'venus' },
    { r: 46, size: 3.5, color: '#4488cc', speed: 1.0 * prodScale, name: 'earth', hasColony: true },
    { r: 57, size: 3, color: '#cc6633', speed: 0.7 * prodScale, name: 'mars', hasColony: true },
    { r: 78, size: 7, color: '#d4a050', speed: 0.3 * prodScale, name: 'jupiter' },
    { r: 95, size: 6, color: '#c8b060', speed: 0.18 * prodScale, name: 'saturn', rings: true },
    { r: 108, size: 4, color: '#88bbcc', speed: 0.1 * prodScale, name: 'uranus' },
    { r: 120, size: 3.8, color: '#4466cc', speed: 0.06 * prodScale, name: 'neptune' },
  ];

  // Orbit lines — dotted circles showing solar system structure
  ctx.setLineDash([3, 5]);
  for (const p of planets) {
    ctx.strokeStyle = 'rgba(255,255,255,0.07)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.ellipse(cx, cy, p.r, p.r * 0.38, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // Asteroid belt — visible band of scattered rocks
  const rng = seededRandom(777);
  for (let i = 0; i < 80; i++) {
    const aR = 64 + rng() * 12;
    const aAngle = rng() * Math.PI * 2 + t * 0.15;
    const ax = cx + Math.cos(aAngle) * aR;
    const ay = cy + Math.sin(aAngle) * aR * 0.38;
    const aSize = 0.5 + rng() * 1.2;
    const aBright = 0.15 + rng() * 0.35;
    ctx.fillStyle = `rgba(${150 + Math.floor(rng() * 50)},${140 + Math.floor(rng() * 40)},${120 + Math.floor(rng() * 40)},${aBright})`;
    ctx.beginPath();
    ctx.arc(ax, ay, aSize, 0, Math.PI * 2);
    ctx.fill();
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

    // Planet with unique appearance per type
    const pGrad = ctx.createRadialGradient(px - p.size * 0.3, py - p.size * 0.3, 0, px, py, p.size);
    pGrad.addColorStop(0, '#fff');
    pGrad.addColorStop(0.3, p.color);
    pGrad.addColorStop(1, '#222');
    ctx.fillStyle = pGrad;
    ctx.beginPath();
    ctx.arc(px, py, p.size, 0, Math.PI * 2);
    ctx.fill();

    // Gas giant bands (Jupiter and Saturn)
    if (p.name === 'jupiter' || p.name === 'saturn') {
      ctx.save();
      ctx.beginPath();
      ctx.arc(px, py, p.size, 0, Math.PI * 2);
      ctx.clip();
      const bandColors = p.name === 'jupiter'
        ? ['rgba(180,120,60,0.2)', 'rgba(200,160,80,0.15)', 'rgba(160,100,50,0.2)']
        : ['rgba(200,180,100,0.15)', 'rgba(180,160,80,0.12)', 'rgba(210,190,120,0.15)'];
      for (let b = 0; b < bandColors.length; b++) {
        ctx.fillStyle = bandColors[b];
        ctx.fillRect(px - p.size, py - p.size + b * (p.size * 0.5), p.size * 2, p.size * 0.3);
      }
      // Jupiter Great Red Spot
      if (p.name === 'jupiter') {
        ctx.fillStyle = 'rgba(200,80,40,0.25)';
        ctx.beginPath();
        ctx.ellipse(px + p.size * 0.3, py + p.size * 0.2, 2, 1.3, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // Ice world shimmer (Uranus and Neptune)
    if (p.name === 'uranus' || p.name === 'neptune') {
      const iceAlpha = 0.1 + 0.08 * Math.sin(t * 2 + (p.name === 'uranus' ? 0 : 3));
      ctx.fillStyle = `rgba(180,220,255,${iceAlpha})`;
      ctx.beginPath();
      ctx.arc(px, py, p.size * 0.85, 0, Math.PI * 2);
      ctx.fill();
    }

    // Mars surface detail
    if (p.name === 'mars') {
      ctx.save();
      ctx.beginPath();
      ctx.arc(px, py, p.size, 0, Math.PI * 2);
      ctx.clip();
      ctx.fillStyle = 'rgba(180,80,40,0.2)';
      ctx.beginPath();
      ctx.ellipse(px - 0.5, py - 0.5, p.size * 0.4, p.size * 0.3, 0.3, 0, Math.PI * 2);
      ctx.fill();
      // Polar cap
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.beginPath();
      ctx.ellipse(px, py - p.size * 0.7, p.size * 0.4, p.size * 0.15, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Saturn rings — multiple concentric rings
    if (p.rings) {
      ctx.strokeStyle = 'rgba(210,190,130,0.45)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(px, py, p.size + 3, 1.5, 0.3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(190,170,110,0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(px, py, p.size + 5, 2.2, 0.3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(170,150,100,0.25)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.ellipse(px, py, p.size + 7, 3, 0.3, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Uranus faint ring
    if (p.name === 'uranus') {
      ctx.strokeStyle = 'rgba(150,200,220,0.2)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.ellipse(px, py, p.size + 3, 1.2, 1.2, 0, Math.PI * 2);
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

    // Comet with tail that occasionally crosses the solar system
    if (p.name === 'neptune') {
      const cometCycle = (t * 0.06) % 6;
      if (cometCycle < 3) {
        const cometProgress = cometCycle / 3;
        const cometX = w * (1.1 - cometProgress * 1.3);
        const cometY = h * 0.1 + cometProgress * h * 0.7;
        // Tail
        for (let tc = 0; tc < 8; tc++) {
          const tailAlpha = 0.3 - tc * 0.035;
          if (tailAlpha <= 0) break;
          ctx.fillStyle = `rgba(200,220,255,${tailAlpha})`;
          ctx.beginPath();
          ctx.arc(cometX + tc * 4, cometY - tc * 2.5, 1.5 - tc * 0.12, 0, Math.PI * 2);
          ctx.fill();
        }
        // Head
        ctx.fillStyle = 'rgba(255,255,240,0.9)';
        ctx.beginPath();
        ctx.arc(cometX, cometY, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Colony dots on planets when colony count > 10
    const colonyCount = state.resources?.colonies?.amount || 0;
    if (colonyCount > 10) {
      const dotsPerPlanet = Math.min(6, Math.floor(colonyCount / 20));
      for (let d = 0; d < dotsPerPlanet; d++) {
        const dotAngle = (d / dotsPerPlanet) * Math.PI * 2 + t * 0.5;
        const dotR = p.size * 0.6;
        const dx = px + Math.cos(dotAngle) * dotR;
        const dy = py + Math.sin(dotAngle) * dotR;
        ctx.fillStyle = `rgba(0,255,200,${0.3 + 0.3 * Math.sin(t * 2 + d)})`;
        ctx.beginPath();
        ctx.arc(dx, dy, 0.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

// --- Era 5: Interstellar ---
function drawEra5(ctx, w, h, t, state) {
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
function drawEra6(ctx, w, h, t, state) {
  ctx.fillStyle = '#020008';
  ctx.fillRect(0, 0, w, h);

  // Nebula clouds in background — distinct purple/blue haze
  const nebRng = seededRandom(611);
  for (let i = 0; i < 5; i++) {
    const nx = nebRng() * w;
    const ny = nebRng() * h;
    const nr = 30 + nebRng() * 50;
    const hue = 240 + nebRng() * 60;
    const nebGrad = ctx.createRadialGradient(nx, ny, 0, nx, ny, nr);
    nebGrad.addColorStop(0, `hsla(${hue},60%,25%,${0.06 + 0.03 * Math.sin(t * 0.3 + i)})`);
    nebGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = nebGrad;
    ctx.beginPath();
    ctx.arc(nx, ny, nr, 0, Math.PI * 2);
    ctx.fill();
  }

  drawStarField(ctx, w, h, 40, 600, t);

  const cx = w * 0.5, cy = h * 0.5;
  const rotation = t * 0.04;

  // --- GALAXY: Impressive spiral with dust lanes, bright core, 4 arms ---

  // Central bulge — large golden glow
  const bulgeGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 35);
  bulgeGrad.addColorStop(0, 'rgba(255,245,200,0.9)');
  bulgeGrad.addColorStop(0.15, 'rgba(255,230,160,0.6)');
  bulgeGrad.addColorStop(0.4, 'rgba(255,200,100,0.2)');
  bulgeGrad.addColorStop(0.7, 'rgba(200,150,80,0.05)');
  bulgeGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = bulgeGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, 35, 0, Math.PI * 2);
  ctx.fill();

  // Bright core point
  drawGlowCircle(ctx, cx, cy, 3, 'rgba(255,255,240,0.95)', 10);

  // 4 spiral arms with stars and dust lanes
  for (let arm = 0; arm < 4; arm++) {
    const armOffset = arm * Math.PI * 0.5;
    const armRng = seededRandom(arm * 2000 + 50);
    for (let i = 0; i < 70; i++) {
      const dist = 10 + i * 1.1;
      const angle = rotation + armOffset + dist * 0.07;
      const spread = (0.6 + Math.sin(i * 0.2) * 0.3) * (dist * 0.035);

      const ox = (armRng() - 0.5) * spread * 7;
      const oy = (armRng() - 0.5) * spread * 7;

      const x = cx + Math.cos(angle) * dist * 1.2 + ox;
      const y = cy + Math.sin(angle) * dist * 0.45 + oy;

      if (x < -5 || x > w + 5 || y < -5 || y > h + 5) continue;

      const distFromCenter = Math.sqrt((x - cx) ** 2 + ((y - cy) * 2.2) ** 2);
      const brightness = Math.max(0.04, 0.55 - distFromCenter / 180);
      const size = 0.4 + armRng() * 1.0;

      // Color: blue-white inner, yellow middle, red-orange outer
      const colorT = Math.min(1, dist / 90);
      const r = Math.floor(lerp(190, 255, colorT));
      const g = Math.floor(lerp(200, 170, colorT));
      const b = Math.floor(lerp(255, 130, colorT));

      ctx.fillStyle = `rgba(${r},${g},${b},${brightness})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();

      // Dust lanes — dark reddish-brown patches trailing each arm
      if (i % 10 === 0 && armRng() > 0.4) {
        const dustAngle = angle - 0.12;
        const dustDist = dist + 2;
        const dx2 = cx + Math.cos(dustAngle) * dustDist * 1.2 + ox * 0.5;
        const dy2 = cy + Math.sin(dustAngle) * dustDist * 0.45 + oy * 0.5;
        const dustAlpha = 0.04 + 0.02 * Math.sin(t * 0.2 + i);
        const dustR = 3 + armRng() * 4;
        ctx.fillStyle = `rgba(40,15,10,${dustAlpha})`;
        ctx.beginPath();
        ctx.arc(dx2, dy2, dustR, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Quasar jet — narrow beam of light perpendicular to the galaxy disc
  const jetPulse = 0.5 + 0.3 * Math.sin(t * 1.5);
  const jetAlpha = 0.08 + 0.06 * jetPulse;
  // Top jet
  const jetGrad1 = ctx.createLinearGradient(cx, cy, cx, cy - 70);
  jetGrad1.addColorStop(0, `rgba(150,180,255,${jetAlpha * 1.5})`);
  jetGrad1.addColorStop(0.3, `rgba(120,150,255,${jetAlpha})`);
  jetGrad1.addColorStop(1, 'transparent');
  ctx.fillStyle = jetGrad1;
  ctx.beginPath();
  ctx.moveTo(cx - 2, cy);
  ctx.lineTo(cx - 5, cy - 70);
  ctx.lineTo(cx + 5, cy - 70);
  ctx.lineTo(cx + 2, cy);
  ctx.closePath();
  ctx.fill();
  // Bottom jet
  const jetGrad2 = ctx.createLinearGradient(cx, cy, cx, cy + 70);
  jetGrad2.addColorStop(0, `rgba(150,180,255,${jetAlpha * 1.5})`);
  jetGrad2.addColorStop(0.3, `rgba(120,150,255,${jetAlpha})`);
  jetGrad2.addColorStop(1, 'transparent');
  ctx.fillStyle = jetGrad2;
  ctx.beginPath();
  ctx.moveTo(cx - 2, cy);
  ctx.lineTo(cx - 5, cy + 70);
  ctx.lineTo(cx + 5, cy + 70);
  ctx.lineTo(cx + 2, cy);
  ctx.closePath();
  ctx.fill();

  // --- SECTOR NODES: Small galaxy cluster groups instead of single circles ---
  const sectorNodes = [];
  const sRng = seededRandom(42);
  for (let i = 0; i < 8; i++) {
    const angle = rotation + i * Math.PI * 0.25;
    const dist = 30 + sRng() * 50;
    sectorNodes.push({
      x: cx + Math.cos(angle) * dist * 1.2,
      y: cy + Math.sin(angle) * dist * 0.5,
    });
  }

  // Network lines between sectors
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

  // Draw sector nodes as tiny galaxy clusters (groups of glowing dots)
  const giAmount = state?.resources?.galacticInfluence?.amount || 0;
  const nodeScale = 1 + Math.min(giAmount / 500, 1.5);
  for (let ni = 0; ni < sectorNodes.length; ni++) {
    const n = sectorNodes[ni];
    const clusterRng = seededRandom(ni * 300 + 77);
    const clusterSize = (3 + Math.sin(t * 2 + n.x) * 1) * nodeScale;
    // Cluster glow
    const glowAlpha = 0.15 + 0.1 * Math.sin(t * 2 + ni);
    drawGlowCircle(ctx, n.x, n.y, clusterSize * 0.5, `rgba(100,200,255,${glowAlpha})`, clusterSize * 2.5);
    // 5-7 tiny dots forming a mini cluster
    const dotCount = 5 + Math.floor(clusterRng() * 3);
    for (let d = 0; d < dotCount; d++) {
      const dx = (clusterRng() - 0.5) * clusterSize * 2;
      const dy = (clusterRng() - 0.5) * clusterSize * 2;
      const dotAlpha = 0.4 + 0.4 * Math.sin(t * 3 + d + ni);
      const dotSize = 0.4 + clusterRng() * 0.6;
      ctx.fillStyle = `rgba(180,220,255,${dotAlpha})`;
      ctx.beginPath();
      ctx.arc(n.x + dx, n.y + dy, dotSize, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // --- WORMHOLES: Glowing pulsing rings at fixed positions ---
  const wormholes = [
    { x: w * 0.22, y: h * 0.38, r: 8 },
    { x: w * 0.78, y: h * 0.42, r: 7 },
    { x: w * 0.55, y: h * 0.72, r: 6 },
  ];
  for (let wi = 0; wi < wormholes.length; wi++) {
    const wh = wormholes[wi];
    const pulseR = wh.r * (1 + 0.15 * Math.sin(t * 3 + wi * 2));
    const whHue = (t * 30 + wi * 120) % 360;
    // Outer distortion glow
    const distGrad = ctx.createRadialGradient(wh.x, wh.y, pulseR * 0.5, wh.x, wh.y, pulseR * 2.5);
    distGrad.addColorStop(0, `hsla(${whHue},80%,60%,0.15)`);
    distGrad.addColorStop(0.6, `hsla(${whHue + 30},60%,40%,0.05)`);
    distGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = distGrad;
    ctx.beginPath();
    ctx.arc(wh.x, wh.y, pulseR * 2.5, 0, Math.PI * 2);
    ctx.fill();
    // Glowing ring
    ctx.strokeStyle = `hsla(${whHue},90%,70%,${0.4 + 0.2 * Math.sin(t * 4 + wi)})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(wh.x, wh.y, pulseR, 0, Math.PI * 2);
    ctx.stroke();
    // Inner ring
    ctx.strokeStyle = `hsla(${whHue},80%,80%,${0.25 + 0.15 * Math.sin(t * 5 + wi)})`;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(wh.x, wh.y, pulseR * 0.6, 0, Math.PI * 2);
    ctx.stroke();
    // Dark center (event horizon)
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.beginPath();
    ctx.arc(wh.x, wh.y, pulseR * 0.35, 0, Math.PI * 2);
    ctx.fill();
  }

  // Senate faction-colored particles when a faction has majority
  const senate = state?.senate || {};
  const senateTotal = (senate.merchants || 0) + (senate.scholars || 0) + (senate.warriors || 0);
  if (senateTotal > 0) {
    const factionColors = { merchants: [221, 170, 68], scholars: [136, 187, 238], warriors: [238, 102, 68] };
    const maxCount = Math.max(senate.merchants || 0, senate.scholars || 0, senate.warriors || 0);
    const majorityFaction = Object.entries(senate).find(([, v]) => v === maxCount && maxCount > 0);
    if (majorityFaction) {
      const [fid] = majorityFaction;
      const col = factionColors[fid] || [200, 200, 200];
      const pCount = Math.min(12, maxCount * 2);
      for (let i = 0; i < pCount; i++) {
        const angle = t * 0.6 + (i / pCount) * Math.PI * 2;
        const dist = 60 + 20 * Math.sin(t * 0.8 + i);
        const px = cx + Math.cos(angle) * dist * 1.2;
        const py = cy + Math.sin(angle) * dist * 0.5;
        const alpha = 0.3 + 0.3 * Math.sin(t * 3 + i * 1.5);
        ctx.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},${alpha})`;
        ctx.beginPath();
        ctx.arc(px, py, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

// --- Era 9: Intergalactic ---
function drawIntergalactic(ctx, w, h, t, state) {
  // Deep cosmic void
  const bgGrad = ctx.createRadialGradient(w * 0.5, h * 0.5, 0, w * 0.5, h * 0.5, w);
  bgGrad.addColorStop(0, '#0a0020');
  bgGrad.addColorStop(0.4, '#050012');
  bgGrad.addColorStop(1, '#020008');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  // --- VOID REGIONS: dark patches of nothingness between filaments ---
  const voidRng = seededRandom(1234);
  for (let i = 0; i < 6; i++) {
    const vx = voidRng() * w;
    const vy = voidRng() * h;
    const vr = 25 + voidRng() * 40;
    const voidGradPatch = ctx.createRadialGradient(vx, vy, 0, vx, vy, vr);
    voidGradPatch.addColorStop(0, 'rgba(0,0,2,0.4)');
    voidGradPatch.addColorStop(0.6, 'rgba(0,0,5,0.15)');
    voidGradPatch.addColorStop(1, 'transparent');
    ctx.fillStyle = voidGradPatch;
    ctx.beginPath();
    ctx.arc(vx, vy, vr, 0, Math.PI * 2);
    ctx.fill();
  }

  drawStarField(ctx, w, h, 30, 500, t);

  // --- COSMIC WEB: filaments with varied thickness and galaxy sprites at nodes ---
  const nodes = [];
  const nodeRng = seededRandom(999);
  for (let i = 0; i < 14; i++) {
    nodes.push({
      x: nodeRng() * w, y: nodeRng() * h,
      size: 3 + nodeRng() * 8,
      mass: 0.3 + nodeRng() * 0.7, // mass determines filament thickness
    });
  }

  const cpAmount = state?.resources?.cosmicPower?.amount || 0;
  const filamentBoost = 1 + Math.min(cpAmount / 200, 3);

  // Draw filaments with varied thickness based on combined node mass
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[i].x - nodes[j].x;
      const dy = nodes[i].y - nodes[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < w * 0.4) {
        const alpha = (1 - dist / (w * 0.4)) * 0.12 * filamentBoost;
        const pulse = 0.5 + 0.5 * Math.sin(t * 0.5 + i + j);
        const combinedMass = nodes[i].mass + nodes[j].mass;
        const thickness = 0.5 + combinedMass * 1.5;
        // Outer glow strand
        ctx.strokeStyle = `rgba(80,40,180,${Math.min(alpha * pulse * 0.4, 0.3)})`;
        ctx.lineWidth = thickness + 3;
        ctx.beginPath();
        ctx.moveTo(nodes[i].x, nodes[i].y);
        const mx = (nodes[i].x + nodes[j].x) / 2 + Math.sin(t * 0.3 + i) * 10;
        const my = (nodes[i].y + nodes[j].y) / 2 + Math.cos(t * 0.4 + j) * 8;
        ctx.quadraticCurveTo(mx, my, nodes[j].x, nodes[j].y);
        ctx.stroke();
        // Core strand
        ctx.strokeStyle = `rgba(120,80,220,${Math.min(alpha * pulse, 0.8)})`;
        ctx.lineWidth = thickness;
        ctx.beginPath();
        ctx.moveTo(nodes[i].x, nodes[i].y);
        ctx.quadraticCurveTo(mx, my, nodes[j].x, nodes[j].y);
        ctx.stroke();

        // Energy particles traveling along filaments
        for (let p = 0; p < 2; p++) {
          const pT = ((t * 0.4 + i * 0.3 + j * 0.7 + p * 0.5) % 1);
          const pAlpha = alpha * pulse * 0.8;
          if (pAlpha > 0.02) {
            // Quadratic bezier interpolation
            const px = (1 - pT) * (1 - pT) * nodes[i].x + 2 * (1 - pT) * pT * mx + pT * pT * nodes[j].x;
            const py = (1 - pT) * (1 - pT) * nodes[i].y + 2 * (1 - pT) * pT * my + pT * pT * nodes[j].y;
            ctx.fillStyle = `rgba(180,140,255,${Math.min(pAlpha, 0.6)})`;
            ctx.beginPath();
            ctx.arc(px, py, 1, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }
  }

  // Galaxy cluster nodes — tiny galaxy sprites with redshift (farther = more red)
  for (let ni = 0; ni < nodes.length; ni++) {
    const node = nodes[ni];
    const distFromCenter = Math.sqrt((node.x - w * 0.5) ** 2 + (node.y - h * 0.5) ** 2);
    const maxDist = Math.sqrt((w * 0.5) ** 2 + (h * 0.5) ** 2);
    const redshiftAmount = Math.min(1, distFromCenter / maxDist);
    // Shift hue toward red (0) for distant galaxies
    const baseHue = (node.x * 2 + node.y + t * 10) % 360;
    const hue = baseHue * (1 - redshiftAmount * 0.7) + redshiftAmount * 15;
    // Node glow
    drawGlowCircle(ctx, node.x, node.y, node.size * 0.3, `hsla(${hue},70%,60%,0.5)`, node.size * 1.8);
    // Tiny galaxy sprite — a few dots in a mini-spiral pattern
    const gRng = seededRandom(ni * 500 + 123);
    for (let s = 0; s < 8; s++) {
      const sDist = 1 + s * node.size * 0.08;
      const sAngle = t * 0.05 + ni + s * 0.8;
      const sx = node.x + Math.cos(sAngle) * sDist;
      const sy = node.y + Math.sin(sAngle) * sDist * 0.5;
      const sAlpha = 0.3 + 0.3 * Math.sin(t * 2 + s + ni);
      ctx.fillStyle = `hsla(${hue},60%,75%,${sAlpha})`;
      ctx.beginPath();
      ctx.arc(sx, sy, 0.3 + gRng() * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
    // Bright core of galaxy sprite
    ctx.fillStyle = `hsla(${hue},80%,85%,0.6)`;
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.size * 0.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // --- GRAVITATIONAL LENSING: Einstein rings with distorted background stars ---
  const cx = w * 0.5, cy = h * 0.5;
  for (let arc = 0; arc < 4; arc++) {
    const arcAngle = t * 0.08 + arc * Math.PI / 2;
    const arcR = 28 + arc * 14;
    const hue = (arc * 80 + t * 15) % 360;
    // Outer diffuse arc (Einstein ring glow)
    ctx.strokeStyle = `hsla(${hue},50%,55%,${0.04 + 0.03 * Math.sin(t + arc)})`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(cx, cy, arcR, arcAngle, arcAngle + Math.PI * 0.7);
    ctx.stroke();
    // Core arc
    ctx.strokeStyle = `hsla(${hue},65%,65%,${0.1 + 0.06 * Math.sin(t + arc)})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, arcR, arcAngle, arcAngle + Math.PI * 0.7);
    ctx.stroke();
    // Distorted background star dots along the arc
    for (let sd = 0; sd < 4; sd++) {
      const sdAngle = arcAngle + (sd / 4) * Math.PI * 0.7;
      const sdx = cx + Math.cos(sdAngle) * arcR + Math.sin(t * 2 + sd) * 1.5;
      const sdy = cy + Math.sin(sdAngle) * arcR + Math.cos(t * 2 + sd) * 1.5;
      const sdAlpha = 0.15 + 0.1 * Math.sin(t * 3 + sd + arc);
      ctx.fillStyle = `hsla(${hue + 20},40%,80%,${sdAlpha})`;
      ctx.beginPath();
      ctx.arc(sdx, sdy, 0.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Central void attractor
  const voidGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 25);
  voidGrad.addColorStop(0, `rgba(60,0,120,${0.3 + 0.15 * Math.sin(t * 0.8)})`);
  voidGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = voidGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, 25, 0, Math.PI * 2);
  ctx.fill();

  // Expanding cosmic ripples
  for (let r = 0; r < 3; r++) {
    const rippleR = ((t * 8 + r * 40) % 120);
    const rippleAlpha = Math.max(0, 0.15 - rippleR / 800);
    if (rippleAlpha > 0) {
      ctx.strokeStyle = `rgba(150,100,255,${rippleAlpha})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, rippleR, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}

// --- Era 10: Multiverse ---
function drawMultiverse(ctx, w, h, t, state) {
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

  // Distant stars visible through reality tears
  drawStarField(ctx, w, h, 25, 1010, t);

  // Quantum interference pattern (reduced iterations)
  for (let x = 0; x < w; x += 6) {
    const wave1 = Math.sin(x * 0.05 + t * 2) * 0.5;
    const wave2 = Math.sin(x * 0.08 - t * 1.5) * 0.3;
    const intensity = Math.abs(wave1 + wave2);
    if (intensity > 0.3) {
      ctx.fillStyle = `rgba(200,100,255,${intensity * 0.08})`;
      ctx.fillRect(x, 0, 4, h);
    }
  }

  // --- DIMENSIONAL RIFTS: jagged tears with alternate reality colors bleeding through ---
  const riftRng = seededRandom(4040);
  for (let rift = 0; rift < 4; rift++) {
    const startX = riftRng() * w;
    const startY = riftRng() * h * 0.3 + h * 0.1;
    const riftHue = (rift * 90 + t * 25) % 360;
    const altHue = (riftHue + 180) % 360;
    const flickerAlpha = 0.15 + 0.25 * Math.abs(Math.sin(t * 4 + rift * 1.7));
    const segments = 6 + Math.floor(riftRng() * 4);

    // Color bleed from alternate reality behind the rift
    let rx = startX, ry = startY;
    const riftPath = [{ x: rx, y: ry }];
    const innerRng = seededRandom(rift * 100 + 500);
    for (let s = 0; s < segments; s++) {
      rx += (innerRng() - 0.4) * 18 + Math.sin(t * 2.5 + s) * 4;
      ry += 8 + innerRng() * 12;
      riftPath.push({ x: rx, y: ry });
    }

    // Glow behind rift — alternate reality color
    ctx.strokeStyle = `hsla(${altHue},70%,55%,${flickerAlpha * 0.35})`;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(riftPath[0].x, riftPath[0].y);
    for (let s = 1; s < riftPath.length; s++) ctx.lineTo(riftPath[s].x, riftPath[s].y);
    ctx.stroke();

    // Mid glow
    ctx.strokeStyle = `hsla(${riftHue},80%,65%,${flickerAlpha * 0.5})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(riftPath[0].x, riftPath[0].y);
    for (let s = 1; s < riftPath.length; s++) ctx.lineTo(riftPath[s].x, riftPath[s].y);
    ctx.stroke();

    // Sharp rift line
    ctx.strokeStyle = `hsla(${riftHue},90%,85%,${flickerAlpha})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(riftPath[0].x, riftPath[0].y);
    for (let s = 1; s < riftPath.length; s++) ctx.lineTo(riftPath[s].x, riftPath[s].y);
    ctx.stroke();
  }

  // --- REALITY BUBBLES: each shows a tiny glimpse of a different era ---
  // Era color themes for bubble interiors
  const eraThemes = [
    { colors: ['#e09050', '#604830', '#1a2040'], label: 'planet' },     // era 1 planetfall
    { colors: ['#8B4513', '#D2691E', '#FF6347'], label: 'industry' },   // era 2 industry
    { colors: ['#0a0e1a', '#00ff88', '#4488ff'], label: 'digital' },    // era 3 digital
    { colors: ['#1a1a3a', '#4444aa', '#88aaff'], label: 'space' },      // era 4 space
    { colors: ['#0a0a2a', '#FFD700', '#FF8C00'], label: 'solar' },      // era 5 solar system
    { colors: ['#0a0020', '#6644cc', '#aa88ff'], label: 'stellar' },    // era 6 interstellar
    { colors: ['#080015', '#ff6600', '#ffcc00'], label: 'dyson' },      // era 7 dyson
    { colors: ['#020008', '#6688ff', '#aaccff'], label: 'galaxy' },     // era 8 galactic
    { colors: ['#050012', '#6030c0', '#9966ff'], label: 'cosmic' },     // era 9 intergalactic
  ];

  const rfAmount = state?.resources?.realityFragments?.amount || 0;
  const bubbleCount = Math.min(3 + Math.floor(rfAmount / 50), 10);
  const bubbleRng = seededRandom(1010);
  for (let i = 0; i < bubbleCount; i++) {
    const bx = bubbleRng() * w;
    const by = bubbleRng() * h;
    const br = 12 + bubbleRng() * 22;
    const breathe = 1 + 0.08 * Math.sin(t * 1.2 + i * 0.8);
    const eraIdx = i % eraThemes.length;
    const theme = eraThemes[eraIdx];
    const hue = (i * 45 + t * 15) % 360;
    const bR = br * breathe;

    // Membrane
    ctx.strokeStyle = `hsla(${hue},70%,60%,${0.2 + 0.1 * Math.sin(t * 2 + i)})`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(bx, by, bR, 0, Math.PI * 2);
    ctx.stroke();

    // Interior — era-themed color gradient suggesting that era's scene
    ctx.save();
    ctx.beginPath();
    ctx.arc(bx, by, bR * 0.95, 0, Math.PI * 2);
    ctx.clip();

    const bubbleGrad = ctx.createLinearGradient(bx - bR, by - bR, bx + bR, by + bR);
    bubbleGrad.addColorStop(0, theme.colors[0]);
    bubbleGrad.addColorStop(0.5, theme.colors[1]);
    bubbleGrad.addColorStop(1, theme.colors[2]);
    ctx.globalAlpha = 0.12 + 0.04 * Math.sin(t * 1.5 + i);
    ctx.fillStyle = bubbleGrad;
    ctx.fillRect(bx - bR, by - bR, bR * 2, bR * 2);
    ctx.globalAlpha = 1;

    // A few tiny detail dots inside
    for (let s = 0; s < 4; s++) {
      const sx = bx + (bubbleRng() - 0.5) * bR * 1.4;
      const sy = by + (bubbleRng() - 0.5) * bR * 1.4;
      const twinkle = 0.2 + 0.5 * Math.sin(t * 4 + s + i);
      ctx.fillStyle = `rgba(255,255,255,${twinkle * 0.4})`;
      ctx.beginPath();
      ctx.arc(sx, sy, 0.4 + bubbleRng() * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Glitch effects — small rectangles of displaced pixels suggesting unstable reality
  const glitchSeed = Math.floor(t * 4);
  const glitchRng = seededRandom(glitchSeed);
  const glitchChance = glitchRng();
  if (glitchChance < 0.25) {
    const glitchCount = 1 + Math.floor(glitchRng() * 3);
    for (let g = 0; g < glitchCount; g++) {
      const gx = glitchRng() * w;
      const gy = glitchRng() * h;
      const gw = 8 + glitchRng() * 30;
      const gh = 2 + glitchRng() * 5;
      const gHue = Math.floor(glitchRng() * 360);
      ctx.fillStyle = `hsla(${gHue},80%,60%,${0.08 + glitchRng() * 0.12})`;
      ctx.fillRect(gx, gy, gw, gh);
      // Offset copy for displacement feel
      ctx.fillStyle = `hsla(${(gHue + 180) % 360},60%,50%,${0.05 + glitchRng() * 0.08})`;
      ctx.fillRect(gx + 3, gy + 1, gw * 0.7, gh);
    }
  }

  // --- NEXUS: complex rotating multi-ring structure with energy inflow ---
  const totalProd = state ? Object.values(state.resources || {})
    .filter(r => r.unlocked)
    .reduce((sum, r) => sum + Math.max(0, (r.baseRate + r.rateAdd) * r.rateMult), 0) : 0;
  const nexusPulseSpeed = 1 + Math.min(3, totalProd * 0.005);
  const cx = w * 0.5, cy = h * 0.5;

  // Energy streams flowing from bubbles toward nexus
  const streamRng = seededRandom(1010);
  for (let i = 0; i < Math.min(bubbleCount, 6); i++) {
    // Recompute bubble positions deterministically
    const sbx = streamRng() * w;
    const sby = streamRng() * h;
    streamRng(); // skip br
    const streamT = ((t * 0.3 + i * 0.17) % 1);
    const sx = lerp(sbx, cx, streamT);
    const sy = lerp(sby, cy, streamT);
    const streamAlpha = 0.15 + 0.15 * Math.sin(t * 3 + i);
    const sHue = (i * 60 + t * 20) % 360;
    ctx.fillStyle = `hsla(${sHue},70%,70%,${streamAlpha})`;
    ctx.beginPath();
    ctx.arc(sx, sy, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Multi-layer rotating rings (8 layers for dramatic effect)
  for (let ring = 0; ring < 8; ring++) {
    const rr = 6 + ring * 6;
    const ringSpeed = (ring % 2 === 0 ? 1 : -1) * (1 + ring * 0.25) * nexusPulseSpeed;
    const hue = (ring * 45 + t * 25 * nexusPulseSpeed) % 360;
    const tilt = 0.3 + ring * 0.08;
    ctx.strokeStyle = `hsla(${hue},80%,65%,${0.22 - ring * 0.02})`;
    ctx.lineWidth = 1.5 - ring * 0.1;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rr, rr * tilt, t * ringSpeed * 0.1, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Nexus core — bright pulsing center
  const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 14);
  coreGrad.addColorStop(0, `rgba(255,255,255,${0.6 + 0.3 * Math.sin(t * 3 * nexusPulseSpeed)})`);
  coreGrad.addColorStop(0.3, `rgba(220,150,255,0.3)`);
  coreGrad.addColorStop(0.6, `rgba(150,80,220,0.1)`);
  coreGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, 14, 0, Math.PI * 2);
  ctx.fill();

  // --- INFINITY SYMBOL: particle trails forming an infinity/lemniscate around nexus ---
  const infParticles = 20;
  for (let i = 0; i < infParticles; i++) {
    const phase = (i / infParticles) * Math.PI * 2 + t * 0.8 * nexusPulseSpeed;
    // Lemniscate of Bernoulli parametric: x = a*cos(t)/(1+sin^2(t)), y = a*sin(t)*cos(t)/(1+sin^2(t))
    const sinP = Math.sin(phase);
    const cosP = Math.cos(phase);
    const denom = 1 + sinP * sinP;
    const infScale = 28;
    const ix = cx + (infScale * cosP) / denom;
    const iy = cy + (infScale * sinP * cosP) / (denom * 1.3);
    const iAlpha = 0.2 + 0.3 * Math.sin(t * 2 + i * 0.5);
    const iHue = (i * 18 + t * 40) % 360;
    ctx.fillStyle = `hsla(${iHue},80%,75%,${iAlpha})`;
    ctx.beginPath();
    ctx.arc(ix, iy, 0.8, 0, Math.PI * 2);
    ctx.fill();
  }
}

// --- Era 3 (new): Digital Age ---
function drawDigitalAge(ctx, w, h, t, state) {
  // Dark background with circuit-board feel
  ctx.fillStyle = '#0a0e1a';
  ctx.fillRect(0, 0, w, h);

  // Matrix-style falling code characters — very faint behind the board
  ctx.font = '8px monospace';
  const matrixChars = '01ABCDEF><{}[]';
  for (let col = 0; col < 12; col++) {
    const mx = 8 + col * (w / 12);
    for (let row = 0; row < 6; row++) {
      const my = ((t * (30 + col * 5) + row * 25) % (h + 20)) - 10;
      const charIdx = Math.floor((t * 3 + col * 7 + row * 13) % matrixChars.length);
      const mAlpha = 0.03 + 0.02 * Math.sin(t * 2 + col + row);
      ctx.fillStyle = `rgba(0, 255, 100, ${mAlpha})`;
      ctx.fillText(matrixChars[charIdx], mx, my);
    }
  }

  // PCB-style circuit traces — varying widths with solder points at intersections
  const gridSpacing = Math.max(10, 20 - Math.floor(Object.keys(state?.upgrades || {}).length / 8));
  const rngTrace = seededRandom(33);

  // Vertical traces — varied widths
  for (let x = 0; x < w; x += gridSpacing) {
    const traceW = rngTrace() < 0.3 ? 2 : (rngTrace() < 0.6 ? 1.5 : 0.8);
    const traceAlpha = 0.05 + rngTrace() * 0.06;
    ctx.strokeStyle = `rgba(0, 200, 100, ${traceAlpha})`;
    ctx.lineWidth = traceW;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  // Horizontal traces — varied widths
  for (let y = 0; y < h; y += gridSpacing) {
    const traceW = rngTrace() < 0.3 ? 2 : (rngTrace() < 0.6 ? 1.5 : 0.8);
    const traceAlpha = 0.05 + rngTrace() * 0.06;
    ctx.strokeStyle = `rgba(0, 200, 100, ${traceAlpha})`;
    ctx.lineWidth = traceW;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  // Solder points at select intersections
  const rngSolder = seededRandom(55);
  for (let gx = 0; gx < w; gx += gridSpacing) {
    for (let gy = 0; gy < h; gy += gridSpacing) {
      if (rngSolder() < 0.2) {
        const pulse = 0.5 + 0.3 * Math.sin(t * 2 + gx * 0.1 + gy * 0.1);
        ctx.fillStyle = `rgba(0, 255, 120, ${0.15 + pulse * 0.1})`;
        ctx.beginPath();
        ctx.arc(gx, gy, 1.5 + pulse * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Right-angle trace segments (PCB routing)
  const rngRoute = seededRandom(88);
  ctx.strokeStyle = 'rgba(0, 180, 100, 0.12)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 8; i++) {
    const startX = Math.floor(rngRoute() * (w / gridSpacing)) * gridSpacing;
    const startY = Math.floor(rngRoute() * (h / gridSpacing)) * gridSpacing;
    const midX = startX + (rngRoute() < 0.5 ? 1 : -1) * gridSpacing * Math.ceil(rngRoute() * 3);
    const endY = startY + (rngRoute() < 0.5 ? 1 : -1) * gridSpacing * Math.ceil(rngRoute() * 2);
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(midX, startY); // horizontal
    ctx.lineTo(midX, endY);   // then vertical (right angle)
    ctx.stroke();
  }

  // Data streams that intensify with software/data production rate
  const softwareRate = state ? ((state.resources?.software?.baseRate || 0) + (state.resources?.software?.rateAdd || 0)) * (state.resources?.software?.rateMult || 1) : 0;
  const dataRate = state ? ((state.resources?.data?.baseRate || 0) + (state.resources?.data?.rateAdd || 0)) * (state.resources?.data?.rateMult || 1) : 0;
  const streamIntensity = Math.min(1, (softwareRate + dataRate) * 0.05);
  if (streamIntensity > 0.01) {
    for (let i = 0; i < Math.floor(6 + streamIntensity * 12); i++) {
      const sx = (i * 37 + Math.floor(t * 60)) % w;
      const sy = 0;
      const streamLen = h * (0.3 + streamIntensity * 0.7);
      const alpha = 0.03 + streamIntensity * 0.08;
      ctx.strokeStyle = `rgba(0, 255, 180, ${alpha})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx, sy + streamLen);
      ctx.stroke();
    }
  }

  // Pulsing data nodes at intersections
  const rng = seededRandom(42);
  for (let i = 0; i < 15; i++) {
    const nx = Math.floor(rng() * 14) * gridSpacing;
    const ny = Math.floor(rng() * 9) * gridSpacing;
    const pulse = 0.5 + 0.5 * Math.sin(t * 3 + i * 1.7);
    ctx.fillStyle = `rgba(0, 255, 150, ${0.3 + pulse * 0.5})`;
    ctx.beginPath();
    ctx.arc(nx, ny, 2 + pulse * 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Flowing data packets along traces — horizontal and vertical
  for (let i = 0; i < 10; i++) {
    const speed = 30 + i * 12;
    const isVertical = i % 3 === 0;
    const alpha = 0.5 + 0.4 * Math.sin(t * 5 + i);
    if (isVertical) {
      const x = gridSpacing + (i % 8) * gridSpacing;
      const y = ((t * speed + i * 60) % (h + 20)) - 10;
      // Packet with trail
      ctx.fillStyle = `rgba(100, 200, 255, ${alpha * 0.3})`;
      ctx.fillRect(x - 1, y - 8, 2, 8);
      ctx.fillStyle = `rgba(100, 220, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, 1.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const y = gridSpacing + (i % 7) * gridSpacing;
      const x = ((t * speed + i * 80) % (w + 20)) - 10;
      // Packet with trail
      ctx.fillStyle = `rgba(100, 200, 255, ${alpha * 0.3})`;
      ctx.fillRect(x - 8, y - 1, 8, 2);
      ctx.fillStyle = `rgba(100, 220, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
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

  // CRT scanline overlay — subtle horizontal lines
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.04)';
  ctx.lineWidth = 1;
  for (let sy = 0; sy < h; sy += 3) {
    ctx.beginPath();
    ctx.moveTo(0, sy);
    ctx.lineTo(w, sy);
    ctx.stroke();
  }

  // Screen bloom — faint glow at center
  const bloomGrad = ctx.createRadialGradient(w * 0.5, h * 0.5, 0, w * 0.5, h * 0.5, w * 0.6);
  bloomGrad.addColorStop(0, 'rgba(0, 100, 60, 0.04)');
  bloomGrad.addColorStop(0.5, 'rgba(0, 80, 50, 0.02)');
  bloomGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = bloomGrad;
  ctx.fillRect(0, 0, w, h);

  // Holographic wireframe cube — floating and rotating
  const cubeX = w * 0.15;
  const cubeY = h * 0.3;
  const cubeSize = 12;
  const ca = t * 0.8;
  const cosA = Math.cos(ca), sinA = Math.sin(ca);
  const cosB = Math.cos(ca * 0.6), sinB = Math.sin(ca * 0.6);
  // Project 3D cube vertices to 2D
  const cubeVerts = [[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]];
  const projected = cubeVerts.map(([vx, vy, vz]) => {
    // Rotate Y then X
    const rx = vx * cosA - vz * sinA;
    const rz = vx * sinA + vz * cosA;
    const ry2 = vy * cosB - rz * sinB;
    return [cubeX + rx * cubeSize, cubeY + ry2 * cubeSize];
  });
  const cubeEdges = [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];
  const cubePulse = 0.3 + 0.2 * Math.sin(t * 2);
  ctx.strokeStyle = `rgba(0, 200, 255, ${cubePulse})`;
  ctx.lineWidth = 0.8;
  for (const [a, b] of cubeEdges) {
    ctx.beginPath();
    ctx.moveTo(projected[a][0], projected[a][1]);
    ctx.lineTo(projected[b][0], projected[b][1]);
    ctx.stroke();
  }

  // Spinning data ring (holographic)
  const ringX = w * 0.82;
  const ringY = h * 0.35;
  const ringR = 10;
  const ringAngle = t * 1.2;
  ctx.save();
  ctx.translate(ringX, ringY);
  ctx.rotate(ringAngle);
  ctx.scale(1, 0.35);
  ctx.strokeStyle = `rgba(0, 255, 200, ${0.2 + 0.15 * Math.sin(t * 3)})`;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(0, 0, ringR, 0, Math.PI * 2);
  ctx.stroke();
  // Second ring offset
  ctx.strokeStyle = `rgba(100, 200, 255, ${0.15 + 0.1 * Math.sin(t * 3 + 1)})`;
  ctx.beginPath();
  ctx.arc(0, 0, ringR + 4, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Second holographic ring at different position and tilt
  ctx.save();
  ctx.translate(w * 0.3, h * 0.7);
  ctx.rotate(-ringAngle * 0.7);
  ctx.scale(0.4, 1);
  ctx.strokeStyle = `rgba(0, 255, 150, ${0.15 + 0.1 * Math.sin(t * 2.5)})`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(0, 0, 14, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

// --- Era 7 (new): Dyson Era ---
function drawDysonEra(ctx, w, h, t, state) {
  // Deep space background
  ctx.fillStyle = '#050510';
  ctx.fillRect(0, 0, w, h);
  drawStarField(ctx, w, h, 60, 777, t);

  const cx = w * 0.5, cy = h * 0.5;

  // Star at center (being enclosed) — glow scales with stellarForge production
  const sfRate = state ? ((state.resources?.stellarForge?.baseRate || 0) + (state.resources?.stellarForge?.rateAdd || 0)) * (state.resources?.stellarForge?.rateMult || 1) : 0;
  const forgeGlow = Math.min(1, sfRate * 0.08);
  const starR = 12 + forgeGlow * 6;
  const glowRadius = starR * (3 + forgeGlow * 2);
  const starGrd = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowRadius);
  starGrd.addColorStop(0, `rgba(255, 220, 100, ${0.8 + forgeGlow * 0.2})`);
  starGrd.addColorStop(0.3, `rgba(255, 180, 50, ${0.4 + forgeGlow * 0.3})`);
  starGrd.addColorStop(0.7, `rgba(255, 100, 20, ${0.1 + forgeGlow * 0.15})`);
  starGrd.addColorStop(1, 'rgba(255, 50, 0, 0)');
  ctx.fillStyle = starGrd;
  ctx.beginPath();
  ctx.arc(cx, cy, glowRadius, 0, Math.PI * 2);
  ctx.fill();

  // Dyson sphere — wireframe lattice around the star
  const segmentBoost = state ? Math.min(0.5, (state.dysonSegments || 0) / 100) : 0;
  const completion = state ? Math.min(1, Object.keys(state.upgrades || {}).length / 50 + segmentBoost) : 0;
  const arcCount = Math.floor(completion * 8) + 2;

  // Wireframe lattice rings
  for (let i = 0; i < arcCount; i++) {
    const ringR = starR + 15 + i * 8;
    const angle = t * (0.2 + i * 0.15) + i * 1.25;
    const tilt = 0.2 + i * 0.15;
    const pulse = 0.5 + 0.3 * Math.sin(t * 2 + i);
    const arcSpan = i < 2 ? Math.PI * 2 : Math.PI * 2 * Math.min(1, completion * 1.5);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.scale(1, tilt);

    // Main ring structure
    ctx.strokeStyle = `rgba(255, 200, 50, ${0.2 + pulse * 0.3})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, ringR, 0, arcSpan);
    ctx.stroke();

    // Lattice cross-struts between this ring and adjacent
    if (i > 0) {
      const prevR = starR + 15 + (i - 1) * 8;
      const strutCount = 6 + i * 2;
      const visibleStruts = Math.ceil(strutCount * Math.min(1, completion * 1.3));
      for (let s = 0; s < visibleStruts; s++) {
        const sa = (s / strutCount) * arcSpan;
        if (sa > arcSpan) break;
        ctx.strokeStyle = `rgba(200,180,80,${0.08 + pulse * 0.1})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(Math.cos(sa) * prevR, Math.sin(sa) * prevR);
        ctx.lineTo(Math.cos(sa) * ringR, Math.sin(sa) * ringR);
        ctx.stroke();
      }
    }

    // Collector panels on ring — glowing energy collection panels
    const panelCount = 4 + i * 2;
    const visiblePanels = i < 2 ? panelCount : Math.ceil(panelCount * completion);
    for (let j = 0; j < visiblePanels; j++) {
      const pa = (j / panelCount) * Math.PI * 2;
      if (pa > arcSpan) break;
      const ppx = Math.cos(pa) * ringR;
      const ppy = Math.sin(pa) * ringR;
      // Panel glow
      const panelGlow = 0.3 + pulse * 0.4;
      ctx.fillStyle = `rgba(100, 200, 255, ${panelGlow})`;
      ctx.fillRect(ppx - 2.5, ppy - 1.5, 5, 3);
      // Panel highlight
      ctx.fillStyle = `rgba(150, 230, 255, ${panelGlow * 0.6})`;
      ctx.fillRect(ppx - 1.5, ppy - 0.5, 3, 1);
    }
    ctx.restore();
  }

  // Energy beams from sphere to collection points — animated pulsing power
  const beamCount = 8;
  for (let i = 0; i < beamCount; i++) {
    const angle = t * 0.5 + (i / beamCount) * Math.PI * 2;
    const fromR = starR + 50 + completion * 20;
    const fx = cx + Math.cos(angle) * fromR;
    const fy = cy + Math.sin(angle) * fromR * 0.3;
    const beamPulse = 0.5 + 0.5 * Math.sin(t * 4 + i * 0.8);

    // Beam glow (wider, dimmer)
    ctx.strokeStyle = `rgba(255, 220, 80, ${0.04 + 0.06 * beamPulse})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(fx, fy);
    ctx.lineTo(cx, cy);
    ctx.stroke();

    // Beam core (narrow, brighter)
    ctx.strokeStyle = `rgba(255, 200, 50, ${0.1 + 0.15 * beamPulse})`;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(fx, fy);
    ctx.lineTo(cx, cy);
    ctx.stroke();

    // Energy pulse traveling along beam
    const pulseT = (t * 1.5 + i * 0.5) % 1;
    const pulsex = lerp(fx, cx, pulseT);
    const pulsey = lerp(fy, cy, pulseT);
    ctx.fillStyle = `rgba(255, 240, 100, ${0.4 + 0.3 * beamPulse})`;
    ctx.beginPath();
    ctx.arc(pulsex, pulsey, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Collection point glow at beam origin
    ctx.fillStyle = `rgba(100, 200, 255, ${0.15 + 0.1 * beamPulse})`;
    ctx.beginPath();
    ctx.arc(fx, fy, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Orbiting megastructures — habitats, factories, research stations
  const megaRng = seededRandom(8888);
  const megaTypes = [
    { label: 'habitat', color: [100, 220, 150] },
    { label: 'factory', color: [220, 180, 80] },
    { label: 'research', color: [120, 160, 255] },
    { label: 'dock', color: [200, 200, 200] },
    { label: 'array', color: [180, 100, 255] },
  ];
  const megaCount = Math.min(8, 3 + Math.floor(completion * 5));
  for (let m = 0; m < megaCount; m++) {
    const megaAngle = t * (0.08 + m * 0.03) + m * 1.8;
    const megaOrbitR = starR + 65 + m * 10;
    const megaTilt = 0.3 + m * 0.1;
    const mx = cx + Math.cos(megaAngle) * megaOrbitR;
    const my = cy + Math.sin(megaAngle) * megaOrbitR * megaTilt;
    const mType = megaTypes[m % megaTypes.length];
    const mPulse = 0.5 + 0.5 * Math.sin(t * 2 + m * 1.2);

    // Structure body
    ctx.fillStyle = `rgba(${mType.color[0]},${mType.color[1]},${mType.color[2]},${0.4 + mPulse * 0.3})`;
    if (mType.label === 'habitat') {
      // Ring-shaped habitat
      ctx.strokeStyle = ctx.fillStyle;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(mx, my, 4, 2, megaAngle * 0.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = `rgba(${mType.color[0]},${mType.color[1]},${mType.color[2]},0.3)`;
      ctx.beginPath();
      ctx.arc(mx, my, 1, 0, Math.PI * 2);
      ctx.fill();
    } else if (mType.label === 'factory') {
      // Blocky factory
      ctx.fillRect(mx - 3, my - 2, 6, 4);
      ctx.fillStyle = `rgba(255,150,50,${0.3 + mPulse * 0.3})`;
      ctx.fillRect(mx - 1, my - 1, 2, 2);
    } else if (mType.label === 'research') {
      // Dish-shaped research station
      ctx.beginPath();
      ctx.arc(mx, my, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = `rgba(${mType.color[0]},${mType.color[1]},${mType.color[2]},0.5)`;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(mx, my - 3);
      ctx.lineTo(mx, my - 6);
      ctx.stroke();
    } else {
      // Generic structure
      ctx.beginPath();
      ctx.arc(mx, my, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Structure running lights
    ctx.fillStyle = `rgba(255,255,255,${0.3 + mPulse * 0.5})`;
    ctx.beginPath();
    ctx.arc(mx, my, 0.8, 0, Math.PI * 2);
    ctx.fill();
  }

  // Star field twinkling through gaps in the Dyson sphere
  const gapRng = seededRandom(3939);
  for (let i = 0; i < 12; i++) {
    const gAngle = gapRng() * Math.PI * 2;
    const gDist = starR + 20 + gapRng() * 50;
    const gx = cx + Math.cos(gAngle) * gDist;
    const gy = cy + Math.sin(gAngle) * gDist * 0.4;
    const gTwinkle = 0.1 + 0.25 * Math.sin(t * (2 + gapRng() * 3) + gapRng() * 6.28);
    // Only show when completion is partial (gaps exist)
    const gapAlpha = gTwinkle * (1 - completion * 0.8);
    if (gapAlpha > 0.02) {
      ctx.fillStyle = `rgba(200,220,255,${gapAlpha})`;
      ctx.beginPath();
      ctx.arc(gx, gy, 0.6 + gapRng() * 0.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Outer megastructure arc indicators
  ctx.strokeStyle = `rgba(100, 150, 255, ${0.1 + 0.1 * Math.sin(t * 0.5)})`;
  ctx.lineWidth = 2;
  const arcAngle = t * 0.1;
  ctx.beginPath();
  ctx.arc(cx, cy, 85 + completion * 15, arcAngle, arcAngle + Math.PI * 0.5);
  ctx.stroke();
  ctx.strokeStyle = `rgba(100, 180, 255, ${0.08 + 0.08 * Math.sin(t * 0.5 + 1)})`;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, 90 + completion * 15, arcAngle + Math.PI, arcAngle + Math.PI * 1.4);
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
    // Scale font size with gather amount
    const amountMatch = ft.label.match(/\+(\d+)/);
    const gatherAmount = amountMatch ? parseInt(amountMatch[1], 10) : 1;
    const fontSize = gatherAmount >= 100 ? 16 : gatherAmount >= 10 ? 13 : 11;
    ctx.font = `bold ${fontSize}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillStyle = gatherAmount >= 100 ? `rgba(255,200,50,${alpha})` : `rgba(255,255,100,${alpha})`;
    ctx.strokeStyle = `rgba(0,0,0,${alpha * 0.7})`;
    ctx.lineWidth = 2;
    ctx.strokeText(ft.label, ft.x, ft.y - yOffset);
    ctx.fillText(ft.label, ft.x, ft.y - yOffset);
    ctx.restore();
  }
}

// --- Era progress bar overlay ---
function drawEraProgress(ctx, w, h, state) {
  if (!state) return;
  const era = state.era || 1;
  const eraUpgrades = countEraUpgrades(state, era);
  const minNeeded = getMinUpgradesForEra(era);
  const barW = w * 0.6;
  const barH = 6;
  const barX = (w - barW) / 2;
  const barY = h - 12;

  ctx.save();

  // Background
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.fillRect(barX, barY, barW, barH);

  // Fill — use era-specific upgrade count vs minimum needed
  const progress = Math.min(eraUpgrades / minNeeded, 1);
  ctx.fillStyle = progress >= 1 ? '#44aa44' : '#aaaa44';
  ctx.fillRect(barX, barY, barW * progress, barH);

  // Text
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '8px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`${eraUpgrades}/${minNeeded} era upgrades`, w / 2, barY - 2);

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
      life: 0.6 + Math.random() * 0.6,
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
    const currentSize = p.size * (1 - progress * 0.5);
    // Trail: draw a faint afterimage behind the particle
    if (progress < 0.7) {
      const trailAlpha = alpha * 0.3;
      ctx.fillStyle = p.color.replace('1)', `${trailAlpha})`);
      ctx.beginPath();
      ctx.arc(p.x - p.vx * dt * 2, p.y - p.vy * dt * 2, currentSize * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = p.color.replace('1)', `${alpha})`);
    ctx.beginPath();
    ctx.arc(p.x, p.y, currentSize, 0, Math.PI * 2);
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
  const prevUpgradeCountRef = useRef(Object.keys(state.upgrades || {}).length);
  const bonusOrbRef = useRef(null); // { x, y, spawnTime, type, resource }
  const lastOrbTimeRef = useRef(performance.now() / 1000);
  const nextOrbDelayRef = useRef(20 + Math.random() * 40); // 30-90s
  const prevHackRef = useRef(state.hackSuccesses || 0);
  const prevDockRef = useRef(state.dockingPerfects || 0);
  const hackFlashRef = useRef(0); // timestamp of last hack flash
  const dockFlashRef = useRef(0); // timestamp of last dock flash
  const mouseRef = useRef({ x: 0, y: 0 }); // for parallax
  const ruinsRef = useRef([]); // Array of { x, y, era, discovered, spawnTime }
  const lastRuinsCheckRef = useRef(0);
  const nextRuinDelayRef = useRef(45 + Math.random() * 75); // 45-120s
  const depositsRef = useRef([]); // Array of { x, y, resourceId, amount, spawnTime, duration, color }
  const lastDepositCheckRef = useRef(0);
  const nextDepositDelayRef = useRef(20 + Math.random() * 20); // 20-40s

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
    // Check bonus orb click first
    if (bonusOrbRef.current) {
      const orb = bonusOrbRef.current;
      const dx = cx - orb.x;
      const dy = cy - orb.y;
      if (dx * dx + dy * dy <= 15 * 15) {
        // Hit the bonus orb!
        playClick();
        spawnParticles(particlesRef.current, orb.x, orb.y, 20, 'rgba(255,221,68,1)', 80);

        if (orb.type === 'burst') {
          // Grant 10x normal gather amount of a random era-appropriate resource
          onUpdateRef.current(s => {
            const res = s.resources[orb.resource];
            if (!res || !res.unlocked) return s;
            const burstAmount = 10;
            return gather(s, orb.resource, burstAmount);
          });
          floatingTextsRef.current.push({ x: orb.x, y: orb.y, label: `★ Burst! +10 ${orb.resource}`, startTime: performance.now() });
        } else if (orb.type === 'frenzy') {
          // Grant 15-second 2x all production multiplier
          onUpdateRef.current(s => ({
            ...s,
            activeEffects: [...(s.activeEffects || []), {
              id: 'bonusOrb_frenzy',
              endsAt: s.totalTime + 15,
              effect: { resourceId: 'all', rateMultBonus: 2 },
            }],
          }));
          floatingTextsRef.current.push({ x: orb.x, y: orb.y, label: '★ Frenzy! 2x for 15s', startTime: performance.now() });
        } else if (orb.type === 'lucky') {
          // Grant resources equal to 10 seconds of current production
          onUpdateRef.current(s => {
            const newResources = { ...s.resources };
            for (const id of Object.keys(newResources)) {
              const r = newResources[id];
              if (!r || !r.unlocked) continue;
              const rate = getEffectiveRate(s, id);
              if (rate > 0) {
                const cap = getEffectiveCap(s, id);
                const added = Math.min(rate * 10, cap > 0 ? cap - r.amount : rate * 10);
                if (added > 0) {
                  newResources[id] = { ...r, amount: r.amount + added };
                }
              }
            }
            return { ...s, resources: newResources };
          });
          floatingTextsRef.current.push({ x: orb.x, y: orb.y, label: '★ Lucky! +10s production', startTime: performance.now() });
        }

        bonusOrbRef.current = null;
        lastOrbTimeRef.current = t;
        nextOrbDelayRef.current = 20 + Math.random() * 40;
        return;
      }
    }

    // Check ruins click
    for (const ruin of ruinsRef.current) {
      if (ruin.discovered) continue;
      const rdx = cx - ruin.x;
      const rdy = cy - ruin.y;
      if (rdx * rdx + rdy * rdy <= 16 * 16) {
        ruin.discovered = true;
        playClick();
        spawnParticles(particlesRef.current, ruin.x, ruin.y, 15, 'rgba(200,170,100,1)', 60);
        const loreText = ruinLore[Math.floor(Math.random() * ruinLore.length)];
        floatingTextsRef.current.push({ x: ruin.x, y: ruin.y, label: 'Ancient Ruins!', startTime: performance.now() });
        // Grant 15-30 seconds of a random unlocked resource's production
        onUpdateRef.current(s => {
          const unlockedResources = Object.entries(s.resources || {}).filter(([, r]) => r.unlocked);
          if (unlockedResources.length === 0) return s;
          const [resId] = unlockedResources[Math.floor(Math.random() * unlockedResources.length)];
          const rate = getEffectiveRate(s, resId);
          const bonusSeconds = 15 + Math.random() * 15;
          const amount = Math.max(1, rate * bonusSeconds);
          const cap = getEffectiveCap(s, resId);
          const r = s.resources[resId];
          const added = cap > 0 ? Math.min(amount, cap - r.amount) : amount;
          const newResources = { ...s.resources, [resId]: { ...r, amount: r.amount + Math.max(0, added) } };
          return {
            ...s,
            resources: newResources,
            eventLog: [...(s.eventLog || []), {
              message: loreText,
              time: s.totalTime,
              isLore: true,
            }],
          };
        });
        return;
      }
    }

    // Check resource deposits click
    for (let i = depositsRef.current.length - 1; i >= 0; i--) {
      const dep = depositsRef.current[i];
      const ddx = cx - dep.x;
      const ddy = cy - dep.y;
      if (ddx * ddx + ddy * ddy <= 14 * 14) {
        playClick();
        spawnParticles(particlesRef.current, dep.x, dep.y, 12, dep.color || 'rgba(255,255,255,1)', 50);
        const resLabel = dep.resourceId.replace(/([A-Z])/g, ' $1').trim();
        floatingTextsRef.current.push({ x: dep.x, y: dep.y, label: `+${Math.floor(dep.amount)} ${resLabel}`, startTime: performance.now() });
        onUpdateRef.current(s => {
          const r = s.resources[dep.resourceId];
          if (!r || !r.unlocked) return s;
          const cap = getEffectiveCap(s, dep.resourceId);
          const added = cap > 0 ? Math.min(dep.amount, cap - r.amount) : dep.amount;
          if (added <= 0) return s;
          return { ...s, resources: { ...s.resources, [dep.resourceId]: { ...r, amount: r.amount + added } } };
        });
        depositsRef.current.splice(i, 1);
        return;
      }
    }

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
        software: 'rgba(0,200,180,1)', data: 'rgba(80,180,255,1)',
        rocketFuel: 'rgba(255,120,50,1)', orbitalInfra: 'rgba(180,180,220,1)',
        exoticMaterials: 'rgba(200,150,255,1)', colonies: 'rgba(100,220,150,1)',
        darkEnergy: 'rgba(120,80,200,1)', starSystems: 'rgba(180,200,255,1)',
        galacticInfluence: 'rgba(100,220,255,1)', megastructures: 'rgba(200,180,100,1)',
        stellarForge: 'rgba(255,180,80,1)', exoticMatter: 'rgba(220,100,255,1)',
        cosmicPower: 'rgba(180,100,255,1)', universalConstants: 'rgba(200,220,255,1)',
        realityFragments: 'rgba(255,150,200,1)', quantumEchoes: 'rgba(150,200,255,1)',
      };
      spawnParticles(particlesRef.current, cx, cy, 8, resourceColors[el.resource] || 'rgba(255,255,255,1)', 40);
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

      // Update parallax offset from mouse position
      _parallaxX = mouseRef.current.x;
      _parallaxY = mouseRef.current.y;

      // Era mapping: 1=Planetfall, 2=Industrialization, 3=Digital Age,
      // 4=Space Age, 5=Solar System, 6=Interstellar, 7=Dyson Era,
      // 8=Galactic, 9=Intergalactic, 10=Multiverse
      const state = stateRef.current;
      switch (era) {
        case 1: drawEra1(ctx, w, h, t, state); break;
        case 2: drawEra2(ctx, w, h, t, state); break;
        case 3: drawDigitalAge(ctx, w, h, t, state); break;
        case 4: drawEra3(ctx, w, h, t, state); break;  // Space Age
        case 5: drawEra4(ctx, w, h, t, state); break;  // Solar System
        case 6: drawEra5(ctx, w, h, t, state); break;  // Interstellar
        case 7: drawDysonEra(ctx, w, h, t, state); break;
        case 8: drawEra6(ctx, w, h, t, state); break;  // Galactic
        case 9: drawIntergalactic(ctx, w, h, t, state); break;
        case 10: drawMultiverse(ctx, w, h, t, state); break;
        default: drawEra1(ctx, w, h, t, state); break;
      }

      // Vignette effect — darken edges for cinematic feel
      const vigGrad = ctx.createRadialGradient(w/2, h/2, w*0.25, w/2, h/2, w*0.7);
      vigGrad.addColorStop(0, 'transparent');
      vigGrad.addColorStop(0.7, 'transparent');
      vigGrad.addColorStop(1, 'rgba(0,0,0,0.35)');
      ctx.fillStyle = vigGrad;
      ctx.fillRect(0, 0, w, h);

      // Clickable element hint glows
      const clickableEls = getClickableElements(era, w, h, t);
      for (const el of clickableEls) {
        if (el.type === 'space' || el.type === 'ground' || el.type === 'factory' || el.type === 'conveyor') continue;
        ctx.strokeStyle = `rgba(255, 255, 200, ${0.15 + 0.1 * Math.sin(t * 2)})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(el.x, el.y, (el.r > 100 ? 20 : el.r) + 3, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Production intensity glow
      const totalRate = Object.values(state?.resources || {})
        .filter(r => r.unlocked)
        .reduce((sum, r) => sum + Math.max(0, (r.baseRate + r.rateAdd) * r.rateMult), 0);
      const glowIntensity = Math.min(totalRate / 100, 1) * 0.15;
      if (glowIntensity > 0.01) {
        // Era-themed glow colors
        const eraGlowColors = {
          1: '200, 180, 100',  // warm amber
          2: '200, 180, 100',  // warm amber
          3: '100, 200, 180',  // blue-green
          4: '100, 200, 180',  // blue-green
          5: '180, 100, 255',  // purple
          6: '180, 100, 255',  // purple
          7: '255, 150, 80',   // red-orange
          8: '255, 150, 80',   // red-orange
          9: '255, 240, 200',  // white-gold
          10: '255, 240, 200', // white-gold
        };
        const glowRGB = eraGlowColors[era] || '100, 255, 100';
        const glow = ctx.createRadialGradient(w/2, h/2, w*0.2, w/2, h/2, w*0.6);
        glow.addColorStop(0, `rgba(${glowRGB}, ${glowIntensity})`);
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, w, h);
      }

      // Draw era progress bar
      const upgradeCount = Object.keys(stateRef.current.upgrades || {}).length;
      drawEraProgress(ctx, w, h, state);

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

      // --- Cap warning overlay ---
      const cappedResources = Object.entries(stateRef.current?.resources || {})
        .filter(([id, r]) => {
          if (!r.unlocked || !r.amount) return false;
          const cap = getEffectiveCap(stateRef.current, id);
          return cap > 0 && r.amount / cap > 0.95;
        });

      if (cappedResources.length > 0) {
        ctx.save();
        const borderAlpha = 0.1 + 0.05 * Math.sin(t * 3);
        ctx.strokeStyle = `rgba(255, 170, 50, ${borderAlpha})`;
        ctx.lineWidth = 3;
        ctx.strokeRect(1, 1, w - 2, h - 2);
        ctx.restore();
      }

      // --- Bonus orb system ---
      // Spawn logic: if no orb and enough time elapsed, spawn one
      if (!bonusOrbRef.current && (t - lastOrbTimeRef.current) >= nextOrbDelayRef.current) {
        const eraResources = {
          1: ['materials', 'food', 'energy'],
          2: ['steel', 'electronics', 'energy'],
          3: ['software', 'data', 'research'],
          4: ['research', 'rocketFuel', 'energy'],
          5: ['research', 'energy', 'steel'],
          6: ['research', 'energy', 'software'],
          7: ['research', 'energy', 'software'],
          8: ['research', 'energy', 'software'],
          9: ['research', 'energy', 'software'],
          10: ['research', 'energy', 'software'],
        };
        const possibleRes = eraResources[era] || ['energy'];
        const chosenResource = possibleRes[Math.floor(Math.random() * possibleRes.length)];
        const types = ['burst', 'frenzy', 'lucky'];
        const chosenType = types[Math.floor(Math.random() * types.length)];
        const orbX = 20 + Math.random() * (w - 40);
        const orbY = 20 + Math.random() * (h - 40);
        bonusOrbRef.current = {
          x: orbX,
          y: orbY,
          spawnTime: t,
          type: chosenType,
          resource: chosenResource,
        };
        // Spawn sparkle burst to draw the eye
        spawnParticles(particlesRef.current, orbX, orbY, 12, 'rgba(255,221,100,0.8)', 40);
      }

      // Expire orb after 8 seconds
      if (bonusOrbRef.current) {
        const orbAge = t - bonusOrbRef.current.spawnTime;
        if (orbAge > 8) {
          bonusOrbRef.current = null;
          lastOrbTimeRef.current = t;
          nextOrbDelayRef.current = 20 + Math.random() * 40;
        }
      }

      // Draw bonus orb
      if (bonusOrbRef.current) {
        const orb = bonusOrbRef.current;
        const age = t - orb.spawnTime;
        const fade = age > 6 ? Math.max(0, 1 - (age - 6) / 2) : 1;
        const pulse = 0.7 + 0.3 * Math.sin(age * 4);
        const r = 12 + 3 * Math.sin(age * 2);

        ctx.save();
        ctx.globalAlpha = fade * pulse;
        // Era-themed orb colors
        const orbColors = {
          1: ['#e8c860', '#c09830'], 2: ['#e8c860', '#c09830'],
          3: ['#60c8e8', '#3098c0'], 4: ['#60c8e8', '#3098c0'],
          5: ['#c080ff', '#9050cc'], 6: ['#c080ff', '#9050cc'],
          7: ['#ff9060', '#cc6030'], 8: ['#ff9060', '#cc6030'],
          9: ['#fff0c0', '#e8d080'], 10: ['#fff0c0', '#e8d080'],
        };
        const [orbInner, orbOuter] = orbColors[era] || ['#ffdd44', '#ffaa22'];
        const grad = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, r);
        grad.addColorStop(0, orbInner);
        grad.addColorStop(0.5, orbOuter);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, r, 0, Math.PI * 2);
        ctx.fill();

        // Star shape in center
        ctx.fillStyle = `rgba(255, 255, 200, ${fade})`;
        ctx.font = `${10 + Math.sin(age * 3) * 2}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('\u2605', orb.x, orb.y);
        ctx.restore();

        // Screen-edge glow to draw attention
        ctx.save();
        const edgeAlpha = fade * (0.08 + 0.04 * Math.sin(age * 3));
        const edgeColor = orbInner || '#ffdd44';
        // Parse hex to rgb for edge glow
        const er2 = parseInt(edgeColor.slice(1,3), 16) || 255;
        const eg2 = parseInt(edgeColor.slice(3,5), 16) || 221;
        const eb2 = parseInt(edgeColor.slice(5,7), 16) || 68;
        // Top edge
        const topGlow = ctx.createLinearGradient(0, 0, 0, 20);
        topGlow.addColorStop(0, `rgba(${er2},${eg2},${eb2},${edgeAlpha})`);
        topGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = topGlow;
        ctx.fillRect(0, 0, w, 20);
        // Bottom edge
        const botGlow = ctx.createLinearGradient(0, h, 0, h - 20);
        botGlow.addColorStop(0, `rgba(${er2},${eg2},${eb2},${edgeAlpha})`);
        botGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = botGlow;
        ctx.fillRect(0, h - 20, w, 20);
        // Left edge
        const leftGlow = ctx.createLinearGradient(0, 0, 20, 0);
        leftGlow.addColorStop(0, `rgba(${er2},${eg2},${eb2},${edgeAlpha})`);
        leftGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = leftGlow;
        ctx.fillRect(0, 0, 20, h);
        // Right edge
        const rightGlow = ctx.createLinearGradient(w, 0, w - 20, 0);
        rightGlow.addColorStop(0, `rgba(${er2},${eg2},${eb2},${edgeAlpha})`);
        rightGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = rightGlow;
        ctx.fillRect(w - 20, 0, 20, h);
        ctx.restore();
      }

      // --- Ruins system ---
      // Spawn ruins periodically (max 3 undiscovered)
      const undiscoveredRuins = ruinsRef.current.filter(r => !r.discovered);
      if (undiscoveredRuins.length < 3 && (t - lastRuinsCheckRef.current) >= nextRuinDelayRef.current) {
        lastRuinsCheckRef.current = t;
        nextRuinDelayRef.current = 45 + Math.random() * 75;
        ruinsRef.current.push({
          x: 20 + Math.random() * (w - 40),
          y: 20 + Math.random() * (h - 40),
          era,
          discovered: false,
          spawnTime: t,
        });
      }
      // Clean up discovered ruins
      ruinsRef.current = ruinsRef.current.filter(r => !r.discovered);

      // Draw undiscovered ruins
      for (const ruin of ruinsRef.current) {
        if (ruin.discovered) continue;
        const ruinAge = t - ruin.spawnTime;
        const shimmer = 0.4 + 0.2 * Math.sin(ruinAge * 1.5);
        ctx.save();
        ctx.globalAlpha = shimmer;
        ctx.fillStyle = '#887766';
        // Draw a small broken column shape
        ctx.fillRect(ruin.x - 3, ruin.y - 8, 6, 12);
        ctx.fillRect(ruin.x - 5, ruin.y - 10, 10, 3);
        // Small rubble pieces
        ctx.fillRect(ruin.x + 5, ruin.y + 1, 3, 2);
        ctx.fillRect(ruin.x - 7, ruin.y + 2, 2, 3);
        // Glow hint
        ctx.strokeStyle = `rgba(200, 170, 100, ${shimmer * 0.3})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(ruin.x, ruin.y, 12, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // --- Resource deposits system ---
      // Spawn deposits periodically
      if ((t - lastDepositCheckRef.current) >= nextDepositDelayRef.current) {
        lastDepositCheckRef.current = t;
        nextDepositDelayRef.current = 20 + Math.random() * 20;
        // Pick an era-appropriate resource
        const eraDepositRes = {
          1: ['materials', 'food', 'energy'],
          2: ['steel', 'electronics', 'energy'],
          3: ['software', 'data', 'research'],
          4: ['research', 'rocketFuel', 'energy'],
          5: ['research', 'energy', 'exoticMaterials'],
          6: ['research', 'energy', 'software'],
          7: ['research', 'energy', 'software'],
          8: ['research', 'energy', 'software'],
          9: ['research', 'energy', 'software'],
          10: ['research', 'energy', 'software'],
        };
        const depResources = eraDepositRes[era] || ['energy'];
        const depResId = depResources[Math.floor(Math.random() * depResources.length)];
        const depRate = state ? getEffectiveRate(state, depResId) : 0;
        const depAmount = Math.max(1, depRate * (3 + Math.random() * 2));
        const depColor = resourceColorMap[depResId] || 'rgba(255,255,255,1)';
        depositsRef.current.push({
          x: 15 + Math.random() * (w - 30),
          y: 15 + Math.random() * (h - 30),
          resourceId: depResId,
          amount: depAmount,
          spawnTime: t,
          duration: 15,
          color: depColor,
        });
      }
      // Auto-deposit: collect deposits automatically if stellarHarvester owned
      if (stateRef.current?.upgrades?.stellarHarvester) {
        for (const dep of depositsRef.current) {
          if (dep.collected) continue;
          const age = t - dep.spawnTime;
          // Auto-collect after 5 seconds
          if (age > 5) {
            dep.collected = true;
            // Apply reward
            onUpdateRef.current(s => {
              const r = s.resources[dep.resourceId];
              if (!r?.unlocked) return null;
              const cap = getEffectiveCap(s, dep.resourceId);
              return {
                ...s,
                resources: { ...s.resources, [dep.resourceId]: { ...r, amount: Math.min(r.amount + dep.amount, cap > 0 ? cap : Infinity) } },
              };
            });
            spawnParticles(particlesRef.current, dep.x, dep.y, 5, resourceColorMap[dep.resourceId] || 'rgba(200,200,200,1)');
            floatingTextsRef.current.push({ x: dep.x, y: dep.y, label: `+${Math.floor(dep.amount)} (auto)`, startTime: performance.now() });
          }
        }
      }

      // Expire old deposits (also remove collected ones)
      depositsRef.current = depositsRef.current.filter(d => !d.collected && (t - d.spawnTime) < d.duration);

      // Draw resource deposits
      for (const dep of depositsRef.current) {
        const depAge = t - dep.spawnTime;
        const fadeIn = Math.min(depAge / 0.5, 1);
        const fadeOut = dep.duration - depAge < 3 ? (dep.duration - depAge) / 3 : 1;
        const depAlpha = fadeIn * fadeOut;
        const pulse = 0.6 + 0.4 * Math.sin(depAge * 3);
        ctx.save();
        ctx.globalAlpha = depAlpha * pulse;
        // Glowing circle
        const depGrad = ctx.createRadialGradient(dep.x, dep.y, 0, dep.x, dep.y, 10);
        depGrad.addColorStop(0, dep.color.replace('1)', '0.8)'));
        depGrad.addColorStop(0.6, dep.color.replace('1)', '0.3)'));
        depGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = depGrad;
        ctx.beginPath();
        ctx.arc(dep.x, dep.y, 10, 0, Math.PI * 2);
        ctx.fill();
        // Resource letter
        ctx.globalAlpha = depAlpha;
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 7px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const depLabel = dep.resourceId.charAt(0).toUpperCase();
        ctx.fillText(depLabel, dep.x, dep.y);
        ctx.restore();
      }

      // Spawn particles when upgrade purchased
      const currentUpgradeCount = Object.keys(stateRef.current?.upgrades || {}).length;
      if (currentUpgradeCount > prevUpgradeCountRef.current) {
        const eraColors = {
          1: 'rgba(100,200,100,1)', 2: 'rgba(255,180,50,1)', 3: 'rgba(0,200,255,1)',
          4: 'rgba(200,200,255,1)', 5: 'rgba(255,200,100,1)', 6: 'rgba(100,150,255,1)',
          7: 'rgba(255,100,50,1)', 8: 'rgba(180,100,255,1)', 9: 'rgba(50,255,200,1)',
          10: 'rgba(255,50,255,1)',
        };
        spawnParticles(particlesRef.current, w / 2, h / 2, 10, eraColors[era] || 'rgba(100,200,100,1)');
        prevUpgradeCountRef.current = currentUpgradeCount;
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

      // Detect hack success and docking perfect increases — spawn visual effects
      const curHacks = stateRef.current.hackSuccesses || 0;
      if (curHacks > prevHackRef.current) {
        hackFlashRef.current = t;
        prevHackRef.current = curHacks;
      }
      const curDocks = stateRef.current.dockingPerfects || 0;
      if (curDocks > prevDockRef.current) {
        dockFlashRef.current = t;
        spawnParticles(particlesRef.current, w * 0.5, h * 0.3, 8, 'rgba(100,200,255,1)', 50);
        prevDockRef.current = curDocks;
      }

      // Hack success: green data streams flash for 0.6s
      const hackAge = t - hackFlashRef.current;
      if (hackAge < 0.6) {
        const alpha = (0.6 - hackAge) / 0.6 * 0.3;
        ctx.strokeStyle = `rgba(0, 255, 120, ${alpha})`;
        ctx.lineWidth = 1;
        for (let s = 0; s < 5; s++) {
          const sx = (s * 61 + 20) % w;
          ctx.beginPath();
          ctx.moveTo(sx, 0);
          ctx.lineTo(sx + (Math.sin(t * 8 + s) * 10), h);
          ctx.stroke();
        }
      }

      // Dock perfect: brief white ring flash for 0.4s
      const dockAge = t - dockFlashRef.current;
      if (dockAge < 0.4) {
        const alpha = (0.4 - dockAge) / 0.4 * 0.5;
        const ringR = 20 + dockAge * 120;
        ctx.strokeStyle = `rgba(100, 200, 255, ${alpha})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(w * 0.5, h * 0.5, ringR, 0, Math.PI * 2);
        ctx.stroke();
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

  const handleMouseMove = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    mouseRef.current = {
      x: (e.clientX - rect.left) / rect.width - 0.5,
      y: (e.clientY - rect.top) / rect.height - 0.5,
    };
  }, []);

  return (
    <div className="panel canvas-panel">
      <canvas
        ref={canvasRef}
        width={280}
        height={180}
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        style={{ cursor: 'pointer' }}
        role="img"
        aria-label="Game world visualization — click to interact"
      />
    </div>
  );
}
