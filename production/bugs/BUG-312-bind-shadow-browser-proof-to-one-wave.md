# BUG-312 — Bind combined Shadow browser proof to one wave

Status: Open — reproduced before test correction.
Severity: High — invalidates claimed combined public acceptance; no gameplay defect established.
Build: 5ace6e4d97747ebfc8adabdd7bceffba3ae153fe plus the uncommitted combined browser spec.
Environment: production Chromium, desktop1280×800/mobile360×640, en/zh-CN, fixed2026-10-27T12:00:00Z; constructed level30/imported equipment and prior-act markers. Native diagnostic seed7 is separate from the public run's normal seed generation.

## Reproduction

1. Run `tests/pwa/assassin-shadow-combined.spec.ts` with its task-isolated production config.
2. Examine all four rank20 Shadow Master `combined-proof` attachments in the original matrix report.
3. Compare enemy maximum-HP vectors and summon MP across adjacent frames. Enemy compositions change and the same summon ID returns with full150MP, while prior groups and completed flags remain accumulated.

Expected: charge3/3, its actual trap payment, the following four-positive-hit finisher and finite three-batch Fire sequence belong to one body in one wave. Prior-wave observations cannot complete a later sequence.
Actual: the command reports8/8PASS, but four of16rank proofs span multiple waves. A one-element body-ID set does not catch per-wave ID reuse. The first rank20 Master finisher kills its target after two positive hits; a later finisher can satisfy the unrelated four-hit assertion.
Evidence: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-shadow-combined-z66v6e4e/wave-boundary-diagnosis.json`, original `matrix-report.json`, decoded attachments and `public-before-wave-boundary.spec.ts.txt`. The original result is preserved without single-wave acceptance.
Affected systems: QA/public browser observer; root is sole executor.
Root cause: observer lifetime spans the whole automatic subarea run, but its identity and sequence assertions assume a single wave.

## Correction required

Partition observations by the public wave indicator, retain unsuccessful waves for diagnosis, and require every predicate from one wave. Associate the positive four-hit group with the specific finisher immediately after the witnessed placement. Keep real misses, target death, authored stats/costs and production state unchanged. Do not require monotonic MP: kills legitimately restore party resources. Re-run both shadows/ranks/locales/projects, audit the exact attachments and retain original failures. No skill/campaign/independent/full-v1 acceptance follows from this report.
