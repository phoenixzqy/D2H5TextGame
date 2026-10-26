import Ajv2020 from 'ajv/dist/2020';
import authored from '../../data/summons/necromancer.json';
import schema from '../../data/schema/necromancer-summons.schema.json';
import type { DerivedStats } from '../types/attributes';
import { MITIGATION_DEFINITION } from '../combat/mitigation-definition';

type NecromancerSummonId = 'skeleton' | 'clay_golem' | 'skeletal_mage' | 'iron_golem' | 'revived';
type BodyStats = Omit<DerivedStats, 'life' | 'mana' | 'magicResist'>;

/** Complete validated body tuning; existing skill growth and magical mitigation are separate. */
export interface NecromancerSummonDefinition {
  readonly id: 'summons/necromancer';
  readonly templates: Readonly<Record<NecromancerSummonId, BodyStats>>;
}
const validate = new Ajv2020({ strict: true, allErrors: true })
  .compile<NecromancerSummonDefinition>(schema);
function copyStats(stats: BodyStats): BodyStats {
  return Object.freeze({ ...stats, resistances: Object.freeze({ ...stats.resistances }) });
}

/** Validate and deeply copy authored tuning without mutating the caller or providing defaults. */
export function resolveNecromancerSummonDefinition(input: unknown): NecromancerSummonDefinition {
  if (!validate(input)) throw new Error('Invalid authored Necromancer summon definition');
  return Object.freeze({ id: input.id, templates: Object.freeze({
    skeleton: copyStats(input.templates.skeleton),
    clay_golem: copyStats(input.templates.clay_golem),
    skeletal_mage: copyStats(input.templates.skeletal_mage),
    iron_golem: copyStats(input.templates.iron_golem),
    revived: copyStats(input.templates.revived)
  }) });
}
const definition = resolveNecromancerSummonDefinition(authored);

/** Fresh complete unscaled stats for runtime bodies and pure previews; foreign IDs remain unclaimed. */
export function getNecromancerSummonStats(summonId: string): DerivedStats | undefined {
  if (!Object.hasOwn(definition.templates, summonId)) return undefined;
  const stats = definition.templates[summonId as NecromancerSummonId];
  return { ...stats, life: stats.lifeMax, mana: stats.manaMax,
    magicResist: Math.max(0, Math.floor(MITIGATION_DEFINITION.friendlyBase.summon)),
    resistances: { ...stats.resistances } };
}
