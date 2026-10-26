import rows from '../../data/skills/necromancer.json';
import type { SkillDef } from '../types/skills';
import { createSkillValidator } from '../skills/skill-validator';
import type { ActiveStatus, CombatUnit } from './types';

const fields = { 'iron-maiden': 'reflectedPhysicalDamagePct', 'life-tap': 'lifeTapHealingPct',
  'lower-resist': 'allResistReductionPct' } as const;
/** The three finite curses consumed by direct damage settlement. */
export type DamageCurseId = keyof typeof fields;
const validate = createSkillValidator<SkillDef>();

/** Match only a supported exact status identity. */
export function isDamageCurseId(id: string): id is DamageCurseId {
  return Object.prototype.hasOwnProperty.call(fields, id);
}
/** Grant a capability only from one complete strictly validated authored skill. */
export function damageCurseId(source: unknown): DamageCurseId | undefined {
  return resolveDamageCurseDefinition(source)?.id;
}
/** Copy a complete authored curse for runtime authoring or pure input-specific previews. */
export function resolveDamageCurseDefinition(source: unknown) {
  if (!validate(source)) return undefined;
  const id = source.id.slice('skills-necromancer-'.length);
  if (source.id !== 'skills-necromancer-' + id || !isDamageCurseId(id)) return undefined;
  const durationMs = source.statusEffect?.durationMs, percent = source.statusEffect?.[fields[id]];
  return durationMs === undefined || percent === undefined ? undefined : Object.freeze({ id, durationMs, percent });
}
/** Copy/freeze the three JSON-owned definitions without a mutable registry dependency. */
export function resolveDamageCurseDefinitions(skills: readonly unknown[]) {
  return Object.freeze(Object.fromEntries((Object.keys(fields) as DamageCurseId[]).map(id => {
    const matches = skills.filter(row => typeof row === 'object' && row !== null &&
      'id' in row && row.id === 'skills-necromancer-' + id);
    const definition = resolveDamageCurseDefinition(matches[0]);
    if (matches.length !== 1 || definition?.id !== id) throw new Error('Invalid authored damage curse: ' + id);
    const { durationMs, percent } = definition;
    return [id, Object.freeze({ durationMs, percent })];
  })) as Record<DamageCurseId, { readonly durationMs: number; readonly percent: number }>);
}
/** Immutable scalar tuning shared by the paid application and damage consumer. */
export const DAMAGE_CURSE_DEFINITIONS = resolveDamageCurseDefinitions(rows);

/** Capture immutable potency at an actual eligible payment. */
export function paidDamageCurse(id: DamageCurseId): NonNullable<ActiveStatus['damageCurse']> {
  return Object.freeze({ id, percent: DAMAGE_CURSE_DEFINITIONS[id].percent });
}
/** Read only a complete matching finite paid interval; bare/forged markers grant nothing. */
export function activeDamageCurse(unit: CombatUnit, clock: number, id: DamageCurseId): number {
  if (!Number.isFinite(clock)) return 0;
  const definition = DAMAGE_CURSE_DEFINITIONS[id];
  for (const status of unit.statuses) {
    const start = status.appliedAtMs, end = status.expiresAtMs, payload = status.damageCurse;
    if (status.id !== id || status.stacks !== 1 || payload?.id !== id || payload.percent !== definition.percent ||
      start === undefined || end === undefined || !Number.isFinite(start) || !Number.isFinite(end) ||
      end <= start || clock < start || clock >= end) continue;
    const tolerance = Math.min(.000001, 8 * Number.EPSILON * Math.max(Math.abs(start), Math.abs(end), definition.durationMs));
    if (end - start <= definition.durationMs + tolerance) return payload.percent;
  }
  return 0;
}
