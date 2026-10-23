import type { Item } from '@/engine/types/items';

/** Unchanged accepted recipe checkpoint, before any level-six spending/transfers. */
export const freshCampaignPolicy = {
  id: 'accepted-fresh-act1-preparation-v1',
  clockEpochMs: 1792497600000,
  name: 'Earned Act I',
  classId: 'sorceress',
  mercId: 'mercs/act1-rogue-inner-sight',
  fire: 'skills-sorceress-fire-bolt',
  area: 'areas/act1-blood-moor',
  preparationCount: 40,
  source: 'docs/plans/evidence/fixtures/fresh-current-act2-screen/fresh-native.spec.ts.txt',
  // These are assertions about earned inventory, never injected item instances.
  literals: [
    { id: 'it-8jv2k-1', baseId: 'items/base/glove-leather', rarity: 'normal', level: 2, ilvl: 2,
      baseRolls: { defense: 4 }, affixes: [], generatedName: {}, identified: true, equipped: false },
    { id: 'it-96fga-3', baseId: 'items/base/glove-leather', rarity: 'normal', level: 2, ilvl: 2,
      baseRolls: { defense: 5 }, affixes: [], generatedName: {}, identified: true, equipped: false },
    { id: 'it-5iwwr-4', baseId: 'items/base/boot-leather', rarity: 'normal', level: 2, ilvl: 2,
      baseRolls: { defense: 3 }, affixes: [], generatedName: {}, identified: true, equipped: false }
  ] satisfies readonly Item[]
} as const;

/** Historical upgrades retain their exact IDs/fields; native capacity is read from ownership. */
export const freshCampaignUpgrades: readonly Item[] = [
  { id: 'it-71emu-12', baseId: 'items/base/helm-cap', rarity: 'normal', level: 2, ilvl: 2,
    baseRolls: { defense: 8 }, affixes: [], generatedName: {}, identified: true, equipped: false },
  { id: 'it-8n9ca-1b', baseId: 'items/base/weapon-bow-training', rarity: 'normal', level: 2, ilvl: 2,
    baseRolls: { attack: 17 }, affixes: [], generatedName: {}, identified: true, equipped: false },
  { id: 'it-71emu-1a', baseId: 'items/base/helm-cap', rarity: 'normal', level: 2, ilvl: 2,
    baseRolls: { defense: 8 }, affixes: [], generatedName: {}, identified: true, equipped: false },
  { id: 'it-96fga-8', baseId: 'items/base/glove-leather', rarity: 'normal', level: 2, ilvl: 2,
    baseRolls: { defense: 5 }, affixes: [], generatedName: {}, identified: true, equipped: false },
  { id: 'it-5iwwr-9', baseId: 'items/base/boot-leather', rarity: 'normal', level: 2, ilvl: 2,
    baseRolls: { defense: 3 }, affixes: [], generatedName: {}, identified: true, equipped: false }
];

/** Separately frozen new fresh experiment; these literals are assertions, never injected gear. */
export const freshCampaignV2 = {
  id: 'fresh-native17-v2-single-far-oasis',
  plan: 'docs/plans/evidence/fixtures/fresh-native17-campaign-screen/native17-v2-frozen-plan.md',
  transfers: [
    { owner: 'hero', slot: 'amulet', item: {
      id: 'it-6ghhi-2hx', baseId: 'items/base/amu-brass', rarity: 'rare', level: 12, ilvl: 12,
      baseRolls: {}, generatedName: {}, identified: false, equipped: false,
      affixes: [{ id: 'affix.mystic.mana.flat', rolledValue: 29, tier: 1 },
        { id: 'affix.ethereal.magic-dodge', rolledValue: 3, tier: 1 },
        { id: 'affix.vital.life.flat', rolledValue: 31, tier: 1 },
        { id: 'affix.physical.resistance', rolledValue: 8, tier: 1 }]
    } },
    { owner: 'hero', slot: 'chest', item: {
      id: 'it-111b8-2jg', baseId: 'items/base/armor-leather', rarity: 'rare', level: 19, ilvl: 19,
      baseRolls: { defense: 20 }, generatedName: {}, identified: false, equipped: false, socketCapacity: 0,
      affixes: [{ id: 'affix.nimble.phys-dodge', rolledValue: 4, tier: 1 },
        { id: 'affix.vital.life.flat', rolledValue: 31, tier: 1 },
        { id: 'affix.mystic.mana.flat', rolledValue: 20, tier: 1 },
        { id: 'affix.poison.resistance', rolledValue: 18, tier: 1 },
        { id: 'affix.lightning.resistance', rolledValue: 15, tier: 1 },
        { id: 'affix.physical.resistance', rolledValue: 12, tier: 1 }]
    } },
    { owner: 'merc', slot: 'head', item: {
      id: 'it-23pcn-2ji', baseId: 'items/base/helm-skull-cap', rarity: 'rare', level: 19, ilvl: 19,
      baseRolls: { defense: 14 }, generatedName: {}, identified: false, equipped: false, socketCapacity: 1,
      affixes: [{ id: 'affix.armor.defense.flat', rolledValue: 11, tier: 1 },
        { id: 'affix.vital.life.flat', rolledValue: 26, tier: 1 },
        { id: 'affix.ethereal.magic-dodge', rolledValue: 2, tier: 1 },
        { id: 'affix.poison.resistance', rolledValue: 17, tier: 1 },
        { id: 'affix.lightning.resistance', rolledValue: 10, tier: 1 },
        { id: 'affix.cold.resistance', rolledValue: 18, tier: 1 }]
    } }
  ] satisfies readonly { owner: 'hero' | 'merc'; slot: 'amulet' | 'chest' | 'head'; item: Item }[]
} as const;

export type FreshCampaignStage = 'one-preparation-wave' | 'accepted-preparation' | 'native17-act2' | 'native17-v2-far-oasis';

/** Reject unreviewed recipes and accidental unbounded runs at the invocation boundary. */
export function parseFreshCampaignStage(value: string | undefined): FreshCampaignStage {
  if (value === undefined || value === 'one-preparation-wave') return 'one-preparation-wave';
  if (value === 'accepted-preparation' || value === 'native17-act2' || value === 'native17-v2-far-oasis') return value;
  throw new Error('Unknown fresh campaign stage');
}
