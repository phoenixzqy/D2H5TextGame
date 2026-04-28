/**
 * Monster AI policy and elite affixes.
 *
 * Source: docs/design/combat-formulas.md §5.2 (priority); monster-spec.md §9 (affixes), §10 (boss enrage).
 *
 * @module engine/ai/policy
 */

import type { CombatUnit } from '../combat/types';
import { hasStatus } from '../combat/status';
import { getSkill } from '../skills/registry';

/**
 * Decide which skill a unit should use this turn.
 *
 * Priority (per combat-formulas §5.2 — applies to player AND monster):
 *  1. Walk skillOrder front to back.
 *  2. Skip if on cooldown.
 *  3. Skip if mana insufficient.
 *  4. Skip if buff-type and buff already active on caster.
 *  5. Skip if no valid target (caller handles).
 *  6. First valid skill is chosen.
 *  7. If no skill is valid → undefined (caller falls back to basic attack).
 *
 * @returns selected skill id, or `undefined` to use the basic attack.
 */
export function chooseSkill(
  unit: CombatUnit,
  hasEnemyTarget: boolean
): string | undefined {
  for (const skillId of unit.skillOrder) {
    const skill = getSkill(skillId);
    if (!skill) continue;
    if ((unit.cooldowns[skillId] ?? 0) > 0) continue;
    if (skill.manaCost > unit.mana) continue;
    if (unit.level < skill.minLevel) continue;

    if (skill.isBuff) {
      if (unit.activeBuffIds.includes(skill.id)) continue;
    }

    // Skills that target enemies need at least one alive enemy.
    if (
      (skill.target === 'single-enemy' ||
        skill.target === 'all-enemies' ||
        skill.target === 'area-enemies') &&
      !hasEnemyTarget
    ) {
      continue;
    }

    return skill.id;
  }
  return undefined;
}

/** A single elite-affix descriptor. */
export interface EliteAffix {
  readonly id: string;
  readonly name: string;
  /** Applied multiplicatively to attack speed. */
  readonly attackSpeedMult?: number;
  /** Applied multiplicatively to damage. */
  readonly damageMult?: number;
  /** Defense flat multiplier. */
  readonly defenseMult?: number;
  /** "Cursed": player regen reduction (engine consumer enforces). */
  readonly playerRegenPenalty?: number;
  /** Resist bonuses applied to the elite's resistances. */
  readonly resistBonus?: { readonly fire?: number; readonly cold?: number; readonly lightning?: number };
  /** "Spectral Hit" ignores all dodge against this attacker. */
  readonly ignoreDodge?: boolean;
  /** Special on-death/on-tick mechanic id (handled by combat). */
  readonly mechanic?: 'fire-explode-on-death' | 'frost-aura' | 'lightning-on-hit' | 'mana-drain' | 'teleport';
}

/** The 10 v1 elite affixes (monster-spec.md §9). */
export const ELITE_AFFIXES: Readonly<Record<string, EliteAffix>> = Object.freeze({
  extra_fast: { id: 'extra_fast', name: 'Extra Fast', attackSpeedMult: 1.5 },
  extra_strong: { id: 'extra_strong', name: 'Extra Strong', damageMult: 1.5 },
  cursed: { id: 'cursed', name: 'Cursed', playerRegenPenalty: 0.5 },
  fire_enchanted: { id: 'fire_enchanted', name: 'Fire Enchanted', resistBonus: { fire: 50 }, mechanic: 'fire-explode-on-death' },
  cold_enchanted: { id: 'cold_enchanted', name: 'Cold Enchanted', resistBonus: { cold: 50 }, mechanic: 'frost-aura' },
  lightning_enchanted: { id: 'lightning_enchanted', name: 'Lightning Enchanted', resistBonus: { lightning: 50 }, mechanic: 'lightning-on-hit' },
  mana_burn: { id: 'mana_burn', name: 'Mana Burn', mechanic: 'mana-drain' },
  spectral_hit: { id: 'spectral_hit', name: 'Spectral Hit', ignoreDodge: true },
  stone_skin: { id: 'stone_skin', name: 'Stone Skin', defenseMult: 2 },
  teleportation: { id: 'teleportation', name: 'Teleportation', mechanic: 'teleport' }
});

/** All affix ids. */
export const ELITE_AFFIX_IDS: readonly string[] = Object.keys(ELITE_AFFIXES);

/**
 * Boss enrage HP threshold. Source: monster-spec.md §12 row 3.
 *  - Acts I–III: 10%
 *  - Act IV: 15%
 *  - Act V: 20%
 */
export function bossEnrageThreshold(act: 1 | 2 | 3 | 4 | 5): number {
  if (act === 5) return 0.2;
  if (act === 4) return 0.15;
  return 0.1;
}

/**
 * Check whether a boss should enrage this turn given current HP fraction and act.
 * Once enraged, the boss stays enraged.
 */
export function shouldEnrage(
  unit: CombatUnit,
  act: 1 | 2 | 3 | 4 | 5
): boolean {
  if (unit.tier !== 'boss') return false;
  if (unit.enraged) return true;
  if (unit.life <= 0) return false;
  return unit.life / unit.stats.lifeMax <= bossEnrageThreshold(act);
}

/** Re-export for external consumers checking control immunity. */
export function isImmobilized(unit: CombatUnit): boolean {
  return (
    hasStatus(unit, 'freeze') ||
    hasStatus(unit, 'stun') ||
    hasStatus(unit, 'paralyze')
  );
}
