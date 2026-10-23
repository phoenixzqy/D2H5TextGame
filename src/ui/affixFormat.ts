import type { TFunction } from 'i18next';
import { loadAffixPool } from '@/data/loaders/loot';
import type { AffixRoll } from '@/engine/types/items';
import { formatDisplayStat } from './itemDisplay';
const affixMap = new Map(loadAffixPool().map((affix) => [affix.id, affix]));
export function formatAffixRoll(roll: AffixRoll, t: TFunction): string {
  if ('values' in roll) return [...roll.values].map(([path, value]) => formatDisplayStat({ path, value }, t).text).join(', ');
  const affix = affixMap.get(roll.id);
  if (!affix) return roll.id;
  return t(affix.i18nKey, { value: roll.rolledValue });
}
