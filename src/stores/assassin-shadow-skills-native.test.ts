import { afterEach, beforeEach, expect, it } from 'vitest';
import rows from '@/data/skills/assassin.json';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { runBattle, runBattleRecorded, type CombatSnapshot } from '@/engine/combat/combat';
import type { CombatUnit } from '@/engine/combat/types';
import { getSkill, loadDefaultSkills, registerSkill, resetRegistry } from '@/engine/skills/registry';
import { buildSummon } from '@/engine/skills/summons';
import { playerToCombatUnit } from '@/stores/combatHelpers';
import { usePlayerStore } from '@/stores/playerStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { useFormationStore } from '@/stores/formationStore';

beforeEach(() => {
  for (const store of [usePlayerStore, useInventoryStore, useMapStore, useFormationStore]) store.getState().reset();
  resetRegistry(); loadDefaultSkills();
});
afterEach(() => { resetRegistry(); loadDefaultSkills(); });

for (const slug of ['shadow-warrior', 'shadow-master']) for (const rank of [1, 20]) {
  it(`native paid ${slug} rank ${String(rank)} uses real skills rather than only basic attacks`, () => {
    const id = 'skills-assassin-' + slug;
    const levels: Record<string, number> = {};
    const learn = (skillId: string) => {
      const row = rows.find(row => row.id === skillId);
      if (!row) throw new Error('Missing native Assassin prerequisite');
      for (const prerequisite of row.prerequisites ?? []) learn(prerequisite);
      levels[skillId] = 1;
    };
    learn(id); learn('skills-assassin-fire-blast'); levels[id] = rank;
    usePlayerStore.getState().setPlayer({ ...createMockPlayer('Synthetic native shadow skill repro', 'assassin'),
      id: 'hero', level: 30, skillLevels: {}, skillPoints: 29, comboOrder: [id, 'skills-assassin-fire-blast'] });
    for (const [skillId, points] of Object.entries(levels)) for (let point = 0; point < points; point++)
      expect(usePlayerStore.getState().allocateSkillPoint(skillId)).toBe('ok');
    const player = usePlayerStore.getState().player;
    if (!player) throw new Error('Missing native hero');
    const native = playerToCombatUnit(player);
    expect(native.skillOrder).toContain(id);
    expect(native.skillOrder).toContain('skills-assassin-fire-blast');
    const hero: CombatUnit = { ...native, life: 10000, mana: 100,
      manaRegenPerSecond: 0, manaRegenBaselinePerSecond: 0,
      statuses: [{ id: 'stun', sourceId: 'fixture-hold', stacks: 1, remaining: -1 }],
      stats: { ...native.stats, life: 10000, lifeMax: 10000, mana: 100, manaMax: 100 } };
    const target: CombatUnit = { ...hero, id: 'target', side: 'enemy', kind: 'monster', tier: 'trash',
      summon: false, mana: 0, skillOrder: [], skillLevels: {},
      stats: { ...hero.stats, defense: 0, magicResist: 0, physDodge: 0, magicDodge: 0,
        resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0 } },
      gridPosition: { row: 0, col: 0 } };
    const input = { seed: 7, playerTeam: [hero], enemyTeam: [target] };
    const before = structuredClone(input), out = runBattleRecorded(input);
    expect(input).toEqual(before);
    const spawn = out.events.find(event => event.kind === 'summon' && event.owner === 'hero');
    if (!spawn || spawn.kind !== 'summon') throw new Error('No paid native shadow body');
    expect(spawn.summonId).toBe(slug.replace(/-/g, '_'));
    expect(out.events.filter(event => event.kind === 'action' && event.actor === 'hero' && event.skillId !== null))
      .toEqual([expect.objectContaining({ simClockMs: 0 })]);
    expect(out.events.filter(event => event.kind === 'mana' && event.reason === 'cast' && event.target === 'hero'))
      .toHaveLength(1);
    expect(out.events.some(event => event.kind === 'damage' && event.source === spawn.unit.id && event.amount > 0)).toBe(true);
    expect(out.events.some(event => event.kind === 'action' && event.actor === spawn.unit.id &&
      (slug === 'shadow-warrior' ? event.skillId === 'assassin.fire_blast' : event.skillId !== null))).toBe(true);
    expect(spawn.unit.stats.manaMax).toBe(slug === 'shadow-warrior' ? 100 : 150);
    expect(spawn.unit.mana).toBe(spawn.unit.stats.manaMax);
    expect(spawn.unit.skillLevels).toEqual(slug === 'shadow-warrior' ? { 'assassin.fire_blast': 1 } : {
      'assassin.mind_blast': rank, 'assassin.fire_blast': rank,
      'assassin.blade_fury': rank, 'assassin.dragon_talon': rank });
    const first = out.events.find(event => event.kind === 'action' && event.actor === spawn.unit.id);
    expect(first).toMatchObject({ skillId: slug === 'shadow-warrior' ? 'assassin.fire_blast' : 'assassin.mind_blast' });
    expect(out.events.some(event => event.kind === 'damage' && event.source === spawn.unit.id &&
      event.target === 'target' && event.simClockMs === first?.simClockMs && event.amount > 0 &&
      event.damageType === (slug === 'shadow-warrior' ? 'fire' : 'arcane'))).toBe(true);
    expect(out.events.find(event => event.kind === 'mana' && event.reason === 'cast' && event.target === spawn.unit.id))
      .toMatchObject({ mana: slug === 'shadow-warrior' ? 75 : 120, simClockMs: first?.simClockMs });
    expect(out.result.enemyTeam.find(unit => unit.id === 'target')?.life).toBeLessThan(10000);
    const cost = slug === 'shadow-warrior' ? (rank === 1 ? 22 : 18) : (rank === 1 ? 35 : 30);
    expect(out.result.playerTeam.find(unit => unit.id === 'hero')?.mana).toBe(100 - cost);
    expect(out.events.some(event => event.kind === 'action' && event.actor === spawn.unit.id && event.skillId === null)).toBe(true);
    expect(runBattleRecorded(input)).toEqual(out);
    expect(runBattle(input)).toEqual(out.result);
  });
}

