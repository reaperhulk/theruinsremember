import { previewUpgrade } from '../engine/upgrades.js';
import { estimateAffordability } from '../engine/economy.js';
import { getPurchaseTarget } from '../engine/guidance.js';
import { resources } from '../data/resources.js';
import { formatNumber, formatTime } from './format.js';

export function UpgradeImpact({ state, upgrade, economy }) {
  const preview = previewUpgrade(state, upgrade.id);
  if (!preview) return null;
  const affected = Object.keys(state.resources).filter(id => Math.abs(preview.net[id] - economy.net[id]) > 1e-8)
    .sort((a, b) => Number(upgrade.effects.some(e => e.target === b)) - Number(upgrade.effects.some(e => e.target === a))).slice(0, 2);
  const target = getPurchaseTarget(state);
  const completes = target?.kind === 'upgrade' && target.id === upgrade.id;
  const before = target && estimateAffordability(state, target.cost, economy).seconds;
  const after = target && estimateAffordability(preview.previewState, target.cost, preview).seconds;
  const time = seconds => Number.isFinite(seconds) ? formatTime(Math.ceil(seconds)) : 'blocked';
  return <div className="signature-preview">
    <strong>{preview.includesCost ? 'After purchase · net income' : 'Effect estimate · before purchase cost'}</strong>
    {affected.map(id => <span key={id}>{resources[id].name}: {formatNumber(economy.net[id])} → {formatNumber(preview.net[id])}/s</span>)}
    {affected.length === 0 && <span>Net income unchanged while storage or inputs constrain output.</span>}
    {Object.keys(state.resources).filter(id => preview.capacity[id] > economy.capacity[id]).slice(0, 1).map(id => <span key={id}>{resources[id].name} storage: {formatNumber(economy.capacity[id])} → {formatNumber(preview.capacity[id])}</span>)}
    {completes ? <span>Completes this queued or suggested purchase.</span> : target && before !== after && <span>{target.name}: {time(before)} → {time(after)} at these rates.</span>}
  </div>;
}
