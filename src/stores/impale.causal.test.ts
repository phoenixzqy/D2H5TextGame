import { afterEach, beforeEach, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { runBattle, runBattleRecorded, type CombatSnapshot } from '@/engine/combat/combat';
import type { ActiveStatus, CombatUnit } from '@/engine/combat/types';
import { loadDefaultSkills, resetRegistry } from '@/engine/skills/registry';
import { playerToCombatUnit } from './combatHelpers';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useFormationStore } from './formationStore';

const ID = 'skills-amazon-impale', CANONICAL = 'amazon.impale';
const levels = { 'amazon.jab': 1, 'amazon.power_strike': 1, [CANONICAL]: 1 };
const hold = (appliedAtMs = 0, expiresAtMs?: number): ActiveStatus => ({
  id: 'stun', sourceId: 'synthetic-hold', stacks: 1, remaining: -1, appliedAtMs,
  ...(expiresAtMs === undefined ? {} : { expiresAtMs })
});
function fixture(rank = 1, defense = 0, seed = 7): CombatSnapshot {
  const native = playerToCombatUnit({ ...createMockPlayer('Synthetic Impale', 'amazon'),
    id: 'hero', level: 30, comboOrder: [ID], skillLevels: { ...levels, [CANONICAL]: rank } });
  const hero: CombatUnit = { ...native, life: 2000, mana: 10,
    manaRegenPerSecond: 0, manaRegenBaselinePerSecond: 0, statuses: [hold(1701)],
    stats: { ...native.stats, lifeMax: 2000, manaMax: 100, attackSpeed: 100,
      attack: 100, defense: 0, magicResist: 0, physDodge: 0, magicDodge: 0, critChance: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0 } } };
  const target: CombatUnit = { id: 'target', name: 'Synthetic target', side: 'enemy', kind: 'monster',
    tier: 'trash', level: 30, life: 2000, mana: 0, stats: { ...hero.stats, defense },
    cooldowns: {}, activeBuffIds: [], skillOrder: [], statuses: [hold()], enraged: false };
  return { seed, playerTeam: [hero], enemyTeam: [target] };
}
function record(input: CombatSnapshot) {
  const before = structuredClone(input), out = runBattleRecorded(input);
  expect(input).toEqual(before); expect(runBattleRecorded(input)).toEqual(out);
  expect(runBattle(input)).toEqual(out.result); return out;
}
beforeEach(() => { useInventoryStore.getState().reset(); useMapStore.getState().reset();
  useFormationStore.getState().reset(); resetRegistry(); loadDefaultSkills(); });
afterEach(() => { resetRegistry(); loadDefaultSkills(); });

