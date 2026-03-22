import { useState, memo } from 'react';
import { formatNumber } from './format.js';
import { playClick, playUpgrade } from './AudioManager.js';

const RECIPES = [
  { id: 'temporal', label: 'Temporal Key', fragments: 50, echoes: 20, color: '#ff8866', desc: '+1% all production' },
  { id: 'spatial', label: 'Spatial Key', fragments: 30, echoes: 40, color: '#66aaff', desc: '+1% all production' },
  { id: 'causal', label: 'Causal Key', fragments: 40, echoes: 30, color: '#88dd88', desc: '+1% all production' },
  { id: 'quantum', label: 'Quantum Key', fragments: 20, echoes: 50, color: '#dd88ff', desc: '+1% all production' },
];

export const RealityForgePanel = memo(function RealityForgePanel({ state, onUpdate }) {
  const [lastForged, setLastForged] = useState(null);
  const keys = state.realityKeys || {};
  const totalKeys = Object.values(keys).reduce((s, v) => s + v, 0);
  const bonus = totalKeys * 1;

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
      <h2>Reality Forge ({totalKeys} keys, +{bonus}% all)</h2>
      <p className="text-lore" style={{ fontSize: '0.7em', fontStyle: 'italic', color: '#dd88ff', margin: '0 0 6px' }}>
        The forge was here before you arrived. It remembers every key ever made — including the ones you are about to make.
      </p>
      {lastForged && (
        <div className="hack-result success" style={{ marginBottom: '4px' }}>
          Forged {lastForged}! +1% all production permanently!
        </div>
      )}
      <div style={{ fontSize: '0.8em', color: '#888', marginBottom: '6px' }}>
        Each key grants a permanent +1% to all production. Keys persist through prestige.
      </div>
      <div className="factory-lines">
        {RECIPES.map(recipe => {
          const count = keys[recipe.id] || 0;
          const affordable = canAffordRecipe(recipe);
          return (
            <div key={recipe.id} className="factory-line" style={{ alignItems: 'center' }}>
              <span className="line-label" style={{ color: recipe.color }}>
                {recipe.label}: {count}
              </span>
              <span className="line-bonus" style={{ fontSize: '0.75em' }}>
                {formatNumber(recipe.fragments)} fragments + {formatNumber(recipe.echoes)} echoes
              </span>
              <button
                className={`mine-btn ${affordable ? '' : 'too-expensive'}`}
                disabled={!affordable}
                onClick={() => handleForge(recipe)}
                style={{ fontSize: '0.75em', padding: '3px 8px', marginLeft: '4px' }}
                aria-label={`Forge ${recipe.label} for ${recipe.fragments} fragments and ${recipe.echoes} echoes`}
              >
                Forge
              </button>
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
