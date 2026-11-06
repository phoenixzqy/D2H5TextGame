import { compileAuthoredValidator } from '../authored-validators';
import Ajv2020 from 'ajv/dist/2020';
import mercSkills from '../skills/mercenary.json';
import type { BannerConfig, MercDef, MercPool } from './mercs';

const ajv = new Ajv2020({ strict: true, allErrors: true });
const checkBanner = compileAuthoredValidator<BannerConfig>(ajv, 'banner');
const checkMercs = compileAuthoredValidator<MercDef[]>(ajv, 'mercs');

/** Validate fresh authored data and complete tier/identity/skill references without repairing input. */
export function validateRecruitmentDefinitions(catalog: unknown, definition: unknown): MercPool {
  if (!checkMercs(catalog) || !checkBanner(definition)) throw new Error('Invalid recruitment definitions');
  const byId = new Map(catalog.map(merc => [merc.id, merc]));
  const skills = new Set(mercSkills.map(skill => skill.id));
  const pooled = new Set<string>();
  if (byId.size !== catalog.length ||
    Math.abs(definition.rates.SSR + definition.rates.SR + definition.rates.R - 1) > 1e-12 ||
    definition.pity.sr.threshold > definition.pity.ssr.threshold ||
    catalog.some(merc => [merc.signatureSkillId, ...merc.skills, ...(merc.comboOrder ?? [])]
      .some(id => !skills.has(id)))) throw new Error('Inconsistent recruitment definitions');
  for (const rarity of ['SSR', 'SR', 'R'] as const) {
    for (const id of definition.pool[rarity]) {
      if (pooled.has(id) || byId.get(id)?.rarity !== rarity) throw new Error('Inconsistent recruitment pools');
      pooled.add(id);
    }
  }
  if (pooled.size !== catalog.length) throw new Error('Incomplete recruitment pools');
  return { pool: catalog, banner: definition, rates: definition.rates, pity: definition.pity };
}
