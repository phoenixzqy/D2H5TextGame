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
    ...createMockPlayer('Synthetic native Valkyrie body regression', 'amazon'),
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

const id = 'skills-amazon-valkyrie',
  canonical = 'amazon.valkyrie';
for (const rank of [1, 20]) {
  it(`native paid rank${String(rank)} Valkyrie has the literal complete body and fights`, () => {
    const input = fixture('valkyrie', rank),
      out = record(input);
    const bodies = out.result.playerTeam.filter((unit) => unit.summonTemplateId === 'valkyrie');
    expect(bodies).toHaveLength(1);
    const body = bodies[0];
    if (!body) throw new Error('Missing actual paid Valkyrie');
    expect(body).toMatchObject({
      kind: 'summon',
      summon: true,
      summonOwnerId: 'hero',
      summonTemplateId: 'valkyrie',
      side: 'player',
      level: 30
    });
    expect(body.stats).toMatchObject({
      life: rank === 1 ? 200 : 466,
      lifeMax: rank === 1 ? 200 : 466,
      mana: 0,
      manaMax: 0,
      attack: rank === 1 ? 40 : 97,
      defense: rank === 1 ? 20 : 58,
      attackSpeed: 70,
      critChance: 0.05,
      critDamage: 1.5,
      physDodge: 0.05,
      magicDodge: 0.05,
      magicFind: 0,
      goldFind: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0 }
    });
    expect(
      out.events.filter((event) => event.kind === 'action' && event.skillId === canonical)
    ).toEqual([expect.objectContaining({ actor: 'hero', simClockMs: 0 })]);
    expect(out.events.filter((event) => event.kind === 'mana' && event.reason === 'cast')).toEqual([
      expect.objectContaining({ target: 'hero', mana: 75, simClockMs: 0 })
    ]);
    expect(
      out.events.some(
        (event) => event.kind === 'damage' && event.source === body.id && event.amount > 0
      )
    ).toBe(true);
    expect(input.playerTeam).toHaveLength(1);
  });
  it(`native rank${String(rank)} Valkyrie cannot spawn without the full payment`, () => {
    const input = fixture('valkyrie', rank),
      hero = input.playerTeam[0];
    if (!hero) throw new Error('Missing native owner');
    const out = record({ ...input, playerTeam: [{ ...hero, mana: 24 }] });
    expect(out.result.playerTeam.some((unit) => unit.summonTemplateId === 'valkyrie')).toBe(false);
    expect(out.events.some((event) => event.kind === 'action' && event.skillId === canonical)).toBe(
      false
    );
    expect(out.events.filter((event) => event.kind === 'mana' && event.reason === 'cast')).toEqual(
      []
    );
    expect(out.result.playerTeam[0]?.mana).toBe(24);
  });
}
it('only native learned Amazon eligibility projects Valkyrie into the battle priority', () => {
  const original = owner('valkyrie');
  for (const patch of [
    { class: 'barbarian' as const },
    { level: 29 },
    { skillLevels: {} },
    ...[0, -1, 1.5, 21, NaN, Infinity].map((rank) => ({
      skillLevels: { ...original.skillLevels, [id]: rank }
    }))
  ])
    expect(playerToCombatUnit({ ...original, ...patch }).skillOrder).toEqual([]);
  expect(playerToCombatUnit(original).skillOrder).toEqual([id]);
});
