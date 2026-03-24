function formatTimeAgo(eventTime, currentTime) {
  const diff = Math.floor(currentTime - eventTime);
  if (diff < 5) return 'just now';
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function getEventStyle(entry) {
  const message = typeof entry === 'string' ? entry : entry?.message;
  if (!message) return { icon: '*', color: '#888' };
  if (entry?.isLore) return { icon: '\u270E', color: '#bb88ff' };
  if (message.startsWith('Achievement')) return { icon: '\u2605', color: '#66cc66' };
  if (message.startsWith('ERA') || message.includes('era'))
    return { icon: '\u2191', color: '#ffcc44' };
  if (message.includes('Gem') || message.includes('gem'))
    return { icon: '\u25C6', color: '#ffdd44' };
  if (message.includes('boost') || message.includes('surge') || message.includes('Frenzy') ||
      message.includes('Lucky') || message.includes('Burst') || message.includes('bonus'))
    return { icon: '\u26A1', color: '#88bbff' };
  return { icon: '\u25CF', color: '#888' };
}

export function EventLog({ state }) {
  const log = state.eventLog || [];
  const activeEffects = state.activeEffects || [];

  if (log.length === 0 && activeEffects.length === 0) return null;

  return (
    <div className="panel event-panel" role="log" aria-label="Game events">
      <h2>Events{activeEffects.length > 0 ? ` (${activeEffects.length} active)` : log.length > 0 ? ` (${log.length} recent)` : ''}</h2>
      {activeEffects.length > 0 && (
        <div className="active-effects">
          {activeEffects.map((effect, i) => {
            const remaining = Math.max(0, effect.endsAt - state.totalTime);
            const duration = effect.duration || (effect.startedAt ? (effect.endsAt - effect.startedAt) : 60);
            const progress = remaining / Math.max(duration, 1);
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
        {log.slice(-8).reverse().map((entry, i) => {
          const style = getEventStyle(entry);
          return (
            <div key={i} className="event-entry" style={{ opacity: 1 - i * 0.1 }}>
              <span style={{ color: style.color, marginRight: '4px', fontSize: '0.9em' }}>{style.icon}</span>
              <span className="event-time">{formatTimeAgo(entry.time, state.totalTime)}</span>
              <span className="event-message" style={{ color: style.color !== '#888' ? style.color : undefined }}>{entry.message}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
