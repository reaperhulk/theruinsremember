import { formatNumber, formatTime } from './format.js';

export function VictoryScreen({ state, onDismiss }) {
  if (!state.gameComplete && !state.trueEnding) return null;

  const isTrueEnding = !!state.trueEnding;

  return (
    <div className="era-transition-overlay" onClick={onDismiss} style={{ zIndex: 1002 }}>
      <div className="era-transition-content" style={{ maxWidth: '500px' }}>
        <h2 style={{ fontSize: '1.5em', color: isTrueEnding ? '#e8c040' : '#c8a040', marginBottom: '16px' }}>
          {isTrueEnding ? 'The Eternal Return' : 'The Cycle Completes'}
        </h2>
        <p style={{ color: '#ccaa88', fontStyle: 'italic', marginBottom: '12px', lineHeight: '1.6' }}>
          {isTrueEnding
            ? 'You have purchased every upgrade, unlocked every secret, and closed the loop.'
            : 'You have built everything. You have discovered everything. You have remembered everything.'}
        </p>
        <p style={{ color: '#998866', fontStyle: 'italic', marginBottom: '16px', lineHeight: '1.6' }}>
          The ruins were yours — left by you, in a previous iteration. And the next civilization
          will find what you leave behind, and they will build again, and they will remember again,
          and the cycle will continue, as it always has, as it always will.
        </p>
        <div style={{ fontSize: '0.85em', color: '#888', marginBottom: '16px' }}>
          <div>Prestige cycles: {state.prestigeCount || 0}</div>
          <div>Total play time: {formatTime(state.lifetimePlayTime || state.totalTime || 0)}</div>
          <div>Upgrades purchased: {Object.keys(state.upgrades || {}).length}</div>
          <div>Achievements: {Object.keys(state.achievements || {}).length}</div>
          {state.totalGems > 0 && <div>Gems found: {state.totalGems}</div>}
          {state.dysonSegments > 0 && <div>Dyson segments: {state.dysonSegments}</div>}
        </div>
        <p style={{ color: isTrueEnding ? '#e8c040' : '#c8a040', fontSize: '1.2em', textAlign: 'center', marginBottom: '8px' }}>
          {isTrueEnding ? 'Again. Forever.' : 'Again.'}
        </p>
        <p style={{ fontSize: '0.7em', color: '#555' }}>Click anywhere to continue playing</p>
      </div>
    </div>
  );
}
