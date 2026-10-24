import { describe, expect, it } from 'vitest';
import Ajv2020 from 'ajv/dist/2020';
import questSchema from '../schema/quest.schema.json';
import profileSchema from '../schema/quest-unique-profile.schema.json';
import mainDocument from '../quests/main.json';
import treasureClasses from '../loot/treasure-classes.json';
import { loadAwardPools } from '../loaders/loot';
import { loadQuestUniqueProfile } from '../loaders/quest-rewards';
import { resolveQuestUniqueProfile } from '../../engine/loot/quest-unique';
import { rollQuestTableRewards } from '../../engine/loot/award';
import { rollUniqueItem } from '../../engine/loot/rollItem';
import { createRng, hashSeed, type Rng } from '../../engine/rng';

const PROFILE_ID = 'quest-rewards/act3-gidbinn-ring-v1';
const BLADE = 'quests/act3-blade-of-the-old-religion';
const expectedEntries = [
  { uniqueId: 'items/unique/nagelring', baseId: 'items/base/ring', reqLevel: 10, weight: 1 },
  { uniqueId: 'items/unique/manald-heal', baseId: 'items/base/ring', reqLevel: 15, weight: 1 },
  { uniqueId: 'items/unique/ring-of-the-leech', baseId: 'items/base/ring-jade', reqLevel: 27, weight: 1 },
  { uniqueId: 'items/unique/stone-of-jordan', baseId: 'items/base/ring-silver', reqLevel: 29, weight: 1 }
] as const;

function required<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('Missing Act III reward fixture');
  return value;
}

describe('frozen Gidbinn unique-ring profile', () => {
  const pools = loadAwardPools();
  it('has the literal ordered four-entry v1 protocol', () => {
    expect(loadQuestUniqueProfile()).toEqual({ id: PROFILE_ID, ilvl: 34, entries: expectedEntries });
  });

  it.each(['order', 'weight', 'member', 'level', 'extra'] as const)('rejects frozen profile %s drift', kind => {
    const validate = new Ajv2020({ strict: true }).compile(profileSchema);
    const profile = loadQuestUniqueProfile();
    const changed = { ...profile, entries: profile.entries.map(entry => ({ ...entry })) };
    if (kind === 'order') changed.entries.reverse();
    if (kind === 'weight') Object.assign(required(changed.entries[0]), { weight: 2 });
    if (kind === 'member') Object.assign(required(changed.entries[0]), { uniqueId: 'items/unique/future-ring' });
    if (kind === 'level') Object.assign(changed, { ilvl: 35 });
    if (kind === 'extra') Object.assign(changed, { reroll: true });
    expect(validate(changed)).toBe(false);
  });

  it.each([
    ['gidbinn-hero-9', 0], ['gidbinn-hero-6', 1], ['gidbinn-hero-0', 2], ['gidbinn-hero-1', 3]
  ] as const)('selects the golden private pool index for %s', (playerId, index) => {
    const reward = resolveQuestUniqueProfile(loadQuestUniqueProfile(), pools, playerId, BLADE);
    expect(reward).toEqual({ uniqueId: expectedEntries[index].uniqueId, ilvl: 34 });
    const seed = hashSeed(JSON.stringify(['quest-unique-v1', playerId, BLADE, reward?.uniqueId, 34]));
    const item = rollUniqueItem(required(reward), pools, createRng(seed));
    expect(item).toMatchObject({
      uniqueId: expectedEntries[index].uniqueId, baseId: expectedEntries[index].baseId,
      rarity: 'unique', level: 34, ilvl: 34, identified: true
    });
    const retry = rollUniqueItem(required(reward), pools, createRng(seed));
    expect(retry).toEqual({ ...item, id: retry?.id });
    expect(retry?.id).not.toBe(item?.id);
  });

  it.each(['missing', 'duplicate', 'wrong-base', 'ineligible', 'invalid-level', 'missing-base', 'wrong-base-definition'] as const)(
    'rejects the entire profile for an unselected %s member', kind => {
      // This identity selects Nagelring; damage Stone of Jordan instead.
      const unique = required(pools.uniques?.find(row => row.id === expectedEntries[3].uniqueId));
      const uniques = required(pools.uniques).filter(row => row.id !== unique.id);
      if (kind !== 'missing') uniques.push({ ...unique,
        ...(kind === 'wrong-base' ? { baseId: 'items/base/amulet' } : {}),
        ...(kind === 'ineligible' ? { qlvl: 35 } : {}),
        ...(kind === 'invalid-level' ? { qlvl: Number.NaN } : {})
      });
      if (kind === 'duplicate') uniques.push(unique);
      const bases = new Map(pools.bases);
      const base = required(bases.get(unique.baseId));
      if (kind === 'missing-base') bases.delete(unique.baseId);
      if (kind === 'wrong-base-definition') bases.set(unique.baseId, { ...base, slot: 'amulet' });
      expect(resolveQuestUniqueProfile(loadQuestUniqueProfile(), { ...pools, uniques, bases },
        'gidbinn-hero-9', BLADE)).toBeUndefined();
    }
  );

  it('keeps future catalog rings outside the fixed profile', () => {
    const unique = required(pools.uniques?.find(row => row.id === expectedEntries[0].uniqueId));
    const extended = { ...pools, uniques: [...required(pools.uniques),
      { ...unique, id: 'items/unique/future-ring', weight: Number.MAX_SAFE_INTEGER }] };
    expect(resolveQuestUniqueProfile(loadQuestUniqueProfile(), extended, 'gidbinn-hero-9', BLADE))
      .toEqual({ uniqueId: expectedEntries[0].uniqueId, ilvl: 34 });
  });

  it.each([
    { profileId: PROFILE_ID }, { profileId: 'quest-rewards/unknown' },
    { profileId: PROFILE_ID, ilvl: 34 }, { profileId: PROFILE_ID, uniqueId: expectedEntries[0].uniqueId },
    { profileId: PROFILE_ID, entries: expectedEntries }
  ])('validates only the closed authored profile reference: %j', itemDrop => {
    const validate = new Ajv2020({ strict: true, allErrors: true }).compile(questSchema);
    const document = structuredClone(mainDocument);
    Object.assign(required(document.quests[0]), { rewards: { itemDrop } });
    expect(validate(document)).toBe(Object.keys(itemDrop).length === 1 && itemDrop.profileId === PROFILE_ID);
  });
});

