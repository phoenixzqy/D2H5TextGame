# BUG-670 — Select the shipped Fire Bolt option in offline reward acceptance

- **Status:** Fixed and verified locally; uncommitted on retained HEAD `b5a0898`.
- **Severity:** Medium; blocks this verification path, with a known correction.
- **Owner / affected systems:** Root / QA, `tests/pwa/offline-rewards.spec.ts`.

## Reproduction

Build `b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus the current retained
worktree, Chromium desktop 1280×800, English, WSL. No combat seed applies:
the failure precedes every combat admission.

1. Run the new production offline reward case for desktop English.
2. Ordinarily create a Sorceress, hire the free Rogue, and learn Fire Bolt.
3. Configure slot 1 using `skills-sorceress-fire-bolt`.

**Expected:** choose the learned skill and continue to close/reopen acceptance.

**Actual:** selection waits until the 90-second test timeout. The real DOM option
is `sorceress.fire_bolt`; the tree node retains its authored ID. The current
governed active-skill projection deliberately uses canonical IDs. No production
skill defect, reward failure or campaign progress was observed.

## Evidence

Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/p17-integrated-rewards-v1`.
`browser-v1.json`, `browser-v1.log` and the retained trace/screenshot under
`playwright-output/` preserve the failure and actual option. An independent
temporary-runner mistake also concatenated two web servers through two-argument
`defineConfig`; its archived configuration and unexpected build hashes are
retained. The runner is corrected using one object with explicit overrides.

## Correction boundary

Change only the new test's selected option to the canonical runtime ID; retain
the authored tree-node ID. Bound selection failure promptly. Preserve the failed
launch and its zero admissions. Run the corrected affected case; no game source,
combat formula, saved campaign checkpoint or closed campaign budget changes.

## Verification

Canonical selection passes V2 desktop English and all four final V5 locale /
viewport cases. [Integrated evidence](../../docs/plans/evidence/p17-integrated-rewards.md)
retains the original failure and subsequent independent clock/toast defects.
Regression: `tests/pwa/offline-rewards.spec.ts`. No commit was created.
