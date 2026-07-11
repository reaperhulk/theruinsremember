import { memo, useState } from 'react';
import { COSMIC_BANDS, getTuningProductionMultiplier, getTuningStats, lockCosmicSignal, TUNING_LOCK_INTERVAL, TUNING_LOCK_LIMIT } from '../engine/tuning.js';
import { playClick } from './AudioManager.js';

const BAND_COLORS = {
  power: '#f2b04e',
  constants: '#7fb4ff',
  fragments: '#d88cff',
  stability: '#7fd8c4',
};

const RESOURCE_LABELS = {
  cosmicPower: 'Cosmic Power',
  universalConstants: 'Universal Constants',
  realityFragments: 'Reality Fragments',
};

export const TuningPanel = memo(function TuningPanel({ state, onUpdate }) {
  const [lastLock, setLastLock] = useState(null);
  const stats = getTuningStats(state);

  const handleLock = bandId => {
    playClick();
    const result = lockCosmicSignal(state, bandId);
    if (!result) return;
    onUpdate(() => result.state);
    setLastLock(result.band);
    setTimeout(() => setLastLock(null), 1400);
  };

  return (
    <div className="panel tuning-panel">
      <div className="tuning-header">
        <div>
          <span className="panel-kicker">Cycle signal</span>
          <h2>Cosmic Tuning</h2>
        </div>
        <strong>{stats.lockedCount}/{TUNING_LOCK_LIMIT} locked{stats.cooldown > 0 ? ` | ${Math.ceil(stats.cooldown)}s` : ''}</strong>
      </div>

      <div className="upgrade-progress-bar">
        <div className="upgrade-progress-fill" style={{ width: `${stats.lockedCount / TUNING_LOCK_LIMIT * 100}%` }} />
      </div>

      <div className="reality-laws signal-bands" role="group" aria-label="Cosmic signal bands for this cycle">
        {Object.values(COSMIC_BANDS).map(band => {
          const active = !!stats.locked[band.id];
          const preview = { ...state, lockedSignals: { [band.id]: true } };
          const affected = [...new Set([...Object.keys(band.boost), ...Object.keys(band.drag)])];
          const effectText = affected
            .map(id => `x${getTuningProductionMultiplier(preview, id).toFixed(2)} ${RESOURCE_LABELS[id]}`)
            .join(' | ');
          return (
            <button
              key={band.id}
              className={active ? 'active' : ''}
              style={{ '--law-color': BAND_COLORS[band.id] }}
              disabled={active || stats.remaining === 0 || stats.cooldown > 0}
              onClick={() => handleLock(band.id)}
            >
              <strong>{band.name}</strong>
              <span>{band.description}</span>
              <span>{active ? 'Locked' : effectText}</span>
            </button>
          );
        })}
      </div>

      {lastLock && (
        <div className="operation-result success" role="status">
          {lastLock.name} locked for this cycle.
        </div>
      )}

      <p className="operation-hint">
        Lock three of four bands | {TUNING_LOCK_INTERVAL}s calibration between locks | Locks dissolve at prestige
      </p>
    </div>
  );
});
