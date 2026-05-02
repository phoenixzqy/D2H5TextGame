import i18n from '@/i18n';
import type { CombatUnit } from '@/engine/combat/types';

export function extractSummonTemplateId(unitId: string): string | null {
  const match = /-summon-(.+)-\d+$/.exec(unitId);
  return match?.[1] ?? null;
}

export function resolveSummonDisplayName(unit: CombatUnit): string {
  const summonId = unit.summonTemplateId ?? extractSummonTemplateId(unit.id);
  if (!summonId) return unit.name;
  return i18n.t(`combat:summons.${summonId}`, { defaultValue: unit.name });
}
