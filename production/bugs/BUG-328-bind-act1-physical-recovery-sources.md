# BUG-328 — Bind Act I scroll and Malus to actual physical recovery

Status: Locally resolved for Cain/Malus physical recovery; dependent selected imbue remains open.
Severity: High — two authored main quests cannot complete their recovery path.
Owner: root quest integrator / content-designer.
Affected systems: authored quest objectives, reciprocal bound items and recovery.

## Reproduction

HEAD`370aecb2`, with the separately reviewed Blood Raven changes present;
all1810 runtime/config/test input hashes frozen. Node24.21.0, Vitest1.6.1,
jsdom. This constructs tracked/cleared state to test the real recovery boundary;
it is neither earned combat nor browser/pacing proof.

For each actual quest:

1. Create a player, finish hydration and track the authored quest with all actual
   objective flags false and no reward claimed.
2. Visit its approved canonical area and construct that area's clear flag:
   Cain→`areas/act1-dark-wood`; Malus→`areas/act1-catacombs`.
3. Ask `questToolStatus` then independently call `recoverQuestTool` for the
   exact source below.

| Quest | Exact source | Expected physical item |
| --- | --- | --- |
| `quests/act1-search-for-cain` | `quests/act1-search-for-cain#objective:obj-inifuss-tree` | `quest/scroll_of_inifuss` |
| `quests/act1-tools-of-the-trade` | `quests/act1-tools-of-the-trade#objective:obj-recover-malus` | `quest/horadric_malus` |

Expected under the [focused owner contract](../../docs/plans/decisions/D11-act1-remaining-quests-v1.md):
status ready, Recover ok, exact bound owned item and source flag, no XP or Claim;
repeating recovery refuses without mutation. Later Give consumes the exact source.
Actual: unavailable/not-eligible, with no physical item or source progress.

## Cause and evidence

The legacy source objectives do not provide a canonical executable delivery
graph. Cain uses an interact objective at obsolete `areas/act1_dark_wood`; Malus
points at nonexistent `areas/act1_monastery_barracks`. Real recovery depends on
reciprocal authored bound-item definitions plus canonical area/objective matching;
loosening matching or inserting an inert token would not repair that graph.

External `recovery.test.ts` produces four causal failures/eight passing controls,
8.766245948s wrapper/8.15s Vitest. Untracked, uncleared, wrong-area and wrong-source
requests preserve exact stores for each quest. Positive assertions use actual
production loaders/actions, without mocked data or services. Correct source/data
definitions and real hand-in/rescue/Claim must satisfy the complete owner contract;
these recovery reproductions alone do not accept either quest.

