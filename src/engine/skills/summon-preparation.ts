/** D06 v1b/v1c policy membership; numeric tuning remains in authored skill data. */
import type { RegisteredSkill } from './effects';

/** Exact external-input-free canonical skills and their existing summon templates. */
export const SUMMON_PREPARATION_TEMPLATES: Readonly<Record<string, string>> = Object.freeze({
  'amazon.valkyrie': 'valkyrie',
  'assassin.shadow_warrior': 'shadow_warrior',
  'assassin.shadow_master': 'shadow_master',
  'druid.summon_dire_wolf': 'dire_wolf',
  'druid.raven': 'raven',
  'druid.poison_creeper': 'poison_creeper',
  'druid.summon_spirit_wolf': 'spirit_wolf',
  'druid.carrion_vine': 'carrion_vine',
  'druid.solar_creeper': 'solar_creeper',
  'druid.summon_grizzly': 'grizzly',
  'necromancer.blood_golem': 'blood_golem',
  'necromancer.clay_golem': 'clay_golem',
  'necromancer.fire_golem': 'fire_golem',
  'necromancer.raise_skeleton': 'skeleton',
  'necromancer.raise_skeletal_mage': 'skeletal_mage',
  'necromancer.revive': 'revived'
});

/** Check scoped canonical identity; callers separately validate source and eligibility. */
export function isPreparationSummonSkill(skill: Pick<RegisteredSkill, 'id'>): boolean {
  return Object.prototype.hasOwnProperty.call(SUMMON_PREPARATION_TEMPLATES, skill.id);
}
