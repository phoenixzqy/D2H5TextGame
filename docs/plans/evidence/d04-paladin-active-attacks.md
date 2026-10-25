# D04 — Paladin Holy Bolt, Blessed Hammer and Vengeance

2026-10-25. BUG196 is locally repaired and verified. This packet establishes
bounded functionality for three Paladin active attacks. Root is the sole writer
and author reviewer; independent design/QA and earned class/build balance remain
open. C2–C4, full G0–G7 and complete private v1 remain unfinished.

Controlling [contract](../decisions/D04-paladin-active-attacks-v1.md) and
[original bug](../../../production/bugs/BUG-196-paladin-active-effects.md).

## Behavior and source

| Commit | Result |
| --- | --- |
| `4cde6fc` | Immutable shared-roll boundary; scalar arithmetic and RNG preserved. |
| `7b129df` | Strict authored metadata, actual Holy Bolt recovery, Hammer bypass and typed Vengeance settlement. |
| `ccf6631` | Native rank/eligibility/payment and real control/shield/death/corpse regressions. |
| `f829458` | Truthful pure previews and bilingual current/next/unlearned/MAX details. |

Holy Bolt restores 50% of actual direct enemy HP removed, rounded down and
capped by missing life. Absorption, overkill, periodic damage and later basic
attacks do not count. The caster must survive ordinary settlement.

Blessed Hammer bypasses only flat magic resist. Arcane percentage resistance,
magic dodge, critical hits and personal shields remain in effect. It still
selects all living enemies and pays once; target stats do not change.

Vengeance is one paid single-target strike with a shared hit/base/critical roll.
The unchanged 90–150 total base and +9/rank split into equal Fire, Cold and
Lightning components, each applying its own modifiers, preexisting combos and
mitigation. Component inputs share the original snapshot, preventing this strike
from benefiting from statuses it applies itself. Components settle in that order
against remaining finite shields/MP, preserving original shield eligibility until
final HP publication. Death, orbs and corpse supply settle once after the strike.
Fire supplies 10% final-mitigated-component Burn DPS; real Chill and Paralyze
change target cadence/actions. A shared miss applies none. New Burn tuning is
provisional. Other mixed skills remain scalar and uncredited.

Existing costs, cooldowns, damage growth, unlocks, prerequisites, selected auras
and native class/rank ownership are retained. No save field, migration/version,
dependency, global rate, CI, skip or threshold changes. Save version 22 remains.

## Automated proof and provenance

The eight new test files add 120 cases: strict finite schema/identity metadata,
immutable shared rolls, actual recovery/bypass/composite settlement, native
rank 1/2/20 authority, payment/fallback/cooldown, positive control consequences,
shields/MP/retaliation/death/corpse boundaries, and bilingual current/next/MAX.
Vengeance includes 64 deterministic shared-roll seeds. Synthetic reverse-side
hero fixtures isolate player-only shields; they do not assert that native enemies
can learn Paladin skills.

| Final check | Observed result |
| --- | --- |
| Native original probe after repair | Six rank 1/20 cases, 36 controls and all eight formerly failing requirements PASS. |
| Focused presentation/existing Skills/Vengeance | 88 passed / 4 files. |
| Native/engine/registry boundary checks | 113 passed / 4 files. |
| Engine | 7,288 passed / 259 files; 85.936 s wrapper. |
| Standard `npm test` | 13,985 passed / 613 files, two existing skips; 506.111 s wrapper. |
| Typecheck | PASS, 55.547 s. |
| Full lint / engine purity | PASS, 115.852 s. |
| Explicit `VITE_E2E=false` production build | PASS, 15.801 s. |
| Production bridge / precache | All four JS chunks bridge-free; all 756 precache references exist. |
| Frozen inputs through full suite | All 1,342 source/test/config and 760 build files, Git HEAD/status and genuine save unchanged. |
| Actual committed source | All 1,342 tested source blobs match committed HEAD `f829458` and disk. |

