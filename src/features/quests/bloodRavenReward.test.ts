/** Constructed completion isolates Claim; native earning/browser proof are separate. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import mainDocument from '@/data/quests/main.json';
import * as mercLoader from '@/data/loaders/mercs';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { claimQuestReward } from '@/features/quests/claimReward';
import { xpTotal } from '@/engine/progression/xp';
import { decodeSave } from '@/engine/save/validate';
import { createMercFromDef } from '@/stores/mercFactory';
import { usePlayerStore } from '@/stores/playerStore';
import { useMercStore, mercXpForLevel } from '@/stores/mercStore';
import { useMapStore } from '@/stores/mapStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useFormationStore } from '@/stores/formationStore';
import { useMetaStore } from '@/stores/metaStore';
import { useCombatStore } from '@/stores/combatStore';
import { __resetPersistenceForTests, exportCurrentSave, snapshotStores, useHydrationStore } from '@/stores/persistence';

const QUEST = 'quests/act1-sisters-burial-grounds';
const TRAINEE = 'mercs/act1-rogue-trainee';
const OTHER = 'mercs/act1-rogue-inner-sight';
const DEN = 'quests/act1-den-of-evil';
const stores = [usePlayerStore, useMercStore, useMapStore, useInventoryStore,
  useFormationStore, useMetaStore, useCombatStore] as const;
function required<T>(value: T | undefined | null): T {
  if (value === undefined || value === null) throw new Error('Missing trainee reward fixture');
  return value;
}
function definition(id: string) {
  return required(mercLoader.loadMercPool().pool.find(row => row.id === id));
}
function add(id: string, suffix?: string): string {
  const merc = createMercFromDef(definition(id), suffix);
  useMercStore.getState().addMerc(merc);
  return merc.id;
}
function snapshot() { return required(snapshotStores()); }
function playerXp(): number {
  const player = required(usePlayerStore.getState().player);
  return xpTotal(player.level) + player.experience;
}
function mercXp(id: string): number {
  const merc = required(useMercStore.getState().ownedMercs.find(row => row.id === id));
  let total = useMercStore.getState().getMercProgress(id).experience;
  for (let level = 1; level < merc.level; level++) total += mercXpForLevel(level);
  return total;
}
function withRewards(rewards: Record<string, unknown>, check: () => void): void {
  const quest = required(mainDocument.quests.find(row => row.id === QUEST));
  const descriptor = required(Object.getOwnPropertyDescriptor(quest, 'rewards'));
  try { Object.defineProperty(quest, 'rewards', { ...descriptor, value: rewards }); check(); }
  finally { Object.defineProperty(quest, 'rewards', descriptor); }
}
function reset(): void {
  __resetPersistenceForTests();
  for (const store of stores) store.getState().reset();
}
beforeEach(() => {
  reset();
  vi.spyOn(Date, 'now').mockReturnValue(1792454400000);
  useHydrationStore.getState().setStatus('ready');
  usePlayerStore.getState().setPlayer(createMockPlayer('Trainee Claim', 'sorceress'));
  useMapStore.getState().updateQuestProgress(QUEST, { status: 'completed',
    objectives: { 'obj-kill-blood-raven': true, 'obj-return': true }, rewardClaimed: false });
});
afterEach(() => { vi.restoreAllMocks(); reset(); useHydrationStore.getState().setStatus('idle'); });

describe('authored Blood Raven trainee Claim', () => {
  it('creates the real level3 recruit without fielding it and grants exactly1500 hero XP once', () => {
    const before = snapshot(), xp = playerXp();
    expect(claimQuestReward(QUEST)).toBe('ok');
    const after = snapshot();
    expect(playerXp()).toBe(xp + 1500);
    expect(after.mercs.ownedMercs).toEqual([createMercFromDef(definition(TRAINEE))]);
    expect(after.mercs.fieldedMercId).toBeNull();
    expect(after.mercs.mercEquipment).toEqual({ [TRAINEE]: {} });
    expect(after.mercs.mercProgress).toEqual({ [TRAINEE]: {
      experience: 0, experienceToNextLevel: mercXpForLevel(3) } });
    expect(after.map.questProgress[QUEST]?.rewardClaimed).toBe(true);
    expect(after.inventory).toEqual({ ...before.inventory,
      currencies: { ...before.inventory.currencies, wishstone: (before.inventory.currencies.wishstone ?? 0) + 15 } });
    expect(after.meta).toEqual(before.meta);
    expect(after.formation).toEqual(before.formation);
    expect(claimQuestReward(QUEST)).toBe('already-claimed');
    expect(snapshot()).toEqual(after);
  });

  it('retains the fielded mercenary and gives that recipient exactly1125 XP, never the new recruit', () => {
    const fielded = add(OTHER);
    useMercStore.getState().setFieldedMerc(fielded);
    const xp = mercXp(fielded);
    expect(claimQuestReward(QUEST)).toBe('ok');
    expect(useMercStore.getState().fieldedMercId).toBe(fielded);
    expect(mercXp(fielded)).toBe(xp + 1125);
    expect(useMercStore.getState().getMercProgress(TRAINEE).experience).toBe(0);
    expect(useMercStore.getState().ownedMercs).toHaveLength(2);
  });

  it.each([undefined, 'historical-42'])('preserves an existing unfielded trainee including suffix %s', suffix => {
    const id = add(TRAINEE, suffix);
    useMercStore.getState().addExperience(id, 321);
    const cap = { id: 'existing-trainee-cap', baseId: 'items/base/helm-cap', rarity: 'normal' as const,
      level: 1, identified: true, equipped: true, equipSlot: 'head' as const, affixes: [] };
    useMercStore.setState(state => ({ mercEquipment: { ...state.mercEquipment, [id]: { head: cap } } }));
    const before = snapshot().mercs;
    expect(claimQuestReward(QUEST)).toBe('ok');
    expect(snapshot().mercs).toEqual(before);
  });

  it('gives an already-fielded suffixed trainee its legitimate XP without resetting progress', () => {
    const id = add(TRAINEE, 'fielded-history');
    useMercStore.getState().addExperience(id, 321);
    useMercStore.getState().setFieldedMerc(id);
    const xp = mercXp(id);
    expect(claimQuestReward(QUEST)).toBe('ok');
    expect(useMercStore.getState().ownedMercs).toHaveLength(1);
    expect(useMercStore.getState().fieldedMercId).toBe(id);
    expect(mercXp(id)).toBe(xp + 1125);
  });

  it('captures the prior XP recipient before a player publication changes fielded selection', () => {
    const prior = add(OTHER), later = add('mercs/act1-rogue-fire');
    useMercStore.getState().setFieldedMerc(prior);
    const priorXp = mercXp(prior), laterXp = mercXp(later);
    const unsubscribe = usePlayerStore.subscribe(() => { useMercStore.getState().setFieldedMerc(later); });
    try { expect(claimQuestReward(QUEST)).toBe('ok'); }
    finally { unsubscribe(); }
    expect(mercXp(prior)).toBe(priorXp + 1125);
    expect(mercXp(later)).toBe(laterXp);
  });

  it.each([
    { xp: 1500, mercenaryUnlock: 'mercs/not-authored' },
    { xp: 1500, mercenaryUnlock: TRAINEE, gold: 5000 },
    { xp: 1500, mercenaryUnlock: TRAINEE, service: 'identify_free' }
  ])('refuses the whole unsupported bundle before writes %j', rewards => {
    withRewards(rewards, () => {
      const before = snapshot();
      expect(claimQuestReward(QUEST)).toBe('unsupported-rewards');
      expect(snapshot()).toEqual(before);
    });
  });

  it('refuses before writes when the real authored definition is missing', () => {
    const pool = mercLoader.loadMercPool();
    vi.spyOn(mercLoader, 'loadMercPool').mockReturnValue({ ...pool,
      pool: pool.pool.filter(row => row.id !== TRAINEE) });
    const before = snapshot();
    expect(claimQuestReward(QUEST)).toBe('unsupported-rewards');
    expect(snapshot()).toEqual(before);
  });

  it('holds the shared guard through roster publication for same and different nested Claims', () => {
    useMapStore.getState().updateQuestProgress(DEN, { status: 'completed',
      objectives: { 'obj-clear-den': true, 'obj-return': true }, rewardClaimed: false });
    const nested: string[] = [];
    const unsubscribe = useMercStore.subscribe(state => {
      if (state.ownedMercs.some(row => row.id === TRAINEE)) {
        nested.push(claimQuestReward(QUEST), claimQuestReward(DEN));
      }
    });
    try { expect(claimQuestReward(QUEST)).toBe('ok'); }
    finally { unsubscribe(); }
    expect(nested).toEqual(['claim-in-progress', 'claim-in-progress']);
    expect(useMapStore.getState().questProgress[DEN]?.rewardClaimed).toBe(false);
  });

  it.each(['roster', 'claimed-flag'] as const)('restores every participating slice after mutate-then-throw at %s', boundary => {
    const fielded = add(OTHER);
    useMercStore.getState().setFieldedMerc(fielded);
    const before = snapshot();
    const fail = new Error(`Controlled ${boundary} publication failure`);
    const addMerc = useMercStore.getState().addMerc;
    const mark = useMapStore.getState().markQuestRewardClaimed;
    const spy = boundary === 'roster'
      ? vi.spyOn(useMercStore.getState(), 'addMerc').mockImplementation(merc => { addMerc(merc); throw fail; })
      : vi.spyOn(useMapStore.getState(), 'markQuestRewardClaimed').mockImplementation(id => { mark(id); throw fail; });
    expect(claimQuestReward(QUEST)).toBe('grant-failed');
    expect(snapshot()).toEqual(before);
    spy.mockRestore();
    expect(claimQuestReward(QUEST)).toBe('ok');
    expect(useMercStore.getState().ownedMercs.filter(row => row.id === TRAINEE)).toHaveLength(1);
    expect(playerXp()).toBe(xpTotal(before.player.level) + before.player.experience + 1500);
    expect(claimQuestReward(QUEST)).toBe('already-claimed');
  });

  it('reports restoration failure explicitly and releases the guard afterward', () => {
    const cause = new Error('Controlled post-roster failure'), restoreError = new Error('Controlled restore failure');
    const original = useMercStore.getState().addMerc;
    const addSpy = vi.spyOn(useMercStore.getState(), 'addMerc').mockImplementation(merc => { original(merc); throw cause; });
    const restoreSpy = vi.spyOn(useMercStore, 'setState').mockImplementation(() => { throw restoreError; });
    let caught: unknown;
    try { claimQuestReward(QUEST); } catch (error) { caught = error; }
    expect(caught).toBeInstanceOf(AggregateError);
    if (!(caught instanceof AggregateError)) throw new Error('Missing explicit restoration failure');
    expect(caught.message).toBe('Quest reward restoration failed');
    expect(caught.cause).toBe(cause);
    expect(caught.errors).toEqual([restoreError]);
    restoreSpy.mockRestore(); addSpy.mockRestore();
    expect(claimQuestReward(QUEST)).toBe('ok');
    expect(useMercStore.getState().ownedMercs.filter(row => row.id === TRAINEE)).toHaveLength(1);
  });

  it('exports the complete claimed roster/progress/selection bundle in the existing save version', () => {
    const fielded = add(OTHER);
    useMercStore.getState().setFieldedMerc(fielded);
    const before = snapshot();
    expect(claimQuestReward(QUEST)).toBe('ok');
    const paid = snapshot();
    const exported = decodeSave(JSON.parse(required(exportCurrentSave())) as unknown);
    expect(exported.version).toBe(before.version);
    expect(exported.player).toEqual(paid.player);
    expect(exported.mercs).toEqual(paid.mercs);
    expect(exported.map).toEqual(paid.map);
    expect(exported.inventory).toEqual({ ...before.inventory,
      currencies: { ...before.inventory.currencies, wishstone: (before.inventory.currencies.wishstone ?? 0) + 15 } });
  });
});
