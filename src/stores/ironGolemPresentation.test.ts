import { mockSyntheticEntryPools } from '@/test/fixtures/synthetic-entry-pools';
/** Read-only presentation with explicit hero/item fixtures; not earned acceptance. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Player } from '@/engine/types/entities';
import type { Item } from '@/engine/types/items';
import { deriveStats } from '@/engine/progression/stats';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import * as engine from '@/engine/combat/combat';
import { resetRegistry, loadDefaultSkills, registerSkill } from '@/engine/skills/registry';
import { abortSubAreaRun, startSubAreaRun, refreshActivePlayerCombatConfig, recoverRecordedWavePublication } from './combatHelpers';
import { inspectRecordedWaves } from './recordedWaveReceipt';
import { useCombatStore } from './combatStore';
import { usePlayerStore } from './playerStore';
import { useInventoryStore } from './inventoryStore';
import { useMercStore } from './mercStore';
import { useMapStore } from './mapStore';
import { useMetaStore } from './metaStore';
import { useFormationStore } from './formationStore';
import { useHydrationStore } from './hydrationStore';
import { armIronGolemSelection, IronGolemAcknowledgementError, useIronGolemSelectionStore } from './ironGolemSelectionStore';
import { beginWaveTransition, endWaveTransition, reserveWaveRestore, releaseWaveRestore, WaveGuardError } from './waveTransitionGuard';
import { readIronGolemPresentation, armPresentedIronGolem, clearPresentedIronGolem, IronGolemPresentationError } from './ironGolemPresentation';

const IRON = 'necromancer.iron_golem', BLOOD = 'necromancer.blood_golem', FINISH = 'fixture.iron-presentation';
function item(id = 'chosen'): Item {
  return { id, baseId: 'items/base/wp1h-short-sword', rarity: 'normal', level: 1, identified: true, equipped: false };
}
function hero(fields: Partial<Player> = {}, mana = 35) {
  const coreStats = { strength: 15, dexterity: 25, vitality: 100, energy: 100 };
  const player: Player = { ...createMockPlayer('Iron presentation', 'necromancer'),
    id: 'presentation-hero', level: 24, coreStats, derivedStats: { ...deriveStats(coreStats, 24), mana },
    skillLevels: { [IRON]: 6, [BLOOD]: 1 }, comboOrder: [IRON, FINISH], ...fields };
  usePlayerStore.getState().setPlayer(player); return player;
}
const start = () => startSubAreaRun({ subAreaId: 'areas/act1-blood-moor', runSeed: 7, challengeOrdinal: 0 });
const arm = (acknowledged = true) => armPresentedIronGolem('presentation-hero', 'chosen', acknowledged);
function pending() {
  const value = inspectRecordedWaves().pending;
  if (!value) throw new Error('Missing pending receipt'); return value;
}
beforeEach(() => {
  mockSyntheticEntryPools();
  abortSubAreaRun();
  for (const store of [useCombatStore, usePlayerStore, useInventoryStore, useMercStore,
    useMapStore, useMetaStore, useFormationStore]) store.getState().reset();
  resetRegistry(); loadDefaultSkills(); useHydrationStore.getState().setStatus('ready');
  registerSkill({ id: FINISH, archetype: 'fixture', target: 'all-enemies', cooldown: 1, manaCost: 0,
    minLevel: 1, effects: [{ kind: 'damage', damageType: 'physical', base: [100000, 100000] }] });
  hero(); useInventoryStore.setState({ backpack: [item()] });
});
afterEach(() => {
  vi.restoreAllMocks(); abortSubAreaRun(); useHydrationStore.getState().setStatus('idle');
  resetRegistry(); loadDefaultSkills();
});

describe('explicit draft, armed instruction and current-recording presentation', () => {
  it('never chooses or arms the first eligible item during observation', () => {
    const before = useInventoryStore.getState();
    const model = readIronGolemPresentation(null);
    expect(model.draft).toEqual({ eligible: false, reason: 'noSelection' });
    expect(model.armed).toEqual({ eligible: false, reason: 'noSelection' });
    expect(model.selection).toBeNull(); expect(model.attempt).toEqual({ kind: 'none' });
    expect(model.configurationReady).toBe(true);
    expect(useInventoryStore.getState()).toBe(before);
    expect(useIronGolemSelectionStore.getState().selection).toBeNull();
  });

  it('projects the chosen live instance alone without qualifying payment or using hero gear', () => {
    useInventoryStore.setState({ equipped: { weapon: item('other-gear') } });
    const source = useInventoryStore.getState().backpack[0];
    expect(readIronGolemPresentation('chosen').draft).toEqual({ eligible: true, item: source,
      index: 0, bonuses: { life: 0, attack: 8, defense: 0 } });
    expect(readIronGolemPresentation('chosen').armed).toEqual({ eligible: false, reason: 'noSelection' });
    expect(useIronGolemSelectionStore.getState().selection).toBeNull();
  });

  it.each(['backpack', 'stash', 'heroGear', 'mercGear'] as const)('refuses ambiguous %s ownership in draft and armed models', location => {
    armIronGolemSelection('presentation-hero', 'chosen', true);
    const source = item();
    if (location === 'backpack') useInventoryStore.setState({ backpack: [source, source] });
    if (location === 'stash') useInventoryStore.setState({ stash: [source] });
    if (location === 'heroGear') useInventoryStore.setState({ equipped: { weapon: source } });
    if (location === 'mercGear') useMercStore.setState({ mercEquipment: { unfielded: { weapon: source } } });
    const model = readIronGolemPresentation('chosen');
    expect(model.draft).toEqual({ eligible: false, reason: 'duplicateItem' });
    expect(model.armed).toEqual({ eligible: false, reason: 'duplicateItem' });
  });

  it('keeps a stale moved instruction visible with its live refusal and no automatic replacement', () => {
    armIronGolemSelection('presentation-hero', 'chosen', true);
    useInventoryStore.setState({ backpack: [item('replacement')], stash: [item()] });
    const model = readIronGolemPresentation('chosen');
    expect(model.draft).toEqual({ eligible: false, reason: 'notInBackpack' });
    expect(model.armed).toEqual({ eligible: false, reason: 'notInBackpack' });
    expect(model.selection).toBe(useIronGolemSelectionStore.getState().selection);
  });

  it.each([
    [{ identified: false }, 'unidentified'], [{ equipped: true }, 'equipped'],
    [{ baseId: 'items/base/unknown' }, 'ineligibleBase'], [{ runes: ['rune'] }, 'unsupportedRunes'],
    [{ rarity: 'unique', uniqueId: 'missing' }, 'invalidDefinition'],
    [{ baseRolls: { attack: NaN } }, 'invalidRolls']
  ] as const)('preserves item-local refusal %s', (fields, reason) => {
    useInventoryStore.setState({ backpack: [{ ...item(), ...fields } as Item] });
    expect(readIronGolemPresentation('chosen').draft).toEqual({ eligible: false, reason });
  });

  it.each([
    { class: 'sorceress' as const }, { level: 23 }, { level: NaN },
    { skillLevels: { [IRON]: 0, [BLOOD]: 1 } }, { skillLevels: { [IRON]: 1.5, [BLOOD]: 1 } },
    { skillLevels: { [IRON]: 21, [BLOOD]: 1 } }, { skillLevels: { [IRON]: 6 } }, { comboOrder: [FINISH] }
  ])('uses the shared production configuration boundary for %j', fields => {
    hero(fields);
    expect(readIronGolemPresentation('chosen').configurationReady).toBe(false);
    expect(readIronGolemPresentation('chosen').draft.eligible).toBe(true);
  });

  it('does not confuse low mana or owner death with configuration qualification', () => {
    const player = hero({ comboOrder: ['skills-necromancer-iron-golem', IRON, FINISH] }, 0);
    usePlayerStore.setState({ player: { ...player, derivedStats: { ...player.derivedStats, life: 0 } } });
    expect(readIronGolemPresentation('chosen').configurationReady).toBe(true);
    expect(readIronGolemPresentation('chosen').attempt).toEqual({ kind: 'none' });
  });
});


describe('explicit presentation actions', () => {
  it('keeps the supported hero replacement cleanup and refuses stale controls', () => {
    const selection = arm(); start(); hero({ id: 'replacement-hero' });
    expect(readIronGolemPresentation(null).attempt).toEqual({ kind: 'none' });
    expect(readIronGolemPresentation(null).selection).toBeNull();
    expect(arm).toThrow(new IronGolemPresentationError('heroMismatch'));
    expect(() => { clearPresentedIronGolem('presentation-hero', selection); })
      .toThrow(new IronGolemPresentationError('heroMismatch'));
  });

  it.each(['arm', 'clear'] as const)('propagates a %s subscriber exception after writing and leaves live state observable', action => {
    const expected = action === 'clear' ? arm() : null;
    const error = new Error('selection subscriber');
    const unsubscribe = useIronGolemSelectionStore.subscribe(() => { throw error; });
    try {
      expect(() => { if (action === 'arm') arm(); else clearPresentedIronGolem('presentation-hero', expected); }).toThrow(error);
      expect(readIronGolemPresentation(null).selection).toEqual(action === 'arm'
        ? { heroId: 'presentation-hero', itemId: 'chosen' } : null);
    } finally { unsubscribe(); }
  });

  it('arms and clears the displayed instruction without reserving, simulating or paying', () => {
    const simulate = vi.spyOn(engine, 'runBattleRecorded');
    const inventory = useInventoryStore.getState();
    const selection = arm();
    expect(selection).toEqual({ heroId: 'presentation-hero', itemId: 'chosen' });
    expect(readIronGolemPresentation(null).selection).toBe(selection);
    expect(readIronGolemPresentation(null).armed).toMatchObject({ eligible: true, bonuses: { attack: 8 } });
    clearPresentedIronGolem('presentation-hero', selection);
    expect(readIronGolemPresentation(null).selection).toBeNull();
    expect(useInventoryStore.getState()).toBe(inventory);
    expect(usePlayerStore.getState().player?.derivedStats.mana).toBe(35);
    expect(simulate).not.toHaveBeenCalled();
    expect(inspectRecordedWaves()).toEqual({ pending: null, currentPublished: null });
  });

  it('requires acknowledgement and rechecks live ownership/projection/configuration', () => {
    expect(() => arm(false)).toThrow(new IronGolemAcknowledgementError());
    useInventoryStore.setState({ backpack: [] });
    expect(arm).toThrow(new IronGolemPresentationError('notInBackpack'));
    useInventoryStore.setState({ backpack: [{ ...item(), identified: false }] });
    expect(arm).toThrow(new IronGolemPresentationError('unidentified'));
    useInventoryStore.setState({ backpack: [item()] }); hero({ level: 23 });
    expect(arm).toThrow(new IronGolemPresentationError('configurationUnavailable'));
    expect(useIronGolemSelectionStore.getState().selection).toBeNull();
  });

  it('never retargets a stale Arm or Clear after hero replacement', () => {
    const selection = arm();
    // Raw replacement deliberately preserves stale instruction to exercise refusal.
    const player = usePlayerStore.getState().player;
    if (!player) throw new Error('Missing hero');
    usePlayerStore.setState({ player: { ...player, id: 'replacement-hero' } });
    expect(arm).toThrow(new IronGolemPresentationError('heroMismatch'));
    expect(() => { clearPresentedIronGolem('presentation-hero', selection); })
      .toThrow(new IronGolemPresentationError('heroMismatch'));
    expect(useIronGolemSelectionStore.getState().selection).toBe(selection);
    expect(readIronGolemPresentation(null).armed).toEqual({ eligible: false, reason: 'heroMismatch' });
  });

  it('does not let a stale Clear erase a later explicit rearm even with equal IDs', () => {
    const displayed = arm(), later = arm();
    expect(displayed).not.toBe(later);
    expect(() => { clearPresentedIronGolem('presentation-hero', displayed); })
      .toThrow(new IronGolemPresentationError('staleSelection'));
    expect(useIronGolemSelectionStore.getState().selection).toBe(later);
  });

  it.each(['wave', 'restore'] as const)('gives %s guard refusal precedence over all presentation refusals', kind => {
    const wave = kind === 'wave' ? beginWaveTransition(true) : null;
    const restore = kind === 'restore' ? reserveWaveRestore() : null;
    try {
      expect(() => armPresentedIronGolem('stale-hero', 'missing', false))
        .toThrow(new WaveGuardError(kind === 'wave' ? 'waveBusy' : 'restorePending'));
      expect(() => { clearPresentedIronGolem('stale-hero', null); })
        .toThrow(new WaveGuardError(kind === 'wave' ? 'waveBusy' : 'restorePending'));
    } finally {
      if (wave) endWaveTransition(wave);
      if (restore) releaseWaveRestore(restore);
    }
  });
});

describe('receipt-backed current recording outcome', () => {
  it('reports payment from the committed receipt, never from item absence or cleared selection', () => {
    arm(); start();
    expect(readIronGolemPresentation(null).attempt).toEqual({ kind: 'summoned', replayLocked: true,
      item: item(), paidMp: 35 });
    expect(readIronGolemPresentation(null).armed).toEqual({ eligible: false, reason: 'noSelection' });
    expect(useInventoryStore.getState().backpack).toEqual([]);
    abortSubAreaRun();
    expect(readIronGolemPresentation(null).attempt).toEqual({ kind: 'none' });
  });

  it('exposes only notPrepared for an accepted failed attempt without inventing an engine reason', () => {
    hero({}, 34); arm(); start();
    expect(readIronGolemPresentation(null).attempt).toEqual({ kind: 'notPrepared', replayLocked: true });
    expect(useInventoryStore.getState().backpack).toHaveLength(1);
  });

  it('does not treat staged attestation or an in-flight debit as verified payment', () => {
    arm(); const original = useInventoryStore.setState;
    const observations: unknown[] = [];
    vi.spyOn(useInventoryStore, 'setState').mockImplementationOnce(value => {
      expect(pending().binding.attestation).not.toBeNull();
      observations.push(readIronGolemPresentation(null).attempt);
      original(value);
      expect(useInventoryStore.getState().backpack).toHaveLength(0);
      observations.push(readIronGolemPresentation(null).attempt);
    });
    start();
    expect(observations).toEqual([
      { kind: 'unverified', phase: 'prepared', replayLocked: true, isReplay: false },
      { kind: 'unverified', phase: 'prepared', replayLocked: true, isReplay: false }
    ]);
  });

  it('keeps conflicting payment unverified even when the selected item is absent', () => {
    arm(); const original = useInventoryStore.setState;
    vi.spyOn(useInventoryStore, 'setState').mockImplementationOnce(value => {
      original(value); original({ backpack: [...useInventoryStore.getState().backpack] });
    });
    expect(start).toThrow();
    expect(useInventoryStore.getState().backpack).toHaveLength(0);
    expect(readIronGolemPresentation(null).attempt).toEqual({ kind: 'unverified', phase: 'conflict', replayLocked: true, isReplay: false });
  });

  it.each([35, 34])('represents committed pending publication at %iMP using exact debit progress', mana => {
    hero({}, mana); arm();
    vi.spyOn(useCombatStore.getState(), 'publishStagedRecordedBattle').mockImplementationOnce(() => { throw new Error('publisher'); });
    expect(start).toThrow('publisher');
    const retained = pending();
    expect(readIronGolemPresentation(null).attempt).toEqual({ kind: 'pendingPublication', replayLocked: true, isReplay: false,
      payment: mana === 35 ? { kind: 'verified', item: item(), paidMp: 35 } : { kind: 'none' } });
    recoverRecordedWavePublication(retained.receipt);
    expect(readIronGolemPresentation(null).attempt.kind).toBe(mana === 35 ? 'summoned' : 'notPrepared');
  });

  it('gives matching pending work precedence over an older published success', () => {
    arm(); start();
    vi.spyOn(useCombatStore.getState(), 'publishStagedRecordedBattle').mockImplementationOnce(() => { throw new Error('second publication'); });
    expect(start).toThrow('second publication');
    expect(readIronGolemPresentation(null).attempt).toEqual({ kind: 'pendingPublication', replayLocked: true, isReplay: false, payment: { kind: 'none' } });
  });

  it('ignores foreign pending receipts and still uses matching published evidence', () => {
    arm(); start();
    const player = usePlayerStore.getState().player;
    if (!player) throw new Error('Missing hero');
    // Raw hero swaps preserve holder evidence for identity filtering only.
    usePlayerStore.setState({ player: { ...player, id: 'foreign-hero' } });
    vi.spyOn(useCombatStore.getState(), 'publishStagedRecordedBattle').mockImplementationOnce(() => { throw new Error('foreign publication'); });
    expect(start).toThrow('foreign publication');
    usePlayerStore.setState({ player });
    expect(readIronGolemPresentation(null).attempt.kind).toBe('summoned');
    usePlayerStore.setState({ player: { ...player, id: 'third-hero' } });
    expect(readIronGolemPresentation(null).attempt).toEqual({ kind: 'none' });
    usePlayerStore.setState({ player: null });
    expect(readIronGolemPresentation('chosen').attempt).toEqual({ kind: 'none' });
  });

  it.each([true, false])('reports %s locked replay without inferring another sacrifice from fresh receipts', locked => {
    if (!locked) hero({ comboOrder: [FINISH] });
    armIronGolemSelection('presentation-hero', 'chosen', true); start();
    if (!locked) usePlayerStore.getState().setComboOrder([IRON, FINISH]);
    const inventory = useInventoryStore.getState();
    refreshActivePlayerCombatConfig({ replayCurrentWave: true });
    expect(readIronGolemPresentation(null).attempt).toEqual({ kind: 'replay', replayLocked: locked });
    expect(useInventoryStore.getState()).toBe(inventory);
    expect(inspectRecordedWaves().currentPublished?.binding.attestation).toBeNull();
  });

  it('identifies pending replay as no-debit even when the original recording contains a successful summon', () => {
    arm(); start(); useCombatStore.getState().advanceEvent();
    vi.spyOn(useCombatStore.getState(), 'publishStagedRecordedBattle').mockImplementationOnce(() => { throw new Error('replay publisher'); });
    expect(() => { refreshActivePlayerCombatConfig({ replayCurrentWave: true }); }).toThrow('replay publisher');
    expect(pending().installation?.intent.kind).toBe('replay');
    expect(readIronGolemPresentation(null).attempt).toEqual({ kind: 'pendingPublication', replayLocked: true, isReplay: true, payment: { kind: 'none' } });
  });
});
