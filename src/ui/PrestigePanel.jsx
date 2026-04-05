import { useState } from 'react';
import { getPrestigeShop, purchasePrestigeUpgrade, getPrestigeSummary } from '../engine/prestige.js';
import { getEffectivePrestige, PRESTIGE_HARD_CAP } from '../engine/resources.js';
import { eraNames } from '../engine/eras.js';
import { events as eventDefs } from '../data/events.js';
import { detectArchetype, ARCHETYPE_LABELS } from '../engine/advisor.js';
import { formatNumber, formatTime } from './format.js';

function getPrestigeInsight(state) {
  const owned = state.prestigeUpgrades || {};
  if (owned.eternalReturn) return 'The final upgrade. There is nothing more to learn. There is nothing more to build. Only the eternal return.';
  if (owned.cosmicAwareness) return 'You have read every inscription. Every warning. Every epitaph. You continue anyway.';
  if (owned.acceleratedDecay) return 'The cycle spins so fast now that eras blur together like frames in a film.';
  if (owned.primordialMemory) return 'You remember everything from every iteration. The machines remember you.';
  if (owned.temporalMastery) return 'Three eras of history compressed into a single thought. You begin where others struggle to arrive.';
  if (owned.cycleMastery) return 'You have mastered the cycle. Production flows like water through familiar channels.';
  if (owned.quantumTunneling) return 'Prerequisites blur. You remember the shortcuts from last time.';
  if (owned.infinitePatience) return 'Time holds no dominion over one who has lived forever.';
  if (owned.temporalEcho) return 'Events ripple backward through time. You catch their echoes.';
  if (owned.deepPockets) return 'The universe provides more space for those who have walked this path before.';
  if (owned.fastStart) return 'The first steps are muscle memory now.';
  if (Object.keys(owned).length > 0) return 'Each upgrade is a scar from a previous iteration.';
  return null;
}

