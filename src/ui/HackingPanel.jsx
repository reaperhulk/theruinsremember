import { useState, useEffect, useRef } from 'react';
import { startHack, submitHack } from '../engine/hacking.js';

const SYMBOLS = ['0', '1', '2', '3'];
const SHOW_TIME = 2000; // ms to show sequence before hiding

export function HackingPanel({ state, onUpdate }) {
  const [playerInput, setPlayerInput] = useState([]);
  const [lastResult, setLastResult] = useState(null);
  const [sequenceVisible, setSequenceVisible] = useState(true);
  const timerRef = useRef(null);
  const challenge = state.hackChallenge;
  const successes = state.hackSuccesses || 0;
  const difficulty = state.hackDifficulty || 0;

  // When a new challenge starts, show sequence briefly then hide
  useEffect(() => {
    if (challenge) {
      setSequenceVisible(true);
      timerRef.current = setTimeout(() => {
        setSequenceVisible(false);
      }, SHOW_TIME - difficulty * 100); // Harder = less time to memorize (min 1s)
      return () => clearTimeout(timerRef.current);
    }
  }, [challenge?.sequence?.join(',')]);

  const handleStart = () => {
    setPlayerInput([]);
    setLastResult(null);
    setSequenceVisible(true);
    onUpdate(s => startHack(s));
  };

  const handleSymbol = (sym) => {
    const newInput = [...playerInput, sym];
    setPlayerInput(newInput);

    if (challenge && newInput.length === challenge.sequence.length) {
      onUpdate(s => {
        const { state: newState, success } = submitHack(s, newInput);
        setLastResult(success ? 'success' : 'fail');
        setPlayerInput([]);
        return newState;
      });
    }
  };

  const showTime = Math.max(1, (SHOW_TIME - difficulty * 100) / 1000);

  return (
    <div className="panel hacking-panel">
      <h2>Hacking</h2>
      <div className="hack-info">
        <span>Hacks: {successes}</span>
        <span>Difficulty: {difficulty}</span>
      </div>
      {!challenge ? (
        <div>
          {lastResult && (
            <div className={`hack-result ${lastResult}`}>
              {lastResult === 'success' ? 'Hack successful! Data & software boosted!' : 'Hack failed...'}
            </div>
          )}
          <button className="mine-btn" onClick={handleStart}>
            Start Hack
          </button>
        </div>
      ) : (
        <div className="hack-challenge">
          <div className="hack-sequence">
            <span className="sequence-label">Match: </span>
            {challenge.sequence.map((s, i) => (
              <span key={i} className="hack-symbol">
                {sequenceVisible ? s : '?'}
              </span>
            ))}
            {sequenceVisible && (
              <span className="hack-timer">({showTime.toFixed(1)}s)</span>
            )}
          </div>
          <div className="hack-input">
            <span className="sequence-label">Input: </span>
            {playerInput.map((s, i) => (
              <span key={i} className="hack-symbol entered">{s}</span>
            ))}
            {Array(challenge.sequence.length - playerInput.length).fill(0).map((_, i) => (
              <span key={`empty-${i}`} className="hack-symbol empty">_</span>
            ))}
          </div>
          <div className="hack-buttons">
            {SYMBOLS.map(sym => (
              <button key={sym} className="hack-btn" onClick={() => handleSymbol(sym)}>
                {sym}
              </button>
            ))}
          </div>
          <div className="hack-reward">
            Reward: x{challenge.multiplier} data & software for 30s
          </div>
        </div>
      )}
      <p className="mining-hint">Memorize the pattern, then enter it from memory</p>
    </div>
  );
}
