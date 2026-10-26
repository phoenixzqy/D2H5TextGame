import { beforeEach, expect, it } from 'vitest';
import { hasBattleCommandCarry, runBattle, runBattleRecorded, type CombatSnapshot } from './combat';
import type { CombatUnit } from './types';
import { captureBattleCommandPassiveProfile } from '../skills/battle-command';
import { loadDefaultSkills, registerSkill, resetRegistry } from '../skills/registry';

const IRON = 'necromancer.iron_golem', HYDRA = 'sorceress.hydra';
const COMMAND = 'barbarian.battle_command', FINISH = 'fixture.iron-hydra-command-finish';

function unit(id: string, side: CombatUnit['side'] = 'player'): CombatUnit {
  return { id, name: id, side, kind: side === 'player' ? 'hero' : 'monster', level: 30,
    tier: 'trash', life: 1000000, mana: 100, skillOrder: [], skillLevels: {}, cooldowns: {},
    activeBuffIds: [], enraged: false,
    statuses: [{ id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1 }],
    stats: { life: 1000000, lifeMax: 1000000, mana: 100, manaMax: 1000,
      attack: 0, defense: 0, magicResist: 0, attackSpeed: 100, critChance: 0,
      critDamage: 1.5, physDodge: 0, magicDodge: 0, magicFind: 0, goldFind: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } } };
}

beforeEach(() => {
  resetRegistry(); loadDefaultSkills();
  registerSkill({ id: FINISH, archetype: 'fixture', target: 'all-enemies', minLevel: 1,
    cooldown: 60, manaCost: 0,
    effects: [{ kind: 'damage', damageType: 'fire', base: [2000000000, 2000000000] }] });
});

function paidCommand() {
  const base = unit('commander'), profile = captureBattleCommandPassiveProfile(base);
  const recipient = unit('hero');
  const out = runBattleRecorded({ seed: 7, playerTeam: [
    { ...base, mana: 11, statuses: [], battleCommandRank: 1, skillOrder: [COMMAND, FINISH],
      battleCommandPassives: { baseline: profile, boosted: profile } }, recipient],
    enemyTeam: [unit('first', 'enemy')] });
  expect(out.result.winner).toBe('player');
  expect(out.events.filter(e => e.kind === 'action' && e.skillId === COMMAND)).toHaveLength(1);
  expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast'))
    .toEqual([expect.objectContaining({ target: 'commander', mana: 0 })]);
  const carry = out.battleCommandCarry;
  if (!carry) throw new Error('Missing genuinely paid Command carry');
  expect(hasBattleCommandCarry(carry, recipient)).toBe(true);
  return carry;
}

function snapshot(skill: typeof IRON | typeof HYDRA, rank: number, mana = 100): CombatSnapshot {
  const hero: CombatUnit = { ...unit('hero'), mana, skillOrder: [skill],
    skillLevels: { [skill]: rank, ...(skill === IRON ? { 'necromancer.blood_golem': 1 } : {}) },
    ...(skill === HYDRA ? { hydraRank: rank } : {}) };
  return { seed: 19, playerTeam: [hero], enemyTeam: [unit('target', 'enemy')],
    ...(skill === IRON ? { ironGolem: { sourceHeroId: 'hero', sourceItemId: 'synthetic-metal',
      life: 0, attack: 8, defense: 0 } } : {}) };
}

function assertTargetHp(out: ReturnType<typeof runBattleRecorded>) {
  const damage = out.events.reduce((sum, e) => sum +
    ((e.kind === 'damage' || e.kind === 'dot') && e.target === 'target' ? e.amount : 0), 0);
  expect(damage).toBeGreaterThan(0);
  expect(out.result.enemyTeam[0]?.life).toBe(1000000 - damage);
}

it.each([[1, 276, 46], [6, 356, 56], [20, 580, 84]])(
  'captures paid Iron potency at learned rank%i for body HP and actual physical damage', (rank, life, attack) => {
    const carry = paidCommand(), input = snapshot(IRON, rank, 35), before = structuredClone(input);
    const control = runBattleRecorded(input), out = runBattleRecorded(input, carry);
    expect(input).toEqual(before);
    expect(runBattleRecorded(input, carry)).toEqual(out);
    expect(runBattle(input, carry)).toEqual(out.result);
    const base = control.events.find(e => e.kind === 'summon');
    expect(base?.unit.stats).toMatchObject({ lifeMax: life - 16, attack: attack - 2 });
    const fresh = out.events.filter(e => e.kind === 'summon');
    expect(fresh).toHaveLength(1);
    const body = fresh[0]?.unit;
    expect(body).toMatchObject({ life, stats: { lifeMax: life, attack } });
    const hits = out.events.filter(e => e.kind === 'damage' && e.source === body?.id);
    expect(hits.some(e => e.kind === 'damage' && !e.crit && !e.dodged && e.amount === attack)).toBe(true);
    expect(hits.some(e => e.kind === 'damage' && e.simClockMs > 8000 &&
      !e.crit && !e.dodged && e.amount === attack)).toBe(true);
    expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast'))
      .toEqual([expect.objectContaining({ target: 'hero', mana: 0, simClockMs: 0 })]);
    expect(out.result.ironGolemPreparation).toEqual({ sourceHeroId: 'hero', sourceItemId: 'synthetic-metal',
      skillId: IRON, spawnedUnitId: body?.id, paidMp: 35 });
    expect(out.battleCommandCarry).toBeUndefined();
    assertTargetHp(out);
  });

