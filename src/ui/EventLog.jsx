function formatTimeAgo(eventTime, currentTime) {
  const diff = Math.floor(currentTime - eventTime);
  if (diff < 5) return 'just now';
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export function EventLog({ state }) {
  const log = state.eventLog || [];
  const activeEffects = state.activeEffects || [];

  if (log.length === 0 && activeEffects.length === 0) return null;

  return (
    <div className="panel event-panel">
      <h2>Events{activeEffects.length > 0 && <span className="toggle-purchased"> ({activeEffects.length} active)</span>}{log.length > 0 && <span className="toggle-purchased"> | {log.length} log</span>}</h2>
      {activeEffects.length > 0 && (
        <div className="active-effects">
          {activeEffects.map((effect, i) => {
            const remaining = Math.max(0, effect.endsAt - state.totalTime);
            const progress = remaining / 60; // assume max 60s
            return (
              <div key={i} className="active-effect">
                <span className="effect-icon">*</span>
                <span className="effect-desc">{effect.description}</span>
                <span className="effect-timer">{Math.ceil(remaining)}s</span>
                <div className="effect-bar">
                  <div className="effect-bar-fill" style={{ width: `${Math.min(progress * 100, 100)}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
      <div className="event-log">
        {log.slice(-8).reverse().map((entry, i) => (
          <div key={i} className="event-entry" style={{ opacity: 1 - i * 0.1 }}>
            <span className="event-time">{formatTimeAgo(entry.time, state.totalTime)}</span>
            <span className="event-message">{entry.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
