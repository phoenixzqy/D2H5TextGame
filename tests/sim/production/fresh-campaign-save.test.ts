import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { createCharacter } from '@/features/character/createCharacter';
import { loadMercHireRoster } from '@/data/loaders/mercs';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMercStore } from '@/stores/mercStore';
import { useMapStore } from '@/stores/mapStore';
import { useFormationStore } from '@/stores/formationStore';
import type { Item } from '@/engine/types/items';
import { useHydrationStore } from '@/stores/hydrationStore';
import { mkdtempSync, readFileSync, readdirSync, unlinkSync, rmdirSync, existsSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { captureEarnedRestorers, observeEarnedState, resetEarnedStores } from './earned-state';
import { captureFreshNativeSave, publishFreshNativeCapture, publishFreshCampaignReport } from './fresh-campaign-save';
import { hashObservation } from './earned-report';
import { collectSourceState } from './provenance';

const epoch = 1792497600000;
let restorers: (() => void)[];
beforeEach(() => {
  restorers = captureEarnedRestorers();
  vi.spyOn(Date, 'now').mockReturnValue(epoch);
  resetEarnedStores();
  useHydrationStore.getState().setStatus('ready');
});
afterEach(() => {
  for (const restore of restorers) restore();
  vi.restoreAllMocks();
});

/** Explicit synthetic contract fixture: no combat, campaign replay or earned-resource claim. */
function liveFixture() {
  expect(createCharacter('Capture contract', 'sorceress').ok).toBe(true);
  const merc = loadMercHireRoster()[0]?.mercs.find(entry => entry.id === 'mercs/act1-rogue-inner-sight');
  expect(merc).toBeDefined();
  if (!merc) throw new Error('Missing ordinary fixture Rogue');
  expect(useMercStore.getState().hireMerc(merc).ok).toBe(true);
  const item: Item = { id: 'it-1-c', baseId: 'items/base/glove-leather', rarity: 'normal',
    level: 2, ilvl: 2, identified: true, equipped: false, baseRolls: { defense: 4 },
    affixes: [], generatedName: {}, socketCapacity: 1 };
  useInventoryStore.getState().addItem(item);
  useInventoryStore.getState().addCurrency('rune-shard', 17);
  useMapStore.setState({ challengeOrdinals: { normal: 108, nightmare: 0, hell: 0 } });
  useFormationStore.getState().setPlayerPosition({ row: 0, col: 2 });
  return item;
}

it('captures live native save/export before cleanup without changing domains or retaining live references', () => {
  const item = liveFixture();
  const before = observeEarnedState();
  const liveItem = useInventoryStore.getState().backpack[0];
  const capture = captureFreshNativeSave();
  expect(capture.status, capture.failure ?? undefined).toBe('captured');
  expect(capture.beforeHash).toBe(hashObservation(before));
  expect(capture.afterHash).toBe(capture.beforeHash);
  expect(observeEarnedState()).toEqual(before);
  expect(capture.snapshot?.inventory.backpack).toEqual([item]);
  expect(capture.snapshot?.inventory.backpack[0]).not.toBe(liveItem);
  expect(capture.snapshot?.map.challengeOrdinals).toEqual({ normal: 108, nightmare: 0, hell: 0 });
  expect(capture.snapshot?.formation.playerPosition).toEqual({ row: 0, col: 2 });
  expect(capture.snapshot?.mercs.fieldedMercId).toBe('mercs/act1-rogue-inner-sight');
  expect(capture.snapshot?.inventory.currencies['rune-shard']).toBe(17);
  expect(capture.snapshot?.inventory.questServices).toEqual({});
  expect(capture.snapshot?.map.questReceipts).toEqual({});
  expect(capture.decodedHash).toBe(capture.snapshotHash);
  expect(JSON.parse(capture.exportedJson ?? 'null')).toEqual(capture.snapshot);
  const retainedHash = hashObservation(capture);
  resetEarnedStores(); // Models the screen's outer realm cleanup after the authentic capture.
  expect(hashObservation(capture)).toBe(retainedHash);
  expect(capture.snapshot?.player.name).toBe('Capture contract');
});

it('retains a capture refusal without inventing a save when no character exists', () => {
  const capture = captureFreshNativeSave();
  expect(capture.status).toBe('failed');
  expect(capture.failure).toContain('requires a live character');
  expect(capture.snapshot).toBeNull();
  expect(capture.exportedJson).toBeNull();
  expect(capture.beforeHash).toBe(capture.afterHash);
});

it('preserves raw native snapshot and export when the native decoder refuses corrupt item state', () => {
  const item = liveFixture();
  useInventoryStore.setState({ backpack: [{ ...item, socketCapacity: -1 }] });
  const capture = captureFreshNativeSave();
  expect(capture.status).toBe('failed');
  expect(capture.failure).toMatch(/socket/i);
  expect(capture.snapshot?.inventory.backpack[0]?.socketCapacity).toBe(-1);
  expect(JSON.parse(capture.exportedJson ?? 'null') as unknown)
    .toMatchObject({ inventory: { backpack: [{ socketCapacity: -1 }] } });
  expect(capture.decoded).toBeNull();
  expect(capture.beforeHash).toBe(capture.afterHash);
});

it('reports projected idle metadata differences while preserving both native captures', () => {
  liveFixture();
  vi.mocked(Date.now).mockReturnValue(epoch + 1000);
  const capture = captureFreshNativeSave();
  expect(capture.status).toBe('failed');
  expect(capture.failure).toContain('Native decoder changed the captured save');
  expect(capture.snapshot?.meta.idleState.lastOnline).toBe(epoch);
  expect(capture.decoded?.meta.idleState.lastOnline).toBe(epoch + 1000);
  expect(capture.snapshotHash).not.toBe(capture.decodedHash);
  expect(capture.idleMetadata.matches).toBe(false);
  expect(capture.idleMetadata.equalOutsideIdleMetadata).toBe(true);
  expect(capture.exportedJson).not.toBeNull();
  expect(capture.beforeHash).toBe(capture.afterHash);
});

it.each([false, true])('keeps native evidence through report failure, including decoder refusal=%s', corrupt => {
  const item = liveFixture();
  if (corrupt) useInventoryStore.setState({ backpack: [{ ...item, socketCapacity: -1 }] });
  const capture = captureFreshNativeSave();
  expect(capture.status).toBe(corrupt ? 'failed' : 'captured');
  const scratch = mkdtempSync(join(tmpdir(), 'd2h5-native-capture-contract-'));
  const output = join(scratch, 'report.json');
  const cyclic: Record<string, unknown> = {};
  cyclic.self = cyclic;
  try {
    const artifacts = publishFreshNativeCapture(process.cwd(), output, capture, { campaignStop: 'synthetic-contract' });
    resetEarnedStores();
    expect(() => publishFreshCampaignReport(process.cwd(), output, { cyclic }, artifacts))
      .toThrow('retained native evidence');
    expect(existsSync(output)).toBe(false);
    expect(readFileSync(`${output}.native-export.json`, 'utf8')).toBe(capture.exportedJson);
    expect(JSON.parse(readFileSync(`${output}.native-capture.json`, 'utf8')) as unknown)
      .toMatchObject({ capture: { snapshotHash: capture.snapshotHash, failure: capture.failure } });
    expect(readdirSync(scratch).sort()).toEqual(['report.json.native-capture.json', 'report.json.native-export.json']);
  } finally {
    for (const path of [`${output}.native-export.json`, `${output}.native-capture.json`])
      if (existsSync(path)) unlinkSync(path);
    rmdirSync(scratch);
    expect(existsSync(scratch)).toBe(false);
  }
});

it.each(['throw', 'output-race'] as const)('preserves a synthetic stop and restores the realm when native publication fails: %s', async mode => {
  // Refuse hire before any combat entry. This is fault injection, never campaign evidence.
  useMercStore.setState({ hireMerc: () => ({ ok: false, reason: 'already-owned' }) });
  const caller = observeEarnedState();
  const originalNow = Date.now;
  const source = collectSourceState(process.cwd());
  const { runFreshCampaignScreen } = await import('./fresh-campaign-screen');
  const scratch = mkdtempSync(join(tmpdir(), 'd2h5-native-stop-contract-'));
  const output = join(scratch, 'report.json');
  try {
    const report = runFreshCampaignScreen('native17-v2-far-oasis', source, (capture, context) => {
      if (mode === 'throw') throw new Error('Synthetic publication hook failure');
      writeFileSync(`${output}.native-capture.json`, 'Synthetic output race', { flag: 'wx' });
      publishFreshNativeCapture(process.cwd(), output, capture, context);
    });
    expect(report.status).toBe('action-refused');
    expect(report.refusal).toEqual({ action: 'hire-merc', result: { ok: false, reason: 'already-owned' } });
    expect(report.waves).toEqual([]);
    expect(report.nativePublicationFailure).toContain(mode === 'throw' ? 'Synthetic publication hook failure' : 'Native capture publication failed');
    expect(report.nativeSaveCapture?.status).toBe('captured');
    expect(observeEarnedState()).toEqual(caller);
    expect(Date.now).toBe(originalNow);
    publishFreshCampaignReport(process.cwd(), output, report);
    expect(JSON.parse(readFileSync(output, 'utf8')) as unknown).toMatchObject({ status: 'action-refused',
      refusal: report.refusal, nativePublicationFailure: report.nativePublicationFailure });
    // An existing primary leaf models a second write failure without overwriting evidence.
    expect(() => publishFreshCampaignReport(process.cwd(), output, report))
      .toThrow('original stop: {"status":"action-refused","refusal":{"action":"hire-merc"');
  } finally {
    for (const path of [output, `${output}.native-export.json`, `${output}.native-capture.json`])
      if (existsSync(path)) unlinkSync(path);
    rmdirSync(scratch);
    expect(existsSync(scratch)).toBe(false);
  }
});
