import { afterEach, beforeEach, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { playerToCombatUnit } from './combatHelpers';
import { getSkill, loadDefaultSkills, registerSkill, resetRegistry } from '@/engine/skills/registry';
import { runBattleRecorded, type CombatSnapshot } from '@/engine/combat/combat';
import type { CombatUnit } from '@/engine/combat/types';
import { composeGrimWard } from '@/engine/skills/grim-ward';

const ID = 'barbarian.grim_ward';
function fixture(rank: number, body = false): CombatSnapshot & {
  readonly grimWard: readonly { readonly sourceHeroId: string; readonly rank: number }[];
} {
  const player = { ...createMockPlayer('Synthetic corpse ward', 'barbarian'), id: 'hero', level: 30,
    comboOrder: ['skills-barbarian-grim-ward'], skillLevels: {
      'skills-barbarian-find-potion': 1, 'skills-barbarian-find-item': 1, 'skills-barbarian-grim-ward': rank } };
  const hero = playerToCombatUnit(player);
  const stats = { ...hero.stats, life: 1000, lifeMax: 1000, mana: 100, manaMax: 100,
    attack: 1, defense: 0, magicResist: 0, physDodge: 0, magicDodge: 0, attackSpeed: 100,
    critChance: 0, resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } };
  const enemy: CombatUnit = { ...hero, id: 'survivor', name: 'survivor', kind: 'monster', side: 'enemy',
    stats: { ...stats, lifeMax: 100000 }, life: 100000, mana: 100, skillOrder: [], skillLevels: {},
    statuses: [], activeBuffIds: [], cooldowns: {} };
  const authority = composeGrimWard(player); if (!authority) throw new Error('Missing learned native ward authority');
  return { seed: 19, grimWard: [authority],
    playerTeam: [{ ...hero, stats, life: 1000, mana: 50, manaRegenPerSecond: 0, manaRegenBaselinePerSecond: 0,
      statuses: [{ id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1, appliedAtMs: 1701 }] }],
    enemyTeam: [enemy, ...(body ? [{ ...enemy, id: 'body', name: 'body', life: 1,
      statuses: [{ id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1 },
        { id: 'poison', sourceId: 'fixture', stacks: 1, remaining: -1, dotPerStack: 100, damageType: 'poison' as const }] }] : [])] };
}
beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { resetRegistry(); loadDefaultSkills(); });

for (const rank of [1, 20]) it.each([7, 19])(`rank${String(rank)} refuses without a corpse, seed%i`, seed => {
  const input = { ...fixture(rank), seed }, before = structuredClone(input), out = runBattleRecorded(input);
  expect(input).toEqual(before);
  expect(out.events.filter(e => e.kind === 'death')).toEqual([]);
  expect(out.events.filter(e => e.kind === 'action' && e.skillId === ID)).toEqual([]);
  expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toEqual([]);
  expect(out.result.playerTeam[0]?.mana).toBe(50);
});

it('one actual corpse creates three exact fear pulses, suppresses actions, then expires', () => {
  const input = fixture(1, true), before = structuredClone(input), out = runBattleRecorded(input);
  expect(input).toEqual(before);
  expect(out.events.filter(e => e.kind === 'death' && e.target === 'body')).toEqual([
    expect.objectContaining({ simClockMs: 10 })]);
  expect(out.events.filter(e => e.kind === 'action' && e.skillId === ID)).toEqual([
    expect.objectContaining({ simClockMs: 1700 })]);
  expect(out.events.filter(e => e.kind === 'message' && e.messageKey === 'combat:corpses.consumedGrimWard')).toEqual([
    expect.objectContaining({ simClockMs: 1700, params: { count: 0, corpseId: 'body', duration: 6 } })]);
  expect(out.events.filter(e => e.kind === 'status' && e.target === 'survivor' && e.statusId === 'howl')
    .map(e => e.simClockMs)).toEqual([1700, 3700, 5700]);
  expect(out.events.filter(e => e.kind === 'stunned' && e.target === 'survivor').map(e => e.simClockMs)).toContain(1700);
  expect(out.events.filter(e => e.kind === 'message' && e.messageKey === 'combat:corpses.grimWardEnded')).toEqual([
    expect.objectContaining({ simClockMs: 7700 })]);
  expect(out.events.some(e => e.kind === 'action' && e.actor === 'survivor' && e.simClockMs > 7700)).toBe(true);
  expect(out.result.playerTeam[0]?.statuses.some(s => s.id === 'grim-ward')).toBe(false);
  expect(runBattleRecorded(input)).toEqual(out);
});

