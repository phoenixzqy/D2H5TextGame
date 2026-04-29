/**
 * Mercenary → CombatUnit factory.
 *
 * Bridges the persistent `Mercenary` entity (gacha roster shape) into the
 * runtime `CombatUnit` shape. The fielded merc travels with the hero on
 * `playerTeam` so the AI scheduler cycles its action periods alongside the
 * player's.
 *
 * Skill loadout: merc skills declared in `data/skills/mercenary.json` are
 * not registered in the engine's runtime skill registry (only the 70
 * default class skills are). v1 wiring maps `archetype` to a registered
 * skill so the merc actually contributes damage. Full data-driven merc
 * skill registration is a separate task for content-designer.
 */
import type { Mercenary } from '@/engine/types/entities';
import type { CombatUnit } from '@/engine/combat/types';

const ARCHETYPE_SKILLS: Readonly<Record<string, readonly string[]>> = Object.freeze({
  front: ['barbarian.bash'],
  back: ['amazon.magic_arrow']
});
const DEFAULT_SKILL_ORDER: readonly string[] = ['barbarian.bash'];

/** Build a runtime CombatUnit from an owned Mercenary. */
export function mercToCombatUnit(merc: Mercenary): CombatUnit {
  const skillOrder = ARCHETYPE_SKILLS[merc.archetype] ?? DEFAULT_SKILL_ORDER;
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
    skillOrder: [...skillOrder],
    activeBuffIds: [],
    enraged: false,
    summonedAdds: false,
    kind: 'merc'
  };
}
