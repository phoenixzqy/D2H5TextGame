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
});
