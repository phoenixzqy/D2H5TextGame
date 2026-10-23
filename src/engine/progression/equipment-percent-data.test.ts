import { describe, expect, it } from 'vitest';
import { loadSets, loadSetPieces, loadUniques } from '@/data/loaders/loot';
import { aggregateEquipmentMods } from './equipment-mods';
import type { Item } from '../types/items';

const uniqueUnits = [
  ['crushflange', 'critChance', .10], ['goblin-toe', 'critChance', .15],
  ['whistan-guard', 'physDodge', .10], ['ribcracker', 'critChance', .10],
  ['razor-tine', 'critChance', .10], ['hone-sundan', 'critChance', .10],
  ['darksight-helm', 'magicDodge', .10], ['spirit-ward', 'magicDodge', .15],
  ['earth-shaker', 'critChance', .10], ['gerke-sanctuary', 'magicDodge', .20],
  ['steel-shade', 'magicDodge', .15], ['steelshade', 'physDodge', .15],
  ['buriza-do-kyanon', 'physDodge', .08], ['kerke-sanctuary', 'magicDodge', .20],
  ['eaglehorn', 'critChance', .08], ['eaglehorn', 'magicDodge', .10],
  ['shadow-dancer', 'magicDodge', .15], ['the-stone-crusher', 'critChance', .15],
  ['the-gladiator-bane', 'magicDodge', .15], ['the-cranium-basher', 'critChance', .20],
  ['the-cranium-basher-greater', 'critChance', .25],
  ['silkweave', 'magicDodge', .20], ['carrion-wind', 'physDodge', .10]
] as const;
const setUnits = [
  ['sets/cleglaw-brace', '3', 'physDodge', .15],
  ['sets/natalyas-odium', '3', 'critChance', .15],
  ['sets/natalyas-odium', '4', 'critDamage', .50]
] as const;

describe('canonical unique and set critical/dodge units', () => {
  it.each(uniqueUnits)('%s %s is a canonical fraction', (slug, stat, expected) => {
    const definition = loadUniques().find(row => row.id === `items/unique/${slug}`);
    expect(definition).toBeDefined();
    expect(definition?.stats?.statMods?.[stat]).toBe(expected);
    if (!definition) throw new Error(`missing unique ${slug}`);
    const item: Item = { id: slug, baseId: definition.baseId, rarity: 'unique', level: definition.reqLevel,
      uniqueId: definition.id, identified: true, equipped: true,
      statRolls: { [`statMods.${stat}`]: 999 } };
    expect(aggregateEquipmentMods({ item })[stat]).toBe(expected);
  });
  it.each(setUnits)('%s threshold%s %s is a canonical fraction', (id, threshold, stat, expected) => {
    const definition = loadSets().find(row => row.id === id);
    expect(definition?.bonuses[threshold]?.statMods?.[stat]).toBe(expected);
  });
  it.each(['aldurs-watchtower', 'cow-king-leathers', 'disciple', 'hsarus-defense',
    'immortal-king', 'natalyas-odium', 'sander-folly', 'sigon-complete-steel',
    'tancred-battlegear', 'vidala-rig'])('preserves %s boots already authored as five percent', slug => {
    expect(loadSetPieces().find(row => row.id === `sets/${slug}/boots`)?.stats?.statMods?.physDodge).toBe(.05);
  });
});
