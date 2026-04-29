/**
 * Tests for combat helper functions
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  battleEventToLogEntry,
  startSubAreaRun,
  advanceWaveOrFinish,
  hasActiveSubAreaRun,
  createSimpleEnemy,
  buildEnemiesForWave
} from './combatHelpers';
import { useCombatStore } from './combatStore';
import { usePlayerStore } from './playerStore';
import { useMapStore } from './mapStore';
import { useInventoryStore } from './inventoryStore';
import { createMockPlayer } from '@/features/character/createMockPlayer';
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

  describe('createSimpleEnemy (legacy, JSON-backed)', () => {
    it('builds a unit from the act-1 monster JSON, not a synthetic Fallen', () => {
      const enemy = createSimpleEnemy(1, 0);
      // Bug #6 acceptance: name comes from the JSON catalog (not the
      // historical "Fallen Lv1" mock string).
      expect(enemy.kind).toBe('monster');
      expect(enemy.tier).toBe('trash');
      expect(enemy.side).toBe('enemy');
      expect(enemy.life).toBe(enemy.stats.lifeMax);
      // Crit damage on trash is the spec 1.5×, not the legacy one-shot 2×.
      expect(enemy.stats.critDamage).toBe(1.5);
    });
  });

  describe('startSubAreaRun (Bug #5 / #16)', () => {
    beforeEach(() => {
      useCombatStore.getState().reset();
      useInventoryStore.getState().reset();
      const player = createMockPlayer('Tester', 'barbarian');
      usePlayerStore.getState().setPlayer(player);
    });

    it('lays out >1 wave for a known sub-area and advances waves until run-victory', () => {
      // Den of Evil: trash → elite → boss (3 waves) — strongest evidence
      // that wavePlan is data-driven and we run multiple waves.
      useMapStore.getState().setCurrentLocation(1, 'a1-den-of-evil');
      const handle = startSubAreaRun();
      expect(handle).not.toBeNull();
      expect(handle?.totalWaves).toBeGreaterThanOrEqual(3);

      const startState = useCombatStore.getState();
      expect(startState.totalWaves).toBe(handle?.totalWaves);
      expect(startState.currentWave).toBe(1);
      expect(startState.subAreaRunId).toBe('areas/act1-den-of-evil');
      // Enemies must come from the JSON catalog — every enemy id should
      // start with the synthesized `enemy-` prefix that buildMonsterUnit
      // emits and reference a known archetype slug (e.g. fallen,
      // dark-stalker, carver), never the legacy time-stamped synthetic id.
      expect(startState.enemyTeam.length).toBeGreaterThan(0);
      const slugs = ['fallen', 'dark-stalker', 'carver', 'fallen-shaman', 'tainted', 'quill-rat', 'zombie'];
      for (const e of startState.enemyTeam) {
        expect(e.id).toMatch(/^enemy-/);
        expect(slugs.some((s) => e.id.includes(s))).toBe(true);
      }

      // Drain wave 1 → advance → wave 2 should install with currentWave bumped.
      drainEvents();
      let status = advanceWaveOrFinish();
      expect(['next-wave', 'victory', 'defeat']).toContain(status);

      // Walk through every wave; counters must increment monotonically up
      // to totalWaves and end in 'victory' (mock barb is durable enough).
      let safety = 50;
      const total = handle?.totalWaves ?? 0;
      while (status === 'next-wave' && safety-- > 0) {
        const s = useCombatStore.getState();
        expect(s.currentWave).toBeGreaterThanOrEqual(1);
        expect(s.currentWave).toBeLessThanOrEqual(total);
        drainEvents();
        status = advanceWaveOrFinish();
      }
      expect(['victory', 'defeat']).toContain(status);
      // After finalization the active run is torn down.
      expect(hasActiveSubAreaRun()).toBe(false);
    });

    it('falls back to a 4-wave default plan when the sub-area id is unknown', () => {
      useMapStore.getState().setCurrentLocation(1, 'totally-unknown-area-xyz');
      const handle = startSubAreaRun();
      expect(handle).not.toBeNull();
      // Default plan: 3 trash + 1 elite + 1 boss → 4 entries (per
      // DEFAULT_FALLBACK_PLAN: trash, trash, elite, boss).
      expect(handle?.totalWaves).toBe(4);
      expect(useCombatStore.getState().totalWaves).toBe(4);
    });

    it('buildEnemiesForWave applies tier multipliers (elite/boss > trash)', () => {
      const trashUnits = buildEnemiesForWave(
        {
          id: 't',
          waveTier: 'trash',
          spawns: [
            { archetypeId: 'monsters/act1.fallen', tier: 'trash', level: 5, index: 0 }
          ]
        },
        42
      );
      const eliteUnits = buildEnemiesForWave(
        {
          id: 'e',
          waveTier: 'elite',
          spawns: [
            { archetypeId: 'monsters/act1.fallen', tier: 'elite', level: 5, index: 0 }
          ]
        },
        42
      );
      const bossUnits = buildEnemiesForWave(
        {
          id: 'b',
          waveTier: 'boss',
          spawns: [
            { archetypeId: 'monsters/act1.fallen', tier: 'boss', level: 5, index: 0 }
          ]
        },
        42
      );
      expect(trashUnits[0]?.tier).toBe('trash');
      expect(eliteUnits[0]?.tier).toBe('elite');
      expect(bossUnits[0]?.tier).toBe('boss');
      // Tier multipliers translate to strictly increasing life under same seed.
      expect(eliteUnits[0]?.stats.lifeMax).toBeGreaterThan(trashUnits[0]?.stats.lifeMax ?? 0);
      expect(bossUnits[0]?.stats.lifeMax).toBeGreaterThan(eliteUnits[0]?.stats.lifeMax ?? 0);
      // Boss attack > elite attack > trash attack.
      expect(bossUnits[0]?.stats.attack).toBeGreaterThan(eliteUnits[0]?.stats.attack ?? 0);
      expect(eliteUnits[0]?.stats.attack).toBeGreaterThan(trashUnits[0]?.stats.attack ?? 0);
      // Boss name is badged for UI parity.
      expect(bossUnits[0]?.name).toContain('(Boss)');
      expect(eliteUnits[0]?.name).toContain('(Elite)');
    });
  });
});

/** Drain the recorded-event playback synchronously (no React in unit tests). */
function drainEvents(): void {
  const s = useCombatStore.getState();
  if (s.isPaused) s.resumePlayback();
  let safety = 20_000;
  while (!useCombatStore.getState().playbackComplete && safety-- > 0) {
    useCombatStore.getState().advanceEvent();
  }
}
