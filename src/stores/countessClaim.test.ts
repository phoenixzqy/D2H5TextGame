/** Constructed API tests; no earned gameplay or historical replay. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { loadQuests } from '@/data/loaders/quests';
import { canClaim, claimQuestReward } from '@/features/quests/claimReward';
import { abortSubAreaRun, advanceWaveOrFinish, startSubAreaRun } from '@/stores/combatHelpers';
import { usePlayerStore } from '@/stores/playerStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { useCombatStore } from '@/stores/combatStore';
import { useMercStore } from '@/stores/mercStore';
import { useMetaStore } from '@/stores/metaStore';
import { useFormationStore } from '@/stores/formationStore';
import { __resetPersistenceForTests, useHydrationStore } from '@/stores/persistence';
import { xpTotal } from '@/engine/progression/xp';
import { loadMercPool } from '@/data/loaders/mercs';
import { createMercFromDef } from '@/stores/mercFactory';
import { mercXpForLevel } from '@/stores/mercStore';

const QUEST = 'quests/act1-forgotten-tower';
const AREA = 'areas/act1-dark-wood';
const ENCOUNTER = 'act1-dw-countess';
const PROOF = `${QUEST}#action:countess-victory`;
const stores = [usePlayerStore, useInventoryStore, useMapStore, useCombatStore, useMercStore, useMetaStore, useFormationStore] as const;
function required<T>(value: T | null | undefined): T { if (value == null) throw new Error('Missing Countess fixture'); return value; }
function reset() {
  abortSubAreaRun(); __resetPersistenceForTests();
  for (const store of stores) store.getState().reset();
}
function snapshot() {
  return structuredClone(stores.map(store => Object.fromEntries(Object.entries(store.getState()).filter(([, value]) => typeof value !== 'function'))));
}
function heroXp() { const p = required(usePlayerStore.getState().player); return xpTotal(p.level) + p.experience; }
function drain() { useCombatStore.getState().recordedEvents.forEach(() => { useCombatStore.getState().advanceEvent(); }); }
function track(status: 'inProgress' | 'completed' = 'inProgress', rewardClaimed = false, objectives?: Record<string, boolean>) {
  const quest = required(loadQuests().find(row => row.id === QUEST));
  useMapStore.getState().updateQuestProgress(QUEST, { status, rewardClaimed,
    objectives: objectives ?? Object.fromEntries(quest.objectives.map(row => [row.id, false])) });
}
// Exercise the explicit selected quest encounter at the runtime boundary.
function enter(patch: Record<string, unknown> = {}) {
  const options = { act: 1, subAreaId: AREA, mode: 'manual', runSeed: 7, questEncounter: ENCOUNTER, ...patch };
  return startSubAreaRun(options as Parameters<typeof startSubAreaRun>[0]);
}
function finish() { drain(); return advanceWaveOrFinish(); }
beforeEach(() => {
  reset(); useHydrationStore.getState().setStatus('ready');
  usePlayerStore.getState().setPlayer({ ...createMockPlayer('Countess constructed fixture', 'sorceress'), comboOrder: [] });
  const gear = { id: 'countess-fixture-cap', baseId: 'items/base/helm-cap', rarity: 'rare' as const,
    level: 1, identified: true, equipped: false,
    affixes: [{ affixId: 'constructed-power', values: new Map([['statMods.attack', 99978], ['statMods.defense', 99973], ['statMods.life', 999880]]) }] };
  useInventoryStore.getState().addItem(gear); expect(useInventoryStore.getState().equipItem(gear)).toEqual({ ok: true });
  useMapStore.setState({ currentAct: 1, currentSubAreaId: AREA, clearedSubAreas: [] }); track();
});
afterEach(() => { vi.restoreAllMocks(); reset(); });


const RUNE_IDS = ['runes/ral', 'runes/ort', 'runes/thul', 'runes/amn', 'runes/sol',
  'runes/shael', 'runes/dol', 'runes/io', 'runes/lum'];
function addMerc(definitionId: string) {
  const merc = createMercFromDef(required(loadMercPool().pool.find(row => row.id === definitionId)));
  useMercStore.getState().addMerc(merc); return merc.id;
}
function mercXp(id: string) {
  const store = useMercStore.getState(), merc = required(store.ownedMercs.find(row => row.id === id));
  let total = store.getMercProgress(id).experience;
  for (let level = 1; level < merc.level; level++) total += mercXpForLevel(level);
  return total;
}
function earnProof() {
  enter(); expect(finish()).toBe('victory'); useCombatStore.getState().endCombat();
  expect(useMapStore.getState().questReceipts[PROOF]).toBe(true);
}
function runeDelta(before: Readonly<Record<string, number>>) {
  const after = useInventoryStore.getState().materials;
  return Object.fromEntries([...new Set([...Object.keys(before), ...Object.keys(after)])]
    .map(id => [id, (after[id] ?? 0) - (before[id] ?? 0)] as const).filter(([, count]) => count !== 0));
}

describe('Countess exact once-only cache Claim', () => {
  it('authors exactly3000XP and one named level13 rune-table pick with no gold or substitute reward', () => {
    expect(required(loadQuests().find(row => row.id === QUEST)).rewards)
      .toEqual({ xp: 3000, lootTable: { tableId: 'loot/countess-runes', ilvl: 13, picks: 1 } });
  });

  it('grants3000hero/2250original-mercXP and exactly one of the nine named runes once', () => {
    const recipient = addMerc('mercs/act1-rogue-inner-sight');
    useMercStore.getState().setFieldedMerc(recipient); earnProof();
    const xp = heroXp(), merc = mercXp(recipient), inventory = structuredClone(useInventoryStore.getState().materials);
    const currencies = structuredClone(useInventoryStore.getState().currencies);
    const backpack = structuredClone(useInventoryStore.getState().backpack);
    expect(canClaim(QUEST)).toBe(true); expect(claimQuestReward(QUEST)).toBe('ok');
    expect(heroXp()).toBe(xp + 3000); expect(mercXp(recipient)).toBe(merc + 2250);
    const delta = Object.entries(runeDelta(inventory));
    expect(delta).toHaveLength(1); expect(RUNE_IDS).toContain(required(delta[0])[0]);
    expect(required(delta[0])[1]).toBe(1);
    expect(useInventoryStore.getState().currencies).toEqual(currencies);
    expect(useInventoryStore.getState().backpack).toEqual(backpack);
    expect(useMapStore.getState().questProgress[QUEST]?.rewardClaimed).toBe(true);
    const after = snapshot(); expect(claimQuestReward(QUEST)).toBe('already-claimed'); expect(snapshot()).toEqual(after);
  });

  it('keeps the recipient captured before heroXP observers change the fielded merc', () => {
    const recipient = addMerc('mercs/act1-rogue-inner-sight'), other = addMerc('mercs/act1-rogue-fire');
    useMercStore.getState().setFieldedMerc(recipient); earnProof();
    const before = mercXp(recipient), otherBefore = mercXp(other); let fired = false;
    const stop = usePlayerStore.subscribe(() => {
      if (fired) return; fired = true; useMercStore.setState({ fieldedMercId: other });
    });
    try { expect(claimQuestReward(QUEST)).toBe('ok'); } finally { stop(); }
    expect(fired).toBe(true); expect(mercXp(recipient)).toBe(before + 2250);
    expect(mercXp(other)).toBe(otherBefore);
  });

  it('detects a silently lost claimed-last publication, rolls back the bundle, and retries once', () => {
    const recipient = addMerc('mercs/act1-rogue-inner-sight');
    useMercStore.getState().setFieldedMerc(recipient); earnProof();
    const before = snapshot(), xp = heroXp(), merc = mercXp(recipient);
    const materials = structuredClone(useInventoryStore.getState().materials);
    const lost = vi.spyOn(useMapStore.getState(), 'markQuestRewardClaimed').mockImplementation(() => undefined);
    expect(claimQuestReward(QUEST)).toBe('grant-failed'); expect(snapshot()).toEqual(before);
    lost.mockRestore();
    expect(claimQuestReward(QUEST)).toBe('ok'); expect(heroXp()).toBe(xp + 3000);
    expect(mercXp(recipient)).toBe(merc + 2250);
    expect(Object.values(runeDelta(materials))).toEqual([1]);
    const paid = snapshot(); expect(claimQuestReward(QUEST)).toBe('already-claimed'); expect(snapshot()).toEqual(paid);
  });
});
