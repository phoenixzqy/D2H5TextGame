/** Constructed API tests; no earned gameplay or historical replay. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { loadQuests } from '@/data/loaders/quests';
import { subAreas } from '@/data/index';
import { canClaim, claimQuestReward } from '@/features/quests/claimReward';
import { abortSubAreaRun, advanceWaveOrFinish, refreshActivePlayerCombatConfig, startSubAreaRun } from '@/stores/combatHelpers';
import { combatRunLifecycle } from '@/stores/combatRunLifecycle';
import { usePlayerStore } from '@/stores/playerStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { useCombatStore } from '@/stores/combatStore';
import { useMercStore } from '@/stores/mercStore';
import { useMetaStore } from '@/stores/metaStore';
import { useFormationStore } from '@/stores/formationStore';
import { __resetPersistenceForTests, useHydrationStore } from '@/stores/persistence';
import { xpForKill, xpTotal } from '@/engine/progression/xp';
import * as combatEngine from '@/engine/combat/combat';

const QUEST = 'quests/act1-forgotten-tower';
const OBJECTIVE = 'obj-kill-countess';
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
function nativeKillXp() {
  const outcome = required(useCombatStore.getState().outcome);
  expect(outcome.winner).toBe('player');
  return outcome.finalEnemyTeam.filter(enemy => enemy.life <= 0 && enemy.kind !== 'summon')
    .reduce((sum, enemy) => sum + xpForKill(enemy.level), 0);
}
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

describe('explicit Countess source', () => {
  it('starts exactly one authored level13 boss without an earlier area clear or ordinal advance', () => {
    const before = useMapStore.getState();
    const entered = required(enter()); expect(entered.totalWaves).toBe(1);
    const run = required(combatRunLifecycle.activeRun), wave = required(run.plan.waves[0]);
    expect(run.plan.waves).toHaveLength(1);
    expect(wave.source).toEqual({ kind: 'questEncounter', encounterId: ENCOUNTER });
    expect(wave.lootTable ?? run.plan.defaultLootTable).toBe('loot/act1-boss');
    expect(wave.spawns).toEqual([{ archetypeId: 'monsters/act1.the-countess', encounterId: ENCOUNTER, tier: 'boss', level: 13, index: 0 }]);
    expect(useMapStore.getState().challengeOrdinals).toEqual(before.challengeOrdinals);
    expect(useMapStore.getState().clearedSubAreas).toEqual([]);
    expect(useMapStore.getState().questReceipts).toEqual(before.questReceipts);
    expect(advanceWaveOrFinish()).toBe('idle');
  });

  it('publishes the true objective/proof only after accepted playback, with native income and no clear or idle unlock', () => {
    const xp = heroXp(), ordinal = structuredClone(useMapStore.getState().challengeOrdinals);
    enter(); const killXp = nativeKillXp(); expect(useMapStore.getState().questReceipts[PROOF]).toBeUndefined();
    expect(finish()).toBe('victory');
    const map = useMapStore.getState(); expect(map.questReceipts[PROOF]).toBe(true);
    expect(map.questProgress[QUEST]).toMatchObject({ status: 'completed', rewardClaimed: false, objectives: { [OBJECTIVE]: true } });
    expect(heroXp()).toBe(xp + killXp); expect(map.clearedSubAreas).toEqual([]);
    expect(map.challengeOrdinals).toEqual(ordinal); expect(map.nightmareClearedSubAreas).toEqual([]);
    const after = snapshot(); expect(advanceWaveOrFinish()).toBe('idle'); expect(snapshot()).toEqual(after);
    useCombatStore.getState().endCombat(); const repeat = snapshot(); expect(() => enter()).toThrow(); expect(snapshot()).toEqual(repeat);
  });

  it('cannot earn proof or an area clear from explicit replay', () => {
    enter(); refreshActivePlayerCombatConfig({ replayCurrentWave: true });
    expect(finish()).toBe('victory');
    expect(useMapStore.getState().questReceipts[PROOF]).toBeUndefined();
    expect(useMapStore.getState().questProgress[QUEST]?.objectives[OBJECTIVE]).toBe(false);
    expect(useMapStore.getState().clearedSubAreas).toEqual([]);
  });

  it.each([
    { mode: 'idle' }, { act: 2 }, { subAreaId: 'areas/act1-blood-moor' },
    { subAreaId: 'not-an-area' }, { questEncounter: 'unknown-encounter' },
    { questEncounter: '' }, { questRecovery: 'khalims-council' }, { questSource: 'act5-throne' }
  ])('refuses invalid source request %j before any store/run/ordinal mutation', patch => {
    const before = snapshot(), run = combatRunLifecycle.activeRun;
    expect(() => enter(patch)).toThrow(); expect(snapshot()).toEqual(before); expect(combatRunLifecycle.activeRun).toBe(run);
  });

  it.each(['missing', 'available', 'nightmare'])('refuses %s eligibility before mutation', mode => {
    if (mode === 'missing') useMapStore.setState({ questProgress: {} });
    if (mode === 'available') useMapStore.getState().updateQuestProgress(QUEST, { status: 'available' });
    if (mode === 'nightmare') useMapStore.setState({ selectedDifficulty: 'nightmare' });
    const before = snapshot(); expect(() => enter()).toThrow(); expect(snapshot()).toEqual(before);
  });

  it('does not trust generic kills even with exactly matching source metadata', () => {
    const before = useMapStore.getState().questProgress[QUEST];
    const source = { kind: 'questEncounter', encounterId: ENCOUNTER } as const;
    useMapStore.getState().recordMonsterKills({ actId: 'acts/act1', areaId: AREA,
      archetypeIds: ['monsters/act1.the-countess'], source });
    useMapStore.getState().recordBossKill({ actId: 'acts/act1', areaId: AREA,
      bossArchetypeId: 'monsters/act1.the-countess', source });
    expect(useMapStore.getState().questProgress[QUEST]).toBe(before);
    expect(useMapStore.getState().questReceipts[PROOF]).toBeUndefined();
  });

  it('requires actual proof before a flag-only completed row may Claim', () => {
    track('completed', false, { [OBJECTIVE]: true }); const before = snapshot();
    expect(canClaim(QUEST)).toBe(false); expect(claimQuestReward(QUEST)).toBe('not-completed'); expect(snapshot()).toEqual(before);
  });

  it.each([{}, { [OBJECTIVE]: false }, { [OBJECTIVE]: true }])('repairs sparse claimed history %j without repeated quest income', objectives => {
    track('completed', true, objectives); const before = snapshot();
    expect(claimQuestReward(QUEST)).toBe('already-claimed'); expect(snapshot()).toEqual(before);
    const xp = heroXp(); enter(); const killXp = nativeKillXp(); expect(finish()).toBe('victory');
    expect(heroXp()).toBe(xp + killXp);
    expect(useMapStore.getState().questReceipts[PROOF]).toBe(true);
    expect(useMapStore.getState().questProgress[QUEST]).toMatchObject({ status: 'completed', rewardClaimed: true, objectives: { [OBJECTIVE]: true } });
    const paid = snapshot(); expect(claimQuestReward(QUEST)).toBe('already-claimed'); expect(snapshot()).toEqual(paid);
  });

  it.each(['countess-replaced', 'countess-duplicated', 'hero-replaced'] as const)(
    'does not grant original-source proof for %s', kind => {
      const original = combatEngine.runBattleRecorded;
      let injected = 0;
      vi.spyOn(combatEngine, 'runBattleRecorded').mockImplementation(input => {
        const actual = original(input);
        expect(actual.result.winner).toBe('player');
        const boss = required(actual.result.enemyTeam.find(unit => unit.monsterArchetypeId === 'monsters/act1.the-countess'));
        injected++;
        const enemyTeam = kind === 'countess-duplicated' ? [...actual.result.enemyTeam, boss]
          : kind === 'countess-replaced' ? actual.result.enemyTeam.map(unit => unit.id === boss.id
            ? { ...unit, id: 'different-countess-instance' } : unit) : actual.result.enemyTeam;
        const playerTeam = kind === 'hero-replaced' ? actual.result.playerTeam.map(unit => unit.kind === 'hero'
          ? { ...unit, id: 'different-hero-instance' } : unit) : actual.result.playerTeam;
        return { ...actual, result: { ...actual.result, enemyTeam, playerTeam } };
      });
      enter(); expect(injected).toBe(1); finish();
      expect(useMapStore.getState().questReceipts[PROOF]).toBeUndefined();
      expect(useMapStore.getState().questProgress[QUEST]?.objectives[OBJECTIVE]).toBe(false);
      expect(useMapStore.getState().clearedSubAreas).toEqual([]);
    });

  it('permits a fresh explicit attempt after defeat and grants proof only on its native victory', () => {
    const original = combatEngine.runBattleRecorded;
    const failed = vi.spyOn(combatEngine, 'runBattleRecorded').mockImplementation(input => {
      const actual = original(input);
      return { ...actual, result: { ...actual.result, winner: 'enemy' as const,
        playerTeam: actual.result.playerTeam.map(unit => unit.kind === 'hero' ? { ...unit, life: 0 } : unit) } };
    });
    enter(); expect(finish()).toBe('defeat');
    expect(useMapStore.getState().questReceipts[PROOF]).toBeUndefined();
    expect(useMapStore.getState().questProgress[QUEST]?.objectives[OBJECTIVE]).toBe(false);
    expect(useMapStore.getState().clearedSubAreas).toEqual([]);
    failed.mockRestore();
    enter(); expect(finish()).toBe('victory');
    expect(useMapStore.getState().questReceipts[PROOF]).toBe(true);
    const settled = snapshot(); expect(advanceWaveOrFinish()).toBe('idle'); expect(snapshot()).toEqual(settled);
    useCombatStore.getState().endCombat();
    const before = snapshot(); expect(() => enter()).toThrow(); expect(snapshot()).toEqual(before);
  });

  it('keeps the ordinary DarkWood challenge separate from the optional Countess', () => {
    expect(required(subAreas.find(row => row.id === AREA)).waves).not.toEqual([]);
    const total = required(startSubAreaRun({ act: 1, subAreaId: AREA, mode: 'manual', runSeed: 7, challengeOrdinal: 0 })).totalWaves;
    expect(total).toBeGreaterThan(1);
    expect(required(combatRunLifecycle.activeRun).plan.waves.flatMap(wave => wave.spawns).some(spawn => spawn.archetypeId === 'monsters/act1.the-countess')).toBe(false);
  });
});