/** Synthetic native projection; actual skill-point allocation is exercised by the four causal cases above. */
function fixture(slug = 'shadow-warrior', selected = ['fire-blast'], rank = 1): CombatSnapshot {
  const skillLevels: Record<string, number> = {};
  const learn = (id: string) => {
    const row = rows.find(row => row.id === id);
    if (!row) throw new Error('Missing fixture source');
    for (const prerequisite of row.prerequisites ?? []) learn(prerequisite);
    skillLevels[id] = 1;
  };
  const id = 'skills-assassin-' + slug;
  learn(id);
  for (const attack of selected) learn('skills-assassin-' + attack);
  skillLevels[id] = rank;
  const native = playerToCombatUnit({ ...createMockPlayer('Synthetic shadow authority controls', 'assassin'),
    id: 'hero', level: 30, skillLevels, comboOrder: [id, ...selected.map(attack => 'skills-assassin-' + attack)] });
  const hero: CombatUnit = { ...native, life: 10000, mana: 100,
    manaRegenPerSecond: 0, manaRegenBaselinePerSecond: 0,
    statuses: [{ id: 'stun', sourceId: 'fixture-hold', stacks: 1, remaining: -1 }],
    stats: { ...native.stats, life: 10000, lifeMax: 10000, mana: 100, manaMax: 100,
      defense: 0, magicResist: 0, physDodge: 0, magicDodge: 0, critChance: 0 } };
  const target: CombatUnit = { ...hero, id: 'target', side: 'enemy', kind: 'monster', mana: 0,
    skillOrder: [], skillLevels: {}, stats: { ...hero.stats,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0 } },
    gridPosition: { row: 0, col: 0 } };
  return { seed: 7, playerTeam: [hero], enemyTeam: [target] };
}
function spawned(out: ReturnType<typeof runBattleRecorded>): CombatUnit {
  const event = out.events.find(event => event.kind === 'summon' && event.owner === 'hero');
  if (!event || event.kind !== 'summon') throw new Error('Missing paid shadow');
  return event.unit;
}

