/**
 * Tests for combat helper functions
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  battleEventToLogEntry,
  awardLootForVictory,
  startSimpleBattle,
  startSubAreaRun,
  advanceWaveOrFinish,
  hasActiveSubAreaRun,
  createSimpleEnemy,
  buildEnemiesForWave
} from './combatHelpers';
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
    it('renders the basic-attack damage event in zh-CN with the localized monster name (Bug #11)', () => {
      // Locale is zh-CN by default in i18n init.
      const event: BattleEvent = {
        kind: 'damage',
        source: 'enemy-act1.fallen-0-abcd',
        target: 'player-001',
        damageType: 'physical',
        amount: 5,
        crit: false,
        dodged: false
      };
      const unitMap = new Map([
        ['enemy-act1.fallen-0-abcd', '堕落者'],
        ['player-001', 'Astaroth']
      ]);
      const result = battleEventToLogEntry(event, unitMap);
      expect(result).toBeDefined();
      // zh-CN template: "{{actor}} 普攻 {{target}}…" — must start with the
      // localized monster name, never the legacy "Fallen Lv" string.
      expect(result?.message.startsWith('堕落者')).toBe(true);
      expect(result?.message).not.toContain('Fallen Lv');
      expect(result?.message).not.toContain('physical');
      expect(result?.message).toContain('物理');
    });

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

    it('Bug #3 — marks the sub-area cleared on run-victory and persists in the snapshot', async () => {
      // Boost the hero so the deterministic mock barb steamrolls the
      // 4-wave default plan.
      const boosted = createMockPlayer('Crusher', 'barbarian');
      const buffed = {
        ...boosted,
        derivedStats: {
          ...boosted.derivedStats,
          life: 99999, lifeMax: 99999, mana: 9999, manaMax: 9999,
          attack: 9999, defense: 9999, attackSpeed: 200
        }
      };
      usePlayerStore.getState().setPlayer(buffed);
      useMapStore.getState().setCurrentLocation(1, 'a1-blood-moor');

      const handle = startSubAreaRun();
      expect(handle).not.toBeNull();

      let safety = 50;
      let status: 'next-wave' | 'victory' | 'defeat' | 'idle' = 'next-wave';
      while (status === 'next-wave' && safety-- > 0) {
        drainEvents();
        status = advanceWaveOrFinish();
      }
      expect(status).toBe('victory');

      const cleared = useMapStore.getState().clearedSubAreas;
      expect(cleared.length).toBeGreaterThan(0);
      const planId = cleared[0] ?? '';
      expect(useMapStore.getState().isCleared(planId)).toBe(true);

      // Persistence snapshot must include clearedSubAreas — hydration
      // copies the field through (see persistence.ts).
      const { snapshotStores } = await import('./persistence');
      const snap = snapshotStores();
      expect(snap).not.toBeNull();
      expect(snap?.map.clearedSubAreas).toContain(planId);

      // Round-trip simulation: wipe store, then re-apply the snapshot
      // exactly as hydrateFromSave does.
      useMapStore.getState().reset();
      expect(useMapStore.getState().clearedSubAreas).toEqual([]);
      if (snap) {
        useMapStore.setState({
          currentAct: snap.map.currentAct,
          currentSubAreaId: snap.map.currentSubAreaId,
          discoveredAreas: [...snap.map.discoveredAreas],
          clearedSubAreas: [...snap.map.clearedSubAreas],
          questProgress: { ...snap.map.questProgress }
        });
      }
      expect(useMapStore.getState().clearedSubAreas).toContain(planId);
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

function resetStores(): void {
  usePlayerStore.getState().reset();
  useMercStore.getState().reset();
  useCombatStore.getState().reset();
  useInventoryStore.getState().reset();
  useMapStore.getState().reset();
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
    expect(unit.kind).toBe('merc');
    expect(unit.skillOrder.length).toBeGreaterThan(0);
    for (const id of unit.skillOrder) expect(getSkill(id), id).toBeDefined();
  });
});

describe('startSimpleBattle — fielded merc (Bug #2)', () => {
  beforeEach(resetStores);
  it('uses one player unit when no merc is fielded', () => {
    usePlayerStore.getState().setPlayer(boostedSorceress());
    startSimpleBattle(1, 1);
    expect(useCombatStore.getState().outcome?.winner).toBe('player');
    expect(useCombatStore.getState().playerTeam.length).toBe(1);
  });
  it('adds the fielded merc to playerTeam', () => {
    usePlayerStore.getState().setPlayer(boostedSorceress());
    const merc = buildMerc();
    useMercStore.getState().addMerc(merc);
    useMercStore.getState().setFieldedMerc(merc.id);
    startSimpleBattle(1, 1);
    expect(useCombatStore.getState().outcome?.winner).toBe('player');
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
  it('awards XP for slain monsters after wave playback completes', () => {
    usePlayerStore.getState().setPlayer(boostedSorceress());
    startSimpleBattle(1, 3);
    const slain = useCombatStore.getState().outcome?.finalEnemyTeam.filter((u) => u.life <= 0) ?? [];
    const expectedXp = slain.reduce((total, enemy) => total + xpForKill(enemy.level), 0);
    drainEvents();
    expect(advanceWaveOrFinish()).toBe('next-wave');
    expect(usePlayerStore.getState().player?.experience).toBe(expectedXp);
  });
});

describe('startSimpleBattle — Bug #12', () => {
  beforeEach(resetStores);
  it('never awards gold after victory', () => {
    usePlayerStore.getState().setPlayer(boostedSorceress());
    startSimpleBattle(1, 3);
    expect(useCombatStore.getState().outcome?.winner).toBe('player');
    drainEvents();
    advanceWaveOrFinish();
    expect(useInventoryStore.getState().getCurrency('gold')).toBe(0);
  });

  it('shares combat victory XP with the fielded merc', () => {
    usePlayerStore.getState().setPlayer(boostedSorceress());
    const merc = buildMerc();
    useMercStore.getState().addMerc(merc);
    useMercStore.getState().setFieldedMerc(merc.id);
    startSimpleBattle(1, 3);
    const slain = useCombatStore.getState().outcome?.finalEnemyTeam.filter((u) => u.life <= 0) ?? [];
    const expectedXp = slain.reduce((total, enemy) => total + xpForKill(enemy.level), 0);
    drainEvents();
    advanceWaveOrFinish();
    expect(useMercStore.getState().getMercProgress(merc.id).experience).toBe(Math.floor(expectedXp * 0.75));
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

/** Drain the recorded-event playback synchronously (no React in unit tests). */
function drainEvents(): void {
  const s = useCombatStore.getState();
  if (s.isPaused) s.resumePlayback();
  let safety = 20_000;
  while (!useCombatStore.getState().playbackComplete && safety-- > 0) {
    useCombatStore.getState().advanceEvent();
  }
}
