import Ajv2020 from 'ajv/dist/2020';
import authored from '../../data/summons/necromancer.json';
import { compileAuthoredValidator } from '../../data/authored-validators';
import type { DerivedStats } from '../types/attributes';
import { MITIGATION_DEFINITION } from '../combat/mitigation-definition';

type NecromancerSummonId = 'skeleton' | 'clay_golem' | 'skeletal_mage' | 'iron_golem' | 'revived';
type BodyStats = Omit<DerivedStats, 'life' | 'mana' | 'magicResist'>;
type OwnerGrowth = Pick<DerivedStats, 'lifeMax' | 'attack' | 'defense'>;

/** Complete validated body tuning; existing skill growth and magical mitigation are separate. */
export interface NecromancerSummonDefinition {
  readonly id: 'summons/necromancer';
  readonly templates: Readonly<Record<NecromancerSummonId, BodyStats>>;
  readonly ownerLevelGrowth: Readonly<Record<'skeleton' | 'skeletal_mage', Readonly<OwnerGrowth>>>;
}
const validate = compileAuthoredValidator<NecromancerSummonDefinition>(new Ajv2020({ strict: true, allErrors: true }), 'necromancerSummons');
function copyStats(stats: BodyStats): BodyStats {
  return Object.freeze({ ...stats, resistances: Object.freeze({ ...stats.resistances }) });
}

/** Validate and deeply copy authored tuning without mutating the caller or providing defaults. */
export function resolveNecromancerSummonDefinition(input: unknown): NecromancerSummonDefinition {
  if (!validate(input)) throw new Error('Invalid authored Necromancer summon definition');
  return Object.freeze({ id: input.id, ownerLevelGrowth: Object.freeze({
    skeleton: Object.freeze({ ...input.ownerLevelGrowth.skeleton }),
    skeletal_mage: Object.freeze({ ...input.ownerLevelGrowth.skeletal_mage })
  }), templates: Object.freeze({
    skeleton: copyStats(input.templates.skeleton),
    clay_golem: copyStats(input.templates.clay_golem),
    skeletal_mage: copyStats(input.templates.skeletal_mage),
    iron_golem: copyStats(input.templates.iron_golem),
    revived: copyStats(input.templates.revived)
  }) });
}
const definition = resolveNecromancerSummonDefinition(authored);

/** Add validated earned owner-level power to fresh Skeleton/Mage stats before Mastery. */
export function growNecromancerSummonWithOwner(stats: DerivedStats, summonId: string, ownerLevel: number): DerivedStats {
  if (summonId !== 'skeleton' && summonId !== 'skeletal_mage') return stats;
  if (!Number.isSafeInteger(ownerLevel) || ownerLevel < 1) throw new Error('Invalid summon owner level');
  if (ownerLevel === 1) return stats;
  const growth = definition.ownerLevelGrowth[summonId], levels = ownerLevel - 1;
  const lifeMax = stats.lifeMax + growth.lifeMax * levels;
  return { ...stats, life: lifeMax, lifeMax, attack: stats.attack + growth.attack * levels,
    defense: stats.defense + growth.defense * levels };
}

/** Fresh complete unscaled stats for runtime bodies and pure previews; foreign IDs remain unclaimed. */
export function getNecromancerSummonStats(summonId: string): DerivedStats | undefined {
  if (!Object.hasOwn(definition.templates, summonId)) return undefined;
  const stats = definition.templates[summonId as NecromancerSummonId];
  return { ...stats, life: stats.lifeMax, mana: stats.manaMax,
    magicResist: Math.max(0, Math.floor(MITIGATION_DEFINITION.friendlyBase.summon)),
    resistances: { ...stats.resistances } };
}
