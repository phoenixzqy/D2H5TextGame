import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { loadMercPool } from '@/data/loaders/mercs';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { runBattleRecorded } from '@/engine/combat/combat';
import { decodeSave } from '@/engine/save/validate';
import { toJsonSafe } from '@/engine/save/serialize';
import { useMercStore } from './mercStore';
import { useCombatStore } from './combatStore';
import { useHydrationStore } from './hydrationStore';
import { usePlayerStore } from './playerStore';
import { useInventoryStore } from './inventoryStore';
import { createMercFromDef } from './mercFactory';
import { mercToCombatUnit } from './mercToCombatUnit';
import { abortSubAreaRun, startSubAreaRun } from './combatHelpers';
import { snapshotStores } from './persistence';
import { releaseWaveRestore, reserveWaveRestore } from './waveTransitionGuard';
import { socketRunewords } from '@/data/loaders/socket-effects';
import type { Item } from '@/engine/types/items';

const signature = 'mskill-inner-sight';
const basic = 'mskill-basic-arrow';
const pierce = 'mskill-pierce-arrow';
const desired = [signature, pierce, basic];

// Intended public API: the initial RED runs against its missing implementation.
function setOrder(id: string, order: readonly string[]): boolean {
  const state = useMercStore.getState() as ReturnType<typeof useMercStore.getState> & {
    setSkillOrder: (id: string, order: readonly string[]) => boolean;
  };
  return state.setSkillOrder(id, order);
}
function ownedMerc() {
  const def = loadMercPool().pool.find(row => row.id === 'mercs/act1-rogue-inner-sight');
  if (!def) throw new Error('Missing real Inner Sight Rogue');
  const merc = createMercFromDef(def);
  useMercStore.getState().addMerc(merc);
  useMercStore.getState().setFieldedMerc(merc.id);
  return merc;
}
function reset() {
  abortSubAreaRun();
  useCombatStore.getState().reset();
  useMercStore.getState().reset();
  useInventoryStore.getState().reset();
  usePlayerStore.getState().reset();
}
beforeEach(() => {
  reset();
  useHydrationStore.getState().setStatus('ready');
  usePlayerStore.getState().setPlayer(createMockPlayer('Priority', 'sorceress'));
});
afterEach(() => { reset(); useHydrationStore.getState().setStatus('idle'); });

