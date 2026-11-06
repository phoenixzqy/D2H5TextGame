# BUG-487 — Retain the prepared profile through Act V quest boundaries

- Severity: Medium; maintained controller can undo its own recovery preference.
- Status: fixed locally; found by source review after the earned training experiment.
- Environment: current human2 source, Node24.21.0/WSL. Browser, viewport,
  locale and RNG do not affect this profile-reference error.
- Reproduction: the native runner assigns a new profile inside afterSiege,
  then runActFive executes its growth boundaries with its old profile argument.
- Expected: the callback returns the prepared profile; every later boundary
  and final report retains it. A failed callback still retains committed state.
- Actual: runActFive captures the old argument and returns void; later growth
  reinstalls the old combo order. The earned suffix driver keeps its own updated
  variable, so its training success does not prove this maintained return path.
- Evidence: tests/campaign/native-runner.ts afterSiege assignment and
  tests/campaign/act5-route.ts boundary closure; targeted regression follows.
- Fix: accept the returned profile, grow with it, return it after Claim and
  assign it in the runner. Keep optional callbacks and route defaults explicit.

- Verification: Fixed locally; new returned-profile regression fails before fix, then all three affected callback cases pass. Strict/scoped lint receipts retain all iterations.
