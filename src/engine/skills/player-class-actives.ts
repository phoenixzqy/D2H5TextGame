import type { CombatUnit } from '../combat/types';
import { aliasToCanonical } from './aliases';
import { canonicalSkillIdFromData, PLAYABLE_CLASS_SKILL_DATA } from './dataCatalog';
import { isCorpseExplosionId } from './corpse-explosion';
import { isPoisonExplosionId } from './poison-explosion';
import { isIronGolemSkill } from './iron-golem';
import { governedActiveId } from './runeword-actives';
import { isPreparationSummonSkill } from './summon-preparation';

/** JSON ownership fields only; mechanics and resource readiness have other owners. */
export type ClassActiveOwnershipCatalog = Readonly<Record<string, readonly {
  readonly id: string;
  readonly trigger: 'active' | 'passive' | 'aura';
  readonly minLevel: number;
  readonly requiredLevel?: number;
  readonly maxLevel: number;
  readonly prerequisites?: readonly string[];
}[]>>;

/** Native player inputs; priorities/allocations are copied rather than rewritten. */
export interface ClassActiveOwner {
  readonly classId: string;
  readonly level: number;
  readonly skillOrder: readonly string[];
  readonly skillLevels?: Readonly<Record<string, number>>;
}

/**
 * Capture immutable authored ownership. D06 summons/corpse spells and D10 sources keep
 * their existing validators; this projection owns ordinary learned class actives.
 */
export function createClassActiveProjector(catalog: ClassActiveOwnershipCatalog) {
  const classes = new Set(Object.keys(catalog));
  const rows = Object.entries(catalog).flatMap(([classId, skills]) => skills.map(row =>
    Object.freeze({ classId, id: canonicalSkillIdFromData(row.id), dataId: row.id,
      trigger: row.trigger, requiredLevel: row.requiredLevel ?? row.minLevel,
      maxLevel: row.maxLevel, prerequisites: Object.freeze(
        (row.prerequisites ?? []).map(canonicalSkillIdFromData)) })));
  const byId = new Map(rows.map(row => [row.id, row]));
  const byAlias = new Map(rows.flatMap(row => [[row.id, row], [row.dataId, row]] as const));
  return (owner: ClassActiveOwner): Pick<CombatUnit, 'skillOrder' | 'skillLevels'> => {
    const levels = { ...owner.skillLevels };
    const resolved = new Map<string, number>();
    const visiting = new Set<string>();
    const rank = (id: string): number => {
      const known = resolved.get(id);
      if (known !== undefined) return known;
      const row = byId.get(id);
      if (!row || visiting.has(id) || row.classId !== owner.classId ||
        !Number.isInteger(owner.level) || owner.level < 1 ||
        !Number.isInteger(row.requiredLevel) || row.requiredLevel < 1 || owner.level < row.requiredLevel ||
        !Number.isInteger(row.maxLevel) || row.maxLevel < 1) return 0;
      const highest = Math.max(0, ...[row.id, row.dataId].map(alias => {
        const value = Object.hasOwn(owner.skillLevels ?? {}, alias) ? owner.skillLevels?.[alias] : undefined;
        return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= row.maxLevel ? value : 0;
      }));
      if (highest === 0) return 0;
      visiting.add(id);
      const legal = row.prerequisites.every(prerequisite => rank(prerequisite) > 0);
      visiting.delete(id);
      resolved.set(id, legal ? highest : 0);
      return legal ? highest : 0;
    };
    const skillOrder = owner.skillOrder.filter(id => {
      const row = byAlias.get(id);
      // Neither registry shorthand nor old unauthored class stubs establish ownership.
      if (!row) {
        const canonical = aliasToCanonical(id) ?? id;
        return !byAlias.has(canonical) && !classes.has(canonical.split('.')[0] ?? '');
      }
      if (row.trigger !== 'active') return false;
      if (Boolean(governedActiveId(id)) || isPreparationSummonSkill(row) || isIronGolemSkill(row) ||
        isCorpseExplosionId(id) || isPoisonExplosionId(id)) return true;
      const allocated = rank(row.id);
      if (allocated === 0) return false;
      Reflect.deleteProperty(levels, row.dataId);
      levels[row.id] = allocated;
      return true;
    });
    return { skillOrder, skillLevels: levels };
  };
}

/** Fresh native ordinary class-active configuration, independent of mutable UI data. */
export const projectPlayerClassActives = createClassActiveProjector(PLAYABLE_CLASS_SKILL_DATA);
