import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { attemptDock, DOCKING_APPROACHES, DOCKING_MISSIONS, getDockingInfo, getIndicatorPosition, selectDockingApproach, selectDockingMission } from '../engine/docking.js';
import { resources as resourceDefs } from '../data/resources.js';
import { formatNumber } from './format.js';

export const DockingPanel = memo(function DockingPanel({ state, onUpdate }) {
  const [lastResult, setLastResult] = useState(null);
  const [lastReward, setLastReward] = useState(null);
  const [position, setPosition] = useState(0);
  const [comboFlash, setComboFlash] = useState(false);
  const prevComboRef = useRef(state.dockingCombo || 0);
  const animRef = useRef(null);
  const startTimeRef = useRef(0);
  const eraRef = useRef(state.era);

  useEffect(() => { eraRef.current = state.era; }, [state.era]);

  useEffect(() => {
    startTimeRef.current = performance.now();
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

  const handleDock = useCallback(() => {
    const before = {};
    for (const [id, resource] of Object.entries(state.resources)) before[id] = resource.amount || 0;
    const { state: newState, result } = attemptDock(state, position);
    if (result === 'cooldown' || result === 'insufficient' || result === 'contractComplete') {
      setLastResult(result);
      return;
    }
    setLastResult(result);
    if (result !== 'miss') {
      const gained = {};
      for (const [id, resource] of Object.entries(newState.resources)) {
        const diff = (resource.amount || 0) - (before[id] || 0);
        if (diff > 0.001) gained[id] = diff;
      }
      if (Object.keys(gained).length > 0) {
        setLastReward(gained);
        setTimeout(() => setLastReward(null), 2000);
      }
    } else {
      setLastReward(null);
    }
    onUpdate(() => newState);
  }, [onUpdate, position, state]);

  // Keyboard shortcut: Enter or 'd' to dock
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Enter' || e.key === 'd' || e.key === 'D') {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        handleDock();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleDock]);

  const zoneLeft = (info.zoneCenter - info.zoneSize / 2) * 100;
  const zoneWidth = info.zoneSize * 100;
  const perfectLeft = (info.zoneCenter - info.perfectSize / 2) * 100;
  const perfectWidth = info.perfectSize * 100;

  return (
    <div className="panel docking-panel">
      <h2>Orbital Operations ({info.successes} docks){info.perfects > 0 ? `, ${info.perfects} perfect` : ''}</h2>
      <div className="dock-info">
        <span>Docks: {info.successes}/{info.attempts}{info.attempts > 0 && ` (${Math.floor(info.successes/info.attempts*100)}%)`}</span>
        <span>Perfect: {info.perfects}</span>
        {combo > 0 && <span className={comboFlash ? 'combo-flash' : ''} style={{ color: '#ffdd44', display: 'inline-block' }}>Combo: x{combo} (+{Math.min(combo, 5) * 20}%)</span>}
      </div>
      <div className="docking-missions" role="group" aria-label="Docking mission">
        {Object.values(DOCKING_MISSIONS).map(mission => (
          <button
            key={mission.id}
            className={info.missionId === mission.id ? 'active' : ''}
            disabled={(info.contracts[mission.id] || 0) >= info.contractQuota}
            onClick={() => onUpdate(current => selectDockingMission(current, mission.id))}
            title={mission.description}
          >
            <strong>{mission.name}</strong>
            <span>{info.contracts[mission.id] || 0}/{info.contractQuota} contract</span>
            <span>{mission.payoff}</span>
          </button>
        ))}
      </div>
      <p className="docking-mission-brief">{DOCKING_MISSIONS[info.missionId].description}</p>
      <div className="docking-approaches" role="group" aria-label="Docking approach">
        {Object.values(DOCKING_APPROACHES).map(approach => (
          <button
            key={approach.id}
            className={info.approachId === approach.id ? 'active' : ''}
            onClick={() => onUpdate(current => selectDockingApproach(current, approach.id))}
            title={approach.description}
          >
            <strong>{approach.name}</strong>
            <span>{approach.rewardMult}x reward</span>
          </button>
        ))}
      </div>
      <p className="docking-mission-brief">{DOCKING_APPROACHES[info.approachId].description}</p>
      <div className="dock-bar">
        <div className="dock-zone" style={{ left: `${zoneLeft}%`, width: `${zoneWidth}%` }} />
        <div className="dock-perfect" style={{ left: `${perfectLeft}%`, width: `${perfectWidth}%` }} />
        <div className="dock-indicator" style={{ left: `${position * 100}%` }} />
      </div>
      {lastResult && (
        <div className={`dock-result dock-${lastResult}`}>
          {lastResult === 'perfect' ? 'PERFECT DOCK!' : lastResult === 'good' ? 'Good dock!' : lastResult === 'insufficient' ? 'Hard Burn needs 4 fuel.' : lastResult === 'contractComplete' ? 'Choose an unfinished contract.' : 'Missed... combo reset!'}
        </div>
      )}
      {lastReward && (
        <div className="dock-reward" style={{ fontSize: '0.8em', color: '#88dd88', margin: '4px 0' }}>
          Gained: {Object.entries(lastReward).map(([id, amount], i) => (
            <span key={id}>{i > 0 ? ', ' : ''}{resourceDefs[id]?.name || id} +{formatNumber(amount)}</span>
          ))}
        </div>
      )}
      <button className="mine-btn" onClick={handleDock} disabled={onCooldown || info.contractComplete} aria-label={onCooldown ? `Docking cooldown: ${cooldownRemaining.toFixed(1)} seconds remaining` : info.contractComplete ? 'Current docking contract complete' : 'Dock now. Press D key as shortcut.'}>
        {onCooldown ? `Wait ${cooldownRemaining.toFixed(1)}s` : info.contractComplete ? 'Contract complete' : 'Dock! (d)'}
      </button>
      <p className="operation-hint">
        Each era offers three finite contracts | Complete a contract for a permanent run payoff | Combo streaks boost rewards up to x2
      </p>
    </div>
  );
});
