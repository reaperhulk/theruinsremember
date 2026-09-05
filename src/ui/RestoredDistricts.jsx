import { RECONSTRUCTION_PROJECTS } from '../engine/archive.js';

export function RestoredDistricts({ state }) {
  const districts = Object.entries(RECONSTRUCTION_PROJECTS).filter(([id]) => state.archive?.projects?.[id] > 0);
  if (!districts.length) return null;
  return <section className="panel restored-districts" aria-label="Persistent civilization">
    <strong>The world remembers</strong>
    <div className="district-skyline">{districts.map(([id, def], index) => {
      const count = state.archive.projects[id];
      const stages = def.stages || 2;
      const complete = count >= stages;
      return <div key={id} className={complete ? 'district-restored' : 'district-building'}>
        <svg viewBox="0 0 80 40" role="img" aria-label={`${def.name}: ${complete ? 'restored' : `${count} of ${stages} stages`}`}>
          <path d="M0 38 H80" stroke="currentColor" />
          {[0, 1, 2, 3].map(n => <rect key={n} x={5 + n * 18} y={10 + (n + index) % 3 * 5} width="13" height={28 - (n + index) % 3 * 5} fill="currentColor" opacity={complete || n < count ? 0.85 : 0.18} />)}
          {[0, 1, 2, 3].map(n => <path key={n} d={`M${8 + n * 18} 27 h6 m-6 5 h6`} stroke="#15252a" strokeWidth="2" />)}
        </svg>
        <span>{def.name}</span><small>{complete ? 'Restored for future cycles' : `${count}/${stages} civilizations`}</small>
      </div>;
    })}</div>
  </section>;
}
