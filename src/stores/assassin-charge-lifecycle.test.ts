import { afterEach, beforeEach, expect, it, vi } from 'vitest';
// Persistence I/O only is faked; save validation, allocation and combat are real.
vi.mock('@/stores/save-adapter', () => ({
  hasSave: vi.fn(),
  loadSave: vi.fn(),
  saveSave: vi.fn(() => Promise.resolve(undefined)),
  deleteSave: vi.fn()
}));
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { resetRegistry, loadDefaultSkills } from '@/engine/skills/registry';
import { toJsonSafe } from '@/engine/save';
import type { Item } from '@/engine/types/items';
import {
  abortSubAreaRun,
  advanceWaveOrFinish,
  playerToCombatUnit,
  startSubAreaRun
} from '@/stores/combatHelpers';
import { snapshotStores, importIntoStores, __resetPersistenceForTests } from '@/stores/persistence';
import { useCombatStore } from '@/stores/combatStore';
import { usePlayerStore } from '@/stores/playerStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { useMercStore } from '@/stores/mercStore';
import { useFormationStore } from '@/stores/formationStore';
import { useMetaStore } from '@/stores/metaStore';
import { useHydrationStore } from '@/stores/hydrationStore';

const stores = [
  useCombatStore,
  usePlayerStore,
  useInventoryStore,
  useMapStore,
  useMercStore,
  useFormationStore,
  useMetaStore
] as const;
function reset() {
  __resetPersistenceForTests();
  abortSubAreaRun();
  for (const store of stores) store.getState().reset();
}
function player() {
  const value = usePlayerStore.getState().player;
  if (!value) throw new Error('Missing functional Assassin');
  return value;
}
function hero() {
  const value = useCombatStore.getState().playerTeam[0];
  if (!value) throw new Error('Missing native wave');
  return value;
}
function recording() {
  const s = useCombatStore.getState();
  return structuredClone({
    team: s.playerTeam,
    events: s.recordedEvents,
    outcome: s.outcome,
    cursor: s.eventCursor,
    rewards: s.runRewards
  });
}
/** Constructed level/pool/Attack/critical equipment; never earned balance. */
function arrange() {
  const fresh = createMockPlayer('Synthetic charges lifecycle fixture', 'assassin');
  usePlayerStore.getState().setPlayer({
    ...fresh,
    level: 30,
    skillPoints: 29,
    comboOrder: [],
    skillLevels: {}
  });
  const cap: Item = {
    id: 'charges-fixture-pool-cap',
    baseId: 'items/base/helm-cap',
    rarity: 'rare',
    level: 1,
    identified: true,
    equipped: false,
    socketCapacity: 0,
    affixes: [
      {
        affixId: 'fixture-imported',
        values: new Map([
          ['statMods.life', 999000],
          ['statMods.mana', 999000],
          ['statMods.attack', 1000],
          ['statMods.attackSpeed', 100],
          ['statMods.critChance', 1000]
        ])
      }
    ]
  };
  useInventoryStore.getState().addItem(cap);
  expect(useInventoryStore.getState().equipItem(cap)).toEqual({ ok: true });
}
beforeEach(() => {
  reset();
  useHydrationStore.getState().setStatus('ready');
  resetRegistry();
  loadDefaultSkills();
  vi.spyOn(Date, 'now').mockReturnValue(1792454400000);
});
afterEach(() => {
  reset();
  useHydrationStore.getState().setStatus('idle');
  resetRegistry();
  loadDefaultSkills();
  vi.restoreAllMocks();
});
function drain() {
  const count = useCombatStore.getState().recordedEvents.length;
  for (let i = 0; i < count; i++) useCombatStore.getState().advanceEvent();
  expect(useCombatStore.getState().playbackComplete).toBe(true);
}
function finalHero() {
  const value = useCombatStore.getState().outcome?.finalPlayerTeam[0];
  if (!value) throw new Error('Missing native attack outcome');
  return value;
}

