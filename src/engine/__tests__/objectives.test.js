import { describe, it, expect } from 'vitest';
import { createInitialState } from '../state.js';
import { getEraObjective } from '../objectives.js';
import { purchaseUpgrade } from '../upgrades.js';
import { purchaseProject } from '../projects.js';
import { unlockTech } from '../tech.js';
import { queueGoal } from '../goals.js';
import { CHAPTERS } from '../../data/chapters.js';

describe('one objective for the current era', () => {
  it('keeps the foundation visible when the breakthrough is already researched', () => {
    const state = { ...createInitialState(), tech: { metallurgy: true, industrialRevolution: true } };
    for (const resource of Object.values(state.resources)) resource.amount = 10000;
    const objective = getEraObjective(state);
    expect(objective.stage).toBe('foundation');
    expect(objective.target.kind).toBe('project');
    expect(purchaseProject(state, objective.target.id)).not.toBeNull();
  });
  it('honors a deliberate queued research goal without concealing the blocker', () => {
    const state = queueGoal(createInitialState(), 'tech', 'metallurgy');
    const objective = getEraObjective(state);
    expect(objective.stage).toBe('foundation');
    expect(objective.target).toMatchObject({ id: 'metallurgy', queued: true });
  });
  it('offers legal purchases and relevant unlocked resources throughout all chapters', () => {
    for (let era = 1; era <= 10; era++) {
      const state = { ...createInitialState(), era, nextCycleDoctrine: 'reconstruction' };
      for (const resource of Object.values(state.resources)) { resource.amount = 1e50; resource.unlocked = true; }
      const objective = getEraObjective(state);
      expect(objective.chapter).toBe(CHAPTERS[era]);
      expect(objective.resources.length).toBeGreaterThan(0);
      if (objective.target) expect((objective.target.kind === 'project' ? purchaseProject : objective.target.kind === 'tech' ? unlockTech : purchaseUpgrade)(state, objective.target.id)).not.toBeNull();
    }
  });
});
