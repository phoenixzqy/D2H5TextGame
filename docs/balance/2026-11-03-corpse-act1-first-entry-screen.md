# Corpse and curses — earned Act I first-entry screen

BALANCE-CHECK: CONCERNS

2026-11-03. Owner root. The preregistered 100-seed Catacombs screen completed
**98 whole-area victories and two boss draws**, with no hero deaths. The separate
reader reconciles all 600 waves and 100 complete terminal saves. The boss median
is within the timing target, but the win-rate interval is above the first-attempt
strength band. This is diagnostic evidence from one earned acquisition history;
formal balance remains **0/210**.

## Earned input and protocol

Input: `p15-first-entry-corpse-act1-v1.native-export.json`, SHA256
`6ff17b5e17c7768dc7af62023ffedaac95ad9b86515b26239733f4d0dc110ae1`.
The [first-entry recorder](2026-11-03-first-boss-entry-provenance.md) retained the
exact save before the subsequent original native admission108/seed958288104.
The acquisition reader independently joins those bytes to the admission and
reconciles earned items, XP, currencies, materials and 11 stat/14 skill allocations.
Original metadata hashes predate BUG620; exact native bytes and the independent
journal reconciliation authenticate this sample, not the old metadata hashes.

Hero level12, CE5, Teeth3, Inner Sight Rogue level16, native formation and all
actual owned gear are retained. The source includes earned Torch of Iros and set
items; their presence in one history does not prove typical acquisition. Its
first-entry cost is108admissions/307played waves/3,057,484.313combatms, including
one nonwin/5,100ms. Automated inventory decisions have no calibrated menu time,
so neither this combat-only cost nor the 20.94s acquisition execution time proves
observed player pacing. The full original Act I sample has109admissions/313waves,
312wins/1defeat, a legal training/retry, and an Andariel win.

Each trial restores the exact same first-entry bytes and applies only the native
existing grow/combo preparation. The order remains Weaken, Corpse Explosion,
Bone Armor, Bone Wall, Teeth. No gear search, grants, training, spending, retry or
adaptation occurs. Exploration seeds are exactly1–100. The explicit challenge
ordinal is fixed108 for every seed; ordinary count fitting depends on that
ordinal and must not vary with RNG. Holdouts10001–11000 remain untouched.

Production manual Normal planning generates five nonboss waves with12,13,14,15,
16enemies, then single chapter-boss Andariel. The final two packs contain the
native champion and rare/minion guards. All six waves use production combat,
resource/cooldown/summon carry and native XP/loot/quest settlement. Wave seed is
`(runSeed ^ ((waveIndex + 1) * 0x9e3779b1)) >>> 0`; ordinary loot retains the
native `runSeed ^ 0x9e3779b1 ^ waveIndex` and wishstone forks. Default saved
ordinal108 remains unchanged in each diagnostic realm.

## Results

| Measure | Result |
| --- | --- |
| Whole-area starts / wins / draws / defeats | 100 / 98 / 2 / 0 |
| Whole-area win-rate nominal95%Wilson interval | 92.999–99.450% |
| Hero / mercenary death trials | 0 / 2 |
| Hero-death-rate nominal95%upper bound | 3.70% |
| Andariel reached / wins | 100 / 98 |
| Area victory duration p10 / p50 / p90 / p95 | 81.698 / 89.609 / 100.384 / 104.664s |
| Boss victory duration p10 / p50 / p90 / p95 | 16.980 / 21.508 / 26.036 / 27.168s |
| Failed boss durations | 60s each, seeds74and87 |
| Whole-area terminal hero Life p10 / p50 | 254 / 295 |
| Whole-area terminal hero Mana p10 / p50 | 264 / 264 |
| Original enemies / carry edges verified | 7,100 / 500 |
| Whole saves / quest transitions reconciled | 100 / 98 |
| Zero-mana waves | 0 / 600 |
| CE / Weaken / Bone Wall / Teeth hero actions | 1,613 / 2,985 / 854 / 470 |
| Direct outgoing physical / fire / arcane damage | 405,906 / 2,585,130 / 7,924 |
| Native XP / items | 1,137,188 / 5,314 |
| Items: normal / rare / unique / set | 4,983 / 311 / 20 / 0 |
| XP / items per logical combat hour | 448,479 / 2,096 |

All first five waves won100/100. Their median durations are9.000,7.924,9.056,
12.000and28.300s. The separate reader's `heroFinalWaveLife` and
`mercFinalWaveLife` fields pool all settled waves despite their inherited names;
the terminal hero values above are derived explicitly from each trial's last
wave. `minimumWaveMana` likewise pools wave minima. No missing or failed trial
is excluded. Victory-duration percentiles use nearest rank over victorious
samples only; both60sdraws remain in total costs and yield denominators.

Both boss draws retain a living hero and370Andariel Life after the mercenary
dies. This warrants saved-event diagnosis if tuning addresses these failures;
no retry or favorable-seed replacement was run. The conditional98%first-attempt
rate exceeds the60–90%target, while21.508smedian lies within20–50s. The sample
cannot separate mechanic strength from equipment/power acquisition effects.
Per-kill loot law, upgrades/hour, cross-build fairness, manual/idle equivalence,
three-attempt adaptation and fresh-campaign pacing remain unproven.

## Evidence, source and cost

Root-owned packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
Retain all `p15-catacombs-first-entry-screen-v1` artifacts: frozen plan, driver,
memory-only launcher, initial reader, result, gzip journal, process receipt and
passing readback. Plan/script/input references were frozen before execution.

Plan SHA256: `9e5b169b3728eac8bb73b05a93fde102057e5eca055e32531ff4bf75f4639e0e`.
Result SHA256: `3f03aac76b0ce5f81535e2d15e35029f20b942f1918406d458065a3967ec4509`.
Reader SHA256: `a2c60f1505958e757cf287fe87303f8e4a215cc1b636966af4f82f0317b95889`.

The reader independently derives fixed-count enemy memberships from authored
Catacombs data and the documented fitting/guard rules; affix selection and
per-kill loot/XP amounts remain native production inputs. It reconstructs every
whole export, native carry, clock, rewards, quest transition and unique ownership.
This root verification is not independent reviewer/QA sign-off.

Bounds were100admissions/0training/0retries,6waves each,600000combatms/admission,
60000000combatms total,600000driverwallms/660000launcherwallms/90000readerwallms,
and128MiB each result/journal. Actual:9,128,361.302combatms,32,852.005driverwallms,
37,007.305launcherwallms,2,963.790readerwallms,6,377,679journalbytes; zero staged
unplayed combat. All bounds hold. Launcher and reader are terminal; the exact
owned launcher PID is absent. Memory-only bundling creates no disposable cache.

All2149production/provenance and128campaign inputs authenticate against
`p15-first-entry-hash-v2-source.json`; gameplay/data did not change. Existing
25hash-regression/scoped-type/explicit-lint passes are reused; no unrelated suite
or completed historical campaign was replayed. Root retains the required packet
and claimed human2worktree through umbrella review and owns eventual cleanup/release.

Genuine Act V continuation remains `p15-eve-claim-native-v1.native-export.json`,
SHA256 `74d41e2b3a95172f244c2b34b50096b16835ba18190a6a4062b19240623f50c1`,
level75/19-of-19/next1658. Diagnostics do not replace or advance it. BUG611,
BUG592,14-build fixtures/holdouts, economy/pacing/fairness, Hell/endgame and
integratedG0–G7/soak/review/later owner playtest remain open. Browser works,
CI excluded, no pending owner question or external blocker.
