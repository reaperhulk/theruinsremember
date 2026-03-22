import { memo } from 'react';
import { formatNumber } from './format.js';
import { playClick } from './AudioManager.js';

const FACTIONS = [
  { id: 'merchants', label: 'Merchant Guild', color: '#ddaa44', desc: 'Exotic Matter +0.5/s per influence', resource: 'exoticMatter' },
  { id: 'scholars', label: 'Scholar Enclave', color: '#88bbee', desc: 'Galactic Influence +0.3/s per influence', resource: 'galacticInfluence' },
  { id: 'warriors', label: 'Warrior Caste', color: '#ee6644', desc: 'Star Systems +0.2/s per influence', resource: 'starSystems' },
];

export const SenatePanel = memo(function SenatePanel({ state, onUpdate }) {
  const senate = state.senate || { merchants: 0, scholars: 0, warriors: 0 };
  const totalInfluence = senate.merchants + senate.scholars + senate.warriors;
  const maxInfluence = Math.max(3, Math.floor((state.resources.galacticInfluence?.amount || 0) / 50) + 3);
  const available = maxInfluence - totalInfluence;

  // Find majority faction
  const maxCount = Math.max(senate.merchants, senate.scholars, senate.warriors);
  const majority = FACTIONS.find(f => senate[f.id] === maxCount && maxCount > 0);
  const hasMajority = majority && FACTIONS.filter(f => senate[f.id] === maxCount).length === 1;

  // Cost scales with total allocations: first 10 cost 5, next 10 ~8, next 10 ~11, etc.
  const getAllocateCost = (total) => Math.ceil(5 * Math.pow(1.5, total / 10));
  const allocateCost = getAllocateCost(totalInfluence);

  const handleAllocate = (factionId, delta) => {
    playClick();
    onUpdate(s => {
      const sen = s.senate || { merchants: 0, scholars: 0, warriors: 0 };
      const current = sen[factionId] || 0;
      const newVal = Math.max(0, current + delta);
      const newSenate = { ...sen, [factionId]: newVal };
      const newTotal = newSenate.merchants + newSenate.scholars + newSenate.warriors;
      const max = Math.max(3, Math.floor((s.resources.galacticInfluence?.amount || 0) / 50) + 3);
      if (newTotal > max) return null;

      // Spend galacticInfluence on each allocation (adding costs, removing is free)
      const resources = { ...s.resources };
      if (delta > 0) {
        const currentTotal = (sen.merchants || 0) + (sen.scholars || 0) + (sen.warriors || 0);
        const cost = Math.ceil(5 * Math.pow(1.5, currentTotal / 10));
        const gi = resources.galacticInfluence;
        if (!gi || gi.amount < cost) return null;
        resources.galacticInfluence = { ...gi, amount: gi.amount - cost };
      }

      // Apply resource bonuses based on allocation
      for (const f of FACTIONS) {
        const count = newSenate[f.id] || 0;
        if (count > 0 && resources[f.resource]?.unlocked) {
          const r = resources[f.resource];
          const isMaj = FACTIONS.filter(ff => (newSenate[ff.id] || 0) === Math.max(newSenate.merchants, newSenate.scholars, newSenate.warriors)).length === 1
            && (newSenate[f.id] || 0) === Math.max(newSenate.merchants, newSenate.scholars, newSenate.warriors);
          const mult = isMaj ? 2 : 1;
          const gain = count * (f.id === 'merchants' ? 0.5 : f.id === 'scholars' ? 0.3 : 0.2) * mult;
          resources[f.resource] = { ...r, amount: r.amount + gain };
        }
      }

      return { ...s, senate: newSenate, resources };
    });
  };

  return (
    <div className="panel senate-panel">
      <h2>Galactic Senate ({totalInfluence}/{maxInfluence} influence)</h2>
      <p className="text-lore" style={{ fontSize: '0.7em', fontStyle: 'italic', color: '#ddaa44', margin: '0 0 6px' }}>
        Every faction remembers a different version of what came before. All of them are correct.
      </p>
      <div className="dock-info">
        <span>Influence: {available}/{maxInfluence} available</span>
        {hasMajority && <span style={{ color: majority.color }}>Majority: {majority.label} (x2)</span>}
      </div>
      <div className="factory-lines">
        {FACTIONS.map(faction => {
          const count = senate[faction.id] || 0;
          const isMaj = hasMajority && majority.id === faction.id;
          return (
            <div key={faction.id} className="factory-line">
              <span className="line-label" style={{ color: faction.color }}>
                {faction.label}: {count}
              </span>
              <span className="line-bonus" style={{ color: isMaj ? '#ffdd44' : '#888' }}>
                {faction.desc}{isMaj ? ' (x2!)' : ''} {count > 0 && `[+${formatNumber(count * (faction.id === 'merchants' ? 0.5 : faction.id === 'scholars' ? 0.3 : 0.2) * (isMaj ? 2 : 1))}/s]`}
              </span>
              <div className="line-controls">
                <button
                  disabled={count <= 0}
                  onClick={() => handleAllocate(faction.id, -1)}
                  aria-label={`Remove influence from ${faction.label}`}
                >-</button>
                <button
                  disabled={available <= 0 || (state.resources.galacticInfluence?.amount || 0) < allocateCost}
                  onClick={() => handleAllocate(faction.id, 1)}
                  aria-label={`Add influence to ${faction.label} (costs ${allocateCost} GI)`}
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
    </div>
  );
});
