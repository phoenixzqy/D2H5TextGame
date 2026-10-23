import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as quests from '@/data/loaders/quests';
import { useMapStore } from './mapStore';

const QUEST = 'quests/act2-radaments-lair';
const event = { actId: 'acts/act2', areaId: 'areas/act2-far-oasis',
  archetypeIds: ['monsters/act2.radament'] };
function radamentDefinition() {
  const definition = quests.loadQuests().find(row => row.id === QUEST);
  if (!definition) throw new Error('Missing canonical Radament quest');
  return definition;
}
function track() {
  useMapStore.getState().updateQuestProgress(QUEST, { status: 'inProgress',
    objectives: { 'obj-kill-radament': false, unrelated: true }, rewardClaimed: false });
}
beforeEach(() => { useMapStore.getState().reset(); });
afterEach(() => { vi.restoreAllMocks(); });

describe('qualified ordinary monster kill batches', () => {
  it('uses exact canonical Radament quest context without changing kill semantics', () => {
    const quest = radamentDefinition();
    expect(quest.actId).toBe(event.actId);
    expect(quest.objectives[0]).toMatchObject({ type: 'kill', targetId: event.archetypeIds[0],
      areaId: event.areaId });
  });

  it('completes a tracked matching quest once, preserves flags, and never auto-claims', () => {
    track();
    useMapStore.getState().updateQuestProgress('unrelated', { status: 'available', objectives: {} });
    const before = useMapStore.getState();
    before.recordMonsterKills({ ...event, archetypeIds: [...event.archetypeIds, ...event.archetypeIds] });
    const after = useMapStore.getState();
    expect(after).toEqual({ ...before, questProgress: { ...before.questProgress,
      [QUEST]: { ...before.questProgress[QUEST], status: 'completed',
        objectives: { 'obj-kill-radament': true, unrelated: true } } } });
    expect(after.questProgress.unrelated).toBe(before.questProgress.unrelated);
    after.recordMonsterKills(event);
    expect(useMapStore.getState()).toBe(after);
  });

  it.each(['missing', 'available', 'locked', 'completed', 'claimed', 'already-met'] as const)(
    'keeps identical state for %s progress', (kind) => {
      if (kind !== 'missing') useMapStore.getState().updateQuestProgress(QUEST, {
        status: kind === 'claimed' || kind === 'already-met' ? 'inProgress' : kind,
        objectives: { 'obj-kill-radament': kind === 'already-met' }, rewardClaimed: kind === 'claimed'
      });
      const before = useMapStore.getState(); before.recordMonsterKills(event);
      expect(useMapStore.getState()).toBe(before);
    });

  it.each([{ actId: 'acts/act1' }, { areaId: 'areas/act2_sewers_3' },
    { archetypeIds: ['monsters/act2.greater-mummy'] }, { archetypeIds: [] }])(
    'rejects mismatched kill context %j', (mismatch) => {
      track(); const before = useMapStore.getState();
      before.recordMonsterKills({ ...event, ...mismatch });
      expect(useMapStore.getState()).toBe(before);
    });

  it('evaluates every objective against the same pre-event snapshot without cascading', () => {
    const definition = radamentDefinition();
    vi.spyOn(quests, 'loadQuests').mockReturnValue([{ ...definition, objectives: [
      { id: 'first', type: 'kill', targetId: 'monsters/act2.radament', areaId: event.areaId, description: 'First' },
      { id: 'second', type: 'kill', targetId: 'monsters/act2.mummy', areaId: event.areaId, description: 'Second' }
    ] }]);
    useMapStore.getState().updateQuestProgress(QUEST, { status: 'inProgress',
      objectives: { first: false, second: false }, rewardClaimed: false });
    const batch = { ...event, archetypeIds: ['monsters/act2.radament', 'monsters/act2.mummy'] };
    useMapStore.getState().recordMonsterKills(batch);
    expect(useMapStore.getState().questProgress[QUEST]).toMatchObject({ status: 'inProgress',
      objectives: { first: true, second: false } });
    useMapStore.getState().recordMonsterKills(batch);
    expect(useMapStore.getState().questProgress[QUEST]).toMatchObject({ status: 'completed',
      objectives: { first: true, second: true }, rewardClaimed: false });
  });

  it.each([0, 2, 10])('does not pretend a boolean receipt satisfies count %i', (count) => {
    const definition = radamentDefinition();
    vi.spyOn(quests, 'loadQuests').mockReturnValue([{ ...definition,
      objectives: definition.objectives.map(objective => ({ ...objective, count })) }]);
    track(); const before = useMapStore.getState(); before.recordMonsterKills(event);
    expect(useMapStore.getState()).toBe(before);
  });

  it('supports an explicitly authored count of one', () => {
    const definition = radamentDefinition();
    vi.spyOn(quests, 'loadQuests').mockReturnValue([{ ...definition,
      objectives: definition.objectives.map(objective => ({ ...objective, count: 1 })) }]);
    track(); useMapStore.getState().recordMonsterKills(event);
    expect(useMapStore.getState().questProgress[QUEST]?.status).toBe('completed');
  });

  it('does not reinterpret chapter-boss objectives as ordinary kills', () => {
    const quest = 'quests/act1-sisters-to-the-slaughter';
    useMapStore.getState().updateQuestProgress(quest, { status: 'inProgress',
      objectives: { 'obj-kill-andariel': false } });
    const before = useMapStore.getState();
    before.recordMonsterKills({ actId: 'acts/act1', areaId: 'areas/act1-catacombs',
      archetypeIds: ['monsters/act1.andariel'] });
    expect(useMapStore.getState()).toBe(before);
  });
});
