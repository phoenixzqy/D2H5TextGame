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

const contracts = [
  {
    slug: 'fend',
    cost: 25,
    type: 'physical',
    damage: [
      [71, 83, 76],
      [185, 197, 190]
    ]
  },
  {
    slug: 'exploding-arrow',
    cost: 15,
    type: 'fire',
    damage: [
      [56, 65, 73],
      [151, 160, 168]
    ]
  },
  {
    slug: 'immolation-arrow',
    cost: 30,
    type: 'fire',
    damage: [
      [92, 106, 119],
      [244, 258, 271]
    ]
  },
  {
    slug: 'lightning-fury',
    cost: 30,
    type: 'lightning',
    damage: [
      [61, 72, 82, 76],
      [175, 186, 196, 190]
    ]
  }
] as const;
for (const skill of contracts)
  for (const [index, rank] of [1, 20].entries()) {
    it(`${skill.slug} rank${String(rank)} follows authored spatial order rather than the first-two fallback`, () => {
      const input = fixture(skill.slug, rank),
        target = input.enemyTeam[0];
      if (!target) throw new Error('Missing target');
      const out = record({
        ...input,
        enemyTeam: [
          target,
          { ...target, id: 'outside', gridPosition: { row: 9, col: 9 } },
          { ...target, id: 'east', gridPosition: { row: 0, col: 1 } },
          { ...target, id: 'south', gridPosition: { row: 1, col: 0 } }
        ]
      });
      const targets =
        skill.slug === 'lightning-fury'
          ? ['target', 'east', 'south', 'outside']
          : ['target', 'east', 'south'];
      expect(hits(out).map((e) => [e.target, e.damageType, e.amount])).toEqual(
        targets.map((target, i) => [target, skill.type, skill.damage[index]?.[i]])
      );
      expect(
        out.events.flatMap((e) => (e.kind === 'mana' && e.reason === 'cast' ? [e.mana] : []))
      ).toEqual([100 - skill.cost]);
      expect(out.events.filter((e) => e.kind === 'action' && e.actor === 'hero')).toHaveLength(1);
      if (skill.slug !== 'lightning-fury')
        expect(out.result.enemyTeam.find((u) => u.id === 'outside')?.life).toBe(2000);
      if (skill.type === 'fire') {
        expect(
          out.events.flatMap((e) =>
            e.kind === 'status' && e.statusId === 'burn' ? [e.target] : []
          )
        ).toEqual(targets);
        expect(out.result.enemyTeam.every((u) => !u.statuses.some((s) => s.id === 'ignite'))).toBe(
          true
        );
        expect(out.result.enemyTeam.find((u) => u.id === 'south')?.life).toBe(
          2000 -
            (skill.damage[index]?.[2] ?? 0) -
            3 * Math.floor((skill.damage[index]?.[2] ?? 0) * 0.1)
        );
      }
    });
  }
for (const [slug, cost] of [
  ['fend', 25],
  ['exploding-arrow', 15],
  ['immolation-arrow', 30],
  ['lightning-fury', 30]
] as const) {
  it.each(['mana', 'cooldown'] as const)(
    `${slug} refuses all payloads for insufficient %s`,
    (reason) => {
      const input = fixture(slug),
        runtime = 'amazon.' + slug.replaceAll('-', '_');
      const out = record({
        ...input,
        playerTeam: input.playerTeam.map((u) => ({
          ...u,
          mana: reason === 'mana' ? cost - 1 : 100,
          cooldowns: reason === 'cooldown' ? { [runtime]: 100000 } : {}
        }))
      });
      expect(out.events.some((e) => e.kind === 'action' && e.skillId === runtime)).toBe(false);
      expect(out.events.some((e) => e.kind === 'mana' && e.reason === 'cast')).toBe(false);
      expect(out.result.playerTeam[0]?.mana).toBe(reason === 'mana' ? cost - 1 : 100);
    }
  );
  it(`${slug} filters wrong class, level, hard allocation and prerequisite`, () => {
    fixture(slug);
    const player = owner(slug),
      row = rows.find((r) => r.id === 'skills-amazon-' + slug);
    if (!row) throw new Error('Missing native definition');
    expect(playerToCombatUnit(player).skillOrder).toContain(row.id);
    const absent = { ...player.skillLevels };
    Reflect.deleteProperty(absent, row.id);
    const missing = { ...player.skillLevels };
    const prerequisite = row.prerequisites?.[0];
    if (!prerequisite) throw new Error('Missing native prerequisite');
    Reflect.deleteProperty(missing, prerequisite);
    for (const patch of [
      { class: 'barbarian' as const },
      { level: row.requiredLevel - 1 },
      { skillLevels: absent },
      { skillLevels: missing }
    ])
      expect(playerToCombatUnit({ ...player, ...patch }).skillOrder).not.toContain(row.id);
  });
}
