import { useState, useEffect, useRef } from 'react';
import { attemptDock, getDockingInfo, getIndicatorPosition } from '../engine/docking.js';

export function DockingPanel({ state, onUpdate }) {
  const [lastResult, setLastResult] = useState(null);
  const [position, setPosition] = useState(0);
  const [comboFlash, setComboFlash] = useState(false);
  const prevComboRef = useRef(state.dockingCombo || 0);
  const animRef = useRef(null);
  const startTimeRef = useRef(performance.now());
  const eraRef = useRef(state.era);

  useEffect(() => { eraRef.current = state.era; }, [state.era]);

  useEffect(() => {
    const animate = (now) => {
      const elapsed = (now - startTimeRef.current) / 1000;
      setPosition(getIndicatorPosition(elapsed, eraRef.current));
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  const info = getDockingInfo(state);
  const combo = state.dockingCombo || 0;

  // Detect combo increase and trigger flash
  useEffect(() => {
    if (combo > prevComboRef.current) {
      setComboFlash(true);
      const t = setTimeout(() => setComboFlash(false), 300);
      prevComboRef.current = combo;
      return () => clearTimeout(t);
    }
    prevComboRef.current = combo;
  }, [combo]);
  const lastDock = state.lastDockTime || 0;
  const cooldownRemaining = Math.max(0, 2 - (state.totalTime - lastDock));
  const onCooldown = cooldownRemaining > 0;

  const handleDock = () => {
    onUpdate(s => {
      const { state: newState, result } = attemptDock(s, position);
      if (result !== 'cooldown') setLastResult(result);
      return newState;
    });
  };

  const zoneLeft = (info.zoneCenter - info.zoneSize / 2) * 100;
  const zoneWidth = info.zoneSize * 100;
  const perfectLeft = (info.zoneCenter - info.perfectSize / 2) * 100;
  const perfectWidth = info.perfectSize * 100;

  return (
    <div className="panel docking-panel">
      <h2>Orbital Docking{info.successes > 0 ? ` (${info.successes} docks)` : ''}</h2>
      <div className="dock-info">
        <span>Docks: {info.successes}/{info.attempts}{info.attempts > 0 && ` (${Math.floor(info.successes/info.attempts*100)}%)`}</span>
        <span>Perfect: {info.perfects}</span>
        {combo > 0 && <span className={comboFlash ? 'combo-flash' : ''} style={{ color: '#ffdd44', display: 'inline-block' }}>Combo: x{combo} (+{Math.min(combo, 5) * 20}%)</span>}
      </div>
      <div className="dock-bar">
        <div className="dock-zone" style={{ left: `${zoneLeft}%`, width: `${zoneWidth}%` }} />
        <div className="dock-perfect" style={{ left: `${perfectLeft}%`, width: `${perfectWidth}%` }} />
        <div className="dock-indicator" style={{ left: `${position * 100}%` }} />
      </div>
      {lastResult && (
        <div className={`dock-result dock-${lastResult}`}>
          {lastResult === 'perfect' ? 'PERFECT DOCK!' : lastResult === 'good' ? 'Good dock!' : 'Missed... combo reset!'}
        </div>
      )}
      <button className="mine-btn" onClick={handleDock} disabled={onCooldown}>
        {onCooldown ? `Wait ${cooldownRemaining.toFixed(1)}s` : 'Dock!'}
      </button>
      <p className="mining-hint">
        Hit green zone for fuel+infra | Perfect for exotic too | Combo up to x2
      </p>
    </div>
  );
}
