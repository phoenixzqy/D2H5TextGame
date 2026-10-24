# D05 — Selected Holy Freeze and Conviction / BUG181

Local implementation on feat/playable-foundations, baseline bc9750f; implementation bee0cd8. Root sole
writer and self-review; independent design/QA and earned class/build balance open.
The [family contract](../decisions/D05-paladin-aura-family-v1.md) controls this batch.

Holy Freeze derives observable enemy Chill from the shared JSON multiplier, with
the living hero source identity. Timed Chill, player Freeze and mercenary Freeze
provide one slowdown. The mercenary-only party cold increase remains separate.
Authored hero/original-fielded-merc bonuses remain +3% cold damage and +0.5 physical
dodge percentage point per rank. Crowd control preserves the living-source aura;
source death withdraws it, and mercenary death can hand provenance to the hero
without losing action progress. Raw enemy statuses and baseline stats stay intact.

Conviction subtracts the JSON-owned 25 percentage points from all six enemy
resistances before existing penetration/curses, act penalties and clamps. Its
per-rank +2% elemental/+1% arcane increases affect the hero/original fielded merc;
summons benefit from the enemy debuff only. Strict schema and projection boundaries
reject missing, nonfinite, out-of-range and foreign-identity metadata. The authored
level30/Sanctuary prerequisite resolves the stale level24 and Chinese-name entry.

The existing single wave projection and selection path carry both effects. Native
public allocation writes canonical underscore IDs; replay retains original pools
and grants no extra income. Save v22 already permits both IDs; only selection
persists, with no version bump or transient potency payload. Both locales explain
the actual effects, rank bonuses and eligibility. Thirteen exclusive radio options
include None, Might, Meditation and the ten supported stat/enemy-effect auras.

## Verification

Corrected initial RED:20 failures/two controls across22 cases. The earlier RED also
contained a subsequently corrected dotted-record-key assertion. Initial GREEN:
60/61, with a false guaranteed-dodge fixture. Its first revision still conflated
ordinary misses with dodge events. The final scope test inspects numeric inputs
of the real, unmodified damage resolver while retaining actual combat outcomes.
The UI RED also exposes missing effect descriptions. Two stale eleven-radio counts
are updated to thirteen; all exclusivity/resource assertions remain. The first
typecheck exposes widened boolean mercenary markers; literal-true fixtures fix it.
All original failures remain retained.

Focused regression:133 passes/eight files. Final full regression includes the later
fixture-only literal typing and canonical-allocation correction. Full current-source run: **12,261 passed /517 files**, two existing skips; 533.89s Vitest/535.156s process. All1,231 source/test/config hashes,760 build hashes, HEAD/Git state and genuine save digest stayed exact through the run. Commit bee0cd8 has the identical validated source hashes..
Engine6114/207, typecheck, standard lint/engine purity, explicit-VITE_E2E=false
production build and four-chunk/five-pattern bridge scan pass. Existing suite-time,
bundle/PWA warning budgets and intermittent BUG180 remain open.

Production browser4/4 covers en/zh-CN at1280×800 and360×640. Each case imports an
explicitly constructed L30 prerequisite fixture, publicly allocates both skills,
selects each, then clears to None. Twelve Save→close→new-page Continue pairs compare
all five complete saved domains; a separate attachment audit repeats each pair and
checks canonical allocations and absent transient aura payloads. Forty geometry
samples across360×640/412×915/640×360/1280×800/1920×1080 find no horizontal overflow
and all thirteen radio labels at least44×44. No captured page errors/debug bridge.
These fixtures do not prove earned acquisition, paid respec, pacing or class balance.

Original screenshots remain; the English desktop capture picked up an unrelated
hover panel after viewport cycling. Separate re-imports produce corrected English
Conviction and Chinese mobile Freeze captures with the pointer moved away. The
mobile image is a scrolled detail view with existing fixed navigation; whole-screen
accessibility acceptance is not claimed.

## Retention and remaining scope

The manifest retains 113 original files and 18 terminal process records, all byte-verified.. [Fixtures](fixtures/paladin-enemy-auras/) retain exact original
failures, successful outputs, scripts, full-run input/build hashes, saves and visual
proof. Cleanup removed 873 exact task-owned files, confirms scratch-root absence and preview4463 closure, and reports no failures or remaining paths. Shared caches and older campaign evidence remain..

Only these two inventory rows gain bounded-functional dispositions:213 IDs remain,
164 unverified,47 bounded functional,one bounded-engine-functional (Ice Arrow),
and one review-needed (Cold Mastery). The48 bounded records have different proof
scopes; the engine-only record is not promoted by this batch. BUG181 remains
open for Holy Fire/Shock, Sanctuary, Cleansing, Redemption, Prayer, Vigor and
Concentration. No pulse/control/corpse/interrupt effect gets stat-only credit.

The genuine claimed Ancients401/Rite save remains decompressed SHA256
c4a543af9db6b6b926ece07417b82c80c39615a53cbb03e2a358074f019a7577,
L33/XP149261/23682gear/nextNormal402. No genuine action or diagnostic-save promotion.
Baal, seven-class builds, remaining skills/economy/pacing/endgame/PWA/performance,
independent C2–C4 and full G0–G7 acceptance remain open. Local only; umbrella goal,
claimed worktree and branch stay active.
