import paladinSkills from '../../data/skills/paladin.json';
import { inferKind, type CombatUnit } from '../combat/types';
import type { DamageType } from '../types/attributes';
import type { Player } from '../types/entities';
import type { AuraHealingTuning, AuraPulseTuning, AuraRedemptionTuning, AuraSanctuaryTuning, SkillDef } from '../types/skills';
import { createSkillValidator } from './skill-validator';

/** Selected stat auras, including their derived enemy Chill and resistance effects. */
export const STAT_AURA_IDS = Object.freeze(['paladin.thorns', 'paladin.blessed-aim', 'paladin.fanaticism',
  'paladin.defiance', 'paladin.resist-fire', 'paladin.resist-cold', 'paladin.resist-lightning', 'paladin.salvation',
  'paladin.holy-freeze', 'paladin.conviction', 'paladin.holy-fire', 'paladin.holy-shock', 'paladin.prayer', 'paladin.cleansing', 'paladin.redemption', 'paladin.vigor', 'paladin.sanctuary'] as const);
export type StatAuraId = typeof STAT_AURA_IDS[number];
type BonusKey = 'thornsPct' | 'attackPct' | 'physicalDamagePct' | 'attackSpeedPct' | 'defensePct'
  | 'resistAllPct' | 'fireDamagePct' | 'coldDamagePct' | 'lightningDamagePct' | 'elementalDamagePct' | 'physDodgePct' | 'arcaneDamagePct' | 'lifeRegenPct' | 'magicDodgePct' | 'manaRegenPct' | 'lifePct';
type Bonuses = Readonly<Partial<Record<BonusKey, number>>>;
const keys: Readonly<Record<StatAuraId, readonly BonusKey[]>> = {
  'paladin.thorns': ['thornsPct'], 'paladin.blessed-aim': ['attackPct'],
  'paladin.fanaticism': ['physicalDamagePct', 'attackSpeedPct'], 'paladin.defiance': ['defensePct'],
  'paladin.resist-fire': ['resistAllPct', 'fireDamagePct'], 'paladin.resist-cold': ['resistAllPct', 'coldDamagePct'],
  'paladin.resist-lightning': ['resistAllPct', 'lightningDamagePct'], 'paladin.salvation': ['resistAllPct', 'elementalDamagePct'],
  'paladin.holy-freeze': ['coldDamagePct', 'physDodgePct'], 'paladin.conviction': ['elementalDamagePct', 'arcaneDamagePct'],
  'paladin.holy-fire': ['fireDamagePct'], 'paladin.holy-shock': ['lightningDamagePct'], 'paladin.prayer': ['lifeRegenPct'],
  'paladin.cleansing': ['lifeRegenPct', 'magicDodgePct'], 'paladin.redemption': ['lifeRegenPct', 'manaRegenPct'], 'paladin.vigor': ['lifePct', 'attackSpeedPct'], 'paladin.sanctuary': ['arcaneDamagePct']
};
export interface StatAuraDefinition {
  readonly sanctuary?: AuraSanctuaryTuning;
  readonly redemption?: AuraRedemptionTuning;
  readonly requiredLevel: number;
  readonly maxRank: number;
  readonly perRank: Bonuses;
  readonly enemyResistReductionPct?: number;
  readonly pulse?: AuraPulseTuning;
  readonly healing?: AuraHealingTuning;
  readonly cleansingDurationMultiplier?: number;
}
export interface StatAuraProjection {
  readonly sanctuary?: AuraSanctuaryTuning;
  readonly redemption?: AuraRedemptionTuning;
  readonly selectedAuraId: StatAuraId;
  readonly sourceHeroId: string;
  readonly fieldedMercCombatId?: string;
  readonly rank: number;
  readonly maxRank: number;
  readonly bonuses: Bonuses;
  readonly enemyResistReductionPct?: number;
  readonly pulse?: AuraPulseTuning;
  readonly healing?: AuraHealingTuning;
  readonly cleansingDurationMultiplier?: number;
}
const validate = createSkillValidator<SkillDef & { readonly requiredLevel: number; readonly aura?: boolean; readonly effects?: unknown }>();

