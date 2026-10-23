import type { Item } from '@/engine/types/items';

/** Authenticated earned ancestry and immutable boundaries for a separate farming experiment. */
export const economyPolicy = {
  id: 'native17-v2-earned-catacombs24-v1',
  plan: 'docs/plans/evidence/fixtures/fresh-native17-campaign-screen/native17-v2-catacombs24-frozen-plan.md',
  source: 'docs/plans/evidence/fixtures/fresh-native17-campaign-screen/native17-v2-rocky-waste-native-export.json.gz',
  sourceGzipSha256: '167f9618fec18a72dbedd9af5c8aa902de16aee1789b3f59c44c14c6353bed18',
  sourceRawSha256: '241e6a0a8b2eb0686bdd4dbeac363139558dbf47d139dcd9f1cea6c054711813',
  sourceSaveHash: 'f7ad0d5e0a644ae1b101ec6f07d8f451e907224cc483f6db11fcc82ac4b207e6',
  sourceEarnedHash: 'e4dfe9a158d847b7b14c922b445d5ea212db0eaec3e3e8769c870e271815d660',
  parentReportRawSha256: 'd8755a6fbdf39b9924864a2cadb7e6615dc3ef3c9854fb7a12ff44ff47ebb346',
  clockEpochMs: 1792497600000,
  expectedOrdinal: 109,
  mercId: 'mercs/act1-rogue-inner-sight',
  farmArea: 'areas/act1-catacombs',
  targetArea: 'areas/act2-far-oasis',
  targetLevel: 24,
  maxFarmLaunches: 200,
  maxFarmWaves: 1200,
  farmBudgetMs: 20_700_000,
  totalBudgetMs: 21_600_000,
  settlementPauseMs: 1500,
  frost: 'skills-sorceress-frost-nova',
  ice: 'skills-sorceress-ice-blast',
  glacial: 'skills-sorceress-glacial-spike',
  radament: 'quests/act2-radaments-lair',
  gloves: {
  "id": "it-2znuq-2gv",
  "baseId": "items/base/glove-heavy",
  "rarity": "rare",
  "level": 9,
  "ilvl": 9,
  "baseRolls": {
    "defense": 8
  },
  "affixes": [
    {
      "id": "affix.mystic.mana.flat",
      "tier": 0,
      "rolledValue": 11
    },
    {
      "id": "affix.ethereal.magic-dodge",
      "tier": 0,
      "rolledValue": 2
    },
    {
      "id": "affix.vital.life.flat",
      "tier": 0,
      "rolledValue": 9
    },
    {
      "id": "affix.fire.resistance",
      "tier": 0,
      "rolledValue": 8
    }
  ],
  "generatedName": {},
  "identified": false,
  "equipped": false,
  "socketCapacity": 2
} satisfies Item,
  boots: {
  "id": "it-2a4mq-2gx",
  "baseId": "items/base/boot-heavy",
  "rarity": "set",
  "level": 9,
  "ilvl": 9,
  "baseRolls": {
    "defense": 9
  },
  "affixes": [],
  "statRolls": {},
  "generatedName": {},
  "identified": true,
  "equipped": false,
  "setId": "sets/tancred-battlegear",
  "setPieceId": "sets/tancred-battlegear/boots",
  "socketCapacity": 2
} satisfies Item
} as const;

export function parseEconomyExperiment(value: string | undefined) {
  if (value === undefined) return null;
  if (value === economyPolicy.id) return value;
  throw new Error('Unknown earned farming experiment');
}
