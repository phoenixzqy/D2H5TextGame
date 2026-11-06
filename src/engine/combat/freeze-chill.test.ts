import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getSkill, loadDefaultSkills, resetRegistry } from '../skills/registry';
import { runBattle, runBattleRecorded, type CombatSnapshot } from './combat';
import type { CombatUnit, MonsterTier } from './types';

const skills = [
  { id: 'skills-sorceress-ice-blast', minLevel: 6, mana: 12, damage: [45, 65], growth: 4 },
  { id: 'skills-sorceress-glacial-spike', minLevel: 18, mana: 20, damage: [55, 80], growth: 5 },
  { id: 'skills-amazon-ice-arrow', minLevel: 18, mana: 15, damage: [55, 80], growth: 5 }
] as const;
type SkillCase = typeof skills[number];
const hold = (appliedAtMs = 0) => ({ id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1, appliedAtMs });

function unit(id: string, side: CombatUnit['side'], speed = 100): CombatUnit {
  return { id, name: id, side, kind: side === 'player' ? 'hero' : 'monster', level: 30, tier: 'trash',
    life: 1000, mana: 100,
    stats: { life: 1000, lifeMax: 1000, mana: 100, manaMax: 100, attack: 1, defense: 0, magicResist: 0,
      attackSpeed: speed, critChance: 0, critDamage: 2, physDodge: 0, magicDodge: 0,
      magicFind: 0, goldFind: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } },
    statuses: [], cooldowns: {}, skillOrder: [], activeBuffIds: [], enraged: false };
}

/** Constructed engine fixture; one native cast, without skill replacement or earned-state claims. */
function snapshot(skill: SkillCase, rank = 1, tier: MonsterTier = 'trash', seed = 5): CombatSnapshot {
  return { seed, playerTeam: [{ ...unit('hero', 'player', 263), mana: skill.mana,
    skillOrder: [skill.id], skillLevels: { [skill.id]: rank }, statuses: [hold(401)] }],
  enemyTeam: [{ ...unit('target', 'enemy'), tier, statuses: [hold()] }] };
}

function replay(input: CombatSnapshot) {
  const before = structuredClone(input), result = runBattleRecorded(input);
  expect(runBattle(input)).toEqual(result.result);
  expect(runBattleRecorded(input)).toEqual(result);
  expect(input).toEqual(before);
  return result;
}

beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { resetRegistry(); loadDefaultSkills(); });

