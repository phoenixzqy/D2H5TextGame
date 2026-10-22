import type { ResolveChallengeWavePlanInput, WavePlan } from '@/engine/combat/sub-area-run';

/** Synthetic encounter fixture frozen from 49af342, Blood Moor seed7/ordinal0.
 * Preserves carry/replay oracles independently of campaign composition changes.
 * Actual production planning is covered by sub-area-run.test.ts. */
const affix = {"id": "elite-affix/extra-fire-damage", "nameKey": "combat.eliteAffix.extraFireDamage", "skillId": "monster-fire-ball"};

const plan: WavePlan = {
  subAreaId: "areas/act1-blood-moor",
  defaultLootTable: "loot/trash-act1",
  mode: "manual",
  seed: 7,
  difficulty: {"areaLevel": 2, "monsterLevelBonus": 0, "finaleBand": "none"},
  waves: [
    {
      id: "areas/act1-blood-moor-challenge-w1",
      waveTier: "trash",
      presentation: {"kind": "trash", "difficultyBand": "normal"},
      spawns: [
        {"archetypeId": "monsters/act1.fallen", "tier": "trash", "level": 2, "index": 0},
        {"archetypeId": "monsters/act1.fallen", "tier": "trash", "level": 2, "index": 1},
        {"archetypeId": "monsters/act1.fallen", "tier": "trash", "level": 2, "index": 2},
        {"archetypeId": "monsters/act1.quill-rat", "tier": "trash", "level": 2, "index": 0},
        {"archetypeId": "monsters/act1.fallen", "tier": "trash", "level": 2, "index": 3},
        {"archetypeId": "monsters/act1.fallen", "tier": "trash", "level": 2, "index": 4},
        {"archetypeId": "monsters/act1.fallen", "tier": "trash", "level": 2, "index": 5},
        {"archetypeId": "monsters/act1.quill-rat", "tier": "trash", "level": 2, "index": 1},
      ]
    },
    {
      id: "areas/act1-blood-moor-challenge-w2",
      waveTier: "elite",
      presentation: {"kind": "elite", "isForcedElite": true, "forcedEliteKind": "champion", "difficultyBand": "normal"},
      spawns: [
        {"archetypeId": "monsters/act1.fallen", "tier": "champion", "level": 3, "index": 0, eliteAffix: affix },
        {"archetypeId": "monsters/act1.fallen", "tier": "champion", "level": 3, "index": 1, eliteAffix: affix },
        {"archetypeId": "monsters/act1.fallen-shaman", "tier": "champion", "level": 3, "index": 0, eliteAffix: affix },
        {"archetypeId": "monsters/act1.zombie", "tier": "champion", "level": 3, "index": 0, eliteAffix: affix },
        {"archetypeId": "monsters/act1.fallen", "tier": "champion", "level": 3, "index": 2, eliteAffix: affix },
        {"archetypeId": "monsters/act1.fallen", "tier": "champion", "level": 3, "index": 3, eliteAffix: affix },
        {"archetypeId": "monsters/act1.fallen-shaman", "tier": "champion", "level": 3, "index": 1, eliteAffix: affix },
        {"archetypeId": "monsters/act1.zombie", "tier": "champion", "level": 3, "index": 1, eliteAffix: affix },
        {"archetypeId": "monsters/act1.fallen", "tier": "champion", "level": 3, "index": 4, eliteAffix: affix },
      ]
    },
    {
      id: "areas/act1-blood-moor-challenge-w3",
      waveTier: "elite",
      presentation: {"kind": "elite", "isForcedElite": true, "forcedEliteKind": "rareElite", "difficultyBand": "normal"},
      spawns: [
        {"archetypeId": "monsters/act1.zombie", "tier": "rare-elite", "level": 6, "index": 0, eliteAffix: affix },
        {"archetypeId": "monsters/act1.zombie", "tier": "rare-minion", "level": 6, "index": 1, eliteAffix: affix },
        {"archetypeId": "monsters/act1.quill-rat", "tier": "rare-minion", "level": 6, "index": 2, eliteAffix: affix },
        {"archetypeId": "monsters/act1.quill-rat", "tier": "rare-minion", "level": 6, "index": 3, eliteAffix: affix },
        {"archetypeId": "monsters/act1.zombie", "tier": "rare-minion", "level": 6, "index": 4, eliteAffix: affix },
        {"archetypeId": "monsters/act1.zombie", "tier": "rare-minion", "level": 6, "index": 5, eliteAffix: affix },
        {"archetypeId": "monsters/act1.quill-rat", "tier": "rare-minion", "level": 6, "index": 6, eliteAffix: affix },
        {"archetypeId": "monsters/act1.quill-rat", "tier": "rare-minion", "level": 6, "index": 7, eliteAffix: affix },
        {"archetypeId": "monsters/act1.zombie", "tier": "rare-minion", "level": 6, "index": 8, eliteAffix: affix },
        {"archetypeId": "monsters/act1.zombie", "tier": "rare-minion", "level": 6, "index": 9, eliteAffix: affix },
      ]
    },
  ]
};

/** Return a fresh controlled plan; reject accidental use for another scenario. */
export function preBoundedActOnePlanFixture(input: ResolveChallengeWavePlanInput): WavePlan {
  if (input.subArea.id !== plan.subAreaId || input.seed !== 7 || input.challengeOrdinal !== 0
    || (input.mode ?? 'manual') !== 'manual') {
    throw new Error('Pre-bounded encounter fixture requires manual Blood Moor seed7/ordinal0');
  }
  return structuredClone(plan);
}