it('Warrior falls through cooldown and insufficient MP to later skills, then basics without borrowing owner MP', () => {
  const input = fixture('shadow-warrior', ['mind-blast', 'fire-blast', 'dragon-talon']);
  const out = runBattleRecorded(input), body = spawned(out);
  const actions = out.events.filter(event => event.kind === 'action' && event.actor === body.id);
  expect(actions.slice(0, 4)).toMatchObject([
    { skillId: 'assassin.mind_blast', simClockMs: 1860 },
    { skillId: 'assassin.fire_blast', simClockMs: 3720 },
    { skillId: 'assassin.mind_blast', simClockMs: 5580 },
    { skillId: 'assassin.dragon_talon', simClockMs: 7440 }
  ]);
  expect(out.events.filter(event => event.kind === 'mana' && event.reason === 'cast' && event.target === body.id).slice(0, 4))
    .toMatchObject([{ mana: 70 }, { mana: 45 }, { mana: 15 }, { mana: 11 }]);
  expect(actions.some(event => event.kind === 'action' && event.skillId === null)).toBe(true);
  expect(out.result.playerTeam.find(unit => unit.id === body.id)?.mana).toBe(3);
  expect(out.result.playerTeam.find(unit => unit.id === 'hero')?.mana).toBe(78);
});

it.each(['shadow-warrior', 'shadow-master'])('%s without a selected owner attack follows its own authored policy', slug => {
  const out = runBattleRecorded(fixture(slug, [])), body = spawned(out);
  const casts = out.events.filter(event => event.kind === 'action' && event.actor === body.id && event.skillId !== null);
  if (slug === 'shadow-warrior') {
    expect(body.skillOrder).toEqual([]);
    expect(casts).toEqual([]);
    expect(out.result.playerTeam.find(unit => unit.id === body.id)?.mana).toBe(100);
  } else expect(casts[0]).toMatchObject({ skillId: 'assassin.mind_blast' });
});

it.each(['shadow-warrior', 'shadow-master'])('%s refuses copied skills on preloaded marker bodies and makes no redundant payment', slug => {
  const input = fixture(slug), hero = input.playerTeam[0];
  if (!hero) throw new Error('Missing hero');
  const template = buildSummon(hero, slug.replace(/-/g, '_'));
  if (!template) throw new Error('Missing body');
  const preloaded: CombatUnit = { ...template, id: 'forged-preloaded',
    skillOrder: ['assassin.fire_blast'], skillLevels: { 'assassin.fire_blast': 20 } };
  const out = runBattleRecorded({ ...input, playerTeam: [hero, preloaded] });
  expect(out.events.filter(event => event.kind === 'summon')).toEqual([]);
  expect(out.events.filter(event => event.kind === 'mana' && event.reason === 'cast')).toEqual([]);
  expect(out.events.some(event => event.kind === 'action' && event.actor === preloaded.id && event.skillId === null)).toBe(true);
  expect(out.events.some(event => event.kind === 'action' && event.actor === preloaded.id && event.skillId !== null)).toBe(false);
});

it('generic shadow preparation retains basic behavior without an explicit native projection', () => {
  const input = fixture(), hero = input.playerTeam[0];
  if (!hero) throw new Error('Missing hero');
  const { assassinShadowSkills, ...generic } = hero;
  expect(assassinShadowSkills?.shadow_warrior).toBeDefined();
  const out = runBattleRecorded({ ...input, playerTeam: [generic] }), body = spawned(out);
  expect(body.skillOrder).toEqual([]);
  expect(out.events.some(event => event.kind === 'action' && event.actor === body.id && event.skillId !== null)).toBe(false);
});

it('a replaced registered attack never obtains paid native shadow authority', () => {
  const input = fixture(), skill = getSkill('assassin.fire_blast');
  if (!skill) throw new Error('Missing Fire Blast');
  registerSkill({ ...skill, manaCost: 0 });
  const out = runBattleRecorded(input), body = spawned(out);
  expect(body.skillOrder).toEqual(['assassin.fire_blast']);
  expect(out.events.some(event => event.kind === 'action' && event.actor === body.id && event.skillId !== null)).toBe(false);
  expect(out.result.playerTeam.find(unit => unit.id === body.id)?.mana).toBe(100);
});

it('a malformed registered summon source cannot grant its body captured attacks', () => {
  const input = fixture(), skill = getSkill('assassin.shadow_warrior');
  if (!skill) throw new Error('Missing shadow source');
  registerSkill({ ...skill, manaCost: 1 });
  const out = runBattleRecorded(input), body = spawned(out);
  expect(body.skillOrder).toEqual([]);
  expect(out.events.some(event => event.kind === 'action' && event.actor === body.id && event.skillId !== null)).toBe(false);
});

