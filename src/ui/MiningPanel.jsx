import { useState } from 'react';
import { mine, getGemChance } from '../engine/mining.js';
import { formatNumber } from './format.js';

export function MiningPanel({ state, onUpdate }) {
  const [lastMined, setLastMined] = useState(null);
  const streak = state.miningStreak || 0;
  const gems = state.totalGems || 0;
  const chance = getGemChance(state) * 100;
  const autoMine = state.prestigeUpgrades?.autoClicker;

  const handleMine = () => {
    const beforeMats = state.resources.materials?.amount || 0;
    onUpdate(s => {
      const { state: newState, foundGem } = mine(s);
      const gained = (newState.resources.materials?.amount || 0) - beforeMats;
      setLastMined({ amount: gained, gem: foundGem });
      setTimeout(() => setLastMined(null), 800);
      const result = {
        ...newState,
        totalGems: foundGem ? (newState.totalGems || 0) + 1 : (newState.totalGems || 0),
      };
      if (foundGem) {
        result.eventLog = [...(result.eventLog || []), {
          message: `Gem found! +${formatNumber(gained)} materials!`,
          time: result.totalTime,
        }].slice(-10);
      }
      return result;
    });
  };

  return (
    <div className="panel mining-panel">
      <h2>Mining{gems > 0 ? ` (${gems} gems)` : ''}{autoMine && <span style={{ fontSize: '0.6em', color: '#88ff88' }}> [AUTO]</span>}</h2>
      <div className="mining-info">
        <span>Chance: {chance.toFixed(0)}%</span>
        <span>Streak: {streak}</span>
        <span>Gems: {gems}{gems >= 25 && <span style={{ color: '#ffdd44' }}> (x{(1 + Math.floor(gems / 25) * 0.5).toFixed(1)})</span>}</span>
      </div>
      <div className="mining-chance-bar">
        <div className="mining-chance-fill" style={{ width: `${chance}%` }} />
      </div>
      <button className="mine-btn" onClick={handleMine} style={{
        background: `linear-gradient(90deg, #2a4a2a ${chance}%, #1a3a1a ${chance}%)`,
      }}>
        {lastMined ? (
          <span style={{ color: lastMined.gem ? '#ffdd44' : '#88dd88' }}>
            +{formatNumber(lastMined.amount)} {lastMined.gem ? '💎 GEM!' : 'materials'}
          </span>
        ) : (
          <>Mine {streak > 0 && `(${streak} streak)`}</>
        )}
      </button>
      <p className="mining-hint">
        +2%/miss (max 50%) | Space to mine{autoMine ? ' | Auto-mining active' : ''}
      </p>
    </div>
  );
}
