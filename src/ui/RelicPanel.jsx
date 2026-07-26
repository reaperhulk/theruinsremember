import { memo } from 'react';
import { RELICS } from '../data/relics.js';
import { claimRelic, declineRelicOffer, ECHO_PRESSURE_TARGET, RELIC_SLOT_LIMIT } from '../engine/relics.js';

export const RelicPanel = memo(function RelicPanel({ state, onUpdate }) {
  const active = state.activeRelics || [];
  const offer = state.relicOffer || [];
  const pressure = Math.min(ECHO_PRESSURE_TARGET, state.echoPressure || 0);

  // Pressure ticks up from the first second, so an "0/2 active" panel with a
  // near-empty bar sat above the fold for the whole onboarding window with
  // nothing to act on. It appears once the signal is actually close.
  const dormant = pressure < ECHO_PRESSURE_TARGET / 2 && offer.length === 0 && active.length === 0;
  if (dormant) return null;

  return (
    <section className={`panel relic-panel ${offer.length > 0 ? 'offer-ready' : ''}`} aria-labelledby="relic-title">
      <div className="relic-heading">
        <div>
          <span className="panel-kicker">Run loadout</span>
          <h2 id="relic-title">Recovered Relics</h2>
        </div>
        <strong>{active.length}/{RELIC_SLOT_LIMIT} active</strong>
      </div>

      <div className="echo-pressure" aria-label={`Echo Pressure ${Math.floor(pressure)} of ${ECHO_PRESSURE_TARGET}`}>
        <div className="echo-pressure-fill" style={{ width: `${pressure}%` }} />
      </div>
      <div className="relic-meta">
        <span>Echo Pressure {Math.floor(pressure)}/{ECHO_PRESSURE_TARGET}</span>
        <span>{offer.length ? 'Relic signal resolved' : 'Time and failed risky expeditions build pressure'}</span>
      </div>

      {active.length > 0 && (
        <div className="active-relics">
          {active.map(id => (
            <div key={id}>
              <strong>{RELICS[id].name}</strong>
              <span>{RELICS[id].description}</span>
            </div>
          ))}
        </div>
      )}

      {offer.length > 0 && (
        <>
          <div className="relic-offer" role="group" aria-label="Recovered relic choices">
            {offer.map(id => {
            const relic = RELICS[id];
            return (
              <div key={id} className="relic-choice">
                <span className="relic-domain">{relic.domain}</span>
                <strong>{relic.name}</strong>
                <p>{relic.description}</p>
                {active.length < RELIC_SLOT_LIMIT ? (
                  <button onClick={() => onUpdate(current => claimRelic(current, id))}>Equip relic</button>
                ) : (
                  <div className="relic-replacements">
                    {active.map(activeId => (
                      <button key={activeId} onClick={() => onUpdate(current => claimRelic(current, id, activeId))}>
                        Replace {RELICS[activeId].name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
            })}
          </div>
          <button className="relic-decline" onClick={() => onUpdate(declineRelicOffer)}>Let the signal fade</button>
        </>
      )}
    </section>
  );
});
