import { memo } from 'react';
import { formatNumber } from './format.js';
import { playClick } from './AudioManager.js';
import { allocateSenateInfluence, getSenateInfo, setSenateDirective } from '../engine/senate.js';

export const SenatePanel = memo(function SenatePanel({ state, onUpdate }) {
  const { senate, totalInfluence, maxInfluence, available, allocateCost, majorityFaction, factions } = getSenateInfo(state);
  const senatePct = state.senatePct || { merchants: 34, scholars: 33, warriors: 33 };

  const FACTION_UI = {
    merchants: { label: 'Merchant Guild', color: '#ddaa44', desc: 'Exotic Matter +1.0/s per influence' },
    scholars: { label: 'Scholar Enclave', color: '#88bbee', desc: 'Galactic Influence +0.6/s per influence' },
    warriors: { label: 'Warrior Caste', color: '#ee6644', desc: 'Star Systems +0.4/s per influence' },
  };

  const handleAllocate = (factionId, delta) => {
    playClick();
    onUpdate(s => allocateSenateInfluence(s, factionId, delta));
  };

  return (
    <div className="panel senate-panel">
      <h2>Galactic Senate ({totalInfluence}/{maxInfluence} influence)</h2>
      <p className="text-lore" style={{ fontSize: '0.7em', fontStyle: 'italic', color: '#ddaa44', margin: '0 0 6px' }}>
        Every faction remembers a different version of what came before. All of them are correct.
      </p>
      <div className="dock-info">
        <span>Influence: {available}/{maxInfluence} available</span>
        {majorityFaction && <span style={{ color: FACTION_UI[majorityFaction].color }}>Majority: {FACTION_UI[majorityFaction].label} (x2)</span>}
      </div>
      <div className="factory-lines">
        {factions.map(faction => {
          const count = senate[faction.id] || 0;
          const isMaj = majorityFaction === faction.id;
          const ui = FACTION_UI[faction.id];
          return (
            <div key={faction.id} className="factory-line">
              <span className="line-label" style={{ color: ui.color }}>
                {ui.label}: {count}
              </span>
              <span className="line-bonus" style={{ color: isMaj ? '#ffdd44' : '#888' }}>
                {ui.desc}{isMaj ? ' (x2!)' : ''} {count > 0 && `[+${formatNumber(count * faction.rate * (isMaj ? 2 : 1))}/s]`}
              </span>
              <div className="line-controls">
                <button
                  disabled={count <= 0}
                  onClick={() => handleAllocate(faction.id, -1)}
                  aria-label={`Remove influence from ${ui.label}`}
                >-</button>
                <button
                  disabled={available <= 0 || (state.resources.galacticInfluence?.amount || 0) < allocateCost}
                  onClick={() => handleAllocate(faction.id, 1)}
                  aria-label={`Add influence to ${ui.label} (costs ${allocateCost} GI)`}
                  title={`Costs ${formatNumber(allocateCost)} GI`}
                >+</button>
              </div>
            </div>
          );
        })}
      </div>
      {totalInfluence > 0 && (
        <div style={{ fontSize: '0.75em', color: '#888', marginTop: '4px' }}>
          Next allocation costs {formatNumber(allocateCost)} Galactic Influence. Majority faction gets x2 bonus.
        </div>
      )}
      <p className="mining-hint">
        Allocate influence to factions (cost scales with total) | Majority faction gets x2 | Max slots scale with GI
      </p>

      <div style={{ marginTop: '10px', borderTop: '1px solid #334', paddingTop: '8px' }}>
        <h3 style={{ margin: '0 0 4px', fontSize: '0.9em', color: '#aa88cc' }}>Senate Directive</h3>
        <p style={{ fontSize: '0.7em', color: '#666', margin: '0 0 6px' }}>
          Ongoing production focus — sliders sum to 100%
        </p>
        {[
          { id: 'merchants', label: 'Merchants', desc: '+GI production', color: '#ddaa44' },
          { id: 'scholars', label: 'Scholars', desc: '+Exotic Matter', color: '#88bbee' },
          { id: 'warriors', label: 'Warriors', desc: '+Stellar Forge', color: '#ee6644' },
        ].map(({ id, label, desc, color }) => (
          <div key={id} style={{ marginBottom: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8em', marginBottom: '2px' }}>
              <span style={{ color }}>{label}: {senatePct[id]}%</span>
              <span style={{ color: '#777' }}>{desc} +{(senatePct[id] * 0.1).toFixed(1)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={senatePct[id]}
              onChange={e => {
                playClick();
                onUpdate(s => setSenateDirective(s, id, parseInt(e.target.value)));
              }}
              style={{ width: '100%', accentColor: color, cursor: 'pointer' }}
            />
          </div>
        ))}
      </div>
    </div>
  );
});
