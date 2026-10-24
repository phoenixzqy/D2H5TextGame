import { createSkillValidator } from './skill-validator';
import paladinSkills from '../../data/skills/paladin.json';
import type { SkillDef } from '../types/skills';
import type { Player } from '../types/entities';
import { inferKind, type CombatUnit } from '../combat/types';

/** Independent authored unlock and both player Might aura coefficients. */
export interface MightDefinition {
  readonly requiredLevel: number;
  readonly maxRank: number;
  readonly physicalDamagePctPerRank: number;
  readonly attackPctPerRank: number;
}

const validate = createSkillValidator<SkillDef & { readonly requiredLevel: number }>();

/** Validate exactly one authored player Might row and copy only primitive tuning. */
export function resolveMightDefinition(rows: readonly unknown[]): MightDefinition {
  const matches = rows.filter(row => typeof row === 'object' && row !== null &&
    'id' in row && row.id === 'skills-paladin-might');
  if (matches.length !== 1) throw new Error('Expected exactly one authored player Might skill');
  const row = matches[0];
  if (!validate(row)) throw new Error('Invalid authored player Might skill');
  const physicalDamagePctPerRank = row.scaling?.passiveStatsPerLevel?.physicalDamagePct;
  const attackPctPerRank = row.scaling?.passiveStatsPerLevel?.attackPct;
  if (physicalDamagePctPerRank === undefined || attackPctPerRank === undefined) {
    throw new Error('Missing authored player Might coefficients');
  }
  return Object.freeze({ requiredLevel: row.requiredLevel, maxRank: row.maxLevel,
    physicalDamagePctPerRank, attackPctPerRank });
}

/** JSON-derived values independent of mutable skill catalog and registry. */
export const MIGHT_DEFINITION = resolveMightDefinition(paladinSkills);

/** Allocation only; later composition independently checks selection/class/level eligibility. */
export function resolveMightRank(
  levels?: Readonly<Record<string, number>>,
  definition: MightDefinition = MIGHT_DEFINITION
): number {
  let rank = 0;
  for (const alias of ['skills-paladin-might', 'paladin.might']) {
    const allocated = levels?.[alias];
    if (typeof allocated === 'number' && Number.isFinite(allocated) &&
      Number.isInteger(allocated) && allocated > 0) {
      rank = Math.max(rank, Math.min(definition.maxRank, allocated));
    }
  }
  return rank;
}

/** Eligible allocated rank; callers separately check explicit selection and encounter source life. */
export function resolveEligibleMightRank(
  player: Pick<Player, 'class' | 'level' | 'skillLevels'>,
  definition: MightDefinition = MIGHT_DEFINITION
): number {
  if (player.class !== 'paladin' || !Number.isFinite(player.level) || player.level < definition.requiredLevel) {
    return 0;
  }
  return resolveMightRank(player.skillLevels, definition);
}

/** Selected player Might configuration copied once for a wave; never persisted on combat units. */
export interface MightAuraProjection {
  readonly selectedAuraId: 'paladin.might';
  readonly sourceHeroId: string;
  readonly fieldedMercCombatId?: string;
  readonly rank: number;
  readonly maxRank: number;
  readonly physicalDamagePct: number;
  readonly attackPct: number;
}

function isMightSelection(value: unknown): value is 'paladin.might' {
  return value === 'paladin.might';
}

/** Freeze explicit eligible selection and authored potency without retaining player or allocation maps. */
export function composeMightAura(
  player: Pick<Player, 'id' | 'class' | 'level' | 'skillLevels' | 'selectedAuraId'>,
  fieldedMercCombatId?: string,
  definition: MightDefinition = MIGHT_DEFINITION
): MightAuraProjection | undefined {
  if (!isMightSelection(player.selectedAuraId)) return undefined;
  const rank = resolveEligibleMightRank(player, definition);
  if (rank <= 0) return undefined;
  return Object.freeze({ selectedAuraId: 'paladin.might', sourceHeroId: player.id, rank, maxRank: definition.maxRank,
    physicalDamagePct: rank * definition.physicalDamagePctPerRank,
    attackPct: rank * definition.attackPctPerRank,
    ...(fieldedMercCombatId && fieldedMercCombatId !== player.id ? { fieldedMercCombatId } : {}) });
}

function livingPlayer(unit: CombatUnit | undefined): unit is CombatUnit {
  return unit !== undefined && unit.side === 'player' && Number.isFinite(unit.life) && unit.life > 0 &&
    unit.summon !== true && unit.ownerId === undefined && unit.summonOwnerId === undefined;
}

/** Check current encounter source/recipient life and identity for each affected calculation; CC is irrelevant. */
export function activeMightAura(
  aura: MightAuraProjection | undefined,
  recipientId: string,
  units: ReadonlyMap<string, CombatUnit>
): MightAuraProjection | undefined {
  if (!aura || !isMightSelection(aura.selectedAuraId) || !Number.isInteger(aura.rank) ||
    aura.rank <= 0 || !Number.isInteger(aura.maxRank) || aura.maxRank <= 0 || aura.rank > aura.maxRank ||
    !Number.isFinite(aura.physicalDamagePct) || aura.physicalDamagePct < 0 ||
    !Number.isFinite(aura.attackPct) || aura.attackPct < 0) return undefined;
  const source = units.get(aura.sourceHeroId);
  if (!livingPlayer(source) || source.id !== aura.sourceHeroId || inferKind(source) !== 'hero') return undefined;
  const recipient = units.get(recipientId);
  if (!livingPlayer(recipient) || recipient.id !== recipientId) return undefined;
  if (recipientId === aura.sourceHeroId) return aura;
  return recipientId === aura.fieldedMercCombatId && inferKind(recipient) === 'merc' ? aura : undefined;
}
