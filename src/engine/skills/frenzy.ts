import skills from '../../data/skills/barbarian.json';
import type { HitSpeedStackTuning, SkillDef } from '../types/skills';
import type { ActiveStatus, CombatUnit } from '../combat/types';
import { activeHitSpeedStack, copyHitSpeedStackStatuses, gainHitSpeedStack } from './hit-speed-stacks';
import { createSkillValidator } from './skill-validator';

export const FRENZY_IDS = ['skills-barbarian-frenzy', 'barbarian.frenzy'] as const;
const validate = createSkillValidator<SkillDef & { readonly requiredLevel: number }>();
/** Validate and independently copy authored Frenzy stack tuning before combat. */
export function resolveFrenzyDefinition(rows: readonly unknown[]): Readonly<
  HitSpeedStackTuning & {
    readonly requiredLevel: number;
    readonly maxRank: number;
  }
> {
  const matches = rows.filter(
    (row) => typeof row === 'object' && row !== null && 'id' in row && row.id === FRENZY_IDS[0]
  );
  const row = matches[0];
  if (matches.length !== 1 || !validate(row) || !row.frenzy)
    throw new Error('Invalid authored Frenzy');
  return Object.freeze({
    ...row.frenzy,
    requiredLevel: row.requiredLevel,
    maxRank: row.maxLevel
  });
}
export const FRENZY_DEFINITION = resolveFrenzyDefinition(skills);

/** Consume the already validated native class-active configuration, never raw saved priorities. */
export function composeFrenzyRank(
  owner: Pick<CombatUnit, 'skillOrder' | 'skillLevels'> & {
    readonly classId: string;
    readonly level: number;
  }
): number {
  const d = FRENZY_DEFINITION;
  if (
    owner.classId !== 'barbarian' ||
    !Number.isInteger(owner.level) ||
    owner.level < d.requiredLevel ||
    !owner.skillOrder.some((id) => FRENZY_IDS.some((alias) => alias === id))
  )
    return 0;
  return FRENZY_IDS.reduce((rank, id) => {
    const value = owner.skillLevels?.[id];
    return typeof value === 'number' && Number.isInteger(value) && value > 0 && value <= d.maxRank
      ? Math.max(rank, value)
      : rank;
  }, 0);
}
const speedDefinition = { ...FRENZY_DEFINITION,
  id: 'frenzy', marker: 'frenzy', rankField: 'frenzyRank' } as const;
/** At most one authenticated active record counts; duplicate markers never add. */
export function activeFrenzy(unit: CombatUnit, clock: number): ActiveStatus | undefined {
  return activeHitSpeedStack(unit, clock, speedDefinition);
}
/** Copy valid carried records and reject marker-only or malformed external potency. */
export function copyFrenzyStatuses(unit: CombatUnit): CombatUnit {
  return copyHitSpeedStackStatuses(unit, speedDefinition);
}
/** Grant/refresh one stack only after positive hostile direct HP loss. */
export function gainFrenzyStack(unit: CombatUnit, clock: number): CombatUnit {
  return gainHitSpeedStack(unit, clock, speedDefinition);
}
