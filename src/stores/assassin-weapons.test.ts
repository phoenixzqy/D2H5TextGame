import { beforeEach, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { loadItemBases } from '@/data/loaders/loot';
import { slotCandidates, compareEquip } from '@/features/inventory/compareEquip';
import { playerToCombatUnit } from './combatHelpers';
import { useInventoryStore } from './inventoryStore';
import { usePlayerStore } from './playerStore';
import { runBattle } from '@/engine/combat/combat';
import type { CombatUnit } from '@/engine/combat/types';
import { socketRunewords } from '@/data/loaders/socket-effects';
import { useMercStore } from './mercStore';
import type { Mercenary } from '@/engine/types/entities';
import type { Item } from '@/engine/types/items';
const item = (id: string, baseId = 'items/base/wp1h-short-sword'): Item => ({ id, baseId,
  rarity: 'normal', level: 1, identified: true, equipped: false });
beforeEach(() => {
  useInventoryStore.getState().reset(); usePlayerStore.getState().reset(); useMercStore.getState().reset();
  usePlayerStore.getState().setPlayer({ ...createMockPlayer('Constructed Assassin', 'assassin'), level: 30 });
});
it('equips an owned one-handed weapon into the explicit offhand with a matching preview', () => {
  const main = item('main'), other = item('other');
  useInventoryStore.getState().addItem(main); useInventoryStore.getState().addItem(other);
  expect(useInventoryStore.getState().equipItem(main)).toEqual({ ok: true });
  const player = usePlayerStore.getState().player; if (!player) throw new Error('Missing player');
  const preview = compareEquip(player, other, 'offhand', useInventoryStore.getState().equipped);
  expect(slotCandidates(useInventoryStore.getState().backpack, 'offhand')).toContainEqual(other);
  expect(useInventoryStore.getState().equipItem(other, 'offhand')).toEqual({ ok: true });
  expect(useInventoryStore.getState().equipped.weapon?.id).toBe(main.id);
  expect(useInventoryStore.getState().equipped.offhand?.id).toBe(other.id);
  expect(usePlayerStore.getState().player?.derivedStats.attack).toBe(preview.stats.attack.candidate);
});
it('provides a real level-one claw base instead of treating Assassin claws as swords', () => {
  const claw = loadItemBases().get('items/base/wp1h-katar');
  expect(claw).toMatchObject({ type: 'weapon', slot: 'weapon', handedness: 'oneHanded', weaponType: 'claw', reqLevel: 1 });
});
it('applies Weapon Block to two distinct equipped one-handed weapons at the authored cap', () => {
  const player = usePlayerStore.getState().player; if (!player) throw new Error('Missing player');
  useInventoryStore.setState({ equipped: { weapon: item('main'), offhand: item('other') } });
  const plain = playerToCombatUnit(player);
  const actual = playerToCombatUnit({ ...player, skillLevels: { 'assassin.claw_mastery': 1, 'assassin.weapon_block': 20 } });
  expect(actual.stats.physDodge).toBeCloseTo(plain.stats.physDodge + .2, 12);
  expect(actual.stats.magicDodge).toBeCloseTo(plain.stats.magicDodge + .1, 12);
});

it('applies Claw Mastery Attack and critical chance only with a main-hand claw', () => {
  const player = usePlayerStore.getState().player; if (!player) throw new Error('Missing player');
  useInventoryStore.setState({ equipped: { weapon: item('claw', 'items/base/wp1h-katar') } });
  const plain = playerToCombatUnit(player);
  const actual = playerToCombatUnit({ ...player, skillLevels: { 'assassin.claw_mastery': 20 } });
  expect(actual.stats.attack).toBeCloseTo(plain.stats.attack * 1.5, 12);
  expect(actual.stats.critChance).toBeCloseTo(plain.stats.critChance + .1, 12);
  expect(actual.life).toBe(plain.life); expect(actual.mana).toBe(plain.mana);
});

it.each(['assassin', 'barbarian', 'sorceress'] as const)('keeps automatic equips in the main hand for %s and allows explicit offhand', classId => {
  usePlayerStore.getState().setPlayer({ ...createMockPlayer('Weapon slots', classId), level: 30 });
  const first = item('first'), second = item('second'), third = item('third');
  for (const value of [first, second, third]) useInventoryStore.getState().addItem(value);
  for (const value of [first, second]) expect(useInventoryStore.getState().equipItem(value)).toEqual({ ok: true });
  expect(useInventoryStore.getState().equipped.weapon?.id).toBe('second');
  expect(useInventoryStore.getState().equipped.offhand).toBeFalsy();
  expect(useInventoryStore.getState().equipItem(third, 'offhand')).toEqual({ ok: true });
  expect(useInventoryStore.getState().equipped.weapon?.id).toBe('second');
  expect(useInventoryStore.getState().equipped.offhand?.id).toBe('third');
});
it.each([false, true])('preserves both weapons atomically when a two-handed swap has capacity=%s', hasCapacity => {
  const candidate = item('two', 'items/base/wp2h-two-handed-sword');
  const main = item('main'), offhand = item('offhand');
  useInventoryStore.setState({ equipped: { weapon: main, offhand }, backpack: [candidate,
    ...Array.from({ length: hasCapacity ? 98 : 99 }, (_, i) => item('filler-' + String(i)))] });
  const state = useInventoryStore.getState(), player = usePlayerStore.getState().player;
  if (!player) throw new Error('Missing player');
  const preview = compareEquip(player, candidate, 'weapon', state.equipped);
  expect(state.equipItem(candidate)).toEqual(hasCapacity ? { ok: true } : { ok: false, reason: 'backpack_full' });
  if (!hasCapacity) { expect(useInventoryStore.getState()).toBe(state); expect(usePlayerStore.getState().player).toBe(player); return; }
  expect(useInventoryStore.getState().equipped.offhand).toBeNull();
  expect(useInventoryStore.getState().backpack).toContainEqual({ ...main, equipped: false });
  expect(useInventoryStore.getState().backpack).toContainEqual({ ...offhand, equipped: false });
  expect(usePlayerStore.getState().player?.derivedStats.attack).toBe(preview.stats.attack.candidate);
});
it('displaces a two-handed main weapon when equipping an offhand, with matching preview', () => {
  const candidate = item('offhand'), main = item('two', 'items/base/wp2h-two-handed-sword');
  useInventoryStore.setState({ equipped: { weapon: main }, backpack: [candidate] });
  const player = usePlayerStore.getState().player; if (!player) throw new Error('Missing player');
  const preview = compareEquip(player, candidate, 'offhand', useInventoryStore.getState().equipped);
  expect(useInventoryStore.getState().equipItem(candidate, 'offhand')).toEqual({ ok: true });
  expect(useInventoryStore.getState().equipped.weapon).toBeNull();
  expect(useInventoryStore.getState().equipped.offhand?.id).toBe(candidate.id);
  expect(useInventoryStore.getState().backpack).toEqual([{ ...main, equipped: false }]);
  expect(usePlayerStore.getState().player?.derivedStats.attack).toBe(preview.stats.attack.candidate);
});
it('checks the owned instance, requirements and base rather than forged caller fields', () => {
  const owned = item('owned', 'items/base/wp1h-runic-talons');
  useInventoryStore.getState().addItem(owned);
  const before = useInventoryStore.getState();
  expect(before.equipItem({ ...owned, baseId: 'items/base/wp1h-katar' }, 'offhand'))
    .toEqual({ ok: false, reason: 'requirements_not_met' });
  expect(useInventoryStore.getState()).toBe(before);
  expect(before.equipItem(item('unowned'), 'offhand')).toEqual({ ok: false, reason: 'not_in_backpack' });
});
it.each(['items/base/sh-buckler', 'items/base/weapon-staff', 'unknown'])('does not grant Weapon Block for offhand %s', baseId => {
  const player = usePlayerStore.getState().player; if (!player) throw new Error('Missing player');
  useInventoryStore.setState({ equipped: { weapon: item('main'), offhand: item('offhand', baseId) } });
  const baseline = playerToCombatUnit(player);
  expect(playerToCombatUnit({ ...player, skillLevels: { 'assassin.claw_mastery': 1, 'assassin.weapon_block': 20 } }).stats)
    .toEqual(baseline.stats);
});

function firstAttack(rank: number, seed: number, incoming = false, type: 'physical' | 'arcane' = 'physical') {
  const player = usePlayerStore.getState().player; if (!player) throw new Error('Missing player');
  useInventoryStore.setState({ equipped: { weapon: item('main', 'items/base/wp1h-katar'), offhand: item('other') } });
  const native = playerToCombatUnit({ ...player, comboOrder: [], skillLevels:
    { 'assassin.claw_mastery': rank, 'assassin.weapon_block': rank } });
  const hero: CombatUnit = { ...native, life: 10000, mana: 10000,
    stats: { ...native.stats, lifeMax: 10000, life: 10000, attackSpeed: incoming ? 1 : 150 } };
  const enemy: CombatUnit = { ...hero, id: 'fixture-dummy', side: 'enemy', kind: 'monster',
    skillLevels: {}, skillOrder: [], increasedDamagePct: {}, basicAttack: { damageType: type, damage: [100, 100] },
    stats: { ...hero.stats, attackSpeed: incoming ? 150 : 1, defense: 0, magicResist: 0, critChance: 0,
      physDodge: 0, magicDodge: 0, resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0 } } };
  const result = runBattle({ seed, playerTeam: [hero], enemyTeam: [enemy], maxRounds: 1 });
  const hit = result.events.find(e => e.kind === 'damage' && e.source === (incoming ? enemy.id : hero.id));
  if (hit?.kind !== 'damage') throw new Error('Missing actual damage event');
  expect(result.events.filter(e => e.kind === 'action').every(e => e.skillId === null)).toBe(true);
  return { hit, result };
}
it('raises real basic-attack damage and critical outcomes with matching equipment and seeds', () => {
  const plain = firstAttack(0, 1), learned = firstAttack(20, 1);
  expect(plain.hit.dodged).toBe(false); expect(learned.hit.dodged).toBe(false);
  expect(learned.hit.amount).toBeGreaterThan(plain.hit.amount);
  const crits = [0, 20].map(rank => Array.from({ length: 64 }, (_, i) => firstAttack(rank, i + 1).hit.crit).filter(Boolean).length);
  expect(crits[1]).toBeGreaterThan(crits[0] ?? 0);
  expect(firstAttack(20, 1)).toEqual(learned);
});
it.each(['physical', 'arcane'] as const)('Weapon Block increases real %s misses across paired seeds', type => {
  const misses = [0, 20].map(rank => Array.from({ length: 64 }, (_, i) => firstAttack(rank, i + 1, true, type).hit.dodged).filter(Boolean).length);
  expect(misses[1]).toBeGreaterThan(misses[0] ?? 0);
});


