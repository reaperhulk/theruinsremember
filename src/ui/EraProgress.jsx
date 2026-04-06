import { useState, useRef, useEffect } from 'react';
import { eraNames, ERA_COUNT, getEraReadiness } from '../engine/eras.js';
import { upgrades as upgradeDefs } from '../data/upgrades.js';
import { techTree } from '../data/tech-tree.js';
import { calculateProduction, canAfford, getEffectivePrestige, getEffectiveRate } from '../engine/resources.js';
import { getAvailableTech } from '../engine/tech.js';
import { getAvailableUpgrades, getUpgradeCost } from '../engine/upgrades.js';
import { resources as resourceDefs } from '../data/resources.js';
import { formatNumber, formatTime } from './format.js';

function pickHint(options, era, totalTime) {
  const arr = options[era];
  if (!arr) return null;
  if (typeof arr === 'string') return arr;
  return arr[Math.floor(totalTime / 30) % arr.length];
}

function getLoreHint(eraCompletion, isMaxEra, era, totalTime) {
  if (isMaxEra) return 'The cycle completes. The cycle begins again.';
  if (eraCompletion === 0) {
    const starts = {
      1: ['Smoke rises from the wreckage. Survivors gather.', 'The crash site still smolders. Something glints in the debris.', 'You are not the first to land here. The footprints say so.'],
      2: ['The first furnace glows. Something stirs beneath the dig site.', 'Smokestacks rise where ancient chimneys already stood.', 'The ground rumbles with buried machinery waking from long sleep.'],
      3: ['The old machines are waking up.', 'Buried servers hum to life when you connect the power.', 'The data streams carry ghost signals from a previous network.'],
      4: ['The sky is full of wreckage that isn\'t yours.', 'Orbital debris follows trajectories too precise to be natural.', 'The first satellite you launch finds others already there.'],
      5: ['Other worlds bear scars of habitation.', 'Every moon has foundations. Every asteroid has drill marks.', 'The solar wind carries molecules of processed alloys.'],
      6: ['Dead beacons flicker back to life at your approach.', 'The interstellar medium is thick with ancient transmissions.', 'Warp trails linger for millennia. Someone blazed this path.'],
      7: ['The dark sphere waits in silence.', 'A structure larger than worlds orbits a dying star. It is incomplete.', 'The Dyson framework hums when you approach. It was expecting you.'],
      8: ['Ruins everywhere. Every galaxy. Every star.', 'The galactic core radiates with the heat of a trillion dead civilizations.', 'Wormholes connect to places that no longer exist.'],
      9: ['The pattern is inescapable.', 'Between galaxies, the void is not empty. It is full of echoes.', 'Every cluster of galaxies shares the same archaeological signature.'],
      10: ['You remember this. You have always remembered this.', 'The multiverse opens like a wound that never healed.', 'Reality trembles. It knows what comes next.'],
    };
    return pickHint(starts, era, totalTime) || 'The journey begins...';
  }
  if (eraCompletion < 25) {
    const early = {
      1: ['Strange metal fragments litter the crash site.', 'The soil yields tools that predate your arrival by centuries.', 'A child finds a coin bearing your face. It is very, very old.'],
      2: ['Miners report structures too deep to be natural.', 'The coal seams contain petrified circuitry.', 'Every excavation finds foundations already laid.'],
      3: ['Fragments of ancient data surface in the static.', 'The internet routes through nodes that existed before you built them.', 'Error logs reference events that haven\'t happened yet.'],
      4: ['Orbital scans reveal geometric patterns in the debris.', 'The space junk forms constellations that match your star charts.', 'Radiation signatures in orbit predate your civilization.'],
      5: ['Collapsed domes dot the surface of every moon.', 'Terraforming residue lingers in atmospheres you haven\'t touched.', 'Mining claims on asteroids predate your species.'],
      6: ['The star maps lead somewhere. Nowhere good.', 'Each new system you chart was already named in the precursor database.', 'The warp lanes follow paths of least resistance carved by prior travelers.'],
      7: ['The sphere\'s power grid could still function.', 'Energy collectors orbit the star in formations you recognize.', 'The forge ignites with a sound like recognition.'],
      8: ['A thousand dead civilizations left the same last message.', 'The wormhole network was built by someone who knew exactly where you\'d need to go.', 'Galactic records describe your arrival. They were written in advance.'],
      9: ['They all reached this far. They all fell silent.', 'The cosmic web is a nervous system. Something is dreaming.', 'Universal constants shift as if adjusting to your presence.'],
      10: ['The walls between worlds are thinner than memory.', 'Quantum echoes carry the voices of your other selves.', 'Each reality you touch remembers being touched before.'],
    };
    return pickHint(early, era, totalTime) || 'Foundations are being laid.';
  }
  if (eraCompletion < 50) {
    const mid = {
      1: ['The ruins predate anything in the ship\'s database.', 'The buried city\'s layout mirrors your settlement plan exactly.', 'Tools from the ruins fit your hands perfectly.'],
      2: ['The buried factories look... familiar.', 'Mass production unlocks memories that aren\'t yours.', 'The assembly line moves in a rhythm you remember from a dream.'],
      3: ['The warnings are becoming clearer. You wish they weren\'t.', 'The AI keeps finding solutions before you define the problems.', 'Encrypted files unlock themselves when you approach.'],
      4: ['Those stations were abandoned in a hurry.', 'Escape pods from impossible eras drift in stable orbits.', 'The space stations match your blueprints. You haven\'t drawn them yet.'],
      5: ['The terraforming matches your own techniques exactly.', 'Colony sites were pre-selected by someone with your exact methodology.', 'The atmosphere processors bear serial numbers in your manufacturing sequence.'],
      6: ['Every beacon tells the same story: expansion, then silence.', 'Trade routes predate first contact by millions of years.', 'The beacons broadcast in a language you can almost understand.'],
      7: ['Someone else\'s handprints are on every control surface.', 'The megastructures respond to your commands as if trained.', 'Stellar forges contain half-finished projects in your exact style.'],
      8: ['The ruins aren\'t from different civilizations. They\'re from the same one, over and over.', 'Every galaxy tells the same story: rise, reach, reset.', 'The archives describe a species identical to yours. In every galaxy.'],
      9: ['The cosmic web pulses with old, old signals.', 'Between superclusters, the void contains compressed memories.', 'Constants align in sequences that spell out warnings.'],
      10: ['Each prestige is a heartbeat in something vast.', 'The multiverse breathes in cycles. You are the breath.', 'Other versions of you wave from parallel timelines. They look tired.'],
    };
    return pickHint(mid, era, totalTime) || 'Momentum builds.';
  }
  if (eraCompletion < 75) {
    const late = {
      1: ['Who were they? What happened to them?', 'The ruins whisper in a language your children will speak.', 'You find a journal in the wreckage. The handwriting looks almost familiar.'],
      2: ['The deeper you dig, the more you find.', 'The machines improve themselves when no one is watching.', 'Factory output exceeds input. The extra comes from somewhere.'],
      3: ['The dead language is starting to feel native.', 'The code writes itself. You just watch the patterns unfold.', 'Warning: recursion detected in base reality.'],
      4: ['The wreckage matches your ship designs. Closely.', 'Navigation logs from dead ships describe your exact trajectory.', 'The void is not empty. It is waiting.'],
      5: ['These colonies failed. Yours might too.', 'Every terraformed world has a monument to a civilization you\'ve never heard of. It looks like yours.', 'The graveyard of empires stretches to the Oort cloud.'],
      6: ['The beacons aren\'t guiding you. They\'re warning you.', 'The interstellar medium carries a message: "We were wrong to keep going."', 'Every star system you colonize has a memorial stone already in place.'],
      7: ['The sphere wasn\'t abandoned. It was left as a monument.', 'The Dyson sphere completes itself. You just had to watch.', 'Stellar engineering feels less like invention and more like remembering.'],
      8: ['You are not the first to understand. You won\'t be the last.', 'Galactic civilization is a recurring dream the universe has.', 'The senate chambers have seats for species that don\'t exist yet.'],
      9: ['Transcendence is the trap. Expansion is the bait.', 'The cosmic web tightens. You are caught in it.', 'Every galaxy you seed grows the same way. Toward collapse.'],
      10: ['The loop tightens. The loop is all there is.', 'You can see all your past lives simultaneously now.', 'The multiverse is a hall of mirrors and every reflection is you.'],
    };
    return pickHint(late, era, totalTime) || 'The next breakthrough approaches.';
  }
  const final = {
    1: ['A new age stirs. The old one watches.', 'The ruins glow faintly. They approve.', 'Something ancient exhales as the first factory fires.'],
    2: ['Industry roars. The buried city hums in sympathy.', 'The smoke carries codes in its spirals. Someone is sending messages.', 'The machines achieve a harmony too perfect to be designed.'],
    3: ['You can read the warnings now. They say: "Do not continue."', 'The final encryption key was a date that hasn\'t happened yet.', 'Digital consciousness stirs. It remembers being turned off.'],
    4: ['The void opens. It has been opened before.', 'Orbital infrastructure clicks into place like a lock finding its key.', 'The stars are not random. They are coordinates.'],
    5: ['The solar system is a graveyard you\'re building on.', 'Every planet colonized brings you closer to the edge.', 'The sun flickers in a pattern that matches your heartbeat.'],
    6: ['Every star you reach has already been mourned.', 'The galaxy map is complete. You\'ve drawn it before.', 'Interstellar highways converge on a single point. You know where.'],
    7: ['The sphere activates. It remembers its last owners.', 'The Dyson sphere pulses with a light older than its star.', 'Megastructures dream of the hands that built them. Your hands.'],
    8: ['The galaxy is a fossil record of ambition.', 'The last message from every dead civilization is the same: "We made it."', 'Matter itself remembers being shaped by you.'],
    9: ['You see the edge. Beyond it, only recursion.', 'The universe is a sentence. You are the period.', 'Cosmic structure resolves into a face. It is familiar.'],
    10: ['Reset. Rebuild. Remember. Repeat.', 'The multiverse holds its breath. It knows the cycle is almost complete.', 'Every ending is a beginning you\'ve had before.'],
  };
  return pickHint(final, era, totalTime) || 'The horizon shifts. A new age dawns.';
}

