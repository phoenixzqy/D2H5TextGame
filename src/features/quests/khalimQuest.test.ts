import { withoutV17Fields } from '../../../tests/helpers/save-fixtures';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { useMapStore } from '@/stores/mapStore';
import { usePlayerStore } from '@/stores/playerStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useCombatStore } from '@/stores/combatStore';
import { useMercStore } from '@/stores/mercStore';
import { abortSubAreaRun } from '@/stores/combatHelpers';
import { snapshotStores, useHydrationStore } from '@/stores/persistence';
import { recoverQuestTool, questToolStatus, assembleQuestItem, questAssemblyStatus } from './interactObject';
import { canClaim, claimQuestReward, readQuestItem } from './claimReward';
import { xpTotal } from '@/engine/progression/xp';
import { decodeSave, validateQuestActionReceipts, validateQuestItemLedger } from '@/engine/save/validate';
import { toJsonSafe } from '@/engine/save/serialize';
import { publishQuestItemChange, withQuestTransaction } from './questTransaction';

const QUEST = 'quests/act3-khalims-will';
const A2 = 'quests/act2-horadric-staff';
const SOURCE = (id: string) => `${QUEST}#objective:${id}`;
const CUBE = `${A2}#objective:obj-cube`;
const COUNCIL = `${QUEST}#action:council-victory`;
const GUARDIAN = 'quests/act3-guardian';
const ORB = `${GUARDIAN}#action:break-compelling-orb`;
const WILL = SOURCE('obj-transmute');
const PARTS = [
  ['obj-heart', 'quest/khalims_heart', 'areas/act3-flayer-jungle'],
  ['obj-brain', 'quest/khalims_brain', 'areas/act3-great-marsh'],
  ['obj-eye', 'quest/khalims_eye', 'areas/act3-kurast-bazaar'],
  ['obj-flail', 'quest/khalims_flail', 'areas/act3-travincal']
] as const;
function reset(): void {
  abortSubAreaRun();
  for (const store of [useMapStore, usePlayerStore, useInventoryStore, useCombatStore, useMercStore]) store.getState().reset();
}
function required<T>(value: T | null | undefined): T {
  if (value == null) throw new Error('Missing Khalim fixture');
  return value;
}
function orders<T>(values: readonly T[]): T[][] {
  return values.length === 0 ? [[]] : values.flatMap((value, index) =>
    orders(values.filter((_, other) => other !== index)).map(rest => [value, ...rest]));
}
function recoverParts(order: readonly number[] = [0, 1, 2, 3]): void {
  for (const index of order) {
    const part = required(PARTS[index]);
    useMapStore.getState().setCurrentLocation(3, part[2]);
    expect(questToolStatus(SOURCE(part[0]))).toBe('ready');
    expect(recoverQuestTool(SOURCE(part[0]))).toBe('ok');
  }
}
function assemble(): void { recoverParts(); expect(assembleQuestItem(WILL)).toBe('ok'); }
function trackGuardian(): void {
  useMapStore.getState().updateQuestProgress(GUARDIAN, { status: 'inProgress', rewardClaimed: false,
    objectives: { 'obj-kill-mephisto': false } });
}
function prospectiveOrb() {
  return { items: { ...useInventoryStore.getState().questItems,
    [WILL]: { itemId: 'items/khalims_will', state: 'consumed' as const } },
  receipts: { ...useMapStore.getState().questReceipts, [ORB]: true as const } };
}
beforeEach(() => {
  reset(); useHydrationStore.getState().setStatus('ready');
  usePlayerStore.getState().setPlayer(createMockPlayer('Khalim source fixture', 'sorceress'));
  useMapStore.setState({ currentAct: 2, currentSubAreaId: 'areas/act2-dry-hills',
    clearedSubAreas: ['areas/act1-catacombs', 'areas/act2-tomb-of-tal-rasha', ...PARTS.map(part => part[2])],
    questProgress: {
      [A2]: { id: A2, status: 'inProgress', objectives: {
        'obj-cube': false, 'obj-shaft': false, 'obj-amulet': false, 'obj-transmute': false } },
      [QUEST]: { id: QUEST, status: 'inProgress', rewardClaimed: false,
        objectives: { 'obj-heart': false, 'obj-brain': false, 'obj-eye': false, 'obj-flail': false, 'obj-transmute': false } }
    },
    // Constructed retained proof fixture; accepted combat admission is tested separately.
    questReceipts: { [COUNCIL]: true }
  });
  expect(recoverQuestTool(CUBE)).toBe('ok');
});
afterEach(() => { vi.restoreAllMocks(); reset(); useHydrationStore.getState().setStatus('idle'); });

