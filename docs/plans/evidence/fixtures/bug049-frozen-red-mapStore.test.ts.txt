/**
 * mapStore tests — Bug #5 cleared/uncleared, Bug #9 quest reward claim flag.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { useMapStore } from './mapStore';
import { loadQuests } from '@/data/loaders/quests';

beforeEach(() => {
  useMapStore.getState().reset();
});

const ANDARIEL_QUEST = 'quests/act1-sisters-to-the-slaughter';
const bossEvent = { actId: 'acts/act1', areaId: 'areas/act1-catacombs',
  bossArchetypeId: 'monsters/act1.andariel' };
function trackBoss(): void {
  useMapStore.getState().updateQuestProgress(ANDARIEL_QUEST, {
    status: 'inProgress', objectives: { 'obj-kill-andariel': false }, rewardClaimed: false
  });
}

describe('qualified kill-boss quest events (BUG049)', () => {
  it('uses the canonical Catacombs and Andariel objective IDs', () => {
    expect(loadQuests().find(quest => quest.id === ANDARIEL_QUEST)?.objectives).toEqual([
      { id: 'obj-kill-andariel', type: 'kill-boss', targetId: 'monsters/act1.andariel',
        areaId: 'areas/act1-catacombs', description: 'Slay Andariel.' }
    ]);
  });

  it('completes only the matching objective, preserves fields, and follows existing unlock policy', () => {
    trackBoss();
    useMapStore.getState().updateQuestProgress('unrelated', { status: 'available', objectives: {} });
    const before = useMapStore.getState();
    expect(before.isActUnlocked(2)).toBe(false);
    before.recordBossKill(bossEvent);
    const after = useMapStore.getState();
    expect(after).toEqual({ ...before, questProgress: { ...before.questProgress,
      [ANDARIEL_QUEST]: { ...before.questProgress[ANDARIEL_QUEST],
        status: 'completed', objectives: { 'obj-kill-andariel': true } } } });
    expect(after.questProgress.unrelated).toBe(before.questProgress.unrelated);
    expect(after.isActUnlocked(2)).toBe(true);
    expect(after.clearedSubAreas).toEqual([]);
    after.recordBossKill(bossEvent);
    expect(useMapStore.getState()).toBe(after);
  });

  it.each(['missing', 'available', 'locked', 'completed', 'claimed', 'already-met'] as const)(
    'preserves the entire state for %s progress', kind => {
      if (kind !== 'missing') useMapStore.getState().updateQuestProgress(ANDARIEL_QUEST, {
        status: kind === 'claimed' || kind === 'already-met' ? 'inProgress' : kind,
        objectives: { 'obj-kill-andariel': kind === 'already-met' }, rewardClaimed: kind === 'claimed'
      });
      const before = useMapStore.getState();
      before.recordBossKill(bossEvent);
      expect(useMapStore.getState()).toBe(before);
    });

  it.each([{ actId: 'acts/act2' }, { areaId: 'areas/act1-den-of-evil' },
    { bossArchetypeId: 'monsters/act1.blood-raven' }])('rejects mismatched context %j', mismatch => {
    trackBoss();
    const before = useMapStore.getState();
    before.recordBossKill({ ...bossEvent, ...mismatch });
    expect(useMapStore.getState()).toBe(before);
  });

  it('requires an earlier authored objective before a later boss kill without cascading', () => {
    const questId = 'quests/act2-seven-tombs';
    const event = { actId: 'acts/act2', areaId: 'areas/act2_duriels_lair', bossArchetypeId: 'monsters/duriel' };
    useMapStore.getState().updateQuestProgress(questId, {
      status: 'inProgress', objectives: { 'obj-open-tomb': false, 'obj-kill-duriel': false }
    });
    const before = useMapStore.getState();
    before.recordBossKill(event);
    expect(useMapStore.getState()).toBe(before);
    before.updateQuestProgress(questId, { objectives: { 'obj-open-tomb': true, 'obj-kill-duriel': false } });
    useMapStore.getState().recordBossKill(event);
    expect(useMapStore.getState().questProgress[questId]).toEqual({
      id: questId, status: 'completed', objectives: { 'obj-open-tomb': true, 'obj-kill-duriel': true }
    });
  });

  it('does not reinterpret an ordinary kill objective as kill-boss', () => {
    useMapStore.getState().updateQuestProgress('quests/act1-sisters-burial-grounds', {
      status: 'inProgress', objectives: { 'obj-kill-blood-raven': false, 'obj-return': false }
    });
    const before = useMapStore.getState();
    before.recordBossKill({ actId: 'acts/act1', areaId: 'areas/act1_burial_grounds',
      bossArchetypeId: 'monsters/blood_raven' });
    expect(useMapStore.getState()).toBe(before);
  });
});

describe('mapStore — clearedSubAreas (Bug #5)', () => {
  it('markCleared makes isCleared return true once', () => {
    expect(useMapStore.getState().isCleared('a1-blood-moor')).toBe(false);
    useMapStore.getState().markCleared('a1-blood-moor');
    expect(useMapStore.getState().isCleared('a1-blood-moor')).toBe(true);
    // idempotent
    useMapStore.getState().markCleared('a1-blood-moor');
    expect(useMapStore.getState().clearedSubAreas.filter((x) => x === 'a1-blood-moor')).toHaveLength(1);
  });
});

describe('mapStore — markQuestRewardClaimed (Bug #9)', () => {
  it('adds rewardClaimed flag onto questProgress entry', () => {
    useMapStore.setState((s) => ({
      questProgress: {
        ...s.questProgress,
        'q-test': { id: 'q-test', status: 'completed', objectives: {} }
      }
    }));
    useMapStore.getState().markQuestRewardClaimed('q-test');
    expect(useMapStore.getState().questProgress['q-test']?.rewardClaimed).toBe(true);
  });

  it('no-ops when quest progress entry is missing', () => {
    useMapStore.getState().markQuestRewardClaimed('q-missing');
    expect(useMapStore.getState().questProgress['q-missing']).toBeUndefined();
  });
});
