import { afterEach, beforeEach, expect, it } from 'vitest';
import { runBattle, runBattleRecorded, type CombatSnapshot } from './combat';
import type { ActiveStatus, CombatUnit } from './types';
import { getSkill, loadDefaultSkills, registerSkill, resetRegistry } from '../skills/registry';
const hold = (start = 0): ActiveStatus => ({ id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1, appliedAtMs: start });
function unit(id: string, side: CombatUnit['side']): CombatUnit {
 return { id, name: id, side, kind: side === 'player' ? 'hero' : 'monster', level: 30, tier: 'trash', life: 10000, mana: 100,
 stats: { life: 10000, lifeMax: 10000, mana: 100, manaMax: 100, attack: 1, defense: 0, magicResist: 0,
 attackSpeed: side === 'player' ? 50 : 100, critChance: 0, critDamage: 2, physDodge: 0, magicDodge: 0, magicFind: 0, goldFind: 0,
 resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0 } },
 statuses: side === 'player' ? [hold(2001)] : [], cooldowns: {}, skillOrder: side === 'player' ? ['amazon.slow_missiles'] : ['fixture.flight'],
 ...(side === 'player' ? { slowMissilesRank: 1, skillLevels: { 'amazon.slow_missiles': 1 } } : {}), activeBuffIds: [], enraged: false };
}
function snapshot(): CombatSnapshot { return { seed: 7, playerTeam: [unit('hero', 'player')], enemyTeam: [unit('archer', 'enemy')] }; }
function record(input: CombatSnapshot) {
 const before = structuredClone(input), out = runBattleRecorded(input);
 expect(runBattleRecorded(input)).toEqual(out); expect(runBattle(input)).toEqual(out.result); expect(input).toEqual(before); return out;
}
function shots(out: ReturnType<typeof record>) { return out.events.filter(e => e.kind === 'damage' && e.source === 'archer' && e.amount === 100); }
beforeEach(() => {
 resetRegistry(); loadDefaultSkills();
 registerSkill({ id: 'fixture.flight', archetype: 'fixture', target: 'single-enemy', minLevel: 1, cooldown: 1, manaCost: 0,
 effects: [{ kind: 'damage', damageType: 'physical', base: [100, 100], alwaysHits: true, projectileFlightMs: 500 }] });
});
afterEach(() => { resetRegistry(); loadDefaultSkills(); });
it('integrates mid-flight onset and exact expiry without changing launches', () => {
 const out = record(snapshot());
 expect(shots(out).slice(0, 5).map(e => e.simClockMs)).toEqual([2607, 4916, 6616, 8104, 9000]);
 expect(out.events.filter(e => e.kind === 'action' && e.actor === 'archer').slice(0, 5).map(e => e.simClockMs))
 .toEqual([1700, 3400, 5100, 6800, 8500]);
 expect(out.events.filter(e => e.kind === 'mana' && e.target === 'hero' && e.reason === 'cast')).toHaveLength(1);
});
it.each([
 ['amazon.slow_missiles', 1], ['amazon.slow_missiles', 20],
 ['skills-amazon-slow-missiles', 1], ['skills-amazon-slow-missiles', 20]
] as const)('uses offense during a paid window and pays again only at expiry: %s rank%i', (id, rank) => {
 registerSkill({ id: 'fixture.strike', archetype: 'fixture', target: 'single-enemy', minLevel: 1, cooldown: 1, manaCost: 0,
 effects: [{ kind: 'damage', damageType: 'physical', base: [1, 1], alwaysHits: true }] });
 const hero = { ...unit('hero', 'player'), statuses: [], slowMissilesRank: rank,
 skillLevels: { [id]: rank }, skillOrder: [id, 'fixture.strike'] };
 const out = record({ seed: 7, playerTeam: [hero], enemyTeam: [unit('archer', 'enemy'),
 { ...unit('melee', 'enemy'), skillOrder: [], statuses: [hold()] }] });
 const actions = out.events.filter(e => e.kind === 'action' && e.actor === 'hero');
 expect(actions.slice(0, 7).map(e => [e.simClockMs, e.kind === 'action' && e.skillId])).toEqual([
 [2000, 'amazon.slow_missiles'], [4000, 'fixture.strike'], [6000, 'fixture.strike'], [8000, 'amazon.slow_missiles'],
 [10000, 'fixture.strike'], [12000, 'fixture.strike'], [14000, 'amazon.slow_missiles']
 ]);
 const casts = actions.filter(e => e.kind === 'action' && e.skillId === 'amazon.slow_missiles');
 expect(casts.map(e => e.simClockMs)).toEqual([2000, 8000, 14000, 20000, 26000, 32000, 38000, 44000, 50000, 56000]);
 const cost = rank === 1 ? 10 : 8;
 const paid = out.events.filter(e => e.kind === 'mana' && e.target === 'hero' && e.reason === 'cast' &&
 casts.some(cast => cast.simClockMs === e.simClockMs));
 expect(paid).toHaveLength(casts.length);
 for (const [index, event] of paid.entries()) {
  expect(event.kind === 'mana' && event.mana).toBeCloseTo(100 - (index + 1) * cost, 10);
 }
 expect(out.result.playerTeam[0]?.mana).toBeCloseTo(100 - casts.length * cost, 10);
 for (const target of ['archer', 'melee']) {
  expect(out.events.filter(e => e.kind === 'status' && e.target === target && e.statusId === 'slow-missiles'))
   .toHaveLength(casts.length);
 }
});
it('does not let an imported visible Slow Missiles marker suppress a paid cast', () => {
 const archer = unit('archer', 'enemy');
 const out = record({ ...snapshot(), enemyTeam: [{ ...archer, statuses: [
 { id: 'slow-missiles', sourceId: 'hero', stacks: 1, remaining: 60, appliedAtMs: 0, expiresAtMs: 60000 }
 ] }] });
 expect(out.events.find(e => e.kind === 'action' && e.skillId === 'amazon.slow_missiles')?.simClockMs).toBe(2000);
 expect(out.events.find(e => e.kind === 'mana' && e.reason === 'cast' && e.target === 'hero'))
 .toMatchObject({ mana: 90, simClockMs: 2000 });
 expect(shots(out)[0]?.simClockMs).toBe(2607);
});
it('covers a newly spawned opponent before the previous window expires', () => {
 registerSkill({ id: 'fixture.spawn', archetype: 'fixture', target: 'self', minLevel: 1, cooldown: 60, manaCost: 0,
 effects: [{ kind: 'summon', summonId: 'minion', maxCount: 1 }] });
 const hero = { ...unit('hero', 'player'), statuses: [] };
 const summoner = { ...unit('archer', 'enemy'), skillOrder: ['fixture.spawn'], cooldowns: { 'fixture.spawn': 3500 } };
 const out = record({ seed: 7, playerTeam: [hero], enemyTeam: [summoner] });
 const spawn = out.events.find(e => e.kind === 'summon');
 expect(spawn).toMatchObject({ owner: 'archer', simClockMs: 5100 });
 expect(out.events.filter(e => e.kind === 'action' && e.skillId === 'amazon.slow_missiles')
 .slice(0, 3).map(e => e.simClockMs)).toEqual([2000, 6000, 12000]);
 if (!spawn) throw new Error('Expected native spawned opponent');
 expect(out.events.find(e => e.kind === 'status' && e.target === spawn.unit.id && e.statusId === 'slow-missiles'))
 .toMatchObject({ simClockMs: 6000 });
});
it('keeps already-fired slowed shots after source death without reviving or healing it', () => {
 const input = snapshot(), archer = unit('archer', 'enemy');
 const poison: ActiveStatus = { id: 'poison', sourceId: 'fixture', stacks: 1, remaining: 3, appliedAtMs: 0, expiresAtMs: 3000, dotPerStack: 50, damageType: 'poison' };
 const out = record({ ...input, enemyTeam: [{ ...archer, life: 105, stats: { ...archer.stats, life: 105, lifeMax: 105 }, statuses: [poison] },
 { ...unit('reserve', 'enemy'), statuses: [hold()], skillOrder: [] }] });
 expect(out.events.find(e => e.kind === 'death' && e.target === 'archer')?.simClockMs).toBe(2100);
 expect(shots(out).map(e => e.simClockMs)).toEqual([2607]);
 expect(out.result.enemyTeam.find(u => u.id === 'archer')?.life).toBe(0);
 expect(out.events.some(e => e.kind === 'heal' && e.target === 'archer')).toBe(false);
});
it('discards a dead original target without retargeting its queued shot', () => {
 const hero = { ...unit('hero', 'player'), statuses: [hold()] }, merc = { ...unit('merc', 'player'), kind: 'merc' as const,
 life: 95, statuses: [hold(), { id: 'poison', sourceId: 'fixture', stacks: 1, remaining: 3, appliedAtMs: 0, expiresAtMs: 3000, dotPerStack: 50, damageType: 'poison' as const }], skillOrder: [] };
 const archer = { ...unit('archer', 'enemy'), statuses: [{ id: 'taunt', sourceId: 'merc', stacks: 1, remaining: 5, appliedAtMs: 0, expiresAtMs: 5000 }] };
 const out = record({ seed: 7, playerTeam: [hero, merc], enemyTeam: [archer] });
 expect(out.events.find(e => e.kind === 'death' && e.target === 'merc')?.simClockMs).toBe(1900);
 expect(shots(out).some(e => e.simClockMs === 2200)).toBe(false);
 expect(shots(out)[0]).toMatchObject({ target: 'hero', simClockMs: 3900 });
});
it('uses a real barrier paid between launch and impact at the actual impact clock', () => {
 const input = snapshot(), hero = { ...unit('hero', 'player'), boneWallRank: 1,
 skillOrder: ['necromancer.bone_wall'], skillLevels: { 'necromancer.bone_wall': 1 } };
 const out = record({ ...input, playerTeam: [hero] });
 expect(out.events.find(e => e.kind === 'action' && e.skillId === 'necromancer.bone_wall')?.simClockMs).toBe(2000);
 expect(out.events.find(e => e.kind === 'damage' && e.source === 'archer'))
 .toMatchObject({ simClockMs: 2200, amount: 60, wallAbsorbed: 40 });
});
it('discards remaining shots immediately when the final enemy dies', () => {
 registerSkill({ id: 'fixture.finish', archetype: 'fixture', target: 'single-enemy', minLevel: 1, cooldown: 1, manaCost: 0,
 effects: [{ kind: 'damage', damageType: 'physical', base: [20000, 20000], alwaysHits: true }] });
 const input = snapshot(), out = record({ ...input, playerTeam: [{ ...unit('hero', 'player'), skillOrder: ['fixture.finish'] }] });
 expect(out.result.winner).toBe('player'); expect(out.events.at(-1)).toMatchObject({ kind: 'end', simClockMs: 2000 });
 expect(shots(out)).toEqual([]);
});