import { prepareTownRespec, executeTownRespec } from '@/stores/respecActions';
const TIGER='skills-assassin-tiger-strike',TALON='skills-assassin-dragon-talon';
function learn() {
  expect(usePlayerStore.getState().allocateSkillPoint(TIGER)).toBe('ok');
  expect(usePlayerStore.getState().allocateSkillPoint(TALON)).toBe('ok');
  usePlayerStore.getState().setComboOrder([TIGER,TALON]);
}
function assertFreshPaidWave(rank:1|2) {
  const state=useCombatStore.getState(),id=hero().id;
  expect(hero().assassinMartialRanks).toEqual({ 'assassin.tiger_strike':rank,'assassin.dragon_talon':1 });
  const first=state.recordedEvents.find(e=>e.kind==='status-state' && e.target===id && e.initial);
  expect(first?.kind).toBe('status-state');
  if(first?.kind!=='status-state')throw new Error('Missing native initial status observation');
  expect(first.statuses.some(s=>s.id.startsWith('charge-'))).toBe(false);
  const gains=state.recordedEvents.filter(e=>e.kind==='status-state').filter(e=>e.target===id &&
    e.statuses.some(s=>s.id==='charge-tiger-strike'));
  expect(gains.length).toBeGreaterThan(0);
  expect(gains[0]?.statuses.find(s=>s.id==='charge-tiger-strike')?.stacks).toBe(1);
  expect(state.recordedEvents.some(e=>e.kind==='action' && e.actor===id && e.skillId==='assassin.tiger_strike')).toBe(true);
  expect(state.recordedEvents.some(e=>e.kind==='mana' && e.target===id && e.reason==='cast')).toBe(true);
  expect(state.outcome?.winner).toBe('player');
}
it('captures allocations only next wave, carries real resources and starts each paid charge pool empty',()=>{
  arrange();expect(startSubAreaRun({runSeed:7,challengeOrdinal:0})?.totalWaves).toBeGreaterThan(2);
  const first=recording(),firstFinal=structuredClone(finalHero());
  learn();expect(recording()).toEqual(first);
  expect(hero().assassinMartialRanks).toEqual({});
  drain();expect(advanceWaveOrFinish()).toBe('next-wave');
  expect([hero().life,hero().mana]).toEqual([firstFinal.life,firstFinal.mana]);
  assertFreshPaidWave(1);
  const paid=recording(),paidFinal=structuredClone(finalHero());
  expect(usePlayerStore.getState().allocateSkillPoint(TIGER)).toBe('ok');
  expect(recording()).toEqual(paid);
  drain();expect(advanceWaveOrFinish()).toBe('next-wave');
  expect([hero().life,hero().mana]).toEqual([paidFinal.life,paidFinal.mana]);
  assertFreshPaidWave(2);
});
it('persists learned rank/priority through real import without storing paid charge or captured runtime authority',async()=>{
  arrange();learn();expect(startSubAreaRun({runSeed:7,challengeOrdinal:0})).toBeTruthy();assertFreshPaidWave(1);
  const save=snapshotStores();if(!save)throw new Error('Missing native charge save');
  const expected=playerToCombatUnit(player()),json=JSON.stringify(toJsonSafe(save));
  for(const key of ['assassinMartialRanks','charge-tiger-strike','martialCharges','recordedEvents'])expect(json).not.toContain('"'+key+'"');
  await importIntoStores(json);
  expect(player()).toEqual(save.player);expect(playerToCombatUnit(player())).toEqual(expected);
  expect(toJsonSafe(snapshotStores()?.inventory)).toEqual(toJsonSafe(save.inventory));
  expect(useCombatStore.getState().playerTeam).toEqual([]);expect(useCombatStore.getState().enemyTeam).toEqual([]);
  expect(useCombatStore.getState().recordedEvents).toEqual([]);
  expect(startSubAreaRun({runSeed:7,challengeOrdinal:0})).toBeTruthy();assertFreshPaidWave(1);
});
it('rejects active-wave town respec then removes fresh charge/finisher permission after actual town respec',()=>{
  arrange();learn();expect(startSubAreaRun({runSeed:7,challengeOrdinal:0})).toBeTruthy();assertFreshPaidWave(1);
  const before=recording();expect(prepareTownRespec('npc/akara','skill').kind).toBe('combat-active');expect(recording()).toEqual(before);
  abortSubAreaRun();useCombatStore.getState().endCombat();
  const quote=prepareTownRespec('npc/akara','skill');expect(quote.kind).toBe('ok');
  if(quote.kind!=='ok')throw new Error(quote.kind);
  expect(executeTownRespec(quote.request)).toBe('ok');
  expect(player().skillLevels).toEqual({});expect(player().comboOrder).toEqual([]);
  expect(playerToCombatUnit(player()).assassinMartialRanks).toEqual({});
  expect(startSubAreaRun({runSeed:7,challengeOrdinal:0})).toBeTruthy();
  expect(useCombatStore.getState().recordedEvents.some(e=>e.kind==='status-state' && e.statuses.some(s=>s.id.startsWith('charge-')))).toBe(false);
  const actions=useCombatStore.getState().recordedEvents.filter(e=>e.kind==='action').filter(e=>e.actor===hero().id);
  expect(actions.length).toBeGreaterThan(0);expect(actions.every(e=>e.skillId===null)).toBe(true);
});
