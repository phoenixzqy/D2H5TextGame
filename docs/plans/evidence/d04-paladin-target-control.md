# D04 — Paladin target limits and control attacks

2026-10-25. BUG198 is locally repaired and verified. This packet establishes
bounded functionality for Zeal, Smite, Charge and Fist of the Heavens. Root is
the sole writer and author reviewer; independent design/QA and earned class/build
balance remain open. C2–C4, full G0–G7 and complete private v1 remain unfinished.

Controlling [contract](../decisions/D04-paladin-target-control-v1.md) and
[original bug](../../../production/bugs/BUG-198-paladin-target-cap-and-control-copy.md).

## Behavior and source

Runtime/native-test commit: `e2ea27c`. Presentation/test commit: `ed37092`.

Zeal explicitly authors `maxTargets: 3` in strict JSON. The ordinary area cast
resolves the unchanged densest cross, preserves its lowest-row/column anchor tie
and row-major target order, then keeps the first three living targets. Each gets
one independent ordinary hit/critical decision. One payment, action and cooldown;
misses or deaths do not select replacements. Arctic Blast's uncapped cross and
the shared grid/RNG implementation remain unchanged.

Smite and Charge retain their actual single-target Physical hit and Stun: one
second normally, half a second on bosses. Charge leaves position unchanged.
Fist retains its all-living-enemy Lightning hit and one-second Paralyze, including
bosses, ordinary misses and repeated-Paralyze rejection. These three control
implementations were preserved and tested for actual scheduling consequences.
Damage, growth, costs, cooldowns, unlocks and native eligibility remain unchanged.
No new shield-equipment requirement was invented for Smite.

Pure current/next/unlearned/MAX previews show the authored target cap and shared
control seconds. Both locales explain actual per-hit damage, target selection,
misses, boss duration, Charge's position and Fist's repeat failure. No save field,
version/migration, dependency, CI, threshold, global rate or skip change. Save22
remains controlling.

## Automated proof and provenance

Five new files add 113 cases: 21 schema, 23 actual-combat, 17 pure-preview,
20 native/playback and 32 bilingual component cases. Rank 1/2/20 native recordings
prove exact targets, one payment/action, final HP/MP playback, immutable inputs
and deterministic replay. Foreign class, unlearned/overcap/locked/prerequisite/
selection failures and both aliases are exercised. Engine cases cover sparse
grids, anchor ties, insertion order, dead targets, misses/kills without replacement,
unaffordable/cooling fallback and the uncapped real Arctic Blast cross.

Removing only the control payload permits the enemy's scheduled 2000ms action;
the actual skills interrupt it and resume at the next scheduled 4000ms action.
Status expiry does not invent an immediate action. A faster-caster paired fixture
proves that boss Stun expires before 2000ms while ordinary Stun still blocks it.
Actual expiry events, missed hits and a 16-seed repeated-Fist window cover duration,
boss and accepted/rejected repeat behavior. Status markers alone are not the proof.

| Final check | Observed result |
| --- | --- |
| Original native probe after repair | Eight rank1/20 cases, 48 controls and all requirements PASS; Zeal now targets exactly three. |
| Focused core | 44 passed / 2 files. |
| Focused previews/native/UI | 69 passed / 3 files. |
| Engine | 7,392 passed / 265 files; 85.795s wrapper. |
| Standard `npm test` | 14,158 passed / 623 files; two existing skips; 506.191s wrapper. |
| Typecheck | PASS, 40.918s. |
| Full lint / engine purity | PASS, 111.007s. |
| Explicit `VITE_E2E=false` production build | PASS, 12.816s. |
| Production bridge / precache | Four JS chunks bridge-free; all 756 precache references exist. |
| Frozen full-suite inputs | All 1,352 source/test/config and 760 build files, Git HEAD/status and genuine save exact before any staging. |
| Actual committed source | All 1,352 tested blobs match committed HEAD `ed37092` and disk; build and genuine hashes exact. |