describe.each(skills)('BUG165 actual $id', skill => {
  for (const tier of ['trash', 'boss', 'chapter-boss'] as const) {
    it.each([1, 20])(`rank %s applies one hit then Freeze/Chill to ${tier} with exact expiry`, rank => {
      const result = replay(snapshot(skill, rank, tier));
      const hits = result.events.filter(e => e.kind === 'damage' && e.source === 'hero');
      expect(hits).toEqual([expect.objectContaining({ target: 'target', damageType: 'cold',
        amount: Math.floor(skill.damage[0] + (skill.damage[1] - skill.damage[0] + 1) * 0.7727432732935995) +
          (rank - 1) * skill.growth, dodged: false, simClockMs: 400 })]);
      expect(result.events.filter(e => e.kind === 'status').map(e => [e.simClockMs, e.statusId]))
        .toEqual([[400, 'freeze'], [400, 'chill']]);
      const views = result.events.flatMap(e => e.kind === 'status-state' && e.target === 'target' ? [e] : []);
      expect(views.map(e => [e.simClockMs, e.statuses.map(s => s.id)])).toEqual([
        [0, ['stun']], [400, ['stun', 'freeze']], [400, ['stun', 'freeze', 'chill']],
        [tier === 'trash' ? 1400 : 900, ['stun', 'chill']], [2400, ['stun']]
      ]);
      expect(views[2]?.statuses.find(s => s.id === 'freeze')).toMatchObject({
        appliedAtMs: 400, expiresAtMs: tier === 'trash' ? 1400 : 900
      });
      expect(views[2]?.statuses.find(s => s.id === 'chill')).toMatchObject({
        appliedAtMs: 400, expiresAtMs: 2400
      });
      expect(result.result.playerTeam[0]?.mana).toBe(0);
      expect(result.events.filter(e => e.kind === 'dot')).toEqual([]);
    });
  }

  it('slows real enemy actions after Freeze expires, then restores the normal cadence', () => {
    const input = snapshot(skill);
    const result = replay({ ...input, enemyTeam: [{ ...unit('target', 'enemy'), statuses: [hold(5001)] }] });
    const actions = result.events.filter(e => e.kind === 'action' && e.actor === 'target');
    expect(actions).toHaveLength(2);
    expect(actions[0]?.simClockMs).toBeCloseTo(32800 / 17, 8);
    expect(actions[1]?.simClockMs).toBe(3700);
  });

  it('does not apply either status on a natural seeded miss', () => {
    const result = replay(snapshot(skill, 1, 'trash', 4));
    expect(result.events.filter(e => e.kind === 'damage' && e.source === 'hero'))
      .toEqual([expect.objectContaining({ amount: 0, dodged: true })]);
    expect(result.events.filter(e => e.kind === 'status')).toEqual([]);
    expect(result.result.enemyTeam[0]?.life).toBe(1000);
    expect(result.result.playerTeam[0]?.mana).toBe(0);
  });

  it('keeps both hit effects before death finalization and excludes an already dead target', () => {
    const input = snapshot(skill);
    const result = replay({ ...input, enemyTeam: [{ ...unit('dead', 'enemy'), life: 0 },
      { ...unit('target', 'enemy'), life: 1, statuses: [hold()] }] });
    expect(result.events.filter(e => e.kind === 'damage' || e.kind === 'status' || e.kind === 'death')
      .map(e => e.kind === 'status' ? [e.kind, e.target, e.statusId] : [e.kind, e.target]))
      .toEqual([['damage', 'target'], ['status', 'target', 'freeze'], ['status', 'target', 'chill'], ['death', 'target']]);
  });

  it('preserves the existing rank-one fallback for direct legacy engine callers', () => {
    const input = snapshot(skill), hero = input.playerTeam[0];
    if (!hero) throw new Error('Missing caster');
    const legacy = replay({ ...input, playerTeam: [{ ...hero, skillLevels: {} }] }), explicit = replay(input);
    expect(legacy.events).toEqual(explicit.events);
    expect(legacy.result.enemyTeam).toEqual(explicit.result.enemyTeam);
  });

  it.each(['mana', 'level', 'cooldown'] as const)('keeps the existing %s cast refusal', reason => {
    const input = snapshot(skill), registered = getSkill(skill.id);
    if (!registered) throw new Error('Missing actual skill');
    const hero = input.playerTeam[0];
    if (!hero) throw new Error('Missing caster');
    const patch = reason === 'mana' ? { mana: skill.mana - 1 }
      : reason === 'level' ? { level: skill.minLevel - 1 }
      : { cooldowns: { [registered.id]: 5000 } };
    const result = replay({ ...input, playerTeam: [{ ...hero, ...patch }] });
    expect(result.events.filter(e => e.kind === 'status')).toEqual([]);
    expect(result.events.filter(e => e.kind === 'action' && e.actor === 'hero'))
      .toEqual([expect.objectContaining({ skillId: null })]);
  });
});

it('finishes Glacial Spike in hostile insertion order within its existing two-target limit', () => {
  const skill = skills[1], input = snapshot(skill);
  const result = replay({ ...input, enemyTeam: [
    { ...unit('first', 'enemy'), statuses: [hold()] },
    { ...unit('summon', 'enemy'), kind: 'summon', statuses: [hold()] },
    { ...unit('last', 'enemy'), statuses: [hold()] }
  ] });
  expect(result.events.filter(e => e.kind === 'damage' || e.kind === 'status')
    .map(e => e.kind === 'status' ? [e.target, e.statusId] : [e.target, 'hit']))
    .toEqual(['first', 'summon'].flatMap(id => [[id, 'hit'], [id, 'freeze'], [id, 'chill']]));
  expect(result.result.enemyTeam.find(target => target.id === 'last')?.life).toBe(1000);
});
