import { useState } from 'react';
import { getUnlockedSystems, getRoutes, createRoute, removeRoute, getRouteBonus, routeExists, getRouteStats } from '../engine/starChart.js';

export function StarChartPanel({ state, onUpdate }) {
  const [selected, setSelected] = useState(null);
  const [hovered, setHovered] = useState(null);
  const systems = getUnlockedSystems(state);
  const routes = getRoutes(state);
  const bonus = getRouteBonus(state);
  const stats = getRouteStats(state);

  const handleSystemClick = (sysId) => {
    if (selected === null) {
      setSelected(sysId);
    } else if (selected === sysId) {
      setSelected(null);
    } else {
      if (routeExists(state, selected, sysId)) {
        onUpdate(s => removeRoute(s, selected, sysId));
      } else {
        onUpdate(s => createRoute(s, selected, sysId));
      }
      setSelected(null);
    }
  };

  return (
    <div className="panel star-chart-panel">
      <h2>Star Chart</h2>
      <div className="dock-info">
        <span>Routes: {routes.length}/10</span>
        <span>Systems: {systems.length}</span>
        {stats.hubSystems > 0 && <span style={{ color: '#88ccff' }}>Hubs: {stats.hubSystems}</span>}
        {stats.allConnected && <span style={{ color: '#ffdd44' }}>All Connected!</span>}
      </div>
      <div className="star-chart">
        <svg viewBox="0 0 100 100" className="star-svg">
          {routes.map((route, i) => {
            const from = systems.find(s => s.id === route.from);
            const to = systems.find(s => s.id === route.to);
            if (!from || !to) return null;
            return (
              <line
                key={i}
                x1={from.x * 100} y1={from.y * 100}
                x2={to.x * 100} y2={to.y * 100}
                stroke="#4488aa" strokeWidth="0.8"
                opacity={0.6 + Math.sin(Date.now() / 1000 + i) * 0.2}
              />
            );
          })}
          {systems.map(sys => {
            const isHovered = hovered === sys.id;
            const isSelected = selected === sys.id;
            const bonusText = Object.entries(sys.bonus)
              .map(([r, v]) => `${r}: +${v}`)
              .join(', ');
            return (
            <g
              key={sys.id}
              onClick={() => handleSystemClick(sys.id)}
              onMouseEnter={() => setHovered(sys.id)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: 'pointer' }}
            >
              <circle
                cx={sys.x * 100} cy={sys.y * 100}
                r={isSelected ? 3 : isHovered ? 2.5 : 2}
                fill={isSelected ? '#ffdd44' : isHovered ? '#bbddff' : '#88ccff'}
              />
              <text
                x={sys.x * 100} y={sys.y * 100 - 4}
                fill="#aaddff" fontSize="3" textAnchor="middle"
              >{sys.name}</text>
              {isHovered && (
                <text
                  x={sys.x * 100} y={sys.y * 100 + 6}
                  fill="#ffeeaa" fontSize="2.5" textAnchor="middle"
                >{bonusText}</text>
              )}
            </g>
            );
          })}
        </svg>
      </div>
      {Object.keys(bonus).length > 0 && (
        <div className="colony-bonus">
          Routes: {Object.entries(bonus).map(([r, v]) => `${r} +${v.toFixed(1)}`).join(', ')}
          <span style={{ color: '#888', marginLeft: '8px' }}>
            (total: +{Object.values(bonus).reduce((s, v) => s + v, 0).toFixed(1)}/s)
          </span>
        </div>
      )}
      <p className="mining-hint">
        Click two systems to create/remove routes (5 dark energy + 1 star system).
        {stats.hubSystems > 0 && ' Hub systems (2+ routes) get +50% bonus.'}
        {' '}Longer routes give more resources.
      </p>
    </div>
  );
}