describe('owned mercenary skill priority', () => {
  it('accepts only the equipment-aware permutation and preserves a dormant grant after unequip', () => {
    const merc = ownedMerc();
    const row = socketRunewords.find(row => row.id === 'runewords/phoenix');
    if (!row) throw new Error('Missing Phoenix');
    const shield: Item = { id: 'phoenix', baseId: 'items/base/sh-monarch', rarity: 'runeword', level: 70,
      identified: true, equipped: false, runewordId: row.id, socketCapacity: row.sockets,
      socketContents: row.runes.map(id => ({ kind: 'rune', id })) };
    useMercStore.setState({ mercEquipment: { [merc.id]: { offhand: shield } } });
    const withGrant = [signature, 'item.redemption', pierce, basic];
    expect(setOrder(merc.id, withGrant)).toBe(true);
    expect(useMercStore.getState().getFieldedMerc()?.comboOrder).toEqual(withGrant);
    expect(merc.comboOrder).toEqual([signature, basic, pierce]);
    const before = useMercStore.getState();
    expect(setOrder(merc.id, [signature, 'sorceress.blaze', pierce, basic])).toBe(false);
    expect(useMercStore.getState()).toBe(before);
    useMercStore.setState({ mercEquipment: {} });
    expect(setOrder(merc.id, [signature, pierce, 'item.redemption', basic])).toBe(true);
    expect(useMercStore.getState().getFieldedMerc()?.comboOrder).toContain('item.redemption');
    const restored = useMercStore.getState().getFieldedMerc();
    if (!restored) throw new Error('Missing merc');
    expect(mercToCombatUnit(restored).skillOrder).not.toContain('item.redemption');
  });
  it('preserves defaults and changes only a copied owned order', () => {
    const merc = ownedMerc();
    expect(merc.comboOrder).toEqual([signature, basic, pierce]);
    const state = useMercStore.getState();
    const inventory = useInventoryStore.getState();
    const request = [...desired];
    expect(setOrder(merc.id, request)).toBe(true);
    expect(useMercStore.getState().getFieldedMerc()).toEqual({ ...merc, comboOrder: desired });
    expect(useMercStore.getState().mercEquipment).toBe(state.mercEquipment);
    expect(useMercStore.getState().mercProgress).toBe(state.mercProgress);
    expect(useInventoryStore.getState()).toBe(inventory);
    request.reverse();
    expect(useMercStore.getState().getFieldedMerc()?.comboOrder).toEqual(desired);
    expect(merc.comboOrder).toEqual([signature, basic, pierce]);
  });

  it.each([
    ['missing-owner', 'unknown', desired],
    ['addition', null, [...desired, 'mskill-fire-arrow']],
    ['removal', null, [signature, basic]],
    ['duplicate', null, [signature, pierce, pierce]],
    ['signature-move', null, [pierce, signature, basic]],
    ['substitution', null, [signature, pierce, 'mskill-jab']],
    ['empty', null, []]
  ] as const)('refuses %s without publishing state', (_name, owner, order) => {
    const merc = ownedMerc();
    const before = useMercStore.getState();
    expect(setOrder(owner ?? merc.id, order)).toBe(false);
    expect(useMercStore.getState()).toBe(before);
  });

  it('preserves a legacy owned skill set without granting catalog secondaries', () => {
    const merc = ownedMerc();
    useMercStore.setState({ ownedMercs: [{ ...merc, comboOrder: [basic] }] });
    expect(setOrder(merc.id, desired)).toBe(false);
    expect(setOrder(merc.id, [signature, basic])).toBe(true);
    expect(useMercStore.getState().getFieldedMerc()?.comboOrder).toEqual([signature, basic]);
  });

  it('refuses live combat and pending restore without mutation', () => {
    const merc = ownedMerc();
    useCombatStore.setState({ inCombat: true });
    const before = useMercStore.getState();
    expect(setOrder(merc.id, desired)).toBe(false);
    expect(useMercStore.getState()).toBe(before);
    useCombatStore.setState({ inCombat: false });
    const lease = reserveWaveRestore();
    try {
      expect(setOrder(merc.id, desired)).toBe(false);
      expect(useMercStore.getState()).toBe(before);
    } finally { releaseWaveRestore(lease); }
  });

  it('protects installed recordings and between-wave runs, then applies to a fresh run', () => {
    const merc = ownedMerc();
    const options = { subAreaId: 'areas/act1-blood-moor', act: 1 as const,
      runSeed: 7, challengeOrdinal: 0 };
    expect(startSubAreaRun(options)).not.toBeNull();
    const combat = useCombatStore.getState();
    const before = useMercStore.getState();
    expect(setOrder(merc.id, desired)).toBe(false);
    expect(useMercStore.getState()).toBe(before);
    expect(useCombatStore.getState()).toBe(combat);
    useCombatStore.setState({ inCombat: false });
    expect(setOrder(merc.id, desired)).toBe(false); // Run still owns its wave.
    abortSubAreaRun(); useCombatStore.getState().reset();
    expect(setOrder(merc.id, desired)).toBe(true);
    expect(combat.playerTeam.find(unit => unit.kind === 'merc')?.skillOrder)
      .toEqual([signature, basic, pierce]);
    expect(startSubAreaRun(options)).not.toBeNull();
    expect(useCombatStore.getState().playerTeam.find(unit => unit.kind === 'merc')?.skillOrder)
      .toEqual(desired);
  });

  it('allows actual Pierce casts without changing damage definitions or original snapshots', () => {
    const merc = ownedMerc();
    const original = mercToCombatUnit(merc);
    const target = { ...original, id: 'durable-target', side: 'enemy' as const, kind: 'monster' as const,
      life: 10000, stats: { ...original.stats, life: 10000, lifeMax: 10000, defense: 0 },
      skillOrder: [], statuses: [{ id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1 }] };
    const baseline = runBattleRecorded({ seed: 7, playerTeam: [original], enemyTeam: [target] });
    expect(baseline.events.some(event => event.kind === 'action' && event.skillId === pierce)).toBe(false);
    expect(setOrder(merc.id, desired)).toBe(true);
    const updated = useMercStore.getState().getFieldedMerc();
    if (!updated) throw new Error('Missing owned Rogue');
    const candidate = runBattleRecorded({ seed: 7, playerTeam: [mercToCombatUnit(updated)], enemyTeam: [target] });
    expect(candidate.events.some(event => event.kind === 'action' && event.skillId === pierce)).toBe(true);
    expect(original.skillOrder).toEqual([signature, basic, pierce]);
    expect(runBattleRecorded({ seed: 7, playerTeam: [original], enemyTeam: [target] })).toEqual(baseline);
  });

  it('retains the chosen order through current save serialization and validation', () => {
    const merc = ownedMerc();
    expect(setOrder(merc.id, desired)).toBe(true);
    const save = snapshotStores();
    if (!save) throw new Error('Missing actual store save');
    const decoded = decodeSave(JSON.parse(JSON.stringify(toJsonSafe(save))) as unknown);
    expect(decoded.mercs.ownedMercs.find(unit => unit.id === merc.id)?.comboOrder).toEqual(desired);
    useMercStore.getState().reset();
    useMercStore.setState({ ...decoded.mercs, ownedMercs: [...decoded.mercs.ownedMercs] });
    const restored = useMercStore.getState().getFieldedMerc();
    if (!restored) throw new Error('Missing restored Rogue');
    expect(mercToCombatUnit(restored).skillOrder).toEqual(desired);
  });
});
