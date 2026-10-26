import authored from '../../data/skills/sorceress.json';
import type { SkillDef } from '../types/skills';
import type { Player } from '../types/entities';
import type { CombatUnit } from '../combat/types';
import { inferKind } from '../combat/types';
import { MITIGATION_DEFINITION } from '../combat/mitigation-definition';
import type { DamageEffect, RegisteredSkill } from './effects';
import { createSkillValidator } from './skill-validator';
import { projectPlayerClassActives } from './player-class-actives';

export const HYDRA_IDS = ['skills-sorceress-hydra', 'sorceress.hydra'] as const;
const validate = createSkillValidator<SkillDef & { readonly requiredLevel: number }>();

/** Validate/copy the unique authored Hydra without freezing caller-owned JSON. */
export function resolveHydraDefinition(rows: readonly unknown[]) {
  const matches = rows.filter(row => typeof row === 'object' && row !== null &&
    'id' in row && row.id === HYDRA_IDS[0]), row = matches[0];
  if (matches.length !== 1 || !validate(row) || !row.hydra || !row.damage ||
    row.cost.mana === undefined || row.damage.min <= 0 || row.damage.max < row.damage.min)
    throw new Error('Invalid authored Hydra');
  const bolt: DamageEffect = Object.freeze({ kind: 'damage', damageType: 'fire',
    base: Object.freeze([row.damage.min, row.damage.max] as const),
    perRank: Object.freeze([row.scaling?.damagePerLevel ?? 0, row.scaling?.damagePerLevel ?? 0] as const),
    tags: Object.freeze([...(row.appliesTags ?? [])]),
    applyStatus: Object.freeze({ id: 'burn', dotPctOfDamage: row.statusEffect?.dotPctOfDamage ?? 0 }) });
  return Object.freeze({ ...row.hydra, requiredLevel: row.requiredLevel, maxRank: row.maxLevel,
    manaCost: row.cost.mana, cooldown: row.cooldown, bolt,
    bodyStats: Object.freeze({ ...row.hydra.bodyStats,
      resistances: Object.freeze({ ...row.hydra.bodyStats.resistances }) }) });
}
export const HYDRA_DEFINITION = resolveHydraDefinition(authored);

/** Catch both exact aliases and contradictory effects before generic casting can pay. */
export function isHydraSkill(skill: RegisteredSkill, slot = skill.id): boolean {
  return HYDRA_IDS.some(id => id === skill.id || id === slot) || skill.effects.some(effect => effect.kind === 'hydra');
}

/** Only the exact authored paid startup effect may create an empowered body. */
export function matchesHydra(skill: RegisteredSkill): boolean {
  const d = HYDRA_DEFINITION, effect = skill.effects[0];
  return skill.id === HYDRA_IDS[1] && skill.archetype === 'sorceress' &&
    skill.trigger === 'active' && skill.target === 'summon' && skill.summonOnStart === true &&
    skill.isBuff !== true && skill.minLevel === d.requiredLevel && skill.manaCost === d.manaCost &&
    skill.cooldown === d.cooldown && (skill.manaCostPerRank ?? 0) === 0 &&
    (skill.cooldownPerRank ?? 0) === 0 && skill.requires === undefined &&
    skill.aoeShape === undefined && skill.maxTargets === undefined && skill.effects.length === 1 &&
    effect?.kind === 'hydra' && Object.keys(effect).length === 1;
}

/** Fresh learned class/unlock/transitive-prerequisite authority; selection is checked at preparation. */
export function composeHydraRank(player: Pick<Player, 'class' | 'level' | 'skillLevels'>): number {
  const projected = projectPlayerClassActives({ classId: player.class, level: player.level,
    skillOrder: [HYDRA_IDS[0]], ...(player.skillLevels ? { skillLevels: player.skillLevels } : {}) });
  return projected.skillOrder.length === 1 ? projected.skillLevels?.[HYDRA_IDS[1]] ?? 0 : 0;
}

/** No fallback rank, borrowed owner, bare template or malformed projection grants Hydra power. */
export function hydraRank(owner: CombatUnit): number {
  const rank = owner.hydraRank ?? 0, bonus = owner.increasedDamagePct?.fire ?? 0;
  const allocated = Math.max(0, ...HYDRA_IDS.map(id => {
    const n = owner.skillLevels?.[id];
    return typeof n === 'number' && Number.isInteger(n) && n > 0 && n <= HYDRA_DEFINITION.maxRank ? n : 0;
  }));
  return owner.side === 'player' && inferKind(owner) === 'hero' && owner.summon !== true &&
    owner.ownerId === undefined && owner.summonOwnerId === undefined && owner.id.length > 0 &&
    Number.isFinite(owner.life) && owner.life > 0 && Number.isInteger(owner.level) &&
    owner.level >= HYDRA_DEFINITION.requiredLevel && Number.isInteger(rank) && rank > 0 &&
    rank === allocated && Number.isFinite(bonus) && bonus >= 0 ? rank : 0;
}

/** Fresh JSON-owned body stats; global friendly summon mitigation remains shared. */
export function hydraBodyStats() {
  const stats = HYDRA_DEFINITION.bodyStats;
  return { ...stats, life: stats.lifeMax, mana: stats.manaMax,
    magicResist: Math.max(0, Math.floor(MITIGATION_DEFINITION.friendlyBase.summon)),
    resistances: { ...stats.resistances } };
}

/** Build a provisional candidate; only battle registration assigns identity and combat authority. */
export function buildHydra(owner: CombatUnit): CombatUnit {
  const stats = hydraBodyStats();
  return { id: owner.id + '-hydra-candidate', name: 'hydra', side: owner.side, level: owner.level,
    tier: 'trash', stats, life: stats.lifeMax, mana: stats.manaMax, statuses: [], cooldowns: {},
    skillOrder: [], activeBuffIds: [], enraged: false, kind: 'summon', summon: true, summonTemplateId: 'hydra',
    summonOwnerId: owner.id, summonRefundOnDeath: false,
    increasedDamagePct: { fire: owner.increasedDamagePct?.fire ?? 0 } };
}
