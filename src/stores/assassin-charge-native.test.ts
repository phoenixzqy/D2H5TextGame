import { afterEach, beforeEach, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { runBattle, runBattleRecorded, type CombatSnapshot } from '@/engine/combat/combat';
import type { ActiveStatus, CombatUnit } from '@/engine/combat/types';
import { loadDefaultSkills, resetRegistry } from '@/engine/skills/registry';
import { playerToCombatUnit } from '@/stores/combatHelpers';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { useFormationStore } from '@/stores/formationStore';
const TIGER = 'skills-assassin-tiger-strike', TALON = 'skills-assassin-dragon-talon';
const hold = (appliedAtMs = 0): ActiveStatus => ({ id: 'stun', sourceId: 'constructed-hold', stacks: 1, remaining: -1, appliedAtMs });
function fixture(rank: number, withCharge = true): CombatSnapshot {
  const native = playerToCombatUnit({ ...createMockPlayer('Constructed charges', 'assassin'),
    id: 'hero', level: 30, comboOrder: withCharge ? [TIGER, TALON] : [TALON],
    skillLevels: { 'assassin.tiger_strike': rank, 'assassin.dragon_talon': rank } });
  const hero: CombatUnit = { ...native, life: 2000, mana: 100,
    manaRegenPerSecond: 0, manaRegenBaselinePerSecond: 0, statuses: [hold(6801)],
    stats: { ...native.stats, lifeMax: 2000, manaMax: 100, attackSpeed: 100, attack: 100,
      defense: 0, magicResist: 0, physDodge: 0, magicDodge: 0, critChance: 0, critDamage: 2,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0 } } };
  const target: CombatUnit = { id: 'target', name: 'Constructed target', side: 'enemy', kind: 'monster',
    tier: 'trash', level: 30, life: 99999, mana: 0, stats: { ...hero.stats, lifeMax: 99999 },
    cooldowns: {}, activeBuffIds: [], skillOrder: [], statuses: [hold()], enraged: false };
  return { seed: 7, playerTeam: [hero], enemyTeam: [target] };
}
beforeEach(() => { useInventoryStore.getState().reset(); useMapStore.getState().reset();
  useFormationStore.getState().reset(); resetRegistry(); loadDefaultSkills(); });
afterEach(() => { resetRegistry(); loadDefaultSkills(); });
it.each([1, 20])('native rank%i builds three Tiger charges then actually casts the configured Talon finisher', rank => {
  const input = fixture(rank), before = structuredClone(input), out = runBattleRecorded(input);
  expect(input).toEqual(before); expect(runBattleRecorded(input)).toEqual(out); expect(runBattle(input)).toEqual(out.result);
  const actions = out.events.filter(e => e.kind === 'action').filter(e => e.actor === 'hero');
  expect.soft(actions.map(e => e.skillId)).toEqual(['assassin.tiger_strike', 'assassin.tiger_strike', 'assassin.tiger_strike', 'assassin.dragon_talon']);
  expect.soft(actions.map(e => e.simClockMs)).toEqual([1700, 3400, 5100, 6800]);
  const finish = out.events.filter(e => e.kind === 'damage').filter(e => e.source === 'hero' && e.simClockMs === 6800);
  expect.soft(finish).toHaveLength(4); // Three original kick attempts plus one consumed Tiger discharge.
  expect.soft(finish.every(e => e.damageType === 'physical')).toBe(true);
  expect.soft(finish.reduce((n, e) => n + e.amount, 0)).toBeGreaterThan(3 * (40 + 4 * (rank - 1)));
  expect.soft(out.result.playerTeam[0]?.mana).toBe(87);
});
it('uncharged Talon control retains three paid independent attempts per action', () => {
  const out = runBattleRecorded(fixture(1, false));
  expect(out.events.filter(e => e.kind === 'action').filter(e => e.actor === 'hero').map(e => e.skillId)).toEqual(Array(4).fill('assassin.dragon_talon'));
  expect(out.events.filter(e => e.kind === 'damage').filter(e => e.source === 'hero')).toHaveLength(12);
  expect(out.result.playerTeam[0]?.mana).toBe(84);
});

