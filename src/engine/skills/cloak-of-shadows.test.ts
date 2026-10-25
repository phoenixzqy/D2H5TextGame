import { expect, it } from 'vitest';
import skills from '../../data/skills/assassin.json';
import type { ActiveStatus, CombatUnit } from '../combat/types';
import { rebaseStatusClock } from '../combat/status';
import { activeCloakOfShadows, composeCloakOfShadowsRank, copyCloakOfShadowsStatuses,
  paidCloakOfShadows, resolveCloakOfShadowsDefinition, CLOAK_OF_SHADOWS_DEFINITION } from './cloak-of-shadows';
import { paidBurstOfSpeed, copyBurstOfSpeedStatuses } from './burst-of-speed';
import { computeSkillDisplayModel } from './displayStats';
import { PLAYABLE_CLASS_SKILL_DATA } from './dataCatalog';

const owner = { class: 'assassin' as const, level: 30, skillLevels: {
  'assassin.cloak_of_shadows': 20, 'assassin.psychic_hammer': 1
} };
const paid: ActiveStatus = { id: 'cloak-of-shadows', sourceId: 'hero', stacks: 1, remaining: 8,
  appliedAtMs: .1, expiresAtMs: 8000.1, cloakOfShadows: paidCloakOfShadows(20) };
const unit: CombatUnit = { id: 'hero', name: 'hero', kind: 'hero', side: 'player', level: 30,
  tier: 'trash', life: 100, mana: 0, statuses: [paid], cooldowns: {}, skillOrder: [], activeBuffIds: [], enraged: false,
  stats: { life: 100, lifeMax: 100, mana: 0, manaMax: 100, attack: 100, attackSpeed: 100,
    defense: 100, magicResist: 0, physDodge: 0, magicDodge: 0, critChance: 0, critDamage: 2,
    magicFind: 0, goldFind: 0, resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } } };

