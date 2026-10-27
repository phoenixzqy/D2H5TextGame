/** Frozen candidate policies: diagnostic replay of earned gear, never genuine successors. */
export const P15_POLICY = {
  version: 'p15-sorceress-act5-screen-v1',
  source: 'docs/plans/evidence/fixtures/earned-endgame4/retained-final.json.gz',
  gzipSha256: '73c79b289f9c010ee5b75813aa14867f4cf7616e2847ac52245b7fb9e3bd70f6',
  rawSha256: '7fc4a5495355542b07a0cc05bb265ee0502d9e6ffd968938902203acf5da5007',
  clockEpochMs: 1792785263368,
  area: 'areas/act5-bloody-foothills',
  location: 'a5-bloody-foothills',
  challengeOrdinal: 431,
  seeds: [1, 2, 3, 4, 5, 6, 7, 8],
  builds: {
    cold: {
      ranks: [
        ['sorceress.ice_bolt', 1],
        ['sorceress.ice_blast', 1],
        ['sorceress.glacial_spike', 1],
        ['sorceress.blizzard', 4],
        ['sorceress.frozen_orb', 20],
        ['sorceress.cold_mastery', 20],
        ['sorceress.warmth', 1]
      ],
      priority: ['sorceress.frozen_orb', 'sorceress.blizzard', 'sorceress.ice_blast']
    },
    fire: {
      ranks: [
        ['sorceress.fire_bolt', 1],
        ['sorceress.inferno', 1],
        ['sorceress.blaze', 1],
        ['sorceress.fire_wall', 1],
        ['sorceress.fire_ball', 20],
        ['sorceress.meteor', 3],
        ['sorceress.fire_mastery', 20],
        ['sorceress.warmth', 1]
      ],
      priority: ['sorceress.meteor', 'sorceress.fire_ball']
    }
  }
} as const;
export type P15Build = keyof typeof P15_POLICY.builds;
