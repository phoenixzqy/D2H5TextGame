import { beforeEach, expect, it } from 'vitest';
import { hasBattleCommandCarry, runBattle, runBattleRecorded } from './combat';
import type { CombatUnit } from './types';
import { captureBattleCommandPassiveProfile } from '../skills/battle-command';
import { loadDefaultSkills, registerSkill, resetRegistry } from '../skills/registry';

const MAGE = 'necromancer.raise_skeletal_mage';
const COMMAND = 'barbarian.battle_command';
const FINISH = 'fixture.mage-command-finish';
const CYCLE = ['fire', 'cold', 'lightning', 'poison'] as const;

function unit(id: string, side: CombatUnit['side']): CombatUnit {
  return { id, name: id, side, kind: side === 'player' ? 'hero' : 'monster', level: 30,
    tier: 'trash', life: 1000000, mana: 22, skillOrder: [], skillLevels: {}, cooldowns: {},
    activeBuffIds: [], enraged: false,
    statuses: [{ id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1 }],
    stats: { life: 1000000, lifeMax: 1000000, mana: 22, manaMax: 1000,
      attack: 0, defense: 0, magicResist: 0, attackSpeed: 100, critChance: 0,
      critDamage: 1.5, physDodge: 0, magicDodge: 0, magicFind: 0, goldFind: 0,
      resistances: { physical: 75, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } } };
}

beforeEach(() => {
  resetRegistry(); loadDefaultSkills();
  registerSkill({ id: FINISH, archetype: 'fixture', target: 'all-enemies', minLevel: 1,
    cooldown: 60, manaCost: 0,
    effects: [{ kind: 'damage', damageType: 'fire', base: [2000000000, 2000000000] }] });
});

function paidCommand() {
  const base = unit('commander', 'player');
  const profile = captureBattleCommandPassiveProfile(base);
  const commander: CombatUnit = { ...base, mana: 11, statuses: [], battleCommandRank: 1,
    skillOrder: [COMMAND, FINISH], battleCommandPassives: { baseline: profile, boosted: profile } };
  const recipient = unit('hero', 'player');
  const input = { seed: 7, playerTeam: [commander, recipient], enemyTeam: [unit('first', 'enemy')] };
  const before = structuredClone(input), out = runBattleRecorded(input);
  expect(input).toEqual(before);
  expect(out.result.winner).toBe('player');
  expect(out.events.filter(e => e.kind === 'action' && e.skillId === COMMAND)).toHaveLength(1);
  expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast'))
    .toEqual([expect.objectContaining({ target: 'commander', mana: 0 })]);
  const carry = out.battleCommandCarry;
  if (!carry) throw new Error('Missing genuinely paid Command carry');
  expect(hasBattleCommandCarry(carry, recipient)).toBe(true);
  return carry;
}

it.each([[1, 2, 95, 33], [6, 4, 130, 48], [20, 9, 228, 90]] as const)(
  'keeps elemental identity and paid potency at learned rank%i with next-wave Command',
  (rank, count, life, attack) => {
    const carry = paidCommand();
    const snapshot = { seed: 19, playerTeam: [{ ...unit('hero', 'player'),
      skillOrder: [MAGE], skillLevels: { [MAGE]: rank } }], enemyTeam: [unit('target', 'enemy')] };
    const before = structuredClone(snapshot), out = runBattleRecorded(snapshot, carry);
    expect(snapshot).toEqual(before);
    expect(runBattleRecorded(snapshot, carry)).toEqual(out);
    expect(runBattle(snapshot, carry)).toEqual(out.result);
    const fresh = out.events.filter(e => e.kind === 'summon');
    expect(fresh).toHaveLength(count);
    expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast'))
      .toEqual([expect.objectContaining({ target: 'hero', mana: 0, simClockMs: 0 })]);
    fresh.forEach((event, i) => {
      expect(event.unit).toMatchObject({ life, stats: { lifeMax: life, attack } });
      const hits = out.events.filter(e => e.kind === 'damage' && e.source === event.unit.id);
      expect(hits.length).toBeGreaterThan(0);
      expect([...new Set(hits.map(e => e.kind === 'damage' ? e.damageType : 'invalid'))])
        .toEqual([CYCLE[i % CYCLE.length]]);
      expect(hits.some(e => e.kind === 'damage' && !e.dodged && !e.crit && e.amount === attack)).toBe(true);
      expect(hits.some(e => e.simClockMs > 8000)).toBe(true);
    });
    const dealt = out.events.reduce((sum, e) => sum +
      (e.kind === 'damage' && e.target === 'target' ? e.amount : 0), 0);
    expect(out.result.enemyTeam[0]?.life).toBe(1000000 - dealt);
    expect(out.battleCommandCarry).toBeUndefined();
  });

