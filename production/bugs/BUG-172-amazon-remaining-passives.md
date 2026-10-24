# BUG-172 — Apply Avoid, Evade and Pierce at fresh combat composition

Severity: High. Status: fixed locally; independent acceptance pending.
Owner: engine-dev / frontend-dev / content-designer.
Reproduction build: `b5ce230`; Node/Vitest, seeds1–64. Production browser target:
Chromium en/zh-CN at1280×800 and360×640. Constructed L30 player; no earned actions.

## Reproduction

1. Compose an Amazon with rank1 or20 of Avoid, Evade or Pierce.
2. Compare fresh stats and real physical/cold direct hits against no allocation.
3. Open the corresponding skill details in either locale.

Expected: Avoid +1pp magical dodge/rank; Evade +0.5pp physical and magical dodge/rank;
Pierce +2% direct physical damage and +1% fresh Attack/rank. Both languages explain
these automatic effects, their caps and next-wave timing.
Actual: all three give no bonus. Prose promises ranged/movement/projectile mechanics
unsupported by authored tuning and current combat. Strict per-identity schema missing.

Evidence: `src/stores/amazon-remaining-passives.test.ts`,10causal failures on unchanged
runtime; `red-composition.log`. Schema/UI initial9fail/9controls; Pierce test prose
oracle corrected from percentage points to Attack percentages before final frozen RED.
Raw task root: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-amazon-passives-l3mdixt8`.
Root cause: existing Amazon passive consumer covers only Critical Strike/Penetrate/Dodge.
Workaround: other skills remain available; these allocations are ineffective.
Contract: `docs/plans/decisions/D05-amazon-remaining-passives-v1.md`.

Final verification:11876PASS/471files+two existing skips,611.55s; engine5849PASS,
focused85PASS; final types/standard lint/build and explicit browser-file lint pass.
Production en/zh×desktop/mobile4/4, four exact Continue pairs, no retries/errors.
[Final evidence](../../docs/plans/evidence/d05-amazon-remaining-passives.md).
