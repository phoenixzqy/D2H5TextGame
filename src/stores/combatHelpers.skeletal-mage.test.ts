import { mockSyntheticEntryPools } from '@/test/fixtures/synthetic-entry-pools';
/** Unearned integration fixture; frozen encounters, real engine/settlement/playback. */
import * as wavePlanning from '@/engine/combat/sub-area-run';
import { preBoundedActOnePlanFixture } from '@/test/fixtures/pre-bounded-act1-plan';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { runBattle, type RecordedBattleEvent } from '@/engine/combat/combat';
import type { Item } from '@/engine/types/items';
import { deriveStats } from '@/engine/progression/stats';
import { loadDefaultSkills, registerSkill, resetRegistry } from '@/engine/skills/registry';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { abortSubAreaRun, startSubAreaRun, advanceWaveOrFinish,
  refreshActivePlayerCombatConfig } from './combatHelpers';
import { inspectRecordedWaves, type RecordedWaveBinding } from './recordedWaveReceipt';
import { useCombatStore } from './combatStore';
import { usePlayerStore } from './playerStore';
import { useInventoryStore } from './inventoryStore';
import { useMercStore } from './mercStore';
import { useMapStore } from './mapStore';
import { useMetaStore } from './metaStore';
import { useFormationStore } from './formationStore';
import { useHydrationStore } from './hydrationStore';
const AREA = 'areas/act1-blood-moor';
const HERO = 'mage-wave-hero';
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
  mockSyntheticEntryPools();
  vi.spyOn(wavePlanning, 'resolveChallengeWavePlan').mockImplementation(preBoundedActOnePlanFixture);
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
    id: HERO, level: 30, coreStats, derivedStats: deriveStats(coreStats, 30),
    skillLevels: { [MAGE]: 6, 'necromancer.raise_skeleton': 1, 'necromancer.skeleton_mastery': 20 },
    comboOrder: [MAGE, WAIT, FINISH] });
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

function start() {
  const run = startSubAreaRun({ act: 1, subAreaId: AREA, mode: 'manual', runSeed: 7, challengeOrdinal: 0 });
  expect(run?.totalWaves).toBeGreaterThan(1);
  return published();
}
function mageSummons(binding: RecordedWaveBinding) {
  return binding.recording.events.filter((e): e is Extract<RecordedBattleEvent, { kind: 'summon' }> =>
    e.kind === 'summon');
}
function assertDeepFrozen(value: unknown): void {
  if (!value || typeof value !== 'object') return;
  expect(Object.isFrozen(value)).toBe(true);
  for (const child of Object.values(value)) assertDeepFrozen(child);
}
function durable() {
  const player = usePlayerStore.getState().player;
  const inventory = useInventoryStore.getState();
  return { level: player?.level, experience: player?.experience,
    backpack: inventory.backpack, stash: inventory.stash, equipped: inventory.equipped,
    currencies: inventory.currencies, rewards: useCombatStore.getState().runRewards,
    cleared: useMapStore.getState().clearedSubAreas, quests: useMapStore.getState().questProgress,
    gacha: useMetaStore.getState().gachaState };
}
function assertFreshBatch(binding: RecordedWaveBinding, initialMana: number) {
  const input = binding.engineInput.playerTeam;
  expect(input).toHaveLength(1);
  expect(input[0]?.id).toBe(HERO);
  expect(input.some(u => u.kind === 'summon' || u.summon)).toBe(false);
  const summons = mageSummons(binding);
  expect(summons).toHaveLength(4);
  expect(new Set(summons.map(e => e.unit.id)).size).toBe(4);
  const positions = [{ row: 2, col: 0 }, { row: 2, col: 1 },
    { row: 2, col: 2 }, { row: 0, col: 1 }];
  const elements = ['fire', 'cold', 'lightning', 'poison'];
  summons.forEach((event, index) => {
    expect(event).toMatchObject({ owner: HERO, summonId: 'skeletal_mage', simClockMs: 0 });
    expect(event.unit).toMatchObject({ side: 'player', kind: 'summon', summon: true,
      summonOwnerId: HERO, summonTemplateId: 'skeletal_mage',
      life: 221.4, mana: 0, statuses: [], cooldowns: {}, activeBuffIds: [],
      gridPosition: positions[index] });
    // D06 rank6/Mastery20: retain IEEE754 Attack and the existing single floor62.
    expect(event.unit.stats).toMatchObject({ lifeMax: 221.4, attack: 62.99999999999999,
      defense: 12, attackSpeed: 70, magicDodge: 0.09 });
    expect(Math.floor(event.unit.stats.attack)).toBe(62);
    const hits = binding.recording.events.filter((e): e is Extract<RecordedBattleEvent, { kind: 'damage' }> =>
      e.kind === 'damage' && e.source === event.unit.id);
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.every(e => e.damageType === elements[index])).toBe(true);
    expect(hits[0]?.simClockMs).toBe(1940);
    expect(binding.recording.events.filter(e => e.kind === 'action' && e.actor === event.unit.id)
      .every(e => e.kind === 'action' && e.skillId === null)).toBe(true);
  });
  expect(binding.recording.events.filter(e => e.kind === 'mana' && e.reason === 'cast'))
    .toEqual([expect.objectContaining({ target: HERO, mana: initialMana - 22, simClockMs: 0 })]);
  expect(binding.recording.events.filter(e => e.kind === 'action' && e.skillId === MAGE))
    .toEqual([expect.objectContaining({ actor: HERO, skillId: MAGE, simClockMs: 0 })]);
  expect(binding.recording.events.filter(e => e.kind === 'mana' && e.reason === 'summon-refund')).toEqual([]);
  expect(binding.debitIntent).toBeNull(); expect(binding.attestation).toBeNull();
  expect(binding.engineInput.ironGolem).toBeUndefined();
  expect(binding.publication.ironGolemReplayLocked).toBe(false);
  return summons;
}

