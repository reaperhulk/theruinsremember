import { seededRandom, drawStarField, drawGlowCircle, lerp } from './shared.js';

export function drawEra6(ctx, w, h, t, state) {
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

  // Senate faction-colored particles once a government has a leading faction
  const government = state?.senateGov || {};
  if (government.leader) {
    const factionColors = { merchants: [221, 170, 68], scholars: [136, 187, 238], warriors: [238, 102, 68] };
    {
      const fid = government.leader;
      const col = factionColors[fid] || [200, 200, 200];
      const acts = 1 + (government.partner ? 1 : 0) + (government.ratified ? 1 : 0);
      const pCount = Math.min(12, acts * 4);
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
