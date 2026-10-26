import { beforeEach, afterEach, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { playerToCombatUnit } from '@/stores/combatHelpers';
import { runBattle, runBattleRecorded, type CombatSnapshot } from '@/engine/combat/combat';
import type { ActiveStatus, CombatUnit } from '@/engine/combat/types';
import { resetRegistry, loadDefaultSkills } from '@/engine/skills/registry';

const id = 'skills-necromancer-amplify-damage';
const runtime = 'necromancer.amplify_damage';
const hold = (at = 0): ActiveStatus => ({
  id: 'stun',
  sourceId: 'synthetic-hold',
  stacks: 1,
  remaining: -1,
  appliedAtMs: at
});
beforeEach(() => {
  resetRegistry();
  loadDefaultSkills();
});
afterEach(() => {
  resetRegistry();
  loadDefaultSkills();
});
/** Native learned projection; fixed unearned cadence/HP/resistance isolate the paid effect. */
function fixture(rank: number): CombatSnapshot {
  const projected = playerToCombatUnit({
    ...createMockPlayer('Synthetic native Amplify Damage', 'necromancer'),
    level: 30,
    skillLevels: { [id]: rank },
    comboOrder: [id]
  });
  const hero: CombatUnit = {
    ...projected,
    id: 'hero',
    life: 500,
    mana: rank === 20 ? 11 : 15,
    manaRegenPerSecond: 0,
    manaRegenBaselinePerSecond: 0,
    statuses: [hold(401)],
    stats: {
      ...projected.stats,
      life: 500,
      lifeMax: 500,
      mana: 200,
      manaMax: 200,
      attack: 1,
      defense: 0,
      magicResist: 0,
      attackSpeed: 263,
      critChance: 0,
      critDamage: 1.5,
      physDodge: 0,
      magicDodge: 0,
      resistances: { fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0, physical: 0 }
    }
  };
  const ally: CombatUnit = {
    ...hero,
    id: 'ally',
    kind: 'merc',
    skillOrder: [],
    skillLevels: {},
    statuses: [hold(3401)],
    stats: { ...hero.stats, attack: 100, attackSpeed: 100 }
  };
  const enemy: CombatUnit = {
    ...hero,
    id: 'target',
    kind: 'monster',
    side: 'enemy',
    tier: 'trash',
    skillOrder: [],
    skillLevels: {},
    statuses: [hold()],
    mana: 0,
    stats: {
      ...hero.stats,
      defense: 10,
      magicResist: 10,
      resistances: { fire: 50, cold: 50, lightning: 50, poison: 50, arcane: 50, physical: 50 }
    }
  };
  return { seed: 1, playerTeam: [hero, ally], enemyTeam: [enemy] };
}
it.each([1, 20])(
  'native paid rank%s increases a real ally hit from40 to90 until exact expiry',
  (rank) => {
    const input = fixture(rank),
      before = structuredClone(input);
    const paid = runBattleRecorded(input);
    const control = runBattleRecorded({
      ...input,
      playerTeam: input.playerTeam.map((unit) =>
        unit.id === 'hero' ? { ...unit, statuses: [hold()] } : unit
      )
    });
    const hits = (out: typeof paid) =>
      out.events.flatMap((event) =>
        event.kind === 'damage'
          ? [[event.source, event.target, event.amount, event.simClockMs, event.crit, event.dodged]]
          : []
      );
    expect(hits(paid)).toEqual([
      ['ally', 'target', 90, 1700, false, false],
      ['ally', 'target', 40, 3400, false, false]
    ]);
    expect(hits(control)).toEqual([
      ['ally', 'target', 40, 1700, false, false],
      ['ally', 'target', 40, 3400, false, false]
    ]);
    expect(paid.result.enemyTeam[0]?.life).toBe(370);
    expect(control.result.enemyTeam[0]?.life).toBe(420);
    expect(
      paid.events.filter((event) => event.kind === 'action' && event.actor === 'hero')
    ).toEqual([expect.objectContaining({ skillId: runtime, simClockMs: 400 })]);
    expect(paid.events.filter((event) => event.kind === 'mana' && event.reason === 'cast')).toEqual(
      [expect.objectContaining({ target: 'hero', mana: 0, simClockMs: 400 })]
    );
    expect(paid.events.filter((event) => event.kind === 'status')).toEqual([
      expect.objectContaining({ target: 'target', statusId: 'amplify-damage', simClockMs: 400 })
    ]);
    expect(paid.events.filter((event) => event.kind === 'dot')).toEqual([]);
    expect(paid.result.enemyTeam[0]?.stats).toEqual(input.enemyTeam[0]?.stats);
    expect(paid.result.playerTeam[0]?.mana).toBe(0);
    expect(input).toEqual(before);
    expect(runBattle(input)).toEqual(paid.result);
    expect(runBattleRecorded(input)).toEqual(paid);
  }
);
it.each([
  [1, 14],
  [20, 10]
])('native rank%s with only%s MP cannot buy curse power', (rank, mana) => {
  const input = fixture(rank);
  const out = runBattleRecorded({
    ...input,
    playerTeam: input.playerTeam.map((unit) => (unit.id === 'hero' ? { ...unit, mana } : unit))
  });
  expect(out.events.filter((event) => event.kind === 'mana' && event.reason === 'cast')).toEqual(
    []
  );
  expect(
    out.events.filter((event) => event.kind === 'status' && event.statusId === 'amplify-damage')
  ).toEqual([]);
  expect(out.events.some((event) => event.kind === 'action' && event.skillId === runtime)).toBe(
    false
  );
  expect(out.result.playerTeam[0]?.mana).toBe(mana);
});
it('native projection refuses wrong-class, unlearned and malformed rank authority', () => {
  const original = {
    ...createMockPlayer('Native authority', 'necromancer'),
    level: 30,
    skillLevels: { [id]: 1 },
    comboOrder: [id]
  };
  expect(playerToCombatUnit(original).skillOrder).toEqual([id]);
  for (const patch of [
    { class: 'barbarian' as const },
    { skillLevels: {} },
    ...[0, -1, 1.5, 21, NaN, Infinity].map((rank) => ({ skillLevels: { [id]: rank } }))
  ])
    expect(playerToCombatUnit({ ...original, ...patch }).skillOrder).toEqual([]);
});
