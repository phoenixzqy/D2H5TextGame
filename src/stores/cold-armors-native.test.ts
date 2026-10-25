import { beforeEach, afterEach, expect, it } from 'vitest';
import { mockSyntheticEntryPools } from '@/test/fixtures/synthetic-entry-pools';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { loadDefaultSkills, registerSkill, resetRegistry } from '@/engine/skills/registry';
import { useCombatStore } from './combatStore';
import { usePlayerStore } from './playerStore';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useMercStore } from './mercStore';
import { useFormationStore } from './formationStore';
import { useMetaStore } from './metaStore';
import { useHydrationStore } from './hydrationStore';
import { abortSubAreaRun, advanceWaveOrFinish, startSubAreaRun, resetIdleElitePity } from './combatHelpers';

const stores = [useCombatStore, usePlayerStore, useInventoryStore, useMapStore,
  useMercStore, useFormationStore, useMetaStore] as const;
function reset() {
  abortSubAreaRun(); resetIdleElitePity();
  for (const store of stores) store.getState().reset();
  resetRegistry(); loadDefaultSkills();
}
function player() {
  const value = usePlayerStore.getState().player;
  if (!value) throw new Error('Missing native armor fixture player');
  return value;
}
function drain() {
  const count = useCombatStore.getState().recordedEvents.length;
  for (let i = 0; i < count; i++) useCombatStore.getState().advanceEvent();
  expect(useCombatStore.getState().playbackComplete).toBe(true);
}
function arrange(slug: 'shiver-armor' | 'chilling-armor') {
  registerSkill({ id: 'fixture.armor-finisher', archetype: 'fixture', target: 'all-enemies',
    minLevel: 1, manaCost: 0, cooldown: 1,
    effects: [{ kind: 'damage', damageType: 'cold', base: [100_000, 100_000] }] });
  usePlayerStore.getState().setPlayer({ ...createMockPlayer('Synthetic native armor', 'sorceress'),
    level: 30, coreStats: { strength: 20, dexterity: 25, vitality: 10, energy: 100 },
    comboOrder: ['skills-sorceress-' + slug, 'fixture.armor-finisher'], skillLevels: {
      'skills-sorceress-frozen-armor': 1, 'skills-sorceress-shiver-armor': 1,
      ['skills-sorceress-' + slug]: 20
    } });
  const cap = { id: 'synthetic-native-armor-cap', baseId: 'items/base/helm-cap', rarity: 'rare' as const,
    level: 1, identified: true, equipped: false, affixes: [{ affixId: 'synthetic-import',
      values: new Map([['statMods.life', 999_880], ['statMods.mana', 1000]]) }] };
  useInventoryStore.getState().addItem(cap);
  expect(useInventoryStore.getState().equipItem(cap)).toEqual({ ok: true });
  useMapStore.getState().setCurrentLocation(1, 'areas/act1-blood-moor');
  expect(startSubAreaRun({ runSeed: 19, challengeOrdinal: 0 })?.totalWaves).toBeGreaterThan(1);
  const state = useCombatStore.getState();
  expect(state.outcome?.winner).toBe('player');
  expect(state.playerTeam[0]?.coldArmors).toBeUndefined();
  expect(state.outcome?.finalPlayerTeam[0]?.coldArmors?.[slug]).toEqual({ sourceId: player().id, rank: 20 });
  return structuredClone(state.outcome?.finalPlayerTeam[0]);
}
beforeEach(() => { mockSyntheticEntryPools(); reset(); useHydrationStore.getState().setStatus('ready'); });
afterEach(() => { reset(); useHydrationStore.getState().setStatus('idle'); });
for (const slug of ['shiver-armor', 'chilling-armor'] as const) {
  it(`${slug} carries paid rank and absolute resources across a real native wave after positive reallocation`, () => {
    const paid = arrange(slug), old = structuredClone(useCombatStore.getState().recordedEvents);
    usePlayerStore.setState({ player: { ...player(), skillLevels: { ...player().skillLevels,
      ['skills-sorceress-' + slug]: 1 }, comboOrder: ['fixture.armor-finisher'] } });
    expect(useCombatStore.getState().recordedEvents).toEqual(old);
    drain(); expect(advanceWaveOrFinish()).toBe('next-wave');
    const state = useCombatStore.getState(), hero = state.playerTeam[0];
    expect(hero?.coldArmors?.[slug]).toEqual(paid?.coldArmors?.[slug]);
    expect([hero?.life, hero?.mana]).toEqual([paid?.life, paid?.mana]);
    expect(state.recordedEvents.filter(e => e.kind === 'buff' && e.buffId === slug)).toEqual([]);
  });
  it.each(['unlearn', 'prerequisite', 'wrong-class'] as const)(`${slug} strips paid carry at next-wave %s invalidation`, invalid => {
    arrange(slug);
    const old = structuredClone(useCombatStore.getState().outcome), current = player();
    usePlayerStore.setState({ player: { ...current,
      ...(invalid === 'wrong-class' ? { class: 'amazon' } : {}),
      skillLevels: { ...current.skillLevels,
        [invalid === 'prerequisite' ? 'skills-sorceress-frozen-armor' : 'skills-sorceress-' + slug]: 0 },
      comboOrder: ['fixture.armor-finisher'] } });
    drain(); expect(advanceWaveOrFinish()).toBe('next-wave');
    expect(useCombatStore.getState().playerTeam[0]?.coldArmors).toBeUndefined();
    expect(useCombatStore.getState().playerTeam[0]?.activeBuffIds).not.toContain(slug);
    expect(old?.finalPlayerTeam[0]?.coldArmors?.[slug]?.rank).toBe(20);
  });
  it(`${slug} starts a fresh run unpaid after flee, with no armor selected`, () => {
    arrange(slug); abortSubAreaRun(); useCombatStore.getState().endCombat();
    usePlayerStore.setState({ player: { ...player(), comboOrder: ['fixture.armor-finisher'] } });
    expect(startSubAreaRun({ runSeed: 19, challengeOrdinal: 1 })).toBeDefined();
    expect(useCombatStore.getState().playerTeam[0]?.coldArmors).toBeUndefined();
    expect(useCombatStore.getState().outcome?.finalPlayerTeam[0]?.coldArmors).toBeUndefined();
  });
}
