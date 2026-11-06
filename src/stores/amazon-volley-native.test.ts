import { afterEach, beforeEach, expect, it } from 'vitest';
import rows from '@/data/skills/amazon.json';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { runBattle, runBattleRecorded, type CombatSnapshot } from '@/engine/combat/combat';
import type { ActiveStatus, CombatUnit } from '@/engine/combat/types';
import { loadDefaultSkills, resetRegistry } from '@/engine/skills/registry';
import type { Item } from '@/engine/types/items';
import { playerToCombatUnit } from '@/stores/combatHelpers';
import { usePlayerStore } from '@/stores/playerStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { useFormationStore } from '@/stores/formationStore';

const hold = (appliedAtMs = 0): ActiveStatus => ({ id: 'stun', sourceId: 'synthetic-hold', stacks: 1,
  remaining: -1, appliedAtMs });
function owner(slug: string, rank = 1) {
  const levels: Record<string, number> = {};
  function add(id: string) {
    const row = rows.find(row => row.id === id);
    if (!row) throw new Error('Missing Amazon prerequisite');
    for (const prerequisite of row.prerequisites ?? []) add(prerequisite);
    levels[id] = 1;
  }
  const id = 'skills-amazon-' + slug; add(id); levels[id] = rank;
  return { ...createMockPlayer('Synthetic native Amazon volley', 'amazon'), id: 'hero',
    level: 30, skillLevels: levels, comboOrder: [id] };
}
/** Real canonical equip/projection; isolated pools and cadence are not earned balance. */
function fixture(slug: string, rank = 1): CombatSnapshot {
  const player = owner(slug, rank); usePlayerStore.getState().setPlayer(player);
  const bow: Item = { id: 'volley-training-bow', baseId: 'items/base/weapon-bow-training',
    rarity: 'normal', level: 1, ilvl: 1, baseRolls: { attack: 13 }, identified: true, equipped: false };
  useInventoryStore.getState().addItem(bow);
  expect(useInventoryStore.getState().equipItem(bow)).toEqual({ ok: true });
  const current = usePlayerStore.getState().player;
  if (!current) throw new Error('Missing native Amazon');
  const native = playerToCombatUnit(current);
  expect(native.equippedWeapon?.weaponType).toBe('bow');
  const hero: CombatUnit = { ...native, life: 2000, mana: 100,
    manaRegenPerSecond: 0, manaRegenBaselinePerSecond: 0, statuses: [hold(1701)],
    stats: { ...native.stats, life: 2000, lifeMax: 2000, mana: 100, manaMax: 100,
      attack: 1, attackSpeed: 100, defense: 0, magicResist: 0, critChance: 0, critDamage: 1.5,
      physDodge: 0, magicDodge: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0 } } };
  const target: CombatUnit = { ...hero, id: 'target', side: 'enemy', kind: 'monster', tier: 'trash',
    mana: 0, skillOrder: [], skillLevels: {}, statuses: [hold()], gridPosition: { row: 0, col: 0 } };
  return { seed: 7, playerTeam: [hero], enemyTeam: [target,
    { ...target, id: 'reserve', gridPosition: { row: 2, col: 2 } }] };
}
function record(input: CombatSnapshot) {
  const before = structuredClone(input), out = runBattleRecorded(input);
  expect(input).toEqual(before); expect(runBattleRecorded(input)).toEqual(out);
  expect(runBattle(input)).toEqual(out.result); return out;
}
beforeEach(() => {
  for (const store of [usePlayerStore, useInventoryStore, useMapStore, useFormationStore]) store.getState().reset();
  resetRegistry(); loadDefaultSkills();
});
afterEach(() => { resetRegistry(); loadDefaultSkills(); });

