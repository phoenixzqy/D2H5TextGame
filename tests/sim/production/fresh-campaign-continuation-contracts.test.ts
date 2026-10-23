import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { existsSync, mkdtempSync, readFileSync, rmdirSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { useMercStore } from '@/stores/mercStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { usePlayerStore } from '@/stores/playerStore';
import { useCombatStore } from '@/stores/combatStore';
import { useHydrationStore } from '@/stores/hydrationStore';
import { snapshotStores } from '@/stores/persistence';
import { captureEarnedRestorers, observeEarnedState } from './earned-state';
import { hydrateAuthenticV2Terminal, loadAuthenticV2Terminal, prepareNativeContinuation,
  runNativeContinuationScreen } from './fresh-campaign-continuation';
import { nativeContinuationPolicy as policy } from './fresh-campaign-continuation-policy';
import { hashObservation } from './earned-report';
import { historicalV17Save, historicalV17EarnedState } from './historical-v17';
import { collectSourceState } from './provenance';
import { publishFreshCampaignReport } from './fresh-campaign-save';

let restorers: (() => void)[];
beforeEach(() => { restorers = captureEarnedRestorers(); vi.spyOn(Date, 'now').mockReturnValue(policy.clockEpochMs); });
afterEach(() => { for (const restore of restorers) restore(); vi.restoreAllMocks(); });

it('authenticates exact captured native bytes and hydrates all persisted domains without offline gain or combat', () => {
  const authenticated = hydrateAuthenticV2Terminal();
  expect(authenticated.ancestry.rawSha256).toBe(policy.sourceRawSha256);
  expect(snapshotStores()).toEqual(authenticated.save);
  expect(authenticated.save.version).toBe(18);
  expect(authenticated.save.inventory.materials).toEqual({});
  expect(hashObservation(historicalV17Save(authenticated.save))).toBe(policy.sourceSaveHash);
  expect(hashObservation(historicalV17EarnedState(observeEarnedState()))).toBe(policy.sourceEarnedHash);
  expect(useCombatStore.getState().inCombat).toBe(false);
  expect(useHydrationStore.getState().status).toBe('ready');
});

it('only transfers the exact earned amulet and spends the actual skill point while preserving five stats and combos', () => {
  hydrateAuthenticV2Terminal();
  const before = observeEarnedState();
  const actions: string[] = [];
  prepareNativeContinuation(name => actions.push(name));
  const after = observeEarnedState();
  expect(actions).toEqual(['audit-exact-earned-amulet', 'equip-earned-rogue-amulet',
    'allocate-earned-ice-blast-point', 'prepared-native-continuation']);
  expect(after.merc.mercEquipment[policy.mercId]?.amulet)
    .toEqual({ ...policy.amulet, equipped: true, equipSlot: 'amulet' });
  expect(after.player.player?.skillLevels?.['sorceress.ice_blast']).toBe(9);
  expect(after.player.player?.skillPoints).toBe(0);
  expect(after.player.player?.statPoints).toBe(5);
  expect(after.player.player?.coreStats).toEqual(before.player.player?.coreStats);
  expect(after.player.player?.comboOrder).toEqual(before.player.player?.comboOrder);
  expect(after.map.challengeOrdinals).toEqual({ normal: 108, nightmare: 0 });
  expect(useCombatStore.getState().inCombat).toBe(false);
});

it('refuses changed presence of socketCapacity without substituting another amulet or spending the point', () => {
  hydrateAuthenticV2Terminal();
  useInventoryStore.setState(state => ({ backpack: state.backpack.map(item => item.id === policy.amulet.id
    ? { ...item, socketCapacity: 0 } : item) }));
  const before = observeEarnedState();
  expect(() => { prepareNativeContinuation(() => undefined); }).toThrow('Fresh earned gear policy refused');
  expect(observeEarnedState()).toEqual(before);
});

it('refuses an occupied Rogue amulet slot before any transfer or skill allocation', () => {
  hydrateAuthenticV2Terminal();
  // Explicit invalid fixture to exercise the pre-action guard; never saved or used in combat.
  const existing = useInventoryStore.getState().equipped.amulet;
  if (!existing) throw new Error('Occupied-slot contract requires its authenticated hero amulet');
  useMercStore.setState(state => ({ mercEquipment: { ...state.mercEquipment,
    [policy.mercId]: { ...state.mercEquipment[policy.mercId], amulet: existing } } }));
  const before = observeEarnedState();
  expect(() => { prepareNativeContinuation(() => undefined); }).toThrow('Fresh earned gear policy refused');
  expect(observeEarnedState()).toEqual(before);
});

it('retains a no-combat production transfer refusal when native publication throws and restores its caller', () => {
  // Fault-inject an ordinary production refusal before the only launch can be reached.
  useMercStore.setState({ equipOnMerc: () => ({ ok: false, reason: 'incompatible_slot' }) });
  const caller = observeEarnedState();
  const now = Date.now;
  const source = collectSourceState(process.cwd());
  const report = runNativeContinuationScreen(source, () => { throw new Error('Synthetic native publication failure'); });
  expect(report.status).toBe('action-refused');
  expect(report.refusal).toMatchObject({ reason: 'production-equip-refused' });
  expect(report.handle).toBeNull();
  expect(report.waves).toEqual([]);
  expect(report.nativePublicationFailure).toBe('Synthetic native publication failure');
  expect(report.nativeSaveCapture?.status).toBe('captured');
  const captured = report.nativeSaveCapture?.snapshot;
  if (!captured) throw new Error('Missing live capture');
  expect(captured.version).toBe(18);
  expect(captured.inventory.materials).toEqual({});
  expect(hashObservation(historicalV17Save(captured))).toBe(policy.sourceSaveHash);
  expect(report.nativeSaveCapture?.snapshotHash).toBe(hashObservation(captured));
  expect(observeEarnedState()).toEqual(caller);
  expect(Date.now).toBe(now);
  const scratch = mkdtempSync(join(tmpdir(), 'd2h5-native-continuation-contract-'));
  const output = join(scratch, 'report.json');
  try {
    publishFreshCampaignReport(process.cwd(), output, report);
    expect(JSON.parse(readFileSync(output, 'utf8')) as unknown).toMatchObject({ status: 'action-refused',
      refusal: report.refusal, nativePublicationFailure: 'Synthetic native publication failure' });
  } finally { if (existsSync(output)) unlinkSync(output); rmdirSync(scratch); expect(existsSync(scratch)).toBe(false); }
});

it('publishes unexpected post-action failure with actual transfer and native state before restoring its caller', () => {
  // Deliberately invalid production result, without combat, to fail the post-action invariant.
  usePlayerStore.setState({ allocateSkillPoint: () => 'ok' });
  const caller = observeEarnedState();
  const now = Date.now;
  let capturedWhileLive = false;
  const report = runNativeContinuationScreen(collectSourceState(process.cwd()), capture => {
    capturedWhileLive = true;
    expect(capture.snapshot?.mercs.mercEquipment[policy.mercId]?.amulet?.id).toBe(policy.amulet.id);
  });
  expect(capturedWhileLive).toBe(true);
  expect(report.status).toBe('execution-failed');
  expect(report.executionFailure).toMatchObject({ name: 'AssertionError' });
  expect(report.executionFailure?.message).toContain('1 !== 0');
  expect(report.actions.map(action => action.action)).toEqual(['audit-exact-earned-amulet',
    'equip-earned-rogue-amulet', 'allocate-earned-ice-blast-point']);
  expect(report.terminal.merc.mercEquipment[policy.mercId]?.amulet?.id).toBe(policy.amulet.id);
  expect(report.terminal.player.player?.skillPoints).toBe(1);
  expect(report.handle).toBeNull();
  expect(report.waves).toEqual([]);
  expect(report.nativeSaveCapture?.status).toBe('captured');
  expect(report.nativeCaptureFailure).toBeNull();
  expect(report.nativePublicationFailure).toBeNull();
  expect(observeEarnedState()).toEqual(caller);
  expect(Date.now).toBe(now);
  const scratch = mkdtempSync(join(tmpdir(), 'd2h5-native-continuation-contract-'));
  const output = join(scratch, 'report.json');
  try {
    publishFreshCampaignReport(process.cwd(), output, report);
    expect(JSON.parse(readFileSync(output, 'utf8')) as unknown).toMatchObject({ status: 'execution-failed',
      executionFailure: report.executionFailure, actions: report.actions });
  } finally { if (existsSync(output)) unlinkSync(output); rmdirSync(scratch); expect(existsSync(scratch)).toBe(false); }
});

it('loading the authenticated payload alone does not replace the caller or spend any resource', () => {
  const caller = observeEarnedState();
  const player = usePlayerStore.getState().player;
  expect(loadAuthenticV2Terminal().save.map.challengeOrdinals.normal).toBe(108);
  expect(observeEarnedState()).toEqual(caller);
  expect(usePlayerStore.getState().player).toBe(player);
});
