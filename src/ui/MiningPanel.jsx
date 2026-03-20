import { mine, getGemChance } from '../engine/mining.js';

export function MiningPanel({ state, onUpdate }) {
  const streak = state.miningStreak || 0;
  const gems = state.totalGems || 0;
  const chance = getGemChance(state) * 100;
  const autoMine = state.prestigeUpgrades?.autoClicker;

  const handleMine = () => {
    onUpdate(s => {
      const { state: newState, foundGem } = mine(s);
      const result = {
        ...newState,
        totalGems: foundGem ? (newState.totalGems || 0) + 1 : (newState.totalGems || 0),
      };
      if (foundGem) {
        result.eventLog = [...(result.eventLog || []), {
          message: `Gem found! Massive material bonus!`,
          time: result.totalTime,
        }].slice(-10);
      }
      return result;
    });
  };

  return (
    <div className="panel mining-panel">
      <h2>Mining {autoMine && <span style={{ fontSize: '0.6em', color: '#88ff88' }}>[AUTO]</span>}</h2>
      <div className="mining-info">
        <span>Chance: {chance.toFixed(0)}%</span>
        <span>Streak: {streak}</span>
        <span>Gems: {gems}{gems >= 25 && <span style={{ color: '#ffdd44' }}> (x{(1 + Math.floor(gems / 25) * 0.5).toFixed(1)} quality)</span>}</span>
      </div>
      <div className="mining-chance-bar">
        <div className="mining-chance-fill" style={{ width: `${chance}%` }} />
      </div>
      <button className="mine-btn" onClick={handleMine} style={{
        background: `linear-gradient(90deg, #2a4a2a ${chance}%, #1a3a1a ${chance}%)`,
      }}>
        Mine for Gems {streak > 0 && `(${streak} streak)`}
      </button>
      <p className="mining-hint">
        Each miss +2% chance (max 50%) | Space to mine
        {gems > 0 && ` | ${gems} gems = ${(gems * 5).toFixed(0)}x bonus materials`}
      </p>
    </div>
  );
}