export function PrestigePanel({ state, onUpdate }) {
  const [showPreview, setShowPreview] = useState(false);
  const shop = getPrestigeShop(state);
  const summary = getPrestigeSummary(state);
  const points = state.prestigePoints || 0;
  const bestTimes = state.bestEraTimes || {};

  const cycleCount = state.prestigeCount || 0;
  const prestigeLore = cycleCount === 0
    ? 'Something waits at the end of this path. You can feel it pulling.'
    : cycleCount === 1
    ? 'You remember flashes of a previous life. The ruins make more sense now.'
    : cycleCount === 2
    ? 'The ruins make sense now. You built them.'
    : cycleCount === 3
    ? 'Third iteration. The machines remember you. They were waiting.'
    : cycleCount === 4
    ? 'Fourth cycle. You can feel the grooves worn into reality by your passage.'
    : cycleCount < 7
    ? `Cycle ${cycleCount + 1}. The universe barely resists anymore. It knows the shape of you.`
    : cycleCount < 10
    ? `Cycle ${cycleCount + 1}. Reality bends before you even push. The grooves are well-worn now.`
    : cycleCount < 20
    ? `Cycle ${cycleCount + 1}. You no longer build — you remember. Each upgrade is a memory of a life already lived.`
    : cycleCount < 50
    ? `Cycle ${cycleCount + 1}. The boundary between iterations blurs. Past and future are the same hallway, walked in both directions.`
    : `Cycle ${cycleCount + 1}. You are the cycle. The cycle is you. There is no difference anymore.`;

  return (
    <div className="panel prestige-panel">
      <h2>Prestige{points > 0 ? ` (${points} pts)` : ''} ({shop.filter(u => u.owned).length}/{shop.length} owned)</h2>
      <p className="text-lore" style={{ margin: '0 0 8px', textAlign: 'center' }}>
        {prestigeLore}
      </p>
      {getPrestigeInsight(state) && (
        <p style={{ fontSize: '0.75em', color: '#7799aa', fontStyle: 'italic', margin: '0 0 8px', textAlign: 'center' }}>
          {getPrestigeInsight(state)}
        </p>
      )}
      <div className="prestige-info">
        <div className="stat-row">
          <span>Current Era:</span>
          <span>Era {state.era} ({eraNames[state.era] || 'Unknown'})</span>
        </div>
        {(state.era >= 7 || (state.prestigeCount || 0) > 0) && (
          <>
            <div className="stat-row">
              <span>Prestige Points:</span>
              <span>{points}</span>
            </div>
            <div className="stat-row">
              <span>Prestige Count:</span>
              <span>{state.prestigeCount || 0}</span>
            </div>
            <div className="stat-row">
              <span>Current Multiplier:</span>
              <span>x{formatNumber(state.prestigeMultiplier)}{state.prestigeMultiplier > 10 &&
                ` (effective: x${formatNumber(getEffectivePrestige(state.prestigeMultiplier))}${getEffectivePrestige(state.prestigeMultiplier) >= PRESTIGE_HARD_CAP ? ' MAX' : ''})`
              }</span>
            </div>
            <div className="stat-row">
              <span>Next Prestige:</span>
              <span>+{summary.points} pts, x{formatNumber(summary.bonus)} → total x{formatNumber(summary.newMultiplier)}{summary.newMultiplier > 10 &&
                ` (eff: x${formatNumber(getEffectivePrestige(summary.newMultiplier))})`
              }{state.era < 10 ? ' (prestige at Era 10)' : ''}</span>
            </div>
          </>
        )}
      </div>

      {state.era >= 7 && !state.prestigeUpgrades?.eternalReturn && (
        <div style={{ marginBottom: '8px' }}>
          <button
            style={{ fontSize: '0.8em', padding: '4px 10px', background: '#1a1a2e', border: '1px solid #446', color: '#aaccff', cursor: 'pointer', fontFamily: 'inherit', borderRadius: '3px' }}
            onClick={() => setShowPreview(v => !v)}
          >
            {showPreview ? 'Hide Preview' : 'Preview Prestige'}
          </button>
          {showPreview && (() => {
            const archetype = detectArchetype(state);
            const archLabel = ARCHETYPE_LABELS[archetype];
            const firstUpgrades = shop.filter(u => !u.owned && !u.locked).slice(0, 3);
            const PRESTIGE_LORE = [
              'The cycle remembers you. Something is different this time — quieter, more certain.',
              'You have walked this road before. The ruins bow slightly as you pass.',
              'Every ending is a library. You carry what matters into the next beginning.',
            ];
            const loreFlav = PRESTIGE_LORE[(state.prestigeCount || 0) % PRESTIGE_LORE.length];
            return (
              <div style={{ marginTop: '8px', padding: '10px', background: '#0e0e1a', border: '1px solid #336', borderRadius: '4px', fontSize: '0.85em' }}>
                <p style={{ fontStyle: 'italic', color: '#7799bb', margin: '0 0 8px' }}>{loreFlav}</p>
                <div style={{ display: 'grid', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#888' }}>Points earned:</span>
                    <span style={{ color: '#aaddff' }}>+{summary.points} pts (total: {summary.totalPoints})</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#888' }}>Multiplier:</span>
                    <span style={{ color: '#aaddff' }}>x{formatNumber(state.prestigeMultiplier)} → x{formatNumber(summary.newMultiplier)} (eff: x{formatNumber(getEffectivePrestige(summary.newMultiplier))})</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#888' }}>Build style:</span>
                    <span style={{ color: archLabel.color }}>{archLabel.name} — {archLabel.desc}</span>
                  </div>
                  {firstUpgrades.length > 0 && (
                    <div>
                      <span style={{ color: '#888' }}>Suggested first buys: </span>
                      <span style={{ color: '#ccaa66' }}>{firstUpgrades.map(u => u.name).join(', ')}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {state.era < 7 && (state.prestigeCount || 0) === 0 && (
        <div style={{ padding: '12px', color: '#888', textAlign: 'center' }}>
          <p style={{ marginBottom: '8px', color: '#998866', fontStyle: 'italic' }}>
            "Every civilization reaches the end. Every civilization starts again."
          </p>
          <p style={{ fontSize: '0.85em', marginBottom: '4px' }}>
            The ruins whisper of cycles — civilizations that rose, reached the Dyson Era, and began anew. Something awaits at Era 7.
          </p>
          <p style={{ fontSize: '0.8em', color: '#666' }}>
            Keep building. The path reveals itself to those who persist.
          </p>
        </div>
      )}

      {(state.era >= 7 || (state.prestigeCount || 0) > 0) && (
        <>
          <div className="upgrade-progress-bar" style={{ margin: '4px 0 8px' }}>
            <div className="upgrade-progress-fill" style={{ width: `${Math.floor(shop.filter(u => u.owned).length / shop.length * 100)}%`, background: 'linear-gradient(90deg, #8844cc, #cc44aa)' }} />
          </div>
          <h3>Upgrades ({shop.filter(u => u.owned).length}/{shop.length})</h3>
          <div className="prestige-shop">
            {[...shop].sort((a, b) => {
              // Owned first, then by cost ascending
              if (a.owned !== b.owned) return a.owned ? 1 : -1;
              return (a.cost || 0) - (b.cost || 0);
            }).map(u => (
              <button
                key={u.id}
                className={`upgrade-btn ${u.owned ? 'purchased' : u.locked ? 'locked' : u.affordable ? 'affordable' : 'too-expensive'}`}
                disabled={u.owned || !u.affordable || u.locked}
                onClick={() => onUpdate(s => purchasePrestigeUpgrade(s, u.id))}
                title={u.description}
                style={!u.owned && !u.affordable ? { opacity: u.locked ? 0.4 : 0.65 } : {}}
              >
                <div className="upgrade-name">
                  {u.name}
                  {u.owned && ' [OWNED]'}
                </div>
                <div className="upgrade-cost">
                  {u.cost} points
                  {!u.owned && !u.affordable && !u.locked && points > 0 && ` (${Math.floor(points / u.cost * 100)}% — need ${u.cost - points} more)`}
                </div>
                <div className="upgrade-desc">{u.description}</div>
                {u.locked && <div className="upgrade-desc" style={{ color: '#ff8888' }}>Requires: {u.requiresName}</div>}
                {!u.owned && !u.locked && !u.affordable && (
                  <div className="upgrade-progress-bar">
                    <div className={`upgrade-progress-fill ${points / u.cost > 0.8 ? 'almost' : ''}`} style={{ width: `${Math.min(Math.floor(points / u.cost * 100), 100)}%` }} />
                  </div>
                )}
              </button>
            ))}
          </div>
        </>
      )}

      <h3>Milestones</h3>
      <div className="stats-grid">
        <div className="stat-row">
          <span>Total Prestiges:</span>
          <span>{state.prestigeCount || 0}</span>
        </div>
        <div className="stat-row">
          <span>Highest Era:</span>
          <span>{state.lifetimeHighestEra || state.era}</span>
        </div>
        <div className="stat-row">
          <span>Lifetime Gems:</span>
          <span>{(state.lifetimeGems || 0) + (state.totalGems || 0)}</span>
        </div>
        <div className="stat-row">
          <span>Lifetime Trades:</span>
          <span>{(state.lifetimeTrades || 0) + (state.totalTrades || 0)}</span>
        </div>
        <div className="stat-row">
          <span>Lifetime Play:</span>
          <span>{formatTime((state.lifetimePlayTime || 0) + state.totalTime)}</span>
        </div>
        <div className="stat-row">
          <span>Upgrades Owned:</span>
          <span>{Object.keys(state.upgrades || {}).length} regular, {Object.keys(state.prestigeUpgrades || {}).length}/30 prestige</span>
        </div>
      </div>
      {Object.keys(bestTimes).length > 0 && (
        <>
          <h3>Best Era Times</h3>
          <div className="stats-grid">
            {Object.entries(bestTimes)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([era, time]) => (
                <div key={era} className="stat-row">
                  <span>Era {era}:</span>
                  <span>{Math.floor(time / 60)}m {Math.floor(time % 60)}s</span>
                </div>
              ))}
          </div>
        </>
      )}

      {state.trueEnding && <CycleCodex state={state} />}
    </div>
  );
}

function CycleCodex({ state }) {
  const [expanded, setExpanded] = useState(false);
  const totalLoreEvents = Object.values(eventDefs).filter(e => e.isLore).length + 3; // +3 milestone lore
  const seenLore = (state.eventLog || []).filter(e => e.isLore);
  const pct = Math.min(100, Math.round((seenLore.length / totalLoreEvents) * 100));

  return (
    <div style={{ marginTop: '12px', borderTop: '1px solid #446', paddingTop: '10px' }}>
      <h3 style={{ color: '#cc88ff' }}>Cycle Codex</h3>
      <p style={{ fontSize: '0.8em', color: '#7799aa', fontStyle: 'italic', margin: '0 0 8px' }}>
        "Every ruin is a library. You have read {seenLore.length} of its pages."
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <div style={{ flex: 1, height: '6px', background: '#223', borderRadius: '3px' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #8844cc, #cc44aa)', borderRadius: '3px' }} />
        </div>
        <span style={{ fontSize: '0.8em', color: '#cc88ff' }}>{pct}% recovered</span>
      </div>
      <button
        style={{ fontSize: '0.8em', color: '#aaa', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        onClick={() => setExpanded(e => !e)}
      >
        {expanded ? 'hide echoes' : `show ${seenLore.length} recovered echo${seenLore.length !== 1 ? 'es' : ''}`}
      </button>
      {expanded && (
        <div style={{ maxHeight: '200px', overflowY: 'auto', marginTop: '6px' }}>
          {seenLore.map((e, i) => (
            <p key={i} style={{ fontSize: '0.75em', color: '#99aacc', margin: '4px 0', fontStyle: 'italic', borderLeft: '2px solid #446', paddingLeft: '6px' }}>
              {e.message.replace(/^Event: [^—]+— /, '')}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
