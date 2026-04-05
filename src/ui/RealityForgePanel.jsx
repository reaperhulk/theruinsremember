import { useState, memo } from 'react';
import { formatNumber } from './format.js';
import { playClick, playUpgrade } from './AudioManager.js';

const RECIPES = [
  { id: 'temporal', label: 'Temporal Key', fragments: 50, echoes: 20, color: '#ff8866',
    desc: '+1% all production, +25% Quantum Echoes',
    lore: 'Frozen moments compressed into a key. Time bends around whoever holds it.',
    milestone: 'Earn by reaching Cosmic Tuning score 50' },
  { id: 'spatial', label: 'Spatial Key', fragments: 30, echoes: 40, color: '#66aaff',
    desc: '+1% all production, +25% Quantum Echoes',
    lore: 'Space itself yields a path. The forge routes echoes through folded geometry.',
    milestone: 'Earn by landing 50 perfect docks' },
  { id: 'causal', label: 'Causal Key', fragments: 40, echoes: 30, color: '#88dd88',
    desc: '+1% all production, +25% Quantum Echoes',
    lore: 'Effect becomes cause. The causal loop feeds more echoes into the present.',
    milestone: 'Earn by completing 50 weaves' },
  { id: 'quantum', label: 'Quantum Key', fragments: 20, echoes: 50, color: '#dd88ff',
    desc: '+1% all production',
    lore: 'Superposition of states collapsed into permanence. The forge approves.' },
];

export const RealityForgePanel = memo(function RealityForgePanel({ state, onUpdate }) {
  const [lastForged, setLastForged] = useState(null);
  const keys = state.realityKeys || {};
  const totalKeys = Object.values(keys).reduce((s, v) => s + v, 0);
  const bonus = totalKeys * 1;
  const echoesSlots = ((keys.temporal || 0) > 0 ? 1 : 0) + ((keys.spatial || 0) > 0 ? 1 : 0) + ((keys.causal || 0) > 0 ? 1 : 0);

  const handleForge = (recipe) => {
    playClick();
    onUpdate(s => {
      const rf = s.resources.realityFragments;
      const qe = s.resources.quantumEchoes;
      if (!rf?.unlocked || !qe?.unlocked) return null;
      if (rf.amount < recipe.fragments || qe.amount < recipe.echoes) return null;

      playUpgrade();
      setLastForged(recipe.label);
      setTimeout(() => setLastForged(null), 1200);

      const newKeys = { ...(s.realityKeys || {}) };
      newKeys[recipe.id] = (newKeys[recipe.id] || 0) + 1;

      return {
        ...s,
        realityKeys: newKeys,
        resources: {
          ...s.resources,
          realityFragments: { ...rf, amount: rf.amount - recipe.fragments },
          quantumEchoes: { ...qe, amount: qe.amount - recipe.echoes },
        },
      };
    });
  };

  const canAffordRecipe = (recipe) => {
    const rf = state.resources.realityFragments;
    const qe = state.resources.quantumEchoes;
    return rf?.amount >= recipe.fragments && qe?.amount >= recipe.echoes;
  };

  return (
    <div className="panel reality-forge-panel">
      <h2>Reality Forge ({totalKeys} keys, +{bonus}% all{echoesSlots > 0 ? `, +${echoesSlots * 25}% echoes` : ''})</h2>
      <p className="text-lore" style={{ fontSize: '0.7em', fontStyle: 'italic', color: '#dd88ff', margin: '0 0 4px' }}>
        The forge was here before you arrived. It remembers every key ever made — including the ones you are about to make.
      </p>
      {echoesSlots > 0 && (
        <div style={{ fontSize: '0.75em', color: '#88ddcc', marginBottom: '4px' }}>
          Key slots active: {echoesSlots}/3 — Quantum Echoes +{echoesSlots * 25}% production
        </div>
      )}
      {lastForged && (
        <div className="hack-result success" style={{ marginBottom: '4px' }}>
          Forged {lastForged}!
        </div>
      )}
      <div style={{ fontSize: '0.8em', color: '#888', marginBottom: '6px' }}>
        Each key grants +1% all production. Temporal/Spatial/Causal keys also unlock +25% Quantum Echoes each.
      </div>
      <div className="factory-lines">
        {RECIPES.map(recipe => {
          const count = keys[recipe.id] || 0;
          const affordable = canAffordRecipe(recipe);
          const hasKey = count > 0;
          return (
            <div key={recipe.id} className="factory-line" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '2px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="line-label" style={{ color: recipe.color, flex: 1 }}>
                  {recipe.label}: {count} {hasKey && recipe.lore && recipe.id !== 'quantum' && <span style={{ color: '#88ddcc', fontSize: '0.85em' }}>✓</span>}
                </span>
                <span className="line-bonus" style={{ fontSize: '0.7em', color: '#888' }}>
                  {formatNumber(recipe.fragments)} frags + {formatNumber(recipe.echoes)} echoes
                </span>
                <button
                  className={`mine-btn ${affordable ? '' : 'too-expensive'}`}
                  disabled={!affordable}
                  onClick={() => handleForge(recipe)}
                  style={{ fontSize: '0.75em', padding: '3px 8px' }}
                  aria-label={`Forge ${recipe.label}`}
                >
                  Forge
                </button>
              </div>
              <div style={{ fontSize: '0.68em', color: '#776688', fontStyle: 'italic', paddingLeft: '2px' }}>
                {recipe.lore}
              </div>
              {recipe.milestone && !hasKey && (
                <div style={{ fontSize: '0.68em', color: '#556677', paddingLeft: '2px' }}>
                  💡 {recipe.milestone}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {totalKeys > 0 && (
        <div style={{ display: 'flex', gap: '6px', marginTop: '6px', fontSize: '0.75em', flexWrap: 'wrap' }}>
          {RECIPES.filter(r => (keys[r.id] || 0) > 0).map(r => (
            <span key={r.id} style={{ color: r.color, border: `1px solid ${r.color}44`, padding: '1px 6px', borderRadius: '3px' }}>
              {r.label} x{keys[r.id]}
            </span>
          ))}
        </div>
      )}
      <p className="mining-hint">
        Forge reality keys from fragments + echoes | Each key = permanent +1% all production | Keys survive prestige
      </p>
    </div>
  );
});
