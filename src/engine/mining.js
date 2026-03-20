// Mining mini-game for Era 1
// Clicking to mine has a chance to find a gem (5x materials).
// Consecutive clicks without a gem increase the chance (pity mechanic).

const BASE_GEM_CHANCE = 0.1;       // 10% base
const STREAK_BONUS = 0.02;         // +2% per consecutive miss
const MAX_GEM_CHANCE = 0.5;        // 50% cap
const GEM_MULTIPLIER = 5;          // gem gives 5x materials

// Calculate current gem chance based on mining streak
export function getGemChance(state) {
  const streak = state.miningStreak || 0;
  const hasLuckyMiner = state.prestigeUpgrades && state.prestigeUpgrades.luckyMiner;
  const baseChance = hasLuckyMiner ? BASE_GEM_CHANCE * 2 : BASE_GEM_CHANCE;
  return Math.min(baseChance + streak * STREAK_BONUS, MAX_GEM_CHANCE);
}

// Perform a mine action. Returns { state, foundGem }.
// `roll` is an optional 0-1 number for deterministic testing; defaults to Math.random().
export function mine(state, roll = Math.random()) {
  const r = state.resources.materials;
  if (!r || !r.unlocked) return { state, foundGem: false };

  const chance = getGemChance(state);
  const foundGem = roll < chance;

  // Gem quality scales with total gems found (milestone bonus)
  const totalGems = state.totalGems || 0;
  const gemQuality = 1 + Math.floor(totalGems / 25) * 0.5; // +50% per 25 gems

  // Era scaling: mining stays relevant as eras increase
  const eraScale = 1 + (state.era - 1) * 0.5; // x1 at era 1, x5.5 at era 10
  const hasSavant = state.prestigeUpgrades && state.prestigeUpgrades.miniGameSavant;
  const savantMult = hasSavant ? 1.5 : 1;
  const baseGather = 1 * r.rateMult * state.prestigeMultiplier * eraScale * savantMult;
  const gathered = foundGem ? baseGather * GEM_MULTIPLIER * gemQuality : baseGather;

  const newState = {
    ...state,
    miningStreak: foundGem ? 0 : (state.miningStreak || 0) + 1,
    resources: {
      ...state.resources,
      materials: {
        ...r,
        amount: r.amount + gathered,
      },
    },
  };

  return { state: newState, foundGem };
}
