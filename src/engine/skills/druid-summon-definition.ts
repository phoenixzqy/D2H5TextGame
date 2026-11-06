import Ajv2020 from 'ajv/dist/2020';
import authored from '../../data/summons/druid.json';
import { compileAuthoredValidator } from '../../data/authored-validators';
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
type OwnerGrowth = Pick<DerivedStats, 'lifeMax' | 'attack' | 'defense'>;

/** Validated authored base stats and explicit provisional behavior coefficients. */
export interface DruidSummonDefinition {
  readonly id: 'summons/druid';
  readonly defaults: CommonStats;
  readonly templates: Readonly<Record<DruidSummonId, TemplateStats>>;
  readonly ownerLevelGrowth: Readonly<Record<DruidSummonId, Readonly<OwnerGrowth>>>;
  readonly raven: { readonly durationMs: number; readonly physicalHitChancePenalty: number };
  readonly poison: { readonly dotPctOfDamage: number };
  readonly vines: { readonly lifeFraction: number; readonly manaFraction: number };
}
const validate = compileAuthoredValidator<DruidSummonDefinition>(new Ajv2020({ strict: true, allErrors: true }), 'druidSummons');
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
    ownerLevelGrowth: Object.freeze({
      raven: Object.freeze({ ...source.ownerLevelGrowth.raven }),
      spirit_wolf: Object.freeze({ ...source.ownerLevelGrowth.spirit_wolf }),
      dire_wolf: Object.freeze({ ...source.ownerLevelGrowth.dire_wolf }),
      grizzly: Object.freeze({ ...source.ownerLevelGrowth.grizzly }),
      poison_creeper: Object.freeze({ ...source.ownerLevelGrowth.poison_creeper }),
      carrion_vine: Object.freeze({ ...source.ownerLevelGrowth.carrion_vine }),
      solar_creeper: Object.freeze({ ...source.ownerLevelGrowth.solar_creeper })
    }),
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

/** Add earned owner levels to fresh ranked Druid bodies before ordinary aura composition. */
export function growDruidSummonWithOwner(stats: DerivedStats, summonId: string, ownerLevel: number): DerivedStats {
  const growth = DRUID_SUMMON_DEFINITION.ownerLevelGrowth;
  if (!Object.hasOwn(growth, summonId)) return stats;
  if (!Number.isSafeInteger(ownerLevel) || ownerLevel < 1) throw new Error('Invalid summon owner level');
  if (ownerLevel === 1) return stats;
  const row = growth[summonId as DruidSummonId], levels = ownerLevel - 1;
  const lifeMax = stats.lifeMax + row.lifeMax * levels;
  return { ...stats, life: lifeMax, lifeMax, attack: stats.attack + row.attack * levels,
    defense: stats.defense + row.defense * levels };
}

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
