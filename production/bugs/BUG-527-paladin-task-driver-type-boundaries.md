# BUG-527 — Preserve native type boundaries in Paladin task drivers

Status: Reproduced; root owns correction.
Severity: Medium (external verification driver; no production gameplay change).
Build: b5a0898806bfba369a2d84a1b6c41d0bbb057fce plus retained dirty implementation.
Environment: Node 24.21.0 / Linux WSL; browser, viewport, locale and combat seed not applicable to static failure.

1. Run packet-scoped strict TypeScript and ESLint on Paladin forecast-v2 and earned12-training-v1.
2. Observe forecast act remains number, observation outcome is widened string, and two callbacks return void expressions.

Expected: Native finite act/outcome contracts and callback blocks pass existing strict checks.
Actual: Two TS2322 errors and two no-confusing-void-expression errors; no native Paladin admission has run.
Root cause: Copied driver did not narrow runtime act/outcome at its boundary and used shorthand void callbacks.
Owner: root (task QA tooling). Correct local drivers; preserve passing forecast-v1 and its diagnostic result.
Evidence: /home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/p15-paladin-preparation-types-v1.log and p15-paladin-preparation-lint-v1.log.

Resolution: Fixed in task-local forecast-v3 / training-v2 on the retained uncommitted source. Explicit finite runtime narrowing and callback blocks pass p15-paladin-preparation-types-v2 and lint-v2; route v1–v5 pass their scoped checks. No suppression or production API change. No new Git commit.