it.each([[2, [1700, 3700, 5700, 7700], 8200],
  [20, [1700, 3700, 5700, 7700, 9700, 11700, 13700, 15700], 17200]] as const)(
  'rank%i pulses independently while the living caster is stunned', (rank, pulses, end) => {
    const out = runBattleRecorded(fixture(rank, true));
    expect(out.events.filter(e => e.kind === 'status' && e.statusId === 'howl').map(e => e.simClockMs)).toEqual(pulses);
    expect(out.events.find(e => e.kind === 'message' && e.messageKey === 'combat:corpses.grimWardEnded')?.simClockMs).toBe(end);
  });

it.each(['boss', 'chapter-boss'] as const)('ordinary ward fear lasts exactly500ms for%s', tier => {
  const input = fixture(1, true), out = runBattleRecorded({ ...input,
    enemyTeam: input.enemyTeam.map(unit => unit.id === 'survivor' ? { ...unit, tier } : unit) });
  const states = out.events.filter(e => e.kind === 'status-state' && e.target === 'survivor');
  for (const time of [1700, 3700, 5700]) {
    const state = states.find(e => e.simClockMs === time && e.kind === 'status-state' && e.statuses.some(s => s.id === 'howl'));
    expect(state?.kind === 'status-state' ? state.statuses.find(s => s.id === 'howl') : undefined)
      .toMatchObject({ appliedAtMs: time, expiresAtMs: time + 500 });
  }
});

it('a source death exactly at the second pulse ends the ward before that pulse', () => {
  const input = fixture(1, true), out = runBattleRecorded({ ...input,
    playerTeam: input.playerTeam.map(unit => ({ ...unit, statuses: [...unit.statuses, {
      id: 'poison', sourceId: 'fixture', stacks: 1, remaining: -1, appliedAtMs: 3699,
      dotPerStack: 1000000, damageType: 'poison' as const }] })) });
  expect(out.events.find(e => e.kind === 'death' && e.target === 'hero')?.simClockMs).toBe(3700);
  expect(out.events.filter(e => e.kind === 'status' && e.statusId === 'howl').map(e => e.simClockMs)).toEqual([1700]);
  expect(out.events.find(e => e.kind === 'message' && e.messageKey === 'combat:corpses.grimWardEnded')?.simClockMs).toBe(3700);
});

it('spare corpses do not permit an active recast; the oldest remaining body is used after exact expiry', () => {
  const input = fixture(1, true), body = input.enemyTeam.find(unit => unit.id === 'body');
  if (!body) throw new Error('Missing corpse source');
  const out = runBattleRecorded({ ...input, playerTeam: input.playerTeam.map(unit => ({ ...unit, statuses: [] })),
    enemyTeam: [...input.enemyTeam, { ...body, id: 'body2' }] });
  expect(out.events.filter(e => e.kind === 'action' && e.skillId === ID).map(e => e.simClockMs)).toEqual([1700, 8500]);
  expect(out.events.filter(e => e.kind === 'message' && e.messageKey === 'combat:corpses.consumedGrimWard')
    .map(e => e.kind === 'message' ? e.params?.corpseId : undefined)).toEqual(['body', 'body2']);
});

it.each(['initial-dead', 'summoned', 'final-hostile'] as const)('refuses an excluded%s body', invalid => {
  const input = fixture(1, true), out = runBattleRecorded({ ...input, enemyTeam: input.enemyTeam
    .filter(unit => invalid !== 'final-hostile' || unit.id === 'body').map(unit => unit.id !== 'body' ? unit : {
      ...unit, ...(invalid === 'initial-dead' ? { life: 0 } : {}),
      ...(invalid === 'summoned' ? { summon: true, ownerId: 'survivor' } : {}) }) });
  expect(out.events.filter(e => e.kind === 'action' && e.skillId === ID)).toEqual([]);
});

it.each(['missing-authority', 'merc', 'low-level', 'owned', 'fake-marker'] as const)('rejects%s authority', invalid => {
  const input = fixture(1, true), out = runBattleRecorded({ ...input,
    grimWard: invalid === 'missing-authority' || invalid === 'fake-marker' ? [] : input.grimWard,
    playerTeam: input.playerTeam.map(unit => ({ ...unit,
      ...(invalid === 'merc' ? { kind: 'merc' as const } : {}), ...(invalid === 'low-level' ? { level: 23 } : {}),
      ...(invalid === 'owned' ? { ownerId: 'other' } : {}),
      ...(invalid === 'fake-marker' ? { statuses: [...unit.statuses, { id: 'grim-ward', sourceId: unit.id,
        stacks: 1, remaining: 100 }], activeBuffIds: ['grim-ward'] } : {}) })) });
  expect(out.events.filter(e => e.kind === 'action' && e.skillId === ID)).toEqual([]);
  expect(out.events.filter(e => e.kind === 'status' && e.statusId === 'howl')).toEqual([]);
  expect(out.result.playerTeam[0]?.statuses.some(s => s.id === 'grim-ward')).toBe(false);
});

