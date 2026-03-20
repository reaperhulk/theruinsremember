import { useState, useEffect, useRef } from 'react';
import { eraNames } from '../engine/eras.js';

const eraLore = {
  1: "Survivors of the Great Collapse establish humanity's last hope on an untamed world.",
  2: "The forge fires burn bright as iron reshapes civilization.",
  3: "Silicon minds awaken. The boundary between thought and machine begins to blur.",
  4: "The sky is no longer the limit. Humanity reaches for the void between worlds.",
  5: "Colony ships scatter like seeds across the solar wind.",
  6: "The first light-year crossing takes a century. The second takes a decade.",
  7: "A star dies to fuel civilization. The Dyson lattice hums with captured fire.",
  8: "Ten billion worlds united under a single flickering thought.",
  9: "Between the galaxies, something ancient stirs in the cosmic web.",
  10: "The membrane between realities grows thin. Every choice echoes across infinite worlds.",
};

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
        <div style={{ fontSize: '0.85em', color: '#ccaa66', marginTop: '10px', fontStyle: 'italic', maxWidth: '400px', lineHeight: '1.4' }}>{eraLore[era]}</div>
        <div style={{ fontSize: '0.9em', color: '#aaa', marginTop: '8px' }}>New resources and upgrades unlocked!</div>
      </div>
    </div>
  );
}
