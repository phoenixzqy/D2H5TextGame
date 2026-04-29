/**
 * mapStore tests — Bug #5 cleared/uncleared, Bug #9 quest reward claim flag.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { useMapStore } from './mapStore';

beforeEach(() => {
  useMapStore.getState().reset();
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
