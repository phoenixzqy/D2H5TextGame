import type { Item } from '@/engine/types/items';

/** Separate saved-domain experiment; assertions never inject equipment or points. */
export const nativeContinuationPolicy = {
  id: 'native17-v2-earned-rocky-waste-v1',
  plan: 'docs/plans/evidence/fixtures/fresh-native17-campaign-screen/native17-v2-rocky-waste-frozen-plan.md',
  source: 'docs/plans/evidence/fixtures/fresh-native17-campaign-screen/native17-v2-native-export.json.gz',
  sourceGzipSha256: '51d1611a1dbae156d43293a392ccdb5749a61161605f0a47f91c1c050e48655e',
  sourceRawSha256: 'c038427361d2171ebb3693509804966ff5538f2b9bd6e0da1d23f660516567d6',
  sourceSaveHash: '688505bef96a7fc2129564d12c1215cc82709d55ffc1d11dac7c365053ed6a8f',
  sourceEarnedHash: '64972a1f3494c8f488fd85a843365e6d07a628c5c7a5ffcfdf688b579e789df7',
  parentReportRawSha256: '90a79b6c0fe564f250379660705fb7ab9cc619dc2726c5b4fe1eb9d8e021a1cd',
  clockEpochMs: 1792497600000,
  mercId: 'mercs/act1-rogue-inner-sight',
  area: 'areas/act2-rocky-waste',
  expectedOrdinal: 108,
  maxWaves: 4,
  skill: 'skills-sorceress-ice-blast',
  amulet: { id: 'it-4fzod-2jh', baseId: 'items/base/amu-brass', rarity: 'rare', level: 19, ilvl: 19,
    baseRolls: {}, generatedName: {}, identified: false, equipped: false,
    affixes: [{ id: 'affix.mystic.mana.flat', rolledValue: 21, tier: 1 },
      { id: 'affix.nimble.phys-dodge', rolledValue: 4, tier: 1 },
      { id: 'affix.savage.crit-damage', rolledValue: 26, tier: 1 },
      { id: 'affix.cold.resistance', rolledValue: 12, tier: 1 },
      { id: 'affix.bat.mana.flat', rolledValue: 25, tier: 1 },
      { id: 'affix.fire.resistance', rolledValue: 11, tier: 1 }] } satisfies Item
} as const;

export function parseNativeContinuation(value: string | undefined) {
  if (value === undefined) return null;
  if (value === nativeContinuationPolicy.id) return value;
  throw new Error('Unknown earned native continuation experiment');
}