Existing test-time React, bundle/precache and Browserslist warnings remain.
[Post-full audit](fixtures/paladin-control/post-full-freeze-audit.json),
[committed-source audit](fixtures/paladin-control/committed-source-audit.json),
[terminal receipts](fixtures/paladin-control/terminal-receipts.json).

## Public production-browser proof

Four isolated cases pass: en/zh-CN × 1280×800/360×640. Each uses public Paladin
creation, disclosed synthetic import, public allocation1→2 and selection, and
real Blood Moor combat for all four skills. The fixture is L30 with 50,000
life/mana equipment, −80 attack speed, four learned rank1 skills, legal learned
prerequisites and four free points. This is functional proof, not earned balance
or campaign acceptance. No production bridge or page error was present.

All 16 attacks show positive damage, with visible Stun/Paralyze for the control
skills. For Zeal, the harness waits for the second cast and counts the complete
first cast's damage/miss cues between cast markers: exactly three attempts in
every case. It does not stop after observing only the first three cues.

The separate output audit checks eight exact five-domain Save-close-new-page-
Continue pairs at rank 1/rank 2, points/configuration, and 80 geometry samples
(four skills × four cases × five sizes). Sizes: 360×640, 412×915, 640×360,
1280×800 and 1920×1080. No horizontal page overflow; allocation controls ≥44×44.
All 32 screenshots are retained; eight mobile details and two desktop combat
screenshots were visually inspected. Long details use ordinary document scroll;
exact combat log text remains in retained JSON. This is not full-game a11y or
performance acceptance.

[Browser audit](fixtures/paladin-control/browser-evidence-audit.json),
[visual inspection](fixtures/paladin-control/visual-inspection.json),
[English mobile](fixtures/paladin-control/paladin-control-en-mobile.png),
[Chinese mobile](fixtures/paladin-control/paladin-control-zh-CN-mobile.png).

## Failures and author review

The [original native RED](fixtures/paladin-control-repro-198/packet.json) retains
both Zeal five-target failures before the repair. Raw evidence also preserves
the original core RED, interrupted edit, misleadingly named still-RED attempts,
incorrect dead-grid/timing fixture assumptions and their corrections. The
presentation/native RED has 35 failures/17 controls; preview RED has eight
failures/nine controls. Charge's fixture incorrectly expected 81: seed7's inclusive
80..120 draw is 82; ranks1/2/20 are 82/90/234. The native production path was unchanged
for that correction. Typecheck exposed a test's invalid `row` shape; it now uses
the real unrelated `line-3` shape. Lint required braces in one new React-test
callback. Original scripts/test text/logs/receipts remain unchanged in the archive;
no failing assertion was suppressed or weakened to hide a production defect.

[Five-axis author review](fixtures/paladin-control/author-review.json) found no
blocking source issue in correctness/readability/architecture/security/bounded
execution. This is self-review, not independent approval. Archival/cleanup follow
the source review and are proven by the separate packet and cleanup receipt.

## Inventory and retention

Exactly four rows change; all 213 IDs/order remain. Inventory now has 97 bounded-
functional, 114 unverified, one engine-only and one review-needed row. Paladin is
28/30 locally bounded; Conversion and Holy Shield remain unverified. No earned
class/build/balance or independent acceptance is implied.

The genuine save is unchanged: L33/XP 149261, next Normal 402/Nightmare 0,
Ancients/Rite claimed, Baal uncleared. Decompressed SHA256:
`c4a543af9db6b6b926ece07417b82c80c39615a53cbb03e2a358074f019a7577`.
No genuine campaign, push, PR, merge or deployment action occurred.

[Packet](fixtures/paladin-control/packet.json) and
[raw archive](fixtures/paladin-control/raw.tar.gz) retain 190 exact raw files and
26 terminal receipts, all member bytes verified. Only disposable build bytes
are omitted, with the complete build hash map retained. The
[cleanup receipt](fixtures/paladin-control/cleanup.json) records 950 exact owned
files removed after all consumers finished; scratch absent, port 4484 closed,
remaining[]/failures[]. Older retained evidence, source/history and the active
umbrella worktree/branch/goal are preserved.