it('publishes four fresh corpse-free elemental Mages and records actual lethal bolts of every element', () => {
  const player = usePlayerStore.getState().player;
  const inventory = useInventoryStore.getState();
  const formation = useFormationStore.getState();
  const sourceBefore = structuredClone({ player, playerPosition: formation.playerPosition,
    summonPositions: formation.summonPositions });
  const before = structuredClone(durable());
  const current = start(), { binding } = current;
  const frozenBefore = structuredClone({ input: binding.engineInput, recording: binding.recording });
  expect(inspectRecordedWaves().pending).toBeNull(); expect(current.phase).toBe('published');
  expect(current.installation?.metadataInstalled).toBe(true);
  expect(current.installation?.settlement.progress.phase).toBe('unsettled');
  expect(binding.heroId).toBe(HERO); expect(binding.targetWaveIdx).toBe(0);
  expect(useCombatStore.getState().currentWave).toBe(1);
  expect(useCombatStore.getState().recordedEvents).toBe(binding.recording.events);
  expect(binding.engineInput.enemyTeam).toHaveLength(8);
  expect(binding.engineInput.playerTeam[0]).toMatchObject({ mana: 100, manaRegenPerSecond: 4.2,
    manaRegenExactCarry: '0', stats: { attackSpeed: 62, attack: 1, manaMax: 1197 } });
  assertDeepFrozen(binding.engineInput);
  const summons = assertFreshBatch(binding, 100);
  const finisher = binding.recording.events.find(e => e.kind === 'action' && e.skillId === FINISH);
  expect(finisher?.simClockMs).toBe(4000);
  // Signature attempts consume shared RNG, including after lethal hits. Seed7's
  // Fire/Lightning first attempts now miss; retain exact successful-hit/kill proof.
  summons.forEach((summon, index) => {
    const first = binding.recording.events.find(e => e.kind === 'damage' && e.source === summon.unit.id);
    expect(first).toMatchObject({ simClockMs: 1940, amount: [0, 61, 0, 50][index],
      dodged: index === 0 || index === 2, crit: false });
    const lethal = binding.recording.events.find(e => e.kind === 'damage' && e.source === summon.unit.id && !e.dodged);
    const at = [5820, 1940, 3880, 1940][index];
    expect(lethal).toMatchObject({ kind: 'damage', source: summon.unit.id, simClockMs: at,
      damageType: ['fire', 'cold', 'lightning', 'poison'][index], amount: [50, 61, 61, 50][index],
      crit: false, dodged: false });
    if (lethal?.kind !== 'damage' || !finisher) throw new Error('Missing literal Mage hit/finisher');
    const target = binding.engineInput.enemyTeam.find(u => u.id === lethal.target);
    expect(target?.life).toBeGreaterThan(0);
    expect(lethal.amount).toBeGreaterThanOrEqual(target?.life ?? Infinity);
    expect(binding.recording.events).toContainEqual(expect.objectContaining({
      kind: 'death', target: lethal.target, simClockMs: at }));
    expect(binding.recording.outcome.finalEnemyTeam.find(u => u.id === lethal.target)?.life).toBe(0);
  });
  expect(binding.recording.events.at(-1)).toMatchObject({ kind: 'end', winner: 'player', simClockMs: 5820 });
  // Supplemental real pure/recorded equality, without mocking either engine path.
  const plain = runBattle(binding.engineInput);
  expect({ winner: plain.winner, finalPlayerTeam: plain.playerTeam, finalEnemyTeam: plain.enemyTeam })
    .toEqual(binding.recording.outcome);
  expect({ input: binding.engineInput, recording: binding.recording }).toEqual(frozenBefore);
  expect(usePlayerStore.getState().player).toBe(player);
  expect({ player, playerPosition: formation.playerPosition, summonPositions: formation.summonPositions })
    .toEqual(sourceBefore);
  expect(Object.isFrozen(player)).toBe(false);
  expect(useFormationStore.getState()).toBe(formation);
  expect(useInventoryStore.getState()).toBe(inventory);
  expect(durable()).toEqual(before);
});

