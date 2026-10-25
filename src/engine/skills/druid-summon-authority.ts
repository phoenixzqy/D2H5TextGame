import authored from '../../data/skills/druid.json';
import type { Player } from '../types/entities';
import type { CombatUnit } from '../combat/types';
import type { RegisteredSkill } from './effects';
import { canonicalSkillIdFromData, registeredSkillFromJson } from './dataCatalog';
import { createSkillValidator } from './skill-validator';
import type { SkillDef } from '../types/skills';
import { DRUID_SUMMON_IDS, type DruidSummonId } from './druid-summon-definition';

/** Narrow selected native allocation authority, recreated per wave and never saved. */
export type DruidSummonRanks = Readonly<Partial<Record<DruidSummonId, number>>>;
type Source = SkillDef & {
  readonly requiredLevel: number;
  readonly prerequisites?: readonly string[];
};
const validate = createSkillValidator<Source>();
function freeze<T>(value: T): T {
  if (typeof value === 'object' && value !== null) {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}
const sources = DRUID_SUMMON_IDS.map((template) => {
  const matches = authored.filter((row) => row.summonId === template),
    source = matches[0];
  if (
    matches.length !== 1 ||
    !validate(source) ||
    source.summon !== true ||
    source.trigger !== 'active' ||
    source.target !== 'summon'
  )
    throw new Error('Invalid authored Druid summon source');
  return freeze({
    template,
    source: structuredClone(source),
    registered: structuredClone(
      registeredSkillFromJson({ ...source, trigger: 'active', target: 'summon' })
    )
  });
});
function same(actual: unknown, expected: unknown): boolean {
  if (actual === expected) return true;
  if (
    typeof actual !== 'object' ||
    actual === null ||
    typeof expected !== 'object' ||
    expected === null ||
    Array.isArray(actual) !== Array.isArray(expected)
  )
    return false;
  if (Array.isArray(actual) && Array.isArray(expected) && actual.length !== expected.length)
    return false;
  const a = actual as Record<string, unknown>,
    b = expected as Record<string, unknown>;
  return (
    Object.keys(a).length === Object.keys(b).length &&
    Object.keys(b).every((key) => Object.hasOwn(a, key) && same(a[key], b[key]))
  );
}
function allocated(levels: Readonly<Record<string, number>> | undefined, source: Source): number {
  return [source.id, canonicalSkillIdFromData(source.id)].reduce((rank, id) => {
    const value = levels?.[id];
    return typeof value === 'number' &&
      Number.isInteger(value) &&
      value > 0 &&
      value <= source.maxLevel
      ? Math.max(rank, value)
      : rank;
  }, 0);
}

/** Exact aliases, current class/unlock and D06 direct prerequisites; unslotted skills grant nothing. */
export function composeDruidSummonRanks(
  player: Pick<Player, 'class' | 'level' | 'skillLevels' | 'comboOrder'>
): DruidSummonRanks {
  const ranks: Partial<Record<DruidSummonId, number>> = {};
  if (player.class !== 'druid' || !Number.isInteger(player.level)) return Object.freeze(ranks);
  for (const { template, source } of sources) {
    if (
      player.level < source.requiredLevel ||
      !player.comboOrder.some(
        (id) => id === source.id || id === canonicalSkillIdFromData(source.id)
      )
    )
      continue;
    const rank = allocated(player.skillLevels, source);
    if (
      rank === 0 ||
      source.prerequisites?.some((id) => {
        const prerequisite = sources.find((row) => row.source.id === id)?.source;
        return !prerequisite || allocated(player.skillLevels, prerequisite) === 0;
      })
    )
      continue;
    ranks[template] = rank;
  }
  return Object.freeze(ranks);
}

/** Independently copy the complete narrow projection; any malformed key/rank disables it. */
export function copyDruidSummonRanks(input: unknown): DruidSummonRanks {
  const ranks: Partial<Record<DruidSummonId, number>> = {};
  if (typeof input !== 'object' || input === null || Array.isArray(input))
    return Object.freeze(ranks);
  for (const [id, rank] of Object.entries(input)) {
    const source = sources.find((row) => row.template === id);
    if (
      !source ||
      typeof rank !== 'number' ||
      !Number.isInteger(rank) ||
      rank < 1 ||
      rank > source.source.maxLevel
    )
      return Object.freeze({});
    ranks[source.template] = rank;
  }
  return Object.freeze(ranks);
}

/** Qualify exact registered semantics and a living native original hero before binding runtime bodies. */
export function qualifyDruidSummon(
  owner: CombatUnit,
  skill: RegisteredSkill,
  rank: number
): DruidSummonId | undefined {
  const row = sources.find((source) => source.registered.id === skill.id);
  if (
    !row ||
    owner.id.length === 0 ||
    owner.side !== 'player' ||
    owner.kind !== 'hero' ||
    owner.summon === true ||
    owner.ownerId !== undefined ||
    owner.summonOwnerId !== undefined ||
    !Number.isFinite(owner.life) ||
    owner.life <= 0 ||
    !Number.isInteger(owner.level) ||
    owner.level < row.source.requiredLevel ||
    !Number.isInteger(rank) ||
    rank < 1 ||
    rank !== owner.druidSummonRanks?.[row.template] ||
    rank !== allocated(owner.skillLevels, row.source) ||
    !owner.skillOrder.some((id) => id === row.source.id || id === row.registered.id) ||
    !same(skill, row.registered)
  )
    return undefined;
  return row.template;
}

/** Runtime body identity never derives authority from a name or template marker alone. */
export function isDruidSummonBody(
  unit: CombatUnit,
  ownerId: string,
  template: DruidSummonId
): boolean {
  return (
    unit.id !== ownerId &&
    unit.side === 'player' &&
    unit.kind === 'summon' &&
    unit.summon === true &&
    unit.summonOwnerId === ownerId &&
    (unit.ownerId === undefined || unit.ownerId === ownerId) &&
    unit.summonTemplateId === template &&
    Number.isFinite(unit.life) &&
    unit.life > 0
  );
}
