# BUG-596 — Quest-item tests retain pre-v33 rejection assumptions

Status: Fixed locally; authority45, no commit created.
Severity: Low. Owner: root / QA.

## Reproduction

Run `src/engine/save/quest-items.test.ts` in the engine Vitest project. Seven
assertions expect `Invalid save` but receive `Invalid recruitment save field`.
The other 84 cases pass. The complete failure names/messages match exactly when
Vite loads the retained authority42 `validate.ts` bytes instead of the candidate.

## Expected and cause

The missing-current-ledger case should start from a valid current save and remove
only its ledger. It currently relabels a historical v11 save as current33, leaving
other required current fields absent, so recruitment validation rejects first.

Six reserved-future-proof cases correctly exercise historical `decodeSave`, then
also pass the historical input to the current-only `validateSave`. That API now
rejects missing current recruitment fields before the older generic error. The
assertion should describe that current-only API contract precisely while keeping
the historical descriptor-preservation and reserved-proof rejection assertions.
Do not weaken the production guards or simply accept any thrown error.

## Evidence and next action

Packet `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`:
`bug592-save-precompile-baseline-v1.{json,log}` and
`bug592-save-baseline.workspace.mjs` use an in-memory load of the retained original
source. `bug592-save-precompile-green-v3.json` has the same seven failures with the
candidate. Fix fixture/API preconditions in a separate focused increment and rerun
this suite; there is no product regression established by these failures.

## Local resolution — 2026-11-02

`src/engine/save/quest-items.test.ts` now starts the missing-ledger case with a
positively validated current save, removes only the ledger, and checks rejection
at both APIs without input mutation. Historical reserved-proof cases retain
decode rejection and descriptor checks; their current-only API assertion names
the precise recruitment-field error for historical input.

`bug596-green-v1.{json,log}` records 91/91 passing cases. Scoped strict types and
lint pass (`bug596-types-v1.log`, `bug596-lint-v1.log`). Authority45 changes only
this test from44; runtime/data/canonical saves remain exact. The previous seven
baseline failures are retained as evidence. No campaign, browser or unrelated
suite was replayed. Required packet is retained by root through umbrella review.
