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
import { performPrestige, calculatePrestigeBonus } from '../engine/prestige.js';
import { ERA_COUNT } from '../engine/eras.js';
import { getAvailableUpgrades, getUpgradeCost } from '../engine/upgrades.js';
import { getAvailableTech } from '../engine/tech.js';
import { canAfford } from '../engine/resources.js';

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
  const prevEventsRef = useRef(state.eventLog?.length || 0);
  const prevPerfectsRef = useRef(state.dockingPerfects || 0);

  // Screen shake on perfect dock, event flash on new events
  useEffect(() => {
    const perfects = state.dockingPerfects || 0;
    if (perfects > prevPerfectsRef.current) {
      setShakeClass('shake');
      setTimeout(() => setShakeClass(''), 300);
    }
    prevPerfectsRef.current = perfects;

    const events = state.eventLog?.length || 0;
    if (events > prevEventsRef.current) {
      setShakeClass('event-flash');
      setTimeout(() => setShakeClass(''), 500);
    }
    prevEventsRef.current = events;
  }, [state.dockingPerfects, state.eventLog?.length]);

  const handlePrestige = () => {
    if (state.era < ERA_COUNT) return;
    if (!confirm(`Prestige for x${prestigeBonus.toFixed(1)} multiplier?\n\nYou keep: prestige upgrades, achievements\nYou lose: all resources, upgrades, tech, era progress\n\nNew multiplier: x${(state.prestigeMultiplier * prestigeBonus).toFixed(1)}`)) return;
    updateState(s => performPrestige(s));
  };

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
    const tabs = getAvailableTabs(state.era);
    const tabByKey = tabs.find(t => t.key === e.key);
    if (tabByKey) {
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
          }].slice(-10);
        }
        return newState;
      });
    }
  }, [state.era, updateState]);

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
    <div className={`game-container era-${state.era} ${shakeClass}`}>
      <header className="game-header">
        <h1>Planet to Multiverse{state.era > 1 && <span style={{ fontSize: '0.5em', color: '#888', marginLeft: '8px' }}>Era {state.era}</span>}</h1>
        <div className="header-controls">
          {state.era >= ERA_COUNT && (
            <button className="prestige-btn" onClick={handlePrestige}>
              Prestige (x{prestigeBonus.toFixed(1)} bonus)
            </button>
          )}
          <button className="reset-btn" onClick={() => {
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
          <button className="reset-btn" onClick={() => {
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
          <button className="reset-btn" onClick={() => { if (confirm('Hard reset?\nThis erases ALL progress including prestige upgrades!')) resetSave(); }}>
            Reset
          </button>
        </div>
      </header>

      <OfflineReport report={offlineReport} onDismiss={dismissOfflineReport} />
      {state.totalTime < 30 && Object.keys(state.upgrades).length === 0 && (
        <div className="keyboard-hints" style={{ textAlign: 'center', fontSize: '0.75em', color: '#666', padding: '4px 0', opacity: Math.max(0, 1 - state.totalTime / 30) }}>
          Click resources to gather | Buy upgrades to boost production | Space to mine
        </div>
      )}
      <EraTransition era={state.era} />
      <Toast state={state} />
      <EraProgress state={state} />

      <div className="game-layout">
        <div className="left-column">
          <GameCanvas state={state} onUpdate={updateState} />
          <ResourcePanel state={state} onUpdate={updateState} />
          <EventLog state={state} />
        </div>
        <div className="right-column">
          <div className="tab-bar">
            {tabs.map(tab => {
              let badge = 0;
              if (tab.id === 'upgrades') badge = affordableUpgrades;
              if (tab.id === 'tech') badge = affordableTech;
              if (tab.id === 'mini') badge = activeEffectCount;
              if (tab.id === 'prestige') badge = state.prestigePoints || 0;
              if (tab.id === 'stats') badge = Object.keys(state.achievements || {}).length || 0;
              return (
                <button
                  key={tab.id}
                  className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                  title={`Press ${tab.key}`}
                >
                  {tab.label}
                  {badge > 0 && <span className="tab-badge">{badge}</span>}
                </button>
              );
            })}
          </div>
          <div className="tab-content">
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
    </div>
  );
}
