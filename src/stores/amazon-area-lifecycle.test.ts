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
    ...createMockPlayer('Synthetic native Amazon javelin diagnosis', 'amazon'),
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
    id: 'javelin-diagnostic-bow',
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

const hits = (out: ReturnType<typeof record>) =>
  out.events.flatMap((e) => (e.kind === 'damage' && e.source === 'hero' ? [e] : []));

function units(slug: string) {
  const input = fixture(slug),
    hero = input.playerTeam[0],
    target = input.enemyTeam[0];
  if (!hero || !target) throw new Error('Missing native units');
  return { input, hero, target };
}
it('Fend covers five cross cells in stable grid order without diagonal or distant fill', () => {
  const { input, target } = units('fend');
  const out = record({
    ...input,
    enemyTeam: [
      { ...target, gridPosition: { row: 1, col: 1 } },
      { ...target, id: 'east', gridPosition: { row: 1, col: 2 } },
      { ...target, id: 'north', gridPosition: { row: 0, col: 1 } },
      { ...target, id: 'west', gridPosition: { row: 1, col: 0 } },
      { ...target, id: 'south', gridPosition: { row: 2, col: 1 } },
      { ...target, id: 'diagonal', gridPosition: { row: 2, col: 2 } },
      { ...target, id: 'outside', gridPosition: { row: 9, col: 9 } }
    ]
  });
  expect(hits(out).map((e) => e.target)).toEqual(['north', 'west', 'target', 'east', 'south']);
  expect(
    out.result.enemyTeam.filter((u) => ['diagonal', 'outside'].includes(u.id)).map((u) => u.life)
  ).toEqual([2000, 2000]);
});
for (const slug of ['exploding-arrow', 'immolation-arrow'])
  it(
    slug + ' caps nine covered originals and leaves a tenth duplicate cell/outside untouched',
    () => {
      const { input, target } = units(slug);
      const out = record({
        ...input,
        enemyTeam: [
          ...Array.from({ length: 9 }, (_, i) => ({
            ...target,
            id: String(i),
            gridPosition: { row: Math.floor(i / 3), col: i % 3 }
          })),
          { ...target, id: 'tenth', gridPosition: { row: 2, col: 2 } },
          { ...target, id: 'outside', gridPosition: { row: 9, col: 9 } }
        ]
      });
      expect(hits(out).map((e) => e.target)).toEqual(['0', '1', '2', '3', '4', '5', '6', '7', '8']);
      expect(
        out.result.enemyTeam.filter((u) => ['tenth', 'outside'].includes(u.id)).map((u) => u.life)
      ).toEqual([2000, 2000]);
    }
  );
it('Fury chains through six original living enemies with nearest-neighbor and priority ties', () => {
  const { input, target } = units('lightning-fury');
  const positions = [
    ['target', 0, 0],
    ['far', 9, 9],
    ['east', 0, 1],
    ['south', 1, 0],
    ['corner', 1, 1],
    ['near-far', 8, 9]
  ] as const;
  const out = record({
    ...input,
    enemyTeam: positions.map(([id, row, col]) => ({ ...target, id, gridPosition: { row, col } }))
  });
  expect(hits(out).map((e) => e.target)).toEqual([
    'target',
    'east',
    'corner',
    'south',
    'near-far',
    'far'
  ]);
});
it('Fury consumes a missed first attempt and still chains through every other original once', () => {
  const { input, target } = units('lightning-fury');
  const out = record({
    ...input,
    seed: 41,
    enemyTeam: Array.from({ length: 6 }, (_, i) => ({
      ...target,
      id: String(i),
      gridPosition: { row: 0, col: i }
    }))
  });
  expect(hits(out).map((e) => e.target)).toEqual(['0', '1', '2', '3', '4', '5']);
  expect(hits(out)[0]).toMatchObject({ amount: 0, dodged: true });
  expect(
    out.events.some((e) => e.kind === 'status' && e.target === '0' && e.statusId === 'paralyze')
  ).toBe(false);
  expect(
    out.events.flatMap((e) => (e.kind === 'mana' && e.reason === 'cast' ? [e.mana] : []))
  ).toEqual([70]);
});
it('Fend settles lethal reflection before any subsequent area hit', () => {
  const { input, hero, target } = units('fend');
  const out = record({
    ...input,
    playerTeam: [{ ...hero, life: 1 }],
    enemyTeam: [
      { ...target, physicalReflectionPct: 1 },
      { ...target, id: 'nearby', gridPosition: { row: 0, col: 1 } }
    ]
  });
  expect(hits(out)).toHaveLength(1);
  expect(out.result.playerTeam[0]?.life).toBe(0);
  expect(out.result.enemyTeam[1]?.life).toBe(2000);
});
for (const slug of ['exploding-arrow', 'immolation-arrow'])
  it(slug + ' settles lethal Chilling Armor before subsequent explosion hits', () => {
    const { input, hero, target } = units(slug);
    const out = record({
      ...input,
      playerTeam: [{ ...hero, life: 1 }],
      enemyTeam: [
        {
          ...target,
          activeBuffIds: ['chilling-armor'],
          coldArmors: { 'chilling-armor': { sourceId: 'target', rank: 20 } }
        },
        { ...target, id: 'nearby', gridPosition: { row: 0, col: 1 } }
      ]
    });
    expect(hits(out)).toHaveLength(1);
    expect(out.result.playerTeam[0]?.life).toBe(0);
    expect(out.result.enemyTeam[1]?.life).toBe(2000);
  });
