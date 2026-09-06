import { seededRandom, lerp } from './shared.js';

export function drawEra2(ctx, w, h, t, state) {
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
