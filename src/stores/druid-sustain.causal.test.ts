import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { refreshDruidForm } from '@/engine/skills/druid-shapeshifting';
import { runBattleRecorded } from '@/engine/combat/combat';
import type { ActiveStatus, CombatUnit } from '@/engine/combat/types';
import { playerToCombatUnit } from './combatHelpers';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useFormationStore } from './formationStore';

const attacks = [
  { slug: 'feral-rage', mana: 3, hit: 46, growth: 4, recovery: 0.1 },
  { slug: 'hunger', mana: 11, hit: 61, growth: 5, recovery: 0.5 }
] as const;
function fixture(attack: (typeof attacks)[number], rank: number, oneHit = true) {
  const id = 'druid.' + attack.slug.replaceAll('-', '_');
  const p = {
    ...createMockPlayer('Synthetic native Druid sustain', 'druid'),
    id: 'sustain-hero',
    level: 30,
    skillLevels: { 'druid.werewolf': 1, 'druid.feral_rage': 1, [id]: rank },
    comboOrder: ['skills-druid-' + attack.slug]
  };
  const native = playerToCombatUnit(p);
  const hold = (at = 0): ActiveStatus => ({
    id: 'stun',
    stacks: 1,
    remaining: -1,
    sourceId: 'synthetic-hold',
    appliedAtMs: at
  });
  const hero: CombatUnit = {
    ...native,
    life: 5000,
    mana: attack.mana,
    manaRegenPerSecond: 0,
    manaRegenBaselinePerSecond: 0,
    manaRegenCarry: 0,
    manaRegenCompensation: 0,
    manaRegenExactCarry: '0',
    statuses: oneHit ? [hold(1701)] : [],
    stats: {
      ...native.stats,
      lifeMax: 10000,
      manaMax: 100,
      attack: 1,
      attackSpeed: 100,
      critChance: 0
    }
  };
  const enemy: CombatUnit = {
    ...hero,
    id: 'held-enemy',
    side: 'enemy',
    kind: 'monster',
    life: 10000,
    mana: 0,
    statuses: [hold()],
    skillOrder: [],
    skillLevels: {},
    increasedDamagePct: {},
    stats: {
      ...hero.stats,
      defense: 0,
      magicResist: 0,
      physDodge: 0,
      magicDodge: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0 }
    }
  };
  return { p, native, id, input: { seed: 7, playerTeam: [hero], enemyTeam: [enemy] } };
}
function reset() {
  useInventoryStore.getState().reset();
  useMapStore.getState().reset();
  useFormationStore.getState().reset();
}
beforeEach(reset);
afterEach(reset);

describe.each(attacks)('BUG193 actual native $slug', (attack) => {
  it.each([1, 2, 20])('rank%i pays once, hits and restores the actual caster HP', (rank) => {
    const f = fixture(attack, rank),
      before = structuredClone(f.input);
    const r = runBattleRecorded(f.input),
      hit = attack.hit + attack.growth * (rank - 1);
    expect(f.native.skillOrder).toEqual(['skills-druid-' + attack.slug]);
    expect(r.events.filter((e) => e.kind === 'action')).toEqual([
      expect.objectContaining({ skillId: f.id, simClockMs: 1700 })
    ]);
    expect(r.events.filter((e) => e.kind === 'damage')).toEqual([
      expect.objectContaining({ source: f.native.id, amount: hit, dodged: false, crit: false })
    ]);
    expect(r.result.playerTeam[0]?.mana).toBe(0);
    const recovered = Math.floor(hit * attack.recovery);
    expect(r.result.playerTeam[0]?.life).toBe(5000 + recovered);
    expect(r.events.filter((e) => e.kind === 'heal')).toEqual([
      expect.objectContaining({ target: f.native.id, amount: recovered, simClockMs: 1700 })
    ]);
    expect(f.input).toEqual(before);
    expect(runBattleRecorded(f.input)).toEqual(r);
  });
});
describe('BUG193 Feral Rage has actual Bleed and attack speed', () => {
  it.each([1, 2, 20])('rank%i applies the previously dropped actual enemy Bleed', (rank) => {
    const attack = attacks[0],
      f = fixture(attack, rank),
      r = runBattleRecorded(f.input);
    const hit = attack.hit + attack.growth * (rank - 1),
      dot = Math.floor(hit * 0.1) * 3;
    expect(r.events.reduce((n, e) => n + (e.kind === 'dot' ? e.amount : 0), 0)).toBe(dot);
    expect(r.result.enemyTeam[0]?.life).toBe(10000 - hit - dot);
  });
  it.each([1, 2, 20])(
    'rank%i changes the actual next-action period without a paid form',
    (rank) => {
      const f = fixture(attacks[0], rank, false),
        r = runBattleRecorded(f.input);
      const actions = r.events.filter((e) => e.kind === 'action' && e.actor === f.native.id);
      expect(actions[0]).toMatchObject({ skillId: f.id, simClockMs: 1700 });
      expect(actions[1]).toMatchObject({ skillId: null, simClockMs: 3360 });
      expect(f.native).toMatchObject({ feralRageRank: rank });
      expect(r.result.playerTeam[0]?.stats.attackSpeed).toBe(100);
      expect(r.result.playerTeam[0]?.druidForm).toBeUndefined();
    }
  );
});

for (const attack of attacks)
  it.each(['werewolf', 'werebear'] as const)(
    attack.slug + ' keeps actual healing and its paid %s form',
    (form) => {
      const f = fixture(attack, 1),
        base = f.input.playerTeam[0];
      if (!base) throw new Error('Missing native form fixture');
      const hero = refreshDruidForm(
        {
          ...base,
          druidShapeRanks: { werewolf: 1, werebear: 1, lycanthropy: 1 },
          skillOrder: ['druid.' + form, f.id]
        },
        form
      );
      expect(hero.druidForm?.form).toBe(form);
      const r = runBattleRecorded({ ...f.input, playerTeam: [hero] });
      expect(r.events.find((e) => e.kind === 'action')).toMatchObject({ skillId: f.id });
      expect(r.result.playerTeam[0]?.life).toBe(5000 + Math.floor(attack.hit * attack.recovery));
      expect(r.result.playerTeam[0]?.druidForm?.form).toBe(form);
      expect(r.events.filter((e) => e.kind === 'heal')).toEqual([
        expect.objectContaining({ amount: Math.floor(attack.hit * attack.recovery) })
      ]);
    }
  );
