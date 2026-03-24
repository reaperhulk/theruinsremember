import { useState, memo } from 'react';
import { formatNumber } from './format.js';
import { playClick } from './AudioManager.js';
import { assembleDysonSegment, getDysonStats } from '../engine/dyson.js';

export const DysonPanel = memo(function DysonPanel({ state, onUpdate }) {
  const [lastGain, setLastGain] = useState(null);
  const { segments: totalSegments, completion, milestone, nextMilestone, autoRate, bonusMult } = getDysonStats(state);

  const handleAssemble = () => {
    playClick();
    onUpdate(s => {
      const result = assembleDysonSegment(s);
      if (!result) return null;
      setLastGain({ sf: result.sfGain, mg: result.mgGain });
      setTimeout(() => setLastGain(null), 800);
      return result.state;
    });
  };

  return (
    <div className="panel dyson-panel">
      <h2>Dyson Assembly ({totalSegments} segments)</h2>
      <p className="text-lore" style={{ fontSize: '0.7em', fontStyle: 'italic', color: '#cc8844', margin: '0 0 4px' }}>
        The sphere remembers its shape. You just have to remind it.
      </p>
      <div className="upgrade-progress-bar" style={{ margin: '4px 0 8px' }}>
        <div className="upgrade-progress-fill" style={{ width: `${Math.min(100, (totalSegments % 10) * 10)}%`, background: 'linear-gradient(90deg, #d08030, #e8a040)' }} />
      </div>
      <div style={{ fontSize: '0.8em', color: '#888', marginBottom: '4px' }}>
        Next milestone: {nextMilestone} segments | Bonus: x{bonusMult.toFixed(1)} assembly value
      </div>
      <button className="mine-btn" onClick={handleAssemble} style={{ background: 'linear-gradient(90deg, #3a2a1a, #4a3020)' }} aria-label={`Assemble Dyson segment (${totalSegments} segments built)`}>
        {lastGain ? (
          <span style={{ color: '#e8a040' }}>
            +{formatNumber(lastGain.sf)} forge, +{formatNumber(lastGain.mg)} mega
          </span>
        ) : (
          <>Assemble Segment</>
        )}
      </button>
      <p className="mining-hint">Click to assemble | Rewards scale with production rate | Every 10 segments = milestone</p>
      {milestone > 0 && (
        <div style={{ fontSize: '0.75em', color: '#d08030', marginTop: '4px' }}>
          Milestones reached: {milestone} | Assembly bonus: x{bonusMult.toFixed(1)}
        </div>
      )}
      {totalSegments > 0 && (
        <div style={{ fontSize: '0.75em', color: '#888', marginTop: '4px' }}>
          Auto-assembly: {autoRate} segments/min{autoRate >= 20 ? ' (max)' : ''}
        </div>
      )}
    </div>
  );
});
