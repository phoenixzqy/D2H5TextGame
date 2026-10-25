# D05 — Selected Sanctuary undead damage and repulsion

Runtime commit `5586d34`; local implementation and verification only.
Independent design/QA and earned class/build balance remain open.

## Delivered behavior

Selected Sanctuary preserves unlock 24, Thorns prerequisite, cap 20 and authored
3% Arcane damage per rank for the living hero/original living fielded merc.
That ordinary Arcane bonus applies against any target. Its separate undead-only
pulse starts after one full 2000 ms interval, deals 20 base Arcane damage to every
currently living explicitly marked enemy, and applies canonical Stun to surviving
targets for 500 ms (existing boss/chapter-boss scaling 250 ms). Repulsion explicitly
means this short Stun; no movement/range system is introduced. New pulse/control
values remain provisional local tuning, not earned-balance acceptance.

All 109 current monster rows explicitly author boolean undead: 29 true/80 false.
The factory copies only literal true; absent legacy/custom definitions remain
unclassified. Names, IDs, tiers, skills and visuals never determine eligibility.
All other original data fields, IDs and order match `a03fed2`. Three conflicting
older lore hints are reconciled to the current canonical mapping. The
[identity decision](../decisions/D05-monster-undead-v1.md) records the full set.

The shared aura scheduler and existing source increases/combos, resistance and
independent magical mitigation remain authoritative. Living enemy summons
admitted after entry receive pulses when factory-authored undead; ordinary
hostile summons are not excluded merely for ownership. Source crowd control
alone does not suppress pulses. Source death stops future pulses; already
applied Stun keeps its normal lifetime. Periodic death settles before a tied
pulse, damage/death before repulsion, and pulse before surviving tied actions.
The existing inclusive deadline, action cap and exact-once death closure remain.
No mana, crit/dodge/status RNG roll, action slot, frontloaded pulse or saved timer.

Exact finite three-field Sanctuary tuning is schema-owned, copied and frozen
at definition/native/direct boundaries. Fire/Shock auraPulse ownership remains
closed. Missing/extra/foreign/malformed tuning gives no selected effect. Normal
configuration changes apply next wave; explicit current-configuration replay
uses original teams/resources/seed and pays no duplicate income. Save remains v22;
player stats never acquire pulse potency, undead identity or status/timer fields.
Both locales describe actual targeting, Arcane bonus, timing and Stun adaptation.

## Verification

| Check | Result |
| --- | --- |
| Corrected identity/schema/factory/data integrity | 340 tests/four files pass |
| Definitions/shared aura | 24 tests/two files pass |
| Corrected core/identity/definitions/existing pulses | 38 tests/four files pass |
| Final integrated combat/definitions/native/UI | 109 tests/six files pass |
| Historical fixture/aura/identity correction | 168 tests/eight files pass |
| Final standalone engine | 6,252 tests/220 files pass |
| Final full regression |12,430 tests/531 files pass; 2 existing skips |
| Strict typecheck and global lint/engine purity |Pass |
| Production build with explicit VITE_E2E=false |Pass; existing bundle/PWA warnings remain |
| Production bridge scan |Four chunks/five forbidden patterns absent |
| Production browser and separate attachment audit |Four language/viewport cases/eight exact Continue pairs pass |

The final full process ran alone for 426.676 seconds. All 1,246 source/test/
config hashes, 760 build hashes, HEAD/Git state and genuine save digest stayed
exact before/after. All 1,246 committed source blobs separately match validated
hashes and working files at 5586d34. Existing test-time, bundle/PWA
budgets, intermittent BUG180 and independent acceptance remain open.

## Test and browser scope

Native coverage publicly learns Thorns/Sanctuary and explicitly selects it on
a synthetic L30 fixture. Real BloodMoor wave 1 has no undead; actual factory-tagged
Zombie in wave 2 takes a 2000 ms Arcane pulse and Stun before the registered physical
finisher. None edit preserves the recording; explicit replay removes pulses,
reselect/replay reproduces original teams/projection/events, and income remains
exact. Save/import preserve selection and derived stats with no transient fields.
Engine cases cover ranks 1/20, actual HP/timing/control and recovery, normal
mitigation, source/target/death eligibility, malformed markers, live factory-backed
enemy summons, deterministic RNG and unchanged input/stats. Original merc versus
bench Arcane damage on an unclassified target is 103/160 versus 100 at ranks 1/20.

