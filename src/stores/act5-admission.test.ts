/** Constructed power fixtures verify original-source receipt authority, not earned pacing. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { registerSkill, loadDefaultSkills } from '@/engine/skills/registry';
import { loadQuests } from '@/data/loaders/quests';
import { ACT5_ENCOUNTERS, EVE_QUEST, PRISON_QUEST, THRONE_PROOF } from '@/engine/map/act5-admission';
import { INSPECT_PROOF, POTION_SOURCE, THAW_PROOF } from '@/engine/save/act5-state';
import { claimQuestReward } from '@/features/quests/claimReward';
import { abortSubAreaRun, advanceWaveOrFinish, refreshActivePlayerCombatConfig, startSubAreaRun } from './combatHelpers';
import { combatRunLifecycle } from './combatRunLifecycle';
import { usePlayerStore } from './playerStore';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useCombatStore } from './combatStore';
import { useMercStore } from './mercStore';
import { __resetPersistenceForTests, useHydrationStore } from './persistence';
function required<T>(value: T | null | undefined): T { if (value == null) throw new Error('Missing Act V fixture'); return value; }
function reset(): void {
  abortSubAreaRun(); __resetPersistenceForTests();
  for (const store of [usePlayerStore, useInventoryStore, useMapStore, useCombatStore, useMercStore]) store.getState().reset();
}
function drain(): void { useCombatStore.getState().recordedEvents.forEach(() => { useCombatStore.getState().advanceEvent(); }); }
function accept(): ReturnType<typeof advanceWaveOrFinish> { drain(); return advanceWaveOrFinish(); }
function begin(areaId: string): number {
  return required(startSubAreaRun({ subAreaId: areaId, act: 5, runSeed: 7, challengeOrdinal: 0 })).totalWaves;
}
function reachFinal(areaId: string): void {
  const total = begin(areaId);
  for (let wave = 1; wave < total; wave++) expect(accept()).toBe('next-wave');
}
function track(id: string): void {
  const quest = required(loadQuests().find(row => row.id === id));
  useMapStore.getState().updateQuestProgress(id, { status: 'inProgress', rewardClaimed: false,
    objectives: Object.fromEntries(quest.objectives.map(row => [row.id, false])) });
}
/** Real source-bound thaw graph as the precondition; these tests exercise later combat authority. */
function thawGraph(): void {
  useMapStore.getState().updateQuestProgress(PRISON_QUEST, { objectives: {
    'obj-find-anya': true, 'obj-thaw': true, 'obj-kill-nihlathak': false } });
  useMapStore.setState({ questReceipts: { [INSPECT_PROOF]: true, [POTION_SOURCE]: true, [THAW_PROOF]: true } });
  useInventoryStore.setState({ questItems: { [POTION_SOURCE]: { itemId: 'quest/malahs_potion', state: 'consumed' } } });
}
const throne = 'areas/act5-throne-of-destruction';
beforeEach(() => {
  reset(); loadDefaultSkills();
  registerSkill({ id: 'fixture.act5-source-finisher', archetype: 'fixture', target: 'all-enemies', minLevel: 1,
    cooldown: 0, manaCost: 0, effects: [{ kind: 'damage', damageType: 'arcane', base: [10000000, 10000000] }] });
  useHydrationStore.getState().setStatus('ready');
  usePlayerStore.getState().setPlayer({ ...createMockPlayer('Act V constructed fixture', 'sorceress'), comboOrder: ['fixture.act5-source-finisher'] });
  const gear = { id: 'fixture-cap', baseId: 'items/base/helm-cap', rarity: 'rare' as const, level: 1, identified: true,
    equipped: false, socketCapacity: 0,
    affixes: [{ affixId: 'constructed-power', values: new Map([['statMods.attack', 99978], ['statMods.defense', 99973], ['statMods.life', 999880]]) }] };
  useInventoryStore.getState().addItem(gear); expect(useInventoryStore.getState().equipItem(gear)).toEqual({ ok: true });
  usePlayerStore.setState(state => state.player ? { player: { ...state.player,
    derivedStats: { ...state.player.derivedStats, life: state.player.derivedStats.lifeMax } } } : state);
  useMapStore.setState({ currentAct: 5, clearedSubAreas: ['areas/act1-catacombs', 'areas/act2-tomb-of-tal-rasha',
    'areas/act3-durance-of-hate', 'areas/act4-chaos-sanctuary'] });
});
afterEach(() => { vi.restoreAllMocks(); reset(); loadDefaultSkills(); });

