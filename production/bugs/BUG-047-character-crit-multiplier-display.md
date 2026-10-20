# BUG-047 — Display critical damage multiplier with the correct percent unit

Status: Fixed; independent producer/QA APPROVE / ADEQUATE, implementation commit pending.
Severity: Medium — Character sheet misstates critical damage by100×.
Owner: frontend-dev; producer triages, independent QA reviews.

## Reproduction

Observed at runtime0f7cdc0/input1e9e582 during ordinary P11a01B3 production
acceptance, unchanged through995f1b2. Linux/Playwright1.59.1 Chromium,
en+zh-CN,1280×800 and360×640. Date-onlyT0=2026-10-20T12:00:00Z;
no RNG dependence for this display (combat earning recipe in B3 evidence).

1. Create an ordinary Sorceress, open native Character HUD sheet.
2. Read critical damage row before or after earning/spending attributes.
3. Compare saved derivedStats.critDamage2 to visible2%.

Expected: multiplier2 means200% total critical hit damage, following
engine/types/attributes.ts Critical hit damage multiplier documentation and
combat/damage.ts multiplication. Preserve combat numeric value2.
Actual: CharacterScreen.tsx262 rounds raw multiplier and appends percent,
showing2% instead of200%. Existing critChance uses formatPercent; this row does
not. Source diagnosis is sufficient; no balance/formula change implied.

Evidence: docs/plans/evidence/p11a01b-earned-stat-allocation.md final matrix
SHA256b4bedf632a9ce2d952861758f2298e3856e5822fb15a7a59b47b9c1be2fa6162;
frozen stat-allocation-earned.spec.ts explicitly preserves existing2% display
and full saves establish stored multiplier2. B3 acceptance excluded correctness
of this existing row. Raw browser artifacts were removed after both reviewers
released retention; versioned evidence and source assertions remain.

Workaround: interpret raw displayed number as multiplier, not percentage.
Future fix needs source-backed expected200% and independent review of any
existing frozen browser oracle correction; no runtime/test change in this intake.
Security check: pass, local display only; no credentials/network/permission work.


## Reviewed implementation plan and genuine RED

Input a0769ed after accepted mercenary gear proof. Root owns only
CharacterScreen.tsx display row, CharacterScreen.test.tsx and sole existing
stat-allocation-earned.spec.ts display-oracle correction, original-source fixture,
and this bug evidence; closing ledger separately. Producer/QA/design all reviewed
plan READY before implementation. Source-cited choice: multiply by100 before
rounding in the critical-damage row; retain whole-% presentation, engine/save
numeric multiplier, other percentage heuristics and correct StatSheet2.00×.
No schema/data/localizedcopy change. Security check pass: local numeric display,
no credentials/network/permissions/export changes or untrusted command execution.

Frozen component test SHA57224c0ad3e529d078f10fa24708652df3512da1dd946306a07935e3a413724a;
unchanged runtime27e3134e1c3116be54a5571b26d809d683aa82a61fdd7aeb89f17d777d1c3158.
RED14tests:8fail (en/zh×2→200%,1.5→150%,1→100%,2.375→238%),6pass
(two0→0% controls plus four originaltests),0pending; exit1/5.376s. Every failure
is the expected exact translated critical-damage row still showing2%/1%; no
setup/import failure. Tests additionally assert nearby critChance5%, complete
player equality and identical player/derivedStats references/numeric values.
Plan preserves native browser recipe, numbers, allocation/Cancel/Apply/keyboard/
layout and Save/IDB/export/closeContinue assertions. Independent source review
proved the old2% display expectation wrong; original whole browser spec
SHAf4e72e467c6375ef0d3f5bca653da983c75c070ce21e3a41081536d6b97c8387
is retained in docs/plans/evidence/fixtures/bug047-original-stat-allocation-earned.spec.ts.txt.
Only that expectation becomes200%; fixture critDamage2 stays unchanged.

Next: independent frozenRED review before one-line runtime fix, focused GREEN,
related/fullunit/T/L/explicitPWAlint, then unchanged four-case native production
allocation/save/reopen matrix with task-local pinnedNoto font, retries0. No
build concurrent with fingerprint tests. Final independent review before exact
owned RAW/dist/.vite cleanup and commit. This does not accept Den/fullP11/C/G.
RAW=/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-crit-display-6ej81zug;
root owns cleanup after producer/QA release, including copied font/license,
runner/config and task-local cache; neither reviewer creates artifacts/processes.


