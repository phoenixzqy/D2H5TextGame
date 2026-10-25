import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { runBattleRecorded, type RecordedBattleEvent } from '@/engine/combat/combat';
import type { CombatUnit } from '@/engine/combat/types';
import { refreshDruidForm } from '@/engine/skills/druid-shapeshifting';
import { getSkill, registerSkill } from '@/engine/skills/registry';
import { computeSkillDisplayModel } from '@/engine/skills/displayStats';
import { PLAYABLE_CLASS_SKILL_DATA } from '@/engine/skills/dataCatalog';
const skills = PLAYABLE_CLASS_SKILL_DATA.druid;
import { playerToCombatUnit } from './combatHelpers';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useFormationStore } from './formationStore';

const cases = [
  {
    slug: 'arctic-blast',
    level: 6,
    mana: 25,
    first: 51,
    growth: 5,
    status: 'chill',
    duration: 2000,
    prerequisites: []
  },
  {
    slug: 'tornado',
    level: 24,
    mana: 30,
    first: 61,
    growth: 6,
    status: '',
    duration: 0,
    prerequisites: ['arctic-blast', 'cyclone-armor', 'twister']
  },
  {
    slug: 'hurricane',
    level: 30,
    mana: 50,
    first: 71,
    growth: 7,
    status: 'chill',
    duration: 2000,
    prerequisites: ['arctic-blast', 'cyclone-armor', 'twister', 'tornado']
  },
  {
    slug: 'twister',
    level: 18,
    mana: 18,
    first: 61,
    growth: 5,
    status: 'stun',
    duration: 1000,
    prerequisites: ['arctic-blast', 'cyclone-armor']
  },
  {
    slug: 'shock-wave',
    level: 24,
    mana: 14,
    first: 51,
    growth: 5,
    status: 'stun',
    duration: 1000,
    prerequisites: ['werewolf', 'lycanthropy', 'werebear', 'werewolf-maul']
  },
  {
    slug: 'fury',
    level: 30,
    mana: 11,
    first: 97,
    growth: 8,
    status: '',
    duration: 0,
    prerequisites: ['werewolf', 'feral-rage', 'rabies']
  }
] as const;
const canonical = (slug: string) => 'druid.' + slug.replaceAll('-', '_');
function fixture(c: (typeof cases)[number], rank: number, grid = false) {
  const id = canonical(c.slug);
  const player = {
    ...createMockPlayer('Synthetic native wind/Fury', 'druid'),
    id: 'native-hero',
    level: 30,
    skillLevels: {
      ...Object.fromEntries(c.prerequisites.map((s) => [canonical(s), 1])),
      [id]: rank
    },
    comboOrder: ['skills-druid-' + c.slug]
  };
  const native = playerToCombatUnit(player);
  const hero: CombatUnit = {
    ...native,
    life: 10000,
    mana: c.mana,
    manaRegenPerSecond: 0,
    manaRegenBaselinePerSecond: 0,
    manaRegenCarry: 0,
    manaRegenCompensation: 0,
    manaRegenExactCarry: '0',
    statuses: [
      { id: 'stun', sourceId: 'synthetic-one-cast', stacks: 1, remaining: -1, appliedAtMs: 1701 }
    ],
    stats: {
      ...native.stats,
      lifeMax: 10000,
      manaMax: 100,
      attack: 1,
      attackSpeed: 100,
      critChance: 0
    }
  };
  const enemies = Array.from(
    { length: grid ? 9 : 1 },
    (_, i): CombatUnit => ({
      ...hero,
      id: 'enemy-' + String(i),
      kind: 'monster',
      side: 'enemy',
      life: 10000,
      mana: 0,
      statuses: [],
      skillOrder: [],
      skillLevels: {},
      increasedDamagePct: {},
      gridPosition: { row: Math.floor(i / 3), col: i % 3 },
      stats: {
        ...hero.stats,
        attack: 1,
        attackSpeed: 0,
        defense: 0,
        magicResist: 0,
        physDodge: 0,
        magicDodge: 0,
        resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0 }
      }
    })
  );
  return { player, native, id, input: { seed: 7, playerTeam: [hero], enemyTeam: enemies } };
}
function reset() {
  useInventoryStore.getState().reset();
  useMapStore.getState().reset();
  useFormationStore.getState().reset();
}
beforeEach(reset);
afterEach(reset);

