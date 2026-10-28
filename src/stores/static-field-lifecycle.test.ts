import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { campaignEvidence } from '../../tests/helpers/endgame';
import { selectReplayProfile } from '@/features/map/replayProfile';
import { loadDefaultSkills, registerSkill, resetRegistry } from '@/engine/skills/registry';
import type { Player } from '@/engine/types/entities';
import type { Item } from '@/engine/types/items';
import { abortSubAreaRun, advanceWaveOrFinish, refreshActivePlayerCombatConfig,
  startSubAreaRun } from './combatHelpers';
import { usePlayerStore } from './playerStore';
import { useCombatStore } from './combatStore';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useMercStore } from './mercStore';
import { useFormationStore } from './formationStore';
import { useMetaStore } from './metaStore';
import { useHydrationStore } from './hydrationStore';
import { snapshotStores } from './persistence';
import { inspectRecordedWaves } from './recordedWaveReceipt';

const MASTERY = 'sorceress.static_field';
const FINISHER = 'fixture.static-field-finisher';
const stores = [usePlayerStore, useCombatStore, useInventoryStore, useMapStore,
  useMercStore, useFormationStore, useMetaStore] as const;
function player(): Player {
  const p = usePlayerStore.getState().player;
  if (!p) throw new Error('Missing native Static Field test hero'); return p;
}
function arrange(rank = 0, difficulty: 'normal' | 'hell' = 'normal') {
  const fresh = createMockPlayer('StaticBoundary', 'sorceress');
  usePlayerStore.getState().setPlayer({ ...fresh, level: 30, skillPoints: 2,
    skillLevels: rank ? { [MASTERY]: rank } : {},
    comboOrder: difficulty === 'hell' ? [MASTERY, FINISHER] : [FINISHER] });
  // Declared native integration scaffolding, not legal earned gear or balance proof.
  const cap: Item = { id: 'fixture-cold-cap', baseId: 'items/base/helm-cap',
    socketCapacity: 0, rarity: 'rare', level: 1, identified: true, equipped: false,
    affixes: [{ affixId: 'fixture', values: new Map([['statMods.life', 999880], ['statMods.defense', 99973]]) }] };
  useInventoryStore.getState().addItem(cap);
  expect(useInventoryStore.getState().equipItem(cap)).toEqual({ ok: true });
  usePlayerStore.setState({ player: { ...player(),
    derivedStats: { ...player().derivedStats, life: 1000000, mana: 50 } } });
  useMapStore.getState().setCurrentLocation(1, 'areas/act1-blood-moor');
  if (difficulty === 'hell') {
    const proof = campaignEvidence();
    useMapStore.setState({ questProgress: proof.questProgress, questReceipts: proof.questReceipts,
      clearedSubAreas: ['areas/act1-catacombs', 'areas/act2-tomb-of-tal-rasha',
        'areas/act3-durance-of-hate', 'areas/act4-chaos-sanctuary'] });
    useInventoryStore.setState({ questItems: proof.questItems });
    expect(selectReplayProfile('hell')).toBe('ok');
  }
  registerSkill({ id: FINISHER, archetype: 'fixture', target: 'all-enemies',
    minLevel: 1, cooldown: 1, manaCost: 8,
    effects: [{ kind: 'damage', damageType: 'physical', base: [100000, 100000] }] });
  expect(startSubAreaRun({ runSeed: 7, challengeOrdinal: 0 })?.totalWaves).toBeGreaterThan(2);
  expect(useCombatStore.getState().outcome?.winner).toBe('player');
}
function currentHero() {
  const hero = useCombatStore.getState().playerTeam[0];
  if (!hero) throw new Error('Missing native hero'); return hero;
}
function finalHero() {
  const hero = useCombatStore.getState().outcome?.finalPlayerTeam[0];
  if (!hero) throw new Error('Missing native result'); return hero;
}
function drain() {
  const count = useCombatStore.getState().recordedEvents.length;
  for (let i = 0; i < count; i++) useCombatStore.getState().advanceEvent();
  expect(useCombatStore.getState().playbackComplete).toBe(true);
}
const pools = (hero: ReturnType<typeof currentHero>) => [hero.life, hero.mana,
  hero.manaRegenCarry, hero.manaRegenCompensation, hero.manaRegenExactCarry];
