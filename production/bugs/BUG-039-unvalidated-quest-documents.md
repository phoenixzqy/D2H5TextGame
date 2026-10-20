# BUG-039 — Reject malformed bundled quest documents

Status: reproduced; root/producer/QA APPROVE revised frozen RED; implementation next.
Severity: Medium (content validation bypass; no current authored save corruption demonstrated).
Owner: content-designer / engine-dev; producer and independent QA review.
Card: P04a03a, central-loader schema prerequisite only.

## Reproduction

- Input runtime `775eab7`, documentation/browser head `16fa6c6`; unchanged
  `src/data/loader.ts` from the input head.
- Environment: Linux, Node v24.21.0, Vitest ui/jsdom. Browser/viewport/locale
  and engine RNG seed are not applicable to bundled-document validation.
- Regression: `src/data/loader.test.ts`, quest document validation block.
- In the isolated test worker, preserve the exact exported main/side document
  properties/references; replace with a distinct valid fixture quest whose
  clear-area objective lacks areaId; call actual `loadGameData()`; restore
  the exact original document in finally. Repeat for both documents.
- Repeat with missing quests envelope, empty name/objectives, unsupported
  quest/objective kind, negative/fractional/string numeric rewards, unknown
  quest field. No loader mock, concurrent tests or repository data edit.

Expected: `GameDataValidationError`, context mainQuests or sideQuests, and
Ajv error path identifying the malformed envelope/row/objective/reward.

Actual: actual `loadGameData()` resolves successfully in all20 malformed
integration cases, returning malformed quest rows or silently accepting the
missing quests envelope. Separate schema-helper tests report Schema not found.
The missing-registration failures are supplementary, not the behavioral repro.

## Evidence before fix

```sh
npx vitest run --project ui src/data/loader.test.ts --reporter=verbose
npm run typecheck
```

RED exit1,112failed/24passed/136total,0skips,5.83s runner/7.149s wall.
Twenty failures are actual accepted-invalid loader behavior (10 per document).
Existing loader tests, objective-kind inventory control and cross-document
duplicate quest-ID rejection pass. Typecheck exit0/wall9.044s.

Frozen test SHA256:
`3004e4167bc316eb4f36148f8ad8f31fed25e8a835c65ce28870ae5d2601724f`.
Raw RED SHA256:
`788153ad5db817f588a898fd5607535783f3cd26a60c67815383e818ad321397`.
Task evidence root:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-quest-schema-7f5u2mfz`;
`quest-red.log`, `quest-red-result.json`, `quest-red-typecheck.log/result.json`.
Root removes exact disposable evidence after all reviewers consume it and
preserves decisive results/hashes here.

## Cause and bounded plan

`loader.ts` collects quests via optional `file.quests ?? []`, checks only id
and cross-file duplicates, and registers no quest schema. Both bundled JSON
documents already reference the missing quest.schema.json.

Producer plan-review: ready. Security-check: pass for bundled structural
validation; no dependency/network/credential/save/hook change.

Three-file runtime/test boundary: new draft2020-12 document-root schema at
`https://d2h5.game/schemas/quest.json`; register/validate both complete documents
before collecting their entries; extend existing loader tests. Closed
quest/objective/reward/stat properties;15 objective variants, typed namespaces,
positive integer count/waves/order, integer nonnegative numeric rewards/stats.
Preserve main/side/bounty, existing plain name/description, nullable unlock,
objects giver, deliver filter versus item/count, interact area/item/both,
all46 authored quests and declared numeric reward fields. Preserve duplicate
quest ID rejection. No authored content edits or save format change.

## Boundaries and follow-up

Direct `src/data/loaders/quests.ts` consumers still import JSON without using
the central loader; this child does not protect those paths or change their
types. Reference resolution is separate: most authored area/monster quest
references are currently placeholders. Do not enforce crossrefs to reject the
baseline or silently rewrite content identity. Per-quest objective-ID semantics,
all objective/reward execution, transactions, budgets, economy, canonical
Countess/Andariel rewards and earned campaign acceptance remain open.

Before runtime edit: independent root/producer/QA approval of frozen tests and
genuine raw RED. After fix: focused loader and unchanged integrity tests,
related/full suite, typecheck/lint/build, then current-source review and
verified cleanup. This prerequisite has no browser acceptance claim.


## Tests-only review correction and revised RED

Independent producer/QA confirmed the20 real accepted-invalid failures. Review
also found four test matcher unsafe-assignment lint errors and Vitest's array
parameter dispatch: a bare [] row passed undefined instead of an actual array.
Replaced nested matcher-valued object properties with captured/narrowed
GameDataValidationError assertions; wrapped array-valued envelope/reward rows
in named objects. No suppression, runtime edit or weakened validation oracle.
Optional absent rewards remain valid; actual array rewards must be rejected.

Revised frozen test SHA256:
`09c1d7ff0755b23d42c784945c8b8ef0257ee964a164f1bc1201163fa0954688`.
Raw revised RED SHA256: `33734a3e7cbb2426d159ba22bad86f45750b42914ed27da5b06b85c04516dd54`.
Same136tests:112fail/24pass/0skip;20 genuine accepted-invalid failures plus92
missing-schema failures. Runner2.90s/wall4.295s. Revised typecheck exit0/9.844s;
scoped lint exit0/5.741s. Commands match the initial run; label
`quest-red-revised`, `quest-red-revised-typecheck`, `quest-red-revised-lint`.
Initial failed lint and first RED are retained for reviewer consumption.

Root/producer/QA independently APPROVE the revised frozen tests and genuine
RED. Unchanged loader SHA256:
`e6ed10d4c4c52ed678a6b6fc5b76e2b5f181480242ffbdf7b32a266827c3387a`.
Both independent consumers have finished initial/revised RED evidence. Runtime
implementation is authorized within the reviewed three-file boundary.
