import rows from '../../data/skills/sorceress.json';
import type { SkillDef } from '../types/skills';
import type { ActiveStatus, CombatUnit } from '../combat/types';
import { inferKind } from '../combat/types';
import type { DamageEffect, RegisteredSkill } from './effects';
import { createSkillValidator } from './skill-validator';
import { statusActiveAt } from '../combat/status';

export const PERIODIC_SPELL_IDS = ['blaze', 'fire-wall', 'thunder-storm', 'inferno'] as const;
export type PeriodicSpellId = typeof PERIODIC_SPELL_IDS[number];
const validate = createSkillValidator<SkillDef & { readonly requiredLevel: number }>();
export const periodicSpellDataId = (id: PeriodicSpellId) => 'skills-sorceress-' + id;
export const periodicSpellCanonicalId = (id: PeriodicSpellId) => 'sorceress.' + id.replaceAll('-', '_');

/** Only exact authored identities can establish a paid recurring spell. */
export function periodicSpellId(id: string): PeriodicSpellId | undefined {
  return PERIODIC_SPELL_IDS.find(spell => id === periodicSpellDataId(spell) || id === periodicSpellCanonicalId(spell));
}

/** Capture immutable validated pulse and payment metadata without importing the catalog/projector. */
export function resolvePeriodicSpellDefinition(source: readonly unknown[], id: PeriodicSpellId) {
  const matches = source.filter(row => typeof row === 'object' && row !== null &&
    'id' in row && row.id === periodicSpellDataId(id));
  const row = matches[0];
  if (matches.length !== 1 || !validate(row) || !row.periodicSpell || !row.damage ||
    !row.damageType || row.cost.mana === undefined || row.damage.max < row.damage.min ||
    row.periodicSpell.durationMs <= row.periodicSpell.intervalMs)
    throw new Error('Invalid authored periodic spell');
  const status = row.appliesStatus?.[0];
  const pulse: DamageEffect = Object.freeze({ kind: 'damage', damageType: row.damageType,
    base: Object.freeze([row.damage.min, row.damage.max] as const),
    perRank: Object.freeze([row.scaling?.damagePerLevel ?? 0, row.scaling?.damagePerLevel ?? 0] as const),
    ...(row.appliesTags ? { tags: Object.freeze([...row.appliesTags]) } : {}),
    ...(status ? { applyStatus: Object.freeze({ id: status, ...row.statusEffect }) } : {}) });
  return Object.freeze({ ...row.periodicSpell, target: row.target, aoeShape: row.aoeShape,
    maxRank: row.maxLevel, requiredLevel: row.requiredLevel,
    manaCost: row.cost.mana, cooldown: row.cooldown, costPerRank: row.scaling?.costPerLevel ?? 0,
    cooldownPerRank: row.scaling?.cooldownPerLevel ?? 0, pulse });
}
export const PERIODIC_SPELL_DEFINITIONS = Object.freeze({
  blaze: resolvePeriodicSpellDefinition(rows, 'blaze'),
  'fire-wall': resolvePeriodicSpellDefinition(rows, 'fire-wall'),
  'thunder-storm': resolvePeriodicSpellDefinition(rows, 'thunder-storm'),
  inferno: resolvePeriodicSpellDefinition(rows, 'inferno')
});

/** Reject contradictory registry overrides before resource payment. */
export function matchesPeriodicSpell(skill: RegisteredSkill, id: PeriodicSpellId): boolean {
  const d = PERIODIC_SPELL_DEFINITIONS[id], effect = skill.effects[0];
  return skill.id === periodicSpellCanonicalId(id) && skill.archetype === 'sorceress' &&
    skill.trigger === 'active' && skill.target === d.target && skill.isBuff !== true &&
    skill.summonOnStart !== true && skill.requires === undefined && skill.aoeShape === d.aoeShape &&
    skill.maxTargets === undefined && skill.minLevel === d.requiredLevel &&
    skill.manaCost === d.manaCost && skill.cooldown === d.cooldown &&
    (skill.manaCostPerRank ?? 0) === d.costPerRank && (skill.cooldownPerRank ?? 0) === d.cooldownPerRank &&
    skill.effects.length === 1 && effect?.kind === 'periodic-spell' && effect.spell === id;
}

