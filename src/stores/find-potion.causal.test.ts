import { afterEach, beforeEach, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { playerToCombatUnit } from './combatHelpers';
import { getSkill, loadDefaultSkills, registerSkill, resetRegistry } from '@/engine/skills/registry';
import { runBattle, runBattleRecorded, type CombatSnapshot } from '@/engine/combat/combat';
import type { CombatUnit } from '@/engine/combat/types';
import { composeFindPotion, findPotionRecovery } from '@/engine/skills/find-potion';
import { useCombatStore } from './combatStore';

const ID = 'barbarian.find_potion';
function fixture(rank: number, body: boolean): CombatSnapshot {
  const player = { ...createMockPlayer('Synthetic recovery', 'barbarian'),
    id: 'hero', level: 30, comboOrder: ['skills-barbarian-find-potion'],
    skillLevels: { 'skills-barbarian-find-potion': rank } };
  const hero = playerToCombatUnit(player), authority = composeFindPotion(player);
  if (!authority) throw new Error('Missing native learned recovery authority');
  const stats = { ...hero.stats, life: 1000, lifeMax: 1000, mana: 100, manaMax: 100,
    attack: 1, defense: 0, magicResist: 0, physDodge: 0, magicDodge: 0, attackSpeed: 100,
    critChance: 0, resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } };
  const enemy: CombatUnit = { ...hero, id: 'survivor', name: 'survivor', kind: 'monster', side: 'enemy',
    stats: { ...stats, lifeMax: 100000 }, life: 100000, mana: 100, skillOrder: [], skillLevels: {},
    statuses: [{ id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1 }], activeBuffIds: [], cooldowns: {} };
  return { seed: 19, findPotion: [authority], playerTeam: [{ ...hero, stats, life: 500, mana: 50,
    manaRegenPerSecond: 0, manaRegenBaselinePerSecond: 0,
    statuses: [{ id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1, appliedAtMs: 1701 }] }],
    enemyTeam: [enemy, ...(body ? [{ ...enemy, id: 'body', name: 'body', life: 1,
      statuses: [...enemy.statuses, { id: 'poison', sourceId: 'fixture', stacks: 1, remaining: -1,
        dotPerStack: 100, damageType: 'poison' as const }] }] : [])] };
}

beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { useCombatStore.getState().reset(); resetRegistry(); loadDefaultSkills(); });

for (const rank of [1, 2, 20]) it.each([7, 19, 41, 97])(`learned rank${String(rank)} skips without a corpse, seed%i`, seed => {
  const input = { ...fixture(rank, false), seed }, before = structuredClone(input), out = runBattleRecorded(input);
  expect(input).toEqual(before);
  expect(out.events.filter(e => e.kind === 'death')).toEqual([]);
  expect(out.events.filter(e => e.kind === 'action' && e.skillId === ID)).toEqual([]);
  expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toEqual([]);
  expect(out.result.playerTeam[0]?.mana).toBe(50);
});

for (const [rank, hp, mp] of [[1, 100, 5], [2, 105, 5], [20, 195, 9]] as const) it.each([7, 19, 41, 97])(
  `rank${String(rank)} consumes one body and restores ${String(hp)}HP/${String(mp)}MP after one2MP payment, seed%i`, seed => {
    const input = { ...fixture(rank, true), seed }, before = structuredClone(input), out = runBattleRecorded(input);
    expect(input).toEqual(before);
    expect(out.events.filter(e => e.kind === 'death' && e.target === 'body')).toHaveLength(1);
    expect(out.events.filter(e => e.kind === 'action' && e.skillId === ID)).toHaveLength(1);
    expect(out.events.filter(e => e.kind === 'heal' && e.target === 'hero')).toEqual([
      expect.objectContaining({ amount: hp })]);
    const orbs = out.events.filter(e => e.kind === 'orb' && e.target === 'hero');
    const orbLife = orbs.reduce((sum, e) => sum + (e.kind === 'orb' && e.orb.kind === 'hp' ? 50 : 0), 0);
    const orbMana = orbs.reduce((sum, e) => sum + (e.kind === 'orb' && e.orb.kind === 'mp' ? 5 : 0), 0);
    expect(out.result.playerTeam[0]?.life).toBe(500 + orbLife + hp);
    expect(out.result.playerTeam[0]?.mana).toBe(50 + orbMana - 2 + mp);
    expect(out.events.filter(e => e.kind === 'message' && e.messageKey === 'combat:corpses.consumedFindPotion')).toEqual([
      expect.objectContaining({ params: { count: 0, corpseId: 'body' } })]);
  });