for (const rank of [1, 20]) it(`Guided Arrow rank${String(rank)} lands against maximum physical dodge`, () => {
  const input = fixture('guided-arrow', rank);
  const out = record({ ...input, seed: 41, enemyTeam: input.enemyTeam.map(u => ({ ...u, stats: { ...u.stats, physDodge: 1 } })) });
  const hits = out.events.flatMap(e => e.kind === 'damage' && e.source === 'hero' ? [e] : []);
  expect(hits).toHaveLength(1);
  expect(hits[0]).toMatchObject({ target: 'target', damageType: 'physical', dodged: false });
  expect(hits[0]?.amount).toBe(rank === 1 ? 96 : 210);
  expect(out.result.enemyTeam[0]?.life).toBeLessThan(2000);
  expect(out.result.enemyTeam[1]?.life).toBe(2000);
  expect(out.events.flatMap(e => e.kind === 'mana' && e.reason === 'cast' ? [e] : []).map(e => e.mana)).toEqual([80]);
});
it('ordinary Magic Arrow still uses the normal hit/dodge check', () => {
  const input = fixture('magic-arrow');
  const out = record({ ...input, seed: 41, enemyTeam: input.enemyTeam.map(u => ({ ...u, stats: { ...u.stats, magicDodge: 1 } })) });
  expect(out.events.filter(e => e.kind === 'damage')).toEqual([
    expect.objectContaining({ source: 'hero', target: 'target', amount: 0, dodged: true })]);
  expect(out.result.enemyTeam.map(u => u.life)).toEqual([2000, 2000]);
});
for (const rank of [1, 20]) it(`Multiple Shot rank${String(rank)} selects five enemies in its widening cone`, () => {
  const input = fixture('multiple-shot', rank), target = input.enemyTeam[0];
  if (!target) throw new Error('Missing fixture target');
  const positions = [
    ['tip', 0, 2], ['left', 1, 1], ['middle', 1, 2], ['right', 1, 3],
    ['back-left', 2, 0], ['back-left-middle', 2, 1], ['back-middle', 2, 2],
    ['back-right-middle', 2, 3], ['back-right', 2, 4], ['outside', 0, 9]
  ] as const;
  const enemies = positions.map(([id, row, col]) => ({ ...target, id, gridPosition: { row, col } }));
  const out = record({ ...input, enemyTeam: enemies });
  const hits = out.events.flatMap(e => e.kind === 'damage' && e.source === 'hero' ? [e] : []);
  expect(hits.map(e => e.target)).toEqual(['tip', 'left', 'middle', 'right', 'back-left']);
  expect(hits.map(e => e.amount)).toEqual(rank === 1 ? [41, 50, 45, 45, 50] : [269, 278, 273, 273, 278]);
  expect(hits.every(e => e.damageType === 'physical')).toBe(true);
  expect(out.result.enemyTeam.filter(u => u.life < 2000).map(u => u.id)).toEqual(
    hits.filter(e => e.amount > 0).map(e => e.target));
  expect(out.result.enemyTeam.find(u => u.id === 'outside')?.life).toBe(2000);
  expect(out.events.flatMap(e => e.kind === 'mana' && e.reason === 'cast' ? [e] : []).map(e => e.mana)).toEqual([85]);
});
for (const rank of [1, 20]) it(`Strafe rank${String(rank)} pays for two real attempts at each original enemy`, () => {
  const out = record(fixture('strafe', rank));
  const hits = out.events.flatMap(e => e.kind === 'damage' && e.source === 'hero' ? [e] : []);
  expect(hits.map(e => e.target)).toEqual(['target', 'reserve', 'target', 'reserve']);
  expect(hits.map(e => e.amount)).toEqual(rank === 1 ? [36, 45, 40, 40] : [112, 121, 116, 116]);
  expect(hits.every(e => e.damageType === 'physical')).toBe(true);
  expect(hits.filter(e => e.amount > 0).length).toBeGreaterThan(1);
  for (const id of ['target', 'reserve']) expect(out.result.enemyTeam.find(u => u.id === id)?.life).toBe(
    2000 - hits.filter(e => e.target === id).reduce((sum, e) => sum + e.amount, 0));
  expect(out.events.flatMap(e => e.kind === 'mana' && e.reason === 'cast' ? [e] : []).map(e => e.mana)).toEqual([80]);
});