The scalar corpus has 448 scenarios byte-identical before shared-roll extraction,
after extraction and after composite integration, including each recording's
next three RNG values. SHA256:
`6c2897bf4e46761dd7c9b54b45d2ec3860c3316a8e64fa25463b0064399c303d`.
Existing test-time React, bundle/precache and Browserslist warnings remain.

[Post-full audit](fixtures/paladin-active-attacks/post-full-freeze-audit.json),
[committed source audit](fixtures/paladin-active-attacks/committed-source-audit.json),
[terminal receipts](fixtures/paladin-active-attacks/terminal-receipts.json).

## Public production-browser proof

Four isolated cases pass: en/zh-CN × 1280×800/360×640, using public new-Paladin
creation, disclosed synthetic import, public allocation/selection and real Blood
Moor combat. Fixture: L30, 50,000 life/mana equipment, −80 attack speed, real
Sacrifice/Zeal prerequisites. This is functional proof, not earned campaign or
balance acceptance. No production test bridge or page error was present.

The separate browser-output audit checks 12 positive combat entries, actual
positive Holy Bolt healing in each case, eight exact five-domain Save-close-new-
page-Continue pairs, exact expected allocations/points, and 20 geometry samples
at 360×640, 412×915, 640×360, 1280×800 and 1920×1080. No page horizontal overflow;
Allocate targets are at least 44×44. All 24 screenshots are retained; eight were
visually inspected. Mobile battle logs extend below the viewport; retained log
JSON, rather than the viewport screenshot alone, proves observed casts/effects.
All four task preview PIDs are absent and port 4482 is closed.

[Browser audit](fixtures/paladin-active-attacks/browser-evidence-audit.json),
[English mobile details](fixtures/paladin-active-attacks/vengeance-en-mobile.png),
[Chinese mobile details](fixtures/paladin-active-attacks/vengeance-zh-mobile.png).

## Failures and author review

Original native RED has six cases, 36 passing controls/eight advertised-effect
failures. Original shared-roll, Vengeance and presentation RED logs remain.
Broader engine testing caught a stale exact multi-status registry list; it now
includes Vengeance. Typecheck/lint caught test typing and assertion-style issues;
those were corrected without suppressions. Original logs remain unmodified.

The first browser audit's result JSON collided with its wrapper receipt filename.
The original script, log and receipt are preserved. A copy differing only in its
output filename reran the same audit against all retained browser artifacts;
`browser-evidence-audit.json` now preserves the complete result separately from
`browser-evidence-review.json`'s terminal receipt. No browser assertion changed.

[Author five-axis review](fixtures/paladin-active-attacks/author-review.json):
no blocking author finding in correctness, readability, architecture, security
or bounded execution. This is self-review, not independent gate approval. Whole-
class/shipping evidence remains INCOMPLETE until independent review/QA and earned
build/balance acceptance.

## Inventory and retention

Exactly three rows change; all 213 IDs/order remain. Inventory now has 119
unverified, 92 bounded-functional, one engine-only and one review-needed.
Vengeance's resolved status-truncation/alias risk flags are replaced with the
remaining earned-balance risk. Remaining seven Paladin actives remain in scope.

The genuine save is unchanged: L33/XP149261, next Normal 402/Nightmare 0,
Ancients/Rite claimed, Baal uncleared. Decompressed SHA256:
`c4a543af9db6b6b926ece07417b82c80c39615a53cbb03e2a358074f019a7577`.
No genuine campaign, push, PR, merge or deployment action occurred.

[Packet](fixtures/paladin-active-attacks/packet.json) and
[raw archive](fixtures/paladin-active-attacks/raw.tar.gz) retain 202 exact raw files and 37 terminal receipts.
Every member and terminal receipt is byte-verified. Disposable build bytes are
omitted in favor of the complete build hash map; no screenshots or failure logs
are omitted. [Cleanup receipt](fixtures/paladin-active-attacks/cleanup.json)
records exact owned path removal after consumers finish; scratch absent, port 4482
closed and no cleanup failures. Umbrella worktree/branch/goal remain active.
