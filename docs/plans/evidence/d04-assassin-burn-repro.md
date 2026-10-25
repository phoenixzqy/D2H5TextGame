# D04 — Native Assassin Burn reproduction

2026-10-25. Reproduced only; all seven inventory rows remain unverified.
Root sole writer; independent design/QA and earned balance remain open.
[BUG205](../../../production/bugs/BUG-205-assassin-burn-missing-periodic-damage.md)
records the defect before any source repair.

The Dragon Talon packet retains `scratch/assassin-burn-native-repro.ts`,
`scratch/assassin-burn-native-observed.json`,
`scratch/assassin-burn-native-audit.json`, the `next-assassin-burn-repro`
command log/terminal receipt and `scratch/next-assassin-burn-source-audit.json`.
Its intended exit1 asserts that landed declared Burn must cause periodic HP
loss. This separate diagnostic does not invalidate the required unit suite.

Native L30 Assassin allocation recursively includes real prerequisites; only
the selected root is in priority. Ranks1/2/20 ×seeds7/19/41/97 ×seven skills
produce84cases. Each has one1700ms action/payment, immutable inputs, exact
recorded replay and final target HP equal to2000 minus direct and periodic
damage. Resources, holds and opponents are disclosed synthetic fixtures.

| Data slug (`skills-assassin-…`) | Cases / positive hits / Burn markers | Periodic HP loss | Rank1 seed7 direct HP | Rank20 seed7 direct HP |
| --- | --- | ---: | ---: | ---: |
| fire-blast | 12 / 9 / 9 | 0 | 51 | 146 |
| phoenix-strike | 12 / 9 / 9 | 0 | 123 | 351 |
| fists-of-fire | 12 / 9 / 9 | 0 | 46 | 141 |
| dragon-tail | 12 / 9 / 9 | 0 | 71 | 185 |
| wake-of-fire | 12 / 9 / 9 | 0 | 61 | 156 |
| wake-of-inferno | 12 / 9 / 9 | 0 | 92 | 225 |
| death-sentry | 12 / 9 / 9 | 0 | 87 | 220 |

All seven declare Burn but omit explicit `statusEffect.dotPctOfDamage`.
Existing Burn/Ignite aliasing works; all63positive hits apply a real marker.
The missing damaging potency is independently observable in actual final HP.

The source audit matches the frozen1380source/test/config, two controlling
Dragon Talon design files,760build files and historical HEAD19773fc5. That
HEAD predates the uncommitted Dragon Talon change; exact snapshot equality is
not a claim that historical HEAD already contains the tested patch. The later
actual committed-blob audit establishes the snapshot's committed provenance.

A common explicit reference fraction may follow the existing
[Druid fire contract](../decisions/D04-druid-fire-dot-v1.md), with provisional
tuning and no global fallback. Before a Phoenix patch, resolve its ignored
typed breakdown and Fire-component potency. This finding does not waive
charge, persistent-trap, corpse or other advertised behavior and grants no
whole-skill credit. Those requirements remain in the full213-skill objective.
Death Sentry's Fire/Burn JSON also conflicts with its bilingual lightning-trap
and corpse-explosion promise. Its damage identity needs resolution before
adding a Burn rate; a blind seven-row potency patch would preserve that defect.

Genuine claimed Ancients/Rite remainsL33/XP149261/nextNormal402/Nightmare0,
Baal uncleared. Its decompressed SHA256 remains
`c4a543af9db6b6b926ece07417b82c80c39615a53cbb03e2a358074f019a7577`.
No earned progression, balance, independent acceptance or complete-v1 claim.
