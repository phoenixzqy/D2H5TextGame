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
import { runBattle, runBattleRecorded, type BattleEvent, type CombatSnapshot } from './combat';
import type { CombatUnit } from './types';
import type { DerivedStats } from '../types/attributes';
import { resetSummonCounters } from '../skills/summons';
import { getSkill } from '../skills/registry';

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

function fireBoltSnapshot(rank = 1, attack = 1) {
  return {
    seed: 7,
    playerTeam: [mkUnit({
      id: 'sorceress', side: 'player', kind: 'hero', mana: 8,
      skillOrder: ['skills-sorceress-fire-bolt'], skillLevels: { 'skills-sorceress-fire-bolt': rank },
      stats: { ...baseStats, attack },
      // One real cast at 1700ms; subsequent actions are held to isolate its complete burn.
      statuses: [{ id: 'stun', stacks: 1, remaining: -1, sourceId: 'fixture', appliedAtMs: 1701 }]
    })],
    enemyTeam: [mkUnit({
      id: 'target', side: 'enemy', life: 500,
      stats: { ...baseStats, life: 500, lifeMax: 500 },
      statuses: [{ id: 'stun', stacks: 1, remaining: -1, sourceId: 'fixture' }]
    })]
  } as const satisfies CombatSnapshot;
}

describe('P08a01 production Fire Bolt', () => {
  it.each([
    { rank: 1, hit: 30, hp: 461, dots: [[3400, 5], [4700, 4]] },
    { rank: 20, hit: 106, hp: 364, dots: [[3400, 17], [4700, 13]] }
  ])('deals the literal seeded rank $rank hit and full three-second burn', ({ rank, hit, hp, dots }) => {
    expect(getSkill('skills-sorceress-fire-bolt')).toMatchObject({
      id: 'sorceress.fire_bolt', manaCost: 8, cooldown: 1,
      effects: [{ kind: 'damage', base: [30, 45], perRank: [4, 4], damageType: 'fire',
        applyStatus: { id: 'burn', dotPctOfDamage: 0.1 } }]
    });
    const input = fireBoltSnapshot(rank);
    const before = structuredClone(input);
    const first = runBattleRecorded(input);
    // Seed 7's first hit/range/crit/status draws produce 30, or 30 + 19*4.
    expect(first.events.filter(e => e.kind === 'damage')).toEqual([
      expect.objectContaining({ source: 'sorceress', target: 'target', amount: hit,
        crit: false, dodged: false, simClockMs: 1700 })
    ]);
    expect(first.events.filter(e => e.kind === 'dot').map(e => [e.simClockMs, e.amount]))
      .toEqual(dots);
    expect(first.result.enemyTeam[0]?.life).toBe(hp);
    expect(first.result.enemyTeam[0]?.statuses.map(s => s.id)).toEqual(['stun']);
    expect(first.result.playerTeam[0]?.mana).toBe(0);
    expect(runBattleRecorded(input)).toEqual(first);
    expect(runBattle(input)).toEqual(first.result);
    expect(input).toEqual(before);
  });

  it('keeps spell damage and burn independent of weapon attack', () => {
    const low = runBattleRecorded(fireBoltSnapshot(1, 1));
    const high = runBattleRecorded(fireBoltSnapshot(1, 10_000));
    const damage = (result: typeof low) => result.events.filter(e => e.kind === 'damage' || e.kind === 'dot');
    expect(damage(high)).toEqual(damage(low));
    expect(high.result.enemyTeam[0]?.life).toBe(461);
    expect(low.result.enemyTeam[0]?.life).toBe(461);
  });

  it('falls back to a basic attack at seven mana without applying burn or spending mana', () => {
    const input = fireBoltSnapshot();
    const hero = input.playerTeam[0];
    const result = runBattleRecorded({ ...input, playerTeam: [{ ...hero, mana: 7 }] });
    expect(result.events.filter(e => e.kind === 'action')).toEqual([
      expect.objectContaining({ actor: 'sorceress', skillId: null, simClockMs: 1700 })
    ]);
    expect(result.events.filter(e => e.kind === 'status' || e.kind === 'dot')).toEqual([]);
    expect(result.result.enemyTeam[0]?.life).toBe(499);
    expect(result.result.playerTeam[0]?.mana).toBe(7);
  });

  it('spends a cast cost on a seeded miss but applies no status or periodic damage', () => {
    const input = fireBoltSnapshot();
    const target = input.enemyTeam[0];
    const result = runBattleRecorded({ ...input, seed: 1,
      enemyTeam: [{ ...target, stats: { ...target.stats, magicDodge: 1 } }] });
    expect(result.events.filter(e => e.kind === 'damage')).toEqual([
      expect.objectContaining({ amount: 0, dodged: true, simClockMs: 1700 })
    ]);
    expect(result.events.filter(e => e.kind === 'status' || e.kind === 'dot')).toEqual([]);
    expect(result.result.enemyTeam[0]?.life).toBe(500);
    expect(result.result.playerTeam[0]?.mana).toBe(0);
  });

  it('uses a basic attack during the one-second cooldown even when another cast is affordable', () => {
    const input = fireBoltSnapshot();
    const hero = input.playerTeam[0];
    const result = runBattleRecorded({ ...input, playerTeam: [{ ...hero, mana: 16,
      stats: { ...hero.stats, attackSpeed: 263 },
      statuses: [{ id: 'stun', stacks: 1, remaining: -1, sourceId: 'fixture', appliedAtMs: 801 }]
    }] });
    expect(result.events.filter(e => e.kind === 'action').map(e =>
      [e.simClockMs, e.skillId]))
      .toEqual([[400, 'sorceress.fire_bolt'], [800, null]]);
    expect(result.result.playerTeam[0]?.mana).toBe(8);
    expect(result.events.filter(e => e.kind === 'damage').map(e => e.amount))
      .toEqual([30, 1]);
  });

  it('allows the next cast at the exact cooldown boundary', () => {
    const input = fireBoltSnapshot();
    const hero = input.playerTeam[0];
    const result = runBattleRecorded({ ...input, playerTeam: [{ ...hero, mana: 16,
      stats: { ...hero.stats, attackSpeed: 250 },
      statuses: [{ id: 'stun', stacks: 1, remaining: -1, sourceId: 'fixture', appliedAtMs: 1501 }]
    }] });
    // A 500ms cadence reaches the first cast's 1500ms cooldown expiry exactly.
    expect(result.events.filter(e => e.kind === 'action').map(e =>
      [e.simClockMs, e.skillId]))
      .toEqual([[500, 'sorceress.fire_bolt'], [1000, null], [1500, 'sorceress.fire_bolt']]);
    expect(result.result.playerTeam[0]?.mana).toBe(0);
  });

  it('does not invent a DoT rate for production Firestorm', () => {
    const input = fireBoltSnapshot();
    const hero = input.playerTeam[0];
    const result = runBattleRecorded({ ...input, playerTeam: [{ ...hero, mana: 20,
      skillOrder: ['skills-druid-firestorm'], skillLevels: { 'skills-druid-firestorm': 1 }
    }] });
    expect(result.events.filter(e => e.kind === 'damage')).toEqual([
      expect.objectContaining({ amount: 41, simClockMs: 1700 })
    ]);
    expect(result.events.filter(e => e.kind === 'dot')).toEqual([]);
    expect(result.result.enemyTeam[0]?.life).toBe(459);
    expect(result.result.playerTeam[0]?.mana).toBe(0);
  });
});

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