it.each([[1, 119], [20, 290]])('captures paid Hydra rank%i bolts beyond Command expiry', (rank, amount) => {
  const carry = paidCommand(), input = snapshot(HYDRA, rank, 40), before = structuredClone(input);
  const control = runBattleRecorded(input), out = runBattleRecorded(input, carry);
  expect(input).toEqual(before);
  expect(runBattleRecorded(input, carry)).toEqual(out);
  expect(runBattle(input, carry)).toEqual(out.result);
  const fresh = out.events.filter(e => e.kind === 'summon');
  expect(fresh).toHaveLength(1);
  const body = fresh[0]?.unit;
  const bolts = out.events.filter(e => e.kind === 'damage' && e.source === body?.id);
  const base = control.events.find(e => e.kind === 'damage' && e.source !== 'hero' && !e.crit && !e.dodged);
  expect(base).toMatchObject({ amount: amount - 9, damageType: 'fire' });
  expect(bolts.find(e => e.kind === 'damage' && !e.crit && !e.dodged))
    .toMatchObject({ amount, damageType: 'fire' });
  expect(bolts.some(e => e.simClockMs > 8000)).toBe(true);
  expect(bolts.every(e => e.kind === 'damage' && e.damageType === 'fire' && e.simClockMs < 10000)).toBe(true);
  const controlBolts = control.events.filter(e => e.kind === 'damage' && e.source === body?.id &&
    !e.crit && !e.dodged);
  const paidBolts = bolts.filter(e => e.kind === 'damage' && !e.crit && !e.dodged);
  expect(paidBolts.length).toBeGreaterThan(0);
  expect(paidBolts.map(e => e.kind === 'damage' ? e.amount : -1))
    .toEqual(controlBolts.map(e => e.kind === 'damage' ? e.amount + 9 : -1));
  expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast'))
    .toEqual([expect.objectContaining({ target: 'hero', mana: 0, simClockMs: 0 })]);
  assertTargetHp(out);
});

it.each([IRON, HYDRA] as const)('preserves %s MAX alias authority before adding the paid bonus', skill => {
  const input = snapshot(skill, 1), hero = input.playerTeam[0];
  if (!hero) throw new Error('Missing owner');
  const alias = skill === IRON ? 'skills-necromancer-iron-golem' : 'skills-sorceress-hydra';
  const out = runBattleRecorded({ ...input, playerTeam: [{ ...hero,
    skillOrder: [skill, alias, skill], skillLevels: { ...hero.skillLevels, [alias]: 20 },
    ...(skill === HYDRA ? { hydraRank: 20 } : {}) }] }, paidCommand());
  const fresh = out.events.filter(e => e.kind === 'summon');
  expect(fresh).toHaveLength(1);
  if (skill === IRON) expect(fresh[0]?.unit.stats).toMatchObject({ lifeMax: 580, attack: 84 });
  else expect(out.events.find(e => e.kind === 'damage' && e.source === fresh[0]?.unit.id && !e.crit && !e.dodged))
    .toMatchObject({ amount: 290, damageType: 'fire' });
  expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toHaveLength(1);
});

it.each([IRON, HYDRA] as const)('does not let paid Command authorize allocated21 for %s', skill => {
  const out = runBattleRecorded(snapshot(skill, 21), paidCommand());
  expect(out.events.filter(e => e.kind === 'summon' || e.kind === 'mana')).toEqual([]);
  expect(out.result.ironGolemPreparation).toBeUndefined();
});

it.each([[IRON, 34], [HYDRA, 39]] as const)('does not create or attest %s with only%iMP', (skill, mana) => {
  const out = runBattleRecorded(snapshot(skill, 20, mana), paidCommand());
  expect(out.events.filter(e => e.kind === 'summon' || e.kind === 'mana')).toEqual([]);
  expect(out.result.playerTeam[0]?.mana).toBe(mana);
  expect(out.result.ironGolemPreparation).toBeUndefined();
});

it.each([IRON, HYDRA] as const)('ignores copied carry and imported Command markers for %s', skill => {
  const input = snapshot(skill, 20), hero = input.playerTeam[0];
  if (!hero) throw new Error('Missing owner');
  const marked = { ...input, playerTeam: [{ ...hero, activeBuffIds: ['battle-command'],
    statuses: [...hero.statuses, { id: 'battle-command', sourceId: 'commander', stacks: 1, remaining: -1 }] }] };
  const control = runBattleRecorded(marked), paid = paidCommand();
  for (const carry of [structuredClone(paid), JSON.parse(JSON.stringify(paid)) as typeof paid]) {
    expect(hasBattleCommandCarry(carry, hero)).toBe(false);
    expect(runBattleRecorded(marked, carry)).toEqual(control);
  }
  const body = control.events.find(e => e.kind === 'summon')?.unit;
  if (skill === IRON) expect(body?.stats).toMatchObject({ lifeMax: 564, attack: 82 });
  else expect(control.events.find(e => e.kind === 'damage' && e.source === body?.id && !e.crit && !e.dodged))
    .toMatchObject({ amount: 281, damageType: 'fire' });
});
