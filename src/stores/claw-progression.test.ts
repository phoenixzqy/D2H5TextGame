/** Constructed real-pick rewards prove native use, not earned acquisition or balance. */
import { afterEach, assert, beforeEach, expect, it } from 'vitest';
import policy from '../../tests/fixtures/claw-progression-v1.json';
import { loadAwardPools } from '@/data/loaders/loot';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { resolveEquippedWeapon } from '@/engine/items/equipped-weapon';
import { createRng } from '@/engine/rng';
import { rollKillRewards } from '@/engine/loot/award';
import { rollItem, __resetRollItemSeqForTests } from '@/engine/loot/rollItem';
import { playerToCombatUnit } from './combatHelpers';
import { useInventoryStore } from './inventoryStore';
import { usePlayerStore } from './playerStore';
import { useMapStore } from './mapStore';
import { useMercStore } from './mercStore';
import { useFormationStore } from './formationStore';
import { useHydrationStore } from './hydrationStore';

const pools = loadAwardPools();
function reset() {
  useInventoryStore.getState().reset(); usePlayerStore.getState().reset();
  useMapStore.getState().reset(); useMercStore.getState().reset(); useFormationStore.getState().reset();
  useHydrationStore.getState().setStatus('ready'); __resetRollItemSeqForTests();
}
beforeEach(reset); afterEach(reset);

it.each(policy.tiers.filter(tier => tier.from >= 22))(
  '$baseId materializes a declared real pick, enforces its base level and preserves mastery/shield custody', tier => {
    const source = policy.tables.find(row => row.additions.some(band => band.baseId === tier.baseId));
    assert(source);
    const band = source.additions.find(band => band.baseId === tier.baseId);
    const table = pools.treasureClasses.get(source.id); assert(band && table);
    const pick = table.picks.find(pick => pick.baseId === tier.baseId &&
      pick.qlvlMin === band.from && pick.qlvlMax === band.to); assert(pick);
    // Isolate one declared real pick to prove reward generation, without a seed
    // search, substituted base, forced rarity or acquisition-odds claim.
    const rewards = rollKillRewards({ act: source.id === 'loot/trash-act1' ? 1 : 2,
      monsterLevel: band.from, tier: 'chapter-boss', treasureClassId: source.id, magicFind: 0, goldFind: 0 }, {
      ...pools, treasureClasses: new Map([[source.id, { ...table, picks: [pick] }]])
    }, createRng(3286157777));
    const candidate = rewards.items[0]; assert(candidate);
    const base = pools.bases.get(tier.baseId); assert(base?.baseDamage);
    expect(candidate).toMatchObject({ baseId: tier.baseId, ilvl: band.from });
    expect(candidate.baseRolls?.attack).toBeGreaterThanOrEqual(base.baseDamage.min);
    expect(candidate.baseRolls?.attack).toBeLessThanOrEqual(base.baseDamage.max);
    const starter = rollItem({ baseId: 'items/base/wp1h-katar', rarity: 'normal', ilvl: 1 }, pools, createRng(7));
    const shield = rollItem({ baseId: 'items/base/sh-buckler', rarity: 'normal', ilvl: 1 }, pools, createRng(7));
    assert(starter && shield);
    usePlayerStore.getState().setPlayer({ ...createMockPlayer('Claw progression fixture', 'assassin'),
      level: base.reqLevel - 1, skillLevels: { 'assassin.claw_mastery': 20 }, equipment: [] });
    for (const item of [starter, shield, candidate]) useInventoryStore.getState().addItem(item);
    for (const item of [starter, shield]) expect(useInventoryStore.getState().equipItem(item)).toEqual({ ok: true });
    const frozen = structuredClone({ backpack: useInventoryStore.getState().backpack,
      equipped: useInventoryStore.getState().equipped, player: usePlayerStore.getState().player });
    expect(useInventoryStore.getState().equipItem(candidate)).toEqual({ ok: false, reason: 'requirements_not_met' });
    expect({ backpack: useInventoryStore.getState().backpack, equipped: useInventoryStore.getState().equipped,
      player: usePlayerStore.getState().player }).toEqual(frozen);
    const current = usePlayerStore.getState().player; assert(current);
    usePlayerStore.getState().setPlayer({ ...current, level: base.reqLevel });
    usePlayerStore.getState().recomputeDerived(useInventoryStore.getState().equipped);
    const before = usePlayerStore.getState().player; assert(before);
    expect(useInventoryStore.getState().equipItem(candidate)).toEqual({ ok: true });
    const after = usePlayerStore.getState().player; assert(after);
    const unit = playerToCombatUnit(after);
    const plain = playerToCombatUnit({ ...after, skillLevels: {} });
    expect(resolveEquippedWeapon(useInventoryStore.getState().equipped))
      .toEqual({ weaponType: 'claw', handedness: 'oneHanded' });
    expect(after.derivedStats.attack).toBeGreaterThan(before.derivedStats.attack);
    expect(unit.stats.attack).toBeCloseTo(plain.stats.attack * 1.5, 12);
    expect(unit.stats.critChance).toBeCloseTo(plain.stats.critChance + 0.1, 12);
    expect(useInventoryStore.getState().equipped.offhand).toEqual({ ...shield, equipped: true });
    expect(useInventoryStore.getState().backpack).toEqual([{ ...starter, equipped: false }]);
  });