Producer and QA each independently approved genuine frozenRED before the runtime
edit; testhash57224c0a unchanged. Runtime now3e29ea44184c6f06f7f0b08b80cecdae97eb121e15b7f2672dd07bd4a824d52e;
solebrowseroraclecorrected specb6c1b36e9bc9e270c97c50dde1d0b3cd094cbd7f8277e44e1ac4aafc872e2668.
Focused63tests/4files GREEN6.314s includes all14 frozen cases, draft regressions
and existing StatSheet formatting/components. Completeunit2455tests/142files,
0pending/fail,37.071s; TypeScript10.802s, full lint45.363s/purity52 and explicit
PWA lint5.799s pass. Existing timing budgets exceeded; no threshold changes.
Production browser command runs only after fullunit has completed, with
PWA_PORT4397, no server reuse/retries and native guardedproductionbuild.
No engine change, so redundant engine/coverage rerun is unnecessary here.


First production matrix passed4/4,0skip/retry/flaky/errors,93.524runner/
94.867wall. ReportSHA91459d475f1c672dad493838ea02939ddba099d7c8a1966d457a393ca8067c62;
82attachments. All exact derived200% assertions and native Save/Continue passed,
but existing screenshots capture only attribute editor, not derived panel.
Producer/QA independently approved one evidence-only `derived-reopened` native
parentpanel screenshot after reopened derived assertions/layout and before the
geometry sweep, at each original caseviewport. No assertion/recipe/numeric or
runtime change. First passing sourceb6c1b36e/report remain in RAW; this is visual
evidence completion, not a failed first run. Capturedraft T10.248/PWAlint5.340
pass; unchanged fourcases/retries0 are rerunning. Unit evidence still applies to
unchanged runtime and frozen component tests; no redundant fullunit rerun.


## Final evidence packet

Finalspec SHA7595fdfaabc12894e782f21314b2c25adf229931ad592e73000c23921f60e82b,
runtime3e29ea44 and frozencomponenttest57224c0a unchanged since GREEN.
Capturematrix4/4 pass,0unexpected/skipped/retry/flaky/browsererrors,
93.726runner/94.976wall. ReportSHA
6d27f2a033c47d961e07249c4f6fe9aa6c43ef6e85f6ae608ab1fc8f0242be38.
All86attachments retained for independent audit. Each case native derivedrow
asserts200% before/after Apply and afterContinue; complete applied/reopened save
payloads equal and stored critDamage stays2. Native earned5point/Cancel/unmount/
Apply/no-refill/keyboard/layout/locale oracles are unchanged. Root visually
inspected actual reopened Chinese mobile and English desktop panels showing
200% with surrounding5% critChance; Chinese glyphs readable, no row overflow.

Compact versioned artifacts in docs/plans/evidence/fixtures/: bug047-outcome.json
retains exact10command argv/exit/wall/logSHA, original RED8fail/6controls, focused/
fullunit results, bothpassingbrowserstats/reporthashes, source/fontconfighashes,
all86finalattachmentbytecounts/SHA and saveequality/numeric2 for eachcase;
bug047-original-stat-allocation-earned.spec.ts.txt preserves original wrong2%
oracle, bug047-first-passing-stat-allocation-spec.ts.txt preserves firstpass
before sole screenshot addition, bug047-mobile-zh-derived-reopened.png is the
exact finalnative mobile screenshot. These preserve genuine history rather than
rewriting earlier evidence. All assertions in finalspec remain intact.

Same pinned task-local Noto font/license as P13c01B, separate ownfontconfig/cache;
no system/user/sharedfont edit. Native guard/build warns oldBrowserslist,
>500kBchunks,2.57MBgeneratedmanifest excludedfromprecache,NO_COLOR/FORCE_COLOR;
no buildpolicy/timingthreshold change. Broader shortlandscape overlay/global
320nav40px/a11y/i18n/Den/C0–C4/G0–G7/fullv1 remain open. This fixes only the
critical-damage display unit; no change in combat strength or save format.
Final independent verdicts and exactcleanup follow below.


## Independent acceptance and cleanup

Producer and QA independently APPROVE / ADEQUATE: exact source deltas, all10
command records, genuine RED, GREEN/fullunit and both browser reports, all86
final attachments, full Save equality/numeric multiplier2, and allfour readable
derived PNGs verified. Both released RAW retention; no material findings.
Exact task-owned RAW above, worktree dist and node_modules/.vite removed with
portable APIs; absence verified, port4397 closed. Original checkout remains
read-only/clean. Root worktree claim continues for next D08 eligibility slice.
Only display-unit correction accepted; broader plan gates remain open.
