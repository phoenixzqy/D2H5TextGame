# BUG-389 — Complete the four counted ingredient side quests

- Severity: High — four advertised objectives/rewards lack an executable path.
- Status: Resolved locally; current31 accepted with independently reviewed terminal evidence. Full private-v1 acceptance remains open.
- Build: b5a0898806bfba369a2d84a1b6c41d0bbb057fce plus preserved local changes.
- Environment: Linux/WSL, production routing and content cross-reference.
- Browser/viewport: not applicable to this source-routing reproduction.
- Locale: zh-CN and en advertise these side quests.
- Seed: not applicable to missing authored sources and unsupported reward bags.
- Affected systems: engine-dev, content-designer, frontend-dev; root integrates.

## Reproduction

1. Read the four side rows in `src/data/quests/side.json`: Alkor requires three
   venom glands, Jade requires three trinkets, Jamella requires five embers,
   and Malah requires five lichen.
2. Trace `loadQuestItems`, `areaQuestTools` and `hasAreaObjects`: none of those
   four ingredient IDs has an authored recoverable source. No finite plural
   source registry or grouped physical count can satisfy the objectives.
3. Follow the generic Claim dispatcher: Alkor's nested `stat.attribute_points`
   and Jamella's string `items/perfect_gem_random` are unsupported reward forms.
   Jade still advertises gold; it cannot pay the intended canonical shard wallet.
4. Follow shared equipped-stat composition and CharacterScreen: no source-derived
   Malah entitlement or post-soft-cap effective Vitality projection exists.
   Legacy underscore areas and Spider Cavern/Glacial Trail copy also disagree
   with the canonical compact map.

Expected: discover sixteen distinct finite Normal exploration Recover objects;
exchange Alkor/Jamella/Malah's complete ingredient sets during separate journal
Claim; explicitly Give all three Jade trinkets at Meshif before its separate
Claim. Pay the four exact approved bags once, preserve physical counts and old
save domains, and use one shared post-soft-cap Vitality result across consumers.

Actual: the advertised ingredient paths cannot complete, their reward handling
is incomplete, and old flags cannot safely prove ownership or payment.

## Evidence and repair boundary

The independently approved and root-ratified
[counted-source contract](../../docs/design/counted-source-family.md) records
all sixteen literal placements, graph compatibility, sinks and exact rewards.
Read-only source tracing and disjoint domain/runtime/composition/UI plans are
retained in the current town-enlistment packet. No counted runtime/data/schema,
new save boundary or test execution is claimed by this report. Actual accepted30
freeze/equality must precede widening. No commit, push, deployment, CI,
owner-answer or playtest hold is imposed; owner playtesting follows implementation.

## First content integration check

After accepted30 literal equality, root-profile-v1 reproduces the existing closed
counted-deliver schema rejecting Jade's approved canonical `areaId`. Profile
reward tests pass14/14; quest-loader check fails1/320 because deliverCountedObjective
does not yet declare areaId. Add only its optional canonical area reference,
keeping every other closed payload rule. The new family loader requires this
specific Jade area. Preserve the failed log in packet d2-counted-source-z3jj3xa1.
First scoped lint also catches a test-call line break; correct its formatting.

## Save-cache integration check

After the shared stat lane released, root-cache-red reproduces six failures
in seven current assembly/restore controls: build/decode preserve a stale
900 Life maximum instead of the qualified Malah capacity, build does not
clamp excess Life downward, and build does not yet refuse a participating
reward getter. Add the counted-family raw graph check before build
normalization and the explicit admitted current counted authority to the
final build/decode Life repair. Preserve historical source-free flags and all
other cache/wallet/history data. The failed log remains in the current packet.

## Real town navigation integration

Source tracing the production browser route finds that Town navigation retains
the last explored `currentSubAreaId`. Only a reset starts with null. The new
Jade Give guard incorrectly requires null, making the real exploration → Town
→ Meshif path unavailable. The first UI test artificially assigned null and
therefore hid this gap. Remove that artificial fixture transition and reproduce
the failure through the retained area and actual TownScreen before correcting
Give to the established current-Act town-service semantics. Keep Normal,
unlocked/current Act, actual Meshif panel and ordinary action/run guards.

## Historical-reader fixture integration regression

Before changing the fixtures, root-cache-green reproduces 37 failures in
`frozen-v30-reader.test.ts`: its `sample()` calls the current `buildSave`, which
correctly loads current counted authority and reaches the test's hoisted
throwing counted-loader mock before the literal30 reader is invoked. The
retained stack is `loadCountedQuestItems` → `buildSave` → `sample`, in packet
`d2-counted-source-z3jj3xa1/root-cache-green.log` lines 85–98.