const families = ['tiger_strike', 'fists_of_fire', 'cobra_strike', 'claws_of_thunder', 'blades_of_ice', 'phoenix_strike'] as const;
function martialFixture(slug: typeof families[number], rank = 1): CombatSnapshot {
  const base = fixture(rank), first = base.playerTeam[0], target = base.enemyTeam[0];
  if (!first || !target) throw new Error('Missing fixture');
  const names = [...families, 'dragon_talon', 'dragon_claw', 'dragon_tail', 'dragon_flight'];
  const levels = Object.fromEntries(names.map(name => ['assassin.' + name, name === slug ? rank : 1]));
  const native = playerToCombatUnit({ ...createMockPlayer('Constructed family', 'assassin'), id: 'hero', level: 30,
    comboOrder: ['skills-assassin-' + slug.replaceAll('_','-'), TALON], skillLevels: levels });
  return { ...base, playerTeam: [{ ...first, ...native, life: 1000, mana: 1000, stats: { ...first.stats, manaMax: 1000 },
    manaRegenPerSecond: 0, manaRegenBaselinePerSecond: 0, statuses: [hold(13601)] }], enemyTeam: [{ ...target, mana: 500, stats: { ...target.stats, manaMax: 500 } }] };
}
for (const slug of families) for (const rank of [1,20])
  it(`native ${slug} rank${String(rank)} produces actual finisher payoff from paid owned charges`, () => {
    const input = martialFixture(slug, rank), before = structuredClone(input), out = runBattleRecorded(input);
    expect(input).toEqual(before); expect(runBattleRecorded(input)).toEqual(out);
    const finisher = out.events.find(e => e.kind === 'action' && e.actor === 'hero' && e.skillId === 'assassin.dragon_talon');
    expect(finisher).toBeDefined(); if (!finisher) throw new Error('Missing finisher');
    const hits = out.events.filter(e => e.kind === 'damage').filter(e => e.source === 'hero' && e.simClockMs === finisher.simClockMs);
    if (slug === 'cobra_strike') {
      expect(hits).toHaveLength(3);
      const transfers = out.events.filter(e => e.kind === 'mana').filter(e => e.reason === 'cobra-strike');
      expect(transfers.length).toBeGreaterThanOrEqual(2);
      const victim = transfers.find(e => e.target === 'target'), owner = transfers.find(e => e.target === 'hero');
      expect(victim?.mana).toBeLessThan(500); expect(owner?.mana).toBeGreaterThan(987);
      expect(out.events.some(e => e.kind === 'heal' && e.target === 'hero' && e.amount > 0)).toBe(true);
    } else {
      expect(hits).toHaveLength(slug === 'phoenix_strike' ? 6 : 4);
      const expected = slug === 'tiger_strike' ? ['physical'] : slug === 'fists_of_fire' ? ['fire'] :
        slug === 'claws_of_thunder' ? ['lightning'] : slug === 'blades_of_ice' ? ['cold'] : ['fire','cold','lightning'];
      expect(hits.slice(1,1+expected.length).map(e => e.damageType)).toEqual(expected);
      expect(hits.slice(1,1+expected.length).every(e => e.amount > 0)).toBe(true);
    }
  });
