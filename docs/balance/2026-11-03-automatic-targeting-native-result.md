# Automatic target acquisition and native admission 1596

2026-11-03. D07 is implemented: eligible active Taunt wins; otherwise effective
player actors prefer non-summoned enemies, then lowest absolute current Life,
then original registration order. All-summon pools remain eligible. Enemy
weighted aggro/Decoy, AOE lists, damage, resource payment, RNG and saves retain
their previous rules. Shared hero/mercenary/summon/converted actors and Hydra
acquisition use the existing selector. No class, map or seed exception exists.

The initial lowest-Life-only version exposed a replacement-summon regression;
the retained failing test precedes the final non-summon tier. Two Conversion
and panic fixture groups now explicitly Taunt their intended recipient instead
of assuming the old registration-order choice. Their behavioral assertions
remain unchanged. Final affected checks: 74 selection/panic cases and 51
Conversion/Hydra/body-delivery controls pass, 125 total. Scoped strict types
and four-file lint pass. Earlier evidence for 119 other cases is reused, not
represented as a final-source rerun. No browser check or earlier-act replay.

One prospectively bounded native admission, ordinal 1596, resumes the actual
1595 export with Dim Vision → Decrepify → Corpse Explosion and owned equipment.
Waves 1–3 win in 43.539/36.160/21.200 seconds. Wave 4 draws at 60 seconds with
three of eight original enemies alive and both allies surviving. Its first
corpse arrives at 4.614 seconds; five CE casts deal 3,729 direct damage. The
successful waves earn 24 items and 281,587 XP; the failed wave earns nothing.
Independent readback verifies complete save/custody/rewards, clocks, ordinals,
2,149 production inputs and 125 campaign inputs. Source tree:
`438beb31b56acb305b0d5e584f3e2008b8ad2baa9830ef9da4d7cf343816c544`.
The preceding attempt had a different population; these are not paired timings
or evidence for a causal win-rate improvement.

The three survivors are champions: two Death Maulers at 3,130 and 9,385 Life,
and one Frozen Terror at 12,779. Recorded hero basic damage totals 9,164 across
40 actions (2,417 after 30 seconds); mercenary fallback basics contribute
2,745 across 11 actions, separately from Basic Arrow 9,287 and Cold Arrow 6,967.
Cold Arrow has multiple damage components, so dodge-event counts are not action
miss rates. Sustained pack/champion/singleton damage remains the next diagnosis;
target acquisition alone does not close BUG611.

Resume only `p15-d07-targeting-native-v1.native-export.json` in the root packet,
SHA256 `764a1aac8003431c1c8c1e2131a07a1d018df9ea4ba43ae46773848d590a0122`,
next ordinal 1597. Prior saves/terminal controllers and closed experiment families
must not be resumed. This admission costs 160,899.010 logical combat ms,
1,833.926 driver ms and 394,420 journal bytes, no training or formal balance cell.
Raw inputs/runner/result/journal/export/process and independent reader use stem
`p15-d07-targeting-native-v1`; source/test/type/lint receipts use
`d07-auto-target-v1`. All recorded consumers are terminal; memory-only native
bundling creates no cache. Root retains the human2 worktree and required packet
through umbrella review and owns eventual cleanup/release.

Act V remains 13/19 main actions; formal acceptance remains 0/210. BUG611,
BUG592 and full private v1 remain open. Remaining Act V/Baal, all 14 builds and
holdouts/fairness, economy/Hell, adaptation/manual-idle/defeat-retry, logical
30–50 active-hour pacing and integrated G0–G7/soak/independent review remain.
Owner playtest follows implementation. Browser works, CI excluded, no pending
owner question or external blocker. Security check passes for local first-party
code; no credentials, dependencies, permissions, network or publication changed.
