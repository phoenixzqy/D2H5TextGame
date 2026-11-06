# BUG-724 — Assert the full prepared-route continuation in dispatch checks

Status: Locally resolved in the retained working tree; no new commit.
Severity: Low. Owner: root / campaign QA contracts.
Affected systems: constructed Act II dispatch regression expectations.

## Reproduction — 2026-11-04

Build `b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus the retained
`feat/playable-foundations` working tree. Node/Vitest under WSL. Browser,
viewport, locale and combat seed do not apply; route/admission functions are
mocked, so no campaign or balance credit is inferred.

1. Use the saved original `native-runner.ts` and
   `dispatch.regression.test.ts` from before BUG723's changes.
2. Select `and its audit after a bounded Act II dispatch stop` in the dispatch
   regression file, campaign-regression project.
3. All four mode/profile rows fail strict equality on the added `continuation`
   object, with every older field matching.

Expected: exact equality includes all current continuation fields, including
zero training/retry usage, retained clears, source and terminal XP.
Actual: the test omits the continuation object that the audit already returns.
This is a stale expectation, not a gameplay or newly introduced runner defect.

Evidence: `green.log` (initial affected run), `baseline.log`,
`baseline-result.json` and `baseline-restoration.json` in
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-campaign-capture-4gwv8cir`.
The saved pre-change sources reproduce all four failures. The current modified
sources were restored byte-for-byte immediately after that bounded check.
Root retains evidence through umbrella acceptance, then owns exact cleanup.

Correction: extend strict `toEqual` with the complete expected continuation;
retain every existing assertion. Do not remove continuation data or replace
equality with a partial match to make this pass.

## Resolution — 2026-11-04

Strict equality now includes every continuation field. The original four
rows pass with zero admissions and complete surrounding realm restoration.
All 37 affected dispatch/journal cases, scoped strict types and explicit lint
pass; no production audit behavior changed. See
[capture evidence](../../docs/plans/evidence/p15-campaign-terminal-capture.md).
