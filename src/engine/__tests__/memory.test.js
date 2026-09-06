import { describe, it, expect } from 'vitest';
import { createInitialState, migrateState } from '../state.js';
import { approveEraAdvance, needsEraReview, transitionEra } from '../eras.js';
import { tick } from '../tick.js';
import { advanceTime } from '../advanceTime.js';
import { DECISIONS } from '../../data/decisions.js';
import { resources } from '../../data/resources.js';
import { upgrades } from '../../data/upgrades.js';
import { recordDecision, recordChapter, markDiscoveryRead, inheritancePreview, getNarrativeEnding } from '../memory.js';
import { performPrestige } from '../prestige.js';
import { calculateEconomy, getSupplyChains } from '../economy.js';
import { selectProductionRoute } from '../legacy.js';
import { getPublicWorks } from '../publicWorks.js';
import { getForgeCharges, getRealityForgeRecipes } from '../realityForge.js';
import { parseSave, serializeSave } from '../saves.js';

const ready = () => { const s = createInitialState(); s.tech = { metallurgy: true, industrialRevolution: true }; s.upgrades = Object.fromEntries(Object.values(upgrades).filter(d => d.era === 1 && !d.repeatable && !d.exclusiveWith).map(d => [d.id, true])); return s; };
describe('chapter decisions and inheritance', () => {
  it('requires an earned Continue on the first encounter, including while absent', () => {
    const fresh = createInitialState(); expect(approveEraAdvance(fresh)).toBe(fresh);
    const s = ready(); expect(advanceTime(s, 300, () => 0.99, 1, { pauseForgetting: true }).era).toBe(1);
    const approved = approveEraAdvance(s); expect(approved.eraReviewApproved).toBe(1);
    expect(tick(approved, 1, () => 0.99).era).toBe(2);
    expect(needsEraReview({ ...s, prestigeCount: 1 })).toBe(false);
    expect(needsEraReview({ ...s, prestigeCount: 1, eraReviewMode: 'always' })).toBe(true);
  });
  it('keeps legacy automatic transitions and rejects invalid review settings', () => {
    const s = ready(); delete s.eraReviewMode; delete s.eraReviewApproved; s.saveVersion = 10;
    expect(tick(migrateState(s), 1, () => 0.99).era).toBe(2);
    expect(() => parseSave(JSON.stringify({ ...s, eraReviewMode: 'unknown' }))).toThrow('chapter transitions');
  });
  it('has two valid, exclusive, authored consequences in all ten eras', () => {
    for (let era = 1; era <= 10; era++) {
      const choices = Object.entries(DECISIONS).filter(([, d]) => d.era === era);
      expect(choices).toHaveLength(2);
      expect(upgrades[choices[0][0]].exclusiveWith).toBe(choices[1][0]);
      for (const [id, d] of choices) { expect(upgrades[id]).toBeDefined(); if (d.resource) expect(resources[d.resource]).toBeDefined(); }
    }
  });
  it('makes preservation and extraction produce different economies', () => {
    const base = transitionEra(createInitialState(), 5);
    const hearth = { ...base, upgrades: { forkHearth: true }, productionRoute: 'biospheres' };
    const quarry = { ...base, upgrades: { forkQuarry: true } };
    expect(selectProductionRoute(base, 'biospheres')).toBe(base);
    expect(getSupplyChains({ ...hearth, productionRoute: 'standard' }).find(c => c.output === 'colonies').input).toBe('exoticMaterials');
    expect(selectProductionRoute({ ...hearth, productionRoute: 'standard' }, 'biospheres').productionRoute).toBe('biospheres');
    expect(getSupplyChains(hearth).find(c => c.output === 'colonies').input).toBe('food');
    expect(getSupplyChains(quarry).find(c => c.output === 'colonies').input).toBe('exoticMaterials');
    const industrial = transitionEra(createInitialState(), 2);
    expect(calculateEconomy({ ...industrial, upgrades: { forkQuarry: true } }).gross.steel).toBeCloseTo(calculateEconomy(industrial).gross.steel * 1.25);
    expect(getPublicWorks({ ...base, upgrades: { forkArchive: true } }).cost).toBe(getPublicWorks(base).cost * 0.8);
  });
  it('changes the late forge opportunity and cost without bypassing its minimum', () => {
    const base = transitionEra(createInitialState(), 10);
    expect(getForgeCharges({ ...base, upgrades: { forkInfluenceWeb: true } }).earned).toBe(getForgeCharges(base).earned + 1);
    base.resources.quantumEchoes.amount = 10000; base.resources.realityFragments.amount = 10000;
    const efficient = getRealityForgeRecipes({ ...base, upgrades: { forkMatterWorks: true } });
    expect(efficient[0].echoes).toBe(300); expect(getRealityForgeRecipes(base)[0].echoes).toBe(500);
  });
  it('preserves actual choices, dependent discoveries and read state across saves and resets', () => {
    let s = createInitialState(); s.upgrades.forkHearth = true;
    s = markDiscoveryRead(recordDecision(s, 'forkHearth'), 'choice:0:forkHearth');
    const reloaded = parseSave(serializeSave(s, 100));
    expect(reloaded.archive.discoveries['choice:0:forkHearth'].read).toBe(true);
    const next = performPrestige(reloaded);
    expect(next.archive.lastChoices).toEqual(['forkHearth']);
    expect(next.archive.discoveries['chapter:1:1'].text).toContain('sheltered hearth');
    expect(next.autoGather).toBe(true); expect(next.resources.materials.rateAdd).toBeGreaterThan(0);
    expect(next.resources.materials.amount).toBeGreaterThan(0);
    expect(recordChapter(next)).toBe(next);
  });
  it('matches the promised branch inheritance and earned endings', () => {
    const s = createInitialState(); s.upgrades = { forkAscendancy: true, forkEchoHarvest: true, forkRefinement: true };
    const preview = inheritancePreview(s); const next = performPrestige(s);
    expect(next.archive.shards).toBe(preview.shards); expect(preview.shards).toBe(11);
    expect(next.resources.materials.amount).toBeGreaterThanOrEqual(2500);
    expect(getNarrativeEnding({ ...s, trueEnding: true }).text).toContain('Eternal Return');
    expect(getNarrativeEnding({ ...s, forgetting: { sealed: 3, collapsed: false } }).title).toBe('The defended memory');
  });
});