for (const defense of [0, 100, 500]) {
  it.each([1, 2, 20])(`BUG202 native rank%i bypasses Defense${String(defense)} and removes real Bleed HP`, rank => {
    const input = fixture(rank, defense), targetLife = rank === 20 ? 10000 : 2000;
    const out = record({ ...input, enemyTeam: input.enemyTeam.map(u => ({ ...u, life: targetLife,
      stats: { ...u.stats, lifeMax: targetLife } })) }), direct = 77 + 150 * (rank - 1);
    expect(out.events.filter(e => e.kind === 'action')).toEqual([
      expect.objectContaining({ actor: 'hero', skillId: CANONICAL, simClockMs: 1700 })]);
    expect(out.events.filter(e => e.kind === 'damage')).toEqual([
      expect.objectContaining({ source: 'hero', target: 'target', amount: direct, dodged: false, crit: false })]);
    expect(out.events.filter(e => e.kind === 'status')).toEqual([
      expect.objectContaining({ target: 'target', statusId: 'bleed', simClockMs: 1700 })]);
    const dots = out.events.filter(e => e.kind === 'dot');
    expect(dots.reduce((sum, e) => sum + e.amount, 0)).toBe(Math.floor(direct * .1) * 3);
    expect(out.result.enemyTeam[0]?.life).toBe(targetLife - direct - Math.floor(direct * .1) * 3);
    expect(out.result.playerTeam[0]?.mana).toBe(0);
  });
}
it.each([7, 19, 41, 97])('keeps hit rolls and entire combat identical across target Defense (seed%i)', seed => {
  for (const rank of [1, 20]) {
    const zero = record(fixture(rank, 0, seed));
    for (const defense of [100, 500]) {
      const armored = record(fixture(rank, defense, seed));
      expect(armored.events).toEqual(zero.events);
      expect(armored.result.enemyTeam[0]?.life).toBe(zero.result.enemyTeam[0]?.life);
      expect(armored.result.enemyTeam[0]?.stats.defense).toBe(defense);
    }
  }
});
it('retains ordinary Jab Defense mitigation with no inherited bypass or Bleed', () => {
  const hits = [0, 100, 500].map(defense => {
    const input = fixture(1, defense), out = record({ ...input,
      playerTeam: input.playerTeam.map(u => ({ ...u, skillOrder: ['skills-amazon-jab'] })) });
    expect(out.events.filter(e => e.kind === 'status' || e.kind === 'dot')).toEqual([]);
    return out.events.filter(e => e.kind === 'damage').map(e => e.amount);
  });
  expect(hits[0]).toEqual([30, 38, 33]); expect(hits[1]).toEqual([1, 1, 1]); expect(hits[2]).toEqual([1, 1, 1]);
});
it('pays a missed attempt without Bleed or periodic HP loss', () => {
  const out = record(fixture(20, 500, 41));
  expect(out.events.filter(e => e.kind === 'damage')).toEqual([expect.objectContaining({ amount: 0, dodged: true })]);
  expect(out.events.filter(e => e.kind === 'status' || e.kind === 'dot')).toEqual([]);
  expect(out.result.enemyTeam[0]?.life).toBe(2000); expect(out.result.playerTeam[0]?.mana).toBe(0);
});
it('captures resistance, increased damage and critical once; weapon Attack and flat MR do not add damage', () => {
  const input = fixture(1, 500), out = record({ ...input,
    playerTeam: input.playerTeam.map(u => ({ ...u, increasedDamagePct: { physical: 1 },
      stats: { ...u.stats, critChance: 1, critDamage: 1.5, attack: 10000 } })),
    enemyTeam: input.enemyTeam.map(u => ({ ...u, stats: { ...u.stats, magicResist: 10000,
      resistances: { ...u.stats.resistances, physical: 50 } } })) });
  expect(out.events.filter(e => e.kind === 'damage')).toEqual([expect.objectContaining({ amount: 115, crit: true })]);
  expect(out.events.reduce((sum, e) => sum + (e.kind === 'dot' ? e.amount : 0), 0)).toBe(33);
  expect(out.result.enemyTeam[0]?.life).toBe(1852);
});
it('retains physical dodge instead of turning the bypass into guaranteed hit', () => {
  const input = fixture(1, 0, 19), out = record({ ...input,
    enemyTeam: input.enemyTeam.map(u => ({ ...u, stats: { ...u.stats, physDodge: .84 } })) });
  expect(out.events.filter(e => e.kind === 'damage')).toEqual([expect.objectContaining({ amount: 0, dodged: true })]);
  expect(out.events.filter(e => e.kind === 'dot' || e.kind === 'status')).toEqual([]);
  expect(record(input).events.filter(e => e.kind === 'damage')).toEqual([
    expect.objectContaining({ amount: 86, dodged: false })]);
});
it('ends the full three-second Bleed at4700ms with no later damage', () => {
  const out = record(fixture()), dots = out.events.filter(e => e.kind === 'dot');
  expect(dots.length).toBeGreaterThan(1); expect(dots.at(-1)?.simClockMs).toBe(4700);
  expect(out.result.enemyTeam[0]?.statuses).toEqual([hold()]);
  const view = out.events.find(e => e.kind === 'status-state' && e.target === 'target' && e.simClockMs === 1700);
  if (!view || view.kind !== 'status-state') throw new Error('Missing initial Bleed observation');
  expect(view.statuses).toContainEqual(expect.objectContaining({ id: 'bleed', stacks: 1,
    dotPerStack: 7, appliedAtMs: 1700, expiresAtMs: 4700 }));
});
it.each([undefined, 2])('refreshes one existing Bleed stack and preserves its captured rate %s', priorRate => {
  const input = fixture(), marker: ActiveStatus = { id: 'bleed', stacks: 1, remaining: 3,
    sourceId: 'old-source', appliedAtMs: 0, expiresAtMs: 3000,
    ...(priorRate === undefined ? {} : { dotPerStack: priorRate, damageType: 'physical' }) };
  const out = record({ ...input, enemyTeam: input.enemyTeam.map(u => ({ ...u, statuses: [hold(), marker] })) });
  // Bleed supplies the ordinary physical combo multiplier before capturing this hit's rate.
  expect(out.events.filter(e => e.kind === 'damage')).toEqual([expect.objectContaining({ amount: 84 })]);
  const view = out.events.find(e => e.kind === 'status-state' && e.target === 'target' && e.simClockMs === 1700);
  if (!view || view.kind !== 'status-state') throw new Error('Missing refreshed Bleed');
  expect(view.statuses.filter(s => s.id === 'bleed')).toEqual([expect.objectContaining({
    stacks: 1, appliedAtMs: 0, expiresAtMs: 4700, dotPerStack: priorRate ?? 8,
    sourceId: priorRate === undefined ? 'hero' : 'old-source' })]);
  expect(out.events.reduce((sum, e) => sum + (e.kind === 'dot' ? e.amount : 0), 0))
    .toBe(priorRate === undefined ? 24 : 9);
});
it('excludes dead targets, hits one living target and settles one lethal death before any periodic damage', () => {
  const input = fixture(), target = input.enemyTeam[0]; if (!target) throw new Error('Missing target');
  const out = record({ ...input, enemyTeam: [{ ...target, id: 'dead', life: 0 }, { ...target, life: 1 }] });
  expect(out.events.filter(e => e.kind === 'damage' || e.kind === 'status' || e.kind === 'death').map(e =>
    e.kind === 'status' ? [e.kind, e.target, e.statusId] : [e.kind, e.target])).toEqual([
    ['damage', 'target'], ['status', 'target', 'bleed'], ['death', 'target']]);
  expect(out.events.filter(e => e.kind === 'dot')).toEqual([]); expect(out.result.winner).toBe('player');
});
it('hits only one of multiple living targets', () => {
  const input = fixture(), target = input.enemyTeam[0]; if (!target) throw new Error('Missing target');
  const out = record({ ...input, enemyTeam: [target, { ...target, id: 'other' }] });
  expect(out.events.filter(e => e.kind === 'damage').map(e => e.target)).toEqual(['target']);
  expect(out.result.enemyTeam.find(u => u.id === 'other')?.life).toBe(2000);
});
it.each(['mana', 'cooldown'] as const)('refuses an unaffordable/unready cast (%s)', failure => {
  const input = fixture(), out = record({ ...input,
    playerTeam: input.playerTeam.map(u => ({ ...u, mana: failure === 'mana' ? 9 : 10,
      cooldowns: failure === 'cooldown' ? { [CANONICAL]: 10000 } : {} })) });
  expect(out.events.some(e => e.kind === 'action' && e.skillId === CANONICAL)).toBe(false);
  expect(out.events.filter(e => e.kind === 'status' || e.kind === 'dot')).toEqual([]);
  expect(out.result.playerTeam[0]?.mana).toBe(failure === 'mana' ? 9 : 10);
});
it('pays again only at the exact2second cooldown boundary', () => {
  const input = fixture(), out = record({ ...input,
    playerTeam: input.playerTeam.map(u => ({ ...u, mana: 20,
      stats: { ...u.stats, attackSpeed: 250 }, statuses: [hold(501, 2500), hold(2501)] })) });
  expect(out.events.filter(e => e.kind === 'action').map(e => [e.simClockMs, e.skillId]))
    .toEqual([[500, CANONICAL], [2500, CANONICAL]]);
  expect(out.events.filter(e => e.kind === 'mana').map(e => [e.simClockMs, e.mana]))
    .toEqual([[500, 10], [2500, 0]]);
});
it.each(['class', 'unlock', 'rank', 'direct prerequisite', 'transitive prerequisite'] as const)(
  'native %s refusal grants neither bypass nor damaging Bleed', failure => {
    const player = { ...createMockPlayer('Synthetic refusal', failure === 'class' ? 'sorceress' : 'amazon'),
      level: failure === 'unlock' ? 11 : 30, comboOrder: [ID],
      skillLevels: { ...levels, [CANONICAL]: failure === 'rank' ? 0 : 1 } };
    if (failure === 'direct prerequisite') Reflect.deleteProperty(player.skillLevels, 'amazon.power_strike');
    if (failure === 'transitive prerequisite') Reflect.deleteProperty(player.skillLevels, 'amazon.jab');
    const native = playerToCombatUnit(player); expect(native.skillOrder).not.toContain(ID);
    const input = fixture(), out = record({ ...input,
      playerTeam: input.playerTeam.map(u => ({ ...u, skillOrder: native.skillOrder })) });
    expect(out.events.filter(e => e.kind === 'status' || e.kind === 'dot')).toEqual([]);
    expect(out.result.playerTeam[0]?.mana).toBe(10);
  });
