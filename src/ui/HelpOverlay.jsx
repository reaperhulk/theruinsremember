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
            <p>Press Space or use + buttons to gather resources. Buy upgrades fast so manual collection becomes a backup, not the plan.</p>
          </div>
          <div className="help-card">
            <strong>Read The Warnings</strong>
            <p><strong>FULL</strong> means storage is wasting production. <strong>DRAINING</strong> means one supply chain is starving another.</p>
          </div>
          <div className="help-card">
            <strong>Era Progression</strong>
            <p>Era advances require enough upgrades, enough era research, and the starred breakthrough tech. The Run Director tells you what is missing.</p>
          </div>
          <div className="help-card">
            <strong>Mini-Games</strong>
            <p>Each era adds a specialized system. They should accelerate a run, not be the only thing keeping it alive.</p>
          </div>
          <div className="help-card">
            <strong>Prestige</strong>
            <p>At Era 10 you can reset for permanent multipliers and upgrades. The cycle is part of progression, not just a post-game screen.</p>
          </div>
          <div className="help-card help-card-wide">
            <strong>Controls</strong>
            <p>Tabs: 1-6 | Mine: Space | Dock: D | Hack: 0-3 | Tune: Arrows | Help: ?</p>
          </div>
        </div>
        <p style={{ textAlign: 'center', color: '#555', marginTop: '12px', fontSize: '0.8em' }}>Click outside or press Escape to close</p>
      </div>
    </div>
  );
}
