import { expect, it } from 'vitest';
import skills from '../../data/skills/barbarian.json';
import { createSkillValidator } from '../skills/skill-validator';
import { registeredSkillFromJson, PLAYABLE_CLASS_SKILL_DATA } from '../skills/dataCatalog';
import { createRng } from '../rng';
import { applyStatus, statusActiveAt, rebaseStatusClock } from './status';
import { WARCRY_DEFINITIONS, activeBattleCry, paidBattleCry, resolveWarcryDefinitions } from './warcry-definition';
import type { CombatUnit } from './types';

const validate = createSkillValidator();
function unit(): CombatUnit {
  return { id: 'enemy', name: 'Synthetic target', side: 'enemy', kind: 'monster', tier: 'trash', level: 30,
    life: 1000, mana: 0, cooldowns: {}, skillOrder: [], activeBuffIds: [], statuses: [],
    enraged: false, summonedAdds: false, stats: { life: 1000, lifeMax: 1000, mana: 0, manaMax: 0,
      attack: 200, defense: 100, magicResist: 0, attackSpeed: 50, critChance: 0, critDamage: 2,
      physDodge: 0, magicDodge: 0, magicFind: 0, goldFind: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } } };
}
for (const slug of ['howl', 'taunt', 'battle-cry']) {
  const row = skills.find(r => r.id === 'skills-barbarian-' + slug);
  if (!row) throw new Error('Missing authored warcry');
  it(`${slug} validates its complete finite JSON contract and emits exactly one debuff`, () => {
    expect(validate(row), JSON.stringify(validate.errors)).toBe(true);
    const typed = PLAYABLE_CLASS_SKILL_DATA.barbarian.find(r => r.id === row.id);
    if (!typed) throw new Error('Missing typed warcry');
    expect(registeredSkillFromJson(typed).effects).toEqual([{ kind: 'debuff', statusId: slug,
      durationMs: 1000, ...(slug === 'battle-cry' ? { battleCry: true } : {}) }]);
  });
  it.each([{ statusEffect: {} }, { statusEffect: { durationMs: 0 } },
    { statusEffect: { ...row.statusEffect, durationMs: -1 } },
    { statusEffect: { ...row.statusEffect, durationMs: 1.5 } },
    { statusEffect: { ...row.statusEffect, other: 1 } }, { target: 'self' }, { trigger: 'passive' },
    { maxLevel: 21 }, { cost: { mana: 0 } }, { cooldown: 0 }, { damage: { min: 1, max: 1 } },
    { scaling: { ...row.scaling, passiveStatsPerLevel: { attackPct: .01 } } }])(`${slug} rejects incomplete/contradictory %j`, patch => {
    expect(validate({ ...row, ...patch })).toBe(false);
  });
  it(`${slug} replaces source and interval without stacking or changing unrelated statuses`, () => {
    const rng = createRng(7), base = { ...unit(), statuses: [{ id: 'unrelated', sourceId: 'old', stacks: 1, remaining: -1 }] };
    const first = applyStatus(base, { id: slug, sourceId: 'first', simClockMs: 1000,
      durationMs: 1000, ...(slug === 'battle-cry' ? { battleCry: paidBattleCry(20) } : {}) }, rng);
    const second = applyStatus(first, { id: slug, sourceId: 'second', simClockMs: 1500,
      durationMs: 1000, ...(slug === 'battle-cry' ? { battleCry: paidBattleCry(1) } : {}) }, rng);
    expect(second.statuses.filter(s => s.id === slug)).toHaveLength(1);
    const marker = second.statuses.find(s => s.id === slug);
    expect(marker).toMatchObject({ sourceId: 'second', stacks: 1, appliedAtMs: 1500, expiresAtMs: 2500 });
    expect(second.statuses.find(s => s.id === 'unrelated')).toEqual(base.statuses[0]);
    expect(marker && statusActiveAt(marker, 1500)).toBe(true);
    expect(marker && statusActiveAt(marker, 2500)).toBe(false);
    expect(first.statuses.find(s => s.id === slug)?.sourceId).toBe('first');
    if (slug === 'battle-cry') expect(activeBattleCry(second, 2000)).toEqual(paidBattleCry(1));
  });
}
it('copies and freezes tuning and rejects duplicated/missing or excessive rank-cap reductions', () => {
  const copy = structuredClone(skills), d = resolveWarcryDefinitions(copy);
  const cry = copy.find(row => row.id === 'skills-barbarian-battle-cry');
  if (!cry?.statusEffect) throw new Error('Missing test definition');
  cry.statusEffect.damageReductionPct = 99;
  expect(d.battleCry.damageReductionPct).toBe(25); expect(Object.isFrozen(d.battleCry)).toBe(true);
  expect(() => resolveWarcryDefinitions(copy)).toThrow();
  expect(() => resolveWarcryDefinitions([])).toThrow();
  expect(() => resolveWarcryDefinitions([...skills, skills[0]])).not.toThrow();
  expect(() => resolveWarcryDefinitions([...skills, cry])).toThrow();
});
it('only exact finite paid Battle Cry snapshots grant potency, including rebased cross-wave time', () => {
  const target = applyStatus(unit(), { id: 'battle-cry', sourceId: 'hero', simClockMs: 1700,
    durationMs: 1000, battleCry: paidBattleCry(2) }, createRng(7));
  expect(activeBattleCry(target, 1699)).toBeUndefined();
  expect(activeBattleCry(target, 1700)).toEqual({ rank: 2, damageReductionPct: 26, defenseReductionPct: 52 });
  expect(activeBattleCry(target, 2700)).toBeUndefined();
  expect(activeBattleCry(rebaseStatusClock(target, 2000), 0)).toEqual(paidBattleCry(2));
  for (const statuses of [[{ id: 'battle-cry', sourceId: 'hero', stacks: 1, remaining: -1 }],
    target.statuses.map(s => ({ ...s, battleCry: { ...paidBattleCry(2), damageReductionPct: 99 } })),
    target.statuses.map(s => ({ ...s, expiresAtMs: Infinity }))])
    expect(activeBattleCry({ ...target, statuses }, 2000)).toBeUndefined();
  expect(paidBattleCry(20)).toEqual({ rank: 20, damageReductionPct: 44, defenseReductionPct: 88 });
  expect(WARCRY_DEFINITIONS.howl).toEqual({ durationMs: 1000, bossDurationMultiplier: .5 });
});
