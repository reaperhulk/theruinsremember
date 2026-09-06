import { seededRandom } from './shared.js';

export function drawDigitalAge(ctx, w, h, t, state) {
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
