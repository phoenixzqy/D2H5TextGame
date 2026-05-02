/**
 * Bug #6 (P0) — idle ticks accumulate (engine side).
 *
 * The engine's {@link onlineTick} returns a per-tick delta, not a running
 * total. This test verifies:
 *  1. N successive calls produce N non-zero rewards.
 *  2. The advanced `bonus` snapshot decays the window each tick (no fixed
 *     reuse), so the consumer can persist it and let the bonus expire.
 *  3. With a non-zero raw xp, the sum of N tick rewards equals N * raw
 *     (within bonus-rounding) — i.e. there is no "only-once" cap in the
 *     engine layer. Whether the consumer actually applies the delta to
 *     player xp / inventory is a wiring concern documented in Bugs.md.
 */
import { describe, it, expect } from 'vitest';
import { onlineTick, EMPTY_REWARD, resolveIdleEncounter, type TickReward } from './online-tick';
import { NO_BONUS, accrueOfflineBonus } from './offline-bonus';
import type { EliteConfigDef } from '../types/elite';
import type { SubAreaDef } from '../types/maps';

describe('Bug #6 — onlineTick accumulates per-tick deltas', () => {
  it('returns the same xp each tick when raw input is constant (no zeroing)', () => {
    const raw: TickReward = { ...EMPTY_REWARD, xp: 10, runeShards: 1 };
    let bonus = NO_BONUS;
    let totalXp = 0;
    let totalShards = 0;
    for (let i = 0; i < 50; i++) {
      const r = onlineTick(raw, bonus, { tickSeconds: 6, baseMagicFind: 0 });
      totalXp += r.reward.xp;
      totalShards += r.reward.runeShards;
      bonus = r.bonus;
    }
    expect(totalXp).toBe(500);
    expect(totalShards).toBe(50);
  });

  it('advances the bonus window each tick so it eventually decays', () => {
    const initial = accrueOfflineBonus(4 * 3_600_000, NO_BONUS);
    expect(initial.bonusPct).toBeCloseTo(0.32);
    let bonus = initial;
    for (let i = 0; i < 10; i++) {
      const r = onlineTick({ ...EMPTY_REWARD, xp: 100 }, bonus, {
        tickSeconds: 6,
        baseMagicFind: 0
      });
      expect(r.bonus.elapsedSeconds).toBeGreaterThanOrEqual(bonus.elapsedSeconds);
      bonus = r.bonus;
    }
    expect(bonus.elapsedSeconds).toBe(60);
  });

  it('linear accumulation: 100 ticks × xp=5 = 500 xp', () => {
    const raw: TickReward = { ...EMPTY_REWARD, xp: 5 };
    let bonus = NO_BONUS;
    let total = 0;
    for (let i = 0; i < 100; i++) {
      const r = onlineTick(raw, bonus, { tickSeconds: 6, baseMagicFind: 0 });
      total += r.reward.xp;
      bonus = r.bonus;
    }
    expect(total).toBe(500);
  });

  it('with an active bonus, xp delta exceeds raw xp until window expires', () => {
    const bonus0 = accrueOfflineBonus(2 * 3_600_000, NO_BONUS);
    const r = onlineTick({ ...EMPTY_REWARD, xp: 100 }, bonus0, {
      tickSeconds: 6,
      baseMagicFind: 0
    });
    expect(r.reward.xp).toBeGreaterThan(100);
  });
});

const TEST_SUB_AREA: SubAreaDef = {
  id: 'areas/act1-blood-moor',
  name: 'Blood Moor',
  actId: 'acts/act1',
  areaLevel: 2,
  hasBoss: false,
  lootTable: 'loot/trash-act1',
  difficulty: { finaleBand: 'none', monsterLevelBonus: 0 },
  waves: [
    {
      id: 'w1',
      type: 'trash',
      encounters: [
        {
          id: 'e1',
          level: 2,
          monsters: [{ archetypeId: 'monsters/act1.fallen', count: 3 }]
        }
      ]
    }
  ]
};

const TEST_ELITE_CONFIG: EliteConfigDef = {
  id: 'elite/default',
  normalChampionChance: 0.1,
  normalRareEliteChance: 0.02,
  rareEliteMagicFindBonus: 50,
  rareEliteResistanceBonus: 30,
  chapterBossHpMultiplier: 8,
  multipliers: {
    champion: { life: 3, attack: 1.5, defense: 1.3 },
    rareElite: { life: 4, attack: 2, defense: 1.3 },
    rareMinion: { life: 2, attack: 1.3, defense: 1.15 }
  },
  idle: {
    enabled: true,
    baseEliteChance: 0,
    championShareOfEliteRoll: 0.75,
    rareShareOfEliteRoll: 0.25,
    pityStartMisses: 4,
    pityStep: 0.04,
    pityChanceCap: 0.4,
    hardPityMisses: 11
  },
  affixes: [
    {
      id: 'elite-affix/extra-fire-damage',
      nameKey: 'combat.eliteAffix.extraFireDamage',
      skillId: 'monster-fire-ball'
    }
  ]
};

describe('resolveIdleEncounter', () => {
  it('is deterministic for the same seed and tick', () => {
    const a = resolveIdleEncounter({
      subArea: TEST_SUB_AREA,
      act: 1,
      tickIndex: 3,
      seed: 99,
      playerLevel: 1,
      eliteMisses: 0,
      eliteConfig: TEST_ELITE_CONFIG,
      fallbackArchetypeId: 'monsters/act1.fallen'
    });
    const b = resolveIdleEncounter({
      subArea: TEST_SUB_AREA,
      act: 1,
      tickIndex: 3,
      seed: 99,
      playerLevel: 1,
      eliteMisses: 0,
      eliteConfig: TEST_ELITE_CONFIG,
      fallbackArchetypeId: 'monsters/act1.fallen'
    });
    expect(a).toEqual(b);
  });

  it('hard pity forces the next eligible idle encounter into a rare elite', () => {
    const encounter = resolveIdleEncounter({
      subArea: TEST_SUB_AREA,
      act: 1,
      tickIndex: 12,
      seed: 99,
      playerLevel: 1,
      eliteMisses: 11,
      eliteConfig: TEST_ELITE_CONFIG,
      fallbackArchetypeId: 'monsters/act1.fallen'
    });
    expect(encounter.monsterTier).toBe('rare-elite');
    expect(encounter.nextEliteMisses).toBe(0);
    expect(encounter.feedback.kind).toBe('pity-elite-kill');
  });
});
