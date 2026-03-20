import { formatNumber, formatTime } from './format.js';

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
