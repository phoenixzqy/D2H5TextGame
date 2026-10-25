# D04 — Fire Blast's actual cone explosion

Fixed and verified locally: runtime/data `ab075ca6`, presentation `82668826`.
Root sole writer and author reviewer; independent design/QA and earned balance
remain open. [BUG207](../../../production/bugs/BUG-207-fire-blast-cross-instead-of-cone.md),
[original native reproduction](d04-fire-blast-cone-repro.md) and
[contract](../decisions/D04-fire-blast-cone-v1.md) precede implementation.

## Restored behavior

Fire Blast now authors `aoeShape:"cone-2"`, including its matching legacy
builder. The actual grid footprint is one apex cell `(r,c)` and three cells
`(r+1,c-1/c/c+1)`, with ordinary validity/clipping and no wrapping. The existing
densest occupied-anchor resolver chooses the most living hostile candidates,
ties by lower row then column, and returns row-major targets. Duplicate units
in a cell remain eligible: four cells is not a four-enemy cap. Existing default
positions, explicit overflow coordinates and missing-position fallback remain.
Other shapes and source skill identities retain their behavior.

The spec promises a thrown cone fire trap without numeric grid dimensions or
a persistent interval/lifetime. This explicit provisional adaptation resolves
one paid explosion; it preserves trap wording and adds no artificial persistent
entity. Wake/Death Sentry trap lifecycles and martial charge promises remain
open. Numeric cone tuning is not claimed to be approved or earned balance.

Preserve Fire50–70/+5rank,25MP,2s cooldown,unlock1/cap20/no prerequisites and
explicit10% mitigated-hit Burn,3s/cap5. Each target keeps its ordinary independent
hit/base/critical decision, mitigation, personal absorption and death. One
payment/action/cooldown per explosion, no weapon Attack scaling or save field/
version/dependency change. Schema restricts the preset to exact native Fire
Blast and requires its active area/Fire/Burn identity. React displays a pure
rank-model flag; it contains no geometry or target-selection logic.

## Actual native and test evidence

The rebuilt12-case native probe covers ranks1/2/20 ×seeds7/19/41/97. Every cast
selects IDs1,3,4,5 on the explicit row-major3×3grid, one25MP payment/action,
immutable exact replay and actual final-HP conservation. The old cross also
hitID7; it now remains untouched. Seed7 results:

| Rank | Direct HP loss | Periodic HP loss | Final HP, targets0–8 |
| --- | ---: | ---: | --- |
| 1 | 234 | 66 | 2000,1934,2000,1927,1917,1922,2000,2000,2000 |
| 2 | 254 | 72 | 2000,1929,2000,1919,1909,1917,2000,2000,2000 |
| 20 | 614 | 180 | 2000,1812,2000,1802,1792,1800,2000,2000,2000 |

The45new cases comprise10pure grid,8schema/catalog/display,19native causal and
8bilingual UI. They cover sparse/dense placement, clipping, input permutation
and ties, overflow, duplicate occupants, defaults/fallback, dead/friendly
exclusion, actual direct/periodic HP, independent criticals, no physical
reflection, finite shield absorption, lethal settlement, native authority and
unlearned/current/next/MAX presentation. Earlier Assassin Fire tests retain
all previous assertions with only Fire Blast's obsolete five-target expectation
updated to four; the historical cross proof remains archived.

Original preimplementation RED43failed/115passed is retained. First green
failed strict Ajv compilation because the new conditional required damage
without its local shared-property reference. Typecheck identified five event-
union narrowing errors; lint reported six consequences. Add the existing
schema reference and split kind/source/target predicates; do not weaken strict
mode or any expected geometry/HP. All failures and corrections remain retained.

Final focused compatibility200/8files, data compatibility830/16, engine7592/278,
strict types/lint/build PASS. Final full14671/654files/two existing skips,
505.423s wrapper (Vitest504.12s), with no interrupt/restart.
Durations exceed repository test/type/lint budgets; performance gates remain open.

## Production browser and save

Four cases pass: en/zh-CN ×1280×800/360×640. Real public creation/import,
rank1Continue with empty priority, public rank2allocation/Active Skills selection,
actual selected Fire Blast cast and rank2Continue agree. Eight exact Save-close-
new-page-Continue pairs preserve player,inventory,map,mercs,formation at Save22.
SyntheticL30/resources/helmet and fixed Date.now with ordinary timers are
disclosed; no private store injection/test bridge or earned progression credit.

Twenty geometry samples across360×640/412×915/640×360/1280×800/1920×1080 have
no horizontal overflow and checked Allocate controls>=44px. Sixteen screenshots
retained; ten individually inspected: summaries/stat rows at both primary sizes
and locales plus both mobile real-cast logs. Main prose preserves thrown trap,
one explosion, rank damage, cone placement and independent hits; Current/Next
rows show actual shape/Burn/prices. Current rows are fully visible; ordinary
scrolling exposes later Next rows. Existing icon fallback/fixed bars and full
a11y/device/PWA/performance remain open. The isolated build has four bridge-free
JS chunks and all756precache URLs. Only the exact owned preview PID was stopped.

## Provenance and accounting

All1386source/test/config, three controlling design and760build hashes,
historical HEAD01548870 and genuine digest stay exact through the final full
run. Actual committed blobs/disk match the snapshot at `82668826`; historical HEAD
is not claimed to include the patch. Only one inventory row changes, with
212others and213IDs/order exact:105bounded-functional/106unverified/one engine-
only/one review-needed. Assassin8/30 locally bounded; independent/earned class,
build and balance acceptance remain open.

The separate [Dragon Claw reproduction](d04-dragon-claw-repro.md) proves one
native attempt despite its paired-strike promise. This diagnostic exit1 grants
no functionality credit and is separate from the required passing suite.

Genuine claimed Ancients/Rite staysL33/XP149261/nextNormal402/Nightmare0,
Baal uncleared; decompressed SHA256 stays
`c4a543af9db6b6b926ece07417b82c80c39615a53cbb03e2a358074f019a7577`.
C0/C1 keep narrow exits; C2–C4/fullG0–G7/earned builds/30–50hour pacing/economy/
endgame/independent acceptance remain unfinished. No genuine campaign or remote
action. Full objective, active branch/worktree/claim remain preserved.

[Raw archive](fixtures/fire-blast-cone/raw.tar.gz),
[member manifest](fixtures/fire-blast-cone/packet.json),
[committed audit](fixtures/fire-blast-cone/committed-source-audit.json) and
[cleanup receipt](fixtures/fire-blast-cone/cleanup.json) retain exact evidence.
All148 raw members and20 terminal receipts are member-hash verified. Cleanup
removed908 exact task-owned files after every consumer finished; scratch and
all41 recorded owned PIDs are absent, port4493 is closed, remaining[]/failures[].
The active worktree/claim and shared caches remain preserved.
