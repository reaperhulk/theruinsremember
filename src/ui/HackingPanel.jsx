import { useState, useEffect, useRef, useCallback } from 'react';
import { startHack, submitHack } from '../engine/hacking.js';

const SYMBOLS = ['0', '1', '2', '3'];
const SHOW_TIME = 2000; // ms to show sequence before hiding

export function HackingPanel({ state, onUpdate }) {
  const [playerInput, setPlayerInput] = useState([]);
  const [lastResult, setLastResult] = useState(null);
  const [sequenceVisible, setSequenceVisible] = useState(true);
  const [countdown, setCountdown] = useState(0);
  const [flashClass, setFlashClass] = useState('');
  const timerRef = useRef(null);
  const countdownRef = useRef(null);
  const flashRef = useRef(null);
  const challenge = state.hackChallenge;
  const successes = state.hackSuccesses || 0;
  const difficulty = state.hackDifficulty || 0;

  // When a new challenge starts, show sequence briefly then hide
  // Also run a countdown timer so the player knows how long they have
  useEffect(() => {
    if (challenge) {
      const hideMs = Math.max(1000, SHOW_TIME - difficulty * 100);
      setSequenceVisible(true);
      setCountdown(hideMs / 1000);

      // Countdown interval updates every 100ms
      countdownRef.current = setInterval(() => {
        setCountdown(prev => {
          const next = prev - 0.1;
          return next > 0 ? next : 0;
        });
      }, 100);

      timerRef.current = setTimeout(() => {
        setSequenceVisible(false);
        clearInterval(countdownRef.current);
        setCountdown(0);
      }, hideMs);
      return () => {
        clearTimeout(timerRef.current);
        clearInterval(countdownRef.current);
      };
    }
  }, [challenge?.sequence?.join(',')]);

  const handleStart = () => {
    setPlayerInput([]);
    setLastResult(null);
    setSequenceVisible(true);
    onUpdate(s => startHack(s));
  };

  const handleSymbol = useCallback((sym) => {
    const newInput = [...playerInput, sym];
    setPlayerInput(newInput);

    if (challenge && newInput.length === challenge.sequence.length) {
      onUpdate(s => {
        const { state: newState, success } = submitHack(s, newInput);
        setLastResult(success ? 'success' : 'fail');
        clearTimeout(flashRef.current);
        setFlashClass(success ? 'hack-success-flash' : 'hack-fail-flash');
        flashRef.current = setTimeout(() => setFlashClass(''), 500);
        setPlayerInput([]);
        return newState;
      });
    }
  }, [playerInput, challenge, onUpdate]);

  useEffect(() => {
    if (!challenge) return;
    const handler = (e) => {
      if (['0','1','2','3'].includes(e.key)) {
        handleSymbol(e.key);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [challenge, handleSymbol]);

  return (
    <div className={`panel hacking-panel ${flashClass}`}>
      <h2>Hacking ({successes} completed)</h2>
      <div className="hack-info">
        <span>Hacks: {successes}</span>
        <span>Difficulty: {difficulty}</span>
      </div>
      <div style={{ height: '6px', background: '#222', borderRadius: '3px', margin: '4px 0' }} title={`Difficulty ${difficulty}/10 — longer sequences, less time to memorize`}>
        <div style={{
          height: '100%',
          width: `${(difficulty / 10) * 100}%`,
          background: difficulty >= 8 ? '#ff4444' : difficulty >= 5 ? '#ffaa44' : '#44aa44',
          borderRadius: '3px',
          transition: 'width 0.3s ease',
        }} />
      </div>
      {!challenge ? (
        <div>
          {lastResult && (
            <div className={`hack-result ${lastResult}`}>
              {lastResult === 'success' ? 'Hack successful! Data & software boosted!' : 'Hack failed...'}
            </div>
          )}
          <button className="mine-btn" onClick={handleStart} aria-label="Start a new hacking challenge">
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
            {sequenceVisible && countdown > 0 && (
              <span className="hack-timer">({countdown.toFixed(1)}s)</span>
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
              <button key={sym} className="hack-btn" onClick={() => handleSymbol(sym)} aria-label={`Enter symbol ${sym}`}>
                {sym}
              </button>
            ))}
          </div>
          <div className="hack-reward">
            x{challenge.multiplier.toFixed(1)} Data & Software for {state.prestigeUpgrades?.hackMaster ? 60 : 30}s
            {difficulty > 0 && <span style={{ color: '#888' }}> (difficulty {difficulty})</span>}
          </div>
        </div>
      )}
      <p className="mining-hint">Memorize the pattern, then enter it from memory | Keys: 0-3</p>
    </div>
  );
}