it.each([3,6,9])('mana%i permits only paid Tiger stacks, then one free basic discharge', mana => {
  const input = fixture(1), hero = input.playerTeam[0]; if (!hero) throw new Error('Missing hero');
  const out = runBattleRecorded({ ...input, playerTeam: [{ ...hero, mana, statuses: [hold(8501)] }] });
  const charged = mana / 3, actions = out.events.filter(e => e.kind === 'action').filter(e => e.actor === 'hero');
  expect(actions.slice(0,charged).every(e => e.skillId === 'assassin.tiger_strike')).toBe(true);
  expect(actions.slice(charged).every(e => e.skillId === null)).toBe(true);
  const basic = actions[charged]; if (!basic) throw new Error('Missing basic discharge');
  expect(out.events.filter(e => e.kind === 'damage').filter(e => e.source === 'hero' && e.simClockMs === basic.simClockMs)).toHaveLength(2);
  expect(out.result.playerTeam[0]?.mana).toBe(0);
  expect(out.events.filter(e => e.kind === 'mana').filter(e => e.reason === 'cast')).toHaveLength(charged);
});
it('a missed paid Tiger hit grants no free basic discharge', () => {
  const input = fixture(1), hero = input.playerTeam[0]; if (!hero) throw new Error('Missing hero');
  const out = runBattleRecorded({ ...input, seed: 41, playerTeam: [{ ...hero, mana: 3, statuses: [hold(3401)] }] });
  expect(out.events.find(e => e.kind === 'damage' && e.simClockMs === 1700)).toMatchObject({ amount: 0, dodged: true });
  expect(out.events.filter(e => e.kind === 'damage').filter(e => e.source === 'hero' && e.simClockMs === 3400)).toHaveLength(1);
});
it('preloaded charge-looking statuses confer no paid power', () => {
  const input = fixture(1,false), hero = input.playerTeam[0]; if (!hero) throw new Error('Missing hero');
  const out = runBattleRecorded({ ...input, playerTeam: [{ ...hero,
    statuses: [...hero.statuses,{ id: 'tiger-strike', sourceId: 'hero', stacks: 3, remaining: 15, appliedAtMs: 0, expiresAtMs: 15000 }] }] });
  expect(out.events.filter(e => e.kind === 'damage').filter(e => e.source === 'hero')).toHaveLength(12);
});
it('native charge authority is captured independently of later player allocation mutation', () => {
  const player = { ...createMockPlayer('Captured', 'assassin'), id: 'hero', level: 30,
    comboOrder: [TIGER,TALON], skillLevels: { 'assassin.tiger_strike': 1, 'assassin.dragon_talon': 1 } };
  const unit = playerToCombatUnit(player); player.skillLevels['assassin.tiger_strike'] = 20; player.comboOrder.length = 0;
  expect(unit.assassinMartialRanks).toEqual({ 'assassin.tiger_strike': 1, 'assassin.dragon_talon': 1 });
});
it('actual paid Warrior owns its own native charge/finisher sequence', () => {
  const base = fixture(1), first = base.playerTeam[0]; if (!first) throw new Error('Missing fixture');
  const native = playerToCombatUnit({ ...createMockPlayer('Warrior charges', 'assassin'), id: 'hero', level: 30,
    comboOrder: ['skills-assassin-shadow-warrior',TIGER,TALON], skillLevels: { 'assassin.claw_mastery': 1,
      'assassin.weapon_block': 1, 'assassin.shadow_warrior': 1, 'assassin.tiger_strike': 1, 'assassin.dragon_talon': 1 } });
  const out = runBattleRecorded({ ...base, playerTeam: [{ ...first,...native, mana: 22, stats: first.stats,
    life: 2000, manaRegenPerSecond: 0, manaRegenBaselinePerSecond: 0, statuses: [hold()] }] });
  const spawn = out.events.find(e => e.kind === 'summon' && e.summonId === 'shadow_warrior');
  if (!spawn || spawn.kind !== 'summon') throw new Error('Missing actual paid shadow');
  const finisher = out.events.find(e => e.kind === 'action' && e.actor === spawn.unit.id && e.skillId === 'assassin.dragon_talon');
  expect(finisher).toBeDefined(); if (!finisher) throw new Error('Missing shadow finisher');
  expect(out.events.filter(e => e.kind === 'damage').filter(e => e.source === spawn.unit.id && e.simClockMs === finisher.simClockMs)).toHaveLength(4);
  expect(out.result.playerTeam.find(u => u.id === 'hero')?.mana).toBe(0);
});
