import { useState, useEffect, useCallback, useRef } from 'react';
import { createInitialState } from '../engine/state.js';
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
import { TradingPanel } from './TradingPanel.jsx';
import { StatsPanel } from './StatsPanel.jsx';
import { PrestigePanel } from './PrestigePanel.jsx';
import { EraTransition } from './EraTransition.jsx';
import { Toast } from './Toast.jsx';
import { OfflineReport } from './OfflineReport.jsx';
import { performPrestige, calculatePrestigeBonus, calculatePrestigePoints, getPrestigeSummary } from '../engine/prestige.js';
import { ERA_COUNT, eraNames } from '../engine/eras.js';
import { getAvailableUpgrades, getUpgradeCost } from '../engine/upgrades.js';
import { getAvailableTech } from '../engine/tech.js';
import { canAfford } from '../engine/resources.js';
import { upgrades as upgradeDefs } from '../data/upgrades.js';
import { LORE_UPGRADE_IDS } from '../data/lore.js';

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
  const [shakeClass, setShakeClass] = useState('');
  const [flashClass, setFlashClass] = useState('');
  const [hintsDismissed, setHintsDismissed] = useState(false);
  const prevEventsRef = useRef(state.eventLog?.length || 0);
  const prevPerfectsRef = useRef(state.dockingPerfects || 0);

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

  // Event flash on new events
  useEffect(() => {
    const events = state.eventLog?.length || 0;
    if (events > prevEventsRef.current) {
      setFlashClass('event-flash');
      const t = setTimeout(() => setFlashClass(''), 500);
      prevEventsRef.current = events;
      return () => clearTimeout(t);
    }
    prevEventsRef.current = events;
  }, [state.eventLog?.length]);

  const handlePrestige = () => {
    if (state.era < ERA_COUNT) return;
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
      'KEPT: Achievements, prestige upgrades, multiplier, lifetime stats',
      'LOST: All resources, upgrades, tech, era progress, mini-game state',
      ...milestones,
      '',
      '"We tried to stop. We could not. Neither will you."',
    ].filter(Boolean).join('\n');
    if (!confirm(msg)) return;
    updateState(s => performPrestige(s));
  };

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
    const tabs = getAvailableTabs(state.era);
    const tabByKey = tabs.find(t => t.key === e.key);
    if (tabByKey) {
      // Don't switch tabs on 0-3 keys during hack challenge
      if (state.hackChallenge && ['0','1','2','3'].includes(e.key)) return;
      setActiveTab(tabByKey.id);
      return;
    }
    if (e.code === 'Space') {
      e.preventDefault();
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

  // Get the active mini-game panel based on era
  const getMiniGamePanel = () => {
    const panels = [];
    panels.push(<MiningPanel key="mining" state={state} onUpdate={updateState} />);
    if (state.era >= 2) panels.push(<FactoryPanel key="factory" state={state} onUpdate={updateState} />);
    if (state.era >= 3) panels.push(<HackingPanel key="hacking" state={state} onUpdate={updateState} />);
    if (state.era >= 4) panels.push(<DockingPanel key="docking" state={state} onUpdate={updateState} />);
    if (state.era >= 5) panels.push(<ColonyPanel key="colony" state={state} onUpdate={updateState} />);
    if (state.era >= 6) panels.push(<StarChartPanel key="starChart" state={state} onUpdate={updateState} />);
    if (state.era >= 8) panels.push(<WeavingPanel key="weaving" state={state} onUpdate={updateState} />);
    return panels;
  };

  return (
    <div className={`game-container era-${state.era} ${shakeClass} ${flashClass}`}>
      <header className="game-header">
        <h1>Planet to Multiverse{state.era > 1 && <span style={{ fontSize: '0.5em', color: '#888', marginLeft: '8px' }}>Era {state.era}: {eraNames[state.era]}</span>}</h1>
        <div className="header-controls">
          {state.era >= ERA_COUNT && (
            <button className="prestige-btn" onClick={handlePrestige}>
              Prestige (x{prestigeBonus.toFixed(1)} bonus)
            </button>
          )}
          <button className="reset-btn" aria-label="Export save file" onClick={() => {
            const save = localStorage.getItem('incremental-game-save');
            if (save) {
              const blob = new Blob([save], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url; a.download = 'planet-to-multiverse-save.json';
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
                    localStorage.setItem('incremental-game-save', ev.target.result);
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
          <button className="reset-btn" aria-label="Hard reset all progress" onClick={() => { if (confirm('Hard reset?\nThis erases ALL progress including prestige upgrades!')) resetSave(); }}>
            Reset
          </button>
        </div>
      </header>

      <OfflineReport report={offlineReport} onDismiss={dismissOfflineReport} />
      {!hintsDismissed && state.totalTime < 30 && Object.keys(state.upgrades).length === 0 && (
        <div className="keyboard-hints" style={{ textAlign: 'center', fontSize: '0.75em', color: '#666', padding: '4px 0', opacity: Math.max(0, 1 - state.totalTime / 30) }}>
          Click resources to gather | Buy upgrades to boost production | Space to mine
          <button onClick={() => setHintsDismissed(true)} style={{ cursor: 'pointer', marginLeft: '8px', color: '#888', fontSize: '1.1em', background: 'none', border: 'none', padding: '2px 4px', fontFamily: 'inherit', lineHeight: 1 }} aria-label="Dismiss hints" title="Dismiss hints">&times;</button>
        </div>
      )}
      <EraTransition era={state.era} />
      <Toast state={state} />
      <EraProgress state={state} />
      {!hintsDismissed && state.totalTime < 180 && Object.keys(state.upgrades || {}).length < 5 && (
        <div style={{ textAlign: 'center', fontSize: '0.75em', color: '#666', padding: '2px 0', position: 'relative' }}>
          Gather resources by clicking +1 buttons. Buy upgrades to automate production.
          <button onClick={() => setHintsDismissed(true)} style={{ cursor: 'pointer', marginLeft: '8px', color: '#888', fontSize: '1.1em', background: 'none', border: 'none', padding: '2px 4px', fontFamily: 'inherit', lineHeight: 1 }} aria-label="Dismiss hints" title="Dismiss hints">&times;</button>
        </div>
      )}

      <div className="game-layout">
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
                  className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
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
      </div>
      <footer style={{ textAlign: 'center', fontSize: '0.6em', color: '#333', padding: '8px 0 4px' }}>
        v1.0 — {Object.keys(state.upgrades || {}).length} upgrades | {Object.keys(state.tech || {}).length} tech | {Object.keys(state.achievements || {}).length} achievements | Era {state.era}
        {state.prestigeMultiplier > 1 && ` | x${state.prestigeMultiplier.toFixed(1)}`}
        {` | ${Math.floor(Object.keys(state.upgrades || {}).length / Object.keys(upgradeDefs).length * 100)}% complete`}
        {(() => {
          const found = LORE_UPGRADE_IDS.filter(id => state.upgrades?.[id]).length;
          return found > 0 ? <span style={{ color: '#998866' }}>{` | Codex: ${found}/${LORE_UPGRADE_IDS.length}`}</span> : null;
        })()}
      </footer>
    </div>
  );
}
