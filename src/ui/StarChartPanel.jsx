import { useState, memo } from 'react';
import { getUnlockedSystems, getRoutes, createRoute, removeRoute, getRouteBonus, routeExists, getRouteStats } from '../engine/starChart.js';
import { resources as resourceDefs } from '../data/resources.js';

function resourceName(id) { return resourceDefs[id]?.name || id; }

export const StarChartPanel = memo(function StarChartPanel({ state, onUpdate }) {
  const [selected, setSelected] = useState(null);
  const [hovered, setHovered] = useState(null);
  const systems = getUnlockedSystems(state);
  const routes = getRoutes(state);
  const bonus = getRouteBonus(state);
  const stats = getRouteStats(state);

  const handleSystemClick = (sysId) => {
    if (selected === null) {
      // First click: select system (show its bonuses)
      setSelected(sysId);
    } else if (selected === sysId) {
      // Click same system: deselect
      setSelected(null);
    } else {
      // Click different system while one is selected: create/remove route
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
      <h2>Star Chart{routes.length > 0 ? ` (${routes.length} routes)` : ` (${systems.length} systems)`}</h2>
      <div className="dock-info">
        <span>Routes: {routes.length}/10</span>
        <span>Systems: {systems.length}</span>
        {stats.hubSystems > 0 && <span style={{ color: '#88ccff' }}>Hubs: {stats.hubSystems}</span>}
        {stats.allConnected && <span style={{ color: '#ffdd44' }}>All Connected!</span>}
      </div>
      <div className="star-chart">
        <svg viewBox="0 0 100 100" className="star-svg" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Star chart showing connected star systems">
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
          {/* Show potential connection lines when a system is selected */}
          {selected && systems.map(sys => {
            if (sys.id === selected) return null;
            if (routeExists(state, selected, sys.id)) return null;
            const fromSys = systems.find(s => s.id === selected);
            if (!fromSys) return null;
            return (
              <line
                key={`potential-${sys.id}`}
                x1={fromSys.x * 100} y1={fromSys.y * 100}
                x2={sys.x * 100} y2={sys.y * 100}
                stroke="#ffdd44" strokeWidth="0.5"
                strokeDasharray="2,2"
                opacity={0.3}
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
              onTouchEnd={(e) => { e.preventDefault(); handleSystemClick(sys.id); }}
              onMouseEnter={() => setHovered(sys.id)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: 'pointer' }}
              role="button"
              aria-label={`${sys.name}: ${bonusText}${isSelected ? ' (selected)' : ''}`}
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSystemClick(sys.id); } }}
            >
              {/* Larger invisible hit area for touch */}
              <circle
                cx={sys.x * 100} cy={sys.y * 100}
                r={6}
                fill="transparent"
              />
              <circle
                cx={sys.x * 100} cy={sys.y * 100}
                r={isSelected ? 3 : isHovered ? 2.5 : 2}
                fill={isSelected ? '#ffdd44' : isHovered ? '#bbddff' : '#88ccff'}
              />
              <text
                x={sys.x * 100} y={sys.y * 100 - 4}
                fill="#aaddff" fontSize="3" textAnchor="middle"
                className="star-label"
                style={{ pointerEvents: 'none' }}
              >{sys.name}</text>
              {(isHovered || isSelected) && (
                <text
                  x={sys.x * 100} y={sys.y * 100 + 6}
                  fill="#ffeeaa" fontSize="2.5" textAnchor="middle"
                  style={{ pointerEvents: 'none' }}
                >{bonusText}</text>
              )}
            </g>
            );
          })}
        </svg>
      </div>
      {selected && (() => {
        const sys = systems.find(s => s.id === selected);
        if (!sys) return null;
        return (
          <div style={{ fontSize: '0.75em', color: '#aaddff', padding: '4px', background: 'rgba(50,80,120,0.3)', borderRadius: '4px', marginTop: '4px' }}>
            <strong>{sys.name}</strong>: {Object.entries(sys.bonus).map(([r,v]) => `${resourceName(r)} +${v}`).join(', ')}
          </div>
        );
      })()}
      {Object.keys(bonus).length > 0 && (
        <div className="colony-bonus">
          Routes: {Object.entries(bonus).map(([r, v]) => `${resourceName(r)} +${v.toFixed(1)}`).join(', ')}
          <span style={{ color: '#888', marginLeft: '8px' }}>
            (total: +{Object.values(bonus).reduce((s, v) => s + v, 0).toFixed(1)}/s)
          </span>
        </div>
      )}
      {routes.length > 3 && (
        <p className="text-lore" style={{ fontSize: '0.75em', margin: '4px 0 0' }}>
          The routes trace paths already worn into spacetime.
        </p>
      )}
      {systems.length >= 2 && routes.length < 10 && (
        <button
          className="mine-btn"
          style={{ marginTop: '4px', fontSize: '0.8em' }}
          onClick={() => onUpdate(s => {
            let st = s;
            const sysList = getUnlockedSystems(st);
            for (let i = 0; i < sysList.length && getRoutes(st).length < 10; i++) {
              for (let j = i + 1; j < sysList.length && getRoutes(st).length < 10; j++) {
                if (!routeExists(st, sysList[i].id, sysList[j].id)) {
                  const result = createRoute(st, sysList[i].id, sysList[j].id);
                  if (result) st = result;
                }
              }
            }
            return st;
          })}
        >
          Auto-Connect ({Math.min(10 - routes.length, systems.length * (systems.length - 1) / 2 - routes.length)} slots)
        </button>
      )}
      <p className="mining-hint">
        {selected ? 'Click another system to create a route, or same system to deselect.' : 'Click/tap two systems to create or remove routes (5 dark energy + 1 star system).'}
        {stats.hubSystems > 0 && ' Hub systems (2+ routes) get +50% bonus.'}
        {' '}Longer routes give more resources.
      </p>
    </div>
  );
});
