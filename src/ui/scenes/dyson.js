import { seededRandom, drawStarField, lerp } from './shared.js';

export function drawDysonEra(ctx, w, h, t, state) {
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
