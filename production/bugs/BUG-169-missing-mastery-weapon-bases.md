# BUG-169 — Supply obtainable Spear and Throwing Mastery bases

Severity: High. Status: fixed locally; independent acceptance pending.
Owner: content-designer / engine-dev. Affected: item catalog, loot, mastery eligibility.
Build: `44477e9`; Node/Vitest, viewport/locale-independent data defect.
Browser acceptance target: Chromium en/zh-CN,360×640 and1280×800.

## Reproduction

1. Load the real item-base catalog and ordinary Act I treasure class.
2. Look for canonical spear/throwing weapon bases eligible at mastery unlock6.
3. Try to roll/materialize one through the real ordinary loot path (seeds1–1024).

Expected: at least one obtainable matching spear and throwing weapon.
Actual: zero catalog bases of either type, so no ordinary drop/equip path exists.
Evidence: `src/data/loaders/mastery-base-availability.test.ts`, frozen
`red-availability.log` (2RED/1classification control); raw root
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-remaining-masteries-i5r4g6lk`.
Root cause: weapon enum/skills were authored without matching bases/TC entries.
Workaround: none for these two weapon conditions; other weapons remain available.
Contract: `docs/plans/decisions/D05-remaining-weapon-masteries-v1.md`.

Final validation:11849PASS/469files+2existing skips; engine5840PASS,
types/standard lint/build pass, production browser4/4. Raw logs and diagnostic
inputs retained in [versioned evidence](../../docs/plans/evidence/d05-remaining-weapon-masteries.md);
the historical temporary root is removed after archive-byte verification.