it('copies validated authored tuning and rejects missing/duplicate/invalid rows', () => {
  const rows = structuredClone(skills), d = resolveCloakOfShadowsDefinition(rows);
  expect(d).toMatchObject({ requiredLevel: 12, maxRank: 20, durationMs: 8000, defensePerRank: .03,
    critPerRank: .005, magicDodgePerRank: .005, manaCost: 13, cooldown: 3 });
  rows.splice(0); expect(d).toEqual(CLOAK_OF_SHADOWS_DEFINITION); expect(Object.isFrozen(d)).toBe(true);
  expect(() => resolveCloakOfShadowsDefinition(rows)).toThrow(/Invalid/);
  const row = skills.find(s => s.id === 'skills-assassin-cloak-of-shadows');
  expect(() => resolveCloakOfShadowsDefinition([...skills, row])).toThrow(/Invalid/);
  expect(() => resolveCloakOfShadowsDefinition([{ ...row, timedBuff: { durationMs: 0 } }])).toThrow(/Invalid/);
});
it('uses native aliases and recursive prerequisite authority without combining duplicate ranks', () => {
  expect(composeCloakOfShadowsRank(owner)).toBe(20);
  expect(composeCloakOfShadowsRank({ ...owner, skillLevels: {
    ...owner.skillLevels, 'skills-assassin-cloak-of-shadows': 1
  } })).toBe(20);
  expect(composeCloakOfShadowsRank({ ...owner, level: 11 })).toBe(0);
  expect(composeCloakOfShadowsRank({ ...owner, class: 'sorceress' })).toBe(0);
  expect(composeCloakOfShadowsRank({ ...owner, skillLevels: { 'assassin.cloak_of_shadows': 20 } })).toBe(0);
  for (const rank of [0, -1, 1.5, 21, NaN, Infinity]) expect(composeCloakOfShadowsRank({ ...owner,
    skillLevels: { ...owner.skillLevels, 'assassin.cloak_of_shadows': rank } })).toBe(0);
});
it('retains copied paid potency through fractional rebasing/respec with exact finite boundaries', () => {
  const original = structuredClone(unit), copy = copyCloakOfShadowsStatuses(original);
  expect(copy).toEqual(original); expect(copy.statuses[0]?.cloakOfShadows).not.toBe(original.statuses[0]?.cloakOfShadows);
  expect(Object.isFrozen(copy.statuses[0]?.cloakOfShadows)).toBe(true);
  expect(activeCloakOfShadows(copy, .099)).toBeUndefined();
  expect(activeCloakOfShadows(copy, .1)).toEqual(paidCloakOfShadows(20));
  const rebased = rebaseStatusClock(copy, 1700 / 3);
  expect(activeCloakOfShadows({ ...rebased, cloakOfShadowsRank: 0 }, 0)).toEqual(paidCloakOfShadows(20));
  expect(activeCloakOfShadows(copy, 8000.1)).toBeUndefined();
  expect(activeCloakOfShadows({ ...copy, statuses: [paid, paid] }, 100)).toEqual(paidCloakOfShadows(20));
});
it('strips malformed carried payloads and rejects foreign/dead/extended/future effects', () => {
  for (const payload of [null, [], '20', {}, { ...paid.cloakOfShadows, extra: 1 },
    { ...paid.cloakOfShadows, rank: 21 }, { ...paid.cloakOfShadows, defensePct: 1 }]) {
    const input = { ...unit, statuses: [{ ...paid, cloakOfShadows: payload as NonNullable<ActiveStatus['cloakOfShadows']> }] };
    expect(copyCloakOfShadowsStatuses(input).statuses[0]?.cloakOfShadows).toBeUndefined();
    expect(activeCloakOfShadows(input, 100)).toBeUndefined();
  }
  for (const patch of [{ sourceId: 'other' }, { id: 'other' }, { appliedAtMs: NaN }, { expiresAtMs: 9000.1 }])
    expect(activeCloakOfShadows({ ...unit, statuses: [{ ...paid, ...patch }] }, 100)).toBeUndefined();
  for (const patch of [{ kind: 'merc' as const }, { side: 'enemy' as const }, { ownerId: 'other' },
    { summon: true }, { level: 11 }, { life: 0 }])
    expect(activeCloakOfShadows({ ...unit, ...patch }, 100)).toBeUndefined();
});
it('keeps Burst and Cloak payloads independent through both registration sanitizers', () => {
  const burst: ActiveStatus = { id: 'burst-of-speed', sourceId: 'hero', stacks: 1, remaining: 10,
    appliedAtMs: 0, expiresAtMs: 10000, statBuff: paidBurstOfSpeed(20) };
  const input = { ...unit, statuses: [paid, burst] };
  expect(copyBurstOfSpeedStatuses(copyCloakOfShadowsStatuses(input))).toEqual(input);
  expect(copyCloakOfShadowsStatuses(copyBurstOfSpeedStatuses(input))).toEqual(input);
});
it.each([0, 1, 2, 19, 20])('previews paid bonuses, Blind and finite duration at rank%i', rank => {
  const row = PLAYABLE_CLASS_SKILL_DATA.assassin.find(s => s.id === 'skills-assassin-cloak-of-shadows');
  if (!row) throw new Error('Missing authored Cloak');
  const model = computeSkillDisplayModel(row, rank);
  for (const stats of [model.current, model.next].filter(s => s !== undefined)) {
    expect(stats).toMatchObject({ cloak: { durationSeconds: 8, blindHitPenaltyPoints: 20 } });
    expect(stats.utility).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'defensePct', value: Number((.03 * stats.rank).toFixed(4)) }),
      expect.objectContaining({ id: 'critChancePct', value: .005 * stats.rank }),
      expect.objectContaining({ id: 'magicDodgePct', value: .005 * stats.rank })
    ]));
  }
  if (rank === 20) expect(model.next).toBeUndefined();
});
