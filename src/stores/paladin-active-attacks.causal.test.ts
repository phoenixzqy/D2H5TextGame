import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { runBattleRecorded } from '@/engine/combat/combat';
import type { CombatUnit, ActiveStatus } from '@/engine/combat/types';
import { playerToCombatUnit } from './combatHelpers';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useFormationStore } from './formationStore';
const hold = (at = 0): ActiveStatus => ({
  id: 'stun',
  sourceId: 'synthetic-hold',
  stacks: 1,
  remaining: -1,
  appliedAtMs: at
});
function reset() {
  useInventoryStore.getState().reset();
  useMapStore.getState().reset();
  useFormationStore.getState().reset();
}
beforeEach(reset);
afterEach(reset);
function fixture(slug: string, rank: number, mr = 0) {
  const id = 'paladin.' + slug.replaceAll('-', '_');
  const native = playerToCombatUnit({
    ...createMockPlayer('Synthetic native Paladin attack', 'paladin'),
    id: 'hero',
    level: 30,
    comboOrder: ['skills-paladin-' + slug],
    skillLevels: { 'paladin.holy_bolt': 1, 'paladin.sacrifice': 1, 'paladin.zeal': 1, [id]: rank }
  });
  const hero: CombatUnit = {
    ...native,
    life: 5000,
    mana: slug === 'holy-bolt' ? 15 : slug === 'vengeance' ? 30 : 25,
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
  const enemy: CombatUnit = {
    ...hero,
    id: 'target',
    side: 'enemy',
    kind: 'monster',
    life: 100000,
    statuses: [hold()],
    skillOrder: [],
    skillLevels: {},
    increasedDamagePct: {},
    stats: {
      ...hero.stats,
      life: 100000,
      lifeMax: 100000,
      defense: 0,
      magicResist: mr,
      physDodge: 0,
      magicDodge: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 }
    }
  };
  return { id, native, hero, enemy, input: { seed: 7, playerTeam: [hero], enemyTeam: [enemy] } };
}
describe('BUG196 Holy Bolt actual native healing', () => {
  it.each([1, 2, 20])('rank%i restores half of actual direct HP removed and pays once', (rank) => {
    const f = fixture('holy-bolt', rank),
      before = structuredClone(f.input),
      out = runBattleRecorded(f.input);
    const amount = 51 + 5 * (rank - 1);
    expect(f.native.skillOrder).toEqual(['skills-paladin-holy-bolt']);
    expect(out.events.filter((e) => e.kind === 'action')).toEqual([
      expect.objectContaining({ skillId: f.id, simClockMs: 1700 })
    ]);
    expect(out.events.filter((e) => e.kind === 'damage')).toEqual([
      expect.objectContaining({ amount, damageType: 'arcane', source: 'hero', target: 'target' })
    ]);
    expect(out.events.filter((e) => e.kind === 'heal')).toEqual([
      expect.objectContaining({
        target: 'hero',
        amount: Math.floor(amount * 0.5),
        simClockMs: 1700
      })
    ]);
    expect(out.result.playerTeam[0]?.life).toBe(5000 + Math.floor(amount * 0.5));
    expect(out.result.playerTeam[0]?.mana).toBe(0);
    expect(f.input).toEqual(before);
    expect(runBattleRecorded(f.input)).toEqual(out);
  });
});
describe('BUG196 Vengeance native composite authority', () => {
  it.each([1, 2, 20])(
    'rank%i produces actual Fire/Cold/Lightning and all three statuses from one native selected cast',
    (rank) => {
      const f = fixture('vengeance', rank),
        before = structuredClone(f.input),
        out = runBattleRecorded(f.input);
      expect(f.native.skillOrder).toEqual(['skills-paladin-vengeance']);
      expect(out.events.filter((e) => e.kind === 'action')).toEqual([
        expect.objectContaining({ actor: 'hero', skillId: f.id, simClockMs: 1700 })
      ]);
      expect(out.events.filter((e) => e.kind === 'damage')).toEqual(
        ['fire', 'cold', 'lightning'].map((damageType): unknown =>
          expect.objectContaining({ damageType, amount: 31 + 3 * (rank - 1), simClockMs: 1700 })
        )
      );
      expect(out.events.filter((e) => e.kind === 'status').map((e) => e.statusId)).toEqual([
        'burn',
        'chill',
        'paralyze'
      ]);
      expect(out.result.playerTeam[0]?.mana).toBe(0);
      expect(f.input).toEqual(before);
      expect(runBattleRecorded(f.input)).toEqual(out);
    }
  );
  it.each(['class', 'unlock', 'zeal', 'sacrifice', 'selection'])(
    'does not gain Vengeance from invalid native %s authority',
    (invalid) => {
      const base = {
        ...createMockPlayer('Synthetic ineligible Paladin', 'paladin'),
        level: 30,
        comboOrder: ['skills-paladin-vengeance'],
        skillLevels: { 'paladin.sacrifice': 1, 'paladin.zeal': 1, 'paladin.vengeance': 1 }
      };
      const input =
        invalid === 'class'
          ? { ...base, class: 'druid' as const }
          : invalid === 'unlock'
            ? { ...base, level: 17 }
            : invalid === 'selection'
              ? { ...base, comboOrder: [] }
              : { ...base, skillLevels: { ...base.skillLevels, ['paladin.' + invalid]: 0 } };
      const native = playerToCombatUnit(input);
      expect(native.skillOrder).not.toContain('skills-paladin-vengeance');
      const f = fixture('vengeance', 1);
      const out = runBattleRecorded({
        ...f.input,
        playerTeam: [
          {
            ...f.hero,
            skillOrder: native.skillOrder,
            ...(native.skillLevels ? { skillLevels: native.skillLevels } : {})
          }
        ]
      });
      expect(out.events.some((e) => e.kind === 'action' && e.skillId === 'paladin.vengeance')).toBe(
        false
      );
      expect(
        out.events.some(
          (e) => e.kind === 'damage' && ['fire', 'cold', 'lightning'].includes(e.damageType)
        )
      ).toBe(false);
    }
  );
  it('preserves MP and uses ordinary fallback when the selected composite cast is unaffordable', () => {
    const f = fixture('vengeance', 1),
      out = runBattleRecorded({ ...f.input, playerTeam: [{ ...f.hero, mana: 29 }] });
    expect(out.events.filter((e) => e.kind === 'action')).toEqual([
      expect.objectContaining({ actor: 'hero', skillId: null })
    ]);
    expect(out.events.filter((e) => e.kind === 'damage')).toEqual([
      expect.objectContaining({ damageType: 'physical' })
    ]);
    expect(out.events.filter((e) => e.kind === 'status')).toEqual([]);
    expect(out.result.playerTeam[0]?.mana).toBe(29);
  });
});
describe('BUG196 Blessed Hammer ignores flat MR, preserves percentage resistance', () => {
  it.each([1, 2, 20])(
    'rank%i has identical actual damage at0/30/1000MR without mutating target stats',
    (rank) => {
      const expected = 61 + 6 * (rank - 1);
      for (const mr of [0, 30, 1000]) {
        const f = fixture('blessed-hammer', rank, mr),
          before = structuredClone(f.input),
          out = runBattleRecorded(f.input);
        expect(out.events.filter((e) => e.kind === 'damage')).toEqual([
          expect.objectContaining({ amount: expected, damageType: 'arcane', target: 'target' })
        ]);
        expect(out.result.enemyTeam[0]?.life).toBe(100000 - expected);
        expect(out.result.enemyTeam[0]?.stats.magicResist).toBe(mr);
        expect(out.events.filter((e) => e.kind === 'action')).toHaveLength(1);
        expect(out.result.playerTeam[0]?.mana).toBe(0);
        expect(f.input).toEqual(before);
        expect(runBattleRecorded(f.input)).toEqual(out);
      }
    }
  );
  it('retains target Arcane resistance and leaves ordinary Holy Bolt MR mitigation intact', () => {
    const f = fixture('blessed-hammer', 1, 1000);
    const resistant = {
      ...f.enemy,
      stats: { ...f.enemy.stats, resistances: { ...f.enemy.stats.resistances, arcane: 50 } }
    };
    const hammer = runBattleRecorded({ ...f.input, enemyTeam: [resistant] });
    expect(hammer.events.filter((e) => e.kind === 'damage')).toEqual([
      expect.objectContaining({ amount: 30, damageType: 'arcane' })
    ]);
    const normal = fixture('holy-bolt', 1, 30),
      bolt = runBattleRecorded(normal.input);
    expect(bolt.events.filter((e) => e.kind === 'damage')).toEqual([
      expect.objectContaining({ amount: 21, damageType: 'arcane' })
    ]);
    expect(bolt.result.playerTeam[0]?.life).toBe(5010);
  });
});
