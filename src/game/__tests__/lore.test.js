import { describe, expect, it } from 'vitest';
import { CHAPTERS, CYCLE_DISCOVERIES, DISCOVERIES, MESSAGES, MESSAGE_DISCOVERIES, pickDiscovery } from '../lore.js';
import { buyBuilding, createState, leaveMessage, turnCycle } from '../engine.js';
import { parseSave, serializeSave } from '../save.js';

const sequence = (...values) => { let i = 0; return () => values[i++ % values.length]; };
const all = Object.values(DISCOVERIES).flat();
const withEcho = () => buyBuilding({ ...createState(0), salvage: 1e30, runEarned: 1e30, totalEarned: 1e30 }, 'echo');

describe('the story', () => {
  it('has a chapter, discoveries and personal cycle lines for every era', () => {
    for (let era = 1; era <= 10; era++) {
      expect(CHAPTERS[era].title).toBeTruthy();
      expect(DISCOVERIES[era].length).toBeGreaterThan(0);
      expect(CYCLE_DISCOVERIES[era].length).toBeGreaterThanOrEqual(3);
    }
  });

  it('never announces events, rewards or systems the game does not have', () => {
    const stale = /!|destroys|corrupted|damaged|cache of supplies|production (halved|doubled)|[+×]\d/i;
    expect([...all, ...Object.values(CYCLE_DISCOVERIES).flat()].filter(line => stale.test(line))).toEqual([]);
  });

  it('keeps personal lines for later cycles and carved messages for after the ending', () => {
    // A roll that would pick a personal line or a carved message.
    expect(Object.values(CYCLE_DISCOVERIES).flat()).not.toContain(pickDiscovery({ era: 3, cycles: 0 }, sequence(0.1, 0)));
    expect(CYCLE_DISCOVERIES[3]).toContain(pickDiscovery({ era: 3, cycles: 1 }, sequence(0.1, 0)));
    const carved = pickDiscovery({ era: 3, cycles: 2, message: 'guide' }, sequence(0.05, 0, 0));
    expect(carved).toBe(MESSAGE_DISCOVERIES[1].replace('{message}', MESSAGES.guide.text));
    expect(pickDiscovery({ era: 5, cycles: 1 }, sequence(0.6, 0))).toBe(DISCOVERIES[5][0]);
  });
});

describe('the ending', () => {
  it('lets the builder of an Echo of Yourself leave a message that outlasts the cycle', () => {
    expect(leaveMessage(createState(0), 'warn').message).toBeNull();
    let state = withEcho();
    expect(leaveMessage(state, 'nonsense')).toBe(state);
    state = leaveMessage(state, 'warn');
    expect(state.message).toBe('warn');
    expect(state.log.at(-1)).toMatchObject({ kind: 'message', id: 'warn' });
    expect(leaveMessage(state, 'warn')).toBe(state);
    const next = turnCycle(state);
    expect(next.message).toBe('warn');
    expect(next.buildings.echo).toBeUndefined();
    // It can be rewritten once another Echo of Yourself is built.
    expect(leaveMessage(next, 'welcome')).toBe(next);
    expect(leaveMessage(withEcho(), 'welcome').message).toBe('welcome');
  });

  it('is saved, and an unknown message is dropped', () => {
    const state = leaveMessage(withEcho(), 'guide');
    expect(parseSave(serializeSave(state)).message).toBe('guide');
    expect(parseSave(JSON.stringify({ ...JSON.parse(serializeSave(state)), message: 'forged' })).message).toBeNull();
  });
});
