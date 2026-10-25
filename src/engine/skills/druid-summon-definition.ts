import Ajv2020 from 'ajv/dist/2020';
import authored from '../../data/summons/druid.json';
import schema from '../../data/schema/druid-summons.schema.json';
import type { DerivedStats } from '../types/attributes';
import { MITIGATION_DEFINITION } from '../combat/mitigation-definition';

/** Exact templates owned by the native Druid summoning tree. */
export const DRUID_SUMMON_IDS = [
  'raven',
  'spirit_wolf',
  'dire_wolf',
  'grizzly',
  'poison_creeper',
  'carrion_vine',
  'solar_creeper'
] as const;
export type DruidSummonId = (typeof DRUID_SUMMON_IDS)[number];
type CommonStats = Pick<
  DerivedStats,
  | 'manaMax'
  | 'defense'
  | 'attackSpeed'
  | 'critChance'
  | 'critDamage'
  | 'physDodge'
  | 'magicDodge'
  | 'magicFind'
  | 'goldFind'
  | 'resistances'
>;
type TemplateStats = Partial<CommonStats> & Pick<DerivedStats, 'lifeMax' | 'attack'>;

/** Validated authored base stats and explicit provisional behavior coefficients. */
export interface DruidSummonDefinition {
  readonly id: 'summons/druid';
  readonly defaults: CommonStats;
  readonly templates: Readonly<Record<DruidSummonId, TemplateStats>>;
  readonly raven: { readonly durationMs: number; readonly physicalHitChancePenalty: number };
  readonly poison: { readonly dotPctOfDamage: number };
  readonly vines: { readonly lifeFraction: number; readonly manaFraction: number };
}
const validate = new Ajv2020({ strict: true, allErrors: true }).compile<DruidSummonDefinition>(
  schema
);
function copyTemplate(row: TemplateStats): TemplateStats {
  return Object.freeze({
    ...row,
    ...(row.resistances ? { resistances: Object.freeze({ ...row.resistances }) } : {})
  });
}

/** Reject invalid/missing tuning, then copy deeply without freezing caller data. */
export function resolveDruidSummonDefinition(source: unknown): DruidSummonDefinition {
  if (!validate(source)) throw new Error('Invalid authored Druid summon definition');
  return Object.freeze({
    id: source.id,
    defaults: Object.freeze({
      ...source.defaults,
      resistances: Object.freeze({ ...source.defaults.resistances })
    }),
    templates: Object.freeze({
      raven: copyTemplate(source.templates.raven),
      spirit_wolf: copyTemplate(source.templates.spirit_wolf),
      dire_wolf: copyTemplate(source.templates.dire_wolf),
      grizzly: copyTemplate(source.templates.grizzly),
      poison_creeper: copyTemplate(source.templates.poison_creeper),
      carrion_vine: copyTemplate(source.templates.carrion_vine),
      solar_creeper: copyTemplate(source.templates.solar_creeper)
    }),
    raven: Object.freeze({ ...source.raven }),
    poison: Object.freeze({ ...source.poison }),
    vines: Object.freeze({ ...source.vines })
  });
}

/** Immutable default shared by bodies, effects and pure UI previews. */
export const DRUID_SUMMON_DEFINITION = resolveDruidSummonDefinition(authored);

/** Fresh complete unscaled stats; foreign templates remain under their existing owners. */
export function getDruidSummonStats(summonId: string): DerivedStats | undefined {
  const d = DRUID_SUMMON_DEFINITION;
  if (!Object.hasOwn(d.templates, summonId)) return undefined;
  const template = d.templates[summonId as DruidSummonId];
  return {
    ...d.defaults,
    ...template,
    life: template.lifeMax,
    mana: template.manaMax ?? d.defaults.manaMax,
    magicResist: Math.max(0, Math.floor(MITIGATION_DEFINITION.friendlyBase.summon)),
    resistances: { ...(template.resistances ?? d.defaults.resistances) }
  };
}
