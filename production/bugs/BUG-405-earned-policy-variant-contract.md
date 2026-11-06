# BUG-405 — Account for the explicit earned Javelin diagnostic variant

- Severity: Medium — the ordinary unit gate rejects an intentional diagnostic policy addition.
- Status: Fixed and verified locally; focused14/14 and successor complete ordinary1178files/25014tests pass after the original full-run failure reproduced the drift.
- Build: `b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus disclosed local private-v1 work.
- Environment: WSL/Linux, Node24.21.0, Vitest sim-contracts. Browser/viewport/locale/seed: not applicable to this pure policy assertion.
- Affected systems: QA campaign policy contracts; root/producer ownership.

## Reproduction

1. Retain the separately registered `amazon-javelin-poison2` policy used by the disclosed bounded diagnostics.
2. Run the ordinary unit suite, including `tests/sim/contracts/earned-campaign-policy.test.ts`.
3. Observe `publishes the closed fourteen-profile registry and exact reviewed additions`.

Expected: preserve exact original fourteen-profile assertions and explicitly pin
the additional diagnostic variant in both TypeScript and CLI JSON registries.
Actual: the test demands exactly fourteen total registry entries; the intentional
fifteenth diagnostic policy makes its array comparison fail. This does not prove
a fifteenth viable build or completion of any campaign.

## Evidence and diagnosis

`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/p15-idle-svg-shaman-unit-full-v2.log`
retains the reproduced mismatch. The same directory's
`p15-javelin-poison2-v3-identities-v1.json` and outcome note retain the exact
diagnostic profile and its accepted source binding; its gameplay result remains
a Dark Wood W4 draw. Original `amazon-javelin` is unchanged. The stale test
expectation predates the separate variant; no product tuning is needed.

## Correction and verification

Keep the original fourteen baseline profiles and per-class counts exact. Add the
explicit Poison2 identity to allowed registry/CLI assertions and pin its complete
policy (Jab3 and Poison2 with the same stats, weapon fallback and action priority).
Do not relax closed-set checks to arbitrary extra profiles. Run this focused
contract before resuming the pending Shaman implementation.

Focused GREEN: packet `bug405-policy-focused-v1.log` and `-exit.json`, exit0,
6.531s, no timeout or live owned descendants. The full ordinary run before this
correction had exactly this one failure. The successor complete result is below.
No commit was created.

Independent review APPROVE is retained in `bug405-independent-review-v1.md`
in the same packet. It confirms the exact closed registry, all14 complete
baseline policies and the sole pinned Jab3/Poison2 diagnostic, with unchanged
TS/CLI policy bytes and input guards. The successor full ordinary unit run is
`bug404-unit-full-v2`; it passes1178files/25014tests, exit0 in1344.324s, with
identical2276-code-input manifests, no timeout/error or live owned descendants.
V1 was intentionally
stopped for the unrelated stale Mage trace documented in BUG-406 and supplies
no full-suite acceptance.
