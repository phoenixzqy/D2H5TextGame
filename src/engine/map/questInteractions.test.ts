import { describe, expect, it } from 'vitest';
import { applyObjectInteraction, listAreaObjectTargets, objectInteractionStatus,
  type InteractionQuest, type InteractionProgress } from './questInteractions';

function required<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('Missing interaction fixture');
  return value;
}

const location = { actId: 'acts/act2', areaId: 'areas/act2-arcane-sanctuary' };
const event = { ...location, targetId: 'objects/horazon_journal' };
const areas = [{ id: location.areaId, actId: location.actId }];
const quest: InteractionQuest = { id: 'quests/journal', actId: location.actId, objectives: [
  { id: 'kill', type: 'kill' },
  { id: 'read', type: 'interact', areaId: location.areaId, targetId: event.targetId }
] };
function progress(kill = true): Record<string, InteractionProgress> {
  return { [quest.id]: { id: quest.id, status: 'inProgress', rewardClaimed: false,
    objectives: { kill, read: false, unrelated: true } } };
}

describe('ordered area-object events', () => {
  it('completes exactly the authored eligible objective, preserving unrelated state', () => {
    const before = progress();
    const after = applyObjectInteraction([quest], areas, before, event);
    expect(after).toEqual({ [quest.id]: { ...before[quest.id], status: 'completed',
      objectives: { kill: true, read: true, unrelated: true } } });
    expect(before).toEqual(progress());
    expect(objectInteractionStatus([quest], areas, before, event)).toBe('ready');
    expect(objectInteractionStatus([quest], areas, after, event)).toBe('completed');
    expect(applyObjectInteraction([quest], areas, after, event)).toBe(after);
    const claimed = { [quest.id]: { ...required(after[quest.id]), rewardClaimed: true } };
    expect(objectInteractionStatus([quest], areas, claimed, event)).toBe('claimed');
  });

  it('never banks early reads or cascades two ordered reads from one event', () => {
    const early = progress(false);
    expect(applyObjectInteraction([quest], areas, early, event)).toBe(early);
    const repeated: InteractionQuest = { ...quest, objectives: [...quest.objectives,
      { ...quest.objectives[1], id: 'reread', type: 'interact' }] };
    const once = applyObjectInteraction([repeated], areas, progress(), event);
    expect(once[quest.id]?.objectives).toEqual({ kill: true, read: true, unrelated: true });
    expect(once[quest.id]?.status).toBe('inProgress');
    expect(applyObjectInteraction([repeated], areas, once, event)[quest.id]?.status).toBe('completed');
  });

  it.each(['locked', 'available', 'completed'] as const)('ignores %s progress', status => {
    const before = progress(); required(before[quest.id]).status = status;
    expect(applyObjectInteraction([quest], areas, before, event)).toBe(before);
  });

  it('ignores missing/claimed progress and wrong targets/areas/acts', () => {
    const empty = {};
    expect(applyObjectInteraction([quest], areas, empty, event)).toBe(empty);
    const claimed = progress(); required(claimed[quest.id]).rewardClaimed = true;
    expect(applyObjectInteraction([quest], areas, claimed, event)).toBe(claimed);
    const before = progress();
    for (const invalid of [{ ...event, targetId: 'objects/other' },
      { ...event, areaId: 'areas/missing' }, { ...event, actId: 'acts/act1' }]) {
      expect(applyObjectInteraction([quest], areas, before, invalid)).toBe(before);
      expect(objectInteractionStatus([quest], areas, before, invalid)).toBe('unavailable');
    }
  });

  it.each([
    { itemRequired: 'quest/staff' }, { areaId: 'areas/act2_arcane_sanctuary' },
    { areaId: undefined }, { targetId: undefined }, { targetId: '' }, { count: 2 }
  ])('refuses unsupported authored objective %j', changes => {
    const unsupported = { ...quest, objectives: [{ ...quest.objectives[1], ...changes,
      id: 'read', type: 'interact' }] };
    const before = progress();
    expect(listAreaObjectTargets([unsupported], areas, location)).toEqual([]);
    expect(applyObjectInteraction([unsupported], areas, before, event)).toBe(before);
  });

  it('lists canonical area targets once and preserves unrelated quest references', () => {
    const other = { ...quest, id: 'quests/other', actId: 'acts/act1' };
    const before = { ...progress(), [other.id]: { id: other.id, status: 'inProgress' as const, objectives: {} } };
    expect(listAreaObjectTargets([quest, quest, other], areas, location)).toEqual([event.targetId]);
    expect(listAreaObjectTargets([quest], [], location)).toEqual([]);
    expect(applyObjectInteraction([quest, other], areas, before, event)[other.id]).toBe(before[other.id]);
  });

  it('requires own true predecessor flags', () => {
    const before = progress();
    required(before[quest.id]).objectives = Object.assign(Object.create({ kill: true }) as Record<string, boolean>, { read: false });
    expect(applyObjectInteraction([quest], areas, before, event)).toBe(before);
  });
});