function validSanctuary(id: StatAuraId, input: unknown): boolean {
  if (id !== 'paladin.sanctuary') return input === undefined;
  if (typeof input !== 'object' || input === null) return false;
  const tuning = input as AuraSanctuaryTuning;
  return Object.keys(tuning).length === 3 && ['intervalMs', 'damage', 'repulseDurationMs'].every(key => Object.hasOwn(tuning, key)) &&
    Number.isInteger(tuning.intervalMs) && tuning.intervalMs >= 1000 && tuning.intervalMs <= 60000 &&
    Number.isFinite(tuning.damage) && tuning.damage > 0 && Number.isInteger(tuning.repulseDurationMs) &&
    tuning.repulseDurationMs >= 1 && tuning.repulseDurationMs <= 60000;
}

function copySanctuary(tuning: AuraSanctuaryTuning): AuraSanctuaryTuning {
  return Object.freeze({ intervalMs: tuning.intervalMs, damage: tuning.damage, repulseDurationMs: tuning.repulseDurationMs });
}

function validRedemption(id: StatAuraId, input: unknown): boolean {
  if (id !== 'paladin.redemption') return input === undefined;
  if (typeof input !== 'object' || input === null) return false;
  const tuning = input as AuraRedemptionTuning;
  return Object.keys(tuning).length === 3 && ['intervalMs', 'life', 'mana'].every(key => Object.hasOwn(tuning, key)) &&
    Number.isInteger(tuning.intervalMs) && tuning.intervalMs >= 1000 && tuning.intervalMs <= 60000 &&
    Number.isFinite(tuning.life) && tuning.life > 0 && Number.isFinite(tuning.mana) && tuning.mana > 0;
}

function copyRedemption(tuning: AuraRedemptionTuning): AuraRedemptionTuning {
  return Object.freeze({ intervalMs: tuning.intervalMs, life: tuning.life, mana: tuning.mana });
}

function validHealing(id: StatAuraId, input: unknown): boolean {
  if (id !== 'paladin.prayer' && id !== 'paladin.cleansing') return input === undefined;
  if (typeof input !== 'object' || input === null) return false;
  const healing = input as AuraHealingTuning;
  return Object.keys(healing).length === 2 && Object.hasOwn(healing, 'intervalMs') && Object.hasOwn(healing, 'amount') &&
    Number.isInteger(healing.intervalMs) && healing.intervalMs >= 1000 && healing.intervalMs <= 60000 &&
    Number.isFinite(healing.amount) && healing.amount > 0;
}

function copyHealing(healing: AuraHealingTuning): AuraHealingTuning {
  return Object.freeze({ intervalMs: healing.intervalMs, amount: healing.amount });
}

function validPulse(id: StatAuraId, input: unknown): boolean {
  if (id !== 'paladin.holy-fire' && id !== 'paladin.holy-shock') return input === undefined;
  if (typeof input !== 'object' || input === null) return false;
  const pulse = input as AuraPulseTuning;
  if (!Number.isInteger(pulse.intervalMs) ||
    pulse.intervalMs < 1000 || pulse.intervalMs > 60000 || !Number.isFinite(pulse.damage) || pulse.damage <= 0 ||
    pulse.damageType !== (id === 'paladin.holy-fire' ? 'fire' : 'lightning')) return false;
  const fields = ['intervalMs', 'damage', 'damageType', ...(id === 'paladin.holy-fire' ? ['burn'] : [])];
  if (Object.keys(pulse).length !== fields.length || fields.some(key => !Object.hasOwn(pulse, key))) return false;
  const burn: unknown = pulse.burn;
  if (id === 'paladin.holy-shock') return burn === undefined;
  if (typeof burn !== 'object' || burn === null) return false;
  const tuning = burn as NonNullable<AuraPulseTuning['burn']>;
  return Object.keys(tuning).length === 2 && Number.isInteger(tuning.durationMs) && tuning.durationMs >= 1 && tuning.durationMs <= 60000 &&
    Number.isFinite(tuning.dotPctOfDamage) && tuning.dotPctOfDamage > 0 && tuning.dotPctOfDamage <= 1;
}

