import { useState } from 'react';
import { ACHIEVEMENTS, ACHIEVEMENT_BY_ID, ECHO_EFFECTS, ERA_COUNT, ERA_NAMES, ERA_THRESHOLDS, MEMORY_UPGRADES, UPGRADES } from '../game/data.js';
import {
  getAvailableMemories, getBuildingCount, getClickValue, getGlobalMultiplier, getNextMemoryAt,
  canLeaveMessage, getAchievementBonus, getMemoryMultiplier, getOfflineEfficiency, getPendingMemories, getSps, getTotalMemories, isMemoryUpgradeAvailable,
} from '../game/engine.js';
import { CHAPTERS, MESSAGES } from '../game/lore.js';
import { formatAmount, formatNumber, formatTime } from './format.js';

const TABS = [
  ['chronicle', 'Chronicle'],
  ['cycle', 'The Cycle'],
  ['achievements', 'Achievements'],
  ['stats', 'Stats'],
  ['options', 'Options'],
];

function logText(entry) {
  switch (entry.kind) {
    case 'era': return `Era ${entry.era}: ${ERA_NAMES[entry.era]}. ${CHAPTERS[entry.era].title}.`;
    case 'achievement': return `Achievement: ${ACHIEVEMENT_BY_ID[entry.id]?.name ?? entry.id}.`;
    case 'echo': return entry.effect === 'cache' ? `Glimmer caught: a cache of ${formatAmount(entry.amount)} salvage.` : `Glimmer caught: ${ECHO_EFFECTS[entry.effect]?.name}. ${ECHO_EFFECTS[entry.effect]?.description}`;
    case 'cycle': return `The cycle turned (${entry.cycle}). ${entry.memories} memor${entry.memories === 1 ? 'y' : 'ies'} carried forward.`;
    case 'message': return `You left a message for the next civilization: “${MESSAGES[entry.id]?.text}”`;
    case 'legacy': return `The ruins remember your earlier civilization: ${entry.memories} memories carried forward.`;
    default: return '';
  }
}

