import type { TFunction } from 'i18next';
import { loadAffixPool } from '@/data/loaders/loot';
import type { AffixRoll } from '@/engine/types/items';
const affixMap = new Map(loadAffixPool().map((affix) => [affix.id, affix]));
export function formatAffixRoll(roll: AffixRoll, t: TFunction): string {
  if ('values' in roll) return roll.affixId;
  const affix = affixMap.get(roll.id);
  if (!affix) return roll.id;
  return t(affix.i18nKey, { value: roll.rolledValue });
}
