import { tick } from './tick.js';

// Advance simulation time in bounded steps so periodic systems and random
// events behave like normal play instead of one oversized render tick.
export function advanceTime(state, seconds, rng = Math.random, maxStep = 1, options = {}) {
  if (!Number.isFinite(seconds) || seconds <= 0) return state;
  if (!Number.isFinite(maxStep) || maxStep <= 0) throw new RangeError('maxStep must be positive');
  // Offline callers cannot skip purchases, supply chains, or event boundaries.
  maxStep = Math.min(1, maxStep);

  let current = state;
  const fullSteps = Math.floor(seconds / maxStep);
  for (let step = 0; step < fullSteps; step++) {
    current = tick(current, maxStep, rng, options);
  }
  const remainder = seconds - fullSteps * maxStep;
  if (remainder > Number.EPSILON) current = tick(current, remainder, rng, options);
  return current;
}
