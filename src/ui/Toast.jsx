import { useState, useEffect, useRef } from 'react';

export function Toast({ state }) {
  const [toasts, setToasts] = useState([]);
  const prevEraRef = useRef(state.era);
  const prevGemsRef = useRef(state.totalGems || 0);
  const prevEventsRef = useRef(state.eventLog?.length || 0);
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

    // New event
    const currentEvents = state.eventLog?.length || 0;
    if (currentEvents > prevEventsRef.current && state.eventLog?.length > 0) {
      const latest = state.eventLog[state.eventLog.length - 1];
      if (latest && !latest.message.startsWith('Gem')) {
        newToasts.push({ id: ++idRef.current, text: latest.message, type: 'event' });
      }
    }
    prevEventsRef.current = currentEvents;

    if (newToasts.length > 0) {
      setToasts(prev => [...prev, ...newToasts].slice(-5));
      // Auto-remove after 3 seconds
      const ids = newToasts.map(t => t.id);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => !ids.includes(t.id)));
      }, 3000);
    }
  }, [state.era, state.totalGems, state.eventLog?.length]);

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
