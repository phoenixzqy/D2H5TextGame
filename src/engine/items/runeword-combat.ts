import type { DamageType } from '../types/attributes';
import type { RunewordGrant } from '../types/items';

/** Personal, transient bearer modifiers; the pre-item recovery baseline stays separate. */
export interface RunewordCombatModifiers {
  readonly manaRegenBaselinePerSecond: number;
  readonly manaRegenPerSecond: number;
  readonly increasedDamagePct: Readonly<Partial<Record<DamageType, number>>>;
  readonly physicalReflectionPct: number;
}

/** Compose already resolved highest-rank grants with ordinary recovery/damage exactly once. */
export function composeRunewordCombatModifiers(
  grants: readonly RunewordGrant[],
  ordinary: {
    readonly manaRegenPerSecond?: number;
    readonly increasedDamagePct?: Readonly<Partial<Record<DamageType, number>>>;
  } = {}
): RunewordCombatModifiers {
  const damage = { ...ordinary.increasedDamagePct };
  let recoveryPct = 0, reflectionPct = 0;
  for (const grant of grants) {
    if ('increasedDamagePct' in grant) {
      for (const type of Object.keys(grant.increasedDamagePct) as DamageType[]) {
        damage[type] = (damage[type] ?? 0) + (grant.increasedDamagePct[type] ?? 0);
      }
    } else if (grant.id === 'aura-redemption') recoveryPct += grant.manaRegenPct;
    else if (grant.id === 'aura-thorns-aura') reflectionPct = grant.reflectionPct;
  }
  const baseline = ordinary.manaRegenPerSecond ?? 0;
  return Object.freeze({ manaRegenBaselinePerSecond: baseline,
    manaRegenPerSecond: baseline * (1 + recoveryPct),
    increasedDamagePct: Object.freeze(damage), physicalReflectionPct: reflectionPct });
}
