// The town map: radial slots in rings around the Heart (0.5, 0.5).
// No roads, no zoning — every slot is a placement decision.

export const RINGS = [
  { radius: 0.2, slots: 6 },
  { radius: 0.36, slots: 10 },
];

export function createSlots(unlockedRings = 1) {
  const slots = [];
  for (let ring = 0; ring < Math.min(unlockedRings, RINGS.length); ring++) {
    const { radius, slots: count } = RINGS[ring];
    for (let index = 0; index < count; index++) {
      const angle = (index / count) * Math.PI * 2 - Math.PI / 2 + ring * 0.3;
      slots.push({
        id: `r${ring}s${index}`,
        ring,
        index,
        x: 0.5 + Math.cos(angle) * radius,
        y: 0.5 + Math.sin(angle) * radius,
        structure: null,
      });
    }
  }
  return slots;
}

const ADJACENT_DISTANCE = 0.23;

export function slotsAdjacent(a, b) {
  if (a.id === b.id) return false;
  return Math.hypot(a.x - b.x, a.y - b.y) <= ADJACENT_DISTANCE;
}

export function getAdjacentSlots(slots, slotId) {
  const slot = slots.find(candidate => candidate.id === slotId);
  if (!slot) return [];
  return slots.filter(candidate => slotsAdjacent(slot, candidate));
}
