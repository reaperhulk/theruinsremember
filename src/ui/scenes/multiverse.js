import { seededRandom, drawStarField, lerp } from './shared.js';

export function drawMultiverse(ctx, w, h, t, state) {
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
