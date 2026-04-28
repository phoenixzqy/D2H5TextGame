/**
 * Stat allocation, point pools, and derived-stat composition.
 *
 * Source: docs/design/progression-curve.md §4, §9; combat-formulas.md §2.1.
 *
 * @module engine/progression/stats
 */

import type { CoreStats, DerivedStats, Resistances } from '../types/attributes';

/** Stat-point pool helpers. */
export interface PointBalance {
  readonly available: number;
  readonly spent: number;
}

/**
 * Total stat points unlocked by a given level (5 per level after L1).
 * `questBonusStat` is added on top — quests grant bonus stat points outside the per-level pool.
 */
export function totalStatPoints(level: number, questBonusStat = 0): number {
  return Math.max(0, 5 * (level - 1)) + questBonusStat;
}

/**
 * Total skill points unlocked by a given level (1/level + milestones at 12/24/36).
 * `questBonusSkill` adds quest-granted skill points (cap 5 in v1).
 */
export function totalSkillPoints(level: number, questBonusSkill = 0): number {
  let pts = Math.max(0, level - 1);
  if (level >= 12) pts += 1;
  if (level >= 24) pts += 1;
  if (level >= 36) pts += 1;
  return pts + questBonusSkill;
}

/** Soft-cap a stat past 200 (effective contribution halves). */
export function effectiveStatValue(raw: number): number {
  if (raw <= 200) return raw;
  const capped = Math.min(500, raw);
  return 200 + (capped - 200) * 0.5;
}

/** Per-stat additive contributions to derived stats from gear/buffs. */
export interface DerivedModifiers {
  readonly flatLife?: number;
  readonly flatMana?: number;
  readonly flatAttack?: number;
  readonly flatDefense?: number;
  readonly attackSpeedBonus?: number;
  readonly critChance?: number;
  readonly critDamage?: number;
  readonly physDodge?: number;
  readonly magicDodge?: number;
  readonly magicFind?: number;
  readonly goldFind?: number;
  readonly resistances?: Partial<Resistances>;
}

const DEFAULT_RESISTS: Resistances = {
  fire: 0,
  cold: 0,
  lightning: 0,
  poison: 0,
  arcane: 0,
  physical: 0
};

/**
 * Compute derived stats from core + level + (gear/buff) modifiers.
 *
 * Formula source: combat-formulas.md §2.1.
 *  Life = 100 + (level-1)*8 + Vit*2 + flatLife
 *  Mana = 50 + (level-1)*4 + Eng*1.5 + flatMana
 *  Attack = 10 + (level-1)*2 + max(Str, Dex)*0.5 + flatAttack
 *  Defense = 20 + (level-1)*3 + flatDefense
 *  AS = 100 + Dex + asBonus
 *  PhysDodge = 0.05 + Dex*0.002 + bonus
 *  MagicDodge = 0.05 + bonus
 *
 * Resistances are summed and clamped to [-100, 75] at award time, not here.
 */
export function deriveStats(
  core: CoreStats,
  level: number,
  mods: DerivedModifiers = {}
): DerivedStats {
  const str = effectiveStatValue(core.strength);
  const dex = effectiveStatValue(core.dexterity);
  const vit = effectiveStatValue(core.vitality);
  const eng = effectiveStatValue(core.energy);
  const lvlAbove1 = Math.max(0, level - 1);

  const lifeMax = Math.floor(
    100 + lvlAbove1 * 8 + vit * 2 + (mods.flatLife ?? 0)
  );
  const manaMax = Math.floor(
    50 + lvlAbove1 * 4 + eng * 1.5 + (mods.flatMana ?? 0)
  );
  const attack = Math.floor(
    10 + lvlAbove1 * 2 + Math.max(str, dex) * 0.5 + (mods.flatAttack ?? 0)
  );
  const defense = Math.floor(20 + lvlAbove1 * 3 + (mods.flatDefense ?? 0));
  const attackSpeed = Math.max(
    1,
    Math.floor(100 + dex + (mods.attackSpeedBonus ?? 0))
  );

  return {
    life: lifeMax,
    lifeMax,
    mana: manaMax,
    manaMax,
    attack,
    defense,
    attackSpeed,
    critChance: 0.05 + (mods.critChance ?? 0),
    critDamage: 2 + (mods.critDamage ?? 0),
    physDodge: 0.05 + dex * 0.002 + (mods.physDodge ?? 0),
    magicDodge: 0.05 + (mods.magicDodge ?? 0),
    magicFind: mods.magicFind ?? 0,
    goldFind: mods.goldFind ?? 0,
    resistances: { ...DEFAULT_RESISTS, ...(mods.resistances ?? {}) }
  };
}
