import skills from '../../data/skills/druid.json';
import type { Player } from '../types/entities';
import type { SkillDef } from '../types/skills';
import type { CombatUnit } from '../combat/types';
import type { RegisteredSkill } from './effects';
import { createSkillValidator } from './skill-validator';
import { integrateManaRecoveryWithContributionBetween } from '../combat/mana-recovery';

export const DRUID_SHAPE_IDS = {
  werewolf: ['skills-druid-werewolf', 'druid.werewolf'],
  werebear: ['skills-druid-werebear', 'druid.werebear'],
  lycanthropy: ['skills-druid-lycanthropy', 'druid.lycanthropy']
} as const;
export type DruidForm = 'werewolf' | 'werebear';
export type DruidShapeKey = keyof typeof DRUID_SHAPE_IDS;
/** Native wave authority; no rank is inferred from a cast priority or item grant. */
export type DruidShapeRanks = Readonly<Record<DruidShapeKey, number>>;
/** Paid run-local form; current-wave allocations capture all potency. */
export interface PaidDruidForm {
  readonly sourceHeroId: string;
  readonly form: DruidForm;
  readonly rank: number;
  readonly lycanthropyRank: number;
}
/** Primitive tuning shared by native projection, combat and localized details. */
export interface DruidShapeDefinition {
  readonly requiredLevel: number;
  readonly maxRank: number;
  readonly manaCost: number;
  readonly cooldown: number;
  readonly costPerRank: number;
  readonly cooldownPerRank: number;
  readonly prerequisites: readonly DruidShapeKey[];
  readonly perRank: Readonly<{
    lifePct: number;
    attackSpeedPct: number;
    physDodgePct: number;
    defensePct: number;
  }>;
}
const validate = createSkillValidator<
  Omit<SkillDef, 'cost'> & {
    readonly cost?: SkillDef['cost'];
    readonly requiredLevel: number;
    readonly prerequisites?: readonly string[];
  }
>();
/** Validate exact authored rows and copy tuning independently of mutable registry/catalog objects. */
export function resolveDruidShapeDefinitions(
  rows: readonly unknown[]
): Readonly<Record<DruidShapeKey, DruidShapeDefinition>> {
  const entries = (Object.keys(DRUID_SHAPE_IDS) as DruidShapeKey[]).map((key) => {
    const matches = rows.filter(
      (row) =>
        typeof row === 'object' && row !== null && 'id' in row && row.id === DRUID_SHAPE_IDS[key][0]
    );
    const row = matches[0];
    if (matches.length !== 1 || !validate(row)) throw new Error('Invalid authored Druid ' + key);
    const source = row.scaling?.passiveStatsPerLevel;
    const prerequisites = (row.prerequisites ?? []).map((id) => {
      const dependency = (Object.keys(DRUID_SHAPE_IDS) as DruidShapeKey[]).find(
        (k) => DRUID_SHAPE_IDS[k][0] === id
      );
      if (!dependency || dependency === key) throw new Error('Invalid Druid form prerequisite');
      return dependency;
    });
    return [
      key,
      Object.freeze({
        requiredLevel: row.requiredLevel,
        maxRank: row.maxLevel,
        manaCost: row.cost?.mana ?? 0,
        cooldown: row.cooldown,
        costPerRank: row.scaling?.costPerLevel ?? 0,
        cooldownPerRank: row.scaling?.cooldownPerLevel ?? 0,
        prerequisites: Object.freeze(prerequisites),
        perRank: Object.freeze({
          lifePct: source?.lifePct ?? 0,
          attackSpeedPct: source?.attackSpeedPct ?? 0,
          physDodgePct: source?.physDodgePct ?? 0,
          defensePct: source?.defensePct ?? 0
        })
      })
    ] as const;
  });
  return Object.freeze(Object.fromEntries(entries)) as Readonly<
    Record<DruidShapeKey, DruidShapeDefinition>
  >;
}
export const DRUID_SHAPE_DEFINITIONS = resolveDruidShapeDefinitions(skills);

/** Exact allocated aliases use MAX once and the authored cap; invalid values grant nothing. */
export function resolveDruidShapeRank(
  key: DruidShapeKey,
  levels?: Readonly<Record<string, number>>
): number {
  return DRUID_SHAPE_IDS[key].reduce((rank, id) => {
    const value = levels?.[id];
    return typeof value === 'number' && Number.isInteger(value) && value > 0
      ? Math.max(rank, Math.min(DRUID_SHAPE_DEFINITIONS[key].maxRank, value))
      : rank;
  }, 0);
}
/** Capture native class/level and transitive prerequisite eligibility at each wave boundary. */
export function composeDruidShapeshifting(
  player: Pick<Player, 'class' | 'level' | 'skillLevels'>
): DruidShapeRanks {
  const rank = (key: DruidShapeKey, path: readonly DruidShapeKey[] = []): number => {
    const d = DRUID_SHAPE_DEFINITIONS[key];
    return player.class === 'druid' &&
      Number.isInteger(player.level) &&
      player.level >= d.requiredLevel &&
      !path.includes(key) &&
      d.prerequisites.every((k) => rank(k, [...path, key]) > 0)
      ? resolveDruidShapeRank(key, player.skillLevels)
      : 0;
  };
  return Object.freeze({
    werewolf: rank('werewolf'),
    werebear: rank('werebear'),
    lycanthropy: rank('lycanthropy')
  });
}

