import { seededRandom, _parallaxX, _parallaxY } from './shared.js';

export function drawEra3(ctx, w, h, t, state) {
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