Root retains original test/config/log/receipt and input hashes at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-act1-recovery-hdfy5h1a`.
The test process is terminal; root keeps this exact evidence for implementation
and independent review, then owns archive/readback/exact cleanup. No production
repair, genuine save/action, migration or external publication occurred here.


## Next Malus physical increment: current API baseline

At b7bf3595 plus the unchanged frozen Countess source, external malus-api-red
produces8causal failures/10passing controls across18cases. Authored fetch still
points at the nonexistent barracks and has no delivery item/real Give. Positive
fresh/sparse completed/claimed recoveries fail before their downstream Give and
durability assertions; those later assertions are not claimed as executed.
Negative requests and sparse literal22 migration control remain write-free.
The reviewed physical Recover/Give plan is ready; full imbue entitlement remains
a later dependent card. No Malus source change or genuine action has occurred.

Root retains exact draft/config/log/receipt in
/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-malus-h9_rzp5t,
for repair/review followed by verified retention and exact cleanup.


## Malus integration and reached publication failures

Countess source checkpoint345cd708 is explicitly full-gate-pending. Physical
Malus helper, authored Catacombs cache/delivery, finite eligibility and current23
validation are integrated. Native helper/API33tests across2files pass, including
real Recover→Give and midway save roundtrips for fresh/sparse completed/claimed
journals. Literal22 rejects future physical sources before version-only migration.

Before routing through the prepared bounded publisher, native23transaction cases
produce12causal failures/11passing controls. Both deep mutate-then-throw restores
retain changed old rows; both postpublication edits and both redirected locations
are accepted incorrectly; revoked clear context is accepted; both item and both
map silent publication drops report success; silently dropped map restoration
fails to report AggregateError. Each fault reaches its intended boundary.
The shared lease, ordinary negatives and thrown-restoration aggregate control
already pass. These are local constructed functional tests, not earned/balance
evidence. Root retains physical-transactions-red.log/process/receipt and exact
native test in the Malus task packet; no validation weakening is permitted.


Dependent affix-only prerequisite baseline: native26cases report16missing-API
failures before prepareRareAffixes exists. Nine refusal assertions also pass
against that missing function and therefore are not meaningful eligibility
controls at this baseline; the existing two-affix/sparse ordinary RNG comparison
is the one independent compatibility control. Production helper is added only
after this original rare-helper-red log/receipt is retained. Physical64tests
across4files pass; independent13path physical source review APPROVE/readers
released, with whole integrated and browser gates pending.


## Integrated static fixture failure (before repair)

At Countess checkpoint345cd708 plus the Malus physical/helper diff,
`npm run typecheck` exits2 with TS2790 at
`src/engine/map/malus-quest.test.ts:28`. The negative untracked-quest case
deletes a property inferred required by the local row factory. Runtime graph
behavior is unchanged: integrated engine10295tests/394files passes. Expected:
the sparse journal fixture has the public string-keyed progress-record type
and may omit a quest. Actual: inference requires that one literal property.
Browser/locale/RNG are inapplicable to this TypeScript-only failure. Owner:
engine-dev/QA. Original integrated-types.log/process/receipt are retained in
the Malus task packet. Repair will type the factory as the public sparse
record, preserving deletion and every assertion; no suppression or timeout
change. Combined final manifest/checks must be refreshed after the repair.

The terminal integrated lint also finds7errors in the two new Malus test
files: redundant guards under the same narrow inferred row type, two
void-expression callbacks, dynamic delete, and a literal regex substring
check. These are fixture/style defects, with unchanged runtime assertions.
Repair uses the sparse record type, an empty record for the untracked
case, braced void callbacks, and exact String.includes semantics.

The first static correction exposed7TS2540/2542errors: QuestProgressData is
readonly, while this factory intentionally creates mutable fault-injection
setup. The correction must use a test-local mutable row shape with the same
public status domain and sparse string-keyed journal, rather than annotating
the mutable setup as the serialized readonly interface. Original final-integrated-
types log/receipt are preserved; runtime source and assertions remain unchanged.


## Release focused loader expectation failure (before repair)

At checkpoint345cd708 plus frozen release snapshot01b7d4c5, native
`release-focused` exits1:1530passing tests/onefailure across35files.
`src/data/loaders/quest-items.test.ts:24` asserts the exact authored bound-item
ID list without the newly integrated canonical `quest/horadric_malus`. Actual
loader output adds that ID first, matching `src/data/quests/items.json`; the
rest of the exact ordered list is unchanged. Expected: the independent exact
list includes the approved physical Malus item and retains every prior ID.
No player/runtime fault was found. Browser, locale and seed are inapplicable
to this static authored-list assertion. Owner: content-designer/QA. Repair
adds the one canonical ID to the explicit expectation; no matcher weakening.
Original35-file command, log, process and native receipt are retained under
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-malus-h9_rzp5t/` as
`release-focused-*`/`release-focused.log`, bound to unchanged1840inputs.

The same release attempt has two interrupted jobs: original tool handles
45202(lint) and71960(browser) returned143; no native final receipts were
written. All recorded PIDs are absent and preview port39658isclosed. Cause
is unknown. Original logs/process records and the explicit retrospective
`release-interruptions-observed.json` remain preserved. They are incomplete
checks, not passes. Current Malus browser8/8finished; Countess6/8logged
before interruption. Fresh terminal checks are required for acceptance.


## Gate lint style failure (before repair)

Frozen1840-input gate snapshotfd0313bf yields1531/35focused and10295/394
engine PASS, types/build PASS and16/16production browser cases PASS. Native
`gate-lint` exits1 after295.033s with exactly one error at
`src/engine/map/malus-quest.test.ts:5`: consistent-type-definitions requires
an interface for the test-local MutableQuestFixture object shape. The previous
release lint was interrupted, so this is its first completed report after that
type-only fixture correction. Expected: identical mutable fixture fields expressed
as an interface; actual: equivalent object type alias. Browser/locale/seed are
inapplicable to this lint-only failure. Owner: QA/engine-dev. Original native
gate-lint log/process/receipt remain in the Malus task packet; no suppression,
assertion, timeout, discovery or worker change. Repair changes only the type
declaration syntax; production source and test executable assertions are exact.


Final type-only declaration correction has independent APPROVE and exact emitted
JavaScript equivalence. Final focused1531/35andtypecheck pass; the first final
lint attempt45699isconsumed143without native receipt (observed220s after launch;
no fixed termination threshold/cause established). Tracked detached native lint
retry passes0in199.045s, with exact frozen inputs. All earlier task PIDs are
absent; fresh1840-input discovery/hashes and protected fixture audit pass before
the exclusive complete suite launch. Its native result is pending. No runtime,
assertion, timeout, discovery, worker or skip changes were made for static fixes.

The final combined checkpoint passes20,514tests/972files with independent approval and exact evidence retention/cleanup. See [Malus evidence](../../docs/plans/evidence/d11-malus-physical.md#final-combined-checkpoint--2026-10-27). Physical actions grant no XP/charge; full imbue and final reward behavior remain a dependent feature.
