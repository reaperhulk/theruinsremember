import { useEffect, useRef } from 'react';

export function HelpOverlay({ onClose }) {
  const contentRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    previousFocusRef.current = document.activeElement;
    if (contentRef.current) {
      contentRef.current.focus();
    }
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('keydown', handleKey);
      if (previousFocusRef.current && previousFocusRef.current.focus) {
        previousFocusRef.current.focus();
      }
    };
  }, [onClose]);

  return (
    <div className="era-transition-overlay" onClick={onClose} style={{ zIndex: 1003 }} role="dialog" aria-modal="true" aria-label="How to Play">
      <div className="era-transition-content" ref={contentRef} tabIndex={-1} onClick={e => e.stopPropagation()} style={{ maxWidth: '500px', maxHeight: '80vh', overflowY: 'auto', textAlign: 'left', fontSize: '0.85em', outline: 'none' }}>
        <h2 style={{ color: '#c8a040', marginBottom: '12px', textAlign: 'center' }}>How to Play</h2>
        <div style={{ color: '#bbb', lineHeight: '1.5' }}>
          <p><strong>Goal:</strong> Advance through 10 eras of civilization, discovering the ruins of those who came before.</p>
          <p><strong>Resources:</strong> Click +1 buttons or press Space to mine. Buy upgrades to automate production.</p>
          <p><strong>Upgrades:</strong> Gold-bordered "MECHANIC" upgrades change gameplay. Purple-bordered upgrades reveal story.</p>
          <p><strong>Caps:</strong> Resources have storage limits. Buy "Cap" upgrades to increase them. "FULL" means production is wasted.</p>
          <p><strong>Consumption:</strong> Some resources consume others (food feeds labor, energy powers electronics, fuel maintains orbits, exotic materials sustain colonies, forge feeds megastructures). Watch for "DRAINING".</p>
          <p><strong>Mini-games:</strong> Mining (era 1), Factory (2), Hacking (3), Docking (4), Trading (4), Colony (5), Star Chart (6), Dyson Assembly (7), Weaving (8), Galactic Senate (8), Cosmic Tuning (9), Reality Forge (10).</p>
          <p><strong>Tech Tree:</strong> Research technologies to unlock new eras. Star techs gate era transitions.</p>
          <p><strong>Prestige:</strong> At Era 10, reset for a permanent production multiplier. Earn prestige points from Era 7+. The cycle begins again.</p>
          <p><strong>Canvas:</strong> Click glowing orbs, ruins, and deposits for bonuses. Buildings appear as you progress.</p>
          <p><strong>Keyboard:</strong> 1-6: tabs | Space: mine | D: dock | 0-3: hack | Arrows: tune | ?: this help</p>
        </div>
        <p style={{ textAlign: 'center', color: '#555', marginTop: '12px', fontSize: '0.8em' }}>Click outside or press Escape to close</p>
      </div>
    </div>
  );
}
