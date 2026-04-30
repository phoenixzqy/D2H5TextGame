/**
 * Skill eligibility helpers — pure, equipment-only gates.
 *
 * v1 only checks weapon type and handedness. Other gates (level, mana,
 * cooldown, target-availability) are owned by
 * {@link import('../ai/policy').chooseSkill} and the combat engine.
 *
 * @module engine/skills/eligibility
 */

import type { WeaponType, Handedness } from '../types/items';
import type { SkillRequirement } from '../types/skills';

/** Minimal slice of a weapon needed by {@link canCastSkill}. */
export interface EquippedWeaponInfo {
  readonly weaponType?: WeaponType;
  readonly handedness?: Handedness;
}

/** Minimal skill shape: anything carrying an optional `requires`. */
export interface SkillEligibilityInput {
  readonly requires?: SkillRequirement;
}

/** Why a skill cannot be cast. */
export type EligibilityReason = 'weapon-type' | 'handedness' | 'no-weapon';

/** Result of {@link canCastSkill}. */
export type EligibilityResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly reason: EligibilityReason };

const OK: EligibilityResult = Object.freeze({ ok: true });

/**
 * Check whether a skill's *equipment* gate is satisfied.
 *
 * Behaviour:
 *  - If `skill.requires` is absent or empty ⇒ `{ ok: true }`.
 *  - If a `weaponType` whitelist is set:
 *    - `equipped == null` (or both fields undefined) ⇒ `'no-weapon'`.
 *    - Equipped weapon's `weaponType` not in the whitelist ⇒ `'weapon-type'`.
 *  - If a `handedness` whitelist is set:
 *    - `equipped == null` (or `handedness` undefined) ⇒ `'no-weapon'`.
 *    - Equipped weapon's `handedness` not in the whitelist ⇒ `'handedness'`.
 *  - Reasons are reported in priority order: `no-weapon` > `weapon-type` >
 *    `handedness`. The first failure short-circuits.
 *
 * Pure: no I/O, no globals, deterministic.
 */
export function canCastSkill(
  skill: SkillEligibilityInput,
  equipped: EquippedWeaponInfo | null | undefined
): EligibilityResult {
  const req = skill.requires;
  if (!req) return OK;

  const wantTypes = req.weaponType;
  const wantHands = req.handedness;
  const hasTypeReq = wantTypes !== undefined && wantTypes.length > 0;
  const hasHandReq = wantHands !== undefined && wantHands.length > 0;
  if (!hasTypeReq && !hasHandReq) return OK;

  // Treat "no weapon" as null/undefined or both fields missing.
  const hasWeapon =
    !!equipped &&
    (equipped.weaponType !== undefined || equipped.handedness !== undefined);

  if (hasTypeReq) {
    if (!equipped?.weaponType) {
      return hasWeapon
        ? { ok: false, reason: 'weapon-type' }
        : { ok: false, reason: 'no-weapon' };
    }
    if (!wantTypes.includes(equipped.weaponType)) {
      return { ok: false, reason: 'weapon-type' };
    }
  }

  if (hasHandReq) {
    if (!equipped?.handedness) {
      return hasWeapon
        ? { ok: false, reason: 'handedness' }
        : { ok: false, reason: 'no-weapon' };
    }
    if (!wantHands.includes(equipped.handedness)) {
      return { ok: false, reason: 'handedness' };
    }
  }

  return OK;
}
