import { seededRandom, drawStarField, drawGlowCircle } from './shared.js';

export function drawIntergalactic(ctx, w, h, t, state) {
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
