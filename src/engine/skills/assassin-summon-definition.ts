import Ajv2020 from 'ajv/dist/2020';
import authored from '../../data/summons/assassin.json';
import { compileAuthoredValidator } from '../../data/authored-validators';
import type { DerivedStats } from '../types/attributes';
import { MITIGATION_DEFINITION } from '../combat/mitigation-definition';

type BodyStats = Omit<DerivedStats, 'life' | 'mana' | 'magicResist'>;
/** Complete shadow body tuning; skill growth and magical mitigation have separate owners. */
export interface AssassinSummonDefinition {
  readonly id: 'summons/assassin';
  readonly templates: { readonly shadow_warrior: BodyStats; readonly shadow_master: BodyStats };
}
const validate = compileAuthoredValidator<AssassinSummonDefinition>(new Ajv2020({ strict: true, allErrors: true }), 'assassinSummons');
function freezeStats(stats: BodyStats): BodyStats {
  return Object.freeze({ ...stats, resistances: Object.freeze({ ...stats.resistances }) });
}
/** Reject incomplete tuning and return a deeply frozen copy without freezing caller data. */
export function resolveAssassinSummonDefinition(input: unknown): AssassinSummonDefinition {
  if (!validate(input)) throw new Error('Invalid authored Assassin summon definition');
  return Object.freeze({ id: input.id, templates: Object.freeze({
    shadow_warrior: freezeStats(input.templates.shadow_warrior),
    shadow_master: freezeStats(input.templates.shadow_master)
  }) });
}
const definition = resolveAssassinSummonDefinition(authored);
/** Fresh base stats for runtime bodies and previews; unrelated templates remain unclaimed. */
export function getAssassinSummonStats(summonId: string): DerivedStats | undefined {
  if (summonId !== 'shadow_warrior' && summonId !== 'shadow_master') return undefined;
  const stats = definition.templates[summonId];
  return { ...stats, life: stats.lifeMax, mana: stats.manaMax,
    magicResist: Math.max(0, Math.floor(MITIGATION_DEFINITION.friendlyBase.summon)),
    resistances: { ...stats.resistances } };
}