function Chronicle({ state, onRewriteMessage }) {
  const nextEra = state.era < ERA_COUNT ? state.era + 1 : null;
  const target = nextEra ? ERA_THRESHOLDS[nextEra] : null;
  const progress = target ? Math.min(1, Math.log10(1 + state.runEarned) / Math.log10(1 + target)) : 1;
  const chapter = CHAPTERS[state.era];
  return (
    <div className="chronicle">
      <article className="chapter" style={{ '--chapter': chapter.color }}>
        <p className="eyebrow">Era {state.era} · {ERA_NAMES[state.era]}</p>
        <h3>{chapter.title}</h3>
        <p>{chapter.discovery}</p>
        {nextEra ? (
          <div className="era-progress">
            <div className="bar" role="progressbar" aria-label={`Progress to ${ERA_NAMES[nextEra]}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}>
              <span style={{ width: `${progress * 100}%` }} />
            </div>
            <small>{ERA_NAMES[nextEra]} is revealed after {formatAmount(target)} salvage this cycle ({formatAmount(state.runEarned)} so far).</small>
          </div>
        ) : <small>{state.message ? 'You have reached the last era. The ruins are yours.' : 'Build the Echo of Yourself to choose what the ruins will say.'}</small>}
      </article>
      {state.message && (
        <article className="message-card">
          <p className="eyebrow">Your message to the next civilization</p>
          <p>“{MESSAGES[state.message].text}”</p>
          {canLeaveMessage(state) && <button type="button" onClick={onRewriteMessage}>Rewrite it</button>}
        </article>
      )}
      <h3 className="log-heading">Recent</h3>
      <ol className="log" reversed>
        {[...state.log].reverse().slice(0, 25).map((entry, i) => <li key={`${entry.time}-${i}`}>{logText(entry)}</li>)}
        {!state.log.length && <li className="muted">Your survivors crash-landed beside something old. Dig.</li>}
      </ol>
    </div>
  );
}

function Cycle({ state, onTurn, onBuyMemory }) {
  const [confirming, setConfirming] = useState(false);
  const pending = getPendingMemories(state);
  const total = getTotalMemories(state);
  return (
    <div className="cycle">
      <p>Every civilization reaches this point. When you let the cycle turn, your buildings, upgrades and salvage return to the ruins. What you recovered becomes <strong>memories</strong>. They multiply all production, forever: the first few count the most. They can also be spent once on the lessons below, and spending them never lowers that bonus.</p>
      <dl className="stat-list">
        <dt>Memories</dt><dd>{formatAmount(total)} (production ×{formatNumber(getMemoryMultiplier(state))})</dd>
        <dt>Unspent</dt><dd>{formatAmount(getAvailableMemories(state))}</dd>
        <dt>Turning now gives</dt><dd>{formatAmount(pending)}{pending > 0 ? ` (production ×${formatNumber(getMemoryMultiplier(state))} → ×${formatNumber(getMemoryMultiplier(state, total + pending))})` : ''}</dd>
        <dt>Next memory at</dt><dd>{formatAmount(getNextMemoryAt(state))} total salvage ({formatAmount(state.totalEarned)} so far)</dd>
      </dl>
      {confirming ? (
        <div className="confirm">
          <p>Return everything to the ruins and begin again with {formatAmount(total + pending)} memories?</p>
          <button type="button" className="primary" onClick={() => { setConfirming(false); onTurn(); }}>Let the cycle turn</button>
          <button type="button" onClick={() => setConfirming(false)}>Not yet</button>
        </div>
      ) : (
        <button type="button" className="primary" disabled={pending < 1} onClick={() => setConfirming(true)}>
          {pending < 1 ? 'Recover more before the cycle can turn' : `Let the cycle turn (+${formatAmount(pending)})`}
        </button>
      )}
      <h3>Lessons</h3>
      <ul className="lessons">
        {MEMORY_UPGRADES.map(upgrade => {
          const owned = !!state.memoryUpgrades[upgrade.id];
          const available = isMemoryUpgradeAvailable(state, upgrade.id);
          const affordable = available && getAvailableMemories(state) >= upgrade.cost;
          return (
            <li key={upgrade.id} className={owned ? 'owned' : ''}>
              <div><strong>{upgrade.name}</strong><span>{upgrade.description}</span></div>
              {owned ? <span className="tag">Learned</span> : (
                <button type="button" disabled={!affordable} onClick={() => onBuyMemory(upgrade.id)}
                  title={!available ? `Requires ${MEMORY_UPGRADES.find(u => u.id === upgrade.requires)?.name}` : undefined}>
                  {formatAmount(upgrade.cost)} {upgrade.cost === 1 ? 'memory' : 'memories'}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Achievements({ state }) {
  const earned = Object.keys(state.achievements).length;
  return (
    <div>
      <p>{earned} of {ACHIEVEMENTS.length} achievements. Each adds {Math.round(getAchievementBonus(state) * 100)}% to all production, and Archivist improvements multiply production further for every achievement.</p>
      <ul className="achievement-grid">
        {ACHIEVEMENTS.map(a => {
          const has = !!state.achievements[a.id];
          return <li key={a.id} className={has ? 'earned' : ''} title={`${a.name}: ${a.description}`}><strong>{has ? a.name : '???'}</strong><span>{a.description}</span></li>;
        })}
      </ul>
    </div>
  );
}

function Stats({ state }) {
  const rows = [
    ['Salvage', formatAmount(state.salvage)],
    ['Per second', formatNumber(getSps(state))],
    ['Per click', formatNumber(getClickValue(state))],
    ['Recovered this cycle', formatAmount(state.runEarned)],
    ['Recovered in total', formatAmount(state.totalEarned)],
    ['Dug by hand', `${formatAmount(state.clickEarned)} in ${state.clicks.toLocaleString('en-US')} clicks`],
    ['Buildings', getBuildingCount(state).toLocaleString('en-US')],
    ['Improvements', `${Object.keys(state.upgrades).length} of ${UPGRADES.length}`],
    ['Production multiplier', `×${getGlobalMultiplier(state).toFixed(2)}`],
    ['Glimmers caught', state.echoesCaught.toLocaleString('en-US')],
    ['Cycles', state.cycles.toLocaleString('en-US')],
    ['Highest era', `${state.highestEra} · ${ERA_NAMES[state.highestEra]}`],
    ['While away', `${Math.round(getOfflineEfficiency(state) * 100)}% production`],
    ['This cycle', formatTime(state.runTime)],
    ['All cycles', formatTime(state.totalTime)],
  ];
  return <dl className="stat-list">{rows.map(([k, v]) => <div key={k} className="stat-row"><dt>{k}</dt><dd>{v}</dd></div>)}</dl>;
}

function Options({ audio, settings, onSettings, onExport, onImport, onReset }) {
  const [text, setText] = useState('');
  const [message, setMessage] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);
  return (
    <div className="options">
      <h3>Sound</h3>
      <label className="row"><input type="checkbox" checked={settings.music} onChange={e => onSettings({ music: e.target.checked })} /> Music{audio.status === 'playing' ? ` · ${audio.theme}` : ''}</label>
      <label className="row">Music volume <input type="range" min="0" max="1" step="0.05" value={settings.musicVolume} onChange={e => onSettings({ musicVolume: Number(e.target.value) })} /></label>
      <label className="row">Effects volume <input type="range" min="0" max="1" step="0.05" value={settings.effectsVolume} onChange={e => onSettings({ effectsVolume: Number(e.target.value) })} /></label>
      <h3>Display</h3>
      <label className="row"><input type="checkbox" checked={settings.lowPower} onChange={e => onSettings({ lowPower: e.target.checked })} /> Low-power animation</label>
      <label className="row"><input type="checkbox" checked={settings.numbers} onChange={e => onSettings({ numbers: e.target.checked })} /> Floating numbers when digging</label>
      <h3>Save</h3>
      <div className="row wrap">
        <button type="button" onClick={() => { setText(onExport()); setMessage('Copy this text somewhere safe.'); }}>Export</button>
        <button type="button" onClick={() => {
          try { onImport(text); setMessage('Save imported.'); } catch { setMessage('That save could not be read.'); }
        }} disabled={!text.trim()}>Import</button>
      </div>
      <textarea aria-label="Save text" value={text} onChange={e => setText(e.target.value)} rows={3} placeholder="Paste an exported save here to import it." />
      {message && <p className="muted" role="status">{message}</p>}
      <h3>Start over</h3>
      {confirmReset ? (
        <div className="confirm">
          <p>Erase everything, including memories and achievements?</p>
          <button type="button" className="danger" onClick={() => { setConfirmReset(false); onReset(); }}>Erase</button>
          <button type="button" onClick={() => setConfirmReset(false)}>Keep playing</button>
        </div>
      ) : <button type="button" className="danger" onClick={() => setConfirmReset(true)}>Hard reset</button>}
    </div>
  );
}

export function Journal({ state, tab, onTab, onTurn, onBuyMemory, onRewriteMessage, ...options }) {
  const pending = getPendingMemories(state);
  return (
    <section className="journal" aria-label="Journal">
      <div className="tabs" role="tablist">
        {TABS.map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} className={tab === id ? 'active' : ''} onClick={() => onTab(id)}>
            {label}{id === 'cycle' && pending > 0 ? <span className="badge">{formatAmount(pending)}</span> : null}
          </button>
        ))}
      </div>
      <div className="tab-body" role="tabpanel">
        {tab === 'chronicle' && <Chronicle state={state} onRewriteMessage={onRewriteMessage} />}
        {tab === 'cycle' && <Cycle state={state} onTurn={onTurn} onBuyMemory={onBuyMemory} />}
        {tab === 'achievements' && <Achievements state={state} />}
        {tab === 'stats' && <Stats state={state} />}
        {tab === 'options' && <Options {...options} />}
      </div>
    </section>
  );
}