it('repeats exactly, preserves inputs and plays actual HP/MP gains once', () => {
  const input = fixture(20, true), before = structuredClone(input), out = runBattleRecorded(input);
  expect(runBattle(input)).toEqual(out.result); expect(runBattleRecorded(input)).toEqual(out);
  expect(input).toEqual(before);
  useCombatStore.getState().setRecordedBattle({ initialPlayerTeam: input.playerTeam, initialEnemyTeam: input.enemyTeam,
    unitNameMap: new Map([...input.playerTeam, ...input.enemyTeam].map(u => [u.id, u.name])),
    events: out.events, outcome: { winner: out.result.winner,
      finalPlayerTeam: out.result.playerTeam, finalEnemyTeam: out.result.enemyTeam } });
  for (const _event of out.events) useCombatStore.getState().advanceEvent();
  expect(useCombatStore.getState().playbackComplete).toBe(true);
  expect(useCombatStore.getState().playerTeam.map(u => [u.id, u.life, u.mana]))
    .toEqual(out.result.playerTeam.map(u => [u.id, u.life, u.mana]));
});

it.each(['missing-authority', 'wrong-source', 'merc', 'summon', 'owner', 'dead', 'level-zero'] as const)(
  'does not pay or recover with %s runtime authority', invalid => {
    const base = fixture(1, true), hero = base.playerTeam[0];
    if (!hero) throw new Error('Missing hero');
    const input: CombatSnapshot = { ...base,
      findPotion: invalid === 'missing-authority' ? [] : [{ sourceHeroId: invalid === 'wrong-source' ? 'other' : 'hero', rank: 1 }],
      playerTeam: [{ ...hero, ...(invalid === 'merc' ? { kind: 'merc' as const } : {}),
        ...(invalid === 'summon' ? { summon: true } : {}), ...(invalid === 'owner' ? { ownerId: 'other' } : {}),
        ...(invalid === 'dead' ? { life: 0 } : {}), ...(invalid === 'level-zero' ? { level: 0 } : {}) }] };
    const out = runBattleRecorded(input);
    expect(out.events.filter(e => e.kind === 'action' && e.skillId === ID)).toEqual([]);
    expect(out.events.filter(e => e.kind === 'heal')).toEqual([]);
    expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toEqual([]);
  });

it.each(['initial-dead', 'summoned-body'] as const)('does not use %s as eligible corpse supply', invalid => {
  const base = fixture(1, true);
  const out = runBattleRecorded({ ...base, enemyTeam: base.enemyTeam.map(u => u.id !== 'body' ? u : {
    ...u, ...(invalid === 'initial-dead' ? { life: 0 } : { summon: true, ownerId: 'survivor' }) }) });
  expect(out.events.filter(e => e.kind === 'action' && e.skillId === ID)).toEqual([]);
  expect(out.events.filter(e => e.kind === 'message' && e.messageKey === 'combat:corpses.available')).toEqual([]);
});

it.each(['skills-barbarian-find-potion', ID])('honors active cooldown under alias %s', alias => {
  const base = fixture(1, true);
  const out = runBattleRecorded({ ...base, playerTeam: base.playerTeam.map(u => ({ ...u, cooldowns: { [alias]: 1701 } })) });
  expect(out.events.filter(e => e.kind === 'action' && e.skillId === ID)).toEqual([]);
  expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toEqual([]);
});

it.each([0, 1])('refuses unaffordable %iMP without spending a body', mana => {
  const base = fixture(1, true);
  const out = runBattleRecorded({ ...base, playerTeam: base.playerTeam.map(u => ({ ...u, mana })) });
  expect(out.events.filter(e => e.kind === 'action' && e.skillId === ID)).toEqual([]);
  expect(out.events.filter(e => e.kind === 'message' && e.messageKey === 'combat:corpses.consumedFindPotion')).toEqual([]);
});

it('does not spend a body to merely refund the mana cost at full pools', () => {
  const base = fixture(1, true);
  const out = runBattleRecorded({ ...base, playerTeam: base.playerTeam.map(u => ({ ...u, life: 1000, mana: 100 })) });
  expect(out.events.filter(e => e.kind === 'action' && e.skillId === ID)).toEqual([]);
  expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toEqual([]);
  expect(out.result.playerTeam[0]?.life).toBe(1000); expect(out.result.playerTeam[0]?.mana).toBe(100);
});

it('two eligible heroes compete for one actual body without duplicated recovery or death', () => {
  const base = fixture(1, true), hero = base.playerTeam[0];
  if (!hero) throw new Error('Missing hero');
  const out = runBattleRecorded({ ...base, findPotion: [{ sourceHeroId: 'hero', rank: 1 }, { sourceHeroId: 'second', rank: 20 }],
    playerTeam: [hero, { ...hero, id: 'second' }] });
  expect(out.events.filter(e => e.kind === 'death' && e.target === 'body')).toHaveLength(1);
  expect(out.events.filter(e => e.kind === 'action' && e.skillId === ID)).toEqual([
    expect.objectContaining({ actor: 'hero' })]);
  expect(out.events.filter(e => e.kind === 'heal')).toEqual([expect.objectContaining({ target: 'hero', amount: 100 })]);
});

it('refused empty-pool selection preserves ordinary fallback attack RNG', () => {
  const input = fixture(1, false), out = runBattleRecorded(input);
  const fallback = runBattleRecorded({ ...input, playerTeam: input.playerTeam.map(u => ({ ...u, skillOrder: [] })) });
  expect(out.events).toEqual(fallback.events);
  expect(out.result.playerTeam.map(u => [u.life, u.mana])).toEqual(fallback.result.playerTeam.map(u => [u.life, u.mana]));
});

