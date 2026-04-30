/**
 * Bug A — combatants resolve and cast their configured skills.
 *
 * Integration test exercising chooseSkill + castSkill for cases that
 * historically silently fell back to basic attack:
 *   - Monsters with kebab-case skill ids in JSON.
 *   - Mercs with `mskill-*` / `aura-*` ids on their loadout.
 *
 * Necromancer raise_skeleton is covered by `summon-resummon.test.ts`.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { runBattle, type BattleEvent } from './combat';
import type { CombatUnit } from './types';
import type { DerivedStats } from '../types/attributes';
import { resetSummonCounters } from '../skills/summons';

const baseStats: DerivedStats = {
  life: 200, lifeMax: 200, mana: 200, manaMax: 200, attack: 1, defense: 0,
  attackSpeed: 100, critChance: 0, critDamage: 1.5, physDodge: 0, magicDodge: 0,
  magicFind: 0, goldFind: 0,
  resistances: { fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0, physical: 0 }
};

function mkUnit(over: Partial<CombatUnit> & Pick<CombatUnit, 'id' | 'side'>): CombatUnit {
  return {
    name: over.id, level: 5, tier: 'trash', stats: baseStats,
    life: 200, mana: 200, statuses: [], cooldowns: {}, skillOrder: [],
    activeBuffIds: [], enraged: false, summonedAdds: false, ...over
  };
}

beforeEach(() => { resetSummonCounters(); });

describe('Bug A — skill resolution at combat time', () => {
  it('monsters configured with kebab-case skill ids cast them (not basic attack)', () => {
    const fallen = mkUnit({
      id: 'fallen', side: 'enemy',
      skillOrder: ['monster-strong-melee'],
      stats: { ...baseStats, attack: 5 }
    });
    const target = mkUnit({
      id: 'target', side: 'player', kind: 'hero',
      stats: { ...baseStats, life: 99999, lifeMax: 99999 }, life: 99999
    });
    const result = runBattle({
      seed: 42, playerTeam: [target], enemyTeam: [fallen]
    });
    const skillCasts = result.events.filter(
      (e): e is Extract<BattleEvent, { kind: 'action' }> =>
        e.kind === 'action' &&
        // Engine emits the canonical id from the resolved skill, not the
        // alias from `skillOrder`. Either is acceptable as long as it's
        // not a basic attack (skillId !== null).
        (e.skillId === 'monster.strong_melee' || e.skillId === 'monster-strong-melee')
    );
    expect(skillCasts.length).toBeGreaterThan(0);
  });

  it('merc with mskill-bash signature uses the skill (not basic attack)', () => {
    const merc = mkUnit({
      id: 'merc', side: 'player', kind: 'merc',
      skillOrder: ['mskill-bash'],
      stats: { ...baseStats, attack: 1 }
    });
    const enemy = mkUnit({
      id: 'enemy', side: 'enemy',
      stats: { ...baseStats, life: 99999, lifeMax: 99999, attack: 0 }, life: 99999
    });
    const result = runBattle({
      seed: 7, playerTeam: [merc], enemyTeam: [enemy]
    });
    const bashCasts = result.events.filter(
      (e): e is Extract<BattleEvent, { kind: 'action' }> =>
        e.kind === 'action' && (e.skillId === 'mskill-bash' || e.skillId === 'mskill_bash')
    );
    expect(bashCasts.length).toBeGreaterThan(0);

    const dmgs = result.events
      .filter(
        (e): e is Extract<BattleEvent, { kind: 'damage' }> =>
          e.kind === 'damage' && e.source === 'merc' && !e.dodged
      )
      .map((e) => e.amount);
    expect(dmgs.length).toBeGreaterThan(0);
    const max = Math.max(...dmgs);
    expect(max).toBeGreaterThan(10); // bash base 25-40, basic attack would be 1
  });

  it('aura-* signature ids resolve to self-buff stubs', () => {
    const merc = mkUnit({
      id: 'aura-merc', side: 'player', kind: 'merc',
      skillOrder: ['aura-might', 'mskill-jab'],
      stats: { ...baseStats, attack: 1 }
    });
    const enemy = mkUnit({
      id: 'enemy', side: 'enemy',
      stats: { ...baseStats, life: 99999, lifeMax: 99999, attack: 0 }, life: 99999
    });
    const result = runBattle({
      seed: 13, playerTeam: [merc], enemyTeam: [enemy]
    });
    const buffEvent = result.events.find(
      (e): e is Extract<BattleEvent, { kind: 'buff' }> =>
        e.kind === 'buff' && e.target === 'aura-merc' && e.buffId === 'might'
    );
    expect(buffEvent).toBeDefined();
  });
});