describe.each(cases)('native $slug actual behavior', (c) => {
  it.each([1, 2, 20])(
    'rank%i pays once and applies actual authored hit damage with immutable replay',
    (rank) => {
      const f = fixture(c, rank),
        before = structuredClone(f.input),
        r = runBattleRecorded(f.input);
      const hits = r.events.filter(
        (e): e is Extract<RecordedBattleEvent, { kind: 'damage' }> =>
          e.kind === 'damage' && e.source === f.native.id
      );
      expect(f.native.skillOrder).toEqual(['skills-druid-' + c.slug]);
      expect(hits[0]).toMatchObject({
        amount: c.first + c.growth * (rank - 1),
        simClockMs: 1700,
        dodged: false,
        crit: false
      });
      expect(hits).toHaveLength(c.slug === 'fury' ? 5 : 1);
      expect(r.result.enemyTeam[0]?.life).toBe(10000 - hits.reduce((n, e) => n + e.amount, 0));
      expect(r.result.playerTeam[0]?.mana).toBe(0);
      expect(r.events.filter((e) => e.kind === 'action' && e.actor === f.native.id)).toEqual([
        expect.objectContaining({ skillId: f.id, simClockMs: 1700 })
      ]);
      const states = r.events.filter(
        (e): e is Extract<RecordedBattleEvent, { kind: 'status-state' }> =>
          e.kind === 'status-state' && e.target === 'enemy-0' && e.simClockMs === 1700
      );
      if (c.status) {
        const appliedStatus = states.flatMap((e) => e.statuses).find((s) => s.id === c.status);
        expect(appliedStatus).toMatchObject({
          id: c.status,
          sourceId: f.native.id,
          appliedAtMs: 1700,
          expiresAtMs: 1700 + c.duration
        });
        expect(r.result.enemyTeam[0]?.statuses.some((s) => s.id === c.status)).toBe(false);
      } else expect(states.flatMap((e) => e.statuses)).toEqual([]);
      expect(f.input).toEqual(before);
      expect(runBattleRecorded(f.input)).toEqual(r);
    }
  );
  it('resolves the actual grid/pool and changes only the selected enemies HP', () => {
    const f = fixture(c, 1, true),
      r = runBattleRecorded(f.input);
    const hits = r.events.filter(
      (e): e is Extract<RecordedBattleEvent, { kind: 'damage' }> =>
        e.kind === 'damage' && e.source === f.native.id
    );
    const targets =
      c.slug === 'arctic-blast'
        ? [1, 3, 4, 5, 7]
        : c.slug === 'tornado'
          ? [0, 1, 2]
          : c.slug === 'twister'
            ? [0, 1]
            : c.slug === 'fury'
              ? [0, 1, 0, 1, 0]
              : [0, 1, 2, 3, 4, 5, 6, 7, 8];
    expect(hits.map((e) => e.target)).toEqual(targets.map((i) => 'enemy-' + String(i)));
    for (const enemy of r.result.enemyTeam) {
      const dealt = hits.filter((e) => e.target === enemy.id).reduce((n, e) => n + e.amount, 0);
      expect(enemy.life).toBe(10000 - dealt);
      if (c.status) {
        const applied = r.events.some(
          (e) => e.kind === 'status' && e.target === enemy.id && e.statusId === c.status
        );
        expect(applied).toBe(hits.some((e) => e.target === enemy.id && !e.dodged));
      }
    }
  });
  it('requires exact class/unlock/cap/full prerequisites and uses maximum valid ID alias allocation', () => {
    const f = fixture(c, 1);
    const valid = {
      ...f.player,
      skillLevels: { ...f.player.skillLevels, ['skills-druid-' + c.slug]: 20 }
    };
    const native = playerToCombatUnit(valid);
    const hero = f.input.playerTeam[0];
    if (!hero) throw new Error('Missing native hero');
    const actual = runBattleRecorded({
      ...f.input,
      playerTeam: [
        { ...hero, skillLevels: native.skillLevels ?? {}, skillOrder: native.skillOrder }
      ]
    });
    expect(actual.events.find((e) => e.kind === 'damage' && e.source === native.id)).toMatchObject({
      amount: c.first + c.growth * 19
    });
    const invalid = [
      { ...valid, class: 'sorceress' as const },
      { ...valid, level: c.level - 1 },
      { ...valid, skillLevels: { ...f.player.skillLevels, [f.id]: 21 } },
      { ...valid, skillLevels: { ...f.player.skillLevels, [f.id]: 1.5 } },
      ...(c.prerequisites.length ? [{ ...valid, skillLevels: { [f.id]: 1 } }] : [])
    ];
    for (const player of invalid) {
      const projected = playerToCombatUnit(player);
      expect(projected.skillOrder).toEqual([]);
      const r = runBattleRecorded({
        ...f.input,
        playerTeam: [
          { ...hero, skillOrder: projected.skillOrder, skillLevels: projected.skillLevels ?? {} }
        ]
      });
      expect(r.events.filter((e) => e.kind === 'action' && e.actor === native.id)).toEqual([
        expect.objectContaining({ skillId: null })
      ]);
      expect(r.result.playerTeam[0]?.mana).toBe(c.mana);
    }
  });
  if (c.status === 'stun')
    it('uses real half-duration boss Stun and agrees with the display', () => {
      const f = fixture(c, 1),
        enemy = f.input.enemyTeam[0];
      if (!enemy) throw new Error('Missing boss');
      const r = runBattleRecorded({ ...f.input, enemyTeam: [{ ...enemy, tier: 'boss' }] });
      const bossStates = r.events.filter(
        (e): e is Extract<RecordedBattleEvent, { kind: 'status-state' }> =>
          e.kind === 'status-state' && e.target === enemy.id && e.simClockMs === 1700
      );
      expect(bossStates.flatMap((e) => e.statuses).find((s) => s.id === 'stun')).toMatchObject({
        id: 'stun',
        expiresAtMs: 2200
      });
      const source = skills.find((s) => s.id === 'skills-druid-' + c.slug);
      if (!source) throw new Error('Missing control data');
      expect(computeSkillDisplayModel(source, 1).current?.control).toEqual({
        durationSeconds: 1,
        bossDurationSeconds: 0.5
      });
    });
  if (c.status === 'stun')
    it('actually interrupts the enemy scheduled inside the real Stun interval', () => {
      const f = fixture(c, 1),
        r = runBattleRecorded(f.input);
      expect(r.events).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ kind: 'stunned', target: 'enemy-0', simClockMs: 2000 })
        ])
      );
      expect(r.events.find((e) => e.kind === 'action' && e.actor === 'enemy-0')).toMatchObject({
        simClockMs: 4000
      });
    });
  if (c.status === 'chill')
    it('actually delays a pending enemy action compared with the same attack without Chill', () => {
      const f = fixture(c, 1),
        enemy = f.input.enemyTeam[0],
        skill = getSkill(f.id);
      if (!enemy || !skill) throw new Error('Missing Chill control');
      // Seed7 misses after the earlier enemy action consumes two rolls; seed1 lands this isolated Chill.
      const input = {
        ...f.input,
        seed: 1,
        enemyTeam: [{ ...enemy, stats: { ...enemy.stats, attackSpeed: 150 } }]
      };
      const actual = runBattleRecorded(input);
      expect(
        actual.events.find(
          (e): e is Extract<RecordedBattleEvent, { kind: 'damage' }> =>
            e.kind === 'damage' && e.source === f.native.id
        )
      ).toMatchObject({ dodged: false });
      let control: ReturnType<typeof runBattleRecorded>;
      try {
        registerSkill({
          ...skill,
          effects: skill.effects.map((e) => {
            if (e.kind !== 'damage') return e;
            const { applyStatus, applyStatuses, ...rest } = e;
            void applyStatus;
            void applyStatuses;
            return rest;
          })
        });
        control = runBattleRecorded(input);
      } finally {
        registerSkill(skill);
      }
      const next = (r: typeof actual) =>
        r.events.find((e) => e.kind === 'action' && e.actor === 'enemy-0' && e.simClockMs > 1700)
          ?.simClockMs;
      expect(next(control)).toBe(2600);
      expect(next(actual)).toBeGreaterThan(2600);
      expect(actual.result.enemyTeam[0]?.life).toBe(control.result.enemyTeam[0]?.life);
    });
});

it.each(['fury', 'shock-wave'] as const)(
  '%s preserves paid wolf/bear without a hidden form dependency',
  (slug) => {
    const c = cases.find((c) => c.slug === slug);
    if (!c) throw new Error('Missing form attack');
    for (const form of ['werewolf', 'werebear'] as const) {
      const f = fixture(c, 1),
        hero = f.input.playerTeam[0];
      if (!hero) throw new Error('Missing hero');
      const shaped = refreshDruidForm(
        {
          ...hero,
          druidShapeRanks: { werewolf: 1, werebear: 1, lycanthropy: 1 },
          skillOrder: ['druid.' + form, f.id]
        },
        form
      );
      expect(shaped.druidForm).toMatchObject({ form });
      const r = runBattleRecorded({ ...f.input, playerTeam: [shaped] });
      expect(r.events.filter((e) => e.kind === 'damage' && e.source === hero.id)).toHaveLength(
        slug === 'fury' ? 5 : 1
      );
      expect(r.result.playerTeam[0]?.druidForm).toMatchObject({ form });
      expect(r.events.some((e) => e.kind === 'action' && e.skillId === 'druid.' + form)).toBe(
        false
      );
    }
  }
);
