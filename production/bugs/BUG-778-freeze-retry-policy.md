# BUG-778 — Freeze retry policies before observing outcomes

Status: fixed locally, uncommitted; validation and limits recorded below.
Severity: Medium — diagnostic policy and outcome integrity; no production save defect.
Owner: root, solo, acting as qa-engineer/engine-dev.

## Reproduction

Base HEAD `b5a0898806bfba369a2d84a1b6c41d0bbb057fce`, inherited dirty
`feat/playable-foundations`, Linux/WSL, 2026-11-05. Node/Vitest native transport;
browser/viewport/locale not applicable. Constructed initial sorceress, canonical
Act I Catacombs, admission clocks `1793304041000` and `1793304042000`; native
area/clock-derived seeds. These are isolated adversarial diagnostic controls,
not earned campaigns, population samples, or renewed historical retries.

1. Declare two attempts with an owned Fire Bolt skill-point allocation policy.
2. In the first loss's journal callback, change the original target rank to zero
   and empty the original priority array.
3. Observe the later adaptation; the owned point remains unspent.
4. Separately change a published defeat wave's outcome to victory in a callback.
   Native settlement validation then throws because its private wave was changed.
5. Throw on the first journal entry: it is emitted only after admission has
   already consumed a native counter, with no preceding complete policy record.

Expected: a detached complete policy declaration exists before admission;
caller and journal mutation cannot rewrite the declared adaptation or retained
outcomes. A failed policy publication leaves native stores and counters intact.

Actual: shallow readonly types do not detach runtime references. The live caller
profile is used after a loss; published waves share private references. No
complete policy declaration is retained before evaluating outcomes.

## Evidence and repair contract

Three new `[policy]` cases in
`tests/campaign/retry-measurement.regression.test.ts` fail before repair.
The three older tests are filtered out, not rerun. Exact RED JSON/log, prospective
scope/budgets, preimages and process receipts:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-retry-policy-5o79t7x3`.

Snapshot the complete request before use; publish and return its versioned
declaration. Detach all external journal records and stored adaptation actions.
Keep native admissions, clock advancement, quest settlement, resource refill,
owned-point costs, attempt limits and stop-at-victory behavior intact.

Security check: pass; local diagnostics only, no credentials/network/CI,
dependency or permission changes. Plan self-review: ready. Use only affected
new controls and scoped types/lint; full-v1 balance acceptance remains incomplete.

## Resolution

The harness copies the entire request before any use, journals
`{ kind: 'retry-policy', policy: { version: 1, request } }` before admission,
and returns that declaration with its results. Every journal publication and
retained adaptation action is detached. Three causal REDs become GREEN;
the final controls also edit published policy and adaptation records without
changing the private declaration or retained action evidence. A failed initial
policy publication restores the clock and leaves all native stores unchanged.
Scoped strict TypeScript (957 imported files, zero diagnostics) and explicit
two-file lint pass. Older tests and exhausted campaign/sample/retry budgets
remain closed. See [evidence](../../docs/plans/evidence/p15-retry-policy-snapshot.md).
Review is root self-review only; general adaptation/population and full-v1
acceptance remain open.
