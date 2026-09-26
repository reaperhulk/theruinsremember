import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { ACHIEVEMENT_BY_ID, ECHO_EFFECTS, ERA_NAMES, UPGRADE_BY_ID } from '../game/data.js';
import {
  buyBuilding, buyMemoryUpgrade, buyUpgrade, canLeaveMessage, catchEcho, click, getClickValue, getSps, leaveMessage, turnCycle,
} from '../game/engine.js';
import { exportSave } from '../game/save.js';
import { CHAPTERS, DISCOVERIES, MESSAGES, STORY, pickDiscovery } from '../game/lore.js';
import { SCORE } from './score.js';
import {
  getMusicStatus, playAchievement, playDiscovery, playClick, playEraTransition, playGemFound, playPrestige, playUpgrade,
  setMusicEnabled, setMusicEra, setVolumes, startAmbient, subscribeMusic, syncAudioVisibility, unlockAudio,
} from './AudioManager.js';
import { RuinsCanvas } from './RuinsCanvas.jsx';
import { Store } from './Store.jsx';
import { Journal } from './Journal.jsx';
import { useGame } from './useGame.js';
import { formatAmount, formatNumber, formatTime } from './format.js';

const SETTINGS_KEY = 'the-ruins-remember-settings';
const DEFAULT_SETTINGS = { music: true, musicVolume: 0.45, effectsVolume: 0.7, lowPower: false, numbers: true };

function loadSettings() {
  try { return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') }; } catch { return DEFAULT_SETTINGS; }
}

function useSettings() {
  const [settings, setSettings] = useState(loadSettings);
  const change = useCallback(patch => setSettings(current => {
    const next = { ...current, ...patch };
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(next)); } catch { /* settings are a convenience */ }
    return next;
  }), []);
  return [settings, change];
}

// A slow ticker of things found in the ruins, from every era reached so far.
function Ticker({ era, cycles, message }) {
  const [line, setLine] = useState(() => DISCOVERIES[1][0]);
  useEffect(() => {
    const pick = () => setLine(pickDiscovery({ era, cycles, message }));
    pick();
    const timer = setInterval(pick, 20000);
    return () => clearInterval(timer);
  }, [era, cycles, message]);
  return <p className="ticker" aria-live="off">{line}</p>;
}

function Buffs({ buffs }) {
  if (!buffs.length) return null;
  return (
    <div className="buffs">
      {buffs.map(buff => (
        <span key={buff.id} className={`buff buff-${buff.id}`}>
          {ECHO_EFFECTS[buff.id].name} · {buff.production ? `production ×${buff.production}` : `+${buff.clickSeconds}s of production per dig`} · {Math.ceil(buff.remaining)}s
        </span>
      ))}
    </div>
  );
}