Final production en/zh-CN ×1280×800/360×640 uses an explicitly synthetic imported
L24/two-free-points fixture, then ordinary Thorns/Sanctuary allocation, explicit
selection and None. Eight Save→close→new-page Continue pairs compare complete
player/inventory/map/mercs/formation domains. A separate saved-attachment auditor
checks exact expected allocation/selection changes and unchanged other fields.
Twenty geometry samples across 360×640,412×915,640×360,1280×800 and 1920×1080 show no
horizontal overflow and all 20 radio labels>=44×44. No page errors were captured.
All four final screenshots were actually inspected. Mobile captures are scrolled
detail views with existing fixed header/navigation partly occluding heading/
continuing rows; existing icon/font fallbacks remain. No full accessibility,
safe-area or whole-screen UX acceptance is inferred. These synthetic fixtures
do not prove earned class/build viability, balance or pacing.

The first full run completed with 78 failed/12,352 passed/two existing skips,
525 files passed/six failed, in 674.331 seconds. Seventy-six historical mage
contracts correctly rejected newly added undead metadata in their frozen source.
[BUG183](../../../production/bugs/BUG-183-mage-historical-undead-fixture.md)
extends only the already historical compatibility boundary to omit post-v1
undead identity. All frozen hashes, lengths, recipes and gameplay oracles remain
unchanged; current native factory markers remain intact. Another stale test now
uses a truly unknown aura in its unsupported-input case. The last failure repeats
open BUG180 at its unchanged 5000 ms threshold. No import code or assertions changed.
The separate 13-case import check is 13 tests/one file PASS without timeout or import changes.

The corrected snapshots differ from the failed-full source only in those three
test files. All production source and 760 build files match the already verified
production browser build; no replacement build/browser result is inferred.
Both failed and corrected full snapshots and original output are retained.

## Original failures retained

The first identity RED had two genuine schema/factory failures, one erroneous
113 corpus-count assertion and seven controls. Actual 41+38+10+10+10=109; every row
was correctly authored before the mistaken final count assertion failed. Separate
baseline comparison proves every other field exact. Initial broad related-test
selection was intentionally stopped after inspecting exact owned PIDs because of
that wrong count and unnecessarily broad transitive scope; terminal exit-15 is a
documented cancellation, not an observation timeout or gameplay failure.

Initial combat RED accidentally let a 1700 ms minimum-one attack pre-empt the
intended 2000 ms periodic source death; that enemy is explicitly held. An extra-
parenthesis transform failure is retained separately. Corrected causal combat
RED had nine failures/three controls. First core GREEN retained one incorrect
mitigation expectation 12; existing formula correctly yields 8:
floor(20×(1+0.5+0.03)×0.5-7)=8. The fixture was corrected without formula changes.
UI/native RED retained two stale descriptions and two 19-versus-20 radio counts;
the native Sanctuary path already passed. No suppressions, new skips, timeout/
worker/discovery changes, weakened gates or genuine replay were introduced.

The first local commit attempt lacked configured Git identity. Its output is
retained; retry used the existing task commits' Codex identity with command-scoped
git settings. No global/local Git configuration or source content changed.

## Retention and remaining scope

The [manifest](fixtures/paladin-sanctuary/manifest.json) retains 156 original
files and 29 terminal process records, byte-verified in raw.tar.gz.
Scripts, original failures, successful outputs, source/build hashes, synthetic
saves and screenshots remain versioned. [Cleanup](fixtures/paladin-sanctuary/cleanup.json)
removed 916 exact task-owned files, verified scratch absence and 4469 closure,
and reports no failures/remaining paths. Shared caches and older campaign evidence
remain untouched.

Only Sanctuary gains a bounded-functional disposition. All 213 IDs/order remain:
157 unverified,54 bounded-functional, one bounded-engine-functional (Ice Arrow)
and one review-needed (Cold Mastery). These 55 bounded records have different
proof scopes. Nineteen of 20 Paladin auras have supported effects. Concentration
still requires explicit interruption prevention; a physical-only substitute is
insufficient. BUG181, earned balance and independent acceptance remain open.

The genuine claimed Ancients401/Rite save remains L33/XP149261/23,682 gear/
next Normal402 with decompressed SHA256
`c4a543af9db6b6b926ece07417b82c80c39615a53cbb03e2a358074f019a7577`.
No genuine campaign action, diagnostic-save promotion or remote publication.
Baal, C2–C4/full G0–G7, all skills, seven classes/two builds, economy/pacing,
endgame/offline/PWA/accessibility/performance and independent acceptance remain
open. Full private-v1 goal, branch and claimed worktree remain active.
