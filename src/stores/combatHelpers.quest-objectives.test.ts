/** BUG049: real imported wiring fixture; never an earned boss/balance claim. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { claimQuestReward } from '@/features/quests/claimReward';
import { xpForKill, xpTotal } from '@/engine/progression/xp';
import { decodeSave } from '@/engine/save/validate';
import * as combatEngine from '@/engine/combat/combat';
import { abortSubAreaRun, advanceWaveOrFinish, refreshActivePlayerCombatConfig, startSubAreaRun } from './combatHelpers';
import { useCombatStore } from './combatStore';
import { useFormationStore } from './formationStore';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useMercStore } from './mercStore';
import { useMetaStore } from './metaStore';
import { __resetPersistenceForTests, exportCurrentSave, snapshotStores, useHydrationStore } from './persistence';
import { usePlayerStore } from './playerStore';

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
beforeEach(() => { reset(); vi.spyOn(Date, 'now').mockReturnValue(1792454400000); });
afterEach(() => { reset(); vi.restoreAllMocks(); });
function track(): void {
  useMapStore.getState().updateQuestProgress(QUEST, {
    status: 'inProgress', objectives: { 'obj-kill-andariel': false }, rewardClaimed: false
  });
}
function progress() { return useMapStore.getState().questProgress[QUEST]; }
function start(area = AREA): number {
  const player = createMockPlayer('BossQuestWiring', 'sorceress');
  usePlayerStore.getState().setPlayer({ ...player, comboOrder: [] });
  // Imported canonical gear and explicit fixture refill, not earned power.
  const gear = { id: 'boss-quest-imported-cap', baseId: 'items/base/helm-cap',
    rarity: 'rare' as const, level: 1, identified: true, equipped: false,
    affixes: [{ affixId: 'imported-wiring-fixture', values: new Map([
      ['statMods.attack', 99978], ['statMods.defense', 99973], ['statMods.life', 999880]
    ]) }] };
  useInventoryStore.getState().addItem(gear);
  expect(useInventoryStore.getState().equipItem(gear)).toEqual({ ok: true });
  const equipped = required(usePlayerStore.getState().player);
  usePlayerStore.getState().setPlayer({ ...equipped, derivedStats: {
    ...equipped.derivedStats, life: 1_000_000, mana: player.derivedStats.mana } });
  return required(startSubAreaRun({ subAreaId: area, act: 1, runSeed: 7,
    challengeOrdinal: 0 })).totalWaves;
}
function drain(): void {
  const events = useCombatStore.getState().recordedEvents;
  events.forEach(() => { useCombatStore.getState().advanceEvent(); });
  expect(useCombatStore.getState().playbackComplete).toBe(true);
}
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
      expect(advanceWaveOrFinish()).toBe('victory'); // Existing clear policy is unchanged.
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
      expect(advanceWaveOrFinish()).toBe('victory');
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
    expect(advanceWaveOrFinish()).toBe('victory');
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