it('settles once then carries real resources and creates a newly paid cycle from fire next wave', () => {
  const first = start(), original = structuredClone({ input: first.binding.engineInput, recording: first.binding.recording });
  const unpaid = structuredClone(durable());
  expect(advanceWaveOrFinish()).toBe('idle');
  expect(published().receipt).toBe(first.receipt); expect(durable()).toEqual(unpaid);
  const finalHero = first.binding.recording.outcome.finalPlayerTeam.find(u => u.id === HERO);
  if (!finalHero) throw new Error('Missing real terminal hero');
  // BUG235 publishes the actual remaining cooldown at the terminal boundary,
  // rather than retaining the actor's earlier pre-action cache.
  expect(first.binding.recording.events.find(e => e.kind === 'action' && e.skillId === WAIT))
    .toMatchObject({ simClockMs: 2000 });
  expect(first.binding.recording.events.at(-1)).toMatchObject({ simClockMs: 5820 });
  expect(finalHero).toMatchObject({ life: 1000372, mana: 161, manaRegenCarry: 0.444,
    manaRegenCompensation: 0, manaRegenExactCarry: '0.444', statuses: [],
    cooldowns: { [WAIT]: 2000 + 4000 - 5820 }, activeBuffIds: [WAIT] });
  drain(); expect(durable()).toEqual(unpaid);
  expect(advanceWaveOrFinish()).toBe('next-wave');
  const second = published(), { binding } = second;
  expect(second.receipt).not.toBe(first.receipt);
  expect(second.installation?.settlement.identity).not.toBe(first.installation?.settlement.identity);
  expect(second.installation?.settlement.progress.phase).toBe('unsettled');
  expect(binding.targetWaveIdx).toBe(1); expect(useCombatStore.getState().currentWave).toBe(2);
  expect(binding.engineInput.enemyTeam).toHaveLength(9);
  const hero = binding.engineInput.playerTeam[0];
  expect(hero?.life).toBe(Math.min(finalHero.life, hero?.stats.lifeMax ?? 0));
  expect(hero?.mana).toBe(finalHero.mana);
  expect(hero?.manaRegenCarry).toBe(0.444); expect(hero?.manaRegenCompensation).toBe(0);
  expect(hero?.manaRegenExactCarry).toBe('0.444');
  expect(hero?.statuses).toEqual(finalHero.statuses); expect(hero?.cooldowns).toEqual(finalHero.cooldowns);
  expect(hero?.activeBuffIds).toEqual(finalHero.activeBuffIds);
  assertDeepFrozen(binding.engineInput);
  const fresh = assertFreshBatch(binding, 161);
  fresh.forEach((summon, index) => {
    expect(summon.unit).not.toBe(mageSummons(first.binding)[index]?.unit);
  }); // Local IDs may repeat; fresh event/unit identity and zero-preload input prove creation.
  const cold = fresh[1];
  const earlyCold = binding.recording.events.filter(e => e.kind === 'damage' && e.source === cold?.unit.id && e.simClockMs < 4000);
  expect(earlyCold).toHaveLength(2);
  expect(earlyCold).toEqual([
    expect.objectContaining({ dodged: true, amount: 0, damageType: 'cold', simClockMs: 1940 }),
    expect.objectContaining({ dodged: false, amount: 58, damageType: 'cold', simClockMs: 3880 })
  ]);
  expect(binding.recording.outcome.finalPlayerTeam.find(u => u.id === HERO))
    .toMatchObject({ mana: 694, manaRegenCarry: 0.888, manaRegenExactCarry: '0.888' });
  const paid = structuredClone(durable());
  expect(paid.experience).toBeGreaterThan(unpaid.experience ?? Infinity);
  expect(paid.rewards).not.toEqual(unpaid.rewards);
  expect(advanceWaveOrFinish()).toBe('idle');
  expect(published().receipt).toBe(second.receipt); expect(durable()).toEqual(paid);
  expect({ input: first.binding.engineInput, recording: first.binding.recording }).toEqual(original);
});

