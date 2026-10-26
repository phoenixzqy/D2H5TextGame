import { afterEach, expect, it } from 'vitest';
import { runBattleRecorded } from '@/engine/combat/combat';
import { getSkill, loadDefaultSkills, registerSkill, resetRegistry } from '@/engine/skills/registry';
import type { RegisteredSkill } from '@/engine/skills/effects';
import type { ActiveStatus, CombatUnit } from '@/engine/combat/types';
const id = 'necromancer.bone_wall';
const hold: ActiveStatus = { id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1 };
function unit(side: CombatUnit['side'], patch: Partial<CombatUnit> = {}): CombatUnit {
  return { id: side === 'player' ? 'hero' : 'enemy', side, name: 'Synthetic barrier unit',
    kind: side === 'player' ? 'hero' : 'monster', level: 30, tier: 'trash', life: 100000, mana: 17,
    stats: { life: 100000, lifeMax: 100000, mana: 17, manaMax: 1000, attack: 100, defense: 0,
      magicResist: 0, attackSpeed: 250, critChance: 0, critDamage: 1.5, physDodge: 0, magicDodge: 0,
      magicFind: 0, goldFind: 0, resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } },
    statuses: [], cooldowns: {}, skillOrder: [], activeBuffIds: [], enraged: false, ...patch };
}
function scene(patch: Partial<CombatUnit> = {}) {
  return { seed: 7, playerTeam: [unit('player', { boneWallRank: 1, skillOrder: [id], ...patch })],
    enemyTeam: [unit('enemy', { statuses: [hold] })] };
}
afterEach(() => { resetRegistry(); loadDefaultSkills(); });
it.each([1, 20])('pays again only after the active barrier ends and cooldown clears from actual learned rank %i', rank => {
  const out = runBattleRecorded(scene({ boneWallRank: rank, mana: 1000 }));
  const casts = out.events.filter(e => e.kind === 'action' && e.actor === 'hero' && e.skillId === id);
  expect(casts.slice(0, 2).map(e => e.simClockMs)).toEqual([500, 6500]);
  const debit = out.events.find(e => e.kind === 'mana' && e.reason === 'cast');
  expect(debit).toMatchObject({ mana: rank === 1 ? 983 : 987 });
  expect(out.events.some(e => e.kind === 'status-state' && e.target === 'hero' && e.simClockMs === 500 &&
    e.statuses.some(s => s.id === 'bone-wall' && s.boneWall?.remaining === (rank === 1 ? 40 : 230) && s.expiresAtMs === 6500))).toBe(true);
});
it.each<Partial<CombatUnit>>([
  { boneWallRank: 0 }, { boneWallRank: -1 }, { boneWallRank: .5 },
  { boneWallRank: NaN }, { boneWallRank: Infinity }, { boneWallRank: 21 }, { level: 11 },
  { kind: 'merc' }, { kind: 'summon' }, { ownerId: 'other' }, { summonOwnerId: 'other' }, { mana: 16 }, { mana: NaN }
])('rejects ineligible cast without a debit or barrier %j', patch => {
  const out = runBattleRecorded(scene(patch));
  expect(out.events.some(e => e.kind === 'action' && e.skillId === id)).toBe(false);
  expect(out.events.some(e => e.kind === 'mana' && e.reason === 'cast')).toBe(false);
  expect(out.events.some(e => e.kind === 'status' && e.statusId === 'bone-wall')).toBe(false);
});
it.each<Partial<RegisteredSkill>>([
  { target: 'all-allies' }, { manaCost: 0 }, { cooldown: 1 }, { isBuff: false }, { minLevel: 1 },
  { archetype: 'sorceress' }, { maxTargets: 1 }, { effects: [{ kind: 'debuff', statusId: 'bone-wall' }] }
])('refuses contradictory registered Wall before spending mana %j', patch => {
  const original = getSkill(id); if (!original) throw new Error('Missing registered Wall');
  registerSkill({ ...original, ...patch });
  const out = runBattleRecorded(scene());
  expect(out.events.some(e => e.kind === 'action' && e.skillId === id)).toBe(false);
  expect(out.events.some(e => e.kind === 'mana' && e.reason === 'cast')).toBe(false);
});

it('does not infer learned permission from a combo or a bare Wall marker', () => {
  for (const activeBuffIds of [[], ['bone-wall']]) {
    const out = runBattleRecorded(scene({ boneWallRank: undefined, activeBuffIds }));
    expect(out.events.some(e => e.kind === 'action' && e.skillId === id)).toBe(false);
    expect(out.events.some(e => e.kind === 'mana' && e.reason === 'cast')).toBe(false);
  }
});
it.each([0, 20])('actual paid party Command boosts only learned Wall potency at rank%i', rank => {
  const commander = unit('player', { id: 'commander', mana: 1000, battleCommandRank: 1,
    skillOrder: ['barbarian.battle_command'], stats: { ...unit('player').stats, attackSpeed: 400 } });
  const out = runBattleRecorded({ seed: 7, playerTeam: [commander,
    unit('player', { boneWallRank: rank, mana: 1000, skillOrder: [id] })],
    enemyTeam: [unit('enemy', { statuses: [hold] })] });
  expect(out.events.some(e => e.kind === 'action' && e.actor === 'commander' &&
    e.skillId === 'barbarian.battle_command' && e.simClockMs === 400)).toBe(true);
  expect(out.events.some(e => e.kind === 'action' && e.actor === 'hero' && e.skillId === id)).toBe(rank > 0);
  if (rank > 0) expect(out.events.find(e => e.kind === 'status-state' && e.target === 'hero' && e.simClockMs === 500))
    .toMatchObject({ statuses: expect.arrayContaining([expect.objectContaining({ id: 'bone-wall',
      boneWall: { rank: 21, rankBonus: 1, remaining: 240 } })]) });
});
