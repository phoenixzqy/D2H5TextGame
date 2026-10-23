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

export type FreshCampaignStage = 'one-preparation-wave' | 'accepted-preparation' | 'native17-act2';

/** Reject unreviewed recipes and accidental unbounded runs at the invocation boundary. */
export function parseFreshCampaignStage(value: string | undefined): FreshCampaignStage {
  if (value === undefined || value === 'one-preparation-wave') return 'one-preparation-wave';
  if (value === 'accepted-preparation' || value === 'native17-act2') return value;
  throw new Error('Unknown fresh campaign stage');
}