it('uses native current combo slots for A/A and A/B/A replay from original resources without awards', () => {
  const first = start(), baseline = structuredClone({ input: first.binding.engineInput, recording: first.binding.recording });
  const payout = first.installation?.settlement.identity;
  const before = structuredClone(durable());
  let previous = first.receipt;
  function replay(expected: 'A' | 'B') {
    refreshActivePlayerCombatConfig({ replayCurrentWave: true });
    const current = published();
    expect(current.receipt).not.toBe(previous); previous = current.receipt;
    expect(current.installation?.settlement.identity).toBe(payout);
    expect(current.installation?.settlement.progress.phase).toBe('unsettled');
    expect(inspectRecordedWaves().pending).toBeNull();
    expect(useCombatStore.getState().eventCursor).toBe(0);
    expect(useCombatStore.getState().playbackComplete).toBe(false);
    expect(current.binding.engineInput.playerTeam[0]).toMatchObject({ mana: 100,
      manaRegenCarry: 0, manaRegenExactCarry: '0', cooldowns: {}, statuses: [] });
    expect(current.binding.publication.ironGolemReplayLocked).toBe(false);
    expect(current.binding.debitIntent).toBeNull(); expect(current.binding.attestation).toBeNull();
    if (expected === 'A') {
      expect(current.binding.engineInput).toEqual(baseline.input);
      expect(current.binding.recording).toEqual(baseline.recording);
      expect(current.binding.recording).not.toBe(first.binding.recording); // Real unlocked resimulation.
      assertFreshBatch(current.binding, 100);
    } else {
      expect(current.binding.engineInput.playerTeam[0]?.skillOrder).toEqual([WAIT, FINISH]);
      expect(mageSummons(current.binding)).toEqual([]);
      expect(current.binding.recording.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toEqual([]);
      expect(current.binding.recording).not.toEqual(baseline.recording);
    }
    expect(durable()).toEqual(before);
    expect({ input: first.binding.engineInput, recording: first.binding.recording }).toEqual(baseline);
    return current;
  }
  // Ordinary refresh is a no-op even after a native combo edit.
  useCombatStore.getState().advanceEvent();
  const cursor = useCombatStore.getState().eventCursor;
  refreshActivePlayerCombatConfig();
  expect(published().receipt).toBe(first.receipt); expect(useCombatStore.getState().eventCursor).toBe(cursor);
  replay('A'); replay('A');
  for (const completed of [false, true]) {
    if (completed) drain();
    vi.mocked(Date.now).mockReturnValue(1792454400000 + (completed ? 7200000 : 3600000));
    usePlayerStore.getState().setComboOrder([WAIT, FINISH]);
    const old = published(); refreshActivePlayerCombatConfig();
    expect(published().receipt).toBe(old.receipt); expect(published().binding).toBe(old.binding);
    const alternate = replay('B');
    const alternateInput = { ...baseline.input, playerTeam: baseline.input.playerTeam.map(u =>
      ({ ...u, skillOrder: [WAIT, FINISH] })) };
    expect(alternate.binding.engineInput).toEqual(alternateInput);
    if (completed) drain();
    usePlayerStore.getState().setComboOrder([MAGE, WAIT, FINISH]);
    replay('A');
  }
  expect(usePlayerStore.getState().player?.comboOrder).toEqual([MAGE, WAIT, FINISH]);
});
