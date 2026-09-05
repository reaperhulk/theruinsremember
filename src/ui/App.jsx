const ArchivePanel = lazy(() => import('./ArchivePanel.jsx').then(module => ({ default: module.ArchivePanel })));
import { PurchaseGuidance } from './PurchaseGuidance.jsx';
import { GoalsPanel } from './GoalsPanel.jsx';
import { PublicWorksPanel } from './PublicWorksPanel.jsx';
import { RestoredDistricts } from './RestoredDistricts.jsx';
import { serializeSave } from '../engine/saves.js';
import { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { createInitialState } from '../engine/state.js';
import { useGameLoop } from '../hooks/useGameLoop.js';
import { ResourcePanel } from './ResourcePanel.jsx';
import { UpgradePanel } from './UpgradePanel.jsx';
import { TechTree } from './TechTree.jsx';
import { EraProgress } from './EraProgress.jsx';
const GameCanvas = lazy(() => import('./GameCanvas.jsx').then(module => ({ default: module.GameCanvas })));
import { ExpeditionPanel } from './ExpeditionPanel.jsx';
import { DockingPanel } from './DockingPanel.jsx';
const ColonyPanel = lazy(() => import('./ColonyPanel.jsx').then(module => ({ default: module.ColonyPanel })));
const StarChartPanel = lazy(() => import('./StarChartPanel.jsx').then(module => ({ default: module.StarChartPanel })));
const WeavingPanel = lazy(() => import('./WeavingPanel.jsx').then(module => ({ default: module.WeavingPanel })));
const TuningPanel = lazy(() => import('./TuningPanel.jsx').then(module => ({ default: module.TuningPanel })));
const ForgettingPanel = lazy(() => import('./ForgettingPanel.jsx').then(module => ({ default: module.ForgettingPanel })));
const DysonPanel = lazy(() => import('./DysonPanel.jsx').then(module => ({ default: module.DysonPanel })));
import { TradingPanel } from './TradingPanel.jsx';
const SenatePanel = lazy(() => import('./SenatePanel.jsx').then(module => ({ default: module.SenatePanel })));
const RealityForgePanel = lazy(() => import('./RealityForgePanel.jsx').then(module => ({ default: module.RealityForgePanel })));
import { OperationsPanel } from './OperationsPanel.jsx';
import { RelicPanel } from './RelicPanel.jsx';
import { getRelicSlotLimit } from '../engine/relics.js';
import { VictoryScreen } from './VictoryScreen.jsx';
import { HelpOverlay } from './HelpOverlay.jsx';
import { setMuted, playPrestige, setVolumes, setMusicEra, startAmbient, stopAmbient, syncAudioVisibility } from './AudioManager.js';
const StatsPanel = lazy(() => import('./StatsPanel.jsx').then(module => ({ default: module.StatsPanel })));
import { EventLog } from './EventLog.jsx';
const PrestigePanel = lazy(() => import('./PrestigePanel.jsx').then(module => ({ default: module.PrestigePanel })));
import { EraTransition } from './EraTransition.jsx';
import { Toast } from './Toast.jsx';
import { OfflineReport } from './OfflineReport.jsx';
import { performPrestige, calculatePrestigeBonus, getPrestigeSummary } from '../engine/prestige.js';
import { ERA_COUNT, eraNames } from '../engine/eras.js';
import { getAvailableUpgrades, getUpgradeCost } from '../engine/upgrades.js';
import { getAvailableTech } from '../engine/tech.js';
import { canAfford, getEffectivePrestige } from '../engine/resources.js';
import { getAchievementsNearComplete } from '../engine/achievements.js';
import { formatNumber } from './format.js';
import { getCycleReadiness } from '../engine/realityForge.js';
import { getDefaultOperation, getUnlockedOperations } from '../data/operations.js';
import { getActiveSystems } from '../engine/operations.js';
import { CYCLE_DOCTRINES } from '../engine/cycles.js';

const initialState = createInitialState();

const ERA_OMENS = {
  1: 'The wreck still smolders. The stones nearby were cut long before the crash.',
  2: 'Each furnace you raise sits neatly atop a buried one.',
  3: 'The old network hums with messages written for minds like yours.',
  4: 'Orbit is crowded with wreckage from voyages you have not taken yet.',
  5: 'Every colony site carries evidence that someone already failed there.',
  6: 'The beacons are not welcoming you. They are warning whoever comes next.',
  7: 'The unfinished sphere behaves like a machine paused mid-breath.',
  8: 'Across the galaxy, every archive tells the same rise and the same silence.',
  9: 'The laws of reality bend like material under remembered strain.',
  10: 'Every universe you touch feels less discovered than revisited.',
};

// Tab definitions — which tabs are available at which era
function getAvailableTabs(era) {
  const tabs = [
    { id: 'upgrades', label: 'Decisions', sublabel: 'shape the economy', key: '1' },
    { id: 'tech', label: 'Tech', sublabel: 'unlock the next age', key: '2' },
  ];
  if (era >= 5) tabs.push({ id: 'mini', label: 'Operations', sublabel: 'active systems', key: '3' });
  if (era >= 4) tabs.push({ id: 'trading', label: 'Trading', sublabel: 'reroute surplus', key: '4' });
  tabs.push({ id: 'archive', label: 'Archive', sublabel: 'remembered civilizations', key: '7' });
  tabs.push({ id: 'prestige', label: 'Prestige', sublabel: 'bank the cycle', key: '5' });
  tabs.push({ id: 'stats', label: 'Stats', sublabel: 'codex and run data', key: '6' });
  return tabs;
}

export function App() {
  const { state, updateState, resetSave, offlineReport, dismissOfflineReport, saveWarning, restoreBackup, importSave } = useGameLoop(initialState);
  const [activeTab, setActiveTab] = useState('upgrades');
  const [activeOperation, setActiveOperation] = useState(null);
  const prevEraRef = useRef(state.era);
  const keyboardStateRef = useRef(state);
  useEffect(() => {
    keyboardStateRef.current = state;
  }, [state]);
  const [shakeClass, setShakeClass] = useState('');
  const prevLoreCountRef = useRef((state.eventLog || []).filter(e => e.isLore).length);
  const [unseenLoreCount, setUnseenLoreCount] = useState(0);
  const [hintsDismissed, setHintsDismissed] = useState(false);
  const [audioMuted, setAudioMuted] = useState(() => { try { return localStorage.getItem('audioMuted') === 'true'; } catch { return false; } });
  const [audioLevels, setAudioLevels] = useState(() => { try { return JSON.parse(localStorage.getItem('audioLevels')) || { effects: 0.7, music: 0.18 }; } catch { return { effects: 0.7, music: 0.18 }; } });
  const [victoryDismissed, setVictoryDismissed] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const touchStartRef = useRef(null);
  const prevPerfectsRef = useRef(state.dockingPerfects || 0);
  const [saveMenuOpen, setSaveMenuOpen] = useState(false);
  const saveMenuRef = useRef(null);

  // Close the save menu on an outside click or Escape.
  useEffect(() => {
    if (!saveMenuOpen) return;
    const onPointerDown = e => {
      if (saveMenuRef.current && !saveMenuRef.current.contains(e.target)) setSaveMenuOpen(false);
    };
    const onKey = e => { if (e.key === 'Escape') setSaveMenuOpen(false); };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [saveMenuOpen]);

  // Sync audio muted state
  useEffect(() => {
    setMuted(audioMuted);
    try { localStorage.setItem('audioMuted', audioMuted); } catch { /* optional preference */ }
  }, [audioMuted]);

  useEffect(() => {
    setVolumes(audioLevels.effects, audioLevels.music);
    try { localStorage.setItem('audioLevels', JSON.stringify(audioLevels)); } catch { /* optional preference */ }
  }, [audioLevels]);
  useEffect(() => { setMusicEra(state.era); }, [state.era]);
  useEffect(() => {
    const begin = () => { startAmbient(); document.removeEventListener('pointerdown', begin); document.removeEventListener('keydown', begin); };
    const visibility = syncAudioVisibility;
    document.addEventListener('pointerdown', begin);
    document.addEventListener('keydown', begin);
    document.addEventListener('visibilitychange', visibility);
    return () => { document.removeEventListener('pointerdown', begin); document.removeEventListener('keydown', begin); document.removeEventListener('visibilitychange', visibility); stopAmbient(); };
  }, []);

  // Badge the Stats tab when new lore entries arrive
  const currentLoreCount = (state.eventLog || []).filter(e => e.isLore).length;
  useEffect(() => {
    if (currentLoreCount > prevLoreCountRef.current) {
      setUnseenLoreCount(n => n + (currentLoreCount - prevLoreCountRef.current));
    }
    prevLoreCountRef.current = currentLoreCount;
  }, [currentLoreCount]);

  const handleStatsTabClick = () => {
    setActiveTab('stats');
    setUnseenLoreCount(0);
  };

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


  const handlePrestige = () => {
    if (state.era < ERA_COUNT) return;
    if (!getCycleReadiness(state).ready) return;
    // Game is truly complete once Eternal Return is purchased — no more cycles
    if (state.prestigeUpgrades?.eternalReturn) return;
    const summary = getPrestigeSummary(state);
    const milestones = [];
    if (summary.prestigeCount >= 3 && (state.prestigeCount || 0) < 3) milestones.push('NEW: Auto-gather from planetfall');
    if (summary.prestigeCount >= 5 && (state.prestigeCount || 0) < 5) milestones.push('NEW: Era 1 upgrades auto-purchased');
    if (summary.prestigeCount >= 10 && (state.prestigeCount || 0) < 10) milestones.push('NEW: Starting resources doubled');
    const msg = [
      '--- The Cycle Ends. The Cycle Begins. ---',
      '',
      `Multiplier: x${formatNumber(getEffectivePrestige(summary.currentMultiplier))} → x${formatNumber(getEffectivePrestige(summary.newMultiplier))} (x${summary.bonus.toFixed(1)} bonus)`,
      `Prestige Points: +${summary.points}, ${summary.spentPoints} allocated (${summary.totalPoints} remaining)`,
      `Cycle: #${summary.prestigeCount}`,
      `Next doctrine: ${CYCLE_DOCTRINES[state.nextCycleDoctrine]?.name || 'None selected'}`,
      '',
      'KEPT: Archive, research, reconstruction, saved plans, achievements, prestige upgrades, multiplier, reality keys, lifetime stats',
      'LOST: All resources, upgrades, tech, era progress, operation state',
      `LOST: ${state.activeRelics?.length || 0} equipped relics and current Echo Pressure`,
      ...milestones,
      '',
      '"We tried to stop. We could not. Neither will you."',
    ].filter(Boolean).join('\n');
    setConfirmDialog({
      lines: msg.split('\n'),
      onConfirm: () => { updateState(s => performPrestige(s)); playPrestige(); setConfirmDialog(null); },
      onCancel: () => setConfirmDialog(null),
    });
  };

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e) => {
    if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA' || document.activeElement?.tagName === 'SELECT') return;
    const currentState = keyboardStateRef.current;
    const tabs = getAvailableTabs(currentState.era);
    const tabByKey = tabs.find(t => t.key === e.key);
    if (tabByKey) {
      setActiveTab(tabByKey.id);
      return;
    }
    if (e.key === '?') {
      setShowHelp(h => !h);
      return;
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const prestigeBonus = calculatePrestigeBonus(state);
  const cycleReadiness = getCycleReadiness(state);
  const tabs = getAvailableTabs(state.era);

  // Badge counts for tabs
  const affordableUpgrades = getAvailableUpgrades(state).filter(u => canAfford(state, getUpgradeCost(state, u.id))).length;
  const affordableTech = getAvailableTech(state).filter(t => canAfford(state, t.cost)).length;
  const unlockedOperations = getUnlockedOperations(state.era);
  const activeSystemCount = getActiveSystems(state).length;

  // Focus the operation introduced by the current era.
  useEffect(() => {
    if (state.era !== prevEraRef.current) {
      setActiveOperation(getDefaultOperation(state.era));
      prevEraRef.current = state.era;
    }
  }, [state.era]);

  const renderOperation = operationId => {
    const operationComponents = {
      docking: <DockingPanel key="docking" state={state} onUpdate={updateState} />,
      colony: <ColonyPanel key="colony" state={state} onUpdate={updateState} />,
      starChart: <StarChartPanel key="starChart" state={state} onUpdate={updateState} />,
      dyson: <DysonPanel key="dyson" state={state} onUpdate={updateState} />,
      senate: <SenatePanel key="senate" state={state} onUpdate={updateState} />,
      weaving: <WeavingPanel key="weaving" state={state} onUpdate={updateState} />,
      tuning: <TuningPanel key="tuning" state={state} onUpdate={updateState} />,
      forgetting: <ForgettingPanel key="forgetting" state={state} onUpdate={updateState} />,
      realityForge: <RealityForgePanel key="realityForge" state={state} onUpdate={updateState} />,
    };
    return operationComponents[operationId] || null;
  };

  return (
    <div className={`game-container era-${state.era} ${shakeClass}`}>
      <header className="game-header">
        <div className="title-block">
          <h1>The Ruins Remember{state.era > 1 && <span style={{ fontSize: '0.5em', color: '#888', marginLeft: '8px' }}>Era {state.era}: {eraNames[state.era]}</span>}</h1>
          <p className="header-omen">{ERA_OMENS[state.era]}</p>
        </div>
        <div className="header-controls">
          {cycleReadiness.ready && !state.prestigeUpgrades?.eternalReturn && (
            <button className="prestige-btn" onClick={handlePrestige}>
              Prestige (x{prestigeBonus.toFixed(1)} bonus)
            </button>
          )}
          <button className="reset-btn" aria-label="Show help" onClick={() => setShowHelp(h => !h)} title="Help (?)">?</button>
          <button className="reset-btn" aria-label={audioMuted ? 'Unmute audio' : 'Mute audio'} onClick={() => setAudioMuted(m => !m)} title={audioMuted ? 'Sound OFF' : 'Sound ON'}>
            {audioMuted ? 'Sound OFF' : 'Sound ON'}
          </button>
          <details className="audio-controls"><summary>Audio mix</summary>
            <label>Music <input aria-label="Music volume" type="range" min="0" max="1" step="0.05" value={audioLevels.music} onChange={e => setAudioLevels(a => ({ ...a, music: Number(e.target.value) }))} /></label>
            <label>Effects <input aria-label="Effects volume" type="range" min="0" max="1" step="0.05" value={audioLevels.effects} onChange={e => setAudioLevels(a => ({ ...a, effects: Number(e.target.value) }))} /></label>
          </details>
          <div className="save-menu-wrap" ref={saveMenuRef}>
            <button
              className="reset-btn"
              aria-label="Save data menu"
              aria-expanded={saveMenuOpen}
              aria-haspopup="menu"
              onClick={() => setSaveMenuOpen(o => !o)}
              title="Export, import, and reset your save"
            >
              Save ▾
            </button>
            {saveMenuOpen && (
              <div className="save-menu" role="menu">
          <button className="reset-btn" role="menuitem" aria-label="Export save file" onClick={() => {
            const save = serializeSave(state);
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
          <button className="reset-btn" role="menuitem" aria-label="Copy save to clipboard" onClick={() => {
            const save = serializeSave(state);
            if (save) { navigator.clipboard.writeText(save).catch(() => {}); }
          }} title="Copy save data to clipboard">
            Copy
          </button>
          <button className="reset-btn" role="menuitem" aria-label="Import save file" onClick={() => {
            const input = document.createElement('input');
            input.type = 'file'; input.accept = '.json';
            input.onchange = (e) => {
              const file = e.target.files[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = (ev) => {
                try {
                  importSave(ev.target.result);
                } catch { alert('Invalid save file. Please select a valid .json save.'); }
              };
              reader.readAsText(file);
            };
            input.click();
          }}>
            Import
          </button>
          <button className="reset-btn" role="menuitem" aria-label="Paste save from clipboard" onClick={async () => {
            try {
              const text = await navigator.clipboard.readText();
              importSave(text);
            } catch { alert('Clipboard unavailable or invalid save. Use Import to choose an exported file.'); }
          }} title="Import save from clipboard">
            Paste
          </button>
          <button className="reset-btn" role="menuitem" onClick={restoreBackup}>Restore backup</button>
          <button className="reset-btn danger" role="menuitem" aria-label="Hard reset all progress" onClick={() => {
            setConfirmDialog({
              lines: ['Hard reset?', 'This erases ALL progress including prestige upgrades!'],
              onConfirm: () => { resetSave(); setConfirmDialog(null); },
              onCancel: () => setConfirmDialog(null),
            });
          }}>
            Reset
          </button>
              </div>
            )}
          </div>
        </div>
      </header>
      {saveWarning && <div className="save-warning" role="alert">{saveWarning} <button onClick={restoreBackup}>Restore backup</button></div>}
      <div className="control-ribbon">
        <span className="control-chip">Era {state.era}: {eraNames[state.era]}</span>
        <span className="control-chip">{affordableUpgrades} options ready</span>
        <span className="control-chip">{affordableTech} tech options</span>
        <span className="control-chip">{state.activeRelics?.length || 0}/{getRelicSlotLimit(state)} relics | {Math.floor(state.echoPressure || 0)} pressure</span>
        {state.era >= ERA_COUNT && (
          <span className="control-chip">{cycleReadiness.ready ? 'Prestige available' : `Cycle ${cycleReadiness.completed}/${cycleReadiness.total}`}</span>
        )}
        {unlockedOperations.length > 0 && <span className="control-chip">{activeSystemCount}/{unlockedOperations.length} operations engaged</span>}
      </div>

      <OfflineReport report={offlineReport} onDismiss={dismissOfflineReport} />
      {!hintsDismissed && state.totalTime < 60 && Object.keys(state.upgrades).length === 0 && (
        <div className="keyboard-hints" style={{ textAlign: 'center', fontSize: '0.9em', color: '#c8a850', padding: '6px 0', opacity: Math.max(0.3, 1 - state.totalTime / 60) }}>
          Gather the resources you need, choose an expedition route, then make a decision in the Decisions tab
          <button onClick={() => setHintsDismissed(true)} style={{ cursor: 'pointer', marginLeft: '8px', color: '#888', fontSize: '1.1em', background: 'none', border: 'none', padding: '2px 4px', fontFamily: 'inherit', lineHeight: 1 }} aria-label="Dismiss hints" title="Dismiss hints">&times;</button>
        </div>
      )}
      <EraTransition era={state.era} />
      <Toast state={state} />
      {state.era > 4 && <EraProgress state={state} />}
      <PublicWorksPanel state={state} onUpdate={updateState} />
      {!hintsDismissed && state.totalTime >= 60 && state.totalTime < 180 && Object.keys(state.upgrades || {}).length < 5 && (
        <div style={{ textAlign: 'center', fontSize: '0.85em', color: '#998866', padding: '4px 0', position: 'relative' }}>
          Expeditions recover resources and discoveries; discoveries reduce routine build-out
          <button onClick={() => setHintsDismissed(true)} style={{ cursor: 'pointer', marginLeft: '8px', color: '#888', fontSize: '1.1em', background: 'none', border: 'none', padding: '2px 4px', fontFamily: 'inherit', lineHeight: 1 }} aria-label="Dismiss hints" title="Dismiss hints">&times;</button>
        </div>
      )}

      <nav className="mobile-section-links" aria-label="Jump to game section"><a href="#game-actions">Actions</a><a href="#game-resources">Resources and field operations</a></nav>
      <main className={`game-layout ${state.era <= 4 ? 'early-game-layout' : ''}`}>
        <div className="left-column" id="game-resources">
          <Suspense fallback={<div className="scene-placeholder">The ruins emerge…</div>}><GameCanvas state={state} onUpdate={updateState} /></Suspense>
          <RestoredDistricts state={state} />
          <ResourcePanel state={state} onUpdate={updateState} />
          {state.era <= 3 && <ExpeditionPanel state={state} onUpdate={updateState} />}
          {state.era === 4 && <DockingPanel state={state} onUpdate={updateState} />}

          <RelicPanel state={state} onUpdate={updateState} />
          {state.era <= 4 && <EraProgress state={state} />}
          {(state.eventLog?.length > 0 || state.activeEffects?.length > 0) && (
            <EventLog state={state} />
          )}
        </div>
        <div className="right-column" id="game-actions">
          <div className="tab-bar" role="tablist" aria-label="Game tabs" onKeyDown={e => {
            if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
            e.preventDefault();
            const current = tabs.findIndex(t => t.id === activeTab);
            const index = e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : (current + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
            setActiveTab(tabs[index].id);
            document.getElementById(`tab-${tabs[index].id}`)?.focus();
          }}>
            {tabs.map(tab => {
              let badge = 0;
              if (tab.id === 'upgrades') badge = affordableUpgrades;
              if (tab.id === 'tech') badge = affordableTech;
              if (tab.id === 'mini') badge = 0;
              if (tab.id === 'prestige') {
                badge = state.prestigePoints || 0;
                // Show notification dot when prestige is available
                if (state.era >= ERA_COUNT && badge === 0) badge = '!';
              }
              if (tab.id === 'trading') badge = 0; // no badge — total trades not actionable
              if (tab.id === 'stats') badge = unseenLoreCount + getAchievementsNearComplete(state);
              return (
                <button
                  key={tab.id}
                  className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => tab.id === 'stats' ? handleStatsTabClick() : setActiveTab(tab.id)}
                  title={`Press ${tab.key}`}
                  role="tab"
                  tabIndex={activeTab === tab.id ? 0 : -1}
                  aria-selected={activeTab === tab.id}
                  aria-controls={`tabpanel-${tab.id}`}
                  id={`tab-${tab.id}`}
                >
                  <span className="tab-label">{tab.label}</span>
                  <span className="tab-sublabel">{tab.sublabel}</span>
                  {(badge > 0 || badge === '!') && <span className="tab-badge" aria-label={`${badge} available`}>{badge}</span>}
                </button>
              );
            })}
          </div>
          <div
            className="tab-content"
            role="tabpanel"
            id={`tabpanel-${activeTab}`}
            aria-labelledby={`tab-${activeTab}`}
            onTouchStart={e => { touchStartRef.current = e.touches[0].clientX; }}
            onTouchEnd={e => {
              if (touchStartRef.current === null) return;
              const dx = e.changedTouches[0].clientX - touchStartRef.current;
              touchStartRef.current = null;
              if (Math.abs(dx) < 60) return;
              const tabIds = tabs.map(t => t.id);
              const idx = tabIds.indexOf(activeTab);
              if (dx < 0 && idx < tabIds.length - 1) setActiveTab(tabIds[idx + 1]);
              if (dx > 0 && idx > 0) setActiveTab(tabIds[idx - 1]);
            }}
          >
            <Suspense fallback={<div className="panel">Opening the archive…</div>}>
            {activeTab === 'upgrades' && (
              <><PurchaseGuidance state={state} onUpdate={updateState} /><GoalsPanel state={state} onUpdate={updateState} /><UpgradePanel state={state} onUpdate={updateState} /></>
            )}
            {activeTab === 'tech' && (
              <TechTree state={state} onUpdate={updateState} />
            )}
            {activeTab === 'mini' && (
              <OperationsPanel
                state={state}
                activeOperation={activeOperation || getDefaultOperation(state.era)}
                onSelect={setActiveOperation}
                renderOperation={renderOperation}
              />
            )}
            {activeTab === 'trading' && state.era >= 4 && (
              <TradingPanel state={state} onUpdate={updateState} />
            )}
            {activeTab === 'prestige' && (
              <PrestigePanel state={state} onUpdate={updateState} />
            )}
            {activeTab === 'archive' && <ArchivePanel state={state} onUpdate={updateState} />}
          {activeTab === 'stats' && (
              <StatsPanel state={state} />
            )}
            </Suspense>
          </div>
          <div className="shortcut-legend" aria-hidden="true">
            [1–7] tabs &nbsp;·&nbsp; [D] dock &nbsp;·&nbsp; [?] help
          </div>
        </div>
      </main>
      {showHelp && <HelpOverlay onClose={() => setShowHelp(false)} />}
      {!victoryDismissed && (state.gameComplete || state.trueEnding) && (
        <VictoryScreen state={state} onDismiss={() => setVictoryDismissed(true)} />
      )}
      {confirmDialog && (
        <div className="confirm-overlay" onClick={confirmDialog.onCancel} onKeyDown={e => { if (e.key === 'Escape') confirmDialog.onCancel(); }}>
          <div className="confirm-dialog" onClick={e => e.stopPropagation()} role="alertdialog" aria-modal="true" aria-label="Confirmation">
            <div className="confirm-body">
              {confirmDialog.lines.map((line, i) => (
                <div key={i} style={line === '' ? { height: '0.5em' } : undefined}>{line}</div>
              ))}
            </div>
            <div className="confirm-actions">
              <button className="confirm-yes" autoFocus onClick={confirmDialog.onConfirm}>Confirm</button>
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
