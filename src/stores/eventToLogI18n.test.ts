/**
 * Tests for the i18n-aware combat-event → log-entry conversion.
 *
 * Bonus i18n cleanup (fix/combat-map-screen-bugs branch) — skill ids
 * emitted by the engine (`barbarian.bash`, `necromancer.skeleton-mastery`,
 * …) must be rendered as their localized human-readable names in the
 * combat log, never as the raw dotted id.
 */
import { describe, it, expect } from 'vitest';
import { eventToLocalizedLogEntry } from './eventToLogI18n';
import type { BattleEvent } from '@/engine/combat/combat';
import type { CombatUnit } from '@/engine/combat/types';
import type { DerivedStats } from '@/engine/types/attributes';

describe('eventToLocalizedLogEntry — skill-name i18n', () => {
  it('translates a known skill id to its localized name (zh-CN default)', () => {
    const event: BattleEvent = {
      kind: 'action',
      actor: 'player-001',
      skillId: 'barbarian.bash'
    };
    const entry = eventToLocalizedLogEntry(event, new Map([['player-001', 'Astaroth']]));
    expect(entry).not.toBeNull();
    expect(entry?.message).toBeTruthy();
    // Must include the localized name (重击) and must NOT include the raw id.
    expect(entry?.message).toContain('重击');
    expect(entry?.message).not.toMatch(/\bbarbarian\.bash\b/);
  });

  it('falls back to the raw id when the translation is missing', () => {
    const event: BattleEvent = {
      kind: 'action',
      actor: 'player-001',
      skillId: 'definitely.not-a-real-skill'
    };
    const entry = eventToLocalizedLogEntry(event, new Map([['player-001', 'A']]));
    expect(entry?.message).toContain('definitely.not-a-real-skill');
  });

  it('localizes summon names in visible summon log lines', () => {
    const stats: DerivedStats = {
      life: 1,
      lifeMax: 1,
      mana: 0,
      manaMax: 0,
      attack: 1,
      defense: 0,
      attackSpeed: 1,
      critChance: 0,
      critDamage: 1.5,
      physDodge: 0,
      magicDodge: 0,
      magicFind: 0,
      goldFind: 0,
      resistances: { fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0, physical: 0 }
    };
    const unit: CombatUnit = {
      id: 'player-summon-skeleton-1',
      name: 'Skeleton Warrior',
      side: 'player',
      level: 1,
      tier: 'trash',
      stats,
      life: 1,
      mana: 0,
      statuses: [],
      cooldowns: {},
      skillOrder: [],
      activeBuffIds: [],
      enraged: false,
      kind: 'summon',
      summonOwnerId: 'player-001',
      summonTemplateId: 'skeleton'
    };
    const event: BattleEvent = {
      kind: 'summon',
      owner: 'player-001',
      summonId: 'skeleton',
      unit
    };

    const entry = eventToLocalizedLogEntry(event, new Map([['player-001', '死灵法师']]));
    expect(entry?.message).toContain('骷髅战士');
    expect(entry?.message).not.toContain('Skeleton Warrior');
  });
});