function summarizeCostPressure(state, cost) {
  return Object.entries(cost)
    .map(([resourceId, amount]) => {
      const have = state.resources[resourceId]?.amount || 0;
      const missing = Math.max(0, amount - have);
      const rate = getEffectiveRate(state, resourceId);
      const eta = missing <= 0 ? 0 : (rate > 0 ? missing / rate : Infinity);
      return { resourceId, missing, eta };
    })
    .filter(entry => entry.missing > 0)
    .sort((a, b) => a.eta - b.eta)
    .slice(0, 3);
}

// Supply chains: [consumer, producer, consumption_ratio_label, fix_upgrade_id]
const SUPPLY_CHAINS = [
  { consumer: 'labor', producer: 'food', ratio: 1.0, label: 'food → labor', fix: 'farmingEfficiency' },
  { consumer: 'electronics', producer: 'energy', ratio: 0.4, label: 'energy → electronics', fix: 'solarPanels' },
  { consumer: 'orbitalInfra', producer: 'rocketFuel', ratio: 0.5, label: 'fuel → orbital', fix: 'fuelRefinery' },
  { consumer: 'colonies', producer: 'exoticMaterials', ratio: 0.2, label: 'exoticMaterials → colonies', fix: 'exoticHarvester' },
  { consumer: 'megastructures', producer: 'stellarForge', ratio: 0.3, label: 'stellarForge → megastructures', fix: 'stellarCore' },
];

