import { useCallback, useEffect, useRef, useState } from 'react';
import { createInitialState } from '../engine/state.js';
import { beginRound, collectEmbers, getGlowRate, getEmbersEarned, placeStructure, DAY_LENGTH, HEART_MAX } from '../engine/round.js';
import { endDay, tick } from '../engine/tick.js';
import { getWardenCooldown, moveWarden } from '../engine/night.js';
import { buyMetaUpgrade, META_UPGRADES } from '../engine/meta.js';
import { STRUCTURES } from '../engine/structures.js';

const CANVAS = 420;
const HIT_RADIUS = 40;

const STRUCTURE_COLORS = {
  farm: '#8fc97a',
  well: '#7ab8c9',
  lantern: '#e6c766',
  watchtower: '#d9985f',
  palisade: '#a08c78',
  shrine: '#c99ae0',
};

function slotPixel(slot) {
  return { x: slot.x * CANVAS, y: slot.y * CANVAS };
}

function drawTown(ctx, state, selectedCard, animTime) {
  const round = state.round;
  ctx.clearRect(0, 0, CANVAS, CANVAS);
  const night = round.phase === 'night';

  const bg = ctx.createRadialGradient(CANVAS / 2, CANVAS / 2, 20, CANVAS / 2, CANVAS / 2, CANVAS * 0.6);
  bg.addColorStop(0, night ? '#141220' : '#1c2030');
  bg.addColorStop(1, night ? '#050409' : '#0b0d16');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, CANVAS, CANVAS);

  // The rim the dark waits behind
  ctx.strokeStyle = night ? 'rgba(150, 90, 170, 0.5)' : 'rgba(110, 110, 140, 0.25)';
  ctx.setLineDash([4, 6]);
  ctx.beginPath();
  ctx.arc(CANVAS / 2, CANVAS / 2, CANVAS * 0.46, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // The Heart: glow scales with remaining light
  const lightFraction = round.heart / HEART_MAX;
  const pulse = 10 + Math.sin(animTime * 2.2) * 2.5;
  const heartGlow = ctx.createRadialGradient(CANVAS / 2, CANVAS / 2, 2, CANVAS / 2, CANVAS / 2, 60 + 80 * lightFraction);
  heartGlow.addColorStop(0, `rgba(255, 208, 130, ${0.55 + 0.35 * lightFraction})`);
  heartGlow.addColorStop(1, 'rgba(255, 208, 130, 0)');
  ctx.fillStyle = heartGlow;
  ctx.fillRect(0, 0, CANVAS, CANVAS);
  ctx.fillStyle = '#ffd082';
  ctx.beginPath();
  ctx.arc(CANVAS / 2, CANVAS / 2, pulse * (0.6 + 0.4 * lightFraction), 0, Math.PI * 2);
  ctx.fill();

  // Shades
  for (const shade of round.shades) {
    const from = {
      x: CANVAS / 2 + Math.cos(shade.spawnAngle) * CANVAS * 0.46,
      y: CANVAS / 2 + Math.sin(shade.spawnAngle) * CANVAS * 0.46,
    };
    const targetSlot = shade.targetSlotId ? round.slots.find(slot => slot.id === shade.targetSlotId) : null;
    const to = targetSlot ? slotPixel(targetSlot) : { x: CANVAS / 2, y: CANVAS / 2 };
    let progress = 1;
    if (shade.phase === 'approach') {
      const span = Math.max(0.001, shade.arrivesAt - shade.spawnedAt);
      progress = Math.max(0, Math.min(1, (round.time - shade.spawnedAt) / span));
    }
    const headX = from.x + (to.x - from.x) * progress;
    const headY = from.y + (to.y - from.y) * progress;
    ctx.strokeStyle = 'rgba(176, 106, 208, 0.7)';
    ctx.lineWidth = 1.6;
    ctx.setLineDash([4, 3]);
    ctx.lineDashOffset = -animTime * 14;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(headX, headY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = shade.phase === 'held' ? '#e6c766' : '#b06ad0';
    ctx.beginPath();
    ctx.arc(headX, headY, shade.phase === 'approach' ? 4 : 6, 0, Math.PI * 2);
    ctx.fill();
  }

  // Slots and structures
  for (const slot of round.slots) {
    const { x, y } = slotPixel(slot);
    if (!slot.structure) {
      ctx.strokeStyle = selectedCard ? 'rgba(230, 199, 102, 0.8)' : 'rgba(140, 140, 170, 0.4)';
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.arc(x, y, 11, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      continue;
    }
    const def = STRUCTURES[slot.structure.type];
    ctx.fillStyle = STRUCTURE_COLORS[slot.structure.type] || '#aeb8c5';
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0b0d16';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(def.name[0], x, y + 0.5);
    if (slot.structure.level >= 2) {
      ctx.fillStyle = '#ffd082';
      ctx.beginPath();
      ctx.arc(x + 10, y - 10, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    if (slot.structure.hp > 1) {
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.font = '9px monospace';
      ctx.fillText(String(slot.structure.hp), x, y + 19);
    }
  }

  // Wardens
  for (const warden of round.wardens) {
    if (!warden.slotId) continue;
    const slot = round.slots.find(candidate => candidate.id === warden.slotId);
    if (!slot) continue;
    const { x, y } = slotPixel(slot);
    ctx.strokeStyle = '#9ff2ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 17, 0, Math.PI * 2);
    ctx.stroke();
  }
}

export function App() {
  const [state, setState] = useState(createInitialState);
  const [selectedCard, setSelectedCard] = useState(null);
  const hasRound = state.round != null;
  const stateRef = useRef(state);
  const selectedRef = useRef(selectedCard);
  const canvasRef = useRef(null);
  useEffect(() => {
    stateRef.current = state;
    selectedRef.current = selectedCard;
  }, [state, selectedCard]);

  // Game loop: engine ticks at wall-clock speed.
  useEffect(() => {
    let raf = null;
    let last = performance.now();
    const loop = now => {
      const dt = Math.min(1, (now - last) / 1000);
      last = now;
      setState(current => (current.round && current.round.phase !== 'fallen' ? tick(current, dt) : current));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Canvas paint loop.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    // Fixed 2x backing store: crisp on retina and on desktops where CSS
    // scales the map above its logical 420px.
    const dpr = 2;
    canvas.width = CANVAS * dpr;
    canvas.height = CANVAS * dpr;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    let raf = null;
    const draw = () => {
      if (stateRef.current.round) drawTown(ctx, stateRef.current, selectedRef.current, performance.now() / 1000);
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
    // Remount the paint loop when a round starts or ends.
  }, [hasRound]);

  const sendWarden = useCallback(slotId => {
    setState(current => {
      const round = current.round;
      if (!round || round.phase !== 'night') return current;
      const held = new Set(round.shades.filter(shade => shade.phase === 'held').map(shade => shade.targetSlotId));
      const free = round.wardens.find(warden =>
        round.time - warden.movedAt >= getWardenCooldown(current) && !held.has(warden.slotId));
      if (!free) return current;
      return moveWarden(current, free.id, slotId) || current;
    });
  }, []);

  const handleCanvasClick = useCallback(event => {
    const canvas = canvasRef.current;
    const current = stateRef.current;
    if (!canvas || !current.round) return;
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * (CANVAS / rect.width);
    const y = (event.clientY - rect.top) * (CANVAS / rect.height);
    let nearest = null;
    let nearestDistance = Infinity;
    for (const slot of current.round.slots) {
      const px = slotPixel(slot);
      const distance = Math.hypot(px.x - x, px.y - y);
      if (distance < nearestDistance) { nearestDistance = distance; nearest = slot; }
    }
    if (!nearest || nearestDistance > HIT_RADIUS) return;

    if (current.round.phase === 'day' && selectedRef.current) {
      setState(prev => placeStructure(prev, selectedRef.current, nearest.id) || prev);
      setSelectedCard(null);
    } else if (current.round.phase === 'night') {
      sendWarden(nearest.id);
    }
  }, [sendWarden]);

  const round = state.round;

  if (!round) {
    return (
      <div className="home">
        <h1>Hearthlight</h1>
        <p className="lore">Something in the dark keeps eating the towns. Light the Heart. Last longer.</p>
        {state.lastRound && (
          <p className="last-round">
            The last town stood {state.lastRound.nights} night{state.lastRound.nights === 1 ? '' : 's'} and left {state.lastRound.embers} Embers.
          </p>
        )}
        <div className="records">
          <span>Embers: <strong>{state.embers}</strong></span>
          <span>Best: <strong>{state.bestNights} nights</strong></span>
          <span>Rounds: <strong>{state.totalRounds}</strong></span>
        </div>
        <div className="shop">
          {Object.values(META_UPGRADES).map(upgrade => (
            <button
              key={upgrade.id}
              className={state.meta[upgrade.id] ? 'owned' : ''}
              disabled={state.meta[upgrade.id] || state.embers < upgrade.cost}
              onClick={() => setState(current => buyMetaUpgrade(current, upgrade.id) || current)}
            >
              <strong>{upgrade.name}</strong>
              <span>{upgrade.description}</span>
              <em>{state.meta[upgrade.id] ? 'Kept' : `${upgrade.cost} Embers`}</em>
            </button>
          ))}
        </div>
        <button className="begin" onClick={() => setState(current => beginRound(current))}>
          Begin the Vigil
        </button>
      </div>
    );
  }

  const isDay = round.phase === 'day';
  const fallen = round.phase === 'fallen';
  const dayRemaining = Math.max(0, DAY_LENGTH - (round.time - round.phaseStart));
  const threats = round.shades
    .filter(shade => shade.targetSlotId && shade.phase !== 'held' &&
      !round.wardens.some(warden => warden.slotId === shade.targetSlotId))
    .slice(0, 3);

  return (
    <div className="game">
      <header>
        <div>
          <h1>Hearthlight</h1>
          <span className={`phase ${round.phase}`}>
            {fallen ? 'Fallen' : isDay ? `Day ${round.day} — ${Math.ceil(dayRemaining)}s` : `Night ${round.day}`}
          </span>
        </div>
        <div className="stats">
          <span>Glow <strong>{Math.floor(round.glow)}</strong> (+{getGlowRate(state).toFixed(1)}/s)</span>
          <span>Embers <strong>{state.embers}</strong></span>
        </div>
      </header>

      <div className="heart-bar" role="meter" aria-valuemin={0} aria-valuemax={HEART_MAX} aria-valuenow={Math.round(round.heart)} aria-label="Heart light">
        <div style={{ width: `${(round.heart / HEART_MAX) * 100}%` }} />
        <span>{fallen ? 'The Heart is dark.' : `Heart ${Math.ceil(round.heart)} / ${HEART_MAX}`}</span>
      </div>

      {fallen ? (
        <div className="fallen-panel">
          <h2>The town is memory now.</h2>
          <p>{round.day - 1} night{round.day - 1 === 1 ? '' : 's'} survived — <strong>{getEmbersEarned(round)} Embers</strong> carried home.</p>
          <button className="begin" onClick={() => { setState(current => collectEmbers(current)); setSelectedCard(null); }}>
            Return to the Fire
          </button>
        </div>
      ) : (
        <div className="playfield">
          <canvas
            ref={canvasRef}
            width={CANVAS}
            height={CANVAS}
            onClick={handleCanvasClick}
            role="img"
            aria-label={isDay ? 'Town map — pick a card, then tap an empty slot' : 'Night — tap a slot to send the Warden'}
          />
          <div className="side">
          {isDay ? (
            <div className="day-controls">
              <div className="draft">
                {round.draft.map(id => {
                  const def = STRUCTURES[id];
                  const affordable = round.glow >= def.cost && !round.placedToday;
                  return (
                    <button
                      key={id}
                      className={selectedCard === id ? 'selected' : ''}
                      disabled={!affordable}
                      onClick={() => setSelectedCard(selectedCard === id ? null : id)}
                    >
                      <strong>{def.name} — {def.cost}</strong>
                      <span>{def.description}</span>
                    </button>
                  );
                })}
              </div>
              <button className="end-day" onClick={() => setState(current => endDay(current))}>
                {round.placedToday ? 'Call the Dusk' : 'Skip the day (place nothing)'}
              </button>
              {selectedCard && <p className="hint">Tap an empty slot to build the {STRUCTURES[selectedCard].name}.</p>}
            </div>
          ) : (
            <div className="night-controls">
              {threats.length > 0 ? threats.map(shade => {
                const slot = round.slots.find(candidate => candidate.id === shade.targetSlotId);
                const name = slot?.structure ? STRUCTURES[slot.structure.type].name : 'ruin';
                return (
                  <button key={shade.id} onClick={() => sendWarden(shade.targetSlotId)}>
                    Warden → {name} ({Math.max(0, Math.ceil((shade.phase === 'approach' ? shade.arrivesAt : shade.feedsAt) - round.time))}s)
                  </button>
                );
              }) : <span className="hint">The Warden watches. Hold the line.</span>}
            </div>
          )}

          <div className="log">
            {round.log.slice(-4).map((entry, index) => (
              <div key={index}>{entry.message}</div>
            ))}
          </div>
          </div>
        </div>
      )}
    </div>
  );
}
