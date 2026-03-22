// Galactic Senate — Era 8 mini-game
// Allocate influence to factions for resource bonuses.

const FACTIONS = [
  { id: 'merchants', rate: 1.0, resource: 'exoticMatter' },
  { id: 'scholars', rate: 0.6, resource: 'galacticInfluence' },
  { id: 'warriors', rate: 0.4, resource: 'starSystems' },
];

// Get the cost to allocate the next influence point.
export function getSenateAllocateCost(totalInfluence) {
  return Math.ceil(5 * Math.pow(1.5, totalInfluence / 10));
}

// Get the maximum influence slots available.
export function getMaxSenateInfluence(state) {
  return Math.max(3, Math.floor((state.resources.galacticInfluence?.amount || 0) / 50) + 3);
}

// Allocate or remove influence for a faction.
// delta: +1 to add, -1 to remove.
// Returns new state or null if invalid.
export function allocateSenateInfluence(state, factionId, delta) {
  if (state.era < 8) return null;

  const faction = FACTIONS.find(f => f.id === factionId);
  if (!faction) return null;

  const sen = state.senate || { merchants: 0, scholars: 0, warriors: 0 };
  const current = sen[factionId] || 0;
  const newVal = Math.max(0, current + delta);
  const newSenate = { ...sen, [factionId]: newVal };
  const newTotal = newSenate.merchants + newSenate.scholars + newSenate.warriors;
  const max = getMaxSenateInfluence(state);
  if (newTotal > max) return null;

  const resources = { ...state.resources };

  // Adding costs galacticInfluence; removing is free
  if (delta > 0) {
    const currentTotal = (sen.merchants || 0) + (sen.scholars || 0) + (sen.warriors || 0);
    const cost = getSenateAllocateCost(currentTotal);
    const gi = resources.galacticInfluence;
    if (!gi || gi.amount < cost) return null;
    resources.galacticInfluence = { ...gi, amount: gi.amount - cost };
  }

  // Apply instant resource bonuses based on new allocation
  for (const f of FACTIONS) {
    const count = newSenate[f.id] || 0;
    if (count > 0 && resources[f.resource]?.unlocked) {
      const r = resources[f.resource];
      const maxAlloc = Math.max(newSenate.merchants, newSenate.scholars, newSenate.warriors);
      const isMajority = FACTIONS.filter(ff => (newSenate[ff.id] || 0) === maxAlloc).length === 1
        && (newSenate[f.id] || 0) === maxAlloc;
      const mult = isMajority ? 2 : 1;
      const gain = count * f.rate * mult;
      resources[f.resource] = { ...r, amount: r.amount + gain };
    }
  }

  return { ...state, senate: newSenate, resources };
}

// Get senate display info.
export function getSenateInfo(state) {
  const senate = state.senate || { merchants: 0, scholars: 0, warriors: 0 };
  const totalInfluence = senate.merchants + senate.scholars + senate.warriors;
  const maxInfluence = getMaxSenateInfluence(state);
  const maxCount = Math.max(senate.merchants, senate.scholars, senate.warriors);
  const majorityFaction = maxCount > 0
    ? FACTIONS.find(f => senate[f.id] === maxCount && FACTIONS.filter(ff => senate[ff.id] === maxCount).length === 1)
    : null;

  return {
    senate,
    totalInfluence,
    maxInfluence,
    available: maxInfluence - totalInfluence,
    allocateCost: getSenateAllocateCost(totalInfluence),
    majorityFaction: majorityFaction?.id || null,
    factions: FACTIONS,
  };
}
