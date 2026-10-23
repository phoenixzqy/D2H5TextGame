/** BUG049: real imported wiring fixture; never an earned boss/balance claim. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { claimQuestReward } from '@/features/quests/claimReward';
import { xpForKill, xpTotal } from '@/engine/progression/xp';
import { decodeSave } from '@/engine/save/validate';
import * as combatEngine from '@/engine/combat/combat';
import * as monsterFactory from '@/engine/combat/monster-factory';
import { abortSubAreaRun, advanceWaveOrFinish, refreshActivePlayerCombatConfig, startSubAreaRun } from './combatHelpers';
import { useCombatStore } from './combatStore';
import { useFormationStore } from './formationStore';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useMercStore } from './mercStore';
import { useMetaStore } from './metaStore';
import { __resetPersistenceForTests, exportCurrentSave, snapshotStores } from './persistence';
import { useHydrationStore } from './hydrationStore';
import { usePlayerStore } from './playerStore';
import { inspectRecordedWaves, RecordedWaveReceiptError } from './recordedWaveReceipt';

const QUEST = 'quests/act1-sisters-to-the-slaughter';
const AREA = 'areas/act1-catacombs';
function required<T>(value: T | null | undefined): T {
  if (value === null || value === undefined) throw new Error('Missing wiring fixture');
  return value;
}
function reset(): void {
  abortSubAreaRun(); __resetPersistenceForTests();
  for (const store of [useCombatStore, useFormationStore, useInventoryStore,
    useMapStore, useMercStore, useMetaStore, usePlayerStore]) store.getState().reset();
}
beforeEach(() => { reset(); useHydrationStore.getState().setStatus('ready'); vi.spyOn(Date, 'now').mockReturnValue(1792454400000); });
afterEach(() => { reset(); useHydrationStore.getState().setStatus('idle'); vi.restoreAllMocks(); });
function track(): void {
  useMapStore.getState().updateQuestProgress(QUEST, {
    status: 'inProgress', objectives: { 'obj-kill-andariel': false }, rewardClaimed: false
  });
}
function progress() { return useMapStore.getState().questProgress[QUEST]; }
function refuseCompletion(): void {
  const stores = [useCombatStore, usePlayerStore, useInventoryStore, useMercStore, useMapStore, useMetaStore] as const;
  const before = stores.map(store => store.getState()); const holder = inspectRecordedWaves();
  expect(advanceWaveOrFinish).toThrow(new RecordedWaveReceiptError('bindingMismatch'));
  stores.forEach((store, index) => { expect(store.getState()).toBe(before[index]); });
  expect(inspectRecordedWaves()).toBe(holder);
}
function start(area = AREA, act = 1): number {
  const player = createMockPlayer('BossQuestWiring', 'sorceress');
  usePlayerStore.getState().setPlayer({ ...player, comboOrder: [] });
  // Imported canonical gear and explicit fixture refill, not earned power.
  const gear = { id: 'boss-quest-imported-cap', baseId: 'items/base/helm-cap', socketCapacity: 0,
    rarity: 'rare' as const, level: 1, identified: true, equipped: false,
    affixes: [{ affixId: 'imported-wiring-fixture', values: new Map([
      ['statMods.attack', 99978], ['statMods.defense', 99973], ['statMods.life', 999880]
    ]) }] };
  useInventoryStore.getState().addItem(gear);
  expect(useInventoryStore.getState().equipItem(gear)).toEqual({ ok: true });
  const equipped = required(usePlayerStore.getState().player);
  usePlayerStore.getState().setPlayer({ ...equipped, derivedStats: {
    ...equipped.derivedStats, life: 1_000_000, mana: player.derivedStats.mana } });
  return required(startSubAreaRun({ subAreaId: area, act, runSeed: 7,
    challengeOrdinal: 0 })).totalWaves;
}
function drain(): void {
  const events = useCombatStore.getState().recordedEvents;
  events.forEach(() => { useCombatStore.getState().advanceEvent(); });
  expect(useCombatStore.getState().playbackComplete).toBe(true);
}

describe('Act III settlement provenance (constructed wiring, no earned progress)', () => {
  it('delivers all three original Council kills with their explicit encounter source', () => {
    const kills = vi.spyOn(useMapStore.getState(), 'recordMonsterKills');
    const total = start('areas/act3-travincal', 3);
    for (let wave = 1; wave <= total; wave++) {
      expect(useCombatStore.getState().outcome?.winner).toBe('player');
      drain(); expect(advanceWaveOrFinish()).toBe(wave === total ? 'victory' : 'next-wave');
    }
    expect(kills).toHaveBeenCalledOnce();
    expect(kills).toHaveBeenCalledWith({
      actId: 'acts/act3', areaId: 'areas/act3-travincal',
      archetypeIds: Array.from({ length: 3 }, () => 'monsters/act3.infector'),
      source: { kind: 'bossEncounter', encounterId: 'act3-travincal-council' }
    });
    expect(useMapStore.getState().clearedSubAreas).toContain('areas/act3-travincal');
  });

  it('delivers Mephisto with its chapter source and preserves the independent area clear', () => {
    const kills = vi.spyOn(useMapStore.getState(), 'recordBossKill');
    const total = start('areas/act3-durance-of-hate', 3);
    for (let wave = 1; wave <= total; wave++) {
      expect(useCombatStore.getState().outcome?.winner).toBe('player');
      drain(); expect(advanceWaveOrFinish()).toBe(wave === total ? 'victory' : 'next-wave');
    }
    expect(kills).toHaveBeenCalledOnce();
    expect(kills).toHaveBeenCalledWith({
      actId: 'acts/act3', areaId: 'areas/act3-durance-of-hate',
      bossArchetypeId: 'monsters/act3.mephisto',
      source: { kind: 'chapterBoss', archetypeId: 'monsters/act3.mephisto' }
    });
    expect(useMapStore.getState().clearedSubAreas).toContain('areas/act3-durance-of-hate');
    expect(useMapStore.getState().isActUnlocked(4)).toBe(true);
    expect(useMapStore.getState().questProgress['quests/act3-guardian']).toBeUndefined();
  });
});
function reachFinal(): number {
  const total = start();
  let expectedXP = 0;
  for (let wave = 1; wave <= total; wave++) {
    const outcome = required(useCombatStore.getState().outcome);
    expect(outcome.winner).toBe('player');
    expectedXP += outcome.finalEnemyTeam.filter(enemy => enemy.life <= 0 && enemy.kind !== 'summon')
      .reduce((sum, enemy) => sum + xpForKill(enemy.level), 0);
    if (wave === total) break;
    drain(); expect(advanceWaveOrFinish()).toBe('next-wave');
    expect(progress()?.objectives['obj-kill-andariel'] ?? false).toBe(false);
  }
  return expectedXP;
}

describe('qualified Radament kill settlement (constructed integration fixture)', () => {
  const quest = 'quests/act2-radaments-lair';
  function trackRadament(): void {
    useMapStore.getState().updateQuestProgress(quest, {
      status: 'inProgress', objectives: { 'obj-kill-radament': false }, rewardClaimed: false
    });
  }
  function reachRadament(): void {
    const total = start('areas/act2-far-oasis', 2);
    for (let wave = 1; wave < total; wave++) {
      expect(useCombatStore.getState().outcome?.winner).toBe('player');
      drain(); expect(advanceWaveOrFinish()).toBe('next-wave');
    }
  }

  it('completes the tracked ordinary-kill objective after actual final playback, without claiming', () => {
    useMapStore.getState().updateQuestProgress(quest, {
      status: 'inProgress', objectives: { 'obj-kill-radament': false }, rewardClaimed: false
    });
    const total = start('areas/act2-far-oasis', 2);
    let expectedXP = 0;
    for (let wave = 1; wave <= total; wave++) {
      const outcome = required(useCombatStore.getState().outcome);
      expect(outcome.winner).toBe('player');
      expectedXP += outcome.finalEnemyTeam.filter(enemy => enemy.life <= 0 && enemy.kind !== 'summon')
        .reduce((sum, enemy) => sum + xpForKill(enemy.level), 0);
      expect(useMapStore.getState().questProgress[quest]?.status).toBe('inProgress');
      if (wave === total) {
        expect(outcome.finalEnemyTeam.some(enemy => enemy.tier === 'boss' && enemy.life <= 0)).toBe(true);
        expect(advanceWaveOrFinish()).toBe('idle');
      }
      drain();
      expect(advanceWaveOrFinish()).toBe(wave === total ? 'victory' : 'next-wave');
    }
    expect(useMapStore.getState().questProgress[quest]).toEqual({ id: quest, status: 'completed',
      objectives: { 'obj-kill-radament': true }, rewardClaimed: false });
    const saved = decodeSave(JSON.parse(required(exportCurrentSave())) as unknown);
    expect(saved.map.questProgress).toEqual(useMapStore.getState().questProgress);
    expect(xpTotal(saved.player.level) + saved.player.experience).toBe(expectedXP);
    const before = required(snapshotStores());
    expect(advanceWaveOrFinish()).toBe('idle');
    expect(snapshotStores()).toEqual(before);
  });

  it('uses active-run context despite navigation and accepts a later genuine replay after tracking', () => {
    reachRadament(); drain(); expect(advanceWaveOrFinish()).toBe('victory');
    expect(useMapStore.getState().questProgress[quest]).toBeUndefined();
    trackRadament(); expect(advanceWaveOrFinish()).toBe('idle');
    expect(useMapStore.getState().questProgress[quest]?.status).toBe('inProgress');
    reachRadament();
    useMapStore.getState().setCurrentLocation(1, AREA);
    drain(); expect(advanceWaveOrFinish()).toBe('victory');
    expect(useMapStore.getState().questProgress[quest]?.status).toBe('completed');
  });

  it('does not credit abandoned playback', () => {
    trackRadament(); reachRadament(); drain();
    const before = useMapStore.getState().questProgress;
    abortSubAreaRun(); expect(advanceWaveOrFinish()).toBe('idle');
    expect(useMapStore.getState().questProgress).toBe(before);
  });

  it.each(['clone-outcome', 'clone-events', 'prior-run', 'pre-replay'] as const)(
    'refuses %s references for the ordinary boss too', kind => {
      trackRadament(); reachRadament(); const old = useCombatStore.getState();
      if (kind === 'prior-run') { abortSubAreaRun(); reachRadament(); }
      if (kind === 'pre-replay') refreshActivePlayerCombatConfig({ replayCurrentWave: true });
      const current = useCombatStore.getState(); drain();
      useCombatStore.setState(kind === 'clone-outcome' ? { outcome: { ...required(current.outcome) } }
        : kind === 'clone-events' ? { recordedEvents: [...current.recordedEvents] }
        : { outcome: old.outcome, recordedEvents: old.recordedEvents });
      const before = useMapStore.getState().questProgress;
      refuseCompletion(); expect(useMapStore.getState().questProgress).toBe(before);
    });

  it.each(['missing', 'alive', 'wrong-side', 'wrong-kind', 'wrong-tier', 'wrong-id',
    'wrong-archetype', 'missing-archetype', 'duplicate', 'nonfinite-life'] as const)(
    'rejects malformed final Radament %s with current receipt references', kind => {
      const original = combatEngine.runBattleRecorded;
      let injected = 0;
      vi.spyOn(combatEngine, 'runBattleRecorded').mockImplementation(input => {
        const actual = original(input);
        const boss = actual.result.enemyTeam.find(enemy => enemy.tier === 'boss');
        if (!boss) return actual;
        expect(actual.result.winner).toBe('player'); injected++;
        const { monsterArchetypeId: _archetypeId, ...withoutArchetype } = boss;
        const changed = kind === 'alive' ? { ...boss, life: 1 }
          : kind === 'nonfinite-life' ? { ...boss, life: -Infinity }
          : kind === 'wrong-side' ? { ...boss, side: 'player' as const }
          : kind === 'wrong-kind' ? { ...boss, kind: 'summon' as const }
          : kind === 'wrong-tier' ? { ...boss, tier: 'trash' as const }
          : kind === 'wrong-archetype' ? { ...boss, monsterArchetypeId: 'monsters/act2.greater-mummy' }
          : kind === 'missing-archetype' ? withoutArchetype
          : { ...boss, id: 'different-final-instance' };
        const enemyTeam = kind === 'duplicate' ? [...actual.result.enemyTeam, boss]
          : actual.result.enemyTeam.flatMap(enemy => enemy.id !== boss.id ? [enemy]
            : kind === 'missing' ? [] : [changed]);
        return { ...actual, result: { ...actual.result, enemyTeam } };
      });
      trackRadament(); reachRadament(); expect(injected).toBe(1);
      const before = useMapStore.getState().questProgress[quest]; drain();
      expect(advanceWaveOrFinish()).toBe('victory');
      expect(useMapStore.getState().questProgress[quest]).toBe(before);
    });

  it.each(['enemy', 'draw/timeout', 'dead-hero'] as const)('rejects terminal %s', kind => {
    const original = combatEngine.runBattleRecorded;
    vi.spyOn(combatEngine, 'runBattleRecorded').mockImplementation(input => {
      const actual = original(input);
      if (!input.enemyTeam.some(enemy => enemy.tier === 'boss')) return actual;
      return { ...actual, result: { ...actual.result,
        winner: kind === 'dead-hero' ? 'player' as const : kind === 'enemy' ? 'enemy' as const : null,
        playerTeam: kind === 'dead-hero' ? actual.result.playerTeam.map(unit =>
          unit.kind === 'hero' ? { ...unit, life: 0 } : unit) : actual.result.playerTeam
      } };
    });
    trackRadament(); reachRadament();
    const before = useMapStore.getState().questProgress[quest]; drain();
    expect(advanceWaveOrFinish()).toBe('defeat');
    expect(useMapStore.getState().questProgress[quest]).toBe(before);
  });

  it.each(['archetype', 'side', 'kind', 'tier'] as const)(
    'rejects mismatched original %s even when the final monster appears to match', kind => {
      const original = monsterFactory.buildMonsterUnit;
      let injected = 0;
      let injectedId = '';
      vi.spyOn(monsterFactory, 'buildMonsterUnit').mockImplementation(options => {
        const actual = original(options);
        if (options.def.id !== 'monsters/act2.radament') return actual;
        injected++; injectedId = actual.id;
        return kind === 'archetype' ? { ...actual, monsterArchetypeId: 'monsters/act2.greater-mummy' }
          : kind === 'side' ? { ...actual, side: 'player' as const }
          : kind === 'kind' ? { ...actual, kind: 'summon' as const }
          : { ...actual, tier: 'trash' as const };
      });
      const runActualBattle = combatEngine.runBattleRecorded;
      vi.spyOn(combatEngine, 'runBattleRecorded').mockImplementation(input => {
        const actual = runActualBattle(input);
        if (!input.enemyTeam.some(enemy => enemy.id === injectedId)) return actual;
        expect(actual.result.winner).toBe('player');
        return { ...actual, result: { ...actual.result, enemyTeam: actual.result.enemyTeam.map(enemy =>
          enemy.id !== injectedId ? enemy : { ...enemy, side: 'enemy' as const, kind: 'monster' as const,
            tier: 'boss' as const, monsterArchetypeId: 'monsters/act2.radament' }) } };
      });
      trackRadament(); reachRadament(); expect(injected).toBe(1);
      const before = useMapStore.getState().questProgress[quest]; drain();
      expect(advanceWaveOrFinish()).toBe('victory');
      expect(useMapStore.getState().questProgress[quest]).toBe(before);
    });
});

describe('qualified Duriel settlement (constructed integration fixture)', () => {
  const quest = 'quests/act2-seven-tombs';
  function trackDuriel(opened: boolean): void {
    useMapStore.getState().updateQuestProgress(quest, { status: 'inProgress', rewardClaimed: false,
      objectives: { 'obj-open-tomb': opened, 'obj-kill-duriel': false } });
  }
  function reachDuriel(): void {
    const total = start('areas/act2-tomb-of-tal-rasha', 2);
    for (let wave = 1; wave < total; wave++) {
      expect(useCombatStore.getState().outcome?.winner).toBe('player');
      drain(); expect(advanceWaveOrFinish()).toBe('next-wave');
    }
    const outcome = required(useCombatStore.getState().outcome);
    expect(outcome.winner).toBe('player');
    expect(outcome.finalEnemyTeam).toEqual([expect.objectContaining({
      monsterArchetypeId: 'monsters/act2.duriel', tier: 'chapter-boss', level: 32, life: 0
    })]);
  }

  it('credits canonical Duriel only after playback and keeps Claim separate', () => {
    trackDuriel(true); reachDuriel();
    const before = useMapStore.getState().questProgress[quest];
    expect(advanceWaveOrFinish()).toBe('idle');
    expect(useMapStore.getState().questProgress[quest]).toBe(before);
    useMapStore.getState().setCurrentLocation(1, AREA);
    drain(); expect(advanceWaveOrFinish()).toBe('victory');
    expect(useMapStore.getState().questProgress[quest]).toEqual({ id: quest,
      status: 'completed', rewardClaimed: false,
      objectives: { 'obj-open-tomb': true, 'obj-kill-duriel': true } });
    const saved = decodeSave(JSON.parse(required(exportCurrentSave())) as unknown);
    expect(saved.map.questProgress).toEqual(useMapStore.getState().questProgress);
    const settled = snapshotStores(); expect(advanceWaveOrFinish()).toBe('idle');
    expect(snapshotStores()).toEqual(settled);
  });

  it('does not bank an unopened victory; opening requires a new qualified victory', () => {
    trackDuriel(false); reachDuriel(); drain(); expect(advanceWaveOrFinish()).toBe('victory');
    expect(useMapStore.getState().questProgress[quest]?.objectives['obj-kill-duriel']).toBe(false);
    trackDuriel(true); expect(advanceWaveOrFinish()).toBe('idle');
    expect(useMapStore.getState().questProgress[quest]?.status).toBe('inProgress');
    reachDuriel(); drain(); expect(advanceWaveOrFinish()).toBe('victory');
    expect(useMapStore.getState().questProgress[quest]?.status).toBe('completed');
    expect(useMapStore.getState().questProgress[quest]?.rewardClaimed).toBe(false);
  });

  it.each(['clone-outcome', 'clone-events', 'prior-run', 'pre-replay'] as const)(
    'refuses Duriel %s references without quest credit', kind => {
      trackDuriel(true); reachDuriel(); const old = useCombatStore.getState();
      if (kind === 'prior-run') { abortSubAreaRun(); reachDuriel(); }
      if (kind === 'pre-replay') refreshActivePlayerCombatConfig({ replayCurrentWave: true });
      const current = useCombatStore.getState(); drain();
      useCombatStore.setState(kind === 'clone-outcome' ? { outcome: { ...required(current.outcome) } }
        : kind === 'clone-events' ? { recordedEvents: [...current.recordedEvents] }
        : { outcome: old.outcome, recordedEvents: old.recordedEvents });
      const before = useMapStore.getState().questProgress;
      refuseCompletion(); expect(useMapStore.getState().questProgress).toBe(before);
    });
});

describe('qualified current chapter-boss quest settlement', () => {
  it('completes a tracked objective only at final playback settlement, without extra quest rewards', () => {
    track(); const expectedXP = reachFinal();
    expect(advanceWaveOrFinish()).toBe('idle');
    expect(progress()?.status).toBe('inProgress');
    // UI navigation cannot retarget the authoritative active-run event.
    useMapStore.getState().setCurrentLocation(2, 'areas/act2-rocky-waste');
    drain(); expect(advanceWaveOrFinish()).toBe('victory');
    expect(progress()).toEqual({ id: QUEST, status: 'completed',
      objectives: { 'obj-kill-andariel': true }, rewardClaimed: false });
    const player = required(usePlayerStore.getState().player);
    expect(xpTotal(player.level) + player.experience).toBe(expectedXP);
    const saved = decodeSave(JSON.parse(required(exportCurrentSave())) as unknown);
    expect(saved.map.questProgress).toEqual(useMapStore.getState().questProgress);
    const before = required(snapshotStores());
    useHydrationStore.getState().setStatus('ready');
    expect(claimQuestReward(QUEST)).toBe('ok');
    const paid = required(snapshotStores());
    expect(xpTotal(paid.player.level) + paid.player.experience).toBe(expectedXP + 8000);
    expect(paid.inventory.backpack.slice(0, before.inventory.backpack.length)).toEqual(before.inventory.backpack);
    expect(paid.inventory.backpack).toHaveLength(before.inventory.backpack.length + 1);
    expect(paid.inventory.backpack.at(-1)).toMatchObject({ uniqueId: 'items/unique/coif-of-glory', ilvl: 19 });
    expect(paid.map.questProgress[QUEST]?.rewardClaimed).toBe(true);
    expect(claimQuestReward(QUEST)).toBe('already-claimed');
    expect(snapshotStores()).toEqual(paid);
    expect(advanceWaveOrFinish()).toBe('idle');
    expect(snapshotStores()).toEqual(paid);
  });

  it.each([true, false])('evaluates tracking at settlement, before=%s, without later backfill', before => {
    reachFinal();
    if (before) track();
    drain(); expect(advanceWaveOrFinish()).toBe('victory');
    if (before) expect(progress()?.status).toBe('completed');
    else {
      expect(progress()).toBeUndefined(); track();
      expect(advanceWaveOrFinish()).toBe('idle');
      expect(progress()?.status).toBe('inProgress');
    }
  });

  it.each([{ currentWave: 0 }, { totalWaves: 0 }, { subAreaRunId: 'areas/act1-den-of-evil' }])(
    'does not emit against mismatched recording metadata %j', mismatch => {
      track(); reachFinal(); drain(); const before = progress();
      useCombatStore.setState(mismatch);
      refuseCompletion();
      expect(progress()).toBe(before);
    });

  it.each(['clone-outcome', 'clone-events', 'prior-run', 'pre-replay'] as const)(
    'rejects %s references even when the boss IDs and seed match', kind => {
      track(); reachFinal(); const old = useCombatStore.getState();
      if (kind === 'prior-run') { abortSubAreaRun(); reachFinal(); }
      if (kind === 'pre-replay') refreshActivePlayerCombatConfig({ replayCurrentWave: true });
      const current = useCombatStore.getState();
      expect(current.outcome?.finalEnemyTeam.map(enemy => enemy.id))
        .toEqual(old.outcome?.finalEnemyTeam.map(enemy => enemy.id));
      drain();
      useCombatStore.setState(kind === 'clone-outcome' ? { outcome: { ...required(current.outcome) } }
        : kind === 'clone-events' ? { recordedEvents: [...current.recordedEvents] }
        : { outcome: old.outcome, recordedEvents: old.recordedEvents });
      const before = progress();
      refuseCompletion();
      expect(progress()).toBe(before);
    });

  it('does not turn an ordinary area boss into the chapter-boss objective', () => {
    track(); const total = start('areas/act1-blood-moor');
    for (let wave = 1; wave <= total; wave++) {
      drain(); expect(advanceWaveOrFinish()).toBe(wave === total ? 'victory' : 'next-wave');
    }
    expect(progress()?.status).toBe('inProgress');
    expect(progress()?.objectives['obj-kill-andariel']).toBe(false);
  });

  it('rejects a prior wave recording despite current final-wave metadata', () => {
    track(); const total = start(); const first = useCombatStore.getState();
    for (let wave = 1; wave < total; wave++) {
      drain(); expect(advanceWaveOrFinish()).toBe('next-wave');
    }
    const final = useCombatStore.getState();
    expect(final.currentWave).toBe(total); drain();
    useCombatStore.setState({ outcome: first.outcome, recordedEvents: first.recordedEvents });
    const before = progress();
    refuseCompletion();
    expect(progress()).toBe(before);
  });

  it.each(['missing', 'alive', 'wrong-side', 'wrong-kind', 'wrong-tier', 'wrong-id'] as const)(
    'rejects controlled malformed final boss result %s with current recording references', kind => {
      // Fault injection only: delegate to the actual engine, then change one
      // final-result predicate before installation. Positive tests never spy.
      const original = combatEngine.runBattleRecorded;
      let injected = 0;
      vi.spyOn(combatEngine, 'runBattleRecorded').mockImplementation(input => {
        const actual = original(input);
        if (!input.enemyTeam.some(enemy => enemy.tier === 'chapter-boss')) return actual;
        expect(input.enemyTeam).toHaveLength(1);
        expect(actual.result.winner).toBe('player');
        const boss = required(actual.result.enemyTeam[0]);
        expect(boss.life).toBeLessThanOrEqual(0);
        injected++;
        const altered = kind === 'alive' ? { ...boss, life: 1 }
          : kind === 'wrong-side' ? { ...boss, side: 'player' as const }
          : kind === 'wrong-kind' ? { ...boss, kind: 'summon' as const }
          : kind === 'wrong-tier' ? { ...boss, tier: 'boss' as const }
          : { ...boss, id: 'different-final-boss-instance' };
        return { ...actual, result: { ...actual.result,
          enemyTeam: kind === 'missing' ? [] : [altered] } };
      });
      track(); reachFinal(); expect(injected).toBe(1);
      const installed = useCombatStore.getState(); const before = progress();
      drain();
      expect(useCombatStore.getState().outcome).toBe(installed.outcome);
      expect(useCombatStore.getState().recordedEvents).toBe(installed.recordedEvents);
      expect(advanceWaveOrFinish()).toBe('victory');
      expect(progress()).toBe(before);
    });
});


describe('qualified Summoner settlement leaves the journal for an explicit interaction', () => {
  const quest = 'quests/act2-arcane-sanctuary';
  const area = 'areas/act2-arcane-sanctuary';
  const initial = { id: quest, status: 'inProgress' as const,
    objectives: { 'obj-find-summoner': false, 'obj-read-journal': false }, rewardClaimed: false };
  function trackSummoner(): void { useMapStore.getState().updateQuestProgress(quest, initial); }
  function reachSummoner(): number {
    const total = start(area, 2); let xp = 0;
    for (let wave = 1; wave <= total; wave++) {
      const outcome = required(useCombatStore.getState().outcome);
      expect(outcome.winner).toBe('player');
      xp += outcome.finalEnemyTeam.filter(enemy => enemy.life <= 0 && enemy.kind !== 'summon')
        .reduce((sum, enemy) => sum + xpForKill(enemy.level), 0);
      if (wave === total) break;
      drain(); expect(advanceWaveOrFinish()).toBe('next-wave');
    }
    return xp;
  }

  it('credits the actual recorded kill after playback, persists partial progress and refuses claim', () => {
    trackSummoner(); const xp = reachSummoner();
    const final = required(useCombatStore.getState().outcome);
    expect(final.finalEnemyTeam.some(enemy => enemy.monsterArchetypeId === 'monsters/act2.the-summoner' && enemy.life <= 0)).toBe(true);
    expect(advanceWaveOrFinish()).toBe('idle');
    expect(useMapStore.getState().questProgress[quest]).toEqual(initial);
    // UI navigation does not replace the trusted active-run context.
    useMapStore.getState().setCurrentLocation(1, AREA);
    drain(); expect(advanceWaveOrFinish()).toBe('victory');
    const partial = { ...initial, objectives: { 'obj-find-summoner': true, 'obj-read-journal': false } };
    expect(useMapStore.getState().questProgress[quest]).toEqual(partial);
    const saved = decodeSave(JSON.parse(required(exportCurrentSave())) as unknown);
    expect(saved.map.questProgress[quest]).toEqual(partial);
    expect(xpTotal(saved.player.level) + saved.player.experience).toBe(xp);
    expect(useMapStore.getState().isActUnlocked(3)).toBe(false);
    const before = required(snapshotStores());
    expect(claimQuestReward(quest)).toBe('not-completed');
    expect(advanceWaveOrFinish()).toBe('idle');
    expect(snapshotStores()).toEqual(before);
  });

  it('does not credit another area, including a different genuine named mini-boss', () => {
    trackSummoner(); const total = start('areas/act2-far-oasis', 2);
    for (let wave = 1; wave <= total; wave++) {
      expect(useCombatStore.getState().outcome?.winner).toBe('player'); drain();
      expect(advanceWaveOrFinish()).toBe(wave === total ? 'victory' : 'next-wave');
    }
    expect(useMapStore.getState().questProgress[quest]).toEqual(initial);
  });

  it('cannot retroactively credit a settled untracked kill', () => {
    reachSummoner(); drain(); expect(advanceWaveOrFinish()).toBe('victory');
    expect(useMapStore.getState().questProgress[quest]).toBeUndefined();
    trackSummoner(); expect(advanceWaveOrFinish()).toBe('idle');
    expect(useMapStore.getState().questProgress[quest]).toEqual(initial);
  });

  it('does not credit an abandoned current recording', () => {
    trackSummoner(); reachSummoner(); drain(); abortSubAreaRun();
    expect(advanceWaveOrFinish()).toBe('idle');
    expect(useMapStore.getState().questProgress[quest]).toEqual(initial);
  });

  it.each(['clone-outcome', 'clone-events'] as const)('rejects stale %s references', kind => {
    trackSummoner(); reachSummoner(); const current = useCombatStore.getState(); drain();
    useCombatStore.setState(kind === 'clone-outcome' ? { outcome: { ...required(current.outcome) } }
      : { recordedEvents: [...current.recordedEvents] });
    refuseCompletion(); expect(useMapStore.getState().questProgress[quest]).toEqual(initial);
  });

  it('does not credit a draw even if a dead Summoner appears in the final recording', () => {
    const original = combatEngine.runBattleRecorded;
    vi.spyOn(combatEngine, 'runBattleRecorded').mockImplementation(input => {
      const actual = original(input);
      return input.enemyTeam.some(enemy => enemy.tier === 'boss')
        ? { ...actual, result: { ...actual.result, winner: null } } : actual;
    });
    trackSummoner(); const total = start(area, 2);
    for (let wave = 1; wave < total; wave++) { drain(); expect(advanceWaveOrFinish()).toBe('next-wave'); }
    expect(useCombatStore.getState().outcome?.winner).toBeNull();
    drain(); expect(advanceWaveOrFinish()).toBe('defeat');
    expect(useMapStore.getState().questProgress[quest]).toEqual(initial);
  });
});
