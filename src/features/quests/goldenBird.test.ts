import { resetSkillsForCompositionTest } from '../../../tests/helpers/reset-skills';
import { withoutV17Fields } from '../../../tests/helpers/save-fixtures';
import { CURRENT_SAVE_VERSION } from '@/engine/types/save';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { loadMercPool } from '@/data/loaders/mercs';
import { loadQuests } from '@/data/loaders/quests';
import { useMapStore } from '@/stores/mapStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { usePlayerStore } from '@/stores/playerStore';
import { useMercStore, mercXpForLevel } from '@/stores/mercStore';
import { useCombatStore } from '@/stores/combatStore';
import { __resetPersistenceForTests, snapshotStores, useHydrationStore } from '@/stores/persistence';
import { questToolStatus, recoverQuestTool } from './interactObject';
import { giveQuestItem, npcQuestDeliveries, questDeliveryCompletions } from './questDelivery';
import { canClaim, claimQuestReward, readQuestItem, recoverClaimedQuestRewardItem, questRewardItemRecoveryStatus, questRewardItemRecoveryStatuses } from './claimReward';
import { validateQuestItemLedger, decodeSave } from '@/engine/save/validate';
import * as saveValidation from '@/engine/save/validate';
import { toJsonSafe } from '@/engine/save';
import { xpTotal } from '@/engine/progression/xp';
import { deriveEquippedPlayerStats } from '@/engine/progression/equipped-stats';
import { abortSubAreaRun, advanceWaveOrFinish, playerToCombatUnit, startSubAreaRun } from '@/stores/combatHelpers';
import { compareEquip } from '@/features/inventory/compareEquip';
import type { Item } from '@/engine/types/items';

const QUEST = 'quests/act3-golden-bird';
const JADE = `${QUEST}#objective:obj-find-figurine`;
const BIRD = `${QUEST}#objective:obj-give-cain`;
const POTION = `${QUEST}#reward:questItem`;
const AREA = 'areas/act3-spider-forest';
const domains = [useMapStore, useInventoryStore, usePlayerStore, useMercStore, useCombatStore] as const;
function required<T>(value: T | null | undefined): T {
  if (value == null) throw new Error('Missing Golden Bird fixture');
  return value;
}
function hero() { return required(usePlayerStore.getState().player); }
function mercTotal(id: string): number {
  const merc = required(useMercStore.getState().ownedMercs.find(row => row.id === id));
  let xp = useMercStore.getState().getMercProgress(id).experience;
  for (let level = 1; level < merc.level; level++) xp += mercXpForLevel(level);
  return xp;
}
function reset(): void {
  abortSubAreaRun();
  __resetPersistenceForTests();
  for (const store of domains) store.getState().reset();
}
function state() {
  return structuredClone(domains.map(store => Object.fromEntries(
    Object.entries(store.getState()).filter(([, value]) => typeof value !== 'function'))));
}
function recover(): void {
  useMapStore.getState().markCleared(AREA);
  expect(recoverQuestTool(JADE)).toBe('ok');
}
function exchanges(): void {
  recover();
  expect(giveQuestItem(JADE, 'npc/cain')).toBe('ok');
  expect(giveQuestItem(BIRD, 'npc/alkor')).toBe('ok');
}
function claim(): void { exchanges(); expect(claimQuestReward(QUEST)).toBe('ok'); }
beforeEach(() => {
  reset();
  useHydrationStore.getState().setStatus('ready');
  const player = createMockPlayer('Golden Bird fixture', 'sorceress');
  usePlayerStore.getState().setPlayer({ ...player, id: 'qa-a3-hero', level: 30, experience: 0,
    derivedStats: { ...deriveEquippedPlayerStats(player, 30, {}), life: 13 } });
  useMapStore.setState({ currentAct: 3, currentSubAreaId: AREA,
    clearedSubAreas: ['areas/act1-catacombs', 'areas/act2-tomb-of-tal-rasha'] });
  useMapStore.getState().updateQuestProgress(QUEST, { status: 'inProgress', rewardClaimed: false,
    objectives: { 'obj-find-figurine': false, 'obj-give-cain': false, 'obj-give-alkor': false } });
});
afterEach(() => { vi.restoreAllMocks(); reset(); });

