import { afterEach, beforeEach, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { playerToCombatUnit } from './combatHelpers';
import { getSkill, loadDefaultSkills, registerSkill, resetRegistry } from '@/engine/skills/registry';
import { runBattle, runBattleRecorded, type CombatSnapshot } from '@/engine/combat/combat';
import type { CombatUnit } from '@/engine/combat/types';
import { composeFindItem } from '@/engine/skills/find-item';
import { useInventoryStore } from './inventoryStore';

const ID = 'barbarian.find_item';
function fixture(rank: number, body = false): CombatSnapshot {
  const player = { ...createMockPlayer('Synthetic corpse search', 'barbarian'), id: 'hero', level: 30,
    comboOrder: ['skills-barbarian-find-item'],
    skillLevels: { 'skills-barbarian-find-potion': 1, 'skills-barbarian-find-item': rank } };
  const hero = playerToCombatUnit(player), authority = composeFindItem(player);
  if (!authority) throw new Error('Missing native learned search authority');
  const stats = { ...hero.stats, life: 1000, lifeMax: 1000, mana: 100, manaMax: 100,
    attack: 1, defense: 0, magicResist: 0, physDodge: 0, magicDodge: 0, attackSpeed: 100,
    critChance: 0, resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } };
  const enemy: CombatUnit = { ...hero, id: 'survivor', name: 'survivor', kind: 'monster', side: 'enemy',
    stats: { ...stats, lifeMax: 100000 }, life: 100000, mana: 100, skillOrder: [], skillLevels: {},
    statuses: [{ id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1 }], activeBuffIds: [], cooldowns: {} };
  return { seed: 19, findItem: [authority], playerTeam: [{ ...hero, stats, life: 500, mana: 50,
    manaRegenPerSecond: 0, manaRegenBaselinePerSecond: 0,
    statuses: [{ id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1, appliedAtMs: 1701 }] }],
    enemyTeam: [enemy, ...(body ? [{ ...enemy, id: 'body', name: 'body', life: 1,
      statuses: [...enemy.statuses, { id: 'poison', sourceId: 'fixture', stacks: 1, remaining: -1,
        dotPerStack: 100, damageType: 'poison' as const }] }] : [])] };
}
beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { resetRegistry(); loadDefaultSkills(); });

for (const rank of [1, 2, 20]) it.each([7, 19, 41, 97])(`rank${String(rank)} skips without a real corpse, seed%i`, seed => {
  const input = { ...fixture(rank), seed }, before = structuredClone(input), out = runBattleRecorded(input);
  expect(input).toEqual(before);
  expect(out.events.filter(e => e.kind === 'death')).toEqual([]);
  expect(out.events.filter(e => e.kind === 'action' && e.skillId === ID)).toEqual([]);
  expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toEqual([]);
  expect(out.result.playerTeam[0]?.mana).toBe(50);
});

for (const [rank, cost] of [[1, 7], [2, 7], [20, 5]] as const) it.each([7, 19, 41, 97])(
  `rank${String(rank)} consumes a real body and pays${String(cost)}MP exactly once, seed%i`, seed => {
    const input = { ...fixture(rank, true), seed }, before = structuredClone(input);
    const inventory = useInventoryStore.getState(), out = runBattleRecorded(input);
    expect(input).toEqual(before); expect(useInventoryStore.getState()).toBe(inventory);
    expect(out.events.filter(e => e.kind === 'death' && e.target === 'body')).toEqual([
      expect.objectContaining({ simClockMs: 10 })]);
    expect(out.events.filter(e => e.kind === 'action' && e.skillId === ID)).toEqual([
      expect.objectContaining({ simClockMs: 1700 })]);
    const orbs = out.events.filter(e => e.kind === 'orb' && e.target === 'hero');
    const orbMana = orbs.reduce((sum, e) => sum + (e.kind === 'orb' && e.orb.kind === 'mp' ? 5 : 0), 0);
    expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toEqual([
      expect.objectContaining({ mana: 50 + orbMana - cost })]);
    expect(out.result.playerTeam[0]?.mana).toBe(50 + orbMana - cost);
    const feedback = out.events.filter(e => e.kind === 'message' &&
      ['combat:corpses.findItemSuccess', 'combat:corpses.findItemEmpty'].includes(e.messageKey));
    expect(feedback).toEqual([expect.objectContaining({ params: { count: 0, corpseId: 'body' } })]);
    const success = feedback[0]?.kind === 'message' && feedback[0].messageKey === 'combat:corpses.findItemSuccess';
    expect(out.result.findItemFinds ?? []).toEqual(success ? [{ sourceHeroId: 'hero', corpseId: 'body', rank }] : []);
    if (success) {
      expect(Object.isFrozen(out.result.findItemFinds)).toBe(true);
      expect(Object.isFrozen(out.result.findItemFinds?.[0])).toBe(true);
    }
    expect(out.result.enemyTeam.find(u => u.id === 'body')?.life).toBe(0);
    expect(runBattle(input)).toEqual(out.result); expect(runBattleRecorded(input)).toEqual(out);
  });

