/** Constructed equipped hero; actual authored source/plan/recording/settlement.
 * These tests verify finite quest capability, not earned campaign balance. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('./save-adapter', () => ({ hasSave: vi.fn(), loadSave: vi.fn(), saveSave: vi.fn(() => Promise.resolve()), deleteSave: vi.fn() }));
import * as engine from '@/engine/combat/combat';
import * as loot from '@/engine/loot/award';
import { COW } from '@/engine/map/cow-quest';
import { deriveEquippedPlayerStats } from '@/engine/progression/equipped-stats';
import { loadItemBases } from '@/data/loaders/loot';
import { xpForKill, xpTotal } from '@/engine/progression/xp';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { loadDefaultSkills, resetRegistry } from '@/engine/skills/registry';
import { canClaim, claimQuestReward } from '@/features/quests/claimReward';
import { canStartCowEncounter } from '@/features/quests/cowQuestActions';
import { loadMercPool } from '@/data/loaders/mercs';
import { createMercFromDef } from './mercFactory';
import { abortSubAreaRun, startSubAreaRun, refreshActivePlayerCombatConfig, advanceWaveOrFinish } from './combatHelpers';
import { inspectRecordedWaves } from './recordedWaveReceipt';
import { usePlayerStore, useInventoryStore, useMapStore, useMercStore, useCombatStore, useMetaStore, useFormationStore } from '.';
import { __resetPersistenceForTests, useHydrationStore } from './persistence';
const stores = [usePlayerStore, useInventoryStore, useMapStore, useMercStore, useCombatStore, useMetaStore, useFormationStore] as const;
const stops: (() => void)[] = [];
function required<T>(value: T | null | undefined): T { if (value == null) throw new Error('Missing native Cow fixture'); return value; }
const hero = () => required(usePlayerStore.getState().player);
const totalHero = () => xpTotal(hero().level) + hero().experience;
function arrange(claimed = false) {
  const fresh = createMockPlayer('Cow native capability', 'sorceress');
  usePlayerStore.getState().setPlayer({ ...fresh, level: 32, equipment: [], comboOrder: [], skillLevels: {} });
  const cap = { id: 'cow-capability-cap', baseId: 'items/base/helm-cap', rarity: 'rare' as const, level: 1, identified: true, equipped: false,
    affixes: [{ affixId: 'fixture-imported', values: new Map([['statMods.life', 1_000_000], ['statMods.defense', 1_000_000],
      ['statMods.attack', 1_000_000], ['statMods.attackSpeed', 200]]) }] };
  useInventoryStore.getState().addItem(cap); expect(useInventoryStore.getState().equipItem(cap)).toEqual({ ok: true });
  const staff = 'quests/act2-horadric-staff';
  useMapStore.setState({ currentAct: 1, currentSubAreaId: COW.area, selectedDifficulty: 'normal', clearedSubAreas: [], questProgress: {
    [COW.quest]: { id: COW.quest, status: 'completed', rewardClaimed: claimed, objectives: { [COW.legObjective]: true, [COW.portalObjective]: true } },
    [staff]: { id: staff, status: 'inProgress', rewardClaimed: false, objectives: { 'obj-cube': true, 'obj-shaft': false, 'obj-amulet': false, 'obj-transmute': false } } },
    questReceipts: { [COW.tomeSource]: true, [COW.openProof]: true } });
  useInventoryStore.setState(state => ({ questItems: { ...state.questItems, [COW.legSource]: { itemId: COW.legItemId, state: 'consumed' },
    [COW.tomeSource]: { itemId: COW.tomeItemId, state: 'consumed' }, [COW.cubeSource]: { itemId: COW.cubeItemId, state: 'owned' } } }));
}
function start() {
  expect(startSubAreaRun({ subAreaId: COW.area, act: 1, mode: 'manual', runSeed: 7, questEncounter: COW.encounter })?.totalWaves).toBe(1);
  return required(inspectRecordedWaves().currentPublished).binding;
}
function drain() { const count = useCombatStore.getState().recordedEvents.length; for (let i = 0; i < count; i++) useCombatStore.getState().advanceEvent(); expect(useCombatStore.getState().playbackComplete).toBe(true); }
function ownSource() { const map = useMapStore.getState(); return { row: map.questProgress[COW.quest], items: useInventoryStore.getState().questItems,
  receipts: map.questReceipts, cleared: map.clearedSubAreas, ordinals: map.challengeOrdinals }; }
function reset() { __resetPersistenceForTests(); abortSubAreaRun(); stores.forEach(store => { store.getState().reset(); }); resetRegistry(); loadDefaultSkills(); }
beforeEach(() => { reset(); useHydrationStore.getState().setStatus('ready'); });
afterEach(() => { stops.splice(0).forEach(stop => { stop(); }); vi.restoreAllMocks(); reset(); useHydrationStore.getState().setStatus('idle'); });
describe('native Cow original-body qualification', () => {
  it.each([false, true])('pays one native three-body win, separate fixed Claim and no ordinary clear/ordinal (legacyclaimed=%s)', claimed => {
    arrange(claimed); const source = structuredClone(ownSource()), xp = totalHero(); const binding = start();
    expect(binding.cowEncounter?.originalMemberIds).toHaveLength(3); expect(binding.recording.outcome.winner).toBe('player'); drain();
    expect(advanceWaveOrFinish()).toBe('victory'); expect(totalHero() - xp).toBe(xpForKill(13) * 3);
    expect(useMapStore.getState().questReceipts[COW.victoryProof]).toBe(true); expect(useInventoryStore.getState().currencies['rune-shard']).toBeGreaterThan(0);
    expect(ownSource()).toEqual({ ...source, receipts: { ...source.receipts, [COW.victoryProof]: true } });
    expect(canStartCowEncounter()).toBe(false); const after = totalHero(); expect(advanceWaveOrFinish()).toBe('idle'); expect(totalHero()).toBe(after);
    useCombatStore.getState().endCombat(); expect(canClaim(COW.quest)).toBe(!claimed); expect(claimQuestReward(COW.quest)).toBe(claimed ? 'already-claimed' : 'ok'); expect(totalHero() - after).toBe(claimed ? 0 : 6000);
  });
  it.each(['partial', 'missing', 'renamed', 'duplicate', 'extra-body', 'summoned', 'hero-dead', 'draw'] as const)('refuses %s original outcome before any roll or native income and leaves portal retryable', fault => {
    arrange(); const real = engine.runBattleRecorded;
    vi.spyOn(engine, 'runBattleRecorded').mockImplementationOnce((...args) => {
      const recording = real(...args), clone = structuredClone(recording.result), result = { ...clone, playerTeam: [...clone.playerTeam], enemyTeam: [...clone.enemyTeam] }, enemy = required(result.enemyTeam[1]);
      if (fault === 'partial') Reflect.set(enemy, 'life', 1);
      if (fault === 'missing') result.enemyTeam.pop();
      if (fault === 'renamed') Reflect.set(enemy, 'id', 'foreign-cow-body');
      if (fault === 'duplicate') result.enemyTeam.push({ ...enemy });
      if (fault === 'extra-body') result.enemyTeam.push({ ...enemy, id: 'foreign-extra-body' });
      if (fault === 'summoned') Reflect.set(enemy, 'summon', true);
      if (fault === 'hero-dead') Reflect.set(required(result.playerTeam.find(row => row.kind === 'hero')), 'life', 0);
      if (fault === 'draw') result.winner = null;
      return { ...recording, result };
    });
    const xp = totalHero(), inventory = structuredClone({ backpack: useInventoryStore.getState().backpack, currencies: useInventoryStore.getState().currencies });
    start(); drain(); const roll = vi.spyOn(loot, 'rollKillRewards'); expect(advanceWaveOrFinish()).toBe('defeat'); expect(roll).not.toHaveBeenCalled();
    expect(totalHero()).toBe(xp); expect({ backpack: useInventoryStore.getState().backpack, currencies: useInventoryStore.getState().currencies }).toEqual(inventory);
    expect(useMapStore.getState().questReceipts).not.toHaveProperty(COW.victoryProof); useCombatStore.getState().endCombat(); expect(canStartCowEncounter()).toBe(true);
    useCombatStore.getState().reset(); expect(start().cowEncounter).toBeDefined();
  });
  it('refuses explicit recorded replay before staging and permits abort/retry without proof', () => {
    arrange(); const binding = start(), before = totalHero(), simulate = vi.spyOn(engine, 'runBattleRecorded');
    expect(() => { refreshActivePlayerCombatConfig({ replayCurrentWave: true }); }).toThrow(); expect(simulate).not.toHaveBeenCalled();
    expect(inspectRecordedWaves().currentPublished?.binding).toBe(binding); abortSubAreaRun(); useCombatStore.getState().reset(); expect(totalHero()).toBe(before);
    expect(useMapStore.getState().questReceipts).not.toHaveProperty(COW.victoryProof); expect(start().cowEncounter).toBeDefined();
  });
});
describe('native Cow scoped settlement compensation', () => {
  it.each(['hero-prewrite', 'hero-postwrite', 'inventory-noop', 'inventory-evaluate-noop', 'inventory-prewrite-independent', 'inventory-postwrite', 'proof'] as const)('removes only real native income after %s', fault => {
    arrange(); start(); drain(); const beforeHero = structuredClone(hero()), beforeSource = structuredClone(ownSource()),
      inventory = structuredClone({ backpack: useInventoryStore.getState().backpack, currencies: useInventoryStore.getState().currencies, materials: useInventoryStore.getState().materials });
    const xp = usePlayerStore.getState().gainExperience, invSet = useInventoryStore.setState, mapSet = useMapStore.setState;
    if (fault === 'hero-prewrite') vi.spyOn(usePlayerStore.getState(), 'gainExperience').mockImplementation(() => { throw new Error('native XP before'); });
    if (fault === 'hero-postwrite') vi.spyOn(usePlayerStore.getState(), 'gainExperience').mockImplementation(amount => { xp(amount); throw new Error('native XP after'); });
    if (fault === 'inventory-noop') vi.spyOn(useInventoryStore, 'setState').mockImplementationOnce(() => undefined);
    if (fault === 'inventory-evaluate-noop') vi.spyOn(useInventoryStore, 'setState').mockImplementationOnce(update => { if (typeof update === 'function') update(useInventoryStore.getState()); useInventoryStore.getState().addCurrency('wishstone', 3); throw new Error('evaluated native updater without commit'); });
    if (fault === 'inventory-prewrite-independent') vi.spyOn(useInventoryStore, 'setState').mockImplementationOnce(() => { useInventoryStore.getState().addCurrency('wishstone', 3); throw new Error('native inventory before with independent write'); });
    if (fault === 'inventory-postwrite') vi.spyOn(useInventoryStore, 'setState').mockImplementationOnce((...args) => { invSet(...args); throw new Error('native inventory after'); });
    if (fault === 'proof') vi.spyOn(useMapStore, 'setState').mockImplementationOnce((...args) => { mapSet(...args); throw new Error('victory proof after'); });
    let error: unknown; try { advanceWaveOrFinish(); } catch (caught) { error = caught; } expect(error).toBeInstanceOf(Error);
    expect(error).not.toBeInstanceOf(AggregateError); expect(hero()).toEqual(beforeHero); expect(ownSource()).toEqual(beforeSource);
    expect(useInventoryStore.getState().backpack).toEqual(inventory.backpack); expect(useInventoryStore.getState().materials).toEqual(inventory.materials);
    expect(useInventoryStore.getState().currencies).toEqual(fault === 'inventory-prewrite-independent' || fault === 'inventory-evaluate-noop' ? { ...inventory.currencies, wishstone: 3 } : inventory.currencies);
    expect(inspectRecordedWaves().currentPublished?.installation?.settlement.progress.phase).toBe('settlementFailed');
  });
  it.each(['real-xp', 'raw-xp', 'damage'] as const)('retains independent hero %s and currency on failed native XP', mode => {
    arrange(); start(); drain(); const xp = totalHero(); let fired = false;
    stops.push(usePlayerStore.subscribe(() => { if (fired) return; fired = true;
      if (mode === 'real-xp') usePlayerStore.getState().gainExperience(2);
      if (mode === 'raw-xp') usePlayerStore.getState().addXP(2);
      if (mode === 'damage') Object.assign(hero().derivedStats, { life: 3, mana: 2 });
      useInventoryStore.getState().addCurrency('wishstone', 3); throw new Error('native independent observer');
    }));
    expect(() => advanceWaveOrFinish()).toThrow(); expect(totalHero()).toBe(xp + (mode === 'damage' ? 0 : 2));
    if (mode === 'damage') expect(hero().derivedStats).toMatchObject({ life: 3, mana: 2 });
    expect(useInventoryStore.getState().currencies).toEqual({ wishstone: 3 }); expect(useMapStore.getState().questReceipts).not.toHaveProperty(COW.victoryProof);
  });
  it('compensates actual fielded merc native XP while preserving an independent real award', () => {
    arrange(); const actor = createMercFromDef(required(loadMercPool().pool.find(row => row.id === 'mercs/act1-rogue-trainee')), 'cow-native-merc');
    useMercStore.getState().addMerc(actor); useMercStore.getState().setFieldedMerc(actor.id); start(); drain(); const before = structuredClone(useMercStore.getState().getMercProgress(actor.id)); let fired = false;
    stops.push(useMercStore.subscribe(() => { if (fired) return; fired = true; useMercStore.getState().addExperience(actor.id, 2); throw new Error('independent native recipient XP'); }));
    expect(() => advanceWaveOrFinish()).toThrow(); expect(useMercStore.getState().getMercProgress(actor.id).experience).toBe(before.experience + 2);
    expect(useMercStore.getState().ownedMercs[0]?.level).toBe(actor.level); expect(useMapStore.getState().questReceipts).not.toHaveProperty(COW.victoryProof);
  });
});

it('removes only its own level-up diagnostic after native inventory failure, preserving independent log publication', () => {
  arrange(); usePlayerStore.setState({ player: { ...hero(), level: 1, experience: 0 } }); start(); drain();
  const before = [...useCombatStore.getState().log], original = useInventoryStore.setState;
  vi.spyOn(useInventoryStore, 'setState').mockImplementationOnce((...args) => { original(...args);
    useCombatStore.getState().addLogEntry({ type: 'system', actorId: 'independent', actorName: 'independent', message: 'independent observation' });
    throw new Error('failed inventory after diagnostic');
  });
  expect(() => advanceWaveOrFinish()).toThrow();
  const remaining = useCombatStore.getState().log;
  expect(remaining.filter(entry => entry.actorId !== 'independent')).toEqual(before);
  expect(remaining.filter(entry => entry.actorId === 'independent')).toHaveLength(1);
});

describe('real native Cow physical rewards', () => {
  it.each(([false, true] as const).flatMap(supported => (['own-cleanup', 'independent-xp', 'raw-xp', 'damage', 'independent-gear'] as const).map(mode => ({ supported, mode }))))('cleans $supported supported hero equip and preserves $mode', ({ supported, mode }) => {
    arrange(); const equipped = useInventoryStore.getState().equipped;
    usePlayerStore.setState({ player: { ...hero(), coreStats: { ...hero().coreStats, strength: 999, dexterity: 999 },
      derivedStats: { ...hero().derivedStats, defense: hero().derivedStats.defense + 7, life: 7, mana: 3 } } });
    start(); drain(); const before = structuredClone(hero()), xp = totalHero(); let fired = false; const nativeIds: string[] = [];
    stops.push(useInventoryStore.subscribe(() => {
      const rewards = useInventoryStore.getState().backpack.filter(row => row.id !== 'cow-capability-cap');
      const reward = rewards[0]; if (fired || !reward) return; fired = true; nativeIds.push(...rewards.map(row => row.id));
      if (supported) expect(useInventoryStore.getState().equipItem(reward).ok).toBe(true);
      else {
        const slot = required(loadItemBases().get(reward.baseId)?.slot), owned = { ...reward, equipped: true, equipSlot: slot };
        useInventoryStore.setState(state => ({ backpack: state.backpack.filter(row => row !== reward), equipped: { ...state.equipped, [slot]: owned } }));
        usePlayerStore.setState({ player: { ...hero(), equipment: [...hero().equipment, owned] } });
      }
      if (mode === 'independent-xp') usePlayerStore.getState().gainExperience(2);
      if (mode === 'raw-xp') usePlayerStore.getState().addXP(2);
      if (mode === 'damage') Object.assign(hero().derivedStats, { life: 3, mana: 2 });
      if (mode === 'independent-gear') { useInventoryStore.setState(state => ({ equipped: { ...state.equipped, chest: { id: 'independent-native-chest',
        baseId: 'items/base/armor-quilted', rarity: 'normal', level: 1, identified: true, equipped: true, equipSlot: 'chest', baseRolls: { defense: 9 } } } }));
        usePlayerStore.getState().gainExperience(0);
      }
      throw new Error('native reward moved into equipment');
    }));
    let error: unknown; try { advanceWaveOrFinish(); } catch (caught) { error = caught; }
    expect(error).toBeInstanceOf(Error); expect(error).not.toBeInstanceOf(AggregateError); expect(fired).toBe(true); expect(nativeIds.length).toBeGreaterThan(0);
    expect(useInventoryStore.getState().backpack.some(row => nativeIds.includes(row.id))).toBe(false);
    expect(Object.values(useInventoryStore.getState().equipped).some(row => row && nativeIds.includes(row.id))).toBe(false);
    expect(hero().equipment.some(row => nativeIds.includes(row.id))).toBe(false); expect(totalHero()).toBe(xp + (mode === 'independent-xp' || mode === 'raw-xp' ? 2 : 0));
    expect(hero().derivedStats).toEqual(supported || mode === 'independent-xp' || mode === 'independent-gear'
      ? deriveEquippedPlayerStats(hero(), hero().level, useInventoryStore.getState().equipped,
        useMapStore.getState().questProgress, useInventoryStore.getState().questItems, useMapStore.getState().questReceipts)
      : { ...before.derivedStats, life: mode === 'damage' ? 3 : 7, mana: mode === 'damage' ? 2 : 3 });
    if (mode !== 'independent-gear') expect(useInventoryStore.getState().equipped).toEqual(equipped);
    expect(useMapStore.getState().questReceipts).not.toHaveProperty(COW.victoryProof);
  });
});

it.each([false, true])('preserves independent addition to a native currency balance and original own-zero keys (%s)', ownZero => {
  arrange(); if (ownZero) useInventoryStore.setState({ currencies: { 'rune-shard': 0, wishstone: 0 } }); start(); drain(); let fired = false;
  stops.push(useInventoryStore.subscribe(() => { if (fired || !(useInventoryStore.getState().currencies['rune-shard'] ?? 0)) return; fired = true;
    useInventoryStore.getState().addCurrency('rune-shard', 7); useInventoryStore.getState().addCurrency('wishstone', 3); throw new Error('independent native-key addition');
  }));
  let error: unknown; try { advanceWaveOrFinish(); } catch (caught) { error = caught; }
  expect(error).toBeInstanceOf(Error); expect(error).not.toBeInstanceOf(AggregateError); expect(fired).toBe(true);
  expect(useInventoryStore.getState().currencies).toEqual({ 'rune-shard': 7, wishstone: 3 });
});
it.each(['remove', 'foreign', 'field-away'] as const)('preserves supported native actual recipient %s after its owned share', mode => {
  arrange(); const actor = createMercFromDef(required(loadMercPool().pool.find(row => row.id === 'mercs/act1-rogue-trainee')), 'cow-native-change');
  useMercStore.getState().addMerc(actor); useMercStore.getState().setFieldedMerc(actor.id); start(); drain(); const before = totalHero(); let fired = false;
  const foreign = { ...structuredClone(actor), name: 'independent foreign native actor' };
  stops.push(useMercStore.subscribe(() => { if (fired) return; fired = true;
    if (mode === 'field-away') useMercStore.getState().setFieldedMerc(null);
    else { useMercStore.getState().removeMerc(actor.id); expect(useMercStore.getState().ownedMercs.some(row => row.id === actor.id)).toBe(false);
      if (mode === 'foreign') { useMercStore.getState().addMerc(foreign); useMercStore.getState().addExperience(actor.id, 2); }
    }
    throw new Error('independent native recipient operation');
  }));
  let error: unknown; try { advanceWaveOrFinish(); } catch (caught) { error = caught; }
  expect(error).toBeInstanceOf(Error); expect(error).not.toBeInstanceOf(AggregateError); expect(totalHero()).toBe(before);
  if (mode === 'remove') { expect(useMercStore.getState().ownedMercs).toEqual([]); expect(Object.hasOwn(useMercStore.getState().mercProgress, actor.id)).toBe(false); }
  if (mode === 'foreign') { expect(useMercStore.getState().ownedMercs).toEqual([foreign]); expect(useMercStore.getState().getMercProgress(actor.id).experience).toBe(2); }
  if (mode === 'field-away') { expect(useMercStore.getState().fieldedMercId).toBeNull(); expect(useMercStore.getState().ownedMercs).toEqual([actor]); }
});
it.each(['equip', 'stash'] as const)('cleans actual native reward moved by supported %s operation', destination => {
  arrange(); const fresh = createMercFromDef(required(loadMercPool().pool.find(row => row.id === 'mercs/act1-rogue-trainee')), 'cow-native-gear');
  const actor = { ...fresh, level: 32, coreStats: { ...fresh.coreStats, strength: 999, dexterity: 999 }, derivedStats: { ...fresh.derivedStats, life: 7, mana: 3 } };
  useMercStore.getState().addMerc(actor); useMercStore.getState().setFieldedMerc(actor.id); start(); drain(); let fired = false; const nativeIds: string[] = [];
  stops.push(useInventoryStore.subscribe(() => {
    const rewards = useInventoryStore.getState().backpack.filter(row => row.id !== 'cow-capability-cap'), reward = rewards[0];
    if (fired || !reward) return; fired = true; nativeIds.push(...rewards.map(row => row.id));
    const slot = required(loadItemBases().get(reward.baseId)?.slot);
    if (destination === 'equip') expect(useMercStore.getState().equipOnMerc(actor.id, slot, reward).ok).toBe(true);
    else expect(useInventoryStore.getState().moveToStash(reward.id).ok).toBe(true);
    useMercStore.getState().addExperience(actor.id, 2); Object.assign(required(useMercStore.getState().ownedMercs[0]).derivedStats, { life: 3, mana: 2 });
    throw new Error('actual native reward transferred');
  }));
  let error: unknown; try { advanceWaveOrFinish(); } catch (caught) { error = caught; }
  expect(error).toBeInstanceOf(Error); expect(error).not.toBeInstanceOf(AggregateError); expect(fired).toBe(true);
  const inventory = useInventoryStore.getState(), mercs = useMercStore.getState();
  expect([...inventory.backpack, ...inventory.stash, ...Object.values(mercs.mercEquipment).flatMap(gear => Object.values(gear))].some(row => row && nativeIds.includes(row.id))).toBe(false);
  expect(required(mercs.ownedMercs[0]).equipment.some(row => nativeIds.includes(row.id))).toBe(false);
  expect(mercs.getMercProgress(actor.id).experience).toBe(2); expect(required(mercs.ownedMercs[0]).derivedStats).toMatchObject({ life: 3, mana: 2 });
});
