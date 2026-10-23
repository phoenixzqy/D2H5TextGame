import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useMapStore } from './mapStore';

const questId = 'quests/act2-arcane-sanctuary';
const areaId = 'areas/act2-arcane-sanctuary';
const event = { actId: 'acts/act2', areaId, targetId: 'objects/horazon_journal' };
beforeEach(() => {
  useMapStore.getState().reset();
  useMapStore.getState().setCurrentLocation(2, areaId);
  useMapStore.getState().updateQuestProgress(questId, { status: 'inProgress',
    objectives: { 'obj-find-summoner': true, 'obj-read-journal': false } });
});
afterEach(() => { useMapStore.getState().reset(); });

describe('current-area object event integration', () => {
  it('records reading once in one publication without clearing areas or claiming rewards', () => {
    let publications = 0;
    const unsubscribe = useMapStore.subscribe(() => { publications++; });
    try {
      useMapStore.getState().recordObjectInteraction(event);
      expect(publications).toBe(1);
      expect(useMapStore.getState().questProgress[questId]).toEqual({ id: questId,
        status: 'completed', objectives: { 'obj-find-summoner': true, 'obj-read-journal': true } });
      expect(useMapStore.getState().clearedSubAreas).toEqual([]);
      expect(useMapStore.getState().isActUnlocked(3)).toBe(false);
      const after = useMapStore.getState();
      useMapStore.getState().recordObjectInteraction(event);
      expect(useMapStore.getState()).toBe(after);
      expect(publications).toBe(1);
    } finally { unsubscribe(); }
  });

  it.each(['areas/act2-rocky-waste', 'areas/missing'])('refuses an event while located at %s', id => {
    useMapStore.getState().setCurrentLocation(2, id);
    const before = useMapStore.getState();
    useMapStore.getState().recordObjectInteraction(event);
    expect(useMapStore.getState()).toBe(before);
  });

  it('canonicalizes the existing combat alias while checking its act', () => {
    useMapStore.getState().setCurrentLocation(1, 'a2-arcane-sanctuary');
    const before = useMapStore.getState();
    useMapStore.getState().recordObjectInteraction(event);
    expect(useMapStore.getState()).toBe(before);
    useMapStore.getState().setCurrentLocation(2, 'a2-arcane-sanctuary');
    useMapStore.getState().recordObjectInteraction(event);
    expect(useMapStore.getState().questProgress[questId]?.status).toBe('completed');
  });
});
