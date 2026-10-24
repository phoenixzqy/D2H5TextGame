import paladinSkills from '../../data/skills/paladin.json';
import { inferKind, type CombatUnit } from '../combat/types';
import type { DamageType } from '../types/attributes';
import type { Player } from '../types/entities';
import type { SkillDef } from '../types/skills';
import { createSkillValidator } from './skill-validator';

/** Auras whose complete authored effects use existing combat stat consumers. */
export const STAT_AURA_IDS = Object.freeze(['paladin.thorns', 'paladin.blessed-aim', 'paladin.fanaticism',
  'paladin.defiance', 'paladin.resist-fire', 'paladin.resist-cold', 'paladin.resist-lightning', 'paladin.salvation'] as const);
export type StatAuraId = typeof STAT_AURA_IDS[number];
type BonusKey = 'thornsPct' | 'attackPct' | 'physicalDamagePct' | 'attackSpeedPct' | 'defensePct'
  | 'resistAllPct' | 'fireDamagePct' | 'coldDamagePct' | 'lightningDamagePct' | 'elementalDamagePct';
type Bonuses = Readonly<Partial<Record<BonusKey, number>>>;
const keys: Readonly<Record<StatAuraId, readonly BonusKey[]>> = {
  'paladin.thorns': ['thornsPct'], 'paladin.blessed-aim': ['attackPct'],
  'paladin.fanaticism': ['physicalDamagePct', 'attackSpeedPct'], 'paladin.defiance': ['defensePct'],
  'paladin.resist-fire': ['resistAllPct', 'fireDamagePct'], 'paladin.resist-cold': ['resistAllPct', 'coldDamagePct'],
  'paladin.resist-lightning': ['resistAllPct', 'lightningDamagePct'], 'paladin.salvation': ['resistAllPct', 'elementalDamagePct']
};
export interface StatAuraDefinition {
  readonly requiredLevel: number;
  readonly maxRank: number;
  readonly perRank: Bonuses;
}
export interface StatAuraProjection {
  readonly selectedAuraId: StatAuraId;
  readonly sourceHeroId: string;
  readonly fieldedMercCombatId?: string;
  readonly rank: number;
  readonly maxRank: number;
  readonly bonuses: Bonuses;
}
const validate = createSkillValidator<SkillDef & { readonly requiredLevel: number; readonly aura?: boolean; readonly effects?: unknown }>();

/** Distinguish complete stat effects from the canonical domain's still-unimplemented mechanics. */
export function isStatAuraId(value: unknown): value is StatAuraId {
  return STAT_AURA_IDS.some(id => id === value);
}

/** Validate exactly one authored row per supported aura and freeze independent primitive tuning. */
export function resolveStatAuraDefinitions(rows: readonly unknown[]): Readonly<Record<StatAuraId, StatAuraDefinition>> {
  return Object.freeze(Object.fromEntries(STAT_AURA_IDS.map(id => {
    const dataId = id.replace('paladin.', 'skills-paladin-');
    const matches = rows.filter(row => typeof row === 'object' && row !== null && 'id' in row && row.id === dataId);
    const row = matches[0];
    if (matches.length !== 1 || !validate(row) || row.aura !== true || row.trigger !== 'passive' ||
      row.target !== 'self' || row.cooldown !== 0 || row.effects !== undefined || row.damage !== undefined || row.appliesStatus !== undefined) {
      throw new Error(`Invalid authored stat aura ${id}`);
    }
    const perRank = row.scaling?.passiveStatsPerLevel;
    if (!perRank || Object.keys(perRank).length !== keys[id].length ||
      keys[id].some(key => !Number.isFinite(perRank[key]) || (perRank[key] ?? -1) < 0)) {
      throw new Error(`Invalid authored stat aura coefficients ${id}`);
    }
    return [id, Object.freeze({ requiredLevel: row.requiredLevel, maxRank: row.maxLevel,
      perRank: Object.freeze(Object.fromEntries(keys[id].map(key => [key, perRank[key]]))) })];
  })) as Record<StatAuraId, StatAuraDefinition>);
}
export const STAT_AURA_DEFINITIONS = resolveStatAuraDefinitions(paladinSkills);

/** Resolve selection, canonical allocation and data aliases by maximum, capped without double-counting. */
export function resolveEligibleStatAuraRank(player: Pick<Player, 'class' | 'level' | 'skillLevels'>, id: StatAuraId): number {
  const definition = STAT_AURA_DEFINITIONS[id];
  if (player.class !== 'paladin' || !Number.isFinite(player.level) || player.level < definition.requiredLevel) return 0;
  let rank = 0;
  for (const alias of [id, id.replace(/-/g, '_'), id.replace('paladin.', 'skills-paladin-')]) {
    const allocated = player.skillLevels?.[alias];
    if (typeof allocated === 'number' && Number.isInteger(allocated) && allocated > 0) rank = Math.max(rank, Math.min(allocated, definition.maxRank));
  }
  return rank;
}

