import { beforeEach, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { runBattleRecorded } from '@/engine/combat/combat';
import type { CombatUnit } from '@/engine/combat/types';
import { playerToCombatUnit } from './combatHelpers';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';

beforeEach(() => {
  useInventoryStore.getState().reset();
  useMapStore.getState().reset();
});

function scenario(
  form: 'werewolf' | 'werebear',
  rank: number,
  lycanthropy = rank,
  extra: { class?: 'druid' | 'sorceress'; level?: number; combo?: readonly string[] } = {}
) {
  const player = createMockPlayer('Constructed form fixture', extra.class ?? 'druid');
  const native = playerToCombatUnit({
    ...player,
    level: extra.level ?? 30,
    skillLevels: { ['druid.' + form]: rank, 'druid.lycanthropy': lycanthropy },
    comboOrder: [...(extra.combo ?? ['druid.' + form])]
  });
  // Controlled pools/mitigation, real native allocation and real deterministic combat.
  const hero: CombatUnit = {
    ...native,
    life: 700,
    mana: rank === 20 ? 3 : 5,
    manaRegenPerSecond: 0,
    stats: {
      ...native.stats,
      lifeMax: 1000,
      manaMax: 100,
      attack: 1,
      attackSpeed: 100,
      defense: 100,
      physDodge: 0,
      magicDodge: 0,
      critChance: 0
    }
  };
  const enemy: CombatUnit = {
    ...hero,
    id: 'target',
    side: 'enemy',
    kind: 'monster',
    life: 100000,
    mana: 0,
    stats: { ...hero.stats, lifeMax: 100000, defense: 0, attack: 0 },
    skillOrder: [],
    skillLevels: {},
    statuses: [{ id: 'stun', sourceId: 'fixture', remaining: -1, stacks: 1 }]
  };
  return { seed: 7, playerTeam: [hero], enemyTeam: [enemy] };
}

it.each([1, 20])(
  'rank%s Werewolf and Lycanthropy change actual cadence and capacity without healing',
  (rank) => {
    const input = scenario('werewolf', rank),
      frozen = structuredClone(input);
    const out = runBattleRecorded(input);
    const actions = out.events.filter(
      (e) => e.kind === 'action' && e.actor === input.playerTeam[0]?.id
    );
    expect
      .soft(actions.slice(0, 2).map((e) => e.simClockMs))
      .toEqual([1700, rank === 1 ? 3376 : 2920]);
    expect.soft(out.result.playerTeam[0]?.stats.lifeMax).toBe(rank === 1 ? 1030 : 1600);
    expect.soft(out.result.playerTeam[0]?.life).toBe(700);
    expect.soft(out.result.playerTeam[0]?.mana).toBe(0);
    expect(
      actions.filter((e) => e.kind === 'action' && e.skillId === 'druid.werewolf')
    ).toHaveLength(1);
    expect(input).toEqual(frozen);
    expect(runBattleRecorded(input)).toEqual(out);
  }
);

it.each([1, 20])('rank%s Werebear changes capacity and actual physical mitigation', (rank) => {
  const input = scenario('werebear', rank),
    enemy = input.enemyTeam[0];
  if (!enemy) throw new Error('Missing opponent');
  const attacked = {
    ...input,
    enemyTeam: [
      {
        ...enemy,
        statuses: [],
        stats: { ...enemy.stats, attackSpeed: 0 },
        basicAttack: { damage: [300, 300] as const, damageType: 'physical' as const }
      }
    ]
  };
  const out = runBattleRecorded(attacked),
    control = runBattleRecorded({
      ...attacked,
      playerTeam: attacked.playerTeam.map((u) => ({ ...u, skillOrder: [] }))
    });
  expect.soft(out.result.playerTeam[0]?.stats.lifeMax).toBe(rank === 1 ? 1025 : 1500);
  const received = (events: typeof out.events) =>
    events
      .filter((e) => e.kind === 'damage' && e.source === enemy.id && !e.dodged)
      .map((e) => (e.kind === 'damage' ? e.amount : 0));
  expect.soft(received(out.events)[0]).toBeLessThan(received(control.events)[0] ?? 0);
});

it('Lycanthropy alone grants neither human life nor attack speed', () => {
  const input = scenario('werewolf', 0, 20),
    out = runBattleRecorded(input);
  expect(out.result.playerTeam[0]?.stats.lifeMax).toBe(1000);
  expect(
    out.events
      .filter((e) => e.kind === 'action' && e.actor === input.playerTeam[0]?.id)
      .slice(0, 2)
      .map((e) => e.simClockMs)
  ).toEqual([1700, 3400]);
});

it.each([{ class: 'sorceress' as const }, { level: 5 }, {}])(
  'foreign, locked or missing-prerequisite bear allocations do not transform: %j',
  (extra) => {
    const input = scenario('werebear', 20, 0, extra),
      out = runBattleRecorded(input);
    expect(out.events.some((e) => e.kind === 'action' && e.skillId === 'druid.werebear')).toBe(
      false
    );
    expect(out.result.playerTeam[0]?.stats.lifeMax).toBe(1000);
    expect(out.result.playerTeam[0]?.mana).toBe(3);
  }
);

it('chooses the first eligible form once rather than spending on both or stacking them', () => {
  const input = scenario('werewolf', 1, 1, { combo: ['druid.werewolf', 'druid.werebear'] });
  const hero = input.playerTeam[0];
  if (!hero) throw new Error('Missing hero');
  const native = playerToCombatUnit({
    ...createMockPlayer('Both forms', 'druid'),
    level: 30,
    skillLevels: { 'druid.werewolf': 1, 'druid.werebear': 1, 'druid.lycanthropy': 1 },
    comboOrder: ['druid.werewolf', 'druid.werebear']
  });
  const out = runBattleRecorded({
    ...input,
    playerTeam: [
      { ...hero, ...native, stats: hero.stats, life: hero.life, mana: 100, manaRegenPerSecond: 0 }
    ]
  });
  expect(
    out.events
      .filter(
        (e) => e.kind === 'action' && ['druid.werewolf', 'druid.werebear'].includes(e.skillId ?? '')
      )
      .map((e) => (e.kind === 'action' ? e.skillId : ''))
  ).toEqual(['druid.werewolf']);
  expect(out.result.playerTeam[0]?.mana).toBe(95);
});