it.each(['skills-barbarian-grim-ward', ID])('honors the other%s cooldown alias', alias => {
  const input = fixture(1, true), out = runBattleRecorded({ ...input,
    playerTeam: input.playerTeam.map(unit => ({ ...unit, cooldowns: { [alias]: 1701 } })) });
  expect(out.events.filter(e => e.kind === 'action' && e.skillId === ID)).toEqual([]);
});

it('empty-pool refusal preserves ordinary fallback RNG and damage exactly', () => {
  const input = fixture(1), out = runBattleRecorded(input), control = runBattleRecorded({ ...input,
    playerTeam: input.playerTeam.map(unit => ({ ...unit, skillOrder: [] })) });
  expect(out.events).toEqual(control.events); expect(out.result.enemyTeam).toEqual(control.result.enemyTeam);
});

it.each([[1, 7], [2, 7], [20, 5]])('rank%i pays exactly%iMP once for a real ward', (rank, cost) => {
  const out = runBattleRecorded(fixture(rank, true));
  const orbMana = out.events.filter(e => e.kind === 'orb' && e.target === 'hero')
    .reduce((sum, e) => sum + (e.kind === 'orb' && e.orb.kind === 'mp' ? 5 : 0), 0);
  expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toEqual([
    expect.objectContaining({ target: 'hero', mana: 50 + orbMana - cost, simClockMs: 1700 })]);
  expect(out.result.playerTeam[0]?.mana).toBe(50 + orbMana - cost);
});

it.each([0, 1, NaN, Infinity])('refuses unaffordable or nonfinite%sMP without spending a body', mana => {
  const input = fixture(1, true), out = runBattleRecorded({ ...input,
    playerTeam: input.playerTeam.map(unit => ({ ...unit, mana, stats: { ...unit.stats, manaMax: 6 } })) });
  expect(out.events.filter(e => e.kind === 'action' && e.skillId === ID)).toEqual([]);
  expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toEqual([]);
  expect(out.events.filter(e => e.kind === 'message' && e.messageKey === 'combat:corpses.consumedGrimWard')).toEqual([]);
});

it.each(['extra-effect', 'wrong-cost', 'startup', 'wrong-id'] as const)('refuses altered%s registry semantics', invalid => {
  const skill = getSkill(ID); if (!skill) throw new Error('Missing registered ward');
  const modified = { ...skill, ...(invalid === 'extra-effect' ? { effects: [...skill.effects,
    { kind: 'heal' as const, target: 'self' as const, amount: 999 }] } : {}),
    ...(invalid === 'wrong-cost' ? { manaCost: 0 } : {}), ...(invalid === 'startup' ? { summonOnStart: true } : {}),
    ...(invalid === 'wrong-id' ? { id: 'fixture.other-ward' } : {}) };
  registerSkill(modified);
  const input = fixture(1, true), out = runBattleRecorded({ ...input,
    playerTeam: input.playerTeam.map(unit => ({ ...unit,
      ...(invalid === 'wrong-id' ? { skillOrder: [modified.id] } : {}) })) });
  expect(out.events.filter(e => e.kind === 'action' && e.skillId !== null)).toEqual([]);
  expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toEqual([]);
  expect(out.events.filter(e => e.kind === 'status' && e.statusId === 'howl')).toEqual([]);
});

it.each(['ward-first', 'recovery-first', 'explosion-first'] as const)('shares one corpse with other consumers: %s', order => {
  const input = fixture(1, true), hero = input.playerTeam[0]; if (!hero) throw new Error('Missing ward hero');
  const otherId = order === 'explosion-first' ? 'necromancer.corpse_explosion' : 'barbarian.find_potion';
  const other = { ...hero, id: 'other', skillOrder: [otherId] };
  const out = runBattleRecorded({ ...input, corpseExplosion: [{ sourceHeroId: 'other', rank: 1 }],
    findPotion: [{ sourceHeroId: 'other', rank: 1 }],
    playerTeam: order === 'ward-first' ? [hero, other] : [other, hero] });
  expect(out.events.filter(e => e.kind === 'action' && e.skillId !== null)).toEqual([
    expect.objectContaining({ skillId: order === 'ward-first' ? ID : otherId })]);
  expect(out.events.filter(e => e.kind === 'death' && e.target === 'body')).toHaveLength(1);
  expect(out.events.filter(e => e.kind === 'status' && e.statusId === 'howl')).toHaveLength(order === 'ward-first' ? 3 : 0);
});
