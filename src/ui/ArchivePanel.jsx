import { useState } from 'react';
import { DOCTRINE_RESEARCH, RECONSTRUCTION_PROJECTS, researchDoctrine, craftRelic, contributeProject, saveAutomationPlan, restoreAutomationPlan } from '../engine/archive.js';
import { RELICS } from '../data/relics.js';
import { getEffectiveCap } from '../engine/resources.js';
import { getRelicSlotLimit } from '../engine/relics.js';
import { formatNumber, formatTime } from './format.js';

export function ArchivePanel({ state, onUpdate }) {
  const [replace, setReplace] = useState('');
  const archive = state.archive;
  if (state.prestigeCount < 1) return <section className="panel"><h2>The Archive</h2><p>Your first prestige preserves the history of this civilization and unlocks saved automation plans. The second opens doctrine research and relic crafting. The third begins reconstruction across multiple cycles.</p></section>;
  return <section className="panel archive-panel">
    <h2>The Archive · {archive.shards} memory shards</h2>
    <p>Each completed cycle leaves six shards. Research, projects, and recorded history survive every reset.</p>
    <h3>Remembered plans</h3>
    <p>Save your current goal queue, operation commissions, consumer reserves, and build-out preference. Restore it when you are ready; future-era orders wait for their era.</p>
    <button onClick={() => onUpdate(saveAutomationPlan)}>Save current plan</button>
    <button disabled={!archive.savedPlan} onClick={() => onUpdate(restoreAutomationPlan)}>Restore saved plan</button>
    {state.prestigeCount >= 2 ? <>
      <h3>Doctrine research</h3>
      <div className="archive-cards">{Object.entries(DOCTRINE_RESEARCH).map(([id, def]) => <article key={id}>
        <strong>{def.name}</strong><p>{def.description}</p>
        <button disabled={!!archive.research[id] || archive.shards < def.cost} onClick={() => onUpdate(s => researchDoctrine(s, id))}>{archive.research[id] ? 'Remembered permanently' : `Research · ${def.cost} shards`}</button>
      </article>)}</div>
      <h3>Relic workshop</h3>
      <p>Choose an exact relic for three shards. It lasts for this run.</p>
      {state.activeRelics.length >= getRelicSlotLimit(state) && <label>Replace <select value={replace} onChange={e => setReplace(e.target.value)}><option value="">Choose an equipped relic</option>{state.activeRelics.map(id => <option key={id} value={id}>{RELICS[id]?.name}</option>)}</select></label>}
      <div className="archive-cards">{Object.entries(RELICS).map(([id, relic]) => <article key={id}><strong>{relic.name}</strong><p>{relic.description}</p><button disabled={archive.shards < 3 || state.activeRelics.includes(id) || (state.activeRelics.length >= getRelicSlotLimit(state) && !replace)} onClick={() => onUpdate(s => craftRelic(s, id, replace))}>Craft · 3 shards</button></article>)}</div>
    </> : <p>Next prestige unlocks permanent research and the relic workshop.</p>}
    {state.prestigeCount >= 3 ? <>
      <h3>Reconstruction projects</h3>
      <p>Each project needs contributions from two different cycles. Contributions cost 25% of the indicated resource capacity.</p>
      <div className="archive-cards">{Object.entries(RECONSTRUCTION_PROJECTS).map(([id, project]) => {
        const count = archive.projects[id] || 0;
        const cost = getEffectiveCap(state, project.resource) * 0.25;
        const contributed = archive.contributions[id] === state.prestigeCount;
        return <article key={id}><strong>{project.name} · {count}/2 cycles</strong><p>{project.description}</p><button disabled={count >= 2 || contributed || state.era < project.era || state.resources[project.resource].amount < cost} onClick={() => onUpdate(s => contributeProject(s, id))}>{count >= 2 ? 'Reconstructed' : contributed ? 'Continue in your next cycle' : `Era ${project.era}: contribute ${formatNumber(cost)} ${project.resource}`}</button></article>;
      })}</div>
    </> : <p>Prestige three unlocks reconstruction projects that span cycles.</p>}
    <h3>Remembered civilizations</h3>
    <ol>{archive.entries.map(entry => <li key={entry.cycle}>Cycle {entry.cycle}: Era {entry.era} in {formatTime(entry.seconds)} · {entry.upgrades} upgrades · {entry.doctrine || 'First civilization'}</li>)}</ol>
    <details><summary>Permanent chronicle · {archive.lore.length} memories</summary>{archive.lore.map((entry, i) => <p key={i} className="text-lore">{entry}</p>)}</details>
  </section>;
}
