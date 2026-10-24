# D05 — Eight selected Paladin stat auras / BUG181

2026-10-24. Local implementation on feat/playable-foundations, baseline2b5608b.
Save foundation a5c9c3a, combat/native implementation9329b3f, bilingual UI fdbbd55.
Root sole writer/self-review; independent design/QA, earned class/build balance,
C2–C4 and full G0–G7 acceptance remain open.

Thorns, Blessed Aim, Fanaticism, Defiance, Resist Fire/Cold/Lightning and Salvation
now apply their complete authored stat effects through explicit single selection.
The [family contract](../decisions/D05-paladin-aura-family-v1.md) records the exact
unchanged JSON coefficients. Thorns reflects actual physical HP lost by a surviving
recipient through existing nonrecursive mitigation. Attack applies to basic hits
and Attack-scaled skill components; damage increases add over existing increases.
Defense, all six resistances and phase-preserving cadence use current combat views.

Each native wave copies the selected rank/tuning, hero identity and originally
fielded merc identity. Current living-source/recipient checks exclude summons,
enemies, bench and ownership forgeries. Learning never selects; ordinary changes
apply next wave. Explicit store replay recomposes current selection over original
resource inputs; direct engine replay retains its copied snapshot. No baseline
stat mutation, resource refill, permanent aura payload or extra RNG is introduced.
Might and Meditation retain their existing effect/recovery contracts.

[ADR-011](../../decisions/ADR-011-version-player-aura-selection.md) freezes the
historical two-ID selection types and validators through v21. Save v22 permits
all twenty exact selection IDs; absence remains None. Strict predecessor validation
precedes a version-only migration, preserving native Maps, spent reset counters,
resources and ownership. Saving an unsupported selection does not implement it.
Selection IDs and underscore canonical allocation keys are distinct; eligibility
resolves both plus authored data IDs by maximum, never addition.

## Verification

- Save baseline:41 failures/15 controls; final56/56. Historical/save regression:
  684/684 across21 files. Current-only IDs remain rejected in frozen v21.
- Initial combat RED has10 failures/one pass and includes subsequently corrected
  cadence/event-selection fixture assumptions; it is not ten clean causal proofs.
  Final focused engine authority/combat22/22; existing Might/Meditation tests pass.
- Native selection baseline has eight unsupported-aura failures; the first green
  native/selection run passes66 cases. UI baseline has four missing-radio failures;
  the initial UI rerun exposes two old three-radio assertions, updated to eleven
  while retaining their other assertions. Final full regression covers all cases.
- Production testing then catches an actual integration defect: native allocation
  writes `paladin.resist_fire`, while eligibility initially omitted underscore
  keys. The first regression fixture also lacked three authored prerequisites;
  its mixed ten-failure run is retained. Corrected fixtures yield eight causal
  failures (four canonical compositions/four public allocation-to-selection paths).
  After the root fix, all34 focused cases pass. The browser repeats the ordinary
  L1 learning path successfully, rather than manufacturing its allocation keys.

Final current-source full run: **12229 passed /515 files**, two existing skips,
537.87s Vitest/539.135s process. All1222 frozen source/test/config hashes, committed
HEAD fdbbd55 and clean Git state remain exact throughout. Engine6088/205,
typecheck, standard lint/engine purity and explicit-VITE_E2E=false build pass.
All760 production file hashes remain exact; four JS chunks pass all five forbidden
bridge-pattern checks. Existing suite-time, bundle and PWA warning budgets remain
open; build success is not performance/PWA acceptance.

The earlier full run remains a failure:12227 pass/two5000ms cold-import timeouts,
514 passed/one failed file, two existing skips,557.274s process. BUG180 records
both player-first and inventory-first cases. The unchanged13-case file passes
alone (1921ms/1798ms imports;10.013s process). No timeout, worker/discovery setting,
import-test assertion or runtime workaround was changed for those cases. The final
full run includes the independently necessary aura allocation repair, so it is not
an unchanged-source retry of the first run. Timeout causation remains unresolved.

Production browser4/4 covers en/zh-CN at1280×800 and360×640. Every case creates a
native L1 Paladin, learns/selects Resist Fire, then separately imports an explicitly
constructed L30 fixture to select all eight effects. **36 complete Continue pairs**
compare player/inventory/map/mercs/formation after Save→close→new-page Continue.
A separate attachment audit repeats all36 full-domain comparisons. These fixtures
prove selection/persistence/UI, not earned acquisition, paid respec or class balance.

Forty geometry samples cover360×640,412×915,640×360,1280×800,1920×1080: no document
overflow and all eleven radio labels at least44×44. Both locales display truthful
effects and selection requirements. No captured page errors or production debug
bridge. English desktop and Chinese mobile screenshots were inspected; the mobile
image is a scrolled selection section. Existing glyph-box navigation icons remain;
whole-screen accessibility acceptance is not claimed.

## Retention and remaining scope

[Fixtures](fixtures/paladin-stat-auras/) retain210 original files and34 terminal
process records. The manifest maps each original path to exact retained bytes;
duplicate content shares an artifact. The original38MB failed-browser trace is
preserved as two ordered parts below21MB each, reconstructable byte-for-byte.
Every archive member and reconstructed trace was hash/size verified before cleanup.
[Cleanup](fixtures/paladin-stat-auras/cleanup.json) removes970 exact task-owned
files, confirms scratch-root absence and preview4462 closure, with no failures or
remaining paths. Shared caches, installed tools and older campaign evidence remain.

Only these eight skill rows gain bounded-functional dispositions:213 IDs/order
remain,166 unverified/46 bounded functional/one review-needed. Cold Mastery remains
review-needed. BUG181 stays open for ten distinct auras: Holy Fire/Shock, Holy
Freeze, Conviction, Sanctuary, Cleansing, Redemption, Prayer, Vigor and Concentration.
No stat-only substitute receives credit for pulse/control/corpse/interrupt mechanics.

The genuine claimed Ancients401/Rite save remains decompressed SHA256
`c4a543af9db6b6b926ece07417b82c80c39615a53cbb03e2a358074f019a7577`,
L33/XP149261/23682gear/nextNormal402. No genuine action or diagnostic-save promotion
occurred. Baal, all-class builds, remaining skills/economy/pacing/endgame/PWA/
performance and independent final acceptance remain open. Local only; the umbrella
goal, branch and claimed worktree remain active.
