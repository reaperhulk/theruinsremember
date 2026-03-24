import { useState, useEffect, useCallback, useRef } from 'react';
import { createInitialState, migrateState } from '../engine/state.js';
import { useGameLoop } from '../hooks/useGameLoop.js';
import { mine } from '../engine/mining.js';
import { ResourcePanel } from './ResourcePanel.jsx';
import { UpgradePanel } from './UpgradePanel.jsx';
import { TechTree } from './TechTree.jsx';
import { EraProgress } from './EraProgress.jsx';
import { GameCanvas } from './GameCanvas.jsx';
import { EventLog } from './EventLog.jsx';
import { MiningPanel } from './MiningPanel.jsx';
import { FactoryPanel } from './FactoryPanel.jsx';
import { HackingPanel } from './HackingPanel.jsx';
import { DockingPanel } from './DockingPanel.jsx';
import { ColonyPanel } from './ColonyPanel.jsx';
import { StarChartPanel } from './StarChartPanel.jsx';
import { WeavingPanel } from './WeavingPanel.jsx';
import { DysonPanel } from './DysonPanel.jsx';
import { TuningPanel } from './TuningPanel.jsx';
import { TradingPanel } from './TradingPanel.jsx';
import { SenatePanel } from './SenatePanel.jsx';
import { RealityForgePanel } from './RealityForgePanel.jsx';
import { VictoryScreen } from './VictoryScreen.jsx';
import { HelpOverlay } from './HelpOverlay.jsx';
import { setMuted } from './AudioManager.js';
import { StatsPanel } from './StatsPanel.jsx';
import { PrestigePanel } from './PrestigePanel.jsx';
import { EraTransition } from './EraTransition.jsx';
import { Toast } from './Toast.jsx';
import { OfflineReport } from './OfflineReport.jsx';
import { performPrestige, calculatePrestigeBonus, getPrestigeSummary } from '../engine/prestige.js';
import { ERA_COUNT, eraNames } from '../engine/eras.js';
import { getAvailableUpgrades, getUpgradeCost } from '../engine/upgrades.js';
import { getAvailableTech } from '../engine/tech.js';
import { canAfford, getEffectivePrestige } from '../engine/resources.js';
import { formatNumber } from './format.js';

const initialState = createInitialState();

// Tab definitions — which tabs are available at which era
function getAvailableTabs(era) {
  const tabs = [
    { id: 'upgrades', label: 'Upgrades', key: '1' },
    { id: 'tech', label: 'Tech', key: '2' },
    { id: 'mini', label: 'Mini-Game', key: '3' },
  ];
  if (era >= 4) tabs.push({ id: 'trading', label: 'Trading', key: '4' });
  tabs.push({ id: 'prestige', label: 'Prestige', key: '5' });
  tabs.push({ id: 'stats', label: 'Stats', key: '6' });
  return tabs;
}