The focused ten-fixture baseline reproduces 90 failures across four files:
literal30 has the 37 mock failures; literal27/28/29 have 53 construction failures
because current counted-loader validation observes their deliberately drifted
live quest/area catalogs. The other six fixture files pass unchanged. Retain
`frozen-fixture-repair/baseline.log`. Repair only those four sample constructors
with complete literal historical save fields, independent of current
`buildSave`. Keep every validator, drift mock, throwing counted-loader mock,
getter assertion and refusal assertion intact; no production workaround.

After the four fixture-only replacements, all ten focused files pass 418/418
tests and scoped ESLint passes for the four edited test files. All test bodies
and drift mocks remain unchanged; the six previously green fixtures are unedited.

## Independent progression conservation review

Independent runtime review finds that counted Claim journals preserve current raw
stat and skill investments while restoring all experience, stat points and skill
points from the initial snapshot. A real gainExperience subscriber calling
allocateStatPoint('vitality') therefore retains the investment but refunds its
point debit after failed Claim. allocateSkillPoint has the same mismatch, and
addXP(2) is lost outright. Reproduce each through the public player-store API,
then journal only Claim-owned publication transitions so independent investments,
point debits, XP, equipment and damage remain conserved. Preserve the unclaimed
physical graph, no-heal behavior and complete once-only retry.

The zero-preexisting-point variant exposes a dependency: a subscriber can spend
new quest-generated points before publication completes. Retaining that investment
while removing the aborted reward requires an unapproved debt policy. The approved
repair therefore fences all three public point-allocation APIs before mutation
only during counted Claim publication and restoration, using typed questBusy
refusals. Successful independent XP changes remain journaled and preserved.

## Independent restoration witness review

Final runtime review finds that counted hero restoration installs the same object
retained as its expected witness. A silent subscriber can mutate the installed
derivedStats.life in place during rollback, mutating both comparison operands and
hiding an unintended heal. Preserve a separate deep snapshot of the planned
restoration before publication and verify against that immutable witness. Add a
real silent restoration mutation regression requiring explicit AggregateError
and confirm the allocation fence releases after the failure.


## Final strict-type integration failure

Whole-project typecheck-v1 exits2 before acceptance. The retained log in
`d2-counted-source-z3jj3xa1/final-typecheck-v1.log` identifies i18next dictionary
arguments supplied as interfaces, missing checked test-array entries, unsupported
RTL `exact` options, a readonly fixture mutation, function-declaration closure
narrowing and overly narrow generic replacement inference in counted Claim,
and seven current-version type assertions still pinned to30. Fix these at the
call sites and fixtures while preserving runtime admission, reward values,
assertions and historical literal-reader coverage. No final browser or full
ordinary unit run has begun.

## Headed production Alkor Claim failure

Final browser-v1 on production build-v3 reproduces a real failed Claim in
zh-CN at 360×640: all three glands are recovered through keyboard controls,
the journal shows completed with three owned ingredients, but Enter on Claim
returns the translated reward-failed feedback and leaves Claim enabled. No
console, page or HTTP errors were observed. This is a gameplay failure, not a
browser-launch failure. Retain `browser-v1/result.json`, `failure.png` and
`failure-dom.txt` in packet `d2-counted-source-z3jj3xa1`. The imported disclosed
capability supplies a level35 hero with raw Vitality499, damaged resources and
an actually fielded level22 mercenary; source areas were uncleared. Diagnose
the failing publication/preflight step and add a real public-store regression
before changing the runtime. No acceptance or full-suite claim is made.

The final14-path lint attempt separately exited1 solely because six native/PWA
specs are intentionally excluded by the existing ESLint configuration. Full
repository lint passed; rerun the eight included final paths and retain strict
TypeScript validation for all six excluded version-only spec corrections. Do
not alter lint configuration to conceal the invocation mistake.

The exact exported owned31 save, loaded through real `importIntoStores`, now
reproduces `grant-failed` in `runtime/revision-v8-exact-browser-red.log`. The
accepted imported hero has cached defense129; canonical no-gear composition is
122. The new Claim initial check requires canonical equality before the actual
`gainExperience` publication can normalize that cache. Keep exact prepublication
hero/equipment/authority comparisons, then enforce canonical derived equality
after XP is published. Do not repair the failure by rewriting the disclosed
fixture. Failed-Claim restoration must also conserve the original accepted
cache when its original composition inputs still apply, while preserving
independent progression/gear/entitlement changes and current-resource no-heal
limits. Add public-import success across all four quests and aborted-Claim
cache-conservation regressions before runtime edits.

