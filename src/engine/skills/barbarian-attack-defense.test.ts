import { expect, it } from 'vitest';
import skills from '../../data/skills/barbarian.json';
import type { ActiveStatus, CombatUnit } from '../combat/types';
import { rebaseStatusClock } from '../combat/status';
import { createSkillValidator } from './skill-validator';
import { registeredSkillFromJson, PLAYABLE_CLASS_SKILL_DATA } from './dataCatalog';
import { computeSkillDisplayModel } from './displayStats';
import { activeConcentrate, composeConcentrateRank, copyConcentrateStatuses, paidConcentrate,
  matchesConcentrate, resolveConcentrateDefinition, CONCENTRATE_DEFINITION } from './concentrate';

const concentrate = PLAYABLE_CLASS_SKILL_DATA.barbarian.find(s => s.id === 'skills-barbarian-concentrate');
const berserk = PLAYABLE_CLASS_SKILL_DATA.barbarian.find(s => s.id === 'skills-barbarian-berserk');
if (!concentrate || !berserk) throw new Error('Missing native Barbarian attacks');
const validate = createSkillValidator();
it('validates the actual authored attacks and their complete registered effects', () => {
  expect(validate(concentrate), JSON.stringify(validate.errors)).toBe(true);
  expect(validate(berserk), JSON.stringify(validate.errors)).toBe(true);
  expect(matchesConcentrate(registeredSkillFromJson(concentrate))).toBe(true);
  expect(registeredSkillFromJson(berserk).effects).toEqual([expect.objectContaining({
    kind: 'damage', damageType: 'arcane', attackDamagePct: 100, base: [80, 120], perRank: [8, 8] })]);
});
it.each([
  { timedBuff: undefined }, { timedBuff: { durationMs: 0 } }, { timedBuff: { durationMs: 1001 } },
  { timedBuff: { durationMs: 1000, extra: 1 } }, { target: 'all-enemies' }, { trigger: 'passive' },
  { requiredLevel: 1 }, { maxLevel: 21 }, { prerequisites: [] }, { appliesStatus: ['concentrate'] },
  { attackDamagePct: 100 }, { damageType: 'arcane' }, { hitSequence: { strikes: 2 } },
  { scaling: { damagePerLevel: 7, passiveStatsPerLevel: { defensePct: 0 } } },
  { scaling: { damagePerLevel: 7, passiveStatsPerLevel: { defensePct: .05, attackPct: .1 } } },
])('rejects contradictory Concentrate metadata %j', patch => {
  expect(validate({ ...concentrate, ...patch })).toBe(false);
});
it.each([{ attackDamagePct: undefined }, { attackDamagePct: 0 }, { attackDamagePct: Infinity },
  { attackDamagePct: 1001 }, { damageType: 'physical' }, { target: 'all-enemies' }, { prerequisites: [] }])(
  'rejects contradictory Berserk conversion metadata %j', patch => {
    expect(validate({ ...berserk, ...patch })).toBe(false);
  });
it('keeps the Attack coefficient restricted to reviewed owners', () => {
  const bash = skills.find(s => s.id === 'skills-barbarian-bash');
  expect(validate({ ...bash, attackDamagePct: 100 })).toBe(false);
});
it.each([0, 1, 2, 19, 20])('previews actual Defense and converted Attack at current/next rank%i', rank => {
  for (const row of [concentrate, berserk]) {
    const model = computeSkillDisplayModel(row, rank);
    for (const stats of [model.current, model.next].filter(s => s !== undefined)) {
      if (row === concentrate) {
        expect(stats.concentrate).toEqual({ durationSeconds: 1 });
        expect(stats.utility).toContainEqual(expect.objectContaining({ id: 'defensePct', value: Number((stats.rank * .05).toFixed(4)) }));
      } else expect(stats.convertedAttackPercent).toBe(100);
      expect(stats.damage[0]?.min).toBe((row === concentrate ? 70 : 80) + (row === concentrate ? 7 : 8) * (stats.rank - 1));
    }
    expect(model.current === undefined).toBe(rank === 0);
    expect(model.next === undefined).toBe(rank === 20);
  }
});
const paid: ActiveStatus = { id: 'concentrate', sourceId: 'hero', stacks: 1, remaining: 1,
  appliedAtMs: 1700.1, expiresAtMs: 2700.1, concentrate: paidConcentrate(20) };
