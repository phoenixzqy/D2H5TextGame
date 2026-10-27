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
    ...createMockPlayer('Synthetic native Amazon single-hit', 'amazon'),
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
  const bow: Item = {
    id: 'single-hit-training-bow',
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

const canonical = 'amazon.ice_arrow';
for (const tier of ['trash', 'boss', 'chapter-boss'] as const)
  it.each([1, 20])(
    `native rank%i Ice Arrow pays once and applies ordered Cold/Freeze/Chill to ${tier}`,
    (rank) => {
      const input = fixture('ice-arrow', rank);
      const out = record({ ...input, enemyTeam: input.enemyTeam.map((u) => ({ ...u, tier })) });
      const amount = rank === 1 ? 56 : 151;
      expect(out.events.filter((e) => e.kind === 'action')).toEqual([
        expect.objectContaining({ actor: 'hero', skillId: canonical, simClockMs: 1700 })
      ]);
      expect(out.events.filter((e) => e.kind === 'mana' && e.reason === 'cast')).toEqual([
        expect.objectContaining({ target: 'hero', mana: 85, simClockMs: 1700 })
      ]);
      expect(out.events.filter((e) => e.kind === 'damage')).toEqual([
        expect.objectContaining({
          source: 'hero',
          target: 'target',
          amount,
          damageType: 'cold',
          dodged: false
        })
      ]);
      expect(out.result.enemyTeam.map((u) => u.life)).toEqual([2000 - amount, 2000]);
      expect(
        out.events.filter((e) => e.kind === 'status').map((e) => [e.simClockMs, e.statusId])
      ).toEqual([
        [1700, 'freeze'],
        [1700, 'chill']
      ]);
      const views = out.events.flatMap((e) =>
        e.kind === 'status-state' && e.target === 'target' ? [e] : []
      );
      expect(
        views.some((e) =>
          e.statuses.some(
            (s) =>
              s.id === 'freeze' &&
              s.appliedAtMs === 1700 &&
              s.expiresAtMs === (tier === 'trash' ? 2700 : 2200)
          )
        )
      ).toBe(true);
      expect(
        views.some((e) =>
          e.statuses.some(
            (s) => s.id === 'chill' && s.appliedAtMs === 1700 && s.expiresAtMs === 3700
          )
        )
      ).toBe(true);
      expect(out.events.filter((e) => e.kind === 'dot')).toEqual([]);
    }
  );
it('native Ice Arrow rejects absent ownership,invalid allocation,unlock and transitive prerequisites', () => {
  fixture('ice-arrow');
  const player = owner('ice-arrow');
  for (const patch of [
    { class: 'barbarian' as const },
    { level: 17 },
    { skillLevels: {} },
    ...[0, -1, 1.5, 21, NaN, Infinity].map((rank) => ({
      skillLevels: { ...player.skillLevels, 'skills-amazon-ice-arrow': rank }
    }))
  ])
    expect(playerToCombatUnit({ ...player, ...patch }).skillOrder).toEqual([]);
  for (const prerequisite of Object.keys(player.skillLevels).filter(
    (id) => id !== 'skills-amazon-ice-arrow'
  )) {
    const levels = { ...player.skillLevels };
    Reflect.deleteProperty(levels, prerequisite);
    expect(playerToCombatUnit({ ...player, skillLevels: levels }).skillOrder).toEqual([]);
  }
});
it.each(['mana', 'cooldown'] as const)(
  'native Ice Arrow refuses %s without payment or afflictions',
  (failure) => {
    const input = fixture('ice-arrow');
    const out = record({
      ...input,
      playerTeam: input.playerTeam.map((u) => ({
        ...u,
        mana: failure === 'mana' ? 14 : 100,
        cooldowns: failure === 'cooldown' ? { [canonical]: 100000 } : {}
      }))
    });
    expect(out.events.some((e) => e.kind === 'action' && e.skillId === canonical)).toBe(false);
    expect(
      out.events.filter((e) => e.kind === 'status' || (e.kind === 'mana' && e.reason === 'cast'))
    ).toEqual([]);
  }
);
it('native Ice Arrow pays on a natural miss without either status', () => {
  const out = record({ ...fixture('ice-arrow', 20), seed: 41 });
  expect(out.events.filter((e) => e.kind === 'damage')).toEqual([
    expect.objectContaining({ amount: 0, dodged: true })
  ]);
  expect(out.events.filter((e) => e.kind === 'status')).toEqual([]);
  expect(out.result.enemyTeam.map((u) => u.life)).toEqual([2000, 2000]);
  expect(out.result.playerTeam[0]?.mana).toBe(85);
});
it('native Ice Arrow applies Cold resistance and magic resist before HP loss', () => {
  const input = fixture('ice-arrow');
  const out = record({
    ...input,
    enemyTeam: input.enemyTeam.map((u) => ({
      ...u,
      stats: {
        ...u.stats,
        defense: 99,
        magicResist: 7,
        resistances: { ...u.stats.resistances, cold: 50 }
      }
    }))
  });
  expect(out.events.filter((e) => e.kind === 'damage')).toEqual([
    expect.objectContaining({ amount: 21, damageType: 'cold', dodged: false })
  ]);
  expect(out.result.enemyTeam.map((u) => u.life)).toEqual([1979, 2000]);
});
