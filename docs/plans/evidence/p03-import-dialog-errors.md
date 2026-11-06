# P03/P16 — Recoverable save-import errors inside the dialog

Status: three defects fixed in retained uncommitted human2 worktree, based on
`b5a0898806bfba369a2d84a1b6c41d0bbb057fce`. No commit or publication.

[BUG653](../../../production/bugs/BUG-653-save-import-dialog-error.md) moves
rejected-import feedback into the active dialog; the exact backup remains for
retry. [BUG654](../../../production/bugs/BUG-654-save-import-failure-focus.md)
focuses that error after submission disables/blurs the button, restoring Escape
and keyboard recovery. [BUG655](../../../production/bugs/BUG-655-save-import-toast-overlap.md)
hides background notices during the dialog, clearing the mobile action buttons.
Native save validation, atomicity, schema, game engine and locale strings are
unchanged.

## Evidence

Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/p03-import-modal-error-v1`.
Exact four-file source hashes: `final-source.json`; before/after patches and
original bilingual RED reports remain retained. Final validation:

| Check | Result |
| --- | --- |
| Affected SettingsScreen import regressions | 31/31 pass; `final-green.json` |
| Real Chromium, en/zh-CN × desktop1280×800/mobile360×640 | 4/4 pass, 45.293 s; no skips/retries; `browser.json` |
| Scoped strict TypeScript | Exit 0; `types.log` |
| Explicit ESLint including otherwise ignored E2E source | Exit 0; `lint.log` |

Ordinary fresh-character controls, native invalid paste/file, exact backup retry,
AX-tree alert, focused error, Escape/reopen, valid file import, complete export/
stored-save identity and reload are exercised. Browser console/page errors are
empty; no horizontal overflow. Final desktop/en and mobile/zh-CN screenshots
were re-extracted from the final report and visually inspected: localized error
and both action buttons remain visible, without the prior toast overlap.

## Failed attempts and limits

Initial scoped types lacked Vite/test-bridge ambient definitions; the external
config was corrected. Initial lint ignored the E2E source; explicit no-ignore
lint passes. Initial browser launcher used the CJS Vite API and never reached a
case. Four paused-clock cases failed Escape; four cases with running timers and
fixed Date failed identically, establishing a real focus defect. The focus fix
passed all four. Screenshot review then found toast overlap; its regression RED
preceded the final guard. Original failures/traces and pre-toast screenshots
remain retained. Browser-tooling color/Browserslist notices are not browser
console errors. No installation or broad test suite was run for this slice.

The additional required sizes also pass as recorded below. These results do
not accept every F14/F15 case or G1/G5, nor the
full private v1. Intended five-act completions remain three. Martial tail-priority
diagnostic remains closed: controls match gameplay, zero candidate battles ran,
and the timestamp-equality failure establishes no gameplay correction. No
campaign admission, retry allowance, policy adoption or budget renewal follows.

## Retention and cleanup

`closure.json` confirms server closed, exact wrapper/runner PIDs absent and
isolated Vite cache/generated configs removed; exact config archives retained.
Root retains this packet, failures, source baselines/patches and final captures
through umbrella review and owns eventual cleanup. The human2 worktree stays
claimed for the active full-v1 goal; original checkout remains read-only.

## Required-size continuation — 2026-11-03

The exact same source/test hashes then pass six additional real Chromium cases:
en/zh-CN ×412×915,640×360 landscape,1920×1080. No production or test source
changed, so no unit/type/lint rerun was needed. The ordinary malformed paste/file,
retry, AX alert/focus, Escape, valid import, exact export/IDB conservation and
reload checks pass again. Six cases take59.883s with no skips/retries/flakes;
console/page-error arrays remain empty and horizontal overflow checks pass.

Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/p03-import-modal-required-sizes-v1`.
`browser.json`, `browser-launch.json`, `final-source.json`, `screenshots.json`
and `closure.json` retain exact reports/source/capture hashes and cleanup.
All six original PNGs were individually inspected. Portrait/desktop show the
complete error dialog. Landscape retains the bounded scrollable modal; initial
error focus leaves its header and part of the footer outside the scroll window.
Ordinary subsequent retry clicks and Escape complete without force/injected
scroll writes. This is evidence of reachable controls, not simultaneous display
of the entire form or a full touch/contrast/font/zoom accessibility signoff.

Together the two runs pass10/10 locale×required-size cases at one unchanged
production/test manifest. Only the six previously unchecked cases ran in this
continuation. Exact wrapper/runner PIDs2018632/2018655 are absent and server
closed; generated config/cache removed and config archive retained. Root owns
required evidence through umbrella review. No campaign or balance count changes.
