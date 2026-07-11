export const OPERATIONS = [
  { id: 'docking', label: 'Orbital Operations', era: 4, description: 'Run cargo, crew, and science missions through unstable orbit.' },
  { id: 'colony', label: 'Colony Command', era: 5, description: 'Commit settlements to growth, science, or industry.' },
  { id: 'starChart', label: 'Star Chart', era: 6, description: 'Build a deliberate route network between discovered systems.' },
  { id: 'dyson', label: 'Dyson Assembly', era: 7, description: 'Direct megastructure capacity into a functioning stellar engine.' },
  { id: 'senate', label: 'Galactic Senate', era: 8, description: 'Set the political mandate that shapes the galactic economy.' },
  { id: 'weaving', label: 'Reality Weaving', era: 8, description: 'Combine fragments into temporary laws of reality.' },
  { id: 'tuning', label: 'Cosmic Tuning', era: 9, description: 'Lock three of four cosmic bands to shape the cycle.' },
  { id: 'forgetting', label: 'The Forgetting', era: 10, description: 'Station wardens on the memories of this cycle. Hold the line.' },
  { id: 'realityForge', label: 'Reality Forge', era: 10, description: 'Craft distinct keys and decide how the next cycle begins.' },
];

export function getUnlockedOperations(era) {
  return OPERATIONS.filter(operation => operation.era <= era);
}

export function getCurrentOperations(era) {
  return OPERATIONS.filter(operation => operation.era === era);
}

export function getArchivedOperations(era) {
  return OPERATIONS.filter(operation => operation.era < era);
}

export function getDefaultOperation(era) {
  const current = getCurrentOperations(era);
  return current.at(-1)?.id || getUnlockedOperations(era).at(-1)?.id || null;
}