// Notices never take input, so they can't cover a button mid-click.
function Toasts({ toasts }) {
  return (
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.kind}`}>
          {t.title && <strong>{t.title}</strong>}
          <span>{t.text}</span>
        </div>
      ))}
    </div>
  );
}

// A chapter of the story: the first cycle, and the ending with its choice.
function StoryModal({ story, children, onClose, action }) {
  return (
    <Modal title={story.title} onClose={onClose} action={action} className="story">
      {story.paragraphs.map(text => <p key={text}>{text}</p>)}
      {children}
    </Modal>
  );
}

function EndingChoice({ current, onChoose }) {
  return (
    <div className="message-choices" role="group" aria-label="Your message">
      {Object.entries(MESSAGES).map(([id, message]) => (
        <button key={id} type="button" className={current === id ? 'chosen' : ''} aria-pressed={current === id} onClick={() => onChoose(id)}>
          <strong>{message.label}</strong>
          <span>“{message.text}”</span>
          <small>{message.description}</small>
        </button>
      ))}
    </div>
  );
}

function Modal({ title, children, onClose, action = 'Continue', className = '' }) {
  const ref = useRef(null);
  useEffect(() => { ref.current?.focus(); }, []);
  return (
    <div className="modal-backdrop" role="presentation">
      <div className={`modal ${className}`} role="dialog" aria-modal="true" aria-label={title}>
        <h2>{title}</h2>
        {children}
        <button ref={ref} type="button" className="primary" onClick={onClose}>{action}</button>
      </div>
    </div>
  );
}

export function App() {
  const game = useGame();
  const { state, update } = game;
  const [settings, changeSettings] = useSettings();
  const [tab, setTab] = useState('chronicle');
  const [mobileView, setMobileView] = useState('store');
  const [toasts, setToasts] = useState([]);
  const toastId = useRef(0);
  const [story, setStory] = useState(null);
  const [endingDeferred, setEndingDeferred] = useState(false);
  const seenLog = useRef(state.log.length ? state.log[state.log.length - 1] : null);
  const musicStatus = useSyncExternalStore(subscribeMusic, getMusicStatus);

  const toast = useCallback((kind, title, text) => {
    const id = ++toastId.current;
    setToasts(list => [...list.slice(-3), { id, kind, title, text }]);
    setTimeout(() => setToasts(list => list.filter(t => t.id !== id)), kind === 'era' || kind === 'discovery' ? 9000 : kind === 'achievement' ? 3500 : 5000);
  }, []);

  // Announce whatever the engine logged since the last render.
  useEffect(() => {
    const log = state.log;
    const start = seenLog.current ? log.lastIndexOf(seenLog.current) + 1 : 0;
    const fresh = log.slice(start);
    seenLog.current = log[log.length - 1] || null;
    for (const entry of fresh) {
      if (entry.kind === 'era') {
        const chapter = CHAPTERS[entry.era];
        toast('era', `Era ${entry.era}: ${ERA_NAMES[entry.era]}`, `${chapter.title}. ${chapter.discovery}`);
        playEraTransition();
      } else if (entry.kind === 'discovery') {
        const discovery = UPGRADE_BY_ID[entry.id];
        toast('discovery', `Discovery: ${discovery.name}`, discovery.text);
        playDiscovery();
      } else if (entry.kind === 'cycle' && entry.cycle === 1) {
        setStory('firstCycle');
      } else if (entry.kind === 'achievement') {
        toast('achievement', 'Achievement', ACHIEVEMENT_BY_ID[entry.id]?.name);
        playAchievement();
      }
    }
  }, [state.log, toast]);

  useEffect(() => {
    setVolumes(settings.effectsVolume, settings.musicVolume);
    setMusicEnabled(settings.music);
  }, [settings.effectsVolume, settings.musicVolume, settings.music]);
  useEffect(() => { setMusicEra(state.era, state.cycles, 0); }, [state.era, state.cycles]);
  useEffect(() => {
    // Browsers only allow sound after the player interacts with the page, and
    // Safari only counts some events as that interaction. Keep listening: iOS
    // suspends audio again whenever the page goes to the background.
    const gestures = ['pointerup', 'touchend', 'click', 'keydown'];
    for (const type of gestures) window.addEventListener(type, unlockAudio, { capture: true, passive: true });
    document.addEventListener('visibilitychange', syncAudioVisibility);
    return () => {
      for (const type of gestures) window.removeEventListener(type, unlockAudio, { capture: true });
      document.removeEventListener('visibilitychange', syncAudioVisibility);
    };
  }, []);

  const sps = getSps(state);
  const clickValue = getClickValue(state);
  useEffect(() => { document.title = `${formatAmount(state.salvage)} salvage · The Ruins Remember`; }, [state.salvage]);

  const dig = useCallback(() => { update(s => click(s)); playClick(); }, [update]);
  const catchTheEcho = useCallback(() => {
    let caught = null;
    update(s => { const result = catchEcho(s); caught = result.effect; return result.state; });
    if (caught) {
      const effect = ECHO_EFFECTS[caught.id];
      toast('echo', effect.name, caught.id === 'cache' ? `+${formatAmount(caught.amount)} salvage` : effect.description);
      playGemFound();
    }
  }, [update, toast]);
  const onBuyBuilding = useCallback((id, amount) => { update(s => buyBuilding(s, id, amount)); playUpgrade(); }, [update]);
  const onBuyUpgrade = useCallback(id => { update(s => buyUpgrade(s, id)); playUpgrade(); }, [update]);
  const onTurn = useCallback(() => { update(turnCycle); playPrestige(); game.save(); }, [update, game]);
  const onBuyMemory = useCallback(id => { update(s => buyMemoryUpgrade(s, id)); playUpgrade(); }, [update]);

  const musicTheme = SCORE[state.era]?.name;
  return (
    <div className={`app era-${state.era}${settings.lowPower ? ' low-power' : ''}`} style={{ '--chapter': CHAPTERS[state.era].color }}>
      <header className="topbar">
        <h1>The Ruins Remember</h1>
        <span className="era-label">Era {state.era} · {ERA_NAMES[state.era]}</span>
        <button type="button" className="music-toggle" aria-pressed={settings.music} onClick={() => { changeSettings({ music: !settings.music }); startAmbient(); }}>
          {settings.music ? '♪ Music on' : '♪ Music off'}
        </button>
      </header>
      {game.warning && <p className="warning" role="alert">{game.warning}</p>}
      <main className={`layout show-${mobileView}`}>
        <section className="ruins" aria-label="The ruins">
          <div className="counter">
            <p className="salvage" aria-live="off"><span>{formatAmount(state.salvage)}</span> salvage</p>
            <p className="rate">{formatNumber(sps)} per second · {formatNumber(clickValue)} per dig</p>
          </div>
          <RuinsCanvas state={state} clickValue={clickValue} showNumbers={settings.numbers} onDig={dig} onCatchEcho={catchTheEcho} lowPower={settings.lowPower} />
          <Buffs buffs={state.buffs} />
          <Ticker era={state.era} cycles={state.cycles} message={state.message} />
        </section>
        <nav className="mobile-nav" aria-label="Sections">
          {[['store', 'Store'], ['journal', 'Journal']].map(([id, label]) => (
            <button key={id} type="button" className={mobileView === id ? 'active' : ''} aria-pressed={mobileView === id} onClick={() => setMobileView(id)}>{label}</button>
          ))}
        </nav>
        <Store state={state} onBuyBuilding={onBuyBuilding} onBuyUpgrade={onBuyUpgrade} />
        <Journal state={state} tab={tab} onTab={setTab} onTurn={onTurn} onBuyMemory={onBuyMemory}
          audio={{ status: musicStatus, theme: musicTheme }} settings={settings} onSettings={changeSettings}
          onExport={() => exportSave(state)} onImport={game.importText} onReset={game.reset}
          onRewriteMessage={() => setStory('ending')} />
      </main>
      <Toasts toasts={toasts} />
      {game.welcome != null && (
        <Modal title="The ruins remember you" onClose={game.dismissWelcome}>
          <p>The Ruins Remember has been rebuilt as a clicker. Dig by hand, build, and let the cycle turn.</p>
          <p>Your earlier civilization is not forgotten: you begin with <strong>{game.welcome} memories</strong>, which multiply all production. Spend them on lessons in The Cycle tab.</p>
        </Modal>
      )}
      {game.away && !game.welcome && (
        <Modal title="While you were away" onClose={game.dismissAway}>
          <p>For {formatTime(game.away.seconds)} the ruins kept working and recovered <strong>{formatAmount(game.away.earned)} salvage</strong>.</p>
          {game.away.eraAfter > game.away.eraBefore && <p>Your civilization reached the {ERA_NAMES[game.away.eraAfter]} era.</p>}
        </Modal>
      )}
      {story === 'firstCycle' && !game.welcome && (
        <StoryModal story={STORY.firstCycle} onClose={() => setStory(null)}>
          <p className="muted">Spend your memories in The Cycle tab of the journal.</p>
        </StoryModal>
      )}
      {!game.welcome && !game.away && (story === 'ending' || (canLeaveMessage(state) && !state.message && !endingDeferred && !story)) && (
        <StoryModal story={STORY.ending} action={state.message ? 'Keep it' : 'Not yet'}
          onClose={() => { setStory(null); setEndingDeferred(true); }}>
          <EndingChoice current={state.message} onChoose={id => {
            update(s => leaveMessage(s, id));
            setStory(null);
            toast('era', 'Your message', `“${MESSAGES[id].text}” The next civilization will find it in the ruins.`);
          }} />
        </StoryModal>
      )}
    </div>
  );
}
