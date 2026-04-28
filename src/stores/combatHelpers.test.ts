/**
 * Tests for combat helper functions
 */
import { describe, it, expect } from 'vitest';
import { battleEventToLogEntry } from './combatHelpers';
import type { BattleEvent } from '@/engine/combat/combat';

describe('combatHelpers', () => {
  describe('battleEventToLogEntry', () => {
    it('should show player name from map instead of ID in action event', () => {
      const event: BattleEvent = {
        kind: 'action',
        actor: 'player-001',
        skillId: 'skills-necromancer-bone-spear'
      };

      const unitMap = new Map([
        ['player-001', 'Astaroth']
      ]);

      const result = battleEventToLogEntry(event, unitMap);

      expect(result).toBeDefined();
      expect(result?.actorName).toBe('Astaroth');
      expect(result?.message).toContain('Astaroth');
      expect(result?.message).not.toContain('player-001');
    });

    it('should show player name from map instead of ID in damage event', () => {
      const event: BattleEvent = {
        kind: 'damage',
        source: 'player-001',
        target: 'enemy-fallen-1',
        damageType: 'physical',
        amount: 150,
        crit: false,
        dodged: false
      };

      const unitMap = new Map([
        ['player-001', 'Astaroth'],
        ['enemy-fallen-1', '堕落者']
      ]);

      const result = battleEventToLogEntry(event, unitMap);

      expect(result).toBeDefined();
      expect(result?.actorName).toBe('Astaroth');
      expect(result?.targetName).toBe('堕落者');
      expect(result?.message).toContain('Astaroth');
      expect(result?.message).toContain('堕落者');
      expect(result?.message).not.toContain('player-001');
      expect(result?.message).not.toContain('enemy-fallen-1');
    });

    it('should show monster name in zh-CN locale from map', () => {
      const event: BattleEvent = {
        kind: 'death',
        target: 'enemy-fallen-1'
      };

      const unitMap = new Map([
        ['enemy-fallen-1', '堕落者']
      ]);

      const result = battleEventToLogEntry(event, unitMap);

      expect(result).toBeDefined();
      expect(result?.actorName).toBe('堕落者');
      expect(result?.message).toContain('堕落者');
      expect(result?.message).not.toContain('enemy-fallen-1');
    });

    it('should show names in all event types', () => {
      const unitMap = new Map([
        ['player-001', 'Astaroth'],
        ['enemy-1', '僵尸']
      ]);

      // Heal event
      const healEvent: BattleEvent = {
        kind: 'heal',
        target: 'player-001',
        amount: 50
      };
      const healResult = battleEventToLogEntry(healEvent, unitMap);
      expect(healResult?.actorName).toBe('Astaroth');
      expect(healResult?.message).toContain('Astaroth');

      // Buff event
      const buffEvent: BattleEvent = {
        kind: 'buff',
        target: 'player-001',
        buffId: 'battle-orders'
      };
      const buffResult = battleEventToLogEntry(buffEvent, unitMap);
      expect(buffResult?.actorName).toBe('Astaroth');
      expect(buffResult?.message).toContain('Astaroth');

      // Status event
      const statusEvent: BattleEvent = {
        kind: 'status',
        target: 'enemy-1',
        statusId: 'poison'
      };
      const statusResult = battleEventToLogEntry(statusEvent, unitMap);
      expect(statusResult?.actorName).toBe('僵尸');
      expect(statusResult?.message).toContain('僵尸');

      // Stunned event
      const stunnedEvent: BattleEvent = {
        kind: 'stunned',
        target: 'enemy-1'
      };
      const stunnedResult = battleEventToLogEntry(stunnedEvent, unitMap);
      expect(stunnedResult?.actorName).toBe('僵尸');
      expect(stunnedResult?.message).toContain('僵尸');

      // DoT event
      const dotEvent: BattleEvent = {
        kind: 'dot',
        target: 'enemy-1',
        amount: 25
      };
      const dotResult = battleEventToLogEntry(dotEvent, unitMap);
      expect(dotResult?.actorName).toBe('僵尸');
      expect(dotResult?.message).toContain('僵尸');
    });

    it('should fallback to ID if unitMap is not provided', () => {
      const event: BattleEvent = {
        kind: 'action',
        actor: 'player-001',
        skillId: 'bash'
      };

      const result = battleEventToLogEntry(event);

      expect(result).toBeDefined();
      expect(result?.actorName).toBe('player-001');
    });

    it('should fallback to ID if unit not in map', () => {
      const event: BattleEvent = {
        kind: 'action',
        actor: 'player-unknown',
        skillId: 'bash'
      };

      const unitMap = new Map([
        ['player-001', 'Astaroth']
      ]);

      const result = battleEventToLogEntry(event, unitMap);

      expect(result).toBeDefined();
      expect(result?.actorName).toBe('player-unknown');
    });
  });
});
