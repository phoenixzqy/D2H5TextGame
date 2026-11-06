# BUG-533 — Remove preparation loops from the zero-spend growth driver

Severity: Low. Status: diagnosed; failed source and check retained.
Owner: root (task-local training driver).

## Reproduction

Worktree `D2H5TextGame-human-worktree-2`, `feat/playable-foundations`,
HEAD `b5a0898806bfba369a2d84a1b6c41d0bbb057fce`, with existing dirty work.
Node24.21.0/TypeScript strict; viewport/locale/seed not applicable.
Packet `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.

1. Typecheck `paladin-rotation-tsconfig-v1.json`.
2. `p15-paladin-act2-earned-growth-v3.ts` asserts empty preparation arrays,
   then retains template loops that destructure entries from those arrays.

Expected: a typed driver for native growth with zero new preparation spending.
Actual: TS2488 at63/65: the proven-empty entries narrow to `never`.
Evidence: `p15-paladin-rotation-types-v1.log` and matching `-exit.json`.
No training or source mutation was executed.

Resolution: v4 removes those unused preparation loops and their helper imports.
It retains the explicit empty-array assertions, ordinary native growth/equipment
boundaries and all source/forecast/budget/accounting checks. The old source and
failed check remain intact; no assertion/type suppression or production change.
