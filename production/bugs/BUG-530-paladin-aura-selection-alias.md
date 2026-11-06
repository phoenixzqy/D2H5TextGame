# BUG-530 — Use canonical aura IDs in the Paladin continuation driver

Severity: Low. Status: diagnosed; failed task-local comparison retained.
Owner: root (QA driver). Native aura validation is correct.

## Reproduction

Worktree `D2H5TextGame-human-worktree-2`, branch `feat/playable-foundations`,
HEAD `b5a0898806bfba369a2d84a1b6c41d0bbb057fce` with existing dirty work.
Node24.21.0 / Vite SSR diagnostic; browser viewport and locale not applicable.
Packet `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.

1. Restore `p15-paladin-zeal-act2-initial-continuation-v1.json`,13/5838/next136.
2. Run `p15-paladin-zeal-act2-dry-freeze-forecast-v1.spec.json` with forecast v4.
3. Its projected18 candidate natively allocates one Holy Freeze point, then
   requests selection with `paladin.holy_freeze`.

Expected: select the canonical owned aura at its authored unlock.
Actual: `unsupported-aura`, exit1 before admission. Allocation aliases do not
expand the selection protocol: `src/engine/types/auras.ts` uses
`paladin.holy-freeze`. The shared legacy campaign profile type additionally
names only Might/Prayer; it is unsuitable for a full Paladin aura driver.

Evidence: packet `p15-paladin-act2-dry-freeze-forecast-run-v1.log`, matching
`-exit.json`, original spec and method binding. All projected state is restored;
no source XP, point, selection or other earned state changed. No combat seed
was admitted by this failed comparison.

Resolution: successor specs use the canonical selection ID and unlock18.
A task-local typed Paladin profile adapter uses `PlayerAuraId`, delegates
ordinary point/stat/order/equipment work to existing campaign helpers and
performs selection through the real native API. This preserves historical
campaign profile contracts and earlier passing evidence. No validation bypass,
production tuning or previous campaign replay is required.
