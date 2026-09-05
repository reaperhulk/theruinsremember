import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createInitialState } from '../state.js';
import { calculateEconomy, getCostPressure, estimateAffordability } from '../economy.js';
import { getRecommendedRepeatables, previewUpgrade, purchaseUpgrade } from '../upgrades.js';
import { getEffectiveCap } from '../resources.js';
import { getPurchaseTarget, prioritizePurchase } from '../guidance.js';
import { ResourcePanel } from '../../ui/ResourcePanel.jsx';
import { RELICS } from '../../data/relics.js';
import { addEchoPressure, claimRelic } from '../relics.js';
import { runPlayerJourney } from '../../../scripts/player-journey.mjs';

describe('guidance based on the actual economy', () => {
  it('sorts the slowest missing resource first and treats zero net production as blocked', () => {
    const state = createInitialState();
    const cost = { food: 300, materials: 50, energy: 20 };
    const pressure = getCostPressure(state, cost);
    expect(pressure[0].id).toBe('food');
    expect(estimateAffordability(state, cost).seconds).toBe(pressure[0].eta);
    state.protectProgression = false;
    state.resources.electronics.unlocked = true;
    state.resources.electronics.rateAdd = 100;
    const blocked = getCostPressure(state, cost);
    expect(blocked[0]).toMatchObject({ id: 'energy', reason: 'production', eta: Infinity });
  });
  it('shows zero accumulation when ordinary non-consumer storage is full', () => {
    const state = createInitialState();
    state.resources.materials.amount = getEffectiveCap(state, 'materials');
    expect(calculateEconomy(state).net.materials).toBe(0);
    const markup = renderToStaticMarkup(<ResourcePanel state={state} onUpdate={() => {}} />);
    expect(markup).toContain('Storage full · +0/s');
    expect(markup).toContain('Potential production: 0.8/s');
  });
  it('affordable previews include actual spending and leave the source state untouched', () => {
    const state = createInitialState();
    for (const r of Object.values(state.resources)) r.amount = 100;
    const before = structuredClone(state);
    const preview = previewUpgrade(state, 'tools');
    expect(preview.includesCost).toBe(true);
    expect(preview.net).toEqual(calculateEconomy(purchaseUpgrade(state, 'tools')).net);
    expect(preview.previewState.resources.materials.amount).toBeLessThan(state.resources.materials.amount);
    expect(state).toEqual(before);
    expect(previewUpgrade(createInitialState(), 'tools').includesCost).toBe(false);
  });
  it('surfaces a fuel investment when it improves the purchase bottleneck', () => {
    const state = { ...createInitialState(), era: 4, upgrades: { rocketScience: true } };
    state.resources.rocketFuel.unlocked = true;
    const choices = getRecommendedRepeatables(state, { rocketFuel: 100 });
    expect(choices.map(u => u.id)).toContain('launchComplex');
    state.resources.rocketFuel.amount = getEffectiveCap(state, 'rocketFuel');
    expect(getRecommendedRepeatables(state, { rocketFuel: 100 })).toEqual([]);
  });
  it('protecting a purchase preserves the queue and offers a resumable goal', () => {
    let state = { ...createInitialState(), protectProgression: false, goalsPaused: true };
    state = prioritizePurchase(state, { kind: 'upgrade', id: 'tools' });
    expect(state.protectProgression).toBe(true);
    expect(state.goalsPaused).toBe(false);
    expect(getPurchaseTarget(state)).toMatchObject({ id: 'tools', queued: true });
    expect(prioritizePurchase(state, { kind: 'upgrade', id: 'tools' }).goals).toHaveLength(1);
  });
  it('offers useful relics throughout early play and expands the pool with the era', () => {
    let state = addEchoPressure(createInitialState(), 100, [0.99, 0.99, 0.99]);
    expect(state.relicOffer.every(id => RELICS[id].availableEra <= 1)).toBe(true);
    state = addEchoPressure(claimRelic(state, state.relicOffer[0]), 100, [0.99, 0.99, 0.99]);
    expect(state.relicOffer).toHaveLength(2);
    expect(state.relicOffer.every(id => RELICS[id].availableEra <= 1)).toBe(true);
    const late = addEchoPressure({ ...createInitialState(), era: 8 }, 100, [0.99, 0.99, 0.99]);
    expect(late.relicOffer).toContain('loomNeedle');
  });
  it('uses the visible savings recovery action and finishes two natural cycles', { timeout: 30000 }, () => {
    const result = runPlayerJourney({ persona: 'engaged', cycles: 2, useRecovery: true, disableProtection: true });
    expect(result.completed, JSON.stringify(result.failures)).toBe(true);
    expect(result.legacy.commands['protect-purchase']).toBeGreaterThan(0);
  });
});
