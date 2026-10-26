import { expect, it } from 'vitest';
import { PLAYABLE_CLASS_SKILL_DATA } from './dataCatalog';
import { createSkillValidator } from './skill-validator';
import { composeSorceressBuffRanks, resolveSorceressBuffDefinition, SORCERESS_BUFF_DEFINITIONS } from './sorceress-buffs';
import { activeSorceressBuff, copySorceressBuffStatuses, paySorceressBuff, sorceressBuffBonus } from './sorceress-buffs';
import type { CombatUnit } from '../combat/types';
import { computeSkillDisplayModel } from './displayStats';

const validate = createSkillValidator();
const source = (id: string) => {
  const row = PLAYABLE_CLASS_SKILL_DATA.sorceress.find(s => s.id === 'skills-sorceress-' + id);
  if (!row) throw new Error('Missing authored buff');
  return row;
};
it.each(['teleport', 'enchant'] as const)('%s previews finite duration and paid rank potency at current/next/MAX', id => {
  for (const rank of [0, 1, 2, 19, 20]) {
    const model = computeSkillDisplayModel(source(id), rank);
    const preview = (at: number) => ({ durationSeconds: id === 'teleport' ? 1 : 10,
      ...(id === 'teleport' ? { magicDodgePoints: at } : { enchantAttackPercent: at * 2 }) });
    if (rank > 0) expect(model.current).toHaveProperty('sorceressBuff', preview(rank));
    if (rank < 20) expect(model.next).toHaveProperty('sorceressBuff', preview(rank + 1));
    else expect(model.next).toBeUndefined();
  }
});
it.each(['teleport', 'enchant'])('%s authors a finite paid personal effect', id => {
  const row = source(id);
  expect(validate(row), JSON.stringify(validate.errors)).toBe(true);
  expect(row).toMatchObject({ trigger: 'active', target: 'self', requiredLevel: 18,
    maxLevel: 20, appliesStatus: [id], timedBuff: { durationMs: id === 'teleport' ? 1000 : 10000 } });
  if (id === 'enchant') {
    expect(row).toHaveProperty('enchantOnPhysicalHit', { attackPctPerRank: .02 });
    expect(row.scaling).not.toHaveProperty('passiveStatsPerLevel');
  }
});
it.each(['teleport', 'enchant'])('%s rejects contradictory ownership, timing, effects and tuning', id => {
  const row = source(id);
  for (const patch of [{ trigger: 'passive' }, { target: 'single-enemy' }, { requiredLevel: 1 },
    { maxLevel: 21 }, { timedBuff: undefined }, { timedBuff: { durationMs: 0 } },
    { timedBuff: { durationMs: 60001 } }, { timedBuff: { durationMs: 1, extra: true } },
    { appliesStatus: [id, 'stun'] }, { damage: { min: 1, max: 2 }, damageType: 'fire' },
    { prerequisites: [] }, { summon: true }, { aura: true }, { passive: true },
    { statusEffect: { chance: 1 } }, { scaling: { costPerLevel: -.1, cooldownPerLevel: -.05,
      passiveStatsPerLevel: { fireDamagePct: .02, magicDodgePct: .01 } } }])
    expect(validate({ ...row, ...patch }), JSON.stringify(patch)).toBe(false);
});
it('rejects malformed or foreign Enchant weapon metadata', () => {
  const row = source('enchant');
  for (const enchantOnPhysicalHit of [undefined, {}, { attackPctPerRank: 0 },
    { attackPctPerRank: -1 }, { attackPctPerRank: 1.1 }, { attackPctPerRank: Infinity },
    { attackPctPerRank: .02, extra: true }])
    expect(validate({ ...row, enchantOnPhysicalHit })).toBe(false);
  expect(validate({ ...source('teleport'), enchantOnPhysicalHit: { attackPctPerRank: .02 } })).toBe(false);
});

