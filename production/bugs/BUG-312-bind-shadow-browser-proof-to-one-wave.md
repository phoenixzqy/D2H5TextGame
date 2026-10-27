# BUG-312 — Bind combined Shadow browser proof to one wave

Status: Locally resolved — test correction d9447414; no product defect or independent approval inferred.
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

## Resolution — 2026-10-27

d9447414 partitions observations by visible wave and binds resources/logs through
DOM observer batch numbers. It retains prior waves and unsuccessful cycles and
selects one coherent full-charge→paid-trap→immediately-following-four-positive-hit
finisher cycle, plus three separate positive actor-scoped Fire batches/expiry.
Final8/8PASS,16rank proofs: every witness is in the first wave, zero prior waves.

Rank20 Master uses authored ActV enemies; its fourth cycle in that first wave
provides the complete witness. The original contaminated8/8, wave-separated
ActIII failure and ActV first-cycle miss failure remain retained. No combat,
cost, balance, enemy data or hidden-state workaround was introduced. Native
tests separately prove exact1000ms pulses and copied rank20 Warrior attacks;
public Warrior attack ranks are1 at both summon ranks.

[Combined evidence](../../docs/plans/evidence/d06-assassin-shadow-combined.md)
links exact receipts, attachments and archive/cleanup verification. Original
raw paths above are archive member locators; the raw task directory is removed.