function eligibleHero(unit: CombatUnit): boolean {
  return (
    unit.side === 'player' &&
    unit.kind === 'hero' &&
    unit.summon !== true &&
    unit.ownerId === undefined &&
    unit.summonOwnerId === undefined &&
    Number.isInteger(unit.level) &&
    Number.isFinite(unit.life) &&
    unit.life > 0
  );
}
function validRank(value: unknown, max: number): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= max;
}
/** Explicit eligible living hero potency only; bear requires its independent Lycanthropy allocation. */
export function druidFormRank(unit: CombatUnit, form: DruidForm): number {
  const ranks = unit.druidShapeRanks,
    d = DRUID_SHAPE_DEFINITIONS[form];
  if (
    !eligibleHero(unit) ||
    unit.level < d.requiredLevel ||
    !ranks ||
    !validRank(ranks[form], d.maxRank) ||
    !validRank(ranks.lycanthropy, DRUID_SHAPE_DEFINITIONS.lycanthropy.maxRank) ||
    (form === 'werebear' && ranks.lycanthropy === 0)
  )
    return 0;
  return ranks[form];
}
/** One desired form per combo; unavailable/unlearned entries never mask a later eligible form. */
export function selectedDruidForm(unit: CombatUnit): DruidForm | undefined {
  for (const id of unit.skillOrder) {
    for (const form of ['werewolf', 'werebear'] as const) {
      if (DRUID_SHAPE_IDS[form].some((alias) => alias === id) && druidFormRank(unit, form) > 0)
        return form;
    }
  }
  return undefined;
}
/** Match the complete authored paid effect before resource commitment. */
export function matchesDruidForm(skill: RegisteredSkill, form: DruidForm): boolean {
  const d = DRUID_SHAPE_DEFINITIONS[form],
    e = skill.effects[0];
  return (
    skill.id === DRUID_SHAPE_IDS[form][1] &&
    skill.archetype === 'druid' &&
    skill.trigger === 'active' &&
    skill.target === 'self' &&
    skill.isBuff === true &&
    skill.summonOnStart !== true &&
    skill.minLevel === d.requiredLevel &&
    skill.manaCost === d.manaCost &&
    skill.cooldown === d.cooldown &&
    skill.manaCostPerRank === d.costPerRank &&
    skill.cooldownPerRank === d.cooldownPerRank &&
    skill.effects.length === 1 &&
    e?.kind === 'buff' &&
    e.id === form &&
    e.duration === -1 &&
    e.druidForm === form
  );
}
/** Exact supported identities only; arbitrary marker/effect IDs grant no authority. */
export function druidFormForId(id: string): DruidForm | undefined {
  return (['werewolf', 'werebear'] as const).find((form) =>
    DRUID_SHAPE_IDS[form].some((alias) => alias === id)
  );
}
function validPaidForm(value: unknown): value is PaidDruidForm {
  if (
    typeof value !== 'object' ||
    value === null ||
    Object.keys(value).length !== 4 ||
    Array.isArray(value) ||
    !('sourceHeroId' in value) ||
    typeof value.sourceHeroId !== 'string' ||
    value.sourceHeroId.length === 0 ||
    !('form' in value) ||
    !('rank' in value) ||
    !('lycanthropyRank' in value) ||
    (value.form !== 'werewolf' && value.form !== 'werebear')
  )
    return false;
  return (
    validRank(value.rank, DRUID_SHAPE_DEFINITIONS[value.form].maxRank) &&
    value.rank > 0 &&
    validRank(value.lycanthropyRank, DRUID_SHAPE_DEFINITIONS.lycanthropy.maxRank) &&
    (value.form === 'werewolf' || value.lycanthropyRank === 0)
  );
}
/** Read one paid form, with no implicit rank or marker stacking. */
export function activeDruidForm(unit: CombatUnit): PaidDruidForm | undefined {
  const paid = unit.druidForm;
  return validPaidForm(paid) &&
    paid.sourceHeroId === unit.id &&
    paid.form === selectedDruidForm(unit) &&
    paid.rank === druidFormRank(unit, paid.form) &&
    paid.lycanthropyRank === (paid.form === 'werewolf' ? unit.druidShapeRanks?.lycanthropy : 0)
    ? paid
    : undefined;
}
/** Add form/Lycanthropy coefficients once, before existing mitigation/cadence composition. */
export function druidFormBonuses(unit: CombatUnit) {
  const paid = activeDruidForm(unit),
    d = paid ? DRUID_SHAPE_DEFINITIONS[paid.form].perRank : undefined;
  const lycan = DRUID_SHAPE_DEFINITIONS.lycanthropy.perRank,
    rank = paid?.rank ?? 0,
    lr = paid?.lycanthropyRank ?? 0;
  return {
    lifePct: rank * (d?.lifePct ?? 0) + lr * lycan.lifePct,
    attackSpeedPct: rank * (d?.attackSpeedPct ?? 0) + lr * lycan.attackSpeedPct,
    physDodgePct: rank * (d?.physDodgePct ?? 0),
    defensePct: rank * (d?.defensePct ?? 0)
  };
}
/** Restore a verified carried capacity baseline without clamping absolute HP before fresh projection. */
export function withoutDruidFormLife(unit: CombatUnit): CombatUnit {
  if (unit.druidFormLife === undefined) return unit;
  const { druidFormLife: carried, ...base } = unit;
  const cap: unknown = carried;
  if (
    typeof cap !== 'object' ||
    cap === null ||
    Object.keys(cap).length !== 2 ||
    !('baseLifeMax' in cap) ||
    !('appliedLifeMax' in cap)
  )
    return base;
  return typeof cap.baseLifeMax === 'number' &&
    Number.isFinite(cap.baseLifeMax) &&
    cap.baseLifeMax > 0 &&
    typeof cap.appliedLifeMax === 'number' &&
    Number.isFinite(cap.appliedLifeMax) &&
    cap.appliedLifeMax >= cap.baseLifeMax &&
    unit.stats.lifeMax === cap.appliedLifeMax
    ? { ...base, stats: { ...base.stats, lifeMax: cap.baseLifeMax } }
    : base;
}
/** Recompose paid carry at a wave boundary, or install a newly paid form; never heal/refill. */
export function refreshDruidForm(unit: CombatUnit, newlyPaid?: DruidForm): CombatUnit {
  if (unit.druidShapeRanks !== undefined) {
    unit = { ...unit, druidShapeRanks: Object.freeze({ ...unit.druidShapeRanks }) };
  }
  const hadForm = unit.druidForm !== undefined || unit.druidFormLife !== undefined;
  const base = withoutDruidFormLife(unit),
    desired = selectedDruidForm(base);
  const form =
    newlyPaid ??
    (validPaidForm(base.druidForm) && base.druidForm.sourceHeroId === base.id
      ? base.druidForm.form
      : undefined);
  const { druidForm: _old, ...unshaped } = base;
  const shaped = form !== undefined && desired === form && druidFormRank(base, form) > 0;
  if (!shaped && !hadForm && !base.statuses.some((s) => s.id === 'werewolf' || s.id === 'werebear'))
    return base;
  const clean = {
    ...unshaped,
    activeBuffIds: base.activeBuffIds.filter(
      (id) => !druidFormForId(id) && id !== 'werewolf' && id !== 'werebear'
    ),
    statuses: base.statuses.filter((s) => s.id !== 'werewolf' && s.id !== 'werebear')
  };
  if (!shaped) return { ...clean, life: Math.min(base.life, base.stats.lifeMax) };
  const paid = Object.freeze({
    sourceHeroId: base.id,
    form,
    rank: druidFormRank(base, form),
    lycanthropyRank: form === 'werewolf' ? (base.druidShapeRanks?.lycanthropy ?? 0) : 0
  });
  const next = { ...clean, druidForm: paid };
  const lifeSource =
    form === 'werewolf' ? DRUID_SHAPE_DEFINITIONS.lycanthropy : DRUID_SHAPE_DEFINITIONS.werebear;
  const lifeRank = form === 'werewolf' ? paid.lycanthropyRank : paid.rank;
  const extraLife = integrateManaRecoveryWithContributionBetween(
    0,
    {
      sourceBaselinePerSecond: base.stats.lifeMax,
      factors: [lifeSource.perRank.lifePct, lifeRank]
    },
    0,
    1000
  ).wholeGranted;
  const lifeMax = base.stats.lifeMax + extraLife;
  return {
    ...next,
    stats: { ...base.stats, lifeMax },
    life: Math.min(base.life, lifeMax),
    druidFormLife: Object.freeze({ baseLifeMax: base.stats.lifeMax, appliedLifeMax: lifeMax }),
    statuses: [...clean.statuses, { id: form, sourceId: base.id, stacks: 1, remaining: -1 }]
  };
}
