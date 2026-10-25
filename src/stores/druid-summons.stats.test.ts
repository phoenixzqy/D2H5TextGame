import { beforeEach, describe, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { runBattleRecorded } from '@/engine/combat/combat';
import type { CombatUnit } from '@/engine/combat/types';
import { playerToCombatUnit } from './combatHelpers';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useFormationStore } from './formationStore';

const rows = [
  {
    slug: 'raven',
    template: 'raven',
    base: [45, 18, 10],
    growth: [3, 1, 1],
    caps: [1, 2, 8],
    costs: [6, 6, 4]
  },
  {
    slug: 'poison_creeper',
    template: 'poison_creeper',
    base: [90, 16, 18],
    growth: [5, 1, 1],
    caps: [1, 1, 1],
    costs: [8, 8, 6]
  },
  {
    slug: 'summon_spirit_wolf',
    template: 'spirit_wolf',
    base: [80, 20, 10],
    growth: [5, 2, 1],
    caps: [1, 2, 8],
    costs: [14, 14, 11]
  },
  {
    slug: 'summon_dire_wolf',
    template: 'dire_wolf',
    base: [100, 25, 10],
    growth: [8, 2, 1],
    caps: [1, 2, 8],
    costs: [20, 20, 16]
  },
  {
    slug: 'carrion_vine',
    template: 'carrion_vine',
    base: [110, 12, 22],
    growth: [6, 1, 1],
    caps: [1, 1, 1],
    costs: [14, 14, 11]
  },
  {
    slug: 'solar_creeper',
    template: 'solar_creeper',
    base: [120, 12, 24],
    growth: [6, 1, 1],
    caps: [1, 1, 1],
    costs: [18, 18, 15]
  },
  {
    slug: 'summon_grizzly',
    template: 'grizzly',
    base: [260, 45, 35],
    growth: [12, 3, 2],
    caps: [1, 1, 1],
    costs: [35, 35, 30]
  }
] as const;
beforeEach(() => {
  useInventoryStore.getState().reset();
  useMapStore.getState().reset();
  useFormationStore.getState().reset();
});
describe.each(rows)('native authored $template bodies', (row) => {
  it.each([1, 2, 20] as const)(
    'rank%i preserves complete batch cost, cap and actual growing stats',
    (rank) => {
      const id = 'druid.' + row.slug,
        index = rank === 1 ? 0 : rank === 2 ? 1 : 2;
      const native = playerToCombatUnit({
        ...createMockPlayer('Synthetic native summon stats', 'druid'),
        id: 'hero',
        level: 30,
        comboOrder: [id],
        skillLevels: {
          ...Object.fromEntries(rows.map((r) => ['druid.' + r.slug, 1])),
          [id]: rank
        }
      });
      const hero: CombatUnit = {
        ...native,
        mana: 100,
        manaRegenPerSecond: 0,
        manaRegenBaselinePerSecond: 0,
        manaRegenCarry: 0,
        manaRegenCompensation: 0,
        manaRegenExactCarry: '0',
        life: 10000,
        stats: { ...native.stats, life: 10000, lifeMax: 10000, mana: 1000, manaMax: 1000 },
        statuses: [{ id: 'stun', sourceId: 'synthetic-hold', stacks: 1, remaining: -1 }]
      };
      const target: CombatUnit = {
        ...hero,
        id: 'target',
        kind: 'monster',
        side: 'enemy',
        life: 1000000,
        skillOrder: [],
        skillLevels: {},
        stats: {
          ...hero.stats,
          defense: 0,
          magicResist: 0,
          physDodge: 0,
          magicDodge: 0,
          resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0 }
        }
      };
      const input = { seed: 7, playerTeam: [hero], enemyTeam: [target] },
        before = structuredClone(input);
      const out = runBattleRecorded(input),
        spawns = out.events.filter((e) => e.kind === 'summon');
      expect(native.druidSummonRanks).toEqual({ [row.template]: rank });
      expect(spawns).toHaveLength(row.caps[index]);
      for (const event of spawns) {
        expect(event.unit.summonOwnerId).toBe(hero.id);
        expect(event.unit.summonTemplateId).toBe(row.template);
        expect([
          event.unit.stats.lifeMax,
          event.unit.stats.attack,
          event.unit.stats.defense
        ]).toEqual(row.base.map((base, i) => base + (row.growth[i] ?? 0) * (rank - 1)));
        expect(event.unit.life).toBe(event.unit.stats.lifeMax);
      }
      expect(out.events.filter((e) => e.kind === 'mana' && e.reason === 'cast')).toEqual([
        expect.objectContaining({ target: hero.id, mana: 100 - row.costs[index], simClockMs: 0 })
      ]);
      expect(
        out.events.some(
          (e) => e.kind === 'damage' && e.source.startsWith('hero-summon-') && e.amount > 0
        )
      ).toBe(true);
      expect(input).toEqual(before);
      expect(runBattleRecorded(input)).toEqual(out);
    }
  );
});
