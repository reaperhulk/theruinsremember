import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { formatNumber } from './format.js';
import { playClick } from './AudioManager.js';
import { getTuningQuality, applyTuning, TUNING_TIERS, getTuningProductionBonus, getNextTuningTier } from '../engine/tuning.js';

export const TuningPanel = memo(function TuningPanel({ state, onUpdate }) {
  const [frequency, setFrequency] = useState(50);
  const [target, setTarget] = useState(50);
  const [result, setResult] = useState(null);
  const [lastTune, setLastTune] = useState(null);
  const targetTimerRef = useRef(null);
  const tuningScore = state.tuningScore || 0;
  const tuningBonus = getTuningProductionBonus(tuningScore);
  const nextTier = getNextTuningTier(tuningScore);

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

  const handleTune = useCallback(() => {
    playClick();
    const diff = Math.abs(frequency - target);
    const quality = getTuningQuality(diff);

    setResult(quality);
    setTimeout(() => setResult(null), 1500);

    if (quality !== 'miss') {
      onUpdate(s => {
        const tuneResult = applyTuning(s, quality);
        if (!tuneResult) return null;
        setLastTune({ cp: tuneResult.cpGain, uc: tuneResult.ucGain });
        setTimeout(() => setLastTune(null), 800);
        return tuneResult.state;
      });
    }
  }, [frequency, target, onUpdate]);

  // Keyboard support: arrow keys to adjust, Enter to tune
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); setFrequency(f => Math.max(0, f - 2)); }
      if (e.key === 'ArrowRight') { e.preventDefault(); setFrequency(f => Math.min(100, f + 2)); }
      if (e.key === 'Enter') { e.preventDefault(); handleTune(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleTune]);

  const distance = Math.abs(frequency - target);
  const resultColors = { perfect: '#ffdd44', good: '#88dd88', ok: '#aaaaaa', miss: '#ff6666' };
  const resultTexts = { perfect: 'PERFECT TUNE!', good: 'Good match', ok: 'Partial tune', miss: 'Off frequency' };

  return (
    <div className="panel tuning-panel">
      <h2>Cosmic Tuning ({tuningScore} score)</h2>
      <p className="text-lore" style={{ fontSize: '0.7em', fontStyle: 'italic', color: '#50b098', margin: '0 0 4px' }}>
        The universe hums at a frequency only the patient can hear.
      </p>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
        {TUNING_TIERS.slice().reverse().map(tier => {
          const reached = tuningScore >= tier.threshold;
          return (
            <span
              key={tier.threshold}
              style={{
                fontSize: '0.7em',
                padding: '2px 6px',
                borderRadius: '3px',
                background: reached ? 'rgba(80,176,152,0.2)' : '#1a1a2a',
                border: `1px solid ${reached ? '#50b098' : '#333'}`,
                color: reached ? '#88ddcc' : '#555',
              }}
            >
              {tier.threshold} — {((tier.bonus - 1) * 100).toFixed(0)}%{reached ? ' ✓' : ''}
            </span>
          );
        })}
      </div>
      {tuningBonus > 1 && (
        <div style={{ fontSize: '0.8em', color: '#50b098', marginBottom: '4px' }}>
          Current bonus: <strong>+{((tuningBonus - 1) * 100).toFixed(0)}% Cosmic Power</strong>
        </div>
      )}
      {nextTier && (
        <div style={{ fontSize: '0.75em', color: '#778899', marginBottom: '6px' }}>
          Next: {nextTier.label} at score {nextTier.threshold} ({nextTier.threshold - tuningScore} more)
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8em', marginBottom: '6px' }}>
        <span>Your frequency: <strong style={{ color: '#aaddff' }}>{frequency}</strong></span>
        <span style={{ color: distance <= 2 ? '#ffdd44' : distance <= 8 ? '#88dd88' : distance <= 20 ? '#aaaaaa' : '#ff6666' }}>
          Distance: <strong>{distance}</strong>
          {distance <= 2 ? ' (perfect zone!)' : distance <= 8 ? ' (close!)' : distance <= 20 ? ' (getting warmer)' : ' (far)'}
        </span>
      </div>
      <div style={{ position: 'relative', height: '20px', background: '#111', border: '1px solid #333', marginBottom: '6px' }}>
        {/* Target zone indicator — wide glow */}
        <div style={{
          position: 'absolute',
          left: `${Math.max(0, target - 10)}%`,
          width: `${Math.min(20, 100 - Math.max(0, target - 10))}%`,
          height: '100%',
          background: 'rgba(255, 221, 68, 0.08)',
          borderRadius: '2px',
        }} />
        {/* Good zone */}
        <div style={{
          position: 'absolute',
          left: `${Math.max(0, target - 4)}%`,
          width: `${Math.min(8, 100 - Math.max(0, target - 4))}%`,
          height: '100%',
          background: 'rgba(136, 221, 136, 0.15)',
        }} />
        {/* Perfect zone */}
        <div style={{
          position: 'absolute',
          left: `${Math.max(0, target - 1)}%`,
          width: `${Math.min(2, 100 - Math.max(0, target - 1))}%`,
          height: '100%',
          background: 'rgba(255, 221, 68, 0.35)',
        }} />
        {/* Target marker */}
        <div style={{
          position: 'absolute',
          left: `${target}%`,
          width: '2px',
          height: '100%',
          background: '#ffdd44',
          transform: 'translateX(-1px)',
          opacity: 0.6,
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
        aria-label={`Frequency tuner — current: ${frequency}, target: ${target}`}
      />
      {result && (
        <div style={{ textAlign: 'center', fontSize: '0.9em', color: resultColors[result], marginBottom: '4px', fontWeight: result === 'perfect' ? 'bold' : 'normal' }}>
          {resultTexts[result]}
        </div>
      )}
      <button className="mine-btn" onClick={handleTune} style={{ background: 'linear-gradient(90deg, #1a2a2a, #203030)' }} aria-label="Tune frequency">
        {lastTune ? (
          <span style={{ color: '#50b098' }}>
            +{formatNumber(lastTune.cp)} power, +{formatNumber(lastTune.uc)} constants
          </span>
        ) : (
          <>Tune Frequency</>
        )}
      </button>
      <p className="mining-hint">Adjust the slider to match the yellow target marker | Target changes every 30s | Perfect (dist &le; 2) = 5x reward | Arrow keys to adjust, Enter to tune</p>
    </div>
  );
});