it('fixed finite seed cohort includes both a paid failed search and a paid successful search', () => {
  const results = Array.from({ length: 32 }, (_, seed) => seed).map(seed => {
    const out = runBattleRecorded({ ...fixture(20, true), seed });
    expect(out.events.filter(e => e.kind === 'action' && e.skillId === ID)).toHaveLength(1);
    expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toHaveLength(1);
    return (out.result.findItemFinds?.length ?? 0) === 1;
  });
  expect(results).toContain(true); expect(results).toContain(false);
});

it.each(['missing-authority', 'wrong-source', 'merc', 'summon', 'owner', 'dead', 'level-low'] as const)(
  'refuses %s source without payment or find', invalid => {
    const base = fixture(1, true), hero = base.playerTeam[0];
    if (!hero) throw new Error('Missing hero');
    const out = runBattleRecorded({ ...base,
      findItem: invalid === 'missing-authority' ? [] : [{ sourceHeroId: invalid === 'wrong-source' ? 'other' : 'hero', rank: 1 }],
      playerTeam: [{ ...hero, ...(invalid === 'merc' ? { kind: 'merc' as const } : {}),
        ...(invalid === 'summon' ? { summon: true } : {}), ...(invalid === 'owner' ? { ownerId: 'other' } : {}),
        ...(invalid === 'dead' ? { life: 0 } : {}), ...(invalid === 'level-low' ? { level: 11 } : {}) }] });
    expect(out.events.filter(e => e.kind === 'action' && e.skillId === ID)).toEqual([]);
    expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toEqual([]);
    expect(out.result.findItemFinds ?? []).toEqual([]);
  });

it.each(['initial-dead', 'summoned-body'] as const)('does not search %s', invalid => {
  const base = fixture(1, true);
  const out = runBattleRecorded({ ...base, enemyTeam: base.enemyTeam.map(u => u.id !== 'body' ? u : {
    ...u, ...(invalid === 'initial-dead' ? { life: 0 } : { summon: true, ownerId: 'survivor' }) }) });
  expect(out.events.filter(e => e.kind === 'action' && e.skillId === ID)).toEqual([]);
  expect(out.result.findItemFinds ?? []).toEqual([]);
});

it.each(['skills-barbarian-find-item', ID])('honors cooldown under alias%s', alias => {
  const base = fixture(1, true);
  const out = runBattleRecorded({ ...base, playerTeam: base.playerTeam.map(u => ({ ...u, cooldowns: { [alias]: 1701 } })) });
  expect(out.events.filter(e => e.kind === 'action' && e.skillId === ID)).toEqual([]);
  expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toEqual([]);
});

it.each([0, 1])('refuses unaffordable%iMP without searching', mana => {
  const base = fixture(1, true);
  const out = runBattleRecorded({ ...base, playerTeam: base.playerTeam.map(u => ({ ...u, mana })) });
  expect(out.events.filter(e => e.kind === 'action' && e.skillId === ID)).toEqual([]);
  expect(out.result.findItemFinds ?? []).toEqual([]);
});

