import { beforeEach, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { runBattle, runBattleRecorded, type CombatSnapshot } from '@/engine/combat/combat';
import type { CombatUnit } from '@/engine/combat/types';
import { playerToCombatUnit } from '@/stores/combatHelpers';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { useFormationStore } from '@/stores/formationStore';

// Current D06 preparation and owner60 body literals; this is not an earned fixture.
const cases = [
  {
    authored: 'skills-necromancer-raise-skeleton',
    id: 'necromancer.raise_skeleton',
    body: 'skeleton',
    cost: 15,
    prerequisites: {},
    caps: [1, 2, 3],
    stats: [
      [1882, 851, 250],
      [1932, 861, 255],
      [2072, 889, 269]
    ]
  },
  {
    authored: 'skills-necromancer-clay-golem',
    id: 'necromancer.clay_golem',
    body: 'clay_golem',
    cost: 15,
    prerequisites: {},
    caps: [1, 1, 1],
    stats: [
      [220, 24, 34],
      [310, 29, 44],
      [562, 43, 72]
    ]
  },
  {
    authored: 'skills-necromancer-revive',
    id: 'necromancer.revive',
    body: 'revived',
    cost: 45,
    prerequisites: { 'necromancer.raise_skeleton': 1, 'necromancer.raise_skeletal_mage': 1 },
    caps: [1, 4, 8],
    stats: [
      [150, 28, 18],
      [210, 38, 23],
      [378, 66, 37]
    ]
  }
] as const;
type Case = (typeof cases)[number];
function fixture(row: Case, rank: number, learned = true, mana = 100): CombatSnapshot {
  const p = {
    ...createMockPlayer('Synthetic ordinary summon', 'necromancer'),
    id: 'hero',
    level: 60,
    skillLevels: { ...row.prerequisites, ...(learned ? { [row.id]: rank } : {}) },
    comboOrder: [row.authored]
  };
  const native = playerToCombatUnit(p);
  const hero: CombatUnit = {
    ...native,
    life: 10000,
    mana,
    manaRegenPerSecond: 0,
    manaRegenBaselinePerSecond: 0,
    manaRegenCarry: 0,
    manaRegenCompensation: 0,
    manaRegenExactCarry: '0',
    stats: {
      ...native.stats,
      life: 10000,
      lifeMax: 10000,
      mana,
      manaMax: 100,
      attack: 1,
      critChance: 0
    },
    statuses: [{ id: 'stun', sourceId: 'synthetic-isolation', stacks: 1, remaining: -1 }]
  };
  const enemy: CombatUnit = {
    ...hero,
    id: 'target',
    name: 'Held synthetic target',
    kind: 'monster',
    side: 'enemy',
    life: 1000000,
    mana: 0,
    skillOrder: [],
    skillLevels: {},
    stats: {
      ...hero.stats,
      life: 1000000,
      lifeMax: 1000000,
      attack: 0,
      defense: 0,
      magicResist: 0,
      physDodge: 0,
      magicDodge: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0 }
    }
  };
  return { seed: 7, playerTeam: [hero], enemyTeam: [enemy] };
}
beforeEach(() => {
  useInventoryStore.getState().reset();
  useMapStore.getState().reset();
  useFormationStore.getState().reset();
});
it.each(cases.flatMap((row) => [1, 6, 20].map((rank, index) => ({ row, rank, index }))))(
  '$row.id rank$rank pays one native batch and its own bodies cause real Physical HP loss',
  ({ row, rank, index }) => {
    const input = fixture(row, rank),
      before = structuredClone(input),
      out = runBattleRecorded(input);
    const cap = row.caps[index],
      stats = row.stats[index];
    if (cap === undefined || stats === undefined) throw new Error('Missing literal oracle');
    expect(input.playerTeam[0]?.skillOrder).toContain(row.authored);
    expect(input.playerTeam[0]?.skillLevels?.[row.id]).toBe(rank);
    const bodies = out.events.filter((e) => e.kind === 'summon');
    expect(bodies).toHaveLength(cap);
    const ids = new Set(bodies.map((e) => e.unit.id));
    expect(ids.size).toBe(cap);
    for (const event of bodies) {
      expect(event).toMatchObject({ summonId: row.body, simClockMs: 0 });
      expect(event.unit).toMatchObject({
        summonOwnerId: 'hero',
        summonTemplateId: row.body,
        kind: 'summon'
      });
      expect([event.unit.stats.lifeMax, event.unit.stats.attack, event.unit.stats.defense]).toEqual(
        stats
      );
    }
    expect(out.events.filter((e) => e.kind === 'mana' && e.reason === 'cast')).toEqual([
      expect.objectContaining({ target: 'hero', mana: 100 - row.cost, simClockMs: 0 })
    ]);
    expect(
      out.events.filter((e) => e.kind === 'action' && e.actor === 'hero' && e.skillId === row.id)
    ).toEqual([expect.objectContaining({ simClockMs: 0 })]);
    const damage = out.events.filter(
      (e) => e.kind === 'damage' && ids.has(e.source) && e.target === 'target'
    );
    expect(damage.length).toBeGreaterThan(0);
    expect(damage.every((e) => e.kind === 'damage' && e.damageType === 'physical')).toBe(true);
    const lost = damage.reduce((sum, e) => sum + (e.kind === 'damage' ? e.amount : 0), 0);
    expect(lost).toBeGreaterThan(0);
    expect(out.result.enemyTeam[0]?.life).toBe(1000000 - lost);
    const control = runBattleRecorded(fixture(row, rank, false));
    expect(control.events.filter((e) => e.kind === 'summon' || e.kind === 'damage')).toEqual([]);
    expect(control.result.enemyTeam[0]?.life).toBe(1000000);
    expect(out.events.filter((e) => e.kind === 'mana' && e.reason === 'summon-refund')).toEqual([]);
    expect(input).toEqual(before);
    expect(runBattleRecorded(input)).toEqual(out);
    expect(runBattle(input)).toEqual(out.result);
  }
);
it.each(cases)('$id denies an unlearned slot without bodies or payment', (row) => {
  const out = runBattleRecorded(fixture(row, 1, false));
  expect(out.events.filter((e) => e.kind === 'summon')).toEqual([]);
  expect(out.events.filter((e) => e.kind === 'mana' && e.reason === 'cast')).toEqual([]);
  expect(out.result.enemyTeam[0]?.life).toBe(1000000);
});
it.each(cases)('$id refuses an unaffordable startup batch atomically', (row) => {
  const input = fixture(row, 20, true, row.cost - 1),
    out = runBattleRecorded(input);
  expect(out.events.filter((e) => e.kind === 'summon')).toEqual([]);
  expect(out.events.filter((e) => e.kind === 'mana' && e.reason === 'cast')).toEqual([]);
  expect(out.result.playerTeam[0]?.mana).toBe(row.cost - 1);
  expect(out.result.enemyTeam[0]?.life).toBe(1000000);
});

