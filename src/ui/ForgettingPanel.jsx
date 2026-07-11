import { memo, useCallback, useEffect, useRef, useState } from 'react';
import {
  autoStationWarden,
  getForgettingStats,
  placeWarden,
  TENDRIL_CONSUME_TIME,
  TENDRIL_SEAL_HOLD,
  WARDEN_MOVE_COOLDOWN,
} from '../engine/forgetting.js';
import { playClick } from './AudioManager.js';

const KIND_COLORS = {
  system: '#88ccff',
  law: '#dd88ff',
  lock: '#7fd8c4',
  senate: '#ddaa44',
  colony: '#73c49b',
  dyson: '#f2b04e',
  relic: '#e6c766',
};
const SCAR_COLOR = '#5a3038';
const WARDEN_COLOR = '#9ff2ff';
const TENDRIL_COLOR = '#b06ad0';

const CANVAS_W = 480;
const CANVAS_H = 300;
const HIT_RADIUS = 36;

function nodePixel(node) {
  return { x: node.x * CANVAS_W, y: node.y * CANVAS_H };
}

function tendrilSpawnPixel(tendril) {
  return {
    x: (0.5 + Math.cos(tendril.spawnAngle) * 0.47) * CANVAS_W,
    y: (0.5 + Math.sin(tendril.spawnAngle) * 0.47) * CANVAS_H,
  };
}

