import { getCouncilGroups, chooseCouncilOption } from '../engine/council.js';
import { DEVELOPMENT_FOCI, setDevelopmentFocus } from '../engine/development.js';
import { calculateEconomy } from '../engine/economy.js';
import { canAfford } from '../engine/resources.js';
import { DECISIONS } from '../data/decisions.js';
import { resources } from '../data/resources.js';
import { formatNumber } from './format.js';

function effectText(effect) {
  const name = resources[effect.target]?.name || effect.target;
  if (effect.type === 'production_mult') return `${name} production ${effect.value < 1 ? `${Math.round((effect.value - 1) * 100)}%` : `×${effect.value}`}`;
  if (effect.type === 'production_add') return `${name} +${formatNumber(effect.value)}/s`;
  if (effect.type === 'cap_mult') return `${name} storage ×${effect.value}`;
  return `Unlock ${name}`;
}

export function DevelopmentPolicy({ state, onUpdate }) {
  return <section className="panel development-policy" aria-label="Development policy">
    <h2>Set the settlement’s priorities</h2>
    <p>Gathering, construction and linear research run automatically. Spend your attention on competing plans; every project still uses real resources.</p>
    <div className="policy-options">{Object.entries(DEVELOPMENT_FOCI).map(([id, focus]) => <button key={id} aria-pressed={(state.developmentFocus || 'growth') === id} onClick={() => onUpdate(s => setDevelopmentFocus(s, id))}><strong>{focus.name}</strong><span>{focus.description}</span></button>)}</div>
    <small>{state.autoBuildOut === false ? 'Development is paused. Enable auto build-out below to carry out this policy.' : 'You can change priority at any time. Explicit queued commitments keep their reserved funds.'}</small>
  </section>;
}

export function Council({ state, onUpdate, kind = 'upgrade', economy: suppliedEconomy }) {
  const groups = getCouncilGroups(state, kind);
  const economy = suppliedEconomy || calculateEconomy(state);
  const renderGroup = group => <section key={group.id} className="council-pair" aria-label={`${group.options[0].name} or ${group.options[1].name}`}>
    <div className="council-heading"><strong>{kind === 'tech' ? 'Research direction' : 'Civilization doctrine'} · Era {group.era}</strong><span>{group.chosen ? 'Choice made for this civilization' : 'Choose one · the alternative closes when funded'}</span></div>
    <div className="council-options">{group.options.map((option, i) => {
      const affordable = option.available && canAfford(state, option.cost);
      const lost = group.options[1 - i];
      const disabled = !!group.chosen || option.queued || !affordable && state.goals.length >= 5 && !lost.queued;
      const affected = [...new Set((option.effects || []).filter(e => e.type.startsWith('production')).map(e => e.target))];
      return <article key={option.id} className={`council-option${option.owned ? ' chosen' : ''}`}>
        <h3>{option.name}</h3>
        <ul>{option.effects.map((effect, i) => <li key={i} className={effect.type === 'production_mult' && effect.value < 1 ? 'choice-cost' : ''}>{effectText(effect)}</li>)}</ul>
        {DECISIONS[option.id] && <p className="choice-legacy"><strong>Later:</strong> {DECISIONS[option.id].consequence}</p>}
        <p className="choice-current">Current net income: {affected.map(id => `${resources[id]?.name} ${formatNumber(economy.net[id] || 0)}/s`).join(' · ')}</p>
        <p className="choice-cost">You give up {lost.name} for this civilization.</p>
        <p className="upgrade-cost">{Object.entries(option.cost).map(([id, n]) => `${formatNumber(n)} ${resources[id]?.name}`).join(' · ')}</p>
        <button className={`council-choice ${kind === 'tech' ? 'tech-btn' : 'upgrade-btn'}${affordable ? ' affordable' : ''}`} disabled={disabled} onClick={() => onUpdate(s => chooseCouncilOption(s, kind, option.id))}>
          {option.owned ? 'Chosen' : group.chosen ? 'Alternative closed' : option.queued ? `Committed · awaiting ${option.available ? 'funds' : 'prerequisites'}` : affordable ? `Choose ${option.name}` : `Commit to ${option.name}`}
        </button>
      </article>;
    })}</div>
  </section>;
  const local = groups.filter(g => g.era === state.era);
  const earlier = groups.filter(g => g.era < state.era);
  return <div className="council" aria-label={kind === 'tech' ? 'Research choices' : 'Doctrine choices'}>
    {local.map(renderGroup)}
    {earlier.length > 0 && <details><summary>{earlier.length} unresolved choices from earlier ages</summary>{earlier.map(renderGroup)}</details>}
  </div>;
}
