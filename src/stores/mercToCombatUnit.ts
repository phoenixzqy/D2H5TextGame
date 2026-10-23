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
import type { Item } from '@/engine/types/items';
import { deriveEquippedMercStats } from '@/engine/progression/merc-equipment-stats';
import { resolveEquippedRunewordGrants } from '@/engine/items/runeword-grants';
import { composeRunewordCombatModifiers } from '@/engine/items/runeword-combat';
import { resolveEquippedWeapon } from '@/engine/items/equipped-weapon';
import { projectGovernedActives, type GovernedActiveProjection, type GovernedActiveRanks } from '@/engine/skills/runeword-actives';

const ARCHETYPE_SKILLS: Readonly<Record<string, readonly string[]>> = Object.freeze({
  front: ['mskill-bash'],
  back: ['mskill-basic-arrow']
});
const DEFAULT_SKILL_ORDER: readonly string[] = ['mskill-jab'];

/** Current effective priority, preserving signature, owned skills and legacy fallback. */
export function getMercSkillOrder(merc: Mercenary): string[] {
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
  return order;
}

/** Native owned priorities plus current equipment grants; stored dormant entries remain configured. */
export function getMercActiveProjection(merc: Mercenary,
  equipment: Readonly<Record<string, Item | null>> = {}): GovernedActiveProjection {
  return projectGovernedActives({ owner: { kind: 'merc', level: merc.level },
    storedOrder: getMercSkillOrder(merc), grants: resolveEquippedRunewordGrants(equipment) });
}

/** Authoritative reorder set; availability is projected independently for combat. */
export function getMercConfiguredSkillOrder(merc: Mercenary,
  equipment: Readonly<Record<string, Item | null>> = {}): readonly string[] {
  return getMercActiveProjection(merc, equipment).configuredOrder;
}

/** Build a fresh runtime unit using the owned merc's canonical equipment map. */
export function mercToCombatUnit(
  merc: Mercenary,
  gridPosition?: GridPosition,
  equipment: Readonly<Record<string, Item | null>> = {}
): CombatUnit & { readonly governedActiveRanks: GovernedActiveRanks } {
  const stats = deriveEquippedMercStats(merc, equipment);
  const actives = getMercActiveProjection(merc, equipment);

  return {
    id: `merc-${merc.id}`,
    name: merc.name,
    side: 'player',
    level: merc.level,
    tier: 'trash',
    stats,
    life: stats.lifeMax,
    mana: stats.manaMax,
    ...composeRunewordCombatModifiers(resolveEquippedRunewordGrants(equipment)),
    statuses: [],
    cooldowns: {},
    skillOrder: actives.combatOrder,
    governedActiveRanks: actives.ranks,
    equippedWeapon: resolveEquippedWeapon(equipment),
    activeBuffIds: [],
    enraged: false,
    summonedAdds: false,
    kind: 'merc',
    ...(gridPosition ? { gridPosition } : {})
  };
}
