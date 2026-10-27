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

const hold = (appliedAtMs = 0): ActiveStatus => ({
  id: 'stun',
  sourceId: 'synthetic-hold',
  stacks: 1,
  remaining: -1,
  appliedAtMs
});
function owner(slug: string, rank = 1) {
  const levels: Record<string, number> = {};
  function add(id: string) {
    const row = rows.find((row) => row.id === id);
    if (!row) throw new Error('Missing Amazon prerequisite');
    for (const prerequisite of row.prerequisites ?? []) add(prerequisite);
    levels[id] = 1;
  }
  const id = 'skills-amazon-' + slug;
  add(id);
  levels[id] = rank;
  return {
    ...createMockPlayer('Synthetic native Amazon Inner Sight regression', 'amazon'),
    id: 'hero',
    level: 30,
    skillLevels: levels,
    comboOrder: [id]
  };
}
/** Real canonical equip/projection; isolated pools and cadence are not earned balance. */
function fixture(slug: string, rank = 1): CombatSnapshot {
  const player = owner(slug, rank);
  usePlayerStore.getState().setPlayer({ ...player, skillLevels: {}, skillPoints: 29 });
  for (const [id, points] of Object.entries(player.skillLevels))
    for (let point = 0; point < points; point++)
      expect(usePlayerStore.getState().allocateSkillPoint(id)).toBe('ok');
  expect(usePlayerStore.getState().player?.skillPoints).toBe(
    29 - Object.values(player.skillLevels).reduce((a, b) => a + b, 0)
  );
  const bow: Item = {
    id: 'support-diagnostic-bow',
    baseId: 'items/base/weapon-bow-training',
    rarity: 'normal',
    level: 1,
    ilvl: 1,
    baseRolls: { attack: 13 },
    identified: true,
    equipped: false
  };
  useInventoryStore.getState().addItem(bow);
  expect(useInventoryStore.getState().equipItem(bow)).toEqual({ ok: true });
  const current = usePlayerStore.getState().player;
  if (!current) throw new Error('Missing native Amazon');
  const native = playerToCombatUnit(current);
  expect(native.equippedWeapon?.weaponType).toBe('bow');
  const hero: CombatUnit = {
    ...native,
    life: 2000,
    mana: 100,
    manaRegenPerSecond: 0,
    manaRegenBaselinePerSecond: 0,
    statuses: [hold(1701)],
    stats: {
      ...native.stats,
      life: 2000,
      lifeMax: 2000,
      mana: 100,
      manaMax: 100,
      attack: 1,
      attackSpeed: 100,
      defense: 0,
      magicResist: 0,
      critChance: 0,
      critDamage: 1.5,
      physDodge: 0,
      magicDodge: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0 }
    }
  };
  const target: CombatUnit = {
    ...hero,
    id: 'target',
    side: 'enemy',
    kind: 'monster',
    tier: 'trash',
    mana: 0,
    skillOrder: [],
    skillLevels: {},
    statuses: [hold()],
    gridPosition: { row: 0, col: 0 }
  };
  return {
    seed: 7,
    playerTeam: [hero],
    enemyTeam: [target, { ...target, id: 'reserve', gridPosition: { row: 2, col: 2 } }]
  };
}
function record(input: CombatSnapshot) {
  const before = structuredClone(input),
    out = runBattleRecorded(input);
  expect(input).toEqual(before);
  expect(runBattleRecorded(input)).toEqual(out);
  expect(runBattle(input)).toEqual(out.result);
  return out;
}
beforeEach(() => {
  for (const store of [usePlayerStore, useInventoryStore, useMapStore, useFormationStore])
    store.getState().reset();
  resetRegistry();
  loadDefaultSkills();
});
afterEach(() => {
  resetRegistry();
  loadDefaultSkills();
});

