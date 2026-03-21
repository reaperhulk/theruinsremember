import { useState, useEffect, useRef } from 'react';
import { eraNames } from '../engine/eras.js';

const eraLore = {
  1: "The last ship breaks apart on entry. In the wreckage, you find metal fragments too precise to be natural. Someone was here before.",
  2: "The mines cut deep and hit something wrong — buried walls, ancient factories. They built all this too.",
  3: "The old data cores still hum. You decode warnings in languages no one speaks. They saw what was coming.",
  4: "The orbital debris field isn't natural. Those are hulls up there — stations, ships, graves. All cold and dark.",
  5: "Every world you reach has been touched. Terraformed biospheres gone feral. Cities swallowed by alien jungle.",
  6: "The ancient FTL beacons still pulse. Star maps pointing to civilizations that burned out millennia ago.",
  7: "You find a Dyson sphere already built. Dark, abandoned, impossibly old. Your engineers can't improve on it.",
  8: "The ruins span galaxies. Not one dead civilization — thousands. All of them reached this point. All of them stopped.",
  9: "Every species that ever lived followed this path. Expansion, transcendence, silence. The pattern has no exceptions.",
  10: "The cycle spans realities. You have done this before. Prestige is not a game mechanic — it is the loop itself.",
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
