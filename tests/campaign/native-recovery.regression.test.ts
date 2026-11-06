/** Native terminal Return/reentry; constructed persistent sentinels are not campaign acceptance. */
import assert from 'node:assert/strict';
import { beforeEach, afterEach, expect, it } from 'vitest';
import { createCharacter } from '@/features/character/createCharacter';
import { loadMercHireRoster } from '@/data/loaders/mercs';
import { ACT5_ENCOUNTERS } from '@/engine/map/act5-admission';
import { useMercStore } from '@/stores/mercStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { useMetaStore } from '@/stores/metaStore';
import { useCombatStore } from '@/stores/combatStore';
import { useHydrationStore } from '@/stores/hydrationStore';
import { hasActiveSubAreaRun, abortSubAreaRun } from '@/stores/combatHelpers';
import { getIdleEliteMisses, setIdleEliteMisses } from '@/stores/idleElitePity';
import { captureEarnedRestorers, earnedDelta, observeEarnedState, resetEarnedStores } from '../sim/production/earned-state';
import { playEarnedTarget } from '../sim/production/earned-playback';
import { startCampaignAdmission } from './admission';
import { returnCampaignToMap } from './actions';

let restores: (() => void)[], pity: number;
beforeEach(() => {
  restores = captureEarnedRestorers(); pity = getIdleEliteMisses(); resetEarnedStores();
  useHydrationStore.getState().setStatus('ready');
  expect(createCharacter('Native recovery', 'sorceress').ok).toBe(true);
  const merc = loadMercHireRoster().find(row => row.act === 1)?.mercs
    .find(row => row.id === 'mercs/act1-rogue-inner-sight');
  assert.ok(merc); expect(useMercStore.getState().hireMerc(merc).ok).toBe(true);
});
afterEach(() => { abortSubAreaRun(); setIdleEliteMisses(pity); for (const restore of restores) restore(); });

it('retains failed-wave ownership and refills hero/merc only through fresh native W1 admission', () => {
  // Nonempty test-owned sentinels make conservation meaningful.
  useInventoryStore.getState().addCurrency('rune-shard', 17);
  useInventoryStore.getState().addMaterials({ 'materials/scrap': 3 });
  const siege = ACT5_ENCOUNTERS.find(row => row.questId === 'quests/act5-siege-on-harrogath');
  assert.ok(siege);
  useMapStore.getState().updateQuestProgress(siege.questId, { status: 'completed', rewardClaimed: true,
    objectives: { [siege.objectiveId]: true } });
  useMapStore.setState({ questReceipts: { [siege.proof]: true } });
  useInventoryStore.setState({ questServices: {
    [`${siege.questId}#reward:service`]: { serviceId: 'socket_item', state: 'available' }
  } });
  const first = startCampaignAdmission(1, 'areas/act1-catacombs');
  const played = playEarnedTarget(first.handle), terminal = played.waves.at(-1);
  assert.ok(terminal);
  expect(played.terminalAdvance).toBe('defeat');
  expect(terminal.actualDelta).toEqual(earnedDelta(terminal.beforeAward, terminal.beforeAward));
  expect(terminal.afterAward).toEqual(terminal.beforeAward);
  expect(terminal.played.outcome?.finalPlayerTeam.find(unit => unit.kind === 'hero')?.life).toBe(0);
  // Hero death may end combat while the merc lives. Explicitly deplete only this
  // outgoing combat projection so the merc refill assertion is nonvacuous too.
  useCombatStore.setState({ playerTeam: useCombatStore.getState().playerTeam.map(unit =>
    unit.kind === 'merc' ? { ...unit, life: 0, mana: 0 } : unit) });
  const persistent = observeEarnedState();
  useMetaStore.getState().setIdleTarget('a1-catacombs'); setIdleEliteMisses(9);
  returnCampaignToMap();
  expect(hasActiveSubAreaRun()).toBe(false); expect(useCombatStore.getState().inCombat).toBe(false);
  expect(useMetaStore.getState().idleState.idleTarget).toBeUndefined(); expect(getIdleEliteMisses()).toBe(0);
  expect(observeEarnedState()).toEqual(persistent);
  const beforeAdmission = observeEarnedState();
  const second = startCampaignAdmission(1, 'areas/act1-catacombs');
  expect(second.handle.challengeOrdinal).toBe(first.handle.challengeOrdinal + 1);
  expect(second.handle.runSeed).not.toBe(first.handle.runSeed);
  expect(useCombatStore.getState().currentWave).toBe(1);
  const actors = useCombatStore.getState().playerTeam.filter(unit => unit.kind === 'hero' || unit.kind === 'merc');
  expect(actors.map(unit => unit.kind).sort()).toEqual(['hero', 'merc']);
  for (const actor of actors) { expect(actor.life).toBe(actor.stats.lifeMax); expect(actor.mana).toBe(actor.stats.manaMax); }
  const after = observeEarnedState();
  expect(after.player).toEqual(beforeAdmission.player);
  expect(after.inventory).toEqual(beforeAdmission.inventory);
  expect(after.merc).toEqual(beforeAdmission.merc);
  expect(after.map).toEqual({ ...beforeAdmission.map, challengeOrdinals: {
    ...beforeAdmission.map.challengeOrdinals, normal: beforeAdmission.map.challengeOrdinals.normal + 1 } });
});

it('rejects Return before native settlement without altering the installed wave', () => {
  startCampaignAdmission(1, 'areas/act1-blood-moor');
  const state = observeEarnedState(), events = useCombatStore.getState().recordedEvents;
  expect(returnCampaignToMap).toThrow('Recovery requires a settled terminal run');
  expect(observeEarnedState()).toEqual(state);
  expect(useCombatStore.getState().recordedEvents).toBe(events);
  expect(hasActiveSubAreaRun()).toBe(true);
});
