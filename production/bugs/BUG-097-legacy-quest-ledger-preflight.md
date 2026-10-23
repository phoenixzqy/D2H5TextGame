# BUG-097 — Reject reserved quest ledgers before legacy migration

Status: Fixed in this v12 storage change; see git history for this file.
Severity: Medium (malformed historical imports accepted; valid saves unaffected).
Owner: engine-dev / save integrator.

## Reproduction

- Build: `94e66eb` plus uncommitted v12 ledger implementation.
- Environment: Node 24.21.0 / Vitest 1.6.1, engine project; browser, viewport and locale N/A.
- Seed: N/A; no RNG.
1. Build a valid original v1 save with an engine-shaped inventory and Map equipment.
2. Verify that decoding the unchanged save succeeds.
3. Add an own `inventory.questItems` property containing undefined, an empty
   object, or an owned Book of Skill entry.
4. Decode the malformed legacy save.

Expected: reject every reserved ledger property before migration, without mutating
the source, as required by ADR-006.

Actual: v1→v2 reconstructs inventory and silently discards the property; the
post-v11 check cannot see it. All three malformed inputs decode successfully.

## Evidence and fix

Regression: `src/engine/save/quest-items.test.ts`, original-v1 positive control and
three reserved-field cases. First run: 3 failed / 37 passed.
Raw RED: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-radament-book-j3ti74ac/v1-red.log`.
Apply raw-input rejection for versions 1–11 before any migration; retain frozen
v11 validation and current v12 checks. Do not infer entitlement from claimed quests.

Validation: focused124/6 and full8806/286 pass before an equivalent TypeScript
guard narrowing; final engine4279/110, typecheck/lint/production build pass.
Independent QA source and regression review APPROVE/security PASS.
