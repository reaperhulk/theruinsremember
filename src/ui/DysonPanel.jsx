import { useState, memo } from 'react';
import { formatNumber } from './format.js';
import { playClick } from './AudioManager.js';

export const DysonPanel = memo(function DysonPanel({ state, onUpdate }) {
  const [lastGain, setLastGain] = useState(null);
  const totalSegments = state.dysonSegments || 0;

  const handleAssemble = () => {
    playClick();
    onUpdate(s => {
      const sf = s.resources.stellarForge;
      const mg = s.resources.megastructures;
      if (!sf?.unlocked || !mg?.unlocked) return null;
      const sfRate = (sf.baseRate + sf.rateAdd) * sf.rateMult * (s.prestigeMultiplier || 1);
      const mgRate = (mg.baseRate + mg.rateAdd) * mg.rateMult * (s.prestigeMultiplier || 1);
      const milestoneBonus = 1 + (s.dysonSegments || 0) / 100; // +1% per segment
      const sfGain = Math.max(1, sfRate * 5 * milestoneBonus);
      const mgGain = Math.max(1, mgRate * 2 * milestoneBonus);
      setLastGain({ sf: sfGain, mg: mgGain });
      setTimeout(() => setLastGain(null), 800);
      return {
        ...s,
        dysonSegments: (s.dysonSegments || 0) + 1,
        resources: {
          ...s.resources,
          stellarForge: { ...sf, amount: sf.amount + sfGain },
          megastructures: { ...mg, amount: mg.amount + mgGain },
        },
      };
    });
  };

  const completion = Math.min(100, Math.floor(totalSegments / 10) * 10);
  const milestone = Math.floor(totalSegments / 10);
  const nextMilestone = (milestone + 1) * 10;

  return (
    <div className="panel dyson-panel">
      <h2>Dyson Assembly ({totalSegments} segments)</h2>
      <p className="text-lore" style={{ fontSize: '0.7em', fontStyle: 'italic', color: '#cc8844', margin: '0 0 4px' }}>
        The sphere remembers its shape. You just have to remind it.
      </p>
      <div className="upgrade-progress-bar" style={{ margin: '4px 0 8px' }}>
        <div className="upgrade-progress-fill" style={{ width: `${completion}%`, background: 'linear-gradient(90deg, #d08030, #e8a040)' }} />
      </div>
      <div style={{ fontSize: '0.8em', color: '#888', marginBottom: '4px' }}>
        Completion: {completion}% | Next milestone: {nextMilestone} segments
      </div>
      <button className="mine-btn" onClick={handleAssemble} style={{ background: 'linear-gradient(90deg, #3a2a1a, #4a3020)' }}>
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
          Milestones reached: {milestone} | Bonus: +{milestone * 10}% assembly value
        </div>
      )}
    </div>
  );
});
