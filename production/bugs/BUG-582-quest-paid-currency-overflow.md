# BUG-582 — Claim accepts observer overflow on an already-paid currency

- Status: Implemented and verified.
- Severity: High; a claimed reward can leave an unsafe spendable balance.
- Environment: Node 24.21.0 / Vitest 1.6.1, constructed completed Duriel Claim.
- Reproduction: author25 wishes on Duriel, return a cache with one wish and
  one rune-shard, and subscribe to the first currency write. Add
  MAX_SAFE_INTEGER to wishstone in that observer.
- Expected: grant-failed, all participating reward state restored and Claim
  available for retry, as the existing overflow regression requires.
- Actual: ok and an unsafe canonical wishstone balance.
- Root cause: preflight checks remaining currency grants only. Once a key has
  been paid and removed from the pending map, later callbacks may corrupt it.
- Evidence: bug580-581-green-v1.json, questTableReward currency-wishstone case.
- Correction: validate every participating current balance at each inventory
  preflight and before/after claimed publication; preserve valid independent
  additions and existing rollback. Do not remove the failed assertion.
- Owner: root, sole writer. No earned campaign replay is required.
- Fix and validation: All participating current currency balances are checked during inventory preflight and before/after claimed publication. The original failed overflow case, single-grant/claimed-observer rollback/retry and valid same-wallet observer addition regressions pass.
- Evidence: source authority24, bug580–583 affected check/browser receipts and
  docs/balance/2026-11-02-main-quest-wishes.md. Root retains the exact packet.