const id = 'skills-amazon-inner-sight', canonical = 'amazon.inner_sight';
for (const rank of [1, 20]) {
  it(`paid native Inner Sight rank${String(rank)} changes an ally hit and captures the finite effect`, () => {
    const input = fixture('inner-sight', rank), hero = input.playerTeam[0], target = input.enemyTeam[0];
    if (!hero || !target) throw new Error('Missing native fixture');
    const ally: CombatUnit = { ...hero, id: 'ally', kind: 'merc', skillOrder: [], skillLevels: {},
      statuses: [hold(5101)], stats: { ...hero.stats, attack: 100 } };
    const base = { ...input, enemyTeam: [{ ...target, stats: { ...target.stats, defense: 50 } }], playerTeam: [hero, ally] };
    const control = record({ ...base, playerTeam: [{ ...hero, statuses: [hold()] }, ally] });
    const out = record(base);
    expect(out.events.filter(e => e.kind === 'damage' && e.source === 'ally'))
      .toEqual(control.events.filter(e => e.kind === 'damage' && e.source === 'ally').map(e =>
        e.kind === 'damage' && e.amount > 0 && e.simClockMs > 1700 ? { ...e, amount: 62 } : e));
    expect(out.events.filter(e => e.kind === 'damage' && e.source === 'ally')[0])
      .toMatchObject({ amount: 50, damageType: 'physical', simClockMs: 1700 });
    expect(out.events.find(e => e.kind === 'damage' && e.source === 'ally' && e.simClockMs === 5100))
      .toMatchObject({ amount: 62, damageType: 'physical' });
    const firstHitIndex = out.events.findIndex(e => e.kind === 'damage' && e.source === 'ally');
    const castIndex = out.events.findIndex(e => e.kind === 'action' && e.skillId === canonical);
    expect(firstHitIndex).toBeLessThan(castIndex);
    expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast'))
      .toEqual([expect.objectContaining({ target: 'hero', mana: rank === 20 ? 96 : 95, simClockMs: 1700 })]);
    const applied = out.events.find(e => e.kind === 'status-state' && e.target === 'target' && e.simClockMs === 1700);
    expect(applied?.kind === 'status-state' ? applied.statuses.find(s => s.id === 'inner-sight') : undefined)
      .toMatchObject({ id: 'inner-sight', sourceId: 'hero', stacks: 1, appliedAtMs: 1700, expiresAtMs: 9700,
        innerSight: { defenseReductionPct: 25 } });
    expect(out.result.enemyTeam[0]?.stats).toEqual(base.enemyTeam[0]?.stats);
    expect(out.events.filter(e => e.kind === 'damage' && e.source === 'hero')).toEqual([]);
  });
  it(`native rank${String(rank)} payment/application preserves cadence and expires before later damage`, () => {
    const input = fixture('inner-sight', rank), hero = input.playerTeam[0], target = input.enemyTeam[0];
    if (!hero || !target) throw new Error('Missing native fixture');
    const ally: CombatUnit = { ...hero, id: 'ally', kind: 'merc', skillOrder: [], skillLevels: {},
      statuses: [hold(10201)], stats: { ...hero.stats, attack: 100 } };
    const base = { ...input, enemyTeam: [{ ...target, stats: { ...target.stats, defense: 50 } }], playerTeam: [hero, ally] };
    const control = record({ ...base, playerTeam: [{ ...hero, statuses: [hold()] }, ally] }), out = record(base);
    const prior = control.events.filter(e => e.kind === 'damage' && e.source === 'ally');
    const actual = out.events.filter(e => e.kind === 'damage' && e.source === 'ally');
    expect(actual.map(e => e.simClockMs)).toEqual([1700, 3400, 5100, 6800, 8500, 10200]);
    expect(actual).toEqual(prior.map(e => e.kind === 'damage' && e.amount > 0 && e.simClockMs > 1700 && e.simClockMs < 9700 ? { ...e, amount: 62 } : e));
    expect(actual.at(-1)).toMatchObject({ amount: 50, simClockMs: 10200 });
    const total = actual.reduce((sum, e) => sum + (e.kind === 'damage' ? e.amount : 0), 0);
    expect(out.result.enemyTeam[0]?.life).toBe(2000 - total);
  });
  it(`native rank${String(rank)} rejects insufficient mana and active cooldown without paying`, () => {
    const input = fixture('inner-sight', rank), cost = rank === 20 ? 4 : 5;
    for (const patch of [{ mana: cost - 1 }, { cooldowns: { [canonical]: 100000 } }]) {
      const out = record({ ...input, playerTeam: input.playerTeam.map(u => ({ ...u, ...patch })) });
      expect(out.events.some(e => e.kind === 'action' && e.skillId === canonical)).toBe(false);
      expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toEqual([]);
      expect(out.events.filter(e => e.kind === 'status' && e.statusId === 'inner-sight')).toEqual([]);
    }
  });
}
it('native ownership and learned rank guards exclude unavailable Inner Sight', () => {
  const original = owner('inner-sight');
  for (const patch of [{ class: 'barbarian' as const }, { level: 0 }, { skillLevels: {} },
    ...[0, -1, 1.5, 21, NaN, Infinity].map(rank => ({ skillLevels: { [id]: rank } }))])
    expect(playerToCombatUnit({ ...original, ...patch }).skillOrder).toEqual([]);
  expect(playerToCombatUnit(original).skillOrder).toEqual([id]);
});
it('pays nothing without a living hostile', () => {
  const input = fixture('inner-sight'), out = record({ ...input, enemyTeam: input.enemyTeam.map(u => ({ ...u, life: 0 })) });
  expect(out.result.winner).toBe('player');
  expect(out.events.filter(e => e.kind === 'action' || e.kind === 'mana' || e.kind === 'status')).toEqual([]);
  expect(out.result.playerTeam[0]?.mana).toBe(100);
});
it.each(['trash', 'elite', 'boss', 'chapter-boss'] as const)('applies one finite packet to living %s hostiles only', tier => {
  const input = fixture('inner-sight'), hero = input.playerTeam[0], target = input.enemyTeam[0];
  if (!hero || !target) throw new Error('Missing native fixture');
  const out = record({ ...input, playerTeam: [hero, { ...hero, id: 'ally', kind: 'merc', skillOrder: [], skillLevels: {}, statuses: [hold()] }],
    enemyTeam: [{ ...target, tier }, { ...target, id: 'second', tier }, { ...target, id: 'dead', tier, life: 0 }] });
  expect(out.events.flatMap(e => e.kind === 'status' && e.statusId === 'inner-sight' ? [e.target] : [])).toEqual(['target', 'second']);
  for (const targetId of ['target', 'second']) {
    const applied = out.events.find(e => e.kind === 'status-state' && e.target === targetId && e.simClockMs === 1700);
    expect(applied?.kind === 'status-state' ? applied.statuses.find(s => s.id === 'inner-sight') : undefined)
      .toMatchObject({ appliedAtMs: 1700, expiresAtMs: 9700, stacks: 1, innerSight: { defenseReductionPct: 25 } });
  }
  expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toHaveLength(1);
});