/** Capture only the explicit selection and copied authored potency at the native wave boundary. */
export function composeStatAura(player: Pick<Player, 'id' | 'class' | 'level' | 'skillLevels' | 'selectedAuraId'>,
  fieldedMercCombatId?: string): StatAuraProjection | undefined {
  const id = player.selectedAuraId;
  if (!isStatAuraId(id)) return undefined;
  const rank = resolveEligibleStatAuraRank(player, id);
  if (rank === 0) return undefined;
  const definition = STAT_AURA_DEFINITIONS[id];
  return Object.freeze({ selectedAuraId: id, sourceHeroId: player.id, rank, maxRank: definition.maxRank,
    bonuses: Object.freeze(Object.fromEntries(keys[id].map(key => [key, (definition.perRank[key] ?? 0) * rank]))),
    ...(fieldedMercCombatId && fieldedMercCombatId !== player.id ? { fieldedMercCombatId } : {}) });
}

function valid(aura: StatAuraProjection): boolean {
  const bonuses: unknown = aura.bonuses;
  return isStatAuraId(aura.selectedAuraId) && typeof aura.sourceHeroId === 'string' && aura.sourceHeroId.length > 0 &&
    Number.isInteger(aura.rank) && aura.rank > 0 && Number.isInteger(aura.maxRank) && aura.rank <= aura.maxRank &&
    aura.maxRank <= STAT_AURA_DEFINITIONS[aura.selectedAuraId].maxRank &&
    typeof bonuses === 'object' && bonuses !== null &&
    Object.keys(aura.bonuses).length === keys[aura.selectedAuraId].length &&
    keys[aura.selectedAuraId].every(key => Number.isFinite(aura.bonuses[key]) && (aura.bonuses[key] ?? -1) >= 0);
}

/** Copy untrusted direct-engine input once; invalid projections provide no effect. */
export function copyStatAuraProjection(aura: StatAuraProjection | undefined): StatAuraProjection | undefined {
  if (!aura || !valid(aura)) return undefined;
  return Object.freeze({ selectedAuraId: aura.selectedAuraId, sourceHeroId: aura.sourceHeroId,
    rank: aura.rank, maxRank: aura.maxRank, bonuses: Object.freeze({ ...aura.bonuses }),
    ...(typeof aura.fieldedMercCombatId === 'string' && aura.fieldedMercCombatId !== aura.sourceHeroId
      ? { fieldedMercCombatId: aura.fieldedMercCombatId } : {}) });
}

function living(unit: CombatUnit | undefined): unit is CombatUnit {
  return unit !== undefined && unit.side === 'player' && Number.isFinite(unit.life) && unit.life > 0 &&
    unit.summon !== true && unit.ownerId === undefined && unit.summonOwnerId === undefined;
}

/** Resolve current living source and original recipient for every calculation, without stat mutation. */
export function activeStatAura(aura: StatAuraProjection | undefined, recipientId: string,
  units: ReadonlyMap<string, CombatUnit>): StatAuraProjection | undefined {
  if (!aura || !valid(aura)) return undefined;
  const source = units.get(aura.sourceHeroId), recipient = units.get(recipientId);
  if (!living(source) || source.id !== aura.sourceHeroId || inferKind(source) !== 'hero' ||
    !living(recipient) || recipient.id !== recipientId) return undefined;
  return recipientId === aura.sourceHeroId || recipientId === aura.fieldedMercCombatId && inferKind(recipient) === 'merc' ? aura : undefined;
}

/** Add only the damage types promised by these authored stat effects. */
export function statAuraDamageBonus(aura: StatAuraProjection | undefined, type: DamageType): number {
  const bonus = aura?.bonuses;
  if (!bonus) return 0;
  if (type === 'physical') return bonus.physicalDamagePct ?? 0;
  if (type === 'fire') return (bonus.fireDamagePct ?? 0) + (bonus.elementalDamagePct ?? 0);
  if (type === 'cold') return (bonus.coldDamagePct ?? 0) + (bonus.elementalDamagePct ?? 0);
  if (type === 'lightning') return (bonus.lightningDamagePct ?? 0) + (bonus.elementalDamagePct ?? 0);
  return 0;
}
