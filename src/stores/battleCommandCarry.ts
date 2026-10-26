import type { BattleCommandCarry } from '@/engine/combat/combat';
import type { CombatUnit } from '@/engine/combat/types';

const results = new WeakMap<readonly CombatUnit[], { readonly carry: BattleCommandCarry; readonly elapsedMs: number }>();
const nativeCarry = new WeakMap<readonly CombatUnit[], BattleCommandCarry>();

/** Bind paid proof to the actual engine result before callbacks/publication can observe it. */
export function rememberBattleCommandResult(team: readonly CombatUnit[], elapsedMs: number,
  carry: BattleCommandCarry | undefined): void {
  if (carry) results.set(team, Object.freeze({ carry, elapsedMs }));
}

/** Transfer proof only across the native result's exact one-time rebasing boundary. */
export function transferBattleCommandCarry(source: readonly CombatUnit[], elapsedMs: number,
  rebased: readonly CombatUnit[]): void {
  const result = results.get(source);
  if (result && Object.is(result.elapsedMs, elapsedMs)) nativeCarry.set(rebased, result.carry);
}

/** Replay/retry uses the exact original native carry array; copies and fresh runs have no proof. */
export function nativeBattleCommandCarry(team: readonly CombatUnit[]): BattleCommandCarry | undefined {
  return nativeCarry.get(team);
}
