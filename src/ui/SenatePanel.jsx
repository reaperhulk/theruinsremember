import { memo, useState } from 'react';
import { formatNumber } from './format.js';
import { playClick } from './AudioManager.js';
import {
  enactSenatePolicy,
  getSenateGovernmentMultiplier,
  getSenateStats,
  SENATE_ACT_INTERVAL,
  SENATE_FACTIONS,
  setSenateDirective,
} from '../engine/senate.js';

const FACTION_COLORS = { merchants: '#ddaa44', scholars: '#88bbee', warriors: '#ee6644' };

const ACT_LABELS = {
  mandate: { title: 'Act I — The Mandate', hint: 'Grant one faction the right to lead the galaxy.' },
  coalition: { title: 'Act II — The Coalition', hint: 'Bring a second faction into the government.' },
  ratify: { title: 'Act III — Ratification', hint: 'Seal the government. All three factions benefit.' },
};

export const SenatePanel = memo(function SenatePanel({ state, onUpdate }) {
  const [lastAct, setLastAct] = useState(null);
  const { government, acts, nextAct, nextActCost, cooldown } = getSenateStats(state);
  const senatePct = state.senatePct || { merchants: 34, scholars: 33, warriors: 33 };
  const influence = state.resources.galacticInfluence?.amount || 0;

  const handleEnact = (actId, factionId = null) => {
    playClick();
    const result = enactSenatePolicy(state, actId, factionId);
    if (!result) return;
    onUpdate(() => result.state);
    setLastAct(result);
    setTimeout(() => setLastAct(null), 1400);
  };

  const roleOf = factionId =>
    government.leader === factionId ? 'Leads the government'
      : government.partner === factionId ? 'Coalition partner'
        : null;

  return (
    <div className="panel senate-panel">
      <div className="tuning-header">
        <div>
          <span className="panel-kicker">Galactic politics</span>
          <h2>Galactic Senate</h2>
        </div>
        <strong>{acts}/3 acts{cooldown > 0 ? ` | ${Math.ceil(cooldown)}s` : ''}</strong>
      </div>
      <p className="text-lore" style={{ fontSize: '0.7em', fontStyle: 'italic', color: '#ddaa44', margin: '0 0 6px' }}>
        Every faction remembers a different version of what came before. All of them are correct.
      </p>

      <div className="upgrade-progress-bar">
        <div className="upgrade-progress-fill" style={{ width: `${acts / 3 * 100}%` }} />
      </div>

      {nextAct && (
        <div className="operation-commitment">
          <strong>{ACT_LABELS[nextAct].title}</strong> — {ACT_LABELS[nextAct].hint} Costs {formatNumber(nextActCost)} Galactic Influence.
        </div>
      )}

      {nextAct === 'ratify' ? (
        <div className="reality-laws senate-acts" role="group" aria-label="Ratify the government">
          <button
            style={{ '--law-color': FACTION_COLORS[government.leader] }}
            disabled={cooldown > 0 || influence < nextActCost}
            onClick={() => handleEnact('ratify')}
          >
            <strong>Ratify the Government</strong>
            <span>{SENATE_FACTIONS[government.leader].name} leads, {SENATE_FACTIONS[government.partner].name} supports.</span>
            <span>+10% to all three faction resources</span>
          </button>
        </div>
      ) : (
        <div className="reality-laws senate-acts" role="group" aria-label="Senate factions">
          {Object.values(SENATE_FACTIONS).map(faction => {
            const role = roleOf(faction.id);
            const preview = getSenateGovernmentMultiplier(
              { ...state, senateGov: nextAct === 'mandate' ? { leader: faction.id } : { ...government, partner: faction.id } },
              faction.resource,
            );
            const selectable = nextAct && !role;
            return (
              <button
                key={faction.id}
                className={role ? 'active' : ''}
                style={{ '--law-color': FACTION_COLORS[faction.id] }}
                disabled={!selectable || cooldown > 0 || influence < nextActCost}
                onClick={() => handleEnact(nextAct, faction.id)}
              >
                <strong>{faction.name}</strong>
                <span>{faction.resourceName}</span>
                <span>{role || `x${preview.toFixed(2)} ${faction.resourceName}`}</span>
              </button>
            );
          })}
        </div>
      )}

      {!nextAct && (
        <div className="operation-commitment">
          The government stands: {SENATE_FACTIONS[government.leader].name} leads with {SENATE_FACTIONS[government.partner].name}. It now works without you.
        </div>
      )}

      {lastAct && (
        <div className="operation-result success" role="status">
          {lastAct.act === 'ratify' ? 'The government is ratified.' : `${lastAct.faction.name} ${lastAct.act === 'mandate' ? 'holds the mandate' : 'joins the coalition'}.`}
        </div>
      )}

      <p className="operation-hint">
        Three policy acts form a government | {SENATE_ACT_INTERVAL}s deliberation between acts | Six governments are possible
      </p>

      <div style={{ marginTop: '10px', borderTop: '1px solid #334', paddingTop: '8px' }}>
        <h3 style={{ margin: '0 0 4px', fontSize: '0.9em', color: '#aa88cc' }}>Senate Directive</h3>
        <p style={{ fontSize: '0.7em', color: '#666', margin: '0 0 6px' }}>
          Ongoing production focus — sliders sum to 100%
        </p>
        {Object.values(SENATE_FACTIONS).map(faction => (
          <div key={faction.id} style={{ marginBottom: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8em', marginBottom: '2px' }}>
              <span style={{ color: FACTION_COLORS[faction.id] }}>{faction.name}: {senatePct[faction.id]}%</span>
              <span style={{ color: '#777' }}>{faction.resourceName} +{(senatePct[faction.id] * 0.1).toFixed(1)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={senatePct[faction.id]}
              onChange={e => {
                playClick();
                onUpdate(s => setSenateDirective(s, faction.id, parseInt(e.target.value)));
              }}
              style={{ width: '100%', accentColor: FACTION_COLORS[faction.id], cursor: 'pointer' }}
            />
          </div>
        ))}
      </div>
    </div>
  );
});