describe('actual unordered Khalim components and assembly', () => {
  it.each(orders([0, 1, 2, 3]))('acquires order %s/%s/%s/%s and assembles once with the retained Act II Cube', (...order) => {
    const hero = usePlayerStore.getState().player;
    recoverParts(order);
    expect(assembleQuestItem(WILL)).toBe('ok');
    expect(useInventoryStore.getState().questItems).toEqual({
      [CUBE]: { itemId: 'quest/horadric_cube', state: 'owned' },
      ...Object.fromEntries(PARTS.map(part => [SOURCE(part[0]), { itemId: part[1], state: 'consumed' }])),
      [WILL]: { itemId: 'items/khalims_will', state: 'owned' }
    });
    expect(usePlayerStore.getState().player).toBe(hero);
    expect(useMapStore.getState().questProgress[QUEST]).toMatchObject({ status: 'completed', rewardClaimed: false });
    expect(assembleQuestItem(WILL)).toBe('already-owned');
    expect(useInventoryStore.getState().backpack).toEqual([]);
  });

  it.each(PARTS)('requires the source clear for %s', (objective, _item, area) => {
    useMapStore.setState(state => ({ clearedSubAreas: state.clearedSubAreas.filter(id => id !== area) }));
    useMapStore.getState().setCurrentLocation(3, area);
    expect(questToolStatus(SOURCE(objective))).toBe('unavailable');
    expect(recoverQuestTool(SOURCE(objective))).toBe('not-eligible');
  });

  it('never substitutes clear/objective flags for qualified Council proof at Flail Recover', () => {
    useMapStore.setState({ questReceipts: {} });
    useMapStore.getState().updateQuestProgress(QUEST, { objectives: {
      'obj-heart': false, 'obj-brain': false, 'obj-eye': false, 'obj-flail': true, 'obj-transmute': false } });
    useMapStore.getState().setCurrentLocation(3, 'areas/act3-travincal');
    expect(recoverQuestTool(SOURCE('obj-flail'))).toBe('not-eligible');
    expect(useInventoryStore.getState().questItems[SOURCE('obj-flail')]).toBeUndefined();
  });

  it.each(['missing', 'wrong-source', 'consumed'] as const)('refuses assembly with %s Cube', fault => {
    recoverParts();
    const { [CUBE]: cube, ...other } = useInventoryStore.getState().questItems;
    useInventoryStore.setState({ questItems: fault === 'missing' ? other : fault === 'wrong-source'
      ? { ...other, 'quests/act3-khalims-will#objective:obj-cube': required(cube) }
      : { ...other, [CUBE]: { itemId: 'quest/horadric_cube', state: 'consumed' } } });
    expect(questAssemblyStatus(WILL)).toBe('unavailable');
    expect(assembleQuestItem(WILL)).toBe('not-eligible');
    expect(useInventoryStore.getState().questItems[WILL]).toBeUndefined();
  });

  it('pays Claim XP8000 only with a real output, never from bare flags or by cloning Will', () => {
    const initial = required(useMapStore.getState().questProgress[QUEST]);
    useMapStore.getState().updateQuestProgress(QUEST, { ...initial, status: 'completed',
      objectives: Object.fromEntries(Object.keys(initial.objectives).map(id => [id, true])) });
    expect(canClaim(QUEST)).toBe(false); expect(claimQuestReward(QUEST)).toBe('not-completed');
    recoverParts(); expect(assembleQuestItem(WILL)).toBe('ok');
    const hero = required(usePlayerStore.getState().player);
    usePlayerStore.getState().setPlayer({ ...hero, level: 50, experience: 0, experienceToNextLevel: 1_000_000 });
    const before = required(usePlayerStore.getState().player), ledger = useInventoryStore.getState().questItems;
    expect(claimQuestReward(QUEST)).toBe('ok');
    const after = required(usePlayerStore.getState().player);
    expect(xpTotal(after.level) + after.experience - xpTotal(before.level) - before.experience).toBe(8000);
    expect(useInventoryStore.getState().questItems).toBe(ledger);
    expect(useInventoryStore.getState().backpack).toEqual([]);
    expect(claimQuestReward(QUEST)).toBe('already-claimed');
    expect(useInventoryStore.getState().questItems).toBe(ledger);
  });

  it('repairs historical claimed Khalim with actual inputs and existing qualified proof without repaying XP', () => {
    const initial = required(useMapStore.getState().questProgress[QUEST]);
    const claimed = { ...initial, status: 'completed' as const, rewardClaimed: true,
      objectives: Object.fromEntries(Object.keys(initial.objectives).map(id => [id, true])) };
    useMapStore.getState().updateQuestProgress(QUEST, claimed);
    const hero = usePlayerStore.getState().player;
    expect(useInventoryStore.getState().questItems[WILL]).toBeUndefined();
    assemble();
    expect(useMapStore.getState().questProgress[QUEST]).toEqual(claimed);
    expect(claimQuestReward(QUEST)).toBe('already-claimed');
    expect(usePlayerStore.getState().player).toBe(hero);
  });

  it.each([false, true])('validates prospective consumed Will/Orb together independent of Khalim Claim first=%s', claimed => {
    assemble(); trackGuardian();
    if (claimed) expect(claimQuestReward(QUEST)).toBe('ok');
    const next = prospectiveOrb(), map = useMapStore.getState();
    expect(validateQuestItemLedger(next.items, map.questProgress, next.receipts)).toBe(next.items);
    expect(validateQuestActionReceipts(next.receipts, map.questProgress, next.items)).toBe(next.receipts);
    expect(() => validateQuestItemLedger(next.items, map.questProgress, map.questReceipts)).toThrow();
    expect(() => validateQuestActionReceipts(next.receipts, map.questProgress, useInventoryStore.getState().questItems)).toThrow();
    expect(() => validateQuestActionReceipts(next.receipts, map.questProgress)).toThrow();
    expect(withQuestTransaction(() => publishQuestItemChange(GUARDIAN,
      required(map.questProgress[GUARDIAN]), next.items, next.receipts))).toBe('ok');
    if (!claimed) expect(claimQuestReward(QUEST)).toBe('ok');
    expect(useInventoryStore.getState().questItems[WILL]?.state).toBe('consumed');
    expect(assembleQuestItem(WILL)).toBe('already-owned');
  });

  it('restores only participating item/receipt keys and the named quest row after mutate-then-throw publication', () => {
    assemble(); trackGuardian();
    const items = useInventoryStore.getState().questItems, map = useMapStore.getState(), next = prospectiveOrb();
    const publish = useMapStore.setState;
    vi.spyOn(useMapStore, 'setState').mockImplementationOnce((...args) => {
      publish(...args);
      expect(claimQuestReward(QUEST)).toBe('claim-in-progress');
      expect(readQuestItem('missing')).toBe('claim-in-progress');
      useInventoryStore.setState(state => ({ questItems: { ...state.questItems,
        'quests/act3-blade-of-the-old-religion#objective:obj-find-gidbinn': { itemId: 'quest/gidbinn', state: 'owned' } } }));
      useMapStore.getState().updateQuestProgress('quests/act3-blade-of-the-old-religion', {
        status: 'inProgress', rewardClaimed: false, objectives: { 'obj-find-gidbinn': true, 'obj-deliver': false } });
      throw new Error('after Orb receipt write');
    });
    expect(withQuestTransaction(() => publishQuestItemChange(GUARDIAN,
      required(map.questProgress[GUARDIAN]), next.items, next.receipts))).toBe('grant-failed');
    expect(useInventoryStore.getState().questItems).toEqual({ ...items,
      'quests/act3-blade-of-the-old-religion#objective:obj-find-gidbinn': { itemId: 'quest/gidbinn', state: 'owned' } });
    expect(useMapStore.getState().questReceipts).toEqual(map.questReceipts);
    expect(useMapStore.getState().questProgress['quests/act3-blade-of-the-old-religion']?.status).toBe('inProgress');
    expect(() => validateQuestItemLedger(useInventoryStore.getState().questItems,
      useMapStore.getState().questProgress, useMapStore.getState().questReceipts)).not.toThrow();
  });

  it.each(['inventory-before', 'inventory-after', 'map-before', 'map-after'] as const)(
    'restores assembly and action publication when %s throws', fault => {
      recoverParts();
      const before = { items: useInventoryStore.getState().questItems, map: useMapStore.getState() };
      const inventoryWrite = useInventoryStore.setState, mapWrite = useMapStore.setState;
      const inject = () => {
        if (fault.startsWith('inventory')) vi.spyOn(useInventoryStore, 'setState').mockImplementationOnce((...args) => {
          if (fault.endsWith('after')) inventoryWrite(...args);
          expect(assembleQuestItem(WILL)).toBe('claim-in-progress');
          throw new Error(fault);
        });
        else vi.spyOn(useMapStore, 'setState').mockImplementationOnce((...args) => {
          if (fault.endsWith('after')) mapWrite(...args);
          expect(readQuestItem('missing')).toBe('claim-in-progress');
          throw new Error(fault);
        });
      };
      inject();
      expect(assembleQuestItem(WILL)).toBe('grant-failed');
      expect(useInventoryStore.getState().questItems).toBe(before.items);
      expect(useMapStore.getState().questProgress).toEqual(before.map.questProgress);
      expect(useMapStore.getState().questReceipts).toBe(before.map.questReceipts);
      vi.restoreAllMocks();
      expect(assembleQuestItem(WILL)).toBe('ok'); trackGuardian();
      const actionBefore = { items: useInventoryStore.getState().questItems, map: useMapStore.getState() };
      const next = prospectiveOrb(); inject();
      expect(withQuestTransaction(() => publishQuestItemChange(GUARDIAN,
        required(actionBefore.map.questProgress[GUARDIAN]), next.items, next.receipts))).toBe('grant-failed');
      expect(useInventoryStore.getState().questItems).toBe(actionBefore.items);
      expect(useMapStore.getState().questProgress).toEqual(actionBefore.map.questProgress);
      expect(useMapStore.getState().questReceipts).toBe(actionBefore.map.questReceipts);
    });

  it('attempts both failed restorations and retains the shared lock through their aggregate error', () => {
    assemble(); trackGuardian();
    const before = { items: useInventoryStore.getState().questItems, map: useMapStore.getState() };
    const next = prospectiveOrb(), inventoryWrite = useInventoryStore.setState, mapWrite = useMapStore.setState;
    const inventoryError = new Error('inventory restore'), mapError = new Error('map restore');
    const attempted: string[] = [];
    vi.spyOn(useInventoryStore, 'setState').mockImplementationOnce((...args) => { inventoryWrite(...args); })
      .mockImplementationOnce((...args) => {
        attempted.push('inventory'); inventoryWrite(...args);
        expect(claimQuestReward(QUEST)).toBe('claim-in-progress'); throw inventoryError;
      });
    vi.spyOn(useMapStore, 'setState').mockImplementationOnce((...args) => {
      mapWrite(...args); throw new Error('publication');
    }).mockImplementationOnce((...args) => {
      attempted.push('map'); mapWrite(...args);
      expect(readQuestItem('missing')).toBe('claim-in-progress'); throw mapError;
    });
    let caught: unknown;
    try { withQuestTransaction(() => publishQuestItemChange(GUARDIAN,
      required(before.map.questProgress[GUARDIAN]), next.items, next.receipts)); }
    catch (error) { caught = error; }
    expect(caught).toBeInstanceOf(AggregateError);
    expect((caught as AggregateError).errors).toEqual([inventoryError, mapError]);
    expect(attempted).toEqual(['inventory', 'map']);
    expect(useInventoryStore.getState().questItems).toBe(before.items);
    expect(useMapStore.getState().questReceipts).toBe(before.map.questReceipts);
    expect(claimQuestReward(QUEST)).toBe('ok');
  });

  it.each(['owned', 'consumed'] as const)('roundtrips the actual %s Will graph without changing XP or Claim state', state => {
    assemble(); trackGuardian();
    if (state === 'consumed') {
      const next = prospectiveOrb();
      expect(withQuestTransaction(() => publishQuestItemChange(GUARDIAN,
        required(useMapStore.getState().questProgress[GUARDIAN]), next.items, next.receipts))).toBe('ok');
    }
    const saved = required(snapshotStores());
    const restored = decodeSave(toJsonSafe(saved));
    expect(restored).toEqual(saved);
    expect(restored.inventory.questItems[WILL]?.state).toBe(state);
    expect(restored.map.questProgress[QUEST]?.rewardClaimed).toBe(false);
  });

  it('keeps frozen14 closed and migrates historical Khalim flags without minting items, proof or XP', () => {
    assemble();
    expect(claimQuestReward(QUEST)).toBe('ok');
    const saved = required(snapshotStores());
    const predecessor = withoutV17Fields(saved);
    const { questReceipts: _receipts, ...map } = predecessor.map;
    expect(() => decodeSave({ ...predecessor, version: 14, map })).toThrow(/v14/);
    const historical = { ...predecessor, version: 14, map,
      inventory: { ...predecessor.inventory, questItems: { [CUBE]: required(saved.inventory.questItems[CUBE]) } } };
    const before = structuredClone(historical), decoded = decodeSave(historical);
    expect(historical).toEqual(before);
    expect(decoded.inventory.questItems).toEqual(historical.inventory.questItems);
    expect(decoded.map.questReceipts).toEqual({});
    expect(decoded.map.questProgress[QUEST]).toEqual(saved.map.questProgress[QUEST]);
    expect(decoded.player).toEqual(saved.player);
  });
});