describe.each(ACT5_ENCOUNTERS.filter(row => row.questId !== EVE_QUEST))('Act V accepted original source $questId', contract => {
  it('waits for accepted terminal playback; generic counters and duplicate settlement cannot grant credit', () => {
    track(contract.questId); if (contract.questId === PRISON_QUEST) thawGraph();
    const before = useMapStore.getState().questProgress[contract.questId];
    useMapStore.getState().recordMonsterKills({ actId: 'acts/act5', areaId: contract.areaId,
      archetypeIds: contract.members.map(member => member.archetypeId), source: contract.source });
    useMapStore.getState().recordBossKill({ actId: 'acts/act5', areaId: contract.areaId,
      bossArchetypeId: required(contract.members[0]).archetypeId, source: contract.source });
    expect(useMapStore.getState().questProgress[contract.questId]).toBe(before);
    reachFinal(contract.areaId); expect(advanceWaveOrFinish()).toBe('idle');
    expect(useMapStore.getState().questReceipts[contract.proof]).toBeUndefined();
    expect(accept()).toBe('victory');
    expect(useMapStore.getState().questReceipts[contract.proof]).toBe(true);
    expect(useMapStore.getState().questProgress[contract.questId]?.status).toBe('completed');
    expect(useMapStore.getState().questProgress[contract.questId]?.rewardClaimed).toBe(false);
    const receipts = useMapStore.getState().questReceipts;
    expect(advanceWaveOrFinish()).toBe('idle'); expect(useMapStore.getState().questReceipts).toBe(receipts);
  });
  it('does not bank an untracked victory for later completion', () => {
    reachFinal(contract.areaId); expect(accept()).toBe('victory');
    expect(useMapStore.getState().questReceipts[contract.proof]).toBeUndefined();
    useCombatStore.getState().endCombat(); track(contract.questId); if (contract.questId === PRISON_QUEST) thawGraph();
    reachFinal(contract.areaId); expect(accept()).toBe('victory');
    expect(useMapStore.getState().questReceipts[contract.proof]).toBe(true);
  });
  it.each([true, false])('retains captured original source present=%s through ordinary replay', present => {
    track(contract.questId); if (contract.questId === PRISON_QUEST) thawGraph();
    const total = begin(contract.areaId), final = required(required(combatRunLifecycle.activeRun).plan.waves[total - 1]);
    const source = final.source; if (!present) Object.assign(final, { source: undefined });
    for (let wave = 1; wave < total; wave++) expect(accept()).toBe('next-wave');
    Object.assign(final, { source: present ? undefined : source }); refreshActivePlayerCombatConfig({ replayCurrentWave: true });
    expect(accept()).toBe('victory'); expect(useMapStore.getState().questReceipts[contract.proof]).toBe(present ? true : undefined);
  });
  it('captures eligibility before income observers can create a tracked row', () => {
    reachFinal(contract.areaId);
    const gain = usePlayerStore.getState().gainExperience;
    vi.spyOn(usePlayerStore.getState(), 'gainExperience').mockImplementation(amount => {
      const result = gain(amount); track(contract.questId); if (contract.questId === PRISON_QUEST) thawGraph(); return result;
    });
    expect(accept()).toBe('victory'); expect(useMapStore.getState().questReceipts[contract.proof]).toBeUndefined();
  });
  it('restores source proof and the participating quest row when publication fails after mutation', () => {
    track(contract.questId); if (contract.questId === PRISON_QUEST) thawGraph(); reachFinal(contract.areaId); drain();
    const before = useMapStore.getState().questProgress[contract.questId], write = useMapStore.setState; let injected = false;
    vi.spyOn(useMapStore, 'setState').mockImplementation((...args) => {
      const patch = typeof args[0] === 'function' ? args[0](useMapStore.getState()) : args[0];
      if (patch.questReceipts?.[contract.proof] !== true || injected) { write(...args); return; }
      injected = true; write(...args); expect(claimQuestReward(contract.questId)).toBe('claim-in-progress');
      throw new Error('Act V source publication failure');
    });
    expect(advanceWaveOrFinish).toThrow('Act V victory publication refused'); expect(injected).toBe(true);
    expect(useMapStore.getState().questProgress[contract.questId]).toBe(before);
    expect(useMapStore.getState().questReceipts[contract.proof]).toBeUndefined(); expect(advanceWaveOrFinish).toThrow();
  });
});

