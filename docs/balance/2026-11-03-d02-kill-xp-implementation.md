# D02 — Shared kill XP correction and prospective feasibility

Status: implemented and locally verified; earned campaign and full acceptance open.
Date:2026-11-03. Owner:root. Formal balance acceptance remains0/210.

## Production change

The [selected policy](../design/kill-xp-policy.md) replaces linear later-level
kill rewards with `max(5,round(10*m*max(1,(m/18)^1.5)))`, using resolved enemy
level. Its five scalar fields are authored in JSON, validated by the registered
draft2020-12 schema and frozen on load. The shared XP function consumes them;
winning-wave settlement retains eligibility, per-enemy bonus flooring, mercenary
sharing and exact-once behavior. No historical XP, save version, level cost,
inverse boundary, cap90 or combat outcome is changed.

Early enemy rewards through18 stay exact. Selected later examples are19=206,
32=759,45=1779,47=1983,56=3073,61=3806,82=7973,90=10062,122=21527.
Initial Normal completion planning references remain14/32/47/61/82, paired with
5/12/22/30/40 cumulative active-hour centers. These are prospective references,
not native entry gates or measured acceptance. The inherited preparation targets,
caps, margin and retry limits stay unchanged.

## Focused verification

All evidence is in the retained packet
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.

- `d02-kill-xp-green-v1`:20 exact XP/cost/cap cases and13 policy/schema cases pass.
- `d02-native-kill-xp-green-v3`:four actual settlement cases pass: normal/bonus
  victory, draw and defeat; verify flooring,75% mercenary XP, playback and duplicate
  denial. These are constructed fixtures, not earned campaign progression.
- `d02-kill-xp-precompile-v1`:two selected precompilation tests pass, including
  14 generated-validator comparisons;47 unrelated cases filtered out.
- Scoped strict types and explicit lint pass. A policy-test lint cleanup reruns
  only that file's13 cases and lint; total distinct focused cases is39.
- `d02-kill-xp-browser-v1`:actual Chromium147 at360×640/zh-CN starts the app and
  imports production XP/policy. Six rewards, exact70/90 costs, cap and frozen
  policy pass without page/console errors. No combat, save import or store write.

Retain the linear-curve RED, native draw-fixture failures and initial lint failure.
The corrected draw fixture equips actual imported Life gear and recomputes
resources; it neither mocks a result nor changes production combat. Browser and
servers are closed; source stability is verified before/after.

New production authority:`d02-kill-xp-authority-v1.json`,2147 inputs, SHA256
`b8d597ce78114c59742eddf0ecacc686e775268f46118634b29747f93fe23715`.
Authority80 and all earned historical receipts remain immutable. The new
authority also contains the pre-existing campaign-workspace registration.

## Source/count feasibility without combat

`d02-cleared-source-feasibility-v1.json` authenticates the actual prepared
pre1232 native export and independent preparation readbackv3. It starts at
level49/totalXP22,719,660. Durance is already earned, cleared and eligible at the
two-level margin; its enemy range is42–47. All13 deterministic ordinal count
phases have at least51 original enemies across five fitted waves and one boss.
At minimum level42, each awards1497XP; a complete victory therefore awards at
least76,347XP with multiplier1. The13,663,947XP gap to56 fits179 complete wins
within200entries, leaving21 entries of conditional headroom.

This is a count proof conditional on future complete victories. It establishes
neither survival, actual source selection, economy nor active-hour pacing.
No native admission, save mutation or combat occurs; seed0 only constructs
structural roster/count projections. The previous generous bound showed linear
rewards could not meet the old River gap even if every admission won.

## Next earned comparison and remaining acceptance

Declare and freeze a distinct comparison from authenticated preparedpre1232,
using the new authority and opt-in `ranked-cleared-v1`. Carry102 original training
admissions/612 victorious waves, all three original quest Starts and the original
609-admission/600-training/180,000,000-combat-ms/600,000-wall-ms ceilings.
Conservatively deduct the full original256060.07459ms wall runtime. Never revive
exhausted1235/1434 or renew allowances. No earlier-act regression replay.

BUG613 remains open until earned feasibility and pacing are established. Faster
XP reduces loot and currency per level; economy/acquisition/recruitment acceptance
is unresolved. Rest of ActsIV/V,14 current populations/holdouts/fairness, retry/
manual-idle,30–50 active-hour pacing, performance, G0–G7 and soak/review remain.
Browser works;CI excluded;owner playtest follows implementation. No user answer
or external blocker is pending. Root retains the worktree and packet through
umbrella review and owns eventual artifact cleanup/worktree release.
