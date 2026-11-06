# BUG-655 — Hide background notices while the import dialog is open

- **Status:** Fixed in retained uncommitted human2 worktree; base `b5a0898806bfba369a2d84a1b6c41d0bbb057fce`.
- **Severity:** Medium; transient notice overlaps import-dialog controls.
- **Owner / affected systems:** frontend-dev; settings/import layout.
- **Build:** `b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus retained human2
  source, including the BUG653/654 error and focus corrections.
- **Environment:** WSL Chromium via installed Playwright, 360×640 zh-CN;
  desktop 1280×800 en also shows the background export notice.
- **Seed:** Not applicable.

## Reproduction

1. Export a save from Settings.
2. Immediately open Import Save and submit an invalid backup.
3. Inspect the active dialog before the export notice expires.

**Expected:** Active dialog controls remain unobscured; import feedback is
inside the dialog.

**Actual:** The previous `Save exported` notice floats over the bottom of the
mobile dialog, partly covering Cancel/Import. This occurs with browser timers
running and is visible in the passing native import screenshot; those checks
do not establish absence of temporary overlap.

## Evidence and diagnosis

`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/p03-import-modal-error-v1/pre-toast-mobile-zh-CN.png`
and `pre-toast-desktop-en.png`. Settings renders its background toast concurrently with
the import modal. Hide background notices while that modal owns feedback;
successful import already closes it before displaying its success notice.

**Workaround:** Wait for the notice to expire. No save corruption observed.

## Resolution and verification

SettingsScreen suppresses background notices while the import dialog is open. Success still closes the dialog before displaying its notice.

No new commit was created. Exact source hashes are in `final-source.json` in
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/p03-import-modal-error-v1`. Regression paths:
`src/features/settings/SettingsScreen.import.test.tsx` and
`tests/e2e/save-management.spec.ts`. Final results: 31/31 affected unit tests,
4/4 real Chromium cases (en/zh-CN × 1280×800/360×640), scoped strict types and
explicit lint pass. No browser skips/retries, console/page errors or horizontal
overflow. Exact complete exports/stored saves survive rejection, retry, valid
import and reload. Final desktop/mobile error screenshots were visually inspected;
both controls remain unobscured.

Original failure evidence remains: `toast-red.json; pre-toast-mobile-zh-CN.png; pre-toast-desktop-en.png`. Final evidence:
`final-green.json`, `browser.json`, `browser-launch.json`, `types.log`,
`lint.log`, `desktop-en.png`, `mobile-zh-CN.png` and `closure.json`.
Temporary configs/caches removed after both exact owned processes exited; root
retains diagnostic evidence through umbrella review. This does not accept all
save, accessibility or full-v1 gates.

Required-size continuation: six more cases pass at412×915/640×360/1920×1080
in both locales, for10/10 total on the same source manifest. Six original new
screenshots inspected; landscape scroll/retry remains reachable. Evidence and
exact cleanup: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/p03-import-modal-required-sizes-v1/closure.json`.
