# BUG-579 — Credit new quest wishstones to the recruitment wallet

- Status: Implemented and verified; remaining authored quest budgets are open.
- Severity: Medium; future authored positive quest wishes cannot fund recruitment.
- Build: feat/playable-foundations, tree c25592b0ef005eebacaea970b5f9443a153a1fd4aed1881db22976d4896c9636.
- Environment: Node/Vitest claim boundary, completed constructed Den fixture;
  browser/locale not relevant.
- Reproduction: author `{ wishstones: 7 }` on a completed/unclaimed quest and
  claim with inventory `{ wishstone: 3, wishstones: 99 }`.
- Expected: canonical wishstone balance10, old plural balance99 unchanged;
  a real recruitment payment can spend10.
- Actual: plural balance106, canonical balance3; recruitment ignores the award.
- Evidence: claimReward.ts currencyGrants target mapping, older numeric grant
  regression, and new canonical-wallet regression before implementation.
- Root cause: early generic numeric reward compatibility predated the canonical
  D10 recruitment wallet. No bundled quest currently authors positive wishes.
- Owners: root as engine/content/QA writer. P15 explicitly updates future
  credits while preserving opaque historical keys; no balance conversion.
- Fix: future numeric wishstones credit singular wishstone; old plural balances
  are preserved. Explicit Den/Blood Raven/Andariel bonuses 15/15/25 preserve every
  prior quest field and specialized reward. No old claim is reopened.
- Validation: canonical payment, duplicate refusal, overflow/rollback and
  actual starter claims pass, including save/import/hydration.160 distinct
  affected assertions across eleven suites, scoped strict types and lint pass.
  Prospective budget/readback and exact data comparison are in authority23;
  no compensation, new earned save or completed campaign replay is claimed.
