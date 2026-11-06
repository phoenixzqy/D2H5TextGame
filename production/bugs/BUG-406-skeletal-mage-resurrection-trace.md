# BUG-406 — Reconcile the Mage fixture with native hostile resurrection

- Severity: Medium — one ordinary native integration regression fails.
- Status: Test contract corrected and verified locally; focused3/3, independent test review and successor complete ordinary1178files/25014tests pass.
- Build: `b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus disclosed local private-v1 work.
- Environment: WSL/Linux, Node24.21.0, Vitest UI/jsdom; seed7. Browser/viewport and locale are not applicable to this engine/store assertion.
- Affected systems: engine-dev/qa-engineer; native Mage integration and combat recording.

## Reproduction

1. Keep BUG-404 native Shaman resurrection enabled.
2. Run `src/stores/combatHelpers.skeletal-mage.test.ts`.
3. Inspect `settles once then carries real resources and creates a newly paid cycle from fire next wave`.

Expected: real native Mage resource carry, once-only settlement and fresh elemental
summons remain correct; literal combat expectations reflect current authored
hostile behavior without disabling resurrection or weakening assertions.
Actual: the expected second-wave Cold Mage damage trace differs from the native
recording. The first broad batch was deliberately stopped after this failure;
it is not a full-suite result. The subsequent test-only correction is below.

## Evidence and diagnosis

Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/`.
`bug404-unit-full-v1.log` retains the failure; the stop request and terminal receipt
retain exact owned-process termination and unchanged2276-file before/after source
manifests. Its wrapper reports exit125/a bounded-cleanup error, with no live owned
descendants in the final group. This stopped batch supplies no full acceptance.
Focused reproduction is `bug404-mage-regression-red-v1.log` and `-exit.json`.

The focused RED reproduces the precise difference: the3880ms Cold bolt now
hits `enemy-act1.fallen-0-ac70` for58 instead of missing for0. The bounded causal
recording in `bug406-mage-causal-trace-v1.log` proves that this original Fallen
dies1940, is revived3640 with its original149maxHP by the first Shaman while
Fire Bolt cools down, and dies again to the Cold hit3880. The changed living
roster and legal Shaman actions change the seeded trace. This is intended native
resurrection, not a Mage damage or resource regression.

## Correction and verification

Only the existing Mage test changes. It now pins one exact source/target/time
revival, original restored stats and both death times, then requires the actual
58-point Cold hit against that restored target. Every payment, carry, fresh-
summon, immutable input, deterministic A/A/A-B-A replay and terminal assertion
remains. No production tuning, Shaman removal or mechanic disabling was needed.
Temporary bounded trace logging was removed after capture.

`bug406-mage-focused-green-v1.log` and `-exit.json`:3/3 pass, exit0, no timeout
or live owned descendants. Pre-correction source remains in
`bug406-pre-correction.test.ts` for independent review. Successor complete units
are `bug404-unit-full-v2`:1178files/25014tests pass, exit0 in1344.324s, bound
to identical2276code inputs before/after, with no timeout, wrapper error or
live owned descendants.

Independent review `[BUG406-TEST-REVIEW]: APPROVE` is retained in
`bug406-independent-test-review-v1.md`. It confirms the one-hunk correction,
exact causal lifecycle and preservation of all carry/payment/fresh-summon/
immutability/replay assertions. This is scoped test approval, not independent
acceptance of the entire resurrection feature or earned campaign behavior.
