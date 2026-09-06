import { getEraObjective } from '../engine/objectives.js';
import { eraNames, approveEraAdvance, needsEraReview } from '../engine/eras.js';

export function EraProgress({ state, objective = getEraObjective(state), onNavigate, onUpdate }) {
  const { chapter, readiness, cycle } = objective;
  return <section className="panel era-panel objective-panel" aria-label="Current objective" style={{ '--chapter-color': chapter.color }}>
    <div className="objective-heading"><span className="panel-kicker">{state.prestigeCount ? `Civilization ${state.prestigeCount + 1}` : 'Your first civilization'} · {eraNames[state.era]}</span><span className="chapter-index">{String(state.era).padStart(2, '0')} / 10</span></div>
    <div className="objective-main"><div><h2>{objective.title}</h2><p className="era-hint">{objective.detail}</p></div>
      {objective.stage === 'ready' && needsEraReview(state) && onUpdate ? <button className="era-advance-btn" onClick={() => onUpdate(approveEraAdvance)}>Continue to {eraNames[state.era + 1]} →</button> : onNavigate && <button className="objective-link" onClick={() => onNavigate(objective.destination)}>{objective.stage === 'ready' && state.era === 10 ? 'Review inheritance' : objective.destination === 'mini' ? 'Open operation' : objective.destination === 'tech' ? 'Open research' : 'Open decisions'} <span aria-hidden="true">↗</span></button>}
    </div>
    <div className="objective-meters">
      <label>{cycle ? 'Inheritance' : 'Foundation'} <span>{cycle ? `${cycle.completed}/${cycle.total}` : `${Math.min(readiness.foundationProgress, readiness.minUpgrades)}/${readiness.minUpgrades}`}</span><progress aria-label={cycle ? 'Cycle readiness' : 'Era foundation progress'} value={cycle ? cycle.completed : Math.min(readiness.foundationProgress, readiness.minUpgrades)} max={cycle ? cycle.total : readiness.minUpgrades} /></label>
      {!cycle && <label>Research <span>{readiness.currentTechs}/{readiness.minTechs}</span><progress aria-label="Era research progress" value={Math.min(readiness.currentTechs, readiness.minTechs)} max={readiness.minTechs || 1} /></label>}
      {readiness.mastery.required && <label>Operation or public works <span>{readiness.mastery.met ? 'Complete' : `${Math.round((readiness.mastery.economic?.progress || 0) * 100)}% supplied`}</span><progress aria-label="Economic mastery" value={readiness.mastery.met ? 1 : readiness.mastery.economic?.progress || 0} max="1" /></label>}
    </div>
  </section>;
}