describe('Act V contiguous original Throne sequence', () => {
  it('publishes exactly after five accepted original waves, preserves guards, then accepts real final Baal', () => {
    track(EVE_QUEST); expect(begin(throne)).toBe(8);
    for (let ordinal = 1; ordinal <= 5; ordinal++) {
      expect(useMapStore.getState().questReceipts[THRONE_PROOF]).toBeUndefined();
      expect(advanceWaveOrFinish()).toBe('idle'); expect(accept()).toBe('next-wave');
      if (ordinal < 5) expect(useMapStore.getState().questProgress[EVE_QUEST]?.objectives['obj-throne-waves']).toBe(false);
    }
    expect(useMapStore.getState().questReceipts[THRONE_PROOF]).toBe(true);
    const bossProof = required(ACT5_ENCOUNTERS.find(row => row.questId === EVE_QUEST)).proof;
    for (let guard = 0; guard < 2; guard++) { expect(accept()).toBe('next-wave'); expect(useMapStore.getState().questReceipts[bossProof]).toBeUndefined(); }
    expect(accept()).toBe('victory'); expect(useMapStore.getState().questReceipts[bossProof]).toBe(true);
    expect(useMapStore.getState().questProgress[EVE_QUEST]?.status).toBe('completed');
  });
  it('does not carry an incomplete four-wave sequence across an abandoned replacement run', () => {
    track(EVE_QUEST); begin(throne); for (let count = 0; count < 4; count++) expect(accept()).toBe('next-wave');
    abortSubAreaRun(); begin(throne);
    for (let count = 0; count < 4; count++) { expect(accept()).toBe('next-wave'); expect(useMapStore.getState().questReceipts[THRONE_PROOF]).toBeUndefined(); }
    expect(accept()).toBe('next-wave'); expect(useMapStore.getState().questReceipts[THRONE_PROOF]).toBe(true);
  });
  it('uses durable five-wave proof for a later new eligible Baal victory', () => {
    track(EVE_QUEST); begin(throne); for (let count = 0; count < 5; count++) expect(accept()).toBe('next-wave');
    abortSubAreaRun(); reachFinal(throne); expect(accept()).toBe('victory');
    expect(useMapStore.getState().questReceipts[THRONE_PROOF]).toBe(true);
    expect(useMapStore.getState().questReceipts[required(ACT5_ENCOUNTERS.find(row => row.questId === EVE_QUEST)).proof]).toBe(true);
  });
  it('does not stitch reordered original manifests into the five-wave proof', () => {
    track(EVE_QUEST); const total = begin(throne), plan = required(combatRunLifecycle.activeRun).plan;
    const waves = [...plan.waves], second = required(waves[1]); waves[1] = required(waves[2]); waves[2] = second;
    Object.assign(plan, { waves });
    for (let index = 1; index <= total; index++) expect(accept()).toBe(index === total ? 'victory' : 'next-wave');
    expect(useMapStore.getState().questReceipts[THRONE_PROOF]).toBeUndefined();
  });
  it('does not admit Normal proof from an active Nightmare plan', () => {
    track(EVE_QUEST); const total = begin(throne);
    Object.assign(required(combatRunLifecycle.activeRun).plan, { replayProfileId: 'nightmare' });
    for (let index = 1; index <= total; index++) expect(accept()).toBe(index === total ? 'victory' : 'next-wave');
    expect(useMapStore.getState().questReceipts[THRONE_PROOF]).toBeUndefined();
    expect(useMapStore.getState().questProgress[EVE_QUEST]?.objectives['obj-kill-baal']).toBe(false);
  });
  it('requires a new post-thaw Nihlathak victory after early clear', () => {
    track(PRISON_QUEST); const contract = required(ACT5_ENCOUNTERS.find(row => row.questId === PRISON_QUEST));
    reachFinal(contract.areaId); expect(accept()).toBe('victory'); expect(useMapStore.getState().clearedSubAreas).toContain(contract.areaId);
    expect(useMapStore.getState().questReceipts[contract.proof]).toBeUndefined(); useCombatStore.getState().endCombat(); thawGraph();
    expect(useMapStore.getState().questReceipts[contract.proof]).toBeUndefined(); reachFinal(contract.areaId); expect(accept()).toBe('victory');
    expect(useMapStore.getState().questReceipts[contract.proof]).toBe(true);
  });
  it('refuses sequence credit when any original wave source is missing, including after guards and Baal', () => {
    track(EVE_QUEST); const total = begin(throne), fifth = required(required(combatRunLifecycle.activeRun).plan.waves[4]);
    Object.assign(fifth, { source: undefined });
    for (let index = 1; index <= total; index++) expect(accept()).toBe(index === total ? 'victory' : 'next-wave');
    expect(useMapStore.getState().questReceipts[THRONE_PROOF]).toBeUndefined();
    expect(useMapStore.getState().questProgress[EVE_QUEST]?.objectives['obj-kill-baal']).toBe(false);
  });
});
