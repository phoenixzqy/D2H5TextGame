import Ajv2020 from 'ajv/dist/2020';
import authored from '../../data/summons/amazon.json';
import { compileAuthoredValidator } from '../../data/authored-validators';
import type { DerivedStats } from '../types/attributes';
import { MITIGATION_DEFINITION } from '../combat/mitigation-definition';

type BodyStats = Omit<DerivedStats, 'life' | 'mana' | 'magicResist'>;
/** Complete Amazon body tuning; rank growth and magical mitigation retain their existing owners. */
export interface AmazonSummonDefinition {
  readonly id: 'summons/amazon';
  readonly templates: { readonly valkyrie: BodyStats };
}
const validate = compileAuthoredValidator<AmazonSummonDefinition>(new Ajv2020({ strict: true, allErrors: true }), 'amazonSummons');
/** Reject incomplete tuning, then copy deeply without freezing or retaining caller data. */
export function resolveAmazonSummonDefinition(input: unknown): AmazonSummonDefinition {
  if (!validate(input)) throw new Error('Invalid authored Amazon summon definition');
  const stats = input.templates.valkyrie;
  return Object.freeze({
    id: input.id,
    templates: Object.freeze({
      valkyrie: Object.freeze({ ...stats, resistances: Object.freeze({ ...stats.resistances }) })
    })
  });
}
const definition = resolveAmazonSummonDefinition(authored);
/** Fresh unscaled body stats shared by runtime and previews; unrelated templates remain unclaimed. */
export function getAmazonSummonStats(summonId: string): DerivedStats | undefined {
  if (summonId !== 'valkyrie') return undefined;
  const stats = definition.templates.valkyrie;
  return {
    ...stats,
    life: stats.lifeMax,
    mana: stats.manaMax,
    magicResist: Math.max(0, Math.floor(MITIGATION_DEFINITION.friendlyBase.summon)),
    resistances: { ...stats.resistances }
  };
}
