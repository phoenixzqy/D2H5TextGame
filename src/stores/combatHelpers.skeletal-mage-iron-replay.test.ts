/** Unearned integration fixture; real production waves/engine, no staging mocks. */
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { RecordedBattleEvent } from '@/engine/combat/combat';
import type { Item } from '@/engine/types/items';
import { deriveStats } from '@/engine/progression/stats';
import { loadDefaultSkills, registerSkill, resetRegistry } from '@/engine/skills/registry';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { abortSubAreaRun, startSubAreaRun, refreshActivePlayerCombatConfig } from './combatHelpers';
import { armIronGolemSelection, useIronGolemSelectionStore } from './ironGolemSelectionStore';
import { inspectRecordedWaves } from './recordedWaveReceipt';
import { useCombatStore } from './combatStore';
import { usePlayerStore } from './playerStore';
import { useInventoryStore } from './inventoryStore';
import { useMercStore } from './mercStore';
import { useMapStore } from './mapStore';
import { useMetaStore } from './metaStore';
import { useFormationStore } from './formationStore';
import { useHydrationStore } from './hydrationStore';
const IRON = 'necromancer.iron_golem', IRON_ALIAS = 'skills-necromancer-iron-golem';
const MAGE = 'necromancer.raise_skeletal_mage';
const WAIT = 'fixture.mage-wait', FINISH = 'fixture.mage-finisher';
function published() {
  const value = inspectRecordedWaves().currentPublished;
  if (!value) throw new Error('Missing real published wave');
  return value;
}
function drain() {
  const count = useCombatStore.getState().recordedEvents.length;
  for (let i = 0; i < count; i++) useCombatStore.getState().advanceEvent();
  expect(useCombatStore.getState().playbackComplete).toBe(true);
}
beforeEach(() => {
  abortSubAreaRun();
  for (const store of [useCombatStore, usePlayerStore, useInventoryStore, useMercStore,
    useMapStore, useMetaStore, useFormationStore]) store.getState().reset();
  resetRegistry(); loadDefaultSkills(); useHydrationStore.getState().setStatus('ready');
  vi.spyOn(Date, 'now').mockReturnValue(1792454400000);
  registerSkill({ id: WAIT, archetype: 'fixture', target: 'self', isBuff: false,
    cooldown: 4, manaCost: 0, minLevel: 1,
    effects: [{ kind: 'buff', id: 'fixture.mage-wait', duration: -1 }] });
  registerSkill({ id: FINISH, archetype: 'fixture', target: 'all-enemies', cooldown: 1,
    manaCost: 0, minLevel: 1,
    effects: [{ kind: 'damage', damageType: 'physical', base: [100000, 100000] }] });
  const coreStats = { strength: 15, dexterity: 25, vitality: 20, energy: 21 };
  usePlayerStore.getState().setPlayer({ ...createMockPlayer('Unearned Mage wave', 'necromancer'),
    id: 'mage-wave-hero', level: 30, coreStats, derivedStats: deriveStats(coreStats, 30),
    skillLevels: { [MAGE]: 6, 'necromancer.raise_skeleton': 1, 'necromancer.skeleton_mastery': 20, [IRON]: 6, 'necromancer.blood_golem': 1 },
    comboOrder: [MAGE, IRON_ALIAS, IRON, WAIT, FINISH] });
  const cap: Item = { id: 'fixture-mage-cap', baseId: 'items/base/helm-cap', rarity: 'rare',
    level: 1, identified: true, equipped: false,
    affixes: [{ affixId: 'fixture-mage-survival', values: new Map([
      ['statMods.life', 1000000], ['statMods.defense', 1000000], ['statMods.mana', 1000],
      ['statMods.attackSpeed', -63], ['statMods.attack', -79], ['statMods.critChance', -0.05]
    ]) }] };
  useInventoryStore.getState().addItem(cap);
  expect(useInventoryStore.getState().equipItem(cap)).toEqual({ ok: true });
  const equipped = usePlayerStore.getState().player;
  if (!equipped) throw new Error('Missing equipped hero');
  usePlayerStore.getState().setPlayer({ ...equipped, derivedStats: { ...equipped.derivedStats,
    life: equipped.derivedStats.lifeMax, mana: 100 } });
});
afterEach(() => {
  vi.restoreAllMocks(); abortSubAreaRun();
  for (const store of [useCombatStore, usePlayerStore, useInventoryStore, useMercStore,
    useMapStore, useMetaStore, useFormationStore]) store.getState().reset();
  useHydrationStore.getState().setStatus('idle'); resetRegistry(); loadDefaultSkills();
});