describe('Mephisto dedicated level-47 quest cache', () => {
  const input = { tableId: 'loot/mephisto-q', ilvl: 47, picks: 5 };
  const pools = loadAwardPools();
  const tc = required(pools.treasureClasses.get(input.tableId));
  function controlled(selection: number, uniqueSelection = 0): Rng {
    const rng = createRng(197);
    let count = 0;
    // Five TC selections happen before the five unique-template selections.
    return { ...rng, next: () => count++ < 5 ? selection : uniqueSelection };
  }

  it('preserves the reviewed unique reward and adds a weight-preserving rare claw sibling', () => {
    expect(required(treasureClasses.find(row => row.id === input.tableId)).entries).toEqual([
      { type: 'item', itemBase: 'items/base/armor-breast-plate', rarity: 'unique', weight: 60, minLevel: 38, maxLevel: 60 },
      { type: 'item', itemBase: 'items/base/wp1h-phase-blade', rarity: 'rare', weight: 75, minLevel: 38, maxLevel: 60 },
      { type: 'item', itemBase: 'items/base/wp1h-feral-claws', rarity: 'rare', weight: 75, minLevel: 38, maxLevel: 60 },
      { type: 'rune', itemId: 'runes/lem', weight: 50 },
      { type: 'gold', weight: 100, quantityMin: 25000, quantityMax: 60000 }
    ]);
  });

  it.each(['items/unique/iron-pelt', 'items/unique/crow-caw', 'items/unique/goldskin', 'items/unique/shaftstop'])(
    'materializes selected eligible breastplate unique %s without fallback', uniqueId => {
      const eligible = required(pools.uniques).filter(row => row.baseId === 'items/base/armor-breast-plate'
        && (row.qlvl ?? row.reqLevel) <= 47);
      const index = eligible.findIndex(row => row.id === uniqueId);
      expect(index).toBeGreaterThanOrEqual(0);
      const cache = rollQuestTableRewards(input, pools, controlled(0.05, (index + 0.5) / eligible.length));
      expect(cache?.items).toHaveLength(5);
      expect(cache?.items.every(row => row.uniqueId === uniqueId && row.rarity === 'unique' && row.ilvl === 47)).toBe(true);
    }
  );

  it.each([0.3, 0.5, 0.65, 0.9])('materializes each other selectable table entry at roll=%s', selection => {
    const cache = required(rollQuestTableRewards(input, pools, controlled(selection)));
    if (selection === 0.3 || selection === 0.5) {
      expect(cache.items).toHaveLength(5);
      expect(cache.items.every(row => row.baseId === (selection === 0.3 ? 'items/base/wp1h-phase-blade' : 'items/base/wp1h-feral-claws') && row.rarity === 'rare')).toBe(true);
    } else {
      expect(cache.items).toEqual([]);
      if (selection === 0.65) expect(cache.runes).toBe(5);
      else expect(cache.runeShards).toBeGreaterThanOrEqual(5 * 25000);
    }
  });

  it('refuses the whole cache if selected unique materialization would downgrade', () => {
    const noEligibleUniques = { ...pools, uniques: required(pools.uniques).filter(
      row => row.baseId !== 'items/base/armor-breast-plate'
    ) };
    expect(rollQuestTableRewards(input, noEligibleUniques, controlled(0.05))).toBeUndefined();
    // The historical dusk-shroud graph also has no eligible unique at level47.
    const badTable = new Map(pools.treasureClasses);
    badTable.set(tc.id, { ...tc, picks: tc.picks.map(pick => pick.rarity === 'unique'
      ? { ...pick, baseId: 'items/base/armor-dusk-shroud' } : pick) });
    expect(rollQuestTableRewards(input, { ...pools, treasureClasses: badTable }, controlled(0.05))).toBeUndefined();
  });
});
