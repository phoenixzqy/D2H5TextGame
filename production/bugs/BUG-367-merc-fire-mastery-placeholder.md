# BUG-367 — Apply Iron Wolf Fire Mastery's party damage bonus

Status: Open — native repair implemented and automated checks verified; browser/earned/feature acceptance pending.
Severity: High — a recruitable mercenary's advertised party support is absent.
Build: `4ef060b7ff38fda906ad026438e68cd7b4258707` plus the new primary regression only.
Environment: Node24.21.0/npm11.19.0, Vitest1.6.1 UI/jsdom, seed7.
Browser/viewport: not applicable to native reproduction. Locales: en and zh-CN.
Owners: engine-dev/content-designer/writer; root implements, producer reviews.

## Reproduction

1. Use real loadMercPool/createMercFromDef/mercToCombatUnit/default registry for
   `mercs/act3-iron-wolf-fire`.
2. Hold the source and opponent from acting; use a fixed100Fire hero attack,
   zero target resistance/mitigation/dodge and no critical chance. These are
   constructed surviving combat stats, not earned recruitment evidence.
3. Compare the native party against the same mercenary without its configured
   passive. Check passive registration, fresh qualification and locale copy.

Expected: gacha-spec.md:120 promises +25% party Fire damage. The first actual
hit is125 with the source and100 without it; the passive never casts or pays.
Actual: both hits are100. Native qualification is missing, the default registry
does not recognize passive-fire-mastery, and recruitment/skill copy omits the
party25% promise. All3primary cases fail, native exit1 in15.256596seconds;
all2,046inputs remain unchanged at
`8eaa94b227712c3c82bddfe3469c1d677843d3d4957cb17c3beead55e4556024`.

Primary regression: `src/stores/merc-fire-mastery.test.ts`. Exact raw RED log,
JSON, native receipt and before/after maps are retained by root at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-merc-fire-mastery-eoew8i06`.
Plan readiness/security pass, findings empty, readers released; plan-review.json
SHA256 `dac19ee99f0b9f6ef0aafbff4f7ee8a72a11068ff12f7d8e34cdfe56f6474bc3`.

Root cause: no authored potency, immutable native resolver/registration,
canonical transient source projection or shared Fire contribution exists.
Repair the existing +25% party promise through one additive typed damage term;
duplicates do not stack and source death withdraws presence. Preserve separate
player Fire Mastery, existing Burn snapshots, Fire Ball and other merc contracts.
Browser/earned/feature and full-v1 gates remain pending. No new acquisition/
lineage experiment, app/browser, protected fixture or closed policy is involved.

## Native repair and remaining acceptance — 2026-10-28

Closed JSON potency, immutable resolution, true-passive registration, canonical
transient qualification and one additive Fire contribution implement the existing
party25% promise. Both locale surfaces are corrected. The original three-case
primary remains unchanged through native GREEN. Engine11,019/411files and full
21,591/1,010files plus2existing skips pass on the original frozen source. Two new
combat-test type-only corrections are independently reviewed and preserve exact
esbuild runtime; final focused252/12, typecheck, full lint/purity and external
build pass on the final frozen source. Raw typecheck/lint failures remain retained.

See [bounded Fire evidence](../../docs/plans/evidence/merc-fire-mastery.md) for
exact source digests, correction/review/native receipts and cleanup. The local
source checkpoint does not close browser, earned recruitment/builds or feature
acceptance. BUG180/366 timing causes, BUG365 and full-v1 gates remain Open.
