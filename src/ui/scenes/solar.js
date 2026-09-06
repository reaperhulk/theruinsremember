import { seededRandom, drawStarField, drawGlowCircle } from './shared.js';

export function drawEra4(ctx, w, h, t, state) {
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
