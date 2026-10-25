import { afterEach, beforeEach, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { playerToCombatUnit } from './combatHelpers';
import { runBattleRecorded } from '@/engine/combat/combat';
import { loadDefaultSkills, resetRegistry } from '@/engine/skills/registry';
import { applyEventToTeams, stageStatusPlayback } from './combatPlayback';
import type { CombatUnit } from '@/engine/combat/types';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
beforeEach(() => {
  useInventoryStore.getState().reset();
  useMapStore.getState().reset();
  resetRegistry();
  loadDefaultSkills();
});
afterEach(() => {
  useInventoryStore.getState().reset();
  useMapStore.getState().reset();
  resetRegistry();
  loadDefaultSkills();
});
it('plays real paid onset and expiry without retaining a permanent buff marker or double presentation', () => {
  const fresh = {
    ...createMockPlayer('Burst playback fixture', 'assassin'),
    level: 30,
    skillLevels: { 'assassin.claw_mastery': 1, 'assassin.burst_of_speed': 1 },
    comboOrder: ['assassin.burst_of_speed']
  };
  const native = playerToCombatUnit(fresh);
  const hero = {
    ...native,
    life: 100000,
    mana: 11,
    stats: { ...native.stats, attack: 1, attackSpeed: 100 }
  };
  const enemy: CombatUnit = {
    ...hero,
    id: 'target',
    side: 'enemy',
    kind: 'monster',
    skillOrder: [],
    statuses: [{ id: 'stun', sourceId: 'fixture', remaining: -1, stacks: 1 }]
  };
  const result = runBattleRecorded({ seed: 7, playerTeam: [hero], enemyTeam: [enemy] });
  let players: readonly CombatUnit[] = [hero],
    enemies: readonly CombatUnit[] = [enemy];
  let playback = stageStatusPlayback(players, enemies, result.events);
  let onset = false,
    expired = false;
  for (const event of result.events) {
    const step = applyEventToTeams(players, enemies, event, playback);
    players = step.playerTeam;
    enemies = step.enemyTeam;
    playback = step.statusPlayback ?? null;
    const visible = players[0];
    if (!visible) throw new Error('Missing visible hero');
    if (event.kind === 'status-state' && event.target === hero.id && event.simClockMs === 1700) {
      expect.soft(visible.activeBuffIds).not.toContain('burst-of-speed');
      expect(visible.statuses.filter((s) => s.id === 'burst-of-speed')).toHaveLength(1);
      onset = true;
    }
    if (event.kind === 'status-state' && event.target === hero.id && event.simClockMs === 11700) {
      expect.soft(visible.activeBuffIds).not.toContain('burst-of-speed');
      expect(visible.statuses.some((s) => s.id === 'burst-of-speed')).toBe(false);
      expired = true;
    }
  }
  expect(onset).toBe(true);
  expect(expired).toBe(true);
});