Headed browser-v2 on rebuilt final runtimev8 passes Alkor Claim, then stops
on an incorrect pre-Give Jade driver expectation: it expects a disabled Claim
button, but an in-progress journal row correctly renders View Progress until
Meshif Give completes it. Source `QuestsScreen.tsx` and retained browser-v2
failure DOM confirm this; no product defect or console/HTTP error was observed
at that point. Preserve the failed attempt. Driver-v3 checks Claim absence,
visible View Progress and the exact localized Meshif instruction, retaining
all no-income/physical-state/Give/separate-Claim postconditions. Production
build-v4 and final-source-v5 remain unchanged.

Final-typecheck-v4 on runtimev8 exits2 with five diagnostics confined to the
new Claim regression fixtures: readonly actor Life/Mana initialization, a
noncanonical `equipSlot:'armor'`, and readonly direct damage simulation.
Retain `final-typecheck-v4.log`. Correct fixture construction with immutable
resource initialization, canonical equipment slot and an explicitly in-place
mutation API for the silent observer damage test; preserve its intent, all
assertions and all production source. Recheck the focused test, lint and strict
types. The current headed driver-v3 uses unchanged production build-v4.

## Final production browser and ordinary unit reconciliation

Final strict types-v5 exits0 on source-v6. Headed production browser-v3 exits0
in zh-CN360×640/en1280×800: all16 Recover actions, four partial save/reload
pairs per locale, exact Give/Claims, no-heal, effective510 allocation, canonical
1000-shard crafting and save/export/import/actual reopen Continue pass. Independent
browser evidence and bounded UX review APPROVE. Original failures are retained.
Exact four builds/three temporary profiles are removed; all owned ports/processes
closed and no disposable paths remain. Diagnostic packet is retained by root.

Original ordinary full-unit-v1 was interrupted (tool143; cause unknown) after
721/1109 suite rows, with seven failed suites/181 failed tests and no terminal
summary. Exact2899-entry source-v6 was unchanged. Four partial Larzuk/town NPC
fixtures omitted canonical Malah; ActIV's persistent malformed reward mock
intercepted unrelated canonical graph checks; an old Jade case fabricated Den
objectives; two trusted-ledger cases demanded builder success despite the new
raw non-record refusal. Independent diagnosis/proposal reviews approve the exact
seven test-only corrections. Production refusal guards and getter controls remain
unchanged. Complete six affected UI suites pass285 tests.

Source-v7 records only those seven test-file differences. Full ordinary
engine/sim-contract projects then full UI project will provide terminal summaries,
including the unhandled-error channel missing from the interrupted run. Preserve
the original failed/interrupted evidence; no uninterrupted-full-pass or current31
acceptance is claimed before final checks/review.

## Terminal engine reconciliation and durable UI continuation

The complete ordinary engine+sim run terminates with483 files/12883tests:
482files/12882tests pass and one stale compile-laziness expectation fails. Its
fixture and validator are31 while the assertion still counts30. An independently
reviewed three-line test-only correction derives the current version from the
fixture, preserving compiler identity and lazy/caching budgets. The complete
corrected suite passes1/1. This is reconciled combined evidence, not an all-green
original483-file run. Source-v8 differs from source-v6 in exactly eight approved
test files; production/data/config/setup/dependencies remain unchanged.

The first full-UI rerun also ends143 without terminal receipt after55suite rows;
its cause is unknown and it is incomplete evidence. A task-owned detached
supervisor now runs the unchanged complete UI project to retain its actual exit
receipt and deferred unhandled-error report. Fresh strict types and exact eight
file zero-warning lint are queued only after a clean UI exit. Final ordinary
inventory reconciliation, independent results review and current31 acceptance
remain pending. All interrupted and original failing evidence is retained in
`d2-counted-source-z3jj3xa1`; no additional production/build/browser rerun is
needed solely for these test-only corrections.

## Current31 accepted locally

Independent final evidence review APPROVE. All 1109 expected unit files / 23619
tests are reconciled through complete terminal segments: engine/sim483 files
with one stale compile assertion, its corrected complete1/1 pass, and full
UI626 files/10736 tests exit0. This is disclosed combined coverage; neither
interrupted run is passing evidence and the original483-file run was not all green.
Fresh strict types-v6 and exact eight-test zero-warning lint pass; prior full
lint plus reviewed deltas, production build-v4 and headed browser-v3 remain valid
for byte-identical production inputs. Final2899-entry source manifest is exact.
Independent source/runtime, browser/UX and final evidence reviews APPROVE.

Acceptance receipt: `d2-counted-source-z3jj3xa1/current31-acceptance.json`.
All owned browser builds/profiles are removed, ports/processes closed and cleanup
has remaining[]/failures[]. Root retains evidence through umbrella acceptance.
Literal actual31 capture/equality comes next, before the one unpublished P14
batch. CI excluded; owner earned playtest follows implementation. This accepts
the bounded four quests, not campaign pacing/build balance/full private-v1.
