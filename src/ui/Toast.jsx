import { useState, useEffect, useRef } from 'react';
import { resources as resourceDefs } from '../data/resources.js';
import { getEffectiveCap } from '../engine/resources.js';
import { formatNumber } from './format.js';

const MILESTONES = [100, 1000, 10000, 100000, 1000000, 10000000, 100000000];

export function Toast({ state }) {
  const [toasts, setToasts] = useState([]);
  const toastTimerRef = useRef(null);
  const prevEraRef = useRef(state.era);
  const prevGemsRef = useRef(state.totalGems || 0);
  const prevEventsRef = useRef(state.eventLog?.length || 0);
  const milestonesHitRef = useRef({});
  const capWarningsRef = useRef({});
  const prevUpgradeCountRef = useRef(Object.keys(state.upgrades || {}).length);
  const idRef = useRef(0);

  useEffect(() => {
    const newToasts = [];

    // First upgrade congratulation
    const upgradeCount = Object.keys(state.upgrades || {}).length;
    if (upgradeCount === 1 && prevUpgradeCountRef.current === 0) {
      newToasts.push({ id: ++idRef.current, text: 'First upgrade! Production doubled.', type: 'milestone' });
    }
    prevUpgradeCountRef.current = upgradeCount;

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

    // Resource cap warnings (once per resource)
    for (const [id, r] of Object.entries(state.resources)) {
      if (!r.unlocked) continue;
      const cap = getEffectiveCap(state, id);
      if (cap > 0 && r.amount >= cap * 0.99 && !capWarningsRef.current[id]) {
        capWarningsRef.current[id] = true;
        const name = resourceDefs[id]?.name || id;
        newToasts.push({ id: ++idRef.current, text: `${name} storage is full! Buy cap upgrades.`, type: 'milestone' });
      }
      // Reset warning if below 80% so it can trigger again after player upgrades cap
      if (cap > 0 && r.amount < cap * 0.8) {
        capWarningsRef.current[id] = false;
      }
    }

    // New events — batch achievements if 3+ arrive at once
    const currentEvents = state.eventLog?.length || 0;
    if (currentEvents > prevEventsRef.current && state.eventLog?.length > 0) {
      const newCount = currentEvents - prevEventsRef.current;
      const newEvents = state.eventLog.slice(-newCount);
      const achievements = newEvents.filter(e => e.message.startsWith('Achievement'));
      const nonAchievements = newEvents.filter(e => !e.message.startsWith('Achievement') && !e.message.startsWith('Gem'));

      // Batch achievements if 3+ at once
      if (achievements.length >= 3) {
        newToasts.push({
          id: ++idRef.current,
          text: `${achievements.length} achievements earned!`,
          type: 'achievement',
        });
      } else {
        for (const a of achievements) {
          newToasts.push({ id: ++idRef.current, text: a.message, type: 'achievement' });
        }
      }

      for (const e of nonAchievements) {
        const isEra = e.message.startsWith('ERA');
        newToasts.push({
          id: ++idRef.current,
          text: e.message,
          type: isEra ? 'era' : 'event',
        });
      }
    }
    prevEventsRef.current = currentEvents;

    if (newToasts.length > 0) {
      setToasts(prev => [...prev, ...newToasts].slice(-3));
      const ids = newToasts.map(t => t.id);
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = setTimeout(() => {
        setToasts(prev => prev.filter(t => !ids.includes(t.id)));
      }, 4000);
    }
  }, [state.era, state.totalGems, state.eventLog?.length, Math.floor(state.totalTime || 0)]);

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
