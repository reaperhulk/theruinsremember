import { useState, useEffect, useRef, useCallback } from 'react';
import { eraNames } from '../engine/eras.js';
import { resources as resourceDefs } from '../data/resources.js';
import { playEraTransition } from './AudioManager.js';

const eraLore = {
  1: "The last ship breaks apart on entry. In the wreckage, you find metal fragments too precise to be natural. Someone was here before.",
  2: "The mines cut deep and strike something wrong — buried walls, ancient factories. They built all of this before you.",
  3: "The old data cores still hum. You decode warnings in languages no one speaks. They knew what was coming and built it anyway.",
  4: "The orbital debris field is not natural. Those are hulls up there — stations, ships, graves. All cold and waiting.",
  5: "Every world you reach has been touched. Terraformed biospheres gone feral. Cities swallowed by alien jungle.",
  6: "Ancient FTL beacons still pulse across the void. Star maps pointing to civilizations that burned out millennia ago.",
  7: "You find a Dyson sphere already built — dark, abandoned, impossibly old. Your engineers cannot improve on it.",
  8: "The ruins span galaxies. Not one dead civilization but thousands. All of them reached this point. All of them stopped.",
  9: "Every species that ever lived followed this exact path. Expansion, transcendence, silence. The pattern has no exceptions.",
  10: "The cycle spans realities. You have done this before. Prestige is not a game mechanic — it is the loop itself.",
};

// What unlocks per era (resources + mini-games)
const eraUnlocks = {
  2: { resources: ['Steel', 'Electronics', 'Research'], features: ['Factory mini-game'] },
  3: { resources: ['Software', 'Data'], features: ['Hacking mini-game'] },
  4: { resources: ['Rocket Fuel', 'Orbital Infrastructure'], features: ['Docking mini-game', 'Trading'] },
  5: { resources: ['Colonies', 'Exotic Materials'], features: ['Colony management'] },
  6: { resources: ['Star Systems', 'Dark Energy'], features: ['Star Chart'] },
  7: { resources: ['Megastructures', 'Stellar Forge Output'], features: ['Dyson Assembly'] },
  8: { resources: ['Galactic Influence', 'Exotic Matter'], features: ['Weaving mini-game'] },
  9: { resources: ['Cosmic Power', 'Universal Constants'], features: ['Cosmic Tuning'] },
  10: { resources: ['Reality Fragments', 'Quantum Echoes'], features: [] },
};

export function EraTransition({ era }) {
  const [visible, setVisible] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const prevEraRef = useRef(era);
  const fadeTimerRef = useRef(null);
  const hideTimerRef = useRef(null);

  const dismiss = useCallback(() => {
    setFadingOut(true);
    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      setVisible(false);
      setFadingOut(false);
    }, 500);
  }, []);

  useEffect(() => {
    if (era !== prevEraRef.current && era > prevEraRef.current) {
      prevEraRef.current = era;
      setVisible(true);
      setFadingOut(false);
      playEraTransition();

      const displayTime = 3000 + era * 500;
      fadeTimerRef.current = setTimeout(() => setFadingOut(true), displayTime - 1000);
      hideTimerRef.current = setTimeout(() => {
        setVisible(false);
        setFadingOut(false);
      }, displayTime);

      return () => {
        if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      };
    }
    prevEraRef.current = era;
  }, [era]);

  if (!visible) return null;

  const unlocks = eraUnlocks[era];

  return (
    <div
      className={`era-transition-overlay ${fadingOut ? 'fading' : ''}`}
      onClick={dismiss}
      style={{ cursor: 'pointer' }}
    >
      <div className="era-transition-content">
        <div className="era-transition-label">ERA {era}</div>
        <div className="era-transition-name">{eraNames[era]}</div>
        <div style={{ fontSize: '0.85em', color: '#ccaa66', marginTop: '10px', fontStyle: 'italic', maxWidth: '400px', lineHeight: '1.4' }}>{eraLore[era]}</div>
        {unlocks && (
          <div className="era-transition-unlocks">
            {unlocks.resources.length > 0 && (
              <div className="era-unlock-line">
                <span className="era-unlock-label">New resources:</span> {unlocks.resources.join(', ')}
              </div>
            )}
            {unlocks.features.length > 0 && (
              <div className="era-unlock-line">
                <span className="era-unlock-label">New features:</span> {unlocks.features.join(', ')}
              </div>
            )}
          </div>
        )}
        <div style={{ fontSize: '0.7em', color: '#666', marginTop: '12px' }}>Click anywhere to dismiss</div>
      </div>
    </div>
  );
}
