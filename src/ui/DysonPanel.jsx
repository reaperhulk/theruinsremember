import { memo, useState } from 'react';
import { commissionDysonModule, DYSON_MODULES, getDysonStats } from '../engine/dyson.js';
import { formatNumber } from './format.js';
import { playClick } from './AudioManager.js';

export const DysonPanel = memo(function DysonPanel({ state, onUpdate }) {
  const [lastCommission, setLastCommission] = useState(null);
  const stats = getDysonStats(state);

  const handleCommission = moduleId => {
    playClick();
    const result = commissionDysonModule(state, moduleId);
    if (!result) return;
    onUpdate(() => result.state);
    setLastCommission({ name: result.module.name, reserve: result.reserve, rateAdd: result.rateAdd });
    setTimeout(() => setLastCommission(null), 1200);
  };

  return (
    <div className="panel dyson-panel">
      <div className="dyson-heading">
        <div>
          <span className="panel-kicker">Stellar construction</span>
          <h2>Dyson Assembly</h2>
        </div>
        <strong>{stats.totalModules}/3 commissions{stats.commissionCooldown > 0 ? ` | ${Math.ceil(stats.commissionCooldown)}s` : ''}</strong>
      </div>

      <div className="upgrade-progress-bar" style={{ margin: '7px 0' }}>
        <div className="upgrade-progress-fill" style={{ width: `${Math.min(100, stats.totalModules / 3 * 100)}%` }} />
      </div>

      <div className="dyson-modules" role="group" aria-label="Dyson construction commission">
        {Object.values(DYSON_MODULES).map(module => (
          <button
            key={module.id}
            disabled={stats.remainingModules === 0 || stats.commissionCooldown > 0}
            onClick={() => handleCommission(module.id)}
          >
            <strong>{module.name}</strong>
            <span>{module.description}</span>
            <span>Commissioned: {stats.modules[module.id]}</span>
          </button>
        ))}
      </div>

      {lastCommission && (
        <div className="operation-result success" role="status">
          {lastCommission.name}: +{formatNumber(lastCommission.reserve)} reserve, +{formatNumber(lastCommission.rateAdd)}/s
        </div>
      )}

      <div className="dyson-status">
        <span>{stats.segments} segments</span>
        <span>x{stats.bonusMult.toFixed(1)} assembly value</span>
        <span>{stats.autoRate} automated segments/min</span>
      </div>
      <p className="operation-hint">
        Construction wings recover every 60s | Choose any mix of three modules | Each commission adds 10 segments
      </p>
    </div>
  );
});