describe('Golden Bird real exchange chain and Life potion', () => {
  it('requires Spider Forest clear and explicit Give actions; Talk never hands in', () => {
    expect(questToolStatus(JADE)).toBe('unavailable');
    expect(recoverQuestTool(JADE)).toBe('not-eligible');
    const before = hero();
    recover();
    expect(useInventoryStore.getState().questItems).toEqual({ [JADE]: { itemId: 'quest/jade_figurine', state: 'owned' } });
    expect(npcQuestDeliveries('npc/cain').map(row => row.id)).toContain('quest/jade_figurine');
    useMapStore.getState().recordNpcTalk('npc/cain');
    expect(useMapStore.getState().questProgress[QUEST]?.objectives['obj-give-cain']).toBe(false);
    expect(giveQuestItem(BIRD, 'npc/alkor')).toBe('not-eligible');
    expect(giveQuestItem(JADE, 'npc/alkor')).toBe('not-eligible');
    expect(giveQuestItem(JADE, 'npc/cain')).toBe('ok');
    expect(useInventoryStore.getState().questItems).toEqual({
      [JADE]: { itemId: 'quest/jade_figurine', state: 'consumed' },
      [BIRD]: { itemId: 'quest/golden_bird', state: 'owned' }
    });
    expect(useMapStore.getState().questProgress[QUEST]?.objectives).toEqual({
      'obj-find-figurine': true, 'obj-give-cain': true, 'obj-give-alkor': false
    });
    useMapStore.getState().recordNpcTalk('npc/alkor');
    expect(useMapStore.getState().questProgress[QUEST]?.objectives['obj-give-alkor']).toBe(false);
    expect(giveQuestItem(BIRD, 'npc/alkor')).toBe('ok');
    expect(useInventoryStore.getState().questItems[BIRD]?.state).toBe('consumed');
    expect(hero()).toBe(before);
    expect(giveQuestItem(JADE, 'npc/cain')).toBe('already-consumed');
    expect(giveQuestItem(BIRD, 'npc/alkor')).toBe('already-consumed');
  });

  it('claims exactly4000hero/3000merc XP and an unread Potion, then Reads +20maxLife once without healing or XP', () => {
    const def = required(loadMercPool().pool.find(row => row.id === 'mercs/act1-rogue-inner-sight'));
    const mercId = required(useMercStore.getState().hireMerc(def).mercId);
    useMercStore.getState().setFieldedMerc(mercId);
    const mercBefore = mercTotal(mercId);
    exchanges();
    const before = hero();
    const beforeXp = xpTotal(before.level) + before.experience;
    expect(claimQuestReward(QUEST)).toBe('ok');
    expect(useInventoryStore.getState().questItems[POTION]).toEqual({ itemId: 'items/potion_of_life_q', state: 'owned' });
    expect(hero().derivedStats.lifeMax).toBe(before.derivedStats.lifeMax);
    expect(hero().derivedStats.life).toBe(13);
    expect(xpTotal(hero().level) + hero().experience).toBe(beforeXp + 4000);
    expect(mercTotal(mercId) - mercBefore).toBe(3000);
    expect(readQuestItem(POTION)).toBe('ok');
    expect(hero().derivedStats.lifeMax).toBe(before.derivedStats.lifeMax + 20);
    expect(hero().derivedStats.life).toBe(13);
    expect(xpTotal(hero().level) + hero().experience).toBe(beforeXp + 4000);
    expect(useInventoryStore.getState().questItems[POTION]?.state).toBe('consumed');
    const paid = state();
    expect(readQuestItem(POTION)).toBe('already-consumed');
    expect(claimQuestReward(QUEST)).toBe('already-claimed');
    expect(state()).toEqual(paid);
  });

  it('never derives item or reward entitlement from completed/claimed legacy flags', () => {
    useMapStore.getState().updateQuestProgress(QUEST, { status: 'completed', rewardClaimed: false,
      objectives: { 'obj-find-figurine': true, 'obj-give-cain': true, 'obj-give-alkor': true } });
    expect(canClaim(QUEST)).toBe(false);
    expect(claimQuestReward(QUEST)).toBe('not-completed');
    expect(readQuestItem(POTION)).toBe('not-owned');
    const before = hero();
    exchanges();
    expect(claimQuestReward(QUEST)).toBe('ok');
    expect(hero().experience - before.experience).toBe(4000);
  });

  it.each([JADE, BIRD])('rolls back exchange publication for %s and refuses nested actions', source => {
    recover();
    if (source === BIRD) expect(giveQuestItem(JADE, 'npc/cain')).toBe('ok');
    const before = state();
    const original = useMapStore.setState;
    vi.spyOn(useMapStore, 'setState').mockImplementationOnce((...args) => {
      original(...args);
      expect(giveQuestItem(source, source === JADE ? 'npc/cain' : 'npc/alkor')).toBe('claim-in-progress');
      expect(readQuestItem(POTION)).toBe('claim-in-progress');
      throw new Error('after Golden Bird publication');
    });
    expect(giveQuestItem(source, source === JADE ? 'npc/cain' : 'npc/alkor')).toBe('grant-failed');
    expect(state()).toEqual(before);
    expect(giveQuestItem(source, source === JADE ? 'npc/cain' : 'npc/alkor')).toBe('ok');
  });

  it('rejects a Bird lacking its real consumed Jade input and a Potion lacking consumed hand-ins', () => {
    exchanges();
    const progress = useMapStore.getState().questProgress;
    const ledger = useInventoryStore.getState().questItems;
    expect(() => validateQuestItemLedger({ [BIRD]: required(ledger[BIRD]) }, progress)).toThrow();
    const row = required(progress[QUEST]);
    expect(() => validateQuestItemLedger({ [POTION]: { itemId: 'items/potion_of_life_q', state: 'consumed' } },
      { [QUEST]: { ...row, rewardClaimed: true } })).toThrow();
  });

  it('recomputes permanent Life from the consumed source through growth, gear, battle entry and decode', () => {
    claim();
    const base = hero().derivedStats.lifeMax;
    expect(readQuestItem(POTION)).toBe('ok');
    usePlayerStore.getState().recomputeDerived({});
    usePlayerStore.getState().recomputeDerived({});
    expect(hero().derivedStats.lifeMax).toBe(base + 20);
    expect(playerToCombatUnit(hero()).stats.lifeMax).toBe(base + 20);
    usePlayerStore.setState({ player: { ...hero(), derivedStats: { ...hero().derivedStats, lifeMax: 999999 } } });
    const saved = required(snapshotStores());
    const restored = decodeSave(toJsonSafe(saved));
    expect(restored.player.derivedStats.lifeMax).toBe(base + 20);
    expect(restored.player.derivedStats.life).toBe(13);
    expect(restored.inventory.questItems).toEqual(saved.inventory.questItems);
    usePlayerStore.getState().gainExperience(1_000_000);
    expect(hero().derivedStats.lifeMax).toBe(deriveEquippedPlayerStats(hero(), hero().level, {}).lifeMax + 20);
    expect(hero().derivedStats.life).toBe(13);
    expect(loadQuests().find(row => row.id === QUEST)?.rewards).toEqual({ xp: 4000, wishstones: 15, questItem: 'items/potion_of_life_q' });
  });

  it('repairs a claimed legacy reward only after real exchanges, retaining XP and claimed history', () => {
    useMapStore.getState().updateQuestProgress(QUEST, { status: 'completed', rewardClaimed: true,
      objectives: { 'obj-find-figurine': true, 'obj-give-cain': true, 'obj-give-alkor': true } });
    const before = hero();
    expect(questRewardItemRecoveryStatus(QUEST)).toBe('unavailable');
    expect(recoverClaimedQuestRewardItem(QUEST)).toBe('not-eligible');
    exchanges();
    expect(hero()).toBe(before);
    expect(claimQuestReward(QUEST)).toBe('already-claimed');
    expect(questRewardItemRecoveryStatus(QUEST)).toBe('ready');
    expect(recoverClaimedQuestRewardItem(QUEST)).toBe('ok');
    expect(questRewardItemRecoveryStatus(QUEST)).toBe('owned');
    expect(recoverClaimedQuestRewardItem(QUEST)).toBe('already-owned');
    expect(hero()).toBe(before);
    expect(readQuestItem(POTION)).toBe('ok');
    expect(questRewardItemRecoveryStatus(QUEST)).toBe('consumed');
    expect(recoverClaimedQuestRewardItem(QUEST)).toBe('already-consumed');
    expect(hero().experience).toBe(before.experience);
    expect(hero().derivedStats.lifeMax).toBe(before.derivedStats.lifeMax + 20);
    expect(useMapStore.getState().questProgress[QUEST]?.rewardClaimed).toBe(true);
    useMapStore.getState().updateQuestProgress('quests/act2-radaments-lair', {
      status: 'completed', rewardClaimed: true,
      objectives: { 'obj-enter-sewers': true, 'obj-kill-radament': true, 'obj-return-1': true }
    });
    expect(questRewardItemRecoveryStatus('quests/act2-radaments-lair')).toBe('unavailable');
    expect(recoverClaimedQuestRewardItem('quests/act2-radaments-lair')).toBe('not-eligible');
  });

  it('batches mixed recovery choices and reads fresh eligibility after real exchanges, recovery and Read', () => {
    const radament = 'quests/act2-radaments-lair', unknown = 'quests/unknown';
    const requested = [QUEST, radament, unknown, QUEST];
    useMapStore.getState().updateQuestProgress(QUEST, { status: 'completed', rewardClaimed: true,
      objectives: { 'obj-find-figurine': true, 'obj-give-cain': true, 'obj-give-alkor': true } });
    const flagsOnly = state();
    const unavailable = questRewardItemRecoveryStatuses(requested);
    expect(unavailable).toEqual(new Map([[QUEST, 'unavailable'], [radament, 'unavailable'], [unknown, 'unavailable']]));
    expect(state()).toEqual(flagsOnly);
    exchanges();
    const before = state();
    expect(questRewardItemRecoveryStatuses(requested)).toEqual(
      new Map([[QUEST, 'ready'], [radament, 'unavailable'], [unknown, 'unavailable']]));
    expect(state()).toEqual(before);
    expect(recoverClaimedQuestRewardItem(QUEST)).toBe('ok');
    expect(questRewardItemRecoveryStatuses(requested).get(QUEST)).toBe('owned');
    expect(readQuestItem(POTION)).toBe('ok');
    expect(questRewardItemRecoveryStatuses(requested).get(QUEST)).toBe('consumed');
    expect(unavailable.get(QUEST)).toBe('unavailable');
    expect(questRewardItemRecoveryStatuses([]).size).toBe(0);
  });

  it('revalidates the full recovery ledger after an unrelated invalid source and its repair', () => {
    exchanges();
    useMapStore.getState().markQuestRewardClaimed(QUEST);
    const ledger = useInventoryStore.getState().questItems;
    expect(questRewardItemRecoveryStatuses([QUEST]).get(QUEST)).toBe('ready');
    useInventoryStore.setState({ questItems: { ...ledger,
      unrelated: { itemId: 'quest/jade_figurine', state: 'owned' } } });
    const invalid = state();
    expect(questRewardItemRecoveryStatuses([QUEST]).get(QUEST)).toBe('unavailable');
    expect(recoverClaimedQuestRewardItem(QUEST)).toBe('not-eligible');
    expect(state()).toEqual(invalid);
    useInventoryStore.setState({ questItems: ledger });
    expect(questRewardItemRecoveryStatuses([QUEST]).get(QUEST)).toBe('ready');
  });

  it('checks multiple real delivery chains with one full validation and keeps non-delivery semantics', () => {
    exchanges();
    const tome = 'quests/act3-lam-esens-tome', source = `${tome}#objective:obj-find-tome`;
    useMapStore.getState().updateQuestProgress(tome, { status: 'inProgress', rewardClaimed: false,
      objectives: { 'obj-find-tome': false, 'obj-deliver': false } });
    useMapStore.getState().setCurrentLocation(3, 'areas/act3-kurast-bazaar');
    useMapStore.getState().markCleared('areas/act3-kurast-bazaar');
    expect(recoverQuestTool(source)).toBe('ok');
    expect(giveQuestItem(source, 'npc/alkor')).toBe('ok');
    const radament = 'quests/act2-radaments-lair';
    const quests = [QUEST, tome, radament].map(id => required(loadQuests().find(quest => quest.id === id)));
    const validate = vi.spyOn(saveValidation, 'validateQuestItemLedger');
    const before = state();
    expect(questDeliveryCompletions(quests)).toEqual(new Set([radament, QUEST, tome]));
    expect(validate).toHaveBeenCalledTimes(1);
    expect(state()).toEqual(before);
    const ledger = useInventoryStore.getState().questItems;
    useInventoryStore.setState({ questItems: { ...ledger,
      [source]: { itemId: 'quest/lam_esens_tome', state: 'owned' } } });
    // A held legacy-repair Tome is valid, but cannot prove delivery. Bird stays complete.
    expect(questDeliveryCompletions(quests)).toEqual(new Set([radament, QUEST]));
    expect(validate).toHaveBeenCalledTimes(2);
    useInventoryStore.setState({ questItems: ledger });
    expect(questDeliveryCompletions(quests)).toEqual(new Set([radament, QUEST, tome]));
    expect(validate).toHaveBeenCalledTimes(3);
  });

  it.each(['owned', 'consumed'] as const)('rejects a current save with a %s Potion but no real hand-ins', itemState => {
    useMapStore.getState().updateQuestProgress(QUEST, { status: 'completed', rewardClaimed: true,
      objectives: { 'obj-find-figurine': true, 'obj-give-cain': true, 'obj-give-alkor': true } });
    const saved = required(snapshotStores());
    expect(() => decodeSave(toJsonSafe({ ...saved, inventory: { ...saved.inventory,
      questItems: { [POTION]: { itemId: 'items/potion_of_life_q', state: itemState } } } }))).toThrow();
  });

  it('retains permanent Life through previews, stat allocation, respec, revival and the next wave', () => {
    claim();
    expect(readQuestItem(POTION)).toBe('ok');
    const progress = useMapStore.getState().questProgress;
    const ledger = useInventoryStore.getState().questItems;
    const item: Item = { id: 'plain-amulet', baseId: 'items/base/amu-tin', rarity: 'normal',
      level: 1, identified: true, equipped: false };
    const preview = compareEquip(hero(), item, 'amulet', {}, undefined, progress, ledger);
    expect(preview.stats.lifeMax).toEqual({ current: hero().derivedStats.lifeMax,
      candidate: hero().derivedStats.lifeMax, delta: 0 });
    usePlayerStore.setState({ player: { ...hero(), statPoints: 3,
      skillLevels: { 'sorceress.fire_bolt': 1 } } });
    usePlayerStore.getState().allocateStatPoint('vitality');
    expect(usePlayerStore.getState().allocateStatPoints({ strength: 0, dexterity: 0, vitality: 2, energy: 0 }, hero())).toBe('ok');
    expect(resetSkillsForCompositionTest()).toBe('ok');
    const expected = deriveEquippedPlayerStats(hero(), hero().level, {}).lifeMax + 20;
    expect(hero().derivedStats.lifeMax).toBe(expected);
    expect(hero().derivedStats.life).toBe(13);
    usePlayerStore.setState({ player: { ...hero(), derivedStats: { ...hero().derivedStats, life: 0 } } });
    expect(startSubAreaRun({ act: 1, subAreaId: 'areas/act1-den-of-evil', runSeed: 7 })).not.toBeNull();
    const revived = required(useCombatStore.getState().playerTeam.find(unit => unit.id === hero().id));
    expect(revived.stats.lifeMax).toBe(expected);
    expect(revived.life).toBe(expected);
    expect(useCombatStore.getState().outcome?.winner).toBe('player');
    const finalLife = required(useCombatStore.getState().outcome?.finalPlayerTeam.find(unit => unit.id === hero().id)).life;
    let remaining = 10000;
    if (useCombatStore.getState().isPaused) useCombatStore.getState().resumePlayback();
    while (!useCombatStore.getState().playbackComplete && remaining-- > 0) {
      useCombatStore.getState().advanceEvent();
    }
    expect(remaining).toBeGreaterThan(0);
    expect(advanceWaveOrFinish()).toBe('next-wave');
    const next = required(useCombatStore.getState().playerTeam.find(unit => unit.id === hero().id));
    expect(next.stats.lifeMax).toBe(expected);
    expect(next.life).toBe(finalLife);
  });

  it.each(['player', 'inventory'] as const)('rolls back a mutate-then-throw Potion Read at %s', domain => {
    claim();
    const before = state();
    if (domain === 'player') {
      const setPlayer = usePlayerStore.setState;
      vi.spyOn(usePlayerStore, 'setState').mockImplementationOnce((...args) => {
        setPlayer(...args);
        expect(readQuestItem(POTION)).toBe('claim-in-progress');
        throw new Error('after player Read');
      });
    } else {
      const setInventory = useInventoryStore.setState;
      vi.spyOn(useInventoryStore, 'setState').mockImplementationOnce((...args) => {
        setInventory(...args);
        expect(giveQuestItem(BIRD, 'npc/alkor')).toBe('claim-in-progress');
        throw new Error('after inventory Read');
      });
    }
    expect(readQuestItem(POTION)).toBe('grant-failed');
    expect(state()).toEqual(before);
    expect(readQuestItem(POTION)).toBe('ok');
  });

  it('rejects future Golden Bird receipts in frozen14 and migrates legacy flags without items', () => {
    exchanges();
    const current = required(snapshotStores());
    const predecessor = withoutV17Fields(current);
    const json = toJsonSafe(predecessor) as Record<string, unknown>;
    const { questReceipts: _receipts, ...map } = predecessor.map;
    expect(() => decodeSave({ ...json, version: 14, map })).toThrow(/v14/);
    const old = { ...json, version: 14, map,
      inventory: { ...predecessor.inventory, questItems: {} } };
    const decoded = decodeSave(old);
    expect(decoded.version).toBe(CURRENT_SAVE_VERSION);
    expect(decoded.map.questProgress[QUEST]).toEqual(current.map.questProgress[QUEST]);
    expect(decoded.inventory.questItems).toEqual({});
    expect(decoded.map.questReceipts).toEqual({});
    expect(decoded.player.experience).toBe(current.player.experience);
  });
});