function recording() {
  const s = useCombatStore.getState();
  return structuredClone({ team: s.playerTeam, events: s.recordedEvents, outcome: s.outcome,
    rewards: s.runRewards, cursor: s.eventCursor, complete: s.playbackComplete, paused: s.isPaused });
}
beforeEach(() => {
  vi.spyOn(Date, 'now').mockReturnValue(1792454400000);
  abortSubAreaRun(); for (const store of stores) store.getState().reset();
  resetRegistry(); loadDefaultSkills(); useHydrationStore.getState().setStatus('ready');
});
afterEach(() => {
  abortSubAreaRun(); for (const store of stores) store.getState().reset();
  resetRegistry(); loadDefaultSkills(); useHydrationStore.getState().setStatus('idle');
  vi.restoreAllMocks();
});
describe('native Static Field wave and replay boundaries', () => {
  it('casts learned Static Field in captured Hell through replay and the next wave after a map preference change', () => {
    arrange(1, 'hell');
    const captured = () => inspectRecordedWaves().currentPublished?.binding;
    const assertHellCast = () => {
      const binding = captured();
      if (!binding) throw new Error('Missing native Hell Static Field binding');
      expect(binding.engineInput.difficulty).toBe('hell');
      expect(binding.replayProfileId).toBe('hell');
      expect(binding.recording.events).toContainEqual(expect.objectContaining({ kind: 'action', skillId: MASTERY }));
      expect(binding.recording.events).toContainEqual(expect.objectContaining({ kind: 'damage', damageType: 'lightning' }));
      expect(currentHero().staticFieldRank).toBe(1);
      return binding;
    };
    const initial = assertHellCast(), before = recording();
    useMapStore.setState({ selectedDifficulty: 'normal' });
    refreshActivePlayerCombatConfig();
    expect(recording()).toEqual(before);
    expect(captured()).toBe(initial);
    refreshActivePlayerCombatConfig({ replayCurrentWave: true });
    assertHellCast();
    expect(recording()).toEqual(before);
    drain();
    expect(advanceWaveOrFinish()).toBe('next-wave');
    assertHellCast();
    expect(useMapStore.getState().selectedDifficulty).toBe('normal');
  });

  it('keeps Normal run origin through selected-difficulty changes, replay and the next wave', () => {
    arrange(1);
    const captured = () => inspectRecordedWaves().currentPublished?.binding.engineInput.difficulty ?? 'normal';
    expect(captured()).toBe('normal');
    const before = recording();
    useMapStore.setState({ selectedDifficulty: 'nightmare' });
    refreshActivePlayerCombatConfig(); expect(recording()).toEqual(before);
    refreshActivePlayerCombatConfig({ replayCurrentWave: true });
    expect(captured()).toBe('normal');
    expect(recording()).toEqual(before);
    drain(); expect(advanceWaveOrFinish()).toBe('next-wave');
    expect(captured()).toBe('normal');
    expect(currentHero().staticFieldRank).toBe(1);
  });
  it('allocates through the real store; current recording freezes and next waves get rank1/2', () => {
    arrange(); expect(currentHero().staticFieldRank).toBe(0);
    for (const [id, reduction] of [['skills-sorceress-static-field', 1], [MASTERY, 2]] as const) {
      const before = recording(); const final = structuredClone(finalHero());
      expect(usePlayerStore.getState().allocateSkillPoint(id)).toBe('ok');
      expect(recording()).toEqual(before);
      drain(); expect(advanceWaveOrFinish()).toBe('next-wave');
      expect(currentHero().staticFieldRank).toBe(reduction);
      expect(pools(currentHero())).toEqual(pools(final));
    }
    expect(player().skillPoints).toBe(0);
    expect(player().skillLevels?.[MASTERY]).toBe(2);
  });
  it('clears removed allocations at the next wave without resource refill', () => {
    arrange(20); expect(currentHero().staticFieldRank).toBe(20);
    const before = recording(); const final = structuredClone(finalHero());
    usePlayerStore.setState({ player: { ...player(), skillLevels: {} } });
    expect(recording()).toEqual(before);
    drain(); expect(advanceWaveOrFinish()).toBe('next-wave');
    expect(currentHero().staticFieldRank).toBe(0);
    expect(pools(currentHero())).toEqual(pools(final));
  });
  it('replays original resource/carry baselines with no accumulation or persisted projection', () => {
    arrange(20); drain(); expect(advanceWaveOrFinish()).toBe('next-wave');
    const before = recording(); const baseline = pools(currentHero());
    const save = snapshotStores(); if (!save) throw new Error('Missing native save');
    expect(save.player).not.toHaveProperty('staticFieldRank');
    for (let repeat = 0; repeat < 2; repeat++) {
      usePlayerStore.setState({ player: { ...player(), skillLevels: {} } });
      refreshActivePlayerCombatConfig(); expect(recording()).toEqual(before);
      refreshActivePlayerCombatConfig({ replayCurrentWave: true });
      expect(currentHero().staticFieldRank).toBe(0);
      expect(pools(currentHero())).toEqual(baseline); drain();
      usePlayerStore.setState({ player: { ...player(), skillLevels: { [MASTERY]: 20 } } });
      refreshActivePlayerCombatConfig({ replayCurrentWave: true });
      expect(recording()).toEqual(before); expect(pools(currentHero())).toEqual(baseline);
    }
    expect(snapshotStores()).toEqual(save);
  });
});
