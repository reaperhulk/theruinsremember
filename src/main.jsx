import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './ui/App.jsx';
import './index.css';

// Lock zoom and stray text selection while playing. iOS Safari ignores
// user-scalable=no for pinches, so its gesture events are cancelled here;
// the save text box keeps normal selection.
const editable = target => target instanceof Element && !!target.closest('input, textarea');
for (const type of ['gesturestart', 'gesturechange', 'gestureend']) {
  document.addEventListener(type, event => event.preventDefault(), { passive: false });
}
document.addEventListener('touchmove', event => { if (event.touches.length > 1) event.preventDefault(); }, { passive: false });
document.addEventListener('selectstart', event => { if (!editable(event.target)) event.preventDefault(); });
document.addEventListener('contextmenu', event => { if (event.target instanceof Element && event.target.closest('.ruins-stage, .store')) event.preventDefault(); });

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
