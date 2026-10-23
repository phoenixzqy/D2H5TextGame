import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { deriveStats } from '@/engine/progression/stats';
import { deriveEquippedMercStats } from '@/engine/progression/merc-equipment-stats';
import { decodeSave } from '@/engine/save/validate';
import { loadMercPool } from '@/data/loaders/mercs';
import type { Item } from '@/engine/types/items';
import i18n from '@/i18n';
import { formatAffixRoll } from '@/ui/affixFormat';
import { formatStatDelta, formatStatValue } from '@/ui/statSheetFormat';
import { playerToCombatUnit } from './combatHelpers';
import { createMercFromDef } from './mercFactory';
import { mercToCombatUnit } from './mercToCombatUnit';
import { useInventoryStore } from './inventoryStore';
import { usePlayerStore } from './playerStore';
import { useMercStore } from './mercStore';
import { useMapStore } from './mapStore';
import { useMetaStore } from './metaStore';
import { useFormationStore } from './formationStore';
import { snapshotStores } from './persistence';

// Actual earned Cold Plains W4 item, retained BUG091 audit at aec0041.
const amulet: Item = {
  id: 'it-7yy59-2n4', baseId: 'items/base/amu-tin', rarity: 'rare', level: 9, ilvl: 9,
  baseRolls: {}, affixes: [
    { id: 'affix.nimble.phys-dodge', tier: 0, rolledValue: 2 },
    { id: 'affix.savage.crit-damage', tier: 0, rolledValue: 5 },
    { id: 'affix.poison.resistance', tier: 0, rolledValue: 8 },
    { id: 'affix.fire.resistance', tier: 0, rolledValue: 7 },
    { id: 'affix.arcane.resistance', tier: 0, rolledValue: 7 }
  ], generatedName: {}, identified: false, equipped: false
};
function reset() {
  useInventoryStore.getState().reset(); usePlayerStore.getState().reset();
  useMercStore.getState().reset(); useMapStore.getState().reset();
  useMetaStore.getState().reset(); useFormationStore.getState().reset();
}
function hero() {
  const created = createMockPlayer('Affix regression', 'sorceress');
  const coreStats = { strength: 10, dexterity: 25, vitality: 37, energy: 63 };
  return { ...created, level: 12, coreStats,
    derivedStats: { ...deriveStats(coreStats, 12), life: 53, mana: 47 } };
}
function equipHero() {
  usePlayerStore.getState().setPlayer(hero());
  useInventoryStore.setState({ backpack: [structuredClone(amulet)] });
  expect(useInventoryStore.getState().equipItem(amulet)).toEqual({ ok: true });
  const player = usePlayerStore.getState().player;
  if (!player) throw new Error('missing equipped player');
  return player;
}

describe('earned affix units reach hero, mercenary, save and display', () => {
  beforeEach(reset); afterEach(reset);
  it('equips, saves and removes real Exile without double-counting defense or healing pools', () => {
    usePlayerStore.getState().setPlayer({ ...hero(), level: 60 });
    const shield: Item = { id: 'store-exile', baseId: 'items/base/sh-monarch', rarity: 'runeword',
      runewordId: 'runewords/exile', level: 60, socketCapacity: 4, baseRolls: { defense: 64 },
      identified: true, equipped: false,
      socketContents: ['vex', 'ohm', 'ist', 'dol'].map(id => ({ kind: 'rune', id: `runes/${id}` })) };
    useInventoryStore.getState().addItem(shield);
    expect(useInventoryStore.getState().equipItem(shield)).toEqual({ ok: true });
    const player = usePlayerStore.getState().player;
    if (!player) throw new Error('Missing Exile wearer');
    expect(player.derivedStats.defense).toBeCloseTo(577.2, 12);
    expect(player.derivedStats).toMatchObject({ life: 53, mana: 47 });
    expect(playerToCombatUnit(player).stats).toEqual(player.derivedStats);
    const save = snapshotStores();
    if (!save) throw new Error('Missing Exile snapshot');
    expect(decodeSave(JSON.parse(JSON.stringify(save)) as unknown)).toEqual(save);
    usePlayerStore.getState().recomputeDerived(useInventoryStore.getState().equipped);
    expect(usePlayerStore.getState().player?.derivedStats).toEqual(player.derivedStats);
    expect(useInventoryStore.getState().unequipItem('offhand')).toEqual({ ok: true });
    expect(usePlayerStore.getState().player?.derivedStats).toMatchObject({ defense: 197, life: 53, mana: 47 });
    expect(usePlayerStore.getState().player?.skillLevels).toEqual(player.skillLevels);
  });
  it('projects the actual earned item once into hero cache and fresh combat, preserving pools', () => {
    const player = equipHero();
    expect(player.derivedStats.physDodge).toBeCloseTo(.12, 12);
    expect(player.derivedStats.critDamage).toBe(2.05);
    expect(player.derivedStats.resistances).toMatchObject({ fire: 7, poison: 8, arcane: 7 });
    expect(player.derivedStats).toMatchObject({ life: 53, mana: 47 });
    const unit = playerToCombatUnit(player);
    expect(unit.stats).toEqual(player.derivedStats);
    expect(playerToCombatUnit(player)).toEqual(unit);
    expect(usePlayerStore.getState().player).toBe(player);
  });
  it('projects the same actual item over the owned merc baseline without accumulating or healing', () => {
    const def = loadMercPool().pool.find(row => row.id === 'mercs/act1-rogue-inner-sight');
    if (!def) throw new Error('missing real Rogue');
    const created = createMercFromDef(def);
    const owned = { ...created, derivedStats: { ...created.derivedStats, life: 53, mana: 47 } };
    const before = structuredClone(owned);
    const gear = { amulet };
    const effective = deriveEquippedMercStats(owned, gear);
    expect(effective.physDodge).toBeCloseTo(owned.derivedStats.physDodge + .02, 12);
    expect(effective.critDamage).toBe(owned.derivedStats.critDamage + .05);
    expect(effective).toMatchObject({ life: 53, mana: 47 });
    expect(deriveEquippedMercStats(owned, gear)).toEqual(effective);
    expect(mercToCombatUnit(owned, undefined, gear).stats).toEqual(effective);
    expect(owned).toEqual(before);
  });
  it('retains raw rolls through the actual snapshot/decode boundary and reprojects the same combat stats', () => {
    const player = equipHero();
    const save = snapshotStores();
    if (!save) throw new Error('missing save');
    const restored = decodeSave(JSON.parse(JSON.stringify(save)) as unknown);
    expect(restored).toEqual(save);
    expect(restored.inventory.equipped.amulet?.affixes).toEqual(amulet.affixes);
    useInventoryStore.setState({ equipped: restored.inventory.equipped });
    expect(playerToCombatUnit(restored.player).stats).toEqual(player.derivedStats);
  });
  it.each(['en', 'zh-CN'])('shows raw percentage rolls and fractional effective stats consistently in %s', locale => {
    const player = equipHero();
    const t = i18n.getFixedT(locale, 'affixes');
    const [dodge, critical] = amulet.affixes ?? [];
    if (!dodge || !critical) throw new Error('missing earned affixes');
    expect(formatAffixRoll(dodge, t)).toContain('2%');
    expect(formatAffixRoll(critical, t)).toContain('5%');
    expect(formatStatDelta('percent', .02)).toBe('+2.0%');
    expect(formatStatValue('mult', player.derivedStats.critDamage)).toBe('2.05×');
  });
});
