import rows from '../../data/skills/barbarian.json';
import type { SkillDef } from '../types/skills';
import type { ActiveStatus, CombatUnit } from './types';
import { createSkillValidator } from '../skills/skill-validator';

const validate = createSkillValidator<SkillDef>();
/** Copy complete finite authored warcry tuning without depending on the registry. */
export function resolveWarcryDefinitions(skills: readonly unknown[]) {
  const get = (slug: string) => {
    const found = skills.filter(row => typeof row === 'object' && row !== null &&
      'id' in row && row.id === 'skills-barbarian-' + slug);
    const row = found[0];
    if (found.length !== 1 || !validate(row) || !row.statusEffect?.durationMs)
      throw new Error('Invalid authored warcry: ' + slug);
    return row;
  };
  const howl = get('howl'), taunt = get('taunt'), cry = get('battle-cry');
  const h = howl.statusEffect, t = taunt.statusEffect, c = cry.statusEffect;
  if (!h?.durationMs || !h.bossDurationMultiplier || !t?.durationMs || !c?.durationMs ||
    c.damageReductionPct === undefined || c.damageReductionPerRank === undefined ||
    c.defenseReductionPct === undefined || c.defenseReductionPerRank === undefined ||
    c.damageReductionPct + (cry.maxLevel - 1) * c.damageReductionPerRank >= 100 ||
    c.defenseReductionPct + (cry.maxLevel - 1) * c.defenseReductionPerRank > 100)
    throw new Error('Incomplete or excessive authored warcry potency');
  return Object.freeze({ howl: Object.freeze({ durationMs: h.durationMs, bossDurationMultiplier: h.bossDurationMultiplier }),
    taunt: Object.freeze({ durationMs: t.durationMs }),
    battleCry: Object.freeze({ durationMs: c.durationMs, maxRank: cry.maxLevel,
      damageReductionPct: c.damageReductionPct, damageReductionPerRank: c.damageReductionPerRank,
      defenseReductionPct: c.defenseReductionPct, defenseReductionPerRank: c.defenseReductionPerRank }) });
}
export const WARCRY_DEFINITIONS = resolveWarcryDefinitions(rows);

/** Immutable paid potency; rank is the native effective allocation at payment. */
export function paidBattleCry(rank: number): NonNullable<ActiveStatus['battleCry']> {
  const d = WARCRY_DEFINITIONS.battleCry;
  if (!Number.isInteger(rank) || rank < 1 || rank > d.maxRank) throw new Error('Invalid Battle Cry rank');
  return Object.freeze({ rank, damageReductionPct: d.damageReductionPct + (rank - 1) * d.damageReductionPerRank,
    defenseReductionPct: d.defenseReductionPct + (rank - 1) * d.defenseReductionPerRank });
}
/** Only finite exact paid snapshots reduce damage/Defense; bare markers grant nothing. */
export function activeBattleCry(unit: CombatUnit, clock: number): ActiveStatus['battleCry'] {
  if (!Number.isFinite(clock)) return undefined;
  for (const status of unit.statuses) {
    const p = status.battleCry, start = status.appliedAtMs, end = status.expiresAtMs;
    if (status.id !== 'battle-cry' || !p || !Number.isInteger(p.rank) || p.rank < 1 ||
      p.rank > WARCRY_DEFINITIONS.battleCry.maxRank || start === undefined || end === undefined ||
      !Number.isFinite(start) || !Number.isFinite(end) || clock < start || clock >= end ||
      Math.abs(end - start - WARCRY_DEFINITIONS.battleCry.durationMs) >
        Math.min(.000001, 8 * Number.EPSILON * Math.max(Math.abs(start), Math.abs(end), WARCRY_DEFINITIONS.battleCry.durationMs))) continue;
    const expected = paidBattleCry(p.rank);
    if (p.damageReductionPct === expected.damageReductionPct && p.defenseReductionPct === expected.defenseReductionPct)
      return expected;
  }
  return undefined;
}
