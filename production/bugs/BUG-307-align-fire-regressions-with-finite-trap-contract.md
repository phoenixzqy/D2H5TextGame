# BUG-307 — Align historical Fire regressions with finite trap semantics

Status: Open — integration test expectations require contract reconciliation.
Severity: Medium — the complete unit gate fails; no production defect is inferred yet.
Build: ba1f1668e8b9a11321734474a4f9c856febecf00.
Environment: local Vitest Node/jsdom, English and Chinese UI; deterministic combat seeds 7 and 41.

## Reproduction

1. Run the complete retained `trap-integrated-full` command at the recorded HEAD.
2. Observe 22 failures across `src/stores/assassin-fire.causal.test.ts` and
   `src/features/skills/SkillsScreen.assassin-fire.test.tsx`; 19,780 cases pass,
   two existing opt-in cases skip, and all 2,534 repository/nine external inputs stay exact.
3. Compare the failures with `docs/plans/decisions/D06-assassin-traps-v1.md`.

Expected: Wake of Fire and Wake of Inferno regressions retain exact Fire/Burn,
payment, miss, rank-alias and resource assertions while covering three independently
rolled paid pulses and their localized per-pulse label. Instant Fire skills keep
their existing single-hit expectations.

Actual: six cases expect one direct hit across the complete battle; two seed-41
cases assume the first miss also makes later autonomous pulses miss; two alias
fixtures copy martial ranks but omit the new native trap rank projection. Twelve
UI cases still query `Fire attack` / `火焰攻击` instead of the explicit per-pulse label.

Evidence: retained `trap-red/trap-integrated-full.json` and `.log` under
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-assassin-charges-zt17emhc`.
Controlling source: D06 finite timing/miss/native ownership contract; the two
named regression files. The original full result remains a failure.

Affected systems: qa-engineer/frontend-dev/engine-dev; root sole executor.
Suspected root cause: older instantaneous-fire tests were not reconciled when
the two authored trap identities gained native private paid lifetimes.
Workaround: use the already retained focused trap tests for diagnosis only;
do not grant a full gate, skip cases, remove Burn assertions or restore scalar traps.

Security check: pass for local test/fixture reconciliation; no credentials,
dependencies, permissions, CI, save schema, remote or campaign changes.
