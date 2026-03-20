import { useState, useEffect, useRef } from 'react';
import { eraNames } from '../engine/eras.js';

export function EraTransition({ era }) {
  const [visible, setVisible] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const prevEraRef = useRef(era);

  useEffect(() => {
    if (era !== prevEraRef.current && era > prevEraRef.current) {
      prevEraRef.current = era;
      setVisible(true);
      setFadingOut(false);

      const fadeTimer = setTimeout(() => setFadingOut(true), 2000);
      const hideTimer = setTimeout(() => {
        setVisible(false);
        setFadingOut(false);
      }, 3000);

      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(hideTimer);
      };
    }
    prevEraRef.current = era;
  }, [era]);

  if (!visible) return null;

  return (
    <div className={`era-transition-overlay ${fadingOut ? 'fading' : ''}`}>
      <div className="era-transition-content">
        <div className="era-transition-label">ERA {era}</div>
        <div className="era-transition-name">{eraNames[era]}</div>
        <div style={{ fontSize: '0.9em', color: '#aaa', marginTop: '8px' }}>New resources and upgrades unlocked!</div>
      </div>
    </div>
  );
}