/** Native learned spells use a strict projection; Blaze also accepts established equipped grants. */
export function periodicSpellRank(unit: CombatUnit, id: PeriodicSpellId): number {
  const d = PERIODIC_SPELL_DEFINITIONS[id], role = inferKind(unit);
  if (unit.side !== 'player' || (role !== 'hero' && role !== 'merc') || unit.summon === true ||
    unit.ownerId !== undefined || unit.summonOwnerId !== undefined ||
    !Number.isInteger(unit.level) || unit.level < d.requiredLevel) return 0;
  if (id !== 'blaze' && role !== 'hero') return 0;
  const ranks = id === 'blaze' && unit.governedActiveRanks ? [unit.governedActiveRanks['sorceress.blaze']] :
    id !== 'blaze' && unit.periodicSpellRanks ? [unit.periodicSpellRanks[id]] :
      [unit.skillLevels?.[periodicSpellDataId(id)], unit.skillLevels?.[periodicSpellCanonicalId(id)]];
  return Math.max(0, ...ranks.map(rank => typeof rank === 'number' && Number.isInteger(rank) &&
    rank > 0 && rank <= d.maxRank ? rank : 0));
}

/** Source/rank/timestamp authentication; a status marker alone never causes damage. */
export function paidPeriodicSpell(unit: CombatUnit, id: PeriodicSpellId, at: number): ActiveStatus | undefined {
  const d = PERIODIC_SPELL_DEFINITIONS[id];
  return unit.statuses.find(status => status.id === id && status.sourceId === unit.id &&
    Number.isInteger(status.periodicSpell?.rank) && (status.periodicSpell?.rank ?? 0) > 0 &&
    (status.periodicSpell?.rank ?? 0) <= d.maxRank &&
    Number.isFinite(status.appliedAtMs) && Number.isFinite(status.expiresAtMs) &&
    (status.expiresAtMs ?? 0) - (status.appliedAtMs ?? 0) === d.durationMs && statusActiveAt(status, at));
}

/** Strip invalid carry and copy paid payloads at native/register boundaries, without changing resources. */
export function refreshPeriodicSpells(unit: CombatUnit): CombatUnit {
  return { ...unit, statuses: unit.statuses.flatMap(status => {
    const id = periodicSpellId(status.id) ?? PERIODIC_SPELL_IDS.find(spell => spell === status.id);
    if (!id) return [status];
    const paid = paidPeriodicSpell(unit, id, 0);
    return status === paid && periodicSpellRank(unit, id) > 0
      ? [{ ...status, periodicSpell: Object.freeze({ rank: paid.periodicSpell?.rank ?? 0 }) }] : [];
  }) };
}

/** Paid status phase is carried by standard clocks and never written to player saves. */
export function payPeriodicSpell(unit: CombatUnit, id: PeriodicSpellId, rank: number, at: number): CombatUnit {
  const d = PERIODIC_SPELL_DEFINITIONS[id];
  return { ...unit, statuses: [...unit.statuses.filter(status => status.id !== id), {
    id, sourceId: unit.id, stacks: 1, remaining: d.durationMs / 1000,
    appliedAtMs: at, expiresAtMs: at + d.durationMs, periodicSpell: Object.freeze({ rank })
  }] };
}

/** Strictly future phase; a pulse already settled by the previous wave cannot replay at zero. */
export function nextPeriodicSpellPulse(unit: CombatUnit, id: PeriodicSpellId, at: number): number | undefined {
  const paid = paidPeriodicSpell(unit, id, at);
  if (!paid) return undefined;
  const start = paid.appliedAtMs ?? 0, interval = PERIODIC_SPELL_DEFINITIONS[id].intervalMs;
  const next = start + (Math.floor((at - start) / interval) + 1) * interval;
  return next < (paid.expiresAtMs ?? 0) ? next : undefined;
}

/** A paid channel occupies caster opportunities; independent field spells never do. */
export function isChanneling(unit: CombatUnit, at: number): boolean {
  return PERIODIC_SPELL_IDS.some(id => PERIODIC_SPELL_DEFINITIONS[id].channelled === true &&
    paidPeriodicSpell(unit, id, at) !== undefined);
}
