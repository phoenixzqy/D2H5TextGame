import { describe, expect, it } from 'vitest';
import type { CombatUnit } from '../combat/types';
import type { DerivedStats } from '../types/attributes';
import { buildSummon } from './summons';

const ownerStats: DerivedStats = {
  life: 100,
  lifeMax: 100,
  mana: 50,
  manaMax: 50,
  attack: 10,
  defense: 0,
  attackSpeed: 10,
  critChance: 0,
  critDamage: 1.5,
  physDodge: 0,
  magicDodge: 0,
  magicFind: 0,
  goldFind: 0,
  resistances: { fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0, physical: 0 }
};

const owner: CombatUnit = {
  id: 'necro',
  name: 'Necromancer',
  side: 'player',
  level: 12,
  tier: 'trash',
  stats: ownerStats,
  life: 100,
  mana: 50,
  statuses: [],
  cooldowns: {},
  skillOrder: [],
  activeBuffIds: [],
  enraged: false,
  summonedAdds: false,
  kind: 'hero'
};

describe('summon templates', () => {
  it('builds stronger skeletons for the three-skeleton cap', () => {
    const skeleton = buildSummon(owner, 'skeleton');

    expect(skeleton?.stats).toMatchObject({
      life: 112,
      lifeMax: 112,
      attack: 25,
      defense: 14,
      attackSpeed: 70,
      critChance: 0.05,
      critDamage: 1.5,
      physDodge: 0.05,
      magicDodge: 0.05
    });
    expect(skeleton?.life).toBe(112);
  });

  it('does not leak skeleton-specific buffs into placeholder summons', () => {
    const minion = buildSummon(owner, 'minion');

    expect(minion?.stats.life).toBe(40);
    expect(minion?.stats.attack).toBe(10);
    expect(minion?.stats.defense).toBe(10);
  });

  it('builds localized golem summon templates with template ids', () => {
    const clay = buildSummon(owner, 'clay_golem');
    const blood = buildSummon(owner, 'blood_golem');
    const iron = buildSummon(owner, 'iron_golem');
    const fire = buildSummon(owner, 'fire_golem');

    expect(clay).toMatchObject({
      name: 'Clay Golem',
      summonTemplateId: 'clay_golem',
      summonOwnerId: 'necro'
    });
    expect(blood?.stats.attack).toBeGreaterThan(clay?.stats.attack ?? 0);
    expect(iron?.stats.defense).toBeGreaterThan(clay?.stats.defense ?? 0);
    expect(fire?.stats.resistances.fire).toBe(50);
  });
});
