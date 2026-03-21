import { formatNumber, formatTime } from './format.js';
import { resources as resourceDefs } from '../data/resources.js';

function resourceName(id) {
  return resourceDefs[id]?.name || id;
}

export function OfflineReport({ report, onDismiss }) {
  if (!report) return null;

  // Show brief loading state for large offline periods
  if (report.processing) {
    return (
      <div className="offline-overlay">
        <div className="offline-report">
          <h2>Processing Offline Progress...</h2>
          <p className="offline-time" style={{ textAlign: 'center', color: '#aaa' }}>Calculating {formatTime(report.elapsed)} of production...</p>
        </div>
      </div>
    );
  }

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
                  <span>{resourceName(id)}</span>
                  <span className="offline-gain-amount">+{formatNumber(amount)}</span>
                </div>
              ))}
            </div>
          </>
        )}
        {gains.length > 0 && (
          <p className="offline-time" style={{ color: '#88cc88' }}>
            Total: +{formatNumber(gains.reduce((s, [, v]) => s + v, 0))} resources earned
          </p>
        )}
        <button className="mine-btn" onClick={onDismiss}>Continue</button>
      </div>
    </div>
  );
}
