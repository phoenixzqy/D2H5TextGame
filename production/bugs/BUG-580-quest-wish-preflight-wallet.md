# BUG-580 — Preflight reads the historical wishstone wallet

- Status: Implemented and verified.
- Severity: Medium; recruitment economy/compatibility.
- Environment: Node 24.21.0 / Vitest 1.6.1, private v1 worktree.
- Reproduction and expected/actual: With a completed Den and currencies {wishstone:3,wishstones:MAX_SAFE_INTEGER}, override its reward to seven wishes and claim. Expected canonical10 and unchanged pluralMAX; current safeGrants refuses the valid grant because it reads the plural wallet. The final publication already uses the canonical key. Use one mapping for both boundaries, preserving all other currency identities and overflow checks.
- Evidence: source authority23 and source/data inspection before edits.
- Owner: root, sole writer. No earned save mutation or compensation.
- Fix and validation: One canonical currency-key mapping now serves early safeGrants and prepared publication. The opaque plural balance may remain MAX_SAFE_INTEGER while new wishes fund real recruitment. Overflow/refusal/rollback regressions remain intact.
- Evidence: source authority24, bug580–583 affected check/browser receipts and
  docs/balance/2026-11-02-main-quest-wishes.md. Root retains the exact packet.
