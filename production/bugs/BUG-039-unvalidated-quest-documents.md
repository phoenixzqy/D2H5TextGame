# BUG-039 — Reject malformed bundled quest documents

Status: fixed; root/producer/QA final combined APPROVE / ADEQUATE.
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


## Source implementation and first GREEN

Register the new document-root quest schema; validate both complete main/side
wrappers before collecting either document's entries; remove optional-envelope
fallback and redundant post-validation id check. Keep duplicate quest-ID
rejection and the existing opaque read-only map contract. No data/save changes.

Initial focused attempt exit1/113fail23pass/166total,3.05s runner/4.342s wall:
Ajv strictRequired rejected areaId required only in a nested interact anyOf
schema. Corrected the schema to explicit closed area-only/item-only/both
interaction variants, preserving the exact accepted behavior. No validator
setting or test was weakened; the approved test hash remains unchanged.
Final focused command passes166/2files (loader136 + unchanged integrity30),
runner2.60s/wall3.792s,exit0,0skips. Raw first failure and corrected GREEN are
retained under quest-green-focused and quest-green-focused-final labels.

Source hashes: loader
`ec38dbc5087df916f08a52d8b747d10bbb8b60289c7a918a9644b0c4d0780717`;
schema
`e250814c1459a1c9f5fcf388dc73cc8623f7bff442627eac4dc89aee560fb132`.
Root/producer/QA independently APPROVE source and focused evidence. Final
combined validation is complete; independent combined review follows below.


## Final combined validation

Frozen source/test hashes above remain unchanged. Exact commands and true exit
results are preserved in the task evidence root, one log/result pair per label.
All final commands exit0, with no failed/skipped unit cases:

| Label | Command | Result / wall seconds |
| --- | --- | --- |
| quest-green-focused-final | `npx vitest run --project ui src/data/loader.test.ts src/data/__tests__/data-integrity.test.ts --reporter=verbose` | 166 tests / 2 files; runner2.60 / wall3.792 |
| quest-related | `npm run test:related -- src/data/loader.ts src/data/schema/quest.schema.json src/data/loader.test.ts` | 166 / 2; runner5.26 / wall6.378 |
| quest-full | `npm test -- --reporter=dot` | 1904 / 127; runner26.27 / wall27.674 |
| quest-final-typecheck | `npm run typecheck` | wall10.732 |
| quest-final-lint | `npm run lint` | wall25.683; purity50 engine test files |
| quest-final-build | `npm run build` | build6.31 / wall9.883 |
| quest-final-coverage | `npm run test:cov -- --coverage.reportsDirectory=<task-evidence-root>/coverage --reporter=dot` | 1904 / 127; runner32.16 / wall35.892 |

Unchanged80% engine coverage gate passes:94.21%statements/lines,
89.01%branches,93.87%functions. Coverage targets engine, not the changed loader;
no engine source was edited. Related/full5/15second budgets remain exceeded.
Existing >500KB chunk and2.57MB manifest-not-precached warnings remain; build
reports756precache entries/37327.60KiB. No browser/campaign/quest-execution
acceptance is claimed by this structural prerequisite.

SHA256 of exact final logs:

- focused: `1f7fc516ea48697fc2d2a9dc1e5dbe65648f11a46ab75183154ffc54ccc35db3`
- related: `44e4741fa259f05599242fab44cfe1d593b594c5d13b1f2d291b7c3285d05203`
- full: `abed5f94a84e8da43fbb3c9ab4261ec8842006b1d0980288e4e8d3078d9bbefa`
- typecheck: `53a6aa8b4a16237ddc596024409b40a8c8e29e9056c6757c6f5c4fba3b0a7f47`
- lint: `f993e44b236baecc1c859ee65eddb3e93dd84768b4b42839e265cb8901074f9e`
- build: `380444f8778d8b95c33f9b1b363265aa1476156203f7109742f66c9872ba728b`
- coverage: `48fa4741c2e4aa4a5ffbb052486ad9535590d1af69946292b024127c87c3514e`
- coverage-final.json: `aead85196f7f18ca0adaf6c8bf32c4a239623cb6a8fd39dd9c50240c92b39b1c`

Root/producer/QA final combined APPROVE / ADEQUATE. Both independent reviewers
consumed every needed RED/failed attempt/GREEN/final log and coverage record.
After all consumers finished, root removed and verified absence of the exact
quest scratch root above, task-owned root dist and local node_modules/.vite.
Dependencies/shared caches/source/history preserved. No test process remains.
Only the bounded central-loader structural prerequisite is accepted.