export function App() {
  const { state, updateState, resetSave, offlineReport, dismissOfflineReport } = useGameLoop(initialState);
  const [activeTab, setActiveTab] = useState('upgrades');
  const [activeMiniGame, setActiveMiniGame] = useState('mining');
  const prevEraRef = useRef(state.era);
  const [shakeClass, setShakeClass] = useState('');
  const [flashClass, setFlashClass] = useState('');
  const [hintsDismissed, setHintsDismissed] = useState(false);
  const [audioMuted, setAudioMuted] = useState(() => localStorage.getItem('audioMuted') === 'true');
  const [victoryDismissed, setVictoryDismissed] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const prevEventsRef = useRef(state.eventLog?.length || 0);
  const prevPerfectsRef = useRef(state.dockingPerfects || 0);

  // Sync audio muted state
  useEffect(() => {
    setMuted(audioMuted);
    localStorage.setItem('audioMuted', audioMuted);
  }, [audioMuted]);

  // Screen shake on perfect dock
  useEffect(() => {
    const perfects = state.dockingPerfects || 0;
    if (perfects > prevPerfectsRef.current) {
      setShakeClass('shake');
      const t = setTimeout(() => setShakeClass(''), 300);
      prevPerfectsRef.current = perfects;
      return () => clearTimeout(t);
    }
    prevPerfectsRef.current = perfects;
  }, [state.dockingPerfects]);

  // Event flash on new events (red for crisis, blue for normal)
  useEffect(() => {
    const events = state.eventLog?.length || 0;
    if (events > prevEventsRef.current) {
      const latestMsg = state.eventLog?.[state.eventLog.length - 1]?.message || '';
      const isCrisis = /^Blight|strikes|surge|rupture|corrupted/i.test(latestMsg);
      setFlashClass(isCrisis ? 'crisis-flash' : 'event-flash');
      const t = setTimeout(() => setFlashClass(''), isCrisis ? 800 : 500);
      prevEventsRef.current = events;
      return () => clearTimeout(t);
    }
    prevEventsRef.current = events;
  }, [state.eventLog?.length]);

  const handlePrestige = () => {
    if (state.era < ERA_COUNT) return;
    // Game is truly complete once Eternal Return is purchased — no more cycles
    if (state.prestigeUpgrades?.eternalReturn) return;
    const summary = getPrestigeSummary(state);
    const milestones = [];
    if (summary.prestigeCount >= 3 && (state.prestigeCount || 0) < 3) milestones.push('NEW: Auto-gather unlocked');
    if (summary.prestigeCount >= 5 && (state.prestigeCount || 0) < 5) milestones.push('NEW: Era 1 upgrades auto-purchased');
    if (summary.prestigeCount >= 10 && (state.prestigeCount || 0) < 10) milestones.push('NEW: Starting resources doubled');
    const msg = [
      '--- The Cycle Ends. The Cycle Begins. ---',
      '',
      `Multiplier: x${summary.currentMultiplier.toFixed(1)} → x${summary.newMultiplier.toFixed(1)} (x${summary.bonus.toFixed(1)} bonus)`,
      `Prestige Points: +${summary.points} (total: ${summary.totalPoints})`,
      `Cycle: #${summary.prestigeCount}`,
      '',
      'KEPT: Achievements, prestige upgrades, multiplier, reality keys, lifetime stats',
      'LOST: All resources, upgrades, tech, era progress, mini-game state',
      ...milestones,
      '',
      '"We tried to stop. We could not. Neither will you."',
    ].filter(Boolean).join('\n');
    setConfirmDialog({
      lines: msg.split('\n'),
      onConfirm: () => { updateState(s => performPrestige(s)); setConfirmDialog(null); },
      onCancel: () => setConfirmDialog(null),
    });
  };

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e) => {
    if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA' || document.activeElement?.tagName === 'SELECT') return;
    const tabs = getAvailableTabs(state.era);
    const tabByKey = tabs.find(t => t.key === e.key);
    if (tabByKey) {
      // Don't switch tabs on 0-3 keys during hack challenge
      if (state.hackChallenge && ['0','1','2','3'].includes(e.key)) return;
      setActiveTab(tabByKey.id);
      return;
    }
    if (e.key === '?') {
      setShowHelp(h => !h);
      return;
    }
    if (e.code === 'Space') {
      e.preventDefault();
      // Check cooldown client-side to avoid unnecessary state updates
      if ((state.totalTime || 0) - (state.lastMineTime || 0) < 0.5) return;
      updateState(s => {
        const result = mine(s);
        const newState = {
          ...result.state,
          totalGems: result.foundGem ? (result.state.totalGems || 0) + 1 : (result.state.totalGems || 0),
        };
        if (result.foundGem) {
          newState.eventLog = [...(newState.eventLog || []), {
            message: 'Gem found! Massive material bonus!',
            time: newState.totalTime,
          }].slice(-20);
        }
        return newState;
      });
    }
  }, [state.era, state.hackChallenge, updateState]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const prestigeBonus = calculatePrestigeBonus(state);
  const tabs = getAvailableTabs(state.era);

  // Badge counts for tabs
  const affordableUpgrades = getAvailableUpgrades(state).filter(u => canAfford(state, getUpgradeCost(state, u.id))).length;
  const affordableTech = getAvailableTech(state).filter(t => canAfford(state, t.cost)).length;
  const activeEffectCount = (state.activeEffects || []).length;

  // Mini-game definitions with era requirements
  const miniGameDefs = [
    { id: 'mining', label: 'Mining', era: 1, desc: 'Click to mine materials and find gems' },
    { id: 'factory', label: 'Factory', era: 2, desc: 'Assign workers to production lines' },
    { id: 'hacking', label: 'Hacking', era: 3, desc: 'Memory puzzle for data/software boost' },
    { id: 'docking', label: 'Docking', era: 4, desc: 'Timing game for fuel and infra' },
    { id: 'colony', label: 'Colonies', era: 5, desc: 'Manage colony focus for bonuses' },
    { id: 'starChart', label: 'Star Chart', era: 6, desc: 'Connect systems for passive bonuses' },
    { id: 'dyson', label: 'Dyson', era: 7, desc: 'Build sphere segments for forge output' },
    { id: 'senate', label: 'Senate', era: 8, desc: 'Allocate influence to factions' },
    { id: 'weaving', label: 'Weaving', era: 8, desc: 'Match reality fragments for boosts' },
    { id: 'tuning', label: 'Tuning', era: 9, desc: 'Match cosmic frequencies for power' },
    { id: 'realityForge', label: 'Forge', era: 10, desc: 'Craft keys for permanent bonuses' },
  ];

  const availableMiniGames = miniGameDefs.filter(g => state.era >= g.era);

  // Auto-select newest mini-game only when the era actually changes
  useEffect(() => {
    if (state.era !== prevEraRef.current) {
      const available = miniGameDefs.filter(g => state.era >= g.era);
      const newGames = available.filter(g => g.era === state.era);
      if (newGames.length > 0) {
        setActiveMiniGame(newGames[newGames.length - 1].id);
      }
      prevEraRef.current = state.era;
    }
  }, [state.era]);

  // Render the selected mini-game panel
  const getMiniGamePanel = () => {
    const miniGameComponents = {
      mining: <MiningPanel key="mining" state={state} onUpdate={updateState} />,
      factory: <FactoryPanel key="factory" state={state} onUpdate={updateState} />,
      hacking: <HackingPanel key="hacking" state={state} onUpdate={updateState} />,
      docking: <DockingPanel key="docking" state={state} onUpdate={updateState} />,
      colony: <ColonyPanel key="colony" state={state} onUpdate={updateState} />,
      starChart: <StarChartPanel key="starChart" state={state} onUpdate={updateState} />,
      dyson: <DysonPanel key="dyson" state={state} onUpdate={updateState} />,
      senate: <SenatePanel key="senate" state={state} onUpdate={updateState} />,
      weaving: <WeavingPanel key="weaving" state={state} onUpdate={updateState} />,
      tuning: <TuningPanel key="tuning" state={state} onUpdate={updateState} />,
      realityForge: <RealityForgePanel key="realityForge" state={state} onUpdate={updateState} />,
    };

    return (
      <>
        {availableMiniGames.length > 1 && (
          <div className="mini-game-tabs" role="tablist" aria-label="Mini-game tabs" style={{ display: 'flex', gap: '2px', marginBottom: '6px', overflowX: 'auto', paddingBottom: '4px', WebkitOverflowScrolling: 'touch' }}>
            {availableMiniGames.map(g => (
              <button
                key={g.id}
                className={`tab-btn ${activeMiniGame === g.id ? 'active' : ''}`}
                onClick={() => setActiveMiniGame(g.id)}
                style={{ padding: '3px 6px', fontSize: '0.7em', whiteSpace: 'nowrap', minWidth: 'auto' }}
                role="tab"
                aria-selected={activeMiniGame === g.id}
                aria-label={`Switch to ${g.label} mini-game`}
                title={`${g.label}: ${g.desc}`}
              >
                {g.label}
              </button>
            ))}
          </div>
        )}
        {miniGameComponents[activeMiniGame] || miniGameComponents.mining}
      </>
    );
  };

  return (
    <div className={`game-container era-${state.era} ${shakeClass} ${flashClass}`}>
      <header className="game-header">
        <h1>The Ruins Remember{state.era > 1 && <span style={{ fontSize: '0.5em', color: '#888', marginLeft: '8px' }}>Era {state.era}: {eraNames[state.era]}</span>}</h1>
        <div className="header-controls">
          {state.era >= ERA_COUNT && !state.prestigeUpgrades?.eternalReturn && (
            <button className="prestige-btn" onClick={handlePrestige}>
              Prestige (x{prestigeBonus.toFixed(1)} bonus)
            </button>
          )}
          <button className="reset-btn" aria-label="Show help" onClick={() => setShowHelp(h => !h)} title="Help (?)">?</button>
          <button className="reset-btn" aria-label={audioMuted ? 'Unmute audio' : 'Mute audio'} onClick={() => setAudioMuted(m => !m)} title={audioMuted ? 'Sound OFF' : 'Sound ON'}>
            {audioMuted ? 'Sound OFF' : 'Sound ON'}
          </button>
          <button className="reset-btn" aria-label="Export save file" onClick={() => {
            const save = localStorage.getItem('incremental-game-save');
            if (save) {
              const blob = new Blob([save], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url; a.download = 'the-ruins-remember-save.json';
              a.click(); URL.revokeObjectURL(url);
            }
          }}>
            Export
          </button>
          <button className="reset-btn" aria-label="Import save file" onClick={() => {
            const input = document.createElement('input');
            input.type = 'file'; input.accept = '.json';
            input.onchange = (e) => {
              const file = e.target.files[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = (ev) => {
                try {
                  const data = JSON.parse(ev.target.result);
                  if (data.era && data.resources) {
                    const migrated = migrateState(data);
                    localStorage.setItem('incremental-game-save', JSON.stringify({ ...migrated, lastSaved: Date.now() }));
                    window.location.reload();
                  }
                } catch { alert('Invalid save file'); }
              };
              reader.readAsText(file);
            };
            input.click();
          }}>
            Import
          </button>
          <button className="reset-btn" aria-label="Hard reset all progress" onClick={() => {
            setConfirmDialog({
              lines: ['Hard reset?', 'This erases ALL progress including prestige upgrades!'],
              onConfirm: () => { resetSave(); setConfirmDialog(null); },
              onCancel: () => setConfirmDialog(null),
            });
          }}>
            Reset
          </button>
        </div>
      </header>

      <OfflineReport report={offlineReport} onDismiss={dismissOfflineReport} />
      {!hintsDismissed && state.totalTime < 60 && Object.keys(state.upgrades).length === 0 && (
        <div className="keyboard-hints" style={{ textAlign: 'center', fontSize: '0.9em', color: '#c8a850', padding: '6px 0', opacity: Math.max(0.3, 1 - state.totalTime / 60) }}>
          Click the +1 buttons to gather resources | Buy upgrades on the right | Press Space to mine
          <button onClick={() => setHintsDismissed(true)} style={{ cursor: 'pointer', marginLeft: '8px', color: '#888', fontSize: '1.1em', background: 'none', border: 'none', padding: '2px 4px', fontFamily: 'inherit', lineHeight: 1 }} aria-label="Dismiss hints" title="Dismiss hints">&times;</button>
        </div>
      )}
      <EraTransition era={state.era} />
      <Toast state={state} />
      <EraProgress state={state} />
      {!hintsDismissed && state.totalTime >= 60 && state.totalTime < 180 && Object.keys(state.upgrades || {}).length < 5 && (
        <div style={{ textAlign: 'center', fontSize: '0.85em', color: '#998866', padding: '4px 0', position: 'relative' }}>
          Press Space to mine for materials | Switch to Mini-Game tab (key 3) for more
          <button onClick={() => setHintsDismissed(true)} style={{ cursor: 'pointer', marginLeft: '8px', color: '#888', fontSize: '1.1em', background: 'none', border: 'none', padding: '2px 4px', fontFamily: 'inherit', lineHeight: 1 }} aria-label="Dismiss hints" title="Dismiss hints">&times;</button>
        </div>
      )}

      <main className="game-layout">
        <div className="left-column">
          <GameCanvas state={state} onUpdate={updateState} />
          <ResourcePanel state={state} onUpdate={updateState} />
          <EventLog state={state} />
        </div>
        <div className="right-column">
          <div className="tab-bar" role="tablist" aria-label="Game tabs">
            {tabs.map(tab => {
              let badge = 0;
              if (tab.id === 'upgrades') badge = affordableUpgrades;
              if (tab.id === 'tech') badge = affordableTech;
              if (tab.id === 'mini') badge = activeEffectCount;
              if (tab.id === 'prestige') {
                badge = state.prestigePoints || 0;
                // Show notification dot when prestige is available
                if (state.era >= ERA_COUNT && badge === 0) badge = '!';
              }
              if (tab.id === 'trading') badge = 0; // no badge — total trades not actionable
              if (tab.id === 'stats') badge = 0; // no badge — achievement count not actionable
              return (
                <button
                  key={tab.id}
                  className={`tab-btn ${activeTab === tab.id ? 'active' : ''} ${tab.id === 'mini' && state.totalGems === 0 && state.era >= 1 && (state.totalTime || 0) < 120 ? 'mini-game-pulse' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                  title={`Press ${tab.key}`}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  aria-controls={`tabpanel-${tab.id}`}
                  id={`tab-${tab.id}`}
                >
                  {tab.label}
                  {(badge > 0 || badge === '!') && <span className="tab-badge" aria-label={`${badge} available`}>{badge}</span>}
                </button>
              );
            })}
          </div>
          <div className="tab-content" role="tabpanel" id={`tabpanel-${activeTab}`} aria-labelledby={`tab-${activeTab}`}>
            {activeTab === 'upgrades' && (
              <UpgradePanel state={state} onUpdate={updateState} />
            )}
            {activeTab === 'tech' && (
              <TechTree state={state} onUpdate={updateState} />
            )}
            {activeTab === 'mini' && getMiniGamePanel()}
            {activeTab === 'trading' && state.era >= 4 && (
              <TradingPanel state={state} onUpdate={updateState} />
            )}
            {activeTab === 'prestige' && (
              <PrestigePanel state={state} onUpdate={updateState} />
            )}
            {activeTab === 'stats' && (
              <StatsPanel state={state} />
            )}
          </div>
        </div>
      </main>
      {showHelp && <HelpOverlay onClose={() => setShowHelp(false)} />}
      {!victoryDismissed && (state.gameComplete || state.trueEnding) && (
        <VictoryScreen state={state} onDismiss={() => setVictoryDismissed(true)} />
      )}
      {confirmDialog && (
        <div className="confirm-overlay" onClick={confirmDialog.onCancel}>
          <div className="confirm-dialog" onClick={e => e.stopPropagation()} role="alertdialog" aria-modal="true" aria-label="Confirmation">
            <div className="confirm-body">
              {confirmDialog.lines.map((line, i) => (
                <div key={i} style={line === '' ? { height: '0.5em' } : undefined}>{line}</div>
              ))}
            </div>
            <div className="confirm-actions">
              <button className="confirm-yes" onClick={confirmDialog.onConfirm} autoFocus>Confirm</button>
              <button className="confirm-no" onClick={confirmDialog.onCancel}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      <footer style={{ textAlign: 'center', fontSize: '0.6em', color: '#444', padding: '8px 0 4px' }}>
        v1.0 — Era {state.era} | {Object.keys(state.upgrades || {}).length} upgrades | {Object.keys(state.achievements || {}).length} achievements
        {(state.prestigeCount || 0) > 0 && ` | Cycle ${state.prestigeCount}`}
        {state.prestigeMultiplier > 1 && ` (x${formatNumber(getEffectivePrestige(state.prestigeMultiplier))})`}
      </footer>
    </div>
  );
}
