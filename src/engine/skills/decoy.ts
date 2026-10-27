import rows from '../../data/skills/amazon.json';
import type { SkillDef } from '../types/skills';
import { createSkillValidator } from './skill-validator';
import { validCapturedSkillRank } from './effective-rank';
import { MITIGATION_DEFINITION } from '../combat/mitigation-definition';
import type { Player } from '../types/entities';
import type { CombatUnit } from '../combat/types';
import { inferKind } from '../combat/types';
import type { RegisteredSkill } from './effects';
import { projectPlayerClassActives } from './player-class-actives';

export const DECOY_IDS = ['skills-amazon-decoy', 'amazon.decoy'] as const;
const validate = createSkillValidator<SkillDef & { readonly requiredLevel: number }>();
/** Validate the unique complete Decoy row, then copy/freeze only privately owned data. */
export function resolveDecoyDefinition(input: readonly unknown[]) {
  const matches = input.filter(
    (row) => typeof row === 'object' && row !== null && 'id' in row && row.id === DECOY_IDS[0]
  );
  const row = matches[0];
  if (
    matches.length !== 1 ||
    !validate(row) ||
    !row.decoy ||
    !row.scaling ||
    row.cost.mana === undefined
  )
    throw new Error('Invalid authored Decoy');
  return Object.freeze({
    ...row.decoy,
    requiredLevel: row.requiredLevel,
    maxRank: row.maxLevel,
    manaCost: row.cost.mana,
    cooldown: row.cooldown,
    manaCostPerRank: row.scaling.costPerLevel ?? 0,
    cooldownPerRank: row.scaling.cooldownPerLevel ?? 0,
    bodyStats: Object.freeze({
      ...row.decoy.bodyStats,
      resistances: Object.freeze({ ...row.decoy.bodyStats.resistances })
    })
  });
}
export const DECOY_DEFINITION = resolveDecoyDefinition(rows);
function rankOffset(rank: number, rankBonus: 1 | undefined, maxRank: number) {
  if (!validCapturedSkillRank(rank, maxRank, rankBonus)) throw new Error('Invalid paid Decoy rank');
  return rank - 1;
}
/** Fresh mutable body stats; no player equipment or unrelated summon mastery is inherited. */
export function decoyBodyStats(rank: number, rankBonus?: 1, definition = DECOY_DEFINITION) {
  const d = definition,
    life = d.bodyStats.lifeMax + d.lifePerRank * rankOffset(rank, rankBonus, d.maxRank);
  return {
    ...d.bodyStats,
    life,
    lifeMax: life,
    mana: d.bodyStats.manaMax,
    magicResist: Math.max(0, Math.floor(MITIGATION_DEFINITION.friendlyBase.summon)),
    resistances: { ...d.bodyStats.resistances }
  };
}
/** Half-open lifetime captured once at the paid effective rank. */
export function decoyDuration(rank: number, rankBonus?: 1, definition = DECOY_DEFINITION): number {
  return (
    definition.durationMs +
    definition.durationPerRankMs * rankOffset(rank, rankBonus, definition.maxRank)
  );
}

/** Detect exact aliases and contradictory effects before ordinary casting can spend mana. */
export function isDecoySkill(skill: RegisteredSkill, slot = skill.id): boolean {
  return (
    DECOY_IDS.some((id) => id === skill.id || id === slot) ||
    skill.effects.some((effect) => effect.kind === 'decoy')
  );
}

/** Only the exact authored singleton effect and payment may prepare a privileged duplicate. */
export function matchesDecoy(skill: RegisteredSkill): boolean {
  const d = DECOY_DEFINITION,
    effect = skill.effects[0];
  return (
    skill.id === DECOY_IDS[1] &&
    skill.archetype === 'amazon' &&
    skill.trigger === 'active' &&
    skill.target === 'self' &&
    skill.isBuff !== true &&
    skill.summonOnStart !== true &&
    skill.minLevel === d.requiredLevel &&
    skill.manaCost === d.manaCost &&
    skill.cooldown === d.cooldown &&
    skill.manaCostPerRank === d.manaCostPerRank &&
    skill.cooldownPerRank === d.cooldownPerRank &&
    skill.requires === undefined &&
    skill.aoeShape === undefined &&
    skill.maxTargets === undefined &&
    skill.effects.length === 1 &&
    effect?.kind === 'decoy' &&
    Object.keys(effect).length === 1
  );
}

/** Fresh native learned class/level/transitive-prerequisite authority; selection is checked at startup. */
export function composeDecoyRank(player: Pick<Player, 'class' | 'level' | 'skillLevels'>): number {
  const projected = projectPlayerClassActives({
    classId: player.class,
    level: player.level,
    skillOrder: [DECOY_IDS[0]],
    ...(player.skillLevels ? { skillLevels: player.skillLevels } : {})
  });
  return projected.skillOrder.length === 1 ? (projected.skillLevels?.[DECOY_IDS[1]] ?? 0) : 0;
}

/** No legacy fallback, borrowed owner or malformed native rank grants paid Decoy authority. */
export function decoyRank(owner: CombatUnit): number {
  const rank = owner.decoyRank ?? 0;
  const allocated = Math.max(
    0,
    ...DECOY_IDS.map((id) => {
      const n = owner.skillLevels?.[id];
      return typeof n === 'number' && Number.isInteger(n) && n > 0 && n <= DECOY_DEFINITION.maxRank
        ? n
        : 0;
    })
  );
  return owner.side === 'player' &&
    inferKind(owner) === 'hero' &&
    owner.summon !== true &&
    owner.ownerId === undefined &&
    owner.summonOwnerId === undefined &&
    owner.id.length > 0 &&
    Number.isFinite(owner.life) &&
    owner.life > 0 &&
    Number.isInteger(owner.level) &&
    owner.level >= DECOY_DEFINITION.requiredLevel &&
    Number.isInteger(rank) &&
    rank > 0 &&
    rank === allocated
    ? rank
    : 0;
}

/** Provisional mutable body; registration alone assigns battle-local identity and finite authority. */
export function buildDecoy(owner: CombatUnit, rank: number, rankBonus?: 1): CombatUnit {
  const stats = decoyBodyStats(rank, rankBonus);
  return {
    id: owner.id + '-decoy-candidate',
    name: 'decoy',
    side: owner.side,
    level: owner.level,
    tier: 'trash',
    stats,
    life: stats.lifeMax,
    mana: stats.manaMax,
    statuses: [],
    cooldowns: {},
    skillOrder: [],
    activeBuffIds: [],
    enraged: false,
    kind: 'summon',
    summon: true,
    summonTemplateId: 'decoy',
    summonOwnerId: owner.id,
    summonRefundOnDeath: false
  };
}