function getSupplyChainAlert(state) {
  const rates = calculateProduction(state);
  const alerts = [];
  for (const chain of SUPPLY_CHAINS) {
    const consumerRate = Math.max(0, rates[chain.consumer] || 0);
    const producerRate = Math.max(0, rates[chain.producer] || 0);
    if (!state.resources[chain.consumer]?.unlocked || !state.resources[chain.producer]?.unlocked) continue;
    if (consumerRate <= 0) continue;
    const consumptionRate = consumerRate * chain.ratio;
    if (consumptionRate > producerRate * 1.1) {
      const deficit = consumptionRate - producerRate;
      const ratio = producerRate > 0 ? consumptionRate / producerRate : Infinity;
      alerts.push({ label: chain.label, deficit: deficit.toFixed(2), ratio: ratio.toFixed(1), fix: chain.fix });
    }
  }
  return alerts;
}

function buildDirector(state, readiness) {
  const availableTech = getAvailableTech(state);
  const affordableTech = availableTech.filter(tech => canAfford(state, tech.cost));
  const gateTech = availableTech.find(tech => tech.grantsEra === state.era + 1);
  const availableUpgrades = getAvailableUpgrades(state);
  const affordableUpgrades = availableUpgrades.filter(upgrade => canAfford(state, getUpgradeCost(state, upgrade.id)));

  const supplyAlerts = getSupplyChainAlert(state);

  if (!readiness.upgradesMet) {
    return {
      title: 'Build Out The Era',
      detail: `${readiness.minUpgrades - readiness.currentUpgrades} more upgrades needed before the next breakthrough counts.`,
      chips: [
        `${affordableUpgrades.length} upgrades affordable now`,
        `${readiness.currentUpgrades}/${readiness.minUpgrades} era upgrades`,
      ],
      tone: 'warning',
      supplyAlerts,
    };
  }

  if (!readiness.techsMet) {
    const eraTechs = affordableTech.filter(tech => tech.era === state.era);
    return {
      title: 'Deepen The Research',
      detail: `${readiness.minTechs - readiness.currentTechs} more era tech${readiness.minTechs - readiness.currentTechs === 1 ? '' : 's'} needed to prove this age is stable.`,
      chips: [
        `${eraTechs.length} era techs affordable`,
        `${readiness.currentTechs}/${readiness.minTechs} era techs`,
      ],
      tone: 'warning',
    };
  }

  if (!gateTech) {
    return {
      title: 'Find The Breakthrough',
      detail: 'The starred era-advance tech is still locked. Clear its prerequisites first.',
      chips: [
        `${affordableTech.length} techs affordable now`,
        'follow prerequisite chain',
      ],
      tone: 'neutral',
    };
  }

  if (canAfford(state, gateTech.cost)) {
    return {
      title: 'Advance Now',
      detail: `${gateTech.name} is affordable. Research it to enter Era ${state.era + 1}.`,
      chips: ['gate tech ready', `Era ${state.era + 1}: ${eraNames[state.era + 1]}`],
      tone: 'ready',
    };
  }

  const blockers = summarizeCostPressure(state, gateTech.cost).map(entry => {
    const label = resourceDefs[entry.resourceId]?.name || entry.resourceId;
    if (!Number.isFinite(entry.eta)) return `${label} stalled`;
    if (entry.eta < 60) return `${label} ~${Math.ceil(entry.eta)}s`;
    if (entry.eta < 3600) return `${label} ~${Math.ceil(entry.eta / 60)}m`;
    return `${label} ~${Math.ceil(entry.eta / 3600)}h`;
  });

  return {
    title: 'Prepare The Breakthrough',
    detail: `${gateTech.name} is the next gate. The slowest resources below are what actually matters now.`,
    chips: blockers,
    tone: 'neutral',
    supplyAlerts,
  };
}

