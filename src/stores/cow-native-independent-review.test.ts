/** Independent review regression: actual defeat cannot become payout authority through mutable playback. */
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
vi.mock('./save-adapter', () => ({ hasSave: vi.fn(), loadSave: vi.fn(), saveSave: vi.fn(() => Promise.resolve()), deleteSave: vi.fn() }));
import { COW } from '@/engine/map/cow-quest';
import * as staging from './recordedWaveStaging';
import { xpTotal } from '@/engine/progression/xp';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { loadDefaultSkills, resetRegistry } from '@/engine/skills/registry';
import { abortSubAreaRun, startSubAreaRun, advanceWaveOrFinish } from './combatHelpers';
import { inspectRecordedWaves } from './recordedWaveReceipt';
import { usePlayerStore, useInventoryStore, useMapStore, useMercStore, useCombatStore, useMetaStore, useFormationStore } from '.';
import { __resetPersistenceForTests, useHydrationStore } from './persistence';
const stores = [usePlayerStore, useInventoryStore, useMapStore, useMercStore, useCombatStore, useMetaStore, useFormationStore] as const;
function required<T>(value: T | null | undefined): T { if (value == null) throw new Error('Missing independent Cow fixture'); return value; }
function reset() { __resetPersistenceForTests(); abortSubAreaRun(); stores.forEach(store => { store.getState().reset(); }); resetRegistry(); loadDefaultSkills(); }
beforeEach(() => { reset(); useHydrationStore.getState().setStatus('ready'); });
afterEach(() => { vi.restoreAllMocks(); reset(); useHydrationStore.getState().setStatus('idle'); });
it('refuses an actual native Cow defeat forged in place into a valid-body victory before settlement', () => {
  const fresh = createMockPlayer('Independent Cow loss', 'sorceress');
  usePlayerStore.getState().setPlayer({ ...fresh, level: 1, equipment: [], comboOrder: [], skillLevels: {},
    derivedStats: { ...fresh.derivedStats, life: 1, lifeMax: 1, attack: 1, defense: 0 } });
  const staff = 'quests/act2-horadric-staff';
  useMapStore.setState({ currentAct: 1, currentSubAreaId: COW.area, selectedDifficulty: 'normal', clearedSubAreas: [], questProgress: {
    [COW.quest]: { id: COW.quest, status: 'completed', rewardClaimed: false, objectives: { [COW.legObjective]: true, [COW.portalObjective]: true } },
    [staff]: { id: staff, status: 'inProgress', rewardClaimed: false, objectives: { 'obj-cube': true, 'obj-shaft': false, 'obj-amulet': false, 'obj-transmute': false } } },
    questReceipts: { [COW.tomeSource]: true, [COW.openProof]: true } });
  useInventoryStore.setState({ questItems: { [COW.legSource]: { itemId: COW.legItemId, state: 'consumed' },
    [COW.tomeSource]: { itemId: COW.tomeItemId, state: 'consumed' }, [COW.cubeSource]: { itemId: COW.cubeItemId, state: 'owned' } } });
  expect(startSubAreaRun({ subAreaId: COW.area, act: 1, mode: 'manual', runSeed: 7, questEncounter: COW.encounter })?.totalWaves).toBe(1);
  const binding = required(inspectRecordedWaves().currentPublished).binding;
  expect(binding.recording.outcome.winner).toBe('enemy');
  const originalHero = required(binding.recording.outcome.finalPlayerTeam.find(unit => unit.id === binding.heroId));
  expect(originalHero.life).toBeLessThanOrEqual(0);
  useCombatStore.getState().recordedEvents.forEach(() => { useCombatStore.getState().advanceEvent(); });
  expect(useCombatStore.getState().playbackComplete).toBe(true);
  const hero = required(usePlayerStore.getState().player), beforeXp = xpTotal(hero.level) + hero.experience;
  const inventory = structuredClone({ backpack: useInventoryStore.getState().backpack, currencies: useInventoryStore.getState().currencies });
  Object.assign(binding.recording.outcome, { winner: 'player' }); Object.assign(originalHero, { life: 1 });
  binding.recording.outcome.finalEnemyTeam.forEach(enemy => { Object.assign(enemy, { life: 0 }); });
  expect.soft(advanceWaveOrFinish()).toBe('defeat');
  const after = required(usePlayerStore.getState().player); expect.soft(xpTotal(after.level) + after.experience).toBe(beforeXp);
  expect.soft({ backpack: useInventoryStore.getState().backpack, currencies: useInventoryStore.getState().currencies }).toEqual(inventory);
  expect.soft(useMapStore.getState().questReceipts).not.toHaveProperty(COW.victoryProof);
});

