# Counted ingredient side quests

Status: accepted locally for bounded current31 functionality. Full private-v1
acceptance remains open. Earlier sections retain the diagnostic chronology.

The [approved contract](../../design/counted-source-family.md) connects sixteen
finite exploration Recover actions to four canonical quests. Listing an object,
opening the inventory or talking to an NPC does not grant ingredients or rewards.
Jade requires a separate Meshif Give action before its separate journal Claim.
The other three quests consume their ingredients during Claim.

| Quest | Ingredients and area | One-time reward |
| --- | --- | --- |
| Alkor | Three glands, Spider Forest | 4500 hero / 3375 merc XP; five unallocated stat points |
| Jade | Three trinkets, Bazaar | 3500 / 2625 XP; 1000 canonical rune shards |
| Jamella | Five embers, River of Flame | 7000 / 5250 XP; one deterministic perfect gem from the authored seven-entry profile |
| Malah | Five lichen, Ancients' Way | 9000 / 6750 XP; ten effective Vitality after the ordinary soft cap |

Malah leaves raw allocation capped at 500 and permits an effective sheet value
of 510. Capacity changes do not heal the hero. The character sheet, allocation
preview, equipment comparisons and combat use the shared composition. Existing
source-free claimed saves remain inert; historical wallet keys are preserved.

Current31 follows an immutable literal capture of accepted current30, with
pre-widening equality independently verified. Four historical test constructors
were corrected to build literal historical fixtures independently of deliberately
poisoned live loaders; all mocks and reader assertions were retained. The final
ten historical suites pass 418 tests.

Runtime review caught a disabled Meshif Give after ordinary Town navigation and
incorrect progression conservation after failed Claim. Corrections retain the
last explored area, remove only aborted quest progression, preserve independent
XP, and fence point allocation during synchronous publication/restoration. A
separate final correction verifies restoration against an immutable witness.
All findings and original failures are recorded in [BUG-389](../../../production/bugs/BUG-389-counted-side-quest-sources-unreachable.md).

Focused root integration passes 168 tests across eight suites, including both
locales, the retained-area Meshif route, Vitality boundaries and current save
cache composition. Domain, stat and root source reviews approve their bounded
scopes. Final runtime source and type-only delta reviews also approve their bounded
scopes. Final strict types-v5, full lint-v1 and included final type-delta lint-v2 pass.
The initial fourteen-path scoped lint failed solely on six intentionally ignored
E2E spec warnings; its corrected invocation leaves the lint configuration intact.
Headed production browser-v1 found an actual Alkor Claim failure caused by an
accepted imported derived cache being checked for canonical equality before
real XP could normalize it. The reviewed runtime-v8 correction retains exact
pre-XP baseline checks, canonical post-XP checks and scoped cache rollback.
Final v9 changes only strict-type construction in its regression fixtures;
the 46 Claim tests pass. The original failures and exact browser export remain
retained; no browser fixture normalization hides the defect.

Final production build-v4 and headed browser-v3 pass in zh-CN at360×640 and en
at1280×800. Both exercise all16 Recover controls, partial save/reload per family,
ordinary Town navigation to Meshif, no-income Give, exact separate Claims,
no-heal, effective Vitality509→510 allocation, the canonical shard crafting
sink, inert repeats and save/export/import/close/reopen Continue equality.
Five viewports and44px controls pass, with no browser/HTTP warnings or errors.
Independent browser evidence and bounded UX review APPROVE after28 original-size
screenshots and exact762-file bundle verification. Browser-v2's incorrect
pre-Give disabled-Claim expectation is retained as a driver failure; the product
correctly shows View Progress and no Claim until Give completes the quest.

The original ordinary full-unit run was interrupted (tool exit143, cause unknown)
after721 of1109 suite results, including seven failed suites/181 failed tests.
Its log and exact unchanged source-v6 inventory are retained. Seven independently
reviewed test-only corrections preserve all malformed inputs/refusal assertions;
the six complete affected UI suites now pass285 tests. The non-record trusted
ledger fixtures separately prove early builder refusal, raw decoder refusal and
input nonmutation; the malformed-record pass-through case remains covered.

Final source-v7 differs in exactly those seven test files; production, data,
configuration, setup and dependency inputs remain byte-identical. Full ordinary
engine/sim-contract projects are running, followed by the complete UI project:
the interrupted run has no final unhandled-error summary, so its passing file
rows alone cannot close the unit gate. No current31 acceptance is claimed.
The four task-owned browser builds and three temporary profiles are removed,
all owned servers/processes have exited and cleanup has no remaining paths or
failures. Source, results, exports, screenshots and review reports are retained.

The retained evidence packet is
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
Root retains it through umbrella acceptance and owns its eventual cleanup.
Browser fixtures supply level, prior act unlocks and crafting inputs; they do
not establish earned campaign progression, 30–50-hour pacing, fourteen-build
balance, full accessibility/PWA coverage or owner playtest acceptance. CI is
excluded by the owner's instruction. No commit, push or deployment is included.

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
