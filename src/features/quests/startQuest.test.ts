import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { useCombatStore, useInventoryStore, useMapStore, usePlayerStore } from '@/stores';
import { useHydrationStore } from '@/stores/hydrationStore';
import { startQuest } from './startQuest';

const questId = 'quests/act1-den-of-evil';
const otherId = 'quests/act1-sisters-burial-grounds';
const originals = { map: useMapStore.getState(), combat: useCombatStore.getState(),
  inventory: useInventoryStore.getState(), player: usePlayerStore.getState(), hydration: useHydrationStore.getState() };

describe('ordinary journal activation', () => {
  beforeEach(() => {
    useMapStore.getState().reset(); useInventoryStore.getState().reset();
    usePlayerStore.getState().setPlayer(createMockPlayer('Journal visitor', 'sorceress'));
    useCombatStore.setState({ inCombat: false, subAreaRunId: null });
    useHydrationStore.getState().setStatus('ready');
  });
  afterEach(() => {
    useMapStore.setState(originals.map, true); useCombatStore.setState(originals.combat, true);
    useInventoryStore.setState(originals.inventory, true); usePlayerStore.setState(originals.player, true);
    useHydrationStore.setState(originals.hydration, true);
  });

  it.each(['quests/unknown', 'quests/bounty-act1-moor-cull'])('refuses %s without creating progress', id => {
    const before = useMapStore.getState();
    expect(startQuest(id)).toBe(id === 'quests/unknown' ? 'unknown-quest' : 'not-eligible');
    expect(useMapStore.getState()).toBe(before);
  });

  it('requires current prerequisites even when a stored row says available', () => {
    const id = 'quests/side-act1-rogue-merc-unlock';
    useMapStore.setState({ questProgress: { [id]: { id, status: 'available', objectives: {} } } });
    const before = useMapStore.getState();
    expect(startQuest(id)).toBe('not-eligible');
    expect(useMapStore.getState()).toBe(before);
    useMapStore.getState().completeQuest(otherId);
    expect(startQuest(id)).toBe('ok');
  });

  it.each(['inProgress', 'completed', 'locked'] as const)('does not reset %s progress', status => {
    useMapStore.setState({ questProgress: { [questId]: { id: questId, status,
      objectives: { 'obj-clear-den': true, 'obj-return': false } } } });
    const before = useMapStore.getState();
    expect(startQuest(questId)).toBe('not-eligible');
    expect(useMapStore.getState()).toBe(before);
  });

  it('preserves future-act tracking without granting rewards or changing location', () => {
    const inventory = useInventoryStore.getState(), player = usePlayerStore.getState();
    expect(startQuest('quests/act5-siege-on-harrogath')).toBe('ok');
    expect(useMapStore.getState().questProgress['quests/act5-siege-on-harrogath']).toEqual({
      id: 'quests/act5-siege-on-harrogath', status: 'inProgress', objectives: { 'obj-kill-shenk': false }
    });
    expect(useMapStore.getState().currentAct).toBe(1);
    expect(useInventoryStore.getState()).toBe(inventory);
    expect(usePlayerStore.getState()).toBe(player);
  });

  it.each([false, true])('restores only the participating row after publication fails (existing=%s)', existing => {
    if (existing) useMapStore.setState({ questProgress: {
      [questId]: { id: questId, status: 'available', objectives: {} }
    } });
    const previous = useMapStore.getState().questProgress[questId];
    const unrelated = { id: otherId, status: 'inProgress' as const, objectives: {} };
    let fired = false;
    let reentrant: unknown;
    const unsubscribe = useMapStore.subscribe(state => {
      if (fired || state.questProgress[questId]?.status !== 'inProgress') return;
      fired = true;
      reentrant = startQuest(otherId);
      useMapStore.setState(current => ({ questProgress: { ...current.questProgress, [otherId]: unrelated } }));
      throw new Error('publication refused');
    });
    try {
      expect(startQuest(questId)).toBe('grant-failed');
      expect(reentrant).toBe('claim-in-progress');
      expect(useMapStore.getState().questProgress[questId]).toBe(previous);
      expect(Object.hasOwn(useMapStore.getState().questProgress, questId)).toBe(existing);
      expect(useMapStore.getState().questProgress[otherId]).toBe(unrelated);
    } finally { unsubscribe(); }
    expect(startQuest(questId)).toBe('ok');
  });

  it('surfaces restoration failure and releases the quest lease', () => {
    const unsubscribe = useMapStore.subscribe(() => { throw new Error('observer failure'); });
    try { expect(() => startQuest(questId)).toThrow(AggregateError); }
    finally { unsubscribe(); }
    expect(startQuest(otherId)).toBe('ok');
  });
});