it('refuses forged free, zero-CD or retuned cost/CD runtime definitions', () => {
 const skill = getSkill('amazon.slow_missiles'); if (!skill) throw new Error('Missing Slow Missiles');
 for (const patch of [{ manaCost: 0 }, { cooldown: 0 }, { manaCostPerRank: 0 }, { cooldownPerRank: 0 }]) {
  registerSkill({ ...skill, ...patch });
  const out = record(snapshot());
  expect(out.events.some(e => e.kind === 'action' && e.skillId === 'amazon.slow_missiles')).toBe(false);
  expect(shots(out)[0]?.simClockMs).toBe(2200);
 }
});

it('uses the same finite travel speed for trash, elite, boss and chapter boss', () => {
 for (const tier of ['trash', 'elite', 'boss', 'chapter-boss'] as const) {
  const out = record({ ...snapshot(), enemyTeam: [{ ...unit('archer', 'enemy'), tier }] });
  expect(shots(out)[0]?.simClockMs).toBe(2607);
  expect(out.events.flatMap(e => e.kind === 'status-state' && e.target === 'archer'
   ? e.statuses.filter(s => s.id === 'slow-missiles') : [])[0]?.expiresAtMs).toBe(8000);
 }
});
it('settles an impact exactly at60s and discards a flight still pending after the deadline', () => {
 for (const cooldown of [59500, 59600]) {
  const archer = unit('archer', 'enemy');
  const out = record({ seed: 7, playerTeam: [{ ...unit('hero', 'player'), statuses: [hold()] }],
   enemyTeam: [{ ...archer, stats: { ...archer.stats, attackSpeed: 250 }, cooldowns: { 'fixture.flight': cooldown } }] });
  expect(out.result.winner).toBeNull();
  expect(shots(out).map(e => e.simClockMs)).toEqual(cooldown === 59500 ? [60000] : []);
  expect(out.events.at(-1)).toMatchObject({ kind: 'end', simClockMs: 60000 });
 }
});
