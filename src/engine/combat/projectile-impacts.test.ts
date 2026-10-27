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
