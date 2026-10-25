import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { runBattleRecorded, type RecordedBattleEvent } from '@/engine/combat/combat';
import type { CombatUnit, ActiveStatus } from '@/engine/combat/types';
import { playerToCombatUnit } from './combatHelpers';
import { applyEventToTeams, type PlaybackStepResult } from './combatPlayback';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useFormationStore } from './formationStore';
const cases = [
  {
    slug: 'zeal',
    level: 12,
    cost: 10,
    first: 41,
    growth: 4,
    status: '',
    prereqs: ['sacrifice'],
    targets: [1, 3, 4]
  },
  {
    slug: 'smite',
    level: 1,
    cost: 5,
    first: 30,
    growth: 3,
    status: 'stun',
    prereqs: [],
    targets: [0]
  },
  {
    slug: 'charge',
    level: 12,
    cost: 20,
    first: 82,
    growth: 8,
    status: 'stun',
    prereqs: ['smite'],
    targets: [0]
  },
  {
    slug: 'fist-of-heavens',
    level: 30,
    cost: 50,
    first: 103,
    growth: 10,
    status: 'paralyze',
    prereqs: ['holy-bolt', 'blessed-hammer'],
    targets: [0, 1, 2, 3, 4, 5, 6, 7, 8]
  }
] as const;
const canonical = (slug: string) => 'paladin.' + slug.replaceAll('-', '_');
const hold = (at = 0): ActiveStatus => ({
  id: 'stun',
  sourceId: 'synthetic-one-cast',
  remaining: -1,
  stacks: 1,
  appliedAtMs: at
});
function fixture(c: (typeof cases)[number], rank: number) {
  const id = canonical(c.slug),
    player = {
      ...createMockPlayer('Synthetic native Paladin controls', 'paladin'),
      id: 'hero',
      level: 30,
      skillLevels: { ...Object.fromEntries(c.prereqs.map((s) => [canonical(s), 1])), [id]: rank },
      comboOrder: ['skills-paladin-' + c.slug]
    };
  const native = playerToCombatUnit(player);
  const hero: CombatUnit = {
    ...native,
    life: 5000,
    mana: c.cost,
    manaRegenPerSecond: 0,
    manaRegenBaselinePerSecond: 0,
    manaRegenCarry: 0,
    manaRegenCompensation: 0,
    manaRegenExactCarry: '0',
    statuses: [hold(1701)],
    stats: {
      ...native.stats,
      life: 10000,
      lifeMax: 10000,
      mana: 100,
      manaMax: 100,
      attack: 1,
      attackSpeed: 100,
      critChance: 0
    }
  };
  const enemyTeam: CombatUnit[] = Array.from({ length: 9 }, (_, index) => ({
    ...hero,
    id: 'target-' + String(index),
    side: 'enemy',
    kind: 'monster',
    life: 100000,
    mana: 0,
    statuses: [hold()],
    skillOrder: [],
    skillLevels: {},
    increasedDamagePct: {},
    gridPosition: { row: Math.floor(index / 3), col: index % 3 },
    stats: {
      ...hero.stats,
      life: 100000,
      lifeMax: 100000,
      attack: 1,
      defense: 0,
      magicResist: 0,
      physDodge: 0,
      magicDodge: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0 }
    }
  }));
  return { id, player, native, hero, input: { seed: 7, playerTeam: [hero], enemyTeam } };
}
function reset() {
  useInventoryStore.getState().reset();
  useMapStore.getState().reset();
  useFormationStore.getState().reset();
}
beforeEach(reset);
afterEach(reset);
describe.each(cases)('native $slug authority, hit and resource playback', (c) => {
  it.each([1, 2, 20])(
    'rank%i pays once, affects exact targets and replays actual final HP/MP',
    (rank) => {
      const f = fixture(c, rank),
        before = structuredClone(f.input),
        out = runBattleRecorded(f.input);
      const hits = out.events.filter(
        (e): e is Extract<RecordedBattleEvent, { kind: 'damage' }> =>
          e.kind === 'damage' && e.source === f.native.id
      );
      expect(f.native.skillOrder).toEqual(['skills-paladin-' + c.slug]);
      expect(hits.map((e) => e.target)).toEqual(c.targets.map((i) => 'target-' + String(i)));
      expect(hits[0]?.amount).toBe(c.first + c.growth * (rank - 1));
      expect(out.events.filter((e) => e.kind === 'action')).toEqual([
        expect.objectContaining({ actor: f.native.id, skillId: f.id, simClockMs: 1700 })
      ]);
      expect(out.result.playerTeam[0]?.mana).toBe(0);
      const statuses = out.events.filter((e) => e.kind === 'status');
      expect(statuses).toHaveLength(c.status ? c.targets.length : 0);
      if (c.status) expect(statuses.every((e) => e.statusId === c.status)).toBe(true);
      let teams: PlaybackStepResult = {
        playerTeam: f.input.playerTeam,
        enemyTeam: f.input.enemyTeam
      };
      for (const event of out.events)
        teams = applyEventToTeams(teams.playerTeam, teams.enemyTeam, event);
      for (const side of ['playerTeam', 'enemyTeam'] as const)
        expect(teams[side].map((u) => [u.id, u.life, u.mana])).toEqual(
          out.result[side].map((u) => [u.id, u.life, u.mana])
        );
      expect(f.input).toEqual(before);
      expect(runBattleRecorded(f.input)).toEqual(out);
    }
  );
  it('rejects foreign class, unlearned, overcap, locked and missing-prerequisite native authority', () => {
    const f = fixture(c, 1);
    const invalid = [
      { ...f.player, class: 'druid' as const },
      { ...f.player, skillLevels: { ...f.player.skillLevels, [f.id]: 0 } },
      { ...f.player, skillLevels: { ...f.player.skillLevels, [f.id]: 21 } },
      ...(c.level > 1 ? [{ ...f.player, level: c.level - 1 }] : []),
      ...(c.prereqs.length ? [{ ...f.player, skillLevels: { [f.id]: 1 } }] : []),
      { ...f.player, comboOrder: [] }
    ];
    for (const player of invalid) {
      const native = playerToCombatUnit(player);
      expect(native.skillOrder).not.toContain('skills-paladin-' + c.slug);
      const out = runBattleRecorded({
        ...f.input,
        playerTeam: [
          { ...f.hero, skillOrder: native.skillOrder, skillLevels: native.skillLevels ?? {} }
        ]
      });
      expect(out.events.filter((e) => e.kind === 'action')).toEqual([
        expect.objectContaining({ skillId: null })
      ]);
      expect(out.result.playerTeam[0]?.mana).toBe(c.cost);
      expect(out.events.filter((e) => e.kind === 'status')).toEqual([]);
    }
  });
  it('accepts both persisted aliases without changing selected identity', () => {
    const f = fixture(c, 1);
    for (const alias of [f.id, 'skills-paladin-' + c.slug])
      expect(playerToCombatUnit({ ...f.player, comboOrder: [alias] }).skillOrder).toEqual([alias]);
  });
});
