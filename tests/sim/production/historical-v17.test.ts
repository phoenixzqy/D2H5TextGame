import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { expect, it } from 'vitest';
import { decodeSave } from '@/engine/save/validate';
import type { SaveCurrent } from '@/engine/types/save';
import { captureEarnedRestorers, observeEarnedState, restoreEarnedSave } from './earned-state';
import { hashObservation } from './earned-report';
import { nativeContinuationPolicy } from './fresh-campaign-continuation-policy';
import { economyPolicy } from './fresh-campaign-economy-policy';
import { authenticateHistoricalV17, expectedCurrentV20, historicalV17Save, historicalV17EarnedState } from './historical-v17';

it.each([nativeContinuationPolicy, economyPolicy])('preserves authenticated original mirrors and every authoritative value: $id', policy => {
  const raw: unknown = JSON.parse(gunzipSync(readFileSync(new URL(`../../../${policy.source}`, import.meta.url))).toString('utf8'));
  const before = structuredClone(raw);
  const caller = observeEarnedState();
  const witness = authenticateHistoricalV17(raw, policy.sourceSaveHash);
  const save = decodeSave(raw);
  expect(hashObservation(witness)).toBe(policy.sourceSaveHash);
  expect(witness.player.equipment).toEqual([]);
  expect(witness.mercs.ownedMercs.every(merc => merc.equipment.length === 0)).toBe(true);
  expect(save.player.equipment).toHaveLength(8);
  expect(save.player.derivedStats).toEqual(witness.player.derivedStats);
  expect(save).toEqual(expectedCurrentV20(witness));
  expect(historicalV17Save(save, witness)).toEqual(witness);
  expect(raw).toEqual(before);
  expect(observeEarnedState()).toEqual(caller);
  const restorers = captureEarnedRestorers();
  try {
    restoreEarnedSave(save, policy.clockEpochMs);
    const live = observeEarnedState();
    const liveBefore = structuredClone(live);
    const projected = historicalV17EarnedState(live, witness);
    expect(hashObservation(projected)).toBe(policy.sourceEarnedHash);
    const { endgame: _endgame, hellClearedSubAreas: _hellClears, challengeOrdinals, ...oldMap } = live.map;
    const { hell: _hellOrdinal, ...oldOrdinals } = challengeOrdinals;
    expect(projected.map).toEqual({ ...oldMap, challengeOrdinals: oldOrdinals });
    expect(projected.map).not.toHaveProperty('hellClearedSubAreas');
    expect(projected.map.challengeOrdinals).not.toHaveProperty('hell');
    for (const changedMap of [
      { ...live.map, hellClearedSubAreas: ['areas/act1-blood-moor'] },
      { ...live.map, challengeOrdinals: { ...live.map.challengeOrdinals, hell: 1 } }
    ]) {
      expect(() => historicalV17EarnedState({ ...live, map: changedMap }, witness)).toThrow('complete historical forward expectation');
    }
    expect(live).toEqual(liveBefore);
    expect(historicalV17EarnedState(live, witness).player.player?.derivedStats).toEqual(witness.player.derivedStats);
    const changed = structuredClone(live);
    changed.inventory.materialActionOrdinal = 1;
    expect(() => historicalV17EarnedState(changed, witness)).toThrow();
    const dungeon = structuredClone(live);
    dungeon.map.endgame = { ...dungeon.map.endgame, attemptOrdinal: 1 };
    expect(() => historicalV17EarnedState(dungeon, witness)).toThrow(/cannot discard endgame/);
  } finally { for (const restore of restorers) restore(); }
});

it('refuses changed witness bytes rather than deriving historical identity from current migration', () => {
  const policy = nativeContinuationPolicy;
  const raw: unknown = JSON.parse(gunzipSync(readFileSync(new URL(`../../../${policy.source}`, import.meta.url))).toString('utf8'));
  expect(() => authenticateHistoricalV17(raw, '0'.repeat(64))).toThrow(/historical witness hash/i);
});

it('refuses meaningful new state and authoritative drift rather than erasing it for a historical hash', () => {
  const policy = nativeContinuationPolicy;
  const raw: unknown = JSON.parse(gunzipSync(readFileSync(new URL(`../../../${policy.source}`, import.meta.url))).toString('utf8'));
  const witness = authenticateHistoricalV17(raw, policy.sourceSaveHash);
  const save = decodeSave(raw);
  const mutations: Record<string, (copy: SaveCurrent) => SaveCurrent> = {
    hellClears: copy => ({ ...copy, map: { ...copy.map, hellClearedSubAreas: ['areas/act1-blood-moor'] } }),
    hellOrdinal: copy => ({ ...copy, map: { ...copy.map, challengeOrdinals: { ...copy.map.challengeOrdinals, hell: 1 } } }),
    endgame: copy => ({ ...copy, endgame: { ...copy.endgame, attemptOrdinal: 1 } }),
    materials: copy => ({ ...copy, inventory: { ...copy.inventory, materials: { 'runes/el': 1 } } }),
    quarantine: copy => ({ ...copy, inventory: { ...copy.inventory, socketQuarantine: [{ sourceVersion: 18,
      item: witness.inventory.backpack[0]!, origin: { container: 'backpack', index: 0 } }] } }),
    ordinal: copy => ({ ...copy, inventory: { ...copy.inventory, materialActionOrdinal: 1 } }),
    receipt: copy => ({ ...copy, inventory: { ...copy.inventory,
      latestMaterialAction: { ordinal: 1, requestHash: '0'.repeat(64), result: { materials: {}, currencies: {} } } } }),
    mirror: copy => ({ ...copy, player: { ...copy.player, equipment: [] } }),
    mercMirror: copy => ({ ...copy, mercs: { ...copy.mercs, ownedMercs: copy.mercs.ownedMercs.map(merc => ({ ...merc, equipment: [] })) } }),
    location: copy => ({ ...copy, inventory: { ...copy.inventory,
      backpack: copy.inventory.backpack.slice(1), stash: [...copy.inventory.stash, copy.inventory.backpack[0]!] } }),
    payload: copy => ({ ...copy, inventory: { ...copy.inventory,
      backpack: copy.inventory.backpack.map((item, index) => index === 0 ? { ...item, identified: !item.identified } : item) } }),
    resources: copy => ({ ...copy, player: { ...copy.player, derivedStats: { ...copy.player.derivedStats, life: copy.player.derivedStats.life + 1 } } }),
    socket: copy => ({ ...copy, inventory: { ...copy.inventory,
      backpack: copy.inventory.backpack.map((item, index) => index === 0 ? { ...item, socketContents: [{ kind: 'rune', id: 'runes/el' }] } : item) } }),
    currency: copy => ({ ...copy, inventory: { ...copy.inventory, currencies: { ...copy.inventory.currencies, 'rune-shard': 1 } } })
  };
  for (const [name, mutate] of Object.entries(mutations)) {
    const changed = mutate(structuredClone(save));
    expect(() => historicalV17Save(changed, witness), name).toThrow();
  }
  expect(historicalV17Save(save, witness)).toEqual(witness);
});