it.each(['extra-effect', 'wrong-cost', 'startup', 'wrong-id'] as const)('refuses %s registry semantics', invalid => {
  const skill = getSkill(ID); if (!skill) throw new Error('Missing registered search');
  const modified = { ...skill, ...(invalid === 'extra-effect' ? { effects: [...skill.effects,
    { kind: 'heal' as const, target: 'self' as const, amount: 999 }] } : {}),
    ...(invalid === 'wrong-cost' ? { manaCost: 0 } : {}), ...(invalid === 'startup' ? { summonOnStart: true } : {}),
    ...(invalid === 'wrong-id' ? { id: 'fixture.other' } : {}) };
  registerSkill(modified);
  const base = fixture(1, true);
  const out = runBattleRecorded({ ...base, playerTeam: base.playerTeam.map(u => ({ ...u,
    ...(invalid === 'wrong-id' ? { skillOrder: [modified.id] } : {}) })) });
  expect(out.events.filter(e => e.kind === 'action' && e.skillId !== null)).toEqual([]);
  expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toEqual([]);
  expect(out.result.findItemFinds ?? []).toEqual([]);
});

it('empty-pool refusal preserves ordinary fallback attack RNG', () => {
  const input = fixture(1), out = runBattleRecorded(input);
  const fallback = runBattleRecorded({ ...input, playerTeam: input.playerTeam.map(u => ({ ...u, skillOrder: [] })) });
  expect(out.events).toEqual(fallback.events);
  expect(out.result.playerTeam.map(u => [u.life, u.mana])).toEqual(fallback.result.playerTeam.map(u => [u.life, u.mana]));
  expect(out.result.enemyTeam).toEqual(fallback.result.enemyTeam);
});

it.each(['search-first', 'recovery-first', 'explosion-first'] as const)('shares one body with other consumers: %s', order => {
  const base = fixture(1, true), hero = base.playerTeam[0]; if (!hero) throw new Error('Missing hero');
  const otherId = order === 'explosion-first' ? 'necromancer.corpse_explosion' : 'barbarian.find_potion';
  const other = { ...hero, id: 'other', skillOrder: [otherId] };
  const out = runBattleRecorded({ ...base, corpseExplosion: [{ sourceHeroId: 'other', rank: 1 }],
    findPotion: [{ sourceHeroId: 'other', rank: 1 }],
    playerTeam: order === 'search-first' ? [hero, other] : [other, hero] });
  expect(out.events.filter(e => e.kind === 'action' && e.skillId !== null)).toEqual([
    expect.objectContaining({ skillId: order === 'search-first' ? ID : otherId })]);
  expect(out.events.filter(e => e.kind === 'death' && e.target === 'body')).toHaveLength(1);
});

it('does not search after final-hostile death', () => {
  const base = fixture(1, true), out = runBattleRecorded({ ...base, enemyTeam: base.enemyTeam.filter(u => u.id === 'body') });
  expect(out.result.winner).toBe('player');
  expect(out.events.filter(e => e.kind === 'action' && e.skillId === ID)).toEqual([]);
  expect(out.result.findItemFinds ?? []).toEqual([]);
});

it.each([[1, 6800], [20, 5100]])('rank%i consumes FIFO at exact scheduled cooldown%sms', (rank, second) => {
  const base = fixture(rank, true), body = base.enemyTeam.find(u => u.id === 'body');
  if (!body) throw new Error('Missing body fixture');
  const out = runBattleRecorded({ ...base,
    playerTeam: base.playerTeam.map(u => ({ ...u, statuses: [{ id: 'stun', sourceId: 'fixture', stacks: 1,
      remaining: -1, appliedAtMs: 10001 }] })), enemyTeam: [...base.enemyTeam, { ...body, id: 'body2' }] });
  expect(out.events.filter(e => e.kind === 'action' && e.skillId === ID).map(e => e.simClockMs)).toEqual([1700, second]);
  expect(out.events.filter(e => e.kind === 'message' &&
    ['combat:corpses.findItemSuccess', 'combat:corpses.findItemEmpty'].includes(e.messageKey))
    .map(e => e.kind === 'message' ? e.params : undefined)).toEqual([{ count: 1, corpseId: 'body' }, { count: 0, corpseId: 'body2' }]);
});
