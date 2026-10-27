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
    ...createMockPlayer('Synthetic native Amazon support diagnosis', 'amazon'),
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


function probe(rank = 1, slow = false, overrides: Partial<CombatUnit> = {}, enemyOverrides: Partial<CombatUnit> = {}) {
 const input = fixture('slow-missiles', rank), hero = input.playerTeam[0], target = input.enemyTeam[0];
 if (!hero || !target) throw new Error('Missing native fixture');
 const archer: CombatUnit = { ...target, mana: 1000, statuses: [],
   skillOrder: ['monster-weak-ranged'], skillLevels: { 'monster-weak-ranged': 1 },
   stats: { ...target.stats, mana: 1000, manaMax: 1000 }, ...enemyOverrides };
 return record({ ...input, playerTeam: [{ ...hero, statuses: slow ? [] : [hold()], ...overrides }], enemyTeam: [archer] });
}
it('authored enemy arrow launches before its first impact', () => {
 const out = probe(), action = out.events.find(e => e.kind === 'action' && e.actor === 'target');
 const impact = out.events.find(e => e.kind === 'damage' && e.source === 'target');
 expect(action?.simClockMs).toBe(1700);
 expect(impact?.simClockMs).toBe(2200);
});
for (const rank of [1, 20]) it('paid Slow Missiles rank' + String(rank) + ' delays impacts while preserving launch cadence', () => {
 const base = probe(rank), slow = probe(rank, true);
 const launches = (out: ReturnType<typeof probe>) => out.events.filter(e => e.kind === 'action' && e.actor === 'target').slice(0, 3).map(e => e.simClockMs);
 const impacts = (out: ReturnType<typeof probe>) => out.events.filter(e => e.kind === 'damage' && e.source === 'target').slice(0, 3).map(e => e.simClockMs);
 expect(launches(slow)).toEqual(launches(base));
 expect(launches(slow)).toEqual([1700, 3400, 5100]);
 expect(impacts(slow)[1]).toBeGreaterThan(impacts(base)[1] ?? Infinity);
 const marker = slow.events.flatMap(e => e.kind === 'status-state' && e.target === 'target' ? e.statuses.filter(s => s.id === 'slow-missiles') : [])[0];
 expect(marker?.expiresAtMs).toBe(7700);
});

function impactTimes(out: ReturnType<typeof probe>) {
 return out.events.filter(e => e.kind === 'damage' && e.source === 'target').slice(0, 3).map(e => e.simClockMs);
}
it('paid rank1/20 slows the second real impact to4916ms while normal flight lands3900ms', () => {
 expect(impactTimes(probe())).toEqual([2200, 3900, 5600]);
 for (const rank of [1, 20]) expect(impactTimes(probe(rank, true))).toEqual([3216, 4916, 6616]);
});
it('missing native authority, unlearned rank, borrowed body and insufficient MP cannot slow', () => {
 for (const patch of [{ slowMissilesRank: 0 }, { skillLevels: {} },
 { kind: 'merc' as const }, { ownerId: 'other' }, { mana: 0 }]) {
  const out = probe(1, true, patch);
  expect(out.events.some(e => e.kind === 'action' && e.skillId === 'amazon.slow_missiles')).toBe(false);
  expect(impactTimes(out)).toEqual([2200, 3900, 5600]);
 }
});
it('a copied finite or permanent enemy marker grants no private speed authority', () => {
 for (const marker of [{ id: 'slow-missiles', sourceId: 'hero', stacks: 1, remaining: -1 },
 { id: 'slow-missiles', sourceId: 'hero', stacks: 1, remaining: 6, appliedAtMs: 0, expiresAtMs: 6000 }]) {
  expect(impactTimes(probe(1, false, {}, { statuses: [marker] }))).toEqual([2200, 3900, 5600]);
 }
});
it('melee remains immediate even under a real paid Slow Missiles window', () => {
 const out = probe(1, true, {}, { skillOrder: ['monster-weak-melee'] });
 expect(impactTimes(out)).toEqual([1700, 3400, 5100]);
 expect(out.events.some(e => e.kind === 'status' && e.statusId === 'slow-missiles')).toBe(true);
});
