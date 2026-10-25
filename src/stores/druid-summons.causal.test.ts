import { beforeEach, describe, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { runBattleRecorded } from '@/engine/combat/combat';
import type { CombatUnit } from '@/engine/combat/types';
import { playerToCombatUnit } from './combatHelpers';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useFormationStore } from './formationStore';

const cases = [
  { slug: 'raven', promise: 'blind', prerequisites: [], costs: [6, 6, 4] },
  { slug: 'poison-creeper', promise: 'poison', prerequisites: [], costs: [8, 8, 6] },
  { slug: 'carrion-vine', promise: 'life', prerequisites: ['poison-creeper'], costs: [14, 14, 11] },
  {
    slug: 'solar-creeper',
    promise: 'mana',
    prerequisites: ['poison-creeper', 'carrion-vine'],
    costs: [18, 18, 15]
  }
] as const;
const canonical = (slug: string) => 'druid.' + slug.replaceAll('-', '_');
beforeEach(() => {
  useInventoryStore.getState().reset();
  useMapStore.getState().reset();
  useFormationStore.getState().reset();
});

describe.each(cases)('BUG195 native $slug effects', (c) => {
  it.each([1, 2, 20])(
    'rank%i performs its advertised effect beyond ordinary attacks and orbs',
    (rank) => {
      const player = {
        ...createMockPlayer('Synthetic native summon', 'druid'),
        id: 'hero',
        level: 30,
        skillLevels: {
          ...Object.fromEntries(c.prerequisites.map((s) => [canonical(s), 1])),
          [canonical(c.slug)]: rank
        },
        comboOrder: ['skills-druid-' + c.slug]
      };
      const native = playerToCombatUnit(player);
      const hero: CombatUnit = {
        ...native,
        life: 500,
        mana: 100,
        manaRegenPerSecond: 0,
        manaRegenBaselinePerSecond: 0,
        manaRegenCarry: 0,
        manaRegenCompensation: 0,
        manaRegenExactCarry: '0',
        stats: {
          ...native.stats,
          life: 10000,
          lifeMax: 10000,
          mana: 1000,
          manaMax: 1000,
          attack: 1,
          defense: 0,
          critChance: 0
        },
        statuses: [{ id: 'stun', sourceId: 'synthetic-isolation', stacks: 1, remaining: -1 }]
      };
      const targets = [1, 1000000].map(
        (life, index): CombatUnit => ({
          ...hero,
          id: 'enemy-' + String(index),
          name: 'Held target ' + String(index),
          side: 'enemy',
          kind: 'monster',
          life,
          mana: 0,
          stats: {
            ...hero.stats,
            life,
            lifeMax: life,
            attack: 0,
            defense: 0,
            magicResist: 0,
            physDodge: 0,
            magicDodge: 0,
            resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0 }
          },
          skillOrder: [],
          skillLevels: {},
          statuses: [{ id: 'stun', sourceId: 'synthetic-isolation', stacks: 1, remaining: -1 }]
        })
      );
      const input = { seed: 7, playerTeam: [hero], enemyTeam: targets },
        before = structuredClone(input),
        r = runBattleRecorded(input);
      const cost = c.costs[rank === 1 ? 0 : rank === 2 ? 1 : 2];
      expect(native.skillOrder).toEqual(['skills-druid-' + c.slug]);
      expect(r.events.filter((e) => e.kind === 'summon')).toHaveLength(
        c.slug === 'raven' ? (rank === 20 ? 8 : rank) : 1
      );
      expect(r.events.filter((e) => e.kind === 'mana' && e.reason === 'cast')).toEqual([
        {
          kind: 'mana',
          target: hero.id,
          mana: 100 - cost,
          reason: 'cast',
          simClockMs: 0,
          uiDelayMs: 50
        }
      ]);
      expect(
        r.events.some(
          (e) => e.kind === 'damage' && e.source.startsWith('hero-summon-') && e.amount > 0
        )
      ).toBe(true);
      expect(r.events.some((e) => e.kind === 'death' && e.target === 'enemy-0')).toBe(true);
      expect(input).toEqual(before);
      expect(runBattleRecorded(input)).toEqual(r);
      const final = r.result.playerTeam.find((u) => u.id === hero.id);
      if (!final) throw new Error('Missing native hero');
      if (c.promise === 'blind') {
        expect(r.events.some((e) => e.kind === 'status' && e.statusId === 'blind')).toBe(true);
      } else if (c.promise === 'poison') {
        expect(
          r.events.some((e) => e.kind === 'dot' && e.target === 'enemy-1' && e.amount > 0)
        ).toBe(true);
        expect(
          r.events.some(
            (e) =>
              e.kind === 'status-state' &&
              e.target === 'enemy-1' &&
              e.statuses.some(
                (s) => s.id === 'poison' && s.damageType === 'poison' && (s.dotPerStack ?? 0) > 0
              )
          )
        ).toBe(true);
        const target = r.result.enemyTeam.find((u) => u.id === 'enemy-1');
        const direct = r.events.reduce(
          (sum, e) => sum + (e.kind === 'damage' && e.target === 'enemy-1' ? e.amount : 0),
          0
        );
        const periodic = r.events.reduce(
          (sum, e) => sum + (e.kind === 'dot' && e.target === 'enemy-1' ? e.amount : 0),
          0
        );
        expect(periodic).toBeGreaterThan(0);
        expect(target?.life).toBe(1000000 - direct - periodic);
      } else {
        const consumed = r.events.filter(
          (e) => e.kind === 'message' && e.messageKey.startsWith('combat:corpses.consumed')
        );
        expect(consumed).toHaveLength(1);
        const hpOrbs = r.events.filter(
          (e) => e.kind === 'orb' && e.target === hero.id && e.orb.kind === 'hp'
        ).length;
        const mpOrbs = r.events.filter(
          (e) => e.kind === 'orb' && e.target === hero.id && e.orb.kind === 'mp'
        ).length;
        if (c.promise === 'life') expect(final.life - hero.life - hpOrbs * 500).toBe(500);
        else expect(final.mana - (hero.mana - cost) - mpOrbs * 50).toBe(50);
      }
    }
  );
});
