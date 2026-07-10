import { memo, useState } from 'react';
import { getWeaveCost, getWeaveProductionMultiplier, getWeavingStats, REALITY_LAWS, weaveRealityLaw } from '../engine/weaving.js';
import { playClick } from './AudioManager.js';

const TYPE_COLORS = {
  temporal: '#ff8866',
  spatial: '#66aaff',
  causal: '#88dd88',
  quantum: '#dd88ff',
};

export const WeavingPanel = memo(function WeavingPanel({ state, onUpdate }) {
  const [lastLaw, setLastLaw] = useState(null);
  const stats = getWeavingStats(state);
  const cost = getWeaveCost(state);

  const handleWeave = lawId => {
    playClick();
    const result = weaveRealityLaw(state, lawId);
    if (!result) return;
    onUpdate(() => result.state);
    setLastLaw(result.law);
    setTimeout(() => setLastLaw(null), 1400);
  };

  return (
    <div className="panel weaving-panel">
      <div className="weaving-heading">
        <div>
          <span className="panel-kicker">Cycle physics</span>
          <h2>Reality Laws</h2>
        </div>
        <strong>{stats.wovenCount}/3 established{stats.cooldown > 0 ? ` | ${Math.ceil(stats.cooldown)}s` : ''}</strong>
      </div>

      <div className="upgrade-progress-bar">
        <div className="upgrade-progress-fill" style={{ width: `${stats.wovenCount / 3 * 100}%` }} />
      </div>

      <div className="reality-laws" role="group" aria-label="Reality laws for this cycle">
        {Object.values(REALITY_LAWS).map(law => {
          const active = !!stats.laws[law.id];
          const multiplier = getWeaveProductionMultiplier({ ...state, wovenLaws: { ...stats.laws, [law.id]: true } }, law.resourceId);
          return (
            <button
              key={law.id}
              className={active ? 'active' : ''}
              style={{ '--law-color': TYPE_COLORS[law.id] }}
              disabled={active || stats.remaining === 0 || stats.cooldown > 0 || state.resources.realityFragments.amount < cost}
              onClick={() => handleWeave(law.id)}
            >
              <strong>{law.name}</strong>
              <span>{law.description}</span>
              <span>{active ? 'Established' : `x${multiplier.toFixed(2)} ${law.resourceName}`}</span>
            </button>
          );
        })}
      </div>

      {lastLaw && (
        <div className="operation-result success" role="status">
          {lastLaw.name} established for this cycle.
        </div>
      )}

      <p className="operation-hint">
        Choose three of four laws | Next law costs {cost} Reality Fragments | Laws dissolve at prestige
      </p>
    </div>
  );
});
