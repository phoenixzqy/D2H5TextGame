/** Earned input, ordinary crafting/equipment, separate synthetic engine control; no campaign launch. */
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { decodeSave } from '@/engine/save/validate';
import { toJsonSafe } from '@/engine/save/serialize';
import { runBattleRecorded } from '@/engine/combat/combat';
import type { CombatUnit } from '@/engine/combat/types';
import type { SaveCurrent } from '@/engine/types/save';
import { importIntoStores, snapshotStores, __resetPersistenceForTests } from './persistence';
import { prepareLiveMaterialAction, previewLiveMaterialAction, executeLiveMaterialAction } from './materialActions';
import { playerToCombatUnit, abortSubAreaRun } from './combatHelpers';
import { useInventoryStore } from './inventoryStore';
import { usePlayerStore } from './playerStore';
import { useMapStore } from './mapStore';
import { useMercStore } from './mercStore';
import { useCombatStore } from './combatStore';
import { useMetaStore } from './metaStore';
import { useFormationStore } from './formationStore';
import { useHydrationStore } from './hydrationStore';

let disk: SaveCurrent | null = null;
vi.mock('./save-adapter', () => ({
  saveSave: (save: SaveCurrent) => { disk = structuredClone(save); return Promise.resolve(); },
  loadSave: () => Promise.resolve(disk && decodeSave(disk)), hasSave: () => Promise.resolve(disk !== null),
  deleteSave: () => { disk = null; return Promise.resolve(); }
}));
const stores = [useInventoryStore, usePlayerStore, useMapStore, useMercStore, useCombatStore, useMetaStore, useFormationStore] as const;
beforeEach(() => {
  __resetPersistenceForTests(); abortSubAreaRun(); disk = null;
  for (const store of stores) store.getState().reset();
  useHydrationStore.getState().setStatus('ready');
});
afterEach(() => {
  __resetPersistenceForTests(); abortSubAreaRun();
  for (const store of stores) store.getState().reset();
  useHydrationStore.getState().setStatus('idle');
});
function hero() {
  const player = usePlayerStore.getState().player;
  if (!player) throw new Error('Missing earned hero');
  return player;
}
function bagItem(id: string) {
  const item = useInventoryStore.getState().backpack.find(item => item.id === id);
  if (!item) throw new Error(`Missing earned item ${id}`);
  return item;
}
it('carries the real earned Eld shield through live transactions into an immutable recorded engine input', async () => {
  const bytes = readFileSync('docs/plans/evidence/fixtures/earned-materials-browser/retained-earned-export.json.gz');
  const raw = gunzipSync(bytes).toString('utf8');
  expect(createHash('sha256').update(bytes).digest('hex')).toBe('1de7b2371224cd09d2b1baad532416bad2e4ac19f0719e2dcf64fec9c05c0c8c');
  expect(createHash('sha256').update(raw).digest('hex')).toBe('f68fb4988f388f493e54a279c4d0b9bbe2e6ad2f091b4ede886987d39e9dc10a');
  await importIntoStores(raw);
  const baseline = snapshotStores();
  expect(baseline?.inventory.materials['runes/eld']).toBe(1);
  expect(hero().derivedStats).toMatchObject({ life: 120, mana: 102, physDodge: .19 });
  expect(useInventoryStore.getState().equipItem(bagItem('it-1u1tx-af'))).toEqual({ ok: true });
  const request = prepareLiveMaterialAction({ recipeId: 'actions/socket-insert', itemIds: ['it-1u1tx-10g'], materialId: 'runes/eld' });
  const before = toJsonSafe(snapshotStores()?.inventory);
  expect(previewLiveMaterialAction(request).result).toEqual({ itemId: 'it-1u1tx-10g', materials: {}, currencies: {} });
  expect(toJsonSafe(snapshotStores()?.inventory)).toEqual(before);
  expect(executeLiveMaterialAction(request).replay).toBe(false);
  expect(hero().derivedStats).toMatchObject({ life: 120, mana: 102, physDodge: .19 });
  expect(useInventoryStore.getState().equipItem(bagItem('it-1u1tx-10g'))).toEqual({ ok: true });
  const input = playerToCombatUnit(hero());
  expect(input.stats).toEqual({ ...baseline?.player.derivedStats, physDodge: .26 });
  expect(input.life).toBe(120); expect(input.mana).toBe(102);
  expect(hero().skillLevels).toEqual(baseline?.player.skillLevels);
  expect(useMapStore.getState().challengeOrdinals).toEqual({ normal: 253, nightmare: 0 });
  expect(snapshotStores()?.inventory.latestMaterialAction).toEqual({ ordinal: 1, requestHash: request.requestHash,
    result: { itemId: 'it-1u1tx-10g', materials: {}, currencies: {} } });
  expect(snapshotStores()?.inventory.materials).toEqual({ 'gems/skull/chipped': 2,
    'gems/sapphire/flawed': 2, 'gems/amethyst/flawed': 1, 'gems/skull/flawed': 2 });
  // Synthetic opponent only: neither reward settlement nor a native campaign ordinal is invoked.
  const opponent: CombatUnit = { ...input, id: 'socket-projection-control', name: 'Control', side: 'enemy', kind: 'monster',
    life: 1000, mana: 0, skillOrder: [],
    stats: { ...input.stats, life: 1000, lifeMax: 1000, attack: 20, defense: 0, physDodge: 0 } };
  const snapshot = { seed: 7, playerTeam: [input], enemyTeam: [opponent] };
  const frozen = structuredClone(snapshot), durable = toJsonSafe(snapshotStores()?.inventory);
  const recording = runBattleRecorded(snapshot);
  expect(recording.result.playerTeam.find(unit => unit.id === input.id)?.stats.physDodge).toBe(.26);
  expect(recording.events.some(event => event.kind === 'damage' && event.target === input.id)).toBe(true);
  expect(runBattleRecorded(snapshot)).toEqual(recording);
  expect(snapshot).toEqual(frozen);
  expect(toJsonSafe(snapshotStores()?.inventory)).toEqual(durable);
  expect(useMapStore.getState().challengeOrdinals).toEqual({ normal: 253, nightmare: 0 });
});
