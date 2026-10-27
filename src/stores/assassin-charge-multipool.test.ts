import { beforeEach, it, expect } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { runBattleRecorded, type CombatSnapshot } from '@/engine/combat/combat';
import type { ActiveStatus, CombatUnit } from '@/engine/combat/types';
import { loadDefaultSkills, resetRegistry } from '@/engine/skills/registry';
import { playerToCombatUnit } from '@/stores/combatHelpers';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { useFormationStore } from '@/stores/formationStore';
const hold = (appliedAtMs = 0): ActiveStatus => ({
  id: 'stun',
  sourceId: 'constructed-hold',
  stacks: 1,
  remaining: -1,
  appliedAtMs
});
function fixture(multi = false, seed = 7, tigerRank = 1, fireRank = 20): CombatSnapshot {
  const native = playerToCombatUnit({
    ...createMockPlayer('Constructed pool acceptance', 'assassin'),
    id: 'hero',
    level: 30,
    comboOrder: multi
      ? [
          'skills-assassin-tiger-strike',
          'skills-assassin-fists-of-fire',
          'skills-assassin-dragon-talon'
        ]
      : ['skills-assassin-tiger-strike'],
    skillLevels: {
      'assassin.tiger_strike': tigerRank,
      'assassin.fists_of_fire': fireRank,
      'assassin.dragon_talon': 1
    }
  });
  const hero: CombatUnit = {
    ...native,
    life: 2000,
    mana: multi ? 1000 : 9,
    manaRegenPerSecond: 0,
    manaRegenBaselinePerSecond: 0,
    statuses: [hold(multi ? 5401 : 8501)],
    stats: {
      ...native.stats,
      lifeMax: 2000,
      manaMax: 1000,
      attackSpeed: multi ? 200 : 100,
      attack: 100,
      defense: 0,
      magicResist: 0,
      physDodge: 0,
      magicDodge: 0,
      critChance: 0,
      critDamage: 2,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0 }
    }
  };
  const target: CombatUnit = {
    id: 'target',
    name: 'Constructed target',
    side: 'enemy',
    kind: 'monster',
    tier: 'trash',
    level: 30,
    life: 99999,
    mana: 0,
    stats: { ...hero.stats, lifeMax: 99999 },
    cooldowns: {},
    activeBuffIds: [],
    skillOrder: [],
    statuses: [hold()],
    enraged: false
  };
  return { seed, playerTeam: [hero], enemyTeam: [target] };
}
beforeEach(() => {
  useInventoryStore.getState().reset();
  useMapStore.getState().reset();
  useFormationStore.getState().reset();
  resetRegistry();
  loadDefaultSkills();
});
it.each([
  [1, 20],
  [20, 1]
])(
  'independent paid Tiger rank%i and Fire rank%i release once in authored order',
  (tigerRank, fireRank) => {
    const input = fixture(true, 7, tigerRank, fireRank),
      before = structuredClone(input),
      out = runBattleRecorded(input);
    expect(input).toEqual(before);
    expect(runBattleRecorded(input)).toEqual(out);
    const actions = out.events.filter((e) => e.kind === 'action').filter((e) => e.actor === 'hero');
    expect(actions.map((e) => [e.simClockMs, e.skillId])).toEqual([
      [900, 'assassin.tiger_strike'],
      [1800, 'assassin.fists_of_fire'],
      [2700, 'assassin.tiger_strike'],
      [3600, 'assassin.fists_of_fire'],
      [4500, 'assassin.tiger_strike'],
      [5400, 'assassin.dragon_talon']
    ]);
    const full = out.events
      .filter((e) => e.kind === 'status-state')
      .filter((e) => e.target === 'hero' && e.simClockMs === 4500)
      .at(-1);
    expect(full?.statuses).toEqual([
      expect.objectContaining({ id: 'charge-tiger-strike', stacks: 3, expiresAtMs: 19500 }),
      expect.objectContaining({ id: 'charge-fists-of-fire', stacks: 2, expiresAtMs: 18600 })
    ]);
    const hits = out.events
      .filter((e) => e.kind === 'damage')
      .filter((e) => e.source === 'hero' && e.simClockMs === 5400);
    expect(hits.map((e) => e.damageType)).toEqual([
      'physical',
      'physical',
      'fire',
      'physical',
      'physical'
    ]);
    expect(hits.every((e) => e.target === 'target' && e.amount > 0)).toBe(true);
    expect(hits[1]?.amount).toBe(tigerRank === 1 ? 98 : 241);
    expect(hits[2]?.amount).toBe(fireRank === 20 ? 144 : 49);
    expect(
      out.events
        .filter((e) => e.kind === 'status-state')
        .filter((e) => e.target === 'hero' && e.simClockMs === 5400)
        .at(-1)?.statuses
    ).toEqual([]);
    expect(
      out.events
        .filter((e) => e.kind === 'mana')
        .filter((e) => e.target === 'hero' && e.reason === 'cast')
    ).toHaveLength(6);
    expect(out.result.playerTeam[0]?.mana).toBe(977);
  }
);
it('retains three paid stacks through a missed basic finisher and releases on the next positive hit', () => {
  const input = fixture(false, 13),
    before = structuredClone(input),
    out = runBattleRecorded(input);
  expect(input).toEqual(before);
  expect(runBattleRecorded(input)).toEqual(out);
  const actions = out.events.filter((e) => e.kind === 'action').filter((e) => e.actor === 'hero');
  expect(actions.map((e) => e.skillId)).toEqual([
    'assassin.tiger_strike',
    'assassin.tiger_strike',
    'assassin.tiger_strike',
    null,
    null
  ]);
  const hits = out.events.filter((e) => e.kind === 'damage').filter((e) => e.source === 'hero');
  expect(hits.filter((e) => e.simClockMs === 6800)).toEqual([
    expect.objectContaining({ amount: 0, dodged: true })
  ]);
  const afterMiss = out.events
    .filter((e) => e.kind === 'status-state')
    .filter((e) => e.target === 'hero' && e.simClockMs === 6800)
    .at(-1);
  expect(afterMiss?.statuses).toEqual([
    expect.objectContaining({ id: 'charge-tiger-strike', stacks: 3, expiresAtMs: 20100 })
  ]);
  expect(hits.filter((e) => e.simClockMs === 8500).map((e) => e.amount)).toEqual([100, 57]);
  expect(
    out.events
      .filter((e) => e.kind === 'status-state')
      .filter((e) => e.target === 'hero' && e.simClockMs === 8500)
      .at(-1)?.statuses
  ).toEqual([]);
  expect(out.result.playerTeam[0]?.mana).toBe(0);
  expect(
    out.events.filter((e) => e.kind === 'mana').filter((e) => e.reason === 'cast')
  ).toHaveLength(3);
});
it('a missed finisher preserves the original exact expiry and cannot release after it', () => {
  const base = fixture(false, 13),
    hero = base.playerTeam[0];
  if (!hero) throw new Error('Missing fixture');
  const input = { ...base, playerTeam: [{ ...hero, statuses: [hold(6801)] }] },
    before = structuredClone(input),
    out = runBattleRecorded(input);
  expect(input).toEqual(before);
  expect(runBattleRecorded(input)).toEqual(out);
  expect(
    out.events
      .filter((e) => e.kind === 'damage')
      .filter((e) => e.source === 'hero' && e.simClockMs === 6800)
  ).toEqual([expect.objectContaining({ amount: 0, dodged: true })]);
  const expired = out.events
    .filter((e) => e.kind === 'status-state')
    .find((e) => e.target === 'hero' && e.simClockMs === 20100);
  expect(expired?.statuses.some((s) => s.id.startsWith('charge-'))).toBe(false);
  expect(
    out.events.some((e) => e.kind === 'damage' && e.source === 'hero' && e.simClockMs > 6800)
  ).toBe(false);
});
