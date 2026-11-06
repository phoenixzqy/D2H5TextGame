# BUG-654 — Restore dialog focus after a rejected import

- **Status:** Fixed in retained uncommitted human2 worktree; base `b5a0898806bfba369a2d84a1b6c41d0bbb057fce`.
- **Severity:** Medium; pointer Cancel remains available, but Escape stops
  dismissing the import dialog after failure.
- **Owner / affected systems:** frontend-dev; save-import keyboard recovery.
- **Build:** `b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus retained uncommitted
  human2 source and the initial BUG653 in-dialog error correction.
- **Environment:** WSL/Linux, installed Node Playwright and Chromium;
  1280×800 desktop and 360×640 mobile, each in en and zh-CN.
- **Seed:** Not applicable; fresh characters created through ordinary controls.

## Reproduction

1. Create a character and open Settings → Import Save.
2. Select malformed JSON and press Import Save; after rejection, retry it.
3. Wait until Import is enabled again, then press Escape.

**Expected:** Failure feedback and keyboard focus remain inside the dialog;
Escape dismisses it once import has settled.

**Actual:** The alert is accessible and import has settled, but Escape leaves
the dialog open. This reproduces with a paused clock and with fixed Date values
while browser timers continue running; it is not resolved by changing the
test clock. The retained failure screenshots/traces show enabled controls.

## Evidence and diagnosis

`tests/e2e/save-management.spec.ts`, bilingual malformed-import cases, fail
`expect(dialog).toHaveCount(0)` after Escape on both viewports. Evidence packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/p03-import-modal-error-v1/`;
`browser-focus-loss.json`, `browser-focus-loss-output/` and original paused-clock
failures remain retained. All eight failures reach the in-dialog alert and save
conservation checks before failing dismissal.

Import disables the focused submit button. The button remains connected, so
FloatingFocusManager's disconnected-element restoration does not recover this
blur. Modal handles Escape on its overlay; keyboard events outside the modal
cannot reach it. The failure boundary should focus its error message after
rendering it, allowing keyboard retry/cancel and Escape within the modal.

**Workaround:** Click Cancel. Native save validation/atomicity remain intact.

## Resolution and verification

After failure renders, SaveImportDialog focuses its error paragraph. Keyboard events stay inside the modal, restoring ordinary Escape dismissal and retry/cancel access.

No new commit was created. Exact source hashes are in `final-source.json` in
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/p03-import-modal-error-v1`. Regression paths:
`src/features/settings/SettingsScreen.import.test.tsx` and
`tests/e2e/save-management.spec.ts`. Final results: 31/31 affected unit tests,
4/4 real Chromium cases (en/zh-CN × 1280×800/360×640), scoped strict types and
explicit lint pass. No browser skips/retries, console/page errors or horizontal
overflow. Exact complete exports/stored saves survive rejection, retry, valid
import and reload. Final desktop/mobile error screenshots were visually inspected;
both controls remain unobscured.

Original failure evidence remains: `focus-red.json; browser-focus-loss.json; browser-focus-loss-output/`. Final evidence:
`final-green.json`, `browser.json`, `browser-launch.json`, `types.log`,
`lint.log`, `desktop-en.png`, `mobile-zh-CN.png` and `closure.json`.
Temporary configs/caches removed after both exact owned processes exited; root
retains diagnostic evidence through umbrella review. This does not accept all
save, accessibility or full-v1 gates.

Required-size continuation: six more cases pass at412×915/640×360/1920×1080
in both locales, for10/10 total on the same source manifest. Six original new
screenshots inspected; landscape scroll/retry remains reachable. Evidence and
exact cleanup: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/p03-import-modal-required-sizes-v1/closure.json`.
