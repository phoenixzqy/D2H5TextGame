import { beforeEach, describe, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { playerToCombatUnit } from './combatHelpers';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useFormationStore } from './formationStore';
import { runBattleRecorded } from '@/engine/combat/combat';
import { loadDefaultSkills, resetRegistry } from '@/engine/skills/registry';

const id = 'sorceress.static_field';
beforeEach(() => {
  useInventoryStore.getState().reset(); useMapStore.getState().reset(); useFormationStore.getState().reset();
  resetRegistry(); loadDefaultSkills();
});
describe('production Static Field authority', () => {
  it.each(['sorceress', 'amazon', 'assassin', 'barbarian', 'druid', 'necromancer', 'paladin'] as const)(
    'projects actual %s eligibility without healing or a passive damage bonus', classId => {
      const fresh = createMockPlayer('StaticProbe', classId);
      const player = { ...fresh, level: 24, skillLevels: { [id]: 20 }, comboOrder: [id] };
      const before = structuredClone(player);
      const hero = playerToCombatUnit(player);
      expect(hero.staticFieldRank).toBe(classId === 'sorceress' ? 20 : 0);
      expect(hero.life).toBe(fresh.derivedStats.life);
      expect(hero.mana).toBe(fresh.derivedStats.mana);
      expect(hero.increasedDamagePct?.lightning ?? 0).toBe(0);
      expect(player).toEqual(before);
      const held = (appliedAtMs: number) => ({ id: 'stun', stacks: 1, remaining: -1, sourceId: 'fixture', appliedAtMs });
      const result = runBattleRecorded({ seed: 1,
        playerTeam: [{ ...hero, mana: 100, manaRegenPerSecond: 0,
          stats: { ...hero.stats, attackSpeed: 100 }, statuses: [held(1701)] }],
        enemyTeam: [{ ...hero, id: 'target', side: 'enemy', kind: 'monster', life: 1000,
          skillOrder: [], statuses: [held(0)], stats: { ...hero.stats, lifeMax: 1000,
            magicResist: 0, resistances: { ...hero.stats.resistances, lightning: 0 } } }] });
      expect(result.events.some(e => e.kind === 'action' && e.skillId === id)).toBe(classId === 'sorceress');
      if (classId === 'sorceress') expect(result.result.enemyTeam[0]?.life).toBe(750);
    });
});
