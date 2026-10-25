import rows from '../../data/skills/druid.json';
import type { Player } from '../types/entities';
import type { SkillDef } from '../types/skills';
import { inferKind, type CombatUnit } from '../combat/types';
import { createSkillValidator } from './skill-validator';

export const DRUID_ALLY_AURA_IDS = {
  oak: ['skills-druid-oak-sage', 'druid.oak_sage'],
  heart: ['skills-druid-heart-of-wolverine', 'druid.heart_of_wolverine']
} as const;
type Key = keyof typeof DRUID_ALLY_AURA_IDS;
/** Immutable authored effects; no personal-only substitute or invented speed bonus. */
export interface DruidAllyAuraDefinition {
  readonly requiredLevel: number;
  readonly maxRank: number;
  readonly lifePerRank: number;
  readonly attackPerRank: number;
  readonly critPerRank: number;
}
const validate = createSkillValidator<
  SkillDef & { readonly requiredLevel: number; readonly prerequisites?: readonly string[] }
>();
/** Validate exact source rows, then retain copied primitive coefficients only. */
export function resolveDruidAllyAuraDefinitions(
  input: readonly unknown[]
): Readonly<Record<Key, DruidAllyAuraDefinition>> {
  return Object.freeze(
    Object.fromEntries(
      (['oak', 'heart'] as const).map((key) => {
        const matches = input.filter(
          (row) =>
            typeof row === 'object' &&
            row !== null &&
            'id' in row &&
            row.id === DRUID_ALLY_AURA_IDS[key][0]
        );
        const row = matches[0];
        if (
          matches.length !== 1 ||
          !validate(row) ||
          row.trigger !== 'passive' ||
          row.target !== 'self' ||
          row.cooldown !== 0 ||
          (key === 'heart'
            ? JSON.stringify(row.prerequisites) !== JSON.stringify([DRUID_ALLY_AURA_IDS.oak[0]])
            : row.prerequisites !== undefined)
        )
          throw new Error('Invalid authored Druid allied aura ' + key);
        const perRank = row.scaling?.passiveStatsPerLevel;
        const keys = key === 'oak' ? ['lifePct'] : ['attackPct', 'critChancePct'];
        if (
          !perRank ||
          Object.keys(perRank).length !== keys.length ||
          keys.some((k) => !Object.hasOwn(perRank, k))
        )
          throw new Error('Invalid authored Druid allied coefficients ' + key);
        return [
          key,
          Object.freeze({
            requiredLevel: row.requiredLevel,
            maxRank: row.maxLevel,
            lifePerRank: perRank.lifePct ?? 0,
            attackPerRank: perRank.attackPct ?? 0,
            critPerRank: perRank.critChancePct ?? 0
          })
        ];
      })
    )
  ) as Readonly<Record<Key, DruidAllyAuraDefinition>>;
}
export const DRUID_ALLY_AURA_DEFINITIONS = resolveDruidAllyAuraDefinitions(rows);
/** Exact aliases resolve MAX once, without implicit allocation. */
export function druidAllyAuraRank(key: Key, levels?: Readonly<Record<string, number>>): number {
  return DRUID_ALLY_AURA_IDS[key].reduce((rank, id) => {
    const value = levels?.[id];
    return typeof value === 'number' && Number.isInteger(value) && value > 0
      ? Math.max(rank, Math.min(value, DRUID_ALLY_AURA_DEFINITIONS[key].maxRank))
      : rank;
  }, 0);
}
/** Copied wave-local allocation and original party identity, never persisted. */
export interface DruidAllyAuraProjection {
  readonly sourceHeroId: string;
  readonly fieldedMercCombatId?: string;
  readonly oakRank: number;
  readonly heartRank: number;
}
/** Native class/level/prerequisite authority is captured at the wave boundary. */
export function composeDruidAllyAuras(
  player: Pick<Player, 'id' | 'class' | 'level' | 'skillLevels'>,
  fieldedMercCombatId?: string
): DruidAllyAuraProjection | undefined {
  if (!player.id || player.class !== 'druid' || !Number.isInteger(player.level)) return undefined;
  const oakRank =
    player.level >= DRUID_ALLY_AURA_DEFINITIONS.oak.requiredLevel
      ? druidAllyAuraRank('oak', player.skillLevels)
      : 0;
  const heartRank =
    oakRank > 0 && player.level >= DRUID_ALLY_AURA_DEFINITIONS.heart.requiredLevel
      ? druidAllyAuraRank('heart', player.skillLevels)
      : 0;
  return oakRank + heartRank === 0
    ? undefined
    : Object.freeze({
        sourceHeroId: player.id,
        oakRank,
        heartRank,
        ...(fieldedMercCombatId && fieldedMercCombatId !== player.id ? { fieldedMercCombatId } : {})
      });
}
/** Reject malformed standalone engine authority and copy all supported primitives. */
export function copyDruidAllyAuras(
  p: DruidAllyAuraProjection | undefined
): DruidAllyAuraProjection | undefined {
  if (
    !p ||
    typeof p.sourceHeroId !== 'string' ||
    !p.sourceHeroId ||
    !Number.isInteger(p.oakRank) ||
    p.oakRank < 1 ||
    p.oakRank > DRUID_ALLY_AURA_DEFINITIONS.oak.maxRank ||
    !Number.isInteger(p.heartRank) ||
    p.heartRank < 0 ||
    p.heartRank > DRUID_ALLY_AURA_DEFINITIONS.heart.maxRank ||
    (p.fieldedMercCombatId !== undefined &&
      (typeof p.fieldedMercCombatId !== 'string' ||
        !p.fieldedMercCombatId ||
        p.fieldedMercCombatId === p.sourceHeroId))
  )
    return undefined;
  return Object.freeze({
    sourceHeroId: p.sourceHeroId,
    oakRank: p.oakRank,
    heartRank: p.heartRank,
    ...(p.fieldedMercCombatId !== undefined ? { fieldedMercCombatId: p.fieldedMercCombatId } : {})
  });
}
/** Resolve living original party members on every use; source death disables both effects. */
export function activeDruidAllyAuras(
  p: DruidAllyAuraProjection | undefined,
  recipient: CombatUnit,
  units: ReadonlyMap<string, CombatUnit>
): DruidAllyAuraProjection | undefined {
  if (!p || recipient.side !== 'player' || !Number.isFinite(recipient.life) || recipient.life <= 0)
    return undefined;
  const source = units.get(p.sourceHeroId);
  if (
    !source ||
    source.side !== 'player' ||
    inferKind(source) !== 'hero' ||
    !Number.isFinite(source.life) ||
    source.life <= 0 ||
    source.summon === true ||
    source.ownerId !== undefined ||
    source.summonOwnerId !== undefined
  )
    return undefined;
  const ownedSummon =
    recipient.kind === 'summon' &&
    recipient.summon === true &&
    recipient.summonOwnerId === source.id &&
    (recipient.ownerId === undefined || recipient.ownerId === source.id);
  const original =
    recipient.id === source.id ||
    (recipient.id === p.fieldedMercCombatId &&
      inferKind(recipient) === 'merc' &&
      recipient.summon !== true &&
      recipient.ownerId === undefined &&
      recipient.summonOwnerId === undefined);
  return ownedSummon || original ? p : undefined;
}