for (const slug of ['guided-arrow', 'multiple-shot', 'strafe']) {
  const runtime = 'amazon.' + slug.replaceAll('-', '_'), cost = slug === 'multiple-shot' ? 15 : 20;
  it.each(['mana', 'cooldown'] as const)(`${slug} refuses the entire cast for insufficient %s`, reason => {
    const input = fixture(slug), out = record({ ...input, playerTeam: input.playerTeam.map(u => ({ ...u,
      mana: reason === 'mana' ? cost - 1 : 100,
      cooldowns: reason === 'cooldown' ? { [runtime]: 100000 } : {} })) });
    expect(out.events.some(e => e.kind === 'action' && e.skillId === runtime)).toBe(false);
    expect(out.events.some(e => e.kind === 'mana' && e.reason === 'cast')).toBe(false);
    expect(out.result.playerTeam[0]?.mana).toBe(reason === 'mana' ? cost - 1 : 100);
  });
  it(`${slug} filters real class, level, hard allocation and prerequisites`, () => {
    fixture(slug); const player = owner(slug), row = rows.find(r => r.id === 'skills-amazon-' + slug);
    if (!row) throw new Error('Missing native skill');
    expect(playerToCombatUnit(player).skillOrder).toContain(row.id);
    const unlearned = { ...player.skillLevels }; Reflect.deleteProperty(unlearned, row.id);
    for (const patch of [{ class: 'barbarian' as const }, { level: row.requiredLevel - 1 }, { skillLevels: unlearned }])
      expect(playerToCombatUnit({ ...player, ...patch }).skillOrder).not.toContain(row.id);
    const missing = { ...player.skillLevels }, prerequisite = row.prerequisites?.[0];
    if (!prerequisite) throw new Error('Missing selected prerequisite');
    Reflect.deleteProperty(missing, prerequisite);
    expect(playerToCombatUnit({ ...player, skillLevels: missing }).skillOrder).not.toContain(row.id);
  });
}
it('Guided Arrow keeps its guarantee under Blind and the ordinary natural-miss seed', () => {
  const input = fixture('guided-arrow'), out = record({ ...input, seed: 41,
    playerTeam: input.playerTeam.map(u => ({ ...u, statuses: [...u.statuses,
      { id: 'blind', sourceId: 'raven', stacks: 1, remaining: 20, appliedAtMs: 0, expiresAtMs: 20000 }] })) });
  expect(out.events.filter(e => e.kind === 'damage')).toEqual([
    expect.objectContaining({ source: 'hero', target: 'target', damageType: 'physical', dodged: false })]);
  expect(out.result.enemyTeam[0]?.life).toBeLessThan(2000);
});
it('Guided Arrow still pays ordinary Defense and Physical resistance', () => {
  const input = fixture('guided-arrow'), plain = record(input), hit = plain.events.find(e => e.kind === 'damage');
  if (!hit) throw new Error('Missing plain hit');
  const defended = record({ ...input, enemyTeam: input.enemyTeam.map(u => ({ ...u,
    stats: { ...u.stats, defense: 7, resistances: { ...u.stats.resistances, physical: 50 } } })) });
  const expected = Math.max(1, Math.floor(hit.amount * .5 - 7));
  expect(defended.events.filter(e => e.kind === 'damage')).toEqual([expect.objectContaining({ amount: expected })]);
  expect(defended.result.enemyTeam.map(u => u.life)).toEqual([2000 - expected, 2000]);
  expect(defended.result.enemyTeam[0]?.stats.defense).toBe(7);
});
it('Guided Arrow excludes dead targets and does not spill a lethal hit', () => {
  const input = fixture('guided-arrow'), liveOnly = record({ ...input, enemyTeam: input.enemyTeam.map((u, i) =>
    i === 0 ? { ...u, life: 0 } : u) });
  expect(liveOnly.events.filter(e => e.kind === 'damage').map(e => e.target)).toEqual(['reserve']);
  expect(liveOnly.result.enemyTeam[1]?.life).toBeLessThan(2000);
  const lethal = record({ ...input, enemyTeam: input.enemyTeam.map((u, i) => i === 0 ? { ...u, life: 1 } : u) });
  expect(lethal.result.enemyTeam.map(u => u.life)).toEqual([0, 2000]);
  expect(lethal.events.filter(e => e.kind === 'damage').map(e => e.target)).toEqual(['target']);
});
it('a sparse Multiple Shot cone never fills missing cells from outside', () => {
  const input = fixture('multiple-shot'), target = input.enemyTeam[0];
  if (!target) throw new Error('Missing target');
  const out = record({ ...input, enemyTeam: [
    { ...target, id: 'tip', gridPosition: { row: 0, col: 2 } },
    { ...target, id: 'left', gridPosition: { row: 1, col: 1 } },
    { ...target, id: 'outside', gridPosition: { row: 9, col: 9 } }] });
  expect(out.events.filter(e => e.kind === 'damage').map(e => e.target)).toEqual(['tip', 'left']);
  expect(out.result.enemyTeam[2]?.life).toBe(2000);
});
it('Strafe consumes missed attempts and rolls the remaining attempts independently', () => {
  const out = record({ ...fixture('strafe'), seed: 41 }), hits = out.events.filter(e => e.kind === 'damage');
  expect(hits).toHaveLength(4); expect(hits[0]).toMatchObject({ amount: 0, dodged: true });
  expect(hits.slice(1).some(e => e.amount > 0 && !e.dodged)).toBe(true);
  expect(out.result.enemyTeam.some(u => u.life < 2000)).toBe(true);
});
it('Strafe skips a killed original in its second pass without redistributing the attempt', () => {
  const input = fixture('strafe'), out = record({ ...input, enemyTeam: input.enemyTeam.map((u, i) => i === 0 ? { ...u, life: 1 } : u) });
  expect(out.events.flatMap(e => e.kind === 'damage' && e.source === 'hero' ? [e] : []).map(e => e.target)).toEqual(['target', 'reserve', 'reserve']);
  expect(out.result.enemyTeam[0]?.life).toBe(0);
  expect(out.events.filter(e => e.kind === 'death' && e.target === 'target')).toHaveLength(1);
});
it('Strafe stops immediately after lethal reflection kills the caster', () => {
  const input = fixture('strafe'), out = record({ ...input, playerTeam: input.playerTeam.map(u => ({ ...u, life: 20 })),
    enemyTeam: input.enemyTeam.map(u => ({ ...u, physicalReflectionPct: 1 })) });
  expect(out.events.flatMap(e => e.kind === 'damage' && e.source === 'hero' ? [e] : []).map(e => e.target)).toEqual(['target']);
  expect(out.result.playerTeam[0]?.life).toBe(0); expect(out.result.enemyTeam[1]?.life).toBe(2000);
});
it('Strafe depletes a personal shield across independently reflected attempts', () => {
  const input = fixture('strafe'), out = record({ ...input,
    playerTeam: input.playerTeam.map(u => ({ ...u, statuses: [...u.statuses,
      { id: 'bone-armor', sourceId: u.id, stacks: 1, remaining: -1, boneArmor: { rank: 20, remaining: 50 } }] })),
    enemyTeam: input.enemyTeam.map(u => ({ ...u, physicalReflectionPct: 1 })) });
  const reflection = out.events.flatMap(e => e.kind === 'damage' && e.target === 'hero' ? [e] : []);
  expect(reflection).toHaveLength(4); expect(reflection[0]?.amount).toBe(0);
  expect(reflection.reduce((sum, e) => sum + (e.absorbed ?? 0), 0)).toBe(50);
  expect(out.result.playerTeam[0]?.life).toBe(2000 - reflection.reduce((sum, e) => sum + e.amount, 0));
  expect(out.result.playerTeam[0]?.life).toBeLessThan(2000);
});