it.each(['teleport', 'enchant'] as const)('%s copies immutable JSON tuning and rejects duplicate definitions', id => {
  const row = { ...source(id), timedBuff: { durationMs: 12000 } };
  const copied = resolveSorceressBuffDefinition([row], id);
  expect(copied).toMatchObject({ requiredLevel: 18, maxRank: 20, durationMs: 12000,
    perRank: id === 'teleport' ? .01 : .02 });
  expect(Object.isFrozen(copied)).toBe(true);
  row.timedBuff.durationMs = 14000; expect(copied.durationMs).toBe(12000);
  expect(() => resolveSorceressBuffDefinition([row, row], id)).toThrow();
  expect(() => resolveSorceressBuffDefinition([], id)).toThrow();
  expect(SORCERESS_BUFF_DEFINITIONS[id].durationMs).toBe(id === 'teleport' ? 1000 : 10000);
});
it.each(['teleport', 'enchant'] as const)('%s projects legal class, unlock, aliases and transitive prerequisites', id => {
  const prerequisites = id === 'teleport' ? { 'skills-sorceress-telekinesis': 1 }
    : { 'skills-sorceress-fire-ball': 1, 'skills-sorceress-fire-bolt': 1 };
  const player = { class: 'sorceress' as const, level: 30,
    skillLevels: { ...prerequisites, ['skills-sorceress-' + id]: 2, ['sorceress.' + id]: 20 } };
  expect(composeSorceressBuffRanks(player)[id]).toBe(20);
  expect(composeSorceressBuffRanks({ ...player, class: 'paladin' })[id]).toBe(0);
  expect(composeSorceressBuffRanks({ ...player, level: 17 })[id]).toBe(0);
  expect(composeSorceressBuffRanks({ ...player, skillLevels: { ['skills-sorceress-' + id]: 20 } })[id]).toBe(0);
  for (const rank of [0, -1, 1.5, 21, NaN, Infinity])
    expect(composeSorceressBuffRanks({ ...player,
      skillLevels: { ...prerequisites, ['skills-sorceress-' + id]: rank } })[id]).toBe(0);
});

function unit(): CombatUnit {
  return { id: 'hero', name: 'hero', side: 'player', kind: 'hero', level: 30, tier: 'trash',
    life: 100, mana: 100, skillOrder: [], activeBuffIds: [], cooldowns: {}, enraged: false, statuses: [],
    stats: { life: 100, lifeMax: 100, mana: 100, manaMax: 100, attack: 100, attackSpeed: 100,
      defense: 0, magicResist: 0, critChance: 0, critDamage: 2, physDodge: 0, magicDodge: 0,
      magicFind: 0, goldFind: 0, resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } } };
}
it.each(['teleport', 'enchant'] as const)('%s uses copied paid potency only within its exact source-bound interval', id => {
  for (const rank of [1, 2, 20]) {
    const hero = unit(), d = SORCERESS_BUFF_DEFINITIONS[id];
    const status = { id, sourceId: hero.id, stacks: 1, remaining: d.durationMs / 1000,
      appliedAtMs: 1700, expiresAtMs: 1700 + d.durationMs, sorceressBuff: paySorceressBuff(id, rank, 100) };
    const input = { ...hero, statuses: [status, status] }, before = structuredClone(input);
    const copied = copySorceressBuffStatuses(input);
    expect(copied.statuses[0]?.sorceressBuff).not.toBe(status.sorceressBuff);
    expect(sorceressBuffBonus(copied, id, 1699)).toBe(0);
    expect(sorceressBuffBonus(copied, id, 1700)).toBe(id === 'teleport' ? rank * .01 : rank * 2);
    expect(sorceressBuffBonus(copied, id, status.expiresAtMs)).toBe(0);
    expect(input).toEqual(before);
    for (const patch of [{ sourceId: 'other' }, { stacks: 2 }, { appliedAtMs: NaN },
      { expiresAtMs: status.expiresAtMs + 1 }, { sorceressBuff: { ...status.sorceressBuff, extra: 1 } },
      { sorceressBuff: { rank: 21, ...(id === 'enchant' ? { attack: 100 } : {}) } }])
      expect(activeSorceressBuff({ ...hero, statuses: [{ ...status, ...patch }] }, id, 1700)).toBeUndefined();
  }
});