function copyPulse(pulse: AuraPulseTuning): AuraPulseTuning {
  return Object.freeze({ intervalMs: pulse.intervalMs, damage: pulse.damage, damageType: pulse.damageType,
    ...(pulse.burn ? { burn: Object.freeze({ durationMs: pulse.burn.durationMs, dotPctOfDamage: pulse.burn.dotPctOfDamage }) } : {}) });
}

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
      ...(row.conviction ? { enemyResistReductionPct: row.conviction.enemyResistReductionPct } : {}),
      ...(row.auraPulse ? { pulse: copyPulse(row.auraPulse) } : {}),
      ...(row.auraHealing ? { healing: copyHealing(row.auraHealing) } : {}),
      ...(row.redemption ? { redemption: copyRedemption(row.redemption) } : {}),
      ...(row.sanctuary ? { sanctuary: copySanctuary(row.sanctuary) } : {}),
      ...(row.cleansing ? { cleansingDurationMultiplier: row.cleansing.durationMultiplier, healing: copyHealing(row.cleansing.healing) } : {}),
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
    ...(definition.enemyResistReductionPct !== undefined ? { enemyResistReductionPct: definition.enemyResistReductionPct } : {}),
    ...(definition.pulse ? { pulse: copyPulse(definition.pulse) } : {}),
    ...(definition.healing ? { healing: copyHealing(definition.healing) } : {}),
    ...(definition.redemption ? { redemption: copyRedemption(definition.redemption) } : {}),
    ...(definition.sanctuary ? { sanctuary: copySanctuary(definition.sanctuary) } : {}),
    ...(definition.cleansingDurationMultiplier !== undefined ? { cleansingDurationMultiplier: definition.cleansingDurationMultiplier } : {}),
    bonuses: Object.freeze(Object.fromEntries(keys[id].map(key => [key, (definition.perRank[key] ?? 0) * rank]))),
    ...(fieldedMercCombatId && fieldedMercCombatId !== player.id ? { fieldedMercCombatId } : {}) });
}

function valid(aura: StatAuraProjection): boolean {
  const bonuses: unknown = aura.bonuses;
  return isStatAuraId(aura.selectedAuraId) && typeof aura.sourceHeroId === 'string' && aura.sourceHeroId.length > 0 &&
    validPulse(aura.selectedAuraId, aura.pulse) &&
    validHealing(aura.selectedAuraId, aura.healing) &&
    validRedemption(aura.selectedAuraId, aura.redemption) &&
    validSanctuary(aura.selectedAuraId, aura.sanctuary) &&
    (aura.selectedAuraId === 'paladin.cleansing'
      ? typeof aura.cleansingDurationMultiplier === 'number' && Number.isFinite(aura.cleansingDurationMultiplier) &&
        aura.cleansingDurationMultiplier > 0 && aura.cleansingDurationMultiplier < 1
      : aura.cleansingDurationMultiplier === undefined) &&
    (aura.selectedAuraId === 'paladin.conviction'
      ? typeof aura.enemyResistReductionPct === 'number' && Number.isFinite(aura.enemyResistReductionPct) &&
        aura.enemyResistReductionPct >= 0 && aura.enemyResistReductionPct <= 100
      : aura.enemyResistReductionPct === undefined) &&
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
    ...(aura.enemyResistReductionPct !== undefined ? { enemyResistReductionPct: aura.enemyResistReductionPct } : {}),
    ...(aura.pulse ? { pulse: copyPulse(aura.pulse) } : {}),
    ...(aura.healing ? { healing: copyHealing(aura.healing) } : {}),
    ...(aura.redemption ? { redemption: copyRedemption(aura.redemption) } : {}),
    ...(aura.sanctuary ? { sanctuary: copySanctuary(aura.sanctuary) } : {}),
    ...(aura.cleansingDurationMultiplier !== undefined ? { cleansingDurationMultiplier: aura.cleansingDurationMultiplier } : {}),
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
  if (type === 'arcane') return bonus.arcaneDamagePct ?? 0;
  return 0;
}
