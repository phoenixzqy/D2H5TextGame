/**
 * Default 70-skill catalog stubs.
 *
 * Source: docs/design/skills-spec.md §3.
 *
 * These are *engine-side stubs* derived from the design table. They contain
 * just enough numbers (base damage, cooldown, mana cost, status applied) to
 * exercise the combat engine. The authoritative tuning lives in the JSON data
 * files (`src/data/skills/*.json`); content-designer overrides these via
 * {@link registerSkill}.
 *
 * @module engine/skills/builders
 */

import type { RegisteredSkill, SkillEffect } from './effects';
import type { DamageType } from '../types/attributes';
import type { SkillTarget, ComboTag } from '../types/skills';

interface BuildSpec {
  readonly id: string;
  readonly archetype: string;
  readonly target: SkillTarget;
  readonly cooldown: number;
  readonly manaCost: number;
  readonly damageType?: DamageType;
  readonly base?: readonly [number, number];
  readonly perRank?: readonly [number, number];
  readonly status?: { readonly id: string; readonly chance?: number; readonly stacks?: number; readonly dotPct?: number };
  readonly tags?: readonly ComboTag[];
  readonly buff?: { readonly id: string; readonly duration: number };
  readonly summon?: { readonly summonId: string; readonly max: number; readonly onStart?: boolean };
  readonly minLevel?: number;
}

function build(s: BuildSpec): RegisteredSkill {
  const effects: SkillEffect[] = [];
  if (s.damageType && s.base) {
    effects.push({
      kind: 'damage',
      damageType: s.damageType,
      base: s.base,
      ...(s.perRank ? { perRank: s.perRank } : {}),
      ...(s.tags ? { tags: s.tags } : {}),
      ...(s.status
        ? {
            applyStatus: {
              id: s.status.id,
              ...(s.status.chance !== undefined ? { chance: s.status.chance } : {}),
              ...(s.status.stacks !== undefined ? { stacksOnApply: s.status.stacks } : {}),
              ...(s.status.dotPct !== undefined ? { dotPctOfDamage: s.status.dotPct } : {})
            }
          }
        : {})
    });
  }
  if (s.buff) {
    effects.push({ kind: 'buff', id: s.buff.id, duration: s.buff.duration });
  }
  if (s.summon) {
    effects.push({ kind: 'summon', summonId: s.summon.summonId, maxCount: s.summon.max });
  }
  return {
    id: s.id,
    archetype: s.archetype,
    target: s.target,
    cooldown: s.cooldown,
    manaCost: s.manaCost,
    effects,
    minLevel: s.minLevel ?? 1,
    ...(s.buff ? { isBuff: true } : {}),
    ...(s.summon?.onStart ? { summonOnStart: true } : {})
  };
}

/**
 * The 70-skill stub catalog (7 archetypes × 10 skills each).
 * Numbers are illustrative; production data should be loaded from JSON.
 */