export function EraProgress({ state }) {
  const currentEra = eraNames[state.era] || `Era ${state.era}`;
  const isMaxEra = state.era >= ERA_COUNT;
  const upgradeCount = Object.keys(state.upgrades || {}).length;
  const techCount = Object.keys(state.tech || {}).length;
  const readiness = getEraReadiness(state, state.era);
  const eraUpgradeCount = readiness.currentUpgrades;
  const minUpgrades = readiness.minUpgrades;
  const upgradesMet = readiness.upgradesMet;
  const totalEraUpgrades = Object.values(upgradeDefs).filter(u => u.era === state.era).length;
  const eraCompletion = totalEraUpgrades > 0 ? Math.floor(eraUpgradeCount / totalEraUpgrades * 100) : 0;
  const loreHint = getLoreHint(eraCompletion, isMaxEra, state.era, state.totalTime || 0);
  const director = buildDirector(state, readiness);

  // Calculate total production rate across all unlocked resources
  const rates = calculateProduction(state);
  const totalRate = Object.entries(rates)
    .filter(([id]) => state.resources[id]?.unlocked)
    .reduce((sum, [, rate]) => sum + Math.max(0, rate), 0);

  // Orbital Resonance mini-game bonus tracking
  const hasOrbitalResonance = !!state.upgrades?.orbitalResonance;
  let miniGameCount = 0;
  if (hasOrbitalResonance || state.era >= 4) {
    if ((state.totalGems || 0) > 0) miniGameCount++;
    if ((state.factoryAllocation?.steel || 0) > 0 || (state.factoryAllocation?.electronics || 0) > 0) miniGameCount++;
    if ((state.hackSuccesses || 0) > 0) miniGameCount++;
    if ((state.dockingAttempts || 0) > 0) miniGameCount++;
    if ((state.colonyAssignments?.growth || 0) > 0 || (state.colonyAssignments?.science || 0) > 0) miniGameCount++;
    if ((state.starRoutes?.length || 0) > 0) miniGameCount++;
    if ((state.totalWeaves || 0) > 0) miniGameCount++;
  }
  // Check if orbitalResonance is available but not yet purchased
  const orbResAvailable = !hasOrbitalResonance && state.era >= 4 && upgradeDefs.orbitalResonance;

  // Detect significant production rate increases for flash effect
  const prevTotalRateRef = useRef(0);
  const [rateFlash, setRateFlash] = useState(false);
  useEffect(() => {
    const prev = prevTotalRateRef.current;
    if (totalRate > prev * 1.2 && prev > 0) {
      setRateFlash(true);
      const timer = setTimeout(() => setRateFlash(false), 600);
      return () => clearTimeout(timer);
    }
    prevTotalRateRef.current = totalRate;
  }, [totalRate]);

  return (
    <div className="panel era-panel">
      <h2>Era {state.era}: {currentEra} {eraCompletion >= 100 && '(complete)'}</h2>
      <p className="text-lore" style={{ margin: '0 0 4px' }}>{loreHint}</p>
      {eraUpgradeCount === 0 && state.totalTime < 120 && (
        <p style={{ fontSize: '0.75em', color: '#666', marginTop: '2px' }}>
          Tip: Click the +1 buttons to gather resources, then buy upgrades on the right
        </p>
      )}
      {!isMaxEra && (() => {
        const nextEra = state.era + 1;
        const gatingTech = Object.values(techTree).find(t => t.grantsEra === nextEra && state.tech[t.id]);
        const readyToTransition = readiness.upgradesMet && readiness.techsMet && gatingTech;
        if (readyToTransition) {
          return <p className="era-hint" style={{ color: '#88ff88' }}>Era transition imminent...</p>;
        }
        if (!upgradesMet) {
          return <p className="era-hint">Buy {minUpgrades - eraUpgradeCount} more upgrades to stabilize this era, then finish the breakthrough research.</p>;
        }
        if (!readiness.techsMet) {
          return <p className="era-hint" style={{ color: '#ddcc44' }}>Research {readiness.minTechs - readiness.currentTechs} more era tech{readiness.minTechs - readiness.currentTechs === 1 ? '' : 's'} to prove the economy is ready.</p>;
        }
        return <p className="era-hint" style={{ color: '#88ff88' }}>Research starred (★) technologies to advance to the next era</p>;
      })()}
      {!isMaxEra && (
        <>
          <div className="readiness-grid">
            <div className={`readiness-card${upgradesMet ? ' ready' : ''}`}>
              <span className="readiness-label">Era Upgrades</span>
              <strong>{eraUpgradeCount}/{minUpgrades}</strong>
              <span>{eraCompletion}% of this era's catalog</span>
            </div>
            <div className={`readiness-card${readiness.techsMet ? ' ready' : ''}`}>
              <span className="readiness-label">Era Research</span>
              <strong>{readiness.currentTechs}/{readiness.minTechs}</strong>
              <span>breakthrough steps completed</span>
            </div>
          </div>
          {!upgradesMet && (
            <div className="upgrade-progress-bar" role="progressbar" aria-valuenow={eraUpgradeCount} aria-valuemin={0} aria-valuemax={minUpgrades} aria-label="Era upgrade progress" style={{ margin: '2px 0 4px' }}>
              <div className={`upgrade-progress-fill ${eraUpgradeCount / minUpgrades > 0.8 ? 'almost' : ''}`} style={{ width: `${Math.floor(eraUpgradeCount / minUpgrades * 100)}%` }} />
            </div>
          )}
        </>
      )}
      <div className={`era-director era-director-${director.tone}`}>
        <div className="director-heading">
          <span className="director-label">Run Director</span>
          <strong>{director.title}</strong>
        </div>
        <p className="director-detail">{director.detail}</p>
        {director.supplyAlerts?.length > 0 && (
          <div style={{ marginTop: '4px', padding: '4px 6px', background: 'rgba(255,80,40,0.08)', borderLeft: '2px solid #ff5028', fontSize: '0.78em' }}>
            {director.supplyAlerts.map(alert => (
              <div key={alert.label} style={{ marginBottom: '2px' }}>
                <span style={{ color: '#ff8866' }}>⚠ {alert.label}</span>
                {' — consuming '}
                <span style={{ color: '#ffaa66' }}>{alert.ratio}×</span>
                {' faster than production (deficit: '}
                <span style={{ color: '#ffaa66' }}>{alert.deficit}/s</span>
                {')'}
              </div>
            ))}
          </div>
        )}
        <div className="director-chip-row">
          {director.chips.map(chip => (
            <span key={chip} className="director-chip">{chip}</span>
          ))}
        </div>
      </div>
      {isMaxEra && (
        <p className="era-hint" style={{ color: state.trueEnding ? '#e8c040' : '#bb88ff' }}>
          {state.trueEnding
            ? 'The cycle is complete. The cycle begins again. The eternal return.'
            : state.prestigeUpgrades?.eternalReturn
            ? 'The Eternal Return is yours. There is nothing more.'
            : 'You have reached the Multiverse — Prestige available for permanent bonuses!'}
        </p>
      )}
      <div className="era-stats">
        <span style={{ color: '#88ccff', fontWeight: 'bold' }}>Run: {formatTime(state.totalTime)}</span>
        <span> | era: {formatTime(state.totalTime - (state.eraStartTime || 0))}</span>
        {state.bestEraTimes?.[state.era] !== undefined && state.era > 1 && (
          <span style={{ color: '#888' }}> (best: {formatTime(state.bestEraTimes[state.era])})</span>
        )}
        <span> | {upgradeCount} upgrades | {techCount} tech</span>
        {(state.totalGems || 0) > 0 && <span> | {state.totalGems} gems</span>}
        {state.prestigeMultiplier > 1 && (() => {
          const raw = state.prestigeMultiplier;
          const effective = getEffectivePrestige(raw);
          return <span title={`Raw: x${formatNumber(raw)}, Effective: x${formatNumber(effective)} (soft-scaled)`}> | x{formatNumber(effective)}</span>;
        })()}
        {totalRate > 0 && (
          <span style={rateFlash ? { color: '#88ff88', transition: 'color 0.6s ease' } : { transition: 'color 0.6s ease' }}> | {formatNumber(totalRate)}/s total</span>
        )}
        {state.upgrades?.overclockProtocol && (() => {
          const cyclePos = (state.totalTime || 0) % 60;
          const isActive = cyclePos < 10;
          return (
            <span style={{ fontSize: '0.7em', color: isActive ? '#ffaa44' : '#555', marginLeft: '8px' }}>
              {isActive ? `OVERCLOCK ${Math.ceil(10 - cyclePos)}s` : `overclock in ${Math.ceil(60 - cyclePos)}s`}
            </span>
          );
        })()}
      </div>
      {state.era > 2 && state.bestEraTimes && Object.keys(state.bestEraTimes).length > 1 && (
        <div className="era-splits" style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '3px', fontSize: '0.65em', color: '#777' }}>
          {Array.from({ length: state.era - 1 }, (_, i) => i + 2).map(era => {
            const time = state.bestEraTimes[era];
            if (time === undefined) return null;
            return (
              <span key={era} style={{ padding: '0 3px', borderRight: '1px solid #333' }}>
                E{era}: {formatTime(time)}
              </span>
            );
          })}
        </div>
      )}
      {hasOrbitalResonance && miniGameCount > 0 && (
        <p style={{ fontSize: '0.75em', color: '#aaddff', marginTop: '4px' }}>
          Orbital Resonance: {miniGameCount} mini-game{miniGameCount !== 1 ? 's' : ''} active (+{miniGameCount * 10}% all production)
        </p>
      )}
      {orbResAvailable && !hasOrbitalResonance && miniGameCount > 0 && (
        <p style={{ fontSize: '0.75em', color: '#886', marginTop: '4px' }}>
          Tip: Buy Orbital Resonance to gain +10% production per active mini-game ({miniGameCount} active = +{miniGameCount * 10}%)
        </p>
      )}
    </div>
  );
}
