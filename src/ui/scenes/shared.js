// Module-level parallax offset (set per frame by the canvas component)
export let _parallaxX = 0, _parallaxY = 0;

// Deterministic pseudo-random from seed
export function seededRandom(seed) {
  let s = seed | 0;
  return () => {
    s = (s * 1664525 + 1013904223) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

const starGeometry = new Map();
export function drawStarField(ctx, w, h, count, seed, twinkleT) {
  const key = `${w}:${h}:${count}:${seed}`;
  let stars = starGeometry.get(key);
  if (!stars) {
    const rng = seededRandom(seed);
    stars = Array.from({ length: count }, () => ({ x: rng() * w, y: rng() * h, size: rng() * 1.5 + 0.5, depth: 0.5 + rng() * 0.5, speed: 1 + rng() * 2, phase: rng() * 6.28 }));
    if (starGeometry.size >= 24) starGeometry.delete(starGeometry.keys().next().value);
    starGeometry.set(key, stars);
  }
  for (const star of stars) {
    const x = star.x + _parallaxX * 4 * star.depth, y = star.y + _parallaxY * 3 * star.depth;
    ctx.fillStyle = `rgba(255,255,255,${0.4 + 0.6 * (0.5 + 0.5 * Math.sin(twinkleT * star.speed + star.phase))})`;
    ctx.beginPath(); ctx.arc(x, y, star.size, 0, Math.PI * 2); ctx.fill();
  }
}

export function drawGlowCircle(ctx, x, y, r, color, glowR) {
  const grad = ctx.createRadialGradient(x, y, r * 0.2, x, y, glowR || r * 2.5);
  grad.addColorStop(0, color);
  grad.addColorStop(0.4, color);
  grad.addColorStop(1, 'transparent');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, glowR || r * 2.5, 0, Math.PI * 2);
  ctx.fill();
}

export function lerp(a, b, t) { return a + (b - a) * t; }


export function setParallax(x, y) { _parallaxX = x; _parallaxY = y; }
