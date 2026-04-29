/**
 * Tests for combat helper functions
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { battleEventToLogEntry, awardLootForVictory, startSimpleBattle } from './combatHelpers';
import { mercToCombatUnit } from './mercToCombatUnit';
import type { BattleEvent } from '@/engine/combat/combat';
import type { CombatUnit } from '@/engine/combat/types';
import type { Mercenary } from '@/engine/types/entities';
import { usePlayerStore } from './playerStore';
import { useMercStore } from './mercStore';
import { useCombatStore } from './combatStore';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { createMockPlayer, CHARACTER_CLASSES } from '@/features/character/createMockPlayer';
import { xpRequired, xpForKill } from '@/engine/progression/xp';
import { getSkill } from '@/engine/skills/registry';

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


function resetStores(): void {
  usePlayerStore.getState().reset();
  useMercStore.getState().reset();
  useCombatStore.getState().reset();
  useInventoryStore.getState().reset();
  useMapStore.getState().reset?.();
}

function buildMerc(overrides: Partial<Mercenary> = {}): Mercenary {
  return {
    id: 'merc-test-1', name: 'Kashya the Rogue', type: 'mercenary', team: 'player', level: 3,
    coreStats: { strength: 20, dexterity: 25, vitality: 20, energy: 10 },
    derivedStats: { life: 80, lifeMax: 80, mana: 20, manaMax: 20, attack: 30, defense: 5, attackSpeed: 30, critChance: 0.05, critDamage: 1.5, physDodge: 0.05, magicDodge: 0.05, magicFind: 0, goldFind: 0, resistances: { fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0, physical: 0 } },
    statusEffects: [], cooldowns: [], skills: [], comboOrder: ['mskill-basic-arrow'], alive: true, turnOrder: 0, archetype: 'back', rarity: 'R', equipment: [], ...overrides
  };
}

function boostedSorceress() {
  const player = createMockPlayer('Nova', 'sorceress');
  return { ...player, level: 5, derivedStats: { ...player.derivedStats, life: 2000, lifeMax: 2000, mana: 2000, manaMax: 2000, attack: 500, defense: 200, attackSpeed: 200, critChance: 0, physDodge: 0, magicDodge: 0 } };
}

function slainEnemy(id: string): CombatUnit {
  return {
    id, name: id, side: 'enemy', level: 1, tier: 'trash',
    stats: { life: 0, lifeMax: 10, mana: 0, manaMax: 0, attack: 1, defense: 0, attackSpeed: 10, critChance: 0, critDamage: 1.5, physDodge: 0, magicDodge: 0, magicFind: 0, goldFind: 0, resistances: { fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0, physical: 0 } },
    life: 0, mana: 0, statuses: [], cooldowns: {}, skillOrder: [], activeBuffIds: [], enraged: false, summonedAdds: false, kind: 'monster'
  };
}

describe('mercToCombatUnit (Bug #2)', () => {
  it('produces a player-side hero CombatUnit with registered skills', () => {
    const unit = mercToCombatUnit(buildMerc());
    expect(unit.id).toBe('merc-merc-test-1');
    expect(unit.side).toBe('player');
    expect(unit.kind).toBe('hero');
    expect(unit.skillOrder.length).toBeGreaterThan(0);
    for (const id of unit.skillOrder) expect(getSkill(id), id).toBeDefined();
  });
});

describe('startSimpleBattle — fielded merc (Bug #2)', () => {
  beforeEach(resetStores);
  it('uses one player unit when no merc is fielded', () => {
    usePlayerStore.getState().setPlayer(boostedSorceress());
    const result = startSimpleBattle(1, 1);
    expect(result?.winner).toBe('player');
    expect(useCombatStore.getState().playerTeam.length).toBe(1);
  });
  it('adds the fielded merc to playerTeam', () => {
    usePlayerStore.getState().setPlayer(boostedSorceress());
    const merc = buildMerc();
    useMercStore.getState().addMerc(merc);
    useMercStore.getState().setFieldedMerc(merc.id);
    const result = startSimpleBattle(1, 1);
    expect(result?.winner).toBe('player');
    const team = useCombatStore.getState().playerTeam;
    expect(team.length).toBe(2);
    expect(team.some((u) => u.id === `merc-${merc.id}`)).toBe(true);
  });
});

describe('createMockPlayer per-class default kit (Bug #3)', () => {
  it('gives every supported class a registered starter combo and learned skill level', () => {
    for (const cls of CHARACTER_CLASSES) {
      const player = createMockPlayer('Hero', cls);
      expect(player.comboOrder.length, cls).toBeGreaterThan(0);
      for (const id of player.comboOrder) {
        expect(getSkill(id), `${cls}:${id}`).toBeDefined();
        expect(player.skillLevels?.[id] ?? 0, `${cls}:${id}`).toBeGreaterThanOrEqual(1);
      }
    }
  });
});

describe('playerStore.gainExperience (Bug #1)', () => {
  beforeEach(resetStores);
  it('keeps level 1 when granting 30 XP', () => {
    usePlayerStore.getState().setPlayer(createMockPlayer('Nova', 'sorceress'));
    const result = usePlayerStore.getState().gainExperience(30);
    expect(result.levelsGained).toBe(0);
    expect(result.newLevel).toBe(1);
    expect(usePlayerStore.getState().player?.experience).toBe(30);
  });
  it('grants one level and stat points for 250 XP at level 1', () => {
    usePlayerStore.getState().setPlayer(createMockPlayer('Nova', 'sorceress'));
    const result = usePlayerStore.getState().gainExperience(250);
    const player = usePlayerStore.getState().player;
    expect(result.levelsGained).toBe(1);
    expect(result.newLevel).toBe(2);
    expect(player?.experience).toBe(150);
    expect(player?.experienceToNextLevel).toBe(xpRequired(2));
    expect(player?.statPoints).toBe(5);
  });
  it('can grant multiple levels for 700 XP at level 1', () => {
    usePlayerStore.getState().setPlayer(createMockPlayer('Nova', 'sorceress'));
    const result = usePlayerStore.getState().gainExperience(700);
    expect(result.newLevel).toBe(3);
    expect(result.levelsGained).toBe(2);
    expect(result.statPointsGranted).toBe(10);
  });
});

describe('startSimpleBattle — XP grant on victory (Bug #1)', () => {
  beforeEach(resetStores);
  it('awards XP for slain monsters', () => {
    usePlayerStore.getState().setPlayer(boostedSorceress());
    const result = startSimpleBattle(1, 3);
    expect(result?.winner).toBe('player');
    expect(usePlayerStore.getState().player?.experience).toBe(3 * xpForKill(1));
    expect(result?.xpGained).toBe(30);
  });
});

describe('startSimpleBattle — Bug #12', () => {
  beforeEach(resetStores);
  it('never awards gold after victory', () => {
    usePlayerStore.getState().setPlayer(boostedSorceress());
    const result = startSimpleBattle(1, 3);
    expect(result?.winner).toBe('player');
    expect(useInventoryStore.getState().getCurrency('gold')).toBe(0);
  });
});

describe('awardLootForVictory (Bug #12 — no gold)', () => {
  beforeEach(resetStores);
  it('folds rune drops and rune-shards into rune-shard currency without gold', () => {
    usePlayerStore.getState().setPlayer(boostedSorceress());
    const result = awardLootForVictory({ slainEnemies: Array.from({ length: 5 }, (_, i) => slainEnemy(`e${String(i)}`)), act: 1, treasureClassId: 'tc_missing', seed: 123 });
    expect(result.runeShards).toBeGreaterThan(0);
    expect('gold' in result).toBe(false);
    expect(useInventoryStore.getState().getCurrency('rune-shard')).toBeGreaterThan(0);
    expect(useInventoryStore.getState().getCurrency('gold')).toBe(0);
  });
});