it.each(['last-wish', 'phoenix', 'hand-of-justice'])('keeps %s passive/active grants through native offhand equip and comparison', id => {
  const row = socketRunewords.find(w => w.id === 'runewords/' + id);
  if (!row) throw new Error('Missing authored word');
  const source: Item = { id: 'owned-word', baseId: 'items/base/wp1h-legend-sword', rarity: 'runeword',
    level: 70, identified: true, equipped: false, runewordId: row.id,
    socketCapacity: row.sockets, socketContents: row.runes.map(id => ({ kind: 'rune', id })) };
  const claw = item('main-claw', 'items/base/wp1h-katar');
  const player = { ...createMockPlayer('Offhand grants', 'assassin'), level: 70 };
  usePlayerStore.getState().setPlayer(player);
  useInventoryStore.setState({ equipped: { weapon: claw }, backpack: [source] });
  const preview = compareEquip(player, source, 'offhand', useInventoryStore.getState().equipped);
  expect(useInventoryStore.getState().equipItem(source, 'offhand')).toEqual({ ok: true });
  const after = usePlayerStore.getState().player;
  if (!after) throw new Error('Missing player');
  expect(after.derivedStats.attack).toBe(preview.stats.attack.candidate);
  const actual = playerToCombatUnit(after);
  useInventoryStore.setState({ equipped: { weapon: source, offhand: claw } });
  const sameItemsOtherHands = playerToCombatUnit(after);
  expect(actual.stats).toEqual(sameItemsOtherHands.stats);
  expect(actual.skillOrder).toEqual(sameItemsOtherHands.skillOrder);
  expect(actual.governedActiveRanks).toEqual(sameItemsOtherHands.governedActiveRanks);
  expect(actual.manaRegenPerSecond).toBe(sameItemsOtherHands.manaRegenPerSecond);
  if (id === 'last-wish') {
    useInventoryStore.setState({ equipped: { weapon: claw } });
    const bare = playerToCombatUnit(after);
    expect(actual.stats.resistances.physical).toBe(bare.stats.resistances.physical + 10);
    expect(actual.stats.magicDodge).toBeCloseTo(bare.stats.magicDodge + .025, 12);
  } else {
    expect(actual.skillOrder).toContain(id === 'phoenix' ? 'item.redemption' : 'sorceress.blaze');
  }
});
it('retains the separate mercenary offhand equipment refusal atomically', () => {
  const owner = createMockPlayer('Merc slot control', 'assassin');
  const merc: Mercenary = { ...owner, id: 'merc-offhand-control', type: 'mercenary',
    level: 70, archetype: 'front', rarity: 'R', classId: 'rogue' };
  useMercStore.getState().addMerc(merc);
  const source = item('merc-candidate');
  useInventoryStore.setState({ backpack: [source] });
  const inventory = useInventoryStore.getState(), mercs = useMercStore.getState();
  expect(mercs.equipOnMerc(merc.id, 'offhand', source)).toEqual({ ok: false, reason: 'incompatible_slot' });
  expect(useInventoryStore.getState()).toBe(inventory);
  expect(useMercStore.getState()).toBe(mercs);
});