function durable() {
  const p = usePlayerStore.getState().player;
  const inv = useInventoryStore.getState();
  // Native combo edits are intentional; every other persistent Player field stays exact.
  return { player: p ? { ...p, comboOrder: [] } : null,
    backpack: inv.backpack, stash: inv.stash, equipped: inv.equipped, currencies: inv.currencies,
    rewards: useCombatStore.getState().runRewards, cleared: useMapStore.getState().clearedSubAreas,
    quests: useMapStore.getState().questProgress, gacha: useMetaStore.getState().gachaState };
}
it.each([100, 56])('retains the whole mixed Mage/Iron recording after an accepted%sMP attempt', mana => {
  const hero = usePlayerStore.getState().player;
  if (!hero) throw new Error('Missing imported hero');
  usePlayerStore.getState().setPlayer({ ...hero, derivedStats: { ...hero.derivedStats, mana } });
  for (const id of ['mixed-sacrifice', 'mixed-rearmed']) {
    useInventoryStore.getState().addItem({ id, baseId: 'items/base/wp1h-short-sword',
      rarity: 'normal', level: 1, identified: true, equipped: false });
  }
  const inventory = useInventoryStore.getState(), paid = mana === 100;
  expect(armIronGolemSelection(hero.id, 'mixed-sacrifice', true)).not.toBeNull();
  expect(startSubAreaRun({ act: 1, subAreaId: 'areas/act1-blood-moor', mode: 'manual',
    runSeed: 7, challengeOrdinal: 0 })?.totalWaves).toBeGreaterThan(1);
  const original = published(), b = original.binding;
  const payout = original.installation?.settlement.identity;
  expect(payout).toBeDefined();
  expect(original.phase).toBe('published'); expect(inspectRecordedWaves().pending).toBeNull();
  expect(original.installation?.settlement.progress.phase).toBe('unsettled');
  expect(b.engineInput.playerTeam).toHaveLength(1); // No carried or preloaded summons.
  expect(b.engineInput.playerTeam[0]).toMatchObject({ id: hero.id, mana,
    manaRegenExactCarry: '0', cooldowns: {}, statuses: [] });
  // A poor attempt must prove actual affordability refusal, not an invalid item.
  expect(b.engineInput.ironGolem).toEqual({ sourceHeroId: hero.id, sourceItemId: 'mixed-sacrifice',
    life: 0, attack: 8, defense: 0 });
  expect(Object.isFrozen(b.engineInput)).toBe(true);
  expect(Object.isFrozen(b.engineInput.ironGolem)).toBe(true);
  expect(b.publication.ironGolemReplayLocked).toBe(true);
  expect(useCombatStore.getState().ironGolemReplayLocked).toBe(true);
  expect(useIronGolemSelectionStore.getState().selection).toBeNull();
  const casts = b.recording.events.filter(e => e.kind === 'mana' && e.reason === 'cast');
  const castMana = paid ? [78, 43] : [34];
  expect(casts).toHaveLength(castMana.length);
  casts.forEach((event, index) => {
    expect(event).toMatchObject({ target: hero.id, mana: castMana[index], simClockMs: 0 });
  });
  const summons = b.recording.events.filter((e): e is Extract<RecordedBattleEvent, { kind: 'summon' }> =>
    e.kind === 'summon');
  const mages = summons.filter(e => e.summonId === 'skeletal_mage');
  const irons = summons.filter(e => e.summonId === 'iron_golem');
  expect(mages).toHaveLength(4); expect(new Set(mages.map(e => e.unit.id)).size).toBe(4);
  expect(irons).toHaveLength(paid ? 1 : 0); expect(summons).toHaveLength(paid ? 5 : 4);
  expect(b.recording.events.filter(e => e.kind === 'action' && e.skillId === MAGE)).toHaveLength(1);
  expect(b.recording.events.filter(e => e.kind === 'action' && e.skillId === IRON)).toHaveLength(paid ? 1 : 0);
  const finisher = b.recording.events.find(e => e.kind === 'action' && e.skillId === FINISH);
  expect(finisher?.simClockMs).toBe(4000);
  mages.forEach((event, index) => {
    expect(event).toMatchObject({ owner: hero.id, simClockMs: 0 });
    expect(event.unit).toMatchObject({ side: 'player', kind: 'summon', summon: true,
      summonOwnerId: hero.id, summonTemplateId: 'skeletal_mage', life: 221.4,
      stats: { lifeMax: 221.4, attack: 62.99999999999999, defense: 12 } });
    const first = b.recording.events.find(e => e.kind === 'damage' && e.source === event.unit.id);
    expect(first).toMatchObject({ kind: 'damage', damageType: ['fire', 'cold', 'lightning', 'poison'][index],
      amount: [50, 61, 61, 50][index], crit: false, dodged: false, simClockMs: 1940 });
    if (first?.kind !== 'damage' || !finisher) throw new Error('Missing actual mixed Mage hit');
    expect(first.simClockMs).toBeLessThan(finisher.simClockMs);
    const target = b.engineInput.enemyTeam.find(u => u.id === first.target);
    expect(target?.life).toBeGreaterThan(0);
    expect(first.amount).toBeGreaterThanOrEqual(target?.life ?? Infinity);
    expect(b.recording.events).toContainEqual(expect.objectContaining({
      kind: 'death', target: first.target, simClockMs: 1940 }));
    expect(b.recording.outcome.finalEnemyTeam.find(u => u.id === first.target)?.life).toBe(0);
  });
  if (paid) {
    expect(irons[0]).toMatchObject({ owner: hero.id, simClockMs: 0,
      unit: { stats: { lifeMax: 340, attack: 54, defense: 63 } } });
    expect(b.attestation).toMatchObject({ sourceHeroId: hero.id, sourceItemId: 'mixed-sacrifice',
      skillId: IRON, spawnedUnitId: irons[0]?.unit.id, paidMp: 35 });
    expect(b.debitIntent?.item).toBe(inventory.backpack.find(item => item.id === 'mixed-sacrifice'));
    expect(useInventoryStore.getState().backpack).toBe(b.debitIntent?.expectedBackpack);
    expect(useInventoryStore.getState().backpack).toEqual(inventory.backpack.filter(item => item.id !== 'mixed-sacrifice'));
  } else {
    expect(b.attestation).toBeNull(); expect(b.debitIntent).toBeNull();
    expect(useInventoryStore.getState()).toBe(inventory);
    // Recovery later makes35MP affordable, but startup refusal never retries.
    expect(b.recording.events.some(e => e.kind === 'mana' && e.reason === 'regeneration' && e.mana >= 35)).toBe(true);
  }
  expect(b.recording.events.at(-1)).toMatchObject({ kind: 'end', winner: 'player', simClockMs: paid ? 4000 : 5820 });
  expect(b.recording.outcome.finalPlayerTeam.find(u => u.id === hero.id)?.mana).toBe(paid ? 177 : 176);
  expect(usePlayerStore.getState().player?.derivedStats.mana).toBe(mana); // No battle-output persistence.
  const before = structuredClone({ input: b.engineInput, recording: b.recording });
  const persistent = structuredClone(durable()), postInventory = useInventoryStore.getState();
  useCombatStore.getState().advanceEvent();
  expect(useCombatStore.getState().eventCursor).toBeGreaterThan(0);
  usePlayerStore.getState().setComboOrder([FINISH, WAIT]);
  expect(usePlayerStore.getState().player?.comboOrder).toEqual([FINISH, WAIT]);
  const rearmed = armIronGolemSelection(hero.id, 'mixed-rearmed', true);
  expect(rearmed).not.toBeNull();
  const cursor = useCombatStore.getState().eventCursor;
  refreshActivePlayerCombatConfig();
  expect(published().receipt).toBe(original.receipt); expect(useCombatStore.getState().eventCursor).toBe(cursor);
  let previous = original.receipt;
  for (let repeat = 0; repeat < 2; repeat++) {
    if (repeat) vi.mocked(Date.now).mockReturnValue(1792454400000 + 7200000);
    refreshActivePlayerCombatConfig({ replayCurrentWave: true });
    const current = published();
    expect(current.receipt).not.toBe(previous); previous = current.receipt;
    expect(current.installation?.settlement.identity).toBe(payout);
    expect(current.installation?.settlement.progress.phase).toBe('unsettled');
    expect(current.binding.engineInput).toBe(b.engineInput);
    expect(current.binding.recording).toBe(b.recording);
    expect(current.binding.publication).toBe(b.publication);
    expect(current.binding.attestation).toBeNull(); expect(current.binding.debitIntent).toBeNull();
    expect(inspectRecordedWaves().pending).toBeNull();
    expect(useCombatStore.getState().ironGolemReplayLocked).toBe(true);
    expect(useCombatStore.getState().eventCursor).toBe(0);
    expect(useCombatStore.getState().playbackComplete).toBe(false);
    expect(useCombatStore.getState().playerTeam[0]?.mana).toBe(mana);
    expect(useInventoryStore.getState()).toBe(postInventory);
    expect(useIronGolemSelectionStore.getState().selection).toBe(rearmed);
    expect(durable()).toEqual(persistent);
    drain();
    expect(useCombatStore.getState().playerTeam).toEqual(b.recording.outcome.finalPlayerTeam);
    expect(useCombatStore.getState().enemyTeam).toEqual(b.recording.outcome.finalEnemyTeam);
    expect(useCombatStore.getState().playerTeam.find(u => u.id === hero.id)?.mana).toBe(paid ? 177 : 176);
    expect(published().installation?.settlement.progress.phase).toBe('unsettled');
    expect(useInventoryStore.getState()).toBe(postInventory);
    expect(useIronGolemSelectionStore.getState().selection).toBe(rearmed);
    expect(durable()).toEqual(persistent);
    expect({ input: b.engineInput, recording: b.recording }).toEqual(before);
  }
});
