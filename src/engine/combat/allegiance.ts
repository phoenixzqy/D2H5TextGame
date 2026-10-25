import type { CombatSide, CombatUnit } from './types';
import { inferKind } from './types';
import { conversionRank, isConversionTarget } from '../skills/conversion';

/** Authenticated only by an actual paid hit in the current battle; never a snapshot field. */
export interface ConversionBinding { readonly sourceId: string; readonly expiresAtMs: number }
export interface AllegianceContext {
  readonly units: ReadonlyMap<string, CombatUnit>;
  readonly conversions: ReadonlyMap<string, ConversionBinding>;
  readonly simClockMs: number;
}

/** Live paid authority; fabricated status records have no binding and grant no power. */
export function activeConversion(context: AllegianceContext, unit: CombatUnit): ConversionBinding | undefined {
  const binding = context.conversions.get(unit.id);
  if (!binding || !isConversionTarget(unit) || context.simClockMs >= binding.expiresAtMs) return undefined;
  const source = context.units.get(binding.sourceId);
  return source && conversionRank(source) > 0 && unit.statuses.some(s => s.id === 'converted' &&
    s.sourceId === binding.sourceId && s.expiresAtMs === binding.expiresAtMs &&
    (s.appliedAtMs ?? 0) <= context.simClockMs) ? binding : undefined;
}

/** Targeting allegiance is separate from immutable reward/victory identity. */
export function effectiveSide(context: AllegianceContext, unit: CombatUnit): CombatSide {
  if (context.conversions.size === 0) return unit.side;
  const visited = new Set<string>();
  let current = unit;
  while (!visited.has(current.id)) {
    visited.add(current.id);
    if (activeConversion(context, current)) return 'player';
    if (current.side !== 'enemy' || current.life <= 0 || inferKind(current) !== 'summon') break;
    const ownerId = current.summonOwnerId ?? current.ownerId;
    const owner = ownerId === undefined ? undefined : context.units.get(ownerId);
    if (!owner || owner.side !== current.side || owner.life <= 0) break;
    current = owner;
  }
  return unit.side;
}

/** Living hostile candidates in original registration order. */
export function opponentsOf(context: AllegianceContext, actor: CombatUnit): CombatUnit[] {
  const side = effectiveSide(context, actor);
  return [...context.units.values()].filter(unit => unit.life > 0 && effectiveSide(context, unit) !== side);
}