it.each(['absent', 'structured-copy', 'json-copy'] as const)(
  'keeps learned rank20 capacity and potency with %s Command proof', method => {
    const paid = paidCommand();
    const carry = method === 'absent' ? undefined : method === 'structured-copy'
      ? structuredClone(paid) : JSON.parse(JSON.stringify(paid)) as typeof paid;
    const hero = { ...unit('hero', 'player'), skillOrder: [MAGE], skillLevels: { [MAGE]: 20 },
      activeBuffIds: ['battle-command'], statuses: [...unit('hero', 'player').statuses,
        { id: 'battle-command', sourceId: 'commander', stacks: 1, remaining: -1 }] };
    const out = runBattleRecorded({ seed: 19, playerTeam: [hero], enemyTeam: [unit('target', 'enemy')] }, carry);
    const fresh = out.events.filter(e => e.kind === 'summon');
    expect(fresh).toHaveLength(8);
    fresh.forEach((event, i) => {
      expect(event.unit).toMatchObject({ life: 221, stats: { attack: 87 } });
      const hits = out.events.filter(e => e.kind === 'damage' && e.source === event.unit.id);
      expect(hits.length).toBeGreaterThan(0);
      expect(hits.every(e => e.kind === 'damage' && e.damageType === CYCLE[i % CYCLE.length])).toBe(true);
    });
  });

it.each([21, 22, Infinity])('still refuses invalid learned rank%s with genuine Command carry', rank => {
  const out = runBattleRecorded({ seed: 19, playerTeam: [{ ...unit('hero', 'player'),
    skillOrder: [MAGE], skillLevels: { [MAGE]: rank } }], enemyTeam: [unit('target', 'enemy')] }, paidCommand());
  expect(out.events.filter(e => e.kind === 'summon' || e.kind === 'mana')).toEqual([]);
  expect(out.result.playerTeam[0]?.mana).toBe(22);
});

it('cannot grant elemental authority to a fractional learned rank through Command', () => {
  const out = runBattleRecorded({ seed: 19, playerTeam: [{ ...unit('hero', 'player'),
    skillOrder: [MAGE], skillLevels: { [MAGE]: 1.5 } }], enemyTeam: [unit('target', 'enemy')] }, paidCommand());
  const fresh = out.events.filter(e => e.kind === 'summon');
  expect(fresh).toHaveLength(2); // Preserve legacy generic preparation without elemental provenance.
  for (const event of fresh) {
    const hits = out.events.filter(e => e.kind === 'damage' && e.source === event.unit.id);
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.every(e => e.kind === 'damage' && e.damageType === 'physical')).toBe(true);
  }
});

it('does not pay, retry or create a partial boosted rank20 batch at21MP', () => {
  const out = runBattleRecorded({ seed: 19, playerTeam: [{ ...unit('hero', 'player'), mana: 21,
    skillOrder: [MAGE], skillLevels: { [MAGE]: 20 } }], enemyTeam: [unit('target', 'enemy')] }, paidCommand());
  expect(out.events.filter(e => e.kind === 'summon' || e.kind === 'mana')).toEqual([]);
  expect(out.result.playerTeam[0]?.mana).toBe(21);
});

it.each([
  ['druid.raven', 'raven', 'blind'],
  ['druid.poison_creeper', 'poison_creeper', 'poison'],
  ['necromancer.fire_golem', 'fire_golem', 'burn']
] as const)('retains the paid %s body effect after Command expires', (skill, template, status) => {
  const owner: CombatUnit = { ...unit('hero', 'player'), mana: 100,
    skillOrder: [skill], skillLevels: { [skill]: 1 },
    ...(template === 'fire_golem' ? { fireGolemRank: 1 } : { druidSummonRanks: { [template]: 1 } }) };
  const snapshot = { seed: 19, playerTeam: [owner], enemyTeam: [unit('target', 'enemy')] };
  const control = runBattleRecorded(snapshot);
  expect(control.events.some(e => e.kind === 'status' && e.statusId === status)).toBe(true);
  const out = runBattleRecorded(snapshot, paidCommand());
  const fresh = out.events.filter(e => e.kind === 'summon');
  expect(fresh.length).toBeGreaterThan(0);
  const ids = new Set(fresh.map(e => e.unit.id));
  const statuses = out.events.filter(e => e.kind === 'status' && e.target === 'target' && e.statusId === status);
  expect(statuses.length).toBeGreaterThan(0);
  expect(statuses.some(e => e.simClockMs > 8000)).toBe(true);
  expect(out.events.some(e => e.kind === 'status-state' && e.target === 'target' &&
    e.statuses.some(s => s.id === (status === 'burn' ? 'ignite' : status) && ids.has(s.sourceId)))).toBe(true);
});

it.each(['druid.raven', 'druid.summon_spirit_wolf', 'druid.summon_dire_wolf', 'necromancer.revive'])(
  'uses the authored effective21 count curve for %s without accepting learned21', skill => {
    for (const rank of [20, 21]) {
      const owner = { ...unit('hero', 'player'), mana: 100,
        skillOrder: [skill], skillLevels: { [skill]: rank } };
      const out = runBattleRecorded({ seed: 19, playerTeam: [owner], enemyTeam: [unit('target', 'enemy')] }, paidCommand());
      expect(out.events.filter(e => e.kind === 'summon')).toHaveLength(rank === 20 ? 9 : 0);
      expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toHaveLength(rank === 20 ? 1 : 0);
    }
  });