function drawSiege(ctx, stats, totalTime, selectedWardenId, animTime) {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

  // Void backdrop with the Archive's glow at center
  const bg = ctx.createRadialGradient(CANVAS_W / 2, CANVAS_H / 2, 10, CANVAS_W / 2, CANVAS_H / 2, CANVAS_W * 0.55);
  bg.addColorStop(0, '#141a2b');
  bg.addColorStop(1, '#07080f');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // The rim the Forgetting breaches from
  ctx.strokeStyle = 'rgba(120, 80, 150, 0.25)';
  ctx.setLineDash([3, 5]);
  ctx.beginPath();
  ctx.ellipse(CANVAS_W / 2, CANVAS_H / 2, 0.47 * CANVAS_W, 0.47 * CANVAS_H, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  const nodeById = Object.fromEntries(stats.nodes.map(node => [node.id, node]));

  // Tendrils
  for (const tendril of stats.tendrils) {
    const target = nodeById[tendril.targetId];
    if (!target) continue;
    const from = tendrilSpawnPixel(tendril);
    const to = nodePixel(target);

    if (tendril.phase === 'approach') {
      const span = Math.max(0.001, tendril.arrivesAt - tendril.spawnedAt);
      const progress = Math.max(0, Math.min(1, (totalTime - tendril.spawnedAt) / span));
      const headX = from.x + (to.x - from.x) * progress;
      const headY = from.y + (to.y - from.y) * progress;
      ctx.strokeStyle = TENDRIL_COLOR;
      ctx.globalAlpha = 0.65;
      ctx.lineWidth = 1.6;
      ctx.setLineDash([4, 3]);
      ctx.lineDashOffset = -animTime * 12;
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(headX, headY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
      ctx.fillStyle = TENDRIL_COLOR;
      ctx.beginPath();
      ctx.arc(headX, headY, 3.4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Held (gold seal ring filling) or consuming (red ring draining)
      const held = tendril.phase === 'held';
      const fraction = held
        ? Math.min(1, (totalTime - tendril.heldSince) / TENDRIL_SEAL_HOLD)
        : Math.max(0, Math.min(1, (tendril.consumesAt - totalTime) / TENDRIL_CONSUME_TIME));
      ctx.strokeStyle = held ? '#e6c766' : '#e05a5a';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(to.x, to.y, 14, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * fraction);
      ctx.stroke();
      ctx.strokeStyle = TENDRIL_COLOR;
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  // The Archive
  const pulse = 4 + Math.sin(animTime * 2) * 1.5;
  ctx.fillStyle = 'rgba(170, 221, 255, 0.9)';
  ctx.beginPath();
  ctx.arc(CANVAS_W / 2, CANVAS_H / 2, pulse + 4, 0, Math.PI * 2);
  ctx.fill();

  // Memory nodes
  for (const node of stats.nodes) {
    const { x, y } = nodePixel(node);
    if (node.scarred) {
      ctx.strokeStyle = SCAR_COLOR;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x - 5, y - 5); ctx.lineTo(x + 5, y + 5);
      ctx.moveTo(x + 5, y - 5); ctx.lineTo(x - 5, y + 5);
      ctx.stroke();
      continue;
    }
    ctx.fillStyle = KIND_COLORS[node.kind] || '#aeb8c5';
    ctx.beginPath();
    ctx.arc(x, y, 6.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Wardens
  for (const warden of stats.wardens) {
    if (!warden.nodeId) continue;
    const node = nodeById[warden.nodeId];
    if (!node) continue;
    const { x, y } = nodePixel(node);
    ctx.strokeStyle = WARDEN_COLOR;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 10.5, 0, Math.PI * 2);
    ctx.stroke();
    if (warden.cooldownRemaining > 0) {
      ctx.strokeStyle = 'rgba(159, 242, 255, 0.35)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(x, y, 10.5, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (warden.cooldownRemaining / WARDEN_MOVE_COOLDOWN));
      ctx.stroke();
    }
    if (warden.id === selectedWardenId) {
      ctx.strokeStyle = '#ffffff';
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.arc(x, y, 14, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
}

export const ForgettingPanel = memo(function ForgettingPanel({ state, onUpdate }) {
  const canvasRef = useRef(null);
  const stateRef = useRef(state);
  const selectedRef = useRef(null);
  const [selectedWarden, setSelectedWarden] = useState(null);
  const [hint, setHint] = useState(null);
  stateRef.current = state;
  selectedRef.current = selectedWarden;

  const stats = getForgettingStats(state);
  const stationed = stats.wardens.filter(warden => warden.nodeId).length;

  // Render loop — pauses when the tab is hidden.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    let raf = null;
    const draw = () => {
      const current = stateRef.current;
      drawSiege(ctx, getForgettingStats(current), current.totalTime, selectedRef.current, performance.now() / 1000);
      raf = requestAnimationFrame(draw);
    };
    const onVisibility = () => {
      if (document.hidden) { if (raf) cancelAnimationFrame(raf); raf = null; }
      else if (!raf) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  const showHint = useCallback(text => {
    setHint(text);
    setTimeout(() => setHint(null), 1600);
  }, []);

  const stationAt = useCallback(nodeId => {
    playClick();
    let outcome = null;
    onUpdate(current => {
      const wardenId = selectedRef.current;
      const result = wardenId != null
        ? placeWarden(current, wardenId, nodeId)
        : autoStationWarden(current, nodeId);
      outcome = result ? 'ok' : 'blocked';
      return result ? result.state : current;
    });
    setSelectedWarden(null);
    if (outcome === 'blocked') showHint('No warden can move there yet — cooldowns or the node is lost.');
  }, [onUpdate, showHint]);

  const handleCanvasClick = useCallback(event => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * (CANVAS_W / rect.width);
    const y = (event.clientY - rect.top) * (CANVAS_H / rect.height);
    const hitRadius = HIT_RADIUS * (CANVAS_W / rect.width);

    const current = stateRef.current;
    const liveStats = getForgettingStats(current);
    let nearest = null;
    let nearestDistance = Infinity;
    for (const node of liveStats.nodes) {
      const px = nodePixel(node);
      const distance = Math.hypot(px.x - x, px.y - y);
      if (distance < nearestDistance) { nearestDistance = distance; nearest = node; }
    }
    if (!nearest || nearestDistance > hitRadius) { setSelectedWarden(null); return; }

    const wardenHere = liveStats.wardens.find(warden => warden.nodeId === nearest.id);
    if (wardenHere && selectedRef.current !== wardenHere.id) {
      playClick();
      setSelectedWarden(wardenHere.id);
      return;
    }
    if (wardenHere && selectedRef.current === wardenHere.id) { setSelectedWarden(null); return; }
    if (nearest.scarred) { showHint('That memory is already lost.'); return; }
    stationAt(nearest.id);
  }, [stationAt, showHint]);

  const threats = stats.tendrils
    .filter(tendril => tendril.phase !== 'held' && !stats.wardens.some(warden => warden.nodeId === tendril.targetId))
    .sort((a, b) => a.eta - b.eta)
    .slice(0, 3);

  const meterColor = stats.meter >= 75 ? '#e05a5a' : stats.meter >= 40 ? '#ddaa44' : '#9f7fd0';

  return (
    <div className="panel forgetting-panel">
      <div className="tuning-header">
        <div>
          <span className="panel-kicker">The cycle turns</span>
          <h2>The Forgetting</h2>
        </div>
        <strong>{stationed}/{stats.wardens.length} wardens stationed</strong>
      </div>

      <div className="siege-meter" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(stats.meter)} aria-label="The Forgetting">
        <div className="siege-meter-fill" style={{ width: `${stats.meter}%`, background: meterColor }} />
        <span>
          {stats.collapsed ? 'The cycle has claimed this civilization.'
            : `${stats.meter.toFixed(1)}%${stats.ratePerSecond < 0 ? ' — being pushed back' : stats.tendrils.some(t => t.phase === 'held') ? ' — held' : ''}`}
        </span>
      </div>

      {stats.collapsed ? (
        <p className="operation-commitment">Every memory dims. Prestige to begin the next cycle — the ruins will remember.</p>
      ) : (
        <>
          <canvas
            ref={canvasRef}
            className="siege-canvas"
            width={CANVAS_W}
            height={CANVAS_H}
            onClick={handleCanvasClick}
            role="img"
            aria-label="Memory constellation under siege — tap a memory to station a warden"
          />
          {hint && <div className="operation-result" role="status">{hint}</div>}

          <div className="siege-mirror">
            {stats.wardens.map(warden => (
              <span key={warden.id} className="siege-warden-status">
                Warden {warden.id}: {warden.nodeId ? (stats.nodes.find(node => node.id === warden.nodeId)?.label || warden.nodeId) : 'unstationed'}
                {warden.cooldownRemaining > 0 ? ` (${Math.ceil(warden.cooldownRemaining)}s)` : ''}
              </span>
            ))}
            {threats.map(tendril => (
              <button key={tendril.id} className="siege-threat-btn" onClick={() => stationAt(tendril.targetId)}>
                Defend {tendril.targetLabel} ({Math.ceil(tendril.eta)}s)
              </button>
            ))}
          </div>

          <p className="operation-hint">
            Tap a memory to station a warden | Held tendrils stall the meter, sealed ones push it back | Lost memories stay lost this cycle
          </p>
        </>
      )}
    </div>
  );
});