it('rebuilds future native priorities without rewriting an existing recording or leaking bindings between battles', () => {
  const input = fixture(), before = structuredClone(input), first = runBattleRecorded(input);
  const noAttacks = fixture('shadow-warrior', []), next = runBattleRecorded(noAttacks);
  expect(spawned(first).skillOrder).toEqual(['assassin.fire_blast']);
  expect(spawned(next).skillOrder).toEqual([]);
  expect(runBattleRecorded(input)).toEqual(first);
  expect(input).toEqual(before);
});

it.each(['shadow-warrior', 'shadow-master'])('%s receives one actual party Command bonus without rewriting captured learned ranks', slug => {
  const input = fixture(slug, ['fire-blast'], 20), source = getSkill('barbarian.battle_command');
  if (!source) throw new Error('Missing Command');
  const inertId = 'fixture.inert-shadow-command';
  registerSkill({ id: inertId, archetype: 'fixture', target: 'self', minLevel: 1,
    manaCost: source.manaCost, cooldown: source.cooldown, isBuff: true,
    effects: [{ kind: 'buff', id: inertId, duration: 60 }] });
  const native = playerToCombatUnit({ ...createMockPlayer('Synthetic native shadow party Command', 'barbarian'),
    id: 'commander', level: 30, comboOrder: ['barbarian.battle_command'],
    skillLevels: { 'barbarian.howl': 1, 'barbarian.shout': 1,
      'barbarian.battle_orders': 1, 'barbarian.battle_command': 1 } });
  const commander: CombatUnit = { ...native, life: 10000, mana: 100,
    manaRegenPerSecond: 0, manaRegenBaselinePerSecond: 0,
    stats: { ...native.stats, life: 10000, lifeMax: 10000, mana: 100, manaMax: 100,
      attack: 0, attackSpeed: 100, critChance: 0 } };
  const actual = runBattleRecorded({ ...input, playerTeam: [...input.playerTeam, commander] });
  const control = runBattleRecorded({ ...input, playerTeam: [...input.playerTeam,
    { ...commander, skillOrder: [inertId] }] });
  const body = spawned(actual), controlBody = spawned(control);
  expect(actual.events.find(event => event.kind === 'action' && event.actor === commander.id))
    .toMatchObject({ skillId: 'barbarian.battle_command', simClockMs: 1700 });
  expect(body.skillLevels).toEqual(controlBody.skillLevels);
  expect(body.skillLevels?.[slug === 'shadow-warrior' ? 'assassin.fire_blast' : 'assassin.mind_blast'])
    .toBe(slug === 'shadow-warrior' ? 1 : 20);
  const firstHit = (out: typeof actual, id: string) => out.events.find(event =>
    event.kind === 'damage' && event.source === id && event.target === 'target');
  const boosted = firstHit(actual, body.id), base = firstHit(control, controlBody.id);
  if (boosted?.kind !== 'damage' || base?.kind !== 'damage') throw new Error('Missing actual shadow skill damage');
  expect(boosted.simClockMs).toBe(base.simClockMs);
  expect(boosted.amount - base.amount).toBeGreaterThanOrEqual(5);
  expect(boosted.amount - base.amount).toBeLessThanOrEqual(8);
});

it('owner death ends the actual shadow before its first skill action', () => {
  const input = fixture(), hero = input.playerTeam[0];
  if (!hero) throw new Error('Missing death control');
  const out = runBattleRecorded({ ...input, playerTeam: [{ ...hero, life: 1, statuses: [
    ...hero.statuses, { id: 'poison', sourceId: 'fixture-poison', stacks: 1,
      remaining: -1, dotPerStack: 50, damageType: 'poison' }
  ] }] });
  const body = spawned(out);
  expect(out.result.playerTeam.find(unit => unit.id === 'hero')?.life).toBe(0);
  expect(out.result.playerTeam.find(unit => unit.id === body.id)?.life).toBe(0);
  const deaths = out.events.filter(event => event.kind === 'death');
  expect(deaths).toMatchObject([{ target: 'hero' }, { target: body.id }]);
  expect(deaths[0]?.simClockMs).toBe(deaths[1]?.simClockMs);
  expect(out.events.some(event => event.kind === 'damage' && event.source === 'target')).toBe(false);
  expect(out.events.some(event => event.kind === 'action' && event.actor === body.id)).toBe(false);
});
