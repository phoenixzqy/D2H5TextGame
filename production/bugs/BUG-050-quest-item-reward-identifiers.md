# BUG-050 — Accept canonical base and unique quest item reward IDs

Status: verified fixed; independent producer/QA final APPROVE/ADEQUATE; commit pending.
Severity: High — canonical item reward authorship cannot pass quest validation.
Owner: content/schema integration; independent producer/design/QA review.

## Reproduction

Input `528c220`, Linux Node v24.21.0/npm11.19.0. Browser, viewport, locale
and RNG seed N/A for deterministic JSON Schema validation.

1. Create a valid quest document with a reward `itemDrop` of
   `items/base/helm-skull-cap` or `items/unique/coif-of-glory`.
2. Validate it with the production quest schema and strict Ajv2020.
3. Both fail at `/quests/0/rewards/itemDrop`; the legacy placeholder
   `items/unique_act1_boss` passes.

Expected: quest item rewards accept the canonical base/unique identifier
grammars already defined by their respective schemas. Actual: the flat-only
reward pattern rejects every nested canonical ID. Evidence: discovery log and
exact argv/exit1 retained in RAW. A fake flat alias is not a valid workaround:
it has no template resolution contract and would conceal the mismatch.

## Reviewed bounded correction

Change only `rewards.itemDrop` pattern/description in `quest.schema.json`, plus
public loader regression tests in `loaders/quests.test.ts`. Preserve the entire
legacy `^items/[a-z0-9][a-z0-9._-]*$` branch. Add exactly the canonical
`^items/base/[a-z0-9-]+$` and `^items/unique/[a-z0-9-]+$` grammars from the
authoritative schemas, including their leading-hyphen syntax. Reject unknown
nested namespaces, empty/deeper paths, wrong types and noncanonical slug chars.
Leave shared objective `$defs.itemId` and every other schema field unchanged.

Use both public loader APIs and both imported documents for real catalog IDs,
nonexistent syntactic examples, identity/nonmutation, legacy compatibility and
invalid-context diagnostics. Freeze genuine RED before the schema correction;
independently review before runtime edits. Existing assertions remain intact.

Syntax acceptance is separate from referential existence and reward execution.
Do not change quest content, item templates, loader implementation, claim logic,
save format or economy. Andariel's missing item mapping/table parameters and
whole-bag unsupported refusal remain; no reward, earned boss, C1 or C/G/v1
acceptance follows from this schema prerequisite.

Security check: pass. Explicit anchored local identifier branches, no file or
network resolution, dependency/permission changes, external instructions or
validation bypass. Unknown existence stays separate under the existing loader
contract. Root owns RAW and all mutations; reviewers read only.

RAW: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-quest-item-ids-zz5vn9bu`.
Retain until independent final consumers release; then remove exact owned
RAW/dist/.vite, verify absence, commit implementation/evidence and closing ledger
separately. No server is needed for this structural card.

## Frozen RED

Direct strict-Ajv discovery rejects both real IDs and accepts the legacy
placeholder, exit1/0.219s. First catalog-only public-loader run54tests=8fail/
46controls, exit1/3.030s. Expanded final frozen174tests=24fail/150controls,
0pending/todo, exit1/2.906s. Eight failures are actual catalog IDs across both
APIs/documents; sixteen supplementary failures are nonexistent canonical IDs
and the exact leading-hyphen grammar. All failures identify the expected
main/side document and `/quests/0/rewards/itemDrop`. Legacy/malformed controls
and all45 existing tests pass. Original assertions remain intact; no oracle
correction or schema/runtime change. Freeze/source/report hashes retained in
RAW for independent review before the schema edit.

## Implementation and verification

Producer and QA independently approved plan and genuine frozen RED before
the schema correction. JSON comparison confirms exactly two field changes:
reward-local `itemDrop.pattern` and its description. Shared objective item IDs,
all other schema, authored data and reward execution remain unchanged.

Frozen GREEN174/174, 0pending/todo, 3.133s; tests remain byte-identical to RED.
Full unit2625/144, 0pending/todo,41.795s; typecheck12.826s and lint52.703s/
purity52 pass. Existing unit timing budget exceeded without changing thresholds.
Scoped data/quest/claim regressions303/7 pass7.223s.
No `validate:data` script exists: real strict-Ajv loader/schema/integrity tests
provide data validation. Guarded production build passes after tests exit;
existing Browserslist/chunk-size/large manifest precache warnings remain.

The [versioned outcome](../../docs/plans/evidence/fixtures/bug050-outcome.json)
retains all11 exact command records, log/report/source hashes, original and
expanded RED assertions, unchanged GREEN assertions and exact JSON diff.
Original frozen test and catalog-only test/discovery sources are retained
beside it. Producer and QA independently approved final source and evidence,
verified all command/report/source hashes and released retention. Root removed
exact task-owned RAW/dist/.vite; absence verified. No task process remains.
