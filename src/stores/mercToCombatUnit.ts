/**
 * Mercenary → CombatUnit factory.
 *
 * Bridges the persistent `Mercenary` entity (gacha roster shape) into the
 * runtime `CombatUnit` shape. The fielded merc travels with the hero on
 * `playerTeam` so the AI scheduler cycles its action periods alongside the
 * player's.
 *
 * Skill loadout priority (deduped, first-seen wins):
 *   1. `merc.signatureSkillId`  — the headline ability advertised on the
 *      gacha card. Without this the merc would basic-attack forever.
 *   2. `merc.comboOrder`        — authored data-driven priority list.
 *   3. archetype default        — last-resort placeholder when (1) and
 *      (2) are both empty (e.g. legacy roster entries).
 *
 * Engine alias resolution (`engine/skills/aliases.ts`) handles the
 * data-side id → canonical engine-id translation for `mskill-*` /
 * `aura-*` ids.
 */
import type { Mercenary } from '@/engine/types/entities';
import type { CombatUnit, GridPosition } from '@/engine/combat/types';

const ARCHETYPE_SKILLS: Readonly<Record<string, readonly string[]>> = Object.freeze({
  front: ['mskill-bash'],
  back: ['mskill-basic-arrow']
});
const DEFAULT_SKILL_ORDER: readonly string[] = ['mskill-jab'];

/** Build a runtime CombatUnit from an owned Mercenary. */
export function mercToCombatUnit(merc: Mercenary, gridPosition?: GridPosition): CombatUnit {
  const order: string[] = [];
  const seen = new Set<string>();
  const push = (id: string | undefined): void => {
    if (!id) return;
    if (seen.has(id)) return;
    seen.add(id);
    order.push(id);
  };
  push(merc.signatureSkillId);
  for (const id of merc.comboOrder) push(id);
  if (order.length === 0) {
    const fallback = ARCHETYPE_SKILLS[merc.archetype] ?? DEFAULT_SKILL_ORDER;
    for (const id of fallback) push(id);
  }

  return {
    id: `merc-${merc.id}`,
    name: merc.name,
    side: 'player',
    level: merc.level,
    tier: 'trash',
    stats: merc.derivedStats,
    life: merc.derivedStats.lifeMax,
    mana: merc.derivedStats.manaMax,
    statuses: [],
    cooldowns: {},
    skillOrder: order,
    activeBuffIds: [],
    enraged: false,
    summonedAdds: false,
    kind: 'merc',
    ...(gridPosition ? { gridPosition } : {})
  };
}
