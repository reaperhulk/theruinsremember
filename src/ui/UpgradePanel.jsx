import { memo, useState } from 'react';
import { projects, componentProject } from '../data/projects.js';
import { resources } from '../data/resources.js';
import { getProjectCost, getProjectStatus, isProjectComplete, previewProject, purchaseProject } from '../engine/projects.js';
import { calculateEconomy, estimateAffordability } from '../engine/economy.js';
import { canAfford } from '../engine/resources.js';
import { prioritizePurchase } from '../engine/guidance.js';
import { getAvailableUpgrades, getRepeatableMilestone, buyNextRepeatableMilestone } from '../engine/upgrades.js';
import { Council } from './Council.jsx';
import { formatNumber, formatTime } from './format.js';

export const UpgradePanel = memo(function UpgradePanel({ state, onUpdate, economy: suppliedEconomy }) {
  const [showCatalog, setShowCatalog] = useState(false);
  const economy = suppliedEconomy || calculateEconomy(state);
  const chapter = Object.values(projects).filter(p => p.era === state.era);
  const earlier = Object.values(projects).filter(p => p.era < state.era && !isProjectComplete(state, p.id));
  const unfinished = [...chapter, ...earlier].filter(p => !isProjectComplete(state, p.id));
  const visible = showCatalog ? [...chapter, ...earlier] : unfinished.slice(0, 3);
  const completed = chapter.filter(p => isProjectComplete(state, p.id)).length;
  const last = projects[state.lastProject?.id];
  const expansions = getAvailableUpgrades(state).filter(u => u.repeatable && u.era === state.era);
  return <section className="panel upgrade-panel projects-panel" aria-label="Construction projects">
    <div className="projects-heading"><h2>Build something that matters</h2><span>{completed}/6 projects complete</span></div>
    <p>Each project adds a substantial capability. Prioritize one to reserve its funds, or let the settlement follow your spending policy.</p>
    <button className="buildout-toggle" aria-pressed={state.autoBuildOut !== false} onClick={() => onUpdate(s => ({ ...s, autoBuildOut: s.autoBuildOut === false }))}>Automatic development {state.autoBuildOut === false ? 'OFF' : 'ON'}</button>
    {last && <p className="project-completion" role="status">Completed: <strong>{last.name}</strong></p>}
    <div className="catalog-mode" role="group" aria-label="Project display mode"><button className={!showCatalog ? 'active' : ''} onClick={() => setShowCatalog(false)}>Current projects</button><button className={showCatalog ? 'active' : ''} onClick={() => setShowCatalog(true)}>All six projects</button></div>
    <div className="project-list">{visible.map(project => {
      const status = getProjectStatus(state, project.id), done = status === 'complete';
      const cost = getProjectCost(state, project.id), affordable = status === 'ready' && canAfford(state, cost);
      const queued = state.goals.some(g => g.kind === 'project' && g.id === project.id);
      const preview = !done && previewProject(state, project.id);
      const gains = preview && Object.keys(resources).map(id => ({ id, before: economy.gross[id] || 0, after: preview.gross[id] || 0 })).filter(r => r.after > r.before + 0.001).sort((a, b) => (b.after / Math.max(0.1, b.before)) - (a.after / Math.max(0.1, a.before))).slice(0, 3);
      const unlocks = [...new Set(project.effects.filter(e => e.type === 'unlock_resource' && !state.resources[e.target]?.unlocked).map(e => e.target))];
      const prerequisites = [...new Set(project.prerequisites.filter(id => !state.upgrades[id]).map(id => projects[componentProject[id]]?.name || id))];
      const estimate = !done && estimateAffordability(state, cost);
      return <article key={project.id} className={`construction-project${queued ? ' prioritized' : ''}${done ? ' completed' : ''}`} data-project-id={project.id}>
        <div className="projects-heading"><h3>{project.name}</h3><span>{project.era < state.era ? `Era ${project.era}` : done ? 'Complete' : queued ? 'Priority construction' : `Project ${project.stage + 1}`}</span></div>
        <p>{project.description}</p>
        {!done && <><p className="text-hint">Production at full supply</p><dl className="project-gains">{gains.map(gain => <div key={gain.id}><dt>{resources[gain.id].name}</dt><dd>{formatNumber(gain.before)}/s → <strong>{formatNumber(gain.after)}/s</strong></dd></div>)}</dl>
          {unlocks.length > 0 && <p className="project-unlocks">Unlocks {unlocks.map(id => resources[id].name).join(', ')}</p>}
          <div className="project-costs">{Object.entries(cost).map(([id, amount]) => <span key={id} className={state.resources[id]?.amount >= amount ? 'funded' : ''}>{formatNumber(Math.min(state.resources[id]?.amount || 0, amount))}/{formatNumber(amount)} {resources[id].name}</span>)}</div>
          <p className="text-hint">{prerequisites.length ? `Requires ${prerequisites.join(', ')}.` : affordable ? 'Funded — ready to build.' : Number.isFinite(estimate.seconds) ? `About ${formatTime(Math.ceil(estimate.seconds))} at current net production.` : 'Needs more production or storage; see the supply guidance below.'}</p>
          <div className="project-actions"><button className={`upgrade-btn${affordable ? ' affordable' : ''}`} disabled={!affordable} onClick={() => onUpdate(s => purchaseProject(s, project.id))}>Build {project.name}</button><button className="queue-goal-btn" disabled={queued || state.goals.length >= 5} onClick={() => onUpdate(s => prioritizePurchase(s, { kind: 'project', id: project.id }))}>{queued ? 'Prioritized' : 'Prioritize project'}</button></div>
        </>}
      </article>;
    })}</div>
    {!unfinished.length && <p className="project-completion">This age’s construction is complete. Your choices still shape what comes next.</p>}
    {expansions.length > 0 && <details className="project-expansions"><summary>Expand this age’s infrastructure</summary><p>Fund the next infrastructure milestone for a lasting production multiplier.</p>{expansions.map(expansion => {
      const milestone = getRepeatableMilestone(state, expansion.id);
      const possible = buyNextRepeatableMilestone(state, expansion.id);
      return <button key={expansion.id} className={`upgrade-btn${possible && possible !== state ? ' affordable' : ''}`} disabled={!possible || possible === state} onClick={() => onUpdate(s => buyNextRepeatableMilestone(s, expansion.id))}>{expansion.name} · toward level {milestone.nextAt} · ×{(milestone.multiplier * 1.5).toFixed(2)} output milestone</button>;
    })}</details>}
    <h2 className="project-doctrine-heading">Choose your civilization’s doctrine</h2>
    <Council state={state} onUpdate={onUpdate} economy={economy} />
  </section>;
});
