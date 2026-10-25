import rows from '../../data/skills/druid.json';
import type { Player } from '../types/entities';
import type { SkillDef } from '../types/skills';
import { inferKind, type CombatUnit } from '../combat/types';
import { composeDruidAllyAuras } from './druid-ally-auras';
import { createSkillValidator } from './skill-validator';

export const SPIRIT_OF_BARBS_IDS = [
  'skills-druid-spirit-of-barbs',
  'druid.spirit_of_barbs'
] as const;
/** JSON-owned effects and real support-summon baseline, copied before runtime use. */
export interface SpiritOfBarbsDefinition {
  readonly requiredLevel: number;
  readonly maxRank: number;
  readonly thornsPerRank: number;
  readonly summonDefensePerRank: number;
  readonly summonId: 'spirit_of_barbs';
  readonly stats: { readonly life: number; readonly attack: 0; readonly defense: number };
}
const validate = createSkillValidator<SkillDef & { readonly requiredLevel: number }>();
/** Validate the exact authored passive and retain immutable copied primitives. */
export function resolveSpiritOfBarbsDefinition(input: readonly unknown[]): SpiritOfBarbsDefinition {
  const matches = input.filter(
    (row) =>
      typeof row === 'object' && row !== null && 'id' in row && row.id === SPIRIT_OF_BARBS_IDS[0]
  );
  const row = matches[0];
  if (
    matches.length !== 1 ||
    !validate(row) ||
    !row.passiveSummon ||
    !row.scaling?.passiveStatsPerLevel
  )
    throw new Error('Invalid authored Spirit of Barbs');
  const perRank = row.scaling.passiveStatsPerLevel;
  if (perRank.thornsPct === undefined || perRank.summonDefensePct === undefined)
    throw new Error('Missing Spirit of Barbs coefficients');
  return Object.freeze({
    requiredLevel: row.requiredLevel,
    maxRank: row.maxLevel,
    thornsPerRank: perRank.thornsPct,
    summonDefensePerRank: perRank.summonDefensePct,
    summonId: row.passiveSummon.summonId,
    stats: Object.freeze({ ...row.passiveSummon.stats })
  });
}
export const SPIRIT_OF_BARBS_DEFINITION = resolveSpiritOfBarbsDefinition(rows);
/** Exact allocated aliases use MAX once; invalid allocations never imply rank1. */
export function spiritOfBarbsRank(levels?: Readonly<Record<string, number>>): number {
  return SPIRIT_OF_BARBS_IDS.reduce((rank, id) => {
    const value = Object.hasOwn(levels ?? {}, id) ? levels?.[id] : undefined;
    return typeof value === 'number' && Number.isInteger(value) && value > 0
      ? Math.max(rank, Math.min(value, SPIRIT_OF_BARBS_DEFINITION.maxRank))
      : rank;
  }, 0);
}
/** Allocation authority is wave-local; actual spirit creation is authenticated separately by combat. */
export interface SpiritOfBarbsProjection {
  readonly sourceHeroId: string;
  readonly fieldedMercCombatId?: string;
  readonly rank: number;
}
/** Reject malformed standalone authority and detach all supported primitives from caller input. */
export function copySpiritOfBarbs(
  p: SpiritOfBarbsProjection | undefined
): SpiritOfBarbsProjection | undefined {
  if (
    !p ||
    typeof p.sourceHeroId !== 'string' ||
    !p.sourceHeroId ||
    !Number.isInteger(p.rank) ||
    p.rank < 1 ||
    p.rank > SPIRIT_OF_BARBS_DEFINITION.maxRank ||
    (p.fieldedMercCombatId !== undefined &&
      (typeof p.fieldedMercCombatId !== 'string' ||
        !p.fieldedMercCombatId ||
        p.fieldedMercCombatId === p.sourceHeroId))
  )
    return undefined;
  return Object.freeze({
    sourceHeroId: p.sourceHeroId,
    rank: p.rank,
    ...(p.fieldedMercCombatId !== undefined ? { fieldedMercCombatId: p.fieldedMercCombatId } : {})
  });
}
/** Capture native class/unlock/full learned Oak→Heart prerequisites, independent of combo slots. */
export function composeSpiritOfBarbs(
  player: Pick<Player, 'id' | 'class' | 'level' | 'skillLevels'>,
  fieldedMercCombatId?: string
): SpiritOfBarbsProjection | undefined {
  const allies = composeDruidAllyAuras(player, fieldedMercCombatId);
  if (!allies || allies.heartRank === 0 || player.level < SPIRIT_OF_BARBS_DEFINITION.requiredLevel)
    return undefined;
  return copySpiritOfBarbs({
    sourceHeroId: allies.sourceHeroId,
    rank: spiritOfBarbsRank(player.skillLevels),
    ...(allies.fieldedMercCombatId !== undefined
      ? { fieldedMercCombatId: allies.fieldedMercCombatId }
      : {})
  });
}
function living(unit: CombatUnit): boolean {
  return unit.side === 'player' && Number.isFinite(unit.life) && unit.life > 0;
}
function ownedSummon(unit: CombatUnit, ownerId: string): boolean {
  return (
    living(unit) &&
    unit.kind === 'summon' &&
    unit.summon === true &&
    unit.summonOwnerId === ownerId &&
    (unit.ownerId === undefined || unit.ownerId === ownerId)
  );
}
function originalHero(unit: CombatUnit): boolean {
  return (
    living(unit) &&
    inferKind(unit) === 'hero' &&
    unit.summon !== true &&
    unit.ownerId === undefined &&
    unit.summonOwnerId === undefined
  );
}
/** Resolve only the engine-attested living spirit and its living original party on every use. */
export function activeSpiritOfBarbs(
  p: SpiritOfBarbsProjection | undefined,
  authenticatedSpiritId: string | undefined,
  recipient: CombatUnit,
  units: ReadonlyMap<string, CombatUnit>
): SpiritOfBarbsProjection | undefined {
  if (!p || !authenticatedSpiritId || !living(recipient)) return undefined;
  const source = units.get(p.sourceHeroId),
    spirit = units.get(authenticatedSpiritId);
  if (
    !source ||
    source.id !== p.sourceHeroId ||
    !originalHero(source) ||
    !spirit ||
    spirit.id !== authenticatedSpiritId ||
    !ownedSummon(spirit, source.id) ||
    spirit.summonTemplateId !== SPIRIT_OF_BARBS_DEFINITION.summonId
  )
    return undefined;
  const original =
    (recipient.id === source.id && originalHero(recipient)) ||
    (recipient.id === p.fieldedMercCombatId &&
      inferKind(recipient) === 'merc' &&
      recipient.summon !== true &&
      recipient.ownerId === undefined &&
      recipient.summonOwnerId === undefined);
  return original || ownedSummon(recipient, source.id) ? p : undefined;
}
