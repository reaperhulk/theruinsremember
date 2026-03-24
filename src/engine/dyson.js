// Dyson Sphere Assembly — Era 7 mini-game
// Click to assemble segments; rewards scale with stellarForge & megastructures production.

// Assemble one Dyson segment. Returns { state, sfGain, mgGain } or null if unavailable.
// No hard cap — segments continue to provide scaling bonuses.
export function assembleDysonSegment(state) {
  if (state.era < 7) return null;

  const sf = state.resources.stellarForge;
  const mg = state.resources.megastructures;
  if (!sf?.unlocked || !mg?.unlocked) return null;

  const sfRate = (sf.baseRate + sf.rateAdd) * sf.rateMult * (state.prestigeMultiplier || 1);
  const mgRate = (mg.baseRate + mg.rateAdd) * mg.rateMult * (state.prestigeMultiplier || 1);
  const segments = state.dysonSegments || 0;
  // Milestone bonus: scales continuously with segments
  const milestoneBonus = 1 + segments / 100;
  const sfGain = Math.max(1, sfRate * 5 * milestoneBonus);
  const mgGain = Math.max(1, mgRate * 2 * milestoneBonus);

  return {
    state: {
      ...state,
      dysonSegments: segments + 1,
      resources: {
        ...state.resources,
        stellarForge: { ...sf, amount: sf.amount + sfGain },
        megastructures: { ...mg, amount: mg.amount + mgGain },
      },
    },
    sfGain,
    mgGain,
  };
}

// Get current assembly stats for display.
export function getDysonStats(state) {
  const segments = state.dysonSegments || 0;
  return {
    segments,
    completion: Math.floor(segments / 10) * 10,
    milestone: Math.floor(segments / 10),
    nextMilestone: (Math.floor(segments / 10) + 1) * 10,
    autoRate: segments > 0 ? Math.min(20, Math.floor(segments / 10)) : 0,
    bonusMult: 1 + segments / 100,
  };
}
