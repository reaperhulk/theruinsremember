import { useEffect, useRef, useState, useCallback } from 'react';
import { setParallax } from './scenes/shared.js';
import { drawEra1 } from './scenes/planetfall.js';
import { drawEra2 } from './scenes/industry.js';
import { drawDigitalAge } from './scenes/digital.js';
import { drawEra3 } from './scenes/orbit.js';
import { drawEra4 } from './scenes/solar.js';
import { drawEra5 } from './scenes/interstellar.js';
import { drawDysonEra } from './scenes/dyson.js';
import { drawEra6 } from './scenes/galactic.js';
import { drawIntergalactic } from './scenes/intergalactic.js';
import { drawMultiverse } from './scenes/multiverse.js';
import { sceneState } from './sceneState.js';
import { formatNumber } from './format.js';

// Scenes draw in a fixed logical space scaled to the element's real pixels.
const LOGICAL_W = 280;
const LOGICAL_H = 180;
const SCENES = {
  1: drawEra1, 2: drawEra2, 3: drawDigitalAge, 4: drawEra3, 5: drawEra4,
  6: drawEra5, 7: drawDysonEra, 8: drawEra6, 9: drawIntergalactic, 10: drawMultiverse,
};
const MAX_FLOATERS = 24;

export function RuinsCanvas({ state, clickValue, showNumbers, onDig, onCatchEcho, lowPower }) {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const sceneRef = useRef(sceneState(state));
  const pointerRef = useRef({ x: 0, y: 0 });
  const burstsRef = useRef([]);
  const [floaters, setFloaters] = useState([]);
  const [pressed, setPressed] = useState(false);
  const floaterId = useRef(0);

  useEffect(() => { sceneRef.current = sceneState(state); }, [state.era, state.buildings]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return undefined;
    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, lowPower ? 1 : 2);
      const w = Math.max(1, Math.round(rect.width * dpr));
      const h = Math.max(1, Math.round(rect.height * dpr));
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(wrap);
    return () => observer.disconnect();
  }, [lowPower]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return undefined;
    let raf;
    let last = 0;
    const interval = lowPower ? 100 : 33;
    const frame = now => {
      raf = requestAnimationFrame(frame);
      if (now - last < interval || document.hidden) return;
      last = now;
      const t = now / 1000;
      const scene = sceneRef.current;
      // Cover the element: scale the logical scene to fill it, cropping the overflow.
      const scale = Math.max(canvas.width / LOGICAL_W, canvas.height / LOGICAL_H);
      const offsetX = (canvas.width - LOGICAL_W * scale) / 2;
      const offsetY = (canvas.height - LOGICAL_H * scale) / 2;
      ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY);
      setParallax(pointerRef.current.x, pointerRef.current.y);
      try { (SCENES[scene.era] || drawEra1)(ctx, LOGICAL_W, LOGICAL_H, t, scene); } catch { /* a scene glitch must never stop the game */ }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      const vignette = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, canvas.height * 0.2, canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) * 0.7);
      vignette.addColorStop(0, 'rgba(0,0,0,0)');
      vignette.addColorStop(1, 'rgba(0,0,0,0.45)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      // Dust kicked up by digging.
      const bursts = burstsRef.current;
      for (let i = bursts.length - 1; i >= 0; i--) {
        const b = bursts[i];
        const age = t - b.start;
        if (age > 0.7) { bursts.splice(i, 1); continue; }
        for (const p of b.particles) {
          const x = b.x + p.vx * age * canvas.width;
          const y = b.y + (p.vy * age + 0.9 * age * age) * canvas.height;
          ctx.fillStyle = `rgba(255, 214, 150, ${1 - age / 0.7})`;
          ctx.fillRect(x, y, p.size, p.size);
        }
      }
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [lowPower]);

  const dig = useCallback((clientX, clientY) => {
    const rect = wrapRef.current.getBoundingClientRect();
    const x = clientX == null ? rect.width / 2 : clientX - rect.left;
    const y = clientY == null ? rect.height / 2 : clientY - rect.top;
    onDig();
    const canvas = canvasRef.current;
    const ratio = canvas ? canvas.width / rect.width : 1;
    if (burstsRef.current.length < 12) {
      burstsRef.current.push({
        x: x * ratio, y: y * ratio, start: performance.now() / 1000,
        particles: Array.from({ length: lowPower ? 4 : 9 }, () => ({ vx: (Math.random() - 0.5) * 0.25, vy: -0.15 - Math.random() * 0.25, size: (1 + Math.random() * 2) * ratio })),
      });
    }
    if (!showNumbers) return;
    const id = ++floaterId.current;
    setFloaters(list => [...list.slice(-(MAX_FLOATERS - 1)), { id, x, y, text: `+${formatNumber(clickValue)}` }]);
    setTimeout(() => setFloaters(list => list.filter(f => f.id !== id)), 900);
  }, [onDig, clickValue, showNumbers, lowPower]);

  const echo = state.echo.active;
  return (
    <div className="ruins-stage" ref={wrapRef}
      onPointerMove={e => {
        const rect = wrapRef.current.getBoundingClientRect();
        pointerRef.current = { x: (e.clientX - rect.left) / rect.width - 0.5, y: (e.clientY - rect.top) / rect.height - 0.5 };
      }}>
      <canvas ref={canvasRef} aria-hidden="true" />
      <button
        type="button"
        className={`dig-target${pressed ? ' pressed' : ''}`}
        aria-label={`Dig in the ruins for ${formatNumber(clickValue)} salvage`}
        onPointerDown={e => {
          if (e.button !== 0) return;
          e.preventDefault();
          setPressed(true);
          dig(e.clientX, e.clientY);
        }}
        onPointerUp={() => setPressed(false)}
        onPointerLeave={() => setPressed(false)}
        onKeyDown={e => {
          if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) { e.preventDefault(); dig(); }
        }}
        onClick={e => {
          // Pointer presses are handled on pointerdown; detail 0 means a
          // keyboard or assistive activation that did not come through above.
          if (e.detail === 0 && !e.nativeEvent.pointerType) dig();
        }}
      >
        <span className="dig-hint">Dig</span>
      </button>
      {floaters.map(f => (
        <span key={f.id} className="floater" style={{ left: f.x, top: f.y }} aria-hidden="true">{f.text}</span>
      ))}
      {echo && (
        <button type="button" className="echo-orb" style={{ left: `${echo.x * 100}%`, top: `${echo.y * 100}%` }}
          aria-label="Catch the echo" onClick={onCatchEcho}>
          <span aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
