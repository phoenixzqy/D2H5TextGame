import skills from '../../data/skills/druid.json';
import type { FeralRageTuning, SkillDef } from '../types/skills';
import type { ActiveStatus, CombatUnit } from '../combat/types';
import { activeHitSpeedStack, copyHitSpeedStackStatuses, gainHitSpeedStack } from './hit-speed-stacks';
import { createSkillValidator } from './skill-validator';

export const FERAL_RAGE_IDS = ['skills-druid-feral-rage', 'druid.feral_rage'] as const;
const validate = createSkillValidator<SkillDef & { readonly requiredLevel: number }>();
/** Validate and independently copy authored Feral stack tuning before combat. */
export function resolveFeralRageDefinition(rows: readonly unknown[]): Readonly<
  FeralRageTuning & {
    readonly requiredLevel: number;
    readonly maxRank: number;
  }
> {
  const matches = rows.filter(
    (row) => typeof row === 'object' && row !== null && 'id' in row && row.id === FERAL_RAGE_IDS[0]
  );
  const row = matches[0];
  if (matches.length !== 1 || !validate(row) || !row.feralRage)
    throw new Error('Invalid authored Feral Rage');
  return Object.freeze({
    ...row.feralRage,
    requiredLevel: row.requiredLevel,
    maxRank: row.maxLevel
  });
}
export const FERAL_RAGE_DEFINITION = resolveFeralRageDefinition(skills);

/** Consume the already validated native class-active configuration, never raw saved priorities. */
export function composeFeralRageRank(
  owner: Pick<CombatUnit, 'skillOrder' | 'skillLevels'> & {
    readonly classId: string;
    readonly level: number;
  }
): number {
  const d = FERAL_RAGE_DEFINITION;
  if (
    owner.classId !== 'druid' ||
    !Number.isInteger(owner.level) ||
    owner.level < d.requiredLevel ||
    !owner.skillOrder.some((id) => FERAL_RAGE_IDS.some((alias) => alias === id))
  )
    return 0;
  return FERAL_RAGE_IDS.reduce((rank, id) => {
    const value = owner.skillLevels?.[id];
    return typeof value === 'number' && Number.isInteger(value) && value > 0 && value <= d.maxRank
      ? Math.max(rank, value)
      : rank;
  }, 0);
}
const speedDefinition = { ...FERAL_RAGE_DEFINITION,
  id: 'feral-rage', marker: 'feralRage', rankField: 'feralRageRank' } as const;
/** At most one authenticated active record counts; duplicate markers never add. */
export function activeFeralRage(unit: CombatUnit, clock: number): ActiveStatus | undefined {
  return activeHitSpeedStack(unit, clock, speedDefinition);
}
/** Copy valid carried records and reject marker-only or malformed external potency. */
export function copyFeralRageStatuses(unit: CombatUnit): CombatUnit {
  return copyHitSpeedStackStatuses(unit, speedDefinition);
}
/** Grant/refresh one stack only after positive hostile direct HP loss. */
export function gainFeralRageStack(unit: CombatUnit, clock: number): CombatUnit {
  return gainHitSpeedStack(unit, clock, speedDefinition);
}