function arrangeActualWin() {
  const fresh = createMockPlayer('Independent Cow victory', 'sorceress');
  usePlayerStore.getState().setPlayer({ ...fresh, level: 32, equipment: [], comboOrder: [], skillLevels: {} });
  const cap = { id: 'independent-cow-cap', baseId: 'items/base/helm-cap', rarity: 'rare' as const, level: 1, identified: true, equipped: false,
    affixes: [{ affixId: 'fixture-capability', values: new Map([['statMods.life', 1_000_000], ['statMods.defense', 1_000_000],
      ['statMods.attack', 1_000_000], ['statMods.attackSpeed', 200]]) }] };
  useInventoryStore.getState().addItem(cap); expect(useInventoryStore.getState().equipItem(cap)).toEqual({ ok: true });
  const staff = 'quests/act2-horadric-staff';
  useMapStore.setState({ currentAct: 1, currentSubAreaId: COW.area, selectedDifficulty: 'normal', clearedSubAreas: [], questProgress: {
    [COW.quest]: { id: COW.quest, status: 'completed', rewardClaimed: false, objectives: { [COW.legObjective]: true, [COW.portalObjective]: true } },
    [staff]: { id: staff, status: 'inProgress', rewardClaimed: false, objectives: { 'obj-cube': true, 'obj-shaft': false, 'obj-amulet': false, 'obj-transmute': false } } },
    questReceipts: { [COW.tomeSource]: true, [COW.openProof]: true } });
  useInventoryStore.setState({ questItems: { [COW.legSource]: { itemId: COW.legItemId, state: 'consumed' },
    [COW.tomeSource]: { itemId: COW.tomeItemId, state: 'consumed' }, [COW.cubeSource]: { itemId: COW.cubeItemId, state: 'owned' } } });
}
function startAndDrain() {
  expect(startSubAreaRun({ subAreaId: COW.area, act: 1, mode: 'manual', runSeed: 7, questEncounter: COW.encounter })?.totalWaves).toBe(1);
  const binding = required(inspectRecordedWaves().currentPublished).binding;
  expect(binding.recording.outcome.winner).toBe('player');
  const count = useCombatStore.getState().recordedEvents.length;
  for (let i = 0; i < count; i++) useCombatStore.getState().advanceEvent();
  expect(useCombatStore.getState().playbackComplete).toBe(true);
  return binding;
}
it('rejects native result tampering from the actual display callback before publication', () => {
  arrangeActualWin(); const beforeHero = structuredClone(required(usePlayerStore.getState().player));
  const beforeInventory = structuredClone({ backpack: useInventoryStore.getState().backpack, currencies: useInventoryStore.getState().currencies });
  const real = staging.stageRecordedWave; let changed = false;
  vi.spyOn(staging, 'stageRecordedWave').mockImplementationOnce(input => real({ ...input, resolveDisplayName: unit => {
    const name = input.resolveDisplayName(unit);
    if (!changed && unit.side === 'enemy') { changed = true; Reflect.set(unit, 'level', unit.level + 100); }
    return name;
  } }));
  startAndDrain(); expect(changed).toBe(true); expect(advanceWaveOrFinish()).toBe('defeat');
  expect(usePlayerStore.getState().player).toEqual(beforeHero);
  expect({ backpack: useInventoryStore.getState().backpack, currencies: useInventoryStore.getState().currencies }).toEqual(beforeInventory);
  expect(useMapStore.getState().questReceipts).not.toHaveProperty(COW.victoryProof);
});
it.each(['hero-xp', 'victory-proof'] as const)('compensates actual native income after result tampering during %s publication', boundary => {
  arrangeActualWin(); const binding = startAndDrain();
  const beforeHero = structuredClone(required(usePlayerStore.getState().player));
  const beforeInventory = structuredClone({ backpack: useInventoryStore.getState().backpack, currencies: useInventoryStore.getState().currencies,
    materials: useInventoryStore.getState().materials });
  let changed = false;
  const tamper = () => { if (changed) return; changed = true; const enemy = required(binding.recording.outcome.finalEnemyTeam[0]); Reflect.set(enemy, 'level', enemy.level + 100); };
  const stop = boundary === 'hero-xp' ? usePlayerStore.subscribe(tamper) : useMapStore.subscribe(state => { if (state.questReceipts[COW.victoryProof]) tamper(); });
  try {
    expect(() => advanceWaveOrFinish()).toThrow('Cow native outcome changed during settlement'); expect(changed).toBe(true);
    expect(usePlayerStore.getState().player).toEqual(beforeHero);
    expect({ backpack: useInventoryStore.getState().backpack, currencies: useInventoryStore.getState().currencies,
      materials: useInventoryStore.getState().materials }).toEqual(beforeInventory);
    expect(useMapStore.getState().questReceipts).not.toHaveProperty(COW.victoryProof);
    expect(inspectRecordedWaves().currentPublished?.installation?.settlement.progress.phase).toBe('settlementFailed');
  } finally { stop(); }
});
it('preserves actual untouched native Cow victory income and proof', () => {
  arrangeActualWin(); startAndDrain(); const before = required(usePlayerStore.getState().player);
  const xp = xpTotal(before.level) + before.experience;
  expect(advanceWaveOrFinish()).toBe('victory');
  const after = required(usePlayerStore.getState().player);
  expect(xpTotal(after.level) + after.experience - xp).toBe(390);
  expect(useInventoryStore.getState().currencies['rune-shard']).toBeGreaterThan(0);
  expect(useMapStore.getState().questReceipts[COW.victoryProof]).toBe(true);
});
