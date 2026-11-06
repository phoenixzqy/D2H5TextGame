# BUG-653 — Keep import failures inside the active save dialog

- **Status:** Fixed in retained uncommitted human2 worktree; base `b5a0898806bfba369a2d84a1b6c41d0bbb057fce`.
- **Severity:** Medium; the selected backup remains available, but validation
  feedback is outside the accessible modal.
- **Owner / affected systems:** frontend-dev; settings, save-import feedback,
  screen-reader accessibility. Native validation and persistence are unchanged.
- **Build:** `b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus retained uncommitted
  implementation in the claimed human2 worktree.
- **Environment:** WSL/Linux, installed Vitest/jsdom with the real React screen
  and modal; native import boundary rejects. Browser/viewport not exercised in
  this initial reproduction. Locales: en and zh-CN. RNG seed: not applicable.

## Reproduction

1. Open Settings → Import Save.
2. Paste or select a backup rejected by native validation.
3. Confirm import; inspect the still-open dialog for an accessible error.

**Expected:** A persistent localized alert inside the dialog explains failure;
the exact backup remains available for retry or replacement.

**Actual:** Settings catches rejection and renders a temporary toast outside
the dialog. No alert exists inside it. Modal focus management isolates the
background from assistive technology, so this placement does not provide
accessible failure feedback.

## Evidence and diagnosis

`src/features/settings/SettingsScreen.import.test.tsx`, test
`retains the selected backup and visible error when native validation rejects it`,
fails in both locales with `Unable to find role="alert"` scoped to the dialog.
Evidence: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/p03-import-modal-error-v1/red.json`.
`SettingsScreen.handleImport` catches rejection before `SaveImportDialog` can
present it; the dialog currently owns alerts only for file-read failures.

**Workaround:** Replace the backup and retry; this does not repair feedback
accessibility. Fix at the active dialog error boundary, retaining native save
validation/atomicity and exact backup text.

## Resolution and verification

SaveImportDialog now catches rejected imports and presents a persistent localized in-dialog alert while retaining the exact backup for retry. SettingsScreen lets rejection reach that boundary.

No new commit was created. Exact source hashes are in `final-source.json` in
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/p03-import-modal-error-v1`. Regression paths:
`src/features/settings/SettingsScreen.import.test.tsx` and
`tests/e2e/save-management.spec.ts`. Final results: 31/31 affected unit tests,
4/4 real Chromium cases (en/zh-CN × 1280×800/360×640), scoped strict types and
explicit lint pass. No browser skips/retries, console/page errors or horizontal
overflow. Exact complete exports/stored saves survive rejection, retry, valid
import and reload. Final desktop/mobile error screenshots were visually inspected;
both controls remain unobscured.

Original failure evidence remains: `red.json`. Final evidence:
`final-green.json`, `browser.json`, `browser-launch.json`, `types.log`,
`lint.log`, `desktop-en.png`, `mobile-zh-CN.png` and `closure.json`.
Temporary configs/caches removed after both exact owned processes exited; root
retains diagnostic evidence through umbrella review. This does not accept all
save, accessibility or full-v1 gates.

Required-size continuation: six more cases pass at412×915/640×360/1920×1080
in both locales, for10/10 total on the same source manifest. Six original new
screenshots inspected; landscape scroll/retry remains reachable. Evidence and
exact cleanup: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/p03-import-modal-required-sizes-v1/closure.json`.
