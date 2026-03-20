import { getAvailableTech, unlockTech } from '../engine/tech.js';
import { canAfford } from '../engine/resources.js';
import { techTree } from '../data/tech-tree.js';
import { resources as resourceDefs } from '../data/resources.js';

function resourceName(id) {
  return resourceDefs[id]?.name || id;
}

function CostDisplay({ cost, state }) {
  return (
    <span>
      {Object.entries(cost).map(([id, amount], i) => {
        const have = state.resources[id]?.amount || 0;
        const enough = have >= amount;
        return (
          <span key={id}>
            {i > 0 && ', '}
            <span style={{ color: enough ? '#88cc88' : '#ff8888' }}>
              {resourceName(id)}: {amount}
            </span>
          </span>
        );
      })}
    </span>
  );
}

// Get afford progress for tech (same pattern as upgrades)
function getAffordProgress(state, cost) {
  let totalNeeded = 0;
  let totalHave = 0;
  for (const [resourceId, amount] of Object.entries(cost)) {
    const r = state.resources[resourceId];
    const have = r ? Math.min(r.amount, amount) : 0;
    totalHave += have;
    totalNeeded += amount;
  }
  return totalNeeded > 0 ? totalHave / totalNeeded : 0;
}

export function TechTree({ state, onUpdate }) {
  const available = getAvailableTech(state);
  const unlocked = Object.keys(state.tech || {});

  // Show unlocked techs count
  const unlockedCount = unlocked.length;

  if (available.length === 0) {
    return (
      <div className="panel tech-panel">
        <h2>Technology ({available.length} available{unlockedCount > 0 ? `, ${unlockedCount} done` : ''})</h2>
        <p className="empty-message">No research available</p>
      </div>
    );
  }

  return (
    <div className="panel tech-panel">
      <h2>Technology ({available.length} available{unlockedCount > 0 ? `, ${unlockedCount} done` : ''})</h2>
      <div className="tech-list">
        {available.map(tech => {
          const affordable = canAfford(state, tech.cost);
          const progress = affordable ? 1 : getAffordProgress(state, tech.cost);
          // Show prerequisite chain info
          const prereqNames = tech.prerequisites
            .map(p => techTree[p]?.name || p)
            .filter(Boolean);
          return (
            <button
              key={tech.id}
              className={`tech-btn ${affordable ? 'affordable' : 'too-expensive'}`}
              disabled={!affordable}
              onClick={() => onUpdate(s => unlockTech(s, tech.id))}
              title={tech.description}
            >
              <div className="tech-name">
                {tech.name}
                {tech.grantsEra && <span className="era-gate"> ★ Era {tech.grantsEra}</span>}
              </div>
              <div className="tech-cost"><CostDisplay cost={tech.cost} state={state} /></div>
              <div className="tech-desc">{tech.description}</div>
              {prereqNames.length > 0 && (
                <div className="tech-prereqs">Requires: {prereqNames.join(', ')}</div>
              )}
              {tech.excludes && (
                <div className="tech-prereqs" style={{ color: '#ff8866' }}>
                  Choose one: excludes {techTree[tech.excludes]?.name || tech.excludes}
                </div>
              )}
              {!affordable && (
                <div className="upgrade-progress-bar">
                  <div className="upgrade-progress-fill" style={{ width: `${Math.floor(progress * 100)}%` }} />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
