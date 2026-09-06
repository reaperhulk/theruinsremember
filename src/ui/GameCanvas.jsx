import { drawWorldMemory } from './scenes/memory.js';
import { seededRandom, setParallax } from './scenes/shared.js';
import { drawEra1 } from './scenes/planetfall.js';
import { drawEra2 } from './scenes/industry.js';
import { drawEra3 } from './scenes/orbit.js';
import { drawEra4 } from './scenes/solar.js';
import { drawEra5 } from './scenes/interstellar.js';
import { drawEra6 } from './scenes/galactic.js';
import { drawIntergalactic } from './scenes/intergalactic.js';
import { drawMultiverse } from './scenes/multiverse.js';
import { drawDigitalAge } from './scenes/digital.js';
import { drawDysonEra } from './scenes/dyson.js';
import { useRef, useEffect, useCallback, useState } from 'react';
import { gather, getEffectiveCap, getEffectiveRate } from '../engine/resources.js';
import { countEraUpgrades, getMinUpgradesForEra } from '../engine/eras.js';
import { playClick } from './AudioManager.js';

// Every scene below draws in a fixed logical space. The backing store is sized
// to the element's real pixel dimensions and the context is scaled to match, so
// the art stays crisp at any width and on any display density without a single
// drawing coordinate changing.
const LOGICAL_W = 280;
const LOGICAL_H = 180;
const CANVAS_ASPECT = LOGICAL_W / LOGICAL_H;

// --- Shared Helpers ---

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

const eraWhispers = {
  1: 'The ground remembers the landing before yours.',
  2: 'Smoke rises from factories buried beneath your factories.',
  3: 'Signals arrive from a network older than your first machine.',
  4: 'Orbit is cluttered with proof that this ascent already happened.',
  5: 'Every colony marker feels less planted than rediscovered.',
  6: 'The beacon light is steady. The warning is not.',
  7: 'The sphere waits like a cathedral with the lights still on.',
  8: 'Every archive agrees: expansion always ends in silence.',
  9: 'Reality flexes where too many civilizations pushed at once.',
  10: 'The multiverse does not greet you. It recognizes you.',
};

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
    const dt = Math.min(0.1, Math.max(0, t - (p.updatedAt ?? p.born)));
    p.updatedAt = t;
    p.x += p.vx * dt;
    p.y += p.vy * dt + 15 * dt * dt;
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

const ERA1_BUILDINGS = [
  { x: 37, y: 103, w: 22, h: 32, label: 'Shelter — first structure raised from wreckage materials' },
  { x: 87, y: 105, w: 18, h: 24, label: 'Workshop — unlocked by early industrial upgrades' },
  { x: 197, y: 99, w: 24, h: 34, label: 'Foundry — built by manufacturing technology' },
  { x: 237, y: 109, w: 16, h: 22, label: 'Storage — expanded by capacity upgrades' },
];

