import { useState, useEffect, useRef } from 'react';
import { resources as resourceDefs } from '../data/resources.js';
import { formatNumber } from './format.js';

const MILESTONES = [100, 1000, 10000, 100000, 1000000, 10000000, 100000000];

export function Toast({ state }) {
  const [toasts, setToasts] = useState([]);
  const prevEraRef = useRef(state.era);
  const prevGemsRef = useRef(state.totalGems || 0);
  const prevEventsRef = useRef(state.eventLog?.length || 0);
  const milestonesHitRef = useRef({});
  const idRef = useRef(0);

  useEffect(() => {
    const newToasts = [];

    // Era transition
    if (state.era > prevEraRef.current) {
      newToasts.push({ id: ++idRef.current, text: `New Era: ${state.era}`, type: 'era' });
    }
    prevEraRef.current = state.era;

    // Gem find
    const currentGems = state.totalGems || 0;
    if (currentGems > prevGemsRef.current) {
      newToasts.push({ id: ++idRef.current, text: 'Gem found!', type: 'gem' });
    }
    prevGemsRef.current = currentGems;

    // Resource milestones
    for (const [id, r] of Object.entries(state.resources)) {
      if (!r.unlocked) continue;
      for (const m of MILESTONES) {
        const key = `${id}_${m}`;
        if (r.amount >= m && !milestonesHitRef.current[key]) {
          milestonesHitRef.current[key] = true;
          const name = resourceDefs[id]?.name || id;
          newToasts.push({ id: ++idRef.current, text: `${name} reached ${formatNumber(m)}!`, type: 'milestone' });
        }
      }
    }

    // New event
    const currentEvents = state.eventLog?.length || 0;
    if (currentEvents > prevEventsRef.current && state.eventLog?.length > 0) {
      const latest = state.eventLog[state.eventLog.length - 1];
      if (latest && !latest.message.startsWith('Gem')) {
        const isAchievement = latest.message.startsWith('Achievement');
        const isEra = latest.message.startsWith('ERA');
        newToasts.push({
          id: ++idRef.current,
          text: latest.message,
          type: isAchievement ? 'achievement' : isEra ? 'era' : 'event',
        });
      }
    }
    prevEventsRef.current = currentEvents;

    if (newToasts.length > 0) {
      setToasts(prev => [...prev, ...newToasts].slice(-5));
      const ids = newToasts.map(t => t.id);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => !ids.includes(t.id)));
      }, 4000);
    }
  }, [state.era, state.totalGems, state.eventLog?.length, state.resources]);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          {t.text}
        </div>
      ))}
    </div>
  );
}
