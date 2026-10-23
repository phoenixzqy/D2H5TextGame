import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as quests from '@/data/loaders/quests';
import type { QuestDef } from '@/data/loaders/quests';
import { useMapStore } from './mapStore';

const areaId = 'areas/act1-blood-moor';
type Kind = 'clear-area' | 'talk' | 'kill' | 'kill-boss';
function definition(kind: Kind): QuestDef {
  const target = kind === 'talk' ? { npcId: 'npc/akara' } : kind === 'clear-area' ? { areaId }
    : { areaId, targetId: 'monsters/act1.fallen' };
  return { id: 'quests/staged-event', actId: 'acts/act1', name: 'Fixture', description: 'Fixture', type: 'main',
    objectives: [
      { id: 'gate', type: 'interact', description: 'Gate', targetId: 'objects/gate', areaId },
      { id: 'peer', type: 'interact', description: 'Peer', targetId: 'objects/peer', areaId },
      { id: 'event', type: kind, description: 'Event', ...target },
      { id: 'later', type: kind, description: 'Later', ...target }
    ], objectiveStages: [['gate'], ['peer', 'event'], ['later']] };
}
function emit(kind: Kind): void {
  const map = useMapStore.getState();
  if (kind === 'clear-area') map.markCleared(areaId);
  else if (kind === 'talk') map.recordNpcTalk('npc/akara');
  else if (kind === 'kill') map.recordMonsterKills({ actId: 'acts/act1', areaId, archetypeIds: ['monsters/act1.fallen'] });
  else map.recordBossKill({ actId: 'acts/act1', areaId, bossArchetypeId: 'monsters/act1.fallen' });
}

beforeEach(() => { useMapStore.getState().reset(); });
afterEach(() => { vi.restoreAllMocks(); useMapStore.getState().reset(); });

describe('map event stage prerequisites', () => {
  it.each(['clear-area', 'talk', 'kill', 'kill-boss'] as const)(
    'uses pre-event groups for %s without banking, peer ordering or same-event cascade', kind => {
      const quest = definition(kind);
      vi.spyOn(quests, 'loadQuests').mockReturnValue([quest]);
      const initial = { gate: false, peer: false, event: false, later: false };
      useMapStore.getState().updateQuestProgress(quest.id, { status: 'inProgress', objectives: initial, rewardClaimed: false });
      const before = useMapStore.getState().questProgress;
      emit(kind);
      expect(useMapStore.getState().questProgress).toBe(before);
      useMapStore.getState().updateQuestProgress(quest.id, { objectives: { ...initial, gate: true } });
      emit(kind);
      expect(useMapStore.getState().questProgress[quest.id]).toMatchObject({ status: 'inProgress', rewardClaimed: false,
        objectives: { gate: true, peer: false, event: true, later: false } });
      useMapStore.getState().updateQuestProgress(quest.id, {
        objectives: { gate: true, peer: true, event: true, later: false }
      });
      expect(useMapStore.getState().questProgress[quest.id]?.objectives.later).toBe(false);
      emit(kind);
      expect(useMapStore.getState().questProgress[quest.id]).toMatchObject({ status: 'completed', rewardClaimed: false,
        objectives: { gate: true, peer: true, event: true, later: true } });
    }
  );
});
