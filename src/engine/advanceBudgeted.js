import { tick } from './tick.js';
// A wall-time budget changes only where we yield, never simulation ordering.
export function advanceSlice(state, seconds, { rng = Math.random, now = () => performance.now(), budgetMs = 6, options = {} } = {}) {
  const started = now(); let current = state, done = 0;
  if (!Number.isFinite(seconds) || seconds <= 0) return { state, done: 0 };
  do {
    const step = Math.min(1, seconds - done);
    current = tick(current, step, rng, options); done += step;
  } while (done < seconds && now() - started < budgetMs);
  return { state: current, done };
}
export async function advanceBudgeted(state, seconds, { rng = Math.random, now = () => performance.now(), budgetMs = 6, options = {}, yieldTask = () => new Promise(resolve => setTimeout(resolve, 0)), cancelled = () => false, onProgress = () => {} } = {}) {
  if (!Number.isFinite(seconds) || seconds <= 0) return { state, done: 0, cancelled: false };
  let current = state, done = 0;
  while (done < seconds && !cancelled()) {
    const result = advanceSlice(current, seconds - done, { rng, now, budgetMs, options });
    current = result.state; done += result.done;
    onProgress(done, seconds);
    if (done < seconds) await yieldTask();
  }
  return { state: current, done, cancelled: cancelled() };
}