it.each(cases)('$id requires an explicitly configured slot even when learned', (row) => {
  const input = fixture(row, 20);
  const hero = input.playerTeam[0];
  if (!hero) throw new Error('Missing native hero');
  const out = runBattleRecorded({ ...input, playerTeam: [{ ...hero, skillOrder: [] }] });
  expect(out.events.filter((e) => e.kind === 'summon')).toEqual([]);
  expect(out.events.filter((e) => e.kind === 'mana' && e.reason === 'cast')).toEqual([]);
  expect(out.result.enemyTeam[0]?.life).toBe(1000000);
});
it.each(cases)('$id does not retry a refused startup batch after mana recovers', (row) => {
  const input = fixture(row, 20, true, row.cost - 1);
  const hero = input.playerTeam[0];
  if (!hero) throw new Error('Missing native hero');
  const out = runBattleRecorded({
    ...input,
    playerTeam: [{ ...hero, manaRegenPerSecond: 100, manaRegenBaselinePerSecond: 100 }]
  });
  expect(out.result.playerTeam[0]?.mana).toBeGreaterThanOrEqual(row.cost);
  expect(out.events.filter((e) => e.kind === 'summon')).toEqual([]);
  expect(out.events.filter((e) => e.kind === 'mana' && e.reason === 'cast')).toEqual([]);
  expect(out.result.enemyTeam[0]?.life).toBe(1000000);
});