it('resolves exact aliases by MAX and preserves an existing wave when saved allocation changes', () => {
  const player = { ...createMockPlayer('Synthetic aliases', 'amazon'), level: 30,
    skillLevels: { ...levels, [ID]: 20 }, comboOrder: [ID] };
  const native = playerToCombatUnit(player), before = structuredClone(native), input = fixture(20);
  const nativeLevels = native.skillLevels;
  if (!nativeLevels) throw new Error('Missing native Impale levels');
  const out = record({ ...input, playerTeam: input.playerTeam.map(u => ({ ...u, skillLevels: nativeLevels })) });
  expect(out.events).toEqual(record(input).events);
  expect(nativeLevels[CANONICAL]).toBe(20);
  expect(playerToCombatUnit({ ...player, skillLevels: levels }).skillLevels?.[CANONICAL]).toBe(1);
  expect(native).toEqual(before);
});
it('retains resistance and the shared one-DPS minimum after a real19point hit', () => {
  const input = fixture(1, 500), out = record({ ...input,
    enemyTeam: input.enemyTeam.map(u => ({ ...u, stats: { ...u.stats,
      resistances: { ...u.stats.resistances, physical: 75 } } })) });
  expect(out.events.filter(e => e.kind === 'damage')).toEqual([expect.objectContaining({ amount: 19 })]);
  expect(out.events.reduce((sum, e) => sum + (e.kind === 'dot' ? e.amount : 0), 0)).toBe(3);
  expect(out.result.enemyTeam[0]?.life).toBe(1978);
});
it.each([12, 240])('bypasses ordinary Defense but preserves finite personal Bone Armor capacity%i', capacity => {
  const input = fixture(1, 500), hero = input.playerTeam[0], target = input.enemyTeam[0];
  if (!hero || !target) throw new Error('Missing reverse shield fixture');
  // Pure-engine reversed sides isolate an actual eligible personal shield; no enemy-learning claim.
  const out = record({ ...input,
    playerTeam: [{ ...target, side: 'player', kind: 'hero', statuses: [hold(), {
      id: 'bone-armor', sourceId: 'target', stacks: 1, remaining: -1,
      boneArmor: { rank: 20, remaining: capacity } }] }],
    enemyTeam: [{ ...hero, side: 'enemy', kind: 'monster' }] });
  expect(out.events.filter(e => e.kind === 'damage')).toEqual([
    expect.objectContaining({ amount: Math.max(0, 77 - capacity), absorbed: Math.min(77, capacity) })]);
  const expectedLife = capacity === 12 ? 1914 : 2000;
  expect(out.result.playerTeam[0]?.life).toBe(expectedLife);
  const views = out.events.filter(e => e.kind === 'status-state' && e.target === 'target');
  expect(views.some(e => e.kind === 'status-state' && e.statuses.some(s => s.id === 'bleed' && s.dotPerStack === 7))).toBe(true);
  if (capacity === 240) expect(out.result.playerTeam[0]?.statuses).toContainEqual(
    expect.objectContaining({ id: 'bone-armor', boneArmor: { rank: 20, remaining: 142 } }));
});
it.each([2000, 1])('settles ordinary reflection against caster Defense without inheriting Impale bypass (life%i)', life => {
  const input = fixture(1, 500), out = record({ ...input,
    playerTeam: input.playerTeam.map(u => ({ ...u, life, stats: { ...u.stats, defense: 20 } })),
    enemyTeam: input.enemyTeam.map(u => ({ ...u, physicalReflectionPct: 1 })) });
  expect(out.events.filter(e => e.kind === 'damage')).toEqual([
    expect.objectContaining({ source: 'hero', amount: 77, damageType: 'physical' }),
    expect.objectContaining({ source: 'target', amount: 57, damageType: 'thorns' })]);
  expect(out.result.playerTeam[0]?.life).toBe(Math.max(0, life - 57));
  if (life === 1) {
    expect(out.result.winner).toBe('enemy');
    expect(out.events.filter(e => e.kind === 'death')).toEqual([expect.objectContaining({ target: 'hero' })]);
    expect(out.events.filter(e => e.kind === 'dot')).toEqual([]);
  }
});