export const DEFAULT_SKILLS: readonly RegisteredSkill[] = Object.freeze([
  // Sorceress
  build({ id: 'sorceress.ice_bolt', archetype: 'sorceress', target: 'single-enemy', cooldown: 1, manaCost: 10, damageType: 'cold', base: [30, 45], status: { id: 'chill' } }),
  build({ id: 'sorceress.frost_nova', archetype: 'sorceress', target: 'all-enemies', cooldown: 3, manaCost: 20, damageType: 'cold', base: [25, 35], status: { id: 'chill' } }),
  build({ id: 'sorceress.frozen_orb', archetype: 'sorceress', target: 'area-enemies', cooldown: 2, manaCost: 30, damageType: 'cold', base: [60, 90], status: { id: 'chill' } }),
  build({ id: 'sorceress.chain_lightning', archetype: 'sorceress', target: 'area-enemies', cooldown: 2, manaCost: 25, damageType: 'lightning', base: [50, 70], status: { id: 'paralyze', chance: 0.2 } }),
  build({ id: 'sorceress.fire_ball', archetype: 'sorceress', target: 'single-enemy', cooldown: 1, manaCost: 20, damageType: 'fire', base: [70, 100], status: { id: 'ignite', dotPct: 0.1 } }),
  build({ id: 'sorceress.meteor', archetype: 'sorceress', target: 'all-enemies', cooldown: 4, manaCost: 50, damageType: 'fire', base: [100, 150], status: { id: 'ignite', dotPct: 0.1 } }),
  build({ id: 'sorceress.cold_mastery', archetype: 'sorceress', target: 'self', cooldown: 0, manaCost: 0, buff: { id: 'cold_mastery', duration: -1 } }),
  build({ id: 'sorceress.lightning_mastery', archetype: 'sorceress', target: 'self', cooldown: 0, manaCost: 0, buff: { id: 'lightning_mastery', duration: -1 } }),
  build({ id: 'sorceress.fire_mastery', archetype: 'sorceress', target: 'self', cooldown: 0, manaCost: 0, buff: { id: 'fire_mastery', duration: -1 } }),
  build({ id: 'sorceress.energy_shield', archetype: 'sorceress', target: 'self', cooldown: 0, manaCost: 0, buff: { id: 'energy_shield', duration: -1 }, minLevel: 18 }),

  // Necromancer
  build({ id: 'necromancer.raise_skeleton', archetype: 'necromancer', target: 'summon', cooldown: 0, manaCost: 15, summon: { summonId: 'skeleton', max: 5, onStart: true } }),
  build({ id: 'necromancer.corpse_explosion', archetype: 'necromancer', target: 'all-enemies', cooldown: 2, manaCost: 20, damageType: 'fire', base: [50, 80], status: { id: 'ignite', dotPct: 0.1 } }),
  build({ id: 'necromancer.poison_nova', archetype: 'necromancer', target: 'all-enemies', cooldown: 3, manaCost: 25, damageType: 'poison', base: [20, 30], status: { id: 'poison', stacks: 2, dotPct: 0.05 } }),
  build({ id: 'necromancer.bone_spear', archetype: 'necromancer', target: 'single-enemy', cooldown: 1, manaCost: 20, damageType: 'arcane', base: [60, 90] }),
  build({ id: 'necromancer.amplify_damage', archetype: 'necromancer', target: 'all-enemies', cooldown: 3, manaCost: 15, damageType: 'arcane', base: [0, 0], status: { id: 'amplify' } }),
  build({ id: 'necromancer.decrepify', archetype: 'necromancer', target: 'all-enemies', cooldown: 3, manaCost: 20, damageType: 'arcane', base: [0, 0], status: { id: 'decrepify' } }),
  build({ id: 'necromancer.summon_mastery', archetype: 'necromancer', target: 'self', cooldown: 0, manaCost: 0, buff: { id: 'summon_mastery', duration: -1 } }),
  build({ id: 'necromancer.poison_mastery', archetype: 'necromancer', target: 'self', cooldown: 0, manaCost: 0, buff: { id: 'poison_mastery', duration: -1 } }),
  build({ id: 'necromancer.corpse_attracter', archetype: 'necromancer', target: 'self', cooldown: 0, manaCost: 0, buff: { id: 'blood_golem', duration: -1 } }),
  build({ id: 'necromancer.bone_armor', archetype: 'necromancer', target: 'self', cooldown: 0, manaCost: 0, buff: { id: 'bone_armor', duration: -1 } }),

  // Paladin
  build({ id: 'paladin.zeal', archetype: 'paladin', target: 'area-enemies', cooldown: 1, manaCost: 10, damageType: 'physical', base: [40, 60] }),
  build({ id: 'paladin.holy_bolt', archetype: 'paladin', target: 'single-enemy', cooldown: 1, manaCost: 15, damageType: 'arcane', base: [50, 70] }),
  build({ id: 'paladin.blessed_hammer', archetype: 'paladin', target: 'all-enemies', cooldown: 2, manaCost: 25, damageType: 'arcane', base: [60, 90] }),
  build({ id: 'paladin.vengeance', archetype: 'paladin', target: 'single-enemy', cooldown: 2, manaCost: 30, damageType: 'fire', base: [30, 50], status: { id: 'ignite', dotPct: 0.1 } }),
  build({ id: 'paladin.charge', archetype: 'paladin', target: 'single-enemy', cooldown: 3, manaCost: 20, damageType: 'physical', base: [80, 120], status: { id: 'stun' } }),
  build({ id: 'paladin.fist_of_heavens', archetype: 'paladin', target: 'all-enemies', cooldown: 4, manaCost: 50, damageType: 'lightning', base: [100, 150], status: { id: 'paralyze', chance: 0.3 } }),
  build({ id: 'paladin.might', archetype: 'paladin', target: 'self', cooldown: 0, manaCost: 0, buff: { id: 'might', duration: -1 } }),
  build({ id: 'paladin.holy_fire', archetype: 'paladin', target: 'self', cooldown: 0, manaCost: 0, buff: { id: 'holy_fire', duration: -1 } }),
  build({ id: 'paladin.conviction', archetype: 'paladin', target: 'self', cooldown: 0, manaCost: 0, buff: { id: 'conviction', duration: -1 }, minLevel: 24 }),
  build({ id: 'paladin.meditation', archetype: 'paladin', target: 'self', cooldown: 0, manaCost: 0, buff: { id: 'meditation', duration: -1 } }),

  // Amazon
  build({ id: 'amazon.magic_arrow', archetype: 'amazon', target: 'single-enemy', cooldown: 1, manaCost: 5, damageType: 'arcane', base: [35, 50] }),
  build({ id: 'amazon.multiple_shot', archetype: 'amazon', target: 'area-enemies', cooldown: 2, manaCost: 15, damageType: 'physical', base: [40, 60] }),
  build({ id: 'amazon.freezing_arrow', archetype: 'amazon', target: 'area-enemies', cooldown: 2, manaCost: 20, damageType: 'cold', base: [50, 70], status: { id: 'chill' } }),
  build({ id: 'amazon.lightning_fury', archetype: 'amazon', target: 'all-enemies', cooldown: 3, manaCost: 30, damageType: 'lightning', base: [60, 90], status: { id: 'paralyze', chance: 0.2 } }),
  build({ id: 'amazon.plague_javelin', archetype: 'amazon', target: 'area-enemies', cooldown: 2, manaCost: 25, damageType: 'poison', base: [30, 50], status: { id: 'plague', stacks: 3, dotPct: 0.05 } }),
  build({ id: 'amazon.piercing_strike', archetype: 'amazon', target: 'all-enemies', cooldown: 2, manaCost: 20, damageType: 'physical', base: [35, 55] }),
  build({ id: 'amazon.critical_strike', archetype: 'amazon', target: 'self', cooldown: 0, manaCost: 0, buff: { id: 'critical_strike', duration: -1 } }),
  build({ id: 'amazon.penetrate', archetype: 'amazon', target: 'self', cooldown: 0, manaCost: 0, buff: { id: 'penetrate', duration: -1 } }),
  build({ id: 'amazon.dodge', archetype: 'amazon', target: 'self', cooldown: 0, manaCost: 0, buff: { id: 'dodge', duration: -1 } }),
  build({ id: 'amazon.valkyrie', archetype: 'amazon', target: 'summon', cooldown: 0, manaCost: 25, summon: { summonId: 'valkyrie', max: 1, onStart: true }, minLevel: 18 }),

  // Barbarian
  build({ id: 'barbarian.bash', archetype: 'barbarian', target: 'single-enemy', cooldown: 1, manaCost: 5, damageType: 'physical', base: [50, 70] }),
  build({ id: 'barbarian.double_swing', archetype: 'barbarian', target: 'area-enemies', cooldown: 1, manaCost: 10, damageType: 'physical', base: [40, 60] }),
  build({ id: 'barbarian.whirlwind', archetype: 'barbarian', target: 'all-enemies', cooldown: 2, manaCost: 25, damageType: 'physical', base: [60, 90] }),
  build({ id: 'barbarian.leap_attack', archetype: 'barbarian', target: 'all-enemies', cooldown: 3, manaCost: 20, damageType: 'physical', base: [70, 100], status: { id: 'stun' } }),
  build({ id: 'barbarian.berserk', archetype: 'barbarian', target: 'single-enemy', cooldown: 2, manaCost: 20, damageType: 'arcane', base: [80, 120] }),
  build({ id: 'barbarian.war_cry', archetype: 'barbarian', target: 'all-enemies', cooldown: 3, manaCost: 30, damageType: 'physical', base: [30, 50], status: { id: 'stun' } }),
  build({ id: 'barbarian.iron_skin', archetype: 'barbarian', target: 'self', cooldown: 0, manaCost: 0, buff: { id: 'iron_skin', duration: -1 } }),
  build({ id: 'barbarian.natural_resistance', archetype: 'barbarian', target: 'self', cooldown: 0, manaCost: 0, buff: { id: 'natural_resistance', duration: -1 } }),
  build({ id: 'barbarian.battle_orders', archetype: 'barbarian', target: 'self', cooldown: 0, manaCost: 0, buff: { id: 'battle_orders', duration: -1 } }),
  build({ id: 'barbarian.shout', archetype: 'barbarian', target: 'self', cooldown: 0, manaCost: 0, buff: { id: 'shout', duration: 5 } }),

  // Druid
  build({ id: 'druid.firestorm', archetype: 'druid', target: 'all-enemies', cooldown: 2, manaCost: 20, damageType: 'fire', base: [40, 60], status: { id: 'ignite', dotPct: 0.1 } }),
  build({ id: 'druid.arctic_blast', archetype: 'druid', target: 'area-enemies', cooldown: 2, manaCost: 25, damageType: 'cold', base: [50, 70], status: { id: 'chill' } }),
  build({ id: 'druid.tornado', archetype: 'druid', target: 'area-enemies', cooldown: 2, manaCost: 30, damageType: 'physical', base: [60, 90] }),
  build({ id: 'druid.summon_dire_wolf', archetype: 'druid', target: 'summon', cooldown: 0, manaCost: 20, summon: { summonId: 'dire_wolf', max: 3, onStart: true } }),
  build({ id: 'druid.werewolf_maul', archetype: 'druid', target: 'single-enemy', cooldown: 1, manaCost: 15, damageType: 'physical', base: [80, 120], status: { id: 'bleed', dotPct: 0.08 } }),
  build({ id: 'druid.hurricane', archetype: 'druid', target: 'all-enemies', cooldown: 4, manaCost: 50, damageType: 'cold', base: [70, 100], status: { id: 'chill' } }),
  build({ id: 'druid.elemental_mastery', archetype: 'druid', target: 'self', cooldown: 0, manaCost: 0, buff: { id: 'elemental_mastery', duration: -1 } }),
  build({ id: 'druid.lycanthropy', archetype: 'druid', target: 'self', cooldown: 0, manaCost: 0, buff: { id: 'lycanthropy', duration: -1 } }),
  build({ id: 'druid.heart_of_wolverine', archetype: 'druid', target: 'self', cooldown: 0, manaCost: 0, buff: { id: 'heart_of_wolverine', duration: -1 } }),
  build({ id: 'druid.oak_sage', archetype: 'druid', target: 'self', cooldown: 0, manaCost: 0, buff: { id: 'oak_sage', duration: -1 }, minLevel: 18 }),

  // Assassin
  build({ id: 'assassin.shock_web', archetype: 'assassin', target: 'all-enemies', cooldown: 2, manaCost: 20, damageType: 'lightning', base: [30, 50], status: { id: 'paralyze', chance: 0.2 } }),
  build({ id: 'assassin.fire_blast', archetype: 'assassin', target: 'area-enemies', cooldown: 2, manaCost: 25, damageType: 'fire', base: [50, 70], status: { id: 'ignite', dotPct: 0.1 } }),
  build({ id: 'assassin.blade_fury', archetype: 'assassin', target: 'area-enemies', cooldown: 1, manaCost: 15, damageType: 'physical', base: [40, 60] }),
  build({ id: 'assassin.mind_blast', archetype: 'assassin', target: 'all-enemies', cooldown: 3, manaCost: 30, damageType: 'arcane', base: [50, 70], status: { id: 'mana-burn' } }),
  build({ id: 'assassin.dragon_claw', archetype: 'assassin', target: 'single-enemy', cooldown: 1, manaCost: 20, damageType: 'physical', base: [70, 100] }),
  build({ id: 'assassin.phoenix_strike', archetype: 'assassin', target: 'single-enemy', cooldown: 3, manaCost: 40, damageType: 'fire', base: [40, 60], status: { id: 'ignite', dotPct: 0.1 } }),
  build({ id: 'assassin.claw_mastery', archetype: 'assassin', target: 'self', cooldown: 0, manaCost: 0, buff: { id: 'claw_mastery', duration: -1 } }),
  build({ id: 'assassin.weapon_block', archetype: 'assassin', target: 'self', cooldown: 0, manaCost: 0, buff: { id: 'weapon_block', duration: -1 } }),
  build({ id: 'assassin.fade', archetype: 'assassin', target: 'self', cooldown: 0, manaCost: 0, buff: { id: 'fade', duration: -1 } }),
  build({ id: 'assassin.venom', archetype: 'assassin', target: 'self', cooldown: 0, manaCost: 0, buff: { id: 'venom', duration: -1 } }),

  // Monster generic skills
  build({ id: 'monster.weak_melee', archetype: 'monster', target: 'single-enemy', cooldown: 1, manaCost: 0, damageType: 'physical', base: [10, 15] }),
  build({ id: 'monster.strong_melee', archetype: 'monster', target: 'single-enemy', cooldown: 1, manaCost: 0, damageType: 'physical', base: [30, 50] }),
  build({ id: 'monster.fire_breath', archetype: 'monster', target: 'area-enemies', cooldown: 3, manaCost: 0, damageType: 'fire', base: [40, 60], status: { id: 'ignite', dotPct: 0.1 } }),
  build({ id: 'monster.poison_spit', archetype: 'monster', target: 'single-enemy', cooldown: 2, manaCost: 0, damageType: 'poison', base: [20, 30], status: { id: 'poison', stacks: 2, dotPct: 0.05 } }),
  build({ id: 'monster.lightning_bolt', archetype: 'monster', target: 'single-enemy', cooldown: 2, manaCost: 0, damageType: 'lightning', base: [50, 70] }),
  build({ id: 'monster.frost_aura', archetype: 'monster', target: 'all-enemies', cooldown: 3, manaCost: 0, damageType: 'cold', base: [15, 25], status: { id: 'chill' } }),
  build({ id: 'monster.charge', archetype: 'monster', target: 'single-enemy', cooldown: 4, manaCost: 0, damageType: 'physical', base: [60, 90] }),
  build({ id: 'monster.summon_adds', archetype: 'monster', target: 'summon', cooldown: 5, manaCost: 0, summon: { summonId: 'minion', max: 2, onStart: true } }),
  build({ id: 'monster.heal', archetype: 'monster', target: 'self', cooldown: 4, manaCost: 0, buff: { id: 'heal_self', duration: 1 } }),
  build({ id: 'monster.teleport', archetype: 'monster', target: 'self', cooldown: 3, manaCost: 0, buff: { id: 'teleport', duration: 1 } })
]);
