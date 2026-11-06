# BUG-399 — Reconcile successor32 catalog expectations and historical fixtures

- Status: Fixed in exactly nine test files; final reconciliation and integrated
  review APPROVE for bounded current32 acceptance.
- Severity: Low — stale tests reject implemented authored content.
- Build: uncommitted successor32 on
  `b5a0898806bfba369a2d84a1b6c41d0bbb057fce`.
- Environment: WSL/Linux, installed Node24.21.0/Vitest1.6.1; ordinary UI project
  uses jsdom. Town assertions execute zh-CN and en; no physical viewport or RNG
  seed is involved in these roster/catalog assertions.
- Affected systems: QA catalog expectations and historical save-fixture constructors.

## Reproduction

1. Run the complete ordinary unit command on the pinned3004-input successor32.
2. Observe both localized TownScreen ActII roster tests and the store's exact
   authored roster projection expectation.
3. Observe the quest-item loader's complete ordered ID-list expectation.

Expected: exact ordered expectations include the implemented authored Fara NPC
and four new retained cache/Cow quest items; all existing behavioral/refusal
assertions continue to run.

Actual: the TownScreen/store expectations retain the older three-NPC roster,
and the loader expects23 quest items rather than27. The current canonical town
roster is Atma,Drognan,Fara,Greiz (four). The four appended item IDs are
`quest/horazon_lockbox`, `quest/elzix_strongbox`, `quest/wirts_leg` and
`quest/cow_portal_tome`. No Elzix NPC conversation is authored.

## Evidence and correction boundary

Retained packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
`successor32-full-unit-v2.log` retains the actual failures; terminal JSON
and receipt are retained with the complete diagnosis below. Production source/bundle and browser behavior are
unchanged. Authored authority is the dialogue catalog exported by
`src/data/index.ts` through `loadTownNpcs`, and `src/data/quests/items.json`
through the actual quest-item loader.

Only after the terminal ordinary run and complete diagnosis may root update
the exact nine reviewed test files described below. Keep strict ordered equality and all
existing route/source/focus/no-income/frozen/nonmutation/malformed/inherited
assertions. Add explicit DOM order and both-language accessible names for the
four town NPCs. Do not remove assertions, dynamically derive expected catalog
contents, alter runtime data or weaken loader validation. Complete corrected
suites, strict types, zero-warning delta lint, unchanged-production proof and
independent reconciliation review are required under the controlling P14
test-only exception. Preserve the original failed run as failed.

## Complete terminal diagnosis and expanded exact scope

Ordinary-v2 exits1 after1170files/24766tests:1161files/24680tests pass,
9files/86tests fail. Exact expected membership is complete, all3004 input pins
remain unchanged and no unhandled/worker error is reported. Receipt:
`successor32-full-unit-v2-terminal-review-v1.json`; original log/JSON/exit remain
failed evidence. No RNG-dependent production behavior is changed.

Six additional engine suites have independently diagnosed stale test construction:
`damage-delivery.test.ts` (1failure) and `monster-undead.test.ts` (1failure) retain
109 rather than111 monsters. The two Cow additions are melee and undead:false;
the exact six ranged IDs and29 undead IDs remain unchanged. Change only both
counts and the delivery title, preserving exact full coverage.

`frozen-v24.test.ts` (7), `ormus-proof.test.ts` (2) and
`frozen-v24-items.test.ts` (66) relabel the live builder as historical while
retaining its own empty `map.bounties`. Historical readers correctly refuse any
v32 field presence. Strip only empty structure in clean fixture constructors
using existing `withoutV32Fields`, before deliberate corruption. Keep current
Ormus sample intact. Repair all three intended current-version comparisons in
frozen-v24 with existing `withV32Defaults` so those assertions reach their
intended live-authority checks while preserving Hell history.

`frozen-v31-reader.test.ts` (5) has a correct literal predecessor but expects
version-only migration. Update its two exact migration expressions to existing
`withV32Defaults`, which adds only empty bounty structure/version. Do not change
the literal31 sample, before-import mocks or negative/getter assertions.

The controlling P14 plan now lists exactly these nine eligible test paths and
allowed deltas. Complete engine493+sim5 and the three affected UI suites, fresh
strict types/delta lint, exact source/product identity and independent review
are required. Do not change shared helpers/config/setup/dependencies, normalize
corrupted input, relax validators or turn the original failed run into success.

## First reconciliation checks and narrow typing correction

The first corrected UI3 run passes50/50 and exact-delta lint exits0. Strict
types fails with exactly two mistakes introduced in the test-only correction:
TownScreen supplies unsupported `exact:true` to `getByRole`, and the clean
literal23 constructor passes the historical24 map type to a helper requiring
the empty current bounty structure. Independent source review approves removing
only `exact:true` (string names already match exactly) and composing
`withoutV24Fields(withV32Defaults(old))` before explicit version23. The latter
adds empty structure then strips it; the existing explicit empty Hell history
is retained and no corrupted input or shared helper is changed.

The first complete engine493+sim5 reconciliation run exits1 after498files/
13285tests, with13284pass and one failure: unchanged `compile-laziness.test.ts`
times out at its unchanged5000ms limit (7693ms assertion duration). It passed
in the original complete ordinary run. Strict typecheck overlapped this first
engine run; resource contention is plausible but not established. Its complete
inventory, unchanged3004 pins and absence of reported unhandled/worker errors
are recorded in `successor32-bug399-engine-sim-v1-terminal-review-v1.json`.
Retain this run as failed. After only the two reviewed typing corrections,
record a distinct v2 exact patch/manifest, finish strict types first, then run
the complete configured engine+sim projects without concurrent typecheck.
Refresh UI3/delta lint because Town source bytes changed. Do not extend timeout,
weaken assertions or accept while any failure remains unresolved.

## Final resolution

The included current32 batch is accepted locally. Retained packet
`d2-counted-source-z3jj3xa1/current32-acceptance.json` binds the final3004-input
manifest (SHA256 `e169b1b56fbe2468dd24de8fd70a72450dff4e4b6e4530917c10bd8c223bf7aa`),
1512 unchanged production inputs, terminal checks, browser evidence and cleanup.
Independent final integrated review returns `[QA-CURRENT32-INTEGRATED]: APPROVE`.
The P14 source lock is closed for this bounded batch.

Fresh engine493+sim5 passes13285tests, affected UI3 passes50tests, and the669
unchanged UI suites retain11431passing tests. The executed, independently
reviewed reconciliation totals1170unique files/24766tests with no unresolved
failures. Types-v4, delta-lint-v2, full-lint-v2, build-v3, engine-purity,
test-boundary, actual precache and built-bridge checks pass. The original complete
ordinary run remains FAILED86 assertions in9 files; the first engine timeout and
aborted checks remain nonpassing evidence. This is reconciled coverage, not an
uninterrupted full-green claim. The unchanged timeout passes in final engine-v2
without timeout overrides or concurrent typecheck.

Both browser groups pass their documented combined cases on the identical frozen
763-file bundle. Final independent review verifies source/evidence identity and
cleanup; all browser profiles, recorded disposable builds and19 accidental
compiler outputs are absent. Root retains the exact evidence packet through
umbrella acceptance. Constructed/imported browser capabilities do not prove
earned acquisition or pacing. CI remains excluded and its Action removed by
owner instruction. No commit/push/PR/deployment, earned14-build/five-act,
30–50-hour pacing or full-v1 acceptance is included.

Next is BUG398's ratified harness-only correction and the separately declared
cold/fire-v2 cases. Those cases preserve the original naked-hero diagnostics
and cannot retroactively replace or promote them.
