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

const cases = [
  { slug: 'magic-arrow', cost: 5, type: 'arcane', direct: [35, 111], periodic: [0, 0] },
  { slug: 'lightning-bolt', cost: 15, type: 'lightning', direct: [51, 146], periodic: [0, 0] },
  { slug: 'fire-arrow', cost: 8, type: 'fire', direct: [36, 112], periodic: [9, 33] },
  { slug: 'cold-arrow', cost: 10, type: 'cold', direct: [36, 112], periodic: [0, 0] }
] as const;
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
  return { ...createMockPlayer('Synthetic native Amazon single-hit', 'amazon'), id: 'hero',
    level: 30, skillLevels: levels, comboOrder: [id] };
}
/** Real canonical equip/projection; isolated pools and cadence are not earned balance. */
function fixture(slug: string, rank = 1): CombatSnapshot {
  const player = owner(slug, rank); usePlayerStore.getState().setPlayer(player);
  const bow: Item = { id: 'single-hit-training-bow', baseId: 'items/base/weapon-bow-training',
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
for (const skill of cases) {
  const id = 'skills-amazon-' + skill.slug, runtime = 'amazon.' + skill.slug.replaceAll('-', '_');
  it.each([1, 20])(`${skill.slug} rank%i pays once and removes literal direct/periodic HP from one living enemy`, rank => {
    const out = record(fixture(skill.slug, rank)), direct = skill.direct[rank === 20 ? 1 : 0], periodic = skill.periodic[rank === 20 ? 1 : 0];
    expect(out.events.filter(e => e.kind === 'action')).toEqual([
      expect.objectContaining({ actor: 'hero', skillId: runtime, simClockMs: 1700 })]);
    expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toEqual([
      expect.objectContaining({ target: 'hero', mana: 100 - skill.cost, simClockMs: 1700 })]);
    expect(out.events.filter(e => e.kind === 'damage')).toEqual([
      expect.objectContaining({ source: 'hero', target: 'target', amount: direct, damageType: skill.type, dodged: false })]);
    expect(out.events.filter(e => e.kind === 'dot').reduce((n, e) => n + e.amount, 0)).toBe(periodic);
    expect(out.result.enemyTeam.map(u => u.life)).toEqual([2000 - direct - periodic, 2000]);
    expect(out.events.filter(e => e.kind === 'status').map(e => e.statusId)).toEqual(
      skill.slug === 'fire-arrow' ? ['burn'] : skill.slug === 'cold-arrow' ? ['chill'] : []);
    if (skill.slug === 'fire-arrow' || skill.slug === 'cold-arrow') {
      const status = skill.slug === 'fire-arrow' ? 'ignite' : 'chill';
      expect(out.events.some(e => e.kind === 'status-state' && e.target === 'target' && e.statuses.some(s =>
        s.id === status && s.stacks === 1 && s.appliedAtMs === 1700 &&
        s.expiresAtMs === (status === 'ignite' ? 4700 : 3700) &&
        (status === 'chill' || s.dotPerStack === Math.floor(direct * .1))))).toBe(true);
    }
  });
  it(`${skill.slug} requires its actual native class, level, allocated rank and prerequisites`, () => {
    fixture(skill.slug); const player = owner(skill.slug), row = rows.find(r => r.id === id);
    if (!row) throw new Error('Missing Amazon source');
    expect(playerToCombatUnit(player).skillOrder).toHaveLength(1);
    for (const patch of [{ class: 'barbarian' as const }, { level: row.requiredLevel - 1 }, { skillLevels: {} },
      ...[0, -1, 1.5, 21, NaN, Infinity].map(rank => ({ skillLevels: { ...player.skillLevels, [id]: rank } }))])
      expect(playerToCombatUnit({ ...player, ...patch }).skillOrder).toEqual([]);
    for (const prerequisite of Object.keys(player.skillLevels).filter(key => key !== id)) {
      const levels = { ...player.skillLevels }; Reflect.deleteProperty(levels, prerequisite);
      expect(playerToCombatUnit({ ...player, skillLevels: levels }).skillOrder).toEqual([]);
    }
  });
  it.each(['mana', 'cooldown'] as const)(`${skill.slug} refuses %s without payment or payload`, failure => {
    const input = fixture(skill.slug), out = record({ ...input, playerTeam: input.playerTeam.map(u => ({ ...u,
      mana: failure === 'mana' ? skill.cost - 1 : 100,
      cooldowns: failure === 'cooldown' ? { [runtime]: 100000 } : {} })) });
    expect(out.events.some(e => e.kind === 'action' && e.skillId === runtime)).toBe(false);
    expect(out.events.filter(e => e.kind === 'status' || e.kind === 'dot' || e.kind === 'mana' && e.reason === 'cast')).toEqual([]);
  });
  it(`${skill.slug} spends mana on a natural miss without status or periodic HP loss`, () => {
    const out = record({ ...fixture(skill.slug, 20), seed: 41 });
    expect(out.events.filter(e => e.kind === 'damage')).toEqual([expect.objectContaining({ amount: 0, dodged: true })]);
    expect(out.events.filter(e => e.kind === 'status' || e.kind === 'dot')).toEqual([]);
    expect(out.result.playerTeam[0]?.mana).toBe(100 - skill.cost);
    expect(out.result.enemyTeam.map(u => u.life)).toEqual([2000, 2000]);
  });
  it(`${skill.slug} respects typed resistance and the correct flat mitigation stat`, () => {
    const input = fixture(skill.slug), amount = Math.floor(skill.direct[0] * .5 - 7);
    const out = record({ ...input, enemyTeam: input.enemyTeam.map(u => ({ ...u, stats: { ...u.stats,
      defense: skill.type === 'fire' ? 7 : 99999, magicResist: skill.type === 'fire' ? 99999 : 7,
      resistances: { ...u.stats.resistances, [skill.type]: 50 } } })) });
    expect(out.events.filter(e => e.kind === 'damage')).toEqual([expect.objectContaining({ amount, dodged: false })]);
    const periodic = skill.type === 'fire' ? Math.floor(amount * .1) * 3 : 0;
    expect(out.result.enemyTeam.map(u => u.life)).toEqual([2000 - amount - periodic, 2000]);
  });
  it(`${skill.slug} excludes a dead target and never spills a lethal single hit to another enemy`, () => {
    const input = fixture(skill.slug), target = input.enemyTeam[0];
    if (!target) throw new Error('Missing lethal target');
    const out = record({ ...input, enemyTeam: [{ ...target, id: 'already-dead', life: 0 },
      { ...target, life: 1 }, ...input.enemyTeam.slice(1)] });
    expect(out.events.filter(e => e.kind === 'damage')).toEqual([
      expect.objectContaining({ target: 'target', amount: skill.direct[0], dodged: false })]);
    expect(out.events.filter(e => e.kind === 'death')).toEqual([expect.objectContaining({ target: 'target' })]);
    expect(out.events.filter(e => e.kind === 'dot')).toEqual([]);
    expect(out.result.enemyTeam.map(u => u.life)).toEqual([0, 0, 2000]);
  });
  it(`${skill.slug} waits for the next eligible action after one-second cooldown and pays once per cast`, () => {
    const input = fixture(skill.slug);
    const out = record({ ...input, playerTeam: input.playerTeam.map(u => ({ ...u, mana: skill.cost * 2,
      statuses: [hold(1601)], stats: { ...u.stats, attackSpeed: 263 } })) });
    expect(out.events.filter(e => e.kind === 'action' && e.skillId === runtime).map(e => e.simClockMs)).toEqual([400, 1600]);
    expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toHaveLength(2);
    expect(out.result.playerTeam[0]?.mana).toBe(0);
  });
}
it.each([1, 5])('Fire Arrow refreshes an existing %i-stack Burn without replacing its source/rate or exceeding five', stacks => {
  const input = fixture('fire-arrow');
  const out = record({ ...input, enemyTeam: input.enemyTeam.map(u => u.id === 'target' ? { ...u, statuses: [hold(), {
    id: 'ignite', sourceId: 'earlier-fire', stacks, remaining: 1, appliedAtMs: 1700,
    expiresAtMs: 2700, dotPerStack: 2, damageType: 'fire'
  }] } : u) }), next = Math.min(5, stacks + 1);
  expect(out.events.some(e => e.kind === 'status-state' && e.simClockMs === 1700 && e.target === 'target' &&
    e.statuses.some(s => s.id === 'ignite' && s.sourceId === 'earlier-fire' && s.dotPerStack === 2 &&
      s.stacks === next && s.expiresAtMs === 4700))).toBe(true);
  expect(out.events.filter(e => e.kind === 'dot').at(-1)?.simClockMs).toBe(4700);
  expect(out.result.enemyTeam.map(u => u.life)).toEqual([2000 - 36 - next * 6, 2000]);
});
it('Cold Arrow slows actual target actions through its finite Chill and restores the original cadence', () => {
  const input = fixture('cold-arrow');
  const out = record({ ...input,
    playerTeam: input.playerTeam.map(u => ({ ...u, statuses: [hold(1301)], stats: { ...u.stats, attackSpeed: 150 } })),
    enemyTeam: input.enemyTeam.map(u => u.id === 'target' ? { ...u, statuses: [] } : u) });
  const times = out.events.filter(e => e.kind === 'action' && e.actor === 'target').map(e => e.simClockMs);
  [30100 / 17, 3700, 5400].forEach((time, index) => { expect(times[index]).toBeCloseTo(time, 8); });
  expect(out.result.enemyTeam[0]?.stats.attackSpeed).toBe(100);
  expect(out.events.some(e => e.kind === 'status-state' && e.target === 'target' && e.simClockMs === 3300 &&
    e.statuses.every(s => s.id !== 'chill'))).toBe(true);
});