const unit: CombatUnit = { id: 'hero', name: 'hero', side: 'player', kind: 'hero', level: 30, tier: 'trash',
  life: 100, mana: 0, statuses: [paid], skillOrder: [], cooldowns: {}, activeBuffIds: [], enraged: false,
  stats: { life: 100, lifeMax: 100, mana: 0, manaMax: 100, attack: 100, defense: 100, magicResist: 0,
    attackSpeed: 100, critChance: 0, critDamage: 2, physDodge: 0, magicDodge: 0, magicFind: 0, goldFind: 0,
    resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } } };
it('captures immutable tuning and independently validates native legal ranks and aliases', () => {
  expect(Object.isFrozen(resolveConcentrateDefinition(skills))).toBe(true);
  expect(CONCENTRATE_DEFINITION).toMatchObject({ defensePerRank: .05, durationMs: 1000 });
  for (const rows of [[], [...skills, concentrate]]) expect(() => resolveConcentrateDefinition(rows)).toThrow(/Invalid/);
  const owner = { class: 'barbarian' as const, level: 30, skillLevels: {
    'skills-barbarian-bash': 1, 'skills-barbarian-stun': 1, 'skills-barbarian-concentrate': 1, 'barbarian.concentrate': 20 } };
  expect(composeConcentrateRank(owner)).toBe(20);
  for (const patch of [{ class: 'sorceress' as const }, { level: 17 },
    { skillLevels: { 'skills-barbarian-concentrate': 1 } }]) expect(composeConcentrateRank({ ...owner, ...patch })).toBe(0);
});
it('copies paid potency, never stacks duplicates and expires exactly after a fractional wave rebase', () => {
  const copy = copyConcentrateStatuses(unit);
  expect(copy).toEqual(unit); expect(copy.statuses[0]?.concentrate).not.toBe(paid.concentrate);
  expect(Object.isFrozen(copy.statuses[0]?.concentrate)).toBe(true);
  expect(activeConcentrate(copy, 1700)).toBeUndefined(); expect(activeConcentrate(copy, 1700.1)).toEqual(paidConcentrate(20));
  expect(activeConcentrate(copy, 2700.1)).toBeUndefined();
  expect(activeConcentrate({ ...copy, statuses: [paid, paid] }, 2000)).toEqual(paidConcentrate(20));
  const carried = { ...rebaseStatusClock(copy, 2000.25), concentrateRank: 0 };
  expect(activeConcentrate(carried, 0)).toEqual(paidConcentrate(20));
  expect(activeConcentrate(carried, 699.85)).toBeUndefined();
});
it('rejects malformed/foreign paid payloads and nonpersonal consumers', () => {
  for (const payload of [null, [], {}, { rank: 20, defensePct: 100 }, { rank: 21, defensePct: 1.05 },
    { rank: 20, defensePct: 1, extra: true }]) {
    const input = { ...unit, statuses: [{ ...paid, concentrate: payload as NonNullable<ActiveStatus['concentrate']> }] };
    expect(activeConcentrate(input, 2000)).toBeUndefined();
    expect(copyConcentrateStatuses(input).statuses[0]?.concentrate).toBeUndefined();
  }
  for (const patch of [{ kind: 'merc' as const }, { side: 'enemy' as const }, { summon: true }, { ownerId: 'other' }, { life: 0 }])
    expect(activeConcentrate({ ...unit, ...patch }, 2000)).toBeUndefined();
  for (const patch of [{ sourceId: 'other' }, { expiresAtMs: 5000 }, { appliedAtMs: NaN }])
    expect(activeConcentrate({ ...unit, statuses: [{ ...paid, ...patch }] }, 2000)).toBeUndefined();
});
