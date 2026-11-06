import { describe, expect, it } from 'vitest';
import type { QuestActionReceipts, QuestItemLedger, QuestProgressData } from '../types/save';
import { LIVE_ACT5_DOMAIN } from '../save/act5-state';
import { NIHLATHAK, hasNihlathakRelic, hasQualifiedNihlathakVictory, validateNihlathakQuestGraph } from './nihlathak-quest';

function recovered() {
  const act5 = LIVE_ACT5_DOMAIN, encounter = act5.encounters.find(row => row.questId === act5.prisonQuest);
  if (!encounter) throw new Error('Missing Prison encounter');
  const progress: Record<string, QuestProgressData> = {
    [NIHLATHAK.quest]: { id: NIHLATHAK.quest, status: 'completed', rewardClaimed: false,
      objectives: { [NIHLATHAK.objective]: true } },
    [act5.prisonQuest]: { id: act5.prisonQuest, status: 'completed', rewardClaimed: false,
      objectives: Object.fromEntries((act5.objectiveIds[act5.prisonQuest] ?? []).map(id => [id, true])) }
  };
  const receipts: QuestActionReceipts = Object.fromEntries(
    [act5.inspectProof, act5.potionSource, act5.thawProof, encounter.proof].map(source => [source, true as const]));
  const items: QuestItemLedger = { [NIHLATHAK.source]: { itemId: NIHLATHAK.itemId, state: 'owned' },
    [act5.potionSource]: { itemId: act5.potionItemId, state: 'consumed' } };
  return { progress, receipts, items, encounter };
}
describe('finite Nihlathak physical source and qualified Prison graph', () => {
  it.each([false, true, undefined])('admits retained relic before/after Claim (claimed=%s), without main Claim or Read', claimed => {
    const { progress, receipts, items } = recovered();
    if (claimed === undefined) Reflect.deleteProperty(progress[NIHLATHAK.quest] ?? {}, 'rewardClaimed');
    else Reflect.set(progress[NIHLATHAK.quest] ?? {}, 'rewardClaimed', claimed);
    expect(hasQualifiedNihlathakVictory(progress, receipts, items)).toBe(true);
    expect(hasNihlathakRelic(progress, items, receipts)).toBe(true);
    expect(() => { validateNihlathakQuestGraph(progress, items, receipts); }).not.toThrow();
  });
  it.each(['missing', 'in-progress', 'legacy-completed', 'getter'] as const)(
    'keeps qualified main authority independent of the %s side row during publication', fault => {
      const { progress, receipts, items } = recovered(); let reads = 0;
      if (fault === 'missing') Reflect.deleteProperty(progress, NIHLATHAK.quest);
      if (fault === 'in-progress') Reflect.set(progress[NIHLATHAK.quest] ?? {}, 'status', 'inProgress');
      if (fault === 'legacy-completed') Reflect.set(progress[NIHLATHAK.quest] ?? {}, 'objectives', {});
      if (fault === 'getter') Object.defineProperty(progress, NIHLATHAK.quest,
        { configurable: true, enumerable: true, get() { reads++; return {}; } });
      expect(hasQualifiedNihlathakVictory(progress, receipts, items)).toBe(true);
      expect(hasNihlathakRelic(progress, items, receipts)).toBe(false);
      expect(reads).toBe(0);
    });
  it('does not inspect a transient or foreign side-source value when qualifying the main victory', () => {
    const { progress, receipts, items } = recovered(); let reads = 0;
    Object.defineProperty(items, NIHLATHAK.source,
      { configurable: true, enumerable: true, get() { reads++; return {}; } });
    expect(hasQualifiedNihlathakVictory(progress, receipts, items)).toBe(true);
    expect(hasNihlathakRelic(progress, items, receipts)).toBe(false);
    expect(reads).toBe(0);
  });
  it.each(['missing-main', 'wrong-main-id', 'incomplete-main', 'false-main-objective', 'extra-main-objective',
    'missing-inspect', 'missing-receive', 'missing-thaw', 'missing-victory', 'missing-potion', 'owned-potion', 'wrong-potion',
    'extra-potion-field', 'invalid-main-claimed'] as const)('rejects %s without inferring actual Prison proof', fault => {
      const { progress, receipts, items, encounter } = recovered(), act5 = LIVE_ACT5_DOMAIN;
      if (fault === 'missing-main') Reflect.deleteProperty(progress, act5.prisonQuest);
      if (fault === 'wrong-main-id') Reflect.set(progress[act5.prisonQuest] ?? {}, 'id', 'foreign');
      if (fault === 'incomplete-main') Reflect.set(progress[act5.prisonQuest] ?? {}, 'status', 'inProgress');
      if (fault === 'false-main-objective') Reflect.set(progress[act5.prisonQuest]?.objectives ?? {}, act5.thawObjective, false);
      if (fault === 'extra-main-objective') Reflect.set(progress[act5.prisonQuest]?.objectives ?? {}, 'future', true);
      if (fault === 'missing-inspect') Reflect.deleteProperty(receipts, act5.inspectProof);
      if (fault === 'missing-receive') Reflect.deleteProperty(receipts, act5.potionSource);
      if (fault === 'missing-thaw') Reflect.deleteProperty(receipts, act5.thawProof);
      if (fault === 'missing-victory') Reflect.deleteProperty(receipts, encounter.proof);
      if (fault === 'missing-potion') Reflect.deleteProperty(items, act5.potionSource);
      if (fault === 'owned-potion') Reflect.set(items[act5.potionSource] ?? {}, 'state', 'owned');
      if (fault === 'wrong-potion') Reflect.set(items[act5.potionSource] ?? {}, 'itemId', 'foreign');
      if (fault === 'extra-potion-field') Reflect.set(items[act5.potionSource] ?? {}, 'extra', true);
      if (fault === 'invalid-main-claimed') Reflect.set(progress[act5.prisonQuest] ?? {}, 'rewardClaimed', undefined);
      expect(hasQualifiedNihlathakVictory(progress, receipts, items)).toBe(false);
      expect(hasNihlathakRelic(progress, items, receipts)).toBe(false);
      expect(() => { validateNihlathakQuestGraph(progress, items, receipts); }).toThrow('Invalid');
    });
  it.each(['wrong-side-id', 'in-progress', 'false-objective', 'missing-objective', 'extra-objective',
    'invalid-claimed', 'wrong-item', 'consumed', 'extra-item-field'] as const)('rejects contradictory relic %s', fault => {
      const { progress, receipts, items } = recovered(), row = progress[NIHLATHAK.quest];
      if (!row) throw new Error('Missing side row');
      if (fault === 'wrong-side-id') Reflect.set(row, 'id', 'foreign');
      if (fault === 'in-progress') Reflect.set(row, 'status', 'inProgress');
      if (fault === 'false-objective') Reflect.set(row.objectives, NIHLATHAK.objective, false);
      if (fault === 'missing-objective') Reflect.deleteProperty(row.objectives, NIHLATHAK.objective);
      if (fault === 'extra-objective') Reflect.set(row.objectives, 'future', true);
      if (fault === 'invalid-claimed') Reflect.set(row, 'rewardClaimed', undefined);
      if (fault === 'wrong-item') Reflect.set(items[NIHLATHAK.source] ?? {}, 'itemId', 'foreign');
      if (fault === 'consumed') Reflect.set(items[NIHLATHAK.source] ?? {}, 'state', 'consumed');
      if (fault === 'extra-item-field') Reflect.set(items[NIHLATHAK.source] ?? {}, 'extra', true);
      expect(hasNihlathakRelic(progress, items, receipts)).toBe(false);
      expect(() => { validateNihlathakQuestGraph(progress, items, receipts); }).toThrow('Invalid');
    });
  it.each(['main-row', 'main-objectives', 'main-objective', 'main-claimed', 'potion-source', 'potion-item',
    'inspect-proof', 'receive-proof', 'thaw-proof', 'victory-proof'] as const)(
    'refuses a relevant %s getter without executing it', field => {
      const { progress, receipts, items, encounter } = recovered(), act5 = LIVE_ACT5_DOMAIN; let reads = 0;
      const target = field === 'main-row' ? progress : field === 'main-objectives' || field === 'main-claimed'
        ? progress[act5.prisonQuest] : field === 'main-objective' ? progress[act5.prisonQuest]?.objectives
          : field === 'potion-source' ? items : field === 'potion-item' ? items[act5.potionSource] : receipts;
      const key = field === 'main-row' ? act5.prisonQuest : field === 'main-objectives' ? 'objectives'
        : field === 'main-claimed' ? 'rewardClaimed' : field === 'main-objective' ? act5.thawObjective
          : field === 'potion-source' ? act5.potionSource : field === 'potion-item' ? 'itemId'
            : field === 'inspect-proof' ? act5.inspectProof : field === 'receive-proof' ? act5.potionSource
              : field === 'thaw-proof' ? act5.thawProof : encounter.proof;
      if (!target) throw new Error('Missing descriptor fixture');
      Object.defineProperty(target, key, { configurable: true, enumerable: true, get() { reads++; return true; } });
      expect(hasQualifiedNihlathakVictory(progress, receipts, items)).toBe(false);
      expect(hasNihlathakRelic(progress, items, receipts)).toBe(false);
      expect(() => { validateNihlathakQuestGraph(progress, items, receipts); }).toThrow('Invalid');
      expect(reads).toBe(0);
    });
  it.each(['source', 'item', 'row', 'objectives', 'objective'] as const)(
    'refuses a relic %s getter before reading it', field => {
      const { progress, receipts, items } = recovered(); let reads = 0;
      const row = progress[NIHLATHAK.quest]; if (!row) throw new Error('Missing side row');
      const target = field === 'source' ? items : field === 'item' ? items[NIHLATHAK.source]
        : field === 'row' ? progress : field === 'objectives' ? row : row.objectives;
      const key = field === 'source' ? NIHLATHAK.source : field === 'item' ? 'itemId'
        : field === 'row' ? NIHLATHAK.quest : field === 'objectives' ? 'objectives' : NIHLATHAK.objective;
      if (!target) throw new Error('Missing descriptor fixture');
      Object.defineProperty(target, key, { configurable: true, enumerable: true, get() { reads++; return true; } });
      expect(hasNihlathakRelic(progress, items, receipts)).toBe(false);
      expect(() => { validateNihlathakQuestGraph(progress, items, receipts); }).toThrow('Invalid');
      expect(reads).toBe(0);
    });
  it.each(['hidden', 'symbol', 'inherited'] as const)('rejects %s physical source descriptors', fault => {
    const { progress, receipts, items } = recovered();
    if (fault === 'hidden') Object.defineProperty(items, NIHLATHAK.source, { enumerable: false });
    if (fault === 'symbol') Reflect.set(items[NIHLATHAK.source] ?? {}, Symbol('source'), true);
    if (fault === 'inherited') {
      Reflect.deleteProperty(items, NIHLATHAK.source);
      Object.setPrototypeOf(items, { [NIHLATHAK.source]: { itemId: NIHLATHAK.itemId, state: 'owned' } });
    }
    expect(hasNihlathakRelic(progress, items, receipts)).toBe(false);
    expect(() => { validateNihlathakQuestGraph(progress, items, receipts); }).toThrow('Invalid');
  });
  it.each([false, true])('preserves proofless completed legacy side history (claimed=%s)', claimed => {
    const { progress } = recovered(); Reflect.set(progress[NIHLATHAK.quest] ?? {}, 'rewardClaimed', claimed);
    expect(hasNihlathakRelic(progress, {}, {})).toBe(false);
    expect(() => { validateNihlathakQuestGraph(progress, {}, {}); }).not.toThrow();
  });
  it('uses the supplied historical Prison identities rather than future live defaults', () => {
    const { progress, receipts, items, encounter } = recovered(), act5 = LIVE_ACT5_DOMAIN;
    const proof = 'quests/act5-prison-of-ice#action:historical-victory';
    const historical = { ...act5, encounters: act5.encounters.map(row => row.questId === act5.prisonQuest ? { ...row, proof } : row),
      receipts: act5.receipts.map(source => source === encounter.proof ? proof : source) };
    Reflect.deleteProperty(receipts, encounter.proof); Reflect.set(receipts, proof, true);
    expect(hasNihlathakRelic(progress, items, receipts)).toBe(false);
    expect(hasNihlathakRelic(progress, items, receipts, NIHLATHAK, historical)).toBe(true);
    expect(hasQualifiedNihlathakVictory(progress, receipts, items, historical)).toBe(true);
  });
});
