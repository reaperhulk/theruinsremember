import { useState, useRef, memo } from 'react';
import { mine, getGemChance } from '../engine/mining.js';
import { formatNumber } from './format.js';
import { playClick } from './AudioManager.js';

export const MiningPanel = memo(function MiningPanel({ state, onUpdate }) {
  const [lastMined, setLastMined] = useState(null);
  const prevStreakRef = useRef(state.miningStreak || 0);
  const [streakReset, setStreakReset] = useState(false);
  const streak = state.miningStreak || 0;
  const gems = state.totalGems || 0;
  const chance = getGemChance(state) * 100;
  const autoMine = state.prestigeUpgrades?.autoClicker;

  const handleMine = () => {
    playClick();
    const beforeMats = state.resources.materials?.amount || 0;
    onUpdate(s => {
      const { state: newState, foundGem } = mine(s);
      const gained = (newState.resources.materials?.amount || 0) - beforeMats;
      setLastMined({ amount: gained, gem: foundGem });
      setTimeout(() => setLastMined(null), 800);
      // Track streak reset visually
      if (foundGem && prevStreakRef.current > 0) {
        setStreakReset(true);
        setTimeout(() => setStreakReset(false), 600);
      }
      prevStreakRef.current = foundGem ? 0 : (s.miningStreak || 0) + 1;
      const result = {
        ...newState,
        totalGems: foundGem ? (newState.totalGems || 0) + 1 : (newState.totalGems || 0),
      };
      if (foundGem) {
        result.eventLog = [...(result.eventLog || []), {
          message: `Gem found! +${formatNumber(gained)} materials!`,
          time: result.totalTime,
        }].slice(-20);
      }
      return result;
    });
  };

  const miningLore = state.era >= 5
    ? 'You mine where others mined before.'
    : state.era >= 3
    ? 'The veins lead deeper. The ore is already refined.'
    : null;

  return (
    <div className="panel mining-panel">
      <h2>Mining{gems > 0 ? ` (${gems} gems)` : ''}{autoMine && <span className="auto-mine-indicator" style={{ fontSize: '0.6em', color: '#88ff88', marginLeft: '4px', padding: '1px 4px', border: '1px solid #88ff88', borderRadius: '3px' }} title="Auto-mining: 1 mine per second"> AUTO</span>}</h2>
      {miningLore && <p className="text-lore" style={{ fontSize: '0.7em', fontStyle: 'italic', color: '#7799aa', margin: '0 0 4px' }}>{miningLore}</p>}
      <div className="mining-info">
        <span title="Chance to find a gem on next mine">Gem: <strong style={{ color: chance >= 40 ? '#ffdd44' : chance >= 20 ? '#88dd88' : '#aaa' }}>{chance.toFixed(0)}%</strong></span>
        <span title="Consecutive misses increase gem chance by +2% each" style={{ color: streakReset ? '#ffdd44' : '#aaa', transition: 'color 0.3s' }}>Streak: {streak}{streakReset ? ' RESET!' : ''}</span>
        <span title={gems >= 25 ? `Quality bonus: +50% per 25 gems` : 'Find gems for quality bonuses'}>Gems: {gems}{gems >= 25 && <span style={{ color: '#ffdd44' }}> (x{(1 + Math.floor(gems / 25) * 0.5).toFixed(1)})</span>}</span>
      </div>
      <div className="mining-chance-bar" title={`${chance.toFixed(0)}% gem chance — increases with each miss`}>
        <div className="mining-chance-fill" style={{ width: `${chance}%` }} />
      </div>
      <button className="mine-btn" onClick={handleMine} aria-label={`Mine for materials. ${chance.toFixed(0)}% gem chance.`} style={{
        background: `linear-gradient(90deg, #2a4a2a ${chance}%, #1a3a1a ${chance}%)`,
      }}>
        {lastMined ? (
          <span style={{ color: lastMined.gem ? '#ffdd44' : '#88dd88', fontWeight: lastMined.gem ? 'bold' : 'normal' }}>
            +{formatNumber(lastMined.amount)} {lastMined.gem ? 'GEM!' : 'materials'}
          </span>
        ) : (
          <>Mine {streak > 0 && <span style={{ color: '#aaa', fontSize: '0.85em' }}>({streak} streak)</span>}</>
        )}
      </button>
      <p className="mining-hint">
        +2%/miss (max 50%) | Space to mine{autoMine ? ' | Auto-mining 1/s' : ''}
      </p>
    </div>
  );
});
