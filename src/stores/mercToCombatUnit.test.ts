/**
 * Bug A — mercToCombatUnit must honour `signatureSkillId` and `comboOrder`
 * instead of falling back to a hardcoded archetype default.
 */
import { describe, it, expect } from 'vitest';
import { mercToCombatUnit } from './mercToCombatUnit';
import type { Mercenary } from '@/engine/types/entities';
import type { DerivedStats } from '@/engine/types/attributes';

const stubStats: DerivedStats = {
  life: 100, lifeMax: 100, mana: 50, manaMax: 50, attack: 10, defense: 0,
  attackSpeed: 100, critChance: 0, critDamage: 1.5, physDodge: 0, magicDodge: 0,
  magicFind: 0, goldFind: 0,
  resistances: { fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0, physical: 0 }
};

function mkMerc(over: Partial<Mercenary>): Mercenary {
  return {
    id: 'm1',
    name: 'Test Merc',
    type: 'mercenary',
    team: 'player',
    level: 5,
    coreStats: { strength: 1, dexterity: 1, vitality: 1, energy: 1 },
    derivedStats: stubStats,
    statusEffects: [],
    cooldowns: [],
    skills: [],
    comboOrder: [],
    alive: true,
    turnOrder: 0,
    archetype: 'front',
    rarity: 'R',
    equipment: [],
    ...over
  } as Mercenary;
}

describe('mercToCombatUnit — Bug A skill loadout', () => {
  it('puts signatureSkillId at the head of skillOrder', () => {
    const merc = mkMerc({
      signatureSkillId: 'aura-might',
      comboOrder: ['mskill-jab']
    });
    const unit = mercToCombatUnit(merc);
    expect(unit.skillOrder[0]).toBe('aura-might');
    expect(unit.skillOrder).toContain('mskill-jab');
  });

  it('dedupes duplicate ids between signatureSkillId and comboOrder', () => {
    const merc = mkMerc({
      signatureSkillId: 'mskill-jab',
      comboOrder: ['mskill-jab']
    });
    const unit = mercToCombatUnit(merc);
    expect(unit.skillOrder).toEqual(['mskill-jab']);
  });

  it('falls back to comboOrder when no signature skill', () => {
    const merc = mkMerc({ comboOrder: ['mskill-fire-ball'] });
    const unit = mercToCombatUnit(merc);
    expect(unit.skillOrder).toEqual(['mskill-fire-ball']);
  });

  it('falls back to archetype defaults only when both fields are empty', () => {
    const merc = mkMerc({ archetype: 'front' });
    const unit = mercToCombatUnit(merc);
    expect(unit.skillOrder.length).toBeGreaterThan(0);
  });
});