// --- Main Component ---
export function GameCanvas({ state, onUpdate, quality = 'standard' }) {
  const canvasRef = useRef(null);
  const qualityRef = useRef(quality);
  useEffect(() => { qualityRef.current = quality; }, [quality]);
  const wrapRef = useRef(null);
  const rafRef = useRef(null);
  const eraRef = useRef(state.era);
  const stateRef = useRef(state);
  const onUpdateRef = useRef(onUpdate);
  useEffect(() => {
    eraRef.current = state.era;
    stateRef.current = state;
    onUpdateRef.current = onUpdate;
  }, [state, onUpdate]);
  const floatingTextsRef = useRef([]);
  const particlesRef = useRef([]);
  const prevGemsRef = useRef(state.totalGems || 0);
  const prevEraRef = useRef(state.era);
  const prevUpgradeCountRef = useRef(Object.keys(state.upgrades || {}).length);
  const bonusOrbRef = useRef(null); // { x, y, spawnTime, type, resource }
  const lastOrbTimeRef = useRef(0);
  const nextOrbDelayRef = useRef(40);
  const prevDockRef = useRef(state.dockingPerfects || 0);
  const dockFlashRef = useRef(0); // timestamp of last dock flash
  const mouseRef = useRef({ x: 0, y: 0 }); // for parallax
  const [canvasTooltip, setCanvasTooltip] = useState(null); // {x, y, text} in CSS px
  const ruinsRef = useRef([]); // Array of { x, y, era, discovered, spawnTime }
  const lastRuinsCheckRef = useRef(0);
  const nextRuinDelayRef = useRef(80);
  const depositsRef = useRef([]); // Array of { x, y, resourceId, amount, spawnTime, duration, color }
  const lastDepositCheckRef = useRef(0);
  const nextDepositDelayRef = useRef(30);

  const handleCanvasClick = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas || !onUpdateRef.current) return;
    const rect = canvas.getBoundingClientRect();
    // Hit-test in logical space so clicks line up regardless of rendered size.
    const cx = (e.clientX - rect.left) * (LOGICAL_W / rect.width);
    const cy = (e.clientY - rect.top) * (LOGICAL_H / rect.height);

    const t = performance.now() / 1000;
    const w = LOGICAL_W;
    const h = LOGICAL_H;
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
      const dx = cx - el.x;
      const dy = cy - el.y;
      const hit = el.hitTest ? el.hitTest(cx, cy) : (dx * dx + dy * dy) <= el.r * el.r;

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

      // Scene clicks gather the resource associated with the visible object.
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

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let lastDraw = 0;
    function draw(now) {
      const frameInterval = reducedMotion.matches ? 1000 : 1000 / (qualityRef.current === 'low' ? 15 : 30);
      if (document.hidden || now - lastDraw < frameInterval) { rafRef.current = requestAnimationFrame(draw); return; }
      lastDraw = now;
      const t = reducedMotion.matches ? Math.floor(now / 1000) : now / 1000;
      const w = LOGICAL_W;
      const h = LOGICAL_H;
      const era = eraRef.current;

      // Map the logical drawing space onto the real backing store. Everything
      // below keeps working in 280x180 units while rendering at full density.
      ctx.setTransform(canvas.width / LOGICAL_W, 0, 0, canvas.height / LOGICAL_H, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // Update parallax offset from mouse position
      setParallax(mouseRef.current.x, mouseRef.current.y);

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

      drawWorldMemory(ctx, state, w, h);

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

      const upgradeCount = Object.keys(stateRef.current.upgrades || {}).length;

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
      if (!stateRef.current?.upgrades?.stellarHarvester && (t - lastDepositCheckRef.current) >= nextDepositDelayRef.current) {
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
      if (stateRef.current?.upgrades?.stellarHarvester) depositsRef.current = [];

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

      // Detect docking perfect increases and spawn a visual effect.
      const curDocks = stateRef.current.dockingPerfects || 0;
      if (curDocks > prevDockRef.current) {
        dockFlashRef.current = t;
        spawnParticles(particlesRef.current, w * 0.5, h * 0.3, 8, 'rgba(100,200,255,1)', 50);
        prevDockRef.current = curDocks;
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

  // Size the backing store to the element's real pixels. Without this the
  // canvas renders at a fixed 280x180 and gets stretched — soft on every
  // display, and badly so on high-density ones.
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    function resize() {
      const available = wrap.clientWidth;
      if (!available) return;
      const maxHeight = window.innerWidth <= 640 ? 240 : 380;
      let cssW = available;
      let cssH = cssW / CANVAS_ASPECT;
      if (cssH > maxHeight) {
        cssH = maxHeight;
        cssW = cssH * CANVAS_ASPECT;
      }
      const dpr = Math.min(window.devicePixelRatio || 1, quality === 'low' ? 1 : 2);
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      const nextW = Math.round(cssW * dpr);
      const nextH = Math.round(cssH * dpr);
      // Assigning width/height clears the canvas, so only do it on real change.
      if (canvas.width !== nextW || canvas.height !== nextH) {
        canvas.width = nextW;
        canvas.height = nextH;
      }
    }

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(wrap);
    window.addEventListener('resize', resize);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', resize);
    };
  }, [quality]);

  const handleMouseMove = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    mouseRef.current = {
      x: (e.clientX - rect.left) / rect.width - 0.5,
      y: (e.clientY - rect.top) / rect.height - 0.5,
    };

    // Hit-test era 1 buildings for tooltip
    const era = eraRef.current;
    if (era === 1) {
      const cx = (e.clientX - rect.left) * (LOGICAL_W / rect.width);
      const cy = (e.clientY - rect.top) * (LOGICAL_H / rect.height);
      const upgradeTotal = Object.keys(stateRef.current?.upgrades || {}).length;
      const visibleCount = Math.min(Math.floor(upgradeTotal / 3), 4);
      let hit = null;
      for (let i = 0; i < visibleCount; i++) {
        const b = ERA1_BUILDINGS[i];
        if (cx >= b.x && cx <= b.x + b.w && cy >= b.y && cy <= b.y + b.h) {
          hit = { x: e.clientX - rect.left, y: e.clientY - rect.top - 28, text: b.label };
          break;
        }
      }
      setCanvasTooltip(hit);
    } else {
      setCanvasTooltip(null);
    }
  }, []);

  const era = state.era || 1;
  const eraUpgrades = countEraUpgrades(state, era);
  const minNeeded = getMinUpgradesForEra(era);
  const eraProgress = Math.min(eraUpgrades / minNeeded, 1);

  return (
    <div className="panel canvas-panel" ref={wrapRef}>
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setCanvasTooltip(null)}
        role="img"
        aria-label="Civilization and remembered landmarks. Resource controls below provide keyboard and touch actions."
      />
      <div className="canvas-caption">
        <div
          className="canvas-era-bar"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={minNeeded}
          aria-valuenow={Math.min(eraUpgrades, minNeeded)}
          aria-label="Era upgrade progress"
        >
          <div
            className={`canvas-era-bar-fill ${eraProgress >= 1 ? 'complete' : ''}`}
            style={{ width: `${eraProgress * 100}%` }}
          />
        </div>
        <div className="canvas-caption-row">
          <span className="canvas-era-count">{eraUpgrades}/{minNeeded} era upgrades</span>
          <span className="canvas-whisper">{eraWhispers[era]}</span>
        </div>
      </div>
      {canvasTooltip && (
        <div style={{
          position: 'absolute',
          left: `${canvasTooltip.x}px`,
          top: `${canvasTooltip.y}px`,
          background: 'rgba(10,10,20,0.92)',
          border: '1px solid #446',
          color: '#ccddee',
          fontSize: '0.7em',
          padding: '3px 7px',
          borderRadius: '3px',
          pointerEvents: 'none',
          maxWidth: '160px',
          whiteSpace: 'normal',
          transform: 'translateX(-50%)',
          zIndex: 10,
        }}>
          {canvasTooltip.text}
        </div>
      )}
    </div>
  );
}
