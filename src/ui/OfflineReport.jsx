function formatNumber(n) {
  if (n >= 1e12) return (n / 1e12).toFixed(1) + 'T';
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return n.toFixed(1);
}

function formatTime(seconds) {
  if (seconds < 60) return `${Math.floor(seconds)}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.floor(seconds % 60)}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

export function OfflineReport({ report, onDismiss }) {
  if (!report) return null;

  const gains = Object.entries(report.gains).filter(([, v]) => v > 0.1);

  return (
    <div className="offline-overlay" onClick={onDismiss}>
      <div className="offline-report" onClick={e => e.stopPropagation()}>
        <h2>Welcome Back!</h2>
        <p className="offline-time">You were away for {formatTime(report.elapsed)}</p>
        {gains.length > 0 && (
          <>
            <h3>Resources Earned</h3>
            <div className="offline-gains">
              {gains.map(([id, amount]) => (
                <div key={id} className="offline-gain-row">
                  <span>{id}</span>
                  <span className="offline-gain-amount">+{formatNumber(amount)}</span>
                </div>
              ))}
            </div>
          </>
        )}
        <button className="mine-btn" onClick={onDismiss}>Continue</button>
      </div>
    </div>
  );
}
