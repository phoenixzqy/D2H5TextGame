import { describe, expect, it, vi } from 'vitest';
import * as questLoader from '@/data/loaders/quests';
import type { QuestProgressData } from '../types/save';
import { validateQuestServiceLedger, type QuestServiceEntry } from './quest-services';

const sources = [
  ['quests/act5-siege-on-harrogath', 'socket_item'],
  ['quests/side-act5-larzuks-sockets', 'socket_item'],
  ['quests/side-act4-halbus-soul', 'socket_armor'],
  ['quests/act5-prison-of-ice', 'personalize_item'],
  ['quests/side-act5-anyas-gift', 'personalize_item']
] as const;
const questId = sources[0][0], source = `${questId}#reward:service`;
const available: QuestServiceEntry = { serviceId: 'socket_item', state: 'available' };

function completed(id: string): QuestProgressData {
  const quest = questLoader.loadQuests().find(row => row.id === id);
  if (!quest) throw new Error('Missing service quest fixture');
  return { id, status: 'completed', rewardClaimed: true,
    objectives: Object.fromEntries(quest.objectives.map(objective => [objective.id, true])) };
}

describe('finite source-backed quest service ledger', () => {
  it('accepts empty history without inferring charges from claimed rows', () => {
    const services = {}, progress = Object.fromEntries(sources.map(([id]) => [id, completed(id)]));
    const before = structuredClone(progress);
    expect(validateQuestServiceLedger(services, progress)).toBe(services);
    expect(services).toEqual({}); expect(progress).toEqual(before);
  });

  it('preserves five independent source charges and historical uses without mutation', () => {
    const services = Object.fromEntries(sources.map(([id, serviceId], index) => [
      `${id}#reward:service`, index % 2 ? { serviceId, state: 'consumed', targetItemId: `legacy item ${String(index)}` }
        : { serviceId, state: 'available' }
    ]));
    const progress = Object.fromEntries(sources.map(([id]) => [id, completed(id)]));
    const before = structuredClone([services, progress]);
    expect(validateQuestServiceLedger(services, progress)).toBe(services);
    expect([services, progress]).toEqual(before);
  });

  it.each(['starter-cap', 'it-abc-2', '', 'legacy item / arbitrary identifier'])(
    'accepts the existing persisted item-ID string boundary: %j', targetItemId => {
      const services = { [source]: { ...available, state: 'consumed', targetItemId } };
      expect(validateQuestServiceLedger(services, { [questId]: completed(questId) })).toBe(services);
    });

  it('accepts own JSON properties on null-prototype records', () => {
    const entry: Record<string, unknown> = Object.assign(Object.create(null) as object, available);
    const services: Record<string, unknown> = Object.assign(Object.create(null) as object, { [source]: entry });
    const row = completed(questId);
    const objectives: Record<string, unknown> = Object.assign(Object.create(null) as object, row.objectives);
    const progress: Record<string, unknown> = Object.assign(Object.create(null) as object,
      { [questId]: Object.assign(Object.create(null) as object, { ...row, objectives }) });
    expect(validateQuestServiceLedger(services, progress)).toBe(services);
  });

  it.each([null, undefined, [], new Map(), new Date(), 1, 'services', Object.create({ [source]: available }) as unknown])(
    'rejects non-JSON or inherited ledger %j', services => {
      expect(() => validateQuestServiceLedger(services, {})).toThrow(/quest service/i);
    });

  it.each([null, undefined, [], new Map(), Object.create({ [questId]: completed(questId) }) as unknown])(
    'rejects non-JSON or inherited progress %j', progress => {
      expect(() => validateQuestServiceLedger({ [source]: available }, progress)).toThrow(/quest service/i);
    });

  it.each(['quests/future#reward:service', `${questId}#action:service`, 'quests/act1-cain#reward:service', '__proto__'])(
    'rejects unknown or unsupported source %s', key => {
      expect(() => validateQuestServiceLedger({ [key]: available }, { [questId]: completed(questId) })).toThrow(/quest service/i);
    });

  it.each([
    null, undefined, [], new Map(), Object.create(available) as unknown,
    {}, { state: 'available' }, { serviceId: 'socket_item' },
    { ...available, serviceId: 'socket_armor' }, { ...available, serviceId: 'identify_free' },
    { ...available, state: 'used' }, { ...available, extra: true },
    { ...available, targetItemId: 'actual-item' }, { ...available, targetItemId: undefined },
    { ...available, state: 'consumed' }, { ...available, state: 'consumed', targetItemId: undefined },
    { ...available, state: 'consumed', targetItemId: null }, { ...available, state: 'consumed', targetItemId: 1 },
    { ...available, state: 'consumed', targetItemId: 'item', extra: true }
  ])('rejects malformed, extra, inherited or mismatched entry %j', entry => {
    expect(() => validateQuestServiceLedger({ [source]: entry }, { [questId]: completed(questId) })).toThrow(/quest service/i);
  });

  it.each(['missing', 'inherited-row', 'wrong-id', 'in-progress', 'unclaimed', 'missing-claimed',
    'missing-objective', 'false-objective', 'extra-objective', 'inherited-objectives'])(
    'requires actual own completed claimed canonical objectives: %s', fault => {
      const row = completed(questId), objectiveId = Object.keys(row.objectives)[0];
      if (!objectiveId) throw new Error('Missing objective fixture');
      let progress: unknown = { [questId]: row };
      if (fault === 'missing') progress = {};
      if (fault === 'inherited-row') progress = { [questId]: Object.create(row) as unknown };
      if (fault === 'wrong-id') progress = { [questId]: { ...row, id: 'quests/other' } };
      if (fault === 'in-progress') progress = { [questId]: { ...row, status: 'inProgress' } };
      if (fault === 'unclaimed') progress = { [questId]: { ...row, rewardClaimed: false } };
      if (fault === 'missing-claimed') {
        const { rewardClaimed: _claimed, ...rest } = row; progress = { [questId]: rest };
      }
      if (fault === 'missing-objective') progress = { [questId]: { ...row, objectives: {} } };
      if (fault === 'false-objective') progress = { [questId]: { ...row, objectives: { ...row.objectives, [objectiveId]: false } } };
      if (fault === 'extra-objective') progress = { [questId]: { ...row, objectives: { ...row.objectives, future: true } } };
      if (fault === 'inherited-objectives') progress = { [questId]: { ...row, objectives: Object.create(row.objectives) as unknown } };
      expect(() => validateQuestServiceLedger({ [source]: available }, progress)).toThrow(/quest service/i);
    });

  it('rejects symbol, non-enumerable and accessor fields before reading them', () => {
    const getter = vi.fn(() => 'socket_item');
    for (const entry of [
      { ...available, [Symbol('extra')]: true },
      Object.defineProperty({ ...available }, 'extra', { value: true }),
      Object.defineProperty({ ...available }, 'serviceId', { get: getter, enumerable: true })
    ]) expect(() => validateQuestServiceLedger({ [source]: entry }, { [questId]: completed(questId) })).toThrow(/quest service/i);
    expect(getter).not.toHaveBeenCalled();
  });

  it('rechecks the authored service instead of trusting only the finite source mapping', () => {
    const progress = { [questId]: completed(questId) }, quests = questLoader.loadQuests();
    const load = vi.spyOn(questLoader, 'loadQuests');
    try {
      load.mockReturnValue(quests.map(quest => quest.id === questId ? { ...quest, rewards: { service: 'personalize_item' } } : quest));
      expect(() => validateQuestServiceLedger({ [source]: available }, progress)).toThrow(/quest service/i);
      load.mockReturnValue(quests.filter(quest => quest.id !== questId));
      expect(() => validateQuestServiceLedger({ [source]: available }, progress)).toThrow(/quest service/i);
    } finally { load.mockRestore(); }
  });
});
