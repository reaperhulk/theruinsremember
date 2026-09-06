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
        <h2 style={{ color: '#c8a040', marginBottom: '12px', textAlign: 'center' }}>Field Guide</h2>
        <div className="help-grid" style={{ color: '#bbb', lineHeight: '1.5' }}>
          <div className="help-card">
            <strong>Objective</strong>
            <p>Advance through 10 eras, rebuild civilization, and piece together the evidence that your people have done this before.</p>
          </div>
          <div className="help-card">
            <strong>Early Survival</strong>
            <p>Gathering, construction and ordinary research run automatically. Choose whether workshops or labs spend first, then compare the Council’s competing doctrines. During the first three eras, assign an expedition route once; the team uses replenished supplies until you pause or change its assignment.</p>
          </div>
          <div className="help-card">
            <strong>Read The Warnings</strong>
            <p><strong>FULL</strong> means storage is wasting production. <strong>DRAINING</strong> means one supply chain is starving another.</p>
          </div>
          <div className="help-card">
            <strong>Era Progression</strong>
            <p>The chapter meter shows construction and research progress. When ready, review what your civilization discovered and continue. Exclusive choices remain yours; committing early reserves their cost once prerequisites are ready.</p>
          </div>
          <div className="help-card">
            <strong>Operations</strong>
            <p>Each era introduces a focused operation. The current system stays prominent; previous systems remain available from the archive.</p>
          </div>
          <div className="help-card">
            <strong>Recovered Relics</strong>
            <p>Time and failed risky expeditions build Echo Pressure. At 100, choose one of three run-only relics for a two-slot loadout. Relics dissolve at prestige.</p>
          </div>
          <div className="help-card">
            <strong>Prestige</strong>
            <p>At Era 10 you can reset for permanent multipliers and upgrades. The cycle is part of progression, not just a post-game screen.</p>
          </div>
          <div className="help-card">
            <strong>Supply Chains</strong>
            <p>Food feeds Labor, Energy feeds Electronics, Fuel feeds Orbital, Exotic feeds Colonies, Forge feeds Megastructures. If supply runs out, downstream production throttles.</p>
          </div>
          <div className="help-card">
            <strong>Trading</strong>
            <p>Unlocks at Era 4. Convert surplus resources into ones you need. Quick trades auto-suggest the best exchanges.</p>
          </div>
          <div className="help-card help-card-wide">
            <strong>Controls</strong>
            <p>Tabs: 1-6 | Dock: D | Tune: Arrows/Enter | Weave: D/W/C | Help: ?</p>
          </div>
        </div>
        <p style={{ textAlign: 'center', color: '#555', marginTop: '12px', fontSize: '0.8em' }}>Click outside or press Escape to close</p>
      </div>
    </div>
  );
}
