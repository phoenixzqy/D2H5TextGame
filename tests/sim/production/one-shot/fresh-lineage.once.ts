/** Opt-in, permanently consumed native prefix. Never import from an ordinary test. */
import { expect, it, vi } from 'vitest';
import { closeSync, fsyncSync, openSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { SaveRecord } from '@/stores/save-adapter';
import type { SaveCurrent } from '@/engine/types/save';
import { createFreshLifetime, createFreshPolicy, freshRegistration, readFreshManifest, verifyFreshSources, withFreshAdmission } from '../fresh-lineage-policy';

// Only the Dexie boundary is emulated. No store, clock, adapter or decoder mock.
const disk = vi.hoisted(() => ({
  record: undefined as SaveRecord | undefined,
  io: [] as { operation: string; key: unknown; at: number; record: SaveRecord | null }[]
}));
vi.mock('dexie', () => ({
  default: class {
    version() {
      return { stores: () => Object.assign(this, { saves: {
        get: (key: unknown) => {
          disk.io.push({ operation: 'get', key, at: Date.now(), record: structuredClone(disk.record ?? null) });
          return Promise.resolve(structuredClone(disk.record));
        },
        put: (record: SaveRecord) => {
          disk.record = structuredClone(record);
          disk.io.push({ operation: 'put', key: record.id, at: Date.now(), record: structuredClone(record) });
          return Promise.resolve();
        },
        delete: (key: unknown) => {
          disk.io.push({ operation: 'delete', key, at: Date.now(), record: structuredClone(disk.record ?? null) });
          disk.record = undefined;
          return Promise.resolve();
        }
      } }) };
    }
  }
}));

const root = resolve(fileURLToPath(new URL('../../../..', import.meta.url)));
const packet = freshRegistration.packet;
function safe(value: unknown): unknown {
  return JSON.parse(JSON.stringify(value, (_key, item: unknown) => {
    if (item instanceof Map) return [...item.entries()];
    if (item instanceof Set) return [...item];
    if (item instanceof Error) return { name: item.name, message: item.message, stack: item.stack, cause: item.cause };
    return item;
  })) as unknown;
}
function persist(name: string, value: unknown): void {
  const fd = openSync(join(packet, name), 'wx', 0o600);
  try { writeFileSync(fd, JSON.stringify(safe(value), null, 2) + '\n'); fsyncSync(fd); }
  finally { closeSync(fd); }
  const directory = openSync(packet, 'r');
  try { fsyncSync(directory); } finally { closeSync(directory); }
}
function required<T>(value: T | null | undefined): T {
  if (value === undefined || value === null) throw new Error('Missing native value');
  return value;
}
async function realm(check: () => void) {
  check();
  const persistence = await import('@/stores/persistence'); check();
  const { usePlayerStore: player } = await import('@/stores/playerStore'); check();
  const { useInventoryStore: inventory } = await import('@/stores/inventoryStore'); check();
  const { useMapStore: map } = await import('@/stores/mapStore'); check();
  const { useMercStore: merc } = await import('@/stores/mercStore'); check();
  const { useMetaStore: meta } = await import('@/stores/metaStore'); check();
  const { useFormationStore: formation } = await import('@/stores/formationStore'); check();
  const { useCombatStore: combat } = await import('@/stores/combatStore'); check();
  const helpers = await import('@/stores/combatHelpers'); check();
  const receipts = await import('@/stores/recordedWaveReceipt'); check();
  const domains = { player, inventory, map, merc, meta, formation };
  return { persistence, player, inventory, map, merc, meta, formation, combat, helpers, receipts,
    domains: () => Object.fromEntries(Object.entries(domains).map(([name, store]) => [name, safe(store.getState())])),
    initial: () => Object.fromEntries(Object.entries(domains).map(([name, store]) => [name, safe(store.getInitialState())])) };
}
type Realm = Awaited<ReturnType<typeof realm>>;
async function quiet(current: Realm) {
  current.persistence.stopAutoSave();
  // All explicit saves/init calls are awaited; mocked table promises resolve immediately.
  // A real event-loop turn also drains already queued receipt/adapter consumers.
  await new Promise<void>(done => setTimeout(done, 0));
  const count = disk.io.length;
  await new Promise<void>(done => setTimeout(done, 0));
  expect(disk.io).toHaveLength(count);
}

it('records the sole fresh native Normal Blood Moor prefix', async ({ task, onTestFailed, onTestFinished }) => {
  const policy = createFreshPolicy();
  // A conservative action deadline precedes the unchanged5000ms test timeout.
  const lifetime = createFreshLifetime(performance.now() + 4900, () => performance.now(), () => task.result?.state === 'fail');
  onTestFailed(() => { lifetime.stop('Runner failed'); policy.stop('Runner failed'); });
  onTestFinished(() => { lifetime.stop('Runner finished'); });
  const check = () => {
    try { lifetime.check(); }
    catch (error) { policy.stop(error instanceof Error ? error.message : String(error)); throw error; }
  };
  const manifest = readFreshManifest(JSON.parse(readFileSync(join(packet, 'manifest.json'), 'utf8')) as unknown, freshRegistration);
  await withFreshAdmission(freshRegistration, manifest, async () => {
    const actions: unknown[] = [];
    let current: Realm | undefined;
    let sequence = 0;
    const action = (kind: string, detail: unknown) => {
      const event = { sequence: ++sequence, kind, at: Date.now(), detail: safe(detail) };
      actions.push(event); persist(`action-${sequence}.json`, event);
    };
    const reload = async (label: string, source: SaveCurrent) => {
      required(current).persistence.stopAutoSave();
      await quiet(required(current));
      check();
      vi.resetModules();
      current = await realm(check); check();
      await current.persistence.initPersistence();
      check();
      expect(current.persistence.useHydrationStore.getState().status).toBe('ready');
      const { resumeIdleBonus } = await import('@/engine/idle/persisted-bonus'); check();
      const { decodeSave } = await import('@/engine/save/validate'); check();
      const rewritten = decodeSave(required(disk.record).data);
      const snapshot = required(current.persistence.snapshotStores());
      persist(`${label}.json`, { source, rewrittenRecord: disk.record, snapshot, domains: current.domains(), io: disk.io });
      const expected = { ...source, timestamp: rewritten.timestamp,
        meta: { ...source.meta, idleState: resumeIdleBonus(source.meta.idleState, source.timestamp, rewritten.timestamp) } };
      expect(safe(rewritten)).toEqual(safe(expected));
      expect(safe(snapshot)).toEqual(safe({ ...expected, timestamp: snapshot.timestamp }));
      expect(current.helpers.readCombatTransitionRecovery()).toEqual({ kind: 'ready' });
      expect(current.receipts.inspectRecordedWaves()).toEqual({ currentPublished: null, pending: null });
      action(label, { sourceTimestamp: source.timestamp, resumedAt: rewritten.timestamp, snapshotTimestamp: snapshot.timestamp });
    };
    try {
      verifyFreshSources(root, manifest);
      check();
      expect(vi.isFakeTimers()).toBe(false);
      expect(vi.isMockFunction(Date.now)).toBe(false);
      expect(Function.prototype.toString.call(Date.now)).toContain('[native code]');
      expect(Function.prototype.toString.call(Date)).toContain('[native code]');
      expect(disk.record).toBeUndefined(); expect(disk.io).toEqual([]);
      current = await realm(check); check();
      const initial = current.initial();
      await current.persistence.initPersistence();
      check();
      persist('genesis.json', { initial, actual: current.domains(), combat: current.combat.getState(),
        receipts: current.receipts.inspectRecordedWaves(), hydration: current.persistence.useHydrationStore.getState(), io: disk.io });
      expect(current.persistence.useHydrationStore.getState().status).toBe('ready');
      expect(current.domains()).toEqual(initial);
      expect(current.player.getState().player).toBeNull();
      expect(current.combat.getState().inCombat).toBe(false);
      expect(current.combat.getState().recordedEvents).toEqual([]);
      expect(current.receipts.inspectRecordedWaves()).toEqual({ currentPublished: null, pending: null });
      expect(current.meta.getState().idleState.idleTarget).toBeUndefined();
      expect(current.helpers.readCombatTransitionRecovery()).toEqual({ kind: 'ready' });
      action('genesis-verified', { diskAbsent: disk.record === undefined });
      const { createCharacter } = await import('@/features/character/createCharacter'); check();
      const created = policy.act('creation', () => createCharacter('FreshLineage', 'sorceress'));
      action('creation', created); expect(created.ok).toBe(true);
      check();
      const flush = required(current.persistence.flushSave()); await flush; check();
      const { decodeSave } = await import('@/engine/save/validate'); check();
      const source = decodeSave(required(disk.record).data);
      const snapshot = required(current.persistence.snapshotStores());
      const { checkpointIdleBonus } = await import('@/engine/idle/persisted-bonus'); check();
      const projected = checkpointIdleBonus({ ...snapshot.meta.idleState, lastOnline: current.meta.getState().idleBonusAnchor }, source.timestamp);
      persist('created.json', { record: disk.record, snapshot, export: current.persistence.exportCurrentSave(), domains: current.domains(), io: disk.io });
      expect(safe(source)).toEqual(safe({ ...snapshot, timestamp: source.timestamp, meta: { ...snapshot.meta, idleState: projected } }));
      action('created-save', { timestamp: source.timestamp });
      check(); await reload('loaded', source); check();
      const live = required(current);
      // Import after module reset so spies observe this realm's native exports.
      const { observeMaterialSources, ordinaryMaterialContext, createMaterialSourceJournal } = await import('../material-source-report'); check();
      const { materialRewardDelta } = await import('../material-delta'); check();
      const journal = createMaterialSourceJournal(live.inventory.getState().materials);
      expect(live.map.getState().challengeOrdinals).toEqual({ normal: 0, nightmare: 0, hell: 0 });
      check(); live.map.getState().setCurrentLocation(1, 'areas/act1-blood-moor');
      action('location', { act: live.map.getState().currentAct, area: live.map.getState().currentSubAreaId });
      check(); const started = policy.act('launch', () => live.helpers.startSubAreaRun({ mode: 'manual' }));
      action('launch', started);
      const first = required(live.receipts.inspectRecordedWaves().currentPublished);
      persist('launched.json', { started, binding: first.binding, installation: first.installation,
        domains: live.domains(), combat: live.combat.getState() });
      expect(required(started).challengeOrdinal).toBe(0);
      expect(live.map.getState().challengeOrdinals).toEqual({ normal: 1, nightmare: 0, hell: 0 });
      expect(first.binding.origin).toEqual({ kind: 'area', replayProfileId: 'normal' });
      const plan = first.binding.candidateRun.plan;
      expect(plan.subAreaId).toBe('areas/act1-blood-moor');
      expect(plan.waves.map(wave => wave.spawns.length)).toEqual([8, 9, 10]);
      expect(plan.waves.map(wave => wave.source?.kind)).toEqual(['wave', 'wave', 'wave']);
      expect(plan.waves.slice(1).every(wave => wave.presentation?.isForcedElite)).toBe(true);
      for (let index = 0; index < 3; index++) {
        check();
        const view = required(live.receipts.inspectRecordedWaves().currentPublished);
        const context = ordinaryMaterialContext(view);
        persist(`wave-${index}-published.json`, { binding: view.binding, installation: view.installation,
          context: { ...context, receipt: 'process-local-only; exact identity checked in memory' },
          payoutAssociation: context.receipt === view.installation?.settlement.identity });
        expect(view.binding.targetWaveIdx).toBe(index);
        expect(context.receipt).toBe(view.installation?.settlement.identity);
        expect(context.unsupportedSources).toEqual([]);
        const recording = view.binding.recording.events;
        expect(live.combat.getState().recordedEvents).toBe(recording);
        const transportStart = performance.now();
        for (let event = 0; event < recording.length; event++) { check(); live.combat.getState().advanceEvent(); }
        expect(live.combat.getState().recordedEvents).toBe(recording);
        expect(live.combat.getState().playbackComplete).toBe(true);
        const before = structuredClone(live.inventory.getState().materials);
        const rawBefore = structuredClone(live.combat.getState().runRewards.materials);
        check(); const capture = policy.act('settlement', () => observeMaterialSources(live.helpers.advanceWaveOrFinish));
        const after = live.inventory.getState().materials;
        const raw = materialRewardDelta(rawBefore, live.combat.getState().runRewards.materials);
        const observed = journal.observe({ context, capture, before, after, raw });
        action('settlement', { index, execution: capture.execution, observed, simulatedSeconds: view.binding.waveElapsedMs / 1000,
          rapidPlaybackAndSettlementMs: performance.now() - transportStart, humanActiveTime: 'unobserved' });
        persist(`wave-${index}-settled.json`, { journal: journal.snapshot(), before, after, raw,
          combat: live.combat.getState(), domains: live.domains(), recovery: live.helpers.readCombatTransitionRecovery() });
        check();
        if (capture.execution.status === 'threw') throw capture.execution.error;
        if (context.winner !== 'player') {
          policy.stop('nonwin'); expect(capture.execution.value).toBe('defeat'); break;
        }
        expect(observed).toBe('accepted');
        expect(capture.execution.value).toBe(index === 2 ? 'victory' : 'next-wave');
        if (index === 2) policy.stop('bounded-three-wave-completion');
      }
      persist('terminal-before-return.json', { policy: policy.snapshot(), journal: journal.snapshot(), domains: live.domains(),
        combat: live.combat.getState(), receipts: live.receipts.inspectRecordedWaves(), recovery: live.helpers.readCombatTransitionRecovery() });
      expect(live.helpers.readCombatTransitionRecovery()).toEqual({ kind: 'ready' });
      expect(live.receipts.inspectRecordedWaves().pending).toBeNull();
      check(); live.helpers.abortSubAreaRun(); check(); live.combat.getState().endCombat();
      action('safe-public-return', null);
      check(); await required(live.persistence.flushSave()); check();
      const finalDecoder = await import('@/engine/save/validate'); check();
      const finalSource = finalDecoder.decodeSave(required(disk.record).data);
      persist('final-saved.json', { record: disk.record, export: live.persistence.exportCurrentSave(), snapshot: live.persistence.snapshotStores(), io: disk.io });
      check(); await reload('final-loaded', finalSource); check();
      verifyFreshSources(root, manifest);
      action('bounded-policy-complete', policy.snapshot());
      persist('policy-result.json', { status: 'completed-bounded-prefix', policy: policy.snapshot(), journal: journal.snapshot(), actions,
        io: disk.io, limitations: ['Dexie IO emulated; no actual IndexedDB', 'No browser acceptance', 'No high-rune/pacing/full-v1 acceptance'] });
    } catch (error) {
      policy.stop(error instanceof Error ? error.message : String(error));
      persist('policy-failure.json', { error, policy: policy.snapshot(), actions, record: disk.record ?? null, io: disk.io,
        domains: current?.domains(), combat: current?.combat.getState(), receipts: current?.receipts.inspectRecordedWaves() });
      throw error;
    } finally {
      if (current) await quiet(current);
      persist('worker-finally.json', { at: Date.now(), policy: policy.snapshot(), io: disk.io, sourceVerification: 'recheck by launcher' });
    }
  });
});