it.each(['extra-effect', 'wrong-cost', 'startup', 'wrong-id'] as const)('refuses %s registered semantics before payment', invalid => {
  const skill = getSkill(ID);
  if (!skill) throw new Error('Missing registered recovery');
  const modified = { ...skill, ...(invalid === 'extra-effect' ? { effects: [...skill.effects,
    { kind: 'heal' as const, target: 'self' as const, amount: 999 }] } : {}),
    ...(invalid === 'wrong-cost' ? { manaCost: 0 } : {}), ...(invalid === 'startup' ? { summonOnStart: true } : {}),
    ...(invalid === 'wrong-id' ? { id: 'fixture.other' } : {}) };
  registerSkill(modified);
  const base = fixture(1, true);
  const out = runBattleRecorded({ ...base, playerTeam: base.playerTeam.map(u => ({ ...u,
    ...(invalid === 'wrong-id' ? { skillOrder: [modified.id] } : {}) })) });
  expect(out.events.filter(e => e.kind === 'action' && e.skillId !== null)).toEqual([]);
  expect(out.events.filter(e => e.kind === 'heal')).toEqual([]);
  expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toEqual([]);
});

it.each([
  [500, 50, 100, 1, { life: 100, mana: 5 }],
  [999, 99, 100, 1, { life: 1, mana: 3 }],
  [1000, 99, 100, 1, { life: 0, mana: 3 }],
  [1000, 100, 100, 1, undefined],
  [1000, 9, 10, 1, undefined],
  [500, 2, 100, 20, { life: 195, mana: 9 }],
  [500, 1, 100, 1, undefined],
  [0, 50, 100, 1, undefined],
  [1001, 50, 100, 1, undefined],
  [500, NaN, 100, 1, undefined],
  [500, 50, Infinity, 1, undefined],
  [500, 50, 100, 21, undefined],
] as const)('stages exact finite capped/useful gain at HP%s MP%s/%s rank%s', (life, mana, manaMax, rank, expected) => {
  const hero = fixture(1, true).playerTeam[0];
  if (!hero) throw new Error('Missing hero');
  const input = { ...hero, life, mana, stats: { ...hero.stats, manaMax } }, before = structuredClone(input);
  expect(findPotionRecovery(input, rank)).toEqual(expected); expect(input).toEqual(before);
});

it.each(['recovery-first', 'explosion-first'] as const)('shares the same FIFO with Corpse Explosion: %s', order => {
  const base = fixture(1, true), hero = base.playerTeam[0];
  if (!hero) throw new Error('Missing hero');
  const necro = { ...hero, id: 'necro', skillOrder: ['necromancer.corpse_explosion'] };
  const out = runBattleRecorded({ ...base, corpseExplosion: [{ sourceHeroId: 'necro', rank: 1 }],
    playerTeam: order === 'recovery-first' ? [hero, necro] : [necro, hero] });
  const casts = out.events.filter(e => e.kind === 'action' && e.skillId !== null);
  expect(casts).toHaveLength(1);
  expect(casts[0]).toMatchObject({ skillId: order === 'recovery-first' ? ID : 'necromancer.corpse_explosion' });
  expect(out.result.enemyTeam.some(u => u.id === 'body' && u.life === 0)).toBe(true);
  expect(out.events.filter(e => e.kind === 'death' && e.target === 'body')).toHaveLength(1);
});

it('does not take a bonus recovery action after final-enemy death ends combat', () => {
  const base = fixture(1, true), out = runBattleRecorded({ ...base, enemyTeam: base.enemyTeam.filter(u => u.id === 'body') });
  expect(out.result.winner).toBe('player');
  expect(out.events.filter(e => e.kind === 'action' && e.skillId === ID)).toEqual([]);
  expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toEqual([]);
});

it.each([[1, 6800], [20, 5100]])('rank%i waits until the next scheduled opportunity after cooldown, second cast%sms', (rank, second) => {
  const base = fixture(rank, true), body = base.enemyTeam.find(u => u.id === 'body');
  if (!body) throw new Error('Missing body fixture');
  const out = runBattleRecorded({ ...base,
    playerTeam: base.playerTeam.map(u => ({ ...u, statuses: [{ id: 'stun', sourceId: 'fixture', stacks: 1,
      remaining: -1, appliedAtMs: 10001 }] })), enemyTeam: [...base.enemyTeam, { ...body, id: 'body2' }] });
  expect(out.events.filter(e => e.kind === 'action' && e.skillId === ID).map(e => e.simClockMs)).toEqual([1700, second]);
  expect(out.events.filter(e => e.kind === 'message' && e.messageKey === 'combat:corpses.consumedFindPotion')
    .map(e => e.kind === 'message' ? e.params : undefined)).toEqual([{ count: 1, corpseId: 'body' }, { count: 0, corpseId: 'body2' }]);
  expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toHaveLength(2);
});
