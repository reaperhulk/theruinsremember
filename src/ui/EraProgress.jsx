import { eraNames, ERA_COUNT, getMinUpgradesForEra, countEraUpgrades } from '../engine/eras.js';
import { upgrades as upgradeDefs } from '../data/upgrades.js';
import { calculateProduction } from '../engine/resources.js';
import { formatNumber, formatTime } from './format.js';

function getLoreHint(eraCompletion, isMaxEra, era) {
  if (isMaxEra) return 'The cycle completes. The cycle begins again.';
  if (eraCompletion === 0) {
    const starts = {
      1: 'Smoke rises from the wreckage. Survivors gather.',
      2: 'The first furnace glows. Something stirs beneath the dig site.',
      3: 'The old machines are waking up.',
      4: 'The sky is full of wreckage that isn\'t yours.',
      5: 'Other worlds bear scars of habitation.',
      6: 'Dead beacons flicker back to life at your approach.',
      7: 'The dark sphere waits in silence.',
      8: 'Ruins everywhere. Every galaxy. Every star.',
      9: 'The pattern is inescapable.',
      10: 'You remember this. You have always remembered this.',
    };
    return starts[era] || 'The journey begins...';
  }
  if (eraCompletion < 25) {
    const early = {
      1: 'Strange metal fragments litter the crash site.',
      2: 'Miners report structures too deep to be natural.',
      3: 'Fragments of ancient data surface in the static.',
      4: 'Orbital scans reveal geometric patterns in the debris.',
      5: 'Collapsed domes dot the surface of every moon.',
      6: 'The star maps lead somewhere. Nowhere good.',
      7: 'The sphere\'s power grid could still function.',
      8: 'A thousand dead civilizations left the same last message.',
      9: 'They all reached this far. They all fell silent.',
      10: 'The walls between worlds are thinner than memory.',
    };
    return early[era] || 'Foundations are being laid.';
  }
  if (eraCompletion < 50) {
    const mid = {
      1: 'The ruins predate anything in the ship\'s database.',
      2: 'The buried factories look... familiar.',
      3: 'The warnings are becoming clearer. You wish they weren\'t.',
      4: 'Those stations were abandoned in a hurry.',
      5: 'The terraforming matches your own techniques exactly.',
      6: 'Every beacon tells the same story: expansion, then silence.',
      7: 'Someone else\'s handprints are on every control surface.',
      8: 'The ruins aren\'t from different civilizations. They\'re from the same one, over and over.',
      9: 'The cosmic web pulses with old, old signals.',
      10: 'Each prestige is a heartbeat in something vast.',
    };
    return mid[era] || 'Momentum builds.';
  }
  if (eraCompletion < 75) {
    const late = {
      1: 'Who were they? What happened to them?',
      2: 'The deeper you dig, the more you find.',
      3: 'The dead language is starting to feel native.',
      4: 'The wreckage matches your ship designs. Closely.',
      5: 'These colonies failed. Yours might too.',
      6: 'The beacons aren\'t guiding you. They\'re warning you.',
      7: 'The sphere wasn\'t abandoned. It was left as a monument.',
      8: 'You are not the first to understand. You won\'t be the last.',
      9: 'Transcendence is the trap. Expansion is the bait.',
      10: 'The loop tightens. The loop is all there is.',
    };
    return late[era] || 'The next breakthrough approaches.';
  }
  const final = {
    1: 'A new age stirs. The old one watches.',
    2: 'Industry roars. The buried city hums in sympathy.',
    3: 'You can read the warnings now. They say: "We were you."',
    4: 'The void opens. It has been opened before.',
    5: 'The solar system is a graveyard you\'re building on.',
    6: 'Every star you reach has already been mourned.',
    7: 'The sphere activates. It remembers its last owners.',
    8: 'The galaxy is a fossil record of ambition.',
    9: 'You see the edge. Beyond it, only recursion.',
    10: 'Reset. Rebuild. Remember. Repeat.',
  };
  return final[era] || 'The horizon shifts. A new age dawns.';
}

export function EraProgress({ state }) {
  const currentEra = eraNames[state.era] || `Era ${state.era}`;
  const isMaxEra = state.era >= ERA_COUNT;
  const upgradeCount = Object.keys(state.upgrades || {}).length;
  const techCount = Object.keys(state.tech || {}).length;
  const eraUpgradeCount = countEraUpgrades(state, state.era);
  const minUpgrades = getMinUpgradesForEra(state.era);
  const upgradesMet = eraUpgradeCount >= minUpgrades;
  const totalEraUpgrades = Object.values(upgradeDefs).filter(u => u.era === state.era).length;
  const eraCompletion = totalEraUpgrades > 0 ? Math.floor(eraUpgradeCount / totalEraUpgrades * 100) : 0;
  const loreHint = getLoreHint(eraCompletion, isMaxEra, state.era);

  // Calculate total production rate across all unlocked resources
  const rates = calculateProduction(state);
  const totalRate = Object.entries(rates)
    .filter(([id]) => state.resources[id]?.unlocked)
    .reduce((sum, [, rate]) => sum + Math.max(0, rate), 0);

  return (
    <div className="panel era-panel">
      <h2>Era {state.era}: {currentEra} {eraCompletion >= 100 && '(complete)'}</h2>
      <p style={{ fontSize: '0.8em', color: '#998866', fontStyle: 'italic', margin: '0 0 4px' }}>{loreHint}</p>
      {eraUpgradeCount === 0 && state.totalTime < 120 && (
        <p style={{ fontSize: '0.75em', color: '#666', marginTop: '2px' }}>
          Tip: Click the +1 buttons to gather resources, then buy upgrades on the right
        </p>
      )}
      {!isMaxEra && !upgradesMet && (
        <p className="era-hint">
          Buy {minUpgrades - eraUpgradeCount} more upgrades, then research ★ tech to advance
        </p>
      )}
      {!isMaxEra && upgradesMet && (
        <p className="era-hint" style={{ color: '#88ff88' }}>
          Research starred (★) technologies to advance to the next era
        </p>
      )}
      {!isMaxEra && (
        <>
          <p className="era-hint" style={{ color: upgradesMet ? '#88ff88' : '#ffcc44' }}>
            Upgrades: {eraUpgradeCount}/{minUpgrades} needed ({eraCompletion}% of era)
            {upgradesMet ? ' ✓' : ''}
          </p>
          {!upgradesMet && (
            <div className="upgrade-progress-bar" style={{ margin: '2px 0 4px' }}>
              <div className={`upgrade-progress-fill ${eraUpgradeCount / minUpgrades > 0.8 ? 'almost' : ''}`} style={{ width: `${Math.floor(eraUpgradeCount / minUpgrades * 100)}%` }} />
            </div>
          )}
        </>
      )}
      {isMaxEra && (
        <p className="era-hint" style={{ color: '#bb88ff' }}>
          You have reached the Multiverse — Prestige available for permanent bonuses!
        </p>
      )}
      <div className="era-stats">
        <span>{formatTime(state.totalTime)}</span>
        <span> | era: {formatTime(state.totalTime - (state.eraStartTime || 0))}</span>
        <span> | {upgradeCount} upgrades | {techCount} tech</span>
        {(state.totalGems || 0) > 0 && <span> | {state.totalGems} gems</span>}
        {state.prestigeMultiplier > 1 && (
          <span> | x{state.prestigeMultiplier.toFixed(1)}</span>
        )}
        {totalRate > 0 && (
          <span> | {formatNumber(totalRate)}/s</span>
        )}
      </div>
    </div>
  );
}
