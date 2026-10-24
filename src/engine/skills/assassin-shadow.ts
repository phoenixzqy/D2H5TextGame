import skills from '../../data/skills/assassin.json';
import type { Player } from '../types/entities';
import type { SkillDef } from '../types/skills';
import type { CombatUnit } from '../combat/types';
import { createSkillValidator } from './skill-validator';

/** Exact automatic learned identities; aliases never stack. */
export const ASSASSIN_SHADOW_IDENTITIES = {
  fade: ['skills-assassin-fade', 'assassin.fade'],
  venom: ['skills-assassin-venom', 'assassin.venom']
} as const;
type Key = keyof typeof ASSASSIN_SHADOW_IDENTITIES;
/** Copied authored personal bonuses and optional basic-hit coating. */
export interface AssassinShadowDefinition {
  readonly requiredLevel: number;
  readonly maxRank: number;
  readonly resistPerRank: number;
  readonly magicDodgePerRank: number;
  readonly poisonPerRank: number;
  readonly coatingAttackPct: number;
  readonly coatingDurationMs: number;
}
export type AssassinShadowDefinitions = Readonly<Record<Key, AssassinShadowDefinition>>;
const validate = createSkillValidator<SkillDef & { readonly requiredLevel: number }>();
/** Validate exact source rows and retain only independently frozen primitive tuning. */
export function resolveAssassinShadowDefinitions(
  rows: readonly unknown[]
): AssassinShadowDefinitions {
  const read = (key: Key): AssassinShadowDefinition => {
    const id = ASSASSIN_SHADOW_IDENTITIES[key][0];
    const matches = rows.filter(
      (row) => typeof row === 'object' && row !== null && 'id' in row && row.id === id
    );
    const row = matches[0];
    if (matches.length !== 1 || !validate(row)) throw new Error('Invalid authored ' + id);
    const values = row.scaling?.passiveStatsPerLevel;
    return Object.freeze({
      requiredLevel: row.requiredLevel,
      maxRank: row.maxLevel,
      resistPerRank: values?.resistAllPct ?? 0,
      magicDodgePerRank: values?.magicDodgePct ?? 0,
      poisonPerRank: values?.poisonDamagePct ?? 0,
      coatingAttackPct: row.venomOnBasicHit?.attackPct ?? 0,
      coatingDurationMs: row.venomOnBasicHit?.durationMs ?? 0
    });
  };
  return Object.freeze({ fade: read('fade'), venom: read('venom') });
}
export const ASSASSIN_SHADOW_DEFINITIONS = resolveAssassinShadowDefinitions(skills);
type Owner = Pick<Player, 'class' | 'level' | 'skillLevels'>;
/** Fresh personal effects; learning prerequisites stay at their existing learning boundary. */
export function composeAssassinShadowPassives(
  player: Owner,
  definitions: AssassinShadowDefinitions = ASSASSIN_SHADOW_DEFINITIONS
): {
  readonly fadeRank: number;
  readonly venomRank: number;
  readonly resistAllBonus: number;
  readonly magicDodgeBonus: number;
  readonly poisonDamagePct: number;
} {
  const rank = (key: Key): number => {
    const d = definitions[key];
    if (
      player.class !== 'assassin' ||
      !Number.isFinite(player.level) ||
      player.level < d.requiredLevel
    )
      return 0;
    let rank = 0;
    for (const alias of ASSASSIN_SHADOW_IDENTITIES[key]) {
      const value = player.skillLevels?.[alias];
      if (
        typeof value === 'number' &&
        Number.isFinite(value) &&
        Number.isInteger(value) &&
        value > 0
      ) {
        rank = Math.max(rank, Math.min(d.maxRank, value));
      }
    }
    return rank;
  };
  const fadeRank = rank('fade'),
    venomRank = rank('venom');
  return Object.freeze({
    fadeRank,
    venomRank,
    resistAllBonus: fadeRank * definitions.fade.resistPerRank * 100,
    magicDodgeBonus: fadeRank * definitions.fade.magicDodgePerRank,
    poisonDamagePct: venomRank * definitions.venom.poisonPerRank
  });
}
/** Minimal transient wave authority; the source Player and its class never enter the engine. */
export interface AssassinVenomProjection {
  readonly sourceHeroId: string;
  readonly rank: number;
}
/** Freeze current eligible learned Venom for ordinary wave and explicit replay inputs. */
export function composeAssassinVenom(
  player: Owner & Pick<Player, 'id'>
): AssassinVenomProjection | undefined {
  const rank = composeAssassinShadowPassives(player).venomRank;
  return typeof player.id === 'string' && player.id.length > 0 && rank > 0
    ? Object.freeze({ sourceHeroId: player.id, rank })
    : undefined;
}
/** Reject malformed external projections; never retain a mutable caller object. */
export function copyAssassinVenomProjection(value: unknown): AssassinVenomProjection | undefined {
  if (
    typeof value !== 'object' ||
    value === null ||
    Array.isArray(value) ||
    Object.keys(value).length !== 2 ||
    !Object.keys(value).every((key) => key === 'sourceHeroId' || key === 'rank') ||
    !('sourceHeroId' in value) ||
    typeof value.sourceHeroId !== 'string' ||
    !value.sourceHeroId ||
    !('rank' in value) ||
    typeof value.rank !== 'number' ||
    !Number.isInteger(value.rank) ||
    value.rank <= 0 ||
    value.rank > ASSASSIN_SHADOW_DEFINITIONS.venom.maxRank
  )
    return undefined;
  return Object.freeze({ sourceHeroId: value.sourceHeroId, rank: value.rank });
}
/** Raw poison DPS for the exact living hero; mitigation is applied once by the combat consumer. */
export function assassinVenomRawDps(
  unit: CombatUnit,
  projection?: AssassinVenomProjection
): number | undefined {
  if (
    !projection ||
    unit.id !== projection.sourceHeroId ||
    unit.side !== 'player' ||
    unit.kind !== 'hero' ||
    unit.summon === true ||
    unit.ownerId !== undefined ||
    unit.summonOwnerId !== undefined ||
    !Number.isFinite(unit.level) ||
    unit.level < ASSASSIN_SHADOW_DEFINITIONS.venom.requiredLevel ||
    !Number.isFinite(unit.life) ||
    unit.life <= 0
  )
    return undefined;
  const bonus = unit.increasedDamagePct?.poison ?? 0;
  if (
    !Number.isFinite(unit.stats.attack) ||
    unit.stats.attack <= 0 ||
    typeof bonus !== 'number' ||
    !Number.isFinite(bonus)
  )
    return undefined;
  const raw = unit.stats.attack * ASSASSIN_SHADOW_DEFINITIONS.venom.coatingAttackPct * (1 + bonus);
  return Number.isFinite(raw) && raw > 0 && raw <= Number.MAX_SAFE_INTEGER ? raw : undefined;
}
