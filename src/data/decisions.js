// Each fork keeps its immediate upgrade effects and changes a later system.
// Effects here are consumed by the economy, construction, and inheritance engines.
export const DECISIONS = {
  forkHearth: { era: 1, landmark: 'The sheltered hearth', consequence: 'Unlock the Living colonies supply route: 2 food per colony instead of exotic materials. Select it in the World view.', route: 'biospheres', memory: 'You kept the first settlement alive. The hearth is still warm.' },
  forkQuarry: { era: 1, landmark: 'The open quarry', consequence: 'From the Industrial era, steel production gains 25%.', resource: 'steel', from: 2, memory: 'Your quarry became the foundation of the next city.' },
  forkElectrify: { era: 2, landmark: 'The living grid', consequence: 'Unlock the Electric launch supply route: 5 energy instead of 0.5 rocket fuel. Select it in the World view.', route: 'electrolysis', memory: 'The cables you buried still carry a faint current.' },
  forkWorkforce: { era: 2, landmark: 'The workers’ hall', consequence: 'From the Solar era, colony production gains 25%.', resource: 'colonies', from: 5, memory: 'A hall survives, its walls covered with workers’ names.' },
  forkOpenNet: { era: 3, landmark: 'The open beacon', consequence: 'Future star routes deliver 25% more resources.', routes: true, memory: 'You shared the signal. Distant settlements remember the invitation.' },
  forkArchive: { era: 3, landmark: 'The buried library', consequence: 'Future public works need 20% fewer contributions.', works: true, memory: 'You preserved the records. Their diagrams shorten the rebuilding.' },
  forkFuelworks: { era: 4, landmark: 'The fuel harbor', consequence: 'From the Solar era, exotic material production gains 25%.', resource: 'exoticMaterials', from: 5, memory: 'Your harbor supplied the journeys that came after it.' },
  forkOrbitalYards: { era: 4, landmark: 'The orbital skeleton', consequence: 'Dyson module commissions finish 20% sooner.', dyson: true, memory: 'The yards you built taught later architects to assemble a star.' },
  forkExtraction: { era: 5, landmark: 'The hollow moon', consequence: 'From the Dyson era, stellar forge production gains 25%.', resource: 'stellarForge', from: 7, memory: 'An emptied moon marks the price of your expansion.' },
  forkSettlement: { era: 5, landmark: 'The garden moon', consequence: 'From the Galactic era, influence production gains 25%.', resource: 'galacticInfluence', from: 8, memory: 'The gardens you planted outlived the maps that named them.' },
  forkDarkTaps: { era: 6, landmark: 'The dark reservoir', consequence: 'From the Dyson era, exotic material production gains 25%.', resource: 'exoticMaterials', from: 7, memory: 'The reservoir still hums beneath the silence.' },
  forkStellarClaims: { era: 6, landmark: 'The common sky', consequence: 'From the Galactic era, influence production gains 25%.', resource: 'galacticInfluence', from: 8, memory: 'Your claims became a charter shared between the stars.' },
  forkForgePrimacy: { era: 7, landmark: 'The star furnace', consequence: 'In the Multiverse era, quantum echo production gains 25%.', resource: 'quantumEchoes', from: 10, memory: 'The furnace left a recognizable rhythm in the echoes.' },
  forkMegaGuilds: { era: 7, landmark: 'The architects’ ring', consequence: 'From the Galactic era, public works need 20% fewer contributions.', works: true, from: 8, memory: 'The guilds left instructions for worlds they would never see.' },
  forkInfluenceWeb: { era: 8, landmark: 'The listening assembly', consequence: 'The Reality Forge receives one additional charge.', charge: true, memory: 'Your assembly made room for one more possible future.' },
  forkMatterWorks: { era: 8, landmark: 'The matter foundry', consequence: 'Reality keys consume 3% of current reserves instead of 5%, above their minimum cost.', forge: true, memory: 'The foundries learned to open a door without consuming the house.' },
  forkAscendancy: { era: 9, landmark: 'The departing signal', consequence: 'The next civilization inherits two additional Archive shards.', shards: 2, memory: 'You sent a warning ahead of the collapse. It arrived.' },
  forkRefinement: { era: 9, landmark: 'The seed chamber', consequence: 'The next civilization starts with 50% of its early resource storage filled.', stores: true, memory: 'You sealed away enough to give someone else a beginning.' },
  forkCommunion: { era: 10, landmark: 'The remembered faces', consequence: 'Carry your first equipped relic into the next civilization.', relic: true, memory: 'You preserved a companion to the next beginning.' },
  forkEchoHarvest: { era: 10, landmark: 'The echo well', consequence: 'The next civilization inherits three additional Archive shards.', shards: 3, memory: 'You condensed the last echoes into something another civilization can use.' },
};
export function chosenDecisions(state) { return Object.entries(DECISIONS).filter(([id]) => state.upgrades?.[id]).map(([id, def]) => ({ id, ...def })); }
const RESOURCE_DECISIONS = Object.entries(DECISIONS).reduce((out, [id, d]) => { if (d.resource) (out[d.resource] ||= []).push({ id, ...d }); return out; }, {});
export function decisionMultiplier(state, resource) { return (RESOURCE_DECISIONS[resource] || []).reduce((mult, d) => mult * (state.upgrades?.[d.id] && state.era >= d.from ? 1.25 : 1), 1); }
