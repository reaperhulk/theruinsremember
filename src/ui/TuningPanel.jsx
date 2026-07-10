import { memo, useCallback, useEffect, useState } from 'react';
import { applyTuning, getNextTuningTier, getTuningMultiplier, getTuningProductionBonus, getTuningQuality, TUNING_TIERS } from '../engine/tuning.js';
import { formatNumber } from './format.js';
import { playClick } from './AudioManager.js';

const MAX_PROBES = 3;

function createTarget() {
  return 12 + Math.floor(Math.random() * 77);
}

export const TuningPanel = memo(function TuningPanel({ state, onUpdate }) {
  const [frequency, setFrequency] = useState(50);
  const [target, setTarget] = useState(createTarget);
  const [probesLeft, setProbesLeft] = useState(MAX_PROBES);
  const [reading, setReading] = useState(null);
  const [bestQuality, setBestQuality] = useState(null);
  const [lastTune, setLastTune] = useState(null);
  const tuningScore = state.tuningScore || 0;
  const tuningBonus = getTuningProductionBonus(tuningScore);
  const nextTier = getNextTuningTier(tuningScore);

  const resetSignal = useCallback(() => {
    setTarget(createTarget());
    setProbesLeft(MAX_PROBES);
    setReading(null);
    setBestQuality(null);
  }, []);

  const handleProbe = useCallback(() => {
    if (probesLeft <= 0) return;
    playClick();
    const distance = Math.abs(frequency - target);
    const quality = getTuningQuality(distance);
    const direction = frequency < target ? 'higher' : frequency > target ? 'lower' : 'locked';
    const previousDistance = reading?.distance;
    const trend = previousDistance === undefined ? null : distance < previousDistance ? 'warmer' : distance > previousDistance ? 'colder' : 'steady';
    const nextBest = !bestQuality || getTuningMultiplier(quality) > getTuningMultiplier(bestQuality) ? quality : bestQuality;

    setBestQuality(nextBest);
    setReading({ distance, direction, quality, trend });
    setProbesLeft(count => count - 1);

    // The signal drifts after every probe, so another attempt can improve or
    // lose position. Its direction is deterministic within the three-probe run.
    const drift = probesLeft % 2 === 1 ? 3 : -2;
    setTarget(current => Math.max(5, Math.min(95, current + drift)));
  }, [bestQuality, frequency, probesLeft, reading, target]);

  const handleLock = useCallback(() => {
    if (!bestQuality || bestQuality === 'miss') {
      resetSignal();
      return;
    }
    onUpdate(current => {
      const result = applyTuning(current, bestQuality);
      if (!result) return current;
      setLastTune({ cp: result.cpGain, uc: result.ucGain, quality: bestQuality });
      setTimeout(() => setLastTune(null), 1200);
      return result.state;
    });
    resetSignal();
  }, [bestQuality, onUpdate, resetSignal]);

  useEffect(() => {
    const handler = event => {
      if (event.key === 'ArrowLeft') { event.preventDefault(); setFrequency(value => Math.max(0, value - 2)); }
      if (event.key === 'ArrowRight') { event.preventDefault(); setFrequency(value => Math.min(100, value + 2)); }
      if (event.key === 'Enter') { event.preventDefault(); handleProbe(); }
      if (event.key === 'l' || event.key === 'L') { event.preventDefault(); handleLock(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleLock, handleProbe]);

  const qualityColors = { perfect: '#e6c766', good: '#73c49b', ok: '#aeb8c5', miss: '#d77878' };
  const canLock = bestQuality && bestQuality !== 'miss';

  return (
    <div className="panel tuning-panel">
      <div className="tuning-header">
        <div>
          <span className="panel-kicker">Unstable signal</span>
          <h2>Cosmic Tuning</h2>
        </div>
        <strong>{probesLeft}/{MAX_PROBES} probes</strong>
      </div>

      <div className="tuning-tiers">
        {TUNING_TIERS.slice().reverse().map(tier => (
          <span key={tier.threshold} className={tuningScore >= tier.threshold ? 'reached' : ''}>
            {tier.threshold}: +{((tier.bonus - 1) * 100).toFixed(0)}%
          </span>
        ))}
      </div>

      <div className="tuning-status">
        <span>Score <strong>{tuningScore}</strong></span>
        <span>Output <strong>+{((tuningBonus - 1) * 100).toFixed(0)}%</strong></span>
        {nextTier && <span>Next tier <strong>{nextTier.threshold - tuningScore} away</strong></span>}
      </div>

      <div className="signal-readout" aria-live="polite">
        {reading ? (
          <>
            <strong style={{ color: qualityColors[reading.quality] }}>{reading.quality.toUpperCase()} SIGNAL</strong>
            <span>{reading.direction === 'locked' ? 'Frequency aligned' : `Signal lies ${reading.direction}`}</span>
            <span>{reading.trend ? `${reading.trend} than the previous probe` : 'The signal will drift after this reading'}</span>
          </>
        ) : (
          <>
            <strong>NO READING</strong>
            <span>Choose a frequency and spend a probe.</span>
            <span>You may bank the best reading before the signal moves again.</span>
          </>
        )}
      </div>

      <label className="tuning-control">
        <span>Probe frequency <strong>{frequency}</strong></span>
        <input type="range" min="0" max="100" value={frequency} onChange={event => setFrequency(Number(event.target.value))} />
      </label>

      <div className="tuning-actions">
        <button className="mine-btn" onClick={handleProbe} disabled={probesLeft <= 0}>
          {probesLeft > 0 ? 'Probe Signal' : 'No probes left'}
        </button>
        <button className="mine-btn" onClick={handleLock} disabled={!canLock && probesLeft > 0}>
          {canLock ? `Lock ${bestQuality} signal` : probesLeft > 0 ? 'No signal to lock' : 'Abandon signal'}
        </button>
      </div>

      {lastTune && (
        <div className="tuning-reward" role="status">
          {lastTune.quality} lock: +{formatNumber(lastTune.cp)} power, +{formatNumber(lastTune.uc)} constants
        </div>
      )}
    </div>
  );
});
