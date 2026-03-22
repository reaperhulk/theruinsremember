import { useState, useEffect, useRef } from 'react';
import { formatNumber } from './format.js';
import { playClick } from './AudioManager.js';

export function TuningPanel({ state, onUpdate }) {
  const [frequency, setFrequency] = useState(50);
  const [target, setTarget] = useState(50);
  const [result, setResult] = useState(null);
  const [lastTune, setLastTune] = useState(null);
  const targetTimerRef = useRef(null);
  const tuningScore = state.tuningScore || 0;

  // Change target every 30 seconds
  useEffect(() => {
    const newTarget = 10 + Math.floor(Math.random() * 80);
    setTarget(newTarget);
    targetTimerRef.current = setInterval(() => {
      setTarget(10 + Math.floor(Math.random() * 80));
      setResult(null);
    }, 30000);
    return () => clearInterval(targetTimerRef.current);
  }, []);

  const handleTune = () => {
    playClick();
    const diff = Math.abs(frequency - target);
    let quality;
    if (diff <= 2) quality = 'perfect';
    else if (diff <= 8) quality = 'good';
    else if (diff <= 20) quality = 'ok';
    else quality = 'miss';

    const multiplier = quality === 'perfect' ? 5 : quality === 'good' ? 2 : quality === 'ok' ? 1 : 0;

    setResult(quality);
    setTimeout(() => setResult(null), 1500);

    if (multiplier > 0) {
      onUpdate(s => {
        const cp = s.resources.cosmicPower;
        const uc = s.resources.universalConstants;
        if (!cp?.unlocked || !uc?.unlocked) return null;
        const cpRate = (cp.baseRate + cp.rateAdd) * cp.rateMult * (s.prestigeMultiplier || 1);
        const ucRate = (uc.baseRate + uc.rateAdd) * uc.rateMult * (s.prestigeMultiplier || 1);
        const cpGain = Math.max(1, cpRate * multiplier);
        const ucGain = Math.max(0.5, ucRate * multiplier * 0.5);
        setLastTune({ cp: cpGain, uc: ucGain });
        setTimeout(() => setLastTune(null), 800);
        return {
          ...s,
          tuningScore: (s.tuningScore || 0) + multiplier,
          resources: {
            ...s.resources,
            cosmicPower: { ...cp, amount: cp.amount + cpGain },
            universalConstants: { ...uc, amount: uc.amount + ucGain },
          },
        };
      });
    }
  };

  const resultColors = { perfect: '#ffdd44', good: '#88dd88', ok: '#aaaaaa', miss: '#ff6666' };
  const resultTexts = { perfect: 'PERFECT TUNE!', good: 'Good match', ok: 'Partial tune', miss: 'Off frequency' };

  return (
    <div className="panel tuning-panel">
      <h2>Cosmic Tuning (score: {tuningScore})</h2>
      <p className="text-lore" style={{ fontSize: '0.7em', fontStyle: 'italic', color: '#50b098', margin: '0 0 6px' }}>
        The universe hums at a frequency only the patient can hear.
      </p>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8em', marginBottom: '6px' }}>
        <span>Your frequency: <strong style={{ color: '#aaddff' }}>{frequency}</strong></span>
        <span>Target: <strong style={{ color: '#ffdd44' }}>???</strong> (match to tune)</span>
      </div>
      <div style={{ position: 'relative', height: '20px', background: '#111', border: '1px solid #333', marginBottom: '6px' }}>
        {/* Target zone indicator (hidden exact position, shown as glow) */}
        <div style={{
          position: 'absolute',
          left: `${target - 5}%`,
          width: '10%',
          height: '100%',
          background: 'rgba(255, 221, 68, 0.15)',
          borderRadius: '2px',
        }} />
        <div style={{
          position: 'absolute',
          left: `${target - 1}%`,
          width: '2%',
          height: '100%',
          background: 'rgba(255, 221, 68, 0.3)',
        }} />
        {/* Player frequency indicator */}
        <div style={{
          position: 'absolute',
          left: `${frequency}%`,
          width: '3px',
          height: '100%',
          background: '#aaddff',
          transform: 'translateX(-1px)',
          transition: 'left 0.1s',
        }} />
      </div>
      <input
        type="range"
        min="0"
        max="100"
        value={frequency}
        onChange={e => setFrequency(Number(e.target.value))}
        style={{ width: '100%', marginBottom: '6px' }}
      />
      {result && (
        <div style={{ textAlign: 'center', fontSize: '0.9em', color: resultColors[result], marginBottom: '4px', fontWeight: result === 'perfect' ? 'bold' : 'normal' }}>
          {resultTexts[result]}
        </div>
      )}
      <button className="mine-btn" onClick={handleTune} style={{ background: 'linear-gradient(90deg, #1a2a2a, #203030)' }}>
        {lastTune ? (
          <span style={{ color: '#50b098' }}>
            +{formatNumber(lastTune.cp)} power, +{formatNumber(lastTune.uc)} constants
          </span>
        ) : (
          <>Tune Frequency</>
        )}
      </button>
      <p className="mining-hint">Adjust the slider to match the hidden target | Target changes every 30s | Perfect = 5x reward</p>
    </div>
  );
}
